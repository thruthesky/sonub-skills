# Visual forms — pick the form from the content

Every form here is **drawn**: it has pictures (hero, one per item) and lines where things relate or follow each other. Line vocabulary and the line script: [lines-and-images.md](lines-and-images.md).

## Contents

- Content → form table
- Layout skeletons (hero + satellites)
- Making a block "full"
- HTML patterns
- Forms to avoid

## Content → form table

| Content in the source | Use | Must show on the graphic | Avoid |
| --- | --- | --- | --- |
| 2–6 options compared on the same attributes | **comparison matrix** (rows = options, columns = attributes); highlight the row/column that answers the purpose | every cell filled with a value, units in the header, the deciding column first | one card per option with different fields in each (the reader cannot compare) |
| before vs after, old vs new, myth vs fact | **two-column contrast** with the same rows on both sides | the same attribute on each row, the difference in the accent | two separate paragraphs |
| change over time | **line or bar chart**, time on the horizontal axis | value labels on the points that matter, start and end values, date range, source | 3D, dual axes, decorative area fills |
| sizes / ranking | **horizontal bar chart**, sorted | the value written at the end of each bar | pie with > 4 slices |
| share of a whole | **stacked bar** or 100% bar; donut only for one share | percentages written on the segments, the total | several donuts side by side |
| ordered steps | **numbered flow** (arrows); branch points as diamonds/forks | step number, a verb-first label, the output of each step, time per step if known | a generic "1 choose → 2 learn → 3 do" flow that fits any product |
| a long sequence (> 6 steps) | **step rail / timeline**, grouped into phases | phase names, which steps are required | 12 equal boxes in a grid |
| part-of, nesting | **nested boxes** or indented tree | containment drawn as containment | arrows (they read as order) |
| shared parts, dependency, cause | **connection diagram** (nodes + labelled lines) or overlap (Venn ≤ 3 sets) | what each line means, written on the line | lines with no label |
| one striking number | **big number** + unit + one-line meaning + source + comparison point | what the number means and against what | a lone number in a big circle |
| a case, quote, screenshot | **evidence card** placed next to the claim it proves | who / where / when | stock illustration in place of evidence |
| a decision ("which one is for me?") | **decision tree** (2–3 questions) or the matrix's first column as "who" | the question at each fork, the answer at each leaf | a list of options without the criteria |
| one start, several options | **fork**: hero picture → one start point → one trunk with a node and branch per option → one option card per row (picture · name · button on the title row + labeled facts: who · time · count · outcome) | each option's picture and color, labels in one shared column so the values line up | a table alone; cards with no link to the start; a 2×2 grid that scatters the values; a bundle of parallel lanes |
| items × shared parts | **connection map** (bipartite): items on one side, parts on the other, a curve per membership | solid = required, dotted = optional; the parts all items reach highlighted | a ✔/✘ table as the only form |
| an ordered route per item | **route / metro line**: stations in equal-width cells joined by the item's color line, the item header above | numbers, optional stations dotted, shared stations double-ringed, a legend with drawn samples | chips in a row with no line between them |
| parts of a picture | **callout**: numbered dots on the picture + leader lines to HTML labels | the label at the end of each line | text over the picture |

## Layout skeletons

Pick one; the hero zone is where block 1 (the answer to the purpose) goes.

```
A. Hero top                B. Hero side                 C. Matrix page
┌──────────────────────┐   ┌───────────────┬────────┐   ┌──────────────────────┐
│ headline + summary   │   │ headline      │ 3 key  │   │ headline + summary   │
├──────────────────────┤   │ + summary     │ numbers│   ├──────────────────────┤
│ HERO (50%)           │   ├───────────────┤        │   │ MATRIX (rows=options │
│                      │   │ HERO (55%)    ├────────┤   │  cols=attributes)    │
├───────┬───────┬──────┤   │               │ case   │   │                      │
│ blk 2 │ blk 3 │ blk 4│   │               │ card   │   ├───────────┬──────────┤
├───────┴───────┴──────┤   ├───────────────┴────────┤   │ diagram   │ case/tip │
│ conclusion / action  │   │ conclusion strip       │   ├───────────┴──────────┤
└──────────────────────┘   └────────────────────────┘   │ conclusion / action  │
                                                         └──────────────────────┘
D. Slide (16:9)                                E. Phone (one column)
┌────────────────────────────────────────┐    headline → summary chips → HERO
│ series label        (small, top-start) │    (table becomes row cards with the
│ CLAIM TITLE                            │     SAME labelled fields in the same
│ one-line lead                          │     order) → blocks → conclusion
│ ┌─────────── visual (60%) ──┐ ┌side──┐ │
│ └───────────────────────────┘ └──────┘ │
│ ███ conclusion strip ███████████████████│
└────────────────────────────────────────┘
```

