#!/usr/bin/env python3
"""gp — manage GitHub Projects (v2) and their issues with the gh CLI.

Only the Python standard library and `gh` are used. gh is called with a list of
arguments (never through a shell), so quoting and word splitting never break a
title or a body. Field, column and option IDs are looked up by name on every run,
so renaming a column on GitHub never breaks this script.

    gp.py doctor                                  # is gh installed, logged in, with the right scopes?
    gp.py projects [--owner O]                    # list boards
    gp.py init <board URL> [--global]             # this project's board (.gp.json), or --global for every project;
                                                  # also writes "always use the gp skill" into CLAUDE.md / AGENTS.md
    gp.py project-create --title T [--columns "Todo,In Progress,Done"] [--repo R] [--use]
    gp.py info                                    # fields, columns, counts, views
    gp.py column-add NAME | column-rename OLD NEW | column-delete NAME --yes | column-order "A,B,C"
    gp.py create --repo R --title T [--body B] [--status Todo] [--assignee L | --no-assignee] [--image F] [--todo "item"]
                                                  # assigned to the creator (@me) unless --assignee/--no-assignee
    gp.py list [--status S] [--assignee L] [--repo R] [--state open] [--search T]
    gp.py move <issue> <column>                   # <issue> = URL | owner/repo#12 | repo#12
    gp.py close <issue> | reopen <issue> | delete <issue> --yes
    gp.py todo <issue> [add "text" | done N | undo N | remove N]
    gp.py attach <issue> FILE... [--comment "text"]
    gp.py invite LOGIN… [--repo R] | members | member-remove LOGIN… --yes   # people on the board and its repos
    gp.py invitations | accept [--all] | decline | leave R… --yes              # the invited person's side
    gp.py sync [<issue>…]                         # apply queued gp:… labels to the board (local or GitHub Actions)
    gp.py cloud-setup                             # let Claude Code cloud sessions use this board (run locally once)

Run `gp.py <command> -h` for every option. The board comes from --owner/--number,
then GP_OWNER/GP_PROJECT, then the project's .gp.json (nearest one from the current
folder up to the git root), then the global file (~/.config/gp/config.json).
Every command that changes something accepts --dry-run.

Claude Code cloud sessions (CLAUDE_CODE_REMOTE=true) reach GitHub only through a proxy
that blocks GraphQL and every path outside repos/{owner}/{repo}/…, so the board itself
cannot be read or changed there. In that "rest" mode gp.py works on issues with plain
`gh api` REST calls (the built-in gh works too) and queues board changes as gp:<column> /
gp:<Field>=<value> labels; `gp.py sync` (the gp-sync GitHub Action from `cloud-setup`,
or a local run) moves the items and removes the labels. GP_MODE=rest|gh overrides it.
"""
import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse
from collections import Counter, defaultdict

CONFIG_PATH = os.environ.get("GP_CONFIG") or os.path.join(
    os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config"), "gp", "config.json")
LOCAL_CONFIG = ".gp.json"  # one project's board, in the root of its git repository
STATUS_FIELD = os.environ.get("GP_STATUS_FIELD", "Status")
ASSETS_BRANCH = "gp-assets"
LABEL_PREFIX = "gp:"  # gp:In Progress = move to that column · gp:Priority=High = set a field (applied by `sync`)
LABEL_COLOR = "8250df"
GRAPHQL_BLOCKED = "GraphQL is not available from Claude Code sessions"
PATH_BLOCKED = "sessions are bound to their configured repositories"
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Words people use for a column -> candidate column names, tried in order.
# An exact (case-insensitive) column name always wins over an alias.
STATUS_ALIASES = {
    "todo": ["Todo", "TODO", "To do", "To Do", "Backlog"],
    "to do": ["Todo", "TODO", "To do"],
    "할일": ["Todo", "TODO", "To do"], "할 일": ["Todo", "TODO", "To do"],
    "doing": ["In Progress", "In progress", "Doing", "WIP"],
    "progress": ["In Progress", "In progress", "Doing"],
    "in progress": ["In Progress", "In progress", "Doing"],
    "wip": ["In Progress", "In progress", "Doing", "WIP"],
    "진행": ["In Progress", "In progress", "Doing"], "진행중": ["In Progress", "In progress", "Doing"],
    "done": ["Done", "FIXED", "Closed", "Complete", "Completed"],
    "complete": ["Done", "FIXED", "Complete", "Completed"],
    "fixed": ["FIXED", "Done"],
    "완료": ["Done", "FIXED", "Complete"], "끝": ["Done", "FIXED", "Complete"],
    "review": ["Review", "In Review", "In review"], "검토": ["Review", "In Review", "In review"],
    "urgent": ["Urgent"], "긴급": ["Urgent"],
    "later": ["Later", "LATER", "Backlog"], "나중": ["Later", "LATER", "Backlog"],
    "backlog": ["Backlog"],
}
DONE_NAMES = ["Done", "FIXED", "Closed", "Complete", "Completed"]
COLORS = ["GRAY", "BLUE", "GREEN", "YELLOW", "ORANGE", "RED", "PINK", "PURPLE"]

ITEM_FIELDS = """
  id
  isArchived
  fieldValues(first: 30) { nodes {
    ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2FieldCommon { name } } }
    ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2FieldCommon { name } } }
    ... on ProjectV2ItemFieldNumberValue { number field { ... on ProjectV2FieldCommon { name } } }
    ... on ProjectV2ItemFieldDateValue { date field { ... on ProjectV2FieldCommon { name } } }
  } }
  content {
    __typename
    ... on Issue { id number title state url body createdAt updatedAt repository { nameWithOwner }
                   assignees(first: 10) { nodes { login } } labels(first: 10) { nodes { name } } }
    ... on PullRequest { id number title state url body createdAt updatedAt repository { nameWithOwner }
                         assignees(first: 10) { nodes { login } } labels(first: 10) { nodes { name } } }
    ... on DraftIssue { id title body createdAt updatedAt assignees(first: 10) { nodes { login } } }
  }
"""

FIELDS_QUERY = """
  fields(first: 50) { nodes {
    ... on ProjectV2FieldCommon { id name dataType }
    ... on ProjectV2SingleSelectField { id name dataType options { id name color description } }
  } }
"""


# ---------------------------------------------------------------- helpers

def die(msg, code=1):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


_MODE = None


def mode():
    """'gh' = the full GitHub CLI (GraphQL, gh project, gh issue) · 'rest' = a Claude Code cloud session,
    where only REST calls to repos/{owner}/{repo}/… get through (gh api, or Claude Code's built-in gh)."""
    global _MODE
    if _MODE is None:
        forced = os.environ.get("GP_MODE", "").strip().lower()
        if forced in ("rest", "api", "cloud"):
            _MODE = "rest"
        elif forced in ("gh", "full", "local"):
            _MODE = "gh"
        elif os.environ.get("CLAUDE_CODE_REMOTE") == "true" or os.environ.get("GH_TOKEN") == "proxy-injected":
            _MODE = "rest"
        else:
            r = subprocess.run(["gh", "--version"], capture_output=True, text=True) if shutil.which("gh") else None
            # Claude Code's built-in gh (no GitHub CLI in the image) only knows `gh api`.
            _MODE = "gh" if r is None or (r.stdout or "").startswith("gh version") else "rest"
    return _MODE


def gh(args, input_text=None, check=True):
    """Run gh with a list of arguments. Returns stdout. Adds a hint for missing scopes."""
    if not shutil.which("gh"):
        die("gh (GitHub CLI) is not installed — https://cli.github.com (macOS: brew install gh)")
    r = subprocess.run(["gh", *args], input=input_text, capture_output=True, text=True)
    if r.returncode != 0 and check:
        err = (r.stderr or r.stdout or "").strip()
        low = err.lower()
        if GRAPHQL_BLOCKED.lower() in low or PATH_BLOCKED in low:
            err += ("\n→ this is a Claude Code cloud session: only repos/{owner}/{repo}/… REST calls reach GitHub. "
                    "Run gp.py without GP_MODE=gh (rest mode), and board changes are queued as gp:… labels")
        elif "scope" in low or "insufficient" in low or "resource not accessible" in low:
            err += "\n→ add scopes: gh auth refresh -s project,repo"
        if "not logged" in low or "gh auth login" in low:
            err += "\n→ log in first: gh auth login"
        die(f"gh {' '.join(args[:3])} … failed\n{err}")
    return r.stdout if check else r


def rest(method, path, body=None, check=True):
    """One REST call through `gh api` (works with the GitHub CLI and Claude Code's built-in gh). JSON in, JSON out."""
    args = ["api", "-X", method, path, "-H", "Accept: application/vnd.github+json"]
    if body is not None:
        args += ["--input", "-"]
    r = gh(args, input_text=json.dumps(body) if body is not None else None, check=check)
    if not check:
        if r.returncode != 0:
            return None
        r = r.stdout
    return json.loads(r) if (r or "").strip() else {}


def rest_all(path, limit=1000):
    """Every page of a REST list (100 per page), without needing jq or --paginate."""
    out, page = [], 1
    sep = "&" if "?" in path else "?"
    while len(out) < limit:
        rows = rest("GET", f"{path}{sep}per_page=100&page={page}")
        out += rows
        if len(rows) < 100:
            break
        page += 1
    return out[:limit]


def need_board_access(what="this"):
    """Stop in a cloud session before a GraphQL call that the GitHub proxy would refuse anyway."""
    if mode() == "rest":
        die(f"{what} needs the board (GitHub Projects v2), which a Claude Code cloud session cannot reach: its GitHub "
            "proxy blocks GraphQL and every path outside repos/{owner}/{repo}/…. Issue commands work here (create, "
            "list, show, edit, move, set, close, reopen, todo, comment, attach, assign) and queue board changes as "
            f"{LABEL_PREFIX}… labels; run board commands on a computer with the GitHub CLI (`gh auth login`).")


def graphql(query, **variables):
    need_board_access()
    args = ["api", "graphql", "-f", f"query={query}"]
    for k, v in variables.items():
        if v is None:
            continue
        if isinstance(v, bool):
            args += ["-F", f"{k}={'true' if v else 'false'}"]
        elif isinstance(v, int):
            args += ["-F", f"{k}={v}"]
        else:
            args += ["-f", f"{k}={v}"]
    data = json.loads(gh(args))
    if data.get("errors"):
        die(json.dumps(data["errors"], ensure_ascii=False))
    return data["data"]


def graphql_json(query, variables):
    """GraphQL with structured variables (lists of objects) sent as a JSON body."""
    need_board_access()
    out = gh(["api", "graphql", "--input", "-"], input_text=json.dumps({"query": query, "variables": variables}))
    data = json.loads(out)
    if data.get("errors"):
        die(json.dumps(data["errors"], ensure_ascii=False))
    return data["data"]


_ME = None


def me():
    global _ME
    if _ME is None:
        _ME = rest("GET", "user")["login"]
    return _ME


def login_of(owner):
    return me() if owner in (None, "", "@me", "me") else owner


def read_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def write_json(path, cfg):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=1)
        f.write("\n")


def project_root():
    """Root folder of the git repository of the current folder, or None."""
    try:
        r = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True)
    except OSError:
        return None
    return os.path.abspath(r.stdout.strip()) if r.returncode == 0 and r.stdout.strip() else None


def find_local_config():
    """Nearest .gp.json from the current folder up to the git root (or the file system root)."""
    d, root = os.path.abspath(os.getcwd()), project_root()
    while True:
        path = os.path.join(d, LOCAL_CONFIG)
        if os.path.isfile(path):
            return path
        parent = os.path.dirname(d)
        if parent == d or d == root:
            return None
        d = parent


def config_path(scope):
    """local → <git root or current folder>/.gp.json · global → ~/.config/gp/config.json."""
    if scope == "global":
        return CONFIG_PATH
    return find_local_config() or os.path.join(project_root() or os.getcwd(), LOCAL_CONFIG)


def config_scope(a):
    """--global / --local, else local inside a git repository and global outside."""
    if getattr(a, "global_", False):
        return "global"
    if getattr(a, "local", False):
        return "local"
    return "local" if project_root() else "global"


def load_config():
    """The board setting in effect (+ _scope, _path): the project's .gp.json, else the global file."""
    for scope, path in (("local", find_local_config()), ("global", CONFIG_PATH)):
        cfg = read_json(path) if path else {}
        if cfg.get("number"):
            return dict(cfg, _scope=scope, _path=path)
    return {}


def save_config(cfg, scope="global"):
    path = config_path(scope)
    write_json(path, cfg)
    return path


def board_config(p):
    """What .gp.json keeps: the board, plus its columns and fields so a cloud session (which cannot read the
    board) can still name columns correctly. `init`, `sync`, `cloud-setup` and column/field commands refresh it."""
    cfg = {"owner": p["owner"]["login"], "number": p["number"], "title": p["title"], "url": p["url"]}
    fields = {}
    for f in p["fields"]["nodes"]:
        if f and f.get("name"):
            fields[f["name"]] = [o["name"] for o in f["options"]] if "options" in f else f.get("dataType", "").lower()
    if isinstance(fields.get(STATUS_FIELD), list):
        cfg["columns"] = fields[STATUS_FIELD]
    cfg["fields"] = {k: v for k, v in fields.items() if k != STATUS_FIELD and (isinstance(v, list) or v in ("text", "number", "date"))}
    return cfg


def refresh_cache(owner, number):
    """Rewrite the saved board settings (local and global) that point at this board with its current columns."""
    p = None
    for path in (find_local_config(), CONFIG_PATH):
        cfg = read_json(path) if path else {}
        if cfg.get("number") == number and str(cfg.get("owner", "")).lower() == owner.lower():
            p = p or load_project(owner, number, with_items=False)
            new = board_config(p)
            if {k: cfg.get(k) for k in new} != new:
                write_json(path, dict(cfg, **new))


def board(a):
    """(owner login, project number) for this run."""
    cfg = load_config()
    owner = a.owner or os.environ.get("GP_OWNER") or cfg.get("owner") or "@me"
    number = a.number or os.environ.get("GP_PROJECT") or cfg.get("number")
    if not number:
        die("no board chosen. Run `gp.py init <board URL>` (this project) or `gp.py init <board URL> --global` "
            "(every project), or pass --owner/--number. `gp.py projects` lists your boards.")
    return login_of(owner), int(number)


def parse_board(target, number=None):
    """Board URL | owner/number | owner number | number (= my board) → (owner, number)."""
    t = target.strip()
    m = re.match(r"(?:https?://)?(?:www\.)?github\.com/(?:users|orgs)/([^/\s]+)/projects/(\d+)", t)
    if m:
        return m.group(1), int(m.group(2))
    if number is not None:
        return t, int(number)
    m = re.fullmatch(r"(@?[\w.-]+)\s*[/#]\s*(\d+)", t)
    if m:
        return m.group(1), int(m.group(2))
    if t.isdigit():
        return "@me", int(t)
    die(f"not a board: {target!r} — use the board URL, e.g. https://github.com/users/<you>/projects/1 "
        "(or https://github.com/orgs/<org>/projects/1), or <owner> <number>")


def run(cmd, dry, input_text=None):
    """Print and run a changing gh command (or only print it with --dry-run)."""
    shown = " ".join(cmd if len(" ".join(cmd)) < 300 else cmd[:8] + ["…"])
    print(("[dry-run] " if dry else "$ ") + shown)
    if dry:
        return ""
    return gh(cmd[1:], input_text=input_text)


def load_project(owner, number, with_items=True, include_archived=False):
    """Board, its fields, views and (optionally) every item — 100 at a time."""
    items, cursor, project = [], None, None
    while True:
        q = """
        query($owner: String!, $number: Int!%s) {
          repositoryOwner(login: $owner) { ... on ProjectV2Owner { projectV2(number: $number) {
            id number title url closed public shortDescription readme
            owner { ... on User { login } ... on Organization { login } }
            %s
            views(first: 20) { nodes { id name number layout } }
            %s
          } } }
        }""" % (
            ", $cursor: String" if with_items else "",
            FIELDS_QUERY,
            "items(first: 100, after: $cursor) { totalCount pageInfo { hasNextPage endCursor } nodes { %s } }" % ITEM_FIELDS
            if with_items else "",
        )
        data = graphql(q, owner=owner, number=number, cursor=cursor)
        p = (data.get("repositoryOwner") or {}).get("projectV2")
        if not p:
            die(f"project not found: {owner} #{number} (check `gp.py projects --owner {owner}`)")
        project = project or p
        if not with_items:
            break
        items += [flatten(n) for n in p["items"]["nodes"]]
        page = p["items"]["pageInfo"]
        if not page["hasNextPage"]:
            break
        cursor = page["endCursor"]
    project["all_items"] = [i for i in items if include_archived or not i["archived"]]
    return project


