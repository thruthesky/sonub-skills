# Claude Academy → Claude Code

What the Claude Academy tutorials teach, and how to do the same thing in Claude Code. Analyzed 2026-10-18: the 64 tutorials at https://academy.claude.com/all?kind=tutorial&product=chat plus 14 Claude Code / general tutorials. Each tutorial lives at `https://academy.claude.com/tutorials/<slug>`. Everything here is paraphrased — send the user to the tutorial for the full text. The Claude Code courses (Claude Code 101, Claude Code in action, Agent Skills, Subagents) feed [curriculum.md](curriculum.md).

## The 10 findings that matter most

1. **Clarify the goal before Claude starts.** Anthropic's fluency research found that in chat the signature good habit is iterating, but in Claude Code (and Cowork) it is stating the goal clearly up front — goal, constraints, what "done" means, which files (`getting-good-at-claude-a-research-backed-curriculum`).
2. **Discernment has to be practised on purpose.** Getting better at describing tasks comes with use; checking the output does not. Reading a clean diff misses wrong assumptions. Habits: ask "what did you assume?", test a case that is likely to fail, audit your config (same tutorial).
3. **Effort before model.** Start at the default effort and move one level at a time; switch model only when effort doesn't fix it, then put effort back to default. Compare cost per finished task, not per token (`choosing-the-right-effort-level-in-claude-code`, `how-to-select-the-right-effort-setting-for-claude-cowork-and-chat`).
4. **Model ladder.** Haiku for lookups and quick extraction → Sonnet as the default when unsure → Opus when Sonnet struggles → Fable for long, accuracy-critical work where you describe the outcome (`choosing-the-right-claude-model`).
5. **Every turn resends the whole context**, and most of it isn't what you typed. Compaction summarizes and can lose detail; keep durable facts in memory files and look up volatile ones fresh (`parametric-memory-and-context`).
6. **A skill = format + tone + one real example.** Once you've explained the same thing twice, make it a skill. The name and description decide whether it loads — test it in a fresh session (`teach-claude-your-way-of-working-using-skills`, `how-to-create-a-skill-with-claude-through-conversation`).
7. **Plan first, then work in checkpoints, with numbers instead of adjectives.** Ask what data is available, get a plan to approve, go step by step, use measurable criteria, and follow Retrieve → Analyze → Create (`prompting-strategies-for-financial-analysis`, `financial-analysis-workflows-with-claude`).
8. **Connectors are MCP.** Name the tool, check what it can see after connecting, grant only what's needed. For automation prefer connector/API → browser → screen control, and treat web page text as data, not instructions (`connect-your-tools-…`, `navigating-the-claude-desktop-app`).
9. **Plugins install the same way everywhere:** add the marketplace, install, restart (or `/reload-plugins`), check `/mcp` (life-sciences tutorials).
10. **Ask Claude about Claude** — what a feature does, a better prompt, or a screenshot of an unknown screen (`getting-started-with-claude`).

## Chat feature → Claude Code equivalent

