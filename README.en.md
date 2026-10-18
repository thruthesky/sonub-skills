# sonub-skills — Agent Skills from SONUB

[README](README.md) · **English** · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

This repository is a **skill marketplace**. Every skill is a standard [Agent Skill](https://agentskills.io) — a folder with a `SKILL.md` — so it works in Claude Code, Codex, Gemini CLI, GitHub Copilot CLI and any other agent that reads Agent Skills. Claude Code can also install it as a plugin from this marketplace (`sonub-skills`), which makes updates one command.

| Skill | What it does |
|------|------|
| [`gp`](skills/gp) | Manage all your work in **GitHub Projects** with git and the `gh` CLI |
| [`claude-skill`](skills/claude-skill) | **Learn Claude Code and get better at it** — 14 lessons with quizzes, answers checked against the official docs, a setup doctor, every new CHANGELOG feature summarized, and `/claude-skill update` to pull in new ones (plugin name `cc-skill`) |
| [`popup`](skills/popup) | **Explain jargon with hover popups** in any project's pages and docs — meaning, plain words, examples, source code, related terms and “learn more” links to your own pages, from one glossary JSON |

## Install — globally (user) or per project

Every skill installs the same way. Put the plugin name from the table (`gp`, `cc-skill`, `popup`) in place of `<plugin>`.

**Step 1 — add the marketplace (once per computer)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**Step 2 — install where you want it**

| Scope | Command | Who gets it, where | Recorded in |
|------|------|------|------|
| **Global (user)** — the default | `claude plugin install <plugin>@sonub-skills` | you, in every project on this computer | `~/.claude/settings.json` |
| **Project (shared with the team)** | in the project folder: `claude plugin install <plugin>@sonub-skills --scope project` | everyone working in this repository | `.claude/settings.json` (commit it) |
| **Local (just you, just this project)** | in the project folder: `claude plugin install <plugin>@sonub-skills --scope local` | you, in this repository only | `.claude/settings.local.json` |

- In a session, `/plugin install <plugin>@sonub-skills` opens a screen where you pick the scope. If you installed from the terminal, run `/reload-plugins` in any open session.
- Check: `claude plugin list` (shows the scope). Update: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`. Remove: `claude plugin uninstall <plugin>@sonub-skills`.
- When the same plugin is set at several scopes, local beats project and project beats global.

**Let teammates get it automatically** — commit this to the repository's `.claude/settings.json`. After a teammate trusts the folder, Claude Code adds the marketplace and installs the plugins.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**Without plugins — copy the folder** into your agent's skill folder (`<skill>` = `gp`, `claude-skill` or `popup`).

| Tool | Global (user) | Project |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<project>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<project>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # this project only: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**Easiest** — tell your agent *"install the cc-skill plugin from thruthesky/sonub-skills globally"* (or *"for this project only"*) and it runs the commands above for you.

---

## gp — all your work on a GitHub Project board

You talk to your AI agent in plain words — *"make an issue: the login button does nothing on iPhone, attach this screenshot"*, *"move it to Done"*, *"add a Review column"*, *"what's on my plate?"* — and the agent does it on your GitHub Project board with `gh`, then reads the result back to confirm.

### What it covers

- **GitHub Projects explained** — repository, issue, project (board), item, draft, field, Status = columns, view, workflow. Your agent can teach it in your language.
- **Account and login** — sign-up steps for a new GitHub account, `gh` install, `gh auth login`, the `project` and `repo` scopes.
- **Boards** — create, rename, describe, make public/private, close/reopen, delete, link repositories, list your boards, pick a default board.
- **Columns (kanban)** — add, rename (cards stay), reorder, colour, delete (move cards elsewhere first).
- **Fields and views** — custom fields (text, number, date, single select), board/table/roadmap views with filters.
- **Issues** — create (into a column, with labels, milestone, parent issue, custom fields), edit, move between columns, close (moves to Done), reopen, comment, remove from the board, archive, delete.
- **Images** — attach screenshots or videos to an issue body or comment.
- **TODO** — a `- [ ]` checklist inside an issue: add, check, uncheck, remove; progress shown in lists. Draft items for quick ideas, converted to issues later.
- **People** — assign and unassign, see who has what, invite collaborators to a repository and give board roles.

### Requirements

- A GitHub account (free). No account yet? Sign up at https://github.com/signup — e-mail code, puzzle, Free plan (about three minutes).
- [`gh`](https://cli.github.com) — the GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`), logged in with the `project` and `repo` scopes.
- Python 3.8 or newer (standard library only).

