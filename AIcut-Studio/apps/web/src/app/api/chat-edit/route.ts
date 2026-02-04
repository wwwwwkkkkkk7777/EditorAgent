import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { VideoEditorAgent } from "@/lib/agent/core";
import { nanoid } from "nanoid";
import { Agent as UndiciAgent } from "undici";

const WORKSPACE_ROOT = path.join(process.cwd(), "../../../");
const EDITS_DIR = path.join(WORKSPACE_ROOT, "ai_workspace");
const PENDING_EDITS_FILE = path.join(EDITS_DIR, "pending-edits.json");
const SNAPSHOT_FILE = path.join(EDITS_DIR, "project-snapshot.json");
const SUMMARIES_DIR = path.join(EDITS_DIR, "video_summaries");
const LOCAL_SOURCE_DIR = "D:\\Desktop\\AIcut\\source";

interface PendingEdit {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  processed: boolean;
}

const agent = new VideoEditorAgent();
const longTimeoutDispatcher = new UndiciAgent({
  headersTimeout: 10 * 60 * 1000,
  bodyTimeout: 10 * 60 * 1000,
});

const resolveProjectId = () => {
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf-8"));
      return snapshot?.project?.id as string | undefined;
    }
  } catch (err) {
    console.error("[Agent] Failed to read project snapshot:", err);
  }
  return undefined;
};

const resolveExistingPath = (filePath: string) => {
  if (!filePath) return undefined;
  if (fs.existsSync(filePath)) return filePath;
  if (path.isAbsolute(filePath)) return undefined;

  const projectId = resolveProjectId();
  const candidates = [
    path.join(WORKSPACE_ROOT, filePath),
    path.join(WORKSPACE_ROOT, "ai_workspace", filePath),
    projectId ? path.join(WORKSPACE_ROOT, "projects", projectId, "assets", "videos", filePath) : undefined,
    projectId ? path.join(WORKSPACE_ROOT, "projects", projectId, "assets", "audio", filePath) : undefined,
    projectId ? path.join(WORKSPACE_ROOT, "projects", projectId, "assets", "images", filePath) : undefined,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
};

/**
 * 扫描本地素材目录，返回可用的素材列表
 */
const scanLocalAssets = () => {
  const localAssets: any[] = [];
  
  if (!fs.existsSync(LOCAL_SOURCE_DIR)) {
    return localAssets;
  }

  try {
    // 扫描图片
    const picDir = path.join(LOCAL_SOURCE_DIR, "picture");
    if (fs.existsSync(picDir)) {
      const images = fs.readdirSync(picDir).filter(f => 
        /\.(png|jpg|jpeg|gif|webp)$/i.test(f)
      );
      images.forEach(img => {
        localAssets.push({
          id: `local-img-${img}`,
          name: img,
          type: "image",
          filePath: path.join(picDir, img),
          source: "local",
        });
      });
    }

    // 扫描视频
    const videoFiles = fs.readdirSync(LOCAL_SOURCE_DIR).filter(f => 
      /\.(mp4|mov|avi|mkv|webm)$/i.test(f)
    );
    videoFiles.forEach(video => {
      localAssets.push({
        id: `local-video-${video}`,
        name: video,
        type: "video",
        filePath: path.join(LOCAL_SOURCE_DIR, video),
        source: "local",
      });
    });

    // 扫描音频
    const musicDir = path.join(LOCAL_SOURCE_DIR, "music");
    if (fs.existsSync(musicDir)) {
      const audioFiles = fs.readdirSync(musicDir).filter(f => 
        /\.(mp3|wav|aac|flac|m4a)$/i.test(f)
      );
      audioFiles.forEach(audio => {
        localAssets.push({
          id: `local-audio-${audio}`,
          name: audio,
          type: "audio",
          filePath: path.join(musicDir, audio),
          source: "local",
        });
      });
    }

    // 扫描根目录的音频文件
    const rootAudioFiles = fs.readdirSync(LOCAL_SOURCE_DIR).filter(f => 
      /\.(mp3|wav|aac|flac|m4a)$/i.test(f)
    );
    rootAudioFiles.forEach(audio => {
      localAssets.push({
        id: `local-audio-${audio}`,
        name: audio,
        type: "audio",
        filePath: path.join(LOCAL_SOURCE_DIR, audio),
        source: "local",
      });
    });
  } catch (err) {
    console.error("[Agent] Failed to scan local assets:", err);
  }

  return localAssets;
};

/**
 * 加载项目中的视频摘要
 */
const loadVideoSummaries = (projectId?: string) => {
  const summaries: any[] = [];
  
  if (!fs.existsSync(SUMMARIES_DIR)) {
    return summaries;
  }

  try {
    const files = fs.readdirSync(SUMMARIES_DIR).filter(f => f.endsWith(".json"));
    
    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(SUMMARIES_DIR, file), "utf-8"));
        if (!projectId || content.projectId === projectId) {
          summaries.push(content);
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  } catch (err) {
    console.error("[Agent] Failed to load video summaries:", err);
  }

  return summaries;
};

