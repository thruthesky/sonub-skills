# Picture movie — a still illustration that plays like a clip

A big hero illustration is a frozen frame of a story: a learner walks to a signpost, the signs point four ways, a robot waves from an office. A **picture movie** plays that story. The illustration is rebuilt from a **background plate** (the scene with the actors removed) and **cut-out layers** (the actors: people, robots, signs, clouds, birds), and the layers act on one clock — the camera settles, the learner walks in, the signs unfold, the destinations light up, the robot waves — then everything stands still as the original illustration.

It is still HTML: the plate is an `<img>` with the alt text, every label on the picture is real text (and a link), and without JS or with reduced motion the layers simply sit at their places — the composed picture. No video file, no canvas, no GIF.

## Contents

- [When to use it](#when-to-use-it)
- [Workflow](#workflow)
- [Make the layers (image model)](#make-the-layers-image-model)
- [Markup](#markup)
- [Timeline](#timeline)
- [Crop, sizes and narrow screens](#crop-sizes-and-narrow-screens)
- [Accessibility, SEO, performance](#accessibility-seo-performance)
- [Core code](#core-code)
- [Check](#check)

## When to use it

| The page has | Do |
| --- | --- |
| a hero / header illustration that *shows* a story (someone goes somewhere, something happens) | picture movie — this file |
| an illustration that only decorates | one shot on the `<img>` (`wipe`, `settle`, `zoom-out`) — no layers |
| a message in several steps (claim → number → call to action) | the player ([movie.md](movie.md)); a scene may contain a picture movie |
| a photo | one shot; photos do not cut out cleanly — do not fake character motion on them |

## Workflow

1. **Storyboard the picture** in one table: who/what acts, in which order, for how long. The order follows the story of the picture *and* the reading order of the page (the actor first, then what they look at). The whole act ≤ ~5 s (WCAG 2.2.2: motion that starts by itself and lasts longer than 5 s needs a pause control — keep it shorter, or put it in a player).

   | t (ms) | Layer | Shot | Why |
   | --- | --- | --- | --- |
   | 0 | camera (all layers) | `dolly` (`--webmovie-focus` on the learner) | the film opens close on the hero and pulls back to the whole scene |
   | 0 · 300 | clouds | `drift` | the sky is alive |
   | 200 | learner | `walk` | the protagonist arrives at the start |
   | 1500 · +150 | 4 sign boards | `unfold` + `data-webmovie-burst` | the choice springs out, each with sparks in its color |
   | 1880 | rig (all layers inside the camera) | `shake` | the first board's hit jolts the frame |
   | 2300 · +200 | 4 destinations | `ping` + burst, label `blast` | each option bursts alight, named in text |
   | 3100 | robot | `wave` | the friendly end (anticipation, hops) |
   | 600 | birds | `fly` | depth, wing flaps on an arc, ends before 5 s |

   Act it **bold** ([acting.md](acting.md)): each actor anticipates, overshoots, squashes on landing; every hit has an impact (sparks, a shake); the camera moves. A picture where only things fade in is too shy.

2. **Plan the layers**: list each moving thing; everything else stays in the plate. Actors that overlap a static object (a sign on a pole) are cut *off* the object — the pole stays in the plate.
3. **Make the plate and the sprites** with the project's image model (next section). Never draw them with SVG/canvas/CSS shapes — they must be the same illustration.
4. **Measure the places**: in the original image, write each actor's box in % of the image (`left`, `top`, `width`). The plate keeps the composition, so the boxes fit it.
5. **Build** the markup below, put the times on the layers (`data-webmovie-delay`), the places and the tuning in CSS.
6. **Check** the frozen frames and the final frame against the original (last section).

## Make the layers (image model)

Two jobs, both with the original illustration attached as the reference (in SONUB: Codex CLI `image_gen`, prompts kept next to the files):

**Plate — edit the original** (same size, same composition):

```text
Edit the attached illustration (1536x1024) into a BACKGROUND PLATE for an HTML movie. Use image_gen in edit mode.
REMOVE completely and paint what is behind them, in exactly the same style: 1. the boy on the path (paint the path and grass),
2. the four arrow boards on the signpost — KEEP the bare pole and the rock at its foot, 3. the robot in the office, 4. all clouds.
KEEP EVERYTHING ELSE IDENTICAL: same composition, camera, positions and sizes of every object, colors, outlines. No text.
Output exactly 1536x1024 WebP. Open the result and check that each removed thing is gone and nothing else moved; edit again if not.
```

**Sprites — one transparent atlas, then split numerically** (one generation keeps one style):

```text
Generate ONE transparent PNG sprite atlas, 1536x1536, 3x3 equal 512x512 cells, each object centered in its cell, fully visible,
≥ 40 px transparent margin, nothing crossing cell borders. True alpha: no checkerboard, no white box, no ground, no shadow, no glow, no text.
Each object looks exactly like the same object in the attached illustration (style, colors, angle, proportions).
Cells: 1 boy seen from behind, full body · 2 robot waving one arm · 3 three flying birds · 4–7 the four arrow boards, each pointing
its own way · 8–9 two clouds. Save the atlas unchanged, then split it into the cells, trim, keep a 6 px margin, transparent WebP each.
```

- Ask for the **pose the motion needs** (an arm already raised for `wave`, a mid-step for `walk`). A layer is one picture; the motion is transform only.
- Keep the atlas source outside the public folder; ship the split WebP files (each usually 10–60 KB).
- Open every file: transparent, not clipped, the right direction (arrows), the same look as the original. Regenerate the atlas when one cell fails.

## Markup

```html
<figure class="hero-frame">
  <div class="webmovie-picture hero-picture" data-webmovie-picture>
    <div class="webmovie-camera" data-webmovie="dolly">
     <div class="webmovie-rig" data-webmovie="shake" data-webmovie-delay="1880">
      <img class="webmovie-plate" src="plate.webp" alt="A learner at a signpost where four paths lead to a playground, an observatory, a workshop and an office" width="1536" height="1024" fetchpriority="high">
      <img class="webmovie-layer hero-cloud-a" src="cloud-a.webp" alt="" data-webmovie="drift">
      <img class="webmovie-layer hero-boy" src="boy.webp" alt="" data-webmovie="walk" data-webmovie-delay="200">
      <img class="webmovie-layer hero-sign-1" src="sign-purple.webp" alt="" data-webmovie="unfold" data-webmovie-delay="1500" data-webmovie-burst="10">
      <span class="webmovie-layer webmovie-ping hero-ping-kids" aria-hidden="true" data-webmovie="ping" data-webmovie-delay="2300" data-webmovie-burst="12"></span>
      <a class="webmovie-layer hero-label-kids" href="/guide/kids" data-webmovie="blast" data-webmovie-delay="2450">Kids guide</a>
      <img class="webmovie-layer hero-robot" src="robot.webp" alt="" data-webmovie="wave" data-webmovie-delay="3100">
     </div>
    </div>
    <button type="button" class="hero-replay" data-webmovie-replay>↻ Replay</button>
  </div>
</figure>
```

```css
.hero-boy     { --x: 40.2%; --y: 60%;   --w: 9%; }
.hero-sign-1  { --x: 40%;   --y: 43%;   --w: 9.8%; transform-origin: 100% 50%; }  /* unfolds out of the pole on its right */
.hero-robot   { --x: 88.9%; --y: 45.9%; --w: 3.9%; }
.hero-sign-1  { --webmovie-burst: #7c3aed, #fff; }                               /* spark colors = the board's color */
.hero-ping-kids { --x: 12%; --y: 29%; --webmovie-ping: #e8590c; --webmovie-burst: #e8590c, #fff; }
.hero-picture .webmovie-camera { --webmovie-focus: 45% 70%; }                       /* dolly opens close on the learner */
```

| Class / attribute | On | Meaning |
| --- | --- | --- |
| `.webmovie-picture` + `data-webmovie-picture` | the canvas | `position: relative; overflow: hidden; aspect-ratio: var(--webmovie-ratio, 3 / 2); container-type: size` — the layers play together when it is ≥ 25 % in view |
| `.webmovie-camera` | one wrapper of all layers | a camera shot (`dolly`, `settle`, `zoom-out`) moves the whole scene, so the actors stay on their ground |
| `.webmovie-rig` | an optional wrapper inside the camera | a second camera move at a moment of the act — `shake` at an impact (it zooms 1 + 0.024k while shaking so the edges never show) |
| `.webmovie-plate` | the background `<img>` | fills the canvas; carries the alt text |
| `.webmovie-layer` | each actor, marker, label | `position: absolute; left: var(--x); top: var(--y); inline-size: var(--w)` — % of the picture, physical (a picture is not mirrored in RTL; the kit keeps moves unmirrored inside it) |
| `.webmovie-ping` | an empty `<span>` layer | a dot marker (final state: visible); its ring spreads after it pops in. `--webmovie-ping` color, `--webmovie-ping-size`, `--webmovie-ping-loops` |
| `data-webmovie-replay` | a `<button>` in the picture | plays the picture again; shown only with JS and motion allowed (label from the language file) |

Picture shots: `walk` (from `--webmovie-x`/`--webmovie-y`, default 22cqh below, 8 steps with lean and squash, `--webmovie-bob` step height), `jump` (crouch, arc, squash landing), `wave`, `hop` (both stay visible and act in place), `unfold` (scale out of `transform-origin`), `drift`, `fly` (from `--webmovie-x`/`-y` on an arc), `ping`, plus every other preset (`blast` · `drop-in` · `swing` for labels and props, `dolly` · `shake` · `settle` for the camera). `data-webmovie-burst` works on any layer (sparks are added to the camera, clipped by the picture's edge). `cqw`/`cqh` are % of the picture, so a walk or a flight covers the same share of the scene at every width.

## Timeline

- Autoplay: the act plays once when the picture is ≥ 25 % in view. `data-webmovie-autoplay="off"` on the picture keeps the original picture until the replay button (then the button reads as "play").
- After the act, a **spotlight** can point at the options one by one: `data-webmovie-spotlight="ripple glow"` on the picture, `data-webmovie-cue` on each label, `data-webmovie-cue-with` = the label's dot and its card's button ([acting.md](acting.md#spotlight--take-turns)). It waits for the act to end by itself; the replay button restarts both.

- Layers of one picture **do not cascade**: they start together when the picture enters the view, each after its own `data-webmovie-delay` — the storyboard times, not the DOM order.
- One driver per moment still holds: the actor first, then what reacts to it. Overlap the next shot by 100–300 ms so it flows.
- Ambient layers (clouds, birds) move slowly and end with the act. Nothing loops; after ~5 s the picture is still. Replay is the reader's choice (`data-webmovie-replay`).
- Labels on the picture are real text from the language file, appear after their marker, and link to their page (an infographic item links to the page that explains it).

## Crop, sizes and narrow screens

- The canvas keeps the illustration's own ratio (`--webmovie-ratio`), so the % places always fit. To show a crop (a 16:9 band of a 3:2 picture), put the canvas in a frame with `overflow: hidden` and the frame's ratio, and shift the canvas: `top: calc(-1 * focus × (canvas height − frame height))` in % of the frame — e.g. 3:2 in 16:9 with the focus at 55 %: `top: -10.2%`. Keep every actor inside the visible band.
- Text labels are sized in `rem`, not in % — below ~34rem of picture width hide labels that would cover the scene (the same names are on the page next to it) and keep the markers.
- Give the plate `width`/`height` and `fetchpriority="high"` when it is the first screen; the sprites are small and can load normally (they are absolute — no layout shift).

## Accessibility, SEO, performance

- The plate's `alt` describes the whole scene (as the original image's alt did); actors are `alt=""` (they are part of that scene); markers are `aria-hidden`.
- Reduced motion and no JS: no motion, all layers visible at their places = the original picture. The replay button is hidden then.
- Transform-only motion (`translate`, `scale`, `rotate`, `opacity`) — the composited layers cost no layout. Keep it to ≤ ~12 layers; total sprites ≲ 300 KB.
- The labels and the plate alt are what search engines read; the cut-outs add nothing to index, so they stay decorative.

## Core code

```js
// webmovie.js — prepare(el): a layer of a picture waits for its picture
const pic = el.closest('[data-webmovie-picture]');
if (pic) { el.classList.add('webmovie-wait'); if (freeze !== null) { if (frozen) bake([el]); return; } picture(pic, el); return; }

// one clock per picture: all layers start together (own delays, no cascade) when ≥ 25 % is in view
function picture(pic, el) {
    const state = pictures.get(pic);
    if (state === 'played') return play(el);           // a layer added later plays at once
    if (state) return;
    pictures.set(pic, 'waiting');
    const go = () => { pictures.set(pic, 'played'); layers(pic).forEach((l) => play(l)); };
    new IntersectionObserver((entries, o) => { if (entries.some((e) => e.isIntersecting)) { o.disconnect(); go(); } }, { threshold: 0.25 }).observe(pic);
}
// replay(picture) → finish + play every layer; <button data-webmovie-replay> calls it for its picture
```

```css
.webmovie-picture { position: relative; overflow: hidden; aspect-ratio: var(--webmovie-ratio, 3 / 2); container-type: size; isolation: isolate; }
.webmovie-picture :is(.webmovie-camera, .webmovie-rig) { position: absolute; inset: 0; }
.webmovie-picture .webmovie-layer { position: absolute; left: var(--x, 0%); top: var(--y, 0%); inline-size: var(--w, auto); }
.webmovie-picture .webmovie-rtl { --webmovie-dir: 1; }
@media screen and (prefers-reduced-motion: no-preference) {
  [data-webmovie="walk"] { --webmovie-name: webmovie-walk; --webmovie-y: 22cqh; --webmovie-bob: -5%; --webmovie-dur: 1800ms; --webmovie-easing: linear; transform-origin: 50% 100%; }
  [data-webmovie="wave"] { --webmovie-name: webmovie-wave; --webmovie-o: 1; --webmovie-wait-o: 1; --webmovie-dur: 1600ms; --webmovie-easing: linear; transform-origin: 50% 100%; }
  [data-webmovie="unfold"] { --webmovie-name: webmovie-unfold; --webmovie-dur: 950ms; --webmovie-easing: linear; }
  [data-webmovie="dolly"] { --webmovie-name: webmovie-dolly; --webmovie-o: 1; --webmovie-dur: 2600ms; transform-origin: var(--webmovie-focus, 50% 50%); }
}
/* the travel shrinks step by step (0.8 · 0.62 · 0.46 · 0.32 · 0.2 · 0.1 · 0.03 · 0); each step lifts and lands */
@keyframes webmovie-walk {
  0% { opacity: 0; translate: calc(var(--webmovie-x) * var(--webmovie-dir)) var(--webmovie-y); }
  6% { opacity: 1; }
  12.5% { translate: calc(var(--webmovie-x) * var(--webmovie-dir) * 0.8) calc(var(--webmovie-y) * 0.8 + var(--webmovie-bob)); rotate: 4deg; scale: 0.97 1.04; }  /* lift: stretch, lean */
  25% { translate: calc(var(--webmovie-x) * var(--webmovie-dir) * 0.62) calc(var(--webmovie-y) * 0.62); rotate: 0deg; scale: 1.05 0.92; }                 /* land: squash */
  /* … 37.5 % … 87.5 % the same pattern, lean alternating ±4° … */
  94% { translate: 0 0; scale: 1.03 0.96; }
  100% { opacity: 1; translate: 0 0; rotate: 0deg; scale: 1; }
}
@keyframes webmovie-unfold { 0% { opacity: 0; scale: 0; rotate: -16deg; } 40% { opacity: 1; scale: 1.24; rotate: 7deg; } 56% { scale: 0.9; rotate: -5deg; } 70% { scale: 1.07; rotate: 3deg; } 84% { scale: 0.98; rotate: -1.5deg; } 100% { opacity: 1; scale: 1; rotate: 0deg; } }
@keyframes webmovie-dolly { 0% { scale: calc(1 + 0.3 * var(--webmovie-k, 1)); filter: blur(3px); } 25% { filter: blur(0); } 80% { scale: 0.985; } 100% { scale: 1; filter: blur(0); } }
/* wave, hop, jump, fly, shake: full keyframes in webmovie.css; principles in acting.md */
```

## Check

```bash
node scripts/check.mjs page.html --times 0.3,1.2,2.6,6      # the act: start, walk, signs, the still end
```

- The last frame must look like the **original illustration** — put them side by side: every actor on its ground (feet on the path, boards on the pole, the robot in the room).
- The middle frames: nothing pops out of nowhere at a wrong place, no layer leaves the canvas edge in a bad spot, labels do not cover an actor.
- Narrow width (390) and an RTL language: places unchanged (the picture is not mirrored), labels hidden or readable.
- `stuck-hidden` 0 — every layer is visible at the end.
