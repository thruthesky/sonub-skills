#!/usr/bin/env python3
"""Homepage translations.

  python3 docs/tools/i18n.py extract   # index.html → i18n/en.json (the English source for translators)
  python3 docs/tools/i18n.py check     # every i18n/<lang>.json has the same keys, {placeholders} and tags
"""
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent
LANGS = ['en', 'ko', 'zh', 'ja', 'es', 'pt', 'fr', 'de', 'ru', 'vi', 'id', 'th', 'tr', 'hi', 'bn', 'ar', 'ur']

# A [data-i18n] element never holds another element of the same tag name, so this is safe for our page.
ELEM = re.compile(r'<(\w+)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>(.*?)</\1>', re.S)
CONTENT = re.compile(r'<meta\b[^>]*?\sdata-i18n-content="([^"]+)"[^>]*?\scontent="([^"]*)"', re.S)
PLACEHOLDER = re.compile(r'\{\w+\}')
TAG = re.compile(r'</?(\w+)')


def extract():
    page = (DOCS / 'index.html').read_text(encoding='utf-8')
    out = {}
    for _tag, key, inner in ELEM.findall(page):
        if key in out and out[key] != inner.strip():
            sys.exit(f'key used twice with different text: {key}')
        out[key] = inner.strip()
    for key, content in CONTENT.findall(page):
        out[key] = html.unescape(content)
    (DOCS / 'i18n').mkdir(exist_ok=True)
    (DOCS / 'i18n' / 'en.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'en.json: {len(out)} keys')


def check():
    en = json.loads((DOCS / 'i18n' / 'en.json').read_text(encoding='utf-8'))
    bad = 0
    for lang in LANGS[1:]:
        f = DOCS / 'i18n' / f'{lang}.json'
        if not f.exists():
            print(f'{lang}: missing file'); bad += 1; continue
        try:
            tr = json.loads(f.read_text(encoding='utf-8'))
        except json.JSONDecodeError as e:
            print(f'{lang}: invalid JSON — {e}'); bad += 1; continue
        problems = []
        missing = sorted(set(en) - set(tr))
        extra = sorted(set(tr) - set(en))
        if missing: problems.append(f'missing keys: {", ".join(missing)}')
        if extra: problems.append(f'unknown keys: {", ".join(extra)}')
        for k, src in en.items():
            if k not in tr: continue
            dst = tr[k]
            if not isinstance(dst, str) or not dst.strip():
                problems.append(f'{k}: empty'); continue
            if sorted(PLACEHOLDER.findall(src)) != sorted(PLACEHOLDER.findall(dst)):
                problems.append(f'{k}: placeholders {PLACEHOLDER.findall(src)} → {PLACEHOLDER.findall(dst)}')
            if Counter(TAG.findall(src)) != Counter(TAG.findall(dst)):
                problems.append(f'{k}: tags {dict(Counter(TAG.findall(src)))} → {dict(Counter(TAG.findall(dst)))}')
            if re.search(r'<(?!/?(code|a|strong|em|b)\b)', dst):
                problems.append(f'{k}: raw "<" — write &lt; instead')
        if problems:
            bad += 1
            print(f'{lang}: {len(problems)} problem(s)')
            for p in problems: print('   ', p)
        else:
            print(f'{lang}: ok ({len(tr)} keys)')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    {'extract': extract, 'check': check}.get(cmd, lambda: sys.exit(__doc__))()
