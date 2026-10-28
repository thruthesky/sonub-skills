#!/usr/bin/env python3
"""popup.py — glossary tool for the `popup` skill (https://sonub.com skills, MIT). Python 3.8+, standard library only.

One glossary JSON is the single source of every explanation. This tool sets it up, checks it,
finds the terms a document needs, merges new terms in, and makes Markdown docs link to it.

    python3 popup.py init [DIR] [--locales en,ko] [--force]   copy popup.js/css + a starter glossary.json, write .popup.json
    python3 popup.py check [GLOSSARY…] [--site-root DIR]       validate (exit 1 on errors)
    python3 popup.py audit PATH… [--locale ko] [--top 40]      which glossary terms a doc uses, and jargon that has no entry yet
    python3 popup.py add INPUT.json [--dry-run] [--overwrite]  merge terms from INPUT.json into the glossary (checked first)
    python3 popup.py show ID [--locale ko]                     print one entry
    python3 popup.py md [--locale ko] [--out GLOSSARY.md]      write a Markdown glossary page (one anchor per term)
    python3 popup.py link PATH… [--locale ko] [--write]        Markdown: link the first use of each term to GLOSSARY.md#id "short"
    python3 popup.py link PATH… --unlink [--write]             remove the links `link` added
    python3 popup.py senses [--locale ko]                       spellings with several meanings → candidate ids and their context cues
    python3 popup.py index PATH… [--locale ko] [--out FILE]    sense index: every place a term is found, the meaning chosen by context → SQLite
    python3 popup.py index --query WORD|ID [--out FILE]        look one word up in the index (sentence, chosen meaning, scores)

Defaults come from .popup.json at the git root (written by `init`):
    {"glossary": "popup/glossary.json", "assets": "popup", "glossaryPage": "GLOSSARY.md", "docs": ["README.md", "docs"]}
"""
import argparse
import copy
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')

REQUIRED = ('term', 'short', 'long')
SHARED_OPTIONAL = ('easy', 'example', 'code')       # in one locale → in every locale
PER_LOCALE = ('aliases', 'reading', 'href')          # each locale may or may not have it
TEXT_FIELDS = REQUIRED + SHARED_OPTIONAL + PER_LOCALE
STRUCT_FIELDS = ('category', 'aliases', 'related', 'href', 'match', 'auto', 'scope', 'case', 'exact', 'codeLang', 'cues', 'context', 'shares', 'avoid', 'text')
# context: sentence 4 · paragraph 1 · topic (data-popup-scope / --scope / --topic) 2; the rest of the page only breaks ties (PAGE_CAP)
CUE_WEIGHTS = {'sentence': 4, 'text': 1, 'topic': 2}
PAGE_CAP = 9
SENTENCE_END = re.compile(r'[.!?。！？।؟۔](?=\s|$)|\n')
ID_RE = re.compile(r'^[a-z0-9][a-z0-9-]*$')
DOC_EXT = ('.md', '.markdown', '.mdx', '.html', '.htm', '.txt', '.rst', '.adoc', '.vue', '.svelte', '.jsx', '.tsx', '.php', '.erb', '.njk', '.hbs', '.astro')
SKIP_DIRS = {'.git', 'node_modules', 'vendor', 'dist', 'build', '.next', '.nuxt', '.venv', 'venv', '__pycache__', 'storage', 'coverage', '.cache'}

KO_PARTICLES = sorted(set("""이라고 라고 으로써 으로서 로써 로서 이라는 라는 에서는 에서도 에게서 한테서 으로는 으로도 까지도 부터는 이라도 라도 이라면 라면 이란 란
조차 마저 밖에 처럼 보다 마다 부터 까지 에서 에게 한테 으로 이나 나마 이야 와의 과의 들을 들이 들은 들과 들 은 는 이 가 을 를 에 의 와 과 도 만
로 나 야 라 고 며 서 인 임 일 다 입 하 한 할 함 합 해 했 되 된 될 됨 됩 돼 됐""".split()), key=len, reverse=True)
ARABIC_PREFIXES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ب', 'ل', 'ك', 'ف']

# popup labels in 17 languages — `init --locales` copies the ones you ask for into glossary.json
LABELS = {
    'en': ['Glossary', 'Close', 'In plain words', 'Example', 'Code', 'Related', 'Learn more', 'Copy', 'Copied'],
    'ko': ['용어 사전', '닫기', '쉽게 말하면', '예시', '코드', '관련 용어', '더 알아보기', '복사', '복사됨'],
    'ja': ['用語集', '閉じる', 'かんたんに言うと', '例', 'コード', '関連用語', 'もっと知る', 'コピー', 'コピーしました'],
    'zh': ['术语表', '关闭', '简单来说', '示例', '代码', '相关术语', '了解更多', '复制', '已复制'],
    'es': ['Glosario', 'Cerrar', 'En pocas palabras', 'Ejemplo', 'Código', 'Relacionado', 'Saber más', 'Copiar', 'Copiado'],
    'pt': ['Glossário', 'Fechar', 'Em palavras simples', 'Exemplo', 'Código', 'Relacionados', 'Saiba mais', 'Copiar', 'Copiado'],
    'fr': ['Glossaire', 'Fermer', 'En termes simples', 'Exemple', 'Code', 'Voir aussi', 'En savoir plus', 'Copier', 'Copié'],
    'de': ['Glossar', 'Schließen', 'Einfach gesagt', 'Beispiel', 'Code', 'Verwandt', 'Mehr erfahren', 'Kopieren', 'Kopiert'],
    'ru': ['Глоссарий', 'Закрыть', 'Простыми словами', 'Пример', 'Код', 'Связанные термины', 'Подробнее', 'Копировать', 'Скопировано'],
    'vi': ['Thuật ngữ', 'Đóng', 'Nói đơn giản', 'Ví dụ', 'Mã', 'Liên quan', 'Tìm hiểu thêm', 'Sao chép', 'Đã sao chép'],
    'id': ['Glosarium', 'Tutup', 'Sederhananya', 'Contoh', 'Kode', 'Terkait', 'Pelajari lebih lanjut', 'Salin', 'Disalin'],
    'th': ['อภิธานศัพท์', 'ปิด', 'พูดง่าย ๆ', 'ตัวอย่าง', 'โค้ด', 'คำที่เกี่ยวข้อง', 'อ่านเพิ่มเติม', 'คัดลอก', 'คัดลอกแล้ว'],
    'tr': ['Sözlük', 'Kapat', 'Kısacası', 'Örnek', 'Kod', 'İlgili', 'Daha fazla bilgi', 'Kopyala', 'Kopyalandı'],
    'hi': ['शब्दावली', 'बंद करें', 'आसान शब्दों में', 'उदाहरण', 'कोड', 'संबंधित शब्द', 'और जानें', 'कॉपी करें', 'कॉपी हो गया'],
    'bn': ['শব্দকোষ', 'বন্ধ করুন', 'সহজ কথায়', 'উদাহরণ', 'কোড', 'সম্পর্কিত', 'আরও জানুন', 'কপি করুন', 'কপি হয়েছে'],
    'ar': ['المسرد', 'إغلاق', 'بكلمات بسيطة', 'مثال', 'الشيفرة', 'مصطلحات ذات صلة', 'اعرف المزيد', 'نسخ', 'تم النسخ'],
    'ur': ['فرہنگ', 'بند کریں', 'آسان الفاظ میں', 'مثال', 'کوڈ', 'متعلقہ اصطلاحات', 'مزید جانیں', 'کاپی کریں', 'کاپی ہو گیا'],
}
LABEL_KEYS = ['dialog', 'close', 'easy', 'example', 'code', 'related', 'more', 'copy', 'copied']


