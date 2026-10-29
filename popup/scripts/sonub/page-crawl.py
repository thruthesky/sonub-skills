#!/usr/bin/env python3
"""화면 전체 점검의 첫 단계 — 로컬 사이트를 돌며 한 언어의 페이지 주소를 모으고 HTML 을 저장한다.

실행(저장소 루트에서):
    python3 skills/popup/scripts/sonub/page-crawl.py            # ko, https://sonub.localhost:7843
    python3 skills/popup/scripts/sonub/page-crawl.py en 400     # 언어, 최대 페이지 수

결과: storage/app/popup-pages/<언어>/pages.txt(주소 목록) · html/<주소를 바꾼 이름>.html
다음 단계: bash skills/popup/scripts/sonub/run.sh page-audit.php <언어>
"""
import json
import os
import re
import ssl
import subprocess
import sys
import urllib.request
from collections import deque

BASE = os.environ.get('SONUB_BASE', 'https://sonub.localhost:7843')
locale = sys.argv[1] if len(sys.argv) > 1 else 'ko'
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 600
out = os.path.join('storage/app/popup-pages', locale)
os.makedirs(os.path.join(out, 'html'), exist_ok=True)
# 지난 수집본을 지운다 — 없어지거나 옮긴 주소(301)의 옛 화면이 남으면 pages 점검이 지금 없는 뜻을 보고한다
for old in os.listdir(os.path.join(out, 'html')):
    if old.endswith('.html'):
        os.remove(os.path.join(out, 'html', old))

# 로그인·개인 상태·끝없이 늘어나는 글 목록은 뺀다 — 교재·안내 화면의 낱말을 보는 일이라서
SKIP = re.compile(r'^/[a-z-]+/(?:login|me|talk|forum|board|class/|student/|school/|teacher/|org/|vibe-coding/(?:p|s|u|run)/|vibe/|exam/sign-in|search|suggest|game/)'
                  r'|\.(?:json|xml|png|jpe?g|svg|webp|gif|pdf|zip|gz|mp3|wav|onnx|js|css)$|/state$|/ranking/me')
ctx = ssl._create_unverified_context()


def fetch(path):
    req = urllib.request.Request(BASE + path, headers={'User-Agent': 'sonub-popup-audit', 'Accept-Language': locale})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=60) as res:
            if 'text/html' not in res.headers.get('Content-Type', ''):
                return None, res.url
            return res.read().decode('utf-8', 'replace'), res.url
    except Exception as e:  # noqa: BLE001 — 실패한 주소는 목록에 남기고 넘어간다
        print('실패', path, e, file=sys.stderr)
        return None, None


def name(path):
    return re.sub(r'[^A-Za-z0-9._-]+', '_', path.strip('/')) or 'index'


# 기본 언어(config/locales.php 의 default — en)는 주소에 언어 접두사가 없다(/appdev). 다른 언어는 /ko/appdev
LOCALES = re.findall(r"^\s*'([a-z]{2})' =>", open('config/locales.php').read(), re.M) or ['en']
DEFAULT = (re.search(r"'default' => '([a-z]{2})'", open('config/locales.php').read()) or [None, 'en'])[1]
prefix = '' if locale == DEFAULT else f'/{locale}'
OTHER = re.compile(r'^/(?:' + '|'.join(l for l in LOCALES if l != DEFAULT) + r')(?:/|$)')


def mine(href):
    # 이 언어의 화면 주소인가 — 기본 언어는 다른 언어 접두사가 없는 주소
    return (href == prefix or href.startswith(prefix + '/')) if prefix else (href.startswith('/') and not OTHER.match(href))


def skip(path):
    return SKIP.search(path if prefix else '/' + DEFAULT + path)


start = prefix or '/'
queue = deque([start])
seen = {start}
# 링크로 닿지 않는 화면(서브도메인에서만 잇는 /teach 등)도 보도록 라우트 목록의 매개변수 없는 GET 화면을 시작점에 더한다
try:
    routes = json.loads(subprocess.run(['docker', 'compose', 'exec', '-T', 'app', 'php', 'artisan', 'route:list', '--method=GET', '--json'],
                                       capture_output=True, text=True, timeout=120).stdout or '[]')
except (OSError, ValueError, subprocess.SubprocessError) as e:  # 도커가 없으면 링크만 따라간다
    print('라우트 목록을 읽지 못했다', e, file=sys.stderr)
    routes = []
for r in routes:
    uri = r.get('uri', '')
    if not uri.startswith('{locale}/') or '{' in uri[8:] or r.get('domain'):
        continue
    path = prefix + '/' + uri[9:]
    if path not in seen and not skip(path):
        seen.add(path)
        queue.append(path)
pages = []
while queue and len(pages) < limit:
    path = queue.popleft()
    html, final = fetch(path)
    if html is None:
        continue
    final_path = re.sub(r'^https?://[^/]+', '', final or '').split('#')[0].split('?')[0]
    if final_path and final_path != path and not mine(final_path):
        continue  # 다른 언어·로그인 화면으로 넘어갔다
    pages.append(path)
    with open(os.path.join(out, 'html', name(path) + '.html'), 'w') as f:
        f.write(html)
    for href in re.findall(r'href="([^"#?]+)', html):
        href = re.sub(r'^https?://sonub\.localhost(?::\d+)?', '', href)
        if href.startswith('//') or not mine(href):
            continue
        href = href.rstrip('/') or href
        if href in seen or skip(href):
            continue
        seen.add(href)
        queue.append(href)
    print(len(pages), path, file=sys.stderr)

with open(os.path.join(out, 'pages.txt'), 'w') as f:
    f.write('\n'.join(pages) + '\n')
print(f'{len(pages)}개 페이지 → {out}/pages.txt')
