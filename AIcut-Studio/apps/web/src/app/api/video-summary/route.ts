/**
 * 视频摘要 API
 * 
 * 用于存储和检索视频的摘要和转录内容
 * 当用户在编辑器中导入视频时自动调用
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VIDEOAGENT_API_URL = process.env.VIDEOAGENT_API_URL || "http://localhost:8001";

// 摘要存储目录
const WORKSPACE_ROOT = path.join(process.cwd(), "../../../");
const SUMMARIES_DIR = path.join(WORKSPACE_ROOT, "ai_workspace", "video_summaries");

// 确保目录存在
if (!fs.existsSync(SUMMARIES_DIR)) {
  fs.mkdirSync(SUMMARIES_DIR, { recursive: true });
}

/**
 * 获取视频摘要文件路径
 */
function getSummaryFilePath(videoId: string): string {
  return path.join(SUMMARIES_DIR, `${videoId}.json`);
}

/**
 * 生成视频 ID（基于文件路径的哈希）
 */
function generateVideoId(videoPath: string): string {
  const crypto = require("crypto");
  return crypto.createHash("md5").update(videoPath).digest("hex").substring(0, 12);
}

// Resolve input videoPath to a local filesystem path when possible
function resolveVideoFilePath(inputPath: string): string | null {
  if (!inputPath) return null;

  // Query param path=...
  const queryMatch = inputPath.match(/[?&]path=([^&]+)/);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]);
    } catch {
      // fall through
    }
  }

  // URL with query param
  try {
    const url = inputPath.startsWith("http")
      ? new URL(inputPath)
      : new URL(inputPath, "http://localhost");
    const pathParam = url.searchParams.get("path");
    if (pathParam) {
      try {
        return decodeURIComponent(pathParam);
      } catch {
        return pathParam;
      }
    }

    if (inputPath.startsWith("file://")) {
      return decodeURIComponent(url.pathname).replace(/^\/([A-Za-z]:)/, "$1");
    }
  } catch {
    // ignore
  }

  return inputPath;
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      // 为视频生成摘要和转录
      case "generateSummary": {
        const { videoPath, projectId } = data;
        
        if (!videoPath) {
          return NextResponse.json({ success: false, error: "Missing videoPath" }, { status: 400 });
        }

        const resolvedVideoPath = resolveVideoFilePath(videoPath);
        const videoId = generateVideoId(resolvedVideoPath || videoPath);
        const summaryPath = getSummaryFilePath(videoId);

        // 检查是否已有缓存的摘要
        if (fs.existsSync(summaryPath)) {
          const cached = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
          console.log(`[Video Summary] Using cached summary for ${videoPath}`);
          return NextResponse.json({
            success: true,
            cached: true,
            summary: cached,
          });
        }

        console.log(`[Video Summary] Generating summary for ${resolvedVideoPath || videoPath}`);

        // 调用 VideoAgent 的 VideoSummarizationGenerator
        try {
          const targetPath = resolvedVideoPath || videoPath;
          if (!targetPath || !fs.existsSync(targetPath)) {
            throw new Error(`Video path not found on disk: ${targetPath}`);
          }

          const stat = fs.statSync(targetPath);
          const videoDir = stat.isDirectory() ? targetPath : path.dirname(targetPath);
          const response = await fetch(`${VIDEOAGENT_API_URL}/api/videoagent/execute-tool`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tool_name: "VideoSummarizationGenerator",
              params: {
                user_idea: "生成视频内容摘要，提取关键信息、人物、场景和对话",
                video_dir: videoDir,
                present_style_path: "default",
                output_path: `dataset/video_edit/writing_data/summary_${videoId}.json`,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`VideoAgent API error: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.status === "error") {
            throw new Error(result.error || "Summary generation failed");
          }

          // 保存摘要结果
          const summaryData = {
            videoId,
            videoPath: resolvedVideoPath || videoPath,
            projectId,
            generatedAt: Date.now(),
            summary: result.result?.content_output?.content_created || "",
            transcript: result.result?.transcript || "",
            processedVideos: result.result?.processed_videos || [],
            transcriptSource: result.result?.transcript_source || "unknown",
          };

          fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));

          return NextResponse.json({
            success: true,
            cached: false,
            summary: summaryData,
          });
        } catch (error: any) {
          console.error(`[Video Summary] Error generating summary:`, error);
          return NextResponse.json({
            success: false,
            error: error.message,
          }, { status: 500 });
        }
      }

      // 获取已有的视频摘要
      case "getSummary": {
        const { videoPath, videoId: providedId } = data;
        
        const videoId = providedId || (videoPath ? generateVideoId(videoPath) : null);
        if (!videoId) {
          return NextResponse.json({ success: false, error: "Missing videoPath or videoId" }, { status: 400 });
        }

        const summaryPath = getSummaryFilePath(videoId);
        
        if (!fs.existsSync(summaryPath)) {
          return NextResponse.json({
            success: false,
            exists: false,
            message: "No summary found for this video",
          });
        }

        const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
        return NextResponse.json({
          success: true,
          exists: true,
          summary,
        });
      }

      // 获取项目中所有视频的摘要
      case "getProjectSummaries": {
        const { projectId } = data;
        
        if (!projectId) {
          return NextResponse.json({ success: false, error: "Missing projectId" }, { status: 400 });
        }

        const summaries: any[] = [];
        
        if (fs.existsSync(SUMMARIES_DIR)) {
          const files = fs.readdirSync(SUMMARIES_DIR).filter(f => f.endsWith(".json"));
          
          for (const file of files) {
            try {
              const content = JSON.parse(fs.readFileSync(path.join(SUMMARIES_DIR, file), "utf-8"));
              if (content.projectId === projectId) {
                summaries.push(content);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }

        return NextResponse.json({
          success: true,
          summaries,
        });
      }

      // 删除视频摘要
      case "deleteSummary": {
        const { videoPath, videoId: providedId } = data;
        
        const videoId = providedId || (videoPath ? generateVideoId(videoPath) : null);
        if (!videoId) {
          return NextResponse.json({ success: false, error: "Missing videoPath or videoId" }, { status: 400 });
        }

        const summaryPath = getSummaryFilePath(videoId);
        
        if (fs.existsSync(summaryPath)) {
          fs.unlinkSync(summaryPath);
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[Video Summary API] Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // 列出所有视频摘要
  try {
    const summaries: any[] = [];
    
    if (fs.existsSync(SUMMARIES_DIR)) {
      const files = fs.readdirSync(SUMMARIES_DIR).filter(f => f.endsWith(".json"));
      
      for (const file of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(SUMMARIES_DIR, file), "utf-8"));
          summaries.push({
            videoId: content.videoId,
            videoPath: content.videoPath,
            projectId: content.projectId,
            generatedAt: content.generatedAt,
            hasSummary: !!content.summary,
            hasTranscript: !!content.transcript,
          });
        } catch (e) {
          // 忽略解析错误
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: summaries.length,
      summaries,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
