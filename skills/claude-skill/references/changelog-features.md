<!-- covered-through: 2.1.302 -->
# Claude Code features from the CHANGELOG

Covers Claude Code up to **v2.1.302** (422 versions, last updated 2026-10-18). Source: https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md — refresh with `/claude-skill update`. Version numbers say when a feature arrived; check yours with `claude --version` and update with `claude update`.

## Latest additions

- **Fork subagents on everywhere** (v2.1.302) — `subagent_type: "fork"` is on by default in `-p`, SDK, Desktop and VS Code; `CLAUDE_CODE_FORK_SUBAGENT=0` turns it off.
- **Switching to a smaller-context model** (v2.1.301) — a conversation too long for the new model is summarized by the previous model first, instead of failing.
- ⭐ **Idle compaction** (v2.1.299) — a 200K+ token conversation left idle ~54 min is compacted before its 1-hour cache expires, so your next message is cheap; turn off with `"idleCompaction": false` or `/config`.
- **`/reload-skills` after compaction** (v2.1.299) — re-sends the full skill list; use it when Claude seems to have forgotten your skills after `/compact`.
- **Hooks `onFailure: "block"`** (v2.1.295) — a command/HTTP hook that can't start, times out or crashes blocks the action instead of letting it through (fail-closed safety hooks).
- **Per-subagent effort** (v2.1.292) — the Agent tool takes an `effort` parameter, so you can ask Claude to run a sub-agent at a given effort.
- **Ctrl+C draft recovery** (v2.1.288) — after clearing the prompt with Ctrl+C, press Up on the empty prompt to get the draft back, pasted text and images included.
- **`/code-review --max-findings <n>|all`** (v2.1.288) — report more or fewer findings; the choice sticks until `--max-findings default`.
- ⭐ **Claude Mods** (v2.1.287) — plugins can now change UI and behavior (bands, panes, toasts, prompt decorations, `agent.spawn`/`tool.check` hooks); build one with the built-in `plugin-authoring` skill. Try the "You should know" mod: `/plugin enable cc-plugin-you-should-know@builtin`.
- **`verify` skill before commits** (v2.1.286) — if you have a skill named `verify`, Claude runs it right before committing.
- **`claude --desktop` and resuming running sessions** (v2.1.285) — open the desktop app on this folder or session; `/resume` and `claude --resume <id> "prompt"` now reach a session running in the background.
- ⭐ **Claude Sonnet 5.5 and Haiku 5.5** (v2.1.284, v2.1.293) — `claude-sonnet-5-5` and `claude-haiku-5-5` are the new default Sonnet and Haiku, both with 1M context.
- **Ultracode toggle and `/mcp reconnect all`** (v2.1.284) — `/effort ultracode [on|off]` (or Tab in `/effort`) works at any effort level; `/mcp reconnect all` retries every failed server.
- ⭐ **Auto mode is the default permission mode** (v2.1.283, later v2.1.302) — terminal and VS Code sessions start in auto mode when nothing is configured; set `permissions.defaultMode` to change it.
- ⭐ **`/doctor prompt-audit`** (v2.1.283) — audits CLAUDE.md, skills, agents and commands for stale paths, contradictions and old-model prompting habits.

## Top 30 features to know

1. **Plan mode** (by v1.0.33, `/plan` v2.0.28) — Claude researches and proposes a plan before touching files; press Shift+Tab to cycle into it or type `/plan <task>`; approve, or reject with feedback.
2. **Auto mode** (research preview by v2.1.86, all plans v2.1.111, default v2.1.283) — a safety classifier approves routine actions and blocks risky ones so you get far fewer prompts; Shift+Tab cycle, `--permission-mode auto`, tune rules in `/permissions` → Auto mode.
3. **Checkpoints and `/rewind`** (v2.0.0, `/undo` alias v2.1.108) — roll the conversation and code back to an earlier prompt; Esc twice or `/rewind`; "Summarize up to here" squashes older turns (v2.1.141).
4. **Resume, continue and names** (v0.2.93, later v2.1.77, v2.1.285) — `claude --continue`, `claude --resume [name]`, `/resume`; name sessions with `-n/--name` or `/rename`.
5. **CLAUDE.md, rules and AGENTS.md** (early, rules v2.0.64, AGENTS.md v2.1.277) — project instructions in `CLAUDE.md` with `@file` imports and `.claude/rules/`; AGENTS.md is read when no CLAUDE.md exists; `/init` writes a first draft.
6. **Auto memory** (v2.1.32) — Claude saves and recalls notes across sessions by itself; manage with `/memory`.
7. **Skills** (v2.0.20, merged with slash commands v2.1.3) — folders with `SKILL.md` in `~/.claude/skills` or `.claude/skills`; Claude loads them when relevant or you call `/skill-name`; hot-reloaded.
8. **Custom subagents** (v1.0.60) — specialist agents in `.claude/agents/*.md` with their own tools, model and prompt; `@agent-name` or let Claude delegate; `--agents` for ad-hoc ones.
9. **Background sessions and agent view** (v2.1.139) — `claude agents` (or `←←`) lists every session as Working / Needs input / Completed; start one with `claude --bg`, `/bg`, or `←` to detach.
10. **Hooks** (v1.0.38) — run your own command, HTTP call, prompt or agent on events like `PreToolUse`, `Stop`, `SessionStart`; configure in settings JSON (or ask Claude / `/update-config`), view them in `/hooks` (read-only).
11. **MCP servers** (v0.2.31, tool search v2.1.7) — connect tools and data with `claude mcp add` or `.mcp.json`; large tool sets load on demand; manage with `/mcp`.
12. **Plugins and marketplaces** (v2.0.12) — bundles of skills, agents, hooks and MCP servers; `/plugin install name@marketplace`; plugins in `.claude/skills` load without a marketplace (v2.1.157).
13. **Worktrees** (v2.1.49) — `claude -w` / `--worktree` starts in an isolated git worktree; agents can use `isolation: worktree`.
14. **`/loop`** (v2.1.71) — repeat a prompt or command on a schedule: `/loop 5m check the deploy`; omit the interval to let Claude pace itself.
15. **`/goal`** (v2.1.139) — set a completion condition and Claude keeps working across turns until it is met.
16. **Dynamic workflows / ultracode** (v2.1.154, toggle v2.1.284) — Claude orchestrates tens to hundreds of background agents for big jobs; say `ultracode` or `/effort ultracode on`; watch runs in `/workflows`.
17. **Effort levels** (v2.1.68, `xhigh` v2.1.76, per model v2.1.251) — `/effort low|medium|high|xhigh|max` or the slider from bare `/effort`; trade speed for depth.
18. **Model switching and fast mode** (v2.0.65, fast v2.1.36) — `/model` (or Alt+P while typing) to switch; `/fast on` for faster output at a higher rate.
19. **Compaction and `/context`** (v0.2.47, `/context` v1.0.86) — long conversations auto-compact; `/compact` on demand; `/context` shows what fills the window with tips.
20. **`/usage`** (v2.0.0, hub v2.1.118) — plan limits plus a breakdown by skill, subagent, plugin and MCP server; `/cost` shows cache hit diagnostics (v2.1.251).
21. **`/code-review` and `/ultrareview`** (v2.1.147, v2.1.111) — `/code-review [low…max]` finds bugs (`--fix`, `--comment`); `/ultrareview` runs a deep multi-agent review in the cloud.
22. **`/fork`** (background form v2.1.212) — copies the conversation into a new background session in its own worktree so you can try another direction in parallel.
23. **Cross-session messaging** (v2.1.224) — sessions on any of your machines talk via `SendMessage`/`ListAgents`; type `@session-name` to address one.
24. **Remote Control** (v2.1.51) — `claude remote-control` or `/remote-control` lets you follow and steer a local session from the Claude app or claude.ai/code.
25. **Sandbox and permission rules** (`/permissions` v1.0.7, `/sandbox` v2.0.24) — allow/ask/deny rules like `Bash(npm *)`; OS sandbox limits Bash file and network access.
26. **Headless `-p` and the Agent SDK** (v1.0.23) — `claude -p "task" --output-format stream-json` for scripts and CI; TypeScript/Python SDK `@anthropic-ai/claude-agent-sdk`.
27. **`/config key=value`** (v2.1.181) — change any setting from the prompt, e.g. `/config thinking=false`; `/config --help` lists keys.
28. **Fullscreen UI, `/diff` panel and `/focus`** (v2.1.89, v2.1.260, v2.1.97) — `/tui fullscreen` for flicker-free mouse-aware rendering; live side panel of uncommitted changes; focus view hides tool noise.
29. **Message queuing and Send now** (v0.2.75, Send now v2.1.275) — type while Claude works to queue or steer; `ctrl+enter` sends queued messages now and backgrounds running tools.
30. **`/btw` and `!` bash mode** (v2.0.10 for `!`) — `/btw` asks a side question without derailing the main task; `!cmd` runs a shell command and Claude sees the output.

