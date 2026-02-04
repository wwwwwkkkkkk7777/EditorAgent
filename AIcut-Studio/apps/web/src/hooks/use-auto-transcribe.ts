/**
 * Auto Transcription Hook
 * Automatically transcribes video/audio when added to timeline
 */

import { useEffect, useRef } from "react";
import { useTimelineStore } from "@/stores/timeline-store";
import { useMediaStore } from "@/stores/media-store";
import { useCaptionStore } from "@/stores/caption-store";
import { toast } from "sonner";

export function useAutoTranscribe() {
  const { tracks } = useTimelineStore();
  const { mediaFiles } = useMediaStore();
  const { addSegments, setTranscribing, clearSegments, clearSegmentsForElement } = useCaptionStore();
  const processedElements = useRef<Set<string>>(new Set());
  const previousMainTrackElements = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log("[Auto Transcribe] Effect triggered, tracks count:", tracks.length);
    
    // 打印所有轨道信息
    tracks.forEach((track, index) => {
      console.log(`[Auto Transcribe] Track ${index}:`, {
        name: track.name,
        isMain: track.isMain,
        type: track.type,
        elementsCount: track.elements.length,
        elementIds: track.elements.map(e => e.id)
      });
    });
    
    // 找到主轨道或第一个媒体轨道
    let targetTrack = tracks.find(t => t.isMain || t.name === "Main Track");
    if (!targetTrack) {
      // 如果没有主轨道，使用第一个媒体类型的轨道
      targetTrack = tracks.find(t => t.type === "media");
    }
    
    console.log("[Auto Transcribe] Target track found:", targetTrack?.name, "elements:", targetTrack?.elements.length);
    
    if (!targetTrack) {
      // 如果没有轨道，清空所有字幕
      if (previousMainTrackElements.current.size > 0) {
        console.log("[Auto Transcribe] No target track, clearing all segments");
        clearSegments();
        previousMainTrackElements.current.clear();
        processedElements.current.clear();
      }
      return;
    }

    // 获取当前目标轨道上的视频元素ID集合
    const currentElementIds = new Set<string>();
    for (const element of targetTrack.elements) {
      console.log("[Auto Transcribe] Checking element:", element.id, "type:", element.type);
      if (element.type === "media") {
        const mediaId = (element as any).mediaId;
        const media = mediaFiles.find(m => m.id === mediaId);
        console.log("[Auto Transcribe] Media found:", media?.name, "type:", media?.type);
        // 只关注视频和音频
        if (media && (media.type === "video" || media.type === "audio")) {
          currentElementIds.add(element.id);
          console.log("[Auto Transcribe] Added to current elements:", element.id);
        }
      }
    }

    console.log("[Auto Transcribe] Current elements:", Array.from(currentElementIds));
    console.log("[Auto Transcribe] Previous elements:", Array.from(previousMainTrackElements.current));

    // 检测被删除的元素
    const deletedElements = Array.from(previousMainTrackElements.current).filter(
      id => !currentElementIds.has(id)
    );
    
    // 清除被删除元素的字幕
    for (const elementId of deletedElements) {
      console.log(`[Auto Transcribe] Clearing captions for removed element: ${elementId}`);
      clearSegmentsForElement(elementId);
      processedElements.current.delete(elementId);
    }

    // 检测新增的元素
    const newElements = Array.from(currentElementIds).filter(
      id => !previousMainTrackElements.current.has(id)
    );

    console.log("[Auto Transcribe] New elements to transcribe:", newElements);

    // 转录新增的元素
    for (const elementId of newElements) {
      if (processedElements.current.has(elementId)) {
        console.log(`[Auto Transcribe] Element ${elementId} already processed, skipping`);
        continue;
      }
      
      const element = targetTrack.elements.find(e => e.id === elementId);
      if (!element || element.type !== "media") {
        console.log(`[Auto Transcribe] Element ${elementId} not found or not media type`);
        continue;
      }
      
      const mediaId = (element as any).mediaId;
      const media = mediaFiles.find(m => m.id === mediaId);
      
      if (!media || (media.type !== "video" && media.type !== "audio")) {
        console.log(`[Auto Transcribe] Media not found or not video/audio for element ${elementId}`);
        continue;
      }

      // 标记为已处理
      processedElements.current.add(elementId);

      console.log(`[Auto Transcribe] Starting transcription for element: ${elementId}, media: ${media.name}`);
      // 触发转录（异步，不阻塞）
      transcribeElement(elementId, mediaId, media.url);
    }

    // 更新之前的元素列表
    previousMainTrackElements.current = currentElementIds;
  }, [tracks, mediaFiles, clearSegments, clearSegmentsForElement]);

  
  const resolveMediaPath = (url?: string, media?: { filePath?: string; originalPath?: string }) => {
    if (media?.filePath) return media.filePath;
    if (media?.originalPath) return media.originalPath;
    if (!url) return null;

    try {
      const parsed = new URL(url, window.location.origin);
      const pathParam = parsed.searchParams.get("path");
      if (pathParam) {
        return decodeURIComponent(pathParam);
      }
      if (url.startsWith("file://")) {
        return decodeURIComponent(parsed.pathname).replace(/^\/(?:[A-Za-z]:)/, (m) => m.slice(1));
      }
    } catch {
      // ignore
    }
    return null;
  };

  const transcribeElement = async (elementId: string, mediaId: string, mediaUrl: string) => {
    try {
      const media = mediaFiles.find(m => m.id === mediaId);
      const localPath = resolveMediaPath(mediaUrl, media);

      let fileName = "";
      if (localPath) {
        fileName = localPath;
      } else {
        setTranscribing(true, "?????????...");
        
        // ?????????
        const response = await fetch(mediaUrl);
        if (!response.ok) throw new Error("????????????");
        const audioBlob = await response.blob();

        setTranscribing(true, "?????????...");

        // ??????
        const formData = new FormData();
        formData.append("file", audioBlob, `${elementId}.wav`);
        formData.append("name", elementId);

        const uploadResponse = await fetch("/api/media/upload-local", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("?????????");
        const { url } = await uploadResponse.json();
        
        // ?????????
        const urlObj = new URL(url, window.location.origin);
        fileName = urlObj.searchParams.get("path") || "";
      }

      setTranscribing(true, "?????????...");

      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: fileName,
          language: "auto",
        }),
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json();
        throw new Error(errorData.message || "字幕转录失败");
      }

      const { segments } = await transcriptionResponse.json();

      // 处理转录结果
      const captionSegments = [];
      for (const segment of segments) {
        const words = segment.text.trim().split(/\s+/);
        const segmentDuration = segment.end - segment.start;
        const wordsPerSecond = words.length / segmentDuration;

        // 分割成2-4个词的小块
        const chunks: string[] = [];
        for (let i = 0; i < words.length; i += 3) {
          chunks.push(words.slice(i, i + 3).join(" "));
        }

        // 计算每个chunk的时间
        let chunkStartTime = segment.start;
        for (const chunk of chunks) {
          const chunkWords = chunk.split(/\s+/).length;
          const chunkDuration = Math.max(0.8, chunkWords / wordsPerSecond);

          captionSegments.push({
            id: `${elementId}_${chunkStartTime}`,
            text: chunk,
            startTime: chunkStartTime,
            duration: chunkDuration,
            elementId,
            mediaId,
          });

          chunkStartTime += chunkDuration;
        }
      }

      // 添加到store
      addSegments(captionSegments);
      
      console.log(`[Auto Transcribe] Transcription completed: ${captionSegments.length} segments`);
      toast.success(`转录完成：${captionSegments.length} 条字幕`);
    } catch (error) {
      console.error("[Auto Transcribe] Transcription failed:", error);
      toast.error(
        `自动转录失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
      // 移除标记，允许重试
      processedElements.current.delete(elementId);
    } finally {
      setTranscribing(false);
    }
  };

  return null;
}
