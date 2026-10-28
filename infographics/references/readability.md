# Readability — make the drawn structure easy to read

A page can pass the must-haves (pictures, lines, encoding) and still be hard to read. The structure is right, but the eye has to work: it hunts for what a line means, reads long thin columns, trips over markers, and zigzags across uneven rows. This file is the rule set for the second pass — **"the structure is fine, now make it readable"** (user on `/guide`, 2026-10-22).

## Contents

- The rules (R1–R11)
- Patterns with code — labeled facts, station grid, fixed shapes, trunk and branches, linked stations
- How to check readability (not only the audit)
- Case — `/guide` before and after

## The rules

| # | Rule | Why | Fails when |
| --- | --- | --- | --- |
| R1 | **Every fact line has a visible short label** ("대상 · 기간 · 단계 · 마치면") — an icon alone is not a label | the reader must know what a line *is* before reading it; icons (person, flag) are guessed | icon-only rows; the outcome sentence that could be the target |
| R2 | **Labels in one column of equal width across items**, values start on the same vertical line | the eye compares item to item by reading down one edge | each card aligns its values differently; a value column squeezed beside a half-empty side column |
| R3 | **Value > label**: values in body size and ink, labels smaller and muted; the deciding value (time) in the accent | the content is the value, the label only names it | labels as loud as values; values muted and small |
| R4 | **Give text the width.** Long text (who, outcome) gets the widest column; move actions (button) to the title row; on phones put the label **above** the value | a 3-line target in a 280px column is harder than a 1-line one in 600px | a fixed side column that is mostly empty; labels beside values on 390px |
| R5 | **Markers once, never on diagram labels.** Glossary underlines / "?" badges / footnote marks: first occurrence on the page only (one group for the whole page); none inside node, station or axis labels | markers break words and lines ("인공지능 연습(" / "프롬프트?)"); repeated markers turn a page into noise | every card and station marks "AI" again; a marker splits a chip into two lines |
| R6 | **Repeated nodes on a grid.** Stations, steps, chips in a row → equal-width cells (`repeat(auto-fill, minmax(13rem, 1fr))`), header **above** the row, not in a side column | positions line up row to row; wrap lines become regular; the header no longer eats the row width | content-width pills that wander, so every row ends at a different x and the Z-wrap lines zigzag |
| R7 | **Fixed shapes never shrink or wrap.** Number circles, badges, pills with 1–6 characters: `flex: none; white-space: nowrap` | in a flex row a long label squeezes the circle; `overflow-wrap: break-word` then breaks "10" into "1" / "0", and the "0" lands outside the white circle — invisible | a station shows "1" where the data says 10 (`audit.brokenShort`) |
| R8 | **Script-specific spacing only where it helps.** A tall line-height for Arabic paragraphs (1.95) must not reach compact chips | chips become 85px tall and two-line names look like two items | a page-wide `:lang(ar) p, li { line-height }` rule hits list-item chips |
| R9 | **Same role, same size.** All item titles one size, all section titles one size; type levels ≤ 6 incl. shared widgets | every extra size is a new rank the eye has to place | card title 1.25rem and route title 1.1rem side by side |
| R10 | **Lines with air.** Never a bundle of parallel lines: several items from one start → **one trunk** with a colored **node and short branch** per item. Lines ≥ 12px apart (`crowdedLines`), a line running along a box edge ≥ 14px from it (`hugEdges` — widen the gap the line runs in), dots and nodes ≥ 4px apart (`crowdedMarks`), start points off picture corners and off text | the eye follows a line by the empty space around it; two lines 10px apart, or a line 11px under a chip border, read as one thick stripe or a second border, and stacked dots read as one blob | four colored lanes 10px apart; four start dots overlapping on a picture's rounded corner; wrap lines squeezed into a 22px row gap |
| R11 | **Every drawn item links to its page.** Station, step, card, node → the page that explains it, at the address the site already uses; outside sites in a new tab; "coming soon" pages still linked and marked; only items with no page stay plain | the infographic is the reader's map of the whole site — a station you cannot click is a dead end and the reader has to search the menu | route stations as plain chips while the same steps are links on the track page |

## Patterns with code

### Labeled facts (R1–R4) — a definition list whose label column is shared

```html
<li class="path" data-track="ai">
  <img class="pic" src="ai.webp" alt="">
  <h2 class="title"><a href="/guide/ai">AI Learning Guide</a></h2>
  <a class="go" href="/guide/ai">View this guide →</a>
  <dl class="facts">
    <div><dt><i class="fa-user"></i>For</dt><dd>Middle school and up · …</dd></div>
    <div class="time"><dt><i class="fa-clock"></i>Time</dt><dd>3 sessions a week · about 6 weeks</dd></div>
    <div><dt><i class="fa-list-ol"></i>Steps</dt><dd>6 steps · 4 required</dd></div>
    <div><dt><i class="fa-flag"></i>Then you can</dt><dd>explain how a model picks the next word …</dd></div>
  </dl>
</li>
```