## 1 Sessions, context & cost

- **Resume and continue** (v0.2.93, later v2.0.64, v2.1.47, v2.1.94, v2.1.144, v2.1.268, v2.1.285) — `claude --continue` reopens the last session, `claude --resume [id|name]` or `/resume` picks one. The picker opens on the current folder (Ctrl+A for all projects), searches, previews with P, renames with R, finds a session from a pasted PR URL, lists background sessions and keeps each session's model. Resume is near-instant since v2.1.268, and since v2.1.285 it reaches a session still running in the background (`claude --resume <id> "prompt"` sends the next turn).
- **Session names** (v2.1.76, later v2.1.176, v2.1.232) — `-n/--name <name>` at launch or `/rename`; plans auto-name the session; default names are readable and unique per machine; `claude attach <name>` / `claude logs <name>` accept part of a name (v2.1.290).
- **Checkpoints and `/rewind`** (v2.0.0, later v2.1.32, v2.1.73, v2.1.108, v2.1.141, v2.1.191) — rewind the conversation and undo Claude's file edits after that point (Esc Esc, `/rewind`, alias `/undo`). "Summarize from here / up to here" compresses only part of the conversation. Up arrow right after an interrupt restores the prompt and rewinds in one step. `/rewind` can even return to before a `/clear`.
- ⭐ **Auto-compaction** (v0.2.47, later v2.0.64, v2.1.70, v2.1.247, v2.1.260) — conversations compact automatically so they never hit a wall; compaction is fast and keeps images. 1M-context models compact shortly before their limit. `/compact [focus]` runs it by hand and `/autocompact` sets the window (saved per model since v2.1.288).
- ⭐ **Idle compaction** (v2.1.299, later v2.1.302) — a large (200K+) conversation idle about 54 minutes is compacted before the 1-hour prompt cache expires, so you don't pay to reprocess it. `"idleCompaction": false` or `/config` turns it off; `CLAUDE_CODE_IDLE_COMPACT_MIN_TOKENS` sets the threshold.
- **`/context`** (v1.0.86, later v2.0.74, v2.1.74, v2.1.216) — shows what fills the context window (system prompt, skills, agents, MCP tools, memory, messages) with concrete tips to slim it.
- **`/usage` hub** (v2.0.0, later v2.1.118, v2.1.149, v2.1.236, v2.1.243, v2.1.299) — plan limits, plus a breakdown of usage by skill, subagent, plugin, MCP server and `/loop` task. `/cost` and `/stats` became tabs of it (v2.1.118). Since v2.1.299 it warns about max effort, workflows, always-on context and large tool results that eat usage.
- **Prompt-cache diagnostics** (v2.1.251, later v2.1.260, v2.1.280) — `/cost` shows the cache hit ratio and names the likely cause of a miss (tool or system prompt change, idle TTL, thinking change); status line scripts get a `prompt_cache` object.
- **Prompt-cache TTL** (v2.1.84, later v2.1.108, v2.1.243) — `ENABLE_PROMPT_CACHING_1H` opts into a 1-hour cache, `FORCE_PROMPT_CACHING_5M` forces 5 minutes; `promptCacheTtl` and `subagentPromptCacheTtl` set them separately for the main thread and subagents.
- **Message queuing and steering** (v0.2.75, v0.2.108) — type while Claude works to queue messages or steer it mid-turn.
- ⭐ **Send now** (v2.1.275, later v2.1.281, v2.1.286) — `ctrl+enter` (or `ctrl+x ctrl+s`) sends every queued message at once; running tools move to the background instead of the turn being cancelled. Works inside a subagent view too.
- **Ctrl+C draft recovery** (v2.1.288, later v2.1.292) — after Ctrl+C clears the prompt, Up on an empty prompt brings the draft back, including pasted text and images.
- **Session recap** (v2.1.108, later v2.1.110) — a short recap when you come back to a session; `/recap` on demand; toggle in `/config` or with `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`.
- **`/cd`** (v2.1.169, later v2.1.206, v2.1.246) — `/cd <path>` moves the session to another directory without breaking the prompt cache; the new folder's settings, hooks, `.mcp.json`, skills and agents load.
- **Auto-continue at usage-limit reset** (v2.1.234) — the session resumes on its own when a claude.ai limit resets; "Continue automatically at usage limit" in `/config`.
- **Auto-continue on cutoffs** (v2.1.0, later v2.1.246) — Claude continues when it hits the output token limit; `-p`, SDK and cloud sessions resume a reply cut by server or connection errors.
- **Large outputs saved to files** (v2.1.2, later v2.1.51, v2.1.261) — big Bash and tool results are written to a file Claude can Read instead of flooding context; `bashOutputMaxChars` (up to 128K) sets how much stays inline.
- **Cheaper file tools** (v2.1.86, later v2.1.144, v2.1.160, v2.1.296) — Edit works right after viewing a file with `cat`, `sed -n`, `head`, `tail` or `grep`; Read skips unchanged re-reads and returns a partial view of huge files; `allow_large` lets Claude read a large file in one call when context has room.
- **Link sessions to PRs** (v2.1.27) — sessions that ran `gh pr create` are linked; reopen with `claude --from-pr <number|url>`.
- **`/export`** (v1.0.44) — export the conversation as text for sharing.
- **Session cleanup** (v0.2.117, later v2.1.126, v2.1.288) — `cleanupPeriodDays` sets transcript retention; `claude purge [path]` deletes all state for a project (`--dry-run`, `--all`).
- **Mid-turn dialogs** (v2.1.169, later v2.1.232) — `/permissions`, `/add-dir`, `/config`, `/theme`, `/help`, `/advisor`, `/workflows` and others open while Claude is working.
- **Contracted pricing in cost** (v2.1.239) — the `modelPricing` managed setting feeds `/cost`, the status line and telemetry.
- **Memory pressure warning** (v2.1.274) — a visible warning with steps to take when Claude Code's memory use is critical.

## 2 Models, effort, thinking, fast mode, advisor