# ── project config ─────────────────────────────────────────────

def git_root(start='.'):
    try:
        out = subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=start, capture_output=True, text=True)
        if out.returncode == 0:
            return out.stdout.strip()
    except OSError:
        pass
    return os.path.abspath(start)


def project():
    root = git_root()
    path = os.path.join(root, '.popup.json')
    conf = {}
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            conf = json.load(f)
    conf['_root'] = root
    return conf


def glossary_path(arg, conf):
    if arg:
        return arg
    if conf.get('glossary'):
        return os.path.join(conf['_root'], conf['glossary'])
    sys.exit('no glossary: pass a path, or run `popup.py init` to write .popup.json')


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def save(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def locales_of(data):
    if data.get('locales'):
        return list(data['locales'])
    seen = []
    for t in data.get('terms', {}).values():
        for loc in (t.get('text') or {}):
            if loc not in seen:
                seen.append(loc)
    return seen


def text_of(data, tid, locale):
    t = data['terms'][tid].get('text') or {}
    return t.get(locale) or t.get(data.get('defaultLocale', '')) or (next(iter(t.values())) if t else {})


def example_lines(text):
    out = []
    for line in str(text or '').split('\n'):
        line = line.strip()
        if not line:
            continue
        m = re.match(r'^`([^`]+)`\s*(.*)$', line)
        out.append((m.group(1), m.group(2)) if m else ('', line))
    return out


# ── matching (the same rules as popup.js) ──────────────────────

def script(ch):
    if not ch:
        return ''
    if ch.isdigit():
        return 'LATIN'
    try:
        name = unicodedata.name(ch)
    except ValueError:
        return ''
    for s in ('LATIN', 'CYRILLIC', 'HANGUL', 'ARABIC', 'DEVANAGARI', 'BENGALI', 'CJK', 'HIRAGANA', 'KATAKANA', 'THAI', 'GREEK'):
        if name.startswith(s):
            return s
    return ''


def surfaces(data, tid, locale):
    term = data['terms'][tid]
    t = text_of(data, tid, locale)
    exact_all = term.get('case') is True
    exact_set = set(term.get('exact') or [])
    out = []

    def add(s, exact):
        s = re.sub(r'\s+', ' ', str(s or '').strip())
        if len(s) >= 2 and (s, exact) not in out:
            out.append((s, exact))
    add(t.get('term'), exact_all)
    m = re.match(r'^(.+?)\s*[(（]', t.get('term') or '')
    if m:
        add(m.group(1), exact_all)
    for a in term.get('aliases') or []:
        add(a, exact_all or a in exact_set)
    for a in re.split(r'[,،、，]', t.get('aliases') or ''):
        add(a, exact_all)
    for a in exact_set:
        add(a, True)
    return out


class Matcher:
    """Longest spelling first. A spelling several terms share keeps every term as a candidate; resolve() picks one by context
    (see references/content.md "Words with several meanings"): scoped terms first, then the score of their cues near the word."""

    def __init__(self, data, locale, scope=None):
        self.data, self.locale, self.scope = data, locale, scope
        terms = data['terms']
        ids = [tid for tid, t in terms.items() if t.get('match') is not False and t.get('auto') is not False and (not t.get('scope') or t.get('scope') == scope)]
        borrowers = {}
        for tid in ids:
            for owner in terms[tid].get('shares') or []:
                borrowers.setdefault(owner, []).append(tid)
        spell = {}   # (spelling key) → [s, exact, longest-first rank, order, candidates]
        for order, tid in enumerate(ids + [o for o in borrowers if o not in ids and o in terms]):
            own = tid in ids
            for s, exact in surfaces(data, tid, locale):
                k = (s if exact else s.lower(), exact)
                item = spell.setdefault(k, [s, exact, order, []])
                for c in ([tid] if own else []) + ['~' + b for b in borrowers.get(tid, [])]:
                    if c not in item[3]:
                        item[3].append(c)
        items = sorted((it for it in spell.values() if it[3]), key=lambda it: (-len(it[0]), it[2]))
        self.by_first = {}
        for s, exact, _, cands in items:
            self.by_first.setdefault(s[0].lower(), []).append((s, exact, cands))

    @staticmethod
    def _boundary(text, i, j, s):
        before = text[i - 1] if i > 0 else ''
        first, last = script(s[0]), script(s[-1])
        if first == 'LATIN':
            if before and (script(before) == 'LATIN' or before in '_$#{'):
                return None
            if before == '.' and i > 1 and script(text[i - 2]) == 'LATIN':
                return None
        elif first == 'ARABIC' and script(before) == 'ARABIC':
            # a clitic prefix (و، ب، ال …) glued to the word is fine, as long as the prefix starts a word
            if not any(text.endswith(p, 0, i) and script(text[i - len(p) - 1] if i > len(p) else '') != 'ARABIC' for p in ARABIC_PREFIXES):
                return None
        elif first and first in ('CYRILLIC', 'HANGUL', 'DEVANAGARI', 'BENGALI') and script(before) == first:
            return None
        after = text[j] if j < len(text) else ''
        if last == 'LATIN':
            if after and (script(after) == 'LATIN' or after in '_[' or unicodedata.category(after).startswith('M')):
                return None
            if after == '.' and j + 1 < len(text) and script(text[j + 1]) == 'LATIN':
                return None
        elif last == 'HANGUL' and script(after) == 'HANGUL':
            if not any(text.startswith(p, j) for p in KO_PARTICLES):
                return None
        elif last in ('CYRILLIC', 'ARABIC'):
            while j < len(text) and (script(text[j]) == last or unicodedata.category(text[j]).startswith('M')):
                j += 1
        return j

    def spans(self, text):
        """Yield (start, end, candidates) — non-overlapping, left to right. '~id' is a candidate that borrows the spelling (shares)."""
        i, n = 0, len(text)
        while i < n:
            hit = None
            for s, exact, cands in self.by_first.get(text[i].lower(), ()):
                piece = text[i:i + len(s)]
                if (piece == s) if exact else (piece.lower() == s.lower()):
                    j = self._boundary(text, i, i + len(s), s)
                    if j is not None:
                        hit = (i, j, cands)
                        break
            if hit:
                yield hit
                i = hit[1]
            else:
                i += 1

    def needs_context(self, cand):
        return cand.startswith('~') or self.data['terms'][cand].get('context') is True

    def resolve(self, text, page=None, topics=()):
        """Pick a meaning for every spelling found in `text` (one paragraph).
        Returns [(start, end, id or None, {id: (score, eligible, avoided)})]. None = no evidence for a word that needs it — leave it plain."""
        terms = self.data['terms']
        hits = list(self.spans(text))
        bounds = [m.start() for m in SENTENCE_END.finditer(text)]
        sentence_of = lambda at: sum(1 for b in bounds if b < at)
        text_ids, sentence_ids = set(), {}
        for s, _, cands in hits:
            if len(cands) == 1 and not self.needs_context(cands[0]):
                text_ids.add(cands[0])
                sentence_ids.setdefault(sentence_of(s), set()).add(cands[0])
        topics = set(topics) | ({self.scope} if self.scope else set())
        page = page or {}
        out = []
        for s, e, cands in hits:
            near = sentence_ids.get(sentence_of(s), set())
            scores, best = {}, None
            for c in cands:
                tid = c.lstrip('~')
                t = terms[tid]
                cues = {tid, *(t.get('cues') if t.get('cues') is not None else t.get('related') or [])}
                close = sum(CUE_WEIGHTS['sentence'] * (q in near) + CUE_WEIGHTS['topic'] * (q in topics) for q in cues)
                local = close + sum(CUE_WEIGHTS['text'] * (q in text_ids) for q in cues)
                far = sum(1 for q in cues if q in page)
                avoided = any(m.start() <= s and m.end() >= e for p in ((t.get('avoid') or {}).get(self.locale) or []) for m in re.finditer(p, text, re.I))
                # a borrowed meaning competes with the owner's, which is always there — it needs a cue in the same sentence or topic
                eligible = not avoided and (not self.needs_context(c) or (close if c.startswith('~') else local) > 0)
                tier = 1 if t.get('scope') and t.get('scope') == self.scope else 0
                scores[tid] = (local * 10 + min(far, PAGE_CAP), eligible, avoided, tier)
                if eligible and (best is None or (tier, scores[tid][0]) > (scores[best][3], scores[best][0])):
                    best = tid
            out.append((s, e, best, scores))
        return out

    def find(self, text, page=None, topics=()):
        """Yield (start, end, id) for every spelling whose meaning the context supports."""
        for s, e, tid, _ in self.resolve(text, page, topics):
            if tid:
                yield s, e, tid


# ── document reading ───────────────────────────────────────────

def doc_files(paths):
    for p in paths:
        if os.path.isdir(p):
            for d, dirs, files in os.walk(p):
                dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS and not x.startswith('.'))
                for f in sorted(files):
                    if f.lower().endswith(DOC_EXT):
                        yield os.path.join(d, f)
        elif os.path.isfile(p):
            yield p


