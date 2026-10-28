#!/usr/bin/env python3
"""linkify — copy the kit into a project and audit section ids in templates.

  python3 linkify.py init [dir]                  copy linkify.js + linkify.css into dir (default: ./linkify) and print the tags
  python3 linkify.py audit <file|dir>... [--levels h2,h3,h4] [--strict]
        lists, per file: headings with no id (and the id linkify.js would give them),
        duplicate ids, ids that do not survive copy/paste well (spaces, non-ASCII) and
        same-file #links that point at nothing. --strict exits 1 on any finding (for CI).
  python3 linkify.py slug "<heading text>"       the id linkify.js makes from that text

Python 3.8+, standard library only.
"""
import re
import shutil
import sys
import unicodedata
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent / 'assets'
EXTS = {'.html', '.htm', '.php', '.vue', '.svelte', '.jsx', '.tsx', '.astro', '.njk', '.hbs', '.twig', '.erb', '.liquid', '.ejs'}
SKIP_DIRS = {'node_modules', 'vendor', '.git', 'dist', 'build', '.next', '.nuxt', 'storage', 'public/vendor'}


def slug(text: str) -> str:
    """Same rule as idFor() in linkify.js: letters/marks/numbers of every script, spaces → '-'."""
    text = unicodedata.normalize('NFKC', text).lower()
    kept = ''.join(ch for ch in text if unicodedata.category(ch)[0] in 'LMN' or ch in ' \t\n_-')
    kept = re.sub(r'[\s_]+', '-', kept.strip())
    kept = re.sub(r'-+', '-', kept).strip('-')
    return kept or 'section'


def files(paths):
    for raw in paths:
        p = Path(raw)
        if p.is_file():
            yield p
        elif p.is_dir():
            for f in sorted(p.rglob('*')):
                rel = f.as_posix()
                if f.is_file() and (f.suffix in EXTS or rel.endswith('.blade.php')) and not any(f'/{d}/' in f'/{rel}' for d in SKIP_DIRS):
                    yield f


TAG_TEXT = re.compile(r'<[^>]+>|\{\{.*?\}\}|\{!!.*?!!\}|@\w+(\([^)]*\))?', re.S)


def audit_file(path: Path, levels):
    src = path.read_text(encoding='utf-8', errors='replace')
    out = []
    heading = re.compile(r'<(' + '|'.join(levels) + r')\b([^>]*)>(.*?)</\1\s*>', re.S | re.I)
    ids = {}
    for m in re.finditer(r'''\bid\s*=\s*(["'])(.*?)\1''', src):
        ids.setdefault(m.group(2), []).append(src.count('\n', 0, m.start()) + 1)

    for m in heading.finditer(src):
        line = src.count('\n', 0, m.start()) + 1
        attrs = m.group(2)
        if 'data-linkify-skip' in attrs:
            continue
        text = re.sub(r'\s+', ' ', TAG_TEXT.sub(' ', m.group(3))).strip()
        idm = re.search(r'''\bid\s*=\s*(["'])(.*?)\1''', attrs)
        if not idm:
            dynamic = bool(re.search(r'\{\{|\{!!|@lang|__\(|\$t\(|\bt\(', m.group(3)))
            hint = 'translated text — give a fixed id (the slug changes per language)' if dynamic else f'would become #{slug(text)}'
            shown = text or re.sub(r'\s+', ' ', m.group(3)).strip()
            out.append((line, 'no-id', f'<{m.group(1)}> "{shown[:60]}" — {hint}'))

    for value, lines in ids.items():
        if '{' in value or '$' in value or '<?' in value:
            continue  # template expression — checked at runtime
        if len(lines) > 1:
            out.append((lines[0], 'duplicate', f'id="{value}" also on line(s) {", ".join(map(str, lines[1:]))}'))
        if re.search(r'\s', value) or not value.isascii():
            out.append((lines[0], 'portable', f'id="{value}" — spaces/non-ASCII become %XX when the link is pasted'))

    for m in re.finditer(r'''\bhref\s*=\s*(["'])#([^"'{}$]+)\1''', src):
        target = m.group(2)
        if target and target not in ids:
            out.append((src.count('\n', 0, m.start()) + 1, 'dangling', f'href="#{target}" — no id="{target}" in this file (may live in another template)'))
    return sorted(out)


def cmd_audit(args):
    levels = ['h2', 'h3', 'h4']
    strict = '--strict' in args
    args = [a for a in args if a != '--strict']
    if '--levels' in args:
        i = args.index('--levels')
        levels = [x.strip() for x in args[i + 1].split(',') if x.strip()]
        del args[i:i + 2]
    if not args:
        sys.exit('usage: linkify.py audit <file|dir>... [--levels h2,h3,h4] [--strict]')
    total = 0
    counts = {}
    for f in files(args):
        found = audit_file(f, levels)
        if not found:
            continue
        print(f'\n{f}')
        for line, kind, msg in found:
            print(f'  {line:>5}  {kind:<9} {msg}')
            counts[kind] = counts.get(kind, 0) + 1
        total += len(found)
    print('\n' + (', '.join(f'{k}: {v}' for k, v in sorted(counts.items())) if total else 'no findings'))
    if strict and total:
        sys.exit(1)


def cmd_init(args):
    dest = Path(args[0] if args else 'linkify')
    dest.mkdir(parents=True, exist_ok=True)
    for name in ('linkify.js', 'linkify.css'):
        target = dest / name
        if target.exists() and target.read_bytes() != (KIT / name).read_bytes():
            print(f'kept {target} (it differs from the kit — compare by hand)')
            continue
        shutil.copyfile(KIT / name, target)
        print(f'wrote {target}')
    web = '/' + dest.as_posix().strip('./').split('public/', 1)[-1]
    print('\nAdd to the page layout (adjust the URL path to where the folder is served):')
    print(f'  <link rel="stylesheet" href="{web}/linkify.css">')
    print(f'  <script defer src="{web}/linkify.js" data-root="main" data-header=".site-header"></script>')


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ('-h', '--help'):
        print(__doc__)
        return
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == 'init':
        cmd_init(args)
    elif cmd == 'audit':
        cmd_audit(args)
    elif cmd == 'slug':
        print(slug(' '.join(args)))
    else:
        sys.exit(f'unknown command: {cmd}\n{__doc__}')


if __name__ == '__main__':
    main()
