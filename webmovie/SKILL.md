---
name: webmovie
description: HTML 로 만드는 무비 — 동영상 대신 진짜 HTML 장면을 영상처럼 재생한다. 장면(section)이 차례로 넘어가며 제목·숫자·차트·그림·단추가 CSS(먼저)·순수 JS 로 움직이고, 재생·일시 정지·장면 단추·전환·카메라 돌리·흔들림·끝나면 멈춤. 기본이 강한 연출 — 멀리서 날아와 넘쳤다 돌아오고, 찌그러지며 착지하고, 불꽃이 튄다. 글이 많으면 중요한 글자·링크 단추를 하나씩 번갈아 강조(스포트라이트), 자동 재생 켜기/끄기. 글자는 끝까지 텍스트라 검색엔진이 읽고 17개 언어 번역·수정이 쉽다. 그림 무비 — 큰 정지 그림을 배경판과 인물·로봇·표지판 조각(이미지 모델로 생성)으로 쪼개 걷기·손 흔들기·펼치기·날기로 움직인다. 그대로 넣는 webmovie.css/js(빌드 없음), 연출 data-webmovie="mask" 등 40여 개. JS 없음·움직임 줄이기 = 원래 HTML, 한중일·아랍어(RTL) 안전, 멈춘 장면 ?webmovie-t= 와 검사 scripts/check.mjs. HTML movies instead of video — SEO- and translation-friendly kinetic typography, infographics, picture scenes and UI motion. Use it whenever the user wants a promo, intro or explainer clip, a video-like hero, a still illustration turned into a moving scene, an animated story, kinetic typography, or to animate text, numbers, charts, an infographic, a picture, buttons or a section, or says the motion is too weak or boring — "이 그림을 움직이게", "동영상 대신", "영상처럼", "무비", "애니메이션", "더 강하게", "/webmovie".
license: MIT
compatibility: The kit is plain CSS and JavaScript for evergreen browsers (individual transform properties, custom properties in keyframes; Intl.Segmenter and animation-timeline are used when present) — no framework, no build. scripts/check.mjs needs Node 22+ and Google Chrome or Chromium.
---

# webmovie — movies made of HTML

A video of words is a picture of words: search engines cannot read it, translators cannot translate it, nobody can fix a typo without re-rendering, and the numbers in it are not data. webmovie makes the movie out of the page itself:

- **Scenes** are `<section>`s of real HTML — a heading, a sentence, a number, a chart, a button.
- The **player** (`data-webmovie-player`) plays them one after another like a clip: transitions, a slow camera push, ambient light, play/pause, scene buttons, a stop at the end.
- The **shots** inside a scene — a headline landing, letters flipping in, numbers counting, bars growing, a line drawing — are **CSS first**, with a little **plain JavaScript only where CSS cannot** (splitting text into letters, counting, timing).

- A **picture movie** (`data-webmovie-picture`) turns a still illustration into a moving scene: a background plate plus cut-out layers — a person walks in, signs unfold, a robot waves, clouds drift — on one clock, then it stands still as the original picture.

- A **spotlight** (`data-webmovie-spotlight`) keeps a text-heavy block alive after it has entered: its key texts — or any elements: link buttons, cards, icons — take turns, one at a time gets a short cue (pop · tada · jelly · hop · glow · ripple letters), partners move with it, two rounds, then still.
- **Autoplay or not**: movies and pictures play by themselves when they come into view; `data-webmovie-autoplay="off"` makes them stand as the plain page until the reader presses play/replay.

- **Power by default.** A webmovie is **bold**: things fly in from far, overshoot and snap back, squash on landing, throw sparks, the camera dollies and shakes. Shy fades are the failure, not the safe choice (user, 2026-10-25: "애니메이션이 너무 소극적"). `data-webmovie-power="calm|bold|wild"` scales every distance at once — bold is the default.

Without JS or with reduced motion the movie is simply the page, scene after scene — a storyboard that search engines, translators and screen readers read. The same shots also work without a player, on any page section (on view, hover or click).

