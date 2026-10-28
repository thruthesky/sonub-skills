---
name: infographics
description: 🛑 webmovie 스킬(sonub.com)이 반드시 설치되어 있어야 한다 — 먼저 scripts/require-webmovie.sh 로 확인하고, 없으면 오류를 내고 멈춘 뒤 `npx skills add https://sonub.com -s webmovie` 설치를 안내한다. 알차고 멋진 인포그래픽을 만드는 작업 기준 — 원문 분석 → 정보 구성안 → 배치·움직임 설계 → 제작 → 검수·수정. 그림(대표 장면 + 항목마다 같은 화풍)·선(곡선·직선·대각선·꺾은선, 실선=필수·점선=선택)·값의 시각화·webmovie 움직임(읽는 순서대로 등장, 끝나면 원래 HTML)이 필수, 표·카드만 늘어놓기와 군더더기 문장은 실패. 없는 수치는 만들지 않고, 항목마다 사이트의 해당 페이지로 링크하고, 5초·흐림·30초·가독성 테스트와 감사·움직임 검사로 고친다. 일을 맡을 때마다 기존 인포그래픽의 UI/UX 도 다시 다듬고, webmovie 없이 만든 것은 webmovie 로 올린다. Build infographics that are pictures of information — pictures, connector lines and webmovie motion, real HTML text, no filler — for pages, slides, posters and pitch-deck images. Use it whenever the user wants an infographic, a visual summary, an explainer graphic, a "한눈에 보는" page, or says a page looks plain, empty, boring, hard to read or "형편없다" — e.g. "인포그래픽으로 만들어 줘", "그림과 선으로 보이게", "make this an infographic".
license: MIT
compatibility: Requires the webmovie skill from sonub.com (npx skills add https://sonub.com -s webmovie) — scripts/require-webmovie.sh checks it. scripts/check.mjs needs Node 22+ and Google Chrome or Chromium. scripts/codex-image.sh needs the Codex CLI (codex exec) with the built-in image_gen tool. assets/ig-lines.js runs in any modern browser, no build step.
---

# infographics — choose the information, then draw it

An infographic is **information drawn as a picture**. The reader should see the structure — where to start, what the options are, what connects to what, what comes next — before reading a word, and every closer look should pay back with a concrete fact.

Two ways to fail:
- **Decoration without information** — a grid of equal cards with an icon, a label and a vague sentence; a big illustration that proves nothing.
- **Information without a picture** — tidy tables, lists and chips that are correct but read like a document. This is the more common failure when "text must stay text" is taken as "no pictures". (It happened: the first rebuild of SONUB's `/guide` was a clean table page and the user rejected it as "not an infographic — text listed messily".)

So this skill gives rules for **choosing** information, **drawing** it with pictures and lines, **placing** it, and **checking** the result.

**Talk in the user's language.** These files are in English; keep the source's language in the infographic itself.

## 🛑 Step 0 — the webmovie skill is required. Check it first, every time.

This skill does not run without the **webmovie** skill from sonub.com. Before reading the source, writing a brief or touching a file — for a new infographic, a continued one or a small edit — run:

```bash
sh scripts/require-webmovie.sh      # this skill's folder; prints "webmovie: OK <dir>" or an error
```

- **Exit 0** → note the printed folder, read its `SKILL.md` (the shots, the player, the final-frame rule) and use its kit (`assets/webmovie.js` · `webmovie.css`) and its check (`scripts/check.mjs`). Read its `references/infographics.md` before the motion plan.
- **Exit 1 → stop with an error. Do not make the infographic any other way** — not static, not with hand-written CSS animation, not with another library, not "for now". Show the user the error in their language, plainly as an error, with the install commands, and end the turn:

  > ✗ 오류: webmovie 스킬이 설치되어 있지 않아 인포그래픽을 만들 수 없습니다. infographics 스킬은 webmovie 스킬이 있어야만 동작합니다.
  > 먼저 webmovie 를 설치한 뒤 에이전트를 새로 시작하고 다시 부탁하세요.
  > `npx skills add https://sonub.com -s webmovie` (이 프로젝트) · `npx skills add https://sonub.com -s webmovie -g` (이 컴퓨터의 모든 프로젝트)

  Install it yourself only when the user says so; then they still need a new session for the agent to load it.

Why it is required: an infographic on the web should play like a short explainer video — headline, picture, lines, values, in reading order — while every word stays HTML text that search engines read and translators translate. webmovie is that kit, with its rules (one shot per moment, the final frame is the plain HTML, every language at the same rhythm) and a browser check. Motion invented per page drifts from those rules, so there is no fallback.

## Every task updates the infographic — and brings it up to webmovie

Each time this skill is used — a new infographic, the start of a session on an existing one, or any edit the user asks for — first look at the infographic(s) the task touches and **update their UI/UX**, not only the requested change:

1. **Find what exists**: the page, widget or HTML file, its `brief.md`, and the current state — run `node scripts/check.mjs <url-or-file>` and read the `motion:` line (or search the markup for `data-webmovie` and `webmovie.js`).
2. **Not made with webmovie** (`motion: webmovie kit:no ✗` or `shots:0 ✗`) → **upgrading it with webmovie is part of the task, always**, even when the user asked for one small fix: add the kit, write the motion plan (brief part C), mark the shots, run both checks. Say in the report that it was upgraded and why.
3. **Re-check the UI/UX against this file** while you are there: the four must-haves, readability (R1–R10), links, filler, the hero. Fix what fails; list what you changed.
4. Then do what the user asked.

Why: older infographics were drawn before webmovie existed. Upgrading each one as it is touched keeps a site in one style instead of a mix of static and moving pages, and an edit is the cheapest moment to do it — the brief and the facts are already open.

## The four must-haves

Every infographic has all four. Check them in step 3 (plan) and step 5 (review); a piece missing one is not done.

| Must-have | Means | Fails when |
| --- | --- | --- |
| **1. Pictures** | a hero scene that tells the whole story + one picture per main item, in one style, reused wherever the item appears (card, line end, row header) | no image at all; stock decoration that identifies nothing; mixed styles |
| **2. Lines** | connectors that show the relations: curves for forks and merges, straight for order, diagonal for cross-relations, elbows for trunks and wraps; solid = required, dashed = optional; colored by item; **with air** — ≥ 12px from any other line, ≥ 14px along a box edge, marks never touch (one trunk with branches, not a bundle of parallel lanes) | relations only in words ("A and B share…"); arrows between unordered things; lines under boxes; lines, dots or edges packed so close the eye cannot follow one (user, 2026-10-22: "각종 선이 너무 붙어 있지 않게") |
| **3. Visual encoding** | position, shape, size and color carry the data — a route per path, a station per step, a dot per membership, bar length = value | the values exist only as text in cells |
| **4. Motion (webmovie)** | the infographic plays in reading order with webmovie shots — headline, hero, items, lines, values, the one highlight — then stands still as the plain HTML; a story or explainer uses the webmovie player (scenes) | no webmovie kit or no shots (`check.mjs` `motion: … ✗`); motion that hides text without JS; every block moving at once; endless loops |

And one must-not: **no filler text**. Delete every sentence the picture already says or that talks about the page itself — "아래 표에서 나와 맞는 줄을 찾아요", "길마다 … 가 달라요", summary chips that repeat the diagram, intros like "Here is an overview". Text budget per block: a title, values, ≤ 2 short lines of explanation. The same goes for whole blocks: **no duplicate block** — a section that redraws facts another block already shows (a "shared steps" map next to routes that already ring the shared stations) is filler too; cut it (user, 2026-10-22: "가독성이 떨어지고 중복된 내용").

Line vocabulary, patterns, the line script and the image recipe: [references/lines-and-images.md](references/lines-and-images.md).

## Link every item — the infographic is also a map of the site

An infographic on a website is not only a picture of *this* page; it is the reader's way **into the rest of the site**. Every item it draws — a path, a station, a step, a node, a card, a term — that has its own page **links to that page** (user, 2026-10-22: "인포그래픽스는 … 전체 프로젝트 사이트 문서 간 연결도 잘할 수 있도록"). A station the reader cannot click is a dead end.

- **Analyse the whole project, not only the source** (step 1): list the site's pages and documents that the items name — routes (`php artisan route:list`, `routes/*.php`, the router of the framework), the sitemap, the content/data files that already hold an `href` per item, docs folders. Write a **link inventory** (item → page) in brief part A.
- **Reuse the address the site already uses for the item** (the same data field, URL helper and language prefix as the item's own page), so the two never drift apart. Outside sites open in a new tab (`target="_blank" rel="noopener noreferrer"` + a visible or read-aloud "opens a new site"); pages that are not ready yet still link to their "coming soon" page and show it (an icon + read-aloud text).
- **The whole item is the link** (the chip or card, not a tiny arrow), hover and focus show *inside* the item (tint, underline, outline ring) and never move it — the lines stay attached. Items without a page are plain text, and the brief says why.
- **Check it** (step 5): every drawn item with a page has a link with the right address in every language; `check.mjs` lists `unlinked` items on chains and trees — each one must be an item that truly has no page. Write a test that asserts the address per item.

## The workflow — five steps, each leaves a file

Step 0 (webmovie installed) and "Every task updates the infographic" come first. Then work in this order. Do not draw before step 3 is written down — layout problems are cheap to fix in a plan and expensive in pixels.

| Step | Do | Leave behind |
| --- | --- | --- |
| 1. Analyse the source | reader · purpose · core message · fact inventory · reader questions | `brief.md` part A |
| 2. Plan the information | headline · 3–5 key blocks · conclusion · cut list (incl. filler) | `brief.md` part B |
| 3. Design the layout | wireframe · picture plan · line plan · **motion plan** · reading path · type/color · readability (labels, alignment, width, markers) | `brief.md` part C |
| 4. Make it | HTML with real text + pictures + `ig-lines.js` + **webmovie shots**, or an image through Codex | the page, or `<name>/result.png` + `prompt.txt` + `refs/` |
| 5. Review and fix | 5-second · picture (blur) · 30-second · fidelity · defects · readability (real-size slices) · **motion** · audit | `brief.md` part D, then fixes |

Template and a filled example: [references/brief.md](references/brief.md). Keep `brief.md` next to the output so the next person can see why it looks the way it does.

## Step 1 — rebuild from the source

1. **Reader**: who exactly, what they already know, where they see it (phone scroll, slide on a projector, printed A4, judge's screen).
2. **Purpose**: what the reader should *decide, do or know* afterwards. One sentence.
3. **Core message**: one sentence that is a claim or an answer, not a topic. "4 learning paths" is a topic; "Pick one path and start at step 1 — all 4 go through AI basics and talking with the tutor" is a message.
4. **Fact inventory**: pull every usable fact out of the source and tag it — **number** (value + unit + date + source), **comparison**, **process** (ordered steps), **case** (a named example, quote, screenshot), **relation** (part-of, shared, dependency), **definition / warning**. Note where each came from. Relations and processes are where the lines will go — find them all.
5. **Reader questions**: write the 3 questions the reader will actually ask. Step 5 tests the result against them.
6. **Link inventory**: for every item the infographic will draw, the page or document on the site that explains it (search the routes, sitemap, data files and docs of the whole project — not only the source). See "Link every item".

**Never invent.** A missing number, source, date, quote, logo or result becomes `[GAP: what is needed]` in the brief and is either filled by the user or the block is dropped.

## Step 2 — plan what goes in

1. **Headline** — the core message, ≤ 2 lines at the widest target size. Specific nouns and numbers beat adjectives.
2. **Key blocks, 3–5** — ranked. Block 1 answers the purpose; it becomes the hero.
3. **Conclusion** — the takeaway or the next action.
4. **Cut list** — what you leave out and why, including **filler**: a lead paragraph that explains how to read the page, summary chips that repeat the hero, a generic "1 choose → 2 learn → 3 do" flow, taglines. Cutting is the job.

Each key block is a full **information unit**: a drawn form (fork, route, connection map, chart, matrix) + the specific values in it + ≤ 2 lines of explanation + a case when the source has one. A block that is only text — or only an icon + label + generic sentence — is not a unit.

**Source rule**: a number from outside data gets its source right under it; facts about the product itself get one source line for the whole piece.

## Step 3 — design the layout

1. **One hero, and it is a picture.** The answer block takes the largest area (≈ 40–60% of the slide or first screen; `check.mjs` reports `blocks`) and includes the hero scene. Not a banner with a slogan, not a table alone.
2. **Pick the drawn form from the content** ([references/visual-forms.md](references/visual-forms.md), lines in [references/lines-and-images.md](references/lines-and-images.md)):

   | Content | Form | Lines |
   | --- | --- | --- |
   | one start, several options | fork: hero picture → one start point → **one trunk** → **one option per row**, compared values in a fixed column | one trunk in the start gutter, a colored node and a short branch per option (`data-ig-tree`) — never a bundle of parallel lanes |
   | items × shared parts | bipartite connection map — only when no other block already shows the sharing | curves, solid/dashed |
   | ordered steps per item | route / metro line of stations | straight + Z at wraps, dashed for optional |
   | A vs B on the same attributes | matrix or two columns, with item pictures in the headers | — (pictures + color carry identity) |
   | change, size, share | chart with values written on it | axis/guide lines only |
   | a picture with parts | callout: dots + leader lines to labels | diagonal |
   | hierarchy | tree | elbow |

3. **Picture plan** (brief part C): the hero scene, the item pictures (one per item, same style), where each appears. **Line plan**: every relation and process from the fact inventory → which line (shape, solid/dashed, color) between which boxes, plus the legend — and the **spacing**: where each line runs and how far it stays from other lines, box edges, picture corners and text (R10). **Link plan**: item → page from the link inventory.
4. **Draw the reading path**: number the zones 1→N (headline → hero → blocks → conclusion). Size, position, contrast and lines force that path — a line from the hero into the cards *is* the reading path.
5. **Motion plan** (brief part C) — the reading path *is* the motion order. Follow webmovie's `references/infographics.md`:

   | Layer | Shot | Note |
   | --- | --- | --- |
   | headline | `mask` (or `words`) | one shot, ≤ ~1 s |
   | hero picture | `wipe` · `zoom-out` · `settle` (in an `overflow: hidden` frame) — or, when the hero shows a story (someone goes somewhere), a webmovie **picture movie**: plate + cut-out actors on one ≤ 5 s clock (webmovie `references/picture.md`) | never cover a line start that sits on its edge |
   | items (cards, rows, stations) | `stagger` on the list · `fade` | they land before their lines |
   | lines | `data-ig-motion="wipe"` on the `data-ig-lines` container + CSS `.<block> > .ig-svg { --webmovie-delay: 600–900ms }` | the line layer draws in after the boxes it joins; `ig-lines.js` redraws on `webmovie:done`, so moved boxes get exact line ends |
   | values | `count` on `<data value>` · `bar` / `ring` / `pie` with `--pct` | the final value is already in the HTML |
   | the one thing to notice | `highlight` / `underline` last | one per screen |

   - Blocks play when they come into view and cascade in DOM order — so the HTML order is the choreography. Total per block ≤ ~2.5 s, then still; no loops.
   - A story told in steps (an explainer, a pitch, "how it works") can be a **webmovie player**: one scene per key block, the hero first, the conclusion last.
   - Never use webmovie's `draw` on `ig-lines` paths (they have no `pathLength`, and dashed lines would break) — use `wipe` or `fade` for the line layer.
6. **Fix the design system now** ([references/design-system.md](references/design-system.md)):
   - Type: 4 levels — title ≈ 2.5–3× body, section ≈ 1.3–1.5× body, body (web ≥ 16px), note ≈ 0.75–0.85× body (web ≥ 12px).
   - Color: neutral base + brand for structure + **one category color per item** (line, border, marker, dot — same everywhere) + **one accent** for the deciding values only. Meaning never by color alone (line style, label, shape too).
   - Lines: 2 weights at most (main ≈ 3px, optional dotted ≈ 2.5px), round caps, behind boxes.
   - Spacing: inside a group 0.5–0.75× body; between groups ≥ 2×; gutters and row gaps wide enough for lines (≥ 1.25rem).
7. **Line up what the reader compares.** When items are compared on the same values (time, price, steps), put **one item per row** and give every fact a **visible short label** in a label column of the same width on every row, so all values start on one vertical line. A 2×2 card grid scatters the values and makes lines run long detours to the far cards — the user called that version "가독성이 매우 떨어진다".
8. **Plan readability, not only structure** ([references/readability.md](references/readability.md), rules R1–R10): labels, not icons alone · values louder than labels · long text gets the width (action on the title row, labels above values on phones) · markers (glossary underlines, "?" badges) once per page and never inside diagram labels · repeated nodes on an equal-width grid with the header above · fixed shapes (number circles) never shrink or wrap · same role, same size · **lines with air**: no parallel bundles, ≥ 12px between lines, ≥ 14px between a line and a box edge it runs along, start points and nodes never touching each other or sitting on a picture corner.
9. **Make it full, not crowded**: density comes from more *specific* content per block (values, pictures, connections), never from smaller text, tighter gaps or more sentences.

## Step 4 — make it

- **Motion (webmovie)**: copy the kit from the folder `require-webmovie.sh` printed — `assets/webmovie.css` + `assets/webmovie.js` unchanged — and load both in `<head>`, the script **without** `defer`, before `ig-lines.js`. Mark the shots from the motion plan (`data-webmovie="…"`, `data-ig-motion` on line containers). Never hide content in plain CSS: the kit hides only while it plays, so without JS, with reduced motion and after the motion the page is exactly the HTML. Example: [assets/examples/guide-good.html](assets/examples/guide-good.html).
- **Web page / HTML**: all text is real HTML text (selectable, translatable). Pictures are `<img>` with alt text (item pictures next to their own title: `alt=""`). Lines with [assets/ig-lines.js](assets/ig-lines.js) — `data-ig-lines` container, `data-ig-to` / `data-ig-chain` / `data-ig-tree` (one trunk + nodes + branches), shapes switched by CSS `--ig-shape` in container queries; the same facts also in text (legend, "(optional)", list order). Every item with a page is a link to it ("Link every item"). Use the project's components and tokens.
- **Images** (hero, item pictures, slides, posters, cards): pixels from the **Codex CLI image model** only — not SVG/Canvas/PIL/ImageMagick/another API. Use the wrapper, which keeps the prompt, references and results together:

  ```bash
  scripts/codex-image.sh <out-dir> <prompt-file> [reference-image ...]
  # → <out-dir>/prompt.txt · refs/ · result.png (older results kept) · codex.log
  scripts/codex-image.sh <dir>/<name>.webp <prompt-file> [reference-image ...]
  # → <name>.webp + <name>.prompt.txt (+ .refs/, .codex.log — remove those two from public folders)
  ```

  Item pictures: hero first, then each item with the hero as reference ([lines-and-images.md](references/lines-and-images.md) "Images"). Slide/poster prompts spell out every word, number and label exactly and forbid any other text ([references/image-codex.md](references/image-codex.md)) — and draw the connectors (arrows, curves, dashed links) in the prompt too.
- **A series** (12 slides, a carousel): one fixed frame for all and one palette; the brief lists one claim per item.
- **Still images only** (a PNG slide, a poster, an application image): pixels do not move, so motion does not apply to the file itself — write `motion: n/a (still image)` in part D. Step 0 still applies, and when the image is shown on a web page, that page gets webmovie (the image `wipe`s in, the HTML text around it gets its shots).

## Step 5 — review, then fix (always)

Write the answers in `brief.md` part D. Full rubric: [references/review.md](references/review.md).

1. **5-second test** — the first screen/slide for 5 seconds (or the 3 largest texts): topic *and* core message clear?
2. **Picture test** — blur the screenshot: can you still see the start, the options, what connects to what, the order? If it is grey rectangles, it fails.
3. **30-second test** — the 3 reader questions answered with specific values from the graphic alone?
4. **Must-haves** — pictures (hero + one per item, one style), lines (every relation/process drawn, legend present), encoding; no filler sentences.
5. **Fidelity** — every number, name and date matches the source; no `[GAP]` left.
6. **Hierarchy and defects** — one hero; accent only on key values; no clipped/overlapping text, no line under a box or ending in space, no lines or dots packed together (`crowding` 0); phone width, RTL and every theme.
7. **Readability test** — read the slices at real size (never judge from a full-page thumbnail): can you tell what each line is without reading it? Do compared values start on one vertical line? Any thin text column next to empty space? Any marker inside a label or repeated? Do rows of nodes line up? Zoom anything odd (`--eval "…style.zoom=4"`). Check a long language (de/ru), RTL (ar) and 390. Rules and fixes: [references/readability.md](references/readability.md).
8. **Motion test** — run webmovie's check on the page and open its frames: `node <webmovie>/scripts/check.mjs <url-or-file> --times 0.3,0.9,4` → errors 0; the start frame shows the first shots entering, the middle frame shows the reading order (headline → hero → items → lines → values), the last frame is the finished infographic. In this skill's `check.mjs` the `motion:` line has no ✗.
9. **Link test** — click through: every drawn item with a page opens that page (right language, outside sites in a new tab); `unlinked` lists only items that have no page.

For HTML, run the audit at the widths you ship and **look at the slices** (it emulates reduced motion, so it measures the final frame; `--motion` keeps motion on):

```bash
node scripts/check.mjs <url-or-file> --widths 1440,768,390 --out <dir> [--selector main] [--wait 1500] [--eval "<js>"]
# → <width>.png + <width>-01.png… slices + report.json
#   (largest text, block shares, images, lines, long text, clipped, sideways scroll, broken short text, overlap, tiny text, type levels,
#    equal-card grids, low contrast, crowding: lines/marks/edges too close, unlinked items, motion: webmovie kit/shots/line layers/player);
#    --eval switches a theme or reads values (its result is printed)
```

`images: 0`, `lines: 0` or `motion: … ✗` fails the must-haves outright; `brokenShort` > 0 means a number or badge wrapped onto two lines (often invisible); `crowding: lines/marks/edges` > 0 means lines, dots or a line and a box edge sit too close to follow (R10). The script finds mechanical defects; only looking finds a boring layout or a line that connects the wrong boxes.

**Fix loop**: fix the failing item (in the brief first if the cause is the plan), regenerate, re-check. Stop after 3 rounds and report what still fails with the screenshot.

## Good vs poor — learn the difference

[references/examples.md](references/examples.md) takes one source (a 4-path learning guide) and shows three results: **poor** (decoration, equal cards), **text-only** (correct tables and lists — a document, not an infographic) and **good** (hero picture, fork lines, connection map, metro routes). Read it before the first infographic in a project.

## Report

End with: the webmovie folder used (Step 0), whether an existing infographic was upgraded to webmovie and what UI/UX changed, the core message, what was made (paths/URLs), the review results (5-second, picture, 30-second, must-haves, fidelity, defects, motion — pass/fail with evidence), the audit summary, the links (items linked / items without a page), `[GAP]`s for the user, and for images the prompt summary + reference + result paths.

## Projects

- **SONUB (sonub.com)** — when the infographic is a page or section *inside the sonub.com app* (Blade widgets, 17 languages, three themes, RTL), read [references/projects/sonub.md](references/projects/sonub.md) first. Standalone pieces need only its "Images in SONUB" section.
