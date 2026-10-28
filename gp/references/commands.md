# gp.py — every command, and plain gh for the rest

`python3 scripts/gp.py -h` and `gp.py <command> -h` print the same list with every option. Global options go **before** the command: `gp.py --owner my-org --number 3 list`.

## Board selection

| Way | Example |
|------|------|
| Options | `gp.py --owner my-org --number 3 info` (`@me` = the logged-in user) |
| Environment | `GP_OWNER=my-org GP_PROJECT=3 gp.py info` |
| This project | `gp.py init https://github.com/orgs/my-org/projects/3` → `<git root>/.gp.json` (nearest one from the current folder up is used) |
| Every project | `gp.py init https://github.com/users/me/projects/1 --global` → `~/.config/gp/config.json` (`GP_CONFIG` changes the file) |

The first one found wins: options → environment → the project's `.gp.json` → the global file. `gp.py init --show` and `doctor` show which board is in effect and from which file.

Other environment variables: `GP_MODE=rest` / `GP_MODE=gh` forces the cloud-session (REST only) or the full GitHub CLI mode (default: automatic), `GP_STATUS_FIELD` (default `Status`) if the board's column field has another name; `GP_NO_ATTACH=1` forces the `gp-assets` branch upload for images.

## Commands

| Command | What it does |
|------|------|
| `doctor` | gh version, login, `project`/`repo` scopes, `--attach` support, default board |
| `projects [--closed] [--json]` | boards of `--owner` (default: me) |
| `init [URL\|owner/number\|owner number] [--local\|--global] [--unset] [--show] [--only K=V[,K=V] \| --only none] [--instructions] [--remove-instructions]` | choose the board: local (default inside git) `<git root>/.gp.json`, `--global` `~/.config/gp/config.json`; `--unset` removes it. It touches no other file. Only with `--instructions` (when the user asks) it writes the "always use the gp skill" block (with the board URL and the rule that gp never changes the project's files) into the project's AGENTS.md/CLAUDE.md and `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`; `--show` only shows the setting, `--remove-instructions` removes the block. `--no-instructions` is accepted and does nothing (it is the default). `use` is the same command. `--only` sets this project's default field values (see "Default field values" below) |
| `project-create --title T [--desc D] [--readme R] [--public] [--columns "A,B,C"] [--repo R]… [--use [--global] [--instructions]]` | new board; sets columns, links repos; `--use` makes it this project's board (`--global`: every project's), `--instructions` also writes the gp block into CLAUDE.md/AGENTS.md |
| `project-edit [--title] [--desc] [--readme] [--public\|--private] [--close\|--reopen]` | change the board |
| `project-link R [--unlink]` | link a repo (the board shows on the repo's Projects tab) |
| `project-delete --yes` | delete the board (items' issues stay in their repos) |
| `info [--field K=V]… [--all]` | fields, columns, items per column, views, repos, closed-but-not-done items (counts within the `only` values) |
| `columns` | columns in order with colour and description |
| `column-add NAME [--after X\|--first] [--color C] [--desc D]` | new column |
| `column-rename OLD NEW [--color C]` | rename; items stay |
| `column-order "A,B,C"` | reorder (unlisted columns go last) |
| `column-delete NAME [--move-to X] [--yes]` | delete; `--move-to` keeps its items in another column |
| `field-add NAME --type text\|number\|date\|single_select [--options "A,B"]` | custom field |
| `option-add FIELD NAME… [--color C] [--desc D]` | add values to a single-select field (e.g. a person's name to `Projects`); items keep their values |
| `field-delete NAME --yes` | delete a custom field |
| `view-add NAME --layout board\|table\|roadmap [--filter F]` | new view; filter syntax like the web (`assignee:@me is:open label:bug`) |
| `list [--status S,…] [--assignee L] [--repo R] [--label L] [--state open\|closed\|all] [--search T] [--field K=V]… [--all] [--archived] [--json]` | items grouped by column, with checklist progress; only the project's `only` values unless `--field` names another (`*` = any) or `--all` |
| `create --repo R --title T [--body\|--body-file] [--status S] [--assignee L]… [--no-assignee] [--label L]… [--milestone M] [--parent N] [--image F]… [--todo T]… [--field K=V]… [--no-person-field] [--all]` | issue → board → column → fields (the project's `only` values unless `--field` names another or `--all`); assigned to the creator (`@me`) unless `--assignee`/`--no-assignee`. A field value that is an `--assignee`'s name is set by itself (see below) |
| `create --draft --title T [--body] [--status S]` | draft item (board only) |
| `convert ITEM_ID --repo R` | draft → real issue (`list --json` shows `item_id`) |
| `show ISSUE [--comments N] [--json]` | one issue in full |
| `edit ISSUE [--title] [--body\|--body-file\|--append] [--add-label]… [--remove-label]… [--milestone] [--field K=V]…` | change an issue; `--field K=` clears |
| `move ISSUE COLUMN` | change column only |
| `set ISSUE [--status] [--field]… [--assignee]… [--unassign]… [--close\|--reopen] [--reason] [--comment] [--no-person-field]` | several changes at once; `--assignee` also sets the person's field value |
| `close ISSUE [--reason completed\|"not planned"] [--status S] [--keep-column] [--comment]` | close + move to Done/FIXED |
| `reopen ISSUE [--status S]` | reopen (+ move) |
| `todo ISSUE [list\|add TEXT…\|done N…\|undo N…\|remove N…]` | checklist lines in the body |
| `attach ISSUE FILE… [--comment [TEXT]]` | images/videos into the body (or a new comment); `FILE#alt text` sets alt text |
| `comment ISSUE TEXT [--image F]…` | comment |
| `assign ISSUE LOGIN… [--remove] [--no-person-field]` | assignees (`@me` works); also sets the person's field value |
| `remove ISSUE [--archive]` | take off the board / archive (issue stays) |
| `delete ISSUE --yes` | delete the issue for good (needs repo admin) |
| `people [--repo R]` | items per assignee and column; repo collaborators |
| `invite LOGIN… [--repo R]… [--permission pull\|triage\|push\|maintain\|admin] [--board-role reader\|writer\|admin] [--no-board\|--no-repo]` | board role (default writer, at once) + repository invitation (default: this folder's repo, else the board's only linked one). LOGIN = username, `@name`, profile URL or public e-mail. Again with another role = change it. Prints a `share with …` line |
| `members [--repo R]… [--json]` | board owner, people gp added (`~/.config/gp/members.json` — GitHub has no API listing board collaborators; the full list is `<board>/settings/access`), teams; collaborators and pending invitations of this repo + the board's linked repos |
| `member-remove LOGIN… [--repo R]… [--no-board\|--no-repo] --yes` | board role NONE; removes the collaborator (GitHub unassigns them from its issues) or cancels the pending invitation |
| `invitations [--json]` | invitations you received (repositories, organizations) |
| `accept [ID\|owner/repo\|repo\|inviter\|org]… [--all]` · `decline …` | accept or decline them; `accept` prints the boards of that repository |
| `leave R… [--board] --yes` | remove yourself from repositories / the board in effect |
| `sync [ISSUE…] [--repo R]… [--add] [--limit N]` | apply queued `gp:<column>` / `gp:<Field>=<value>` labels to the board and remove them; closed issues go to the done column. No ISSUE = scan the board's repos (+ this one). The gp-sync Action runs `sync <issue>` on every issue event |
| `cloud-setup [--repo R] [--no-secret]` | once per repo, on a computer: `.gp.json` with columns, `.claude/skills/gp/`, `.github/workflows/gp-sync.yml`, Actions secret `GP_TOKEN` |

Column words accepted anywhere a column is expected (exact names always win): `todo`, `doing`/`wip`/`progress`, `review`, `done`/`complete`/`fixed`, `urgent`, `later`, `backlog`, and Korean `할 일`, `진행`, `검토`, `완료`, `끝`, `긴급`, `나중`. A unique part of a name also works (`prog` → In Progress).

## Rest mode (Claude Code cloud sessions)

Only `gh api repos/{owner}/{repo}/…` (and `gh api user`) reach GitHub; GraphQL, `gh issue`, `gh pr`, `gh project` and `users|orgs/…/projectsV2` get HTTP 403. gp.py uses these REST calls instead:

| gp.py | REST call |
|------|------|
| `create` | `POST repos/{o}/{r}/issues` (+ `POST …/issues/{parent}/sub_issues` for `--parent`) |
| `edit` / `close` / `reopen` / `todo` | `PATCH repos/{o}/{r}/issues/{n}` (`state`, `state_reason`, `title`, `body`, `milestone`) |
| `comment` | `POST repos/{o}/{r}/issues/{n}/comments` |
| `assign` / `set --assignee` | `POST` / `DELETE repos/{o}/{r}/issues/{n}/assignees` |
| `move`, `--status`, `--field` | `POST repos/{o}/{r}/issues/{n}/labels` with `gp:<column>` / `gp:<Field>=<value>` |
| `list` | `GET repos/{o}/{r}/issues?state=…&assignee=…&labels=…` (columns not readable; ⏳ marks a queued move) |
| `attach`, `--image` | `PUT repos/{o}/{r}/contents/…` on the `gp-assets` branch, then a Markdown image link |

The built-in gh fills `{owner}` and `{repo}` with the current repository: `gh api repos/{owner}/{repo}/issues -f title='…'`. Install `jq` in the image if you want `--jq`; gp.py parses JSON itself.

## Plain gh for things gp.py does not wrap

```bash
# labels
gh label create bug --color d73a4a --description "Something is broken" -R owner/repo
gh label list -R owner/repo ; gh label edit bug --name defect -R owner/repo ; gh label delete bug -R owner/repo --yes
gh label clone owner/template-repo -R owner/repo          # copy labels from another repo

# milestones
gh api repos/owner/repo/milestones -f title="v1.0" -f due_on=2026-12-31T00:00:00Z
gh api repos/owner/repo/milestones -q '.[]|[.number,.title,.open_issues]|@tsv'

# issue extras
gh issue transfer 12 owner/other-repo -R owner/repo
gh issue pin 12 -R owner/repo ; gh issue lock 12 -R owner/repo --reason spam
gh issue edit 12 -R owner/repo --add-sub-issue 15 --add-blocked-by 9 --type Bug
gh issue develop 12 -R owner/repo --checkout           # branch linked to the issue
gh issue list -R owner/repo --search "is:open label:bug sort:updated-desc"

# members — the GraphQL / REST calls gp.py uses, for things it does not wrap
gh api repos/owner/repo/invitations -q '.[]|[.id,.invitee.login,.permissions,.expired]|@tsv'
gh api -X PATCH repos/owner/repo/invitations/ID -f permissions=triage      # change a pending invitation
gh api orgs/my-org/invitations -f email=alice@example.com -f role=direct_member   # organization invitation by e-mail
gh api orgs/my-org/members -q '.[].login' ; gh api orgs/my-org/teams -q '.[].slug'
# board role for a whole team (organization boards): updateProjectV2Collaborators with {teamId, role}

# board extras
gh project copy 3 --source-owner my-org --target-owner @me --title "Copy"
gh project mark-template 3 --owner my-org
gh project field-list 3 --owner @me --format json
gh project item-list 3 --owner @me --format json --limit 500
gh project item-edit --id ITEM --project-id PROJECT --field-id FIELD --date 2026-11-01   # date / number / text / iteration
```

### GraphQL recipes (`gh api graphql -f query='…'`)

```graphql
# reorder an item inside its column (afterId = item it should follow; omit to move to top)
mutation { updateProjectV2ItemPosition(input: {projectId: "PVT_…", itemId: "PVTI_…", afterId: "PVTI_…"}) { clientMutationId } }

# post a status update on the board (On track / At risk …)
mutation { createProjectV2StatusUpdate(input: {projectId: "PVT_…", status: ON_TRACK, body: "Week 42: login fixed"}) { statusUpdate { id } } }

# rename or delete a view
mutation { updateProjectV2View(input: {viewId: "PVTV_…", name: "Sprint"}) { projectV2View { name } } }
mutation { deleteProjectV2View(input: {viewId: "PVTV_…"}) { clientMutationId } }
```

Built-in workflows (auto-add, item closed → Done, auto-archive) are switched on in the web: board → ⋯ → Workflows. Group-by and column limits of a board view are also set in the web (view menu ▾).

## Person fields — assigning someone also files the card under their name

When a single-select field (not Status) has a value that is an assignee's name, `create --assignee`, `set --assignee` and `assign` set that value too: assigning `Zar-wthc` puts the card under `Projects = Zar`.

- A person's names: the login, its parts split at `-` `_` `.` (`Zar-wthc` → `zar`), the GitHub profile name and its first word (`MarkChristianWithCenter` → profile "Edson"). Matching is exact, without case.
- `--field Projects=SONUB` given in the same command wins. With several assignees the first one that matches wins. The default creator (`@me` when no `--assignee`) is not matched. `--no-person-field` turns it off.
- Cloud sessions can't read profiles: only the login counts there, against the fields cached in `.gp.json`, and the value is queued as a `gp:Field=Value` label.
- No value for the person yet → `option-add Projects Zar` first.
- A field in the project's `only` setting is skipped: in a `Projects = SONUB` project, assigning Zar keeps the card under SONUB.

## Default field values — `init --only` (one project's items on a shared board)

A board shared by several projects (e.g. `Projects = SONUB / FARM / LARYEN`) can be narrowed per project folder:

```bash
gp.py init https://github.com/users/thruthesky/projects/17 --only Projects=SONUB   # board + default value
gp.py init --only Projects=SONUB      # change only the default of the saved setting · --only none removes it
GP_ONLY="Projects=SONUB" gp.py list   # environment override for one run (GP_ONLY=none turns it off)
```

- Saved as `"only": {"Projects": "SONUB"}` in `.gp.json` (or the global file with `--global`). The field and value are checked against the board (case fixed); `Status` is not allowed. `init <URL>` again keeps it.
- `list`, `info`, `people` show only items with those values and print an `only …` line. `--field Projects=Zar` replaces the default for that field, `--field Projects=*` means any value, `--all` ignores every default.
- `create` (also `--draft`) sets the values unless `--field` names the same field or `--all` is given. `set --assignee` / `assign` do not move the card to a person value of that field.
- Commands on one issue (`show`, `edit`, `move`, `close`, …) are not limited.
- Cloud sessions: `create` queues the values as `gp:Projects=SONUB` labels; `list` can't read board fields there and says so.
