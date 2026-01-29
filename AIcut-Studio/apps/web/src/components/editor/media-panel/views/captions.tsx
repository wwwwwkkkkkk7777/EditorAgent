import { Button } from "@/components/ui/button";
import { PropertyGroup } from "../../properties-panel/property-item";
import { PanelBaseView as BaseView } from "@/components/editor/panel-base-view";
import { Language, LanguageSelect } from "@/components/language-select";
import { useState, useRef, useEffect } from "react";
import { extractTimelineAudio } from "@/lib/mediabunny-utils";
import { encryptWithRandomKey, arrayBufferToBase64 } from "@/lib/zk-encryption";
import { useTimelineStore } from "@/stores/timeline-store";
import { useMediaStore } from "@/stores/media-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { DEFAULT_TEXT_ELEMENT } from "@/constants/text-constants";
import { Loader2, Shield, Trash2, Upload, Play, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextElement } from "@/types/timeline";

export const languages: Language[] = [
  { code: "US", name: "英语" },
  { code: "ES", name: "西班牙语" },
  { code: "IT", name: "意大利语" },
  { code: "FR", name: "法语" },
  { code: "DE", name: "德语" },
  { code: "PT", name: "葡萄牙语" },
  { code: "RU", name: "俄语" },
  { code: "JP", name: "日语" },
  { code: "CN", name: "中文" },
];

const PRIVACY_DIALOG_KEY = "opencut-transcription-privacy-accepted";

