# Claude Code cheatsheet

Checked against the official docs and `claude --help` of **v2.1.302** (2026-10). Things move fast: confirm a detail with `cc.py read commands --grep <word>` or `cc.py read cli-reference --grep <flag>`, and run `/claude-skill update` to refresh.

## Start, resume, run

| Command | What it does |
|------|------|
| `claude` | Interactive session in the current folder |
| `claude "fix the failing test"` | Start with a first prompt |
| `claude -c` / `claude --continue` | Continue the most recent conversation in this folder |
| `claude -r` / `--resume [id or words]` | Pick a past session (search by words) |
| `claude --from-pr 123` | Resume the session linked to a PR |
| `claude -n "auth refactor"` | Name the session (shows in the picker and terminal title) |
| `claude -p "…"` | Print mode: answer once and exit — for scripts, pipes and CI. Add `--output-format json` or `stream-json`, `--json-schema`, `--max-budget-usd`, `--permission-mode` |
| `cat log.txt \| claude -p "why does this fail?"` | Pipe data in |
| `claude -w [name]` / `--worktree` | Work in a new git worktree so parallel sessions don't collide |
| `claude --bg "…"` | Start in the background; `claude agents` lists them, `claude attach <id>`, `claude logs <id>`, `claude stop <id>` |
| `claude --model <alias>` · `--effort <level>` | Model and effort for this session |
| `claude --permission-mode plan\|acceptEdits\|auto\|default\|dontAsk` | Start in a permission mode |
| `claude --add-dir ../other` | Give access to another folder (also loads its `.claude/skills`, commands, agents) |
| `claude --chrome` | Enable Claude in Chrome (drive your real browser) |
| `claude --cloud "…"` · `--teleport` | Start a cloud session · pull a cloud session into this terminal |
| `claude --safe-mode` | Start with all customizations off — to find which one breaks things |
| `claude doctor` · `claude update` / `claude install latest` | Health check · update the native build |
| `claude mcp add …` · `claude plugin …` | Manage MCP servers · plugins and marketplaces (see below) |

## Slash commands worth knowing

Type `/` to see everything (skills and plugin commands too); `/help` lists them.

| Command | Use it to |
|------|------|
| `/init` | Generate a starter `CLAUDE.md` for the project |
| `/memory` | Edit CLAUDE.md files, turn auto memory on/off, see what Claude remembered |
| `/context [all]` | See what fills the context window, with suggestions |
| `/compact [focus]` | Summarize the conversation to free context (say what to keep) |
| `/clear [name]` | Start fresh (the old conversation stays in `/resume`) |
| `/btw <question>` | Side question that does not go into the conversation |
| `/rewind` (or `Esc Esc` on an empty prompt) | Go back to a checkpoint: code, conversation, or both |
| `/branch [name]` · `/fork` | Branch the conversation · copy it into a background session |
| `/resume` · `/rename` · `/export` | Switch session · name it · save transcript |
| `/plan [task]` | Enter plan mode (read and plan, no edits) |
| `/model` · `/effort` · `/fast` | Switch model · effort level (`low`…`xhigh`, `max`, `auto`) · fast mode |
| `/permissions` · `/fewer-permission-prompts` | Manage allow/ask/deny rules · auto-build an allowlist from your history |
| `/config` · `/statusline` · `/theme` · `/keybindings` · `/terminal-setup` | Settings UI · status line · theme · shortcuts · Shift+Enter newline |
| `/hooks` · `/mcp` · `/plugin` · `/skills` · `/agents` | Inspect/manage hooks, MCP servers, plugins, skills, subagents |
| `/reload-plugins` · `/reload-skills` | Apply plugin/skill changes without restarting |
| `/skill-doctor` | What each skill costs in context and how often it is used |
| `/doctor` | Setup checkup (install, settings, extensions, CLAUDE.md) |
| `/diff` | Review the working-tree changes, including Claude's edits |
| `/code-review [level] [--fix] [pr#]` · `/security-review` · `/simplify` | Find bugs · security issues · clean up the diff |
| `/run` · `/verify` | Launch your app and see the change working · confirm a change end to end |
| `/loop [interval] <prompt>` · `/goal <condition>` · `/schedule` | Repeat a prompt · keep working until a condition is met · cloud routines on a schedule |
| `/batch <instruction>` · `/deep-research <q>` · `/workflows` | Large parallel changes · cited multi-source research · watch workflows |
| `/tasks` · `/background` · `/subtask <task>` | Background work · detach this session · fork a background subagent |
| `/add-dir` · `/cd` | Add a working folder · move the session to another folder |
| `/usage` (`/cost`, `/stats`) · `/insights` | Cost and plan limits · report on how you use Claude Code |
| `/ide` · `/desktop` · `/remote-control` · `/mobile` | Connect an IDE · continue in Desktop · control from phone/browser · get the app |
| `/install-github-app` | Set up `@claude` in GitHub issues/PRs (GitHub Actions) |
| `/voice` | Voice dictation |
| `/import codex\|gemini\|cursor` | Bring config over from another agent |
| `/release-notes` | Changelog by version |
| `/powerup` | Built-in interactive mini-lessons |

