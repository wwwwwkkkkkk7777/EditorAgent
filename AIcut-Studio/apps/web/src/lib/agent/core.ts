import OpenAI from "openai";
import dns from "dns";
import { 
  AGENT_BASE_PROMPT, 
  INTENT_ANALYSIS_PROMPT,
  THINKING_PROMPT, 
  PLANNING_PROMPT, 
  ACTION_GENERATION_PROMPT 
} from "./prompts";
import {
  VideoAgentMode,
  getModeConfig,
  detectMode,
  validateModeInputs,
  createEditPlan,
  convertEditPlanToActions,
  EditPlan,
} from "../videoagent/modes";
import fs from "fs";
import path from "path";

const WORKSPACE_ROOT = path.join(process.cwd(), "../../../");
const SNAPSHOT_FILE = path.join(WORKSPACE_ROOT, "ai_workspace/project-snapshot.json");

// Prefer IPv4 to avoid ECONNRESET on some IPv6 paths (e.g. DashScope)
dns.setDefaultResultOrder("ipv4first");

export interface AgentAction {
  action: string;
  data: any;
}

export interface AgentResponse {
  thinking: string;
  plan: string;
  actions: AgentAction[];
}

/** VideoAgent 模式配置 */
export interface VideoAgentModeOption {
  mode: VideoAgentMode;
  inputs?: Record<string, any>;
}

export class VideoEditorAgent {
  private client: OpenAI;
  private model: string;
  private videoAgentMode: VideoAgentMode | null;

