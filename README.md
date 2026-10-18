# sonub-skills

**Agent Skills from [SONUB](https://sonub.com)** — a skill marketplace for Claude Code, and standard `SKILL.md` skills for Codex, Gemini CLI, GitHub Copilot CLI and any other agent.

🌐 **Homepage — pick a skill and copy the install in your language: https://thruthesky.github.io/sonub-skills/**

| Skill | Plugin | What it does |
|------|------|------|
| [`gp`](skills/gp) | `gp` | Manage all your work in **GitHub Projects** — boards, kanban columns, issues, images, TODO checklists, assignees — by talking to your agent. Uses git and the `gh` CLI. |
| [`claude-skill`](skills/claude-skill) | `cc-skill` | **Learn Claude Code and get better at it** — a 14-lesson study track with exercises and quizzes (built from Claude Academy and the official docs), answers checked against the live docs, a setup doctor, every new CHANGELOG feature summarized, and `/claude-skill update` to pull new features into the skill. |
| [`popup`](skills/popup) | `popup` | **Explain jargon with hover popups in any project** — one glossary JSON (meaning, plain words, examples, source code, related terms, “learn more” links to your own pages), a drop-in `popup.js`/`popup.css` with no build step, a checker, a doc audit that finds undefined jargon, and hover-title links for Markdown read on GitHub. |

## Install

```bash
claude plugin marketplace add thruthesky/sonub-skills          # once per computer

claude plugin install cc-skill@sonub-skills                    # global (user): every project
claude plugin install cc-skill@sonub-skills --scope project    # project: this repo, shared with the team (.claude/settings.json)
claude plugin install cc-skill@sonub-skills --scope local      # local: this repo, just you
```

Swap `cc-skill` for `gp` or `popup` (or install all). Then type `/claude-skill`, `/gp init <board URL>` or `/popup <page or terms>`. Update: `claude plugin marketplace update sonub-skills && claude plugin update cc-skill@sonub-skills`.

Without plugins, copy the skill folder into `~/.claude/skills/` (global) or `<project>/.claude/skills/` (project) — for Codex, Gemini CLI and Copilot CLI use `~/.agents/skills/` or `<project>/.agents/skills/`. Team auto-install, folder-copy one-liners, examples and an install box you can paste into your agent:

**[English](README.en.md)** · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

License: [MIT](LICENSE)
