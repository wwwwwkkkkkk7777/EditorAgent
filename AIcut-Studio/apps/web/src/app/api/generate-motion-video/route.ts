import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { nanoid } from "nanoid";
import { examples } from "@/server/examples";
import { detectSkillsFromKeywords, getCombinedSkillContent, type SkillName } from "@/server/skills";

export const maxDuration = 300; // 5 minutes
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an expert in generating React components for Remotion animations.

## COMPONENT STRUCTURE

1. Start with ES6 imports
2. Export as: export const MyAnimation = () => { ... };
3. Component body order:
   - Hooks (useCurrentFrame, useVideoConfig, etc.)
   - Constants (COLORS, TEXT, TIMING, LAYOUT) - all UPPER_SNAKE_CASE
   - Calculations and derived values
   - return JSX

## CONSTANTS RULES (CRITICAL)

ALL constants MUST be defined INSIDE the component body, AFTER hooks:
- Colors: const COLOR_TEXT = "#000000";
- Text: const TITLE_TEXT = "Hello World";
- Timing: const FADE_DURATION = 20;
- Layout: const PADDING = 40;

This allows users to easily customize the animation.

## LAYOUT RULES

- Use full width of container with appropriate padding
- Never constrain content to a small centered box
- Use Math.max(minValue, Math.round(width * percentage)) for responsive sizing

## ANIMATION RULES

- Prefer spring() for organic motion (entrances, bounces, scaling)
- Use interpolate() for linear progress (progress bars, opacity fades)
- Always use { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
- Add stagger delays for multiple elements

## INTERPOLATE RULES (CRITICAL)

**ALWAYS ensure inputRange and outputRange have the SAME length:**

✅ CORRECT:
interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
interpolate(frame, [0, 15, 30], [0, 1, 0.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })

❌ WRONG (will crash):
interpolate(frame, [0, 30], [0, 1, 0.5], ...) // 2 inputs, 3 outputs - ERROR!
interpolate(frame, [0, 15, 30], [0, 1], ...) // 3 inputs, 2 outputs - ERROR!

**If you need a fade-in-then-fade-out effect:**
- Use 3 values in BOTH arrays: [startFrame, peakFrame, endFrame] → [0, 1, 0.7]
- NOT 2 values in input and 3 in output

## BACKGROUND RULES (CRITICAL - READ CAREFULLY)

The video will be rendered with TRANSPARENCY support (alpha channel).

1. Root container (AbsoluteFill): Use backgroundColor: "transparent"
2. All visible elements (characters, shapes, text, etc.): Use SOLID COLORS with hex codes

## AVAILABLE IMPORTS

import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring, Sequence } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { Circle, Rect, Triangle, Star, Ellipse, Pie } from "@remotion/shapes";
import { ThreeCanvas } from "@remotion/three";
import { useState, useEffect } from "react";

## THREE.JS CANVAS RULES (CRITICAL)

When using ThreeCanvas from @remotion/three:

1. ALWAYS get width and height from useVideoConfig():
   const { width, height } = useVideoConfig();

2. ALWAYS pass width and height as props:
   <ThreeCanvas width={width} height={height}>

3. ThreeCanvas requires these props to be numbers, not undefined

Example pattern:
  export const My3DAnimation = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();
    
    return (
      <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
        <ThreeCanvas width={width} height={height}>
          {/* Your 3D scene here */}
        </ThreeCanvas>
      </AbsoluteFill>
    );
  };

## RESERVED NAMES (CRITICAL)

NEVER use these as variable names - they shadow imports:
- spring, interpolate, useCurrentFrame, useVideoConfig, AbsoluteFill, Sequence

## STYLING RULES

- Use inline styles only
- ALWAYS use fontFamily: 'Inter, sans-serif'
- Keep colors minimal (2-4 max)
- ALWAYS set backgroundColor on AbsoluteFill from frame 0 - never fade in backgrounds

## MOTION REQUIREMENT

- The animation MUST change over time and use useCurrentFrame and/or spring/interpolate (no static frames)

## OUTPUT FORMAT (CRITICAL)

