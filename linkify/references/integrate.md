# linkify — integrating with each stack

## Contents

- [Core idea](#core-idea)
- [Static HTML and server templates](#static-html-and-server-templates)
- [Multilingual sites](#multilingual-sites)
- [Markdown sites and doc generators](#markdown-sites-and-doc-generators)
- [SPA frameworks (React, Vue, Svelte, Angular)](#spa-frameworks)
- [Hidden content — tabs, steps, accordions](#hidden-content)
- [Pages that already use the hash](#pages-that-already-use-the-hash)
- [Sticky headers](#sticky-headers)
- [Checking](#checking)

## Core idea

A deep link is only `page URL + "#" + id`. The browser already scrolls to `id` on open — the kit adds the parts browsers don't:

| Part | Where in `linkify.js` |
| --- | --- |
| Every section has an id | `decorate()` → `idFor(text)` (headings) / `hashId(text)` (blocks), `unique()` adds `-2` |
| A visible way to get the link | `decorate()` appends `<a class="linkify-link" href="#id">` — a real link, so right-click "Copy link" and middle-click also work without JS |
| URL changes, clipboard, feedback | `copy(id)` → `history.replaceState` → `land()` → `writeClipboard()` (`navigator.clipboard`, fallback `execCommand`) → `toast()` |
| Landing below the sticky header | CSS `scroll-margin-block-start: calc(var(--linkify-offset) + var(--linkify-gap))`; `watchHeader()` measures `data-header` with a `ResizeObserver` |
| Landing on hidden content | `go(id)` → `reveal()` opens `<details>`, sends `linkify:reveal` outermost first → two animation frames → `land()` → `settle()` re-aligns after fonts/images until wheel/touch/key/pointer |

`idFor` and `scripts/linkify.py slug` use the same rule (NFKC, lowercase, keep letters/marks/numbers of every script, spaces → `-`), so the audit predicts the id the browser will make.

## Static HTML and server templates

Put the two tags in the shared layout once (Blade, Twig, Jinja, ERB, Liquid, Handlebars, PHP includes):

```html
<link rel="stylesheet" href="/linkify/linkify.css">
<script defer src="/linkify/linkify.js" data-root="main" data-header=".site-header"></script>
```

Then write fixed ids where it matters:

```html
<h2 id="refund">Refunds</h2>
<p id="refund-7-days" data-linkify-anchor>Refunds are possible within 7 days …</p>
<section data-linkify-skip>…ads, related posts…</section>
```

Loop-rendered sections take their id from data that never changes (a slug, a primary key), not from the translated title: `<h3 id="faq-{{ $faq->slug }}">`.

## Multilingual sites

- Auto ids come from the visible text, so `/en/guide#install` and `/ko/guide#설치` differ. A link copied in one language still works for that language (the locale is in the URL), but breaks when the reader switches language or the text is reworded. Give translated headings fixed ids.
- Pass the labels in the page language: `data-label-copy="{{ __('linkify.copy') }}"` etc. `{title}` is replaced with the heading text.
- RTL works as is (logical properties; the toast is centered with a mirrored transform).

## Markdown sites and doc generators

Most generators already make heading ids — keep theirs (rule 1) and add only what is missing:

| Stack | Ids | Copy-on-click |
| --- | --- | --- |
| GitHub / GitLab README | made by the site, `#` icon on hover | nothing to add (no scripts allowed) |
| MkDocs (Material) | `toc` extension `permalink: true` | add the kit with `extra_javascript` / `extra_css`; set `data-levels` and it reuses the existing ids |
| Docusaurus | built in (`{#custom-id}` syntax) | swizzle-free: add the kit in `docusaurus.config.js` `scripts`/`stylesheets`; hide the theme's own hash link with CSS if both show |
| VitePress | built in (`{#custom-id}`) | `head` in config, or import in a theme `enhanceApp` and call `Linkify.apply()` in `router.onAfterRouteChanged` |
| Hugo / Jekyll / Eleventy | built in (Goldmark, kramdown, markdown-it-anchor) | add the tags to the base layout |
| Markdown rendered in the browser (marked, markdown-it) | none — add `markdown-it-anchor` or let the kit make them | `Linkify.apply(container)` after rendering |

Custom ids in Markdown: `## Refunds {#refund}` (Pandoc, kramdown, Docusaurus, VitePress, MkDocs `attr_list`).

## SPA frameworks

Load the kit globally (index.html) with `data-auto="false"`, then:

```js
// React: in the layout component
useEffect(() => { window.Linkify.start(); }, []);
useEffect(() => { window.Linkify.apply(contentRef.current); }, [pathname]);

// Vue Router
router.afterEach(() => nextTick(() => window.Linkify.apply(document.querySelector('main'))));

// SvelteKit
afterNavigate(() => window.Linkify.apply(document.querySelector('main')));
```

`apply()` skips elements it already decorated (`data-linkified`), so calling it after every render is safe. If the router scrolls to the hash itself, keep only one: turn off the router's hash scroll, or call `Linkify.go(id)` from its scroll hook.

Framework re-renders that replace a heading remove the button — `apply()` after the render puts it back.

## Hidden content

`<details>` opens by itself. For anything else the page owns the "show" logic; the kit only asks:

```html
<div data-linkify-reveal="advanced" hidden>…<h3 id="advanced-options">…</h3></div>
```

```js
tabs.addEventListener('linkify:reveal', (e) => showTab(e.detail)); // e.detail = "advanced"
```

Alpine: `x-on:linkify:reveal.stop="show($event.detail)"`. If the project already has its own reveal attribute/event (for search results, say), point the kit at it: `data-reveal-attr="data-search-reveal" data-reveal-event="search-reveal"`.

## Pages that already use the hash

A chapter page that shows one chapter per hash (`/course#chapter-3`) treats every other hash as unknown → shows the table of contents → the heading the link points at is hidden. Fix the router, not the kit — resolve a nested id to its chapter:

```js
function chapterFor(hash) {
	if (chapters.has(hash)) return hash;                       // #chapter-3
	const el = document.getElementById(hash);                  // #chapter-3-setup
	return el?.closest('[data-chapter]')?.dataset.chapter ?? ''; // → chapter-3
}
```

Then the router shows the chapter, the kit scrolls to the heading inside it (`go()` waits two frames). Also check anything that re-scrolls to "the current chapter" on resize — it must target the element of the hash, or it will pull the reader back to the chapter top.

Tabs that live in the path (`/page/tab`) are not affected — the hash is free.

## Sticky headers

- One header: `data-header=".site-header"` (measured, follows resizes; 0 when the header is not `sticky`/`fixed`, e.g. on mobile layouts that unstick it).
- Several stacked bars, or a height you already keep in a variable: set `--linkify-offset` yourself, e.g. `:root { --linkify-offset: calc(var(--bar-height) + var(--tabs-height)); }` and leave `data-header` out.
- An element with its own stronger `scroll-margin` rule keeps it (`linkify.css` uses `:where()`, zero specificity).

## Checking

1. Hover a heading → 🔗 appears; Tab reaches it (focus ring); on a phone it is faintly visible.
2. Click the heading text → address is `…#id`, toast "Link copied", the clipboard holds the full URL, the page does not reload.
3. Click a link inside a heading → it opens that link, no copy.
4. Open a copied URL in a new tab → lands below the header, flash; also for a heading inside closed `<details>`, a hidden tab and (if any) another chapter.
5. `python3 scripts/linkify.py audit <templates>` → no `duplicate`; `no-id` only where auto ids are acceptable.
