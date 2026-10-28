---
name: popup
description: 용어 팝업 — 어떤 프로젝트든 웹 페이지·문서·README 의 전문 용어·기술 용어·낱말·개념·문장에 마우스를 올리면(휴대폰은 탭) 뜻·쉬운 설명·비유·예시·소스 코드·관련 용어·'더 알아보기' 링크가 담긴 설명 팝업이 뜨게 만든다. 뜻이 여럿인 낱말(branch·skill)은 문맥을 분석해 그 문장의 뜻으로 설명하고, 용어 자리를 SQLite 뜻 색인으로 점검한다. Explain jargon in any project with hover/tap popups — one glossary JSON as the single source, a drop-in popup.js/css with no build step, a checker, a doc audit that finds undefined jargon, and Markdown links with hover titles for READMEs, context-aware meanings and a SQLite sense index. Use it whenever the user wants tooltips, hover definitions, a glossary, term explanations, "explain this word", beginner-friendly docs, or "/popup …" — e.g. "이 문서 용어에 팝업", "툴팁으로 설명", "용어 사전 만들어", "add glossary popups to the docs", "define these terms on hover", or "팝업 뜻이 문맥과 안 맞다". In SONUB (sonub.com) it builds on the existing Laravel glossary (17 languages, Lyen's voice) — read references/projects/sonub.md first.
license: MIT
compatibility: Python 3.8+ for scripts/popup.py. The popup kit is plain JavaScript and CSS for any modern browser (no framework, no build). SONUB tools need its docker compose app container.
---

# popup — explain every hard word where the reader meets it

A reader stops at one unknown word ("token", "endpoint", "idempotent") and loses the whole paragraph. This skill puts a small card on that word: hover it (tap on a phone, focus with the keyboard) and it shows

```
┌──────────────────────────────────────────┐
│ API  A-P-I  [Web]                      ✕ │  term · reading · category
│ The agreed way one program asks another  │  short — one line, bold
│ An API is a list of requests a program…  │  long — two or three sentences
│ ┃ 💡 In plain words  Like a menu: …       │  easy — one everyday comparison
│ ✏️ Example  `GET /users/42` asks for…     │  example — one line each, code + note
│ ┌ json ───────────────────── [Copy] ┐    │  code — a source snippet
│ └───────────────────────────────────┘    │
│ Related (endpoint) (JSON)                │  related — chips switch the card in place
│ Learn more →                             │  href — another page of this project
└──────────────────────────────────────────┘
```

**Talk in the user's language.** References are in English (the SONUB profile is in Korean). Keep code, paths and field names as they are.

## 🛑 Rules

1. **Look for the project's own system first.** Search for an existing glossary/tooltip/popup (`grep -ril "glossary\|tooltip\|data-term" --include=*.{js,ts,php,json,md}`), and read the project's AGENTS.md / CLAUDE.md. If one exists, extend it — never add a second popup system. **SONUB** (repo has `app/Content/Glossary.php` and `SONUB-SSOT.md`): stop here and follow [references/projects/sonub.md](references/projects/sonub.md).
2. **One glossary, one place.** Every explanation lives in the glossary JSON, never typed into a page. Pages only point at term ids. Ids (`api-key`) never change once used.
3. **Write for someone who has never seen the word** — [references/content.md](references/content.md). Every locale the project ships gets every term, in the same change.
4. **Only verified facts.** Numbers, versions and behaviour you put in a card are checked (docs, running the code). A wrong popup teaches the wrong thing to every reader.
5. **The meaning of this sentence, or no popup.** One spelling can mean several things ("branch": Git · a branch of a science; "skill": agent skill · ability). Every meaning that is jargon gets its own entry with `cues`; everyday words get `context: true`; phrases with another meaning go to `avoid`. A wrong-meaning popup is worse than none — [content.md](references/content.md#words-with-several-meanings).
6. **Don't underline everything.** Wrap the first use per page/section; three or four underlines per paragraph at most.
7. **Index before and after.** When you add a term or change cues, build the sense index (`popup.py index`) and read where the meaning changed, where words were left plain, and where the context was a tie — not just the page you were asked about.
8. **Not done until seen.** Run `popup.py check` and open the page in a browser (hover, tap, Esc, narrow screen). Say what you could not check.

## The kit

| File | What |
| --- | --- |
| `assets/popup.js` | Finds glossary terms in plain text and wraps the first use; one card for the whole page; hover/tap/keyboard/Esc; pin on click; related chips; bottom sheet ≤ 640px; RTL; no dependencies. API: `PopupGlossary.apply(el)` after a re-render |
| `assets/popup.css` | Theme with `--popup-accent`, `--popup-bg`, `--popup-fg`… Dark mode by `prefers-color-scheme` or `[data-theme=dark]`/`.dark` |
| `assets/glossary.example.json` | Every field in use (en + ko, a scoped term, a sentence entry, code, a `context` word with `cues`, an `avoid` pattern) |
| `assets/demo.html` | Open it to see and test the behaviour (`python3 -m http.server` in `assets/`) |

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## Glossary format (short)

```json
{
  "defaultLocale": "en", "locales": ["en", "ko"],
  "labels":     { "ko": { "easy": "쉽게 말하면", "more": "더 알아보기", … } },
  "categories": { "web": { "en": "Web", "ko": "웹" } },
  "terms": {
    "api": {
      "category": "web", "aliases": ["API", "APIs"], "related": ["endpoint"], "href": "../docs/api.md",
      "text": {
        "en": { "term": "API", "short": "…", "long": "…", "easy": "…", "example": "`GET /users/42` asks for user 42" },
        "ko": { "term": "API", "reading": "에이피아이", "short": "…", "long": "…", "easy": "…", "example": "`GET /users/42` 42번 사용자 요청" }
      }
    }
  }
}
```

Required per locale: `term`, `short`, `long`. Optional: `easy`, `example`, `code` (if one locale has it, all do), `reading`, `aliases`, `href` (per locale). Per term: `category`, `aliases` (language-independent spellings), `related`, `href` (relative to the JSON file; `{locale}` is replaced), `codeLang`, `scope`, `match: false` (sentences and concepts — only explicit markup), `case: true` / `exact: [...]` (case-sensitive spellings like `cat` or `PATH`). Several meanings: `cues` (ids that show this meaning nearby), `context: true` (everyday word — only with evidence), `shares` (borrow another term's spellings), `avoid` (per-locale phrases with another meaning). Full rules: [content.md](references/content.md#term-settings).

```json
"branch":  { "category": "dev", "aliases": ["branch", "branches"], "context": true, "cues": ["git", "commit", "repository"], … },
"grok":    { "category": "ai", "exact": ["Grok"], "cues": ["llm", "gemini", "claude"], … },
"grok-cli":{ "category": "ai", "exact": ["Grok"], "cues": ["claude-code", "codex", "terminal"], … },
"neural-network": { "shares": ["network"], "cues": ["weight", "activation-function"], … },
"skill":   { "cues": ["skill-md", "mcp"], "avoid": { "en": ["\\bin\\s+skill\\b", "\\bmost important\\s+skills?\\b"] }, … }
```

## Workflow — `/popup <request>`

The request says what to focus on: `/popup the Getting Started page`, `/popup token, sampling, temperature`, `/popup the top menu`, `/popup README for beginners`. Read it as narrowly as it allows.

1. **Find the target** — which pages/files, which section. Then rule 1: does the project already have a system?
2. **Set up (first time only)** — `python3 scripts/popup.py init [dir] --locales en,ko` copies the kit, writes an empty glossary with popup labels for those languages, and `.popup.json` (paths every later command reads). Add the two tags to the layout/template, or follow [references/integrate.md](references/integrate.md) for the stack (static HTML, Markdown/GitHub, MkDocs, Docusaurus, VitePress, React/Vue/Svelte, server templates, apps).
3. **Audit** — `python3 scripts/popup.py audit docs/guide.md` lists the glossary terms each file already uses and **candidates**: acronyms, camelCase and `code` words with no entry. Words in the user's own language are not detected — read the text and pick them yourself.
4. **Choose** — words a newcomer stops at; words without which the paragraph is lost; words that repeat across the project (one entry pays off many times). Skip everyday words and words the text explains right there.
5. **Write** the entries ([content.md](references/content.md)): every locale, facts checked, an example whenever a real one exists, `href` to the page of this project that goes deeper. Put them in one input file and merge: `popup.py add new-terms.json --dry-run`, then without `--dry-run` (refuses to overwrite unless `--overwrite`).
6. **Context** — for every new term, ask "does this spelling mean something else anywhere on the site?" (`popup.py senses`, `popup.py index --query <word>`). Give each jargon meaning `cues`, mark everyday words `context: true`, add `avoid` for phrases that still pick wrong, and declare section topics with `data-popup-topic="git"` where the words alone are not enough. Rebuild the index and read the changed / plain / tie lists.
7. **Attach** — plain text inside `main`/`article`/`[data-popup-root]` is wrapped automatically. Explicit markup for the rest ([references/design.md](references/design.md#triggers)): `<span data-term="id">…</span>` for inflected forms and sentences, `<button class="popup-info" data-term="id"></button>` next to links/cards/headings, `data-term` on a link for a 400 ms hover preview, `data-popup-scope="shell"` for words whose meaning depends on the section. For Markdown that is read on GitHub (no JavaScript): `popup.py md` writes `GLOSSARY.md` and `popup.py link docs --write` links the first use in each file with the short meaning as the hover title.
8. **Verify** — below.

## Verify

```bash
python3 scripts/popup.py check            # fields in every locale, example code identical across locales, related ids,
                                          # learn-more targets exist, spelling clashes between terms (exit 1 on errors)
python3 scripts/popup.py audit <files>    # the new terms are now found in the text
python3 scripts/popup.py index <docs>     # sense index: which meaning each spelling got, everywhere (SQLite .popup-index.sqlite)
```

Then the browser: drag-select a paragraph with underlined words and paste — the words are there (a CSS kit's `button { user-select: none }` drops them; see [design.md](references/design.md#things-that-broke-before)) → hover (opens) → move slowly onto the card across the next line (stays) → move away (closes) → click (stays) → related chip (switches) → Esc (closes, focus back on the word) → Tab to a term (opens) → "learn more" lands on the right page → narrow width (bottom sheet) → another locale → RTL if shipped → dark theme if the site has one. If no browser tool is available, say so in the report.

## Report

Files changed, terms added (ids, locales), pages wrapped, words with several meanings and how each is told apart (cues/context/avoid), `check` and `index` results (changed / left plain / ties), what you saw in the browser, what you could not check.

## References

- [references/content.md](references/content.md) — writing a card a beginner understands in one read: each field's job and length, style rules (one comparison, no jargon inside the explanation, facts only, don't speak of AI as a person), kinds of entries (word, concept, sentence, command, menu, screen help), aliases and false matches, many languages and translation helpers, a complete example.
- [references/design.md](references/design.md) — how the card looks and behaves and why: reading order, triggers, timing (300 ms close, a safe path from the word to the card, 400 ms for links), pin, one card with in-place switching, bottom sheet, accessibility, RTL, theming, matching rules per script (Latin, Cyrillic, Hangul particles, Arabic prefixes, CJK), things that broke before.
- [references/integrate.md](references/integrate.md) — wiring the kit into each kind of project, per-locale glossary files, single-page apps, server-side wrapping, using the glossary JSON from non-web apps, and how to build on a project's existing system.
- [references/projects/sonub.md](references/projects/sonub.md) — **SONUB only** (Korean): the Laravel glossary (`App\Content\Glossary`, `<x-glossary.text>`, 17 languages), screens already covered, Lyen's voice (DeepSeek + Supertonic), and the SONUB scripts (`scripts/sonub/run.sh …`).

## scripts/popup.py

| Command | Does |
| --- | --- |
| `init [DIR] [--locales en,ko] [--force]` | copy `popup.js`/`popup.css`, write `glossary.json` (popup labels in 17 languages built in) and `.popup.json` |
| `check [FILES…] [--site-root DIR]` | validate; several files (one per locale) are checked as one glossary. `--site-root` also checks `/absolute` links |
| `audit [PATHS…] [--locale] [--scope] [--top N]` | per file: terms found (`auto`) or marked by hand (`marked`), then candidates ranked by how many files use them |
| `add INPUT.json [--dry-run] [--overwrite]` | merge `{"terms": {…}, "labels": {…}, "categories": {…}}`; runs `check` on the result and writes nothing if it fails |
| `show ID [--locale]` | print one entry (suggests ids when not found) |
| `md [--locale] [--out]` | write the glossary as a Markdown page, an anchor per id |
| `link [PATHS…] [--write] [--unlink]` | Markdown: first use of each term per file → `[word](GLOSSARY.md#id "short")`; skips code, links, headings, HTML, front matter; `--unlink` removes them again |
| `senses [--locale] [--scope]` | spellings with several meanings (or needing evidence) → candidate ids, how each is told apart, their cues |
| `index [PATHS…] [--locale] [--scope] [--topic] [--out]` | the sense index: every spelling found in the docs, per paragraph, with the meaning chosen by context and the scores → SQLite (`terms`, `surfaces`, `texts` + FTS5, `hits`); prints the meaning counts per spelling and the ties to review |
| `index --query WORD\|ID [--out]` | every sentence where that word or meaning was found, with the meaning chosen |

Paths default to `.popup.json` at the git root (`glossary`, `glossaryPage`, `docs`, `siteRoot`).
