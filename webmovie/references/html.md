# HTML first — the elements that carry animated content

Motion is a coat of paint; the HTML element underneath is what search engines index, translators translate, screen readers announce and the browser lays out in every language. Choose the element for the *meaning*, then animate it. Never pick a `<div>` because it is easier to animate — every element below animates the same way.

## Contents

- [Element map](#element-map)
- [Page skeleton](#page-skeleton)
- [Numbers, dates and data](#numbers-dates-and-data)
- [Charts as data](#charts-as-data)
- [Images and media](#images-and-media)
- [Multilingual markup](#multilingual-markup)
- [SEO checklist](#seo-checklist)
- [Anti-patterns](#anti-patterns)

## Element map

| Content | Element | Animate with | Why this element |
| --- | --- | --- | --- |
| Page title / scene 1 title | `<h1>` (once) | `mask`, `soft-blur`, `slam` | the strongest ranking and outline signal |
| Section / scene titles | `<h2>`–`<h4>` in order | `words`, `flip`, `converge` | outline, deep links (linkify), segment labels of a movie |
| Kicker / eyebrow above a title | `<p>` (not a heading) | `fade` | keeps the outline clean |
| Lead, subtitle | `<p>` | `words`, `fade-up` | the snippet Google may show |
| Emphasis in a sentence | `<mark>`, `<strong>`, `<em>` | `highlight`, `underline`, `shine` | meaning survives without CSS |
| A number | `<data value="12500">12,500</data>` | `count` | machine-readable value + localized text |
| A date / duration | `<time datetime="2026-10-25">25 Oct 2026</time>` · `<time datetime="PT3M">3 min</time>` | `fade`, `count` (duration) | dates are parsed by crawlers |
| A measurement in a range | `<meter min="0" max="100" value="72">72%</meter>` (style it, or put a `.webmovie-bar` next to the text) | `bar` | the value is in the element |
| Progress of a task | `<progress value="3" max="5">3 of 5</progress>` | `bar` | — |
| Steps, a process | `<ol>` + `<li>` | `stagger` | the order is in the markup |
| A set of features | `<ul>` + `<li>` | `stagger` | — |
| Term + value pairs (stats, specs) | `<dl>` + `<dt>`/`<dd>` | `stagger`, `bar`, `count` | pairs stay pairs when read aloud |
| Table of values behind a chart | `<table>` + `<caption>` + `<th scope>` | `stagger` on `<tbody>` rows, `bar` in cells | Google can show it; screen readers navigate it |
| Chart, diagram, illustration | `<figure>` + `<figcaption>` | `draw`, `ring`, `pie`, `wipe` | the caption states the finding in words |
| Quote | `<blockquote>` + `<cite>` | `reveal`, `words` | attribution is machine-readable |
| Code / command | `<pre><code>` | `typewriter` on a short `<code>` line only | never split real code blocks (copying) |
| Abbreviation / term | `<abbr title>` / `<dfn>` | — | pairs with the popup skill |
| Call to action | `<a href>` (navigates) / `<button>` (acts) | `webmovie-lift`, `-sheen`, `-press`, `stagger` | links are crawled; buttons are not |
| Story / movie | `<section>` (scenes) inside `<section aria-label>` | movie | each scene is a real section with a heading |
| Card | `<article>` (self-contained) or `<li>` (in a list) | `stagger` | — |
| Collapsible detail | `<details>` + `<summary>` | `interpolate-size` (see [techniques.md](techniques.md)) | content is in the DOM, indexable, find-in-page opens it |
| Dialog / popover | `<dialog>`, `[popover]` | `@starting-style` (`webmovie-appear`) | focus and Esc handled by the browser |
| Decoration | `<span aria-hidden="true">`, CSS background, SVG with `aria-hidden` | `webmovie-ambient`, `webmovie-float` | not announced, not indexed |

## Page skeleton

```html
<main>
  <section class="stage" data-webmovie-player aria-label="{{ __('home.movie_label') }}" …>
    <section class="webmovie-scene"><h1 data-webmovie="mask">{{ __('home.h1') }}</h1> … </section>
    <section class="webmovie-scene"><h2 data-webmovie="converge">{{ __('home.s2') }}</h2> … </section>
  </section>

  <section aria-labelledby="numbers-h">
    <h2 id="numbers-h" data-webmovie="words">{{ __('home.numbers') }}</h2>
    <dl class="stats" data-webmovie="stagger">
      <div><dt>{{ __('home.learners') }}</dt><dd><data value="{{ $learners }}" data-webmovie="count">{{ number_format($learners) }}</data></dd></div>
    </dl>
  </section>
</main>
```

- One `<h1>`; headings never skip a level for the sake of a font size.
- `aria-labelledby` on a section that has a heading; `aria-label` (translated) on a region without one.
- Stable ASCII `id`s on headings so sections are linkable in every language.

## Numbers, dates and data

- The server writes the final, localized value inside the element and the same number, unformatted, in the attribute: `<data value="12500">12,500</data>` · `<data value="98.6">98,6</data>` (de) — `count` counts to the attribute value in the page's number format and ends on the server text, so the text is always the source of truth. The attribute is the *displayed* number (98.6, not 0.986), or the counter shows the wrong digits while counting.
- Units outside the number element (`<data …>98.6</data>%`, `<data …>17</data> languages`) so the counter formats only digits.
- `font-variant-numeric: tabular-nums` (the kit sets it on `count`) — digits keep their width while counting.
- Durations and dates in `<time datetime>`; never animate a date by counting.

## Charts as data

A chart is a picture of numbers that must also exist as numbers:

```html
<figure>
  <table class="bars">
    <caption>Share of time per task, 2026 (sample)</caption>
    <thead><tr><th scope="col">Task</th><th scope="col">Share</th></tr></thead>
    <tbody data-webmovie="stagger">
      <tr><th scope="row">Writing</th>
          <td><span class="webmovie-bar" data-webmovie="bar" style="--pct: 72"></span> <data value="72">72%</data></td></tr>
      <tr><th scope="row">Review</th>
          <td><span class="webmovie-bar" data-webmovie="bar" style="--pct: 48"></span> <data value="48">48%</data></td></tr>
    </tbody>
  </table>
  <figcaption>Writing takes half again as long as review.</figcaption>
</figure>
```

- The `<caption>`/`<figcaption>` states the finding in a sentence (the snippet a search engine and a skimmer read).
- SVG charts: `role="img"` + `aria-labelledby` pointing to the caption, or a visually present table next to it; labels as `<text>` in the SVG are fine (indexable) but never the only copy of the values.
- `--pct` is the only inline style (a value, not design) — the bar's look is in CSS.

## Images and media

- Revealed images keep `alt` (describe the content, translated), `width`/`height` (no layout shift), `loading="lazy"` below the fold, `decoding="async"`.
- Never put words into an image or a video frame — overlay HTML text on the image (`position: absolute` in a `<figure>`), so it is translated and indexed.
- Footage that must be a `<video>`: captions (`<track kind="captions" srclang>` per language), a poster, `muted playsinline` if it autoplays, and the key message as HTML next to it.
- Lottie/canvas/WebGL only for pure decoration (`aria-hidden`), never for text or data.

## Multilingual markup

- `<html lang dir>` from the locale; a different-language phrase inside gets its own `lang` (`<span lang="en">AI</span>`) — webmovie splits each run with its own language.
- Text comes from the language file, the markup and animation attributes stay the same in every language. Never write text into `data-*` animation attributes except the movie labels (which also come from the language file).
- Logical CSS only (`margin-inline-start`, `inset-inline-end`, `text-align: start`); the kit mirrors its horizontal motion with `dir="rtl"`.
- Leave room: no fixed `width` on animated text; let headings wrap (`text-wrap: balance`), body text `text-wrap: pretty`.
- Numbers, dates and lists from `Intl` / the server's locale formatter; list separators are part of the translation (`、` in Japanese, `، ` in Arabic).
- Each language has its own URL (`/ko/…`, `hreflang` alternates); a JS language switcher is for demos only.

## SEO checklist

- [ ] Every animated word, number and heading is in the server HTML (`check.mjs`: no `js-only-content`).
- [ ] Without JS the page is complete and readable (`hidden-without-js` = 0).
- [ ] One `h1`; heading levels in order; the `h1` is the animated headline itself, no hidden duplicate.
- [ ] Title and meta description say the same thing as the `h1` and first paragraph.
- [ ] Numbers in `<data>`/`<time>`/tables; charts with a caption stating the finding.
- [ ] Images have `alt`, dimensions, lazy loading; no text inside images or video.
- [ ] No layout shift from animation (transforms only, counters reserve width, movie scenes share one cell).
- [ ] Links are `<a href>`; nothing important is reachable only through a hover animation.
- [ ] Each language URL renders its own text server-side, with `hreflang`.

## Anti-patterns

| Instead of | Do |
| --- | --- |
| An MP4/GIF hero with the slogan baked in | an HTML movie with the slogan as `h1` |
| `<div class="title">` styled like a heading | `<h2>` |
| Numbers typed by JS from a JSON file | numbers in the HTML, counted to |
| A chart drawn on `<canvas>` only | SVG/CSS chart + table or caption with the values |
| `display: none` until JS reveals | the kit's `.webmovie-js` + `opacity` waiting state |
| Each letter written as a `<span>` in the template | plain text; webmovie splits it at play time and puts it back |
| `aria-label` copy of the text + `aria-hidden` letters kept forever | plain text after the animation (the kit restores it) |
| Text in `::before { content: "…" }` | real text in the element (pseudo-content is not translated) |