def flatten(node):
    c = node.get("content") or {}
    fields = {}
    for fv in node["fieldValues"]["nodes"]:
        if fv and fv.get("field"):
            fields[fv["field"]["name"]] = fv.get("name", fv.get("text", fv.get("number", fv.get("date"))))
    repo = (c.get("repository") or {}).get("nameWithOwner", "")
    return {
        "item_id": node["id"],
        "archived": node.get("isArchived", False),
        "content_id": c.get("id"),
        "type": c.get("__typename", ""),
        "repo": repo,
        "number": c.get("number"),
        "ref": f"{repo.split('/')[-1]}#{c['number']}" if c.get("number") else "draft",
        "title": c.get("title", ""),
        "body": c.get("body", "") or "",
        "state": c.get("state", "DRAFT"),
        "url": c.get("url", ""),
        "created": (c.get("createdAt") or "")[:10],
        "updated": (c.get("updatedAt") or "")[:10],
        "assignees": [x["login"] for x in (c.get("assignees") or {}).get("nodes", [])],
        "labels": [x["name"] for x in (c.get("labels") or {}).get("nodes", [])],
        "status": fields.get(STATUS_FIELD, "") or "",
        "fields": fields,
    }


def field_by_name(project, name, single_select=False):
    for f in project["fields"]["nodes"]:
        if f and f.get("name", "").lower() == name.lower():
            if single_select and "options" not in f:
                die(f"field '{name}' is not a single-select field")
            return f
    names = ", ".join(f["name"] for f in project["fields"]["nodes"] if f)
    die(f"field '{name}' not found. Fields: {names}")


def status_field(project):
    return field_by_name(project, STATUS_FIELD, single_select=True)


def resolve_option(field, wanted, aliases=None):
    """Option by exact name, then alias, then a unique partial match."""
    opts = field["options"]
    key = wanted.strip().lower()
    by_name = {o["name"].lower(): o for o in opts}
    if key in by_name:
        return by_name[key]
    for cand in (aliases or {}).get(key, []):
        if cand.lower() in by_name:
            return by_name[cand.lower()]
    partial = [o for o in opts if key in o["name"].lower()]
    if len(partial) == 1:
        return partial[0]
    die(f"'{wanted}' is not a {field['name']} value. Values: {', '.join(o['name'] for o in opts)}")


def done_option(project):
    f = status_field(project)
    names = {o["name"].lower(): o for o in f["options"]}
    for n in DONE_NAMES:
        if n.lower() in names:
            return names[n.lower()]
    return None


def parse_ref(ref, default_owner):
    ref = ref.strip()
    m = re.match(r"https://github\.com/([^/]+)/([^/]+)/(?:issues|pull)/(\d+)", ref)
    if m:
        return m.group(1), m.group(2), int(m.group(3))
    m = re.match(r"(?:([^/\s#]+)/)?([^/\s#]+)#(\d+)$", ref)
    if m:
        return m.group(1) or default_owner, m.group(2), int(m.group(3))
    die(f"cannot read issue '{ref}' — use a URL, owner/repo#12 or repo#12")


def repo_full(repo, owner):
    return repo if "/" in repo else f"{owner}/{repo}"


def find_issue(owner, repo, num, project_owner=None, project_number=None):
    """Issue (or PR) and its item id on the given board (None if not on it)."""
    data = graphql("""
      query($o: String!, $r: String!, $n: Int!) { repository(owner: $o, name: $r) {
        issueOrPullRequest(number: $n) {
          ... on Issue { id number state url title body
            projectItems(first: 30, includeArchived: true) { nodes { id project { number owner { ... on User { login } ... on Organization { login } } } } } }
          ... on PullRequest { id number state url title body
            projectItems(first: 30, includeArchived: true) { nodes { id project { number owner { ... on User { login } ... on Organization { login } } } } } }
        } } }""", o=owner, r=repo, n=num)
    issue = (data.get("repository") or {}).get("issueOrPullRequest")
    if not issue:
        die(f"{owner}/{repo}#{num} not found")
    item_id = None
    for it in issue["projectItems"]["nodes"]:
        if project_number and it["project"]["number"] == project_number and \
                it["project"]["owner"]["login"].lower() == (project_owner or "").lower():
            item_id = it["id"]
    return issue, item_id


def add_to_board(project, url, dry):
    out = run(["gh", "project", "item-add", str(project["number"]), "--owner", project["owner"]["login"],
               "--url", url, "--format", "json"], dry)
    return json.loads(out)["id"] if out else "<new item>"


def set_single(project, item_id, field, option, dry):
    run(["gh", "project", "item-edit", "--project-id", project["id"], "--id", item_id,
         "--field-id", field["id"], "--single-select-option-id", option["id"]], dry)
    print(f"  → {field['name']} = {option['name']}")


def set_field_value(project, item_id, name, value, dry):
    """--field NAME=VALUE for any field type."""
    f = field_by_name(project, name)
    base = ["gh", "project", "item-edit", "--project-id", project["id"], "--id", item_id, "--field-id", f["id"]]
    if value == "":
        run(base + ["--clear"], dry)
    elif "options" in f:
        set_single(project, item_id, f, resolve_option(f, value, STATUS_ALIASES if f["name"] == STATUS_FIELD else None), dry)
        return
    elif f["dataType"] == "NUMBER":
        run(base + ["--number", value], dry)
    elif f["dataType"] == "DATE":
        run(base + ["--date", value], dry)
    else:
        run(base + ["--text", value], dry)
    print(f"  → {f['name']} = {value or '(cleared)'}")


_NAMES = {}


def person_names(login):
    """Names a person goes by: the login, its parts (Zar-wthc → zar) and the GitHub profile name and its first word
    (MarkChristianWithCenter → "Edson"). A cloud session cannot read profiles, so there only the login counts."""
    key = login.lower()
    if key not in _NAMES:
        names = {key, *(x for x in re.split(r"[-_.]", key) if x)}
        if mode() != "rest":
            name = ((rest("GET", f"users/{login}", check=False) or {}).get("name") or "").strip().lower()
            if name:
                names |= {name, name.split()[0]}
        _NAMES[key] = names
    return _NAMES[key]


def person_fields(fields, assignees, given=(), off=False):
    """--field NAME=VALUE for every single-select field (not Status) that has an assignee's name as a value:
    assigning Zar puts the item under Projects = Zar. Fields given with --field win; the first assignee wins."""
    if off or not assignees:
        return []
    skip = {STATUS_FIELD.lower(), *(kv.partition("=")[0].strip().lower() for kv in given or [])}
    people = [(who, person_names(who)) for who in logins(assignees)]
    out = []
    for name, options in fields.items():
        if name.lower() in skip or not isinstance(options, list):
            continue
        for who, names in people:
            hit = next((o for o in options if o.lower() in names), None)
            if hit:
                print(f"  {who}: their name is a {name} value → {name} = {hit} (--no-person-field to skip)")
                out.append(f"{name}={hit}")
                break
    return out


def board_fields(project):
    return {f["name"]: [o["name"] for o in f["options"]] for f in project["fields"]["nodes"] if f and "options" in f}


def parse_only(text):
    """"Projects=SONUB,Priority=High" → {"Projects": "SONUB", "Priority": "High"}; "none"/"off"/"all"/"" → {}."""
    if text is None or text.strip().lower() in ("", "none", "off", "all"):
        return {}
    out = {}
    for kv in text.split(","):
        k, eq, v = kv.partition("=")
        if not eq or not k.strip() or not v.strip():
            die(f"--only/GP_ONLY takes NAME=VALUE[,NAME=VALUE…] (or none), not '{kv.strip()}'")
        out[k.strip()] = v.strip()
    return out


def only_fields():
    """This project's default field values — .gp.json "only": {"Projects": "SONUB"}, or GP_ONLY="Projects=SONUB"
    ("none" turns it off). A command that names no value for such a field works on these items only: list, info
    and people show only them, create files new issues under them, and assigning someone keeps the card there."""
    if "GP_ONLY" in os.environ:
        return parse_only(os.environ["GP_ONLY"])
    return dict(load_config().get("only") or {})


def active_only(a):
    """The default values for this command: none with --all; a --field NAME=… of the command replaces its field."""
    if getattr(a, "all", False):
        return {}
    given = {kv.partition("=")[0].strip().lower() for kv in getattr(a, "field", None) or []}
    return {k: v for k, v in only_fields().items() if k.lower() not in given}


def only_args(a):
    return [f"{k}={v}" for k, v in active_only(a).items()]


def only_keys():
    """NAME= for each default field, given to person_fields so assigning Zar does not move a card out of SONUB."""
    return [f"{k}=" for k in only_fields()]


def item_filters(a):
    """Field filters for list/info/people: the default values plus --field NAME=VALUE (VALUE * = any value)."""
    filters = dict(active_only(a))
    for kv in getattr(a, "field", None) or []:
        k, _, v = kv.partition("=")
        if v.strip() != "*":
            filters[k.strip()] = v.strip()
    return filters


def filter_items(items, filters):
    def ok(i):
        have = {k.lower(): str(v if v is not None else "") for k, v in (i.get("fields") or {}).items()}
        return all(have.get(k.lower(), "").lower() == v.lower() for k, v in filters.items())
    return [i for i in items if ok(i)] if filters else items


def only_note(a, filters):
    """One line that says which items a list/info/people run shows."""
    if not filters:
        return ""
    where = "GP_ONLY" if "GP_ONLY" in os.environ else (load_config().get("_path") or LOCAL_CONFIG)
    shown = ", ".join(f"{k} = {v}" for k, v in filters.items())
    defaults = active_only(a)
    return f"  only {shown}" + (f" (default from {where}; --all for every item, --field NAME=VALUE for another)"
                                if defaults else "")


def issue_context(a, need_item=True):
    """(project, owner, repo, num, issue, item_id) for commands that take <issue>."""
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    o, r, n = parse_ref(a.ref, owner)
    issue, item_id = find_issue(o, r, n, p["owner"]["login"], p["number"])
    if need_item and not item_id:
        print("  not on the board yet — adding it")
        item_id = add_to_board(p, issue["url"], a.dry_run)
    return p, o, r, n, issue, item_id


def verify(p, o, r, n):
    """Read the issue back and print what is really on GitHub now."""
    issue, item_id = find_issue(o, r, n, p["owner"]["login"], p["number"])
    status = "-"
    if item_id:
        data = graphql("query($id: ID!) { node(id: $id) { ... on ProjectV2Item { %s } } }" % ITEM_FIELDS, id=item_id)
        it = flatten(data["node"])
        status = it["status"] or "-"
        who = ",".join(it["assignees"]) or "-"
        labels = ",".join(it["labels"]) or "-"
    else:
        who = labels = "?"
    print(f"  check: {o}/{r}#{n} state={issue['state']} {STATUS_FIELD}={status} "
          f"assignees={who} labels={labels} board={'yes' if item_id else 'no'}  {issue['url']}")


# ---------------------------------------------------------------- checklist (TODO) helpers

CHECK_RE = re.compile(r"^(\s*)[-*] \[( |x|X)\] (.*)$")


def checklist(body):
    """[(line index, done, text)] for every '- [ ] …' line."""
    out = []
    for i, line in enumerate(body.splitlines()):
        m = CHECK_RE.match(line)
        if m:
            out.append((i, m.group(2) != " ", m.group(3)))
    return out


def with_todos(body, todos):
    body = (body or "").rstrip()
    lines = [f"- [ ] {t}" for t in todos]
    return (body + "\n\n" if body else "") + "\n".join(lines) + "\n"


# ---------------------------------------------------------------- image upload

def attach_args(files):
    out = []
    for f in files or []:
        path = f.split("#", 1)[0]
        if not os.path.isfile(path):
            die(f"file not found: {path}")
        out += ["--attach", f]
    return out


def gh_supports_attach():
    if os.environ.get("GP_NO_ATTACH"):  # force the gp-assets branch upload (old gh, or to test it)
        return False
    r = gh(["issue", "edit", "--help"], check=False)
    return "--attach" in (r.stdout or "")


def upload_to_branch(full_repo, files, issue_number, dry):
    """Fallback for older gh: commit images to the gp-assets branch and return markdown links."""
    o, r = full_repo.split("/")
    res = gh(["api", f"repos/{full_repo}/branches/{ASSETS_BRANCH}"], check=False)
    if res.returncode != 0 and not dry:
        print(f"  creating orphan branch {ASSETS_BRANCH} for images")
        tree = json.loads(gh(["api", "-X", "POST", f"repos/{full_repo}/git/trees", "--input", "-"], input_text=json.dumps(
            {"tree": [{"path": "README.md", "mode": "100644", "type": "blob",
                       "content": "Images attached to issues by the gp skill.\n"}]})))
        commit = json.loads(gh(["api", "-X", "POST", f"repos/{full_repo}/git/commits", "--input", "-"], input_text=json.dumps(
            {"message": "gp: images for issues", "tree": tree["sha"], "parents": []})))
        gh(["api", "-X", "POST", f"repos/{full_repo}/git/refs", "-f", f"ref=refs/heads/{ASSETS_BRANCH}",
            "-f", f"sha={commit['sha']}"])
    links = []
    for f in files:
        path, _, alt = f.partition("#")
        name = re.sub(r"[^A-Za-z0-9._-]+", "-", os.path.basename(path))
        dest = f"issues/{issue_number}/{int(time.time())}-{name}"
        with open(path, "rb") as fh:
            content = base64.b64encode(fh.read()).decode()
        print(f"{'[dry-run] ' if dry else '$ '}upload {path} → {full_repo}@{ASSETS_BRANCH}:{dest}")
        if not dry:
            gh(["api", "-X", "PUT", f"repos/{full_repo}/contents/{dest}", "--input", "-"], input_text=json.dumps(
                {"message": f"gp: image for #{issue_number}", "content": content, "branch": ASSETS_BRANCH}))
        links.append(f"![{alt or name}](https://github.com/{o}/{r}/blob/{ASSETS_BRANCH}/{dest}?raw=true)")
    return links


# ---------------------------------------------------------------- commands: account & boards

def cmd_doctor(a):
    ok = True
    if not shutil.which("gh"):
        print("✗ gh is not installed — https://cli.github.com (macOS: brew install gh · Windows: winget install GitHub.cli)")
        return
    ver = gh(["--version"]).splitlines()[0]
    print(f"✓ {ver}")
    st = gh(["auth", "status"], check=False)
    text = (st.stdout or "") + (st.stderr or "")
    if st.returncode != 0 or "Logged in" not in text:
        print("✗ not logged in → gh auth login   (no GitHub account yet? sign up at https://github.com/signup first)")
        return
    m = re.search(r"account (\S+)", text)
    print(f"✓ logged in as {m.group(1) if m else me()}")
    scopes = re.search(r"Token scopes: (.*)", text)
    have = scopes.group(1) if scopes else ""
    for need in ("project", "repo"):
        if f"'{need}'" in have:
            print(f"✓ scope '{need}'")
        else:
            ok = False
            print(f"✗ scope '{need}' missing → gh auth refresh -s project,repo")
    if not gh_supports_attach():
        print("• this gh cannot --attach images; gp will upload images to a 'gp-assets' branch instead (or: gh upgrade)")
    print_board_settings()
    print("ready" if ok else "fix the ✗ lines above")


def cmd_projects(a):
    owner = login_of(a.owner)
    args = ["project", "list", "--owner", owner, "--format", "json", "--limit", "100"]
    if a.closed:
        args.append("--closed")
    data = json.loads(gh(args))
    rows = data.get("projects", [])
    if a.json:
        print(json.dumps(rows, ensure_ascii=False, indent=1))
        return
    print(f"{owner}: {len(rows)} project(s)")
    for p in rows:
        flags = " ".join(x for x in ("closed" if p.get("closed") else "", "public" if p.get("public") else "private") if x)
        print(f"  #{p['number']} {p['title']} · {p.get('items', {}).get('totalCount', '?')} items · {flags} · {p['url']}")


def print_board_settings():
    """Which board this folder uses, and from which file."""
    cfg, local, glob = load_config(), find_local_config(), read_json(CONFIG_PATH)
    if os.environ.get("GP_PROJECT"):
        print(f"• GP_OWNER/GP_PROJECT override the files: {os.environ.get('GP_OWNER') or '@me'} #{os.environ['GP_PROJECT']}")
    if cfg:
        name = " ".join(str(x) for x in (cfg.get("title"), f"{cfg.get('owner')} #{cfg.get('number')}", cfg.get("url")) if x)
        print(f"✓ board ({cfg['_scope']}): {name}  ← {cfg['_path']}")
        only = only_fields()
        if only:
            print("✓ only " + ", ".join(f"{k} = {v}" for k, v in only.items())
                  + f"  ← {'GP_ONLY' if 'GP_ONLY' in os.environ else cfg['_path']} (a command that names another value, or --all, overrides it)")
        if cfg["_scope"] == "local" and glob.get("number"):
            print(f"• global board (used outside this project): {glob.get('owner')} #{glob.get('number')}  ← {CONFIG_PATH}")
        elif cfg["_scope"] == "global" and project_root():
            print(f"• this project has no {LOCAL_CONFIG}; `gp.py init <board URL>` gives it its own board")
    else:
        print("• no board yet → gp.py init <board URL> (this project) or gp.py init <board URL> --global (every project)")
    if local and not read_json(local).get("number"):
        print(f"• {local} has no board number — run gp.py init <board URL> again")


