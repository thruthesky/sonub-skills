# Wiring it into a project

The kit is two static files and a JSON. Where they go depends on the stack. In every case: **one glossary JSON is the source**, pages only reference ids.

## Contents

- [Before anything: an existing system?](#before-anything-an-existing-system)
- [Static HTML](#static-html)
- [Markdown read on GitHub (no JavaScript)](#markdown-read-on-github-no-javascript)
- [Documentation sites](#documentation-sites)
- [Single-page apps (React, Vue, Svelte, Angular)](#single-page-apps-react-vue-svelte-angular)
- [Server-rendered sites (Laravel, Rails, Django, PHP)](#server-rendered-sites-laravel-rails-django-php)
- [Languages](#languages)
- [Non-web apps](#non-web-apps)
- [.popup.json](#popupjson)

## Before anything: an existing system?

```bash
grep -rilE "glossary|tooltip|popover|data-term|abbr title" --include=*.{js,ts,tsx,vue,svelte,php,py,rb,json,md,html} . | grep -v node_modules | head
```

If the project already explains terms somewhere (a glossary page, a tooltip component, a terms table), **build on it**: move its data into the glossary JSON (or point the kit at its data), keep its look, and remove the duplicate. Two systems drift apart and nobody knows which to edit. If the project's system is a framework component that already does the job well, keep it and use only this skill's content rules, `check` and `audit` (convert its data to the JSON format, or write a tiny exporter).

## Static HTML

```bash
python3 <skill>/scripts/popup.py init site/popup --locales en
```

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

Put the tags in the shared header/layout so every page gets them. Text inside `<main>`/`<article>` is wrapped automatically; otherwise add `data-popup-root` to the content container or set `data-root=".content"`.

## Markdown read on GitHub (no JavaScript)

GitHub, GitLab and most Markdown viewers don't run scripts, but they do show a link's **title** on hover. So:

```bash
python3 <skill>/scripts/popup.py md                    # GLOSSARY.md — every term, an anchor per id
python3 <skill>/scripts/popup.py link README.md docs   # dry run: what would be linked
python3 <skill>/scripts/popup.py link README.md docs --write
```

The first use of each term in each file becomes `[API](GLOSSARY.md#api "The agreed way one program asks another")` — hover shows the one-line meaning, click opens the full entry (example, code, related, learn more). Code blocks, inline code, existing links, headings, HTML lines and front matter are left alone. Re-run `md` after editing the glossary; `link --unlink --write` removes the links again (e.g. before re-linking). One `GLOSSARY.<locale>.md` per language: `md --locale ko --out GLOSSARY.ko.md`, `link docs/ko --locale ko --page GLOSSARY.ko.md`.

## Documentation sites

The JSON + two files work the same; only where the tags go differs.

| Generator | Assets folder | Where the tags go |
| --- | --- | --- |
| MkDocs (Material) | `docs/popup/` | `mkdocs.yml`: `extra_css: [popup/popup.css]`, `extra_javascript: [popup/popup.js]` — then set the glossary path with a small script before it: `window.PopupGlossaryOptions = { glossary: '/popup/glossary.json', root: 'article' }` (`extra_javascript` can't add data attributes). For instant navigation, call `PopupGlossary.apply(document.querySelector('article'))` on `document$.subscribe` |
| Docusaurus | `static/popup/` | `docusaurus.config.js`: `stylesheets: ['/popup/popup.css']`, `scripts: [{src: '/popup/popup.js', defer: true, 'data-glossary': '/popup/glossary.json', 'data-root': 'article'}]`; route changes: a client module calling `PopupGlossary.apply(document.querySelector('article'))` in `onRouteDidUpdate` |
| VitePress | `public/popup/` | `config.mts` `head`: the `<link>` and `<script>`; in `.vitepress/theme/index.ts` call `PopupGlossary.apply(...)` in `router.onAfterRouteChanged` (after `nextTick`) |
| Jekyll / Hugo / Eleventy / Astro | `assets/popup/` or `static/popup/` | the base layout's `<head>` |
| Sphinx | `_static/popup/` | `conf.py`: `html_css_files`, `html_js_files = [('popup/popup.js', {'defer': 'defer', 'data-glossary': '_static/popup/glossary.json'})]` |

## Single-page apps (React, Vue, Svelte, Angular)

Load the two files once (in `index.html` or the root layout), then after content renders call `PopupGlossary.apply(container)` — wrapping is idempotent (already-wrapped words are skipped). Re-call after route changes or when content arrives.

```jsx
// React — a content component
const ref = useRef(null);
useEffect(() => { window.PopupGlossary?.ready.then(() => PopupGlossary.apply(ref.current)); }, [html]);
return <article ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
```

- Don't let the framework re-render a container whose text nodes popup.js replaced (keyed re-mount it, or wrap only static/Markdown-rendered content). For framework-owned text, prefer explicit markup: `<span data-term="api">API</span>` in JSX/templates — no DOM rewriting needed.
- `PopupGlossary.load(url, locale)` switches language without a reload.
- Prefer a native component of the app's UI library? Use `PopupGlossary.entry(id)` to get the resolved entry (texts, examples, related, absolute href) and render it yourself — the JSON and rules stay the same.

## Server-rendered sites (Laravel, Rails, Django, PHP)

- **Simplest:** publish the kit under `public/popup/` and add the tags to the main layout. Wrapping happens in the browser.
- **Wrap on the server** when pages are cached as HTML, must work without JavaScript, or the project already renders components: implement the [matching rules](design.md#matching-rules) once in the server language (a helper/component like `<x-glossary.text :text="…">` that outputs `<button class="popup-term" data-term="id" title="short">word</button>`), and keep popup.js only for the card. Then set `data-root="none"` so the browser does not wrap again. SONUB is a full example of this (Laravel, 17 languages) — [projects/sonub/current.md](projects/sonub/current.md).
- Glossary in translation files instead of JSON (Laravel `lang/*/glossary.php`, Rails `config/locales`, gettext): fine — keep the same fields and expose them as the JSON shape (an endpoint or a build step) for the card.

## Languages

| Setup | How |
| --- | --- |
| one file, all locales | `data-glossary="/popup/glossary.json"`; the card uses `data-locale`, else `<html lang>`, else `defaultLocale` |
| one file per locale | `data-glossary="/popup/glossary.{locale}.json"` (`{locale}` = primary subtag of `<html lang>`: `pt-BR` → `pt`); each file has the same structure fields and its own `text.<locale>`; `popup.py check popup/glossary.*.json` checks them together |
| locale in the URL | learn-more links can use `{locale}`: `"href": "/{locale}/docs/api"` |

Mixed-language pages: the card shows one locale per page; matching uses that locale's spellings plus the shared `aliases`.

## Non-web apps

Mobile and desktop apps (Flutter, SwiftUI, Android, Electron) can use the same glossary JSON as an asset: show `term`/`short` in a tooltip or long-press, and the full card in a bottom sheet, in the same reading order. `popup.py check` and the content rules apply unchanged. The kit's JS/CSS is for web views only.

## .popup.json

Written by `init` at the git root; every command reads its defaults from it.

```json
{
  "glossary": "popup/glossary.json",
  "assets": "popup",
  "glossaryPage": "GLOSSARY.md",
  "docs": ["README.md", "docs"],
  "siteRoot": "public"
}
```

`siteRoot` (optional) lets `check` verify `/absolute` learn-more links against built or public files.
