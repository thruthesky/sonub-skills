# sonub-skills — Agent Skills from SONUB

[README](README.md) · **English** · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

This repository is a **skill marketplace**. Every skill is a standard [Agent Skill](https://agentskills.io) — a folder with a `SKILL.md` — so it works in Claude Code, Codex, Gemini CLI, GitHub Copilot CLI and any other agent that reads Agent Skills. Claude Code can also install it as a plugin from this marketplace (`sonub-skills`), which makes updates one command.

| Skill | What it does |
|------|------|
| [`gp`](skills/gp) | Manage all your work in **GitHub Projects** with git and the `gh` CLI |

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

### Repository layout

```
.claude-plugin/marketplace.json   ← the marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← the skill: when to use it and how
├─ .claude-plugin/plugin.json     ← plugin info (Claude Code only; other tools ignore it)
├─ scripts/gp.py                  ← the tool
└─ references/                    ← read when needed
   ├─ github-projects.md          ← concepts, account, login, first board
   └─ commands.md                 ← every command + plain gh / GraphQL recipes
```

Learn how skills work in the **Agent Skills** chapter of the SONUB AI course: https://sonub.com/learn/ai#agent-skill

License: [MIT](LICENSE)
