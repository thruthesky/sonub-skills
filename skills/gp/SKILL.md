---
name: gp
description: 나의 모든 일감을 GitHub Project 로 관리하는 스킬. 이슈(일감) 생성/수정/삭제, 이미지 첨부, TODO 추가, 목록, 컬럼(칸반) 생성, 이름 변경 등 GitHub Project 관련 모든 이슈 관리를 할 때 사용한다. Manages all of your work in GitHub Projects (v2) with git and the gh CLI — explains GitHub Projects, sets up a GitHub account and gh login, chooses the board per project (`init <board URL>` → .gp.json) or for every project (`init … --global`), creates/edits/closes/deletes boards, adds/renames/reorders/deletes columns (kanban), custom fields and views, creates/edits/moves/closes/reopens/deletes issues, attaches images, keeps TODO checklists and drafts, assigns people and invites collaborators — also inside Claude Code cloud sessions (claude.ai/code, `claude --cloud`, routines), where it manages issues with REST `gh api` calls and queues board moves as gp:… labels that a gp-sync GitHub Action applies. Use it whenever the user talks about tasks, issues, a kanban board, columns, TODOs or assigning work, even without saying GitHub — e.g. "/gp init https://github.com/users/me/projects/1", "이 프로젝트 보드 설정", "이슈 만들어", "TODO 에 추가", "Done 으로 옮겨", "칸 만들어", "컬럼 이름 바꿔", "스크린샷 첨부", "내 일 보여 줘", "create an issue", "move it to done", "add a column", "assign it to", "show my tasks".
license: MIT
compatibility: Needs Python 3.8+ and gh (GitHub CLI) logged in with the project and repo scopes. In a Claude Code cloud session the session's gh (or Claude Code's built-in `gh api`, v2.1.288+) is enough for issues; the board follows through the gp-sync Action set up once with `gp.py cloud-setup`.
---

# gp — all your work on a GitHub Project board

GitHub Projects (v2) is a board that sits on top of GitHub issues. An **issue** is one piece of work (it lives in a repository); the **board** (project) collects issues from any number of repositories; the board's **Status** field is the set of **columns** you see in a kanban view. Read [references/github-projects.md](references/github-projects.md) when the user is new to GitHub, has no account yet, or asks what a project/issue/field/view is.

## The tool — `scripts/gp.py`

Do everything through this script. It finds field, column and option IDs by name on every run, sends titles and bodies through stdin (no shell quoting problems), and after each change reads the issue back and prints a `check:` line. Report from that line.

```bash
GP=<this skill folder>/scripts/gp.py
python3 $GP doctor                         # gh installed? logged in? 'project' + 'repo' scopes? which board, from which file?
python3 $GP projects [--owner ORG]         # boards of me (or an org)
python3 $GP init <board URL>               # this project's board → <git root>/.gp.json
python3 $GP init <board URL> --global      # every project's board → ~/.config/gp/config.json
python3 $GP init                           # write the "always use gp" instructions (below) + show the board in effect
python3 $GP init --show                    # only show the board · init --unset [--global] removes a setting
python3 $GP info                           # fields, columns, items per column, views, closed-but-not-done items

python3 $GP create --repo R --title "…" [--body "…"] [--status todo] [--assignee @me] [--label bug] \
        [--image "shot.png#alt text"] [--todo "step 1" --todo "step 2"] [--field Priority=High] [--parent 12]
python3 $GP create --draft --title "idea …"          # a note on the board only; later: convert ITEM --repo R
python3 $GP list [--status todo,doing] [--assignee @me] [--repo R] [--label L] [--state open] [--search word]
python3 $GP show R#12                                # body, checklist, board column, last comments
python3 $GP move R#12 done                           # aliases: todo, doing/wip, review, done, urgent, later (+ 한국어)
python3 $GP edit R#12 [--title …] [--append "…"] [--add-label L] [--field Priority=Low]
python3 $GP set  R#12 [--status …] [--assignee L] [--unassign L] [--comment "…"] [--close|--reopen]
python3 $GP close R#12 [--comment "…"] [--reason "not planned"]   # closes AND moves to Done/FIXED
python3 $GP reopen R#12 [--status todo]
python3 $GP todo R#12 [add "text"… | done 2 | undo 2 | remove 2]  # '- [ ]' checklist inside the issue
python3 $GP attach R#12 a.png "b.png#alt" [--comment "after the fix"]
python3 $GP comment R#12 "text" [--image c.png]
python3 $GP assign R#12 alice bob [--remove]
python3 $GP remove R#12 [--archive]                  # off the board; the issue stays
python3 $GP delete R#12 --yes                        # the issue is gone for good — ask first

python3 $GP project-create --title "My work" --columns "Todo,In Progress,Review,Done" --repo R --use
python3 $GP project-edit [--title …] [--desc …] [--readme …] [--public|--private] [--close|--reopen]
python3 $GP project-link R [--unlink]
python3 $GP project-delete --yes                     # ask first
python3 $GP columns | column-add NAME [--after X|--first] [--color red] | column-rename OLD NEW
python3 $GP column-order "Todo,In Progress,Done" | column-delete NAME [--move-to X] [--yes]
python3 $GP field-add Priority --type single_select --options "High,Medium,Low" | field-delete NAME --yes
python3 $GP view-add "My board" --layout board [--filter "assignee:@me"]
python3 $GP people [--repo R] | invite LOGIN --repo R [--permission push] [--board-role writer]
python3 $GP sync [R#12 …] [--repo R]                # apply queued gp:… labels to the board; closed issues → Done
python3 $GP cloud-setup [--repo R]                   # once, on a computer: make this repo ready for cloud sessions
```

