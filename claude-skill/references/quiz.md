# Quiz bank

Ask one question at a time, wait for the answer, then explain. Pick from lessons the learner has finished (`cc.py lessons`), mix in one "habits" question, and finish with a score and the lesson to review. Each lesson in [curriculum.md](curriculum.md) also has its own check questions. `[Ln]` = lesson.

## Basics and prompting

1. [L1] Which key stops Claude mid-turn without losing the work so far? → `Esc`.
2. [L1] How do you run `git status` yourself and let Claude see the output? → Type `!git status`.
3. [L2] Name the four parts of a goal-first prompt. → Goal, constraints, what "done" means (a check), relevant files.
4. [L2] Rewrite "make the API faster". → Name the endpoint, how it's measured, a numeric target (e.g. p95 < 200 ms), scope limits, and ask for a plan to approve first.
5. [L2] You've corrected Claude twice and it's still wrong. Next move? → `/clear` and write a better first prompt with what you learned.
6. [L3] When is it fine to skip plan mode? → When the change fits in one sentence.
7. [L3] How do you edit a plan before approving it? → `Ctrl+G` opens it in your editor.

## Context and memory

8. [L4] Why can a short question late in a long session cost more than in a new one? → The whole context is resent every turn.
9. [L4] True or false: `/compact` keeps every detail. → False — it summarizes; write decisions to a file or give `/compact` a focus.
10. [L4] `/btw` vs a subagent? → `/btw` answers from the current context without tools and isn't added to the conversation; a subagent uses tools in a fresh context.
11. [L5] Where does "always reply in Korean" go? A release checklist? The repo's test command? → `~/.claude/CLAUDE.md`; a skill; project `CLAUDE.md`.
12. [L5] Which belongs in memory: the preferred test framework, or today's open-issue count? → The framework; look up the count fresh.
13. [L5] How much of auto memory's `MEMORY.md` loads at start? → The first 200 lines or 25KB.
14. [L5] Does an `@import` in CLAUDE.md save context? → No, the imported file loads too.

## Permissions, safety, sessions

15. [L6] Which mode only allows pre-approved tools and denies the rest? → `dontAsk`.
16. [L6] Do deny rules still apply in `bypassPermissions`? → Yes, deny wins in every mode.
17. [L6] Auto mode approved code that fails tests. Why? → The classifier judges whether an action is dangerous, not whether code is correct.
18. [L7] Can `/rewind` undo files deleted by a Bash `rm`? → No — only Claude's file edits are checkpointed.
19. [L7] You want to try another approach without losing the current conversation. → `/branch`.

## Extending

20. [L8] What decides whether Claude loads a skill on its own? → Its name and description.
21. [L8] How do you make a deploy skill run only when you type it? → `disable-model-invocation: true`.
22. [L8] Three ingredients of a good skill (Academy)? → Format, tone/audience, one real example.
23. [L9] What comes back from a subagent to the main session? → Only its summary.
24. [L9] Why is a "test-runner" subagent a bad idea? → It hides the failure output you need to see.
25. [L10] A hook script exits 1. Is the tool call blocked? → No — only exit code 2 blocks.
26. [L10] "Run prettier after every edit" — skill or hook? → Hook (`PostToolUse`, matcher `Edit|Write`).
27. [L11] Which MCP scope shares a server with the team, and in which file? → `project`, `.mcp.json`.
28. [L11] Two checks after adding an MCP server? → `/mcp` status, then ask which tools it sees and what each returns.
29. [L12] You updated your plugin but users still get the old one. → Bump `version` in plugin.json and the marketplace entry.
30. [L12] How do teammates get a plugin automatically? → Commit `extraKnownMarketplaces` + `enabledPlugins` in `.claude/settings.json`.

## Automation and trust

31. [L13] Where does `--json-schema` output appear in `-p --output-format json`? → `structured_output`.
32. [L13] What does `--bare` skip? → Hooks, skills, plugins, MCP, CLAUDE.md, auto memory (needs `ANTHROPIC_API_KEY`).
33. [L14] Why combine auto mode with a `Stop` hook that runs tests? → Auto checks intent; the hook checks correctness.
34. [L14] What must a `/goal` condition be? → Checkable from the transcript (e.g. "all tests in api/ pass").
35. [L14] A clean, test-passing diff can still hide what, and which habit catches it? → Wrong assumptions or a plausible-but-wrong approach; ask "what did you assume?" and test a case likely to fail.

## Models, effort, cost (Academy)

36. Approach right but work came back unfinished — first move? → Raise effort one level; change model only if that fails.
37. After moving up a model, where should effort start? → Back at the default.
38. Which sets effort for one session only: `--effort` or `/effort`? → `--effort` (`/effort` persists).
39. Default model when unsure, and the one for long outcome-described work? → Sonnet; Fable.
40. Order these for automation: computer use, MCP, browser. → MCP → browser → computer use.

## What's new (refresh after `/claude-skill update`)

41. Since v2.1.283, which permission mode does a fresh session start in? → `auto`.
42. What does `/doctor prompt-audit` look for? → Stale paths, contradictions and outdated prompting in CLAUDE.md, skills, agents and commands.
43. If you have a skill named `verify`, when does Claude run it (v2.1.286+)? → Right before committing.