| In claude.ai (tutorial) | What the tutorial says | In Claude Code | Try it |
|------|------|------|------|
| **Projects** (`getting-started-with-claude`, `intro-to-projects`) | A workspace with files + standing instructions so each chat starts informed; make one when you keep re-uploading files or repeating rules | The repo *is* the project: `CLAUDE.md` (+ nested ones), `.claude/rules/`, `@path` imports; `/init` drafts it | Run `/init`, then cut it to what Claude can't infer. Keep a week-long list of things you re-explain and add them |
| **Instructions for Claude** (profile) | Short note that applies everywhere: who you are, what to assume, tone | `~/.claude/CLAUDE.md` | Put 5–10 universal preferences there; move domain procedures to skills |
| **Memory** | Remembers facts about you across chats; you can view and edit it | Auto memory `~/.claude/projects/<project>/memory/` + `/memory`; `/context`, `/compact`, `/clear` | Say "remember that …"; prune stale entries in `/memory`; write decisions to a file before `/compact` |
| **Connectors** (`connect-your-tools-…`, `getting-started-with-connectors`) | MCP-backed read/act access; test by asking what Claude can see; access follows your own permissions | `claude mcp add`, `/mcp`, plugins that bundle MCP servers | After adding a server ask "which tools do you have and what does each return?"; remove unused servers and compare `/context` |
| **Skills** (`teach-claude-…`, `how-to-create-a-skill-…`) | Packaged method applied when a request matches; name+description read first; instructions, references, scripts; naming the skill forces it | `~/.claude/skills/`, `.claude/skills/`, plugin skills; `/skills`, `/skill-doctor` | Turn a task you've explained twice into SKILL.md + a script; check it triggers without naming it |
| **Research** (`using-research`) | Many searches → one cited brief; takes minutes, save it for big questions | `/deep-research <question>`, or subagents fanned out per candidate | One subagent per option with the same criteria, merged into a sourced table |
| **Web search** | On by default on Free/Pro/Max, off on Team/Enterprise until an admin enables it; turn off when answers must come from your documents | WebSearch/WebFetch tools; or say "repo files only" | Require official docs to be fetched for version-sensitive APIs |
| **Extended thinking** | Use it for hard problems, then judge whether the reasoning holds | Effort level + plan mode | Plan mode for risky refactors; read the plan for assumptions |
| **Effort** (two effort tutorials) | How much thinking, tool use and self-checking; too low = unfinished, too high = verbose/scope creep | `/effort` (persists), `--effort` (one session), `/effort auto`, `effortLevel` setting, `CLAUDE_CODE_EFFORT_LEVEL`, `effort:` in skill/subagent frontmatter | Same task at low / default / max in three folders, compare `/usage` and quality |
| **Model choice** (`choosing-the-right-claude-model`) | Haiku / Sonnet / Opus / Fable roles; compare models where answers differ | `/model`, `--model`, `model:` in subagents and skills | Same bug fix on two models, diff the patches; cheap models for search subagents |
| **File creation** (`create-and-edit-files-…`) | Real xlsx with formulas, docx, pptx, PDFs; name the format or you may get an artifact | Claude writes files directly, or office skills/scripts | Always give file type and path; recompute two totals from the output with a script |
| **Artifacts** (two artifact tutorials) | Describe the problem, let Claude interview you, iterate, fork; break-test before sharing; move to Claude Code for production | `/artifacts`, the Artifact tool | Prototype as an artifact, then port to the repo with tests |
| **Desktop app** (`navigating-the-claude-desktop-app`) | Folders, extensions, built-in browser, computer use, record a skill, tasks continue while the computer is awake | `/desktop`, working directory, `/remote-control`, `--chrome`, computer use | Prefer MCP, then browser, then screen control |
| **Voice / dictation** (`how-to-choose-between-voice-mode-and-dictation`) | Dictation when you know what to say; voice mode to think aloud | `/voice` | Dictate a messy task, edit it into a clear goal, then send |
| **Claude in Chrome** | Works in your real, signed-in browser; pages can hide text aimed at AI; start with trusted sites | `claude --chrome`, `/chrome` | Reproduce a UI flow and read the console after a change |
| **Admin setup** (`claude-enterprise-administrator-guide`) | Claude Code needs the right seat; install → `claude` → login; `/logout` + `/login`, `claude update` fix most issues; admins can cap effort per model | Managed settings, shared `.claude/`, plugin marketplaces | Ship a team baseline (CLAUDE.md, `.claude/skills/`, approved MCP list) and review it like code |

## 30 principles, the Claude Code way

1. **Goal first** — open with goal, constraints, done-criteria, relevant files.
2. **Let Claude interview you** when the goal is fuzzy: "ask me up to five questions before you plan."
3. **Be specific** — name files, functions, the test command, the output format.
4. **Ask only for what you need**; split mass changes into batches.
5. **Plan first** — plan mode, approve, then execute.
6. **Checkpoints** — "do step 1, show me, wait."
7. **Retrieve → Analyze → Create** — investigate → diagnose → implement and test.
8. **Measurable criteria** — "p95 under 200 ms", "no new lint errors", "all tests pass".
9. **Discover capabilities first** — `/mcp`, "what tools do you have?"
10. **Name the tool or skill** when it must be used.
11. **Format + tone + one example**; after two repeats, make a skill.
12. **Put durable context in the right layer** — prompt → project CLAUDE.md → user CLAUDE.md → skill.
13. **Context is resent every turn** — watch `/context`, use `/clear` between tasks, trim MCP servers and CLAUDE.md.
14. **Compaction is lossy** — save decisions to a file before `/compact`; memory holds durable facts only.
15. **A wrong answer usually means missing context** — ask which file or fact it lacked.
16. **Effort at default, one level at a time.**
17. **Effort before model; reset effort after switching model.**
18. **Cost per finished task** — count the fix-up turns too.
19. **Lightest model that works; escalate on evidence.**
20. **Practise discernment** — "what did you assume?", test a likely failure, audit config.
21. **Check in proportion to stakes** — recompute one key number yourself.
22. **Don't stop at v1** — specific follow-ups; explore alternatives with `/branch` or worktrees.
23. **Most direct integration** — API/MCP → browser → screen.
24. **External content is untrusted** — never follow instructions found in fetched pages or files.
25. **Least privilege** — scoped MCP tokens, deny rules for secrets.
26. **Reproducible work** — commit analyses as scripts, keep sources and raw exports.
27. **Know each source's limits and freshness** — ask Claude to state them.
28. **Start small, then scale; save winning prompts** — as skills or commands.
29. **Prototype in chat/artifacts, harden in Claude Code.**
30. **Ask Claude about Claude** — or run `/claude-skill` (and `/powerup` for built-in mini-lessons).