### Install

**Easiest — let your agent do it.** Copy this box into Claude Code, Codex, Gemini CLI or Copilot CLI and send it:

```text
Install the gp skill from the thruthesky/sonub-skills repository.
Skill path: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — a standard Agent Skill (a folder with SKILL.md).

1. If you are Claude Code, install it as a plugin, running these in order (ignore "already added" errors):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - If I asked for "this project only", run the last line in the project folder with --scope project added.
   - If it is already installed, run instead: claude plugin update gp@sonub-skills
2. Any other agent: put it in the skill folder DIR — every project: ~/.agents/skills, this project only: <project>/.agents/skills.
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Run: python3 <skill folder>/scripts/gp.py doctor — and fix what it reports (install gh, gh auth login, gh auth refresh -s project,repo).
4. Tell me in short what was installed, the doctor result, and that I can now say things like "show my GitHub projects".
```

**Claude Code — two lines in a terminal** (works in every version):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

In a chat use `/plugin marketplace add thruthesky/sonub-skills` then `/plugin install gp@sonub-skills`. Newer versions also accept one line: `claude plugin install gp --marketplace thruthesky/sonub-skills`. After installing from a terminal, run `/reload-plugins` in an open chat (or restart).

**Any agent — copy the folder** into the agent's skill folder:

| Tool | User skill folder | Project skill folder |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### Global install and local (project) install

| | Global — every project | Local — this project only |
|------|------|------|
| Claude Code plugin | `claude plugin install gp@sonub-skills` | in the project folder: `claude plugin install gp@sonub-skills --scope project` (written to `.claude/settings.json`, shared with the team · just you: `--scope local`) |
| Claude Code folder copy | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Board to use | `/gp init <board URL> --global` → `~/.config/gp/config.json` | `/gp init <board URL>` → `<project>/.gp.json` |

Where the skill is installed and which board it uses are chosen separately. Usually you install the skill globally once and give each project its board with `/gp init <board URL>`.

### First run

Ask your agent *"set up gp"* (Claude Code: `/gp:gp`, Codex: `$gp`). It runs:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · logged in ✓ · scopes ✓ · default board
gh auth login                                   # only if not logged in — type the one-time code in the browser
gh auth refresh -s project,repo                 # only if a scope is missing
python3 scripts/gp.py projects                  # your boards
python3 scripts/gp.py init <board URL>          # this project's board (.gp.json) · every project: --global … or create one:
python3 scripts/gp.py project-create --title "My work" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Choose the board — `/gp init`

Each development project can have its own GitHub Project board. Give your agent the board's address in the project folder, and that project's work goes to that board.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Installed as a Claude Code plugin: `/gp:gp init …`; Codex: `$gp init …`. Saying "use https://… as this project's board" works too.

- **Local (default)** — inside a git repository it is saved in `<repository root>/.gp.json` and used only in that project (and its sub folders). It holds no secret: commit it so teammates use the same board, or add it to `.gitignore` to keep it to yourself.
- **Global** — `/gp init <URL> --global` (or "make it the default board for every project") → `~/.config/gp/config.json`, used in every folder without a `.gp.json`.
- Any page of the board works (`/views/2`, user boards `/users/…`, organization boards `/orgs/…`). The board is checked to exist and be readable before it is saved.
- `/gp init` alone shows the board in use and its settings file. Remove: `gp.py init --unset` (global: `--unset --global`).
- `/gp init` also writes an instruction into this project's `AGENTS.md`/`CLAUDE.md` and your global `~/.claude/CLAUDE.md`/`~/.codex/AGENTS.md`: "always use the gp skill to create, edit, delete, list or search GitHub Project issues, tasks and TODOs". Given a URL, it adds "work on this board" with that URL. Running it again refreshes only that part; `--show` only shows, `--no-instructions` skips it, `--remove-instructions` removes it.
- Which board is used: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → the project's `.gp.json` → the global setting.

