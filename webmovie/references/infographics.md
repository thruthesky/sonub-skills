# Animated infographics

Motion in an infographic shows **order and quantity**: what to read first, how big a value is, what leads to what. It never replaces the values — every number is text in the HTML, and the picture (bar length, ring, line) encodes the same number. For *what* to draw (choosing facts, pictures and connector lines) use the **infographics** skill; this file is about bringing that drawing to life.

## Contents

- [Sequencing a data scene](#sequencing-a-data-scene)
- [Counters](#counters)
- [Bars](#bars)
- [Rings and pies](#rings-and-pies)
- [Line charts and connectors](#line-charts-and-connectors)
- [Steps, timelines, routes](#steps-timelines-routes)
- [Comparison and before/after](#comparison-and-beforeafter)
- [Maps and icons](#maps-and-icons)
- [Rules](#rules)

## Sequencing a data scene

Reveal in reading order, each layer once:

1. **Frame** — title (`words`/`mask`) and the finding sentence (`fade-up`).
2. **Axes / tracks** — appear with the container (no motion of their own).
3. **Marks** — bars grow, lines draw, rings fill, in the order the reader should compare them (`stagger` on the rows, cascade 80–120 ms).
4. **Values** — numbers count while their mark grows (same element group, so they finish together).
5. **Annotation** — the highlight/arrow/callout that says "look here" comes last (`highlight`, `draw` on an arrow, `pop` on a badge).

Elements that enter the view together cascade automatically in DOM order (`--webmovie-cascade`), so writing the HTML in reading order *is* the choreography.

## Counters

```html
<p class="stat"><data class="num" value="12500" data-webmovie="count">12,500</data> <span>learners</span></p>
<p class="stat"><data class="num" value="98.6" data-webmovie="count" data-webmovie-count-dur="2000">98.6</data>%</p>
<p class="stat"><data class="num" value="2026" data-webmovie="count" data-webmovie-count-from="2000">2026</data></p>
```

- `value` = the displayed number (98.6, not 0.986); decimals of `value` decide the decimals while counting; `Intl.NumberFormat(<lang of the element>)` formats; the server string is put back at the end.
- The final width is reserved (`min-inline-size`) and digits are tabular — no jitter, no layout shift.
- Count only meaningful totals (1–4 per screen). A table of 40 numbers does not count.
- Years and IDs don't count from 0 — use `data-webmovie-count-from` or just `fade`.

## Bars

```html
<table class="bars">
  <caption>Share of time per task (sample)</caption>
  <tbody data-webmovie="stagger">
    <tr><th scope="row">Writing</th>
        <td><span class="track"><span class="webmovie-bar" data-webmovie="bar" style="--pct: 72"></span></span></td>
        <td><data value="72">72%</data></td></tr>
  </tbody>
</table>
```

```css
.bars .track { display: block; block-size: 12px; border-radius: 999px; background: var(--track); overflow: hidden; }
.bars .webmovie-bar { block-size: 100%; border-radius: inherit; background: var(--accent); }
```

- `--pct` (0–100) sets the final width in CSS (`.webmovie-bar { inline-size: calc(var(--pct) * 1%) }`); the animation is `scale: 0 1 → 1 1` from the inline-start side (right side in RTL) — no layout work.
- Vertical bars: put `--pct` into `block-size`, and override `transform-origin: bottom` + `@keyframes { from { scale: 1 0 } }` in your CSS.
- Values outside 0–100 (counts): compute the percentage of the largest value on the server.

## Rings and pies

```html
<figure class="ring">
  <svg viewBox="0 0 36 36" data-webmovie="ring" style="--pct: 80" aria-hidden="true">
    <circle class="webmovie-ring-track" cx="18" cy="18" r="15.9" />
    <circle class="webmovie-ring-fill" cx="18" cy="18" r="15.9" pathLength="100" />
  </svg>
  <figcaption><data value="80">80%</data> pages indexed</figcaption>
</figure>

<div class="webmovie-pie" data-webmovie="pie" style="--pct: 83" role="img" aria-labelledby="share"><b id="share">83%</b></div>
```

```css
.ring svg { rotate: -90deg; }                 /* start at 12 o'clock */
.ring circle { fill: none; stroke-width: 3.2; }
.webmovie-ring-track { stroke: var(--track); }
.webmovie-ring-fill { stroke: var(--accent); stroke-linecap: round; }
.webmovie-pie { inline-size: 140px; --webmovie-pie: var(--accent); --webmovie-pie-rest: var(--track); }
```

- Ring: SVG stroke with `pathLength="100"` → `stroke-dashoffset: calc(100 - var(--pct))`.
- Pie / donut: `conic-gradient` driven by the registered `--webmovie-p` (a hole: put a circle in the middle, as in the demo). Without `@property` support the pie simply shows its final value.

## Line charts and connectors

```html
<figure>
  <svg class="chart" viewBox="0 0 320 160" data-webmovie="draw" role="img" aria-labelledby="cap">
    <line class="grid-line" x1="20" y1="140" x2="310" y2="140" />
    <polyline class="series" pathLength="1" points="20,130 80,112 140,96 200,70 260,52 310,30" />
    <text x="20" y="156">2021</text><text x="290" y="156">2026</text>
  </svg>
  <figcaption id="cap">Visitors from search grew every year (sample).</figcaption>
</figure>
```

- Only shapes with `pathLength` draw; grid lines and labels just appear. Several series draw one after another (`--webmovie-stagger: 150ms`).
- Connector lines of an infographic (the infographics skill's `ig-lines.js` draws them from the layout): give the generated paths `pathLength="1"` and put `data-webmovie="draw"` on their SVG to draw them after the boxes appear.
- Data points: small circles with `data-webmovie="stagger"` on their group pop in after the line.

## Steps, timelines, routes

```html
<ol class="steps" data-webmovie="stagger">
  <li><b>Write the text</b> <span>Real HTML in the language file.</span></li>
  <li><b>Pick one effect</b> <span>One driver per moment.</span></li>
  <li><b>Check the frames</b> <span>Freeze at 0.2 s, 0.5 s, the end.</span></li>
</ol>
```

- `stagger` reveals children in order (80 ms, `--webmovie-y: 24px`). For a horizontal timeline set `--webmovie-x: -24px; --webmovie-y: 0px` on the list (mirrored in RTL).
- A route (stations on a line): draw the line (`draw`), then stagger the stations, then highlight the current one.
- Long lists (> 8 items): stagger only the first screenful; the rest appear on view as they scroll in (each row its own `data-webmovie="fade-up"`).

## Comparison and before/after

- Two columns: stagger the rows, not the columns, so pairs land together.
- Before/after image: two `<img>` in one frame, the "after" with `data-webmovie="wipe"` (or `reveal` for a soft edge) — both images are real `<img alt>`.
- A changing value ("from 20 % to 45 %"): `count` with `data-webmovie-count-from="20"` and a bar `--pct: 45`.

## Maps and icons

- SVG map regions: `stagger` on the region group, or `draw` on outlines; labels as `<text>` or HTML over the map.
- A moving marker: `offset-path` (see [techniques.md](techniques.md#motion-path-offset-path)) with `aria-hidden`.
- Icons: Font Awesome / inline SVG `pop` or `spring` with the label next to it; never an icon alone carrying the meaning.

## Rules

- Every value is text (`<data>`, table cell, caption); the motion and the shape show the same value.
- Same quantity, same motion: all bars grow the same way, all counters count the same time — differences must come from the data, not from animation choices.
- Total time of a data block ≤ ~2.5 s; no loops; no motion after the values have landed (except a single highlight).
- Charts start from a true zero (bars from the baseline, counters from 0 or a stated start).
- Check `node scripts/check.mjs` frames: at the middle frame, nothing reads as a wrong value for long (a counter at 9,756 for a second is fine; a bar resting at the wrong length is not).
