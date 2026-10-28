# Extend Claude Code — pick the right mechanism, then build it

Checked against the docs of v2.1.302. Full pages: `features-overview`, `memory`, `skills`, `sub-agents`, `hooks-guide`, `hooks`, `mcp`, `plugins/create`, `plugins/create-marketplace` (read with `cc.py read <page>`).

## Which one?

| You want… | Use | Why |
|------|------|------|
| Claude to always know the build/test commands, conventions, "never do X" | **CLAUDE.md** (+ `.claude/rules/*.md`) | Loaded every session. Keep it short (target under 200 lines per file) |
| Rules only for some files (e.g. `src/api/**`) | **Rule with `paths:`** in `.claude/rules/` | Loads only when Claude touches matching files |
| A repeatable procedure, checklist or domain know-how, maybe with scripts | **Skill** (`SKILL.md`) | Only the description sits in context until needed; also a `/command` |
| A side job that reads a lot (search, review, research) without filling your context | **Subagent** | Own context window; returns only a summary |
| Something that must happen *every time*, no matter what the model decides (format after edit, block `rm -rf`, notify) | **Hook** | Deterministic shell/HTTP/prompt action on lifecycle events |
| Access to an outside system (GitHub, DB, Figma, Sentry, browser) | **MCP server** | Adds tools; or just let Claude use a CLI (`gh`, `aws`) — CLIs are often cheaper in context |
| Share any of the above with a team or the world, versioned | **Plugin** in a **marketplace** | One install command; updates with one command |

Rule of thumb: start with CLAUDE.md; when a section grows into a procedure, move it to a skill; when you notice "Claude forgot to …" for something that must never be forgotten, make it a hook.

## CLAUDE.md

