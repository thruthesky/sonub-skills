---
name: gp
description: 나의 모든 일감을 GitHub Project 로 관리하는 스킬. 이슈(일감) 생성/수정/삭제, 이미지 첨부, TODO 추가, 목록, 컬럼(칸반) 생성, 이름 변경 등 GitHub Project 관련 모든 이슈 관리를 할 때 사용한다. Manages your work in GitHub Projects (v2) with the gh CLI — issues and boards only, it never edits code or docs. Sets up a GitHub account and gh login, chooses the board per project (`init <board URL>` → .gp.json, or `--global`), creates/edits/closes/deletes boards, adds/renames/reorders/deletes columns (kanban), custom fields and views, creates/edits/moves/closes/reopens/deletes issues, attaches images, keeps TODO checklists and drafts, assigns people, invites/lists/removes members — also in Claude Code cloud sessions. Use it whenever the user talks about tasks, issues, a kanban board, columns, TODOs or assigning work, even without saying GitHub — e.g. "/gp init https://github.com/users/me/projects/1", "이 프로젝트 보드 설정", "이슈 만들어", "TODO 에 추가", "Done 으로 옮겨", "alice 초대해", "내 일 보여 줘", "create an issue", "move it to done", "show my tasks".
license: MIT
compatibility: Needs Python 3.8+ and gh (GitHub CLI) logged in with the project and repo scopes. In a Claude Code cloud session the session's gh (or Claude Code's built-in `gh api`, v2.1.288+) is enough for issues; the board follows through the gp-sync Action set up once with `gp.py cloud-setup`.
---

# gp — all your work on a GitHub Project board

GitHub Projects (v2) is a board that sits on top of GitHub issues. An **issue** is one piece of work (it lives in a repository); the **board** (project) collects issues from any number of repositories; the board's **Status** field is the set of **columns** you see in a kanban view. Read [references/github-projects.md](references/github-projects.md) when the user is new to GitHub, has no account yet, or asks what a project/issue/field/view is.

## 🛑 Scope — GitHub issues and the board only, never the project's files

This skill manages **issues, comments, the board, its columns/fields/views and members — on GitHub, nothing else.** It is used by teams who only want their tasks tracked, so it must never change their code.

- **Never** create, edit, delete, rename, format, `git add`/`commit`/`push`/`checkout`/`stash`/`reset` any file of the project while doing gp work — source code, tests, configs, documents, README, CLAUDE.md/AGENTS.md, lock files. Not "a small fix on the way", not "to make the issue true", not a typo. Reading files (to write a better issue, to quote a line or a path) is fine.
- **A piece of work given to gp is recorded, not done.** "/gp 로그인 버그 고쳐", "/gp add dark mode", "/gp fix #12" → create the issue (or add TODO lines, a comment, move the card) and report it. Do not start the work. If the user wants the code changed too, that is a separate request without gp — say so in one line at the end, and stop.
- The only files gp itself writes are its own settings, and only on an explicit command: `init` → `.gp.json` (or `~/.config/gp/…` with `--global`), `init --instructions` → the gp block in CLAUDE.md/AGENTS.md, `cloud-setup` → `.gp.json`, `.claude/skills/gp/`, `.github/workflows/gp-sync.yml`. Run those only when the user asks for exactly that, and never commit them for the user. Images go to GitHub (`--attach`, or the `gp-assets` branch through the API — never the working tree).
- Before reporting, check `git status`: gp work leaves it exactly as it was. If something you did changed a file, put back only your own change and say so.

## The tool — `scripts/gp.py`

Do everything through this script. It finds field, column and option IDs by name on every run, sends titles and bodies through stdin (no shell quoting problems), and after each change reads the issue back and prints a `check:` line. Report from that line.

