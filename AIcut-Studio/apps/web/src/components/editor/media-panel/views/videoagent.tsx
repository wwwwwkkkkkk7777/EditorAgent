"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Scissors,
  Palette,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  FileVideo,
  Music,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import type {
  VideoAgentMode,
  VideoAgentModeConfig,
  InputField,
  EditPlan,
} from "@/lib/videoagent/modes";

// ============================================================================
// 模式配置
// ============================================================================

interface ModeUIConfig {
  id: VideoAgentMode;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
  description: string;
  allowedAgents: string[];
  requiredInputs: InputFieldConfig[];
  optionalInputs: InputFieldConfig[];
  examples: string[];
}

interface InputFieldConfig {
  name: string;
  label: string;
  type: "text" | "file" | "select" | "number" | "textarea";
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  fileTypes?: string[];
}

const MODES: ModeUIConfig[] = [
  {
    id: "understand",
    name: "理解模式",
    icon: Brain,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50",
    hoverBg: "hover:bg-blue-500/20",
    description: "视频问答、摘要提取、场景分析",
    allowedAgents: ["video_qa", "video_summarization", "video_captioning", "scene_detection"],
    requiredInputs: [
      {
        name: "videoSource",
        label: "视频来源",
        type: "select",
        required: true,
        options: [
          { value: "timeline", label: "当前时间轴" },
          { value: "file", label: "本地文件" },
        ],
        description: "选择要分析的视频",
      },
    ],
    optionalInputs: [
      {
        name: "question",
        label: "问题",
        type: "textarea",
        required: false,
        placeholder: "关于这个视频你想了解什么？",
        description: "视频问答时需要填写",
      },
      {
        name: "analysisType",
        label: "分析类型",
        type: "select",
        required: false,
        options: [
          { value: "summary", label: "内容摘要" },
          { value: "scene", label: "场景分割" },
          { value: "caption", label: "画面描述" },
        ],
      },
    ],
    examples: [
      "这个视频讲了什么？",
      "总结视频的要点",
      "识别场景变化",
    ],
  },
  {
    id: "edit",
    name: "剪辑模式",
    icon: Scissors,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/50",
    hoverBg: "hover:bg-green-500/20",
    description: "智能剪辑、节奏匹配、自动化编辑",
    allowedAgents: ["rhythm_editing", "smart_retrieval", "commentary_video", "video_overview"],
    requiredInputs: [
      {
        name: "editType",
        label: "剪辑类型",
        type: "select",
        required: true,
        options: [
          { value: "rhythm", label: "节奏剪辑（踩点）" },
          { value: "highlight", label: "精彩片段集锦" },
          { value: "commentary", label: "解说视频" },
          { value: "overview", label: "视频预览/概览" },
        ],
        description: "选择剪辑方式",
      },
      {
        name: "videoSource",
        label: "视频素材",
        type: "select",
        required: true,
        options: [
          { value: "timeline", label: "当前时间轴" },
          { value: "local", label: "本地素材库" },
        ],
      },
    ],
    optionalInputs: [
      {
        name: "bgmPath",
        label: "BGM 文件路径",
        type: "text",
        required: false,
        placeholder: "D:\\Music\\bgm.mp3",
        description: "节奏剪辑需要提供 BGM",
      },
      {
        name: "videoDir",
        label: "视频素材目录",
        type: "text",
        required: false,
        placeholder: "D:\\Videos\\素材库",
        description: "节奏剪辑的视频素材目录（留空则使用时间轴素材）",
      },
      {
        name: "script",
        label: "解说脚本",
        type: "textarea",
        required: false,
        placeholder: "输入解说文案...",
        description: "解说视频需要提供脚本",
      },
      {
        name: "targetDuration",
        label: "目标时长(秒)",
        type: "number",
        required: false,
        placeholder: "60",
      },
    ],
    examples: [
      "用 BGM 节奏自动剪辑",
      "生成 60 秒精彩集锦",
      "根据脚本配画面",
    ],
  },
  {
    id: "create",
    name: "创作模式",
    icon: Palette,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/50",
    hoverBg: "hover:bg-purple-500/20",
    description: "跨语言改编、音乐视频、创意内容",
    allowedAgents: ["cross_language_adaptation", "meme_video", "music_video", "voice_clone", "singing_synthesis"],
    requiredInputs: [
      {
        name: "createType",
        label: "创作类型",
        type: "select",
        required: true,
        options: [
          { value: "cross_language", label: "跨语言改编" },
          { value: "meme", label: "表情包视频" },
          { value: "music", label: "AI 音乐视频" },
          { value: "voice_clone", label: "语音克隆配音" },
        ],
        description: "选择创作方式",
      },
      {
        name: "sourceVideo",
        label: "源视频路径",
        type: "text",
        required: true,
        placeholder: "D:\\Videos\\source.mp4",
        description: "作为创作基础的视频",
      },
    ],
    optionalInputs: [
      {
        name: "targetLanguage",
        label: "目标语言",
        type: "select",
        required: false,
        options: [
          { value: "zh", label: "中文" },
          { value: "en", label: "英文" },
          { value: "ja", label: "日文" },
        ],
        description: "跨语言改编需要指定",
      },
      {
        name: "voiceSample",
        label: "声音样本路径",
        type: "text",
        required: false,
        placeholder: "D:\\Audio\\voice.mp3",
        description: "语音克隆的参考音频",
      },
      {
        name: "script",
        label: "创作脚本",
        type: "textarea",
        required: false,
        placeholder: "输入改编脚本或歌词...",
      },
    ],
    examples: [
      "把英文脱口秀改成中文相声",
      "制作表情包视频",
      "用 AI 声音重新配音",
    ],
  },
];