- `/init` writes a first version. Then edit: commands to build/test/lint, code style that differs from defaults, repo etiquette, gotchas. Delete anything Claude would do correctly anyway.
- Import other files with `@path/to/file` (up to four hops). Wrap a path in backticks to *not* import it.
- Personal, uncommitted: `CLAUDE.local.md` (git-ignore it). For every project: `~/.claude/CLAUDE.md`.
- Edits apply from the next session (the prompt is cached); `/memory` opens the files.
- Auto memory (Claude's own notes) lives in `~/.claude/projects/<project>/memory/`; say "remember that …" to add, `/memory` to review.

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# API rules
- Validate every request body with zod; return 400 with the zod message.
```
(save as `.claude/rules/api.md`)

## Skill

```bash
mkdir -p .claude/skills/release-notes        # or ~/.claude/skills/… for every project
```

`.claude/skills/release-notes/SKILL.md`:

```markdown
---
name: release-notes
description: Writes release notes from the commits since the last tag. Use when the user asks for release notes, a changelog entry or "what changed since v1.2".
---

## Commits since the last tag
!`git log --oneline $(git describe --tags --abbrev=0)..HEAD`

## Instructions
Group the commits into Added / Changed / Fixed, one line each, in plain words for users. Skip chore/ci commits. Argument (target version, optional): $ARGUMENTS
```

- **description is the trigger**: what it does + when to use it + words users actually say. Front-load it; the listing cuts description(+`when_to_use`) at 1,536 chars.
- Body: steps, not essays. Put long material in `references/*.md` and scripts in `scripts/` next to SKILL.md, and link them — they load only when needed.
- `` !`command` `` runs before Claude sees the skill and inlines the output. `$ARGUMENTS`, `$0`, `$1` take arguments.
- Useful fields: `disable-model-invocation: true` (only you can run it, e.g. deploy), `user-invocable: false` (background knowledge only), `allowed-tools`, `context: fork` (run in a subagent), `paths`, `model`, `effort`. For skills that must also work outside Claude Code (claude.ai upload, Agent Skills spec), use only `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`.
- Test: ask something that should trigger it, and run `/release-notes` directly. `/skills` lists skills, `/reload-skills` picks up new folders, `/skill-doctor` shows cost and usage. Not triggering → make the description more specific; triggering too often → narrower description or `disable-model-invocation`.
- Can't think of the steps? Do the task once with Claude, then say "turn what we just did into a skill".

## Subagent

`.claude/agents/code-reviewer.md` (or `~/.claude/agents/`), or ask Claude to create one:

```markdown
---
name: code-reviewer
description: Reviews a diff for bugs, security and missing tests. Use after code changes, before committing.
tools: Read, Grep, Glob, Bash
model: sonnet
---
You are a strict reviewer. Run `git diff`, read the touched files, and report findings as
file:line — problem — fix, most severe first. Do not edit files.
```

- Fields: `name`, `description` (required); `tools`/`disallowedTools`, `model` (`sonnet`, `opus`, `haiku`, `fable`, full ID, `inherit`), `permissionMode`, `skills` (preload), `memory` (`user`/`project`/`local`), `isolation: worktree`, `background`, `color`.
- Use them for investigation ("use a subagent to find every place we parse dates") — the reading happens in its context, you get the summary.
- Give a subagent only the tools it needs; describe *when* to use it so Claude delegates on its own. Several independent ones can run in parallel.

## Hook

In `.claude/settings.json` (team), `~/.claude/settings.json` (you), or a skill/agent/plugin. `/hooks` shows what is active.

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "npx prettier --write \"$(jq -r '.tool_input.file_path')\"" }] }
    ],
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [{ "type": "command", "if": "Bash(rm *)", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh" }] }
    ],
    "Notification": [
      { "hooks": [{ "type": "command", "command": "osascript -e 'display notification \"Claude needs you\" with title \"Claude Code\"'" }] }
    ]
  }
}
```

- The hook gets JSON on stdin (`tool_name`, `tool_input`, `session_id`, `cwd`, …). Exit 0 = OK; **exit 2 = block** (for PreToolUse) and stderr goes back to Claude as the reason; or print JSON with a decision (`permissionDecision: "deny"`).
- Main events: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `SessionEnd` (about 30 in all — `cc.py read hooks --section "Hook events"`).
- Hook types: `command`, `http`, `prompt` (a model judges), `agent`. `matcher` filters by tool name (regex), `if` by permission-rule syntax.
- Hooks run with your user rights — read any hook you copy from someone else.

## MCP server

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/        # remote HTTP server
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "$DB_URL"    # local process
claude mcp add … --scope project      # writes .mcp.json to commit (default scope: local = only you, this project; user = you, every project)
claude mcp list · claude mcp get github · claude mcp remove github
```

In a session `/mcp` shows status and does OAuth login. Tools appear as `mcp__<server>__<tool>`; allow them in permissions like `"mcp__github__*"`. Many tools cost context — `/context` shows it; turn off unused servers.

## Plugin

A plugin bundles skills, agents, hooks, MCP servers (and more) under one name.

```
my-plugin/
├─ .claude-plugin/plugin.json        {"name": "my-plugin", "version": "1.0.0", "description": "…"}
├─ skills/<skill>/SKILL.md
├─ agents/*.md
├─ hooks/hooks.json
└─ .mcp.json
```

- Try it without installing: `claude --plugin-dir ./my-plugin`. Check it: `claude plugin validate ./my-plugin`.
- Skills in a plugin are called `/my-plugin:<skill>`.
- Shortcut: a skill folder with its own `.claude-plugin/plugin.json` already loads as a plugin (`<name>@skills-dir`) — that is how this repository's skills are built. `claude plugin init <name>` scaffolds one in `~/.claude/skills/`.

## Marketplace (publish)

A marketplace is a git repo (or URL) with `.claude-plugin/marketplace.json`:

```json
{
  "name": "my-skills",
  "owner": { "name": "Your Name" },
  "plugins": [
    { "name": "my-plugin", "source": "./plugins/my-plugin", "description": "…", "version": "1.0.0" }
  ]
}
```

- `source` can be a relative folder, `{"source": "github", "repo": "owner/repo"}`, or `{"source": "git-subdir", "url": "owner/monorepo", "path": "tools/x"}`.
- Validate: `claude plugin validate .` · Tag a release: `claude plugin tag`.
- Push to GitHub, then anyone installs with:

```bash
claude plugin marketplace add owner/repo
claude plugin install my-plugin@my-skills                    # user scope: every project
claude plugin install my-plugin@my-skills --scope project    # this repo, for the team (.claude/settings.json)
claude plugin install my-plugin@my-skills --scope local      # this repo, only you
```

- Release an update: bump `version` in plugin.json **and** the marketplace entry, push; users run `claude plugin marketplace update my-skills && claude plugin update my-plugin@my-skills` (or enable auto-update for the marketplace in `/plugin`).
- Make a team get it automatically: commit to `.claude/settings.json`

```json
{
  "extraKnownMarketplaces": { "my-skills": { "source": { "source": "github", "repo": "owner/repo" } } },
  "enabledPlugins": { "my-plugin@my-skills": true }
}
```

  After a teammate trusts the folder, Claude Code adds the marketplace and installs the plugin.