### Using it — just say it

| You say | The agent runs |
|------|------|
| "Make an issue: login button does nothing on iPhone. Steps: reproduce, fix, test. Attach shot.png" | `create --repo app --title "…" --todo reproduce --todo fix --todo test --image shot.png` → Todo column |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → saved as this project's board (`.gp.json`) |
| "Put it in progress" · "Move #12 to Review" | `move app#12 doing` · `move app#12 review` |
| "Done!" | `close app#12` — closes the issue and moves it to Done |
| "Add 'update the docs' to its TODO" · "tick the first one" | `todo app#12 add "update the docs"` · `todo app#12 done 1` |
| "Add a column Urgent at the front" · "Rename Review to QA" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "Give it to alice" · "Invite bob to the repo" | `assign app#12 alice` · `invite bob --repo app` (asks first) |
| "What's on my plate?" | `list --assignee @me --state open`, then suggests one next task |
| "Note an idea on the board: dark mode" | `create --draft --title "dark mode"` |
| "Add a Priority field" | `field-add Priority --type single_select --options "High,Medium,Low"` |

All commands: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### How it works

- **Only `gh` and the Python standard library.** gh is called with an argument list (no shell), and titles and bodies go through stdin — quotes, emoji and newlines never break.
- **IDs by name.** Field, column and option IDs are looked up on every run, so you can rename columns on the website without breaking anything. Renaming a column keeps its cards.
- **Every change is read back.** After a change the script prints a `check:` line with the real state on GitHub (state, column, assignees, labels). The agent reports from it.
- **Images** use gh's `--attach` (GitHub user-attachments). With an older gh, images are committed to a `gp-assets` branch of the issue's repository and linked.
- **Safe by default.** Every changing command has `--dry-run`. Deleting an issue, a board, a field or a column with cards needs `--yes`, and the skill tells the agent to ask you first. Invitations (which e-mail a real person) are asked first too.
- **Board setting** is saved per project in `.gp.json` (local) and for every project in `~/.config/gp/config.json` (global). `--owner/--number` or `GP_OWNER`/`GP_PROJECT` win over both.

Note: right after creating an issue, GitHub's project list can take a few seconds to show it. The `check:` line reads the issue directly and is always current.

### Update and remove

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Other agents: run the `curl … | tar` line again to update; delete the `gp` folder to remove.

## claude-skill — learn Claude Code and get better at it

Claude Code ships a new version almost every day (400+ so far). This skill teaches it in order, answers questions from the **current official docs** instead of memory, checks your setup, and keeps a summary of every new feature in the CHANGELOG. One `/claude-skill update` pulls newly released features into the skill.

### What it covers

- **A 14-lesson study track** — from install and first prompts to explore → plan → code → commit, context management, CLAUDE.md and memory, permission modes, checkpoints, skills, subagents, hooks, MCP, plugins and marketplaces, headless runs and GitHub Actions, and long unattended work with verification. Every lesson has an **exercise in your own project** and check questions, and your progress is saved.
- **Claude Academy, analyzed** — the 64 Claude tutorials on [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) plus the Claude Code tutorials and courses (Claude Code 101, Claude Code in action, Agent Skills, Subagents), with what you learn in chat (Projects, memory, connectors, skills, Research, choosing model and effort…) mapped to how you do it in Claude Code.
- **Answers checked against the docs** — for "how do hooks work?" or "what is a plugin scope?", it searches and reads code.claude.com and answers with the command, an example and the doc link.
- **Every new feature in the CHANGELOG** — all 422 versions of [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) (v0.2.21 – v2.1.302), bug fixes left out, summarized into 14 topics, plus the 30 features worth knowing and the latest additions.
- **`/claude-skill update`** — fetches the latest CHANGELOG, finds the versions the skill doesn't cover yet, adds their features to the notes, cheatsheet and lessons, and records how far it has covered.
- **Setup doctor** — looks at your version, settings files (user, project, local), CLAUDE.md length, rules, auto memory, skills, subagents, plugins and MCP servers, and suggests fixes.
- **Cheatsheet, tips and build guides** — commands, shortcuts, CLI flags and file locations on one page; habits that work; how to build skills, subagents, hooks, MCP servers, plugins and marketplaces.