def cmd_init(a):
    scope = config_scope(a)
    if a.remove_instructions:
        write_instructions(a.dry_run, remove=True)
        return
    if a.unset:
        path = config_path(scope)
        if not os.path.isfile(path):
            print(f"no {scope} board setting ({path})")
        elif not a.dry_run:
            os.remove(path)
            print(f"removed the {scope} board setting: {path}")
        else:
            print(f"[dry-run] remove {path}")
        print_board_settings()
        maybe_instructions(a)
        return
    if not a.target and a.only is not None:
        return set_only(a, scope)
    if not a.target:
        print_board_settings()
        if not a.show:
            maybe_instructions(a)
        return
    owner, number = parse_board(a.target, a.number_arg)
    p = load_project(login_of(owner), number, with_items=False)
    path = config_path(scope)
    cfg = board_config(p)
    old = read_json(path)
    if old.get("number") == cfg["number"] and str(old.get("owner", "")).lower() == cfg["owner"].lower() and old.get("only"):
        cfg["only"] = old["only"]
    if a.only is not None:
        cfg.pop("only", None)
        cfg.update({"only": checked_only(p, a.only)} if parse_only(a.only) else {})
    if a.dry_run:
        print(f"[dry-run] write {path}: {cfg}")
        return
    save_config(cfg, scope)
    print(f"{scope} board: {p['title']} ({p['owner']['login']} #{p['number']}) {p['url']}")
    print(f"  saved in {path}")
    if cfg.get("only"):
        print("  only " + ", ".join(f"{k} = {v}" for k, v in cfg["only"].items())
              + " — list/info/people show these items and create files new issues under them unless the command names another value")
    if scope == "local":
        print(f"  used in {os.path.dirname(path)} and its sub folders. Commit {LOCAL_CONFIG} to share the board "
              f"with the team, or add it to .gitignore to keep it to yourself.")
    else:
        local = find_local_config()
        if local:
            print(f"  note: this folder still uses its own board from {local} (gp.py init --unset --local removes it)")
        else:
            print("  used in every folder that has no .gp.json of its own")
    maybe_instructions(a)


def checked_only(p, text):
    """--only NAME=VALUE… checked against the board: the field must exist and VALUE must be one of its options."""
    out = {}
    for k, v in parse_only(text).items():
        f = field_by_name(p, k)
        if f["name"] == STATUS_FIELD:
            die(f"--only cannot use the {STATUS_FIELD} field — use list --status for columns")
        out[f["name"]] = resolve_option(f, v)["name"] if "options" in f else v
    return out


def set_only(a, scope):
    """init --only … without a board URL: change only the default field values of the saved board setting."""
    path = config_path(scope)
    cfg = read_json(path)
    if not cfg.get("number"):
        die(f"no {scope} board setting in {path} — run `gp.py init <board URL> --only {a.only}`")
    if parse_only(a.only):
        cfg["only"] = parse_only(a.only) if mode() == "rest" else \
            checked_only(load_project(login_of(cfg["owner"]), int(cfg["number"]), with_items=False), a.only)
    else:
        cfg.pop("only", None)
    if a.dry_run:
        print(f"[dry-run] write {path}: only = {cfg.get('only') or '(none)'}")
        return
    write_json(path, cfg)
    print(f"{scope} setting {path}: only " + (", ".join(f"{k} = {v}" for k, v in cfg["only"].items())
                                              if cfg.get("only") else "(none) — every item on the board"))


def maybe_instructions(a):
    """gp manages issues only and leaves the project's files alone: CLAUDE.md / AGENTS.md get the gp block only when
    the user asks for it with --instructions."""
    if getattr(a, "instructions", False):
        write_instructions(a.dry_run)
    else:
        print("• CLAUDE.md / AGENTS.md not touched (gp changes only GitHub issues and boards); "
              "`init --instructions` writes the 'always use the gp skill' block when you want it")


# ---------------------------------------------------------------- instructions in CLAUDE.md / AGENTS.md

GUIDE_BEGIN = "<!-- gp:begin"
GUIDE_END = "<!-- gp:end -->"
GUIDE_HEAD = (GUIDE_BEGIN + " — written by the gp skill (`gp init`). Run `gp init` again to refresh it; "
              "`gp init --remove-instructions` removes it. -->")
GUIDE_RULES = """## 🛑 GitHub Project work → always use the gp skill

- Every request about GitHub Projects, issues or tasks MUST go through the **gp skill** — load it first (Claude Code: the `gp` skill or `/gp:gp`; Codex and other agents: `$gp`), even when the user does not say "GitHub" or "gp". This covers: issues, 이슈, 일감, 작업, tasks, TODO, 할 일, 해야 할 일, 체크리스트, kanban, 칸반, board, 보드, columns, 컬럼, 칸, fields, views, assignees, 담당자 — and every action on them: create/생성/만들어, edit/수정, move/옮겨, close/완료/끝났어, reopen, delete/삭제, list/목록/보여 줘, search/검색/찾아, assign/할당, attach images/스크린샷 첨부, add TODO lines.
- Do the work with the skill's `scripts/gp.py` and report from its `check:` lines. Do not call `gh issue`, `gh project` or the GraphQL API directly, and do not keep tasks in another tracker or a local TODO file instead — only when gp.py has no command for it, follow the skill's `references/commands.md`.
- 🛑 gp work changes **only GitHub** (issues, comments, the board, its columns/fields/views, members). While doing it, never create, edit, delete, format, commit or push any file of the project — source code, tests, configs, documents, CLAUDE.md/AGENTS.md. Reading files to write a better issue is fine. A piece of work given to gp ("fix the login bug", "로그인 버그 고쳐") becomes an issue (or a TODO line, a comment) — it is recorded, not done; the code work starts only when the user asks for it as its own request, outside gp.
- Don't ask before creating, editing, moving or listing; ask only before deleting, or changing many issues at once."""


def guide_board(cfg, where):
    """The board line of an instruction block."""
    url = f" — {cfg['url']}" if cfg.get("url") else ""
    return f"{cfg.get('title') or 'board'}{url} (`{cfg.get('owner')}` #{cfg.get('number')}, {where})"


def guide_project(root):
    """The block for a project's CLAUDE.md/AGENTS.md: the rules + this project's board."""
    local = os.path.join(root, LOCAL_CONFIG)
    lines = [GUIDE_HEAD, GUIDE_RULES]
    own, glob = read_json(local), read_json(CONFIG_PATH)
    if own.get("number"):
        lines.append(f"- **This project's board: {guide_board(own, f'saved in `{LOCAL_CONFIG}`')}.** Create, list, "
                     "search and move every issue of this project on this board — never on another board — unless "
                     "the user names a different one for that request.")
    elif glob.get("number"):
        lines.append(f"- This project has no `{LOCAL_CONFIG}`, so it uses the default board "
                     f"{guide_board(glob, 'from ~/.config/gp/config.json')}. `gp init <board URL>` gives it its own board.")
    else:
        lines.append("- No board is chosen yet: ask the user for the board URL and run `gp init <board URL>` "
                     "(`gp.py projects` lists their boards; `project-create … --use` makes one).")
    repo = current_repo()
    if repo:
        lines.append(f"- New issues go to `{repo}` (this repository) unless the user names another repository.")
    if os.path.isdir(os.path.join(root, ".claude", "skills", "gp")):
        lines.append("- In a Claude Code cloud session use `python3 .claude/skills/gp/scripts/gp.py` (it switches to "
                     "REST mode by itself; column moves are queued for the gp-sync Action).")
    return "\n".join(lines + [GUIDE_END])


def guide_global():
    """The block for the user's own CLAUDE.md/AGENTS.md (every project)."""
    lines = [GUIDE_HEAD, GUIDE_RULES]
    glob = read_json(CONFIG_PATH)
    if glob.get("number"):
        lines.append(f"- **Default board** (every project that has no `{LOCAL_CONFIG}` of its own): "
                     f"**{guide_board(glob, 'saved in ~/.config/gp/config.json')}.** Work on this board unless the "
                     f"project's `{LOCAL_CONFIG}` or the user names another.")
    lines.append(f"- A project's own board is in its `{LOCAL_CONFIG}` (`gp init` shows which board is in effect). "
                 "No board anywhere → ask the user for the board URL and run `gp init <board URL>`.")
    return "\n".join(lines + [GUIDE_END])


def imports_agents_md(text):
    return re.search(r"^\s*@(\./)?AGENTS\.md\s*$", text, re.M) is not None


def project_instruction_files(root):
    """[(path, create_with)] — CLAUDE.md is read by Claude Code, AGENTS.md by Codex and other agents (and by Claude
    Code when there is no CLAUDE.md). A CLAUDE.md that imports @AGENTS.md (or links to it) gets the block once,
    through AGENTS.md. A missing CLAUDE.md is created as `@AGENTS.md`, so an AGENTS.md-only project stays as it was."""
    agents = os.path.join(root, "AGENTS.md")
    claude = next((p for p in (os.path.join(root, "CLAUDE.md"), os.path.join(root, ".claude", "CLAUDE.md"))
                   if os.path.isfile(p)), None)
    files = [(agents, None)]
    if claude is None:
        files.append((os.path.join(root, "CLAUDE.md"), "@AGENTS.md\n"))
    elif os.path.realpath(claude) != os.path.realpath(agents):
        with open(claude, encoding="utf-8") as f:
            if not imports_agents_md(f.read()):
                files.append((claude, ""))
    return files


def global_instruction_files():
    """The user's instructions for every project: ~/.claude/CLAUDE.md (Claude Code), $CODEX_HOME/AGENTS.md (Codex).
    Only for agents installed on this computer (their folder exists)."""
    files, seen = [], set()
    for folder, name in ((os.environ.get("CLAUDE_CONFIG_DIR") or os.path.expanduser("~/.claude"), "CLAUDE.md"),
                         (os.environ.get("CODEX_HOME") or os.path.expanduser("~/.codex"), "AGENTS.md")):
        path = os.path.join(folder, name)
        if os.path.isdir(folder) and os.path.realpath(path) not in seen:
            seen.add(os.path.realpath(path))
            files.append(path)
    return files


def put_block(path, block, dry, create_with=""):
    """Add or replace the gp block in a markdown file (block=None removes it). Returns what happened."""
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except FileNotFoundError:
        text = None
    except OSError as e:
        return f"skipped ({e.strerror})"
    pat = re.compile(re.escape(GUIDE_BEGIN) + r".*?" + re.escape(GUIDE_END) + r"\n?", re.S)
    if text is None:
        if block is None:
            return "no file"
        new, what = (create_with or "") + ("\n" if create_with else "") + block + "\n", "created"
    elif pat.search(text):
        new = pat.sub(lambda m: "" if block is None else block + "\n", text, count=1)
        if block is None:
            new = re.sub(r"\n{3,}$", "\n", new.rstrip("\n") + "\n") if new.strip() else ""
        what = "removed" if block is None else ("unchanged" if new == text else "updated")
    elif block is None:
        return "no gp block"
    else:
        new, what = text.rstrip("\n") + ("\n\n" if text.strip() else "") + block + "\n", "added"
    if new != text and not dry:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
    return what


def write_instructions(dry, remove=False):
    """Put the 'always use the gp skill' block (with the board URL) in the project's and the user's CLAUDE.md and
    AGENTS.md. A cloud session's home folder is thrown away, so there only the project files are written."""
    tag = "[dry-run] " if dry else ""
    print(f"{tag}instructions ({'remove' if remove else 'always use the gp skill for GitHub Project work'}):")
    root = project_root()
    if root:
        block = None if remove else guide_project(root)
        for path, create_with in project_instruction_files(root):
            what = put_block(path, block, dry, "" if remove else create_with)
            note = "  (imports @AGENTS.md)" if create_with and what == "created" else ""
            print(f"  project · {what}: {path}{note}")
    else:
        print("  project · not in a git repository — only the files for every project")
    if mode() == "rest":
        print("  global  · skipped in a cloud session (its home folder does not last)")
        return
    block = None if remove else guide_global()
    for path in global_instruction_files():
        print(f"  global  · {put_block(path, block, dry)}: {path}")


def update_options(project, field, options, dry):
    """Replace a single-select field's options. Existing options keep their id (items keep their value)."""
    payload = [{"name": o["name"], "color": o.get("color") or "GRAY", "description": o.get("description") or "",
                **({"id": o["id"]} if o.get("id") else {})} for o in options]
    print(("[dry-run] " if dry else "$ ") + f"updateProjectV2Field {field['name']}: " + ", ".join(o["name"] for o in payload))
    if dry:
        return
    graphql_json("""mutation($f: ID!, $o: [ProjectV2SingleSelectFieldOptionInput!]) {
      updateProjectV2Field(input: {fieldId: $f, singleSelectOptions: $o}) { projectV2Field { ... on ProjectV2SingleSelectField { name options { name } } } } }""",
                 {"f": field["id"], "o": payload})
    refresh_cache(project["owner"]["login"], project["number"])


def cmd_project_create(a):
    owner = login_of(a.owner)
    out = run(["gh", "project", "create", "--owner", owner, "--title", a.title, "--format", "json"], a.dry_run)
    if a.dry_run:
        return
    created = json.loads(out)
    number = created["number"]
    print(f"  created #{number} {created['url']}")
    p = load_project(owner, number, with_items=False)
    if a.desc or a.readme or a.public:
        graphql("""mutation($id: ID!, $d: String, $r: String, $pub: Boolean) {
          updateProjectV2(input: {projectId: $id, shortDescription: $d, readme: $r, public: $pub}) { projectV2 { id } } }""",
                id=p["id"], d=a.desc, r=a.readme, pub=True if a.public else None)
        print("  description/readme/visibility set")
    if a.columns:
        names = [c.strip() for c in a.columns.split(",") if c.strip()]
        f = status_field(p)
        old = {o["name"].lower(): o for o in f["options"]}
        opts = [dict(old.get(n.lower(), {}), name=n, color=old.get(n.lower(), {}).get("color") or COLORS[i % len(COLORS)])
                for i, n in enumerate(names)]
        update_options(p, f, opts, False)
    for repo in a.repo or []:
        run(["gh", "project", "link", str(number), "--owner", owner, "--repo", repo_full(repo, owner)], False)
    if a.use:
        scope = config_scope(a)
        path = save_config(board_config(load_project(owner, number, with_items=False)), scope)
        print(f"  {scope} board is now {owner} #{number} ({path})")
        maybe_instructions(a)
    a.owner, a.number = owner, number
    cmd_info(a)