// ============================================================================
// 组件
// ============================================================================

interface ExecutionResult {
  status: "idle" | "running" | "success" | "error";
  message?: string;
  editPlan?: EditPlan;
  progress?: number;
}

export function VideoAgentView() {
  const [selectedMode, setSelectedMode] = useState<VideoAgentMode | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [execution, setExecution] = useState<ExecutionResult>({ status: "idle" });

  // 检查 VideoAgent 服务健康状态
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/api/videoagent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkHealth" }),
        });
        const data = await response.json();
        setIsHealthy(data.healthy === true);
      } catch {
        setIsHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // 获取当前模式配置
  const currentMode = MODES.find((m) => m.id === selectedMode);

  // 更新表单数据
  const updateField = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 校验表单
  const validateForm = (): { valid: boolean; errors: string[] } => {
    if (!currentMode) return { valid: false, errors: ["请选择模式"] };

    const errors: string[] = [];
    for (const field of currentMode.requiredInputs) {
      if (field.required && !formData[field.name]) {
        errors.push(`${field.label} 是必填项`);
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // 执行 VideoAgent
  const handleExecute = async () => {
    if (!currentMode) return;

    // 校验
    const validation = validateForm();
    if (!validation.valid) {
      toast.error("请填写必填项", {
        description: validation.errors.join("、"),
      });
      return;
    }

    // 如果服务未运行，提示使用模拟模式
    const useMockMode = !isHealthy;
    if (useMockMode) {
      toast.info("VideoAgent 服务未启动", {
        description: "将使用模拟模式演示功能",
      });
    }

    setExecution({ status: "running", message: "正在处理...", progress: 0 });

    try {
      const response = await fetch("/api/videoagent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "processWithMode",
          data: {
            mode: selectedMode,
            requirement: buildRequirement(),
            inputs: formData,
            context: { mock: useMockMode },
          },
        }),
      });

      const result = await response.json();
      console.log("[VideoAgent] API Response:", result);

      if (result.status === "error") {
        throw new Error(result.error || "处理失败");
      }

      // 如果有 AIcut 动作，执行它们
      const actions = result.aicutActions || [];
      
      if (actions.length > 0) {
        setExecution({
          status: "success",
          message: `处理完成！正在应用 ${actions.length} 个操作...`,
          editPlan: result.editPlan,
        });

        toast.success(`已生成 ${actions.length} 个编辑操作`, {
          description: "正在应用到时间轴...",
        });

        // 调用 chat-edit API 执行动作
        await applyActionsToTimeline(actions);
        
        setExecution({
          status: "success",
          message: `完成！已应用 ${actions.length} 个操作到时间轴`,
          editPlan: result.editPlan,
        });
      } else {
        // 没有动作时，可能是理解模式，只显示结果
        setExecution({
          status: "success",
          message: result.reasoning || "处理完成！（无需修改时间轴）",
          editPlan: result.editPlan,
        });
        
        if (result.reasoning) {
          toast.info("分析完成", {
            description: result.reasoning.substring(0, 100) + "...",
          });
        }
      }
    } catch (error: any) {
      console.error("[VideoAgent] Error:", error);
      setExecution({
        status: "error",
        message: error.message || "处理失败",
      });
      toast.error("执行失败", { description: error.message });
    }
  };

  // 构建需求描述
  const buildRequirement = (): string => {
    if (!currentMode) return "";

    const parts: string[] = [];
    
    // 根据模式和表单数据构建描述
    if (selectedMode === "understand") {
      if (formData.question) {
        parts.push(formData.question);
      } else if (formData.analysisType === "summary") {
        parts.push("请总结这个视频的内容");
      } else if (formData.analysisType === "scene") {
        parts.push("请分析视频的场景变化");
      } else {
        parts.push("请分析这个视频");
      }
    } else if (selectedMode === "edit") {
      if (formData.editType === "rhythm") {
        parts.push(`使用节奏剪辑${formData.bgmPath ? `，BGM: ${formData.bgmPath}` : ""}`);
      } else if (formData.editType === "highlight") {
        parts.push(`生成精彩片段集锦${formData.targetDuration ? `，目标时长 ${formData.targetDuration} 秒` : ""}`);
      } else if (formData.editType === "commentary") {
        parts.push(`制作解说视频${formData.script ? `，脚本: ${formData.script}` : ""}`);
      }
    } else if (selectedMode === "create") {
      if (formData.createType === "cross_language") {
        parts.push(`跨语言改编，目标语言: ${formData.targetLanguage || "中文"}`);
      } else if (formData.createType === "meme") {
        parts.push("制作表情包视频");
      } else if (formData.createType === "music") {
        parts.push("制作 AI 音乐视频");
      } else if (formData.createType === "voice_clone") {
        parts.push(`语音克隆配音${formData.voiceSample ? `，参考音频: ${formData.voiceSample}` : ""}`);
      }
    }

    return parts.join("，");
  };

  // 应用动作到时间轴
  const applyActionsToTimeline = async (actions: any[]) => {
    try {
      console.log("[VideoAgent] Applying actions to timeline:", actions);
      
      const response = await fetch("/api/chat-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directActions: actions,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("已应用到时间轴", {
          description: result.message,
        });
      } else {
        throw new Error(result.error || "应用失败");
      }
    } catch (error: any) {
      console.error("Failed to apply actions:", error);
      toast.error("应用到时间轴失败", {
        description: error.message,
      });
    }
  };

  // 重置表单
  const handleReset = () => {
    setFormData({});
    setExecution({ status: "idle" });
  };

  // 渲染输入字段
  const renderField = (field: InputFieldConfig) => {
    const value = formData[field.name] || "";

    return (
      <div key={field.name} className="space-y-1.5">
        <Label className="text-xs font-medium flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-red-400">*</span>}
        </Label>

        {field.type === "select" && field.options && (
          <Select value={value} onValueChange={(v) => updateField(field.name, v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={`选择${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === "text" && (
          <Input
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="h-8 text-xs"
          />
        )}

        {field.type === "number" && (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="h-8 text-xs"
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="text-xs min-h-[60px] resize-none"
          />
        )}

        {field.description && (
          <p className="text-[10px] text-muted-foreground">{field.description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* 头部状态 */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">VideoAgent</span>
          {isHealthy === null ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : isHealthy ? (
            <span className="flex items-center gap-1 text-[10px] text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              在线
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-yellow-400">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              模拟模式
            </span>
          )}
        </div>
        {selectedMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedMode(null);
              handleReset();
            }}
            className="h-6 text-[10px] px-2"
          >
            返回
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {/* 模式选择 */}
        {!selectedMode ? (
          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground mb-4">
              选择一个模式开始使用 VideoAgent 高级功能
            </p>

            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    setFormData({});
                  }}
                  className={`w-full p-4 rounded-lg border transition-all text-left ${mode.borderColor} ${mode.bgColor} ${mode.hoverBg} cursor-pointer`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${mode.bgColor}`}>
                      <Icon className={`w-5 h-5 ${mode.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm ${mode.color}`}>
                        {mode.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mode.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mode.examples.slice(0, 2).map((ex, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 bg-muted/50 rounded text-muted-foreground"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {!isHealthy && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-yellow-400 font-medium">模拟模式</p>
                    <p className="text-[10px] text-yellow-400/70 mt-0.5">
                      VideoAgent 服务未启动，将使用模拟数据演示功能
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 表单界面 */
          <div className="p-4 space-y-4">
            {currentMode && (
              <>
                {/* 模式标题 */}
                <div className={`flex items-center gap-2 pb-3 border-b ${currentMode.borderColor}`}>
                  <currentMode.icon className={`w-5 h-5 ${currentMode.color}`} />
                  <div>
                    <h3 className={`font-medium text-sm ${currentMode.color}`}>
                      {currentMode.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {currentMode.description}
                    </p>
                  </div>
                </div>

                {/* 必填字段 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    必填参数
                  </h4>
                  {currentMode.requiredInputs.map(renderField)}
                </div>

                {/* 可选字段 */}
                {currentMode.optionalInputs.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      可选参数
                    </h4>
                    {currentMode.optionalInputs.map(renderField)}
                  </div>
                )}

                {/* 执行状态 */}
                {execution.status !== "idle" && (
                  <div
                    className={`p-3 rounded-lg border ${
                      execution.status === "running"
                        ? "bg-blue-500/10 border-blue-500/30"
                        : execution.status === "success"
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {execution.status === "running" && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      )}
                      {execution.status === "success" && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                      {execution.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={`text-xs ${
                          execution.status === "running"
                            ? "text-blue-400"
                            : execution.status === "success"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {execution.message}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </ScrollArea>

      {/* 底部操作栏 */}
      {selectedMode && (
        <div className="p-4 border-t border-border/50 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={execution.status === "running"}
            className="flex-1 h-9"
          >
            重置
          </Button>
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={execution.status === "running"}
            className="flex-1 h-9 gap-1.5"
          >
            {execution.status === "running" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                {isHealthy ? "执行" : "模拟执行"}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