/**
 * 基于规则的意图分类
 */
const classifyIntent = (message: string): { intent: "video_content" | "editing" | "other", confidence: number } => {
  const lowerMessage = message.toLowerCase();

  // 视频内容相关关键词
  const videoContentKeywords = [
    "视频讲", "视频说", "视频内容", "视频里", "视频中",
    "讲了什么", "说了什么", "有什么", "在说什么", "关于什么",
    "主题是", "人物", "角色", "提到", "出现",
    "几分钟", "第几秒", "什么时候", "哪里说",
    "摘要", "总结", "概述", "大意",
  ];

  // 编辑操作相关关键词
  const editingKeywords = [
    "剪辑", "剪切", "裁剪", "删除", "移除",
    "添加", "插入", "加入", "放入",
    "调整", "修改", "改变", "更改",
    "音量", "速度", "亮度", "对比度",
    "转场", "特效", "滤镜", "字幕", "标题",
    "导出", "渲染", "合并", "分割",
    "节奏", "配乐", "配音", "解说", "生成",
    "调低", "调高", "缩短", "加长", "拉伸",
  ];

  let videoContentScore = 0;
  let editingScore = 0;

  for (const keyword of videoContentKeywords) {
    if (lowerMessage.includes(keyword)) {
      videoContentScore += 1;
    }
  }

  for (const keyword of editingKeywords) {
    if (lowerMessage.includes(keyword)) {
      editingScore += 1;
    }
  }

  if (editingScore > videoContentScore && editingScore > 0) {
    return { intent: "editing", confidence: Math.min(0.9, 0.5 + editingScore * 0.1) };
  } else if (videoContentScore > 0) {
    return { intent: "video_content", confidence: Math.min(0.9, 0.5 + videoContentScore * 0.1) };
  } else {
    return { intent: "other", confidence: 0.6 };
  }
};

/**
 * 构建视频内容上下文
 */
const buildVideoContentContext = (summaries: any[]): string => {
  if (summaries.length === 0) {
    return "";
  }

  let context = "以下是项目中视频的摘要和转录内容：\n\n";

  for (const summary of summaries) {
    const videoName = summary.videoPath?.split(/[\\/]/).pop() || "视频";
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
};

const loadSnapshot = () => {
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf-8"));
      
      // 将本地素材添加到快照中，让 Agent 能看到
      const localAssets = scanLocalAssets();
      if (localAssets.length > 0) {
        snapshot.localAssets = localAssets;
        snapshot.localSourceDir = LOCAL_SOURCE_DIR;
      }
      
      return snapshot;
    }
  } catch (err) {
    console.error("[Agent] Failed to read project snapshot:", err);
  }
  return undefined;
};

const findElementById = (snapshot: any, elementId: string) => {
  for (const track of snapshot?.tracks || []) {
    for (const el of track.elements || []) {
      if (el.id === elementId) return { element: el, track };
    }
  }
  return undefined;
};

const findAssetById = (snapshot: any, mediaId: string) =>
  (snapshot?.assets || []).find((a: any) => a.id === mediaId);

const findAssetByName = (snapshot: any, mediaName: string) => {
  const target = mediaName.toLowerCase();
  return (snapshot?.assets || []).find((a: any) => (a.name || "").toLowerCase() === target);
};