  constructor(videoAgentMode?: VideoAgentMode) {
    this.videoAgentMode = videoAgentMode || null;
    const groqKey = process.env.GROQ_API_KEY;
    const dashscopeKey = process.env.DASHSCOPE_API_KEY;
    const siliconKey = process.env.SILICONFLOW_API_KEY;

    if (groqKey && groqKey !== "" && groqKey !== "your_key_here") {
      console.log("[Agent] Using Groq Provider");
      this.client = new OpenAI({
        apiKey: groqKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
      this.model = "llama-3.3-70b-versatile";
    } else if (dashscopeKey && dashscopeKey !== "") {
      console.log("[Agent] Using DashScope Provider");
      this.client = new OpenAI({
        apiKey: dashscopeKey,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      });
      this.model = "qwen-plus";
    } else if (siliconKey && siliconKey !== "") {
      console.log("[Agent] Using SiliconFlow Provider");
      this.client = new OpenAI({
        apiKey: siliconKey,
        baseURL: "https://api.siliconflow.cn/v1",
      });
      this.model = "meta-llama/Llama-3.3-70B-Instruct";
    } else {
      this.client = new OpenAI({
        apiKey: groqKey || "missing_key",
        baseURL: "https://api.groq.com/openai/v1",
      });
      this.model = "llama-3.3-70b-versatile";
    }
  }

  private getSnapshotContext() {
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf-8"));
        // 简化快照以节省 Token
        const context = {
          projectName: snapshot.project?.name,
          tracks: snapshot.tracks?.map((t: any) => ({
            id: t.id,
            name: t.name,
            type: t.type,
            elements: t.elements?.map((e: any) => ({
              id: e.id,
              name: e.name,
              type: e.type,
              startTime: e.startTime,
              duration: e.duration
            }))
          })),
          assets: snapshot.assets?.map((a: any) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            duration: a.duration
          }))
        };
        return JSON.stringify(context, null, 2);
      }
    } catch (e) {
      console.error("Failed to read snapshot for agent context", e);
    }
    return "{}";
  }

  /**
   * 检测是否需要 VideoAgent 高级功能（根据关键词）
   * @deprecated 使用 detectMode 代替，它会返回具体的模式
   */
  private detectVideoAgentIntent(message: string): boolean {
    // 使用 modes.ts 中的 detectMode
    return detectMode(message) !== null;
  }

  /**
   * 根据消息内容自动检测 VideoAgent 模式
   */
  private autoDetectMode(message: string): VideoAgentMode | null {
    return detectMode(message);
  }

  /**
   * 调用 VideoAgent 处理复杂需求（模式化版本）
   */
  private async *processWithVideoAgent(
    userMessage: string, 
    snapshotContext: string,
    mode: VideoAgentMode
  ) {
    const modeConfig = getModeConfig(mode);
    yield { 
      type: "phase", 
      content: `${modeConfig.icon} 正在调用 VideoAgent ${modeConfig.name}...` 
    };

    try {
      // 调用 VideoAgent API，传入模式约束
      const response = await fetch("http://localhost:3000/api/videoagent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "processWithMode",
          data: {
            mode,
            requirement: userMessage,
            inputs: {
              videoSource: "timeline", // 默认使用时间轴
            },
            context: { 
              snapshot: snapshotContext,
              allowedAgents: modeConfig.allowedAgents,
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`VideoAgent API 返回错误: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "error") {
        throw new Error(result.error || "VideoAgent 处理失败");
      }

      // 显示 VideoAgent 的分析结果
      if (result.reasoning) {
        yield { 
          type: "thinking", 
          content: `**${modeConfig.icon} ${modeConfig.name} 分析**\n\n${result.reasoning}` 
        };
      }

      // 显示执行计划
      if (result.agent_chain && result.agent_chain.length > 0) {
        const planText = `**VideoAgent 工作流**\n\n模式: ${modeConfig.name}\n允许的 Agents: ${modeConfig.allowedAgents.join(", ")}\n\n${result.agent_chain.map((agent: string, i: number) => `${i + 1}. ${agent}`).join('\n')}`;
        yield { type: "plan", content: planText };
      }

      // 将 VideoAgent 的 EditPlan 转换为 AIcut 动作
      let actions: AgentAction[] = [];
      if (result.editPlan) {
        actions = convertEditPlanToActions(result.editPlan);
        yield { type: "editPlan", content: result.editPlan };
      } else {
        // 兼容旧版本的结果格式
        actions = this.convertVideoAgentToActions(result);
      }
      
      yield { type: "actions", content: actions };

    } catch (error: any) {
      console.error("[Agent] VideoAgent error:", error);
      yield { 
        type: "thinking", 
        content: `⚠️ VideoAgent ${modeConfig.name} 调用失败: ${error.message}\n\n将使用基础模式处理...` 
      };
      // 失败后回退到基础模式
      return null;
    }
  }

  /**
   * 将 VideoAgent 结果转换为 AIcut 动作
   */
  private convertVideoAgentToActions(result: any): AgentAction[] {
    const actions: AgentAction[] = [];
    
    // 如果 VideoAgent 生成了视频文件
    if (result.result?.video_path) {
      actions.push({
        action: "importMedia",
        data: {
          filePath: result.result.video_path,
          name: "VideoAgent 生成",
          startTime: 0
        }
      });
    }

    // 如果 VideoAgent 生成了音频文件
    if (result.result?.audio_path) {
      actions.push({
        action: "importAudio",
        data: {
          filePath: result.result.audio_path,
          name: "VideoAgent 音频",
          startTime: 0
        }
      });
    }

    // 如果没有具体的文件输出，返回一个提示动作
    if (actions.length === 0 && result.agent_chain) {
      // VideoAgent 已经完成处理，但可能需要用户手动操作
      // 这里可以添加一些提示信息
    }
    
    return actions;
  }

  /**
   * ReAct 风格的流式执行：
   * 1. 意图分析 - 判断是否需要工具
   * 2. 检测是否需要 VideoAgent（根据模式或关键词）
   * 3. 思考 - 分析问题
   * 4. 规划 - 制定步骤
   * 5. 执行 - 生成动作序列
   */
  async *processStream(userMessage: string) {
    const snapshotContext = this.getSnapshotContext();
    const projectState = `当前项目状态:\n${snapshotContext}\n\n用户指令: ${userMessage}`;

    // Phase 0: Intent Analysis - 判断是否需要工具
    console.log("[Agent] Phase 0: Intent Analysis");
    yield { type: "phase", content: "正在分析意图..." };

    const intentResponse = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: INTENT_ANALYSIS_PROMPT },
        { role: "user", content: projectState },
      ],
      temperature: 0.1,
    });

    let intentAnalysis: any = { needsTools: true, reasoning: "默认需要工具", category: "edit" };
    try {
      const intentText = intentResponse.choices[0].message.content || "{}";
      const jsonMatch = intentText.match(/\{[\s\S]*\}/);
      intentAnalysis = JSON.parse(jsonMatch ? jsonMatch[0] : intentText);
      console.log("[Agent] Intent Analysis:", intentAnalysis);
    } catch (e) {
      console.error("Failed to parse intent analysis", e);
    }

    // VideoAgent 调用已禁用 - 只使用基础模式
    // 检查是否有明确指定的 VideoAgent 模式
    if (this.videoAgentMode) {
      console.log(`[Agent] VideoAgent mode specified but disabled, using basic mode instead`);
    }
    
    // 自动检测也已禁用
    // const detectedMode = this.autoDetectMode(userMessage);
    // if (detectedMode) { ... }

    // 如果不需要工具，直接回答
    if (!intentAnalysis.needsTools) {
      console.log("[Agent] No tools needed, direct answer");
      yield { type: "phase", content: "正在生成回答..." };
      
      const answerStream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: AGENT_BASE_PROMPT + "\n\n你现在需要直接回答用户的问题，不需要调用任何工具。" },
          { role: "user", content: userMessage },
        ],
        stream: true,
        temperature: 0.7,
      });

      let answer = "";
      for await (const chunk of answerStream) {
        const char = chunk.choices[0]?.delta?.content || "";
        answer += char;
        yield { type: "answer", content: answer };
      }

      yield { type: "actions", content: [] };
      return;
    }

    // Phase 1: Thinking Phase - 深度思考
    console.log("[Agent] Phase 1: Thinking");
    yield { type: "phase", content: "正在深度思考..." };
    
    let thinking = "";
    const thinkStream = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: THINKING_PROMPT },
        { role: "user", content: projectState },
      ],
      stream: true,
      temperature: 0.2,
    });

    for await (const chunk of thinkStream) {
      const char = chunk.choices[0]?.delta?.content || "";
      thinking += char;
      yield { type: "thinking", content: thinking };
    }

    // Phase 2: Planning Phase - 制定计划
    console.log("[Agent] Phase 2: Planning");
    yield { type: "phase", content: "正在制定执行计划..." };
    
    let plan = "";
    const planStream = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: PLANNING_PROMPT },
        { role: "user", content: projectState },
        { role: "assistant", content: `思考结果：\n${thinking}` },
      ],
      stream: true,
      temperature: 0.1,
    });

    for await (const chunk of planStream) {
      const char = chunk.choices[0]?.delta?.content || "";
      plan += char;
      yield { type: "plan", content: plan };
    }

    // Phase 3: Action Generation - 生成动作
    console.log("[Agent] Phase 3: Action Generation");
    yield { type: "phase", content: "正在生成执行动作..." };
    
    const actionResponse = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: ACTION_GENERATION_PROMPT },
        { role: "user", content: projectState },
        { role: "assistant", content: `思考：${thinking}\n\n规划：${plan}` },
      ],
      temperature: 0,
      response_format: this.model.includes("qwen") ? undefined : { type: "json_object" },
    });

    try {
      const actionText = actionResponse.choices[0].message.content || "[]";
      console.log("[Agent] Raw action response:", actionText);
      
      // 容错处理：有时模型会返回包含在 markdown 代码块里的 JSON
      const jsonMatch = actionText.match(/\[[\s\S]*\]/);
      const actions = JSON.parse(jsonMatch ? jsonMatch[0] : actionText) as AgentAction[];
      
      console.log("[Agent] Parsed actions:", actions);
      yield { type: "actions", content: actions };
    } catch (e) {
      console.error("Failed to parse actions JSON", e);
      yield { type: "actions", content: [] };
    }
  }
}