Satellite blocks (2–4) are visibly smaller than the hero and differ in form from each other when their content differs (a number, a diagram, a case) — a row of three identical boxes is acceptable only when they really are three parallel items of the same kind.

## Making a block "full"

A block is full when it carries, in this order of priority:

1. **The visual** with real values inside (table cells, bar values, step labels).
2. **One supporting number** with a unit and a comparison ("12 steps — 3× the kids path").
3. **One short explanation** (≤ 2 lines) that says what the visual means for the reader.
4. **One case** when the source has one (a quote, a screenshot, a named example, "at the end you can…").
5. **A source note** under any number from outside data (internal facts: one source line for the whole piece — see SKILL.md "Source rule").

Checklist when a layout looks empty — or looks like plain text:
- Is there no picture? → add the hero scene and one item picture per option (lines-and-images.md "Images").
- Are relations or order only written? → draw them (fork, route, connection map) — once each.
- Is there an area larger than a block that holds one sentence or one number? → put the hero there, or fill it with the supporting numbers and case.
- Is the hero a banner with a slogan? → replace with the matrix/chart/flow that answers the purpose.
- Are there decorative circles or illustrations that identify nothing? → replace them with item pictures or remove them.
- Is a block generic (would fit any product)? → replace with a specific value from the fact inventory, or cut it.

Do not fix emptiness by shrinking text below the minimum or by removing the gaps between groups.

## HTML patterns

- **Text stays text, and pictures and lines are required.** Titles, numbers, labels and steps are HTML elements (selectable, searchable, translatable, read aloud). Around them: a hero `<img>` and one item picture per option (Codex, one style), and connector lines drawn with `assets/ig-lines.js` (`data-ig-lines` · `data-ig-to` · `data-ig-chain`). Never put words inside page images; never let a line be the only copy of a fact.
- **Matrix**: a real `<table>` with `<th scope="col">` and `<th scope="row">`. On narrow screens, either scroll inside the table or turn each row into a card that keeps the same labelled fields (`<dl>`), in the same order.
- **Flow**: an ordered list (`<ol>`) with arrows drawn in CSS; horizontal when wide, vertical when narrow (container query on the block's width, not the window).
- **Chart**: bars as elements whose length comes from the same value as the printed label (one source of truth, e.g. a CSS variable `--value`); the value is always printed.
- **Connection diagram / fork / route**: grid or flex placement of HTML nodes + `ig-lines.js` for the lines (it redraws on resize and wrapping, mirrors in RTL). Switch shapes for phones with CSS `--ig-shape` in a container query (fork curves → elbow trunk). Reserve gutters and row gaps for lines (a line running along a box edge stays ≥ 14px from it — route row gap 2.4rem; lines ≥ 12px apart); lines run behind boxes, never under text. Each drawn node with a page is a link to it.
- **Logical properties** (`margin-inline-start`, `inset-inline-end`) so RTL mirrors without extra CSS; mirror arrows in RTL.
- **Use the project's components and tokens** for cards, tables, steps and colors before writing new ones.

## Forms to avoid

- Equal-card grid for content that has a clear winner, an order, or a comparison.
- Icon + label + one generic sentence as the main content.
- A number without unit, date, source or comparison.
- Pie charts with many slices, 3D charts, gauges for non-score values.
- Arrows between things that are not ordered.
- Text inside images on a web page (cannot be translated, searched or zoomed).
- **A page with no picture or no line** — tables, chips and lists only. It is a document, however tidy (the "text-only" example).
- **Filler sentences**: a lead that explains how to read the page ("아래 표에서 나와 맞는 줄을 찾아요"), summary chips that repeat the hero, "Here is an overview of…".
- **Duplicate blocks**: a second block drawing a fact the first already shows (a shared-steps map beside routes that ring the shared stations).
- **Compared values scattered over a card grid** (2×2 cards with the time in four places) — one item per row, the value in one column.
- Decorative pictures that identify nothing (stock people, a piggy bank) — every picture names an item or shows a fact.
