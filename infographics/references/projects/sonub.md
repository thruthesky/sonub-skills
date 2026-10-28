# SONUB (sonub.com) — infographics in this project

Scope: pages and sections inside the sonub.com app. For standalone pieces (application images, decks, one HTML file) only "Images in SONUB" applies.

Read the matching `SONUB-SSOT.md` section first — it wins over this file. Rules that apply:

- **SSOT 23절 "가이드라인" — 텍스트 인포그래픽**: titles, explanations, steps and numbers are real HTML text (selectable, searchable, translatable); never text baked into an image. **Pictures and connector lines are required** (2026-10-22 사용자 지시): a hero scene + one Codex picture per item, lines drawn with `public/js/ig-lines.js`. Keep the shared widgets, existing learning content and order, 17 languages, three themes, RTL and narrow screens.
- **SSOT 11절 "페이지 본문·재사용 절대 규칙"** and the **sonub-design skill** (`.claude/skills/sonub-design/SKILL.md`): page body = widgets; reusable parts defined once.
- **AGENTS.md "CSS"**: structure classes in Blade, design in `public/css/`; no `style=""`/`<style>` (only the value variable `--pct`).

> 🛑 **Design work in SONUB** must use this skill together with the sonub-design skill (`.claude/skills/sonub-design/SKILL.md` "필수 동반 스킬"), popup, linkify, sonub-seo and webmovie — all five are required, not optional (SSOT 11절 "디자인", 2026-10-23·10-26): wrap jargon in item labels and captions with `<x-glossary.text>`, and give every linkable section heading a fixed ASCII id. Colors, Web Awesome and Font Awesome follow sonub-design.

## Where the information comes from

Facts live in `app/Content/*` (e.g. `Guide::tracks()` — targets, durations, steps with `required`/`href`, outcomes) and `lang/{locale}/*.php`. Build the brief's fact inventory from these, and in Blade print values from them — counts with `count(...)`, numbers with the project's number helper (`Guide::num()`) — never retype a number into a template or a translation.

## Building blocks — use these before writing new markup

| Need (visual-forms.md) | SONUB part | Note |
| --- | --- | --- |
| comparison matrix | `x-diagram.data-table` | ✔/✘ with spoken text; `cards=true` turns rows into cards on narrow screens |
| ordered steps (≤ 6) | `x-diagram.flow-steps` | icon + short name only, horizontal → vertical by container width |
| long sequence | `x-diagram.step-rail` | numbers + short titles, one description open at a time (text stays in HTML) |
| sizes / ranking | `x-diagram.bar-chart` | value label always next to the bar |
| order / nesting / parallel words | `x-diagram.chip-flow` | `arrow` = order, `nest` = containment, `plain` = parallel — never mix |
| levels | `x-diagram.level-stairs` | bar height = level number, fill = real score |
| score vs pass line | `x-diagram.donut-gauge` | CSS lives in `exam.css` — move to `content.css` before reuse |
| long explanation under a diagram | `x-diagram.more` | folded `<details>`, still indexed |
| card, tile, section heading, figure | `x-ui.card` · `x-ui.icon-tile` · `x-ui.section-heading` · `x-ui.figure` | tones: accent · info · success · warning |

| fork / route lines | `public/js/ig-lines.js` (copy of `skills/infographics/assets/ig-lines.js`, kept identical by `tests/Feature/GuidePagesTest.php`) | widgets push it with `@pushOnce('head', 'sonub-ig-lines-js')`; examples: `x-widget.guide.fork` (`data-ig-tree`: trunk + nodes) · `guide.route-steps` (`data-ig-chain`, stations are links) · `guide.legend` |
| category colors | `--wa-color-orange-50` · `purple-50` · `green-50` · `blue-50` | set `--track` per `[data-track]` and per `:is(.ig-line, .ig-node).is-<id>` (see `public/css/pages/guide-overview.css`) |

New infographic sections go into a widget `resources/views/components/widget/<area>/<name>.blade.php` with `@props` and `@pushOnce` CSS; page CSS in `public/css/pages/<section>.css` with the theme tokens, logical properties (RTL), and container queries for narrow blocks.

## Motion (webmovie) in SONUB

Step 0 holds here too: `sh skills/infographics/scripts/require-webmovie.sh` finds the source `skills/webmovie/` in this repository.