def prose(path, raw):
    """Return (prose, code_snippets): the text a reader reads, and inline/fenced code to mine for jargon."""
    code = re.findall(r'`([^`\n]{2,40})`', raw)
    text = raw
    if path.lower().endswith(('.md', '.markdown', '.mdx')):
        text = re.sub(r'^---\n.*?\n---\n', '', text, flags=re.S)
        text = re.sub(r'^(```|~~~).*?^\1', '', text, flags=re.S | re.M)
        text = re.sub(r'`[^`\n]+`', ' ', text)
        text = re.sub(r'!?\[([^\]]*)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'<(script|style|pre|code)\b.*?</\1>', ' ', text, flags=re.S | re.I)
    text = re.sub(r'<!--.*?-->', ' ', text, flags=re.S)
    # a block element ends a paragraph — the context of a word is its own paragraph, not the whole page (index, Matcher.resolve)
    text = re.sub(r'</(?:p|li|h[1-6]|td|th|dd|dt|div|section|article|blockquote|figcaption)>|<br\s*/?>', '\n\n', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\{\{.*?\}\}|\{!!.*?!!\}|@\w+(\([^)]*\))?', ' ', text)
    return text, code


CANDIDATE_RES = [
    re.compile(r'(?<![\w.])([A-Z][A-Z0-9]{1,7})s?(?![\w])'),                 # API, JSON, HTTP2, CLIs
    re.compile(r'(?<![\w.])([a-z]+(?:[A-Z][a-z0-9]+)+)(?![\w])'),             # useState, getElementById
    re.compile(r'(?<![\w.])([A-Z][a-z]+(?:[A-Z][a-z0-9]+)+)(?![\w])'),        # JavaScript, WebSocket
    re.compile(r'(?<![\w.])([A-Z]{2,}[a-z]+[A-Za-z0-9]*|[a-z]+[A-Z]{2,}[a-z]*)(?![\w])'),   # OAuth, GraphQL, iOS, macOS
]
COMMON_UPPER = {'OK', 'I', 'A', 'TODO', 'FAQ', 'NOTE', 'TIP', 'WARNING', 'IMPORTANT', 'README', 'MIT', 'AM', 'PM', 'US', 'UK', 'EU', 'ID', 'NO', 'VS'}


# ── commands ───────────────────────────────────────────────────

def cmd_init(a):
    root = git_root()
    target = os.path.abspath(a.dir or os.path.join(root, 'popup'))
    os.makedirs(target, exist_ok=True)
    for f in ('popup.js', 'popup.css'):
        dst = os.path.join(target, f)
        if os.path.exists(dst) and not a.force:
            print(f'keep   {os.path.relpath(dst, root)} (exists — --force to replace)')
        else:
            shutil.copy(os.path.join(ASSETS, f), dst)
            print(f'copy   {os.path.relpath(dst, root)}')
    locales = [x.strip() for x in (a.locales or 'en').split(',') if x.strip()]
    gpath = os.path.join(target, 'glossary.json')
    if os.path.exists(gpath):
        print(f'keep   {os.path.relpath(gpath, root)} (exists)')
    else:
        data = {
            'version': 1, 'defaultLocale': locales[0], 'locales': locales,
            'labels': {loc: dict(zip(LABEL_KEYS, LABELS.get(loc, LABELS['en']))) for loc in locales},
            'categories': {},
            'terms': {},
        }
        save(gpath, data)
        missing = [loc for loc in locales if loc not in LABELS]
        print(f'write  {os.path.relpath(gpath, root)}' + (f' (labels for {",".join(missing)} are English — translate them)' if missing else ''))
    cpath = os.path.join(root, '.popup.json')
    conf = load(cpath) if os.path.exists(cpath) else {}
    rel = os.path.relpath(target, root)
    conf.setdefault('glossary', os.path.join(rel, 'glossary.json'))
    conf.setdefault('assets', rel)
    conf.setdefault('glossaryPage', 'GLOSSARY.md')
    conf.setdefault('docs', ['README.md', 'docs'])
    save(cpath, conf)
    print(f'write  .popup.json')
    print('\nAdd to every page that should explain its terms (adjust the URL to where the folder is served):\n')
    print(f'  <link rel="stylesheet" href="/{rel}/popup.css">')
    print(f'  <script defer src="/{rel}/popup.js" data-glossary="/{rel}/glossary.json"></script>')
    return 0


def merged(paths):
    """Several files (one per locale, or split by topic) are checked as one glossary."""
    out = None
    for p in paths:
        d = load(p)
        if out is None:
            out = copy.deepcopy(d)
            out.setdefault('terms', {})
            continue
        for k in ('labels', 'categories'):
            for kk, v in (d.get(k) or {}).items():
                out.setdefault(k, {}).setdefault(kk, v) if not isinstance(v, dict) else out.setdefault(k, {}).setdefault(kk, {}).update(v)
        for loc in d.get('locales') or []:
            if loc not in out.setdefault('locales', []):
                out['locales'].append(loc)
        for tid, t in d.get('terms', {}).items():
            cur = out['terms'].setdefault(tid, {k: v for k, v in t.items() if k != 'text'})
            for k, v in t.items():
                if k != 'text' and k in cur and cur[k] != v:
                    raise SystemExit(f'{p}: {tid}.{k} differs from an earlier file')
            cur.setdefault('text', {}).update(t.get('text') or {})
    return out


def check(data, base_dir, site_root=None):
    errors, warns = [], []
    terms = data.get('terms')
    if not isinstance(terms, dict):
        return ['no "terms" object'], []
    locales = locales_of(data)
    cats = data.get('categories') or {}
    for loc in locales:
        if len(locales) > 1 and loc not in (data.get('labels') or {}):
            warns.append(f'labels: no "{loc}" — the card shows English labels')
    for tid, t in terms.items():
        where = f'{tid}:'
        if not ID_RE.match(tid):
            errors.append(f'{where} id must be lowercase letters, digits and hyphens')
        for k in t:
            if k not in STRUCT_FIELDS:
                warns.append(f'{where} unknown field "{k}"')
        text = t.get('text') or {}
        if not text:
            errors.append(f'{where} no "text"')
            continue
        for loc in locales:
            tx = text.get(loc)
            if not tx:
                errors.append(f'{where} missing locale "{loc}"')
                continue
            for f in REQUIRED:
                if not str(tx.get(f) or '').strip():
                    errors.append(f'{where} {loc}.{f} is empty')
            for f in tx:
                if f not in TEXT_FIELDS:
                    warns.append(f'{where} {loc}: unknown field "{f}"')
            if str(tx.get('short') or '').rstrip().endswith(('.', '。', '।')):
                warns.append(f'{where} {loc}.short ends with a full stop — write a noun phrase')
        for f in SHARED_OPTIONAL:
            have = [loc for loc in locales if (text.get(loc) or {}).get(f)]
            if have and len(have) != len(locales):
                errors.append(f'{where} "{f}" is in {",".join(have)} but not in {",".join(l for l in locales if l not in have)}')
        # example code is never translated: same lines, same code
        ref = None
        for loc in locales:
            ex = (text.get(loc) or {}).get('example')
            if not ex:
                continue
            codes = [c for c, _ in example_lines(ex)]
            if ref is None:
                ref = (loc, codes)
            elif codes != ref[1]:
                errors.append(f'{where} example code in {loc} differs from {ref[0]} (translate only the notes)')
            if any('`' in c for c in codes):
                errors.append(f'{where} {loc}.example: a backtick inside code ends the code early')
        for r in t.get('related') or []:
            if r == tid:
                errors.append(f'{where} related to itself')
            elif r not in terms:
                errors.append(f'{where} related "{r}" is not in the glossary')
        if t.get('category') and cats and t['category'] not in cats:
            errors.append(f'{where} category "{t["category"]}" is not in "categories"')
        hrefs = [(None, t.get('href'))] + [(loc, (text.get(loc) or {}).get('href')) for loc in locales]
        for loc, href in hrefs:
            if not href:
                continue
            for l2 in ([loc] if loc else locales):
                h = href.replace('{locale}', l2).split('#')[0].split('?')[0]
                if not h or re.match(r'^[a-z]+:', h):
                    continue
                if h.startswith('/'):
                    if not site_root:
                        continue
                    p = os.path.join(site_root, h.lstrip('/'))
                else:
                    p = os.path.join(base_dir, h)
                if not any(os.path.exists(x) for x in (p, p + '.html', p + '.md', os.path.join(p, 'index.html'))):
                    errors.append(f'{where} learn-more link "{href}" ({l2}) points to a missing page: {os.path.relpath(p)}')
                if loc is None and '{locale}' not in href:
                    break
    # context cues, borrowed spellings and avoid patterns point at real things
    scope_names = {t.get('scope') for t in terms.values() if t.get('scope')}
    for tid, t in terms.items():
        for q in t.get('cues') or []:
            if q not in terms and q not in scope_names:
                errors.append(f'{tid}: cue "{q}" is neither a term id nor a scope name')
        for o in t.get('shares') or []:
            if o not in terms:
                errors.append(f'{tid}: shares the spelling of "{o}", which is not in the glossary')
        for loc, pats in (t.get('avoid') or {}).items():
            for pat in pats:
                try:
                    re.compile(pat)
                except re.error as err:
                    errors.append(f'{tid}: avoid pattern ({loc}) does not compile: {err}')
    cues_of = lambda tid: sorted({tid, *(terms[tid].get('cues') if terms[tid].get('cues') is not None else terms[tid].get('related') or [])})
    # shared spellings: both terms need their own cues, or the context can never choose the later one
    scopes = {None} | scope_names
    for loc in locales:
        for scope in scopes:
            owner = {}
            for tid, t in terms.items():
                if t.get('match') is False or t.get('auto') is False or (t.get('scope') or None) != scope:
                    continue
                for s, exact in surfaces(data, tid, loc):
                    k = (s if exact else s.lower(), exact)
                    if k in owner and owner[k] != tid:
                        first = owner[k]
                        if terms[first].get('cues') is None or t.get('cues') is None:
                            errors.append(f'{tid}: {loc} spelling "{s}" is shared with "{first}" — give both terms "cues" so the context can choose (now "{first}" always wins)')
                        elif cues_of(first) == cues_of(tid):
                            errors.append(f'{tid}: {loc} spelling "{s}" is shared with "{first}" with the same cues — the context cannot tell them apart')
                    owner.setdefault(k, tid)
                    if len(s) <= 2 and script(s[0]) == 'LATIN':
                        warns.append(f'{tid}: {loc} spelling "{s}" is two letters — it may match inside other words')
    return errors, sorted(set(warns))


def cmd_check(a):
    conf = project()
    paths = a.glossary or [glossary_path(None, conf)]
    data = merged(paths)
    site = a.site_root or (os.path.join(conf['_root'], conf['siteRoot']) if conf.get('siteRoot') else None)
    errors, warns = check(data, os.path.dirname(os.path.abspath(paths[0])), site)
    for w in warns:
        print('warn  ', w)
    for e in errors:
        print('ERROR ', e)
    n = len(data.get('terms', {}))
    print(f'{n} terms · {len(locales_of(data))} locales ({",".join(locales_of(data))}) · {len(errors)} errors · {len(warns)} warnings')
    return 1 if errors else 0


def cmd_audit(a):
    conf = project()
    gp = glossary_path(a.glossary, conf)
    data = load(gp) if os.path.exists(gp) else {'terms': {}}
    locale = a.locale or data.get('defaultLocale') or 'en'
    matcher = Matcher(data, locale, a.scope)
    known = {s.lower() for tid in data['terms'] for s, _ in surfaces(data, tid, locale)}
    paths = a.paths or [os.path.join(conf['_root'], p) for p in conf.get('docs', ['.'])]
    used, cand, files = {}, {}, 0
    for path in doc_files(paths):
        try:
            raw = open(path, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        files += 1
        text, code = prose(path, raw)
        marked = set(re.findall(r'data-term="([a-z0-9-]+)"', raw)) | set(re.findall(r'GLOSSARY[\w.-]*\.md#([a-z0-9-]+)', raw))
        found, page = {}, {}
        for para in re.split(r'\n\s*\n', text):   # each paragraph is the context of its words (Matcher.resolve)
            for s, e, tid in matcher.find(para, page):
                found.setdefault(tid, []).append(para[s:e])
                page[tid] = page.get(tid, 0) + 1
        rel = os.path.relpath(path)
        if found or marked:
            print(f'\n{rel}')
            for tid, hits in found.items():
                tag = 'marked' if tid in marked else 'auto'
                print(f'  [{tag:6}] {tid:28} ×{len(hits):<3} "{hits[0]}"')
            for tid in sorted(marked - set(found)):
                print(f'  [marked] {tid:28} (explicit markup)' + ('' if tid in data['terms'] else '  ← NOT IN GLOSSARY'))
        for tid, hits in found.items():
            used.setdefault(tid, set()).add(rel)
        for chunk in [text] + code:
            for rx in CANDIDATE_RES:
                for m in rx.finditer(chunk):
                    w = m.group(1)
                    if w in COMMON_UPPER or w.lower() in known or len(w) < 2:
                        continue
                    c = cand.setdefault(w, [0, set()])
                    c[0] += 1
                    c[1].add(rel)
        for c in code:
            w = c.strip()
            if re.match(r'^[\w.-]{2,30}$', w) and w.lower() not in known:
                cc = cand.setdefault(w, [0, set()])
                cc[0] += 1
                cc[1].add(rel)
    print(f'\n{files} files · {len(used)} glossary terms used · locale {locale}' + (f' · scope {a.scope}' if a.scope else ''))
    unused = [tid for tid in data['terms'] if tid not in used and data['terms'][tid].get('match') is not False]
    if unused and a.paths is None:
        print('glossary terms not found in these docs:', ', '.join(unused[:30]) + (' …' if len(unused) > 30 else ''))
    if cand:
        print(f'\ncandidates — jargon with no glossary entry (count · files). Words in your own language are not detected: read the text too.')
        ranked = sorted(cand.items(), key=lambda kv: (-len(kv[1][1]), -kv[1][0], kv[0].lower()))[:a.top]
        for w, (n, fs) in ranked:
            print(f'  {w:30} ×{n:<4} {len(fs)} file(s)')
    return 0


def cmd_add(a):
    conf = project()
    gp = glossary_path(a.glossary, conf)
    data = load(gp)
    inp = load(a.input)
    new = copy.deepcopy(data)
    changes, refused = [], []
    for k in ('labels', 'categories'):
        for kk, v in (inp.get(k) or {}).items():
            had = kk in new.get(k, {})
            cur = new.setdefault(k, {}).setdefault(kk, {} if isinstance(v, dict) else v)
            changed = not had
            if isinstance(v, dict):
                for f, val in v.items():
                    if f in cur and cur[f] != val and not a.overwrite:
                        refused.append(f'{k}.{kk}.{f}')
                    elif cur.get(f) != val:
                        cur[f] = val
                        changed = True
            elif cur != v:
                if a.overwrite:
                    new[k][kk] = v
                    changed = True
                else:
                    refused.append(f'{k}.{kk}')
            if changed:
                changes.append(f'{k}.{kk}')
    for tid, t in (inp.get('terms') or {}).items():
        cur = new['terms'].get(tid)
        if cur is None:
            new['terms'][tid] = t
            changes.append(f'+ {tid}')
            continue
        for f, v in t.items():
            if f == 'text':
                for loc, tx in v.items():
                    ct = cur.setdefault('text', {}).setdefault(loc, {})
                    for ff, vv in tx.items():
                        if ff in ct and ct[ff] != vv and not a.overwrite:
                            refused.append(f'{tid}.text.{loc}.{ff}')
                        elif ct.get(ff) != vv:
                            ct[ff] = vv
                            changes.append(f'~ {tid}.{loc}.{ff}')
            elif f in cur and cur[f] != v and not a.overwrite:
                refused.append(f'{tid}.{f}')
            elif cur.get(f) != v:
                cur[f] = v
                changes.append(f'~ {tid}.{f}')
    for r in refused:
        print('REFUSED', r, '(already has a different value — --overwrite to replace)')
    errors, warns = check(new, os.path.dirname(os.path.abspath(gp)))
    for w in warns:
        print('warn  ', w)
    for e in errors:
        print('ERROR ', e)
    for c in changes:
        print(c)
    if errors or refused:
        print('nothing written')
        return 1
    if not changes:
        print(f'nothing to change — {gp} already has all of it')
        return 0
    if a.dry_run:
        print(f'dry run — {len(changes)} change(s) would be written to {gp}')
        return 0
    save(gp, new)
    print(f'wrote {gp} — {len(changes)} change(s), {len(new["terms"])} terms')
    return 0


def cmd_show(a):
    conf = project()
    data = load(glossary_path(a.glossary, conf))
    if a.id not in data['terms']:
        close = [t for t in data['terms'] if a.id.lower() in t or any(a.id.lower() == s.lower() for s, _ in surfaces(data, t, a.locale or data.get('defaultLocale', 'en')))]
        print(f'no "{a.id}"' + (f' — did you mean: {", ".join(close)}' if close else ''))
        return 1
    t = data['terms'][a.id]
    print(json.dumps({k: v for k, v in t.items() if k != 'text'}, ensure_ascii=False))
    for loc, tx in (t.get('text') or {}).items():
        if a.locale and loc != a.locale:
            continue
        print(f'\n[{loc}]')
        for f in TEXT_FIELDS:
            if tx.get(f):
                print(f'  {f}: {tx[f]}')
    return 0


def cmd_md(a):
    conf = project()
    gp = glossary_path(a.glossary, conf)
    data = load(gp)
    locale = a.locale or data.get('defaultLocale') or 'en'
    labels = dict(zip(LABEL_KEYS, LABELS['en']))
    labels.update((data.get('labels') or {}).get(locale) or {})
    out = a.out or os.path.join(conf['_root'], conf.get('glossaryPage', 'GLOSSARY.md'))
    out_dir = os.path.dirname(os.path.abspath(out))
    cats = data.get('categories') or {}
    groups = {}
    for tid, t in data['terms'].items():
        groups.setdefault(t.get('category') or '', []).append(tid)
    lines = [f'# {labels["dialog"]}', '', '<!-- generated by popup.py md from ' + os.path.relpath(gp, out_dir) + ' — edit the glossary, not this file -->', '']
    for cat, ids in groups.items():
        if cat:
            c = cats.get(cat, cat)
            lines += [f'## {c.get(locale, cat) if isinstance(c, dict) else c}', '']
        for tid in sorted(ids, key=lambda i: text_of(data, i, locale).get('term', i).lower()):
            t, s = data['terms'][tid], text_of(data, tid, locale)
            head = s.get('term', tid) + (f' · {s["reading"]}' if s.get('reading') else '')
            lines += [f'<a id="{tid}"></a>', f'### {head}', '', f'**{s.get("short", "")}**', '', s.get('long', ''), '']
            if s.get('easy'):
                lines += [f'> 💡 **{labels["easy"]}** — {s["easy"]}', '']
            if s.get('example'):
                lines += [f'**{labels["example"]}**', '']
                for code, note in example_lines(s['example']):
                    lines.append(f'- `{code}` {note}'.rstrip() if code else f'- {note}')
                lines.append('')
            if s.get('code'):
                lines += ['```' + (t.get('codeLang') or ''), s['code'], '```', '']
            rel = [r for r in t.get('related') or [] if r in data['terms']]
            if rel:
                lines += [f'{labels["related"]}: ' + ' · '.join(f'[{text_of(data, r, locale).get("term", r)}](#{r})' for r in rel), '']
            href = s.get('href') or t.get('href')
            if href:
                href = href.replace('{locale}', locale)
                if not re.match(r'^([a-z]+:|/|#)', href):
                    href = os.path.relpath(os.path.join(os.path.dirname(os.path.abspath(gp)), href), out_dir)
                lines += [f'[{labels["more"]} →]({href})', '']
    with open(out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines).rstrip() + '\n')
    print(f'wrote {os.path.relpath(out)} — {len(data["terms"])} terms ({locale})')
    return 0


LINK_RE = re.compile(r'\[([^\]\n]+)\]\(([^)\s]*GLOSSARY[\w.-]*\.md)#([a-z0-9-]+) "[^"\n]*"\)')


def protect(line):
    """Spans of a Markdown line that must not be touched: code, links, images, HTML tags, URLs."""
    spans = []
    for rx in (r'`[^`]*`', r'!?\[[^\]]*\]\([^)]*\)', r'\[[^\]]*\]\[[^\]]*\]', r'<[^>]+>', r'https?://\S+', r'\{\{.*?\}\}'):
        spans += [(m.start(), m.end()) for m in re.finditer(rx, line)]
    return spans


def cmd_link(a):
    conf = project()
    data = None
    if not a.unlink:
        gp = glossary_path(a.glossary, conf)
        data = load(gp)
        locale = a.locale or data.get('defaultLocale') or 'en'
        matcher = Matcher(data, locale, a.scope)
    page = os.path.abspath(a.page or os.path.join(conf['_root'], conf.get('glossaryPage', 'GLOSSARY.md')))
    paths = a.paths or [os.path.join(conf['_root'], p) for p in conf.get('docs', ['.'])]
    total = 0
    for path in doc_files(paths):
        if not path.lower().endswith(('.md', '.markdown')) or os.path.abspath(path) == page:
            continue
        raw = open(path, encoding='utf-8').read()
        if a.unlink:
            new = LINK_RE.sub(r'\1', raw)
            n = len(LINK_RE.findall(raw))
        else:
            target = os.path.relpath(page, os.path.dirname(os.path.abspath(path)))
            already = set(m.group(3) for m in LINK_RE.finditer(raw))
            seen, out, n, fence = set(already), [], 0, None
            front = raw.startswith('---\n')
            for li, line in enumerate(raw.split('\n')):
                st = line.lstrip()
                if front:
                    out.append(line)
                    if li > 0 and st.startswith('---'):
                        front = False
                    continue
                if fence:
                    out.append(line)
                    if st.startswith(fence):
                        fence = None
                    continue
                if st.startswith(('```', '~~~')):
                    fence = st[:3]
                    out.append(line)
                    continue
                if st.startswith('#') or line.startswith('    ') or st.startswith('<'):
                    out.append(line)
                    continue
                spans = protect(line)
                pieces, last = [], 0
                for s, e, tid in matcher.find(line):
                    if tid in seen or any(ps <= s < pe or ps < e <= pe for ps, pe in spans):
                        continue
                    seen.add(tid)
                    # a title is one line in quotes; "|" would split a table cell, so it is escaped (GitHub shows "|")
                    short = re.sub(r'\s+', ' ', text_of(data, tid, locale).get('short', '')).replace('"', "'").replace('|', '\\|')
                    pieces += [line[last:s], f'[{line[s:e]}]({target}#{tid} "{short}")']
                    last = e
                    n += 1
                out.append(''.join(pieces) + line[last:] if pieces else line)
            new = '\n'.join(out)
        if n:
            total += n
            print(f'{os.path.relpath(path)}: {n} link(s) {"removed" if a.unlink else "added"}')
            if a.write:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new)
    print(('' if a.write else 'dry run — add --write to save. ') + f'{total} link(s) in total')
    return 0