```bash
GP=<this skill folder>/scripts/gp.py
python3 $GP doctor                         # gh installed? logged in? 'project' + 'repo' scopes? which board, from which file?
python3 $GP projects [--owner ORG]         # boards of me (or an org)
python3 $GP init <board URL>               # this project's board → <git root>/.gp.json
python3 $GP init <board URL> --global      # every project's board → ~/.config/gp/config.json
python3 $GP init                           # show the board in effect (touches no file)
python3 $GP init --instructions             # only when asked: write the "always use gp" block into CLAUDE.md/AGENTS.md
python3 $GP init --show                    # only show the board · init --unset [--global] removes a setting
python3 $GP init --only Projects=SONUB      # this project works on Projects = SONUB items only, unless a command names another value (--only none removes it)
python3 $GP info                           # fields, columns, items per column, views, closed-but-not-done items

python3 $GP create --repo R --title "…" [--body "…"] [--status todo] [--assignee L | --no-assignee] [--label bug] \
        [--image "shot.png#alt text"] [--todo "step 1" --todo "step 2"] [--field Priority=High] [--parent 12]
python3 $GP create --draft --title "idea …"          # a note on the board only; later: convert ITEM --repo R
python3 $GP list [--status todo,doing] [--assignee @me] [--repo R] [--label L] [--state open] [--search word] [--field Projects=Zar] [--all]
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
python3 $GP option-add Projects Zar Edson                # add values to a single-select field (items keep theirs)
python3 $GP view-add "My board" --layout board [--filter "assignee:@me"]
python3 $GP people [--repo R]                        # items per person on the board
python3 $GP invite alice bob [--repo R]… [--board-role writer] [--permission push] [--no-board|--no-repo]
python3 $GP members [--repo R]… [--json]             # board owner + people added, repo collaborators, pending invitations
python3 $GP member-remove alice [--repo R]… [--no-board|--no-repo] --yes   # off the board + out of the repos — ask first
python3 $GP invitations | accept [ID|owner/repo|inviter|--all] | decline …   # the invited person's side
python3 $GP leave owner/repo… [--board] --yes        # remove yourself
python3 $GP sync [R#12 …] [--repo R]                # apply queued gp:… labels to the board; closed issues → Done
python3 $GP cloud-setup [--repo R]                   # once, on a computer: make this repo ready for cloud sessions
```

- `<issue>` is a URL, `owner/repo#12` or `repo#12` (owner = the board owner). `--repo` takes `repo` or `owner/repo`.
- The board is `--owner/--number`, else `GP_OWNER/GP_PROJECT`, else the project's `.gp.json` (nearest from the current folder up to the git root), else the global `~/.config/gp/config.json`. Run the script from the user's project folder so its `.gp.json` is found. Every changing command takes `--dry-run`.
- Every option and the gh/GraphQL recipes for rarer things (labels, milestones, built-in workflows, iterations, templates, sub-issues, transfer, lock) are in [references/commands.md](references/commands.md). Use plain `gh` for those.

## `init` — which board this project uses

Each development project can have its own board. `/gp init https://github.com/users/thruthesky/projects/17/views/1` or "이 프로젝트는 이 보드로 해" → `init <URL>`.

- The URL may be any page of the board (`/views/N`, `?filterQuery=…`), a user board (`/users/U/projects/N`) or an org board (`/orgs/O/projects/N`); `owner/number` works too.
- Default: inside a git repository → **local**, saved in `<git root>/.gp.json` and used only in that project. Outside git, or when the user says global / 전역 / 모든 프로젝트 / "기본 보드" → `--global`. "이 프로젝트만" → `--local`.
- `init` checks that the board exists and is readable before saving. Report the board title, URL, scope and file from its output. `.gp.json` holds no secret (owner, number, title, URL): tell the user once they can commit it so teammates get the same board, or add it to `.gitignore`; don't commit it for them unless asked.
- `init` with no URL → shows the board in effect. "어느 보드야?" → `init --show`. No board yet → run `projects` and ask which one (or create one).
- **Default field values — `init --only Projects=SONUB`** ("이 프로젝트는 SONUB 것만", "project field 가 없으면 sonub 만"): saved as `"only"` in `.gp.json` (`GP_ONLY` overrides; `--only none` removes it). A command that names no value for that field works on those items only: `list`, `info`, `people` show only them, `create` files the new issue under them, and assigning someone keeps the card there (the person field is skipped for that field). The user names another value → `--field Projects=Zar` (in `list` too; `*` = any value); the whole board → `--all`. Commands on one issue (`show`, `move`, `close` …) work on any issue. Each list prints an `only …` line — say in the report that the list is limited to it.

**Instructions in CLAUDE.md / AGENTS.md — only with `--instructions`.** `init` and `project-create --use` leave CLAUDE.md/AGENTS.md alone. Only when the user asks for it ("CLAUDE.md 에 gp 지침 넣어", "make every session use gp"), `init --instructions` writes a block "🛑 GitHub Project work → always use the gp skill" — issues, 일감, 할 일, TODO, board, columns; create/edit/move/close/delete/list/search/assign — so later sessions load this skill by themselves instead of calling `gh` directly:

- **Project**: `<git root>/AGENTS.md` (Codex and other agents) and `CLAUDE.md` (or `.claude/CLAUDE.md`), with **this project's board URL** from `.gp.json` (or the global board it falls back to) and the repository new issues go to. A CLAUDE.md that imports `@AGENTS.md` gets it once through AGENTS.md; a missing CLAUDE.md is created as `@AGENTS.md` (Claude Code reads AGENTS.md only when there is no CLAUDE.md, so this keeps both working).
- **Global** (every project): `~/.claude/CLAUDE.md` and `$CODEX_HOME/AGENTS.md` (`~/.codex`), for the agents installed here, with the `--global` board URL when one is set. Skipped in a cloud session.
- The block sits between `<!-- gp:begin … -->` and `<!-- gp:end -->` and is replaced in place on the next `init` (the rest of the file is untouched). The block also carries the scope rule above (gp never changes the project's files). `init --remove-instructions` removes it everywhere. Report each file and what happened (`created`/`added`/`updated`/`unchanged`) from the output; the project files are worth committing with `.gp.json`.

## Claude Code cloud sessions

A cloud session (claude.ai/code, the Claude app, `claude --cloud`, routines) runs on Anthropic's VM and reaches GitHub only through a proxy that **blocks GraphQL and every path outside `repos/{owner}/{repo}/…`** for the session's repositories. Tested 2026-10-18: `gh issue`, `gh project`, `gh api graphql` and the Projects REST API (`users/…/projectsV2`) all get HTTP 403 there; `gh api repos/…` works. When the image has no GitHub CLI, Claude Code (v2.1.288+) adds a built-in `gh` that knows only `gh api` — same limits. This is Claude Code only; Codex and other agents keep using the normal gh CLI.

gp.py sees this (`CLAUDE_CODE_REMOTE=true`, `GH_TOKEN=proxy-injected`, or a gh that only knows `gh api`) and switches to **rest mode** by itself (`GP_MODE=rest|gh` overrides it):

- **Works directly** (REST): `create`, `list`, `show`, `edit`, `todo`, `comment`, `attach` (images go to the `gp-assets` branch), `assign`, `set`, `close`, `reopen`, `people`, `doctor`, `columns`/`info` (from `.gp.json`). `--repo` defaults to the session's repository.
- **Queued for the board**: the column (`move`, `--status`) and custom fields (`--field`) become labels — `gp:In Progress`, `gp:Priority=High`. The **gp-sync Action** in the repository moves the item and removes the label within about a minute; a closed issue goes to Done. Without the Action, `gp.py sync` on a computer does the same. Say "queued; the Action moves it" — don't claim the board already changed.
- **Not possible in the cloud**: board, column, field and view commands, `create --draft`, `convert`, `remove`, `delete`, `invite --board-role`. gp.py stops with the reason; do them on a computer, or use `close --reason "not planned"` instead of `delete`.

**Setup once per repository, on a computer with gh** — only when the user asks for cloud setup, because it adds files to their repository: `python3 $GP init <board URL>` then `python3 $GP cloud-setup` in the repository. It writes `.gp.json` with the board's columns (a cloud session can't read them), copies this skill to `.claude/skills/gp/` (cloud sessions don't install plugins or read `~/.claude/skills`), writes `.github/workflows/gp-sync.yml`, and stores the gh login token as the Actions secret `GP_TOKEN` (`--no-secret` to set your own token with `project`+`repo` scopes). Tell the user to commit and push those three paths (do it only if they ask). Run `cloud-setup` again after updating the skill or changing the board's columns. In a cloud session start with `python3 .claude/skills/gp/scripts/gp.py doctor`.

## First time on a computer

1. `doctor`. Fix each ✗ line yourself where you can: install gh (`brew install gh` · `winget install GitHub.cli` · https://cli.github.com), add scopes with `gh auth refresh -s project,repo`.
2. No account or not logged in: account sign-up needs the person (e-mail code, CAPTCHA) — give them the short steps from references/github-projects.md §2, then run `gh auth login` for them (it shows a one-time code to type in the browser).
3. `projects`. One board that looks right → `init` it (local in a project, `--global` for every project). None → `project-create … --use` with the columns the user asked for (default `Todo,In Progress,Done`) and add a board view (`view-add Board --layout board`; a new project starts with a table view only).

## How to read requests

- **"이슈/일감 만들어", "add a task", or just a sentence of work** → `create` — record it, don't do it (see Scope). Pick the repository: the one the user named → the repository of the current folder (`git remote get-url origin`) → the repository most items on the board use (`info`). Without a column the issue goes to the board's Todo column. The issue is assigned to its creator (the logged-in gh user, `@me`) by default; `--assignee L` assigns someone else instead, `--no-assignee` leaves it unassigned (only when the user asks). **Person fields**: when a single-select field (not Status) has the assignee's name as a value (login, login part, or GitHub profile name — `Zar-wthc` → `Projects = Zar`), `create --assignee`, `set --assignee` and `assign` set it by themselves; an explicit `--field` wins, `--no-person-field` skips it, and a field in the project's `only` setting keeps its default value. The person has no value yet and the user wants one → `option-add FIELD NAME` ([references/commands.md](references/commands.md) "Person fields"). Put given steps in `--todo`, screenshots in `--image`. Don't ask — create, then report URL, repo, column, assignee and what you guessed.
- **"TODO 추가"** → if an issue is being discussed, add checklist lines to it (`todo R#12 add …`); otherwise create a new issue in the Todo column.
- **"옮겨", "move to X"** → `move` only (don't close). **"끝났어", "done", "완료"** → `close` (closes and moves to Done). Moving a closed issue back to Todo/In Progress → `reopen --status …`.
- **Columns** ("칸/컬럼 만들어", "이름 바꿔", "순서") → `column-add` / `column-rename` / `column-order`. Renaming keeps every item in its column (option IDs are kept). The kanban view's columns are the Status values, so these commands change the board you see.
- **"내 일", "show my tasks", "what's next"** → `list --assignee @me --state open`; suggest one next item (Urgent → In Progress you touched recently → Todo).
- **Images**: `--image`/`attach` upload through gh's `--attach` (stored on GitHub's user-attachments). With an old gh the script commits the files to a `gp-assets` branch of the issue's repository and links them instead — mention that once.
- "this one", "the issue I just made" mean the issue from this conversation; don't ask when it is clear.

## Members — invite people to the board

A board and the repositories of its issues have **separate access lists**. On a private board a person needs a **board role** to see and move cards, and must be a **collaborator of the repository** to read its issues and be assigned. `invite` does both in one step — "alice 초대해", "add bob to the board", "이 사람 보드에 넣어".

- Who: a GitHub username, `@name`, `https://github.com/name` or an e-mail (found only if the person shows it publicly — otherwise ask for the username; no account → they sign up first, references/github-projects.md §2). The username is checked before anything changes.
- Board: role `writer` by default (`reader` only looks, `admin` also manages the board and its people). It works **at once** — GitHub sends no invitation for boards.
- Repository: `--repo R` (repeatable); default = the repository of the current folder, else the board's only linked repository. The person gets an **e-mail invitation** and has access after accepting it (a pending invitation is reused; an expired one is sent again). On a personal repository every collaborator can push — GitHub ignores `--permission` there (it counts in organizations: `pull`, `triage`, `push`, `maintain`, `admin`). Only repository admins can invite.
- Changing someone's role = `invite` again with another `--board-role` / `--permission`.
- Report the `share with …` line: the board URL and the invitation link, to send to the person. On their computer the gp skill does `invitations` → `accept --all`, and `accept` shows the board linked to that repository (`init <board URL>`).
- `members` lists the repositories' collaborators and pending invitations. **GitHub has no API that lists a board's collaborators**: gp shows the owner and the people gp added or removed on this computer (`~/.config/gp/members.json`) and prints the board's `…/settings/access` page that shows everyone — open it in the browser when the full list matters.
- `member-remove` (= 탈퇴시키기, kick) takes the person off the board and out of the current and the board's linked repositories, or cancels their pending invitation; GitHub also unassigns them from that repository's issues. `leave` is the person removing themselves (`--board` for the board; an owner cannot leave).
- Cloud sessions: only the repository part works (`invite`, `members`, `member-remove` on the session's repository); board roles and received invitations need a computer.

## Ask before

- `delete` (issue), `project-delete`, `field-delete`, `column-delete` when items are inside (offer `--move-to`), closing or moving many issues at once — show the list first.
- `invite` — it gives a real person access and e-mails them; say who, which board role and which repositories. `member-remove` and `leave` take access away. Assigning someone works only after they are a collaborator of the repository.

## Good to know

- Right after `create`/`item-add`, `list` and `info` can miss the new item for a few seconds (GitHub's list is eventually consistent). The `check:` line reads the issue directly and is reliable; wait ~10 s before listing.
- `gh` errors about scopes → `gh auth refresh -s project,repo`. "Resource not accessible" on an org board → the user needs write access to that project.
- Install: per user (every project) — `npx skills add https://sonub.com -s gp -g` (→ `~/.claude/skills/gp`, other agents `~/.agents/skills/gp`); per project — the same without `-g` (→ `.claude/skills/gp`, `.agents/skills/gp`). Update with `npx skills update`. The source is the `skills/gp` folder of thruthesky/sonub. Where the skill is installed and which board it uses are separate: a globally installed gp still uses each project's `.gp.json`.
- A board belongs to a user or an organization; issues can come from any repository the user can read. Draft items live only on the board until `convert`ed.
