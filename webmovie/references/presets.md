# Presets and the kit's core code

The kit is `assets/webmovie.css` + `assets/webmovie.js`. Copy both unchanged; change looks by overriding `--webmovie-*` variables in your own CSS. This file is the contract: if the kit is lost or must be changed, rebuild it from here.

## Contents

- [Attributes](#attributes)
- [State machine](#state-machine)
- [Preset table](#preset-table)
- [Variables](#variables)
- [Splitting](#splitting)
- [Core code — webmovie.css](#core-code--webmoviecss)
- [Core code — webmovie.js](#core-code--webmoviejs)
- [Add or change a preset](#add-or-change-a-preset)
- [Known limits](#known-limits)

## Attributes

| Attribute | Values | Default |
| --- | --- | --- |
| `data-webmovie` | preset name (table below) | — (required) |
| `data-webmovie-split` | `chars` `words` `lines` `children` `paths` `none` | from the preset |
| `data-webmovie-from` | `start` `end` `center` `edges` `random` (stagger order) | `start` (`center` preset: `center`) |
| `data-webmovie-delay` · `-dur` · `-stagger` · `-max` | milliseconds | preset variables |
| `data-webmovie-trigger` | `view` (enters viewport) · `load` · `hover` (pointer/focus, replays) · `click` (replays) · `manual` (`webmovie.play(el)`) | `view` |
| `data-webmovie-repeat` | (flag) replay every time it re-enters the view | once |
| `data-webmovie-count-from` · `-count-dur` | counter start value, counting time | `0`, `1600` |
| `data-webmovie-rotate` | on a wrapper of `<span>` words | — |
| `data-webmovie-hold` · `data-webmovie-loops` | rotate: ms per word, rounds before resting · movie scene: ms of that scene · movie: extra rounds | `2200`, `3` · reading time · `0` |
| `data-webmovie-player` · `.webmovie-scene` · `data-webmovie-exit` · `data-label-*` | movie wrapper, scenes, scene exit (`up` `zoom` `side` `fade`), button labels | — ([movie.md](movie.md)) |
| `data-webmovie-spotlight` · `data-webmovie-cue` · `-cue-with` | block: cue list (`pop` `tada` `jelly` `hop` `glow` `ripple`, combinable) · member (empty = the block's list) · partner ids that move with the member; the block's `data-webmovie-hold` · `-loops` · `-delay` = 1700 · 2 · 700 | — ([acting.md](acting.md#spotlight--take-turns)) |
| `data-webmovie-autoplay` | `off` on a player or a picture: stands still until play / replay | plays when in view |
| `data-webmovie-power` | `calm` · `bold` · `wild` on any container (multiplier `--webmovie-k` 1 · 1.6 · 2.4) | `bold` |
| `data-webmovie-burst` · `-burst-at` | sparks when the shot lands: count (≤ 40), ms after the start | `12`, delay + 42 % of dur |
| `?webmovie-t=<seconds>` (+ `&webmovie-scene=<k>`) | page URL: play all, freeze at t (movie: show scene k) | — |

JS API: `webmovie.pause(movie)`, `webmovie.resume(movie)`, `webmovie.go(movie, k)`, `webmovie.play(el)`, `webmovie.replay(el)` (finish + play), `webmovie.reset(el)` (back to waiting, re-observed), `webmovie.finish(el)` (jump to the end and restore), `webmovie.refresh(root)` (prepare new elements — also automatic through a MutationObserver). Event `webmovie:done` (bubbles) after each element.

## State machine

```
 (no JS) ─────────────────────────────────────────────────────── plain HTML = final frame
 html.webmovie-js  →  [data-webmovie] not .webmovie-ready : hidden (CSS, one frame; fail-safe shows it after 3 s)
 prepare()       →  .webmovie-ready (+ .webmovie-rtl)   reduced motion → .webmovie-done (final, never moves)
                     trigger view/load/manual → .webmovie-wait (hidden: opacity var(--webmovie-wait-o))
                     trigger hover/click      → visible, waits for the event
 play()          →  split (chars/words/lines/children/paths) or whole
                     .webmovie-split | .webmovie-whole  + .webmovie-in   (CSS animations run, fill-mode both)
                     inline vars --webmovie-delay, --webmovie-step; --i on each piece
 finish()        →  restore original nodes, remove classes/vars → .webmovie-done  (= plain HTML again)
 reset()         →  finish + .webmovie-wait + observe again
```

## Preset table

`o` start opacity · `x`/`y` start offset · `s` start scale · `blur` start blur · times in ms · `max` = cap of the whole reveal. Values from the Pixel Point catalog / iart kinetic-typography where named; em units so they scale with the font.

| Preset | Split | From state | Dur | Stagger | Max | Easing |
| --- | --- | --- | --- | --- | --- | --- |
| `fade` | none | o 0 | 600 | — | — | punch |
| `fade-up` | none | o 0, y 36px, s 0.97 | 750 | — | — | punch |
| `focus` | none | o 0, y 20px, blur 16px, s 1.06 | 820 | — | — | punch |
| `pop` | none | o 0, s 0.8 | 650 | — | — | spring |
| `zoom-out` | none | o 0, s 1.15, y 10px, blur 4px | 850 | — | — | punch |
| `settle` | none | s 1.14 (image in an overflow-hidden frame) | 2400 | — | — | expo |
| `slam` | none | o 0, s 2, blur 12px — a title card that lands | 900 | — | — | punch |
| `glow` | none | lights up from a blurred glow (`text-shadow` → none) | 1400 | — | — | ease |
| `reveal` | none | soft-edged mask sweep from inline-start (RTL flips) | 1100 | — | — | inout |
| `wipe` · `wipe-up` | none | clip-path inset from inline-start / bottom (RTL flips) | 900 | — | — | inout |
| `weight` | none | font-weight 200 → own weight (variable font) | 1000 | — | — | inout |
| `shine` | none | a glint sweeps across the text once (stays visible) | 1400 | — | — | inout |
| `highlight` · `underline` | none | marker / line drawn under the text (stays visible) | 900 | — | — | inout |
| `smash` | none | keyframes: huge (1 + 1.1k) and blurred, tilted → hits at 0.88 → shakes → settles | 1000 | — | — | (0.2,0.7,0.3,1) |
| `stamp` | none | keyframes: 1 + 1.5k, −16° → thumps to 0.9 → jolts 2px → still | 900 | — | — | (0.3,0.8,0.3,1) |
| `blast` | none | keyframes: s 0.1, −12° → 1.22 → 0.93 → 1.03 → 1 | 850 | — | — | (0.25,0.8,0.3,1) |
| `drop-in` | none | keyframes: falls from −80% × k, squashes `1.18 0.8`, bounces twice (origin: bottom) | 1100 | — | — | linear |
| `swing` | none | keyframes: hangs from the top edge, −70° → 32° → −18° → 10° → −4° (`--webmovie-swing: -1` mirrors) | 1400 | — | — | ease-out |
| `glitch` | none | keyframes: RGB split + slice jumps ≈ 0.4 s, then clean (short text, once) | 750 | — | — | steps |
| `soft-blur` | chars | o 0, y 0.45em, blur 0.28em | 900 | 25 | 1400 | punch |
| `rise` · `drop` | chars | o 0, y ±0.8em, s 0.8 | 700 | 26 | 1500 | punch |
| `flip` | chars | 3D: `rotate: x -100deg` around the baseline, perspective 600px | 800 | 35 | 1400 | expo |
| `converge` | chars | o 0, x = distance from the middle letter × 0.5em, blur 0.12em (tracking-in look) | 1000 | 0 | — | expo |
| `center` | chars, from center | o 0, y 0.4em, s 0.85, blur 0.08em | 620 | 22 | 1500 | punch |
| `assemble` | chars | keyframes: each letter from a scattered place (`--r1 --r2` × 1.5em × k), spinning (`--r3` × 200°), s 0.2 → 1.14 → 1 | 900 | 22 | 1500 | (0.2,0.8,0.3,1) |
| `elastic` | chars | keyframes: drops stretched `0.7 1.5`, squashes `1.32 0.7` on the baseline, wobbles | 900 | 40 | 1500 | linear |
| `typewriter` | chars | appears + walking caret | 55 | 55 | 4000 | linear |
| `scramble` | chars | letters flicker through the text's own letters | 600 | 30 | 1500 | linear |
| `words` | words | o 0, y 0.5em, s 0.92 | 720 | 70 | 1400 | expo |
| `whip` | words | keyframes: from −2.2em × k inline-start, stretched `1.3 0.85` + blur → overshoots 0.22em → snaps back | 750 | 65 | 1500 | (0.2,0.75,0.3,1) |
| `spring` | words | o 0, s 0.5 | 500 | 80 | 1400 | spring |
| `bounce` | words | o 0, y −1em, falls and bounces | 1000 | 90 | 1600 | `linear()` bounce |
| `depth` | words | o 0, y 0.5em, s 0.82, blur 0.06em | 700 | 70 | 1400 | punch |
| `mask` | lines | y 110% inside a clip (no fade) | 760 | 90 | 1600 | expo |
| `slide` | lines | o 0, x −1.6em (from inline-start), blur 0.1em | 900 | 120 | 1600 | punch |
| `stagger` | children | o 0, y 36px, s 0.94, blur 3px | 700 | 85 | 1500 | punch |
| `count` | none + counting | o 0, y 14px, s 0.85; digits 0 → value, then a **punch** (class `webmovie-punch`, +480 ms) | 550 (+1600 count) | — | — | punch |
| `bar` | none | `scale: 0 1` from the start side (`--pct` sets width) | 1100 | — | — | expo |
| `ring` | none | ring stroke 0 → `--pct`, svg o 0, s 0.85 | 1300 | — | — | expo |
| `draw` | paths | `stroke-dashoffset` 1 → 0 on `[pathLength]` | 1200 | 150 | 2400 | inout |
| `pie` | none | `conic-gradient` share 0 → `--pct` (registered `--webmovie-p`) | 1300 | — | — | expo |
| `walk` | none | picture layer: o 0, from y 22cqh (`--webmovie-x/-y`), 8 steps — each lifts (stretch, lean ±4°, `--webmovie-bob` −5%) and lands (squash) | 1800 | — | — | linear |
| `jump` | none | picture layer: crouch `1.12 0.84` → leap on an arc from x −10cqw → land squash `1.18 0.8` → rebound | 1100 | — | — | linear |
| `wave` | none | picture layer: anticipation, swings −18° … 15° with small hops, damped (stays visible) | 1600 | — | — | linear |
| `hop` | none | picture layer: crouch, hop −24% with stretch, land squash, small rebound (stays visible) | 1000 | — | — | linear |
| `unfold` | none | picture layer: o 0, s 0 −16° → 1.24 7° → 0.9 → 1.07 → 1 from `transform-origin` (a board out of its pole) | 950 | — | — | linear |
| `drift` | none | picture layer: o 0, x −14cqw, s 0.9, slides into place (clouds, mist) | 4500 | — | — | inout |
| `fly` | none | picture layer: o 0, x −55cqw, y 14cqh, an arc with wing flaps (`scale: 1 0.5`) | 4000 | — | — | linear |
| `ping` | none | picture marker `.webmovie-ping`: pops in, then a ring (scale 5, border 4 → 1px) spreads `--webmovie-ping-loops` (2) times | 550 (+1000 ring) | — | — | spring |
| `dolly` | none | camera: starts pushed in (1 + 0.3k, blur 3px) on `--webmovie-focus` and pulls back, stays visible | 2600 | — | — | (0.3,0.55,0.15,1) |
| `shake` | none | camera rig / section: a decaying jolt ≤ 0.9% × k and ±0.45°, with a zoom 1 + 0.024k that covers the uncovered edges, stays visible | 650 | — | — | linear |

`punch` = `--webmovie-ease-punch` `cubic-bezier(0.18, 1.32, 0.32, 1)` (calm power: `--webmovie-ease-calm`). Distances, scales and blurs of the non-keyframe presets are × `--webmovie-k` (bold 1.6) — the values above are before that multiplication. Impact options for any shot: `data-webmovie-burst="N"` (sparks) · `data-webmovie-burst-at="ms"` · `--webmovie-burst` colors — [acting.md](acting.md).

Movie (scenes played like a video, play/pause, progress): `data-webmovie-player` + `.webmovie-scene` children — [movie.md](movie.md).

Picture movie (a still illustration rebuilt as a background plate + cut-out layers that act on one clock): `data-webmovie-picture` + `.webmovie-camera` · `.webmovie-plate` · `.webmovie-layer` (`--x` `--y` `--w` in % of the picture) · `.webmovie-ping` · `<button data-webmovie-replay>` — [picture.md](picture.md). `cqw`/`cqh` in the picture presets are % of the picture (it is a size container).

CSS-only classes (no `data-webmovie`, no JS): `webmovie-appear` (`@starting-style` entrance of inserted/opened elements), `webmovie-border-glow` (3 rounds), `webmovie-lift`, `webmovie-press`, `webmovie-sheen`, `webmovie-nudge` (+ child `webmovie-nudge-icon`), `webmovie-pulse` (3 rings), `webmovie-float` (3 rounds), `webmovie-gradient-text` (2 rounds), `webmovie-skeleton` (loading, endless by design), `webmovie-scroll` (scroll-linked fade-up), `webmovie-progress` (reading progress bar). See [ui.md](ui.md).

## Variables

Set on the element (or a class) to tune a preset — in your CSS, not in `style=""`:

```css
.hero-title { --webmovie-y: 0.8em; --webmovie-dur: 1000ms; --webmovie-stagger: 120ms; }
.promo [data-webmovie="highlight"] { --webmovie-mark: rgb(124 58 237 / 0.3); }
.price [data-webmovie="shine"] { --webmovie-glint: #ffe9a8; }
:root { --webmovie-cascade: 140ms; }
```

`--webmovie-name` (keyframes), `--webmovie-dur`, `--webmovie-scene-dur` (set by a movie), `--webmovie-stagger`, `--webmovie-max`, `--webmovie-delay`, `--webmovie-easing`, `--webmovie-o`, `--webmovie-x`, `--webmovie-y`, `--webmovie-s`, `--webmovie-r`, `--webmovie-blur`, `--webmovie-wait-o`, `--webmovie-count-dur`, `--webmovie-wght-from`, `--webmovie-mark`, `--webmovie-mark-h`, `--webmovie-glint`, `--webmovie-pulse`, `--webmovie-loops`, `--webmovie-c1..c3`, `--webmovie-progress`, `--webmovie-k` (power), `--webmovie-burst` (spark colors), `--webmovie-focus` (dolly target), `--webmovie-swing` (swing side), `--webmovie-bob` (walk step height), per-piece `--r1..r3` (set by JS), and the easing tokens on `:root`. Every `[data-webmovie]` resets the from-state variables, so a nested element never inherits its parent's preset.

## Splitting

| Text | chars preset | words / lines preset |
| --- | --- | --- |
| Latin, Cyrillic, Greek … | one piece per grapheme, inside a no-wrap word | one piece per space-separated word |
| Chinese, Japanese | graphemes | letters of each `Intl.Segmenter` word share one timing; lines wrap as the plain text |
| Korean (Hangul) | graphemes (syllables) | same as CJK unless `word-break: keep-all` (then whole 어절 per piece) |
| Thai, Lao | graphemes | `Intl.Segmenter` words (no-wrap, Thai only breaks between words anyway) |
| Arabic, Persian, Urdu, Hebrew-adjacent joined scripts, Indic, Tibetan, Myanmar, Khmer | **falls back to words** (letters would lose their joining) | words |
| Emoji, accents, combining marks | one grapheme cluster each | — |

- Whitespace stays as real text nodes between word spans → wrapping, copy and screen readers keep the spaces.
- Elements inside the text (`<strong>`, `<a>`, `<em>`, `<br>`) are kept; only their text nodes are split. Not entered: `svg, img, picture, video, audio, canvas, iframe, math, code, kbd, samp, textarea, select`, nested `[data-webmovie]`, `.webmovie-keep`.
- `lines` = words grouped by measured line (after `document.fonts.ready`), all words of a line share one delay — no line wrapper elements, so nested markup is safe.

## Core code — webmovie.css

```css
[data-webmovie] {                         /* defaults on every animated element */
    --webmovie-name: webmovie-enter; --webmovie-dur: 700ms; --webmovie-stagger: 40ms; --webmovie-max: 1500ms; --webmovie-delay: 0ms;
    --webmovie-easing: var(--webmovie-ease);
    --webmovie-o: 0; --webmovie-x: 0px; --webmovie-y: 0px; --webmovie-s: 1; --webmovie-r: 0deg; --webmovie-blur: 0px;
    --webmovie-wait-o: 0; --webmovie-dir: 1;
}
.webmovie-rtl { --webmovie-dir: -1; }
.webmovie-word { display: inline-block; white-space: nowrap; }
.webmovie-word.webmovie-loose { display: inline; white-space: inherit; }   /* CJK */
.webmovie-word > .webmovie-piece { display: inline-block; }

@media screen and (prefers-reduced-motion: no-preference) {
    .webmovie-js [data-webmovie]:not(.webmovie-ready, [data-webmovie-trigger="hover"], [data-webmovie-trigger="click"]) {
        opacity: var(--webmovie-wait-o);
        animation: webmovie-failsafe 1ms 3s forwards;
    }
    .webmovie-wait { opacity: var(--webmovie-wait-o); }
    .webmovie-whole.webmovie-in {
        animation: var(--webmovie-name) var(--webmovie-dur) var(--webmovie-easing) var(--webmovie-delay) both;
    }
    .webmovie-split.webmovie-in .webmovie-piece {
        animation: var(--webmovie-name) var(--webmovie-dur) var(--webmovie-easing)
                   calc(var(--webmovie-delay) + var(--i, 0) * var(--webmovie-step, 0ms)) both;
    }
    [data-webmovie="mask"] { --webmovie-o: 1; --webmovie-y: 110%; --webmovie-dur: 760ms; --webmovie-stagger: 90ms; --webmovie-max: 1600ms; --webmovie-easing: var(--webmovie-ease-expo); }
    [data-webmovie="mask"] .webmovie-word { clip-path: inset(-0.35em -0.2em -0.12em -0.2em); } /* clip, not overflow: no baseline change */
    /* … one line of variables per preset (see the table) … */
}
.webmovie-frozen .webmovie-in, .webmovie-frozen .webmovie-in * { animation-play-state: paused !important; }

@keyframes webmovie-enter {               /* "to" omitted = the element's own (final) style; × power k (rotation not) */
    from {
        opacity: var(--webmovie-o);
        translate: calc(var(--webmovie-x) * var(--webmovie-dir) * var(--webmovie-k, 1)) calc(var(--webmovie-y) * var(--webmovie-k, 1));
        scale: max(0, calc(1 + (var(--webmovie-s) - 1) * var(--webmovie-k, 1)));
        rotate: var(--webmovie-r);
        filter: blur(calc(var(--webmovie-blur) * var(--webmovie-k, 1)));
    }
}
/* acted presets (smash, stamp, blast, drop-in, swing, glitch, whip, assemble, elastic, walk, jump, wave, hop, unfold, dolly, shake)
   carry their phases in their own keyframes with --webmovie-easing: linear or a fast curve — code in acting.md */
@keyframes webmovie-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0); } } /* explicit "to": inset → none jumps */
@keyframes webmovie-type { 0% { opacity: 0; } 1%, 99% { opacity: 1; box-shadow: calc(0.07em * var(--webmovie-dir)) 0 0 currentColor; } 100% { opacity: 1; box-shadow: none; } }
@keyframes webmovie-bar  { from { scale: 0 1; } }
@keyframes webmovie-ring { from { stroke-dashoffset: 100; } }
@keyframes webmovie-draw { from { stroke-dashoffset: 1; } }
```

Natural (final) states that exist without JS: `.webmovie-bar { inline-size: calc(var(--pct) * 1%) }`, `.webmovie-ring-fill { stroke-dasharray: 100; stroke-dashoffset: calc(100 - var(--pct)) }`, highlight/underline backgrounds fully drawn, `.webmovie-rotating` stacks the words in one grid cell.

## Core code — webmovie.js

```js
doc.documentElement.classList.add('webmovie-js');            // first line, in <head>: no flash
const freeze = query.has('webmovie-t') ? parseFloat(query.get('webmovie-t')) * 1000 : null;

const SPLIT = { 'soft-blur': 'chars', rise: 'chars', drop: 'chars', center: 'chars', typewriter: 'chars', scramble: 'chars',
    assemble: 'chars', elastic: 'chars', words: 'words', spring: 'words', depth: 'words', bounce: 'words', whip: 'words',
    mask: 'lines', slide: 'lines', stagger: 'children', draw: 'paths' };
const rnd = (i, k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };  // fixed −1…1

// split text nodes only; restore() puts the very same nodes back
function splitText(el, mode, lang) {
    // for each text node: tokens(text, lang) → whitespace text nodes + <span class="webmovie-word"> with
    // <span class="webmovie-piece"> per grapheme (chars, or CJK words when not keep-all) or per word
    // record { text: originalNode, parts: [created nodes] }; group[] = word number of each piece
    return { pieces, words, group, restore() { for (const { text, parts } of swaps) { parts[0].before(text); parts.forEach((p) => p.remove()); } } };
}

function play(el, extra = 0) {
    let mode = el.dataset.webmovieSplit || SPLIT[name] || 'none';
    if (mode === 'chars' && JOINING.test(el.textContent)) mode = 'words';      // never tear Arabic/Indic letters
    const parts = mode === 'none' ? null : mode === 'children' || mode === 'paths' ? splitNodes(el, mode) : splitText(el, mode === 'lines' ? 'words' : mode, lang);
    // dur/delay/stagger/max: data-* attribute, else the computed CSS variable
    // index per piece: lines → measured line; chars → order(n, from); words → order(words, from) mapped through group
    if (groups > 1 && max && (groups - 1) * step + dur > max) step = (max - dur) / (groups - 1);   // same total in every language
    pieces.forEach((p, i) => { p.style.setProperty('--i', idx[i]); for (let k = 1; k <= 3; k++) p.style.setProperty(`--r${k}`, rnd(i, k)); });
    el.style.setProperty('--webmovie-delay', `${delay - (freeze ?? 0)}ms`);   // frozen: negative delay shows the frame at t
    el.style.setProperty('--webmovie-step', `${step}ms`);
    el.classList.remove('webmovie-wait', 'webmovie-done');
    el.classList.add(parts ? 'webmovie-split' : 'webmovie-whole');
    void el.offsetWidth;                                                    // restart on replay
    el.classList.add('webmovie-in');
    let total = delay + (groups - 1) * step + dur;
    if (name === 'count') total = Math.max(total, count(el, s, delay, cs));  // count adds the class webmovie-punch at the end (+480 ms)
    if (el.hasAttribute('data-webmovie-burst')) burst(el, num(el.dataset.webmovieBurstAt) ?? delay + dur * 0.42);  // sparks — acting.md
    setTimeout(() => finish(el), total + 60);                              // not in freeze mode
}

function finish(el) {           // restore → plain HTML
    s.parts?.restore(); if (s.text !== undefined) el.textContent = s.text;   // counters: the server string
    el.classList.remove('webmovie-in', 'webmovie-split', 'webmovie-whole', 'webmovie-wait', 'webmovie-punch'); el.classList.add('webmovie-done');
    // remove --webmovie-delay, --webmovie-step, --webmovie-dur, --webmovie-ink, min-inline-size; drop an empty style=""
    el.dispatchEvent(new CustomEvent('webmovie:done', { bubbles: true }));
}

// IntersectionObserver (rootMargin bottom −8 %): entries in the same callback are sorted by DOM order and get k × --webmovie-cascade
// count: target = value attr ?? data-webmovie-count ?? digits of the text; Intl.NumberFormat(lang, same decimals); reserve final width
// scramble: each piece shows pool[(i*7 + floor(t/60)*13) % pool.length] until delay + i*step + dur*0.7 (pool = the text's own letters)
// rotator: wraps separator text nodes in .webmovie-sep (hidden), shows one child (.webmovie-on), aria-hidden on the others,
//          pauses on hover/focus/off-screen/hidden tab, stops after `loops` rounds on the first word
// freezeAll (?webmovie-t): fonts.ready → play all waiting → 2 rAF → read computed opacity/translate/scale/rotate/filter/clip-path/
//          background-*/stroke-dashoffset/font-weight/box-shadow, cancel the animation, write them inline (!important) → __webmovieReady
```

Letter presets also get `--d` on each piece (signed distance from the middle letter) — `converge` uses it. Every split piece gets `--r1 --r2 --r3` (fixed pseudo-random −1…1 by index — the same on replay and in frozen frames) — `assemble` uses them. Movie code: [movie.md](movie.md#core-code). Freeze for screenshots bakes the computed frame into inline styles because a paused animation inside the viewport may keep its old compositor frame in a headless screenshot.

Regexes: `JOINING` = Arabic, Syriac, Thaana, N'Ko, Mongolian, Adlam, Hanifi Rohingya, Devanagari, Bengali, Gurmukhi, Gujarati, Oriya, Tamil, Telugu, Kannada, Malayalam, Sinhala, Tibetan, Myanmar, Khmer · `NO_SPACE` = Han, Hiragana, Katakana, Thai, Lao, Khmer, Myanmar · `LOOSE` = Han, Hiragana, Katakana, Hangul.

## Add or change a preset

1. Pick the split. If it is a new split, add the name to `SPLIT` in webmovie.js.
2. Add one rule inside the `no-preference` block in webmovie.css: `[data-webmovie="name"] { --webmovie-y: …; --webmovie-dur: …; }`. Use `webmovie-enter` when the motion is "from a state to the natural state"; write a new `@keyframes webmovie-<name>` only for other properties, and always give the natural state as the end (omit `to`, or write it explicitly when the property does not interpolate to `none` — `clip-path`, `font-variation-settings`).
3. If it must stay visible while waiting (a sweep over visible text), set `--webmovie-wait-o: 1`, and give its "before" look in `.webmovie-wait[data-webmovie="name"]`.
4. Add a card to `assets/demo.html`, run `node scripts/check.mjs assets/demo.html`, look at the frames, and add the row to the table above.

Change the kit in the skill first (`skills/webmovie/assets/`), then copy it to projects — never let copies drift.

## Known limits

- During the motion a link's underline disappears inside split words (`text-decoration` does not reach `inline-block` children); it comes back when the text is restored.
- `draw` is for solid strokes; a dashed line (`stroke-dasharray` of its own) should `fade` instead. Round line caps show a dot before drawing.
- `shine` needs a solid text color (it paints a gradient of that color with `background-clip: text`).
- `weight` needs a variable font; with static fonts it steps between available weights.
- `mask` on very tight line-height (< 1) may clip tall accents — raise the top inset in `[data-webmovie="mask"] .webmovie-word`.
- Very long text with `chars` creates many spans: use words or lines for anything longer than a heading.