def cmd_senses(a):
    conf = project()
    data = load(glossary_path(a.glossary, conf))
    locale = a.locale or data.get('defaultLocale') or 'en'
    m = Matcher(data, locale, a.scope)
    n = 0
    for first in m.by_first.values():
        for s, _, cands in first:
            if len(cands) < 2 and not m.needs_context(cands[0]):
                continue
            n += 1
            print(f"'{s}'")
            for c in cands:
                tid = c.lstrip('~')
                t = data['terms'][tid]
                how = '(borrowed) ' if c.startswith('~') else '(only with evidence) ' if t.get('context') else ''
                cues = t.get('cues') if t.get('cues') is not None else t.get('related') or []
                print(f"   {tid:20} {how}{text_of(data, tid, locale).get('short', '')} — cues: {', '.join(cues)}")
    print(f'{n} spelling(s) with several meanings or needing evidence · locale {locale}')
    return 0


def cmd_index(a):
    """Sense index — every place a glossary spelling is found in the docs, the meaning picked by context, the scores. SQLite + FTS5."""
    import sqlite3
    conf = project()
    out = a.out or os.path.join(conf['_root'], '.popup-index.sqlite')
    if a.query:
        if not os.path.exists(out):
            raise SystemExit(f'no index at {out} — run: popup.py index PATH…')
        db = sqlite3.connect(out)
        rows = db.execute('SELECT file, surface, chosen, legacy, candidates, sentence FROM hits WHERE chosen = ? OR legacy = ? OR lower(surface) = lower(?) '
                          'ORDER BY chosen IS NULL DESC, file', (a.query,) * 3).fetchall()
        for f, surface, chosen, legacy, cands, sentence in rows:
            changed = f'  (first candidate: {legacy})' if chosen != legacy else ''
            print(f'{f}  →  {chosen or "left plain"}{changed}\n    {sentence}\n    scores {cands}')
        print(f'{len(rows)} place(s)')
        return 0
    data = load(glossary_path(a.glossary, conf))
    locale = a.locale or data.get('defaultLocale') or 'en'
    m = Matcher(data, locale, a.scope)
    topics = [x for x in (a.topic or '').split(',') if x]
    if os.path.exists(out):
        os.remove(out)
    db = sqlite3.connect(out)
    db.executescript('''CREATE TABLE terms (id TEXT PRIMARY KEY, category TEXT, term TEXT, short TEXT, scope TEXT, context INTEGER, cues TEXT);
        CREATE TABLE surfaces (surface TEXT, candidates TEXT);
        CREATE TABLE texts (file TEXT, paragraph INTEGER, text TEXT);
        CREATE TABLE hits (file TEXT, surface TEXT, offset INTEGER, chosen TEXT, legacy TEXT, candidates TEXT, margin INTEGER, sentence TEXT);
        CREATE INDEX hits_chosen ON hits(chosen); CREATE INDEX hits_surface ON hits(surface);''')
    try:
        db.execute('CREATE VIRTUAL TABLE texts_fts USING fts5(file UNINDEXED, text)')
        fts = True
    except sqlite3.OperationalError:
        fts = False   # SQLite built without FTS5 — plain LIKE on texts still works
    for tid, t in data['terms'].items():
        cues = t.get('cues') if t.get('cues') is not None else t.get('related') or []
        db.execute('INSERT INTO terms VALUES (?,?,?,?,?,?,?)', (tid, t.get('category'), text_of(data, tid, locale).get('term'), text_of(data, tid, locale).get('short'),
                                                                t.get('scope'), int(t.get('context') is True), ','.join(cues)))
    for first in m.by_first.values():
        for s, _, cands in first:
            if len(cands) > 1 or m.needs_context(cands[0]):
                db.execute('INSERT INTO surfaces VALUES (?,?)', (s, ','.join(cands)))
    stats = {'files': 0, 'hits': 0, 'ambiguous': 0, 'changed': 0, 'plain': 0}
    review = []
    paths = a.paths or [os.path.join(conf['_root'], p) for p in conf.get('docs', ['.'])]
    for path in doc_files(paths):
        try:
            raw = open(path, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        stats['files'] += 1
        rel = os.path.relpath(path)
        page = {}
        for n, para in enumerate(x.strip() for x in re.split(r'\n\s*\n', prose(path, raw)[0])):
            if not para:
                continue
            db.execute('INSERT INTO texts VALUES (?,?,?)', (rel, n, para))
            if fts:
                db.execute('INSERT INTO texts_fts VALUES (?,?)', (rel, para))
            for s, e, tid, scores in m.resolve(para, page, topics):
                stats['hits'] += 1
                legacy = next(iter(scores))
                ok = sorted((v[0] for v in scores.values() if v[1]), reverse=True)
                margin = (ok[0] if ok else 0) - (ok[1] if len(ok) > 1 else 0) if len(scores) > 1 else None
                st = max([b.end() for b in SENTENCE_END.finditer(para, 0, s)] or [0])
                en = SENTENCE_END.search(para, e)
                sentence = (para[st:s] + '【' + para[s:e] + '】' + para[e:en.end() if en else len(para)]).strip()
                cands = json.dumps({k: f"{v[0]}{'' if v[1] else (' avoid' if v[2] else ' ×')}" for k, v in scores.items()}, ensure_ascii=False)
                db.execute('INSERT INTO hits VALUES (?,?,?,?,?,?,?,?)', (rel, para[s:e], s, tid, legacy, cands, margin, sentence))
                if tid:
                    page[tid] = page.get(tid, 0) + 1
                if len(scores) > 1 or tid is None or m.needs_context(legacy):
                    stats['ambiguous'] += 1
                    stats['changed'] += int(tid is not None and tid != legacy)
                    stats['plain'] += int(tid is None)
                    if margin is not None and margin < 10:
                        review.append(f'{rel:40} {tid or "left plain":18} {sentence[:100]}')
    db.commit()
    print(f'{os.path.relpath(out)} — {stats["files"]} files · {stats["hits"]} spellings found · {stats["ambiguous"]} with several meanings or needing evidence '
          f'({stats["changed"]} not the first candidate · {stats["plain"]} left plain) · locale {locale}')
    for surface, chosen, n in db.execute("SELECT lower(surface), coalesce(chosen, '(left plain)'), count(*) FROM hits WHERE surface IN (SELECT surface FROM surfaces) "
                                         "OR chosen IS NULL OR chosen <> legacy GROUP BY 1, 2 ORDER BY 1, 3 DESC"):
        print(f'   {surface:24} {chosen:24} {n}')
    if review:
        print('\nto review — the nearby context was equal, so the page or glossary order decided (popup.py index --query <id>):')
        for line in review[:40]:
            print('  ', line)
    return 0


def main():
    p = argparse.ArgumentParser(prog='popup.py', description='glossary tool for the popup skill')
    sub = p.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('init', help='copy the popup kit into the project')
    s.add_argument('dir', nargs='?')
    s.add_argument('--locales')
    s.add_argument('--force', action='store_true')
    s = sub.add_parser('check', help='validate the glossary')
    s.add_argument('glossary', nargs='*')
    s.add_argument('--site-root')
    s = sub.add_parser('audit', help='terms a document uses, and jargon with no entry')
    s.add_argument('paths', nargs='*', default=None)
    s.add_argument('--glossary')
    s.add_argument('--locale')
    s.add_argument('--scope')
    s.add_argument('--top', type=int, default=40)
    s = sub.add_parser('add', help='merge terms into the glossary')
    s.add_argument('input')
    s.add_argument('--glossary')
    s.add_argument('--dry-run', action='store_true')
    s.add_argument('--overwrite', action='store_true')
    s = sub.add_parser('show', help='print one entry')
    s.add_argument('id')
    s.add_argument('--glossary')
    s.add_argument('--locale')
    s = sub.add_parser('md', help='write a Markdown glossary page')
    s.add_argument('--glossary')
    s.add_argument('--locale')
    s.add_argument('--out')
    s = sub.add_parser('link', help='link the first use of each term in Markdown files to the glossary page')
    s.add_argument('paths', nargs='*', default=None)
    s.add_argument('--glossary')
    s.add_argument('--locale')
    s.add_argument('--scope')
    s.add_argument('--page')
    s.add_argument('--unlink', action='store_true')
    s.add_argument('--write', action='store_true')
    s = sub.add_parser('senses', help='spellings with several meanings → candidates and their context cues')
    s.add_argument('--glossary')
    s.add_argument('--locale')
    s.add_argument('--scope')
    s = sub.add_parser('index', help='sense index: every place a term is found and the meaning chosen by context (SQLite)')
    s.add_argument('paths', nargs='*', default=None)
    s.add_argument('--glossary')
    s.add_argument('--locale')
    s.add_argument('--scope')
    s.add_argument('--topic', help='comma-separated topics (term ids or scope names) of these docs')
    s.add_argument('--out', help='SQLite file (default .popup-index.sqlite at the git root)')
    s.add_argument('--query', help='look one word or id up in an existing index')
    a = p.parse_args()
    if getattr(a, 'paths', None) == []:
        a.paths = None
    return {'init': cmd_init, 'check': cmd_check, 'audit': cmd_audit, 'add': cmd_add, 'show': cmd_show, 'md': cmd_md, 'link': cmd_link,
            'senses': cmd_senses, 'index': cmd_index}[a.cmd](a)


if __name__ == '__main__':
    sys.exit(main())
