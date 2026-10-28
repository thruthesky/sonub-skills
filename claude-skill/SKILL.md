---
name: claude-skill
description: Claude Code 를 공부하고 더 잘 쓰게 해 주는 스킬 — 14개 레슨 학습 과정(실습·퀴즈·진도), Claude Academy 튜토리얼 분석, 공식 문서로 확인한 답, 내 설정 점검(doctor), CHANGELOG 의 모든 새 기능 요약, `/claude-skill update` 로 새 기능을 스킬에 반영. Learn and master Claude Code — a study track with exercises and quizzes, answers checked against the live official docs, a setup doctor, every new feature from the CHANGELOG summarized, and an update command that pulls new CHANGELOG features into the skill. Use it whenever the user wants to learn, study or get better at Claude Code, asks how a Claude Code feature works (CLAUDE.md, memory, permissions, plan mode, context, /compact, checkpoints, skills, subagents, hooks, MCP, plugins, marketplaces, headless -p, GitHub Actions, worktrees, effort, models), asks what is new, wants tips or a cheatsheet, wants their setup reviewed, or wants to build a skill/hook/subagent/plugin/marketplace — e.g. "/claude-skill", "/claude-skill update", "클로드 코드 공부", "다음 레슨", "퀴즈", "새 기능 뭐 있어", "내 설정 점검", "훅 만드는 법", "teach me Claude Code".
license: MIT
compatibility: Needs Python 3.8+ and internet access for the docs and CHANGELOG. Works best in Claude Code; the study material also works in other agents.
---

# claude-skill — learn Claude Code, and keep up with it

Claude Code changes almost every day (hundreds of versions so far). This skill teaches it in order, answers from the **current** official docs instead of memory, checks the user's setup, and keeps a summary of every new feature from the CHANGELOG that `/claude-skill update` refreshes.

**Talk in the user's language.** The reference files are in English; translate as you teach. Keep commands, file paths and setting keys as they are.

## The tool — `scripts/cc.py`

```bash
CC=<this skill folder>/scripts/cc.py
python3 $CC doctor [--json]                    # version, settings by scope, CLAUDE.md sizes, rules, auto memory, skills, agents, plugins, MCP + advice
python3 $CC docs <words…>                      # search the official docs index (code.claude.com/docs/llms.txt)
python3 $CC read <page> [--section H] [--grep W]   # print a docs page, e.g. read hooks --section "Hook events"
python3 $CC changelog [--count N | --since V] [--grep W] [--all]   # CHANGELOG entries, Fixed lines hidden unless --all
python3 $CC update-check [--source DIR]        # what references/changelog-features.md covers vs the latest CHANGELOG
python3 $CC mark-covered <version> [--source DIR]
python3 $CC lessons                            # the study track with ✓ progress
python3 $CC progress [done N | undo N | reset]  # progress lives in ~/.config/claude-skill/progress.json
```

`scripts/skill-versions.sh` (sh + Node) shows the version, install date and update date of every skill installed with `npx skills`, global and project, and whether the source has a newer one: `sh <this skill folder>/scripts/skill-versions.sh [-g|-p] [--offline]`.

## What the user asks → what you do

The argument after `/claude-skill` (Codex `$claude-skill`) or the plain request picks the mode. No argument → show `lessons` and offer: continue the next lesson, quiz, what's new, check my setup.

| Request | Do this |
|------|------|
| `learn`, `lesson N`, "공부하자", "다음 레슨" | **Teach a lesson** (below) from [references/curriculum.md](references/curriculum.md) |
| `quiz [topic]`, "퀴즈" | Ask 5 questions one at a time from [references/quiz.md](references/quiz.md) (mix topics the user finished), wait for each answer, explain, give a score |
| any "how do I / what is / does Claude Code …" question | **Answer from the docs** (below) |
| `doctor`, "내 설정 점검", "review my setup" | Run `doctor`, explain each finding in plain words, propose concrete fixes; change settings only after the user says yes (the `/update-config` skill or editing the JSON) |
| `new`, `whats-new [N]`, "새 기능" | Read [references/changelog-features.md](references/changelog-features.md) (and `~/.config/claude-skill/changelog-local.md` if it exists); if `update-check` says the notes are behind, also run `changelog --since <covered>`. Lead with ⭐ items and what they change in daily work |
| `tips`, "잘 쓰는 법" | [references/tips.md](references/tips.md) — pick the 5–7 that fit what the user does, each with a command to try now |
| `cheatsheet`, "명령어 정리" | [references/cheatsheet.md](references/cheatsheet.md) — commands, shortcuts, CLI flags, file locations |
| `academy`, "아카데미" | [references/academy.md](references/academy.md) — what the Claude Academy tutorials teach and the Claude Code way to do each |
| `build <skill\|subagent\|hook\|mcp\|plugin\|marketplace\|claude-md>` | [references/extend.md](references/extend.md) — pick the right mechanism, then create it in the user's project with them and test it |
| `skills`, "설치된 스킬", "스킬 버전", "스킬 업데이트·삭제" | [references/skills-cli.md](references/skills-cli.md) — list, global vs project, paths, version and install date (run `scripts/skill-versions.sh`), update, remove; Claude Code reads only `.claude/skills`, never `.agents/skills` |
| `update`, "업데이트" | **Update the skill from the CHANGELOG** (below) |

