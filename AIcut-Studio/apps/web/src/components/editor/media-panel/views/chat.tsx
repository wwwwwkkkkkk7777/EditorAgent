"use client";

import { useEffect, useRef, useState } from "react";
import { PanelBaseView as BaseView } from "@/components/editor/panel-base-view";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, User, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  plan?: string;
  answer?: string;
  phase?: string;
  executions?: ExecutionStep[];
  isAction?: boolean;
}

interface ExecutionStep {
  action: string;
  result: string;
  current: number;
  total: number;
}

const STORAGE_KEY = "cutagent_chat_history";
const SESSION_KEY = "cutagent_session_id";

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>(() => {
    // 检查是否是新会话（刷新页面）
    if (typeof window !== "undefined") {
      try {
        const currentSessionId = Date.now().toString();
        const savedSessionId = sessionStorage.getItem(SESSION_KEY);
        
        // 如果是新会话（刷新页面），清空历史记录
        if (!savedSessionId) {
          sessionStorage.setItem(SESSION_KEY, currentSessionId);
          localStorage.removeItem(STORAGE_KEY);
        }
        
        // 尝试加载聊天记录
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
    // 默认欢迎消息
    return [
      {
        role: "assistant",
        content: `你好！我是你的剪辑助手。示例：
- 为这段视频生成字幕
- 分析一下 BGM 的节拍
- 生成一段"欢迎观看"的语音
- 调低一点音量`,
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 保存聊天记录到 localStorage（使用 useRef 避免无限循环）
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 防抖保存，避免频繁写入
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (e) {
          console.error("Failed to save chat history:", e);
        }
      }, 500); // 500ms 防抖
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to read stream");

      const decoder = new TextDecoder();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", thinking: "", plan: "", executions: [] },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              setMessages((prev) => {
                const newMessages = [...prev];
                const last = newMessages[newMessages.length - 1];

                if (data.phase !== undefined) {
                  last.phase = data.phase;
                }
                if (data.thinking !== undefined) {
                  last.thinking = data.thinking;
                }
                if (data.plan !== undefined) {
                  last.plan = data.plan;
                }
                if (data.answer !== undefined) {
                  last.answer = data.answer;
                }
                if (data.execution) {
                  const exec = data.execution;
                  if (!last.executions) last.executions = [];
                  
                  if (exec.phase === "executing" || exec.phase === "completed") {
                    // 更新或添加执行步骤
                    const existingIndex = last.executions.findIndex(
                      (e) => e.current === exec.current
                    );
                    
                    if (existingIndex >= 0) {
                      last.executions[existingIndex] = {
                        action: exec.action,
                        result: exec.result || last.executions[existingIndex].result,
                        current: exec.current,
                        total: exec.total,
                      };
                    } else {
                      last.executions.push({
                        action: exec.action,
                        result: exec.result || "执行中...",
                        current: exec.current,
                        total: exec.total,
                      });
                    }
                  }
                  
                  // 更新阶段信息
                  if (exec.message) {
                    last.phase = exec.message;
                  }
                }
                if (data.done) {
                  last.isAction = data.hasAction;
                  last.phase = undefined; // 清除阶段信息
                  if (data.hasAction) {
                    toast.success("操作已同步到时间轴", {
                      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
                    });
                  }
                }
                return newMessages;
              });
            } catch (e) {
              console.error("Failed to parse streamed data", e);
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，处理您的请求时出错了。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-panel pt-4">
      <ScrollArea className="flex-1 p-4 pb-0" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start ${
                m.role === "user" ? "flex-row-reverse gap-3" : ""
              }`}
            >
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              <div className={`flex-1 ${m.role === "user" ? "text-right" : ""}`}>
                {m.role === "user" ? (
                  <div className="inline-block max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground rounded-tr-none shadow-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                ) : (
                  <div className="space-y-3 w-full">
                    {/* 当前阶段指示器 */}
                    {m.phase && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{m.phase}</span>
                      </div>
                    )}

                    {/* 思考过程 */}
                    {m.thinking && (
                      <div className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1">
                        <div className="text-xs font-semibold mb-1 text-primary/70">💭 思考过程</div>
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>
                            {m.thinking}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* 执行计划 */}
                    {m.plan && (
                      <div className="text-sm text-foreground border-l-2 border-blue-500/50 pl-3 py-1">
                        <div className="text-xs font-semibold mb-1 text-blue-400">📋 执行计划</div>
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              ul: ({ children }) => (
                                <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>
                              ),
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                            }}
                          >
                            {m.plan}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* 执行步骤 */}
                    {m.executions && m.executions.length > 0 && (
                      <div className="space-y-2 border-l-2 border-green-500/50 pl-3 py-1">
                        <div className="text-xs font-semibold text-green-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          执行进度
                        </div>
                        {m.executions.map((exec, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-muted/20 px-3 py-2 rounded border border-border/30"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-primary/80">
                                [{exec.current}/{exec.total}]
                              </span>
                            </div>
                            <div className="text-muted-foreground">{exec.result}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 直接回答（不需要工具的情况） */}
                    {m.answer && (
                      <div className="text-sm text-foreground">
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{m.answer}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* 普通内容 */}
                    {m.content && !m.thinking && !m.plan && !m.answer && (
                      <div className="text-sm text-foreground">
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* 完成标记 */}
                    {m.isAction && (
                      <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-medium bg-green-500/10 w-fit px-2 py-0.5 rounded-full border border-green-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>已应用修改</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && !messages[messages.length - 1]?.phase && (
            <div className="flex items-start gap-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground italic">
                  正在处理...
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex-none p-4 pt-4 border-t bg-panel-header/50">
        <div className="relative rounded-2xl border border-border bg-muted/30 p-2">
          <textarea
            className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm resize-none min-h-[80px] px-2 py-1"
            placeholder="输入您的剪辑请求..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
          />

          <div className="flex items-center justify-end mt-2 px-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-7 text-[10px] gap-1 px-3 rounded-full border-border bg-background"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  处理中...
                </>
              ) : (
                "发送"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