def cmd_project_edit(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    vis = True if a.public else (False if a.private else None)
    print(("[dry-run] " if a.dry_run else "$ ") + f"updateProjectV2 {owner} #{number}")
    if not a.dry_run:
        graphql("""mutation($id: ID!, $t: String, $d: String, $r: String, $pub: Boolean, $c: Boolean) {
          updateProjectV2(input: {projectId: $id, title: $t, shortDescription: $d, readme: $r, public: $pub, closed: $c}) {
            projectV2 { title public closed url } } }""",
                id=p["id"], t=a.title, d=a.desc, r=a.readme, pub=vis,
                c=True if a.close else (False if a.reopen else None))
        p = load_project(owner, number, with_items=False)
        print(f"  check: '{p['title']}' {'public' if p['public'] else 'private'} {'closed' if p['closed'] else 'open'} {p['url']}")


def cmd_project_delete(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    if not a.yes:
        die(f"this deletes the whole board '{p['title']}' ({p['url']}) and cannot be undone. Add --yes after the user agrees.")
    run(["gh", "project", "delete", str(number), "--owner", owner], a.dry_run)
    for path in (find_local_config(), CONFIG_PATH):
        cfg = read_json(path) if path else {}
        if cfg.get("number") == number and cfg.get("owner") == owner and not a.dry_run:
            os.remove(path)
            print(f"  board setting removed: {path}")


def cmd_project_link(a):
    owner, number = board(a)
    sub = "unlink" if a.unlink else "link"
    run(["gh", "project", sub, str(number), "--owner", owner, "--repo", repo_full(a.repo, owner)], a.dry_run)


def cmd_info(a):
    owner, number = board(a)
    p = load_project(owner, number)
    filters = item_filters(a)
    total = len(p["all_items"])
    p["all_items"] = filter_items(p["all_items"], filters)
    print(f"{p['title']}  {p['url']}  ({'public' if p['public'] else 'private'}{', closed' if p['closed'] else ''}, "
          f"{total} items" + (f", {len(p['all_items'])} shown" if filters else "") + ")")
    if filters:
        print(only_note(a, filters))
    if p.get("shortDescription"):
        print(f"  description: {p['shortDescription']}")
    for f in p["fields"]["nodes"]:
        if not f:
            continue
        if "options" in f:
            print(f"  {f['name']} (single select): " + ", ".join(o["name"] for o in f["options"]))
        elif f["dataType"] in ("TEXT", "NUMBER", "DATE", "ITERATION"):
            print(f"  {f['name']} ({f['dataType'].lower()})")
    try:
        sf = status_field(p)
        order = [o["name"] for o in sf["options"]]
        counts = Counter(i["status"] or "(no status)" for i in p["all_items"])
        print("  per column: " + ", ".join(f"{k} {counts.get(k, 0)}" for k in order + ["(no status)"] if k in order or counts.get(k)))
    except SystemExit:
        pass
    print("  views: " + ", ".join(f"{v['name']} ({v['layout'].replace('_LAYOUT', '').lower()})" for v in p["views"]["nodes"]))
    repos = Counter(i["repo"] or "(draft)" for i in p["all_items"])
    if repos:
        print("  repos: " + ", ".join(f"{k} {v}" for k, v in repos.most_common()))
    stale = [i for i in p["all_items"] if i["state"] in ("CLOSED", "MERGED") and done_option(p) and i["status"] != done_option(p)["name"]]
    if stale:
        print(f"  closed but not in the done column: {len(stale)}")
        for i in stale[:20]:
            print(f"    {i['ref']} [{i['status'] or '-'}] {i['title']}")


# ---------------------------------------------------------------- commands: columns, fields, views

def cmd_columns(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    for i, o in enumerate(status_field(p)["options"], 1):
        print(f"  {i}. {o['name']} ({o['color'].lower()}){' — ' + o['description'] if o.get('description') else ''}")


def cmd_column_add(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    f = status_field(p)
    opts = list(f["options"])
    if any(o["name"].lower() == a.name.lower() for o in opts):
        die(f"column '{a.name}' already exists")
    new = {"name": a.name, "color": (a.color or COLORS[len(opts) % len(COLORS)]).upper(), "description": a.desc or ""}
    if a.after:
        idx = opts.index(resolve_option(f, a.after, STATUS_ALIASES)) + 1
    elif a.first:
        idx = 0
    else:
        idx = len(opts)
    opts.insert(idx, new)
    update_options(p, f, opts, a.dry_run)
    if not a.dry_run:
        cmd_columns(a)


def cmd_column_rename(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    f = status_field(p)
    target = resolve_option(f, a.old, STATUS_ALIASES)
    opts = [dict(o, name=a.new) if o["id"] == target["id"] else o for o in f["options"]]
    if a.color:
        opts = [dict(o, color=a.color.upper()) if o["id"] == target["id"] else o for o in opts]
    update_options(p, f, opts, a.dry_run)
    if not a.dry_run:
        cmd_columns(a)


def cmd_column_delete(a):
    owner, number = board(a)
    p = load_project(owner, number)
    f = status_field(p)
    target = resolve_option(f, a.name, STATUS_ALIASES)
    inside = [i for i in p["all_items"] if i["status"] == target["name"]]
    if inside and not a.move_to and not a.yes:
        die(f"{len(inside)} item(s) are in '{target['name']}'. Pass --move-to <column> to keep them in a column, "
            f"or --yes to leave them without a column.")
    if a.move_to:
        dest = resolve_option(f, a.move_to, STATUS_ALIASES)
        for i in inside:
            set_single(p, i["item_id"], f, dest, a.dry_run)
    update_options(p, f, [o for o in f["options"] if o["id"] != target["id"]], a.dry_run)
    if not a.dry_run:
        cmd_columns(a)


def cmd_column_order(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    f = status_field(p)
    wanted = [resolve_option(f, n, STATUS_ALIASES) for n in a.order.split(",") if n.strip()]
    rest = [o for o in f["options"] if o not in wanted]
    update_options(p, f, wanted + rest, a.dry_run)
    if not a.dry_run:
        cmd_columns(a)


def cmd_field_add(a):
    owner, number = board(a)
    cmd = ["gh", "project", "field-create", str(number), "--owner", owner, "--name", a.name, "--data-type", a.type.upper()]
    if a.type.upper() == "SINGLE_SELECT":
        if not a.options:
            die("--options \"A,B,C\" is required for a single-select field")
        cmd += ["--single-select-options", a.options]
    run(cmd, a.dry_run)
    if not a.dry_run:
        refresh_cache(owner, number)


def cmd_option_add(a):
    """Add values to a single-select field (Projects, Priority …). Existing values keep their id, so items keep them."""
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    f = field_by_name(p, a.field, single_select=True)
    opts = list(f["options"])
    have = {o["name"].lower() for o in opts}
    new = [x.strip() for x in a.names if x.strip() and x.strip().lower() not in have]
    if not new:
        die(f"{f['name']} already has {', '.join(a.names)}")
    for name in new:
        opts.append({"name": name, "color": (a.color or COLORS[len(opts) % len(COLORS)]).upper(), "description": a.desc or ""})
    update_options(p, f, opts, a.dry_run)
    if not a.dry_run:
        f = field_by_name(load_project(owner, number, with_items=False), a.field, single_select=True)
        print(f"  check: {f['name']} = {', '.join(o['name'] for o in f['options'])}")


def cmd_field_delete(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    f = field_by_name(p, a.name)
    if f["name"] == STATUS_FIELD or f["name"] in ("Title", "Assignees", "Labels", "Repository"):
        die(f"'{f['name']}' is a built-in field and cannot be deleted")
    if not a.yes:
        die(f"deleting field '{f['name']}' removes its value from every item. Add --yes after the user agrees.")
    run(["gh", "project", "field-delete", "--id", f["id"]], a.dry_run)
    if not a.dry_run:
        refresh_cache(owner, number)


def cmd_view_add(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    layout = {"board": "BOARD_LAYOUT", "table": "TABLE_LAYOUT", "roadmap": "ROADMAP_LAYOUT"}[a.layout]
    print(("[dry-run] " if a.dry_run else "$ ") + f"createProjectV2View '{a.name}' {a.layout}")
    if not a.dry_run:
        graphql("""mutation($p: ID!, $n: String!, $l: ProjectV2ViewLayout!) {
          createProjectV2View(input: {projectId: $p, name: $n, layout: $l}) { projectV2View { name number } } }""",
                p=p["id"], n=a.name, l=layout)
        print(f"  created. A board view groups by '{STATUS_FIELD}' — its columns are the {STATUS_FIELD} values.")
        if a.filter:
            v = [x for x in load_project(owner, number, with_items=False)["views"]["nodes"] if x["name"] == a.name][-1]
            graphql("""mutation($v: ID!, $f: String!) { updateProjectV2View(input: {viewId: $v, filter: $f}) { projectV2View { name } } }""",
                    v=v["id"], f=a.filter)
            print(f"  filter: {a.filter}")


# ---------------------------------------------------------------- commands: issues

def cmd_list(a):
    owner, number = board(a)
    p = load_project(owner, number, include_archived=a.archived)
    filters = item_filters(a)
    items = filter_items(p["all_items"], filters)
    if a.assignee:
        who = (me() if a.assignee in ("@me", "me") else a.assignee).lower()
        items = [i for i in items if any(who in x.lower() for x in i["assignees"])]
    if a.status:
        f = status_field(p)
        wanted = {resolve_option(f, s, STATUS_ALIASES)["name"] for s in a.status.split(",")}
        items = [i for i in items if i["status"] in wanted]
    if a.repo:
        items = [i for i in items if i["repo"].split("/")[-1].lower() == a.repo.split("/")[-1].lower()]
    if a.label:
        items = [i for i in items if a.label.lower() in (x.lower() for x in i["labels"])]
    if a.state != "all":
        items = [i for i in items if (i["state"] in ("OPEN", "DRAFT")) == (a.state == "open")]
    if a.search:
        items = [i for i in items if a.search.lower() in (i["title"] + " " + i["body"]).lower()]
    if a.json:
        print(json.dumps(items, ensure_ascii=False, indent=1))
        return
    try:
        order = [o["name"] for o in status_field(p)["options"]]
    except SystemExit:
        order = []
    groups = defaultdict(list)
    for i in items:
        groups[i["status"] or "(no status)"].append(i)
    print(f"{p['title']}: {len(items)} item(s)")
    if filters:
        print(only_note(a, filters))
    for status in sorted(groups, key=lambda s: order.index(s) if s in order else len(order)):
        lst = sorted(groups[status], key=lambda i: i["updated"], reverse=True)
        print(f"## {status} ({len(lst)})")
        for i in lst:
            todo = checklist(i["body"])
            extra = [i["state"]] if i["state"] not in ("OPEN", "DRAFT") else []
            if todo:
                extra.append(f"todo {sum(d for _, d, _ in todo)}/{len(todo)}")
            if i["labels"]:
                extra.append("labels:" + ",".join(i["labels"]))
            print(f"  {i['ref']} {i['title']} | {','.join(i['assignees']) or '-'} | {i['updated']}"
                  + (f" | {' '.join(extra)}" if extra else "") + (f" | {i['url']}" if i["url"] else f" | item {i['item_id']}"))


def cmd_create(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    f = status_field(p)
    # No column given → the board's Todo column if it has one (a new item without a column is easy to lose).
    names = {o["name"].lower(): o for o in f["options"]}
    option = resolve_option(f, a.status, STATUS_ALIASES) if a.status else \
        next((names[c.lower()] for c in STATUS_ALIASES["todo"] if c.lower() in names), None)
    body = a.body or ""
    if a.body_file:
        with open(a.body_file, encoding="utf-8") as fh:
            body = fh.read()
    if a.todo:
        body = with_todos(body, a.todo)
    if a.draft:
        out = run(["gh", "project", "item-create", str(number), "--owner", owner, "--title", a.title,
                   "--body", body, "--format", "json"], a.dry_run)
        item_id = json.loads(out)["id"] if out else "<new item>"
        if option:
            set_single(p, item_id, f, option, a.dry_run)
        for kv in only_args(a) + (a.field or []):
            k, _, v = kv.partition("=")
            set_field_value(p, item_id, k, v, a.dry_run)
        print(f"  draft item {item_id} (turn it into an issue later: gp.py convert {item_id} --repo R)")
        return
    if not a.repo:
        die("--repo is required (or --draft for a note that lives only on the board)")
    full = repo_full(a.repo, owner)
    cmd = ["gh", "issue", "create", "-R", full, "--title", a.title, "--body-file", "-"]
    for who in create_assignees(a):
        cmd += ["--assignee", who]
    for lb in a.label or []:
        cmd += ["--label", lb]
    if a.milestone:
        cmd += ["--milestone", a.milestone]
    if a.parent:
        cmd += ["--parent", a.parent]
    images = a.image or []
    native = images and gh_supports_attach()
    if native:
        cmd += attach_args(images)
    url = (run(cmd, a.dry_run, input_text=body).strip().splitlines() or [""])[-1] or f"https://github.com/{full}/issues/<new>"
    print(f"  issue: {url}")
    if images and not native and not a.dry_run:
        num = int(url.rstrip("/").split("/")[-1])
        links = upload_to_branch(full, images, num, a.dry_run)
        gh(["issue", "edit", str(num), "-R", full, "--body-file", "-"], input_text=(body.rstrip() + "\n\n" + "\n".join(links)).strip() + "\n")
    item_id = add_to_board(p, url, a.dry_run)
    if option:
        set_single(p, item_id, f, option, a.dry_run)
    only = only_args(a)
    auto = person_fields(board_fields(p), [] if a.no_assignee else a.assignee, (a.field or []) + only, a.no_person_field)
    for kv in only + (a.field or []) + auto:
        k, _, v = kv.partition("=")
        set_field_value(p, item_id, k, v, a.dry_run)
    if not a.dry_run:
        o, r, n = parse_ref(url, owner)
        verify(p, o, r, n)


def cmd_show(a):
    owner, number = board(a)
    o, r, n = parse_ref(a.ref, owner)
    out = json.loads(gh(["issue", "view", str(n), "-R", f"{o}/{r}", "--json",
                         "title,state,url,body,assignees,labels,milestone,comments,projectItems,createdAt,updatedAt"]))
    if a.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return
    print(f"{o}/{r}#{n} {out['title']} ({out['state']})  {out['url']}")
    print(f"  assignees: {','.join(x['login'] for x in out['assignees']) or '-'} · labels: "
          f"{','.join(x['name'] for x in out['labels']) or '-'} · milestone: {(out.get('milestone') or {}).get('title', '-')}")
    for pi in out.get("projectItems") or []:
        print(f"  board: {pi.get('title')} · {(pi.get('status') or {}).get('name', '-')}")
    print("\n" + (out["body"] or "(no body)"))
    for c in out["comments"][-a.comments:] if a.comments else []:
        print(f"\n--- {c['author']['login']} {c['createdAt'][:10]}\n{c['body']}")


def cmd_edit(a):
    p, o, r, n, issue, item_id = issue_context(a, need_item=bool(a.field))
    full = f"{o}/{r}"
    cmd = ["gh", "issue", "edit", str(n), "-R", full]
    body = None
    if a.title:
        cmd += ["--title", a.title]
    if a.body is not None:
        body = a.body
    if a.body_file:
        with open(a.body_file, encoding="utf-8") as fh:
            body = fh.read()
    if a.append:
        body = (issue["body"] or "").rstrip() + "\n\n" + a.append + "\n"
    if body is not None:
        cmd += ["--body-file", "-"]
    for lb in a.add_label or []:
        cmd += ["--add-label", lb]
    for lb in a.remove_label or []:
        cmd += ["--remove-label", lb]
    if a.milestone:
        cmd += ["--milestone", a.milestone]
    if len(cmd) > 6:
        run(cmd, a.dry_run, input_text=body)
    for kv in a.field or []:
        k, _, v = kv.partition("=")
        set_field_value(p, item_id, k, v, a.dry_run)
    if not a.dry_run:
        verify(p, o, r, n)


def cmd_move(a):
    p, o, r, n, issue, item_id = issue_context(a)
    f = status_field(p)
    set_single(p, item_id, f, resolve_option(f, a.column, STATUS_ALIASES), a.dry_run)
    if not a.dry_run:
        verify(p, o, r, n)


def cmd_set(a):
    """Several changes at once: column, fields, assignees, state, comment."""
    if a.close and a.reopen:
        die("--close and --reopen cannot be used together")
    p, o, r, n, issue, item_id = issue_context(a)
    full = f"{o}/{r}"
    if a.status:
        f = status_field(p)
        set_single(p, item_id, f, resolve_option(f, a.status, STATUS_ALIASES), a.dry_run)
    for kv in (a.field or []) + person_fields(board_fields(p), a.assignee, (a.field or []) + only_keys(), a.no_person_field):
        k, _, v = kv.partition("=")
        set_field_value(p, item_id, k, v, a.dry_run)
    for who in a.assignee or []:
        run(["gh", "issue", "edit", str(n), "-R", full, "--add-assignee", who], a.dry_run)
    for who in a.unassign or []:
        run(["gh", "issue", "edit", str(n), "-R", full, "--remove-assignee", who], a.dry_run)
    if a.close and issue["state"] == "OPEN":
        run(["gh", "issue", "close", str(n), "-R", full, "--reason", a.reason], a.dry_run)
    if a.reopen and issue["state"] != "OPEN":
        run(["gh", "issue", "reopen", str(n), "-R", full], a.dry_run)
    if a.comment:
        run(["gh", "issue", "comment", str(n), "-R", full, "--body-file", "-"], a.dry_run, input_text=a.comment)
    if not a.dry_run:
        verify(p, o, r, n)


def cmd_close(a):
    p, o, r, n, issue, item_id = issue_context(a)
    full = f"{o}/{r}"
    if a.comment:
        run(["gh", "issue", "comment", str(n), "-R", full, "--body-file", "-"], a.dry_run, input_text=a.comment)
    if issue["state"] == "OPEN":
        run(["gh", "issue", "close", str(n), "-R", full, "--reason", a.reason], a.dry_run)
    else:
        print("  already closed")
    dest = resolve_option(status_field(p), a.status, STATUS_ALIASES) if a.status else done_option(p)
    if dest and not a.keep_column:
        set_single(p, item_id, status_field(p), dest, a.dry_run)
    if not a.dry_run:
        verify(p, o, r, n)


def cmd_reopen(a):
    p, o, r, n, issue, item_id = issue_context(a)
    if issue["state"] != "OPEN":
        run(["gh", "issue", "reopen", str(n), "-R", f"{o}/{r}"], a.dry_run)
    if a.status:
        f = status_field(p)
        set_single(p, item_id, f, resolve_option(f, a.status, STATUS_ALIASES), a.dry_run)
    if not a.dry_run:
        verify(p, o, r, n)


def cmd_delete(a):
    p, o, r, n, issue, item_id = issue_context(a, need_item=False)
    if not a.yes:
        die(f"deleting {o}/{r}#{n} '{issue['title']}' cannot be undone (comments and images go too). "
            f"Prefer `close`. Add --yes only after the user agrees.")
    run(["gh", "issue", "delete", str(n), "-R", f"{o}/{r}", "--yes"], a.dry_run)


def cmd_remove(a):
    """Take an item off the board (the issue itself stays), or archive it."""
    p, o, r, n, issue, item_id = issue_context(a, need_item=False)
    if not item_id:
        die("this issue is not on the board")
    if a.archive:
        run(["gh", "project", "item-archive", str(p["number"]), "--owner", p["owner"]["login"], "--id", item_id], a.dry_run)
    else:
        run(["gh", "project", "item-delete", str(p["number"]), "--owner", p["owner"]["login"], "--id", item_id], a.dry_run)


def cmd_comment(a):
    owner, number = board(a)
    o, r, n = parse_ref(a.ref, owner)
    cmd = ["gh", "issue", "comment", str(n), "-R", f"{o}/{r}", "--body-file", "-"]
    body = a.text
    images = a.image or []
    if images and gh_supports_attach():
        cmd += attach_args(images)
    elif images:
        body = (body.rstrip() + "\n\n" + "\n".join(upload_to_branch(f"{o}/{r}", images, n, a.dry_run))).strip()
    print((run(cmd, a.dry_run, input_text=body) or "").strip())


def cmd_attach(a):
    owner, number = board(a)
    o, r, n = parse_ref(a.ref, owner)
    full = f"{o}/{r}"
    if a.comment is not None:
        a.text, a.image = a.comment or "Attached:", a.files
        return cmd_comment(a)
    if gh_supports_attach():
        run(["gh", "issue", "edit", str(n), "-R", full, *attach_args(a.files)], a.dry_run)
    else:
        issue, _ = find_issue(o, r, n)
        links = upload_to_branch(full, a.files, n, a.dry_run)
        run(["gh", "issue", "edit", str(n), "-R", full, "--body-file", "-"], a.dry_run,
            input_text=((issue["body"] or "").rstrip() + "\n\n" + "\n".join(links)).strip() + "\n")
    if not a.dry_run:
        issue, _ = find_issue(o, r, n)
        imgs = re.findall(r"!\[[^\]]*\]\([^)]+\)|<img [^>]+>", issue["body"] or "")
        print(f"  check: body now has {len(imgs)} image(s)  {issue['url']}")


def print_todos(head, body):
    items = checklist(body)
    print(head)
    if not items:
        print("  (no checklist yet — gp.py todo <issue> add \"first step\")")
    for k, (_, done, text) in enumerate(items, 1):
        print(f"  {k}. [{'x' if done else ' '}] {text}")
    if items:
        print(f"  {sum(d for _, d, _ in items)}/{len(items)} done")


def todo_change(body, action, values):
    """The issue body after `todo add|done|undo|remove`."""
    items = checklist(body)
    lines = body.splitlines()
    if action == "add":
        if not values:
            die('give the TODO text: gp.py todo <issue> add "write the test" "update docs"')
        return with_todos(body, values)
    if not values:
        die(f"give the item number(s): gp.py todo <issue> {action} 2")
    for v in values:
        k = int(v)
        if not 1 <= k <= len(items):
            die(f"there is no TODO #{k} (1–{len(items)})")
        idx, done, text = items[k - 1]
        if action == "done":
            lines[idx] = re.sub(r"\[( )\]", "[x]", lines[idx], count=1)
        elif action == "undo":
            lines[idx] = re.sub(r"\[(x|X)\]", "[ ]", lines[idx], count=1)
        elif action == "remove":
            lines[idx] = None
    return "\n".join(x for x in lines if x is not None) + "\n"


def cmd_todo(a):
    owner, number = board(a)
    o, r, n = parse_ref(a.ref, owner)
    issue, _ = find_issue(o, r, n)
    body = issue["body"] or ""
    if a.action in (None, "list"):
        return print_todos(f"{o}/{r}#{n} {issue['title']}", body)
    new_body = todo_change(body, a.action, a.values)
    run(["gh", "issue", "edit", str(n), "-R", f"{o}/{r}", "--body-file", "-"], a.dry_run, input_text=new_body)
    if not a.dry_run:
        print_todos(f"{o}/{r}#{n} {issue['title']}", new_body)


def cmd_convert(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    repo = repo_full(a.repo, owner)
    rid = graphql("query($o: String!, $r: String!) { repository(owner: $o, name: $r) { id } }",
                  o=repo.split("/")[0], r=repo.split("/")[1])["repository"]["id"]
    print(("[dry-run] " if a.dry_run else "$ ") + f"convertProjectV2DraftIssueItemToIssue {a.item} → {repo}")
    if not a.dry_run:
        d = graphql("""mutation($i: ID!, $r: ID!) { convertProjectV2DraftIssueItemToIssue(input: {itemId: $i, repositoryId: $r}) {
          item { content { ... on Issue { url } } } } }""", i=a.item, r=rid)
        print(f"  issue: {d['convertProjectV2DraftIssueItemToIssue']['item']['content']['url']}  (board: {p['title']})")


# ---------------------------------------------------------------- commands: people

def cmd_people(a):
    owner, number = board(a)
    p = load_project(owner, number)
    filters = item_filters(a)
    if filters:
        print(only_note(a, filters))
    per = defaultdict(list)
    for i in filter_items(p["all_items"], filters):
        for who in i["assignees"] or ["(unassigned)"]:
            per[who].append(i)
    for who, lst in sorted(per.items(), key=lambda kv: -len(kv[1])):
        st = Counter(i["status"] or "-" for i in lst)
        print(f"{who}: {len(lst)} · " + ", ".join(f"{k} {v}" for k, v in st.most_common()))
    if a.repo:
        full = repo_full(a.repo, owner)
        rows = json.loads(gh(["api", f"repos/{full}/collaborators", "--paginate"]))
        print(f"\n{full} collaborators (can be assigned): " + ", ".join(
            f"{c['login']}({c.get('role_name', '?')})" for c in rows))


# ---------------------------------------------------------------- commands: members (invite, list, remove, leave)
#
# A board and the repositories its issues live in have separate access lists. On a private board a person needs
# a board role to see and move cards, and must be a collaborator of the repository to read its issues and be
# assigned. `invite` does both. A board role works at once (no e-mail); a repository invitation waits until the
# person accepts it (on github.com, or `gp.py accept` on their computer). GitHub has no API that lists a board's
# collaborators, so gp keeps the ones it adds or removes in MEMBERS_PATH and points to the board's access page.

MEMBERS_PATH = os.path.join(os.path.dirname(CONFIG_PATH), "members.json")
INVITE_PERMISSION = {"pull": "read", "triage": "triage", "push": "write", "maintain": "maintain", "admin": "admin"}


def resolve_login(who):
    """'alice' · '@alice' · '@me' · https://github.com/alice · a public e-mail → login (checked, outside rest mode)."""
    w = who.strip()
    if w in ("@me", "me"):
        return me()
    m = re.match(r"(?:https?://)?(?:www\.)?github\.com/([\w-]+)/?$", w)
    if m:
        w = m.group(1)
    if re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", w):
        if mode() == "rest":
            die(f"{who}: finding an account by e-mail needs GitHub's search API, which a cloud session cannot reach — use the username")
        rows = rest("GET", "search/users?q=" + urllib.parse.quote(f"{w} in:email")).get("items", [])
        if len(rows) != 1:
            die(f"{who}: no GitHub account shows this e-mail publicly — ask for their GitHub username "
                "(the name in github.com/<username>); no account yet → https://github.com/signup")
        print(f"  {who} → {rows[0]['login']}")
        return rows[0]["login"]
    w = w.lstrip("@")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9-]{0,38}", w):
        die(f"not a GitHub username: {who!r}")
    if mode() == "rest":
        return w
    u = rest("GET", f"users/{w}", check=False)
    if not u:
        die(f"{who}: there is no GitHub account with this username (https://github.com/{w})")
    if u.get("type") != "User":
        die(f"{who} is an organization, not a person")
    return u["login"]


def has_board(a):
    return bool(a.number or os.environ.get("GP_PROJECT") or load_config().get("number"))


def board_access(owner, number):
    """The board with its owner, visibility and linked repositories (and teams, on an organization board)."""
    d = graphql("""query($o: String!, $n: Int!) { repositoryOwner(login: $o) { ... on ProjectV2Owner { projectV2(number: $n) {
      id number title url public viewerCanUpdate owner { __typename ... on User { login } ... on Organization { login } }
      repositories(first: 50) { nodes { nameWithOwner } } teams(first: 50) { nodes { slug name } } } } } }""", o=owner, n=number)
    p = (d.get("repositoryOwner") or {}).get("projectV2")
    return p or die(f"project not found: {owner} #{number} (check `gp.py projects --owner {owner}`)")


def recorded_members(p):
    return read_json(MEMBERS_PATH).get(f"{p['owner']['login']}/{p['number']}".lower(), {})


def record_member(p, login, role):
    data = read_json(MEMBERS_PATH)
    rows = data.setdefault(f"{p['owner']['login']}/{p['number']}".lower(), {})
    if role == "NONE":
        rows.pop(login, None)
    else:
        rows[login] = {"role": role.lower(), "date": time.strftime("%Y-%m-%d")}
    write_json(MEMBERS_PATH, data)


def set_board_role(p, login, role, dry):
    """Give (or with NONE take away) a role on the board. Applies at once; GitHub sends no invitation."""
    role = role.upper()
    if login.lower() == p["owner"]["login"].lower():
        print(f"  {login} owns the board '{p['title']}' — nothing to change")
        return
    print(("[dry-run] " if dry else "$ ") + f"updateProjectV2Collaborators {login} {role}  (board '{p['title']}')")
    if dry:
        return
    uid = graphql("query($l: String!) { user(login: $l) { id } }", l=login)["user"]["id"]
    graphql_json("""mutation($p: ID!, $c: [ProjectV2Collaborator!]!) {
      updateProjectV2Collaborators(input: {projectId: $p, collaborators: $c}) { clientMutationId } }""",
                 {"p": p["id"], "c": [{"userId": uid, "role": role}]})
    record_member(p, login, role)
    print(f"  board: {login} removed from '{p['title']}'" if role == "NONE" else
          f"  board: {login} is {role.lower()} on '{p['title']}' — works now, no invitation to accept")


def pending_invitation(full, login):
    for inv in rest("GET", f"repos/{full}/invitations?per_page=100", check=False) or []:
        if (inv.get("invitee") or {}).get("login", "").lower() == login.lower():
            return inv
    return None


def is_collaborator(full, login):
    return rest("GET", f"repos/{full}/collaborators/{login}", check=False) is not None


def repo_info(full, explicit):
    """The repository, if this account may manage its collaborators (admin). Explicit --repo → stop; default → skip."""
    r = rest("GET", f"repos/{full}", check=False)
    if r and (r.get("permissions") or {}).get("admin"):
        return r
    msg = f"{full}: {'not found' if not r else 'you are not an admin there, so you cannot manage its collaborators'}"
    if explicit:
        die(msg)
    print(f"  • {msg} — skipped")
    return None


def member_repos(a, owner, p, for_removal=False):
    """--repo (explicit) → those. Otherwise: invite → this folder's repository, else the board's only linked one;
    remove → this folder's repository and every repository linked to the board."""
    if a.repo:
        return [repo_full(r, owner) for r in a.repo], True
    if getattr(a, "no_repo", False):
        return [], False
    linked = [r["nameWithOwner"] for r in (p or {}).get("repositories", {}).get("nodes", [])]
    cur = current_repo()
    if for_removal:
        return list(dict.fromkeys(([cur] if cur else []) + linked)), False
    return ([cur] if cur else linked if len(linked) == 1 else []), False


def repo_invite(full, login, permission, explicit, dry):
    r = repo_info(full, explicit)
    if not r:
        return None
    personal = r["owner"]["type"] == "User"
    note = " (a personal repository: every collaborator can push — GitHub uses --permission only in organizations)" if personal else ""
    if login.lower() == r["owner"]["login"].lower():
        print(f"  {login} owns {full} — nothing to change")
        return None
    inv = pending_invitation(full, login)
    if inv and inv.get("expired"):
        write("DELETE", f"repos/{full}/invitations/{inv['id']}", None, dry, "expired invitation")
        inv = None
    if inv:
        if not personal and inv.get("permissions") != INVITE_PERMISSION[permission]:
            write("PATCH", f"repos/{full}/invitations/{inv['id']}", {"permissions": INVITE_PERMISSION[permission]}, dry)
        print(f"  {full}: {login} was already invited on {inv.get('created_at', '')[:10]} and has not accepted yet{note}")
        return inv.get("html_url") or f"https://github.com/{full}/invitations"
    was = is_collaborator(full, login)
    out = write("PUT", f"repos/{full}/collaborators/{login}", {"permission": permission}, dry)
    if was or (not dry and not out):
        print(f"  {full}: {login} is already a collaborator" + ("" if personal else f" — permission set to {permission}"))
        return None
    print(f"  {full}: {login} gets an e-mail invitation ({'write' if personal else permission}){note}; "
          "they can see its issues and be assigned after accepting")
    return (out or {}).get("html_url") or f"https://github.com/{full}/invitations"


def cmd_invite(a):
    """Add people to the board (role) and to the repository of its issues (collaborator invitation)."""
    cloud = mode() == "rest"
    board_wanted = not a.no_board and (a.board_role or "writer") != "none"
    p = None
    if board_wanted and not cloud:
        if not has_board(a):
            die("no board chosen — `gp.py init <board URL>` first, or --no-board to invite to --repo only")
        p = board_access(*board(a))
        if not p["viewerCanUpdate"]:
            die(f"you cannot change the board '{p['title']}' — only its admins can add people")
    owner = p["owner"]["login"] if p else (board(a)[0] if has_board(a) and not cloud else ref_owner(a))
    repos, explicit = member_repos(a, owner, p)
    if cloud and not a.repo and not a.no_repo:
        repos = [rest_repo(a, owner)]
    if a.board_role == "none":
        print("  --board-role none removes people from the board; that is `gp.py member-remove LOGIN --no-repo --yes`")
    for who in a.logins:
        login = resolve_login(who)
        print(f"{login}:")
        links = []
        if board_wanted and cloud:
            print("  board: skipped — a Claude Code cloud session cannot reach the board; run `invite` on a computer")
        elif board_wanted:
            set_board_role(p, login, a.board_role or "writer", a.dry_run)
            links.append(f"board {p['url']}")
        for full in repos:
            url = repo_invite(full, login, a.permission, explicit, a.dry_run)
            if url:
                links.append(f"accept the invitation to {full}: {url}")
        if not repos and not a.no_repo:
            print("  • no repository chosen (no git remote here, and the board has several) — add --repo R so they "
                  "can read the issues and be assigned")
        if links:
            print(f"  share with {login}: " + " · ".join(links) + " (with the gp skill: `gp.py invitations` / `gp.py accept --all`)")


def print_repo_members(full, as_json):
    rows = rest("GET", f"repos/{full}/collaborators?per_page=100", check=False)
    invs = rest("GET", f"repos/{full}/invitations?per_page=100", check=False)
    if as_json:
        return {"repo": full, "collaborators": [{"login": c["login"], "role": c.get("role_name")} for c in rows or []],
                "invitations": [{"id": i["id"], "login": (i.get("invitee") or {}).get("login"), "permission": i.get("permissions"),
                                 "sent": i.get("created_at"), "expired": i.get("expired", False)} for i in invs or []]}
    if rows is None:
        print(f"{full}: collaborators not readable (you need push access)")
        return None
    print(f"{full} collaborators: " + ", ".join(f"{c['login']} ({c.get('role_name', '?')})" for c in rows))
    for i in invs or []:
        print(f"  invited, not accepted yet: {(i.get('invitee') or {}).get('login') or i.get('email')} "
              f"({i.get('permissions')}, sent {(i.get('created_at') or '')[:10]}{', EXPIRED' if i.get('expired') else ''})")
    return None


def cmd_members(a):
    """Who is on the board (owner, people added with gp, teams) and in its repositories (collaborators, invitations)."""
    out = {}
    p = None
    if mode() == "rest":
        print("• board members: not readable in a Claude Code cloud session — repository collaborators only")
        owner = ref_owner(a)
        repos = [repo_full(r, owner) for r in a.repo] if a.repo else [rest_repo(a, owner)]
    else:
        p = board_access(*board(a))
        owner = p["owner"]["login"]
        repos = member_repos(a, owner, p, for_removal=True)[0]
        rec = recorded_members(p)
        teams = [t["slug"] for t in p["teams"]["nodes"]]
        out["board"] = {"title": p["title"], "url": p["url"], "public": p["public"], "owner": owner,
                        "added_with_gp": rec, "teams": teams, "everyone": f"{p['url']}/settings/access"}
        if not a.json:
            print(f"board '{p['title']}' ({'public' if p['public'] else 'private'}) {p['url']}")
            print(f"  {owner}: owner")
            for login, v in sorted(rec.items()):
                print(f"  {login}: {v['role']} (added with gp {v['date']})")
            if teams:
                print("  teams: " + ", ".join(teams))
            print(f"  • GitHub has no API that lists everyone on a board; above is the owner and the people gp added "
                  f"on this computer. Everyone (and their roles): {p['url']}/settings/access")
    out["repos"] = [print_repo_members(full, a.json) for full in repos]
    if a.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))


def cmd_member_remove(a):
    """Take people off the board and out of its repositories (cancels a pending invitation)."""
    if not a.yes and not a.dry_run:
        die("member-remove takes people's access away (and GitHub unassigns them from that repository's issues) — "
            "add --yes after checking with the user")
    cloud = mode() == "rest"
    p = None if cloud or a.no_board else board_access(*board(a))
    owner = p["owner"]["login"] if p else ref_owner(a)
    repos, explicit = member_repos(a, owner, p, for_removal=True)
    if cloud and not a.repo and not a.no_repo:
        repos = [rest_repo(a, owner)]
    for who in a.logins:
        login = resolve_login(who)
        print(f"{login}:")
        if p:
            set_board_role(p, login, "NONE", a.dry_run)
        elif cloud and not a.no_board:
            print("  board: skipped — a Claude Code cloud session cannot reach the board; run it on a computer")
        for full in repos:
            if not repo_info(full, explicit):
                continue
            inv = pending_invitation(full, login)
            if inv:
                write("DELETE", f"repos/{full}/invitations/{inv['id']}", None, a.dry_run, "cancel invitation")
                print(f"  {full}: invitation cancelled")
            elif is_collaborator(full, login) and login.lower() != full.split("/")[0].lower():
                write("DELETE", f"repos/{full}/collaborators/{login}", None, a.dry_run)
                print(f"  {full}: removed (GitHub also unassigned them from its issues)")
            elif explicit:
                print(f"  {full}: not a collaborator")


def cmd_leave(a):
    """Remove yourself from repositories (and/or the board in effect)."""
    if not a.yes and not a.dry_run:
        die("leaving cannot be undone by yourself — someone has to invite you again. Add --yes after checking with the user")
    if not a.repos and not a.board:
        die("say what to leave: gp.py leave owner/repo … and/or --board")
    if a.board:
        p = board_access(*board(a))
        set_board_role(p, me(), "NONE", a.dry_run)
    for r in a.repos:
        full = repo_full(r, ref_owner(a))
        if full.split("/")[0].lower() == me().lower():
            die(f"you own {full} — the owner cannot leave (transfer or delete it on GitHub instead)")
        write("DELETE", f"repos/{full}/collaborators/{me()}", None, a.dry_run, "leave")
        print(f"  you left {full}")


def my_invitations():
    if mode() == "rest":
        die("received invitations live under user/…, which a Claude Code cloud session cannot reach — "
            "run it on a computer, or open https://github.com/notifications")
    repos = rest_all("user/repository_invitations")
    orgs = [m for m in rest("GET", "user/memberships/orgs?state=pending", check=False) or [] if m.get("state") == "pending"]
    return repos, orgs


def cmd_invitations(a):
    """Invitations I received and have not accepted yet."""
    repos, orgs = my_invitations()
    if a.json:
        print(json.dumps({"repositories": repos, "organizations": orgs}, ensure_ascii=False, indent=1))
        return
    if not repos and not orgs:
        print("no invitations waiting")
    for i in repos:
        print(f"  {i['id']}  {i['repository']['full_name']} from {(i.get('inviter') or {}).get('login', '?')} "
              f"({i.get('permissions')}, {(i.get('created_at') or '')[:10]}{', EXPIRED' if i.get('expired') else ''})")
    for m in orgs:
        print(f"  org {m['organization']['login']} ({m.get('role')}) — accept: gp.py accept {m['organization']['login']}")
    if repos:
        print("accept: gp.py accept <id | owner/repo | inviter> or --all · decline: gp.py decline …")


def boards_of_repo(full):
    o, r = full.split("/", 1)
    try:
        d = graphql("""query($o: String!, $r: String!) { repository(owner: $o, name: $r) {
          projectsV2(first: 10) { nodes { title url } } } }""", o=o, r=r)
        return (d.get("repository") or {}).get("projectsV2", {}).get("nodes", [])
    except SystemExit:
        return []


def cmd_accept(a):
    """Accept (or with `decline`, refuse) repository and organization invitations."""
    decline = a.cmd == "decline"
    repos, orgs = my_invitations()
    picked, wanted = [], [w.lower() for w in a.which]
    if not a.all and not wanted:
        die("which one? gp.py invitations lists them; then gp.py accept <id | owner/repo | inviter> or --all")
    for i in repos:
        keys = {str(i["id"]), i["repository"]["full_name"].lower(), i["repository"]["name"].lower(),
                (i.get("inviter") or {}).get("login", "").lower()}
        if a.all or keys & set(wanted):
            picked.append(i)
    for i in picked:
        full = i["repository"]["full_name"]
        if i.get("expired") and not decline:
            print(f"  {full}: the invitation expired — ask {(i.get('inviter') or {}).get('login', 'the owner')} to invite you again")
            continue
        write("DELETE" if decline else "PATCH", f"user/repository_invitations/{i['id']}", None, a.dry_run)
        if decline:
            print(f"  declined {full}")
            continue
        print(f"  you are now a collaborator of {full}: https://github.com/{full}/issues")
        for b in boards_of_repo(full) if not a.dry_run else []:
            print(f"    its board: {b['title']} {b['url']}  (`gp.py init {b['url']}` to use it here)")
    for m in orgs:
        org = m["organization"]["login"]
        if a.all or org.lower() in wanted:
            if decline:
                print(f"  org {org}: decline it on https://github.com/orgs/{org}/invitation")
                continue
            write("PATCH", f"user/memberships/orgs/{org}", {"state": "active"}, a.dry_run)
            print(f"  you joined the organization {org}")
            picked.append(m)
    if not picked:
        die("no matching invitation — `gp.py invitations` lists them (an expired one must be sent again)")


def cmd_assign(a):
    p, o, r, n, issue, item_id = issue_context(a, need_item=False)
    full = f"{o}/{r}"
    flag = "--remove-assignee" if a.remove else "--add-assignee"
    for who in a.logins:
        run(["gh", "issue", "edit", str(n), "-R", full, flag, who], a.dry_run)
    auto = [] if a.remove else person_fields(board_fields(p), a.logins, only_keys(), off=a.no_person_field)
    if auto and not item_id:
        print("  not on the board yet — adding it")
        item_id = add_to_board(p, issue["url"], a.dry_run)
    for kv in auto:
        k, _, v = kv.partition("=")
        set_field_value(p, item_id, k, v, a.dry_run)
    if not a.dry_run:
        verify(p, o, r, n)


# ---------------------------------------------------------------- sync: queued gp:… labels → the board

def queued_labels(labels):
    return [lb for lb in labels if lb.lower().startswith(LABEL_PREFIX)]


def item_status(item_id):
    data = graphql("query($id: ID!) { node(id: $id) { ... on ProjectV2Item { %s } } }" % ITEM_FIELDS, id=item_id)
    return flatten(data["node"])["status"]


def sync_issue(p, o, r, n, add, dry):
    """Apply one issue's gp:… labels to the board, then remove them. A closed issue goes to the done column."""
    issue = rest("GET", f"repos/{o}/{r}/issues/{n}")
    queued = queued_labels([lb["name"] for lb in issue.get("labels", [])])
    _, item_id = find_issue(o, r, n, p["owner"]["login"], p["number"])
    if not item_id:
        if not queued and not add:
            print(f"  {o}/{r}#{n}: not on the board and nothing queued — skipped")
            return
        item_id = add_to_board(p, issue["html_url"], dry)
    f, explicit = status_field(p), False
    for lb in queued:
        value = lb[len(LABEL_PREFIX):].strip()
        try:
            if "=" in value:
                k, _, v = value.partition("=")
                set_field_value(p, item_id, k.strip(), v.strip(), dry)
            else:
                set_single(p, item_id, f, resolve_option(f, value, STATUS_ALIASES), dry)
                explicit = True
        except SystemExit:
            print(f"  ✗ {o}/{r}#{n}: label '{lb}' kept — no such column/field value on '{p['title']}'")
            continue
        run(["gh", "api", "-X", "DELETE", f"repos/{o}/{r}/issues/{n}/labels/{urllib.parse.quote(lb, safe='')}"], dry)
    done = done_option(p)
    if issue["state"] == "closed" and not explicit and done and not dry and item_status(item_id) != done["name"]:
        set_single(p, item_id, f, done, dry)
    if not dry:
        verify(p, o, r, n)


def cmd_sync(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=not a.refs)
    targets = []
    if a.refs:
        targets = [parse_ref(ref, owner) for ref in a.refs]
    else:
        repos = [repo_full(x, owner) for x in a.repo] if a.repo else \
            sorted({i["repo"] for i in p["all_items"] if i["repo"]} | ({current_repo()} - {None}))
        for full in repos:
            o, r = full.split("/")
            for it in rest_all(f"repos/{full}/issues?state=all&sort=updated&direction=desc", limit=a.limit):
                if queued_labels([lb["name"] for lb in it.get("labels", [])]):
                    targets.append((o, r, it["number"]))
        done = done_option(p)
        for i in p["all_items"]:  # closed in a cloud session (or anywhere) but still in another column
            if i["number"] and i["state"] in ("CLOSED", "MERGED") and done and i["status"] != done["name"]:
                o, r = i["repo"].split("/")
                targets.append((o, r, i["number"]))
    targets = list(dict.fromkeys(targets))
    print(f"{p['title']}: {len(targets)} issue(s) to sync")
    for o, r, n in targets:
        sync_issue(p, o, r, n, a.add, a.dry_run)
    if not a.dry_run:
        refresh_cache(owner, number)


SYNC_WORKFLOW = """\
# gp sync — Claude Code cloud sessions cannot reach the GitHub Project board (their GitHub proxy
# blocks GraphQL and /users|/orgs/…/projectsV2), so gp queues board changes as gp:… labels on the
# issue. This workflow applies them to the board and removes the labels. Made by `gp.py cloud-setup`.
name: gp sync
on:
  issues:
    types: [opened, labeled, closed, reopened]
  workflow_dispatch:
concurrency:
  group: gp-sync-${{ github.event.issue.number || 'all' }}
  cancel-in-progress: false
jobs:
  sync:
    if: github.event_name != 'issues' || github.event.action != 'labeled' || startsWith(github.event.label.name, 'gp:')
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
        with:
          sparse-checkout: |
            .gp.json
            .claude/skills/gp/scripts
          sparse-checkout-cone-mode: false
      - name: Apply queued board changes
        env:
          GH_TOKEN: ${{ secrets.GP_TOKEN }}
          GP_MODE: gh
          ISSUE: ${{ github.event.issue.html_url }}
        run: |
          if [ -z "$GH_TOKEN" ]; then echo "::error::secret GP_TOKEN is missing - run 'gp.py cloud-setup' on your computer"; exit 1; fi
          python3 .claude/skills/gp/scripts/gp.py sync ${ISSUE:+"$ISSUE"} --repo "$GITHUB_REPOSITORY"
"""


def cmd_cloud_setup(a):
    """Run once on a computer with the GitHub CLI: makes the repository ready for Claude Code cloud sessions."""
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    root = project_root() or die("run cloud-setup inside the git repository that cloud sessions will open")
    full = repo_full(a.repo, owner) if a.repo else current_repo() or die("no GitHub remote 'origin' — pass --repo owner/repo")
    tag = "[dry-run] " if a.dry_run else ""
    local = os.path.join(root, LOCAL_CONFIG)
    print(f"{tag}write {local}  (board + its columns — cloud sessions cannot read the board itself)")
    print(f"{tag}copy the gp skill → {os.path.join(root, '.claude', 'skills', 'gp')}  (cloud sessions load "
          "skills from the repository's .claude/skills, not from plugins or ~/.claude)")
    wf = os.path.join(root, ".github", "workflows", "gp-sync.yml")
    print(f"{tag}write {wf}  (applies queued gp:… labels to the board)")
    if not a.dry_run:
        write_json(local, dict(read_json(local), **board_config(p)))
        dest = os.path.join(root, ".claude", "skills", "gp")
        if os.path.realpath(dest) != os.path.realpath(SKILL_DIR):
            shutil.copytree(SKILL_DIR, dest, dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".claude-plugin"))
        os.makedirs(os.path.dirname(wf), exist_ok=True)
        with open(wf, "w", encoding="utf-8") as fh:
            fh.write(SYNC_WORKFLOW)
    if a.no_secret:
        print(f"• secret skipped — the Action needs GP_TOKEN: gh secret set GP_TOKEN -R {full}  "
              "(a token with the 'project' and 'repo' scopes)")
    else:
        print(f"{tag}gh secret set GP_TOKEN -R {full}  (value: the token of your gh login — it has the 'project' scope)")
        if not a.dry_run:
            gh(["secret", "set", "GP_TOKEN", "-R", full], input_text=gh(["auth", "token"]).strip())
    perm = rest("GET", f"repos/{full}/actions/permissions", check=False)
    if perm is not None and not perm.get("enabled", True):
        print(f"✗ GitHub Actions is turned off for {full} — turn it on (Settings → Actions) or the board will not follow")
    print(f"\nnext: commit and push these so cloud sessions get them:\n"
          f"  git add {LOCAL_CONFIG} .claude/skills/gp .github/workflows/gp-sync.yml && "
          f"git commit -m 'gp: cloud sessions can manage the board' && git push\n"
          f"then in a cloud session: python3 .claude/skills/gp/scripts/gp.py doctor")


# ---------------------------------------------------------------- Claude Code cloud sessions (rest mode)
#
# Only REST calls under repos/{owner}/{repo}/… for the session's repositories get through the proxy, so issues
# are handled with REST and every board change becomes a gp:… label that `sync` applies later.

def current_repo():
    """owner/repo of the 'origin' remote (also the proxy remote of a cloud session), or None."""
    try:
        r = subprocess.run(["git", "remote", "get-url", "origin"], capture_output=True, text=True)
    except OSError:
        return None
    m = re.search(r"([^/:]+)/([^/]+?)(?:\.git)?/?$", r.stdout.strip()) if r.returncode == 0 else None
    return f"{m.group(1)}/{m.group(2)}" if m else None


def ref_owner(a):
    """Owner for repo#12 refs without a board lookup: the board owner, else the current repository's owner."""
    owner = a.owner or os.environ.get("GP_OWNER") or load_config().get("owner")
    if owner and owner not in ("@me", "me"):
        return owner
    cur = current_repo()
    return cur.split("/")[0] if cur else me()


def rest_repo(a, owner):
    full = repo_full(a.repo, owner) if getattr(a, "repo", None) else current_repo()
    return full or die("--repo is required (no GitHub remote 'origin' here)")


def write(method, path, body, dry, note=""):
    print(("[dry-run] " if dry else "$ ") + f"gh api -X {method} {path}" + (f"  {note}" if note else ""))
    return {} if dry else rest(method, path, body)


def logins(names):
    return [me() if x in ("@me", "me") else x for x in names or []]


def create_assignees(a):
    """Who a new issue is assigned to: --assignee if given, else the creator (@me); --no-assignee for nobody."""
    return [] if a.no_assignee else (a.assignee or ["@me"])


def cached_columns():
    return load_config().get("columns") or []


def column_label(word):
    """gp:<column> — the real column name when .gp.json knows the columns, else the word itself (sync resolves it)."""
    cols = cached_columns()
    if cols:
        name = resolve_option({"name": STATUS_FIELD, "options": [{"name": c} for c in cols]}, word, STATUS_ALIASES)["name"]
    else:
        name = word.strip()
    return LABEL_PREFIX + name


def field_label(kv):
    k, _, v = kv.partition("=")
    cfg = load_config()
    fields = cfg.get("fields") or {}
    real = next((name for name in fields if name.lower() == k.strip().lower()), k.strip())
    if "fields" in cfg and real not in fields:
        print(f"• field '{real}' is not in {LOCAL_CONFIG} (known: {', '.join(fields) or 'none'}) — sync keeps the label if the board has no such field")
    if isinstance(fields.get(real), list) and v.strip():
        v = resolve_option({"name": real, "options": [{"name": o} for o in fields[real]]}, v)["name"]
    return f"{LABEL_PREFIX}{real}={v.strip()}"


def queue(full, n, labels, dry, status=None, fields=(), clear_status=False):
    """Replace this issue's queued gp:… labels for the same column/fields with new ones."""
    old = queued_labels(labels)
    new = ([column_label(status)] if status else []) + [field_label(kv) for kv in fields or []]
    keys = {lb.split("=", 1)[0].lower() if "=" in lb else "" for lb in new}
    if clear_status:
        keys.add("")
    drop = [lb for lb in old if (lb.split("=", 1)[0].lower() if "=" in lb else "") in keys and lb not in new]
    for lb in drop:
        write("DELETE", f"repos/{full}/issues/{n}/labels/{urllib.parse.quote(lb, safe='')}", None, dry)
    add = [lb for lb in new if lb not in old]
    for lb in add:
        if not dry:
            what = f"set {lb[len(LABEL_PREFIX):]}" if "=" in lb else f"move to the '{lb[len(LABEL_PREFIX):]}' column"
            rest("POST", f"repos/{full}/labels", {"name": lb[:50], "color": LABEL_COLOR,
                                                  "description": f"gp sync: {what} on the board"[:100]}, check=False)
    if add:
        write("POST", f"repos/{full}/issues/{n}/labels", {"labels": add}, dry, "queued for the board: " + ", ".join(add))


_SYNC = {}


def has_sync(full):
    if full not in _SYNC:
        _SYNC[full] = rest("GET", f"repos/{full}/contents/.github/workflows/gp-sync.yml", check=False) is not None
    return _SYNC[full]


def verify_rest(full, n):
    it = rest("GET", f"repos/{full}/issues/{n}")
    labels = [lb["name"] for lb in it.get("labels", [])]
    q = queued_labels(labels)
    print(f"  check: {full}#{n} state={it['state'].upper()} assignees={','.join(x['login'] for x in it.get('assignees', [])) or '-'} "
          f"labels={','.join(lb for lb in labels if lb not in q) or '-'} queued={','.join(q) or '-'}  {it['html_url']}")
    if q:
        print("  board: " + ("the gp-sync Action applies the queued labels in about a minute" if has_sync(full) else
                             "queued — `gp.py sync` on a computer with the GitHub CLI applies it (`gp.py cloud-setup` "
                             "adds an Action that does it automatically)"))
    return it


def milestone_number(full, m):
    if str(m).isdigit():
        return int(m)
    for x in rest_all(f"repos/{full}/milestones?state=all"):
        if x["title"].lower() == str(m).lower():
            return x["number"]
    die(f"milestone '{m}' not found in {full}")


def rest_create(a):
    if a.draft:
        need_board_access("a draft item (it lives only on the board)")
    full = rest_repo(a, ref_owner(a))
    body = a.body or ""
    if a.body_file:
        with open(a.body_file, encoding="utf-8") as fh:
            body = fh.read()
    if a.todo:
        body = with_todos(body, a.todo)
    payload = {"title": a.title, "body": body, "labels": a.label or [], "assignees": logins(create_assignees(a))}
    if a.milestone:
        payload["milestone"] = milestone_number(full, a.milestone)
    issue = write("POST", f"repos/{full}/issues", payload, a.dry_run, f"'{a.title}'")
    if a.dry_run:
        return
    n = issue["number"]
    print(f"  issue: {issue['html_url']}")
    if a.image:
        links = upload_to_branch(full, a.image, n, False)
        rest("PATCH", f"repos/{full}/issues/{n}", {"body": (body.rstrip() + "\n\n" + "\n".join(links)).strip() + "\n"})
    if a.parent:
        pn = int(re.sub(r"\D", "", str(a.parent).rstrip("/").split("/")[-1].split("#")[-1]))
        write("POST", f"repos/{full}/issues/{pn}/sub_issues", {"sub_issue_id": issue["id"]}, False, f"sub-issue of #{pn}")
    only = only_args(a)
    auto = person_fields(load_config().get("fields") or {}, [] if a.no_assignee else a.assignee, (a.field or []) + only, a.no_person_field)
    queue(full, n, [], False, status=a.status or "todo", fields=only + (a.field or []) + auto)
    verify_rest(full, n)


def rest_ref(a):
    o, r, n = parse_ref(a.ref, ref_owner(a))
    return f"{o}/{r}", n


def rest_show(a):
    full, n = rest_ref(a)
    it = rest("GET", f"repos/{full}/issues/{n}")
    if a.json:
        print(json.dumps(it, ensure_ascii=False, indent=1))
        return
    labels = [lb["name"] for lb in it.get("labels", [])]
    q = queued_labels(labels)
    print(f"{full}#{n} {it['title']} ({it['state'].upper()})  {it['html_url']}")
    print(f"  assignees: {','.join(x['login'] for x in it.get('assignees', [])) or '-'} · labels: "
          f"{','.join(lb for lb in labels if lb not in q) or '-'} · milestone: {(it.get('milestone') or {}).get('title', '-')}")
    print(f"  board: column not readable from a cloud session" + (f" · queued: {', '.join(q)}" if q else ""))
    print("\n" + (it.get("body") or "(no body)"))
    if a.comments and it.get("comments"):
        for c in rest_all(f"repos/{full}/issues/{n}/comments")[-a.comments:]:
            print(f"\n--- {c['user']['login']} {c['created_at'][:10]}\n{c['body']}")


def rest_list(a):
    owner = ref_owner(a)
    full = rest_repo(a, owner)
    q = f"repos/{full}/issues?state={a.state}&sort=updated&direction=desc"
    if a.assignee:
        q += "&assignee=" + urllib.parse.quote(logins([a.assignee])[0])
    if a.label:
        q += "&labels=" + urllib.parse.quote(a.label)
    rows = [x for x in rest_all(q, limit=300) if "pull_request" not in x]
    if a.search:
        rows = [x for x in rows if a.search.lower() in (x["title"] + " " + (x.get("body") or "")).lower()]
    items = []
    for x in rows:
        labels = [lb["name"] for lb in x.get("labels", [])]
        qd = queued_labels(labels)
        col = next((lb[len(LABEL_PREFIX):] for lb in qd if "=" not in lb), "")
        items.append({"repo": full, "number": x["number"], "ref": f"{full.split('/')[1]}#{x['number']}", "title": x["title"],
                      "state": x["state"].upper(), "url": x["html_url"], "body": x.get("body") or "",
                      "assignees": [y["login"] for y in x.get("assignees", [])], "updated": x["updated_at"][:10],
                      "labels": [lb for lb in labels if lb not in qd], "queued": qd, "queued_column": col})
    if a.status:
        wanted = {column_label(s)[len(LABEL_PREFIX):].lower() for s in a.status.split(",")}
        items = [i for i in items if i["queued_column"].lower() in wanted]
    if a.json:
        print(json.dumps(items, ensure_ascii=False, indent=1))
        return
    print(f"{full}: {len(items)} issue(s) — a cloud session cannot read the board's columns; "
          f"⏳ = a column change queued for gp sync")
    if item_filters(a):
        print("  note: a cloud session cannot read board fields, so this lists every issue of the repository, not only "
              + ", ".join(f"{k} = {v}" for k, v in item_filters(a).items()))
    for state in ("OPEN", "CLOSED"):
        lst = [i for i in items if i["state"] == state]
        if not lst:
            continue
        print(f"## {state.lower()} ({len(lst)})")
        for i in lst:
            todo = checklist(i["body"])
            extra = [f"⏳ {i['queued_column']}"] if i["queued_column"] else []
            if todo:
                extra.append(f"todo {sum(d for _, d, _ in todo)}/{len(todo)}")
            if i["labels"]:
                extra.append("labels:" + ",".join(i["labels"]))
            print(f"  {i['ref']} {i['title']} | {','.join(i['assignees']) or '-'} | {i['updated']}"
                  + (f" | {' '.join(extra)}" if extra else "") + f" | {i['url']}")


def labels_of(full, n):
    return [lb["name"] for lb in rest("GET", f"repos/{full}/issues/{n}").get("labels", [])]


def rest_move(a):
    full, n = rest_ref(a)
    queue(full, n, labels_of(full, n), a.dry_run, status=a.column)
    if not a.dry_run:
        verify_rest(full, n)


def rest_edit(a):
    full, n = rest_ref(a)
    it = rest("GET", f"repos/{full}/issues/{n}")
    patch = {}
    if a.title:
        patch["title"] = a.title
    if a.body is not None:
        patch["body"] = a.body
    if a.body_file:
        with open(a.body_file, encoding="utf-8") as fh:
            patch["body"] = fh.read()
    if a.append:
        patch["body"] = (it.get("body") or "").rstrip() + "\n\n" + a.append + "\n"
    if a.milestone:
        patch["milestone"] = milestone_number(full, a.milestone)
    if patch:
        write("PATCH", f"repos/{full}/issues/{n}", patch, a.dry_run, ", ".join(patch))
    if a.add_label:
        write("POST", f"repos/{full}/issues/{n}/labels", {"labels": a.add_label}, a.dry_run, ", ".join(a.add_label))
    for lb in a.remove_label or []:
        write("DELETE", f"repos/{full}/issues/{n}/labels/{urllib.parse.quote(lb, safe='')}", None, a.dry_run)
    if a.field:
        queue(full, n, [lb["name"] for lb in it.get("labels", [])], a.dry_run, fields=a.field)
    if not a.dry_run:
        verify_rest(full, n)


def rest_state(full, n, it, close, reason, dry):
    if close and it["state"] == "open":
        write("PATCH", f"repos/{full}/issues/{n}",
              {"state": "closed", "state_reason": "not_planned" if reason == "not planned" else "completed"}, dry, "close")
    elif not close and it["state"] != "open":
        write("PATCH", f"repos/{full}/issues/{n}", {"state": "open"}, dry, "reopen")
    elif close:
        print("  already closed")


def rest_comment_post(full, n, text, images, dry):
    body = text
    if images:
        body = (body.rstrip() + "\n\n" + "\n".join(upload_to_branch(full, images, n, dry))).strip()
    c = write("POST", f"repos/{full}/issues/{n}/comments", {"body": body}, dry, "comment")
    if c.get("html_url"):
        print(c["html_url"])


def rest_set(a):
    if a.close and a.reopen:
        die("--close and --reopen cannot be used together")
    full, n = rest_ref(a)
    it = rest("GET", f"repos/{full}/issues/{n}")
    fields = (a.field or []) + person_fields(load_config().get("fields") or {}, a.assignee, (a.field or []) + only_keys(), a.no_person_field)
    if a.status or fields:
        queue(full, n, [lb["name"] for lb in it.get("labels", [])], a.dry_run, status=a.status, fields=fields)
    if a.assignee:
        write("POST", f"repos/{full}/issues/{n}/assignees", {"assignees": logins(a.assignee)}, a.dry_run, "assign")
    if a.unassign:
        write("DELETE", f"repos/{full}/issues/{n}/assignees", {"assignees": logins(a.unassign)}, a.dry_run, "unassign")
    if a.close or a.reopen:
        rest_state(full, n, it, a.close, a.reason, a.dry_run)
    if a.comment:
        rest_comment_post(full, n, a.comment, None, a.dry_run)
    if not a.dry_run:
        verify_rest(full, n)


def rest_close(a):
    full, n = rest_ref(a)
    it = rest("GET", f"repos/{full}/issues/{n}")
    if a.comment:
        rest_comment_post(full, n, a.comment, None, a.dry_run)
    rest_state(full, n, it, True, a.reason, a.dry_run)
    labels = [lb["name"] for lb in it.get("labels", [])]
    if a.status:
        queue(full, n, labels, a.dry_run, status=a.status)
    elif not a.keep_column:  # sync moves a closed issue to the done column; drop a column change queued before
        queue(full, n, labels, a.dry_run, clear_status=True)
    if not a.dry_run:
        verify_rest(full, n)


def rest_reopen(a):
    full, n = rest_ref(a)
    it = rest("GET", f"repos/{full}/issues/{n}")
    rest_state(full, n, it, False, None, a.dry_run)
    if a.status:
        queue(full, n, [lb["name"] for lb in it.get("labels", [])], a.dry_run, status=a.status)
    if not a.dry_run:
        verify_rest(full, n)


def rest_todo(a):
    full, n = rest_ref(a)
    it = rest("GET", f"repos/{full}/issues/{n}")
    if a.action in (None, "list"):
        print_todos(f"{full}#{n} {it['title']}", it.get("body") or "")
        return
    new_body = todo_change(it.get("body") or "", a.action, a.values)
    write("PATCH", f"repos/{full}/issues/{n}", {"body": new_body}, a.dry_run, f"checklist {a.action}")
    if not a.dry_run:
        print_todos(f"{full}#{n} {it['title']}", new_body)


def rest_comment(a):
    full, n = rest_ref(a)
    rest_comment_post(full, n, a.text, a.image, a.dry_run)


def rest_attach(a):
    full, n = rest_ref(a)
    if a.comment is not None:
        return rest_comment_post(full, n, a.comment or "Attached:", a.files, a.dry_run)
    it = rest("GET", f"repos/{full}/issues/{n}")
    links = upload_to_branch(full, a.files, n, a.dry_run)
    write("PATCH", f"repos/{full}/issues/{n}", {"body": ((it.get("body") or "").rstrip() + "\n\n" + "\n".join(links)).strip() + "\n"},
          a.dry_run, f"{len(links)} image(s) into the body")
    if not a.dry_run:
        body = rest("GET", f"repos/{full}/issues/{n}").get("body") or ""
        imgs = re.findall(r"!\[[^\]]*\]\([^)]+\)|<img [^>]+>", body)
        print(f"  check: body now has {len(imgs)} image(s)  {it['html_url']}")


def rest_assign(a):
    full, n = rest_ref(a)
    write("DELETE" if a.remove else "POST", f"repos/{full}/issues/{n}/assignees", {"assignees": logins(a.logins)},
          a.dry_run, "unassign" if a.remove else "assign")
    auto = [] if a.remove else person_fields(load_config().get("fields") or {}, a.logins, only_keys(), off=a.no_person_field)
    if auto:
        it = rest("GET", f"repos/{full}/issues/{n}")
        queue(full, n, [lb["name"] for lb in it.get("labels", [])], a.dry_run, fields=auto)
    if not a.dry_run:
        verify_rest(full, n)


def rest_people(a):
    full = rest_repo(a, ref_owner(a))
    per = Counter()
    for x in rest_all(f"repos/{full}/issues?state=open", limit=500):
        if "pull_request" not in x:
            for who in [y["login"] for y in x.get("assignees", [])] or ["(unassigned)"]:
                per[who] += 1
    print(f"{full} open issues per person: " + (", ".join(f"{k} {v}" for k, v in per.most_common()) or "none"))
    rows = rest_all(f"repos/{full}/collaborators")
    print(f"{full} collaborators (can be assigned): " + ", ".join(f"{c['login']}({c.get('role_name', '?')})" for c in rows))


def rest_columns(a):
    cfg = load_config()
    cols = cfg.get("columns") or []
    print(f"{cfg.get('title') or 'board'} {cfg.get('url') or ''} — saved in {cfg.get('_path') or LOCAL_CONFIG} "
          "(a cloud session cannot read the board itself)")
    if not cols:
        print("  no columns saved — run `gp.py init <board URL>` or `gp.py cloud-setup` on a computer, commit .gp.json")
    for i, c in enumerate(cols, 1):
        print(f"  {i}. {c}")
    for name, v in (cfg.get("fields") or {}).items():
        print(f"  {name} ({'single select: ' + ', '.join(v) if isinstance(v, list) else v})")


def rest_init(a):
    if a.unset or not a.target:
        return cmd_init(a)
    owner, number = parse_board(a.target, a.number_arg)
    owner = owner if owner not in ("@me", "me") else me()
    scope = config_scope(a)
    path = config_path(scope)
    old = read_json(path)
    same = old.get("number") == number and str(old.get("owner", "")).lower() == owner.lower()
    cfg = dict(old if same else {}, owner=owner, number=number,
               url=f"https://github.com/{'users' if owner.lower() == me().lower() else 'orgs'}/{owner}/projects/{number}")
    if a.only is not None:
        cfg.pop("only", None)
        cfg.update({"only": parse_only(a.only)} if parse_only(a.only) else {})
    if a.dry_run:
        print(f"[dry-run] write {path}: {cfg}")
        return
    write_json(path, cfg)
    print(f"{scope} board: {owner} #{number} — saved in {path} (not checked: a cloud session cannot read boards; "
          "`gp.py init` on a computer also saves the columns)")


def rest_doctor(a):
    print("• Claude Code cloud session (rest mode): GitHub is reached through Anthropic's proxy — REST calls under "
          "repos/{owner}/{repo}/… for this session's repositories only; GraphQL and the board (Projects v2) are blocked")
    r = gh(["--version"], check=False)
    first = ((r.stdout or "").splitlines() or [""])[0]
    print(f"✓ {first}" if first.startswith("gh version") else "✓ Claude Code's built-in gh (gh api only)")
    print(f"✓ GitHub account {me()}" + (" (credentials added by the proxy)" if os.environ.get("GH_TOKEN") == "proxy-injected" else ""))
    full = current_repo()
    repo = rest("GET", f"repos/{full}", check=False) if full else None
    if repo:
        print(f"✓ repository {full} — issues can be created, edited, moved (queued), closed")
    else:
        print(f"✗ repository {full or '(no origin remote)'} not reachable — add it to the session")
    cfg = load_config()
    if cfg.get("number"):
        print(f"✓ board ({cfg['_scope']}): {cfg.get('title') or ''} {cfg.get('owner')} #{cfg.get('number')}  ← {cfg['_path']}")
        print(f"✓ columns: {', '.join(cfg['columns'])}" if cfg.get("columns") else
              "• no columns in .gp.json — `gp.py init <board URL>` on a computer saves them (column words are kept as typed)")
    else:
        print("• no board in .gp.json — run `gp.py cloud-setup` on a computer and commit .gp.json")
    if full and repo:
        print(f"✓ gp-sync Action in {full}: board changes are applied automatically" if has_sync(full) else
              f"• no gp-sync Action in {full}: queued gp:… labels wait for `gp.py sync` on a computer "
              "(`gp.py cloud-setup` installs the Action)")
    print("ready (rest mode)")


REST_COMMANDS = {
    "doctor": rest_doctor, "init": rest_init, "use": rest_init, "info": rest_columns, "columns": rest_columns,
    "list": rest_list, "create": rest_create, "show": rest_show, "edit": rest_edit, "move": rest_move,
    "set": rest_set, "close": rest_close, "reopen": rest_reopen, "todo": rest_todo, "comment": rest_comment,
    "attach": rest_attach, "assign": rest_assign, "people": rest_people,
}


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(prog="gp.py", description="GitHub Projects (v2) helper for the gp skill",
                                 formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument("--owner", help="board owner login or @me (default: saved board)")
    ap.add_argument("--number", type=int, help="board number (default: saved board)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    def p(name, fn, help_text, dry=False):
        s = sub.add_parser(name, help=help_text)
        s.set_defaults(fn=fn)
        if dry:
            s.add_argument("--dry-run", action="store_true", help="only print what would change")
        return s

    p("doctor", cmd_doctor, "check gh, login, scopes and the default board")
    s = p("projects", cmd_projects, "list boards of an owner")
    s.add_argument("--closed", action="store_true")
    s.add_argument("--json", action="store_true")
    for name, help_text in (("init", "choose the board: this project (.gp.json) or --global (every project)"),
                            ("use", "same as init")):
        s = p(name, cmd_init, help_text, dry=True)
        s.add_argument("target", nargs="?", help="board URL (https://github.com/users/U/projects/N[/views/1]), "
                                                 "owner/number or owner; none = show the current setting")
        s.add_argument("number_arg", metavar="number", nargs="?", type=int, help="board number when target is an owner")
        where = s.add_mutually_exclusive_group()
        where.add_argument("--local", action="store_true", help=f"this project: <git root>/{LOCAL_CONFIG} (default in a git repository)")
        where.add_argument("--global", dest="global_", action="store_true", help=f"every project: {CONFIG_PATH} (default outside git)")
        s.add_argument("--unset", action="store_true", help="remove the local (or --global) setting")
        s.add_argument("--show", action="store_true", help="only show the board in effect (with no target)")
        s.add_argument("--only", metavar="NAME=VALUE", help='default field values of this project, e.g. "Projects=SONUB" '
                       "(list/info/people show these items, create sets them); none removes it")
        s.add_argument("--instructions", action="store_true",
                       help="also write the 'always use the gp skill' block into CLAUDE.md / AGENTS.md (off by default: "
                            "gp leaves the project's files alone)")
        s.add_argument("--no-instructions", action="store_true", help="(the default now; kept for old scripts)")
        s.add_argument("--remove-instructions", action="store_true",
                       help="remove that block from the project's and your own CLAUDE.md / AGENTS.md")

    s = p("project-create", cmd_project_create, "create a board", dry=True)
    s.add_argument("--title", required=True)
    s.add_argument("--desc", help="short description")
    s.add_argument("--readme")
    s.add_argument("--public", action="store_true")
    s.add_argument("--columns", help='Status columns, e.g. "Todo,In Progress,Review,Done"')
    s.add_argument("--repo", action="append", help="link a repository (repeatable)")
    s.add_argument("--use", action="store_true", help="make it this project's board (with --global: every project's)")
    s.add_argument("--global", dest="global_", action="store_true", help="with --use: save it as the global board")
    s.add_argument("--instructions", action="store_true",
                   help="with --use: also write the gp block into CLAUDE.md / AGENTS.md (off by default)")
    s = p("project-edit", cmd_project_edit, "rename, describe, publish, close or reopen a board", dry=True)
    s.add_argument("--title")
    s.add_argument("--desc")
    s.add_argument("--readme")
    s.add_argument("--public", action="store_true")
    s.add_argument("--private", action="store_true")
    s.add_argument("--close", action="store_true")
    s.add_argument("--reopen", action="store_true")
    s = p("project-delete", cmd_project_delete, "delete a board (needs --yes)", dry=True)
    s.add_argument("--yes", action="store_true")
    s = p("project-link", cmd_project_link, "link (or --unlink) a repository", dry=True)
    s.add_argument("repo")
    s.add_argument("--unlink", action="store_true")
    s = p("info", cmd_info, "fields, columns, counts and views of the board")
    s.add_argument("--field", action="append", help="NAME=VALUE: count only items with this value (VALUE * = any)")
    s.add_argument("--all", action="store_true", help="ignore the project's default field values (init --only)")

    p("columns", cmd_columns, "list the board columns (Status values)")
    s = p("column-add", cmd_column_add, "add a column", dry=True)
    s.add_argument("name")
    s.add_argument("--color", choices=[c.lower() for c in COLORS] + COLORS)
    s.add_argument("--desc")
    s.add_argument("--after", help="put it after this column")
    s.add_argument("--first", action="store_true")
    s = p("column-rename", cmd_column_rename, "rename a column (items stay in it)", dry=True)
    s.add_argument("old")
    s.add_argument("new")
    s.add_argument("--color", choices=[c.lower() for c in COLORS] + COLORS)
    s = p("column-delete", cmd_column_delete, "delete a column", dry=True)
    s.add_argument("name")
    s.add_argument("--move-to", help="move its items here first")
    s.add_argument("--yes", action="store_true", help="delete even if items are in it")
    s = p("column-order", cmd_column_order, 'reorder columns: "Todo,In Progress,Done"', dry=True)
    s.add_argument("order")
    s = p("field-add", cmd_field_add, "add a custom field", dry=True)
    s.add_argument("name")
    s.add_argument("--type", default="TEXT", choices=["TEXT", "NUMBER", "DATE", "SINGLE_SELECT", "text", "number", "date", "single_select"])
    s.add_argument("--options", help='for SINGLE_SELECT: "High,Medium,Low"')
    s = p("option-add", cmd_option_add, "add values to a single-select field (e.g. a person to Projects)", dry=True)
    s.add_argument("field")
    s.add_argument("names", nargs="+")
    s.add_argument("--color", choices=[c.lower() for c in COLORS] + COLORS)
    s.add_argument("--desc")
    s = p("field-delete", cmd_field_delete, "delete a custom field (needs --yes)", dry=True)
    s.add_argument("name")
    s.add_argument("--yes", action="store_true")
    s = p("view-add", cmd_view_add, "add a view (board, table, roadmap)", dry=True)
    s.add_argument("name")
    s.add_argument("--layout", default="board", choices=["board", "table", "roadmap"])
    s.add_argument("--filter", help='e.g. "assignee:@me is:open"')

    s = p("list", cmd_list, "list items grouped by column")
    s.add_argument("--status", help="column name(s), comma separated; aliases like todo/doing/done work")
    s.add_argument("--assignee", help="login (part) or @me")
    s.add_argument("--repo")
    s.add_argument("--label")
    s.add_argument("--state", choices=["open", "closed", "all"], default="all")
    s.add_argument("--search", help="text in title or body")
    s.add_argument("--archived", action="store_true", help="include archived items")
    s.add_argument("--field", action="append", help="NAME=VALUE: only items with this value (VALUE * = any); "
                   "replaces the project's default value for that field")
    s.add_argument("--all", action="store_true", help="ignore the project's default field values (init --only)")
    s.add_argument("--json", action="store_true")
    s = p("create", cmd_create, "create an issue (or --draft) and put it on the board", dry=True)
    s.add_argument("--repo", help="repo or owner/repo")
    s.add_argument("--title", required=True)
    s.add_argument("--body")
    s.add_argument("--body-file")
    s.add_argument("--status", help="column (default: none → the board's default)")
    s.add_argument("--assignee", action="append", help="login or @me (repeatable; default: @me, the creator)")
    s.add_argument("--no-assignee", action="store_true", help="leave the new issue unassigned")
    s.add_argument("--label", action="append")
    s.add_argument("--milestone")
    s.add_argument("--parent", help="make it a sub-issue of this issue number/URL")
    s.add_argument("--image", action="append", help="attach an image: path or 'path#alt text' (repeatable)")
    s.add_argument("--todo", action="append", help="add a '- [ ]' checklist line (repeatable)")
    s.add_argument("--field", action="append", help="NAME=VALUE for a custom field (repeatable)")
    s.add_argument("--draft", action="store_true", help="draft item on the board only, no repository")
    s.add_argument("--all", action="store_true", help="do not set the project's default field values (init --only)")
    s.add_argument("--no-person-field", action="store_true", help="do not set fields that have an assignee's name as a value")
    s = p("show", cmd_show, "show one issue with its body and last comments")
    s.add_argument("ref")
    s.add_argument("--comments", type=int, default=5)
    s.add_argument("--json", action="store_true")
    s = p("edit", cmd_edit, "edit title, body, labels, milestone or custom fields", dry=True)
    s.add_argument("ref")
    s.add_argument("--title")
    s.add_argument("--body")
    s.add_argument("--body-file")
    s.add_argument("--append", help="add text at the end of the body")
    s.add_argument("--add-label", action="append")
    s.add_argument("--remove-label", action="append")
    s.add_argument("--milestone")
    s.add_argument("--field", action="append", help="NAME=VALUE (empty VALUE clears)")
    s = p("move", cmd_move, "move an issue to a column", dry=True)
    s.add_argument("ref")
    s.add_argument("column")
    s = p("set", cmd_set, "several changes at once", dry=True)
    s.add_argument("ref")
    s.add_argument("--status")
    s.add_argument("--field", action="append")
    s.add_argument("--assignee", action="append")
    s.add_argument("--unassign", action="append")
    s.add_argument("--no-person-field", action="store_true", help="do not set fields that have an assignee's name as a value")
    s.add_argument("--close", action="store_true")
    s.add_argument("--reason", choices=["completed", "not planned"], default="completed")
    s.add_argument("--reopen", action="store_true")
    s.add_argument("--comment")
    s = p("close", cmd_close, "close an issue and move it to the done column", dry=True)
    s.add_argument("ref")
    s.add_argument("--reason", choices=["completed", "not planned"], default="completed")
    s.add_argument("--status", help="column to move to (default: Done/FIXED if it exists)")
    s.add_argument("--keep-column", action="store_true")
    s.add_argument("--comment")
    s = p("reopen", cmd_reopen, "reopen an issue", dry=True)
    s.add_argument("ref")
    s.add_argument("--status", help="column to move it back to")
    s = p("delete", cmd_delete, "delete an issue for good (needs --yes)", dry=True)
    s.add_argument("ref")
    s.add_argument("--yes", action="store_true")
    s = p("remove", cmd_remove, "remove an issue from the board (or --archive it); the issue stays", dry=True)
    s.add_argument("ref")
    s.add_argument("--archive", action="store_true")
    s = p("comment", cmd_comment, "comment on an issue (with images)", dry=True)
    s.add_argument("ref")
    s.add_argument("text")
    s.add_argument("--image", action="append")
    s = p("attach", cmd_attach, "attach images to the issue body (or --comment)", dry=True)
    s.add_argument("ref")
    s.add_argument("files", nargs="+", help="path or 'path#alt text'")
    s.add_argument("--comment", nargs="?", const="", help="post as a comment instead (optional text)")
    s = p("todo", cmd_todo, "checklist inside an issue: list | add TEXT… | done N… | undo N… | remove N…", dry=True)
    s.add_argument("ref")
    s.add_argument("action", nargs="?", choices=["list", "add", "done", "undo", "remove"])
    s.add_argument("values", nargs="*")
    s = p("convert", cmd_convert, "turn a draft item into a real issue", dry=True)
    s.add_argument("item", help="draft item id (from list --json)")
    s.add_argument("--repo", required=True)

    s = p("people", cmd_people, "who has what on the board (+ --repo collaborators)")
    s.add_argument("--repo")
    s.add_argument("--field", action="append", help="NAME=VALUE: count only items with this value (VALUE * = any)")
    s.add_argument("--all", action="store_true", help="ignore the project's default field values (init --only)")
    s = p("invite", cmd_invite, "add people to the board (role, works at once) and to its repository (invitation)", dry=True)
    s.add_argument("logins", nargs="+", help="GitHub username, @name, profile URL or public e-mail (several allowed)")
    s.add_argument("--repo", action="append", help="repository to invite to (repeatable; default: this folder's "
                                                    "repository, else the board's only linked one)")
    s.add_argument("--permission", default="push", choices=list(INVITE_PERMISSION),
                   help="repository permission (organization repositories only; default push)")
    s.add_argument("--board-role", choices=["reader", "writer", "admin", "none"], help="board role (default writer)")
    s.add_argument("--no-board", action="store_true", help="repository only")
    s.add_argument("--no-repo", action="store_true", help="board only")
    s = p("members", cmd_members, "who is on the board and in its repositories (with pending invitations)")
    s.add_argument("--repo", action="append", help="repositories to show (default: this one + the board's linked ones)")
    s.add_argument("--json", action="store_true")
    s = p("member-remove", cmd_member_remove, "take people off the board and out of its repositories (needs --yes)", dry=True)
    s.add_argument("logins", nargs="+")
    s.add_argument("--repo", action="append", help="only these repositories (default: this one + the board's linked ones)")
    s.add_argument("--no-board", action="store_true", help="repositories only")
    s.add_argument("--no-repo", action="store_true", help="board only")
    s.add_argument("--yes", action="store_true")
    s = p("leave", cmd_leave, "remove yourself from repositories and/or --board (needs --yes)", dry=True)
    s.add_argument("repos", nargs="*", help="owner/repo or repo")
    s.add_argument("--board", action="store_true", help="the board in effect")
    s.add_argument("--yes", action="store_true")
    s = p("invitations", cmd_invitations, "invitations you received (repositories, organizations)")
    s.add_argument("--json", action="store_true")
    for name, help_text in (("accept", "accept invitations you received"), ("decline", "decline invitations you received")):
        s = p(name, cmd_accept, help_text, dry=True)
        s.add_argument("which", nargs="*", help="invitation id, owner/repo, repo, inviter or organization")
        s.add_argument("--all", action="store_true")
    s = p("assign", cmd_assign, "assign (or --remove) people", dry=True)
    s.add_argument("ref")
    s.add_argument("logins", nargs="+", help="logins or @me")
    s.add_argument("--remove", action="store_true")
    s.add_argument("--no-person-field", action="store_true", help="do not set fields that have an assignee's name as a value")

    s = p("sync", cmd_sync, "apply queued gp:… labels (from cloud sessions) to the board; closed issues → done column", dry=True)
    s.add_argument("refs", nargs="*", help="issues to sync (default: every issue with a gp:… label, and closed items not in done)")
    s.add_argument("--repo", action="append", help="repositories to scan (default: the board's repositories + this one)")
    s.add_argument("--add", action="store_true", help="also put issues that are not on the board yet onto it")
    s.add_argument("--limit", type=int, default=300, help="recently updated issues to scan per repository")
    s = p("cloud-setup", cmd_cloud_setup, "make this repository ready for Claude Code cloud sessions (.gp.json, "
          ".claude/skills/gp, gp-sync Action, GP_TOKEN secret)", dry=True)
    s.add_argument("--repo", help="owner/repo (default: the origin remote)")
    s.add_argument("--no-secret", action="store_true", help="do not set the GP_TOKEN secret from your gh login")

    a = ap.parse_args()
    if not hasattr(a, "dry_run"):
        a.dry_run = False
    if mode() == "rest":
        if a.cmd in REST_COMMANDS:
            return REST_COMMANDS[a.cmd](a)
        if a.cmd == "delete":
            die("deleting an issue needs GitHub's GraphQL API, which a Claude Code cloud session cannot reach. "
                "Use `close <issue> --reason \"not planned\"` here, or `delete` on a computer with the GitHub CLI.")
        if a.cmd not in ("invite", "members", "member-remove", "leave", "invitations", "accept", "decline"):
            need_board_access(f"`{a.cmd}`")
    a.fn(a)


if __name__ == "__main__":
    main()
