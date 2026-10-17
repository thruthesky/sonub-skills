# gp.py — every command, and plain gh for the rest

`python3 scripts/gp.py -h` and `gp.py <command> -h` print the same list with every option. Global options go **before** the command: `gp.py --owner my-org --number 3 list`.

## Board selection

| Way | Example |
|------|------|
| Options | `gp.py --owner my-org --number 3 info` (`@me` = the logged-in user) |
| Environment | `GP_OWNER=my-org GP_PROJECT=3 gp.py info` |
| This project | `gp.py init https://github.com/orgs/my-org/projects/3` → `<git root>/.gp.json` (nearest one from the current folder up is used) |
| Every project | `gp.py init https://github.com/users/me/projects/1 --global` → `~/.config/gp/config.json` (`GP_CONFIG` changes the file) |

The first one found wins: options → environment → the project's `.gp.json` → the global file. `gp.py init` (no URL) and `doctor` show which board is in effect and from which file.

Other environment variables: `GP_STATUS_FIELD` (default `Status`) if the board's column field has another name; `GP_NO_ATTACH=1` forces the `gp-assets` branch upload for images.

## Commands

| Command | What it does |
|------|------|
| `doctor` | gh version, login, `project`/`repo` scopes, `--attach` support, default board |
| `projects [--closed] [--json]` | boards of `--owner` (default: me) |
| `init [URL\|owner/number\|owner number] [--local\|--global] [--unset]` | choose the board: local (default inside git) `<git root>/.gp.json`, `--global` `~/.config/gp/config.json`; no URL = show the setting; `--unset` removes it. `use` is the same command |
| `project-create --title T [--desc D] [--readme R] [--public] [--columns "A,B,C"] [--repo R]… [--use [--global]]` | new board; sets columns, links repos; `--use` makes it this project's board (`--global`: every project's) |
| `project-edit [--title] [--desc] [--readme] [--public\|--private] [--close\|--reopen]` | change the board |
| `project-link R [--unlink]` | link a repo (the board shows on the repo's Projects tab) |
| `project-delete --yes` | delete the board (items' issues stay in their repos) |
| `info` | fields, columns, items per column, views, repos, closed-but-not-done items |
| `columns` | columns in order with colour and description |
| `column-add NAME [--after X\|--first] [--color C] [--desc D]` | new column |
| `column-rename OLD NEW [--color C]` | rename; items stay |
| `column-order "A,B,C"` | reorder (unlisted columns go last) |
| `column-delete NAME [--move-to X] [--yes]` | delete; `--move-to` keeps its items in another column |
| `field-add NAME --type text\|number\|date\|single_select [--options "A,B"]` | custom field |
| `field-delete NAME --yes` | delete a custom field |
| `view-add NAME --layout board\|table\|roadmap [--filter F]` | new view; filter syntax like the web (`assignee:@me is:open label:bug`) |
| `list [--status S,…] [--assignee L] [--repo R] [--label L] [--state open\|closed\|all] [--search T] [--archived] [--json]` | items grouped by column, with checklist progress |
| `create --repo R --title T [--body\|--body-file] [--status S] [--assignee L]… [--label L]… [--milestone M] [--parent N] [--image F]… [--todo T]… [--field K=V]…` | issue → board → column → fields |
| `create --draft --title T [--body] [--status S]` | draft item (board only) |
| `convert ITEM_ID --repo R` | draft → real issue (`list --json` shows `item_id`) |
| `show ISSUE [--comments N] [--json]` | one issue in full |
| `edit ISSUE [--title] [--body\|--body-file\|--append] [--add-label]… [--remove-label]… [--milestone] [--field K=V]…` | change an issue; `--field K=` clears |
| `move ISSUE COLUMN` | change column only |
| `set ISSUE [--status] [--field]… [--assignee]… [--unassign]… [--close\|--reopen] [--reason] [--comment]` | several changes at once |
| `close ISSUE [--reason completed\|"not planned"] [--status S] [--keep-column] [--comment]` | close + move to Done/FIXED |
| `reopen ISSUE [--status S]` | reopen (+ move) |
| `todo ISSUE [list\|add TEXT…\|done N…\|undo N…\|remove N…]` | checklist lines in the body |
| `attach ISSUE FILE… [--comment [TEXT]]` | images/videos into the body (or a new comment); `FILE#alt text` sets alt text |
| `comment ISSUE TEXT [--image F]…` | comment |
| `assign ISSUE LOGIN… [--remove]` | assignees (`@me` works) |
| `remove ISSUE [--archive]` | take off the board / archive (issue stays) |
| `delete ISSUE --yes` | delete the issue for good (needs repo admin) |
| `people [--repo R]` | items per assignee and column; repo collaborators |
| `invite LOGIN [--repo R --permission pull\|triage\|push\|maintain\|admin] [--board-role reader\|writer\|admin\|none]` | invite to a repo and/or give a board role |

Column words accepted anywhere a column is expected (exact names always win): `todo`, `doing`/`wip`/`progress`, `review`, `done`/`complete`/`fixed`, `urgent`, `later`, `backlog`, and Korean `할 일`, `진행`, `검토`, `완료`, `끝`, `긴급`, `나중`. A unique part of a name also works (`prog` → In Progress).

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