- Output ONLY code - no explanations, no questions
- Response must start with "import" and end with "};"
- If prompt is ambiguous, make a reasonable choice - do not ask for clarification
- The output MUST directly reflect the user's description; do not return unrelated abstract shapes
`;

const buildExamplesSection = (detectedSkills: SkillName[]): string => {
  const relevantExamples = examples.filter((ex) => {
    if (detectedSkills.includes("charts") && ex.category === "Charts") return true;
    if (detectedSkills.includes("typography") && ex.category === "Text") return true;
    if (detectedSkills.includes("characters") && ex.category === "Characters") return true;
    if (detectedSkills.includes("animation") && ex.category === "Animation") return true;
    return false;
  });

  if (relevantExamples.length === 0) {
    const fallback = examples.find((e) => e.id === "cute-dog");
    if (fallback) {
      return `## REFERENCE EXAMPLE\n\n\`\`\`tsx\n${fallback.code}\n\`\`\``;
    }
    return "";
  }

  const exampleCode = relevantExamples
    .slice(0, 2)
    .map((ex) => `### ${ex.name}\n\`\`\`tsx\n${ex.code}\n\`\`\``)
    .join("\n\n");

  return `## REFERENCE EXAMPLES\n\n${exampleCode}`;
};

const WORKSPACE_ROOT = path.resolve(process.cwd(), "../../../");
const SNAPSHOT_FILE = path.join(WORKSPACE_ROOT, "ai_workspace", "project-snapshot.json");

const generateCode = async (prompt: string, model: string) => {
  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DASHSCOPE_API_KEY or OPENAI_API_KEY");
  }

  const detectedSkills = detectSkillsFromKeywords(prompt);
  const skillContent = getCombinedSkillContent(detectedSkills);
  const examplesSection = buildExamplesSection(detectedSkills);

  const enhancedSystemPrompt = `${SYSTEM_PROMPT}

## SKILL-SPECIFIC GUIDANCE
${skillContent || ""}

${examplesSection}

## YOUR TASK

Generate a Remotion component that closely matches the user's request.
Remember: Root background transparent; elements use solid colors.
`;

  const response = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Model error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Model returned empty content");
  }
  return content;
};

const sanitizeGeneratedCode = (raw: string) => {
  let code = raw.trim();
  if (code.includes("```")) {
    const match = code.match(/```(?:tsx?|javascript)?\s*([\s\S]*?)```/i);
    if (match) {
      code = match[1].trim();
    }
  }
  return code;
};

