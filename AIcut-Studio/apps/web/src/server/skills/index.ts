import fs from "fs";
import path from "path";

export const GUIDANCE_SKILLS = [
  "charts",
  "typography",
  "animation",
  "shapes",
  "characters",
] as const;

export type SkillName = (typeof GUIDANCE_SKILLS)[number];

function loadSkillContent(skillName: string): string {
  try {
    const filePath = path.join(process.cwd(), "src/server/skills", `${skillName}.md`);
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.warn(`Failed to load skill: ${skillName}`, error);
    return "";
  }
}

const skillCache: Map<string, string> = new Map();

export function getSkillContent(skillName: SkillName): string {
  if (skillCache.has(skillName)) {
    return skillCache.get(skillName)!;
  }

  const content = loadSkillContent(skillName);
  skillCache.set(skillName, content);
  return content;
}

export function getCombinedSkillContent(skills: SkillName[]): string {
  if (skills.length === 0) {
    return "";
  }

  const contents = skills
    .map((skill) => getSkillContent(skill))
    .filter((content) => content.length > 0);

  return contents.join("\n\n---\n\n");
}

export function getAllSkillsContent(): string {
  return getCombinedSkillContent([...GUIDANCE_SKILLS]);
}

export const SKILL_KEYWORDS: Record<SkillName, string[]> = {
  charts: [
    "chart",
    "graph",
    "bar",
    "pie",
    "data",
    "visualization",
    "histogram",
    "statistics",
    "metrics",
    "counter",
    "数据",
    "图表",
    "柱状图",
    "饼图",
  ],
  typography: ["text", "type", "typewriter", "word", "letter", "title", "headline", "kinetic", "文字", "打字", "标题"],
  animation: ["animate", "motion", "move", "bounce", "spring", "transition", "loop", "动画", "运动", "弹跳"],
  shapes: ["shape", "circle", "square", "rectangle", "star", "triangle", "geometric", "形状", "圆形", "方形"],
  characters: ["dog", "cat", "animal", "character", "cartoon", "cute", "face", "bear", "bird", "狗", "猫", "动物", "卡通", "可爱", "小狗", "小猫", "小熊"],
};

export function detectSkillsFromKeywords(prompt: string): SkillName[] {
  const lowerPrompt = prompt.toLowerCase();
  const detected: SkillName[] = [];

  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some((kw) => lowerPrompt.includes(kw.toLowerCase()))) {
      detected.push(skill as SkillName);
    }
  }

  if (detected.length === 0) {
    detected.push("animation");
  }

  return detected;
}
