# UI motion — buttons, links, color, images, states, pages

Small, fast, responsive motion that confirms what the user did. CSS only, except where noted. All classes below come from `webmovie.css` and sit inside the `prefers-reduced-motion: no-preference` block.

## Contents

- [Timing for UI](#timing-for-ui)
- [Buttons and links](#buttons-and-links)
- [Attention, once](#attention-once)
- [Color and gradients](#color-and-gradients)
- [Images](#images)
- [Appearing and disappearing](#appearing-and-disappearing)
- [Loading](#loading)
- [Page and state transitions](#page-and-state-transitions)
- [Scroll](#scroll)

## Timing for UI

| Interaction | Duration | Easing |
| --- | --- | --- |
| Press (`:active`) | 80–120 ms | ease-out |
| Hover / focus | 150–250 ms | `--webmovie-ease` |
| Open a menu / popover | 200–300 ms | ease-out; close 150 ms ease-in |
| Dialog | 250–350 ms | ease-out |
| Page / view transition | 250–400 ms | ease-in-out |

Hover effects always also on `:focus-visible`; never depend on hover for anything essential (touch has none).

## Buttons and links

```html
<a class="btn webmovie-lift webmovie-press webmovie-sheen webmovie-nudge" href="/start">
  Start <span class="webmovie-nudge-icon" aria-hidden="true">→</span>
</a>
```

| Class | Does |
| --- | --- |
| `webmovie-lift` | rises 2px with a shadow on hover/focus |
| `webmovie-press` | scales to 0.97 while pressed |
| `webmovie-sheen` | a glossy light sweeps across on hover/focus (`::after`, behind the label) |
| `webmovie-nudge` + `.webmovie-nudge-icon` | the arrow moves toward inline-end (mirrored in RTL) |
| `webmovie-border-glow` | a light runs around the border 3 times (`@property` angle) — set `--webmovie-surface` to the button/card background |
| `webmovie-pulse` | 3 expanding rings, then stops — for one "new" thing |

Text effects on hover: `data-webmovie="rise" data-webmovie-trigger="hover"` on a short label replays the letters every time the pointer enters (keep it to nav items or one button).

Underline that draws on hover (CSS only):

```css
.link { background: linear-gradient(currentColor, currentColor) no-repeat 0 100% / 0% 1px; transition: background-size 250ms var(--webmovie-ease); }
.link:is(:hover, :focus-visible) { background-size: 100% 1px; }
.link:dir(rtl) { background-position-x: 100%; }
```

## Attention, once

- `webmovie-pulse` (3 rings), `webmovie-float` (3 rounds), `webmovie-gradient-text` (2 rounds) — every attention effect stops by itself (`--webmovie-loops` to change the count, never `infinite` on content).
- One attention effect per screen. Two pulsing things cancel each other out.

## Color and gradients

- Transition colors with `transition: background-color 200ms, color 200ms` — not `all`.
- Animated gradients: move a big gradient's `background-position` (`webmovie-gradient-text`) or animate a registered `@property` angle/percentage (`webmovie-border-glow`, `pie`). Gradients themselves do not interpolate.
- Theme switches (light/dark) should *not* animate every element; if you want a smooth switch use a view transition on the root.
- Text over moving color must keep ≥ 4.5:1 contrast at every frame; add a `@media (forced-colors: active)` fallback that removes gradient text.

## Images

```html
<figure class="photo"><img src="/img/team.webp" alt="The team at work" width="1200" height="800" loading="lazy" data-webmovie="wipe"></figure>
<figure class="frame"><img src="/img/city.webp" alt="…" width="1600" height="900" data-webmovie="settle"></figure>
```

| Preset | Look |
| --- | --- |
| `wipe` / `wipe-up` | hard-edged reveal from inline-start / bottom |
| `reveal` | soft-edged sweep (mask) |
| `settle` | starts 12 % zoomed in and settles over 2.4 s (put it in a frame with `overflow: hidden`) |
| `zoom-out` / `fade-up` / `pop` | quiet entrances |

- Keep `width`/`height` (no layout shift), `alt` (translated), `loading="lazy"` below the fold. The image is visible without JS.
- Iris reveal, Ken Burns loops and parallax: [techniques.md](techniques.md#reveals-clip-path-mask-background-clip-text). Ken Burns on a loop is decoration — stop it after a few rounds or tie it to a movie (`webmovie-ambient`).
- Words over an image are HTML positioned over it, never pixels in the image.

## Appearing and disappearing

```html
<div class="toast webmovie-appear" role="status">Saved</div>            <!-- inserted by JS: fades/rises in -->
<div popover id="menu" class="webmovie-appear">…</div>
```

`webmovie-appear` uses `@starting-style` + `transition-behavior: allow-discrete` (Baseline 2024), so an element inserted into the DOM, a `[popover]` or `<dialog>` that opens, or a `display: none → block` switch animates in with no JS. Exit states for dialogs/popovers: [techniques.md](techniques.md#entry-and-exit-starting-style-allow-discrete). Accordions with `<details>` and `interpolate-size`: same file.

## Loading

```html
<div class="webmovie-skeleton card-skeleton" aria-hidden="true"></div>
```

The one allowed endless loop — it ends when the content arrives (replace the skeleton). Prefer showing real cached text over a skeleton.

## Page and state transitions

- Multi-page sites (Blade, Rails, plain HTML): `@view-transition { navigation: auto; }` in the CSS of both pages gives a cross-fade between pages with no JS; `view-transition-name` on a shared element (a product image, a title) morphs it between pages. Unsupported browsers navigate normally.
- In-page state (tabs, filters): `document.startViewTransition(() => update())` with a feature check.
- Keep it short (≤ 400 ms), never block reading, disable under reduced motion. Code: [techniques.md](techniques.md#view-transitions).

## Scroll

- Reading progress: `<div class="webmovie-progress" aria-hidden="true"></div>` (scroll-driven, `@supports`; hidden where unsupported).
- Reveal-as-you-scroll tied to scroll position: class `webmovie-scroll` (CSS only).
- Reveal once when it comes into view (time-based): `data-webmovie="…"` (IntersectionObserver, everywhere).
- Parallax: a background layer moving ±8 % with `animation-timeline: view()` — decoration only, never the text.
