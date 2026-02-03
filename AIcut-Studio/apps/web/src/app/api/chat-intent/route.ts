/**
 * Chat 意图分类 API
 * 
 * 根据用户消息内容分类意图：
 * - video_content: 询问视频内容相关的问题（使用摘要和转录回答）
 * - editing: 剪辑相关的操作请求（调用剪辑工具）
 * - other: 其他一般性问题（直接 AI 回答）
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

interface ClassificationResult {
  intent: "video_content" | "editing" | "other";
  confidence: number;
  reason: string;
}

/**
 * 分类提示词
 */
const CLASSIFICATION_PROMPT = `你是一个视频编辑助手的意图分类器。根据用户的消息，判断用户的意图属于以下哪一类：

1. **video_content** - 用户在询问视频内容相关的问题，例如：
   - "这个视频讲了什么？"
   - "视频里有哪些人物？"
   - "第3分钟说了什么？"
   - "视频的主题是什么？"
   - "有没有提到XXX？"

2. **editing** - 用户想要执行视频编辑操作，例如：
   - "把这段剪短一点"
   - "添加一个转场效果"
   - "把背景音乐音量调低"
   - "删除开头的10秒"
   - "给视频加个字幕"
   - "根据节奏剪辑"
   - "裁剪视频"

3. **other** - 其他一般性问题或对话，例如：
   - "你好"
   - "怎么使用这个软件？"
   - "什么是视频剪辑？"
   - "推荐一些技巧"

请只返回 JSON 格式的结果，不要有其他文字。格式如下：
{"intent": "video_content" | "editing" | "other", "confidence": 0.0-1.0, "reason": "简短说明理由"}`;

export async function POST(request: NextRequest) {
  try {
    const { message, projectContext } = await request.json();

    if (!message) {
      return NextResponse.json({
        success: false,
        error: "Missing message",
      }, { status: 400 });
    }

    // 如果没有配置 API Key，使用基于规则的分类
    if (!OPENAI_API_KEY) {
      const result = ruleBasedClassification(message);
      return NextResponse.json({
        success: true,
        ...result,
        method: "rule_based",
      });
    }

    // 使用 LLM 进行分类
    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: CLASSIFICATION_PROMPT },
            { role: "user", content: `用户消息: "${message}"${projectContext ? `\n项目上下文: ${projectContext}` : ""}` },
          ],
          temperature: 0.1,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      // 解析 JSON 结果
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as ClassificationResult;
        return NextResponse.json({
          success: true,
          ...result,
          method: "llm",
        });
      } else {
        throw new Error("Failed to parse LLM response");
      }
    } catch (llmError: any) {
      console.warn("[Chat Intent] LLM classification failed, falling back to rule-based:", llmError.message);
      const result = ruleBasedClassification(message);
      return NextResponse.json({
        success: true,
        ...result,
        method: "rule_based_fallback",
      });
    }
  } catch (error: any) {
    console.error("[Chat Intent API] Error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * 基于规则的分类（作为后备方案）
 */
function ruleBasedClassification(message: string): ClassificationResult {
  const lowerMessage = message.toLowerCase();

  // 视频内容相关关键词
  const videoContentKeywords = [
    "视频讲", "视频说", "视频内容", "视频里", "视频中",
    "讲了什么", "说了什么", "有什么", "在说什么", "关于什么",
    "主题是", "人物", "角色", "提到", "出现",
    "几分钟", "第几秒", "什么时候", "哪里说",
    "摘要", "总结", "概述", "大意",
    "transcript", "content", "about", "summary",
  ];

  // 编辑操作相关关键词
  const editingKeywords = [
    "剪辑", "剪切", "裁剪", "删除", "移除",
    "添加", "插入", "加入", "放入",
    "调整", "修改", "改变", "更改",
    "音量", "速度", "亮度", "对比度",
    "转场", "特效", "滤镜", "字幕", "标题",
    "导出", "渲染", "合并", "分割",
    "节奏", "配乐", "配音", "解说",
    "edit", "cut", "trim", "add", "remove",
    "transition", "effect", "subtitle", "export",
  ];

  // 计算匹配分数
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

  // 根据分数判断意图
  if (editingScore > videoContentScore && editingScore > 0) {
    return {
      intent: "editing",
      confidence: Math.min(0.9, 0.5 + editingScore * 0.1),
      reason: `检测到编辑相关关键词 (匹配数: ${editingScore})`,
    };
  } else if (videoContentScore > 0) {
    return {
      intent: "video_content",
      confidence: Math.min(0.9, 0.5 + videoContentScore * 0.1),
      reason: `检测到视频内容相关关键词 (匹配数: ${videoContentScore})`,
    };
  } else {
    return {
      intent: "other",
      confidence: 0.6,
      reason: "未检测到特定意图关键词",
    };
  }
}