## Keyboard

| Keys | Action |
|------|------|
| `Esc` | Stop Claude mid-turn (work so far is kept) — then redirect |
| `Esc` `Esc` | Clear the draft, or (empty prompt) open rewind |
| `Shift+Tab` | Cycle permission modes: Manual(default) → acceptEdits → plan → (bypass/auto when available) |
| `Ctrl+C` | Interrupt / clear input; twice to exit |
| `Ctrl+G` | Edit the prompt in your editor |
| `Ctrl+O` | Transcript viewer (tool calls in detail) |
| `Ctrl+B` | Send a running Bash command or agent to the background |
| `Ctrl+T` | Show/hide Claude's task checklist |
| `Ctrl+R` | Search prompt history |
| `Ctrl+S` | Stash / restore the prompt |
| `Ctrl+V` (iTerm2 `Cmd+V`, Windows `Alt+V`) | Paste an image |
| `Option/Alt+P` · `Option/Alt+T` · `Option/Alt+O` | Switch model · toggle thinking · toggle fast mode |
| `Ctrl+Enter` | Send queued messages now (you can type while Claude works) |
| `Shift+Enter` or `\`+`Enter` | Newline (run `/terminal-setup` if Shift+Enter doesn't work) |
| `!` at start | Shell mode: run a command, its output goes into the conversation |
| `@` | Mention a file/folder (autocomplete) |
| `?` on empty prompt | Shortcut help |

## Where things live

| What | User (every project) | Project (commit, shared) | Local (only you, this project) |
|------|------|------|------|
| Settings | `~/.claude/settings.json` | `.claude/settings.json` | `.claude/settings.local.json` |
| Instructions | `~/.claude/CLAUDE.md` | `CLAUDE.md` or `.claude/CLAUDE.md` (+ `AGENTS.md`) | `CLAUDE.local.md` |
| Topic rules | `~/.claude/rules/*.md` | `.claude/rules/*.md` (`paths:` frontmatter limits them to matching files) | — |
| Skills | `~/.claude/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` | — |
| Subagents | `~/.claude/agents/*.md` | `.claude/agents/*.md` | — |
| MCP servers | `~/.claude.json` (`claude mcp add --scope user`) | `.mcp.json` (`--scope project`) | `~/.claude.json` per project (default `--scope local`) |
| Plugins | `enabledPlugins` in user settings (`--scope user`, default) | `.claude/settings.json` (`--scope project`) | `.claude/settings.local.json` (`--scope local`) |
| Auto memory | `~/.claude/projects/<project>/memory/` (MEMORY.md: first 200 lines / 25KB load each session) | | |
| Transcripts | `~/.claude/projects/<project>/<session>.jsonl` | | |

Precedence: managed (organization) > `--settings` on the command line > local > project > user. Deny rules win in every mode.

## Permission modes

| Mode | Runs without asking | For |
|------|------|------|
| `default` (Manual) | reads | careful work |
| `acceptEdits` | reads, file edits, simple file commands | iterating on code you review |
| `plan` | reads (+ classifier-approved commands when auto is available) | exploring and planning before editing |
| `auto` | everything, with background safety checks | long tasks with fewer prompts |
| `dontAsk` | only pre-approved tools; everything else denied | locked-down CI and scripts |
| `bypassPermissions` | everything | isolated containers/VMs only |

Rules syntax in settings: `"allow": ["Bash(npm test *)", "Edit", "mcp__github__*"]`, `"deny": ["Read(./.env)"]`.

## Install Claude Code

```bash
curl -fsSL https://claude.ai/install.sh | bash        # macOS, Linux, WSL
irm https://claude.ai/install.ps1 | iex               # Windows PowerShell
claude                                                # first run: log in (Claude subscription or Console API key)
```

## Docs

Index of every page: https://code.claude.com/docs/llms.txt · any page as markdown: `https://code.claude.com/docs/en/<page>.md` · `cc.py docs <words>` searches it.
