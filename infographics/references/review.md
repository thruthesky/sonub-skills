# Review — check, then fix, every time

Run this after every version. Write the results into `brief.md` part D. A piece ships only when every item passes or the user accepted the remaining failure.

## 1. Five-second test (message)

- Look at the first screen (web) or the whole slide/card for 5 seconds — or list only the 3 largest text elements (`largestText` in the audit report).
- Pass: those elements state the topic **and** the core message from the brief.
- Fail signs: the largest text is a label ("Guide", "Overview", "Our service"); a lone number with no meaning next to it; a slogan that fits any product; the hero is decoration.
- Fix: rewrite the headline as the claim; move the hero up; make the deciding value the largest.

## 1b. Picture test (is it an infographic at all?)

- Blur the first screen and the full-page screenshot (or squint) until no word is readable.
- Pass: you can still see where the start is, how many options there are, what connects to what, which links are optional (dotted) and the order along each route.
- Fail signs: grey rectangles of text; tables and chip rows; no picture; relations only as ✔ marks or sentences.
- Fix: add the hero scene and item pictures; draw the relations (fork, route, connection map when nothing else shows it) — [lines-and-images.md](lines-and-images.md).

## 1c. Must-haves and filler

| Check | Pass |
| --- | --- |
| pictures | a hero scene in the first screen + one picture per item, one style, reused wherever the item appears; `visuals.images` ≥ 1 + items |
| lines | every relation and process in the fact inventory is drawn; legend with drawn samples; no line under a box or ending in space; `visuals.lines` > 0 |
| encoding | position/shape/size/color carry the data (routes, stations, dots, bar length) |
| filler | no sentence that repeats the picture or talks about the page (lead paragraphs, summary chips, "아래 표에서…"); no block that redraws a fact another block already shows; `visuals.longText` items each justified |
| compare | values the reader compares across items (time, price, steps) stand in one fixed column, one item per row — not scattered over a card grid |
| motion | the webmovie kit is loaded and the shots follow the motion plan (`check.mjs` `motion:` without ✗); webmovie's own `scripts/check.mjs` reports 0 errors; its middle frame shows the reading order, its last frame the finished page; the line layers draw after the boxes they join. An infographic made before webmovie is upgraded the first time it is touched (SKILL.md "Every task updates the infographic") |

## 1d. Readability (after the structure is right)

Read the slices at real size; zoom anything odd. Rules R1–R11 and code: [readability.md](readability.md).

| Check | Pass |
| --- | --- |
| labels | every fact line has a visible short label, not an icon alone |
| alignment | labels share one column width; compared values start on one vertical line |
| width | no thin text column (< ~40 characters) beside empty space; the action sits on the title row; phones show labels above values |
| markers | glossary/footnote markers once per page, none inside node/station/axis labels |
| rows of nodes | equal-width cells, header above; rows line up |
| fixed shapes | numbers and badges never wrap (`brokenShort` 0) |
| line spacing | no bundle of parallel lines; each line followable at a glance; paper visible between lines, between a line and the box edge it runs along, between dots; no dot on a picture corner or text (`crowding: lines:0 marks:0 edges:0`) |
| links | every drawn item with a page links to it (whole chip/card), right address in another language, outside sites in a new tab, coming-soon marked; `unlinked` = only items without a page |
| languages | de/ru (long), ar (RTL, tall script), 390 |

## 2. Thirty-second test (substance)

- Take the 3 reader questions from part A. For each, find the answer **on the graphic** with a specific value.
- Pass: all 3 answered with values ("주 3회 · 약 6주", "age 7+"), not vague words.
- Fix: the missing answer becomes a column, a label or a block; cut something weaker to make room.

## 3. Fidelity

- Every number, name, date and quote matches the source exactly (check each against the fact inventory).
- No `[GAP]` left, no estimated or "illustrative" numbers, no invented logos, people or results.
- Source rule: a source under every number from outside data; one source line for the piece's internal facts.
- For images: compare the text in the image with the prompt **word by word** — image models drop, repeat and misspell letters, especially in Korean/CJK/Arabic.

## 4. Hierarchy and density

| Check | Pass |
| --- | --- |
| hero | the block that answers the purpose is the largest — ≈ 40–60% of the slide or first screen (`blocks` in the report) |
| equal cards | no grid of same-size cards holding the main content |
| type levels | 4 sizes (± big numbers); title ≈ 2.5–3× body |
| specificity | every block holds at least one specific value, name or example |
| accent | the accent color is only on the key values, about 10% of the area or less (by eye — the script does not measure it) |
| emptiness | no empty area larger than a block that separates nothing |
| reading path | following size and position gives the planned order 1→N |

## 5. Defects

