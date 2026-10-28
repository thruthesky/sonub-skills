#!/usr/bin/env python3
"""작업 폴더의 {언어}.part1.json … 을 {언어}.json 하나로 합친다(en.json 의 항목 순서대로). 큰 번역은 조각으로 나눠 쓰기 때문이다.

    python3 $POPUP/scripts/sonub/translate/merge-parts.py storage/app/popup-work ja
"""
import glob, json, os, sys

d, lang = os.path.abspath(sys.argv[1]), sys.argv[2]
en = json.load(open(os.path.join(d, 'en.json')))
parts = sorted(glob.glob(os.path.join(d, f'{lang}.part*.json')))
if not parts:
    sys.exit(f'{lang}.part*.json 이 없다')
out, got = {'keys': {}, 'terms': {}, 'existing': {}}, {}
for p in parts:
    part = json.load(open(p))
    out['keys'].update(part.get('keys', {}))
    out['existing'].update(part.get('existing', {}))   # 이미 있는 항목에 더할 그 언어의 별칭
    got.update(part.get('terms', {}))
for k in list(en['terms']) + [k for k in got if k not in en['terms']]:
    if k in got:
        out['terms'][k] = got[k]
if not out['existing']:
    del out['existing']
json.dump(out, open(os.path.join(d, f'{lang}.json'), 'w'), ensure_ascii=False, indent=2)
print(f'{lang}.json — 항목 {len(out["terms"])}개, 키 {len(out["keys"])}개 (조각 {len(parts)}개)')
