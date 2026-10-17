#!/usr/bin/env python3
"""gp — manage GitHub Projects (v2) and their issues with the gh CLI.

Only the Python standard library and `gh` are used. gh is called with a list of
arguments (never through a shell), so quoting and word splitting never break a
title or a body. Field, column and option IDs are looked up by name on every run,
so renaming a column on GitHub never breaks this script.

    gp.py doctor                                  # is gh installed, logged in, with the right scopes?
    gp.py projects [--owner O]                    # list boards
    gp.py init <board URL> [--global]             # this project's board (.gp.json), or --global for every project
    gp.py project-create --title T [--columns "Todo,In Progress,Done"] [--repo R] [--use]
    gp.py info                                    # fields, columns, counts, views
    gp.py column-add NAME | column-rename OLD NEW | column-delete NAME --yes | column-order "A,B,C"
    gp.py create --repo R --title T [--body B] [--status Todo] [--assignee L] [--image F] [--todo "item"]
    gp.py list [--status S] [--assignee L] [--repo R] [--state open] [--search T]
    gp.py move <issue> <column>                   # <issue> = URL | owner/repo#12 | repo#12
    gp.py close <issue> | reopen <issue> | delete <issue> --yes
    gp.py todo <issue> [add "text" | done N | undo N | remove N]
    gp.py attach <issue> FILE... [--comment "text"]

Run `gp.py <command> -h` for every option. The board comes from --owner/--number,
then GP_OWNER/GP_PROJECT, then the project's .gp.json (nearest one from the current
folder up to the git root), then the global file (~/.config/gp/config.json).
Every command that changes something accepts --dry-run.
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
from collections import Counter, defaultdict

CONFIG_PATH = os.environ.get("GP_CONFIG") or os.path.join(
    os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config"), "gp", "config.json")
LOCAL_CONFIG = ".gp.json"  # one project's board, in the root of its git repository
STATUS_FIELD = os.environ.get("GP_STATUS_FIELD", "Status")
ASSETS_BRANCH = "gp-assets"

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


def gh(args, input_text=None, check=True):
    """Run gh with a list of arguments. Returns stdout. Adds a hint for missing scopes."""
    if not shutil.which("gh"):
        die("gh (GitHub CLI) is not installed — https://cli.github.com (macOS: brew install gh)")
    r = subprocess.run(["gh", *args], input=input_text, capture_output=True, text=True)
    if r.returncode != 0 and check:
        err = (r.stderr or r.stdout or "").strip()
        low = err.lower()
        if "scope" in low or "insufficient" in low or "resource not accessible" in low:
            err += "\n→ add scopes: gh auth refresh -s project,repo"
        if "not logged" in low or "gh auth login" in low:
            err += "\n→ log in first: gh auth login"
        die(f"gh {' '.join(args[:3])} … failed\n{err}")
    return r.stdout if check else r


def graphql(query, **variables):
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
    out = gh(["api", "graphql", "--input", "-"], input_text=json.dumps({"query": query, "variables": variables}))
    data = json.loads(out)
    if data.get("errors"):
        die(json.dumps(data["errors"], ensure_ascii=False))
    return data["data"]


_ME = None


def me():
    global _ME
    if _ME is None:
        _ME = gh(["api", "user", "-q", ".login"]).strip()
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
    return {"owner": p["owner"]["login"], "number": p["number"], "title": p["title"], "url": p["url"]}


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
        return
    if not a.target:
        print_board_settings()
        return
    owner, number = parse_board(a.target, a.number_arg)
    p = load_project(login_of(owner), number, with_items=False)
    path = config_path(scope)
    if a.dry_run:
        print(f"[dry-run] write {path}: {board_config(p)}")
        return
    save_config(board_config(p), scope)
    print(f"{scope} board: {p['title']} ({p['owner']['login']} #{p['number']}) {p['url']}")
    print(f"  saved in {path}")
    if scope == "local":
        print(f"  used in {os.path.dirname(path)} and its sub folders. Commit {LOCAL_CONFIG} to share the board "
              f"with the team, or add it to .gitignore to keep it to yourself.")
    else:
        local = find_local_config()
        if local:
            print(f"  note: this folder still uses its own board from {local} (gp.py init --unset --local removes it)")
        else:
            print("  used in every folder that has no .gp.json of its own")


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
    print(f"{p['title']}  {p['url']}  ({'public' if p['public'] else 'private'}{', closed' if p['closed'] else ''}, "
          f"{len(p['all_items'])} items)")
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


def cmd_field_delete(a):
    owner, number = board(a)
    p = load_project(owner, number, with_items=False)
    f = field_by_name(p, a.name)
    if f["name"] == STATUS_FIELD or f["name"] in ("Title", "Assignees", "Labels", "Repository"):
        die(f"'{f['name']}' is a built-in field and cannot be deleted")
    if not a.yes:
        die(f"deleting field '{f['name']}' removes its value from every item. Add --yes after the user agrees.")
    run(["gh", "project", "field-delete", "--id", f["id"]], a.dry_run)


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
    items = p["all_items"]
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
        print(f"  draft item {item_id} (turn it into an issue later: gp.py convert {item_id} --repo R)")
        return
    if not a.repo:
        die("--repo is required (or --draft for a note that lives only on the board)")
    full = repo_full(a.repo, owner)
    cmd = ["gh", "issue", "create", "-R", full, "--title", a.title, "--body-file", "-"]
    for who in a.assignee or []:
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
    for kv in a.field or []:
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
    for kv in a.field or []:
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


def cmd_todo(a):
    owner, number = board(a)
    o, r, n = parse_ref(a.ref, owner)
    issue, _ = find_issue(o, r, n)
    body = issue["body"] or ""
    items = checklist(body)
    if a.action in (None, "list"):
        print(f"{o}/{r}#{n} {issue['title']}")
        if not items:
            print("  (no checklist yet — gp.py todo <issue> add \"first step\")")
        for k, (_, done, text) in enumerate(items, 1):
            print(f"  {k}. [{'x' if done else ' '}] {text}")
        if items:
            print(f"  {sum(d for _, d, _ in items)}/{len(items)} done")
        return
    lines = body.splitlines()
    if a.action == "add":
        if not a.values:
            die('give the TODO text: gp.py todo <issue> add "write the test" "update docs"')
        new_body = with_todos(body, a.values)
    else:
        if not a.values:
            die(f"give the item number(s): gp.py todo <issue> {a.action} 2")
        for v in a.values:
            k = int(v)
            if not 1 <= k <= len(items):
                die(f"there is no TODO #{k} (1–{len(items)})")
            idx, done, text = items[k - 1]
            if a.action == "done":
                lines[idx] = re.sub(r"\[( )\]", "[x]", lines[idx], count=1)
            elif a.action == "undo":
                lines[idx] = re.sub(r"\[(x|X)\]", "[ ]", lines[idx], count=1)
            elif a.action == "remove":
                lines[idx] = None
        new_body = "\n".join(x for x in lines if x is not None) + "\n"
    run(["gh", "issue", "edit", str(n), "-R", f"{o}/{r}", "--body-file", "-"], a.dry_run, input_text=new_body)
    if not a.dry_run:
        a.action = "list"
        cmd_todo(a)


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
    per = defaultdict(list)
    for i in p["all_items"]:
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


def cmd_invite(a):
    """Give someone access: repository collaborator (to be assignable) and/or board collaborator."""
    owner, number = board(a)
    if a.repo:
        full = repo_full(a.repo, owner)
        run(["gh", "api", "-X", "PUT", f"repos/{full}/collaborators/{a.login}", "-f", f"permission={a.permission}"], a.dry_run)
        print(f"  {a.login} gets an e-mail invitation to {full} ({a.permission}); they can be assigned after accepting")
    if a.board_role:
        p = load_project(owner, number, with_items=False)
        uid = graphql("query($l: String!) { user(login: $l) { id } }", l=a.login)["user"]["id"]
        print(("[dry-run] " if a.dry_run else "$ ") + f"updateProjectV2Collaborators {a.login} {a.board_role.upper()}")
        if not a.dry_run:
            graphql_json("""mutation($p: ID!, $c: [ProjectV2Collaborator!]!) {
              updateProjectV2Collaborators(input: {projectId: $p, collaborators: $c}) { clientMutationId } }""",
                         {"p": p["id"], "c": [{"userId": uid, "role": a.board_role.upper()}]})
            print(f"  {a.login} is now {a.board_role.upper()} on '{p['title']}'")


def cmd_assign(a):
    p, o, r, n, issue, item_id = issue_context(a, need_item=False)
    full = f"{o}/{r}"
    flag = "--remove-assignee" if a.remove else "--add-assignee"
    for who in a.logins:
        run(["gh", "issue", "edit", str(n), "-R", full, flag, who], a.dry_run)
    if not a.dry_run:
        verify(p, o, r, n)


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

    s = p("project-create", cmd_project_create, "create a board", dry=True)
    s.add_argument("--title", required=True)
    s.add_argument("--desc", help="short description")
    s.add_argument("--readme")
    s.add_argument("--public", action="store_true")
    s.add_argument("--columns", help='Status columns, e.g. "Todo,In Progress,Review,Done"')
    s.add_argument("--repo", action="append", help="link a repository (repeatable)")
    s.add_argument("--use", action="store_true", help="make it this project's board (with --global: every project's)")
    s.add_argument("--global", dest="global_", action="store_true", help="with --use: save it as the global board")
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
    p("info", cmd_info, "fields, columns, counts and views of the board")

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
    s.add_argument("--json", action="store_true")
    s = p("create", cmd_create, "create an issue (or --draft) and put it on the board", dry=True)
    s.add_argument("--repo", help="repo or owner/repo")
    s.add_argument("--title", required=True)
    s.add_argument("--body")
    s.add_argument("--body-file")
    s.add_argument("--status", help="column (default: none → the board's default)")
    s.add_argument("--assignee", action="append")
    s.add_argument("--label", action="append")
    s.add_argument("--milestone")
    s.add_argument("--parent", help="make it a sub-issue of this issue number/URL")
    s.add_argument("--image", action="append", help="attach an image: path or 'path#alt text' (repeatable)")
    s.add_argument("--todo", action="append", help="add a '- [ ]' checklist line (repeatable)")
    s.add_argument("--field", action="append", help="NAME=VALUE for a custom field (repeatable)")
    s.add_argument("--draft", action="store_true", help="draft item on the board only, no repository")
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
    s = p("invite", cmd_invite, "add a person to a repository and/or the board", dry=True)
    s.add_argument("login")
    s.add_argument("--repo", help="add as repository collaborator (needed to assign issues)")
    s.add_argument("--permission", default="push", choices=["pull", "triage", "push", "maintain", "admin"])
    s.add_argument("--board-role", choices=["reader", "writer", "admin", "none"], help="add to the board with this role")
    s = p("assign", cmd_assign, "assign (or --remove) people", dry=True)
    s.add_argument("ref")
    s.add_argument("logins", nargs="+", help="logins or @me")
    s.add_argument("--remove", action="store_true")

    a = ap.parse_args()
    if not hasattr(a, "dry_run"):
        a.dry_run = False
    a.fn(a)


if __name__ == "__main__":
    main()