- **Current defaults** (v2.1.280, v2.1.284, v2.1.293) — Opus 5.5 (`claude-opus-5-5`, 1M context, $4/$20 per Mtok), Sonnet 5.5 (`claude-sonnet-5-5`, 1M, $2/$10) and Haiku 5.5 (`claude-haiku-5-5`, 1M, $0.10/$0.50). Pro and Team Standard also default to Opus since v2.1.280.
- **Model history** — Opus 4/Sonnet 4 (v1.0.0), Opus 4.1 (v1.0.69), Haiku 4.5 (v2.0.17), Opus 4.5 (v2.0.51), Opus 4.6 (v2.1.32), Sonnet 4.6 (v2.1.45), Opus 4.7 (by v2.1.111), Opus 4.8 (v2.1.154), Fable 5 (v2.1.170), Sonnet 5 (v2.1.197), Opus 5 (v2.1.219), Fable 5.1 (`claude-fable-5-1`, $10/$50, v2.1.257), Opus 5.5 (v2.1.280), Sonnet/Haiku 5.5 (v2.1.284/293).
- ⭐ **`/model`** (early, later v2.0.65, v2.1.117, v2.1.243, v2.1.299) — switch model; Alt+P / Option+P switches while typing. A pick becomes your default for new sessions; press `s` in the picker to change only this session. `modelPicker` setting curates the list. Bare `/model` opens a picker.
- ⭐ **Effort** (v2.1.68, later v2.1.76, v2.1.94, v2.1.154, v2.1.251, v2.1.280) — `/effort low|medium|high|xhigh|max`; bare `/effort` opens a "Faster"/"Smarter" slider; `--effort` flag. Default is `high` for most users; `xhigh` is for the hardest tasks. Since v2.1.251 the level is saved per model (press `s` for session-only). `maxEffortLevel` caps it (v2.1.267). Typing "ultrathink" gives one high-effort turn.
- **Ultracode toggle** (v2.1.284) — `/effort ultracode [on|off]` or Tab in `/effort`; turns on dynamic workflows independent of the effort level. Keybinding action `effortSlider:toggleUltracode`.
- **Fast mode** (v2.1.36, later v2.1.154, v2.1.219, v2.1.271) — `/fast on` for faster output at a higher price; moved Opus 4.6 → 4.7 → 4.8 → Opus 5 (Opus 4.7 dropped v2.1.219). Works in cloud and self-hosted sessions.
- **Thinking** (v0.2.44, later v2.0.0, v2.0.72, v2.1.89, v2.1.166) — on by default for modern models; Alt+T toggles it (was Tab before v2.0.72). Thinking summaries are hidden by default since v2.1.89 (`showThinkingSummaries: true`); Ctrl+O shows full thinking. `MAX_THINKING_TOKENS=0` or `--thinking disabled` turns it off.
- **`/advisor`** (by v2.1.232, later v2.1.260, v2.1.300) — pair a second "advisor" model that Claude can consult; `/advisor <model>`, `/advisor off`, `advisorModel` setting or `--advisor` flag.
- **Fallback models** (v2.1.152, later v2.1.166) — `fallbackModel` (up to three) or `--fallback-model` are tried in order when the primary is overloaded or missing.
- **opusplan** (v1.0.77) — in `/model`, use Opus while planning and Sonnet for execution.
- **1M context** (v2.1.50, later v2.1.75, v2.1.223, v2.1.285) — native on current Opus, Sonnet and Fable, including Bedrock, Vertex, Foundry and gateways; `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` or `/autocompact 200k` keeps 200K.
- **Model aliases and custom entries** (v1.0.88, later v2.1.78, v2.1.129, v2.1.236) — `ANTHROPIC_DEFAULT_OPUS_MODEL` / `_SONNET_` / `_HAIKU_` remap aliases; `ANTHROPIC_CUSTOM_MODEL_OPTION` adds a picker entry; `ANTHROPIC_DEFAULT_MODEL` sets the starting model.
- **Subagent models** (v1.0.64, later v2.1.72, v2.1.257, v2.1.292) — agents set `model` in frontmatter; `CLAUDE_CODE_SUBAGENT_MODEL` is a default, `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` applies to all; the Agent tool also takes `model` and (since v2.1.292) `effort`.
- **Lean system prompt** (v2.1.154) — default for newer models; Claude asks multiple-choice questions only when it truly can't decide.
- **Deprecated-model warnings** (v2.1.183) — warns when a requested model, including one in agent frontmatter, is deprecated or auto-upgraded.

## 3 Permissions, modes & safety

- ⭐ **Permission modes** (v0.2.47, later v2.1.200, v2.1.283) — Shift+Tab cycles Manual (asks before edits; called "default" before v2.1.200), Accept edits, Plan and Auto. Set at launch with `--permission-mode` or in `permissions.defaultMode`.
- ⭐ **Plan mode** (by v1.0.33, later v2.0.28, v2.0.57, v2.1.0, v2.1.72) — read-only research and a plan before any edit; `/plan [description]` starts it directly; reject with feedback; on approval pick auto-accept edits. A dedicated Plan subagent researches.
- ⭐ **Auto mode** (by v2.1.86, later v2.1.111, v2.1.207, v2.1.273, v2.1.283) — a classifier decides each action instead of prompting you. No opt-in since v2.1.111; on Bedrock/Vertex/Foundry by default since v2.1.207; server-side classifier, unbilled, since v2.1.273/278; the default mode for interactive sessions since v2.1.283 (in `-p`/SDK on third-party providers, `default` again since v2.1.302 unless `--permission-mode auto`).
- **Auto mode rules and review** (v2.1.89, later v2.1.118, v2.1.136, v2.1.246) — `/permissions` has an Auto mode tab for classifier rules and a Recent tab where `r` retries a denial. Add `"$defaults"` to `autoMode.allow`, `soft_deny` or `environment` to extend built-in rules; `autoMode.hard_deny` blocks unconditionally; `autoMode.classifyAllShell` routes every shell command to the classifier; `claude auto-mode reset` restores defaults.
- **Auto mode safety rules** (v2.1.178, later v2.1.218, v2.1.257, v2.1.261) — blocks destructive git, `terraform destroy`, transcript tampering, `rm -rf $VAR`, cloud credential fetches (Containment Escape), and uploads hidden in diagram-renderer URLs. Denials name the rule. `/insights` estimates how many of your prompts auto mode could have handled (v2.1.281).
- **Reads outside the project** (v2.1.257, later v2.1.284) — auto mode asks once before the first read outside the working directories ("Yes, but ask again next time" option); `permissions.blockReadsOutsideWorkingDirectories` blocks them.
- **`/permissions` and rules** (v1.0.7, later v2.0.67, v2.1.0, v2.1.20, v2.1.178) — allow/ask/deny rules with wildcards: `Bash(npm *)`, `Bash(* install)`, `mcp__server__*`, and parameter matching like `Agent(model:opus)`. Searchable with `/`. Since v2.1.299, MCP rules must name the whole server: `mcp__<server>__*`.
- **Smarter auto-approval** (v2.1.59, later v2.1.71, v2.1.211) — "always allow" works per subcommand of compound commands; more read-only commands auto-approved; approvals made in a worktree are saved at the repo root.
- ⭐ **Sandbox** (v2.0.24, later v2.1.69, v2.1.187, v2.1.191, v2.1.300) — `/sandbox` runs Bash under an OS sandbox on macOS/Linux. Key settings: `sandbox.enabled`, `sandbox.network.deniedDomains`, `sandbox.network.strictAllowlist`, `allowRead`, `sandbox.failIfUnavailable`, `sandbox.credentials` (blocks or masks secrets, real values only on egress), `allowUnsandboxedCommands`. Commands you type with `!` run outside it.
- **Bypass mode** (early, later v2.1.121, v2.1.257) — `--dangerously-skip-permissions` skips prompts (catastrophic removals still ask); project settings can't turn it on.
- **Write guards** (v2.1.90, later v2.1.160, v2.1.261) — prompts before writing shell startup files, git config and code-executing build configs (`.npmrc`, `.husky`, `.devcontainer/`); dangerous `rm` gets a 2-minute prompt that then denies.
- **`--restricted`** (v2.1.248) — `--restricted` or `CLAUDE_CODE_RESTRICTED=1` removes command/code tools and WebFetch and keeps file tools inside the project.
- **`--permission-prompts none`** (v2.1.259) — for unattended runs: anything that would prompt is denied.
- **`--safe-mode`** (v2.1.169) — start with CLAUDE.md, plugins, skills, hooks and MCP all off, for troubleshooting.
- **Tool restriction** (v2.1.0) — `--tools` limits built-in tools; deny `Task(AgentName)` to block a subagent; `"*"` in deny denies all tools (v2.1.166).
- **Credential scrub** (v2.1.83) — `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` strips API and cloud credentials from Bash, hooks and MCP.
- **Stacked prompts** (v2.1.286) — waiting prompts show a "2 of 5" counter, oldest first; add a note when approving (v2.1.7).

## 4 Memory & instructions

- ⭐ **CLAUDE.md** (early, later v0.2.107, v1.0.94, v2.1.72) — project and user instructions loaded every session; `@path/to/file.md` imports other files; `<!-- comments -->` are hidden from Claude; `/memory` opens them for editing; `/init` generates one.
- ⭐ **AGENTS.md** (v2.1.277, later v2.1.281) — in a project with no CLAUDE.md, Claude Code reads AGENTS.md; change under "Project instructions" in `/config`. Works on every provider.
- **`.claude/rules/`** (v2.0.64, later v2.1.84) — split instructions into rule files; `paths:` frontmatter (a glob list) loads a rule only for matching files.
- ⭐ **Auto memory** (v2.1.32, later v2.1.63, v2.1.75, v2.1.83, v2.1.287) — Claude writes and recalls `MEMORY.md` notes on its own; shared across worktrees; `autoMemoryDirectory` moves it; index capped at 200 lines/25KB with clear truncation warnings; toggle in `/memory`.
- **`/doctor prompt-audit`** (v2.1.283) — also `/checkup prompt-audit`; audits CLAUDE.md, skills, agents and commands for prompts written for older models, stale paths and contradictions.
- **`/doctor` trims CLAUDE.md** (v2.1.206) — proposes cutting checked-in content Claude can derive from the code itself.
- **Instruction size warnings** (v2.1.169, later v2.1.281) — the "too long" warning scales with the model's window and adds up all instruction files and imports.
- **Response language** (v2.1.0) — `language` setting (e.g. `"japanese"`) for replies and auto titles.
- **System prompt flags** (v1.0.51, later v2.1.283) — `--system-prompt`, `--append-system-prompt` and their `-file` forms; they can be combined.
- **Subagents without CLAUDE.md** (v2.1.271) — `omitClaudeMd` frontmatter runs a subagent without the CLAUDE.md files.
- **Extra directories** (v2.1.20) — `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` loads CLAUDE.md from `--add-dir` folders.
- **`includeGitInstructions`** (v2.1.69) — set false (or `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS`) to drop the built-in commit/PR guidance.
- **`--bare` skips memory** (v2.1.81) — scripted `--bare -p` runs skip auto-memory, hooks, plugins and skill scanning.
- The `#` quick-memory shortcut was removed in v2.0.70 — ask Claude to edit CLAUDE.md instead.