```css
.path { display: grid; grid-template-columns: 4.5rem minmax(0, 1fr) auto;
        grid-template-areas: 'pic title go' 'pic facts facts'; gap: .75rem 1.25rem; align-items: center; }
.facts { grid-area: facts; display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: .45rem 1rem; align-items: baseline; }
.facts > div { display: contents; }                 /* dt/dd become cells of the shared grid */
.facts dt { color: var(--muted); font-size: .85rem; } /* R3 */
.facts dd { margin: 0; font-size: 1rem; }
.facts .time dd { color: var(--accent); font-weight: 750; }
.go { grid-area: go; white-space: nowrap; }          /* R4: the action sits on the title row */
@container (max-width: 34rem) {                       /* R4: phones — label above value */
  .path { grid-template-columns: 2.75rem minmax(0, 1fr); grid-template-areas: 'pic title' 'facts facts' 'go go'; }
  .facts { grid-template-columns: minmax(0, 1fr); row-gap: .7rem; }
  .facts > div { display: grid; gap: .1rem; }
}
```

`max-content` gives every card the same label width (same labels, same language), so the values of all cards start on one vertical line. `align-items: baseline` keeps a label on the first line of a two-line value.

### Station grid (R6, R7)

```css
.route-row { display: grid; gap: .9rem; }                       /* header above, stations below */
.stations { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr)); gap: 1.4rem 1.75rem; }
.station { display: flex; align-items: center; gap: .55rem; min-block-size: 2.75rem; border-radius: var(--radius-l); }
.station .stop { flex: none; white-space: nowrap; }              /* R7 */
:lang(ar) .station, :lang(ur) .station { line-height: 1.6; }     /* R8 */
```

With `assets/ig-lines.js` (`data-ig-chain`) the lines run straight between cells in a row, Z along the row gap at a wrap, and become one straight vertical line when the grid collapses to one column on phones.

### Trunk and branches (R10) — one start, several items, no parallel bundle

```html
<div class="fork" data-ig-lines>
  <figure class="start"><img src="hero.webp" alt="…"><span class="origin" id="fork-origin"></span></figure>
  <ol class="paths" data-ig-tree="fork-origin" data-ig-class="is-trunk">
    <li data-ig-class="is-kids">…card…</li>
    <li data-ig-class="is-ai">…card…</li>
  </ol>
</div>
```

```css
.fork { --gutter: 3.5rem; display: grid; gap: 1.75rem; }
.paths { padding-inline-start: var(--gutter); }                 /* the trunk runs down the middle of this gutter */
.start { position: relative; }
.origin { position: absolute; inset-block-end: -1.6rem;          /* below the picture, not on its corner */
          inset-inline-start: calc(var(--gutter) / 2); margin-inline-start: -.6rem; inline-size: 1.2rem; block-size: 1.2rem;
          border-radius: 50%; background: var(--muted); box-shadow: 0 0 0 3px var(--surface); }
.ig-line.is-trunk { stroke: var(--muted); }
.ig-node { r: 8px; fill: var(--track); stroke: var(--surface); stroke-width: 3; }
@container (max-width: 34rem) { .fork { --gutter: 2.75rem; } }
```

`ig-lines.js` draws the trunk from the origin's center to the last item's center, a node at each item's vertical center, and a branch to the item's start edge (end edge in RTL — the trunk moves to the right gutter by itself). One line in the gutter, one color per item only where it meets the item: nothing to untangle.

### Linked stations (R11) — the whole chip is the link, the lines stay attached

```blade
@php($tag = $step['href'] ? 'a' : 'span')
<li class="station" data-ig-dash?><{{ $tag }} class="station-link"
    @if ($step['external']) href="{{ $step['href'] }}" target="_blank" rel="noopener noreferrer"
    @elseif ($step['href']) href="{{ lurl($step['href']) }}" @endif>
  <span class="stop">3</span><span class="name">AI basics</span>
  {{-- external: icon + read-aloud "opens a site" · coming soon: icon + read-aloud "in progress" --}}
</{{ $tag }}></li>
```

```css
.station { display: flex; border: 2px solid var(--track); border-radius: var(--radius-l); }   /* the chain child keeps the box */
.station-link { display: flex; flex: 1; align-items: center; gap: .55rem; padding: .35rem .8rem .35rem .4rem;
                border-radius: inherit; color: inherit; text-decoration: none; }
a.station-link:hover { background: color-mix(in srgb, var(--track) 12%, var(--surface)); }
a.station-link:hover .name { text-decoration: underline; }
a.station-link:focus-visible { outline: 3px solid var(--track); outline-offset: 4px; }
```

