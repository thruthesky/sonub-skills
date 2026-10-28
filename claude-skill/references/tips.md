# Habits that make Claude Code work well

From the official best-practices page (`cc.py read best-practices`), the Claude Academy courses and tutorials ([academy.md](academy.md)), and recent CHANGELOG features ([changelog-features.md](changelog-features.md)). Pick the few that fit what the user is doing; each comes with something to try now.

## Before you start a task

1. **State the goal, the check, the files.** "Add rate limiting to `api/login.ts`; done when `npm test -- login` passes and 6 rapid requests get a 429." → *Try*: rewrite your next request in that shape.
2. **Give Claude a way to verify its work** — a test, a command, a screenshot to compare. It is the single biggest quality lever. → *Try*: end prompts with "run X and show me the output".
3. **Explore → plan → code → commit.** Plan mode for anything you can't describe in one sentence. → *Try*: `Shift+Tab` to plan, `Ctrl+G` to edit the plan.
4. **Fuzzy idea? Let Claude interview you.** → *Try*: "Interview me about this feature, then write SPEC.md." Implement it in a fresh session.
5. **Point at examples.** "Follow the pattern in `UserService`." `@file` mentions and pasted screenshots beat descriptions.

## During the session

6. **Course-correct early.** `Esc` stops a wrong turn immediately; the work so far stays. Type while Claude works — messages queue (`Ctrl+Enter` sends now).
7. **One task per context.** `/clear` between unrelated tasks; `/context` when things feel slow or forgetful; `/compact keep <what matters>` within a long task.
8. **Investigate with subagents.** "Use a subagent to find every place we parse dates" — the reading stays out of your context.
9. **Side questions with `/btw`.** They don't pollute the conversation.
10. **Rewind instead of arguing.** `Esc Esc` → restore code and/or conversation, then try again with a better prompt. Commit before risky changes (Bash side effects aren't checkpointed).
11. **Two failed corrections → start over.** A clean session with a sharper prompt beats a long fight.
12. **Ask "what did you assume?"** before accepting a diff, and test the case most likely to fail. Discernment doesn't grow on its own — practise it.

## Set up once, benefit every day

13. **CLAUDE.md under 200 lines** — only what Claude can't infer. Turn repeated corrections into lines; turn must-never rules into hooks. → *Try*: `/init`, then `/doctor prompt-audit`.
14. **Fewer permission prompts, safely.** → *Try*: `/fewer-permission-prompts`; add `deny` rules for secrets (`Read(./.env)`). Auto mode is the default since v2.1.283; keep `bypassPermissions` for containers.
15. **A status line** showing model, context % and branch. → *Try*: `/statusline`.
16. **A verification skill.** Name it `verify` and Claude runs it before committing (v2.1.286+). → *Try*: `/claude-skill build skill`.
17. **Hooks for the boring musts** — format after edit, notify when Claude needs you, block pushes to main.
18. **Prune what you don't use.** Every skill, plugin and MCP server costs context. → *Try*: `/skill-doctor`, `/context`, `/mcp` disable.
19. **Prefer CLIs Claude already knows** (`gh`, `aws`, `gcloud`) over MCP servers when both work.

## Models, effort, cost

20. **Effort before model.** Start at the default effort, move one level at a time; switch model only when effort doesn't fix it, then reset effort. → *Try*: `/effort`, `--effort high` for one session.
21. **Lightest model that works.** Sonnet when unsure; Opus/Fable when the cheaper one struggles; Haiku for search subagents. Judge cost per finished task, not per token. → *Try*: `/usage` after the same task at two settings.

## Scale up

22. **Parallel sessions in worktrees.** `claude -w feature-x` per task; `claude --bg "…"` and `claude agents` to run several at once.
23. **Writer/reviewer split.** One session writes, a fresh one (or `/code-review`) reviews against the plan.
24. **Headless for repetitive work.** `claude -p "…" --output-format json` in a loop over files; `/batch` for big parallel changes; `/loop` and `/schedule` for recurring checks.
25. **Keep going until done.** `/goal <checkable condition>` keeps Claude working until it's met.

## Keep up

26. **Check what's new now and then.** → *Try*: `/claude-skill new`, `/release-notes`, `claude update`.
27. **Ask Claude about Claude.** "How do I …?" — this skill answers from the current docs; `/powerup` has built-in interactive lessons.
