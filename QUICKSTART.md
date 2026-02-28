# Quick Start Guide

## First Time Setup

### 1. Sync Your Existing Skills
Run the **Sync Skills** command from Raycast to:
- Copy your existing skills from `~/.codex/skills` to `~/agents/skills`
- Create symlinks to maintain compatibility with Codex

```bash
# What this does:
~/.codex/skills/playwright/ → copied to → ~/agents/skills/playwright/
~/.codex/skills/playwright/ → becomes symlink → ~/agents/skills/playwright/
```

### 2. Verify Setup
Run **Manage Agents** to see:
- All skills in your central folder
- All skills in your Codex folder (now symlinks)
- Validation status of each skill

## Daily Workflows

### Import a Skill from GitHub

1. Open Raycast → **Import Skill from GitHub**
2. Paste a GitHub URL:
   ```
   https://github.com/username/repo/tree/main/skills/my-skill
   ```
   or shorthand:
   ```
   username/repo/skills/my-skill
   ```
3. Check "Create symlink to Codex" (recommended)
4. Hit Enter

The skill is now:
- ✅ Stored in `~/agents/skills/my-skill/`
- ✅ Linked from `~/.codex/skills/my-skill/`
- ✅ Available to all your coding agents

### Create a Raycast Snippet

1. Open Raycast → **List Skills**
2. Select a skill
3. Press **⌘S** (Create Raycast Snippet)
4. Paste the deeplink in your browser
5. Skill is now a snippet with keyword `!skill-name`

### Distribute Skills to a Project

1. Open Raycast → **Distribute Skills**
2. Enter project path: `~/projects/my-app`
3. Select target agents:
   - ✓ Cursor (.cursorrules)
   - ✓ Windsurf (.windsurfrules)
   - ✓ GitHub Copilot (.github/copilot-instructions.md)
   - ✓ Claude (CLAUDE.md)
   - ✓ Aider (.aider.conf.yml)
4. Hit Enter

Skills are now injected into your project's agent config files!

## Pro Tips

### GitHub Private Repositories
1. Open Raycast Settings → Extensions → Skill Manager
2. Add your GitHub Personal Access Token
3. Now you can import skills from private repos

### Organizing Skills
```
~/agents/skills/
├── typescript/          # Language-specific skills
│   └── SKILL.md
├── react-hooks/         # Framework skills
│   └── SKILL.md
├── security/            # Practice skills
│   └── SKILL.md
└── my-custom-skill/     # Your own skills
    ├── SKILL.md
    ├── examples/
    └── templates/
```

### Keeping Skills Updated
Skills are stored as folders, so you can:
- Edit them directly in `~/agents/skills/`
- Use git to version control your skills folder
- Share your entire skills folder with teammates

### Troubleshooting

**Skills not showing in Codex?**
- Run **Sync Skills** again to recreate symlinks

**Import fails from GitHub?**
- Check the URL format
- Add GitHub token for private repos
- Verify SKILL.md exists in the target folder

**Skills not distributing?**
- Verify project path is correct
- Check file permissions
- Look for errors in the distribution result

## Next Steps

- Browse existing skills: `~/.codex/skills/`
- Create custom skills in: `~/agents/skills/`
- Share skills via GitHub for team use
- Build a personal skill library over time

## Supported URL Formats

```bash
# Full GitHub URLs
https://github.com/owner/repo/tree/main/path/to/skill
https://github.com/owner/repo/blob/main/path/SKILL.md

# Shorthand (defaults to 'main' branch)
owner/repo/path/to/skill

# Examples
https://github.com/myteam/skills/tree/main/typescript
myteam/skills/react-hooks
```

## Architecture Diagram

```
GitHub Repository
      ↓
[ Import Skill from GitHub ]
      ↓
~/agents/skills/          ← Source of Truth
      ↓ (symlinks)
~/.codex/skills/          ← Codex Integration
      ↓
[ Distribute Skills ]
      ↓
Project Config Files
  ├── .cursorrules
  ├── .windsurfrules
  ├── .github/copilot-instructions.md
  ├── CLAUDE.md
  └── .aider.conf.yml
```
