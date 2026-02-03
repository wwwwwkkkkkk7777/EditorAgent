"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { fonts } from "@/lib/font-config";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  FileVideo, 
  FolderOpen, 
  Loader2, 
  Music, 
  Play, 
  Settings, 
  Sparkles,
  Wand2,
  Search,
  Video,
  Mic,
  Film,
  XCircle,
  Clock,
  MessageSquare,
  Users,
  FileAudio,
  BrainCircuit
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";

// 智能剪辑模式定义
interface SmartEditMode {
  id: string;
  mode?: "edit" | "create" | "understand";
  category: "cut" | "gen" | "creative"; // Added category
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  workflowSteps: string[];
  requiredFields: {
    name: string;
    label: string;
    type: "file" | "folder" | "text";
    accept?: string;
    placeholder?: string;
    required: boolean;
  }[];
}

const SMART_EDIT_MODES: SmartEditMode[] = [
  {
    id: "rhythm",
    mode: "edit",
    category: "cut",
    name: "Rhythm Cut",
    description: "Automatically sync video clips to the beat of your music.",
    icon: <Music className="h-6 w-6" />,
    color: "text-pink-500",
    gradient: "from-pink-500/10 to-rose-500/10",
    workflowSteps: [
      "RhythmDetector - Music Analysis",
      "RhythmContentGenerator - Scene Generation",
      "VideoPreloader - Asset Preprocessing",
      "VideoSearcher - Clip Matching",
      "VideoEditor - Final Assembly"
    ],
    requiredFields: [
      { name: "bgmPath", label: "Music File", type: "file", accept: ".mp3,.wav,.flac", required: true },
      { name: "videoDir", label: "Video Source Directory", type: "folder", placeholder: "/Videos/Source", required: true },
    ]
  },
  {
    id: "smart",
    mode: "edit",
    category: "cut",
    name: "Semantic Cut",
    description: "Search and edit clips based on semantic understanding.",
    icon: <Search className="h-6 w-6" />,
    color: "text-blue-500",
    gradient: "from-blue-500/10 to-cyan-500/10",
    workflowSteps: [
      "VideoPreloader - Asset Preprocessing",
      "VideoSummarizationGenerator - Content Analysis",
      "VideoSearcher - Semantic Matching",
      "VideoEditor - Final Assembly"
    ],
    requiredFields: [
      { name: "videoDir", label: "Video Source Directory", type: "folder", placeholder: "/Videos/Source", required: true },
    ]
  },
  {
    id: "commentary",
    mode: "edit",
    category: "gen",
    name: "Commentary Video",
    description: "Generate video from text/novel script with AI narration.",
    icon: <Mic className="h-6 w-6" />,
    color: "text-emerald-500",
    gradient: "from-emerald-500/10 to-teal-500/10",
    workflowSteps: [
      "CommentaryContentGenerator - Script Analysis",
      "VoiceGenerator - TTS Generation",
      "VideoSearcher - Visual Matching",
      "VideoEditor - Final Assembly"
    ],
    requiredFields: [
      { name: "scriptPath", label: "Script File (TXT/MD)", type: "file", accept: ".txt,.md", required: true },
      { name: "videoDir", label: "Video Source Directory", type: "folder", placeholder: "/Videos/Source", required: true },
      { name: "requirement", label: "Specific Requirements", type: "text", placeholder: "e.g., A 3-minute summary video...", required: false },
    ]
  },
  {
    id: "news",
    mode: "edit",
    category: "gen",
    name: "Auto News",
    description: "Generate news reports from text articles with AI anchor voice.",
    icon: <FileAudio className="h-6 w-6" />,
    color: "text-orange-500",
    gradient: "from-orange-500/10 to-amber-500/10",
    workflowSteps: [
      "NewsContentGenerator - News Scripting",
      "VoiceGenerator - Anchor Narration",
      "VideoSearcher - Visual Matching",
      "VideoEditor - Final Broadcasting"
    ],
    requiredFields: [
      { name: "scriptPath", label: "News Text/Script", type: "file", accept: ".txt", required: true },
      { name: "videoDir", label: "News Footage Directory", type: "folder", placeholder: "/Videos/NewsSource", required: true },
    ]
  },
  {
    id: "cross_talk",
    mode: "create",
    category: "creative",
    name: "Cross Talk",
    description: "Convert English Stand-up Comedy to Chinese Crosstalk style.",
    icon: <Users className="h-6 w-6" />,
    color: "text-red-500",
    gradient: "from-red-500/10 to-rose-500/10",
    workflowSteps: [
      "CrossTalkAdapter - Style Adaptation",
      "CrossTalkSynth - Audio Synthesis",
      "CrossTalkConversion - Visual Generation",
      "VideoConversion - Final Rendering"
    ],
    requiredFields: [
      { name: "sourceVideo", label: "English Stand-up Video", type: "file", accept: ".mp4,.mkv", required: true },
    ]
  },
  {
    id: "talk_show",
    mode: "create",
    category: "creative",
    name: "Talk Show",
    description: "Convert Chinese Crosstalk to English Stand-up Comedy style.",
    icon: <MessageSquare className="h-6 w-6" />,
    color: "text-violet-500",
    gradient: "from-violet-500/10 to-purple-500/10",
    workflowSteps: [
      "StandUpAdapter - Style Adaptation",
      "StandUpSynth - Audio Synthesis",
      "StandUpConversion - Visual Generation",
      "VideoConversion - Final Rendering"
    ],
    requiredFields: [
      { name: "sourceVideo", label: "Chinese Crosstalk Video", type: "file", accept: ".mp4,.mkv", required: true },
    ]
  },
  {
    id: "mad_tts",
    mode: "create",
    category: "creative",
    name: "MAD TTS",
    description: "Create meme videos with character voice (Xiao-Ming-Jian-Mo).",
    icon: <BrainCircuit className="h-6 w-6" />,
    color: "text-yellow-500",
    gradient: "from-yellow-500/10 to-orange-500/10",
    workflowSteps: [
      "AudioExtractor - Audio Analysis",
      "TTSSlicer - Audio Slicing",
      "Transcriber - Speech Recognition",
      "TTSWriter - Script Adaptation",
      "TTSInfer - Voice Synthesis",
      "TTSReplace - Audio Replacement"
    ],
    requiredFields: [
      { name: "sourceVideo", label: "Source Video", type: "file", accept: ".mp4", required: true },
      { name: "voiceSample", label: "Target Voice Sample", type: "file", accept: ".wav,.mp3", required: true },
    ]
  },
  {
    id: "mad_svc",
    mode: "create",
    category: "creative",
    name: "MAD SVC",
    description: "Generate AI music videos with Singing Voice Conversion.",
    icon: <Music className="h-6 w-6" />,
    color: "text-cyan-500",
    gradient: "from-cyan-500/10 to-sky-500/10",
    workflowSteps: [
      "SVCAdapter - Voice Conversion",
      "SVCAnalyzer - Audio Analysis",
      "SVCSingle - Vocal Extraction",
      "SVCCoverist - Cover Generation",
      "SVCConversion - Visual Effects",
      "VideoConversion - Rendering",
      "Mixer - Final Mixing"
    ],
    requiredFields: [
      { name: "sourceVideo", label: "Music Video", type: "file", accept: ".mp4", required: true },
    ]
  }
];

