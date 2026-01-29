import { getAllSkillsContent } from "./index";

export function getRemotionSkills(): string {
  try {
    const skillsContent = getAllSkillsContent();
    if (!skillsContent) return "";
    return "\n\n## Remotion Expert Knowledge Base\n" + skillsContent;
  } catch (error) {
    console.error("Error loading skills:", error);
    return "";
  }
}