- Clipped or cut-off text (inside boxes, at the page or slide edge), overlapping text or shapes.
- Typos, wrong spacing, broken or substituted glyphs, mixed fonts.
- Contrast below 4.5:1 for body/notes.
- Narrow screen (≈ 390px): nothing overflows horizontally; tables scroll inside or become row cards with the same fields.
- RTL (if shipped): order, alignment and arrows mirror correctly.
- Every theme the project ships (light/dark/…): text and lines still readable.
- Lines: each one starts and ends at the right box (read the colors and ends one by one), none passes under a box, none floats; the phone layout's shapes (elbows) still reach every target; RTL mirrors them.

## The audit script (HTML)

```bash
node scripts/check.mjs https://example.localhost/page --widths 1440,768,390 --out /tmp/info-check --selector main
node scripts/check.mjs ./out/index.html --widths 1080 --out /tmp/info-check   # a local file works too
```

Output: `<out>/<width>.png` (full page), `<out>/<width>-01.png`… (one slice per screen height — open these; `--no-slices` to skip) and `<out>/report.json`:

| Key | Meaning | Action |
| --- | --- | --- |
| `largestText[]` | the 5 largest text elements, with `firstScreen` | the 5-second test: do these state topic + message? |
| `blocks[]` | each top-level block's `pageShare` and `firstScreenShare` (%) | the hero rule: the answer block ≈ 40–60% of the first screen |
| `pageOverflowX` | the page scrolls sideways at this width | find the wide element and let it wrap or scroll inside |
| `clipped[]` | text whose box is smaller than its content (hidden overflow, ellipsis) | widen, wrap, or shorten the text |
| `brokenShort[]` | a short text (≤ 6 characters, no space — "10", "12단계") rendered on two lines; the second line often falls outside its circle/chip and vanishes | `flex: none; white-space: nowrap` on the shape; give the row more width |
| `scrolledX[]` | a box that scrolls sideways because its content is wider (a table in a narrow column, long words in RTL or German) — part of each row is out of sight | let headers wrap, drop a column, or switch to the card layout at that width |
| `overlaps[]` | two text elements whose boxes intersect | fix the layout; never overlap text |
| `tinyText[]` | text below 12px | raise to the note size |
| `typeScale` | distinct font sizes with counts, `levels`, `titleToBody` ratio | > 6 levels or ratio < 2 → simplify the scale |
| `equalCardRows[]` | ≥ 3 siblings of the same kind and width laid out side by side (a card grid) | is this the main content? if yes, rebuild as a matrix/hero. Accept it (and say so in part D) for a numbered step rail or truly parallel items of the same kind that are not the answer to the purpose |
| `lowContrast[]` | text with contrast below 4.5 (3 for large) | darken the text or lighten the background |
| `colors` | distinct text and background colors | many colors → collapse to the palette roles |
| `visuals.images` · `imageShare` | pictures ≥ 48×48 px (img, canvas, video, background images) and their share of the area | 0 → fails the must-haves: add the hero and item pictures |
| `visuals.lines` | stroked, unfilled svg shapes (ig-lines.js connectors or hand-made svg; `lineSelector` option adds CSS-drawn ones) | 0 → fails the must-haves: draw the relations |
| `visuals.longText[]` | text blocks over 140 characters | cut filler, split into values, or move into a picture/line |

Then **look at every screenshot yourself**. The script cannot see that a page is boring, empty, or that the hero answers the wrong question.

Headless notes: the script starts its own Chrome (`CHROME_PATH` to override). Local HTTPS with a self-signed certificate is accepted. Pages that need a login need a public URL or a cookie the page sets itself.

## Fix loop

1. List failures in part D, most important first (message → picture test/must-haves → substance → fidelity → hierarchy → defects).
2. If the cause is the plan (wrong hero, missing column), fix parts B/C first, then the output.
3. Regenerate or edit, then run the whole review again — fixes break other things.
4. Stop after 3 rounds. Report what still fails, with the screenshot path, and what decision is needed.

## Report template

```
Core message: ...
Output: <paths/URLs>
5-second: pass — 3 largest = "...", "...", "..."
Picture test: pass — blurred, start + 4 colored branches + routes visible
Must-haves: pictures 5 (hero + 4 items, one style) · lines 29 (fork lanes, routes) · legend ✓ · filler 0 · duplicate blocks 0
Readability: labels ✓ · values aligned ✓ · markers once ✓ · station grid ✓ · ko/en/de/ru/ar × 1440/1100/390 read
30-second: Q1 ✓ (value) · Q2 ✓ (value) · Q3 ✗ (missing ...)
Fidelity: 14/14 facts match · gaps: none
Hierarchy/density: hero 52% · no equal-card rows · accent on 2 values
Defects: none at 1440/768/390 · ar RTL ok · dark ok
Audit: images 5 · lines 29 · clipped 0 · scrolledX 0 · brokenShort 0 · overlaps 0 · tinyText 0 · levels 6 · lowContrast 0
Images: prompt <path> · refs <path> · result <path>
Left for the user: [GAP] ...
```