**Talk in the user's language.** These files are English; the page keeps its own languages.

## The rules (why each one exists)

1. **Semantic HTML first.** Pick the element for the meaning — `h1`–`h4`, `p`, `mark`, `data`, `time`, `ol`/`ul`/`dl`, `table` + `caption`, `figure` + `figcaption`, `blockquote`, `a`/`button`, `section` per scene — then animate it. Every element animates the same way, so never choose a `div` because it is "easier to animate". Element map and SEO checklist: [references/html.md](references/html.md).
2. **The final frame is the plain HTML.** Without JS, with `prefers-reduced-motion`, in print and after the animation, the DOM is exactly the markup the server sent. This one rule gives SEO (crawlers read the HTML), translation (the words are in the language file), copy-paste, screen readers and "nothing is lost if the script fails". So: write the finished page first, then add motion as an *entrance to* that state — never build content in JS.
3. **Text stays text.** No words in `<video>`, GIF, canvas, Lottie, SVG-outlined paths or images. Numbers are written final in the HTML (`<data value="12500">12,500</data>`) and only *counted to*.
4. **CSS first.** `@keyframes`, `transition`, `animation-timeline: view()`, `@starting-style`, `:hover` cover most motion and run off the main thread. Reach for JS for: splitting into letters/words/lines, counting, scramble, rotating words, sequencing, viewport triggers. Never add an animation library or a CDN for this.
5. **Animate cheap properties.** `opacity`, `translate`, `scale`, `rotate`, `filter`, `clip-path` (+ `stroke-dashoffset` for SVG lines, `background-size` on short inline text). Never `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` — they reflow the page every frame.
6. **One hero shot per moment — acted, not faded.** A headline gets *one* driver (mask *or* letters *or* smash), but that driver is **acted**: anticipation (a small wind-up), a big travel (≥ 30–60 % of its own size, blur while fast), **overshoot** (110–125 %), squash on landing, settle. Then **follow-through**: an impact (sparks `data-webmovie-burst`, a camera `shake`, a punch on the last digit) and secondary motion (underline, glow) right after, smaller. A shot you only notice when you look for it is too small — make it bigger. Principles with keyframes: [references/acting.md](references/acting.md).
7. **Bold, then still.** Pieces 600–1100 ms, a block's reveal ≤ ~1.5 s, a picture movie ≤ ~5 s — then *nothing* moves. Motion that keeps going must stop by itself (≤ 3 loops) or have a pause control (WCAG 2.2.2). Never flash more than 3 times a second (WCAG 2.3.1); shakes ≤ 650 ms; the whole thing is off in reduced motion. Being loud is allowed because it is short.
8. **Every language, same rhythm.** Split with `Intl.Segmenter`; never tear joined scripts (Arabic, Indic) into letters; keep CJK line breaks; mirror directions in RTL; cap the total time so a 40 % longer translation is not 40 % slower; format numbers with `Intl.NumberFormat(lang)`.

Background, numbers and sources for each rule: [references/principles.md](references/principles.md).

## Workflow

