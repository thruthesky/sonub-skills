# Principles — timing, choreography, performance, accessibility, SEO, i18n

Read this before designing motion for a page. Numbers come from the sources at the end; where they disagree the range is given.

## Contents

- [Why web motion instead of video](#why-web-motion-instead-of-video)
- [The final-frame rule](#the-final-frame-rule)
- [Timing](#timing)
- [Easing](#easing)
- [Split granularity](#split-granularity)
- [Choreography](#choreography)
- [Static type first](#static-type-first)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [SEO](#seo)
- [Multilingual](#multilingual)
- [Sources](#sources)

## Why web motion instead of video

| | mp4 / GIF / Lottie / canvas | HTML + CSS (+ JS) |
| --- | --- | --- |
| Search engines | see a file name and maybe a caption | read every word, heading level, number, link |
| Translation | re-render one video per language | the words come from the language file, one animation for all |
| Edit a typo / a number | re-render, re-upload | edit the text, deploy |
| Data | pixels | `<data value>`, `<table>`, `<figure>` — copyable, linkable |
| Weight | MBs, a player, a poster | a few KB of CSS/JS, the text is already on the page |
| Accessibility | captions at best | real text, zoom, reduced-motion, screen readers |
| Responsive / RTL / theme | a fixed frame | reflows, mirrors, follows dark mode |

Use video only for footage (a real camera recording). Put the words of a video page on top of it as HTML.

## The final-frame rule

The page must be complete and correct with no motion at all. Motion is only the *way into* that state.

- Hide-before-reveal styles live **only** under `html.webmovie-js` (added by webmovie.js in `<head>`) and **only** inside `@media screen and (prefers-reduced-motion: no-preference)`. A crawler without JS, a script error, a reduced-motion user, print, reader mode — all see the plain page.
- A fail-safe: if the script never prepares an element, CSS shows it after 3 s anyway (`webmovie-failsafe`).
- After the animation webmovie.js removes its spans, classes and inline variables: the DOM is the original again (same text nodes, same elements, same event listeners). Browser translation (Chrome Translate), find-in-page, copy and screen readers work on the original text.
- Numbers: the server writes the final formatted value; the counter starts from 0 and ends by putting the server's string back.

Why so strict: hidden text that only JS reveals is fragile (blocked scripts, slow devices, bots), and a DOM full of one-letter spans reads badly to screen readers and breaks in-page translation.

## Timing

> Strong by default (2026-10-25): webmovie's power `bold` multiplies distances, scale and blur by 1.6 with an overshoot curve; acted shots add anticipation, squash and impacts. The numbers below are the calm baseline — [acting.md](acting.md) has the bold amplitudes and limits.

| Thing | Value |
| --- | --- |
| One piece (letter/word/line/card) | 400–900 ms (UI micro-motion 120–300 ms) |
| Whole reveal of one element | ≤ ~800–1200 ms; `--webmovie-max` caps it (default 1200 ms) |
| Stagger — letters | 20–40 ms (snappy) |
| Stagger — words | 40–90 ms |
| Stagger — lines | 60–120 ms |
| Stagger — cards / list items | 60–100 ms |
| Elements entering together | 100 ms apart (`--webmovie-cascade`) |
| Hold before a text swap | reading time ≈ 0.3 s per word, at least 1–2 s (adult silent reading ≈ 238 words/min) |
| Hover / press feedback | 120–200 ms |
| Counters | 1.2–2 s (longer than text: the eye follows the digits) |
| Line drawing | 0.8–1.6 s per stroke |

- When a string is too long for letters, switch to words or lines — don't just shrink the stagger to 5 ms.
- Test at normal speed and frozen at start/middle/end (`?webmovie-t=`); a reveal that looks fine running can have an ugly middle frame.

## Easing

| Token | Curve | Use |
| --- | --- | --- |
| `--webmovie-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | default entrance (fast start, long settle) |
| `--webmovie-ease-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | headlines, counters, bars |
| `--webmovie-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | small overshoot (≈ 5–10 % past, then settle) |
| `--webmovie-ease-in` | `cubic-bezier(0.64, 0, 0.78, 0)` | exits (accelerate away) |
| `--webmovie-ease-inout` | `cubic-bezier(0.65, 0, 0.35, 1)` | wipes, sweeps, line drawing, weight morphs |
| `steps(1, end)` / `linear` | — | typewriter, scramble |

- Entrances ease **out**, exits ease **in**. Never `linear` for movement (it reads robotic) — only for typing, timers and scroll-linked progress.
- Overshoot only on small things (a word, a badge, a button), never on a paragraph.

## Split granularity

| Split | Feels | Use for |
| --- | --- | --- |
| lines | calm, editorial, premium | multi-line headlines, paragraphs |
| words | rhythmic, energetic | taglines, subtitles, lyric hits |
| letters | kinetic, playful, busy | ≤ ~25 characters: a word, a short title |
| whole | quiet | body text, labels, images, numbers |

## Choreography

- **One reveal driver per moment.** Mask *or* blur *or* letters on a headline; combining them reads as noise.
- **Order = importance.** Headline → supporting line → numbers → call to action. The reveal order is a second reading order; make it match the visual one.
- **Secondary motion responds.** An underline, highlight or glow starts slightly *after* the main motion and is smaller.
- **Motion has a direction that means something:** up = arrive/grow, inline-start → inline-end = progress (mirrored in RTL), scale-in = focus.
- **Quiet the rest.** If everything on a page animates, nothing stands out. Body text: at most a fade-up; most of a page: no motion.
- **Once.** Entrances play once per page view (`data-webmovie-repeat` only when replay is the point).

## Static type first

Motion cannot rescue bad type. Before animating: display line-height 1.1–1.2 (body 1.4–1.6), display tracking −0.01 to −0.03 em, a set weight, alignment and measure (45–75 characters). Then split.

## Performance

- Compositor-friendly: `opacity`, `transform` / `translate` / `scale` / `rotate`. Fine on small elements: `filter: blur()` (keep ≤ 12–14 px and short), `clip-path`, `background-size/position` on inline text, `stroke-dashoffset`.
- Avoid animating layout: `width`, `height`, `inline-size`, `top/left`, `margin`, `padding`, `font-size`, `letter-spacing`. For a bar use `scale: 0 1 → 1 1` with `transform-origin` at the start side; for "grow text" scale a wrapper.
- `inline` elements ignore transforms — split pieces are `inline-block` (the kit does this).
- `animation-fill-mode: forwards/both` keeps a stacking context and `will-change`-like layers after the end; the kit removes its animation classes when done.
- Do not set `will-change` by hand on many elements (memory).
- Hundreds of letter spans on one page are a smell: split only headings and short strings; let the kit restore them.
- Hidden tabs: CSS animations are throttled; the kit starts on view (IntersectionObserver), so off-screen work is zero.

## Accessibility

- `prefers-reduced-motion: reduce` → final frame at once, nothing moves (the kit does it in CSS *and* JS). Do not merely shorten the motion.
- WCAG 2.2.2 Pause, Stop, Hide: anything that moves for more than 5 s alongside other content must stop by itself or be pausable. Kit loops stop after ≤ 3 rounds; rotating words stop on the first word after 3 rounds and pause on hover/focus.
- WCAG 2.3.1: never more than 3 flashes per second; no large high-contrast blinking.
- Keep contrast in every frame that holds still: gradient text, shine and highlight must keep ≥ 4.5:1 (text) at rest.
- Split text keeps real spaces as text nodes, so copy-paste and screen readers get the words; pieces exist only during the motion.
- Don't animate focus outlines away; hover effects also on `:focus-visible`.
- Motion never carries the only meaning — the value, the order and the state are also in text.

## SEO

- Words, numbers and headings are in the server HTML (not injected by JS) — check `js-only-content` in `scripts/check.mjs`.
- One `h1`; the animated headline is the real `h1`, not a decorative copy next to a hidden one. No duplicate "visually hidden" copies of the same text.
- Numbers as text (`<data value="12500">12,500</data>`, `<time datetime>`), charts with a `<figcaption>` or a `<table>` of the same values.
- Images that are revealed keep `alt`, `width`/`height` (no layout shift), and load normally (`loading="lazy"` below the fold).
- Hidden-before-reveal uses `opacity`, never `display:none` / `visibility:hidden` on content, and only under the JS class — crawlers that render JS see the text; those that don't, see it anyway.
- No layout shift (CLS): animations use transforms/clip, counters reserve their final width, bars have their final size from the start.

## Multilingual

- **Write once, translate the text.** The animation is attached to an element, never to a sentence; the language file holds the words.
- **Splitting** (webmovie.js): words by whitespace; for scripts without spaces (Chinese, Japanese, Thai, Lao, Khmer, Myanmar) `Intl.Segmenter(lang, { granularity: 'word' })`, opening brackets stick to the next word, closing punctuation to the previous. Letters by grapheme (`granularity: 'grapheme'` — emoji, accents, Hangul syllables, Indic clusters stay whole).
- **Joined scripts are never split into letters:** Arabic, Persian, Urdu, Syriac, Thaana, N'Ko, Mongolian, Devanagari and other Indic scripts, Tibetan, Myanmar, Khmer — letter presets fall back to words automatically (one span per letter breaks the shaping).
- **CJK and Hangul keep their line breaks:** a word is split into letters that share the word's timing, so lines wrap where the plain text wraps (unless `word-break: keep-all`, then by word). The `reflow` warning catches a jump at restore.
- **RTL:** horizontal offsets flip (`--webmovie-dir: -1` via `.webmovie-rtl`), wipes and bars start at the right; logical properties (`inline-start`) in your CSS.
- **Length:** translations run 30–40 % longer (German, Finnish) or much shorter (Chinese). `--webmovie-max` squeezes the stagger so every language reveals in the same time; never size a text box to the English length.
- **Numbers and dates:** `Intl.NumberFormat(lang)` while counting; the server's localized string at the end.
- Test the animation in the longest language, a CJK language and an RTL language (`demo.html?lang=ar`).

## Sources

- MDN — Using CSS animations: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using
- W3Schools — CSS animations: https://www.w3schools.com/css/css3_animations.asp
- iart-ai kinetic-typography skill (reveals, timing, freeze harness): https://github.com/iart-ai/kinetic-typography-skills
- iArt — How to animate text: https://www.iart.ai/blog/how-to-animate-text
- Pixel Point animate-text catalog (exact per-effect durations, staggers, curves): https://pixelpoint.io/skills/animate-text/ · https://github.com/pixel-point/animate-text · review https://openagentskills.dev/skills/animate-text-skill
- Demotion — Text animation secrets (ease-out/in, 0.3–0.8 s, stagger, overshoot, secondary motion): https://trydemotion.com/blog/text-animation-secrets
- WCAG 2.2 — 2.2.2 Pause, Stop, Hide; 2.3.1 Three Flashes; 2.3.3 Animation from Interactions.
