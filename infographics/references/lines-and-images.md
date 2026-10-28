# Lines and images — the two things that make it an infographic

A page of well-ordered tables, lists and cards is still a **document**. It becomes an infographic when the reader can see the structure before reading a word: **pictures** say what each thing is, **lines** say how the things connect. Both are required (SKILL.md "The four must-haves").

## Contents

- Line vocabulary — what each line means
- Patterns — which lines for which content
- Drawing lines in HTML — `assets/ig-lines.js`
- Pitfalls (each one happened)
- Images — roles, sizes, making a matching set with Codex
- The picture test

## Line vocabulary — what each line means

Pick the line from the meaning. Use the same line for the same meaning everywhere in the piece, and put a legend (with a drawn sample, not just words) next to the first block that uses a non-obvious line.

| Line | Means | Use for |
| --- | --- | --- |
| **straight** (horizontal/vertical) | "next" — order along one track | stations on a route, steps in a row, a timeline axis |
| **curve** (Bézier, leaves and enters at right angles) | "splits into" / "flows into" | a fork (1 → N), a merge (N → 1), many-to-many relations between two columns |
| **diagonal** (straight, at an angle) | "relates to / jumps to" across the layout | a shortcut, a cross-reference, a leader line from a picture detail to its label |
| **elbow** (right angles, rounded corners) | "belongs to / branches off" | a trunk with branches (phones), a tree, an org chart; a wrapped row continuing below (Z along the gap) |
| **solid** | required, actual, done | the main path |
| **dashed / dotted** | optional, planned, weak, "can skip" | optional steps, possible links |
| **arrowhead** | direction matters | only where the reader could read the order backwards — most routes do not need arrows; numbers already give the order |
| **thickness** | amount or importance | a main route thicker than side links (keep ≤ 2 weights) |
| **color** | identity of one item | one color per item (path, product, team) used on its line, its card border, its markers — see design-system.md "Category colors" |

Rules:
- A line always starts and ends **at the edge** of real boxes (never floats in space, never passes under text).
- Lines go **behind** boxes; where a box is in the way, route the line along a gap (gutter, row gap) instead of under the box.
- Never let a line carry the only copy of a fact. The same fact is also in text (a legend, "(optional)", a list order, a dot with spoken text) — screen readers, print and no-JS still get it.
- ≤ ~20 lines in one block; more becomes a hairball → group, or switch to a matrix with dots.

## Patterns — which lines for which content

| Content | Pattern | Lines | Example |
| --- | --- | --- | --- |
| one start, several options ("which path?") | **fork as trunk and branches**: a picture of the starting point → one start point below it → one trunk down the start gutter → a colored node and a short branch into each option card, one card per row | one neutral trunk (`data-ig-tree`), color only on each node and branch; **never a bundle of parallel lanes** (they ran 10px apart and read as one stripe) | `/guide` hub: crossroads illustration → gray trunk → 4 colored nodes → 4 path rows |
| several things feed one result | **merge** | curves converging on one node | sources → one report |
| items × shared parts (which items use which parts) — only if no other block already shows it | **bipartite connection map**: items left, parts right | curve per membership; solid = required, dashed = optional; colored by item | 4 paths ↔ 6 shared steps |
| an ordered route per item | **route / metro line**: stations in equal-width grid cells (header above) joined by the item's color line | straight within a row, Z (elbow) along the row gap where it wraps; optional station = dashed line + dashed border; station shared with other routes = double ring | each path's full step order |
| a picture with parts to name | **callout**: numbered dots on the picture + diagonal leader lines to HTML labels | diagonal | a screen with 3 buttons explained |
| hierarchy | **tree**: parent → children | elbow | team / folder structure |
| before → after, cause → effect | **two columns + arrows** | straight with arrowhead | old vs new process |

## Drawing lines in HTML — `assets/ig-lines.js`

A dependency-free script (no build). Copy it into the project (SONUB: `public/js/ig-lines.js`, kept identical by a test) and load it with `defer`. It draws an `<svg class="ig-svg">` behind each container's content and redraws on resize, font load and wrapping, so lines follow the real layout in every width, language and direction.

```html
<!-- fork: one start point below the picture, one trunk down the middle of the list's start gutter, a node + branch per card.
     The trunk runs from the start point's center to the last card's center; RTL puts it in the right gutter by itself. -->
<div class="fork" data-ig-lines>
  <figure class="fork-start">
    <img src="crossroads.webp" alt="…">
    <span class="origin" id="fork-origin"></span>
  </figure>
  <ol class="cards" data-ig-tree="fork-origin" data-ig-class="is-trunk">
    <li id="card-kids" data-ig-class="is-kids">…</li>
    <li id="card-ai" data-ig-class="is-ai">…</li>
  </ol>
</div>

<!-- bipartite: one source, several targets; ":dash" = dashed line to that target -->
<li id="track-it" data-ig-to="step-ai step-typing:dash" data-ig-from="end" data-ig-class="is-it">…</li>

<!-- route: consecutive children are joined; data-ig-dash = dashed line into that child -->
<ol data-ig-chain data-ig-class="is-kids"><li>1 …</li><li data-ig-dash>2 …</li></ol>
```

