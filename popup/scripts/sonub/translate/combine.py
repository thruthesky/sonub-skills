#!/usr/bin/env python3
"""작업 폴더의 {언어}.json 17개를 add-terms.php 입력(terms: id → 언어 → 필드, keys: 키 → 언어 → 값,
aliases: 이미 있는 id → 언어 → 별칭 전체 값 — 작업 파일의 existing) 하나로 묶는다.

    python3 $POPUP/scripts/sonub/translate/combine.py storage/app/popup-work
    bash $POPUP/scripts/sonub/run.sh add-terms.php /app/storage/app/popup-work/input.json --dry-run
"""
import json, os, sys

d = os.path.abspath(sys.argv[1])
locales = ['en', 'ko', 'ja', 'zh', 'hi', 'bn', 'ur', 'es', 'pt', 'fr', 'de', 'ru', 'ar', 'id', 'vi', 'th', 'tr']
missing = [l for l in locales if not os.path.exists(os.path.join(d, f'{l}.json'))]
if missing:
    sys.exit('없는 언어: ' + ','.join(missing))
data = {l: json.load(open(os.path.join(d, f'{l}.json'))) for l in locales}
en = data['en']
out = {
    'terms': {i: {l: data[l]['terms'].get(i, {}) for l in locales} for i in en['terms']},
    'keys': {k: {l: data[l].get('keys', {}).get(k, '') for l in locales} for k in en.get('keys', {})},
    'aliases': {},
}
for l in locales:
    for i, value in data[l].get('existing', {}).items():
        out['aliases'].setdefault(i, {})[l] = value
json.dump(out, open(os.path.join(d, 'input.json'), 'w'), ensure_ascii=False, indent=1)
print('input.json — 항목', len(out['terms']), '· 키', len(out['keys']), '· 별칭', sum(len(v) for v in out['aliases'].values()))