Keep the `li` as the chained element (lines attach to its box) and put the link inside it, so hover and focus never move the box. Use the same address field and helper as the item's own page.

### Markers once (R5)

Give every marker on the page the same group (SONUB: `<x-glossary.text … group="guide-hub" />`) and render diagram labels as plain text. Test it: on the page body, each term id appears at most once, and no marker sits inside a route/station list.

## How to check readability

The audit finds defects, not effort. Do both:

1. **Read the slices at real size**, not the full-page thumbnail (`check.mjs` writes `<width>-01.png …`; open each). A thumbnail hides wrapped digits, markers and three-line columns.
2. **For each block ask**: can I tell what each line is without reading it (R1)? Do the values I compare start on one vertical line (R2)? Is any text column under ~40 characters while space sits empty next to it (R4)? Any marker inside a label or repeated (R5)? Do rows of nodes line up (R6)?
3. **Long and RTL languages**: check `de`/`ru` (long labels) and `ar` (mirrored, tall script) — the label column grows, chips wrap.
4. **Phone** (390): labels above values, one station per row with a straight line.
5. **Suspicious item? Zoom it**: `--selector "<item>" --clip --eval "document.querySelector('<item>').style.zoom=4"`. The "1" that was "10" was found this way.
6. **Audit**: `brokenShort` must be 0 (short text wrapped onto two lines); `levels` ≤ 6; `crowding: lines:0 marks:0 edges:0` (R10); `unlinked` lists only items that have no page (R11).
7. **Lines at real size** (R10): in the slices, can you follow each line with one glance from start to end? Is there visible paper between every two lines, between a line and the box it runs along, between two dots? Is any dot sitting on a picture corner or on text?
8. **Links** (R11): hover and tab through the drawn items — every item with a page is a link, the address is right in another language, outside sites open a new tab.

Write the findings and fixes in brief part D under **Readability**.

## Case — `/guide` (2026-10-22)

The user accepted the structure (crossroads picture → lanes → path cards → routes) but said it was hard to read. Measured problems and fixes:

| Problem seen | Rule | Fix |
| --- | --- | --- |
| icon-only fact lines; a 280px text column beside a mostly empty fixed side column; the time broke as "… 4 / 주 · 10개" | R1 R2 R4 | definition list with labels 대상 · 기간 · 단계 · 마치면 (`guide.fact_*`, 17 languages), button moved to the title row, values ~600px wide |
| "인공지능 ?" marked in every card and station; station names split by markers | R5 | one glossary group `guide-hub`; station names plain; test: each term once in the hub body |
| content-width station pills, rows ending at different x, zigzag wraps; the track name in a 12rem side column | R6 | equal 13rem cells, track header above the stations |
| IT station 10 showed "1" in Arabic (the "0" wrapped outside the circle) | R7 | `flex: none; white-space: nowrap` on the circle; new audit check `brokenShort` |
| Arabic chips 85px tall | R8 | chip line-height 1.6 for ar/ur |
| 7 type levels | R9 | card and route titles both 1.2rem → 6 |
| phone: values in a 3-line narrow column | R4 | labels above values under 34rem |

Result: ko · en · de · ru · ar × 1440/1100/390, dark and pink — clipped 0, scrolledX 0, brokenShort 0, overlaps 0, tinyText 0, lowContrast 0.

**Second round, the same day — the user circled the fork start and wrote "각종 선이 너무 붙어 있지 않게"; then pointed at the route stations: "각 항목에 링크가 빠져 있습니다".** The checks above had passed; the audit did not measure line spacing or links at all.

| Problem seen | Rule | Fix |
| --- | --- | --- |
| four colored lanes ~10px apart down the start gutter, four start dots overlapping on the picture's rounded corner | R10 | one gray trunk from one start point **below** the picture, a colored node (r 8, surface ring) and a short branch per card (`data-ig-tree`); new audit `crowdedLines` / `crowdedMarks` (old: lines 3, marks 3 → new 0 / 0) |
| route wrap lines running 11px under the chip borders for ~540px | R10 | row gap 1.4rem → 2.4rem; new audit `hugEdges` (1.4rem: 34 → 2.4rem: 0) |
| route stations were plain chips, the same steps were links only on each track page | R11 | each station is a link to its step page (same `href` and `lurl()` as the track page, VS Code in a new tab, coming-soon pages marked with an icon + read-aloud text), the group step without a page stays plain; audit `unlinked` = 1 (that step); test per station |

Result: ko · en · de · ru · ar × 1440/1100/390, dark, pink — crowding lines 0 · marks 0 · edges 0, unlinked 1 (the group step), other checks 0.
