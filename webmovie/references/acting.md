# Acting — strong motion that reads like animation, not like a fade

A webmovie is **bold by default**. A fade-up of 8px is invisible on a phone and dull on a desk; the user rejected that ("애니메이션이 너무 소극적", 2026-10-25). Strong motion is not "more things moving" — it is *one* thing per moment, **acted** with the principles of character animation, then stillness. Loud is allowed because it is short and it ends as the plain HTML.

## Contents

- [Power](#power) — calm · bold · wild and what they change
- [The eight principles](#the-eight-principles) — with the keyframe that does each
- [Amplitude numbers](#amplitude-numbers) — how far, how big, how long
- [A beat timeline](#a-beat-timeline) — anticipation → hit → impact → settle → still
- [Recipes](#recipes) — headline, number, card list, picture movie, badge
- [Impact: sparks, shake, punch](#impact-sparks-shake-punch) — core code
- [Spotlight — take turns](#spotlight--take-turns) — key texts and buttons emphasized one at a time
- [Autoplay or on demand](#autoplay-or-on-demand)
- [Safety limits](#safety-limits) — what stays forbidden however loud
- [Review](#review) — the "is it too shy?" check

## Power

`--webmovie-k` multiplies every entrance distance, size change and blur of `webmovie-enter` (rotation is not multiplied — it may hold a 3D axis):

```css
:root { --webmovie-k: 1.6; --webmovie-ease: var(--webmovie-ease-punch); }      /* bold = default */
[data-webmovie-power="calm"] { --webmovie-k: 1;   --webmovie-ease: var(--webmovie-ease-calm); }
[data-webmovie-power="bold"] { --webmovie-k: 1.6; --webmovie-ease: var(--webmovie-ease-punch); }
[data-webmovie-power="wild"] { --webmovie-k: 2.4; --webmovie-ease: var(--webmovie-ease-spring); --webmovie-cascade: 70ms; }

@keyframes webmovie-enter { from {
  opacity: var(--webmovie-o);
  translate: calc(var(--webmovie-x) * var(--webmovie-dir) * var(--webmovie-k, 1)) calc(var(--webmovie-y) * var(--webmovie-k, 1));
  scale: max(0, calc(1 + (var(--webmovie-s) - 1) * var(--webmovie-k, 1)));
  rotate: var(--webmovie-r);
  filter: blur(calc(var(--webmovie-blur) * var(--webmovie-k, 1)));
} }
```

- `--webmovie-ease-punch: cubic-bezier(0.18, 1.32, 0.32, 1)` — fast start, ~8 % overshoot, settle. Every preset that does not set its own curve uses it.
- Put `data-webmovie-power` on a page, a section or one element. Use `calm` for long reading (documentation, legal), `wild` for a promo, a title card, a game.
- Keyframe presets (smash, stamp, whip …) read `--webmovie-k` inside their own keyframes, so power scales them too.

## The eight principles

| Principle | What it looks like | Kit shot / keyframe |
| --- | --- | --- |
| **Anticipation** | a small move the other way before the action (a crouch, a wind-up) | `wave` (sinks then swings), `jump` (crouch `scale: 1.15 0.82`) |
| **Squash & stretch** | stretched while fast, squashed on landing, volume kept (`scale: 1.18 0.8`) | `drop-in`, `elastic`, `walk` (each step), `hop` |
| **Overshoot & settle** | passes the target (110–125 %) and comes back | `--webmovie-ease-punch`, `blast` 1.22, `unfold` 1.24, `pop` (spring) |
| **Follow-through** | parts keep moving after the body stops; the thing wobbles and damps | `swing` (32° → −18° → 10° → −4°), `smash` (shake after the hit) |
| **Arcs** | paths curve; nothing travels on a ruler line | `fly` (mid-point lifted), `jump` |
| **Motion blur / smear** | blur and stretch along the motion while fast, sharp at rest | `whip` (`scale: 1.3 0.85` + blur), `assemble`, `slam` |
| **Secondary motion** | something small reacts to the main hit: a ring, sparks, a punch, an underline | `ping` ring, `data-webmovie-burst`, `webmovie-punch`, `highlight` after a headline |
| **Camera** | the frame itself moves: push in/pull back (dolly), a jolt on impact (shake) | `dolly` on `.webmovie-camera`, `shake` on `.webmovie-rig` |

Keyframes carry the timing for acted shots (`--webmovie-easing: linear`), so every phase sits at its own percentage:

```css
@keyframes webmovie-drop-in {      /* falls, squashes on the ground, bounces twice */
  0%   { opacity: 0; translate: 0 calc(-80% * var(--webmovie-k, 1)); scale: 0.9 1.15; }
  10%  { opacity: 1; }
  48%  { translate: 0 0;    scale: 1.18 0.8; }   /* hit: squash */
  62%  { translate: 0 -14%; scale: 0.94 1.06; }  /* rebound: stretch */
  76%  { translate: 0 0;    scale: 1.07 0.93; }
  87%  { translate: 0 -4%;  scale: 1; }
  100% { opacity: 1; translate: 0 0; scale: 1; }
}
```

## Amplitude numbers

| Thing | Bold (default) | Too shy (fix it) |
| --- | --- | --- |
| entrance travel | 30–60 % of the element's own size, ≥ 24px (cards 36px × k) | < 12px |
| scale start | 0.5–0.8 (pop in) or 1.15–2 (slam down) | 0.96–1.04 |
| overshoot | 110–125 % then back | none |
| squash on landing | `scale: 1.15–1.3 0.75–0.85` | none |
| blur while fast | 4–16px × k, 0 at rest | always 0, or blur that stays |
| rotation for a hit | 5–16° (stamp, smash), 3D 90–100° (flip) | 0 |
| camera | dolly 1 + 0.3k → 1; shake ≤ 1 % of the frame, ≤ 650 ms | none, or a shake that lasts |
| piece duration | 600–1100 ms | 300–400 ms (too fast to see) or > 1.5 s per piece |
| a block | ≤ ~1.5 s, then still | everything at once, or loops |
| a picture movie | ≤ ~5 s, then still | < 2 s (nothing acts) |

## A beat timeline

Write every important moment as beats before choosing presets:

| Beat | ms (example: headline) | Shot |
| --- | --- | --- |
| anticipation | 0–120 | (inside the keyframe: the first 10–15 %) |
| hit | 120–450 | `smash` / `whip` / `assemble` — the main driver |
| impact | 400–700 | `data-webmovie-burst`, `shake` on the rig, `webmovie-punch` |
| settle | 450–1000 | the overshoot and squash dying out (same keyframe) |
| follow-up | 700–1300 | one secondary shot: `highlight` the key word, the subtitle `words` |
| still | ≥ 1500 | nothing moves |

## Recipes

```html
<!-- headline that lands like a title card, sparks at the hit -->
<h1 data-webmovie="smash" data-webmovie-burst="16" data-webmovie-burst-at="420">Ship every day.</h1>
<p data-webmovie="words" data-webmovie-delay="600">Every word is HTML.</p>

<!-- a number: counts, then punches; the badge stamps after it -->
<p><data value="12500" data-webmovie="count">12,500</data> learners
   <strong class="badge" data-webmovie="stamp" data-webmovie-delay="1700" data-webmovie-burst="10">NEW</strong></p>

<!-- cards fall in one after another -->
<ul data-webmovie="stagger" data-webmovie-power="wild"> … </ul>

<!-- a word that whips in, letters that assemble -->
<h2 data-webmovie="whip">Four ways to start</h2>
<h2 data-webmovie="assemble">AI</h2>
```

```css
.badge { --webmovie-burst: #f59e0b, #fff, #7c3aed; }   /* spark colors (comma list) */
```

Picture movie (one clock): camera `dolly` on the hero (`--webmovie-focus: 40% 70%`) → hero `walk`/`jump` → props `unfold` with sparks → inner `.webmovie-rig` `shake` at the props' landing → markers `ping` with sparks → labels `blast`/`drop-in` → a character `wave` → still. Markup in [picture.md](picture.md).

## Impact: sparks, shake, punch

- **Sparks** — `data-webmovie-burst="N"` (≤ 40, default 12). When the shot plays, `webmovie.js` waits `data-webmovie-burst-at` ms (default: delay + 42 % of the duration — the hit of most keyframes), then appends `<span class="webmovie-sparks" aria-hidden="true">` with N `<i>` to the element's `offsetParent`, centered on the element, thrown in a ring (fixed pseudo-random angles and distances `rnd(i, k)`), and removes it after 1.1 s. Never in reduced motion or a frozen frame (`?webmovie-t=`). Colors: `--webmovie-burst` (comma list) or the text color.

```js
function burst(el, at) {
  if (freeze !== null || reduce.matches) return;
  const n = Math.min(40, num(el.dataset.webmovieBurst) || 12);
  setTimeout(() => {
    const r = el.getBoundingClientRect(), host = el.offsetParent || doc.body, h = host.getBoundingClientRect();
    const box = doc.createElement('span'); box.className = 'webmovie-sparks'; box.setAttribute('aria-hidden', 'true');
    box.style.left = `${r.left - h.left - host.clientLeft + host.scrollLeft + r.width / 2}px`;   // + top the same way
    for (let i = 0; i < n; i++) { /* <i> with --tx --ty (cos/sin × reach) --ang --sz --life --c */ }
    host.append(box); setTimeout(() => box.remove(), 1100);
  }, Math.max(0, at));
}
```

```css
.webmovie-sparks { position: absolute; inline-size: 0; block-size: 0; pointer-events: none; z-index: 50; }
.webmovie-sparks > i { position: absolute; left: 0; top: 0; inline-size: var(--sz); block-size: var(--sz); border-radius: 50%;
  background: var(--c, currentColor); animation: webmovie-spark var(--life, 800ms) cubic-bezier(0.12, 0.8, 0.3, 1) both; }
.webmovie-sparks > i:nth-child(3n) { border-radius: 2px; rotate: 45deg; }                         /* diamonds */
.webmovie-sparks > i:nth-child(4n) { block-size: calc(var(--sz) * 2.2); border-radius: 99px; rotate: var(--ang); } /* streaks */
@keyframes webmovie-spark { 0% { opacity: 1; translate: 0 0; scale: 1.3; } 70% { opacity: 1; } 100% { opacity: 0; translate: var(--tx) var(--ty); scale: 0.2; } }
```

  The element needs a positioned ancestor (`offsetParent`) that does not clip what should fly out; inside a picture the camera is the host and the frame clips at its edge (intended).
- **Shake** — `data-webmovie="shake"` on a wrapper that holds still otherwise (`.webmovie-rig` inside a picture's camera, or a section). It stays visible while waiting (`--webmovie-wait-o: 1`), so give it the delay of the impact. ≤ 650 ms, ≤ 1 % × k of its size.
- **Punch** — every `count` gets the class `webmovie-punch` when the last digit lands (`scale 1 → 1.28 → 0.94 → 1.05 → 1`, a glow); the total time grows by 480 ms; `finish()` removes the class.
- **Scattered letters** — every split piece gets `--r1 --r2 --r3` (fixed numbers −1…1 per index), used by `assemble`; use them in your own keyframes for anything "from random places". They are the same on every replay and in frozen frames.

## Spotlight — take turns

A block with a lot of text loses the eye after its entrance: everything is still and equal. A **spotlight** points at the key texts once more — **one at a time, in reading order**, a short cue each, then the next, for two rounds, then nothing moves. The same works for several links or buttons that are each a choice (four path links, three plans, a step list): each one gets its moment instead of all pulsing together.

```html
<!-- key phrases of a long block: letters ripple in turn -->
<ul data-webmovie="stagger" data-webmovie-spotlight="ripple">
  <li><strong data-webmovie-cue>Learn a word a day.</strong> Long explanation …</li>
  <li><strong data-webmovie-cue>Ask when stuck.</strong> Long explanation …</li>
</ul>

<!-- four link chips, each with partners elsewhere on the page that move with it -->
<div data-webmovie-picture data-webmovie-spotlight="ripple glow" data-webmovie-loops="2">
  <a href="/kids" data-webmovie="blast" data-webmovie-cue data-webmovie-cue-with="dot-kids card-kids-go">Kids guide</a> …
</div>
```

```css
.chip { --webmovie-cue-color: var(--track); }          /* ripple letters and the glow ring take this color */
.card-go { --webmovie-cue-partner: webmovie-cue-jelly; } /* what the partners do (default webmovie-cue-pop; a .webmovie-ping partner also rings) */
```

| Cue | Look | Use |
| --- | --- | --- |
| `pop` | 1 → 1.24 (−3°) → 0.93 → 1.07 → 1 | buttons, chips, cards (default) |
| `tada` | squeeze, then 1.16 with ±4° wobbles | a call to action, a prize |
| `jelly` | squash and stretch `1.25 0.78` ↔ `0.8 1.2` | soft, playful buttons |
| `hop` | crouch, hop −38 %, squash landing | icons, badges, pictures |
| `glow` | 1.1 with a spreading ring + halo in `--webmovie-cue-color` | links, chips (the box-shadow is the cue's while it runs) |
| `ripple` | the text splits into letters (words for joined scripts) that hop one after another, tinted, then the same text nodes come back | key phrases inside long text — works on inline text |

- **Order and timing**: members = `[data-webmovie-cue]` in the block (else its children), DOM order. It starts `data-webmovie-delay` (700 ms) after no member is still entering (no `.webmovie-wait`/`.webmovie-in` on it or above it — so it waits for the stagger or the picture act), then one cue every `data-webmovie-hold` (1700 ms) for `data-webmovie-loops` rounds (2). A cue is ≤ 1.2 s and every cue class is removed 1.3 s after it starts — between cues the DOM is the plain HTML.
- **Pauses** while the pointer is over the block or focus is inside it (the reader is reading or about to click), while it is off-screen (< 30 % in view) and in a hidden tab. Never in reduced motion or a frozen frame (`?webmovie-t=`). `webmovie.replay(block)` (or the picture's replay button) starts it again; `webmovie.stopSpotlights()` ends all at once (the check calls it).
- **Hidden members** (`display: none`, e.g. labels hidden on a phone) skip their own cue but still cue their partners — the turn still points at the choice.
- **One spotlight per screen.** Two blocks taking turns at once split the eye. Cue only what the reader should pick or remember (3–6 members); never body text word by word.
- Whole cues (`pop` … `glow`) scale the element: it needs a box (block, inline-block, a button, an absolutely placed layer). `ripple` needs none.

```js
// webmovie.js — spotlight(root): one tick = one member
const tick = () => {
  if (paused || !visible || doc.hidden || members().some(entering)) return (timer = setTimeout(tick, 400)); // wait, never skip
  off();                                     // the previous cue back to plain HTML
  const acted = cue(list[i++ % list.length]);   // whole cue class + partners + ripple split
  setTimeout(off, 1300);
  if (i % list.length === 0 && ++turns >= loops) return;   // stops by itself
  timer = setTimeout(tick, acted ? hold : 0);
};
```

## Autoplay or on demand

| Choice | Markup | When |
| --- | --- | --- |
| plays by itself when ≥ 25–35 % in view (default) | — | a hero or an intro that greets the reader; one moving thing per screen |
| still until the reader asks | `data-webmovie-autoplay="off"` on `[data-webmovie-player]` (first scene shown still, ▶ starts) or on `[data-webmovie-picture]` (the original picture, the replay button plays it) | a movie next to text to read, several movies on one page, a long movie (> 5 s), a page for focused work |
| take turns | `data-webmovie-spotlight` | after an autoplay act: the elements one by one instead of all at once |

A player always has play/pause and pauses off-screen and in a hidden tab; a picture ≤ 5 s needs no pause control, a longer act goes into a player.

## Safety limits

Loud never overrides these (they are why loud is acceptable):

- The final frame is the plain HTML; hiding only under `.webmovie-js` + `prefers-reduced-motion: no-preference`.
- Reduced motion: nothing moves, no sparks, no shake.
- ≤ 3 flashes per second (WCAG 2.3.1): `glitch` only on short text, once; no full-screen flashing or color strobing.
- Stops by itself: ≤ 3 loops (pings default 1–2, spotlight 2 rounds with ≥ 0.4 s of stillness between cues and a pause on hover/focus) or a pause control (WCAG 2.2.2).
- Shake ≤ 650 ms and ≤ 1 % of the frame; no shaking of reading text after it landed.
- Cheap properties only (opacity, translate, scale, rotate, filter, clip-path).

## Review

Look at the frames (`check.mjs --times`), then at the live page at normal speed:

1. Can you see each important shot from arm's length on a phone? If you have to look for it → raise the power or switch to a bolder preset.
2. Does each hit have anticipation, an overshoot or a squash, and an impact? A plain fade on the main moment is a ✗.
3. Is there *one* hero per moment, and does everything stop within the limits above?
4. Reduced motion and no-JS show the plain page; the text after the motion equals the HTML (check.mjs errors 0).