- `<issue>` is a URL, `owner/repo#12` or `repo#12` (owner = the board owner). `--repo` takes `repo` or `owner/repo`.
- The board is `--owner/--number`, else `GP_OWNER/GP_PROJECT`, else the project's `.gp.json` (nearest from the current folder up to the git root), else the global `~/.config/gp/config.json`. Run the script from the user's project folder so its `.gp.json` is found. Every changing command takes `--dry-run`.
- Every option and the gh/GraphQL recipes for rarer things (labels, milestones, built-in workflows, iterations, templates, sub-issues, transfer, lock) are in [references/commands.md](references/commands.md). Use plain `gh` for those.

## `init` — which board this project uses

Each development project can have its own board. `/gp init https://github.com/users/thruthesky/projects/17/views/1` (Claude Code plugin: `/gp:gp init …`) or "이 프로젝트는 이 보드로 해" → `init <URL>`.

- The URL may be any page of the board (`/views/N`, `?filterQuery=…`), a user board (`/users/U/projects/N`) or an org board (`/orgs/O/projects/N`); `owner/number` works too.
- Default: inside a git repository → **local**, saved in `<git root>/.gp.json` and used only in that project. Outside git, or when the user says global / 전역 / 모든 프로젝트 / "기본 보드" → `--global`. "이 프로젝트만" → `--local`.
- `init` checks that the board exists and is readable before saving. Report the board title, URL, scope and file from its output. `.gp.json` holds no secret (owner, number, title, URL): tell the user once they can commit it so teammates get the same board, or add it to `.gitignore`; don't commit it for them unless asked.
- `init` with no URL → writes the instructions below and shows the board in effect. "어느 보드야?" → `init --show`. No board yet → run `projects` and ask which one (or create one).

**Instructions in CLAUDE.md / AGENTS.md.** Every `init` (with or without a URL, and `project-create --use`) also writes a block "🛑 GitHub Project work → always use the gp skill" — issues, 일감, 할 일, TODO, board, columns; create/edit/move/close/delete/list/search/assign — so later sessions load this skill by themselves instead of calling `gh` directly:

- **Project**: `<git root>/AGENTS.md` (Codex and other agents) and `CLAUDE.md` (or `.claude/CLAUDE.md`), with **this project's board URL** from `.gp.json` (or the global board it falls back to) and the repository new issues go to. A CLAUDE.md that imports `@AGENTS.md` gets it once through AGENTS.md; a missing CLAUDE.md is created as `@AGENTS.md` (Claude Code reads AGENTS.md only when there is no CLAUDE.md, so this keeps both working).
- **Global** (every project): `~/.claude/CLAUDE.md` and `$CODEX_HOME/AGENTS.md` (`~/.codex`), for the agents installed here, with the `--global` board URL when one is set. Skipped in a cloud session.
- The block sits between `<!-- gp:begin … -->` and `<!-- gp:end -->` and is replaced in place on the next `init` (the rest of the file is untouched). `--no-instructions` skips it, `init --remove-instructions` removes it everywhere. Report each file and what happened (`created`/`added`/`updated`/`unchanged`) from the output; the project files are worth committing with `.gp.json`.

## Claude Code cloud sessions

A cloud session (claude.ai/code, the Claude app, `claude --cloud`, routines) runs on Anthropic's VM and reaches GitHub only through a proxy that **blocks GraphQL and every path outside `repos/{owner}/{repo}/…`** for the session's repositories. Tested 2026-10-18: `gh issue`, `gh project`, `gh api graphql` and the Projects REST API (`users/…/projectsV2`) all get HTTP 403 there; `gh api repos/…` works. When the image has no GitHub CLI, Claude Code (v2.1.288+) adds a built-in `gh` that knows only `gh api` — same limits. This is Claude Code only; Codex and other agents keep using the normal gh CLI.

gp.py sees this (`CLAUDE_CODE_REMOTE=true`, `GH_TOKEN=proxy-injected`, or a gh that only knows `gh api`) and switches to **rest mode** by itself (`GP_MODE=rest|gh` overrides it):

