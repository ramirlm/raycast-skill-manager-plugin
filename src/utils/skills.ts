import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  skillsFilePath: string;
}

export interface Skill {
  name: string;
  description: string;
  tags: string[];
}

function resolveSkillsFilePath(): string {
  const { skillsFilePath } = getPreferenceValues<Preferences>();
  const resolved = skillsFilePath.replace(/^~/, homedir());
  return path.resolve(resolved);
}

export function getSkillsFilePath(): string {
  return resolveSkillsFilePath();
}

/**
 * Parse a skills.md file into an array of Skill objects.
 *
 * Expected format:
 * ## Skill Name
 * [tags: tag1, tag2]
 * Description text
 */
export function parseSkillsMarkdown(content: string): Skill[] {
  const skills: Skill[] = [];
  // Split on level-2 headings
  const sections = content.split(/^##\s+/m).filter((s) => s.trim().length > 0);

  for (const section of sections) {
    const lines = section.split("\n");
    const name = lines[0].trim();
    if (!name) continue;

    const bodyLines = lines.slice(1);
    let tags: string[] = [];

    // Look for optional [tags: ...] line
    const tagLineIndex = bodyLines.findIndex((l) => /^\[tags:/i.test(l.trim()));
    if (tagLineIndex !== -1) {
      const tagMatch = bodyLines[tagLineIndex].match(/\[tags:\s*([^\]]+)\]/i);
      if (tagMatch) {
        tags = tagMatch[1].split(",").map((t) => t.trim()).filter(Boolean);
      }
      bodyLines.splice(tagLineIndex, 1);
    }

    const description = bodyLines
      .join("\n")
      .trim()
      // Strip leading H1 line if present (e.g. "# Skills")
      .replace(/^#[^#][^\n]*\n?/, "");

    skills.push({ name, description, tags });
  }

  return skills;
}

/**
 * Serialize an array of Skill objects back to skills.md content.
 */
export function serializeSkillsMarkdown(skills: Skill[]): string {
  const header = "# Skills\n\n";
  if (skills.length === 0) return header;

  const body = skills
    .map((skill) => {
      const tagLine = skill.tags.length > 0 ? `[tags: ${skill.tags.join(", ")}]\n` : "";
      return `## ${skill.name}\n${tagLine}${skill.description}\n`;
    })
    .join("\n");

  return header + body;
}

/**
 * Read and parse skills from the configured skills.md path.
 * Creates the file with an empty header if it doesn't exist.
 */
export async function loadSkills(): Promise<Skill[]> {
  const filePath = getSkillsFilePath();
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parseSkillsMarkdown(content);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(filePath, "# Skills\n", "utf8");
      return [];
    }
    throw err;
  }
}

/**
 * Save an array of skills to the configured skills.md path.
 */
export async function saveSkills(skills: Skill[]): Promise<void> {
  const filePath = getSkillsFilePath();
  const content = serializeSkillsMarkdown(skills);
  await fs.writeFile(filePath, content, "utf8");
}

/**
 * Add or update a skill. If a skill with the same name already exists it is replaced.
 */
export async function upsertSkill(skill: Skill): Promise<void> {
  const skills = await loadSkills();
  const index = skills.findIndex((s) => s.name.toLowerCase() === skill.name.toLowerCase());
  if (index !== -1) {
    skills[index] = skill;
  } else {
    skills.push(skill);
  }
  await saveSkills(skills);
}

/**
 * Delete a skill by name.
 */
export async function deleteSkill(name: string): Promise<void> {
  const skills = await loadSkills();
  const updated = skills.filter((s) => s.name.toLowerCase() !== name.toLowerCase());
  await saveSkills(updated);
}
