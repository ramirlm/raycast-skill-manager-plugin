import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import { Skill } from "./skills";

export interface AgentTarget {
  /** Human-readable name shown in the UI */
  label: string;
  /** Short ID used in preferences / storage */
  id: string;
  /** Resolved absolute path (may contain ~ expanded) */
  resolvePath: (projectRoot: string) => string;
}

/** Well-known coding agent configuration targets */
export const AGENT_TARGETS: AgentTarget[] = [
  {
    id: "cursor",
    label: "Cursor (.cursorrules)",
    resolvePath: (root) => path.join(root, ".cursorrules"),
  },
  {
    id: "windsurf",
    label: "Windsurf (.windsurfrules)",
    resolvePath: (root) => path.join(root, ".windsurfrules"),
  },
  {
    id: "copilot",
    label: "GitHub Copilot (.github/copilot-instructions.md)",
    resolvePath: (root) => path.join(root, ".github", "copilot-instructions.md"),
  },
  {
    id: "claude",
    label: "Claude (CLAUDE.md)",
    resolvePath: (root) => path.join(root, "CLAUDE.md"),
  },
  {
    id: "aider",
    label: "Aider (.aider.conf.yml – conventions section)",
    resolvePath: (root) => path.join(root, ".aider.conf.yml"),
  },
];

/**
 * Build the skills block that is injected into agent config files.
 */
export function buildSkillsBlock(skills: Skill[]): string {
  const lines: string[] = ["<!-- skills-manager:start -->", "## Coding Skills\n"];
  for (const skill of skills) {
    lines.push(`### ${skill.name}`);
    if (skill.tags.length > 0) {
      lines.push(`_Tags: ${skill.tags.join(", ")}_\n`);
    }
    lines.push(skill.description, "");
  }
  lines.push("<!-- skills-manager:end -->");
  return lines.join("\n");
}

const SKILLS_BLOCK_RE = /<!-- skills-manager:start -->[\s\S]*?<!-- skills-manager:end -->/;

/**
 * Inject or update the skills block inside an existing file's content.
 * If the block already exists it is replaced; otherwise it is appended.
 */
export function injectSkillsBlock(existingContent: string, skillsBlock: string): string {
  if (SKILLS_BLOCK_RE.test(existingContent)) {
    return existingContent.replace(SKILLS_BLOCK_RE, skillsBlock);
  }
  const separator = existingContent.endsWith("\n") ? "\n" : "\n\n";
  return existingContent + separator + skillsBlock + "\n";
}

/**
 * Distribute skills to a given agent target file.
 * Creates intermediate directories if needed.
 */
export async function distributeToTarget(
  target: AgentTarget,
  projectRoot: string,
  skills: Skill[],
): Promise<void> {
  const filePath = target.resolvePath(projectRoot);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  let existing = "";
  try {
    existing = await fs.readFile(filePath, "utf8");
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  const block = buildSkillsBlock(skills);
  const updated = injectSkillsBlock(existing, block);
  await fs.writeFile(filePath, updated, "utf8");
}

/**
 * Expand a path that may start with ~.
 */
export function expandHome(p: string): string {
  return p.replace(/^~/, homedir());
}