| Attribute / property | Values | Effect |
| --- | --- | --- |
| `data-ig-lines` | — | container; lines inside it are drawn in its own svg |
| `data-ig-to` | `id id:dash id:arrow` | one line per target |
| `data-ig-shape` · CSS `--ig-shape` | `curve` (default) · `straight` · `diagonal` · `elbow` | the CSS property wins → switch shapes in a container query |
| `data-ig-from` · CSS `--ig-from` | `top` · `bottom` · `start` · `end` · `bottom-start` | force the source side (start/end follow `dir`) |
| `data-ig-class` | class names | added to every line from this source (color by item) |
| `data-ig-in-class` | class names | added to every line that ends at this target |
| `data-ig-chain` | on a list | joins consecutive visible children; same row → straight, wrapped row → Z along the gap |
| `data-ig-dash` | on a chain or tree child | dashed line into it |
| `data-ig-tree` | on a list; value = id of the start element (optional) | one trunk down the middle of the list's start gutter (from the start element's center, or the list top, to the last child's center) + an `svg circle.ig-node` and a branch into each visible child; the trunk gets the list's `data-ig-class` plus `ig-trunk`, each node and branch the child's `data-ig-class` |

Style only with CSS: `.ig-line { fill: none; stroke: var(--track); stroke-width: 3; stroke-linecap: round }`, `.ig-line.is-dashed { stroke-dasharray: 2 7 }`, `.ig-node { r: 8px; fill: var(--track); stroke: var(--surface); stroke-width: 3 }`, and one rule per item color for lines and nodes (`:is(.ig-line, .ig-node).is-kids { --track: … }`). Theme tokens make dark mode work without JS.

Anchors are automatic: boxes that overlap horizontally connect bottom → top; otherwise the facing sides connect. A forced `bottom` start whose target sits beside the vertical run goes down a trunk and turns into the target's near side — reserve a **gutter** (padding on the card list) for that trunk.

## Pitfalls (each one happened)

- **id collisions**: an item `guide-sh-ai` and a step generated from `/ai` → `guide-sh-ai` — `getElementById` returns the first, lines go to the wrong box. Give each kind of node its own prefix.
- **A reset rule eats the gutter**: `.page :is(ul, ol)[role=list] { padding: 0 }` (specificity 0,3,1) beat `.page .cards { padding-inline: 1.75rem }`, so the trunk ran *under* the cards. Write resets with `:where(...)`.
- **Lines under boxes** look like wrong connections (a wrap curve hidden behind the next station read as "3 → 5"). Wrapped rows must use the Z along the row gap; give rows a gap ≥ 1.25rem.
- **Mixed directions**: a column of sources fanning to a column of targets must leave from the facing side, not the bottom — set `data-ig-from="end"`.
- **Long detours to far cards**: a 2×2 fork had its bottom cards fed by lines running down the outer gutters and in from the side — hard to follow, and the compared values sat in four different places. One card per row fixed it.
- **Parallel lanes and stacked dots**: the next version gave each card its own lane — four colored lines ~10px apart down a 3.5rem gutter, and four start dots overlapping on the picture's rounded corner. The user circled it: "각종 선이 너무 붙어 있지 않게". One trunk + nodes + branches (`data-ig-tree`), the start point below the picture. The audit now measures it (`crowding: lines / marks`).
- **A line hugging a box edge**: route wrap lines ran in a 22px row gap, 11px under the chip borders for the whole row — a second border, not a line. Row gap 2.4rem (`crowding: edges`).
- **Drawn items that go nowhere**: route stations were plain chips while the same steps were links on the track pages. Every drawn item with a page links to it — put the `<a>` *inside* the chained `li` so the lines keep attaching to the box (SKILL.md "Link every item").
- **Two blocks, one fact**: a connection map of shared steps repeated what the routes already showed with double-ring stations → the user asked to delete it. Draw a fact once.
- **Lines are drawn after layout**: screenshot tools must wait for fonts + one frame (`check.mjs --wait 1500`).

## Images — roles, sizes, making a matching set with Codex

An image earns its place by **identifying** something (this card is the playground path) or **showing** something text cannot (the situation, the device, the place). Decoration that carries no fact still fails (see the slide-poor example) — but a page with **no** image fails the must-haves.

| Role | Size (web 1440 / phone) | Count | Example |
| --- | --- | --- | --- |
| **hero scene** — the whole story in one picture | ≥ 50% of the content width / full width; first screen | 1 | crossroads with four destinations |
| **item picture** (spot illustration) — one per option/item, same style | 4–5rem / 3.25rem on cards; 2.5rem as a marker on lines and rows | 1 per item, reused everywhere that item appears | playground, observatory, workshop, office |
| **evidence** — screenshot, real photo, quote card | as large as the claim needs | when the source has one | a real screen of the app |
| **icons** (font icons) — scan aids for fact types | 1–1.5× text | one per fact type | user = target, clock = time, flag = outcome |

Make a matching set (style is consistency — same outline, palette, light, background):

1. Make (or pick) the **hero first**. It sets the style.
2. Make each **item picture with the hero as the reference image** and the same style paragraph, one subject each ("the same destination as in the reference, isolated as a vignette"), square, a plain background equal to the page paper color (`#f5f3f0` in SONUB), no text, no people unless needed.
3. Run them in parallel (`scripts/codex-image.sh <dir>/<name>.webp prompt.txt <hero>` × N), open every result and compare: same outline weight? same palette? no letters? If one drifts, regenerate only that one with the drift named in the prompt.
4. Page images carry **no words** (translation, zoom, search) — labels are HTML next to them; alt text states what the picture shows; item pictures beside their own title get `alt=""`.
5. Remove the generator's logs and reference copies from public folders; keep `<name>.prompt.txt` beside each image.

Reuse the item picture everywhere the item appears (card, line endpoint, route header): the picture becomes the item's visual name, like the line color.

## The picture test

Blur the page (or squint) so no text is readable. Pass when you can still tell:
1. where the start is and how many options there are,
2. which things connect to which, and which are optional (solid vs dashed),
3. the order along each route.

If the blurred page is a stack of grey rectangles, it is a document — add the pictures and lines before polishing anything else.