1. **Write the storyboard.** A clip, intro, explainer or data story → a **movie**: split the message into 3–6 scenes, one idea and one heading each (the heading names the scene button), and decide each scene's exit and length. A big still illustration that shows a story (someone goes somewhere, something happens) → a **picture movie**: plate + cut-out layers made with the image model, storyboarded on one ≤ 5 s clock ([references/picture.md](references/picture.md)). A page section that only needs an entrance → no player, just shots. Directing, timing and scene recipes: [references/movie.md](references/movie.md).
2. **Choose the shots** with the table below — in each scene 1–3 things *act* (the claim, the key number, the call to action), *one* strong shot each, with an impact when it lands; the rest still enters (stagger, fade-up) but smaller. Motion marks *importance and order*; if it marks nothing, cut it. Write the beats as a timeline: anticipation → hit → impact → settle → still. Outside a movie pick the trigger: on view (default), on load, on hover/click.
3. **Build with the kit.** Copy `assets/webmovie.css` + `assets/webmovie.js` into the project (unchanged — they are the single source; project-specific looks go in the project's own CSS by overriding `--webmovie-*` variables). Put both in `<head>`, the script *without* `defer`:
   ```html
   <link rel="stylesheet" href="/css/webmovie.css">
   <script src="/js/webmovie.js"></script>
   ```
   Then wrap the scenes in the player and mark the shots: `<h1 data-webmovie="mask">…</h1>`. Attributes, presets and code: [references/presets.md](references/presets.md).
4. **Check it.** Run `node scripts/check.mjs <url-or-file>` (below) and *look* at the frozen frames (a movie scene: `?webmovie-scene=k&webmovie-t=s`) (`t-0.15.png` = start, `t-0.4.png` = middle, the last = end). Fix every ✗; read every !. Then open the page in a browser at a wide and a narrow width and in an RTL language if the site has one.
5. **Report** the storyboard (scenes and shots), why each moves, and the check result (errors 0, frames looked at).

## Choose the shots

| Moment | Shot (`data-webmovie=`) | Why |
| --- | --- | --- |
| A clip that plays like a video | player `data-webmovie-player` + `.webmovie-scene` sections · scene classes `webmovie-push`, exits `data-webmovie-exit="zoom\|side\|fade"` | scenes, transitions, camera push, ambient light, play/pause, scene buttons — all HTML |
| A still illustration that should play (hero, header picture) | picture `data-webmovie-picture` + `.webmovie-camera` + layers: `walk` · `jump` · `wave` · `hop` · `unfold` · `drift` · `fly` · `ping` | the story in the picture happens, then the picture is the original again |
| Hero headline, calm/premium | `mask` (lines rise from a clipped baseline) | the most robust reveal, no blur cost |
| Hero headline, loud | `whip` (words whip in with a smear) · `assemble` (letters fly in scattered) · `smash` (whole, from huge) · `elastic` (letters stretch up and recoil) | the headline *is* the event |
| Badge, stamp, verdict, "NEW" | `stamp` (thumps down tilted) · `blast` (bursts out of a point) + `data-webmovie-burst` | an impact the eye cannot miss |
| Card, sign, label dropping in | `drop-in` (falls, squashes, bounces) · `swing` (hangs from the top) · `glitch` (digital) | physical weight |
| Camera of a picture | `dolly` on `.webmovie-camera` (`--webmovie-focus`) + `shake` on an inner `.webmovie-rig` at the impact | the whole frame moves like a film camera |
| Hero headline, soft | `soft-blur` (letters) · `focus` · `glow` (whole) | focus-pull feel; keep it to one line or two |
| Title card, chapter title | `slam` · `flip` (3D letters) · `converge` (tracking-in) | cinematic landings |
| Short punchy word/tagline | `rise` · `drop` · `spring` · `bounce` (words) · `center` | kinetic; letters only for short strings |
| Subtitle, paragraph | `words` · `fade-up` · `slide` (lines) | readable while moving |
| Code / terminal / "AI typing" | `typewriter` · `scramble` | stepped; scramble uses the text's own letters (any script) |
| Emphasis inside a sentence | `highlight` · `underline` · `shine` · `weight` · `reveal` (soft mask) | marks a word without moving the line |
| Swapping one word | `<span data-webmovie-rotate>` | all words in the HTML; stops after 3 rounds |
| A lot of text — keep the eye on the key phrases; several links/buttons that should each be noticed | spotlight `data-webmovie-spotlight="ripple"` (or `pop` · `tada` · `jelly` · `hop` · `glow`, combinable: `"ripple glow"`) on the block + `data-webmovie-cue` on each key text/element (+ `data-webmovie-cue-with="id …"` partners) | after the entrance, one at a time, in reading order, 2 rounds, pauses on hover/focus/off-screen — the reader sees each choice once more |
| Should the movie start by itself? | default: plays when in view · `data-webmovie-autoplay="off"` on a player or picture: still until play/replay | a hero that greets → autoplay; a movie next to reading text or many movies on one page → off |
| Key numbers | `count` on `<data value>` | final value is in the HTML, counted in the reader's format |
| Bars, progress, donut, pie | `bar` · `ring` · `pie` (all `--pct`) | value lives in a CSS variable, label is text |
| Line chart, connector lines, icons | `draw` (SVG `pathLength="1"`) | strokes draw in order |
| Cards, steps, list items | `stagger` (children) | reading order made visible |
| Image (decoration only) | `wipe` · `wipe-up` · `settle` · `zoom-out` | reveal without moving the layout |
| Buttons, links, cards | classes `webmovie-lift` `webmovie-press` `webmovie-sheen` `webmovie-nudge` `webmovie-pulse` `webmovie-border-glow` | CSS only, no JS |
| Something inserted or opened (toast, popover, dialog, new message) | class `webmovie-appear` | CSS `@starting-style`, no JS |
| Scroll-linked | classes `webmovie-scroll` · `webmovie-progress` | CSS `animation-timeline`, no JS |

Newer CSS worth using — `linear()` springs/bounces, `@property` gradients, masks, `offset-path`, scroll-driven and scroll-triggered animations, `sibling-index()`, `@starting-style`, `interpolate-size`, view transitions, WAAPI — with support status: [references/techniques.md](references/techniques.md). Infographic patterns (numbers, bars, rings, charts, timelines, maps, how to sequence a scene): [references/infographics.md](references/infographics.md). Buttons, colors, images, page and state transitions: [references/ui.md](references/ui.md). The CSS animation language itself (properties, shorthand order, fill modes, events, `@property`, scroll timelines, view transitions, WAAPI): [references/css-animation.md](references/css-animation.md).

## The kit in one minute

```html
<!-- a movie: the player plays the scenes like a clip -->
<section data-webmovie-player aria-label="Intro" data-label-play="Play" data-label-pause="Pause" data-label-replay="Replay" data-label-scene="Scene">
  <section class="webmovie-scene webmovie-push">
    <h2 data-webmovie="slam">Start small.</h2>
    <p data-webmovie="soft-blur">Every word is HTML.</p>
  </section>
  <section class="webmovie-scene" data-webmovie-exit="zoom">
    <h2 data-webmovie="converge">Ship often.</h2>
    <p><data class="num" value="12500" data-webmovie="count">12,500</data> learners</p>
  </section>
  <section class="webmovie-scene">
    <h2 data-webmovie="flip">Made for everyone.</h2>
    <a class="btn webmovie-lift webmovie-press webmovie-sheen" href="/start" data-webmovie="pop">Start</a>
  </section>
</section>

<!-- shots without a player: play when they come into view -->
<h1 data-webmovie="mask">Text that moves — and stays text.</h1>
<p>Made for <span data-webmovie-rotate><span>search engines</span>, <span>translators</span>, <span>editors</span></span></p>
<span class="webmovie-bar" data-webmovie="bar" style="--pct: 72"></span> 72%
<ol data-webmovie="stagger"><li>Write</li><li>Pick one shot</li><li>Check</li></ol>
```

- Options: `data-webmovie-split` (`chars|words|lines|children|paths|none`), `data-webmovie-from` (`start|end|center|edges|random`), `data-webmovie-delay|dur|stagger|max` (ms), `data-webmovie-trigger` (`view|load|hover|click|manual`), `data-webmovie-repeat`.
- Power: `data-webmovie-power="calm|bold|wild"` on any container (bold = default: distances, blur and scale × 1.6 with an overshoot curve; wild × 2.4 with a spring; calm × 1 for reading-heavy pages). Impact: `data-webmovie-burst="14"` throws sparks when the element lands (`data-webmovie-burst-at="ms"`, colors from `--webmovie-burst: #f90, #fff`). A `count` ends with a punch.
- Spotlight: `data-webmovie-spotlight="<cues>"` on a block, members `data-webmovie-cue` (own cue list allowed: `data-webmovie-cue="tada"`), `data-webmovie-hold` (ms between cues, 1700), `data-webmovie-loops` (rounds, 2), `data-webmovie-delay` (ms after the entrance, 700), `--webmovie-cue-color`, `--webmovie-cue-partner` (the partners' keyframes). Whole cues need a box (block, inline-block, a button); `ripple` works on inline text. `webmovie.replay(block)` starts it again. Recipes and rules: [references/acting.md](references/acting.md#spotlight--take-turns).
- Elements that enter the view together cascade 100 ms apart in reading order (`--webmovie-cascade`).
- Content added later (Alpine, fetch) is picked up by itself; `webmovie.replay(el)` after changing an element's text (language switch).
- `?webmovie-t=0.4` on any page plays everything and freezes it at 0.4 s — for screenshots and review (`&webmovie-scene=2` for a movie's third scene).

## Check

```bash
node scripts/check.mjs https://example.com/page            # or a local .html file
node scripts/check.mjs page.html --times 0.2,0.5,3 --width 390 --eval "document.title"
```

It opens the page three times in headless Chrome and prints errors (✗, exit code 1) and warnings (!):

| Kind | Meaning |
| --- | --- |
| ✗ `hidden-without-js` | text invisible when JS does not run (hidden in plain CSS) |
| ✗ `stuck-hidden` | still invisible after scrolling through and waiting |
| ✗ `text-changed` | after the animation the text differs from the HTML (`data-webmovie-trigger="manual"` is skipped: the page's own script owns that text) |
| ✗ `split-left` | letter/word spans were not put back |
| ✗ `hidden-reduced-motion` · `moving-reduced-motion` | reduced-motion users get hidden or moving content |
| ✗ `movie-no-pause` | a movie without its play/pause button |
| ! `reflow` | lines break differently while split → the text jumps when restored |
| ! `layout-property` | an animation moves width/top/margin/font-size … |
| ! `endless-text` | moving text that never stops (WCAG 2.2.2) |
| ! `js-only-content` | animated text created by JS, not in the HTML |
| ! `pixels` | video / canvas / GIF on the page — keep the words as HTML |

Before reading the final text the check stops movies and spotlights (`webmovie.stopSpotlights()`).

Frames go to `./webmovie-check/t-<s>.png`; open them and look — a check cannot see an ugly frame.

## Files

| File | Use |
| --- | --- |
| `assets/webmovie.css` · `assets/webmovie.js` | the kit — copy unchanged |
| `assets/demo.html` | a 4-scene movie + every shot + infographic + buttons; `demo.html?lang=ar` / `ko` / `ja` |
| `scripts/check.mjs` | the browser check above |
| [references/acting.md](references/acting.md) | **strong motion** — power levels, the 8 acting principles (anticipation, squash, overshoot, follow-through, arcs, secondary, impact, camera) with keyframes, amplitude numbers, recipes, safety limits |
| [references/principles.md](references/principles.md) | timing, easing, stagger, choreography, performance, accessibility, SEO, i18n — with numbers |
| [references/html.md](references/html.md) | which HTML element for which content, charts as data, multilingual markup, SEO checklist |
| [references/movie.md](references/movie.md) | **the player** — markup, how a movie plays, storyboarding and directing scenes, recipes, core code |
| [references/picture.md](references/picture.md) | **the picture movie** — a still illustration split into plate + cut-out layers (image-model prompts), places in %, the one-clock timeline, crop, replay, core code |
| [references/techniques.md](references/techniques.md) | modern CSS techniques with snippets and browser support (checked 2026-10-25) |
| [references/presets.md](references/presets.md) | every shot (preset): values, attributes, the core code of webmovie.js/css, adding a preset |
| [references/infographics.md](references/infographics.md) | counters, bars, rings, charts, timelines, sequencing a data scene |
| [references/ui.md](references/ui.md) | buttons, hover, color, images, page/state transitions |
| [references/css-animation.md](references/css-animation.md) | CSS animation and transition reference, scroll-driven, view transitions, WAAPI |
| [references/projects/sonub.md](references/projects/sonub.md) | **SONUB (sonub.com)** — read first when working in that repository |