## 5 Skills & slash commands

- ⭐ **Skills** (v2.0.20, later v2.1.0, v2.1.3, v2.1.6, v2.1.178) — a folder with `SKILL.md` (frontmatter `name`, `description`) in `~/.claude/skills/`, `.claude/skills/` or nested `.claude/skills` folders. Claude loads one when its description fits, or you type `/name`. Skills and custom commands are the same thing since v2.1.3, and edits hot-reload.
- **Skill frontmatter** (v2.0.43, later v2.1.0, v2.1.80, v2.1.120, v2.1.218) — `context: fork` runs the skill in a subagent (in the background since v2.1.218; `background: false` opts out), `agent` picks the agent type, `allowed-tools`, `disallowed-tools`, `effort`, `user-invocable: false`, `disable-model-invocation`, hooks, `paths`.
- **Skill variables** (v2.1.9, later v2.1.19, v2.1.69, v2.1.152) — `$ARGUMENTS`, `$0`/`$1`, `$ARGUMENTS[0]`, `${CLAUDE_SKILL_DIR}`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_EFFORT}`; `!` lines run shell commands and inline their output.
- **Custom slash commands** (v0.2.31, later v1.0.30, v1.0.57, v1.0.123) — Markdown files in `.claude/commands/` with `argument-hint`, `model`, `@file` references and subfolder namespacing (`/frontend:component`); Claude can call them itself.
- **Stacked skills** (v2.1.199, later v2.1.287) — `/skill-a /skill-b do X` loads up to 5 leading skills; skill names typed mid-message are recognized too.
- **Manage skills** (v2.1.86, later v2.1.129, v2.1.152, v2.1.261, v2.1.299) — `/skills` lists them (`t` sorts by token cost); `/skill-doctor` shows unused skills and their context cost; `skillOverrides` hides or trims one; `/reload-skills` re-scans folders and re-sends the list after compaction; `disableBundledSkills` hides built-ins.
- **claude.ai sync** (v2.1.275, later v2.1.282) — skills and plugins enabled on your claude.ai account load in the terminal; opt out with `syncClaudeAiSkills: false` / `syncClaudeAiPlugins: false`.
- ⭐ **`/loop`** (v2.1.71, later v2.1.105, v2.1.248, v2.1.299) — `/loop 5m <prompt or /command>` repeats on an interval; without an interval Claude self-paces. Esc cancels pending wakeups; wakeups survive updates. `/usage` shows a Loops breakdown. `CLAUDE_CODE_DISABLE_CRON` stops scheduled jobs.
- ⭐ **`/goal`** (v2.1.139, later v2.1.234, v2.1.246) — set a completion condition and Claude keeps going across turns until it's met, with a live elapsed/turns/tokens panel; works in `-p` and Remote Control; restored on `--resume`.
- ⭐ **`/code-review`** (v2.1.147, later v2.1.186, v2.1.218, v2.1.223, v2.1.257, v2.1.288) — `/code-review [low|medium|high|xhigh|max]` hunts for correctness bugs in a background subagent; `--fix` applies findings, `--comment` posts inline GitHub PR or GitLab MR comments, `--max-findings <n>|all` sets volume, `ultra` sends a deep cloud review. `/review` is an alias since v2.1.223.
- **`/simplify`** (v2.1.30, later v2.1.147, v2.1.154) — cleanup-only pass (reuse, simplification, efficiency) that applies its fixes; briefly renamed to `/code-review` in v2.1.147 and restored as cleanup in v2.1.154.
- **`/ultrareview`** (v2.1.111, later v2.1.120, v2.1.248) — deep multi-agent review of your branch or `/ultrareview <PR#>` in the cloud; `--post` posts the result; `claude ultrareview [target]` runs it from CI (exit code 0/1).
- **`verify` skill** (v2.1.286) — a project or user skill named `verify` runs right before Claude commits (not for docs/tests-only commits).
- **`/btw`** (by v2.1.163, later v2.1.187, v2.1.212, v2.1.257) — ask a side question without derailing the main task; `c` copies the answer, arrows or `[`/`]` step through earlier answers, bare `/btw` reopens the last.
- **Bundled commands** (v2.1.30–v2.1.69) — `/batch` (split a change across parallel worktree agents), `/claude-api` (API/SDK reference; `managed-agents-onboard` since v2.1.290), `/debug` (debug logging and troubleshooting), `/dataviz` (v2.1.198).
- **`/doctor`** (early, later v2.1.3, v2.1.205) — full checkup that diagnoses and fixes setup problems, unreachable permission rules and startup warnings; `/checkup` is an alias.
- **`/config key=value`** (v2.1.181, later v2.1.183) — set any setting from the prompt, e.g. `/config thinking=false`; `/config --help` lists keys.
- **`/less-permission-prompts`** (v2.1.111) — scans your transcripts and proposes a read-only allowlist for `.claude/settings.json` (current builds list it as `/fewer-permission-prompts`).
- **`!` bash mode** (v2.0.10, later v2.1.186) — `!cmd` runs a shell command; Claude reacts to the output (`"respondToBashCommands": false` to stop that); Tab completes from history.
- **`/copy`** (v2.1.59, later v2.1.77, v2.1.295) — pick a code block or reply to copy; `/copy N` copies the Nth-latest reply; `w` writes to a file (handy over SSH).
- **Learning commands** (v2.1.90, later v2.1.101) — `/powerup` gives interactive feature lessons; `/team-onboarding` writes a ramp-up guide from your usage; `/release-notes` is a version picker.
- **Typo safety** (v2.1.236) — Enter on a misspelled slash command reports it instead of running a fuzzy match.
- **`/output-style [name]`** (v2.1.269) — lists and switches output styles (it was deprecated in v2.1.73 in favor of `/config` and came back).

## 6 Subagents, agent teams, background agents, agent view, workflows, worktrees

