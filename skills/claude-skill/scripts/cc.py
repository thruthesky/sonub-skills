#!/usr/bin/env python3
"""cc.py — the claude-skill helper: check your Claude Code setup, search the official docs,
read the CHANGELOG, keep the skill's feature notes up to date, and track study progress.

Only the Python standard library is used (curl is the fallback for downloads).

  python3 cc.py doctor [--json]                 # what this machine and this project have set up, with advice
  python3 cc.py docs [words…]                   # search the official docs index (llms.txt)
  python3 cc.py read <page|url> [--section H] [--grep W] [--max N]
  python3 cc.py changelog [--since V | --count N] [--all] [--grep W]
  python3 cc.py update-check [--source DIR]     # what the skill covers vs the latest CHANGELOG
  python3 cc.py mark-covered <version> [--source DIR]
  python3 cc.py lessons                         # the study track with your progress
  python3 cc.py progress [done N | undo N | reset | next]
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
REF = SKILL_DIR / "references"
FEATURES = "changelog-features.md"
DOCS_BASE = "https://code.claude.com/docs/en/"
LLMS_TXT = "https://code.claude.com/docs/llms.txt"
CHANGELOG_URL = "https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md"
CACHE = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "claude-skill"
CONFIG = Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config")) / "claude-skill"
PROGRESS = CONFIG / "progress.json"
HOME = Path.home()
CLAUDE = HOME / ".claude"
MARK_RE = re.compile(r"<!--\s*covered-through:\s*([0-9][0-9.]*)\s*-->")


# ---------------------------------------------------------------- helpers

def die(msg, code=1):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def fetch(url, cache_name=None, max_age=6 * 3600, refresh=False):
    """Download url (cached under ~/.cache/claude-skill). Falls back to curl, then to a stale cache."""
    path = CACHE / cache_name if cache_name else None
    if path and path.exists() and not refresh and time.time() - path.stat().st_mtime < max_age:
        return path.read_text(encoding="utf-8")
    text, err = None, None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "claude-skill/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            text = r.read().decode("utf-8", "replace")
    except Exception as e:  # SSL problems on some Python builds, proxies …
        err = e
        if shutil.which("curl"):
            p = subprocess.run(["curl", "-fsSL", "--max-time", "60", url], capture_output=True)
            if p.returncode == 0:
                text = p.stdout.decode("utf-8", "replace")
    if text is None:
        if path and path.exists():
            print(f"note: offline ({err}); using the cached copy from "
                  f"{time.strftime('%Y-%m-%d %H:%M', time.localtime(path.stat().st_mtime))}", file=sys.stderr)
            return path.read_text(encoding="utf-8")
        die(f"cannot download {url}: {err}")
    if path:
        CACHE.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
    return text


def vkey(v):
    return tuple(int(x) for x in re.findall(r"\d+", v)[:4])


def git_root(start):
    try:
        p = subprocess.run(["git", "-C", str(start), "rev-parse", "--show-toplevel"],
                           capture_output=True, text=True, timeout=10)
        if p.returncode == 0 and p.stdout.strip():
            return Path(p.stdout.strip())
    except Exception:
        pass
    return None


def load_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8")), None
    except FileNotFoundError:
        return None, None
    except Exception as e:
        return None, str(e)


def count_lines(path):
    try:
        t = Path(path).read_text(encoding="utf-8", errors="replace")
        return t.count("\n") + (0 if t.endswith("\n") or not t else 1), len(t.encode())
    except Exception:
        return 0, 0


def frontmatter(path):
    try:
        t = Path(path).read_text(encoding="utf-8", errors="replace")
    except Exception:
        return {}
    if not t.startswith("---"):
        return {}
    end = t.find("\n---", 3)
    fm, out = t[3:end] if end > 0 else "", {}
    for line in fm.splitlines():
        m = re.match(r"^([A-Za-z_-]+):\s*(.*)$", line)
        if m:
            out[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return out


# ---------------------------------------------------------------- doctor

def project_slug(root):
    return re.sub(r"[^A-Za-z0-9]", "-", str(root))


def scan_skills(base):
    found = []
    if base.is_dir():
        for d in sorted(base.iterdir()):
            f = d / "SKILL.md"
            if f.is_file():
                fm = frontmatter(f)
                desc = fm.get("description", "")
                found.append({"name": fm.get("name") or d.name, "desc_len": len(desc), "path": str(d)})
    return found


def scan_md(base):
    return sorted(p.name for p in base.glob("*.md")) if base.is_dir() else []


def doctor(args):
    cwd = Path.cwd()
    root = git_root(cwd) or cwd
    rep = {"cwd": str(cwd), "project_root": str(root), "advice": []}
    adv = rep["advice"]

    # Claude Code itself
    exe = shutil.which("claude")
    ver = None
    if exe:
        try:
            ver = subprocess.run([exe, "--version"], capture_output=True, text=True, timeout=20).stdout.strip()
        except Exception:
            pass
    rep["claude"] = {"path": exe, "version": ver}
    if not exe:
        adv.append("Claude Code is not on PATH — install: curl -fsSL https://claude.ai/install.sh | bash "
                   "(Windows: irm https://claude.ai/install.ps1 | iex), then run `claude` and log in.")

    # settings, by scope
    scopes = {"user": CLAUDE / "settings.json", "project": root / ".claude/settings.json",
              "local": root / ".claude/settings.local.json"}
    rep["settings"] = {}
    for name, path in scopes.items():
        data, err = load_json(path)
        info = {"path": str(path), "exists": path.exists()}
        if err:
            info["error"] = err
            adv.append(f"{path} is not valid JSON ({err}) — Claude Code ignores it until fixed.")
        if data:
            perms = data.get("permissions") or {}
            info.update({
                "keys": sorted(data.keys()),
                "model": data.get("model"),
                "defaultMode": perms.get("defaultMode"),
                "allow": len(perms.get("allow") or []), "ask": len(perms.get("ask") or []),
                "deny": len(perms.get("deny") or []),
                "hook_events": sorted((data.get("hooks") or {}).keys()),
                "enabledPlugins": len(data.get("enabledPlugins") or {}),
                "statusLine": bool(data.get("statusLine")),
            })
            if perms.get("defaultMode") == "bypassPermissions":
                adv.append(f"{name} settings start every session in bypassPermissions — fine in a sandbox/VM, "
                           "risky on your main machine. Consider `auto` mode or allow rules instead.")
        rep["settings"][name] = info
    allow_total = sum(s.get("allow", 0) for s in rep["settings"].values())
    if allow_total == 0:
        adv.append("No permission allow rules yet — run /fewer-permission-prompts, or add rules in /permissions, "
                   "to stop approving the same safe commands every time.")
    if not rep["settings"]["user"].get("statusLine"):
        adv.append("No status line — run /statusline to see model, context use and git branch at a glance.")

    # instructions (CLAUDE.md family)
    mem = {"~/.claude/CLAUDE.md": CLAUDE / "CLAUDE.md", "CLAUDE.md": root / "CLAUDE.md",
           ".claude/CLAUDE.md": root / ".claude/CLAUDE.md", "CLAUDE.local.md": root / "CLAUDE.local.md",
           "AGENTS.md": root / "AGENTS.md"}
    rep["instructions"] = {}
    for label, p in mem.items():
        if p.exists():
            lines, size = count_lines(p)
            rep["instructions"][label] = {"lines": lines, "bytes": size}
            if lines > 200:
                adv.append(f"{label} has {lines} lines — the docs suggest under 200 per file. Move topic-specific "
                           "parts to .claude/rules/*.md (with paths:) or into skills; keep only what every session needs.")
    if not any(k in rep["instructions"] for k in ("CLAUDE.md", ".claude/CLAUDE.md", "AGENTS.md")):
        adv.append("This project has no CLAUDE.md — run /init so Claude learns the build/test commands and conventions.")
    rules = sorted(str(p.relative_to(root)) for p in (root / ".claude/rules").rglob("*.md")) \
        if (root / ".claude/rules").is_dir() else []
    rep["rules"] = rules
    am = CLAUDE / "projects" / project_slug(root) / "memory" / "MEMORY.md"
    if am.exists():
        lines, size = count_lines(am)
        rep["auto_memory"] = {"path": str(am), "lines": lines, "bytes": size}
        if lines > 200 or size > 25000:
            adv.append(f"Auto memory index {am} is {lines} lines / {size} bytes — only the first 200 lines or 25KB "
                       "load. Ask Claude to tidy it (/memory).")
    else:
        rep["auto_memory"] = None

    # skills, agents, commands
    rep["skills"] = {"user": scan_skills(CLAUDE / "skills"), "project": scan_skills(root / ".claude/skills"),
                     "agents-dir (~/.agents/skills)": scan_skills(HOME / ".agents/skills")}
    for scope, items in rep["skills"].items():
        for s in items:
            if s["desc_len"] == 0:
                adv.append(f"Skill {s['name']} ({scope}) has no description — Claude can't tell when to use it.")
            elif s["desc_len"] > 1536:
                adv.append(f"Skill {s['name']} ({scope}) description is {s['desc_len']} chars; the listing cuts at "
                           "1,536 — put the trigger words first.")
    rep["agents"] = {"user": scan_md(CLAUDE / "agents"), "project": scan_md(root / ".claude/agents")}
    rep["commands"] = {"user": scan_md(CLAUDE / "commands"), "project": scan_md(root / ".claude/commands")}
    if rep["commands"]["user"] or rep["commands"]["project"]:
        adv.append("You still have .claude/commands/*.md files — they work, but skills (.claude/skills/<name>/SKILL.md) "
                   "can hold scripts and reference files and are the recommended format for new work.")

    # plugins and marketplaces
    inst, _ = load_json(CLAUDE / "plugins/installed_plugins.json")
    plugins = []
    for pid, entries in ((inst or {}).get("plugins") or {}).items():
        for e in entries:
            pp = e.get("projectPath")
            if e.get("scope") == "user" or (pp and Path(pp) == root):
                plugins.append({"id": pid, "scope": e.get("scope"), "version": e.get("version")})
    rep["plugins"] = plugins
    km, _ = load_json(CLAUDE / "plugins/known_marketplaces.json")
    rep["marketplaces"] = sorted((km or {}).keys())
    if len(plugins) + sum(len(v) for v in rep["skills"].values()) > 25:
        adv.append("Many skills/plugins are active — run /skill-doctor to see what each costs in context and "
                   "turn off the ones you never use.")

    # MCP servers
    cj, _ = load_json(HOME / ".claude.json")
    cj = cj or {}
    mcp = {"user": sorted((cj.get("mcpServers") or {}).keys()),
           "local": sorted((((cj.get("projects") or {}).get(str(root)) or {}).get("mcpServers") or {}).keys())}
    pj, err = load_json(root / ".mcp.json")
    mcp["project (.mcp.json)"] = sorted(((pj or {}).get("mcpServers") or {}).keys())
    if err:
        adv.append(f".mcp.json is not valid JSON ({err}).")
    rep["mcp"] = mcp

    # git hygiene for personal files
    if git_root(cwd):
        for f in (".claude/settings.local.json", "CLAUDE.local.md"):
            if (root / f).exists():
                p = subprocess.run(["git", "-C", str(root), "check-ignore", "-q", f])
                if p.returncode != 0:
                    adv.append(f"{f} is personal but not git-ignored — add it to .gitignore.")

    if args.json:
        print(json.dumps(rep, indent=2, ensure_ascii=False))
        return
    c = rep["claude"]
    print(f"claude      {c['version'] or 'NOT FOUND'}  ({c['path'] or '-'})")
    print(f"project     {root}")
    for name, s in rep["settings"].items():
        if not s["exists"]:
            print(f"settings    {name:<8} —  {s['path']}")
            continue
        print(f"settings    {name:<8} ✓  {s['path']}  model={s.get('model') or '-'} mode={s.get('defaultMode') or '-'} "
              f"allow/ask/deny={s.get('allow', 0)}/{s.get('ask', 0)}/{s.get('deny', 0)} hooks={len(s.get('hook_events', []))} "
              f"plugins={s.get('enabledPlugins', 0)}")
    for label, i in rep["instructions"].items():
        print(f"memory      {label:<20} {i['lines']} lines")
    if rules:
        print(f"rules       {len(rules)}: {', '.join(rules[:8])}{' …' if len(rules) > 8 else ''}")
    if rep["auto_memory"]:
        print(f"auto memory {rep['auto_memory']['lines']} lines  ({rep['auto_memory']['path']})")
    for scope, items in rep["skills"].items():
        if items:
            print(f"skills      {scope:<8} {len(items)}: {', '.join(s['name'] for s in items[:10])}{' …' if len(items) > 10 else ''}")
    for kind in ("agents", "commands"):
        for scope, items in rep[kind].items():
            if items:
                print(f"{kind:<11} {scope:<8} {len(items)}: {', '.join(items[:10])}")
    if plugins:
        print(f"plugins     {len(plugins)}: " + ", ".join(f"{p['id']}[{p['scope']}]" for p in plugins))
    print(f"marketplaces {len(rep['marketplaces'])}: {', '.join(rep['marketplaces'])}")
    for scope, names in mcp.items():
        if names:
            print(f"mcp         {scope:<8} {', '.join(names)}")
    print()
    if adv:
        print("advice:")
        for a in adv:
            print(f"  - {a}")
    else:
        print("advice: nothing obvious — nice setup.")
    print("\nIn a session, also try: /doctor (installation), /context (what fills the context), /skill-doctor, /usage")


# ---------------------------------------------------------------- docs

def docs_index(refresh=False):
    text = fetch(LLMS_TXT, "llms.txt", refresh=refresh)
    out = []
    for m in re.finditer(r"^- \[([^\]]+)\]\((https://code\.claude\.com/docs/en/[^)]+)\)(?::\s*(.*))?$", text, re.M):
        title, url, desc = m.group(1), m.group(2), (m.group(3) or "")
        if any(o["url"] == url for o in out):
            continue
        out.append({"title": title, "url": url, "desc": desc,
                    "page": url.replace(DOCS_BASE, "").replace(".md", "")})
    return out


def docs(args):
    idx = docs_index(args.refresh)
    words = [w.lower() for w in args.words]
    if not words:
        for d in idx:
            print(f"{d['page']:<42} {d['title']}")
        print(f"\n{len(idx)} pages. Read one: cc.py read <page>")
        return
    scored = []
    for d in idx:
        hay_t, hay_d = (d["title"] + " " + d["page"]).lower(), d["desc"].lower()
        s = sum(3 * hay_t.count(w) + hay_d.count(w) for w in words)
        if all(w in hay_t or w in hay_d for w in words):
            s += 5
        if s:
            scored.append((s, d))
    scored.sort(key=lambda x: -x[0])
    for s, d in scored[: args.limit]:
        print(f"{d['page']}\n    {d['title']} — {d['desc'][:180]}")
    if not scored:
        print("no match — try fewer or English words, or `cc.py docs` for the full list")


def read(args):
    target = args.page
    url = target if target.startswith("http") else DOCS_BASE + re.sub(r"\.md$", "", target.strip("/")) + ".md"
    text = fetch(url, "page-" + re.sub(r"[^A-Za-z0-9]+", "_", url)[-120:], refresh=args.refresh)
    if args.section:
        lines, out, depth = text.splitlines(), [], None
        for ln in lines:
            m = re.match(r"^(#{1,6})\s+(.*)", ln)
            if m:
                if depth is not None and len(m.group(1)) <= depth:
                    break
                if depth is None and args.section.lower() in m.group(2).lower():
                    depth = len(m.group(1))
            if depth is not None:
                out.append(ln)
        if not out:
            heads = [ln for ln in lines if re.match(r"^#{2,3} ", ln)]
            die("section not found. Headings:\n" + "\n".join(heads))
        text = "\n".join(out)
    if args.grep:
        lines = text.splitlines()
        hits = [i for i, ln in enumerate(lines) if args.grep.lower() in ln.lower()]
        keep = sorted({j for i in hits for j in range(max(0, i - 2), min(len(lines), i + 3))})
        text = "\n".join(lines[j] for j in keep) or f"(no line contains {args.grep!r})"
    if len(text) > args.max:
        text = text[: args.max] + f"\n… [cut at {args.max} chars — use --section or --grep, or --max]"
    print(text)
    print(f"\nsource: {re.sub(r'[.]md$', '', url)}")


# ---------------------------------------------------------------- changelog

FIX_RE = re.compile(r"^- (\[[^\]]+\] |Windows: |macOS: |Linux: |WSL: |Self-hosted runner: )?Fixed\b")


def parse_changelog(text):
    parts = re.split(r"^## ", text, flags=re.M)[1:]
    out = []
    for p in parts:
        head, _, body = p.partition("\n")
        out.append((head.strip(), [ln for ln in body.splitlines() if ln.startswith("- ")]))
    return out


def changelog(args):
    vers = parse_changelog(fetch(CHANGELOG_URL, "CHANGELOG.md", max_age=3600, refresh=args.refresh))
    if args.since:
        sel = [(v, b) for v, b in vers if vkey(v) > vkey(args.since)]
    else:
        sel = vers[: args.count]
    n_items = 0
    for v, body in sel:
        items = body if args.all else [ln for ln in body if not FIX_RE.match(ln)]
        if args.grep:
            items = [ln for ln in items if args.grep.lower() in ln.lower()]
        if not items:
            continue
        print(f"## {v}")
        print("\n".join(items))
        print()
        n_items += len(items)
    print(f"[{len(sel)} versions, {n_items} items{'' if args.all else ', Fixed lines hidden (--all shows them)'}; "
          f"latest {vers[0][0] if vers else '?'}; source {CHANGELOG_URL}]")


def find_source(explicit):
    """Where to write updates: --source / $CLAUDE_SKILL_SOURCE, else this folder if it is a git checkout."""
    cand = explicit or os.environ.get("CLAUDE_SKILL_SOURCE")
    if cand:
        p = Path(cand).expanduser().resolve()
        if (p / "SKILL.md").exists():
            return p, "given"
        if (p / "skills/claude-skill/SKILL.md").exists():
            return p / "skills/claude-skill", "given"
        die(f"{p} is not the claude-skill folder (no SKILL.md)")
    root = git_root(SKILL_DIR)
    if root and "/.claude/plugins/" not in str(SKILL_DIR):
        return SKILL_DIR, "git"
    return SKILL_DIR, "installed-copy"


def covered(src):
    f = src / "references" / FEATURES
    m = MARK_RE.search(f.read_text(encoding="utf-8")) if f.exists() else None
    return m.group(1) if m else "0"


def update_check(args):
    src, kind = find_source(args.source)
    have = covered(src)
    vers = parse_changelog(fetch(CHANGELOG_URL, "CHANGELOG.md", max_age=0, refresh=True))
    latest = vers[0][0] if vers else "?"
    new = [(v, [ln for ln in b if not FIX_RE.match(ln)]) for v, b in vers if vkey(v) > vkey(have)]
    local_ver = None
    if shutil.which("claude"):
        try:
            local_ver = subprocess.run(["claude", "--version"], capture_output=True, text=True, timeout=20).stdout.split()[0]
        except Exception:
            pass
    print(f"skill folder      {src}  ({kind})")
    print(f"notes cover       {have}   (references/{FEATURES})")
    print(f"latest CHANGELOG  {latest}")
    print(f"your claude       {local_ver or '?'}")
    if kind == "installed-copy":
        print("\nThis is an installed copy (plugin cache): edits here are replaced by the next plugin update.\n"
              "  1. First get the maintainer's latest:  claude plugin marketplace update sonub-skills && "
              "claude plugin update cc-skill@sonub-skills\n"
              "  2. To change the source, clone it and pass --source:  git clone https://github.com/thruthesky/sonub-skills "
              "&& cc.py update-check --source sonub-skills/skills/claude-skill\n"
              f"  3. Or keep personal notes in {CONFIG / 'changelog-local.md'} (the skill reads it too).")
    if not new:
        print("\nup to date — nothing new to add.")
        return
    total = sum(len(b) for _, b in new)
    print(f"\n{len(new)} new versions ({new[-1][0]} … {new[0][0]}), {total} non-fix items. "
          f"See them: cc.py changelog --since {have}")
    print(f"After adding them to references/{FEATURES}: cc.py mark-covered {latest}"
          + (f" --source {src}" if kind != "git" else ""))


def mark_covered(args):
    src, kind = find_source(args.source)
    f = src / "references" / FEATURES
    if not f.exists():
        die(f"{f} not found")
    t = f.read_text(encoding="utf-8")
    stamp = f"<!-- covered-through: {args.version} -->"
    t = MARK_RE.sub(stamp, t, count=1) if MARK_RE.search(t) else stamp + "\n" + t
    t = re.sub(r"(Covers Claude Code up to \*\*v)[0-9.]+(\*\*)", rf"\g<1>{args.version}\g<2>", t, count=1)
    t = re.sub(r"(last updated )\d{4}-\d{2}-\d{2}", rf"\g<1>{time.strftime('%Y-%m-%d')}", t, count=1)
    f.write_text(t, encoding="utf-8")
    print(f"check: {f} now covers {covered(src)} ({kind})")


# ---------------------------------------------------------------- study progress

def lesson_list():
    f = REF / "curriculum.md"
    if not f.exists():
        return []
    return [(int(m.group(1)), m.group(2).strip())
            for m in re.finditer(r"^## Lesson (\d+)\s*[—-]\s*(.+)$", f.read_text(encoding="utf-8"), re.M)]


def load_progress():
    data, _ = load_json(PROGRESS)
    return data or {"done": [], "log": []}


def save_progress(p):
    CONFIG.mkdir(parents=True, exist_ok=True)
    PROGRESS.write_text(json.dumps(p, indent=2, ensure_ascii=False), encoding="utf-8")


def lessons(args):
    p, ls = load_progress(), lesson_list()
    for n, title in ls:
        print(f"  {'✓' if n in p['done'] else '·'} {n:>2}. {title}")
    nxt = next((n for n, _ in ls if n not in p["done"]), None)
    print(f"\n{len(p['done'])}/{len(ls)} done." + (f" Next: lesson {nxt}." if nxt else " All done — try the quiz!"))


def progress(args):
    p, ls = load_progress(), lesson_list()
    nums = {n for n, _ in ls}
    if args.action in ("done", "undo"):
        if args.n is None or args.n not in nums:
            die(f"give a lesson number {min(nums, default=1)}–{max(nums, default=1)}")
        if args.action == "done" and args.n not in p["done"]:
            p["done"].append(args.n)
            p["log"].append({"lesson": args.n, "at": time.strftime("%Y-%m-%d %H:%M")})
        if args.action == "undo" and args.n in p["done"]:
            p["done"].remove(args.n)
        p["done"].sort()
        save_progress(p)
    elif args.action == "reset":
        save_progress({"done": [], "log": []})
        p = load_progress()
    nxt = next((n for n, _ in ls if n not in p["done"]), None)
    title = dict(ls).get(nxt, "")
    print(f"check: {len(p['done'])}/{len(ls)} lessons done{'; next: ' + str(nxt) + '. ' + title if nxt else ''}"
          f"  ({PROGRESS})")


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("doctor", help="check this machine's and this project's Claude Code setup")
    s.add_argument("--json", action="store_true")
    s.set_defaults(fn=doctor)
    s = sub.add_parser("docs", help="search the official docs index")
    s.add_argument("words", nargs="*")
    s.add_argument("--limit", type=int, default=8)
    s.add_argument("--refresh", action="store_true")
    s.set_defaults(fn=docs)
    s = sub.add_parser("read", help="print a docs page (markdown)")
    s.add_argument("page", help="page path like 'skills' or 'plugins/install', or a full URL")
    s.add_argument("--section", help="only the section whose heading contains this text")
    s.add_argument("--grep", help="only lines containing this text (with 2 lines around)")
    s.add_argument("--max", type=int, default=20000)
    s.add_argument("--refresh", action="store_true")
    s.set_defaults(fn=read)
    s = sub.add_parser("changelog", help="show CHANGELOG entries (Fixed lines hidden by default)")
    g = s.add_mutually_exclusive_group()
    g.add_argument("--since", help="versions newer than this one")
    g.add_argument("--count", type=int, default=3, help="the latest N versions (default 3)")
    s.add_argument("--all", action="store_true", help="include Fixed lines")
    s.add_argument("--grep")
    s.add_argument("--refresh", action="store_true")
    s.set_defaults(fn=changelog)
    s = sub.add_parser("update-check", help="compare the skill's feature notes with the latest CHANGELOG")
    s.add_argument("--source")
    s.set_defaults(fn=update_check)
    s = sub.add_parser("mark-covered", help="record that the feature notes now cover VERSION")
    s.add_argument("version")
    s.add_argument("--source")
    s.set_defaults(fn=mark_covered)
    s = sub.add_parser("lessons", help="the study track with progress")
    s.set_defaults(fn=lessons)
    s = sub.add_parser("progress", help="mark lessons done/undone")
    s.add_argument("action", nargs="?", choices=["done", "undo", "reset", "next"], default="next")
    s.add_argument("n", nargs="?", type=int)
    s.set_defaults(fn=progress)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
