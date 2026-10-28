# GitHub Projects — what it is and how to start

Read this when the user is new to GitHub, has no account, or asks what a project, issue, field or view is. Explain in the user's language, short, with one example from their own work.

## 1. The pieces

| Word | What it is | Example |
|------|------|------|
| **Repository** (repo) | A folder of code or documents on GitHub, with its own issues | `alice/shop-app` |
| **Issue** | One piece of work: title, body (Markdown, images, `- [ ]` checklist), assignees, labels, comments. Lives in one repo, numbered `#1, #2 …`. Open or closed | "Login button does nothing on iPhone" |
| **Project** (board) | A board that collects issues from any repos. Owned by a user or an organization. Private or public | "My work 2026" |
| **Item** | An issue, pull request or **draft** on the board. A draft is a note that lives only on the board until converted to an issue | "idea: dark mode" |
| **Field** | A column of data for every item. Built in: Title, Assignees, Status, Labels, Repository, Milestone… Custom: text, number, date, single select, iteration | Priority = High |
| **Status** | The single-select field the kanban board groups by — **its values are the board's columns** | Todo · In Progress · Done |
| **View** | A saved way to look at the board: **Table**, **Board** (kanban), **Roadmap** (timeline), each with its own filter, sort and grouping | "My open tasks" board view |
| **Workflow** | Built-in automation, switched on in the board's ⋯ → Workflows: item closed → Status Done, PR merged → Done, auto-add issues from a repo, auto-archive old items | |

A good beginner board: one project, columns `Todo → In Progress → Review → Done`, a Board view, issues from one or two repos, the "Item closed → Done" workflow on.

## 2. Create a GitHub account (done by the person)

Signing up needs an e-mail code and a puzzle, so the person does it — it takes about three minutes.

1. Open https://github.com/signup.
2. Enter e-mail, a password and a username (the username is in every URL — short, lowercase, e.g. `alice-kim`).
3. Type the code GitHub e-mails, solve the puzzle, choose the **Free** plan.
4. Recommended: Settings → Password and authentication → turn on two-factor authentication (GitHub asks most contributors to do it anyway).

## 3. Connect this computer (the agent can do it)

```bash
gh --version || brew install gh          # Windows: winget install GitHub.cli · Linux: https://cli.github.com
gh auth login                            # GitHub.com → HTTPS → Login with a web browser → type the one-time code
gh auth refresh -s project,repo          # boards need the 'project' scope; issues need 'repo'
python3 scripts/gp.py doctor             # all ✓ = ready
```

`gh auth login` prints an 8-character code and opens the browser; the person types the code and presses Authorize. Nothing else is needed — no token to copy.

## 4. First board in one minute

```bash
python3 scripts/gp.py project-create --title "My work" --columns "Todo,In Progress,Review,Done" --repo alice/shop-app --use
python3 scripts/gp.py view-add Board --layout board
python3 scripts/gp.py create --repo shop-app --title "Login button does nothing on iPhone" --image shot.png --todo "reproduce" --todo "fix" --todo "test"
python3 scripts/gp.py move shop-app#1 doing
python3 scripts/gp.py close shop-app#1 --comment "Fixed in v1.2"
```

Then open the board URL that `info` prints: the issue moved across the columns.

Already have a board? Skip `project-create` and run `python3 scripts/gp.py init <board URL>` in the project folder — the board is saved in the project's `.gp.json` (add `--global` to use it in every project). `--use` above does the same for a new board.

## 5. Working with others

- The person needs their own GitHub account (§2). Ask for the **username** (the name in `github.com/<username>`); an e-mail works only if they show it publicly on their profile.
- `gp.py invite alice` gives them a role on the board (`writer` = can move cards; works at once) **and** invites them to the repository of the issues (an e-mail; after they accept they can read the issues and be assigned). Send them the `share with …` line it prints.
- On their side: open the invitation link (or the e-mail, or https://github.com/notifications) and press Accept — or, with the gp skill, `gp.py invitations` then `gp.py accept --all`.
- `gp.py members` shows who is in; `gp.py member-remove alice --yes` takes them out (board and repositories); `gp.py leave owner/repo --yes` is someone leaving by themselves. On an organization, members can also get access through teams.
- Public boards can be seen by anyone, but only collaborators can change them. Private items from private repos stay hidden from people without access.

## 6. Tips

- One issue = one result someone can check. Put steps in a checklist; split big work into sub-issues (`create --parent 12`).
- Close issues when done (`close`), don't delete — history and links stay. Delete only spam or mistakes.
- Use labels for kind (bug, feature), the Status column for progress, a Priority field for order.
- Write the issue so that someone else (or an AI agent) could do it tomorrow: what is wrong, how to see it, what "done" looks like.