const findElementByMediaId = (snapshot: any, mediaId: string) => {
  for (const track of snapshot?.tracks || []) {
    for (const el of track.elements || []) {
      if (el.mediaId === mediaId) return { element: el, track };
    }
  }
  return undefined;
};

const pickDefaultElement = (snapshot: any, preferType: "video" | "audio") => {
  for (const track of snapshot?.tracks || []) {
    for (const el of track.elements || []) {
      if (el.type !== "media") continue;
      const asset = findAssetById(snapshot, el.mediaId);
      if (asset?.type === preferType) return { element: el, track, asset };
    }
  }
  return undefined;
};

const resolveMediaContext = (opts: {
  elementId?: string;
  mediaId?: string;
  mediaName?: string;
  preferType: "video" | "audio";
}) => {
  const snapshot = loadSnapshot();
  if (!snapshot) return undefined;

  let element = opts.elementId ? findElementById(snapshot, opts.elementId)?.element : undefined;
  let asset = element?.mediaId ? findAssetById(snapshot, element.mediaId) : undefined;

  if (!asset && opts.mediaId) asset = findAssetById(snapshot, opts.mediaId);
  if (!element && opts.mediaId) element = findElementByMediaId(snapshot, opts.mediaId)?.element;

  if (!asset && opts.mediaName) asset = findAssetByName(snapshot, opts.mediaName);
  if (!element && asset?.id) element = findElementByMediaId(snapshot, asset.id)?.element;

  if (!element || !asset) {
    const picked = pickDefaultElement(snapshot, opts.preferType);
    element = element || picked?.element;
    asset = asset || picked?.asset;
  }

  if (!asset && element?.mediaId) asset = findAssetById(snapshot, element.mediaId);

  if (!element || !asset) return undefined;

  return {
    elementId: element.id as string,
    mediaId: asset.id as string,
    mediaName: asset.name as string,
    filePath: asset.filePath as string | undefined,
  };
};

/**
 * 执行单个动作并返回结果摘要
 */
