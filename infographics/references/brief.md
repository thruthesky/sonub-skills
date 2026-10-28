# brief.md — the plan that comes before any pixel

Copy the template into `brief.md` next to the output and fill it in order. Parts A–C are written before making anything; part D after.

## Contents

- Template
- Filled example — the SONUB `/guide` learning-path page
- Rules for filling it in

## Template

~~~markdown
# <name> — infographic brief

## A. Source analysis
- Source: <file / URL / document + section>
- Reader: <who · what they already know · where and on what they see it>
- Purpose: after reading, the reader can <decide / do / know> ...
- Core message (one claim): ...
- Reader questions (3):
  1. ...
  2. ...
  3. ...
- Fact inventory:
  | # | Type | Fact (exact value) | Source location |
  | - | number / comparison / process / case / relation / definition | ... | ... |
- Link inventory (search the whole project — routes, sitemap, data files with an href, docs):
  | item | page / document | address source (data field · route name · helper) | note (outside site · coming soon · no page — why) |
- Gaps: [GAP: what is missing — who can supply it]

## B. Information plan
- Headline (≤ 2 lines): ...
- Summary (1 line or 2–3 numbers): ...
- Key blocks (ranked; block 1 = hero):
  1. <block> — form: <table/chart/flow/...> — facts: #.. — explanation: <≤ 2 lines> — case: <...>
  2. ...
- Conclusion / next action: ...
- Cut list: <fact # — reason> (include filler: leads about the page, chips repeating the hero)

## C. Layout
- Format: <web page width 1440/390 · 16:9 slide 1920×1080 · 1080×1350 card · A4 ...>
- Wireframe (zones numbered in reading order, rough area %):
  ```
  ┌────────────────────────────┐
  │ 1 headline + 2 summary      │
  │ 3 HERO (≈50%)               │
  │ 4 block │ 5 block │ 6 block │
  │ 7 conclusion                │
  └────────────────────────────┘
  ```
