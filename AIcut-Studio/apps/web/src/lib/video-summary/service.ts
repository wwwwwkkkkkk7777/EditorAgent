/**
 * 视频摘要服务
 * 
 * 提供视频摘要的生成、获取和管理功能
 * 用于在导入视频时自动生成摘要，以及在 chat 中使用摘要回答问题
 */

export interface VideoSummary {
  videoId: string;
  videoPath: string;
  projectId?: string;
  generatedAt: number;
  summary: string;
  transcript: string;
  processedVideos: string[];
  transcriptSource: string;
}

export interface SummaryGenerationResult {
  success: boolean;
  cached: boolean;
  summary?: VideoSummary;
  error?: string;
}

/**
 * 为视频生成摘要
 * 当视频导入编辑器时调用此函数
 */
export async function generateVideoSummary(
  videoPath: string,
  projectId?: string
): Promise<SummaryGenerationResult> {
  try {
    const response = await fetch("/api/video-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generateSummary",
        data: { videoPath, projectId },
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("[VideoSummaryService] Error generating summary:", error);
    return {
      success: false,
      cached: false,
      error: error.message,
    };
  }
}

/**
 * 获取视频摘要
 */
export async function getVideoSummary(
  videoPath?: string,
  videoId?: string
): Promise<VideoSummary | null> {
  try {
    const response = await fetch("/api/video-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getSummary",
        data: { videoPath, videoId },
      }),
    });

    const result = await response.json();
    if (result.success && result.exists) {
      return result.summary;
    }
    return null;
  } catch (error) {
    console.error("[VideoSummaryService] Error getting summary:", error);
    return null;
  }
}

/**
 * 获取项目中所有视频的摘要
 */
export async function getProjectSummaries(projectId: string): Promise<VideoSummary[]> {
  try {
    const response = await fetch("/api/video-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "getProjectSummaries",
        data: { projectId },
      }),
    });

    const result = await response.json();
    if (result.success) {
      return result.summaries || [];
    }
    return [];
  } catch (error) {
    console.error("[VideoSummaryService] Error getting project summaries:", error);
    return [];
  }
}

/**
 * 删除视频摘要
 */
export async function deleteVideoSummary(
  videoPath?: string,
  videoId?: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/video-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deleteSummary",
        data: { videoPath, videoId },
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("[VideoSummaryService] Error deleting summary:", error);
    return false;
  }
}

/**
 * 列出所有视频摘要
 */
export async function listAllSummaries(): Promise<{ videoId: string; videoPath: string; projectId?: string }[]> {
  try {
    const response = await fetch("/api/video-summary");
    const result = await response.json();
    if (result.success) {
      return result.summaries || [];
    }
    return [];
  } catch (error) {
    console.error("[VideoSummaryService] Error listing summaries:", error);
    return [];
  }
}

/**
 * Chat 意图分类结果
 */
export interface ChatIntentResult {
  success: boolean;
  intent: "video_content" | "editing" | "other";
  confidence: number;
  reason: string;
  method: string;
}

/**
 * 对用户消息进行意图分类
 */
export async function classifyChatIntent(
  message: string,
  projectContext?: string
): Promise<ChatIntentResult> {
  try {
    const response = await fetch("/api/chat-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        projectContext,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("[ChatIntentService] Error classifying intent:", error);
    return {
      success: false,
      intent: "other",
      confidence: 0,
      reason: error.message,
      method: "error",
    };
  }
}

/**
 * 构建用于回答视频内容问题的上下文
 */
export function buildVideoContentContext(summaries: VideoSummary[]): string {
  if (summaries.length === 0) {
    return "当前项目没有可用的视频摘要。请先导入视频素材。";
  }

  let context = "以下是项目中视频的摘要和转录内容：\n\n";

  for (const summary of summaries) {
    const videoName = summary.videoPath.split("/").pop() || summary.videoPath;
    context += `## 视频: ${videoName}\n`;
    
    if (summary.summary) {
      context += `### 摘要:\n${summary.summary}\n\n`;
    }
    
    if (summary.transcript) {
      context += `### 转录内容:\n${summary.transcript}\n\n`;
    }
    
    context += "---\n\n";
  }

  return context;
}