async function executeAction(actionObj: any, request: NextRequest, pendingEdits: PendingEdit[]): Promise<string> {
  const actionType = actionObj.action;
  
  try {
    if (actionType === "generateMotionVideo") {
      const origin = request.nextUrl.origin;
      const response = await fetch(`${origin}/api/generate-motion-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionObj.data || {}),
        dispatcher: longTimeoutDispatcher,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Agent] Motion render failed:", errText);
        return `❌ 动画生成失败: ${errText.substring(0, 100)}`;
      }

      const result = await response.json();
      if (result?.filePath) {
        // 等待 500ms 确保视频文件完全写入磁盘
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 验证文件确实存在且可读
        if (!fs.existsSync(result.filePath)) {
          console.error(`[Agent] Generated video file not found: ${result.filePath}`);
          return `❌ 视频文件未找到`;
        }
        
        // 直接更新项目快照，导入视频到时间轴
        try {
          const snapshot = loadSnapshot();
          if (!snapshot) {
            return `❌ 无法加载项目快照`;
          }

          // 确保有 assets 和 tracks 数组
          if (!snapshot.assets) snapshot.assets = [];
          if (!snapshot.tracks) snapshot.tracks = [];

          // 查找或创建 Main Track
          let mainTrack = snapshot.tracks.find((t: any) => t.isMain || t.name === "Main Track");
          if (!mainTrack) {
            mainTrack = {
              id: "main-track",
              name: "Main Track",
              type: "media",
              elements: [],
              muted: false,
              isMain: true,
            };
            snapshot.tracks.push(mainTrack);
          }

          // 添加到 assets
          const assetId = `asset_motion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const cacheBuster = Date.now(); // 缓存破坏参数
          const asset = {
            id: assetId,
            name: result.name || "Motion Video",
            type: "video",
            url: `/api/media/serve?path=${encodeURIComponent(result.filePath)}&cb=${cacheBuster}`,
            thumbnailUrl: `/api/media/serve?path=${encodeURIComponent(result.filePath)}&cb=${cacheBuster}`,
            filePath: result.filePath,
            duration: result.duration || 5,
            isLinked: true,
          };
          snapshot.assets.push(asset);

          // 添加到 Main Track
          const elementId = `element_motion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const element = {
            id: elementId,
            type: "media",
            mediaId: assetId,
            startTime: actionObj.data?.startTime ?? 0,
            duration: result.duration || 5,
            trimStart: 0,
            trimEnd: 0,
            volume: 1.0,
            name: result.name || "Motion Video",
          };
          mainTrack.elements.push(element);

          // 保存快照
          fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
          console.log(`[Agent] Motion video imported directly to snapshot`);

          return `✅ 已生成动画视频`;
        } catch (error: any) {
          console.error(`[Agent] Error importing motion video to snapshot:`, error);
          return `❌ 导入动画视频失败: ${error.message}`;
        }
      }
      return `⚠️ 动画生成完成但未返回文件`;
    }

    if (actionType === "transcribeMedia") {
      const origin = request.nextUrl.origin;
      const context = resolveMediaContext({
        elementId: actionObj?.data?.elementId,
        mediaId: actionObj?.data?.mediaId,
        mediaName: actionObj?.data?.mediaName,
        preferType: "video",
      });
      
      if (!context?.filePath) {
        return `⚠️ 未找到要转录的媒体文件`;
      }

      const response = await fetch(`${origin}/api/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: context.filePath,
          language: "auto",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return `❌ 语音识别失败: ${errText.substring(0, 100)}`;
      }

      const result = await response.json();
      const segments = Array.isArray(result?.segments) ? result.segments : [];

      if (!segments.length) {
        return `⚠️ 未检测到语音内容`;
      }

      const snapshot = loadSnapshot();
      const element = context.elementId ? findElementById(snapshot, context.elementId)?.element : undefined;
      const trimStart = element?.trimStart ?? 0;
      const trimEnd = element?.trimEnd ?? 0;
      const duration = element?.duration ?? 0;
      const startTime = element?.startTime ?? 0;
      const effectiveDuration = Math.max(0, duration - trimStart - trimEnd);
      const clipStart = trimStart;
      const clipEnd = trimStart + effectiveDuration;

      const subtitles = segments
        .map((s: any) => ({
          text: s.text,
          start: Number(s.start),
          end: Number(s.end),
        }))
        .filter((s: any) => s.text && !Number.isNaN(s.start) && !Number.isNaN(s.end))
        .map((s: any) => {
          if (effectiveDuration > 0) {
            const segStart = Math.max(s.start, clipStart);
            const segEnd = Math.min(s.end, clipEnd);
            if (segEnd <= clipStart || segStart >= clipEnd) return null;
            const mappedStart = startTime + (segStart - trimStart);
            const mappedEnd = startTime + (segEnd - trimStart);
            return {
              text: s.text,
              startTime: mappedStart,
              duration: Math.max(0.1, mappedEnd - mappedStart),
            };
          }
          return {
            text: s.text,
            startTime: startTime + s.start,
            duration: Math.max(0.1, s.end - s.start),
          };
        })
        .filter(Boolean);

      if (subtitles.length) {
        pendingEdits.push({
          id: nanoid(),
          action: "addMultipleSubtitles",
          data: { subtitles },
          timestamp: Date.now(),
          processed: false,
        });
        return `✅ 已生成 ${subtitles.length} 条字幕`;
      }
      return `⚠️ 字幕生成完成但无有效内容`;
    }

    if (actionType === "analyzeBgmBeats") {
      const origin = request.nextUrl.origin;
      const context = resolveMediaContext({
        elementId: actionObj?.data?.elementId,
        mediaId: actionObj?.data?.mediaId,
        mediaName: actionObj?.data?.mediaName,
        preferType: "audio",
      });
      
      if (!context?.filePath) {
        return `⚠️ 未找到要分析的音频文件`;
      }

      const response = await fetch(`${origin}/api/analyze-beats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: context.filePath }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return `❌ 节拍分析失败: ${errText.substring(0, 100)}`;
      }

      const result = await response.json();
      const times = Array.isArray(result?.beats) ? result.beats : [];
      if (times.length) {
        pendingEdits.push({
          id: nanoid(),
          action: "addMarkers",
          data: { times },
          timestamp: Date.now(),
          processed: false,
        });
        return `✅ 已分析节拍，找到 ${times.length} 个节奏点`;
      }
      return `⚠️ 未检测到明显节拍`;
    }

    if (actionType === "generateTTS") {
      const origin = request.nextUrl.origin;
      const textElements = Array.isArray(actionObj?.data?.textElements)
        ? actionObj.data.textElements
        : actionObj?.data?.text
          ? [{
            content: actionObj.data.text,
            startTime: actionObj.data.startTime ?? 0,
            duration: actionObj.data.duration,
            voiceId: actionObj.data.voiceId,
          }]
          : [];
      
      if (!textElements.length) {
        return `⚠️ 未提供要转换的文本`;
      }

      const response = await fetch(`${origin}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textElements }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return `❌ 语音合成失败: ${errText.substring(0, 100)}`;
      }

      const result = await response.json();
      const items = Array.isArray(result?.items) ? result.items : [];
      if (!items.length) {
        return `⚠️ 语音合成完成但无输出`;
      }

      // 直接更新项目快照，导入音频到时间轴
      try {
        const snapshot = loadSnapshot();
        if (!snapshot) {
          return `❌ 无法加载项目快照`;
        }

        // 确保有 assets 数组
        if (!snapshot.assets) {
          snapshot.assets = [];
        }

        // 确保有 tracks 数组
        if (!snapshot.tracks) {
          snapshot.tracks = [];
        }

        // 查找或创建 Narration Track
        let narrationTrack = snapshot.tracks.find((t: any) => t.name === "Narration Track" || t.type === "narration");
        if (!narrationTrack) {
          narrationTrack = {
            id: `narration-track-${Date.now()}`,
            name: "Narration Track",
            type: "audio",
            elements: [],
            muted: false,
          };
          snapshot.tracks.push(narrationTrack);
        }

        // 导入每个 TTS 音频
        for (const item of items) {
          if (!item?.filePath) continue;

          // 添加到 assets
          const assetId = `asset_tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const asset = {
            id: assetId,
            name: item.name || "TTS Audio",
            type: "audio",
            url: `/api/media/serve?path=${encodeURIComponent(item.filePath)}`,
            thumbnailUrl: `/api/media/serve?path=${encodeURIComponent(item.filePath)}`,
            filePath: item.filePath,
            duration: item.duration || 10,
            isLinked: true,
          };
          snapshot.assets.push(asset);

          // 添加到 Narration Track
          const elementId = `element_tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const element = {
            id: elementId,
            type: "media",
            mediaId: assetId,
            startTime: item.startTime ?? 0,
            duration: item.duration || 10,
            trimStart: 0,
            trimEnd: 0,
            volume: 1.0,
            name: item.name || "TTS Audio",
          };
          narrationTrack.elements.push(element);
        }

        // 保存快照
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
        console.log(`[Agent] TTS audio imported directly to snapshot`);

        return `✅ 已生成旁白并添加到时间轴`;
      } catch (error: any) {
        console.error(`[Agent] Error importing TTS to snapshot:`, error);
        return `❌ 导入语音失败: ${error.message}`;
      }
    }

    if (actionType === "autoclip") {
      const origin = request.nextUrl.origin;
      const scriptName = actionObj?.data?.scriptName || "beginner_edit_auto.py";
      
      try {
        const response = await fetch(`${origin}/api/automation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scriptName })
        });

        if (!response.ok) {
          const errText = await response.text();
          return `❌ 自动剪辑失败: ${errText.substring(0, 100)}`;
        }

        return `✅ 已完成自动剪辑`;
      } catch (error: any) {
        console.error("Agent failed to trigger autoclip", error);
        return `❌ 自动剪辑失败: ${error.message}`;
      }
    }

    if (actionType === "runAutomationScript") {
      const origin = request.nextUrl.origin;
      fetch(`${origin}/api/automation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptName: actionObj.data.scriptName })
      }).catch(err => console.error("Agent failed to trigger script", err));
      return `✅ 已执行自动化处理`;
    }

    if (actionType === "importMedia" || actionType === "importAudio" || actionType === "importVideo" || actionType === "importImage") {
      const origin = request.nextUrl.origin;
      const originalPath = actionObj?.data?.filePath;
      const resolvedPath = resolveExistingPath(originalPath);
      
      if (!resolvedPath) {
        return `⚠️ 文件不存在: ${originalPath}`;
      }
      
      // 直接通过 API 导入，不经过 pending edits
      try {
        const response = await fetch(`${origin}/api/ai-edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: actionObj.action,
            data: {
              ...actionObj.data,
              filePath: resolvedPath
            }
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          return `❌ 导入失败: ${errText.substring(0, 100)}`;
        }

        const result = await response.json();
        const mediaType = actionType === 'importAudio' ? '音频' : 
                         actionType === 'importVideo' ? '视频' : 
                         actionType === 'importImage' ? '图片' : '媒体';
        return `✅ 已导入${mediaType}`;
      } catch (error: any) {
        return `❌ 导入失败: ${error.message}`;
      }
    }

    // 其他动作直接加入队列
    const newEdit: PendingEdit = {
      id: nanoid(),
      action: actionObj.action,
      data: actionObj.data,
      timestamp: Date.now(),
      processed: false,
    };
    pendingEdits.push(newEdit);
    
    // 返回友好的动作描述（不显示技术细节）
    const actionDescriptions: Record<string, string> = {
      addText: `已添加文本`,
      updateElement: `已调整元素`,
      removeElement: `已删除元素`,
      splitElement: `已分割元素`,
      clearSubtitles: `已清除字幕`,
      importMedia: `已导入素材`,
      importAudio: `已导入音频`,
    };
    
    return `✅ ${actionDescriptions[actionType] || "操作完成"}`;
  } catch (error: any) {
    console.error(`[Agent] Error executing ${actionType}:`, error);
    return `❌ ${actionType} 执行失败: ${error.message}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, videoAgentMode, directActions } = body;
    const url = new URL(request.url);
    const modeFromQuery = url.searchParams.get("mode") || "basic";
    
    // 优先使用 body 中的 videoAgentMode，其次使用 query 参数
    const mode = videoAgentMode || modeFromQuery;
    
    console.log(`[Agent Chat] Processing: "${message?.substring(0, 50) || 'directActions'}" (mode: ${mode})`);

    // 处理直接动作请求（来自 VideoAgent 面板）
    if (directActions && Array.isArray(directActions) && directActions.length > 0) {
      console.log(`[Agent Chat] Direct actions: ${directActions.length} actions`);
      
      const pendingEdits = loadPendingEdits();
      const results: string[] = [];
      
      for (const actionObj of directActions) {
        try {
          const result = await executeAction(actionObj, request, pendingEdits);
          results.push(result);
        } catch (error: any) {
          results.push(`❌ ${actionObj.action} 失败: ${error.message}`);
        }
      }
      
      // 保存所有编辑
      savePendingEdits(pendingEdits);
      
      return NextResponse.json({
        success: true,
        results,
        message: `已执行 ${directActions.length} 个动作`,
      });
    }

    // --- 意图分类 ---
    // 对用户消息进行意图分类：video_content / editing / other
    const intentResult = classifyIntent(message);
    console.log(`[Agent Chat] Intent: ${intentResult.intent} (confidence: ${intentResult.confidence})`);

    // 如果是视频内容相关问题，加载视频摘要作为上下文
    if (intentResult.intent === "video_content") {
      const projectId = resolveProjectId();
      const summaries = loadVideoSummaries(projectId);
      
      if (summaries.length > 0) {
        const videoContext = buildVideoContentContext(summaries);
        
        // 构建带上下文的回答
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: "正在分析视频内容..." })}\n\n`));
              
              // 使用 agent 的直接回答能力，将视频摘要作为上下文
              const contextualMessage = `根据以下视频内容信息回答用户的问题。\n\n${videoContext}\n\n用户问题：${message}`;
              
              const agentInstance = new VideoEditorAgent("understand");
              const generator = agentInstance.processStream(contextualMessage);
              
              for await (const chunk of generator) {
                if (chunk.type === 'phase') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: chunk.content })}\n\n`));
                } else if (chunk.type === 'answer') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ answer: chunk.content })}\n\n`));
                } else if (chunk.type === 'thinking') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ thinking: chunk.content })}\n\n`));
                }
              }
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, hasAction: false })}\n\n`));
              controller.close();
            } catch (err: any) {
              console.error("[Agent Chat] Video content error:", err);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ answer: `抱歉，分析视频内容时出错了: ${err.message}` })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, hasAction: false })}\n\n`));
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
        // 没有视频摘要，提示用户
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              answer: "当前项目没有可用的视频摘要。请先导入视频素材，系统会自动分析视频内容。\n\n💡 提示：导入视频后，你可以问我：\n- 这个视频讲了什么？\n- 视频里有哪些人物？\n- 视频的主题是什么？" 
            })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, hasAction: false })}\n\n`));
            controller.close();
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    }

    // --- 编辑或其他意图 ---
    // 根据模式创建不同的 agent
    // mode 可以是: "basic" | "understand" | "edit" | "create" | "videoagent"（兼容旧版）
    let agentInstance;
    if (mode === "basic") {
      agentInstance = agent;  // 使用默认 agent
    } else if (mode === "videoagent") {
      // 兼容旧版 videoagent 模式，自动检测
      agentInstance = new VideoEditorAgent();
    } else {
      // 新版模式化调用: understand, edit, create
      agentInstance = new VideoEditorAgent(mode as "understand" | "edit" | "create");
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = agentInstance.processStream(message);
          const pendingEdits = loadPendingEdits();
          
          let actions: any[] = [];
          let currentPhase = "";

          for await (const chunk of generator) {
            if (chunk.type === 'phase') {
              currentPhase = chunk.content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase: chunk.content })}\n\n`));
            } else if (chunk.type === 'answer') {
              // 直接回答模式（不需要工具）
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ answer: chunk.content })}\n\n`));
            } else if (chunk.type === 'thinking') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ thinking: chunk.content })}\n\n`));
            } else if (chunk.type === 'plan') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ plan: chunk.content })}\n\n`));
            } else if (chunk.type === 'editPlan') {
              // VideoAgent 返回的 EditPlan，发送给前端显示
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                editPlan: chunk.content,
                phase: `EditPlan 已生成，正在落实到时间轴...`
              })}\n\n`));
            } else if (chunk.type === 'actions') {
              actions = chunk.content as any[];
              
              // 开始逐个执行动作
              if (actions.length > 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  execution: { 
                    phase: "start", 
                    total: actions.length,
                    message: `开始执行 ${actions.length} 个动作...`
                  } 
                })}\n\n`));

                for (let i = 0; i < actions.length; i++) {
                  const actionObj = actions[i];
                  const actionName = actionObj.action;
                  
                  // 发送当前执行的动作
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    execution: { 
                      phase: "executing", 
                      current: i + 1,
                      total: actions.length,
                      action: actionName,
                      message: `正在执行: ${actionName} (${i + 1}/${actions.length})`
                    } 
                  })}\n\n`));

                  // 执行动作
                  const result = await executeAction(actionObj, request, pendingEdits);
                  
                  // 发送执行结果
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    execution: { 
                      phase: "completed", 
                      current: i + 1,
                      total: actions.length,
                      action: actionName,
                      result: result
                    } 
                  })}\n\n`));
                }

                // 保存所有编辑
                savePendingEdits(pendingEdits);
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  execution: { 
                    phase: "finished", 
                    total: actions.length,
                    message: `所有动作执行完成！`
                  } 
                })}\n\n`));
              }
            }
          }
          
          // 发送结束标志
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            done: true, 
            hasAction: actions.length > 0 
          })}\n\n`));
          controller.close();
        } catch (err: any) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("[Agent Chat] Error:", error);
    return NextResponse.json({ 
      reply: `抱歉，Agent 处理遇到一点障碍: ${error.message}`
    }, { status: 500 });
  }
}

function loadPendingEdits(): PendingEdit[] {
  try {
    if (fs.existsSync(PENDING_EDITS_FILE)) {
      return JSON.parse(fs.readFileSync(PENDING_EDITS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load pending edits", e);
  }
  return [];
}

function savePendingEdits(edits: PendingEdit[]) {
  try {
    if (!fs.existsSync(EDITS_DIR)) {
      fs.mkdirSync(EDITS_DIR, { recursive: true });
    }
    fs.writeFileSync(PENDING_EDITS_FILE, JSON.stringify(edits, null, 2));
  } catch (e) {
    console.error("Failed to save pending edits", e);
  }
}