- Picture plan: hero scene __ (where) · item pictures __ (one per item, same style, reference = hero) · where each is reused
- Line plan: | relation/process (fact #) | from → to | shape | solid/dotted | color | — plus the legend and the phone shapes
- Line spacing (R10): no parallel bundle (one trunk + branches) · gap between lines __ (≥ 12px) · gap between a line and the box edge it runs along __ (≥ 14px) · start points/nodes off picture corners and text
- Link plan (R11): which drawn elements are links (whole chip/card) · outside sites → new tab · coming soon → marked · items left plain and why
- Motion plan (webmovie — SKILL.md step 3): webmovie folder __ (from `require-webmovie.sh`) · existing infographic upgraded? __ · | zone | element | shot | delay/order | — headline → hero → items → lines (`data-ig-motion`, delay) → values → the one highlight · player (scenes) or on-view · total per block __ s
- Type: title __ / heading __ / body __ / note __
- Colors: base __ · brand __ · category per item __ · accent __ (used on: ...) · good/bad __
- Grid / spacing: __ columns · inside-group gap __ · between-group gap __

## D. Review (after making it)
- 5-second test: pass/fail — what the 3 largest elements say: ...
- Picture test (blurred): start / options / connections / order visible?
- Must-haves: pictures __ · lines __ · encoding __ · motion (webmovie kit + shots) __ · filler sentences left?
- Motion test: webmovie `check.mjs` errors __ · frames looked at (start · middle · end) __ · reading order visible in the middle frame? · or `n/a (still image)`
- Readability (readability.md R1–R11): labels __ · values aligned __ · markers once __ · node rows aligned __ · brokenShort __ · crowding lines/marks/edges __ · languages/phone read __
- Links: items linked __ / items with a page __ · unlinked (audit) __ — each without a page · addresses right in another language __
- 30-second test: Q1 → answer found? Q2 → ... Q3 → ...
- Fidelity: every number checked against source? gaps left?
- Hierarchy/density: hero largest? equal-card rows? every block has a specific value?
- Defects: clipped / overlap / typo / glyphs / contrast / narrow / RTL
- Audit: report.json summary
- Fixes made: ...
~~~

## Filled example — the SONUB `/guide` learning-path page

Source: `App\Content\Guide` + `lang/ko/guide.php` (four tracks). This is the plan behind the "good" result in [examples.md](examples.md); the poor and text-only results are what happened without it.

~~~markdown
## A. Source analysis
- Source: app/Content/Guide.php, lang/ko/guide.php (kids, ai, it, work tracks)
- Reader: a first-time visitor (parent, student, office worker, developer), desktop or phone, deciding where to start
- Purpose: after reading, the reader picks ONE path and opens its first step
- Core message: Pick by who you are and how much time you have — 4 paths, and all of them go through AI basics (/ai) and talking with Lyen (/chat)
- Reader questions:
  1. Which path fits me (or my child)?
  2. How long and how often?
  3. What will I be able to do at the end?
- Fact inventory:
  | # | Type | Fact | Source |
  | 1 | comparison | kids: age 7+, grade 1–2 · 20 min/day · 4 weeks · 10 lessons · 4 steps | kids_target, kids_duration |
  | 2 | comparison | ai: middle school+ · 3×/week · ~6 weeks · 6 steps | ai_* |
  | 3 | comparison | it: developers, server operators · 4×/week · ~12 weeks · 12 steps | it_* |
  | 4 | comparison | work: office workers, shop owners, team leads · 2×/week · ~5 weeks · 7 steps | work_* |
  | 5 | case | outcome kids: "type short sentences with the right fingers" | kids_outcome1 |
  | 6 | case | outcome ai: "explain how a model picks the next word" | ai_outcome1 |
  | 7 | case | outcome it: "hand coding to an AI agent and review the diff" | it_outcome3 |
  | 8 | case | outcome work: "decide which work to give AI and which to keep" | work_outcome1 |
  | 9 | relation | same page in several paths (by href): /ai (all 4) · /chat (all 4) · /typing (kids required; it, work optional) · /learn/ai#prompting (ai, work) · /ai/advanced (ai, it) · /vibe-coding (kids, it) | steps[].href |
  | 10 | process | steps of each path, required vs optional | steps[].required |
- Gaps: none (no learner counts or completion rates exist — do not show any)

## B. Information plan
- Headline: "나에게 맞는 길 하나를 골라 1단계부터 시작해요" (no lead paragraph, no summary chips — the picture says "4 paths")
- Key blocks:
  1. HERO — fork: the crossroads picture → four colored lanes → four path rows (picture · who · outcome │ time (accent) · steps/required · button) (facts 1–8)
  2. routes — each path as a metro line of its steps; optional dotted, stations other paths also pass double-ringed (facts 9–10)
- Conclusion: "press 「이 가이드 보기」 on your path" strip + tips + one-on-one lessons
- Cut list: the 3-step "choose → follow → try" flow, the big "4", taglines, "외 N단계 더" folding, the lead "아래 표에서 나와 맞는 줄을 찾아요" and the summary chips (filler), a separate "shared steps" connection map (duplicate of the double rings)

## C. Layout
- Format: web, 1440 and 390 wide
- Wireframe: 1 headline → 2 crossroads picture (full width, 2:1) with 4 colored dots on its bottom edge → one path card per row (four parallel lanes down the start gutter, inner lane = first card; card = picture · name · button on the title row + labeled facts 대상 · 기간 · 단계 · 마치면, labels in one shared column) → 3 routes (header above: picture + name + count; stations in equal 13rem cells) → 4 conclusion
- Picture plan: hero = crossroads (existing, Codex); items = playground · observatory · workshop · office, made with the hero as reference, 640², paper background; reused on cards (4.5rem) and route headers (2.5rem)
- Line plan: fork dot → card (elbow in its own lane; no crossings) · station → station (straight; Z along the row gap at wraps); legend with drawn samples above the routes
- Type: 40 / 22 / 16 / 13 px
- Colors: paper base · purple structure · category kids orange / ai purple / it green / work blue · amber accent only on the time line
~~~

## Rules for filling it in

- **One claim per core message.** If you need "and" twice, you have two infographics.
- **Reader questions come from the reader**, not from the source's table of contents.
- **Every fact gets a row**, even ones you will cut — the cut list then shows the decision.
- **Exact values**: write "주 3회 · 약 6주", not "a few weeks". Keep the source's wording for anything quoted.
- **Gaps stay visible** until resolved. Never fill a gap with "about", "many", "leading" or an estimated number.
