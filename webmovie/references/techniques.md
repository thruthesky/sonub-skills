# Modern CSS techniques for web animation

Useful CSS (and a little platform JS) beyond plain `@keyframes`, each with a copy-paste snippet, how webmovie uses it, and its support. Support was checked on 2026-10-25 from the sources at the end — re-check MDN / caniuse before relying on a "new" item. **Rule for anything not Baseline:** wrap it in `@supports` (or let it fail harmlessly) so unsupported browsers show the final frame.

## Contents

- [Support at a glance](#support-at-a-glance)
- [Transforms and 3D](#transforms-and-3d)
- [Easing: steps(), linear() springs and bounces](#easing-steps-linear-springs-and-bounces)
- [@property — animating gradients, angles, numbers](#property--animating-gradients-angles-numbers)
- [Reveals: clip-path, mask, background-clip text](#reveals-clip-path-mask-background-clip-text)
- [SVG: drawing lines, text on a path](#svg-drawing-lines-text-on-a-path)
- [Motion path: offset-path](#motion-path-offset-path)
- [Typography: variable fonts, text-wrap, shadows](#typography-variable-fonts-text-wrap-shadows)
- [Stagger without JS: sibling-index()](#stagger-without-js-sibling-index)
- [Scroll-driven animations](#scroll-driven-animations)
- [Scroll-triggered animations](#scroll-triggered-animations)
- [Entry and exit: @starting-style, allow-discrete](#entry-and-exit-starting-style-allow-discrete)
- [Height auto: interpolate-size](#height-auto-interpolate-size)
- [View transitions](#view-transitions)
- [Combining animations: animation-composition](#combining-animations-animation-composition)
- [JS when needed: Web Animations API](#js-when-needed-web-animations-api)
- [Sources](#sources)

## Support at a glance

| Technique | Chrome/Edge | Safari | Firefox | webmovie |
| --- | --- | --- | --- | --- |
| Individual `translate`/`scale`/`rotate` | ✓ | ✓ | ✓ | every preset |
| Custom properties in `@keyframes` | ✓ | ✓ | ✓ | every preset |
| `linear()` easing | 113+ | 17.2+ | 112+ | `--webmovie-ease-bounce`, `-elastic`, `bounce` |
| `@property` | ✓ | ✓ | 128+ | `pie`, `webmovie-border-glow` |
| `mask-image` unprefixed | ✓ | ✓ (+`-webkit-`) | ✓ | `reveal` |
| `offset-path` / `offset-distance` | ✓ | ✓ | ✓ (Baseline 2022) | doc only |
| `@starting-style` + `transition-behavior: allow-discrete` | 117+ | 17.5+ | 129+ (Baseline 2024) | `webmovie-appear` |
| `overlay` (top-layer exit) | ✓ | — | — | `webmovie-appear` (ignored if unsupported) |
| Scroll-driven `animation-timeline: scroll()/view()` | 115+ | 26+ | behind a flag (Interop 2026) | `webmovie-scroll`, `webmovie-progress` in `@supports` |
| Scroll-triggered `timeline-trigger` / `animation-trigger` | 146+ | — | — | doc only (kit uses IntersectionObserver) |
| `sibling-index()` / `sibling-count()` | 138+ | 26.2+ | recent / check | doc only (kit sets `--i`) |
| `interpolate-size: allow-keywords` / `calc-size()` | 129+ | — | — | doc only |
| Same-document View Transitions | 111+ | 18+ | recent / check | doc only |
| Cross-document `@view-transition` | 126+ | 18.2+ | — | doc only |
| `text-wrap: balance` / `pretty` | ✓ / ✓ | ✓ / recent | ✓ / check | use in your CSS before animating |

## Transforms and 3D

Individual properties compose without overwriting each other and can be animated separately (a hover `translate` does not fight an entrance `scale`). `rotate` takes an axis — the 3D letter flip of the `flip` preset:

```css
[data-webmovie="flip"] { --webmovie-r: x -100deg; }                 /* rotate: x -100deg → 0 */
[data-webmovie="flip"] .webmovie-word { perspective: 600px; }        /* perspective on the parent of what turns */
[data-webmovie="flip"] .webmovie-piece { transform-origin: 50% 100%; backface-visibility: hidden; }
```

Card flip (two faces, `transform-style: preserve-3d`):

```css
.flip-card { perspective: 1000px; }
.flip-card__inner { display: grid; transform-style: preserve-3d; transition: rotate 700ms var(--webmovie-ease); }
.flip-card:is(:hover, :focus-within) .flip-card__inner { rotate: y 180deg; }
.flip-card__face { grid-area: 1 / 1; backface-visibility: hidden; }
.flip-card__back { rotate: y 180deg; }
```

Both faces are real HTML — the back side is indexed too.

## Easing: steps(), linear() springs and bounces

- `steps(n, end)` — typing, ticking clocks, sprite sheets (`webmovie-type` uses `linear` with per-letter delays instead, so the caret can walk).
- `linear()` takes a list of output values (optionally with positions) and draws straight segments between them — enough points approximate a spring or a bounce that `cubic-bezier()` cannot:

```css
:root {
  --webmovie-ease-bounce: linear(0, 0.004, 0.016, 0.035, 0.063, 0.098, 0.141 13.6%, 0.25, 0.391, 0.563, 0.765, 1,
    0.891 40.9%, 0.848, 0.813, 0.785, 0.766, 0.754, 0.75, 0.754, 0.766, 0.785, 0.813, 0.848, 0.891 68.2%, 1 72.7%,
    0.973, 0.953, 0.941, 0.938, 0.941, 0.953, 0.973, 1, 0.988, 0.984, 0.988, 1);
}
.badge { animation: drop 1s var(--webmovie-ease-bounce) both; }
```

Generate curves with Jake Archibald's linear() generator (from a spring formula or an SVG path). A browser without `linear()` treats the declaration as invalid and uses the default `ease` — harmless. Keep bounces for small elements (a badge, a word, a button), never paragraphs.

## @property — animating gradients, angles, numbers

A plain custom property switches at 50 %; a **registered** one interpolates, which unlocks animated gradients:

```css
@property --webmovie-p { syntax: "<number>"; inherits: false; initial-value: 0; }
.webmovie-pie {                          /* the pie preset — natural state = the value */
  --webmovie-p: var(--pct, 0);
  aspect-ratio: 1; border-radius: 50%;
  background: conic-gradient(var(--webmovie-pie, currentColor) calc(var(--webmovie-p) * 1%), var(--webmovie-pie-rest, #8884) 0);
}
@keyframes webmovie-pie { from { --webmovie-p: 0; } }

@property --webmovie-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.webmovie-border-glow {                  /* a light running around the border, 3 rounds */
  border: 2px solid transparent;
  background: linear-gradient(var(--webmovie-surface, Canvas), var(--webmovie-surface, Canvas)) padding-box,
              conic-gradient(from var(--webmovie-angle), transparent 70%, #7c3aed, #db2777, transparent) border-box;
  animation: webmovie-spin 3s linear 3;
}
@keyframes webmovie-spin { to { --webmovie-angle: 360deg; } }
```

Also: animate a gradient's color stop position (`<percentage>`), a hue (`<number>` into `oklch()`), a `<length>` for spacing. A registered property cannot print digits as text — counters stay JS (`count` preset), the number itself stays in the HTML.

## Reveals: clip-path, mask, background-clip text

```css
/* hard wipe (wipe preset): clip-path needs an explicit end — inset() → none does not interpolate */
@keyframes webmovie-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0); } }

/* iris (circle) reveal for an image or a scene */
@keyframes iris { from { clip-path: circle(0% at 50% 50%); } to { clip-path: circle(75% at 50% 50%); } }

/* soft-edged sweep (reveal preset): the gradient is fixed, its POSITION moves — gradients themselves don't interpolate */
[data-webmovie="reveal"].webmovie-in {
  mask: linear-gradient(90deg, #000 40%, transparent 60%) 100% 0 / 260% 100% no-repeat;
}
@keyframes webmovie-reveal { from { mask-position: 100% 0; } to { mask-position: 0 0; } }

/* gradient-filled text (stays real, selectable text) */
.gradient-title {
  background: linear-gradient(90deg, #7c3aed, #db2777, #f59e0b, #7c3aed) 0 0 / 300% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: webmovie-hue 6s linear 2;   /* finite */
}
```

- Keep `-webkit-mask` / `-webkit-background-clip` next to the standard property.
- Check contrast of gradient text at every resting position; provide `@media (forced-colors: active) { .gradient-title { color: CanvasText; background: none; } }`.

## SVG: drawing lines, text on a path

```html
<svg viewBox="0 0 320 160" data-webmovie="draw" role="img" aria-labelledby="cap">
  <polyline pathLength="1" points="20,130 80,112 140,96 200,70 260,52 310,30" />
</svg>
```

`pathLength="1"` normalizes every shape so `stroke-dasharray: 1; stroke-dashoffset: 1 → 0` draws it, whatever its real length (the `draw` preset staggers several paths). Icons drawn with strokes, connector lines of an infographic (with the infographics skill's `ig-lines.js`), signatures and underlines all use this.

Text on a curve stays text:

```html
<svg viewBox="0 0 600 200"><path id="curve" d="M20,150 Q300,20 580,150" fill="none"/>
  <text font-size="42"><textPath href="#curve" startOffset="0%">Follow the curve
    <animate attributeName="startOffset" from="-60%" to="20%" dur="2.4s" fill="freeze"/></textPath></text></svg>
```

## Motion path: offset-path

Move an icon (a plane, a dot, a cursor) along a route — Baseline since 2022:

```css
.plane { offset-path: path("M10,80 C80,10 160,150 300,40"); offset-rotate: auto; animation: fly 2.4s var(--webmovie-ease-inout) both; }
@keyframes fly { from { offset-distance: 0%; } to { offset-distance: 100%; } }
```

`offset-path: url(#route)` reuses an SVG path; `ray()` and basic shapes (`circle()`) also work. The natural state is the end of the route — put the element where it belongs at 100 %. Decorative movers get `aria-hidden="true"`.

## Typography: variable fonts, text-wrap, shadows

- **Weight morph** (`weight` preset): animate `font-weight` (numeric, interpolates with a variable font). For other axes (`wdth`, `slnt`, `opsz`, custom) use `font-variation-settings` and write **both** endpoints — `normal` does not interpolate. Confirm the font is variable and its axis range, or it steps/clamps silently.
- **`text-wrap: balance`** on headings (≤ 6 lines in Chromium), **`text-wrap: pretty`** on paragraphs — set before animating; webmovie measures lines after layout, so balanced lines stay balanced.
- **Extrude / long shadow** — stacked `text-shadow` offsets give 3D depth; animate the shadow *in* on a title once (paint cost — keep it to one heading):

```css
.extrude { text-shadow: 1px 1px 0 #5b21b6, 2px 2px 0 #5b21b6, 3px 3px 0 #4c1d95, 4px 4px 0 #4c1d95, 6px 6px 12px #0006; }
```

- **Glow** (`glow` preset): `text-shadow: 0 0 .5em currentColor` → none with a short blur; never a blinking neon (≤ 3 flashes/s, WCAG 2.3.1).
- **Tracking-in look** (`converge` preset): letters start spread out (`--d` = signed distance from the middle letter × 0.45em) and fly together — the look of animating `letter-spacing` without re-laying-out the line every frame.
- **Fluid size**: `font-size: clamp(2rem, 6vw, 4.5rem)` or container units (`8cqi`) so a scene's title fits its frame in every language.

## Stagger without JS: sibling-index()

```css
@supports (top: calc(1px * sibling-index())) {
  .cascade > * { animation: webmovie-enter 600ms var(--webmovie-ease) both; animation-delay: calc((sibling-index() - 1) * 80ms);
                 --webmovie-o: 0; --webmovie-y: 16px; --webmovie-x: 0px; --webmovie-s: 1; --webmovie-r: 0deg; --webmovie-blur: 0px; --webmovie-dir: 1; }
}
```

Good for lists that animate on load or with a scroll timeline. webmovie's `stagger` preset sets `--i` itself (works everywhere and on view); use `sibling-index()` for CSS-only cases.

## Scroll-driven animations

Progress follows the scroll position — reading bars, parallax, reveal-as-you-scroll:

```css
@supports (animation-timeline: view()) {
  .webmovie-scroll { animation: webmovie-enter linear both; animation-timeline: view(); animation-range: entry 0% cover 35%; }
  .webmovie-progress { position: fixed; inset: 0 0 auto; block-size: 3px; transform-origin: left; animation: webmovie-bar linear both; animation-timeline: scroll(root); }
  .parallax-bg { animation: drift linear both; animation-timeline: view(); }
  @keyframes drift { from { translate: 0 -8%; } to { translate: 0 8%; } }
}
```

- Ranges: `entry`, `exit`, `contain`, `cover` + percentages. Named timelines: `view-timeline: --card block;` on one element, `animation-timeline: --card` on another, `timeline-scope: --card` on a common ancestor to share it.
- Firefox stable still has it behind a flag (2026-10) — never hide content in a way that needs it; outside `@supports` everything is the final frame.
- Scroll-linked text that the reader moves back and forth is fine; it never "runs by itself", so WCAG 2.2.2 does not apply — but respect reduced motion (webmovie's classes sit inside the `no-preference` block).

## Scroll-triggered animations

Different from scroll-*driven*: scrolling only decides **when** a normal time-based animation starts (it keeps its own duration and easing — exactly webmovie's "play on view"). Chromium 146+ only, so webmovie keeps IntersectionObserver; add it as an extra for CSS-only pages:

```css
@supports (timeline-trigger: --t view()) {
  .card { timeline-trigger: --t view() entry 100% exit 0%; animation: webmovie-enter 700ms var(--webmovie-ease) both; animation-trigger: --t play-forwards; }
}
```

## Entry and exit: @starting-style, allow-discrete

Animate an element *as it appears* (inserted by JS/Alpine `x-if`, a new chat message, a `[popover]` or `<dialog>` opening) — no JS animation code:

```css
.webmovie-appear { transition: opacity 400ms var(--webmovie-ease), translate 400ms var(--webmovie-ease),
                 display 400ms allow-discrete, overlay 400ms allow-discrete; }
@starting-style { .webmovie-appear { opacity: 0; translate: 0 10px; } }

dialog.webmovie-appear:not([open]) { opacity: 0; translate: 0 10px; }    /* exit state for dialogs/popovers */
[popover].webmovie-appear:not(:popover-open) { opacity: 0; translate: 0 10px; }
```

Put `transition-behavior`/`allow-discrete` *after* the `transition` shorthand (or inside it, as above) — the shorthand resets it. Without support the element simply appears.

## Height auto: interpolate-size

```css
:root { interpolate-size: allow-keywords; }            /* Chromium 129+; elsewhere it opens instantly */
details::details-content { block-size: 0; overflow: clip; transition: block-size 300ms var(--webmovie-ease), content-visibility 300ms allow-discrete; }
details[open]::details-content { block-size: auto; }
```

`<details>` content stays in the DOM (indexed, find-in-page opens it). Alternative: `block-size: calc-size(auto, size)`.

## View transitions

Same-document (a state change: filter, tab, language-free re-render):

```js
document.startViewTransition ? document.startViewTransition(() => update()) : update();
```

```css
.product-image { view-transition-name: hero; }          /* unique per page */
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 300ms; }
@media (prefers-reduced-motion: reduce) { ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; } }
```

Cross-document (normal links between pages of one origin — great for an MPA such as a Laravel/Blade site, the HTML stays server-rendered):

```css
@view-transition { navigation: auto; }                  /* both pages opt in */
```

Unsupported browsers just navigate. Keep transitions ≤ 300–400 ms; they must not delay the content.

## Combining animations: animation-composition

`animation-composition: add` lets an animation add to the element's own transform instead of replacing it — a hover nudge on top of an entrance, or two keyframe sets on one element:

```css
.badge { translate: 0 0; animation: float 3s ease-in-out 3 alternate, pop 600ms var(--webmovie-ease-spring) both; animation-composition: add, replace; }
```

## JS when needed: Web Animations API

For a sequence that CSS cannot express (wait for one to finish, then branch), use the browser's own API — no library:

```js
const a = el.animate([{ opacity: 0, translate: '0 12px' }, { opacity: 1, translate: '0 0' }],
                     { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
await a.finished;                     // then the next step
document.getAnimations().forEach((x) => x.pause());   // pause everything (a "pause" button)
```

Respect `matchMedia('(prefers-reduced-motion: reduce)').matches` — skip to the end state. When the animation ends, leave the element in its natural style (`a.cancel()` after committing, or no `fill`), like webmovie's final-frame rule.

## Sources

- MDN — Using CSS animations: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using
- Chrome — linear() easing: https://developer.chrome.com/docs/css-ui/css-linear-easing-function
- Chrome — CSS scroll-triggered animations: https://developer.chrome.com/blog/scroll-triggered-animations · CSS-Tricks first look: https://css-tricks.com/css-scroll-triggered-animations-first-look/
- Bram.us — scroll-triggered animations coming to Chrome: https://www.bram.us/2025/12/12/css-scroll-triggered-animations-are-coming-to-chrome/
- MDN — Experimental features in Firefox (scroll-driven flag): https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features
- Josh W. Comeau — Scroll-driven animations: https://www.joshwcomeau.com/animation/scroll-driven-animations/
- MDN — sibling-index(): https://developer.mozilla.org/docs/Web/CSS/sibling-index
- web.dev — Baseline entry animations (@starting-style, allow-discrete): https://web.dev/blog/baseline-entry-animations
- Chrome — Animate to height: auto (interpolate-size): https://developer.chrome.com/docs/css-ui/animate-to-height-auto
- Chrome — View Transition API: https://developer.chrome.com/docs/web-platform/view-transitions
- MDN — offset-distance: https://developer.mozilla.org/docs/Web/CSS/offset · ICS Media — offset path animations: https://ics.media/en/entry/230327/
- Smashing — Revealing images with CSS mask animations: https://www.smashingmagazine.com/2023/09/revealing-images-css-mask-animations
- freeCodeCamp — CSS-only pie chart (@property): https://www.freecodecamp.org/news/css-only-pie-chart/
- web.dev — Animated gradient text: https://web.dev/speedy-css-tip-animated-gradient-text/
- MDN — text-wrap: https://developer.mozilla.org/docs/Web/CSS/text-wrap