- **The kit is in `public/`** (2026-10-25): `public/js/webmovie.js` · `public/css/webmovie.css`, byte-identical to `skills/webmovie/assets/` (`GuidePagesTest` compares them — after editing the kit, `cp` it again). A widget loads it with `@pushOnce('head', 'sonub-webmovie')` (the same key everywhere, so it loads once) — `<link>` + `<script>` without `defer`, before the `ig-lines.js` push; see `x-widget.guide.hub`. Button labels of a player come from `lang/*/webmovie.php` (17 languages).
- **`/guide` hub has motion** (2026-10-25, worked example — **bold**, the user found the first version "너무 소극적"; webmovie `references/acting.md`): h1 `whip` → hero as a **picture movie** (webmovie `references/picture.md`: camera `dolly` on the boy, an inner `.webmovie-rig` `shake` when the first sign lands, signs `unfold` + sparks `data-webmovie-burst`, dots `ping` + sparks, labels `blast`, a linked label per path, then a **spotlight** (`data-webmovie-spotlight="ripple glow"`: the four labels take turns, each with its dot and its card's button via `data-webmovie-cue-with`, 2 rounds), replay — `x-widget.guide.fork`) → path cards `stagger` → fork lines `data-ig-motion="wipe"` (`.guide-fork > .ig-svg { --webmovie-delay: 700ms }`) → step-meter dots `stagger` (`.guide-steps-meter` sets `--webmovie-y: 0px; --webmovie-s: 0.3; --webmovie-delay: 500ms`) → per route: one `data-ig-lines` + `data-ig-motion="wipe"` on each `.guide-map-row` (a line layer per route, so each route draws when it scrolls in), title `whip`, stations `stagger` → end strip `drop-in`, tips `stagger`, teacher card `swing`. Plan and checks: `docs/infographics/guide/brief.md` C·D.
- **`/guide/kids` has motion** (2026-10-25, second worked example — the whole page, wild on the cover, map, finish and other guides): cover = picture movie `x-widget.guide.kids-cover-movie` (plate = the cover photo with the laptop-screen shapes and desk blocks removed; shapes `blast` + sparks out of the screen, blocks `drop-in`/`hop`, camera `dolly` on the laptop, rig `shake`), h1 `elastic`, the two cover links take turns (`jelly`, `data-webmovie-delay` = after the movie). Map: stops `stagger` → `data-ig-motion="wipe"` → lesson numbers `stagger` + spotlight `hop`. Lessons inside closed `<details>` play when opened; `kidsReader` (`public/js/pages/guide.js`) calls `webmovie.reset()` on the opened lesson so it plays again each time. No letter-splitting shots inside Alpine-driven text (`kidsNextWord`, `kidsGuess`) — keep the server HTML equal to Alpine's first state there, or the check reports `text-changed`. Plan: `docs/infographics/guide-kids/brief.md`.
- **AI 학습 가이드 `/guide/ai`**: `guide.editorial-track` + `guide.ai-lab`, `guide-ai.css`. 기존 사진·학습 그림을 재사용한다. 제목 조립 → 사진 스캔·프롬프트/모델/토큰 신호 → 여섯 단계·실선/점선 연결. `docs/infographics/guide-ai/brief.md`, `GuideAiDesignTest`.
- **IT 전문 가이드 `/guide/it`**: 공용 `guide.editorial-track`·`guide.motion-assets`·`guide-journey.css`, 표지 `guide.it-workshop`·`guide-it.css`. 도구 조립·불꽃·회전·탄성 착지(`wild`) → 12개 그림 단계·연결선. AI 가이드도 같은 경로·카드·눈금 CSS를 쓴다. `docs/infographics/guide-it/brief.md`, `GuideItDesignTest`.
- **업무 전문 가이드 `/guide/work`**: 공용 `guide.editorial-track`·`guide.motion-assets`·`guide-journey.css`, 표지 `guide.work-desk`·`guide-work.css`. 사진 돌리·문서 비행/펼침·확인 도장·불꽃·짧은 흔들림(`wild`) → 7개 그림 단계·필수 실선/선택 점선. 미제공 도구 두 개와 주소 없는 팀 협업을 유지한다. `docs/infographics/guide-work/brief.md`, `GuideWorkDesignTest`.
- Shots are attributes in the Blade markup; timing and colors go in the page CSS as `--webmovie-*` variables (no `style=""` except `--pct`).
- **바이브 코딩 메뉴 전체**: `coding.title-stage`·`coding.motion-assets`·`coding-motion.css`를 재사용한다. 작업공간 시작 화면, appdev 16탭, 하네스 4탭, Claude Code·Codex 각각 4단계, OpenCode와 appdev 입구. 제목 착지·그림 돌리·번호 도장·불꽃·단계 연결(`wild`). 실제 편집·터미널은 고정. `docs/infographics/coding-motion/brief.md`, `CodingMotionTest`.
- **AI 활용 메뉴 전체**: `aiuse.motion-assets`·`aiuse-motion.css`가 공용 코딩 무대·로더를 재사용한다. AI 활용 4탭과 게임 개발 27탭·입구의 10주소. 기존 그림 돌리·큰 제목 착지·번호 도장·불꽃·아이콘 비행(`wild`). 로봇 제작 순서·게임 개발 과정만 연결선으로 잇고 독립된 활용 카드는 순서를 만들지 않는다. 코드·인용·수치·복사는 보존. `docs/infographics/ai-use-motion/brief.md`, `AiUseMotionTest`.
- **IT 기초 메뉴 전체**: `study.cover`·`study.motion-assets`·`study-motion.css`로 AI 과정·파이썬·쉘·GIT·타자 표지와 전체 단원을 연출한다. 기존 개념 그림 위 도구 비행·불꽃, 단원 번호 도장, 실제 학습 순서 연결선(`wild`). 입력·리눅스·게임·시험은 고정한다. Alpine이 바꾸는 급수·지문 개수는 연출 부모에서 빼고 정적 제목·아이콘만 움직인다. `docs/infographics/it-basics-motion/brief.md`, `ItBasicsMotionTest`.
- Check motion with `node skills/webmovie/scripts/check.mjs https://sonub.localhost:7843/ko/<page> --selector main.content --times 0.3,0.9,4`.

## Links to site pages

Every drawn item links to its page (SKILL.md "Link every item"). In SONUB, find the page in this order: the item's data already has an address (`App\Content\Guide` steps → `href`, `external`, `wip`) → a named route (`php artisan route:list`, `lroute('name', …)`) → `routes/public/*.php`. Print it with `lurl($path)` or `lroute()` so the language prefix and the teacher/student subdomain are right; outside sites get `target="_blank" rel="noopener noreferrer"`; `wip` steps still link (to the coming-soon page) with a `screwdriver-wrench` icon and read-aloud `guide.step_wip`. Test each address per language (`tests/Feature/GuidePagesTest.php`, route test).

## Text in 17 languages

Every visible string goes into `lang/{17 locales}/*.php` at once, same keys and placeholders as `en`. Write headlines and labels short enough for German/Russian (≈ 30% longer than English) and check `ar`/`ur` (RTL, taller line height). Korean needs `word-break: keep-all`.

## Check

```bash
node skills/infographics/scripts/check.mjs https://sonub.localhost:7843/ko/<page> --widths 1440,768,390 --selector main.content --out /tmp/info-ko
node skills/infographics/scripts/check.mjs https://sonub.localhost:7843/ar/<page> --widths 1440,390 --selector main.content --out /tmp/info-ar
```

- Themes: the page sets `document.documentElement.dataset.sonubTheme` (`default` · `dark` · `pink`) plus the `wa-dark`/`wa-light` class — switch with `--eval "document.documentElement.dataset.sonubTheme='dark';document.documentElement.classList.add('wa-dark')"`.
- The notification prompt covers the top-end corner. For a clean capture of one block: `--clip --format webp --eval "for (const e of document.querySelectorAll('body *')) if (['fixed','sticky'].includes(getComputedStyle(e).position)) e.style.visibility='hidden'"`.
- Then the project's own Pest tests for the page (`docker compose exec app php artisan test <file>`), plus `LayoutTest`/`MenuPagesTest` if shared files changed. Check other languages and themes with `--eval` (see the `check.mjs` header) — e.g. `/ar/guide` for RTL and long words, and `data-sonub-theme` = `dark` · `pink`. Worked example: `docs/infographics/guide/brief.md` (the `/guide` hub).

## Images in SONUB

- Pixels only from Codex (`scripts/codex-image.sh`). Pages keep the existing pair convention: `public/images/<section>/<name>.webp` + `<name>.prompt.txt` beside it — pass the file path as the output (`scripts/codex-image.sh public/images/<section>/<name>.webp prompt.txt`) and the script keeps the prompt, `<name>.refs/` and the log next to it.
- Application/deck images (e.g. 모두의 창업): one folder per image under `docs/business/<series>/NN-name/` (folder mode). Plan: `docs/business/modoo-application-images.md`.
- Text inside page images is not translated — keep words out of page images (labels go in HTML next to the image).
- `codex-image.sh` in file mode also leaves `<name>.refs/` and `<name>.codex.log` — delete both from `public/` (they would be served); keep `<name>.prompt.txt`.

## The case study

`/guide` (`x-widget.guide.hub`) went through all three results in [../examples.md](../examples.md) on 2026-10-22: poor (another team's equal cards) → text-only (tables and chips — rejected: "not an infographic, text listed messily") → good (crossroads picture, one trunk with a colored node and branch into each one-row path card, metro routes whose stations link to the step pages; a 2×2 card version and a shared-steps map were then rejected as hard to read and duplicate; a readability pass then added fact labels, one glossary group, plain station names and a station grid; a last round replaced four parallel lanes with the trunk and linked every station — [../readability.md](../readability.md) "Case"). Plan and review: `docs/infographics/guide/brief.md`. Item pictures: `public/images/learn/guide/hub/<id>.webp` + `.prompt.txt`.