- ⭐ **Custom subagents** (v1.0.60, later v2.0.0, v2.0.59, v2.1.0) — Markdown agents in `.claude/agents/` or `~/.claude/agents/` with their own prompt, `tools`, `model`; call with `@agent-name` or let Claude delegate; `--agents '<json|file>'` defines them ad hoc; `--agent <name>` runs the main thread as one. The `/agents` creation wizard was removed in v2.1.198 — write the file or ask Claude.
- **Agent frontmatter** (v2.0.30, later v2.0.43, v2.1.33, v2.1.78, v2.1.117, v2.1.248, v2.1.296) — `disallowedTools`, `permissionMode`, `hooks`, `memory` (user/project/local), `skills` (preload), `initialPrompt`, `effort`, `maxTurns`, `mcpServers`, `background: true`, `isolation: worktree`, `omitClaudeMd`, `experimental.cacheTtl`, `autoCompactWindow`.
- **Built-in Explore and Plan agents** (v2.0.17, later v2.0.28, v2.1.198) — Explore searches the codebase cheaply (now inherits the main model, capped at Opus); Plan researches for plan mode.
- ⭐ **Subagents in the background** (v2.0.60, later v2.1.186, v2.1.198) — Claude keeps working while subagents run; their permission prompts surface in the main session labeled with the agent. Ctrl+B backgrounds running tasks; Ctrl+X Ctrl+K stops all background agents.
- **Fork subagents** (v2.1.117, later v2.1.232, v2.1.302) — `subagent_type: "fork"` inherits the full conversation and cache; on by default everywhere since v2.1.302 (`CLAUDE_CODE_FORK_SUBAGENT=0` to turn off).
- **Nested subagents** (v2.1.172, later v2.1.219, v2.1.224) — subagents can spawn subagents up to depth 3 (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), 20 at once (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`).
- **Continue an agent** (v2.1.77, later v2.1.246) — `SendMessage({to: agentId})` wakes and continues an earlier agent (replaced the Agent `resume` parameter); a subagent stopped by `maxTurns` returns partial output you can continue.
- ⭐ **Agent view `claude agents`** (v2.1.139, later v2.1.203, v2.1.212, v2.1.287) — one list of every session (Needs input / Working / Completed) with AI headlines and PR links. Open with `←←`; Ctrl+T pins, Ctrl+R renames, Ctrl+X removes safely, `n:<text>` filters, Ctrl+F finds by name, `! <cmd>` runs a shell command as a background session. Flags `--cwd`, `--json`, and defaults like `--model`, `--permission-mode`.
- ⭐ **Background sessions** (v2.1.141, later v2.1.154, v2.1.251, v2.1.257) — `claude --bg "task"`, `/bg` mid-reply, or `←` to detach; they keep your mode, model, effort and MCP config. `claude attach`, `logs`, `stop`, `respawn`, `rm` manage them; `--resume <id> --bg` continues one. Background agents commit, push and open a draft PR when appropriate.
- ⭐ **`/fork`** (v2.1.212, later v2.1.221, v2.1.257) — copies the conversation into a new background session in its own worktree, keeping the prompt cache. The older in-session fork is now `/subtask`; conversation branching from v2.1.77 is `/branch`.
- ⭐ **Dynamic workflows** (v2.1.154, later v2.1.160, v2.1.202, v2.1.248, v2.1.271, v2.1.284) — Claude writes a workflow script that orchestrates tens to hundreds of background agents. Trigger with the keyword `ultracode` or `/effort ultracode on`; watch with `/workflows` (`x` stops a run); runs pause at usage limits and continue. `workflowSizeGuideline` and `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` (1–256) control size; the `workflow-authoring` skill holds the script reference.
- ⭐ **Worktrees** (v2.1.49, later v2.1.72, v2.1.76, v2.1.105, v2.1.143, v2.1.233) — `claude -w` / `--worktree [name|PR URL]` starts in an isolated git worktree; `EnterWorktree`/`ExitWorktree` mid-session; settings `worktree.sparsePaths`, `worktree.baseRef: fresh|head`, `worktree.bgIsolation`.
- ⭐ **Cross-session messaging** (v2.1.224, later v2.1.232, v2.1.239, v2.1.247, v2.1.248) — sessions on any of your machines message each other with `SendMessage` and discover peers with `ListAgents`; type `@name` to mention one; `notify_when_idle` asks for one idle notice; `crossSessionInbound` sets accept/hold/refuse.
- **Agent teams** (v2.1.32, later v2.1.178, v2.1.234) — research preview with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`; spawn teammates through the Agent tool's `name`; Shift+Down cycles teammates; `teammateMode: "iterm2"`. `TeamCreate`/`TeamDelete` were removed in v2.1.178.
- **`/tasks`** (by v2.1.208, later v2.1.243, v2.1.283) — lists background tasks and agents with model and effort; Claude's own work folds under "System tasks".
- **Background command limits** (v2.1.260, later v2.1.288) — no time limit in interactive sessions; in unattended runs (`-p`, SDK, CI, cloud) background commands stop after their `timeout` (default 30 min, max 2 h).
- **MCP calls auto-background** (v2.1.212) — MCP calls over 2 minutes move to the background (`CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`).
- **Monitor deadlines** (v2.1.271) — every Monitor watch has a deadline of at most 30 minutes and asks Claude to re-arm it.
- **Task tracking** (v0.2.93, later v2.1.16, v2.1.233) — the todo/task list keeps Claude on track; on Opus 4.8, Sonnet 5, Fable 5 and newer the tools are off (`CLAUDE_CODE_ENABLE_TODO_TOOLS=1` restores).

## 7 Hooks

- ⭐ **Hooks** (v1.0.38, later v2.1.0, v2.1.286) — run your code on lifecycle events; configure under `hooks` in settings, skill/agent frontmatter or plugins; `/hooks` shows them grouped by event and says where each is defined. `disableAllHooks` turns them off.
- **Events** (v1.0.38–v2.1.251) — `PreToolUse`, `PostToolUse`, `UserPromptSubmit` (v1.0.54), `Stop`, `SubagentStart`/`SubagentStop`, `SessionStart` (v1.0.62), `SessionEnd` (v1.0.85), `PreCompact`/`PostCompact`, `PermissionRequest` (v2.0.45), `PermissionDenied`, `Notification` (also `agent_needs_input`/`agent_completed`), `StopFailure`, `CwdChanged`/`FileChanged`, `TaskCreated`, `TaskCompleted`, `TeammateIdle`, `ConfigChange`, `InstructionsLoaded`, `WorktreeCreate`/`WorktreeRemove`, `Elicitation`/`ElicitationResult`, `MessageDisplay`, `DirectoryAdded` (v2.1.219), `PreModelSwitch`/`PostModelSwitch` (v2.1.251), `Setup` (`--init`/`--maintenance`).
- **Hook types** (v2.0.30, later v2.1.63, v2.1.84, v2.1.118) — `command`, `http` (POST JSON to a URL, v2.1.63), `prompt` and `agent` (an LLM judges, e.g. "keep going if the build is broken"), `mcp_tool` (call an MCP tool). `args: [...]` runs a command without a shell.
- ⭐ **`onFailure: "block"`** (v2.1.295) — a command or HTTP hook that can't start, times out or exits unexpectedly blocks the action: use it for safety hooks that must fail closed.
- **Conditional `if`** (v2.1.85, later v2.1.214) — run a hook only when a permission-rule pattern matches, e.g. `Bash(git *)`; `dir/**` matches only `<cwd>/dir`, use `**/dir/**` for any depth.
- **Changing tool flow** (v1.0.59, later v2.1.85, v2.1.121, v2.1.139, v2.1.300) — PreToolUse can allow/deny/ask, rewrite input via `updatedInput` (validated since v2.1.300), return `"defer"`, or answer `AskUserQuestion`; PostToolUse `updatedToolOutput` rewrites results; `continueOnBlock: true` feeds a rejection back to Claude.
- **Keep Claude going** (v2.1.163) — Stop/SubagentStop hooks return `hookSpecificOutput.additionalContext` to give feedback and continue the turn.
- **Session control** (v2.1.94, later v2.1.141, v2.1.152) — `sessionTitle` from UserPromptSubmit/SessionStart; SessionStart `reloadSkills: true` loads skills the hook installed; `terminalSequence` sends notifications, titles and bells.
- **Hook input** (v2.1.47–v2.1.251) — `last_assistant_message` (Stop), `agent_id`/`agent_type`, `tool_use_id`, `duration_ms`, `effort.level`, `background_tasks`, `CLAUDE_PROJECT_DIR`; SessionStart `source` can be `fork`; resume hooks get session staleness and re-cache cost.
- **`UserPromptSubmit` runs before skill expansion** (v2.1.299) — blocking a prompt also stops a skill's embedded shell commands.
- **Options** (v1.0.41, later v2.1.0, v2.1.3) — per-hook `timeout` (default 10 min), `once: true`.
- **Debugging** (v2.1.271, later v2.1.296) — the spinner shows elapsed hook time; Esc cancels a wait on SessionStart; `--debug` logs each command hook's outcome and duration.
- **Limits** (v2.1.280, v2.1.302) — agent-type hooks can't run on `PermissionRequest`; at most 12 prompt/agent hooks of one event run at once.
- **Plugin hook safety** (v2.1.207) — `${user_config.*}` in shell-form commands is rejected; use `args` or `$CLAUDE_PLUGIN_OPTION_<KEY>`.

## 8 MCP

- ⭐ **Adding servers** (v0.2.31, later v0.2.36, v0.2.50, v1.0.27, v2.1.186) — `claude mcp add` (stdio, SSE, streamable HTTP), `add-json`, `add-from-claude-desktop`; scopes local / project (`.mcp.json`, committable) / user; OAuth with auto-refresh; `claude mcp login|logout` (`--no-browser` for SSH).
- ⭐ **`/mcp`** (v1.0.18, later v2.0.60, v2.1.122, v2.1.284) — status, tool counts and errors per server; `/mcp enable|disable <server>`; reconnect picks up `.mcp.json` edits; `/mcp reconnect all` retries every failed or needs-auth server.
- ⭐ **Tool search** (v2.1.7, later v2.1.9, v2.1.121, v2.1.287) — when MCP tools would take over 10% of context, they are deferred and loaded on demand (`auto:N` tunes it). `alwaysLoad: true` keeps a server's tools up front; `alwaysLoad: false` defers them all.
- **claude.ai connectors** (v2.1.46) — your claude.ai connectors work in Claude Code; `ENABLE_CLAUDEAI_MCP_SERVERS=false` opts out; off while `ANTHROPIC_API_KEY` is set (v2.1.139).
- **Elicitation and URL prompts** (v2.1.76, later v2.1.281, v2.1.287) — servers can ask for form input or open a sign-in URL in your browser; add `"bareElicitationCapability": true` if a server breaks.
- **Channels** (v2.1.80, research preview) — `--channels` lets MCP servers push messages into a session and relay permission prompts to your phone.
- **Big results** (v2.1.69, later v2.1.91, v2.1.283) — servers can set `_meta["anthropic/maxResultSizeChars"]` up to 500K; binary results and images are saved to files Claude can open.
- **Dynamic headers** (v1.0.119, later v2.1.193, v2.1.238) — `headersHelper` mints auth headers and re-runs on 401/403; project-scoped helpers need folder trust.
- **Environment for servers** (v1.0.48, later v2.1.85) — `${VAR}` expansion in configs; stdio servers get `CLAUDE_PROJECT_DIR`, `CLAUDE_CODE_SESSION_ID`, `CLAUDECODE=1`.
- **Startup control** (v0.2.41, later v2.1.139, v2.1.274) — `MCP_TIMEOUT` for startup; `MCP_CONNECTION_NONBLOCKING=true` and `CLAUDE_CODE_MCP_STARTUP_WAIT_MS` stop headless runs from waiting on servers.
- **Description limits** (v2.1.280, later v2.1.295) — up-front tool descriptions and server instructions up to 4,096 chars (16,384 when loaded by tool search); `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH` changes it.
- **Protocol** (v2.1.292) — MCP protocol 2026-07-28 is negotiated by default; `MCP_PROTOCOL_NEGOTIATION=legacy` opts out.
- **`claude mcp serve`** (early, later v2.1.271) — run Claude Code itself as an MCP server; sends progress every 30 s.
- **Managed servers** (v2.1.259) — `managedMcpServers` gives every user in an org a set of HTTP/SSE servers.

## 9 Plugins & marketplaces (incl. mods)

- ⭐ **Plugins** (v2.0.12, later v2.1.69, v2.1.268) — bundles of skills, commands, agents, hooks, MCP and LSP servers, output styles and settings. `/plugin` to browse/install/enable/disable; changes apply when you close `/plugin` (`/reload-plugins` no longer needed since v2.1.268).
- ⭐ **Marketplaces** (v2.0.12, later v2.1.275, v2.1.292) — `/plugin marketplace add owner/repo`; team catalogs via `extraKnownMarketplaces`; `claude plugin install <p> --marketplace <source>` adds the marketplace and installs in one step.
- **Plugins from `.claude/skills`** (v2.1.157, later v2.1.142) — a plugin folder inside `.claude/skills` loads without a marketplace; `claude plugin init <name>` scaffolds one; a root `SKILL.md` counts as a skill.
- ⭐ **Claude Mods** (v2.1.287, iterated through v2.1.302) — plugins that change Claude Code itself: UI bands, panes and toasts, prompt decorations (`virtualText`), `$.ui.notify`, `$.model.complete`, `$.tool.register`, and hooks like `prompt.change`, `agent.spawn`, `turn.start`, `tool.check`. Build one with the built-in `plugin-authoring` skill. Built-in "You should know" mod: `/plugin enable cc-plugin-you-should-know@builtin`.
- **Inspect before installing** (v2.1.139, later v2.1.154) — `claude plugin details <name>` and `/plugin` panes show components, projected token cost and last update.
- **Local development** (v2.1.74, later v2.1.128, v2.1.265) — `--plugin-dir <path>` (repeatable, accepts `.zip` and a folder of plugins) overrides installed ones; `--plugin-url <zip>` loads one for a session.
- **Plugin CLI** (v2.1.116–v2.1.299) — `claude plugin validate`, `prune` (orphaned dependencies), `uninstall --prune`, `configure <plugin>` (options, `--values-stdin`), `eval` (scored test reports, `--disallow-tools`), `--json` output.
- **Plugin capabilities** (v2.1.78, later v2.1.91, v2.1.118, v2.1.154) — `bin/` executables usable from Bash, `userConfig` options (secrets go to the keychain), persistent `${CLAUDE_PLUGIN_DATA}`, dependencies auto-installed, `defaultEnabled: false`.
- **Sources** (v2.0.28, later v2.1.14, v2.1.69, v2.1.224, v2.1.232) — GitHub `owner/repo#branch`, commit SHA pins, npm (installed with `--ignore-scripts`), `git-subdir`, `archive` zips with SHA-256, GitLab URLs, `command` sources.
- **Admin policy** (v2.0.70, later v2.1.85, v2.1.223, v2.1.238) — `strictKnownMarketplaces` and `blockedMarketplaces` (with `"owner/*"` wildcards), per-marketplace auto-update, `headersHelper` for private catalogs.

## 10 Headless/-p, Agent SDK, CI, routines, scheduling

- ⭐ **Print mode** (early, later v0.2.66, v1.0.86, v2.1.211) — `claude -p "task"` runs once and exits; `--output-format json|stream-json`, `--include-partial-messages`, `--input-format stream-json`, `--forward-subagent-text`.
- ⭐ **Claude Agent SDK** (v1.0.23, renamed v2.0.0) — TypeScript `@anthropic-ai/claude-agent-sdk` and Python SDKs with `canUseTool`, custom tools as callbacks, `--max-budget-usd`, cancellation and settings merging.
- **`--bare`** (v2.1.81, later v2.1.286) — minimal scripted mode: no hooks, LSP, plugins, memory, system reminders or background tasks; only MCP servers named on the command line; needs an API key.
- **Unattended controls** (v2.1.199, later v2.1.259, v2.1.292) — `--permission-prompts none`, `CLAUDE_CODE_RETRY_WATCHDOG` and related retry/wait env vars, `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`.
- **Settings and prompts per run** (v1.0.61, later v2.1.261, v2.1.267, v2.1.275) — `--settings <file>`, `--agents <file>`, `--system-prompt-snapshot off`, and a `__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__` line to cache the static part of a custom system prompt.
- **GitHub** (v1.0.7, later v2.1.187) — `/install-github-app` sets up the GitHub app and Actions workflow (workflow optional).
- **`/schedule` and routines** (by v2.1.110, later v2.1.139, v2.1.271, v2.1.274) — cloud agents that run on a cron schedule or on demand; needs a claude.ai login; Yours/Templates tabs on the Routines page; scheduled runs can publish and update artifacts.
- **Self-hosted runner** (v2.1.224, later v2.1.248, v2.1.288) — `claude self-hosted-runner` runs web, mobile and desktop sessions on your own machines (Team/Enterprise), with graceful shutdown flags.
- **Faster headless start** (v2.1.259–v2.1.292) — `-p` skips the interactive UI and doesn't wait for CLAUDE.md lookup or deferred MCP servers.

## 11 Surfaces: VS Code, JetBrains, Desktop, web/cloud, Remote Control

- ⭐ **VS Code extension** (v2.0.0, many later) — native chat panel with session list, plan preview with comments, per-change accept/reject (v2.1.275), agent map with Stop buttons (v2.1.269), Focus view (`Ctrl+Alt+F`, v2.1.221), Bookmarks panel (v2.1.286), "Run in background" (v2.1.287), Problems-panel diagnostics (v2.1.285), dialogs for hooks, permissions, MCP, memory and plugins, and `/plan`, `/export`, `/copy`, `/tasks` commands.
- **IDE connection** (early, later v2.1.162) — `/ide` connects to VS Code, JetBrains and other editors (Windsurf is now listed as Devin Desktop).
- ⭐ **Remote Control** (v2.1.51, later v2.1.79, v2.1.110, v2.1.229, v2.1.234) — `claude remote-control [--name]` or `/remote-control` serves your local session to claude.ai/code and the mobile app; permission mode, model and effort sync both ways; photos from the phone reach Claude; mobile pushes when "Push when Claude decides" is on; `--continue` resumes.
- **Cloud sessions and teleport** (v2.0.24, later v2.0.45, v2.1.0, v2.1.219) — start a task with an `&` prefix to run it in the cloud ("Claude Code on the web", called "Cloud sessions" since v2.1.274); `claude --teleport <id>` or `/teleport` pulls it to your terminal.
- **Cloud session features** (v2.1.269–v2.1.282) — diff "Compare against" any branch, take back a queued message, attach a second repository.
- **Desktop app** (v2.0.51, later v2.1.285) — `claude --desktop` opens the desktop app on the current folder or a session (`--continue`, `--resume <id>`).
- **Deep links** (v2.1.84, later v2.1.91) — `claude-cli://open?q=...` opens a prompt in your terminal; `vscode://anthropic.claude-code/open` for VS Code.
- **Platforms** — native Windows (v1.0.51), PowerShell tool as primary shell (v2.1.84+, `CLAUDE_CODE_USE_POWERSHELL_TOOL`), Alpine (v1.0.73), winget (v2.1.2), Windows ARM64 (v2.1.41), native binary (v2.1.113).

## 12 Terminal UI, input, keybindings, voice, status line, output styles, themes

- ⭐ **Fullscreen renderer** (v2.1.89, later v2.1.110, v2.1.224, v2.1.271) — `/tui fullscreen` (or `CLAUDE_CODE_NO_FLICKER=1`) for flicker-free rendering with mouse clicks, wheel scrolling and scrollbars in lists; keeps full history across compactions.
- ⭐ **`/diff` panel** (v2.1.260, later v2.1.281) — in fullscreen, a side panel shows uncommitted changes and updates live as Claude edits.
- **Transcript view** (v1.0.113, later v2.1.83, v2.1.111) — Ctrl+O opens the full transcript; `/` searches (`n`/`N`), `{`/`}` jump between prompts, `v` opens your editor.
- **`/focus`** (v2.1.97, later v2.1.110) — shows only prompts, tool summaries and final answers.
- **Keyboard essentials** (v0.2.47–v2.1.288) — Shift+Tab cycles modes, Esc interrupts, Esc Esc rewinds, Ctrl+R searches prompt history (all projects), Ctrl+G or Ctrl+X Ctrl+E edits the prompt in `$EDITOR`, Ctrl+U clears (Ctrl+Y restores), Alt+P switches model, Alt+T toggles thinking, Shift+Enter for newlines, Bash-style Ctrl+W/Alt+F/Alt+D (v2.1.261).
- **Custom keybindings** (v2.1.18, later v2.1.47) — `/keybindings` edits `~/.claude/keybindings.json` with contexts and chords.
- **Vim mode** (v0.2.34, later v2.1.98, v2.1.208, v2.1.301) — turn on via `/config` → Editor mode (the `/vim` command was removed in v2.1.92); text objects, visual `v`/`V`, `%` bracket jump, `vimInsertModeRemaps` like `jj` to Escape.
- ⭐ **Status line** (v1.0.71, later v2.0.65, v2.1.80, v2.1.153, v2.1.293) — `/statusline` creates a script; it receives model, cost, `context_window.used_percentage`, `rate_limits`, `effort.level`, worktree, PR, `prompt_cache`; `refreshInterval` re-runs it; `subagentStatusLine` for subagents.
- **Output styles** (v1.0.81, later v2.0.32, v2.1.237, v2.1.269) — Explanatory, Learning and Concise (v2.1.237, results first) styles or your own; pick in `/config` or `/output-style [name]`.
- **Voice input** (v2.1.69, later v2.1.72) — push-to-talk dictation in 20 languages (`voice:pushToTalk` binding).
- **Themes** (early, later v2.1.111, v2.1.118) — `/theme`, custom themes in `~/.claude/themes/`, "Auto (match terminal)".
- **Images and files** (v0.2.75, later v2.1.30) — paste or drag images, `@`-mention files and folders; Read handles PDF `pages`.
- **Display settings** (v2.1.257, later v2.1.282) — `maxProseWidth` caps prose width in wide terminals; `timeFormat`/`timeZone` for the turn-end clock; `showTurnDuration`.
- **Prompt niceties** (v2.1.217–v2.1.277) — `:emoji:` shortcodes, optional spellcheck, Markdown rendering of your own messages, invisible Unicode stripped from prompts.
- **Screen reader mode** (v2.1.208) — `claude --ax-screen-reader` or `"axScreenReader": true`.
- **Terminal integration** (v2.1.0, later v2.1.295) — Shift+Enter works natively in major terminals (`/terminal-setup` for others); Program Status Protocol (OSC 7501) shows working/waiting/done in supporting terminals.

## 13 Integrations: Chrome, computer use, artifacts, Claude Design, Slack/Claude Tag

- ⭐ **Claude in Chrome** (v2.0.72 beta, GA v2.1.198, later v2.1.154, v2.1.290) — Claude drives your real Chrome through the extension (navigate, click, fill forms, read console); `--chrome` or `/chrome`, "Select browser…" when several are connected. Project settings can no longer turn it on.
- **Web tools** (v0.2.53, later v2.1.83) — WebFetch (identifies as `Claude-User`, strips CSS/JS) and WebSearch; `CLAUDE_CODE_DISABLE_WEB_FETCH` turns WebFetch off (v2.1.285+).
- **LSP tool** (v2.0.74) — go-to-definition, references and hover docs from language servers, often shipped by plugins.
- **Computer use** (by v2.1.243) — Claude can operate desktop apps; clicking desktop, Dock or Finder needs Finder access.
- **Artifacts** (v2.1.265–v2.1.301) — Claude publishes private web pages (dashboards, documents) to claude.ai; Markdown renders as styled documents; watch up to 25 artifacts; `/artifacts` lists them. Use an `Artifact` permission rule to control them.
- **Claude Tag (Claude in Slack)** (v2.1.268–v2.1.302) — Working indicator and Stop button, per-channel memory, `!fast` per thread, Slack Connect channels, private Allow once/Deny cards, admin settings for connectors, skills and channels.
- **Claude Design** (v2.1.302) — `/design-sync` and `/design-login` work with Claude Design; standalone claude.ai/design closes December 14, 2026.
- **`SendFeedback`** (v2.1.247) — Claude drafts a feedback report for you to send from `/feedback`.

## 14 Settings, env vars, enterprise & providers

- ⭐ **Settings files** (v2.0.8, later v1.0.90, v2.1.116) — `~/.claude/settings.json` (user), `.claude/settings.json` (project, committed), `.claude/settings.local.json` (personal), plus managed policy; edits apply without restart; `/config` writes to them. `claude config` was removed in v2.0.0.
- **Attribution** (v2.0.62, later v2.1.183, v2.1.281) — `attribution` customizes commit/PR bylines (replaced `includeCoAuthoredBy`); `"attribution": false` hides it; `attribution.sessionUrl` drops the session link.
- **Useful env vars** — `BASH_DEFAULT_TIMEOUT_MS`, `CLAUDE_CODE_SHELL`, `CLAUDE_CODE_SHELL_PREFIX`, `CLAUDE_CODE_TMPDIR`, `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`, `DISABLE_UPDATES` (v2.1.118), `CLAUDE_CODE_DISABLE_FILE_MENTIONS` (v2.1.285+), `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`.
- **Other handy settings** — `cleanupPeriodDays`, `language`, `plansDirectory`, `respectGitignore`, `fileSuggestion`, `spinnerVerbs`/`spinnerTipsOverride`, `companyAnnouncements`, `feedbackDrafts`.
- **Auth** (v2.1.41, later v2.1.243) — `claude auth login|status|logout`; `/login` includes keyless "Sign in with your Console account". An `ANTHROPIC_API_KEY` disables claude.ai-only features (Remote Control, `/schedule`, connectors).
- **Providers** (v2.0.45–v2.1.300) — Bedrock (API keys `AWS_BEARER_TOKEN_BEDROCK`, `awsAuthRefresh`, Mantle `CLAUDE_CODE_USE_MANTLE=1`), Vertex (global endpoints, X.509 federation), Microsoft Foundry, Claude Platform on AWS; `/setup-bedrock` and `/setup-vertex` wizards; `modelOverrides` maps picker entries to provider IDs.
- **Managed settings** (v2.0.68, later v2.1.83, v2.1.163, v2.1.248, v2.1.283) — enterprise policy via files, `managed-settings.d/`, macOS plist, Windows Registry or server; `requiredMinimumVersion`/`requiredMaximumVersion`, `availableModels`, `deniedModels`, `allowedProviders`, `modelPicker`; `/status` and `/doctor` explain load failures.
- **Claude apps gateway** (v2.1.198–v2.1.300) — an org LLM gateway with `/login`, spend limits shown in `/usage` and the status line, per-upstream model lists, Bedrock `assume_role`, telemetry export.
- **OpenTelemetry** (early, later v2.1.111, v2.1.193, v2.1.283) — metrics, events and spans with agent IDs, effort, tool decisions, GenAI semantic conventions; `OTEL_LOG_ASSISTANT_RESPONSES`, `OTEL_LOG_RAW_API_BODIES`. Project settings can't turn export on (v2.1.281).
- **Safety of repo settings** (v2.1.207–v2.1.290) — a cloned repo's settings can't enable bypass mode, telemetry export, Remote Control auto-start, Chrome, or set `CLAUDE_CONFIG_DIR`/temp dirs.
- **Updates** (v2.1.113, later v2.1.129, v2.1.243) — native binary (~75 MB zstd download); `claude update`; `DISABLE_UPDATES`; `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE` for Homebrew/WinGet; release channel in `/config`.
- **Native search** (v2.1.117, later v2.1.162) — macOS/Linux native builds use embedded `bfs`/`ugrep` instead of Glob/Grep tools; `--tools Grep,Glob` restores them.

## Removed or renamed

- `claude config` command removed (v2.0.0) — use settings files or `/config`; old `.claude.json` options moved to `settings.json` (v2.0.8).
- `/allowed-tools` → `/permissions` (v1.0.7); `includeCoAuthoredBy` → `attribution` (v2.0.62).
- `DEBUG=true` → `ANTHROPIC_LOG=debug` (v0.2.125); transcript key Ctrl+R → Ctrl+O (v1.0.113); thinking toggle Tab → Alt+T (v2.0.72).
- Claude Code SDK → Claude Agent SDK (v2.0.0); legacy entrypoint removed (v2.0.25).
- `#` quick-memory shortcut removed (v2.0.70) — ask Claude to edit CLAUDE.md.
- AgentOutputTool/BashOutputTool → TaskOutput (v2.0.64); TaskOutput deprecated for Read and removed in v2.1.277 (`taskOutputMaxChars`, `TASK_MAX_OUTPUT_LENGTH` do nothing).
- @-mention MCP toggle removed (v2.1.6) — use `/mcp enable|disable`.
- Effort level `max` removed (v2.1.72), later restored above `xhigh`; `/effort auto` resets to default.
- `/output-style` deprecated for `/config` (v2.1.73), then restored as `/output-style [name]` (v2.1.269).
- `/fork` → `/branch` (v2.1.77); `/fork` returned in v2.1.212 as "copy into a background session", and the in-session subagent fork became `/subtask`.
- Agent tool `resume` parameter removed (v2.1.77) — use `SendMessage({to: agentId})`.
- "Stop all background agents" moved from Ctrl+F to Ctrl+X Ctrl+K (v2.1.83).
- `/tag` and `/vim` removed (v2.1.92) — vim mode is in `/config` → Editor mode.
- Ctrl+O focus mode → `/focus` (v2.1.110); `--enable-auto-mode` no longer needed (v2.1.111).
- `/cost` and `/stats` merged into `/usage` (v2.1.118; still work as shortcuts to its tabs); `/extra-usage` → `/usage-credits` (v2.1.144).
- `/simplify` → `/code-review` (v2.1.147); `/simplify` returned as a cleanup-only pass (v2.1.154).
- Workflow trigger keyword `workflow` → `ultracode` (v2.1.160); ultracode became an `/effort` toggle (v2.1.284).
- `CLAUDE_CODE_OPUS_4_6_FAST_MODE_OVERRIDE` removed (v2.1.160); Opus 4.7 dropped from fast mode (v2.1.219).
- Keybinding `modelPicker:setAsDefault` → `modelPicker:thisSessionOnly` (v2.1.153); Windsurf → Devin Desktop in `/ide` (v2.1.162).
- `TeamCreate`/`TeamDelete` tools removed (v2.1.178); "Default teammate model" setting removed (v2.1.234).
- `/agents` creation wizard removed (v2.1.198) — write agent files directly; leftover menu entry removed (v2.1.281).
- "default" permission mode renamed "Manual" (v2.1.200).
- Task `mode` parameter deprecated (v2.1.212).
- Ultraplan (`/ultraplan`, "Refine with Ultraplan") removed (v2.1.222).
- `/review` became an alias of `/code-review` (v2.1.223).
- 200-subagents-per-session cap removed (v2.1.224).
- TodoWrite/Task* tools off on Opus 4.8, Sonnet 5, Fable 5 and newer (v2.1.233) — `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` restores.
- Double-press Ctrl+L `/clear` shortcut removed (v2.1.238).
- Ctrl+E command explanation on permission prompts removed (v2.1.257).
- `keybindingFlavor` setting (added v2.1.238) removed (v2.1.261) — Bash-style word keys are now the default.
- Monitor `persistent` option replaced by deadlines (v2.1.271).
- "Claude Code on the web" renamed "Cloud sessions" (v2.1.274); VS Code "Delete session" → "Archive session" (v2.1.257).
- Local skills in the `anthropic-skills` or `claude-ai` namespace no longer load (v2.1.282).
- Browser link removed from `/ultrareview` output (v2.1.286).
- `claude project purge` → `claude purge` (v2.1.288; old name still works).
- `--sandbox`/`--no-sandbox` removed from `claude remote-control` (v2.1.300) — use `sandbox.enabled`.
- `/sandbox` "Sandbox BashTool" → "Sandbox commands" (v2.1.300); mod `Text.bold` deprecated for `weight` (v2.1.299).
- Standalone Claude Design (claude.ai/design) closes December 14, 2026 (announced v2.1.302).

## Timeline

- **0.2.x (research preview)** — the core loop: custom slash commands, MCP servers with local/project/user scopes, `claude mcp add`, auto-compaction, Shift+Tab auto-accept edits, `think`/`ultrathink` keywords, `--continue`/`--resume`, the todo list, CLAUDE.md `@imports`, WebFetch and WebSearch, vim mode.
- **1.0.x (general availability)** — general availability with Opus 4 and Sonnet 4 (v1.0.0), TypeScript/Python SDKs (v1.0.23), remote MCP with OAuth, hooks (v1.0.38), plan mode, native Windows, custom subagents (v1.0.60), status line (v1.0.71), opusplan, output styles, `/context`.
- **2.0.x** — `/rewind` checkpoints, native VS Code extension and Claude Agent SDK (v2.0.0), plugins and marketplaces (v2.0.12), Agent Skills (v2.0.20), sandbox (v2.0.24), Explore/Plan agents, cloud sessions and teleport, Opus 4.5, Desktop app, background agents (v2.0.60), Claude in Chrome beta and LSP tool (v2.0.72+).
- **2.1 early (2.1.0–2.1.75)** — skills merged with commands and hot-reload, wildcard permissions, MCP tool search, agent teams preview, auto memory and Opus 4.6 (v2.1.32), fast mode, `--worktree` (v2.1.49), Remote Control (v2.1.51), HTTP hooks, `/loop` and cron (v2.1.71), effort levels, 1M context.
- **2.1 early-mid (2.1.76–2.1.162)** — `xhigh` effort, auto mode research preview to broad availability (v2.1.111), fullscreen `/tui` and `/focus`, many new hook events, `/usage` hub, `/ultrareview`, agent view `claude agents` and `/goal` (v2.1.139), background sessions `--bg`, `/code-review` levels, Opus 4.8 and dynamic workflows (v2.1.154), plugins from `.claude/skills`.
- **2.1 mid (2.1.163–2.1.247)** — Fable 5, Sonnet 5 (v2.1.197) and Opus 5 (v2.1.219), `/cd`, `--safe-mode`, `/config key=value`, background subagents and nesting, Claude in Chrome GA, `/fork` into background sessions (v2.1.212), cross-session messaging (v2.1.224), self-hosted runners, Manual mode rename, Auto mode tab in `/permissions`.
- **2.1 late (2.1.248–2.1.282)** — `--restricted`, per-model effort, Fable 5.1, `/diff` panel (v2.1.260), `/skill-doctor`, `claude plugin eval`, server-side auto mode classifier, Send now, claude.ai skill/plugin sync, AGENTS.md (v2.1.277), Opus 5.5 (v2.1.280).
- **2.1 latest (2.1.283–2.1.302)** — auto mode as the default mode, `/doctor prompt-audit`, Sonnet 5.5 and Haiku 5.5, ultracode `/effort` toggle, Claude Mods and the `plugin-authoring` skill (v2.1.287), `onFailure: "block"` hooks, idle compaction (v2.1.299), fork subagents everywhere (v2.1.302).
