# Poor → text-only → good — one source, three results

All three are built from the **same source** (SONUB's learning guide: four tracks, their targets, durations, steps and outcomes — `App\Content\Guide` + `lang/ko/guide.php`). The difference is what was chosen, whether it was **drawn**, and how the eye moves.

| | Poor | Text-only | Good |
| --- | --- | --- | --- |
| What it is | decoration — equal cards, a big "4", a generic flow | correct information in tables, chips and lists — a document | a picture of the information — hero scene, one trunk with a colored node and branch into each one-row path card, metro routes whose stations link to their pages |
| HTML | [guide-poor.html](../assets/examples/guide-poor.html) | [guide-text-only.html](../assets/examples/guide-text-only.html) | [guide-good.html](../assets/examples/guide-good.html) (standalone, uses `../ig-lines.js`, `img/` and the webmovie kit from `../../../webmovie/` — headline mask → hero wipe → cards stagger → trunk wipes in → routes) |
| Screenshot | [guide-poor.png](../assets/examples/guide-poor.png) | [guide-text-only.png](../assets/examples/guide-text-only.png) | [guide-good.webp](../assets/examples/guide-good.webp) · phone [guide-good-phone.webp](../assets/examples/guide-good-phone.webp) (the real sonub.com `/guide`) |
| Verdict | fails 5-second test | passes 5- and 30-second tests, **fails the picture test and the must-haves** | passes all |

Open the three screenshots side by side before reading on.

## Contents

- Information amount
- Pictures and lines
- Structure and eye flow
- Filler text
- Audit numbers
- What to copy from the good one
- Second case — a slide image (Codex)

## Information amount

| Fact from the source | Poor | Text-only | Good |
| --- | --- | --- | --- |
| who each path is for | ✗ a feeling sentence | ✓ target column | ✓ on each card, with a person icon |
| time per path | grey, inside cards | ✓ accent column | ✓ accent, labeled 「기간」, starting on the same vertical line in all four rows |
| steps / required steps | count only | ✓ "12단계 · 필수 10" | ✓ same, plus the whole route drawn |
| what you can do at the end | ✗ | ✓ | ✓ with a flag icon |
| full step order | first 4, then "외 8단계 더" | ✓ numbered chips | ✓ stations joined by the path's line; optional = dotted |
| shared steps | ✗ | ✓ ✔/✘ table | ✓ a double ring on every station other paths also pass (a separate connection map was cut as a duplicate) |
| which picture is which path | ✗ | ✗ | ✓ one picture per path, reused on card and route |

Text-only and good carry about the **same facts**. The difference is that the good one draws the relations the text-only one only lists.

## Pictures and lines

- **Poor**: one decorative illustration that identifies nothing; no lines.
- **Text-only**: no images (it took "text must stay text" as "no pictures"), no lines — relations are ✔ marks in table cells, order is chip numbers. Blurred, it is a stack of grey rectangles: the picture test fails.
- **Good**:
  - the **hero scene** — a crossroads whose four paths lead to a playground, an observatory, a workshop and an office — is the whole message in one picture;
  - one **start point** just below the picture starts one gray **trunk** down the start gutter; a **colored node** and a short **branch** lead into each path card (one card per row) — nothing runs side by side, so nothing has to be untangled;
  - each path has a **picture** (the same destination, made with the hero as Codex reference) and a **color** used on its card border, its lines, and its route;
  - each card lists its facts with **visible labels** (대상 · 기간 · 단계 · 마치면) in one shared label column;
  - each **route** is a metro line: the header above, stations in equal-width cells joined by straight segments, a Z along the gap where the row wraps, a double ring on stations shared with other paths, a legend with drawn samples; **every station is a link** to that step's page (outside site in a new tab).

  Blurred, you still see one start, one trunk branching into four rows, four routes of different length.

## Structure and eye flow

- **Poor**: slogan banner → generic flow → equal cards. The eye lands on a question and a meaningless "4".
- **Text-only**: claim → chips → table → table → chips. Correct, but every block has the same grey weight; the eye reads line by line like a document.
- **Good**: claim (one line) → the crossroads picture (largest element) → the trunk and its four colored nodes pull the eye down into the four rows → the routes → conclusion strip. The lines *are* the reading path; every fact has a label in one shared column, so comparing the times is one glance down.

An earlier good version had 2×2 cards and a connection map. The user: the cards were "가독성이 매우 떨어진다" (the bottom cards were fed by long side detours; the times sat in four places) and the map was "중복된 내용". Rows + lines from the hero + cutting the map fixed both — see SKILL.md step 3 "Line up what the reader compares". A last pass fixed readability with the structure unchanged (labels, markers once, station grid, numbers that never wrap); then the four parallel lanes and stacked start dots were replaced by one trunk with nodes ("각종 선이 너무 붙어 있지 않게") and the stations became links ("각 항목에 링크가 빠져 있습니다") — [readability.md](readability.md) "Case".

## Filler text

The text-only version had a lead ("길마다 누구에게 맞는지, 얼마나 걸리는지 … 아래 표에서 나와 맞는 줄을 찾아요") and three summary chips ("4가지 길 · 길마다 4~12단계 · 모든 길이 지나는 단계: …"). The user: "필요없는 말을 덕지덕지". Both only repeat what the diagram shows or describe the page itself → cut. The good version has one headline, values, and ≤ 2-line outcomes — no sentence about the page.

## Audit numbers (`scripts/check.mjs`)

| Check | Poor | Text-only | Good |
| --- | --- | --- | --- |
| `visuals.images` · `lines` | 1 · 0 | **0 · 0 ✗** | 5 · 29 (page) / 5 · 18 (standalone) |
| `largestText` | 72px "4" | 40px claim | 40px claim |
| hero (`blocks`, first screen) | slogan 37% | table 20–57% | picture + fork |
| equal-card grids | 3 | 0 | 1 — the related-pages links under the page (not part of the infographic) |
| clipped · overlaps · tiny · low contrast | 0 · 0 · 0 · 0 | 0 · 0 · 0 · 0 | 0 · 0 · 0 · 0 |

All three are mechanically clean. Only `visuals` and the picture test separate text-only from good — that is why both are now in the audit and the review.

## What to copy from the good one

1. Headline = claim. No lead paragraph, no summary chips.
2. Hero = one picture that holds the whole story, placed first.
3. Lines from the hero into the options — one trunk, a node and branch per option, never a bundle of lanes; one option per row; labeled facts whose values line up; one color and one picture per option, reused everywhere.
4. Relations drawn (double-ring stations, trunk and branches), not ticked in cells — and each fact drawn once.
5. Every drawn item links to its page on the site.
5. Order drawn as a route; optional = dotted line and border, plus "(선택)" in spoken text.
6. A legend with drawn samples next to the first non-obvious line.
7. Every value from the source; nothing invented.
8. Readable: markers once, plain labels in diagrams, stations on an equal grid, numbers that never wrap — [readability.md](readability.md).

## Second case — a slide image (Codex)

Source: SONUB's grant application, section 1 (cost) — voice runs on the student's device (0원), one conversation ≈ 0.0008 USD ≈ 1원, a member's daily limit is 1M tokens ≈ 290 conversations, a heavy user (30/day) costs about 1,000원 a month.

| | Poor | Good |
| --- | --- | --- |
| Result | [slide-poor/result.webp](../assets/examples/slide-poor/result.webp) | [slide-good/result.webp](../assets/examples/slide-good/result.webp) |
| Prompt | [slide-poor/prompt.txt](../assets/examples/slide-poor/prompt.txt) | [slide-good/prompt.txt](../assets/examples/slide-good/prompt.txt) |
| Brief | none | [slide-good/brief.md](../assets/examples/slide-good/brief.md) |

- **Information** — poor: 0 numbers, a slogan. Good: 7 values, the models that make voice free, the source.
- **Pictures and lines** — poor: a piggy bank taking half the slide (a picture that proves nothing). Good: three big numbers as the hero and a three-box flow with arrows showing *where* each cost happens — the picture is the cost structure.
- **Prompt** — the good prompt spells out every zone, its share, every string and every arrow; a vague prompt produces a vague slide.