- **Works directly** (REST): `create`, `list`, `show`, `edit`, `todo`, `comment`, `attach` (images go to the `gp-assets` branch), `assign`, `set`, `close`, `reopen`, `people`, `doctor`, `columns`/`info` (from `.gp.json`). `--repo` defaults to the session's repository.
- **Queued for the board**: the column (`move`, `--status`) and custom fields (`--field`) become labels — `gp:In Progress`, `gp:Priority=High`. The **gp-sync Action** in the repository moves the item and removes the label within about a minute; a closed issue goes to Done. Without the Action, `gp.py sync` on a computer does the same. Say "queued; the Action moves it" — don't claim the board already changed.
- **Not possible in the cloud**: board, column, field and view commands, `create --draft`, `convert`, `remove`, `delete`, `invite --board-role`. gp.py stops with the reason; do them on a computer, or use `close --reason "not planned"` instead of `delete`.

**Setup once per repository, on a computer with gh** (the agent can do all of it): `python3 $GP init <board URL>` then `python3 $GP cloud-setup` in the repository. It writes `.gp.json` with the board's columns (a cloud session can't read them), copies this skill to `.claude/skills/gp/` (cloud sessions don't install plugins or read `~/.claude/skills`), writes `.github/workflows/gp-sync.yml`, and stores the gh login token as the Actions secret `GP_TOKEN` (`--no-secret` to set your own token with `project`+`repo` scopes). Then commit and push those three paths. Run `cloud-setup` again after updating the skill or changing the board's columns. In a cloud session start with `python3 .claude/skills/gp/scripts/gp.py doctor`.

## First time on a computer

1. `doctor`. Fix each ✗ line yourself where you can: install gh (`brew install gh` · `winget install GitHub.cli` · https://cli.github.com), add scopes with `gh auth refresh -s project,repo`.
2. No account or not logged in: account sign-up needs the person (e-mail code, CAPTCHA) — give them the short steps from references/github-projects.md §2, then run `gh auth login` for them (it shows a one-time code to type in the browser).
3. `projects`. One board that looks right → `init` it (local in a project, `--global` for every project). None → `project-create … --use` with the columns the user asked for (default `Todo,In Progress,Done`) and add a board view (`view-add Board --layout board`; a new project starts with a table view only).

## How to read requests

- **"이슈/일감 만들어", "add a task", or just a sentence of work** → `create`. Pick the repository: the one the user named → the repository of the current folder (`git remote get-url origin`) → the repository most items on the board use (`info`). Without a column the issue goes to the board's Todo column. Put given steps in `--todo`, screenshots in `--image`. Don't ask — create, then report URL, repo, column and what you guessed.
- **"TODO 추가"** → if an issue is being discussed, add checklist lines to it (`todo R#12 add …`); otherwise create a new issue in the Todo column.
- **"옮겨", "move to X"** → `move` only (don't close). **"끝났어", "done", "완료"** → `close` (closes and moves to Done). Moving a closed issue back to Todo/In Progress → `reopen --status …`.
- **Columns** ("칸/컬럼 만들어", "이름 바꿔", "순서") → `column-add` / `column-rename` / `column-order`. Renaming keeps every item in its column (option IDs are kept). The kanban view's columns are the Status values, so these commands change the board you see.
- **"내 일", "show my tasks", "what's next"** → `list --assignee @me --state open`; suggest one next item (Urgent → In Progress you touched recently → Todo).
- **Images**: `--image`/`attach` upload through gh's `--attach` (stored on GitHub's user-attachments). With an old gh the script commits the files to a `gp-assets` branch of the issue's repository and links them instead — mention that once.
- "this one", "the issue I just made" mean the issue from this conversation; don't ask when it is clear.

## Ask before

- `delete` (issue), `project-delete`, `field-delete`, `column-delete` when items are inside (offer `--move-to`), closing or moving many issues at once — show the list first.
- `invite` — it sends an e-mail invitation to a real person. Assigning someone works only after they are a collaborator of the repository.

## Good to know

- Right after `create`/`item-add`, `list` and `info` can miss the new item for a few seconds (GitHub's list is eventually consistent). The `check:` line reads the issue directly and is reliable; wait ~10 s before listing.
- `gh` errors about scopes → `gh auth refresh -s project,repo`. "Resource not accessible" on an org board → the user needs write access to that project.
- Install: per user (every project) — Claude Code `claude plugin install gp@sonub-skills` (or `~/.claude/skills/gp`), other agents `~/.agents/skills/gp`; per project — `claude plugin install gp@sonub-skills --scope project` (or `.claude/skills/gp`), `.agents/skills/gp`. Where the skill is installed and which board it uses are separate: a globally installed gp still uses each project's `.gp.json`.
- A board belongs to a user or an organization; issues can come from any repository the user can read. Draft items live only on the board until `convert`ed.
