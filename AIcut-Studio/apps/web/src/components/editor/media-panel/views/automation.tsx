"use client";

import { useEffect, useState } from "react";
import { PanelBaseView as BaseView } from "@/components/editor/panel-base-view";
import { Button } from "@/components/ui/button";
import { Play, Loader2, RefreshCw, Terminal, Info, TerminalSquare } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ScriptInfo {
  name: string;
  isAuto: boolean;
}

export function AutomationView() {
  const [scripts, setScripts] = useState<ScriptInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automation");
      if (res.ok) {
        const data = await res.json();
        setScripts(data.scripts || []);
      }
    } catch (error) {
      console.error("Failed to fetch scripts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const runScript = async (scriptName: string) => {
    setRunning(scriptName);
    toast({
      title: "正在运行脚本",
      description: `脚本 ${scriptName} 已启动，请查看终端输出。`,
    });

    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptName }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "脚本运行完成",
          description: `脚本 ${scriptName} 执行成功。`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "脚本运行失败",
          description: data.details || data.error || "未知故障",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "网络错误",
        description: "无法连接到自动化 API。",
      });
    } finally {
      setRunning(null);
    }
  };

  return (
    <BaseView>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">自动化中心</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchScripts}
            disabled={loading}
            className={loading ? "animate-spin" : ""}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-muted/30 border rounded-lg p-4 flex gap-3 items-start">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>这里显示项目根目录下的所有 Python 自动化脚本。</p>
            <p className="mt-1 font-medium text-primary">运行脚本将实时修改您当前的时间轴。建议提前备份。</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">可用脚本</h3>
          
          {loading && scripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>加载脚本列表中...</p>
            </div>
          ) : scripts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">未在根目录找到 .py 脚本</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {scripts.map((script) => (
                <Card key={script.name} className="overflow-hidden border-muted/60 hover:border-primary/50 transition-colors">
                  <header className="p-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <TerminalSquare className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-bold truncate max-w-[180px]">
                          {script.name}
                        </CardTitle>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {script.isAuto && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                            ✨ 自动智能
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-mono">
                          .py
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => runScript(script.name)}
                      disabled={running === script.name}
                      className="h-8 px-3"
                    >
                      {running === script.name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                      )}
                      运行
                    </Button>
                  </header>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseView>
  );
}
