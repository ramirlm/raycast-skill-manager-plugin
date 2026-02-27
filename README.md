# Raycast Skill Manager Plugin

A Raycast extension to manage a central `skills.md` file, distribute skill definitions to popular coding-agent configuration files, and create Raycast snippets from individual skills.

## Features

### Commands

| Command | Description |
|---|---|
| **List Skills** | Browse, search, and manage all skills. Supports creating Raycast snippets and copying skill text. |
| **Add Skill** | Create a new skill or edit an existing one with a name, Markdown description, and optional tags. |
| **Distribute Skills** | Inject your skills into one or more coding-agent config files inside any project directory. |

### Supported Coding Agent Targets

- **Cursor** – `.cursorrules`
- **Windsurf** – `.windsurfrules`
- **GitHub Copilot** – `.github/copilot-instructions.md`
- **Claude** – `CLAUDE.md`
- **Aider** – `.aider.conf.yml`

## skills.md Format

```markdown
# Skills

## TypeScript
[tags: frontend, typing]
Use strict TypeScript. Prefer `unknown` over `any`. Always type function return values.

## TDD
[tags: testing, workflow]
Write tests before implementation. Use the red–green–refactor cycle.
```

Each skill starts with a level-2 heading (`##`). Tags are optional and follow the pattern `[tags: tag1, tag2]`.

## Raycast Snippets

Select a skill in the **List Skills** command and press **⌘S** to generate a Raycast snippet import deeplink. Paste the deeplink in your browser to instantly import the skill as a snippet with the keyword `!skill-name`.

## Preferences

| Preference | Default | Description |
|---|---|---|
| `skillsFilePath` | `~/skills.md` | Absolute or `~`-relative path to your central skills file. |

## Development

```bash
npm install
npm run dev     # Live-reload development
npm run build   # Production build
npm run lint    # Lint sources
```
