import OpenAI from "openai";
import { 
  AGENT_BASE_PROMPT, 
  INTENT_ANALYSIS_PROMPT,
  THINKING_PROMPT, 
  PLANNING_PROMPT, 
  ACTION_GENERATION_PROMPT 
} from "./prompts";
import fs from "fs";
import path from "path";

const WORKSPACE_ROOT = path.join(process.cwd(), "../../../");
const SNAPSHOT_FILE = path.join(WORKSPACE_ROOT, "ai_workspace/project-snapshot.json");

export interface AgentAction {
  action: string;
  data: any;
}

export interface AgentResponse {
  thinking: string;
  plan: string;
  actions: AgentAction[];
}

export class VideoEditorAgent {
  private client: OpenAI;
  private model: string;

  constructor() {
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
   * ReAct 风格的流式执行：
   * 1. 意图分析 - 判断是否需要工具
   * 2. 思考 - 分析问题
   * 3. 规划 - 制定步骤
   * 4. 执行 - 生成动作序列
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