// 处理步骤状态
interface ProcessingStep {
  name: string;
  status: "pending" | "running" | "completed" | "error";
  progress?: number;
  message?: string;
  startTime?: number;
  endTime?: number;
}

export default function SmartEditPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<"select" | "config" | "processing" | "complete">("select");
  const [selectedMode, setSelectedMode] = useState<SmartEditMode | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | "cut" | "gen" | "creative">("all");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultProjectId, setResultProjectId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 选择模式
  const handleSelectMode = (mode: SmartEditMode) => {
    setSelectedMode(mode);
    setFormData({});
    setCurrentStep("config");
  };

  // 返回选择页面
  const handleBack = () => {
    if (currentStep === "config") {
      setCurrentStep("select");
      setSelectedMode(null);
    }
  };

  // 处理文件选择
  const handleFileSelect = useCallback(async (fieldName: string, type: "file" | "folder") => {
    try {
      // 使用 File System Access API
      if (type === "folder") {
        // @ts-ignore - showDirectoryPicker is not in TS types yet
        if (window.showDirectoryPicker) {
          // @ts-ignore
          const dirHandle = await window.showDirectoryPicker();
          // 由于浏览器限制，我们只能获取目录名，需要用户手动输入完整路径
          setFormData(prev => ({ ...prev, [fieldName]: dirHandle.name }));
        } else {
          // 回退到手动输入
          alert("浏览器不支持目录选择，请手动输入路径");
        }
      } else {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = selectedMode?.requiredFields.find(f => f.name === fieldName)?.accept || "";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            // 对于本地文件，我们需要知道完整路径
            // 但浏览器出于安全原因不提供完整路径
            // 这里我们使用文件名，实际使用时需要通过 API 处理
            setFormData(prev => ({ ...prev, [fieldName]: file.name, [`${fieldName}_file`]: URL.createObjectURL(file) }));
          }
        };
        input.click();
      }
    } catch (err) {
      console.error("File selection error:", err);
    }
  }, [selectedMode]);

  // 开始处理
  const handleStartProcessing = async () => {
    if (!selectedMode) return;

    // 验证必填字段
    const missingFields = selectedMode.requiredFields
      .filter(f => f.required && !formData[f.name])
      .map(f => f.label);
    
    if (missingFields.length > 0) {
      setError(`请填写以下必填项: ${missingFields.join(", ")}`);
      return;
    }

    setError(null);
    setCurrentStep("processing");
    
    // 初始化处理步骤
    const steps: ProcessingStep[] = selectedMode.workflowSteps.map(name => ({
      name,
      status: "pending"
    }));
    setProcessingSteps(steps);
    setOverallProgress(0);

    // 创建 AbortController
    abortControllerRef.current = new AbortController();

    try {
      // 调用 VideoAgent 流式 API
      const response = await fetch("/api/videoagent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: selectedMode.mode || "edit",
          subType: selectedMode.id,
          inputs: {
            editType: selectedMode.id,
            createType: selectedMode.id, // For create mode
            videoSource: "local",
            ...formData,
          },
          requirement: `使用 ${selectedMode.name} 模式处理视频`
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // 解析 SSE 格式的数据
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("[SmartEdit] SSE event:", data);
              
              if (data.type === "workflow_start") {
                console.log(`[SmartEdit] Workflow started: ${data.workflow.join(" → ")}`);
              } else if (data.type === "heartbeat") {
                // 心跳事件 - 保持连接活跃，更新进度提示
                console.log(`[SmartEdit] Heartbeat: ${data.message}`);
                setProcessingSteps(prev => prev.map((s, i) => 
                  i === data.stepIndex || s.name.includes(data.tool?.split(" ")[0] || "")
                    ? { ...s, message: data.message }
                    : s
                ));
              } else if (data.type === "step_start") {
                setProcessingSteps(prev => prev.map((s, i) => 
                  i === data.stepIndex || s.name.includes(data.tool.split(" ")[0])
                    ? { ...s, status: "running", startTime: Date.now() }
                    : s
                ));
              } else if (data.type === "step_complete") {
                setProcessingSteps(prev => {
                  const updated = prev.map((s, i) => 
                    i === data.stepIndex || s.name.includes(data.tool.split(" ")[0])
                      ? { ...s, status: "completed" as const, endTime: Date.now() }
                      : s
                  );
                  const completed = updated.filter(s => s.status === "completed").length;
                  setOverallProgress((completed / updated.length) * 100);
                  return updated;
                });
              } else if (data.type === "step_error") {
                setProcessingSteps(prev => prev.map((s, i) => 
                  i === data.stepIndex || s.name.includes(data.tool.split(" ")[0])
                    ? { ...s, status: "error", message: data.error }
                    : s
                ));
              } else if (data.type === "complete") {
                setOverallProgress(100);
                setProcessingSteps(prev => prev.map(s => 
                  s.status === "pending" || s.status === "running" 
                    ? { ...s, status: "completed" as const } 
                    : s
                ));
                if (data.projectId) {
                  setResultProjectId(data.projectId);
                }
                setCurrentStep("complete");
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e: any) {
              if (e.message && !e.message.includes("JSON")) {
                throw e;
              }
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }

      // 如果没有收到 complete 事件，手动完成
      if (currentStep === "processing") {
        setProcessingSteps(prev => prev.map(s => ({ ...s, status: "completed" as const })));
        setOverallProgress(100);
        setCurrentStep("complete");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Processing cancelled");
        setCurrentStep("config");
      } else {
        console.error("Processing error:", err);
        setError(err.message || "处理过程中发生错误");
        setProcessingSteps(prev => {
          const runningIdx = prev.findIndex(s => s.status === "running");
          if (runningIdx >= 0) {
            return prev.map((s, i) => i === runningIdx ? { ...s, status: "error" as const, message: err.message } : s);
          }
          return prev;
        });
      }
    }
  };

  // 取消处理
  const handleCancelProcessing = () => {
    abortControllerRef.current?.abort();
    setCurrentStep("config");
  };

  // 进入编辑器
  const handleEnterEditor = () => {
    if (resultProjectId) {
      router.push(`/editor/${resultProjectId}`);
    } else {
      router.push("/projects");
    }
  };

  return (
    <div className={cn("min-h-screen flex flex-col bg-background selection:bg-white/30", fonts.outfit.className)}>
      <Header />
      
      <main className="relative flex-1 container max-w-6xl mx-auto px-4 py-12">
         {/* Background Effect */}
        <div className="fixed inset-0 -z-50 h-full w-full bg-background isolate">
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
        </div>

        {/* 面包屑导航 */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-neutral-500 hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* 页面标题 */}
        <div className="mb-12 text-center">
          <h1 className={cn("text-4xl md:text-5xl font-bold flex items-center justify-center gap-4 mb-4", fonts.spaceGrotesk.className)}>
            <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <Wand2 className="h-8 w-8 text-neutral-900 dark:text-neutral-100" />
            </div>
            Smart Edit
          </h1>
          <p className="text-lg text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Select a specialized AI workflow, configure your inputs, and let the agent handle the heavy lifting.
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-16">
          <div className="flex items-center justify-center w-full max-w-3xl mx-auto">
            {[
              { step: "select", label: "Select Mode" },
              { step: "config", label: "Configure" },
              { step: "processing", label: "Processing" },
              { step: "complete", label: "Done" }
            ].map((item, idx, arr) => {
              const isActive = currentStep === item.step;
              const stepIndex = arr.findIndex(i => i.step === item.step);
              const currentIndex = arr.findIndex(i => i.step === currentStep);
              const isCompleted = currentIndex > stepIndex;
              const isLast = idx === arr.length - 1;

              return (
                <div key={item.step} className="flex items-center flex-1 last:flex-none">
                  <div className="relative flex flex-col items-center group">
                    <motion.div
                      animate={{
                        backgroundColor: isActive 
                            ? "var(--foreground)" 
                            : isCompleted 
                                ? "var(--foreground)" 
                                : "var(--muted)",
                        scale: isActive ? 1.1 : 1,
                        borderColor: isActive 
                            ? "var(--foreground)" 
                            : isCompleted 
                                ? "var(--foreground)" 
                                : "transparent",
                      }}
                      className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors duration-300 border-2",
                          !isActive && !isCompleted ? "bg-neutral-200 dark:bg-neutral-800 border-transparent" : "text-background"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-background" />
                      ) : (
                        <span className={cn(
                            "text-xs font-bold font-mono",
                            isActive || isCompleted ? "text-background" : "text-muted-foreground"
                        )}>
                            {idx + 1}
                        </span>
                      )}
                    </motion.div>
                    
                    <div className={cn(
                        "absolute top-10 whitespace-nowrap text-xs font-medium transition-colors duration-300",
                        isActive ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {item.label}
                    </div>
                  </div>
                  
                  {!isLast && (
                    <div className="flex-1 h-[2px] mx-4 bg-neutral-200 dark:bg-neutral-800 relative">
                        <motion.div 
                            className="absolute left-0 top-0 bottom-0 bg-foreground"
                            initial={{ width: "0%" }}
                            animate={{ width: isCompleted ? "100%" : "0%" }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>
                  )}
                </div>
            )})}
          </div>
        </div>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3"
            >
              <XCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto"
                onClick={() => setError(null)}
              >
                关闭
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 步骤内容 */}
        <AnimatePresence mode="wait">
          {/* 步骤 1: 选择模式 */}
          {currentStep === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Category Tabs */}
              <div className="flex justify-center mb-10">
                  <div className="bg-neutral-100/80 dark:bg-neutral-900/80 p-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 inline-flex relative backdrop-blur-md shadow-sm">
                      {[
                          { id: "all", label: "All Modes" },
                          { id: "cut", label: "Smart Cut" },
                          { id: "gen", label: "Generation" },
                          { id: "creative", label: "Creative Remix" },
                      ].map((cat) => {
                          const isActive = activeCategory === cat.id;
                          return (
                          <button
                              key={cat.id}
                              onClick={() => setActiveCategory(cat.id as any)}
                              className={cn(
                                  "relative px-6 py-2 rounded-full text-sm font-medium transition-colors duration-300 z-10",
                                  isActive 
                                    ? "text-neutral-900 dark:text-neutral-100" 
                                    : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                              )}
                          >
                              {isActive && (
                                <motion.div
                                  layoutId="activeTab"
                                  className="absolute inset-0 bg-white dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-700/50 rounded-full shadow-sm -z-10"
                                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                              )}
                              {cat.label}
                          </button>
                      )})}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {SMART_EDIT_MODES.filter(m => activeCategory === "all" || m.category === activeCategory).map((mode) => (
                    <motion.div
                    key={mode.id}
                    layout // Enable layout animation for reordering
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    className="group relative cursor-pointer h-full"
                    onClick={() => handleSelectMode(mode)}
                    >
                    {/* Shadow effect on select/hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                    
                    {/* Dynamic Gradient Glow Background on Hover (Ascendflow Style) */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl overflow-hidden">
                        <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] -translate-y-1/2 translate-x-1/2 opacity-20", mode.color.replace("text-", "bg-"))} />
                        <div className={cn("absolute bottom-0 left-0 w-32 h-32 blur-[60px] translate-y-1/2 -translate-x-1/2 opacity-20", mode.color.replace("text-", "bg-"))} />
                    </div>

                    <div className="relative h-full flex flex-col bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 transition-all duration-300 group-hover:border-neutral-400 dark:group-hover:border-neutral-600 group-hover:shadow-lg">
                        
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "p-2.5 rounded-xl transition-all duration-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100", 
                                "group-hover:scale-110", // Ascendflow-like icon pop
                                mode.color.replace('text-', 'text-opacity-80 text-')
                            )}>
                                {mode.icon}
                            </div>
                            
                            {/* Sliding Arrow Animation */}
                            <div className="overflow-hidden">
                                <motion.div 
                                    className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100"
                                    initial={{ x: -10, opacity: 0 }}
                                    whileHover={{ x: 0, opacity: 1 }} // Note: whileHover on parent triggers this if variants used, but here simpler
                                >
                                     {/* We use group-hover CSS for simpler trigger */}
                                     <ArrowRight className="h-4 w-4 transform -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <h3 className={cn("text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100 leading-tight group-hover:text-primary transition-colors", fonts.spaceGrotesk.className)}>
                                {mode.name}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed min-h-[2.5rem] line-clamp-2">
                                {mode.description}
                            </p>
                        </div>
                        
                        {/* Tags / Step Count */}
                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-400 uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                                <span className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:scale-125", mode.color.replace("text-", "bg-"))} />
                                {mode.workflowSteps.length} Steps
                            </div>
                        </div>
                        
                    </div>
                    </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 步骤 2: 配置参数 */}
          {currentStep === "config" && selectedMode && (
            <motion.div
              key="config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
                
                <div className="flex items-center gap-4 mb-8">
                    <div className={cn("p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100", selectedMode.color.replace('text-', 'text-opacity-80 text-'))}>
                        {selectedMode.icon}
                    </div>
                    <div>
                        <h2 className={cn("text-2xl font-bold text-neutral-900 dark:text-neutral-100", fonts.spaceGrotesk.className)}>
                            {selectedMode.name}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {selectedMode.description}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                  {selectedMode.requiredFields.map((field) => (
                    <div key={field.name} className="space-y-2.5">
                      <Label htmlFor={field.name} className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="flex gap-2 group focus-within:ring-2 ring-neutral-900/10 rounded-xl transition-all">
                        <Input
                          id={field.name}
                          type="text"
                          placeholder={field.placeholder}
                          value={formData[field.name] || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                          className="flex-1 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 focus-visible:ring-0 focus-visible:border-neutral-400 font-mono text-sm"
                        />
                        {(field.type === "file" || field.type === "folder") && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-xl border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 hover:border-neutral-300"
                            onClick={() => handleFileSelect(field.name, field.type)}
                          >
                            {field.type === "folder" ? <FolderOpen className="h-4 w-4" /> : <FileVideo className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between pt-8 mt-8 border-t border-neutral-100 dark:border-neutral-800">
                    <Button 
                        variant="ghost" 
                        onClick={handleBack}
                        className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                        onClick={handleStartProcessing}
                        className="bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-xl px-8 h-12 text-base font-medium shadow-lg shadow-neutral-500/10 hover:shadow-neutral-500/20 transition-all hover:-translate-y-0.5"
                    >
                      <Play className="h-4 w-4 mr-2 fill-current" />
                      Start Process
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 步骤 3: 处理中 */}
          {currentStep === "processing" && selectedMode && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Terminal Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                   <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-500/80" />
                             <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                             <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className={cn("ml-4 text-xs font-mono text-neutral-400", fonts.jetBrainsMono.className)}>
                            agent_process.exe
                        </span>
                   </div>
                   <div className={cn("text-xs text-neutral-500 font-mono", fonts.jetBrainsMono.className)}>
                      PID: {Math.floor(Math.random() * 8000) + 1000}
                   </div>
                </div>

                <div className="p-8 space-y-8">
                   {/* Header Status */}
                   <div className="flex items-center justify-between mb-8">
                      <div>
                          <h3 className="text-white text-xl font-medium mb-1 flex items-center gap-3">
                             {selectedMode.name}
                             {overallProgress < 100 && (
                               <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-mono">RUNNING</span>
                             )}
                          </h3>
                          <p className="text-neutral-500 text-sm">Initializing AI agents for autonomous editing...</p>
                      </div>
                      <div className="text-right">
                          <div className={cn("text-4xl font-bold text-white tabular-nums", fonts.spaceGrotesk.className)}>
                              {Math.round(overallProgress)}%
                          </div>
                      </div>
                   </div>

                  <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                     <motion.div 
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                     />
                  </div>

                  {/* Terminal Logs */}
                  <div className={cn("space-y-1 font-mono text-xs md:text-sm max-h-[400px] overflow-y-auto pr-2 custom-scrollbar", fonts.jetBrainsMono.className)}>
                    {processingSteps.map((step, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn("flex gap-3 py-2 border-b border-white/5 last:border-0 items-start", 
                            step.status === "running" ? "bg-white/5 -mx-4 px-4 rounded-md" : ""
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {step.status === "running" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                          ) : step.status === "completed" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : step.status === "error" ? (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 ml-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                             <span className={cn("font-medium",
                                step.status === "running" ? "text-violet-300" :
                                step.status === "completed" ? "text-green-400" :
                                step.status === "error" ? "text-red-400" :
                                "text-neutral-500"
                             )}>
                                > {step.name}
                             </span>
                             {step.endTime && step.startTime && (
                                <span className="text-neutral-600 text-[10px] ml-2">
                                    {Math.round((step.endTime - step.startTime) / 1000)}s
                                </span>
                             )}
                          </div>
                          
                          {step.message && step.status !== "completed" && (
                            <p className="text-neutral-500 mt-1 pl-4 border-l-2 border-neutral-800 ml-0.5">
                              {step.message}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button variant="ghost" onClick={handleCancelProcessing} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                      Abort Process
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 步骤 4: 完成 */}
          {currentStep === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto"
            >
              <div className="text-center">
                 <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]"
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </motion.div>
                  
                  <h2 className={cn("text-3xl font-bold mb-4", fonts.spaceGrotesk.className)}>Processing Complete!</h2>
                  <p className="text-muted-foreground mb-10 text-lg">
                    The AI has finished crafting your video. It's ready for review.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            setCurrentStep("select");
                            setSelectedMode(null);
                            setFormData({});
                        }}
                        className="rounded-xl h-12"
                    >
                      Prepare Another
                    </Button>
                    <Button 
                        onClick={handleEnterEditor}
                        className="bg-neutral-900 text-white dark:bg-white dark:text-black rounded-xl h-12 px-8 text-base shadow-xl shadow-neutral-500/10 hover:shadow-neutral-500/20 hover:-translate-y-0.5 transition-all"
                    >
                      Open in Editor
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