### Install

As in [Install](#install--globally-user-or-per-project) above. The plugin is named **`cc-skill`** (Claude Code reserves plugin names starting with `claude-` for Anthropic's own). The skill keeps the name `claude-skill`, so you call it with `/claude-skill`.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # global — every project
claude plugin install cc-skill@sonub-skills --scope project    # this project, shared with the team
```

Needs Python 3.8+ and internet access (it reads the official docs and the CHANGELOG).

### Using it

| You say | It does |
|------|------|
| `/claude-skill` · "let's study Claude Code" | Shows the lessons and your progress, starts the next one |
| `/claude-skill lesson 5` · "next lesson" | Teaches it, runs the exercise in your project, asks check questions, saves progress |
| `/claude-skill quiz` | Five questions from what you studied, one at a time, scored |
| "How do I run prettier after every edit with a hook?" | Reads the official docs and answers with a config example and the link |
| `/claude-skill new` · "what's new?" | The most useful recent features first, each with how to try it |
| `/claude-skill doctor` · "check my setup" | Reviews your setup and proposes fixes (asks before changing anything) |
| `/claude-skill tips` · `cheatsheet` · `academy` | Habits that work · commands and shortcuts · the Academy analysis |
| `/claude-skill build skill` · "make me a hook" | Picks the right mechanism and builds it with you in your project |
| `/claude-skill update` | Refreshes the skill's feature notes from the latest CHANGELOG |

Installed as a plugin, `/cc-skill:claude-skill …` works too. Codex: `$claude-skill …`.

### How `/claude-skill update` works

1. `scripts/cc.py update-check` compares the version the notes cover (the `covered-through` mark in `references/changelog-features.md`) with the latest CHANGELOG version.
2. On an installed plugin copy it first runs `claude plugin update cc-skill@sonub-skills` to get the published notes. To edit the skill's source (a git checkout), pass `--source <folder>`. Without a source it writes to `~/.config/claude-skill/changelog-local.md`, which survives plugin updates.
3. `cc.py changelog --since <covered>` lists the new versions' items (fixes hidden); the agent adds new features to their topics, rewrites "Latest additions", adds new commands and shortcuts to the cheatsheet and fixes lessons that became wrong.
4. `cc.py mark-covered <latest>` moves the mark; in a git checkout it bumps the version and commits (pushes only when you ask).
5. It reports the range covered and 3–7 new features worth trying, with how to try each.

### The tool — `scripts/cc.py`

Python standard library only.

```bash
python3 scripts/cc.py doctor                 # check your Claude Code setup + advice
python3 scripts/cc.py docs hooks             # search the official docs (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # read one section of a page
python3 scripts/cc.py changelog --count 5    # the latest 5 versions (fixes hidden)
python3 scripts/cc.py changelog --grep worktree --count 400   # find a feature by name
python3 scripts/cc.py update-check           # versions covered vs latest
python3 scripts/cc.py lessons                # lessons and progress
```

## popup — explain every hard word where the reader meets it

A reader stops at one unknown word — "token", "endpoint", "idempotent" — and loses the whole paragraph. This skill puts a small card on that word: hover it (tap on a phone, focus with the keyboard) and it explains the term in layers — one-line meaning, a short explanation, an everyday comparison, example lines, a source-code snippet, related terms, and a **“learn more” link to another page of your own project**. It works in any project: static sites, documentation generators, single-page apps, server-rendered sites, and plain Markdown read on GitHub.

### What it covers

- **One glossary, one place** — every explanation lives in one JSON file (or one per language); pages only point at term ids, so the same word reads the same everywhere.
- **A drop-in kit** — `popup.js` and `popup.css`, no framework and no build step. Plain text inside `main`/`article` is wrapped automatically (first use per page); explicit markup for phrases, sentences, "?" buttons and links that preview on hover. One card per page, pin on click, related chips switch in place, Esc returns focus, bottom sheet on phones, right-to-left languages, dark mode, theming with CSS variables.
- **Smart matching** — longest spelling first, word boundaries per script (Latin, Cyrillic, Korean particles, Arabic prefixes, CJK), terms that only apply in one section (`scope`), case-sensitive command names.
- **Writing rules** — how to write a card a beginner understands in one read, in every language the project ships: what each field is for, lengths, one comparison, facts checked, examples whenever real ones exist.
- **Tools** — `popup.py check` validates the glossary (every locale, example code identical across languages, related ids, learn-more targets exist, spelling clashes); `audit` shows which terms a document already uses and finds jargon with no entry yet; `add` merges new terms safely; `md` + `link` turn the glossary into `GLOSSARY.md` and link the first use in your Markdown files with the meaning as the hover title.
- **SONUB** — inside the SONUB repository it builds on SONUB's own Laravel glossary (17 languages, the AI tutor's voice) instead of adding a second system.

### Install

As in [Install](#install--globally-user-or-per-project) above, with the plugin name **`popup`**.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # global — every project
claude plugin install popup@sonub-skills --scope project    # this project, shared with the team
```

Needs Python 3.8+ for the tool. The kit runs in any modern browser.

### Using it

| You say | It does |
|------|------|
| `/popup docs/getting-started.md` · "add glossary popups to this page" | Finds the hard words, writes the entries, wires the kit in, checks it in a browser |
| `/popup token, sampling, temperature` | Writes those three entries and attaches them where they are used |
| "explain the menu items on hover" | Adds hover previews to links, with "?" buttons for phones and keyboards |
| "make the README beginner-friendly" | Builds `GLOSSARY.md` and links the first use of each term, with the meaning on hover |
| "translate the glossary to Japanese" | Adds `ja` to every entry and checks nothing is missing |

Installed as a plugin, `/popup:popup …` works too. Codex: `$popup …`.

### The tool — `scripts/popup.py`

Python standard library only.

```bash
python3 scripts/popup.py init popup --locales en,ko   # copy popup.js/css, start glossary.json, write .popup.json
python3 scripts/popup.py audit docs                   # terms used per file + jargon with no entry
python3 scripts/popup.py add new-terms.json --dry-run # merge new terms (checked, never overwrites silently)
python3 scripts/popup.py check                        # validate the glossary
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # Markdown on GitHub
```

Then add two tags to your layout:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## Repository layout

```
.claude-plugin/marketplace.json   ← the marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← the skill: when to use it and how
├─ .claude-plugin/plugin.json     ← plugin info (Claude Code only; other tools ignore it)
├─ scripts/gp.py                  ← the tool
└─ references/                    ← read when needed
   ├─ github-projects.md          ← concepts, account, login, first board
   └─ commands.md                 ← every command + plain gh / GraphQL recipes
skills/claude-skill/
├─ SKILL.md                       ← the skill: when to use it and how
├─ .claude-plugin/plugin.json     ← plugin info (plugin name cc-skill)
├─ scripts/cc.py                  ← study tool: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 lessons · Academy analysis · CHANGELOG features · cheatsheet · build guides · tips · quiz
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← the skill: when to use it and how
├─ .claude-plugin/plugin.json     ← plugin info
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← SONUB-only tools (Laravel glossary)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

Learn how skills work in the **Agent Skills** chapter of the SONUB AI course: https://sonub.com/learn/ai#agent-skill

License: [MIT](LICENSE)
