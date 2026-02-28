/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Skills File Path - Path to your skills.md file */
  "skillsFilePath": string,
  /** Central Skills Folder - Central folder for skill files (source of truth) */
  "centralSkillsFolder": string,
  /** Codex Skills Folder - Path to .codex/skills folder */
  "codexSkillsFolder": string,
  /** GitHub Personal Access Token - Optional token for accessing private repositories */
  "githubToken"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `list-skills` command */
  export type ListSkills = ExtensionPreferences & {}
  /** Preferences accessible in the `add-skill` command */
  export type AddSkill = ExtensionPreferences & {}
  /** Preferences accessible in the `distribute-skills` command */
  export type DistributeSkills = ExtensionPreferences & {}
  /** Preferences accessible in the `import-skill-from-github` command */
  export type ImportSkillFromGithub = ExtensionPreferences & {}
  /** Preferences accessible in the `import-github-repo-as-skill` command */
  export type ImportGithubRepoAsSkill = ExtensionPreferences & {}
  /** Preferences accessible in the `sync-skills` command */
  export type SyncSkills = ExtensionPreferences & {}
  /** Preferences accessible in the `manage-agents` command */
  export type ManageAgents = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `list-skills` command */
  export type ListSkills = {}
  /** Arguments passed to the `add-skill` command */
  export type AddSkill = {}
  /** Arguments passed to the `distribute-skills` command */
  export type DistributeSkills = {}
  /** Arguments passed to the `import-skill-from-github` command */
  export type ImportSkillFromGithub = {}
  /** Arguments passed to the `import-github-repo-as-skill` command */
  export type ImportGithubRepoAsSkill = {}
  /** Arguments passed to the `sync-skills` command */
  export type SyncSkills = {}
  /** Arguments passed to the `manage-agents` command */
  export type ManageAgents = {}
}

