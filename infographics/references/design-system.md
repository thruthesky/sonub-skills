# Design system — fix these values before making anything

Write the chosen values into `brief.md` part C. If the project has its own tokens (type scale, spacing, palette), map these roles onto them instead of inventing new values.

## Type — four levels only

| Role | Web (body 16px) | Slide 1920×1080 | Card 1080×1350 | A4 print | Weight |
| --- | --- | --- | --- | --- | --- |
| Title (the claim) | 40–48px | 64–80px | 64–76px | 28–32pt | bold |
| Section heading / block title | 20–24px | 36–44px | 36–44px | 14–16pt | bold |
| Body / labels / table cells | 16px (min) | 26–30px | 28–32px | 10–11pt | regular |
| Note / source / axis | 13px (min 12px) | 20–22px | 22–24px | 8pt | regular, muted color |

- **Big numbers** may be larger than the title (up to 1.5× title) — they are the visual, not text.
- **The ratio matters more than the value**: title ≈ 2.5–3× body; heading ≈ 1.3–1.5× body; note ≈ 0.75–0.85× body. Two sizes that differ by less than 15% look like a mistake — merge them.
- **Line length**: 45–75 characters for Latin text, about 25–40 for Korean/Chinese/Japanese. Break long explanations into two lines max per block.
- **Weight and color do the second level of emphasis**, not a fifth size: a sub-heading inside a block is body size bold; a label beside or above a value is note size and muted, the value body size and ink (readability.md R3).
- **Same role, same size**: all item titles one size, all section titles one size — a 1.25rem card title next to a 1.1rem route title is a new level for nothing.
- **Code / commands**: monospace at body size (or note size for inline paths in notes) — a font change, not a new level.
- **Phones**: the title may drop to ≈ 2× body (32px on a 16px body) — keep body and note sizes.
- **Korean**: set `word-break: keep-all; overflow-wrap: break-word` so lines break between words, not inside them ("누구\n나" is a defect). Japanese/Chinese break per character — fine.
- **CJK/Arabic**: use a font that has the script; Arabic and Urdu need taller line height (≈ 1.7–1.9) in paragraphs — but not in compact chips and badges (≈ 1.5–1.6), or they double in height.

## Grid and alignment

- One grid per piece: 12 columns on wide web, 4 on phones, 6–12 on slides. Every block starts and ends on a column line.
- Align text on the **start edge** (left in LTR, right in RTL). Center only short items inside a symmetric shape (a number in a tile, a button label).
- In tables: text columns start-aligned, number columns end-aligned with the same unit and decimals.
- Keep a consistent outer margin: web 24–32px, slides 80–120px, cards 64–80px.

## Spacing — space groups, not items

| Gap | Rule | Web example |
| --- | --- | --- |
| inside a group (label ↔ value, line ↔ line) | 0.5–0.75× body | 8–12px |
| between items in a list/table | 0.75–1× body | 12–16px |
| between groups / blocks | ≥ 2× the inside gap | 24–40px |
| between major sections | ≥ 1.5× the group gap | 48–64px |

An area of empty space larger than a block, that separates nothing, is a defect — fill it with planned content or shrink the container.

## Color — few colors, one accent

| Role | Count | Use |
| --- | --- | --- |
| Base (background, body text, lines) | 1 neutral + its tints | everything by default |
| Brand / structure | 1 | headings, table header, numbering, frames |
| **Accent** | **1** | only the values that carry the message (the deciding column, the big number, the call to action) — about 10% of the area or less |
| Category (one per item) | ≤ 5 | the item's lines, border, markers — see "Category colors" |
| Good / bad | 2, only if needed | real positive/negative meaning (✓/✗, gain/loss), always with a sign or label too |

- Text contrast: ≥ 4.5:1 for body and notes, ≥ 3:1 for large text (≥ 24px or bold ≥ 19px) and chart marks.
- Tinted backgrounds for grouping should be light (≈ 5–10% tint) so text on them keeps contrast.
- Never let color alone carry meaning — add a label, sign, pattern or position.
- If the project has light/dark/other themes, use its tokens so the same roles hold in every theme.

## Category colors — one per item

When the piece compares or routes several items (paths, products, teams), give each item **one color** and use it on everything that belongs to that item: its card border, its lines, its route, its markers and dots. Color then works like the item's name.

- ≤ 5 categories; pick clearly different hues at the same lightness (SONUB: `--wa-color-orange-50` · `purple-50` · `green-50` · `blue-50`). White text on them must reach 4.5:1 (darken one step if not).
- Category colors are separate from the **accent** — the accent still marks only the deciding values.
- Never carry meaning by color alone: line style (solid/dotted), a label, a picture or a position too.

## Lines

| Role | Weight | Style |
| --- | --- | --- |
| main connection / required | ≈ 3px (web), 6–8px (slide) | solid, round caps and joins |
| optional / weak | ≈ 2.5px | dotted (`2 7`) or dashed |
| guides (axis, grid) | 1px | the border color |

Lines run behind boxes and end at their edges. Leave gutters and row gaps ≥ 1.25rem where lines run. A legend shows drawn samples, not just words.

## Pictures, icons and illustrations

- **Pictures are required** (SKILL.md "The four must-haves"): a hero scene (≥ 50% of the content width on wide screens, full width on phones, in the first screen) and one item picture per item in the same style (4–5rem on cards, 2.5rem as a marker). Rounded corners from the project's radius tokens; background = the page paper color so they sit on the page.
- Every picture names an item or shows a fact — no decoration that identifies nothing, never more area than it explains.
- Icons (font icons): one style, one per fact type (person = who, clock = time, flag = outcome), ≈ 1–1.5× the text, colored with the item color.
- Logos, people, products: only real ones the user supplied. Never invent a logo or a "customer".

## Series consistency

For 3+ pieces (slides, cards): same frame (series label, title position, conclusion strip), same palette and type sizes, same icon style, same term for the same thing on every piece. Write the frame once in the brief and copy it into every prompt.