export function Captions() {
  const [selectedCountry, setSelectedCountry] = useState("auto");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const [transcribedSegments, setTranscribedSegments] = useState<Array<{
    text: string;
    startTime: number;
    duration: number;
  }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { insertTrackAt, insertTrackWithElements, tracks } = useTimelineStore();
  const { mediaFiles } = useMediaStore();
  const { seek, currentTime } = usePlaybackStore();

  // Check if user has already accepted privacy on mount
  useEffect(() => {
    const hasAccepted = localStorage.getItem(PRIVACY_DIALOG_KEY) === "true";
    setHasAcceptedPrivacy(hasAccepted);
  }, []);

  const handleGenerateTranscript = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setProcessingStep("正在提取音频...");

      // Support transcription in standalone mode by finding the first audio-capable element
      let sourceUrl = "";
      for (const track of tracks) {
        if (track.type === "media" || track.type === "audio") {
          for (const element of track.elements) {
            if (element.type === "media") {
              const media = mediaFiles.find(m => m.id === (element as any).mediaId);
              if (media && (media.type === "video" || media.type === "audio")) {
                sourceUrl = media.url;
                break;
              }
            }
          }
        }
        if (sourceUrl) break;
      }

      let audioBlob: Blob;
      if (sourceUrl) {
        setProcessingStep("正在获取素材音频...");
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error("无法获取素材音频文件");
        audioBlob = await response.blob();
      } else {
        // Fallback or empty (will likely fail on backend as seen before)
        throw new Error("时间轴上未发现可识别的音视频片段，请先添加素材。");
      }

      setProcessingStep("正在上传音频...");

      // --- NEW STANDALONE FLOW: Upload directly to backend ---
      const formData = new FormData();
      formData.append("file", audioBlob, "timeline_audio.wav");
      formData.append("name", "timeline_audio");

      const uploadResponse = await fetch("/api/media/upload-local", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("音频上传失败，请重试");
      }

      const { url } = await uploadResponse.json();
      // Extract the local path from the served URL
      const urlObj = new URL(url, window.location.origin);
      const fileName = urlObj.searchParams.get("path") || "";

      setProcessingStep("正在转录字幕...");

      // Call transcription API with the local filename/path
      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: fileName,
          language:
            selectedCountry === "auto" ? "auto" : selectedCountry.toLowerCase(),
        }),
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json();
        throw new Error(errorData.message || "字幕转录失败");
      }

      const { text, segments } = await transcriptionResponse.json();
      // ... rest of the logic ...

      console.log("Transcription completed:", { text, segments });

      const shortCaptions: Array<{
        text: string;
        startTime: number;
        duration: number;
      }> = [];

      let globalEndTime = 0; // Track the end time of the last caption globally

      segments.forEach((segment: any) => {
        const words = segment.text.trim().split(/\s+/);
        const segmentDuration = segment.end - segment.start;
        const wordsPerSecond = words.length / segmentDuration;

        // Split into chunks of 2-4 words
        const chunks: string[] = [];
        for (let i = 0; i < words.length; i += 3) {
          chunks.push(words.slice(i, i + 3).join(" "));
        }

        // Calculate timing for each chunk to place them sequentially
        let chunkStartTime = segment.start;
        chunks.forEach((chunk) => {
          const chunkWords = chunk.split(/\s+/).length;
          const chunkDuration = Math.max(0.8, chunkWords / wordsPerSecond); // Minimum 0.8s per chunk

          let adjustedStartTime = chunkStartTime;

          // Prevent overlapping: if this caption would start before the last one ends,
          // start it right after the last one ends
          if (adjustedStartTime < globalEndTime) {
            adjustedStartTime = globalEndTime;
          }

          shortCaptions.push({
            text: chunk,
            startTime: adjustedStartTime,
            duration: chunkDuration,
          });

          // Update global end time
          globalEndTime = adjustedStartTime + chunkDuration;

          // Next chunk starts when this one ends (for within-segment timing)
          chunkStartTime += chunkDuration;
        });
      });

      setTranscribedSegments(shortCaptions);

      console.log(
        `✅ ${shortCaptions.length} short-form caption chunks transcribed!`
      );
    } catch (error) {
      console.error("Transcription failed:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  return (
    <BaseView ref={containerRef} className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <PropertyGroup title="识别语言">
          <LanguageSelect
            selectedCountry={selectedCountry}
            onSelect={setSelectedCountry}
            containerRef={containerRef}
            languages={languages}
          />
        </PropertyGroup>
      </div>

      <div className="flex-1 overflow-y-auto my-2 space-y-2 pr-2 custom-scrollbar">
        {transcribedSegments.length > 0 ? (
          transcribedSegments.map((segment, index) => {
            const isActive = currentTime >= segment.startTime && currentTime < (segment.startTime + segment.duration);
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-all cursor-pointer group ${isActive
                    ? "bg-primary/10 border-primary/50"
                    : "bg-foreground/5 border-transparent hover:border-foreground/20"
                  }`}
                onClick={() => seek(segment.startTime)}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium leading-relaxed">
                    {segment.text}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums bg-foreground/10 px-1.5 py-0.5 rounded flex-shrink-0">
                    {Math.floor(segment.startTime / 60)}:{(segment.startTime % 60).toFixed(1).padStart(4, "0")}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60 mt-10">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              尚未生成字幕内容。<br />点击下方按钮开始智能识别。
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-1 border-t bg-panel pt-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          {transcribedSegments.length > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const captionElements = transcribedSegments.map((caption, index) => ({
                  ...DEFAULT_TEXT_ELEMENT,
                  name: `Caption ${index + 1}`,
                  content: caption.text,
                  duration: caption.duration,
                  startTime: caption.startTime,
                  fontSize: 65,
                  fontWeight: "bold",
                } as TextElement));
                insertTrackWithElements("text", 0, captionElements);
              }}
            >
              应用到时间轴
            </Button>
          )}

          <Button
            className={transcribedSegments.length > 0 ? "px-3" : "w-full"}
            variant={transcribedSegments.length > 0 ? "secondary" : "default"}
            onClick={() => {
              if (hasAcceptedPrivacy) {
                handleGenerateTranscript();
              } else {
                setShowPrivacyDialog(true);
              }
            }}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">
                  {processingStep === "Extracting audio..." ? "正在提取音频..." :
                    processingStep === "Encrypting audio..." ? "正在加密音频..." :
                      processingStep === "Uploading..." ? "正在上传..." :
                        processingStep === "Transcribing..." ? "正在转录字幕..." :
                          processingStep}
                </span>
              </div>
            ) : transcribedSegments.length > 0 ? (
              "重新识别"
            ) : (
              "开启 AI 生成字幕"
            )}
          </Button>
        </div>

        <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                音频处理隐私提示
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2">
                  <p>
                    为了生成字幕，我们需要使用语音识别技术处理您的时间轴音频。
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        <b>隐私优先</b> - 您的音频仅用于生成字幕，不会被持久储存
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        <b>本地集成</b> - 与本地文件系统深度链接，确保数据安全
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Upload className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        <b>智能识别</b> - 自动识别语音内容并对齐时间轴
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Trash2 className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        <b>即刻销毁</b> - 转录完成后，所有云端临时数据会在数秒内彻底删除
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    <strong>隐私说明：</strong> 处理后的数据将直接返回您的浏览器。
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPrivacyDialog(false)}
                disabled={isProcessing}
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  localStorage.setItem(PRIVACY_DIALOG_KEY, "true");
                  setHasAcceptedPrivacy(true);
                  setShowPrivacyDialog(false);
                  handleGenerateTranscript();
                }}
                disabled={isProcessing}
              >
                同意并开始生成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </BaseView>
  );
}