### Teach a lesson

1. `python3 $CC lessons` → the next unfinished lesson unless a number was given. Read only that lesson's section in curriculum.md.
2. Teach in short steps: the goal in one line, the key points as a few bullets with the exact command for each, then **the exercise in the user's own project** — they run it (or you run it with them) and you look at the result together. Learning by doing beats reading.
3. Before trusting a detail that might have changed (a flag, a menu, a limit), check it: `python3 $CC read <page> --grep <word>`. If the docs differ from the lesson, teach the docs and fix the lesson text.
4. Ask the lesson's check questions one at a time. When the "done when" items are met: `python3 $CC progress done N`, and report the `check:` line plus what comes next.

### Answer from the docs

1. `python3 $CC docs <2–4 English keywords>` → pick the page; `python3 $CC read <page> --section "<heading>"` (or `--grep`).
2. Answer briefly with the exact command/setting, an example, and the doc link (`https://code.claude.com/docs/en/<page>`). Mention the minimum version when the page or CHANGELOG states one and the user's `claude --version` is older.
3. When it is a "can it do X" question, also try `python3 $CC changelog --grep <word> --count 400` — new features often land in the CHANGELOG before people notice them.
4. Never answer Claude Code specifics from memory alone — they go stale fast. If the docs can't be reached, say so and mark the answer as unverified.

### Update the skill from the CHANGELOG — `/claude-skill update`

Source of truth: https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md. The notes in `references/changelog-features.md` carry a `<!-- covered-through: X.Y.Z -->` marker.

1. `python3 $CC update-check` → the skill folder and its kind, the covered version, the latest version.
   - kind **installed-copy** (installed with `npx skills add https://sonub.com`, or a plugin cache): first run `npx skills update` (add `-g` for a global install) and check again — the maintainer may already have published the notes. If still behind, find out whether the user maintains the source — the `skills/claude-skill` folder of the thruthesky/sonub repository, served at https://sonub.com: `gh api repos/thruthesky/sonub --jq .permissions.push` → `true` means yes. Then use their checkout (`$CLAUDE_SKILL_SOURCE`, or look for a `sonub` git folder with `skills/claude-skill`; else `gh repo clone thruthesky/sonub -- --depth 1` into a work folder) with `--source <checkout>/skills/claude-skill`. Otherwise write the additions to `~/.config/claude-skill/changelog-local.md` (same format) so they survive updates.
   - kind **git** or **given**: edit that folder — it is the source.
2. `python3 $CC changelog --since <covered>` and read every item (Fixed lines are already hidden; use `--all --grep <word>` when a fix matters).
3. Edit `references/changelog-features.md` in the target folder:
   - Add each user-facing new capability, behavior change or removal to its topic section as `- **Name** (vX.Y.Z) — what it does; how to use it (command/flag/setting)`. Merge with an existing bullet when it extends a feature (add the version). Skip pure bug fixes and tiny internal notes.
   - Rewrite the "Latest additions" section at the top: the newest versions' best items, ⭐ on the 3–5 most useful for daily work.
   - New or removed slash commands, shortcuts, CLI flags or settings → also update `references/cheatsheet.md`; if a lesson in `curriculum.md` became wrong, fix it.
4. `python3 $CC mark-covered <latest> [--source DIR]` and check the `check:` line.
5. If the folder is a git checkout: show `git diff --stat` and commit only the skill folder (`claude-skill: CHANGELOG notes through vX.Y.Z`). For the maintainer of thruthesky/sonub, `update` means updating the published source: pull first, commit, push and deploy following that repository's AGENTS.md (sonub.com rebuilds the skill index and digests from `skills/` by itself — there is no version to bump); then `npx skills update` so their installed copy matches. Anyone else's copy: push only when they ask.
6. Report in the user's language: the range covered (old → new), the 3–7 best new features with how to try each, and which files changed.

## Rules

- Prefer doing over describing: when a lesson or answer involves a command, offer to run it in the user's project and show the result.
- Changing the user's settings, hooks, permissions or CLAUDE.md, installing plugins and creating files outside the current task: show the exact change and get a yes first.
- Never print secrets that `doctor` or settings files might reveal (env values, tokens). `doctor` prints only names and counts.
- Quotes from Anthropic material stay short; teach in your own words and link the source.
