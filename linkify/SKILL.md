---
name: linkify
description: 섹션 딥링크 — 어떤 웹사이트든 페이지의 단원·챕터·소제목·단락을 누르면 주소가 `…/page#anchor` 로 바뀌고 그 주소가 클립보드에 자동 복사되게 만든다. 붙여 넣은 링크를 열면 그 자리로 스크롤되고(고정 머리 막대 아래로, 닫힌 details·숨은 탭도 열어서) 잠깐 빛난다. Add copyable deep links (#anchors) to every heading, chapter and paragraph of a site — a drop-in linkify.js/css with no build step, stable ids, a "Link copied" toast, landing below sticky headers, hidden tabs and closed details opened on arrival, RTL, touch and keyboard, plus an audit that finds headings without stable ids. Use it whenever the user wants section links, anchor links, permalinks, heading links, "copy link to this section", "share this part of the page", jump-to-section URLs, hash links that scroll to a place, or "/linkify …" — e.g. "각 단원에 링크 복사", "제목 누르면 주소 복사", "이 위치로 바로 가는 링크", "#앵커 링크 달아 줘", "add anchor links to headings", "make sections linkable". In SONUB (sonub.com) read references/projects/sonub.md first.
license: MIT
compatibility: The kit is plain JavaScript and CSS for any modern browser (no framework, no build). scripts/linkify.py needs Python 3.8+ (standard library only).
---

# linkify — a link to every place on the page

A reader finds the one paragraph they need in a long page and wants to send exactly that place to someone. This skill makes every section linkable:

```
## Install  🔗          ← hover (or tap) a heading: a link button appears
   click the heading or 🔗
   → address bar:  https://site.com/docs/setup#install   (no reload, no jump)
   → clipboard:    the same address          [ Link copied ]  ← toast
open that address later
   → the page scrolls to "Install", below the sticky header, and flashes it
```

**Talk in the user's language.** References are in English (the SONUB profile is in Korean). Keep code, paths and attribute names as they are.

## 🛑 Rules

1. **Look for the project's own system first.** Search for heading anchors that already exist (`grep -rIl "scrollIntoView\|hashchange\|location.hash\|anchor" --include=*.js --include=*.ts --include=*.vue --include=*.svelte .`), doc generators that add them (MkDocs, Docusaurus, VitePress, GitHub Markdown), and read AGENTS.md / CLAUDE.md. Extend what exists — never add a second anchor system next to it. **SONUB** (repo has `SONUB-SSOT.md`): stop here and follow [references/projects/sonub.md](references/projects/sonub.md).
2. **Ids are addresses — keep them stable.** A copied link lives forever in chats and docs. Never rename an id that shipped. Prefer fixed ids written in the markup (`<h2 id="install">`) over ids made from heading text: text changes, and on a multilingual site each language would get a different id. Fixed ids should be short ASCII (`refund-rule`) — non-ASCII ids paste as `%EC%84%A4…`.
3. **Don't break the page's own `#hash` use.** Single-page routers, tab scripts and chapter pages (`/course#chapter-3`) already read the hash. Find them before adding the kit and make them resolve a nested id to its chapter/tab (see [integrate.md](references/integrate.md#pages-that-already-use-the-hash)).
4. **Not done until seen.** Open the page in a browser: click a heading (address changes, toast, clipboard has the URL), open a copied URL in a new tab (lands below the header, inside closed `<details>` and hidden tabs too), narrow screen, keyboard (Tab to the button, Enter), RTL if the site has it. Say what you could not check.

## The kit

| File | What |
| --- | --- |
| `assets/linkify.js` | Gives h2–h4 (and `[data-linkify-anchor]` elements) an id if they have none, adds a link button, copies `page#id` on click of the heading or the button, `history.replaceState` (no reload, no `hashchange`), toast, landing on open/`hashchange` (opens `<details>`, sends `linkify:reveal` to hidden panels, re-aligns after late fonts/images until the reader moves). API: `Linkify.apply(el)` after a re-render |
| `assets/linkify.css` | Button (hidden until hover/focus, faint on touch screens), toast, landing flash, `scroll-margin` below the sticky header. Theme with `--linkify-accent`, `--linkify-muted`, `--linkify-toast-bg`, `--linkify-gap`. Logical properties (RTL), reduced motion |
| `assets/demo.html` | Every case in one page — own id, duplicate titles, Korean title, paragraph anchor, link inside a heading, heading inside a card link, closed details, hidden tab, sticky header. `python3 -m http.server` in `assets/`, open `demo.html` |
| `scripts/linkify.py` | `init [dir]` copies the kit and prints the tags · `audit <files/dirs>` lists headings without a fixed id (and the id the script would make, or "translated text — give a fixed id"), duplicate ids, non-portable ids, `#links` to nothing · `slug "<text>"` |
| `scripts/check.mjs` | Browser proof in headless Chrome (Node 22+): lists linked sections, flags duplicate/non-ASCII ids, clicks a heading like a person (address, toast, clipboard, screenshot), then opens `url#id` fresh for each section and checks it lands at its scroll margin. `node scripts/check.mjs <url-or-file> [--widths 1280,390] [--ids a,b] [--max 8]` — exit 1 on failure |

```html
<link rel="stylesheet" href="/linkify/linkify.css">
<script defer src="/linkify/linkify.js" data-root="main" data-header=".site-header"></script>
```

### Script attributes

| Attribute | Default | Meaning |
| --- | --- | --- |
| `data-root` | `[data-linkify]`, else `main`, else `article`, else `body` | Where to look (selector list) |
| `data-levels` | `h2,h3,h4` | Headings that get a link (h1 is the page itself) |
| `data-blocks` | — | Also link these automatically, e.g. `p,li` — ids are a text hash (`p-1x9k2a`), stable only while the text stays the same |
| `data-skip` | `nav, header, footer, aside, dialog, [data-linkify-skip]` | Never inside these |
| `data-header` | — | Sticky header; its height becomes `--linkify-offset` so landing is below it |
| `data-heading-click` | `true` | `false` — only the 🔗 button copies |
| `data-history` | `replace` | `push` — every copy adds a Back step and fires no `hashchange` either way |
| `data-reveal-attr` / `data-reveal-event` | `data-linkify-reveal` / `linkify:reveal` | Hidden panels to ask the page to show (detail = attribute value), outermost first |
| `data-label-copy` / `-copied` / `-failed` | built in: en, ko, ja, zh by `<html lang>` | Button label (`{title}` = heading text) and toast texts — pass translations for other languages |
| `data-auto` | `true` | `false` — wait for `Linkify.start()` |

Markup hooks: `data-linkify` (root), `data-linkify-anchor` (link this element too — give it an `id`), `data-linkify-skip` (not this one or anything inside), `data-linkify-reveal="tab-2"` (hidden panel). Events bubble from the target: `linkify:copy` `{id, url, ok}`, `linkify:go` `{id}`.

What the script decides for you: no button on headings inside `<a>`/`<button>` (a link inside a link is invalid); clicks on a link/button inside a heading, modifier-clicks and text selection don't copy; ids that start with a digit get `s-`; duplicates get `-2`, `-3`; only ids it decorated are handled on arrival, so other `#hash` features of the page keep working.

## Workflow — `/linkify <request>`

The request says the scope: `/linkify the docs pages`, `/linkify the FAQ — every question`, `/linkify chapter pages`. Read it as narrowly as it allows.

1. **Find the target and rule 1.** Which layout renders those pages? Is there already an anchor system, a router or a tab script that uses the hash?
2. **Install** — `python3 scripts/linkify.py init public/linkify` (or wherever static files are served), add the two tags to the layout. Stacks (static HTML, Markdown sites, MkDocs/Docusaurus/VitePress, React/Vue/Svelte/SPA, server templates, CMS): [references/integrate.md](references/integrate.md).
3. **Configure** — `data-root` to the content area only (not menus, sidebars, chat), `data-header` to the sticky bar, `data-levels` to the levels that are real sections, labels in every language the site ships.
4. **Fix ids** — `python3 scripts/linkify.py audit <templates>`. Give every important section a fixed ASCII id in the markup (translated headings: always). For paragraph-level links put `data-linkify-anchor` + `id` on the paragraphs that matter (rules, FAQ answers, steps) rather than `data-blocks="p"` everywhere.
5. **Hidden content** — mark tabs/steps/accordions with `data-linkify-reveal` and make the page show the panel on `linkify:reveal`; `<details>` opens by itself. If the page routes by hash, apply rule 3.
6. **Check** — rule 4. `node scripts/check.mjs <page url> --widths 1280,390` on every kind of page you touched (add `--ids` for sections inside tabs/chapters), look at `<width>-copied.png`, then try one copied link in a real browser (paste into a chat or a new tab). Pages behind a login: run it against a page you can open, or check by hand.
7. **Report** — what was linked (pages, levels), ids added, what was checked in the browser and what was not.

## Edge cases

- **Content rendered later** (SPA route change, infinite list, Markdown rendered in the browser): call `Linkify.apply(container)` after rendering; if the address points at a section that only now exists, it goes there.
- **Clipboard blocked** (http page, iframe without permission): the old `execCommand('copy')` fallback runs; if that fails too the toast says the link is in the address bar.
- **Same text twice** gets `-2` — but the order decides who gets the plain id, so give fixed ids where duplicates are likely ("Example", "Summary").
- **Very long pages with `data-blocks="p"`**: hundreds of buttons are fine for performance, but noisy; prefer explicit anchors.