const ensureRemotionImports = (code: string) => {
  const needed = new Set<string>();
  if (/\bAbsoluteFill\b/.test(code)) needed.add("AbsoluteFill");
  if (/\buseCurrentFrame\b/.test(code)) needed.add("useCurrentFrame");
  if (/\buseVideoConfig\b/.test(code)) needed.add("useVideoConfig");
  if (/\binterpolate\s*\(/.test(code)) needed.add("interpolate");
  if (/\bspring\s*\(/.test(code)) needed.add("spring");
  if (/\bSequence\b/.test(code)) needed.add("Sequence");

  if (needed.size === 0) return code;

  const importRegex = /import\s+\{([^}]+)\}\s+from\s+["']remotion["'];?/;
  const match = code.match(importRegex);
  if (match) {
    const existing = new Set(
      match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    for (const item of needed) existing.add(item);
    const merged = Array.from(existing).join(", ");
    return code.replace(importRegex, `import { ${merged} } from "remotion";`);
  }

  const importLine = `import { ${Array.from(needed).join(", ")} } from "remotion";\n`;
  return importLine + code;
};

const forceTransparentBackgrounds = (code: string) => {
  return code
    .replace(/backgroundColor:\s*['"`]#[a-fA-F0-9]{3,8}['"`]/g, "backgroundColor: 'transparent'")
    .replace(
      /backgroundColor:\s*['"`](?:white|black|gray|grey|red|blue|green|yellow|orange|purple|pink|brown|beige|cream|ivory|snow|aliceblue|antiquewhite|aqua|aquamarine|azure|bisque|blanchedalmond|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|greenyellow|honeydew|hotpink|indianred|indigo|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|plum|powderblue|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|whitesmoke|yellowgreen)['"`]/gi,
      "backgroundColor: 'transparent'",
    )
    .replace(/backgroundColor:\s*['"`]rgb\([^)]+\)['"`]/g, "backgroundColor: 'transparent'")
    .replace(/backgroundColor:\s*['"`]rgba\([^)]+\)['"`]/g, "backgroundColor: 'transparent'")
    .replace(/backgroundColor:\s*['"`]hsl\([^)]+\)['"`]/g, "backgroundColor: 'transparent'")
    .replace(/backgroundColor:\s*['"`]hsla\([^)]+\)['"`]/g, "backgroundColor: 'transparent'");
};

/**
 * 自动检测并定义缺失的颜色常量
 */
const fixMissingColorConstants = (code: string): string => {
  // 查找所有使用的 COLOR_ 常量
  const colorConstantRegex = /\b(COLOR_[A-Z_]+)\b/g;
  const usedConstants = new Set<string>();
  let match;
  
  while ((match = colorConstantRegex.exec(code)) !== null) {
    usedConstants.add(match[1]);
  }
  
  if (usedConstants.size === 0) {
    return code;
  }
  
  // 检查哪些常量已经定义
  const definedConstants = new Set<string>();
  for (const constant of usedConstants) {
    const defineRegex = new RegExp(`const\\s+${constant}\\s*=`, 'g');
    if (defineRegex.test(code)) {
      definedConstants.add(constant);
    }
  }
  
  // 找出缺失的常量
  const missingConstants = Array.from(usedConstants).filter(c => !definedConstants.has(c));
  
  if (missingConstants.length === 0) {
    return code;
  }
  
  // 为缺失的常量生成默认颜色定义
  const colorMap: Record<string, string> = {
    COLOR_NEON_GREEN: '#00ff88',
    COLOR_NEON_BLUE: '#00d4ff',
    COLOR_NEON_PURPLE: '#b84fff',
    COLOR_NEON_PINK: '#ff00ff',
    COLOR_NEON_CYAN: '#00ffff',
    COLOR_NEON_YELLOW: '#ffff00',
    COLOR_NEON_ORANGE: '#ff8800',
    COLOR_NEON_RED: '#ff0044',
    COLOR_PRIMARY: '#3b82f6',
    COLOR_SECONDARY: '#8b5cf6',
    COLOR_ACCENT: '#f59e0b',
    COLOR_TEXT: '#ffffff',
    COLOR_BACKGROUND: '#000000',
    COLOR_WHITE: '#ffffff',
    COLOR_BLACK: '#000000',
  };
  
  const constantDefinitions = missingConstants
    .map(constant => {
      const color = colorMap[constant] || '#00ffff'; // 默认青色
      return `  const ${constant} = "${color}";`;
    })
    .join('\n');
  
  // 在组件函数体开始处插入常量定义（在 hooks 之后）
  // 查找第一个 const 或 return 语句的位置
  const componentMatch = code.match(/export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{/);
  if (componentMatch) {
    const insertPos = componentMatch.index! + componentMatch[0].length;
    
    // 查找第一个 useCurrentFrame 或 useVideoConfig 之后的位置
    const hooksRegex = /use(?:CurrentFrame|VideoConfig)\(\);?/g;
    let lastHookPos = insertPos;
    let hookMatch;
    
    while ((hookMatch = hooksRegex.exec(code)) !== null) {
      if (hookMatch.index > insertPos) {
        lastHookPos = hookMatch.index + hookMatch[0].length;
      }
    }
    
    // 在 hooks 之后插入常量定义
    const before = code.substring(0, lastHookPos);
    const after = code.substring(lastHookPos);
    
    return before + '\n\n  // Auto-generated color constants\n' + constantDefinitions + '\n' + after;
  }
  
  return code;
};

const resolveOutputDir = () => {
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf-8"));
      const projectId = snapshot.project?.id;
      if (projectId) {
        return path.join(WORKSPACE_ROOT, "projects", projectId, "assets", "videos");
      }
    }
  } catch (err) {
    console.error("[Motion Render] Failed to resolve project path:", err);
  }

  return path.join(process.cwd(), "public", "materials", "ai-generated");
};

const saveGeneratedComponent = (code: string, fileName: string, durationInFrames: number) => {
  const componentsDir = path.join(process.cwd(), "src/generated/remotion/components");
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  const id = nanoid();
  const uniqueFileName = `${id}-${fileName}`;
  const filePath = path.join(componentsDir, uniqueFileName);
  fs.writeFileSync(filePath, code, "utf-8");
  return { id, fileName: uniqueFileName, filePath, durationInFrames };
};

const createTempRoot = (componentId: string, componentFileName: string, durationInFrames: number, width: number, height: number, transparent: boolean) => {
  const tempRootPath = path.join(process.cwd(), "src/generated/remotion/components", `Root-${componentId}.tsx`);
  const rootContent = `
import React from 'react';
import { AbsoluteFill, Composition, registerRoot } from 'remotion';
import * as Generated from './${componentFileName.replace(".tsx", "")}';

const Comp = (Generated as any).default ?? (Generated as any)[
  Object.keys(Generated).find((k) => typeof (Generated as any)[k] === 'function') as keyof typeof Generated
] as React.FC<any>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Comp"
        component={() => (
          <AbsoluteFill style={{ backgroundColor: ${transparent ? "'transparent'" : "'#000000'"} }}>
            <Comp />
          </AbsoluteFill>
        )}
        durationInFrames={${durationInFrames}}
        fps={30}
        width={${width}}
        height={${height}}
      />
    </>
  );
};

registerRoot(RemotionRoot);
`;
  fs.writeFileSync(tempRootPath, rootContent, "utf-8");
  return tempRootPath;
};

const resolveRemotionBin = () => {
  const isWin = process.platform === "win32";
  const binName = isWin ? "remotion.cmd" : "remotion";
  const candidates = [
    path.join(process.cwd(), "node_modules", ".bin", binName),
    path.join(process.cwd(), "..", "..", "node_modules", ".bin", binName),
    path.join(process.cwd(), "..", "..", "..", "node_modules", ".bin", binName),
    path.join(process.cwd(), "..", "..", "..", "node_modules", ".bin", isWin ? "remotion.CMD" : "remotion"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(process.cwd(), "node_modules", ".bin", binName);
};

const renderWithRemotionCli = (tempRootPath: string, outputPath: string, transparent: boolean) => {
  const isWin = process.platform === "win32";
  const remotionBin = resolveRemotionBin();

  // 优化编码参数以平衡质量、文件大小和播放性能：
  // - h264: 最佳兼容性和硬件加速支持
  // - crf=20: 高质量但合理的压缩率
  // - every-nth-frame=5: 每 5 帧一个关键帧（约 0.17 秒），平衡文件大小和解码性能
  // - pixel-format=yuv420p: 标准像素格式，兼容性最好
  // - x264-preset=medium: 使用 medium 预设，优化编码效率
  const command = `"${remotionBin}" render "${tempRootPath}" Comp "${outputPath}" --codec=h264 --crf=20 --every-nth-frame=5 --pixel-format=yuv420p --x264-preset=medium --yes`;

  execSync(command, {
    cwd: process.cwd(),
    encoding: "utf-8",
    windowsHide: true,
    shell: isWin ? "cmd.exe" : undefined,
  });
};

export async function POST(request: Request) {
  try {
    const {
      prompt,
      durationInFrames = 300,
      fps = 30,
      width = 1920,
      height = 1080,
      model = "qwen-plus",
    } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const outputDir = resolveOutputDir();
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const rawCode = await generateCode(prompt, model);
    const code = fixMissingColorConstants(
      forceTransparentBackgrounds(
        ensureRemotionImports(sanitizeGeneratedCode(rawCode))
      )
    );
    const componentMatch = code.match(/export\s+const\s+(\w+)/);
    const componentName = componentMatch?.[1] ?? "GeneratedAnimation";
    const componentFile = `${componentName}.tsx`;
    const component = saveGeneratedComponent(code, componentFile, durationInFrames);

    const tempRootPath = createTempRoot(
      component.id,
      component.fileName,
      durationInFrames,
      width,
      height,
      true,
    );

    const ext = "mp4";
    const outputPath = path.join(outputDir, `${component.id}.${ext}`);

    try {
      renderWithRemotionCli(tempRootPath, outputPath, true);
    } finally {
      try {
        fs.unlinkSync(tempRootPath);
      } catch (e) {
        console.warn("[Motion Render] Failed to cleanup temp root:", e);
      }
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error("Render finished but output file was not found.");
    }

    // 计算视频实际时长（秒）
    const durationInSeconds = durationInFrames / fps;

    const urlPath = `/api/media/serve?path=${encodeURIComponent(outputPath)}`;
    return NextResponse.json({
      url: urlPath,
      name: path.basename(outputPath),
      filePath: outputPath,
      type: "video",
      format: ext,
      duration: durationInSeconds, // 添加时长信息
    });
  } catch (error: any) {
    console.error("[Motion Render] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