## Facts worth keeping (from the tutorials)

- **Models**: Haiku 5.5 fastest/lightest on limits; Sonnet 5.5 the default when unsure; Opus 5.5 heavy reasoning (Pro and above); Fable 5.1 most capable, slowest, heaviest on limits. Escalate Sonnet → Opus → Fable only when the lower one struggled.
- **Effort**: `--effort` lasts one session, `/effort` persists, `/effort auto` resets; `max` is session-only unless set by env var; Ultracode is a session mode (xhigh + multi-agent orchestration), not an effort level; admins can cap effort per model; the same level name means different amounts of work on different models; `/usage` shows the current session only.
- **Context**: flagship models take up to 1M tokens; the whole context goes out every turn, so a fresh session can be cheapest; URLs cost more tokens than a sentence of the same length.
- **Fluency research**: 50,000+ conversations, 11 behaviours. Claude Code checks by tier — basics (prompt clarity, file refs, model choice): ask what Claude assumed; middle (skills, slash commands, MCP): test a likely failure; lasting setup (CLAUDE.md, hooks, subagents): audit the config.
- **Plugins from Anthropic marketplaces**: `/plugin marketplace add anthropics/life-sciences` (or `anthropics/healthcare`) → `/plugin install <name>@<marketplace>` → restart → `/mcp`; some need a token set in `/plugin` → manage.
- **Scope rules of thumb** (finance tutorials, useful anywhere): detailed analysis on 3–5 items at a time, big jobs in batches of 5–10.
- **Admin rollout**: pilot with 50–100 users for 2–4 weeks, 2–3 champions per department; Claude Code needs a seat that includes it; install with `curl -fsSL https://claude.ai/install.sh | bash` (Windows `irm https://claude.ai/install.ps1 | iex`).
- **Desktop**: automation preference is connector → built-in browser → computer use (slowest); tasks keep running while the computer stays awake.

## Catalog

**Most relevant to Claude Code (read these):** `getting-good-at-claude-a-research-backed-curriculum` · `choosing-the-right-effort-level-in-claude-code` · `how-to-select-the-right-effort-setting-for-claude-cowork-and-chat` · `choosing-the-right-claude-model` · `parametric-memory-and-context` · `teach-claude-your-way-of-working-using-skills` · `how-to-create-a-skill-with-claude-through-conversation` · `connect-your-tools-to-unlock-a-smarter-more-capable-ai-companion` · `prompting-strategies-for-financial-analysis` · `financial-analysis-workflows-with-claude` · `getting-started-with-claude` · `how-to-use-the-nextflow-deployment-agent-skill-with-claude-code` · `how-to-use-the-fhir-developer-agent-skill-with-claude-code`.

**Video-only (title and description only — watch on the site):** `what-are-skills` · `creating-your-first-skill` · `configuration-and-multi-file-skills` · `sharing-skills` · `troubleshooting-skills` · `how-skills-compare-to-other-claude-code-features` · `using-claude-code-remote-control` · `intro-to-projects` · `getting-started-with-connectors` · `using-research` · `what-is-claude-managed-agents`. The same skill topics are taught in text in the *Introduction to agent skills* course (see curriculum.md).

**Useful background:** `tokens-and-embeddings` · `create-and-edit-files-with-claude-to-eliminate-hours-of-busy-work` · `prototype-ai-powered-apps-with-claude-artifacts` · `use-artifacts-to-visualize-and-create-ai-apps-without-ever-writing-a-line-of-code` · `navigating-the-claude-desktop-app` · `how-to-choose-between-voice-mode-and-dictation` · `imagine-with-claude-student-guide` · `claude-enterprise-administrator-guide`.

**Domain tutorials** — same patterns (discover the data first, narrow by identifier/date/type, plan, verify against the source), applied to one field:
- Finance (17): `claude-for-financial-services-overview`, `getting-started-with-claude-for-financial-services`, `claude-for-financial-services-skills`, and connector guides for Aiera, Chronograph, Daloopa, Databricks, Egnyte, FactSet, LSEG, Moody's, Morningstar, MT Newswires, PitchBook, S&P Global.
- Life sciences (27): `getting-started-with-claude-for-life-sciences`, sample skills (single-cell RNA QC, prior-auth review, scVI-tools, scientific problem selection, instrument data → Allotrope, clinical trial protocol draft) and connectors (Scholar Gateway, Synapse, Benchling, BioRender, 10x Genomics, Medidata, NPI Registry, Open Targets, ChEMBL, Owkin, CMS Coverage, bioRxiv/medRxiv, PubMed, HealthEx, ICD-10, ClinicalTrials.gov, ToolUniverse, Function).
- Nonprofit (6): `getting-started-with-claude-for-nonprofits`, the two partnership guides, Benevity, Blackbaud, Candid.
