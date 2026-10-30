# Motion — excessive on purpose, acted, then still

The brief for this skill is **too much motion**: every state change of a wizard is an event the eye cannot miss. "Too much" is not "everything wiggling all the time" — it is *every moment acted at full power* (the language of the webmovie skill: anticipation, big travel, overshoot, squash, impact, secondary motion, camera), layered across beats, and then **stillness**. Loud is allowed because each effect is short and ends as the plain HTML.

## Contents

- [Power](#power)
- [The eight principles in a wizard](#the-eight-principles-in-a-wizard)
- [Beat timelines](#beat-timelines) — entrance · step change · check-off · completion
- [Amplitude numbers](#amplitude-numbers)
- [Step transitions](#step-transitions)
- [Impact: sparks, shockwave, confetti, punch](#impact-sparks-shockwave-confetti-punch)
- [Beacon — attention on the next action](#beacon--attention-on-the-next-action)
- [Ambience: aurora, border light, tilt](#ambience-aurora-border-light-tilt)
- [Hover and press](#hover-and-press)
- [More: webmovie shots inside steps](#more-webmovie-shots-inside-steps)
- [Safety limits](#safety-limits)
- [Review — is it loud enough?](#review--is-it-loud-enough)

## Power

`--wizard-k` multiplies travel, blur and scale of entrances, transitions, stamps and shockwaves. Set it with `data-wizard-power` on the page, a section or one wizard.

| Power | `--wizard-k` | Use |
| --- | --- | --- |
| `calm` | 1 | legal text, dense admin forms — still acted, just shorter travel |
| `bold` | 1.6 | product pages next to lots of reading |
| `wild` (default) | 2.4 | onboarding, sign-up, quests, games — the brief |

Keyframes read the multiplier directly: `translate: calc(14% * var(--wizard-k) * var(--wizard-dir)) 0`.

## The eight principles in a wizard

| Principle | Where the kit uses it |
| --- | --- |
| **Anticipation** | the marker crouches to 0.7 before it stamps; the lock rattles before it opens; the beacon's tada squeezes first |
| **Squash & stretch** | items land `scale: 1.02 0.98`; slide-in arrives `1.08 0.94`; warp is stretched `1.6 0.74`; choice cards jelly `1.25 0.78 ↔ 0.8 1.2` |
| **Overshoot & settle** | the progress value itself overshoots (punch easing on `--wizard-p`); dots scale 1.28 → 0.92 → 1; headlines 0.9 → 1.06 → 0.98 → 1 |
| **Follow-through** | swing transition damps 22° → −10° → 4°; drop bounces twice; trophy hops after landing |
| **Arcs** | confetti flies up and out, then falls on a curve; items enter with a tilt that rights itself |
| **Motion blur** | blur(3–14px) while fast in slide, warp, zoom, card entrance and headlines; 0 at rest |
| **Secondary motion** | strike-through draws after the stamp; the connector fills after the strike; the number punches after the bar arrives; the next task jumps after the line reaches it |
| **Camera** | the stage height glides; 3D cube/flip/swing rotate the whole step; the card tilts toward the pointer |

## Beat timelines

**Entrance** (when ≥ a little of the wizard is in view):

| ms | Beat |
| --- | --- |
| 0–950 | card rises 28px × k, from blur 8px and `rotate: x 12deg`, overshoots −6px (`wizard-card-in`) |
| 120–700 | eyebrow rises; art drops in with squash (plain) |
| 160–1210 | title smashes: scale 1 + 0.42k, blurred, −4° → 0.9 → 1.06 → 1; **16 sparks at 560 ms** |
| 360–1160 | subtitle and progress row rise |
| 420–1520 | progress fills from 0 with overshoot, stripes run, comet flares, the number counts and punches |
| 480 + i × stagger | rail dots pop / group titles rise / items fly in from alternating sides (stagger ≤ 110ms, all within ~1 s) |
| 800 + i × stagger | connectors of done items fill down |
| 0–4400 | aurora flare (once) and the border light runs 3 turns, fading out |
| ~2600 | beacon starts on the current call to action; tasks "new since last visit" check themselves one by one (1150 ms apart) |

**Step change** (Next / Back / rail dot):

| ms | Beat |
| --- | --- |
| 0–420 | leaving step exits with the transition's out-keyframes (ease-in) |
| 90+ | entering step plays its in-keyframes (acted, linear timing with phases) |
| +140 | heading smashes; +80 icon blasts; +200 + i × 75 every child cascades up; choices fly in from alternating sides |
| +360 | 12 sparks at the heading |
| 0–600 | stage height glides to the new step |
| ~0–1000 | finished rail dot stamps and draws its check + 12 sparks; connector fills; progress bump (stripes, comet flare, number punch) |
| 2400 | beacon on the new step's call to action |
| finale | trophy flips and hops, 140 confetti, border light |

**Check-off** (`wizard.check(item)`):

| ms | Beat |
| --- | --- |
| 0–115 | marker crouches (0.7) — anticipation |
| 115–330 | marker stamps up to 1 + 0.2k at −14°, turns green |
| 230–690 | check mark draws: short arm, then long arm (`clip-path` on the rotated L) |
| 180–1030 | shockwave ring grows to 1.6 + 0.5k and thins out |
| 300 | **18 sparks** from the marker |
| 150–1000 | the item nudges 9px × k toward inline-end and back |
| 320–970 | strike-through draws across the title |
| 480–1130 | connector fills downward; its glowing tip runs toward the next marker |
| 250–1150 | progress glides with overshoot, stripes run 3×, comet flares, 10 sparks at the comet, the number counts and punches |
| 680–1650 | next task: marker pops, card jumps in, 10 sparks, ring pulses 3× |
| 2400+ | beacon: pop → tada → glow on its button |

**Completion**: banner blasts in (0.1 → 1.18 → 0.94 → 1) · trophy flips (−30° → 12°) and hops · 24 sparks · **140 confetti** at 650 ms · aurora + border light · art hops twice · optional auto-collapse at 4.2 s.

## Amplitude numbers

| Thing | Wild (default) | Too shy — fix it |
| --- | --- | --- |
| item / card entrance travel | 38px × k ≈ 90px, tilt 5°, blur 4px | < 12px, no tilt |
| step transition travel | 12–25 % × k of the stage width, or a 90° 3D turn | a cross-fade |
| headline start scale | 1 + 0.42k ≈ 2 | 1.05 |
| stamp | 0.7 → 1.48 at −14° → 0.9 → 1.06 → 1 | a color change |
| shockwave | ring to 2.8× | none |
| sparks | 10–24 per hit, reach ≈ 0.9 × element size × power factor | none |
| confetti | 140 pieces, 1.9–3 s | < 40 |
| piece duration | 650–1100 ms | 200–300 ms |
| whole sequence | ≤ ~2 s, then still | loops |

## Step transitions

`data-wizard-transition` on the wizard. All read `--wizard-dir` (+1 forward, −1 back, × −1 in RTL), so Back reverses the motion and RTL mirrors it.

| Name | Out | In | Best for |
| --- | --- | --- | --- |
| `slide` (default) | −12 % × k, scale 0.9, `rotate: y −14°`, blur | from +14 % × k stretched `1.08 0.94`, `rotate: y 12°`, blurred → −2.5 % → +1 % → 0 | any |
| `cube` | turns −90° around the stage's center axis (`transform-origin: 50% 50% -50cqw`) | turns in from +90°, overshoots −6° | short steps, wide screens |
| `flip` | edge-on −90° (340 ms) | from +90° after the out half, overshoots −16° → 6° | cards, quizzes |
| `zoom` | grows 1 + 0.2k, blurs | from 1 − 0.22k → 1.06 → 0.98 → 1 | finales, big moments |
| `drop` | falls 12 % × k, tilts 7° | drops from −28 % × k, squashes `1.14 0.84`, bounces twice | playful products |
| `warp` | stretched `1.6 0.72` away with blur 14px | whips in stretched, overshoots, snaps | games, promos |
| `swing` | folds away `rotate: x 75°` | hangs from the top edge: −80° → 22° → −10° → 4° → 0 | step-by-step reveals |

Durations live in `--wizard-out-dur`, `--wizard-in-dur`, `--wizard-in-delay`; JS reads them to time the cleanup.

## Impact: sparks, shockwave, confetti, punch

Particles live on one fixed layer `<div class="wizard-fx" aria-hidden="true">` at the end of `<body>` (never clipped by cards), are positioned from `getBoundingClientRect()`, use fixed pseudo-random numbers (same look every time), and are removed after 1.3 s (sparks) / 3.4 s (confetti). None in reduced motion.

```js
function sparks(el, n = 14, at = 0) {           // a ring of dots, diamonds (3n) and streaks (4n)
    if (!el || still()) return;
    setTimeout(() => {
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
        const box = make('span', 'wizard-sparks');
        box.style.left = `${r.left + r.width / 2}px`; box.style.top = `${r.top + r.height / 2}px`;
        const colors = palette(el.closest('.wizard') || el, '--wizard-burst');
        const reach = Math.max(36, Math.min(150, Math.max(r.width, r.height) * 0.9)) * (0.6 + power(el) / 4);
        for (let i = 0; i < Math.min(n, 40); i++) {
            const a = (i / n) * Math.PI * 2 + rnd(i, 1) * 0.6, d = reach * (0.55 + rnd(i, 2) * 0.7);
            const p = make('i');
            p.style.cssText = `--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;--ang:${a * 57.3 + 90}deg;--sz:${5 + rnd(i, 3) * 7}px;--life:${600 + rnd(i, 4) * 500}ms;--c:${colors[i % colors.length]}`;
            box.append(p);
        }
        layer().append(box); setTimeout(() => box.remove(), 1300);
    }, at);
}
```

```css
@keyframes wizard-spark { 0% { opacity: 1; translate: 0 0; scale: 1.3; } 70% { opacity: 1; } 100% { opacity: 0; translate: var(--tx) var(--ty); scale: 0.2; } }
@keyframes wizard-confetti {   /* up and out, then falling and spinning; a second animation flutters in 3D */
    0% { opacity: 1; translate: 0 0; rotate: 0deg; scale: 0.5; }
    16% { translate: calc(var(--tx) * 0.55) calc(var(--ty) * 0.85); scale: 1; }
    30% { translate: calc(var(--tx) * 0.78) var(--ty); }
    62% { opacity: 1; translate: calc(var(--tx) * 0.92) calc(var(--ty) + var(--fall) * 0.45); }
    100% { opacity: 0; translate: var(--tx) calc(var(--ty) + var(--fall)); rotate: var(--spin); scale: 0.9; }
}
```

- Confetti: an upward fan ±100° from the target's center, speed 22–70 % of `min(viewport, 1000px)`, fall 45–90 % of the viewport height, spin ±720°, three shapes (strip, dot, long strip), colors from `--wizard-confetti`.
- Shockwave: `.wizard-marker::after` ring (`wizard-shock`).
- Punch: `.wizard-progress-text` scales 1 → 1.3 → 0.94 → 1.05 → 1 with a glow after the count (`wizard-punch`).
- `wizard.sparks(el, n)`, `wizard.confetti(el, n)`, `wizard.celebrate(el)` are public — use them for the app's own wins (a saved form, a first message).

## Beacon — attention on the next action

After the next task/step arrives, its call to action (`[data-wizard-cta]`, else the first filled `.wizard-btn` or `.wizard-link`) gets **three cues, one at a time** — `pop` → `tada` → `glow` (from webmovie's spotlight), 2.2 s apart, starting 1.8–2.6 s after arrival. It waits while the pointer is over the wizard, while the user types in a field, and in a hidden tab; it is replaced when the next task arrives; then nothing moves.

```html
<section class="wizard" data-wizard="checklist" data-wizard-beacon="hop glow">…</section>  <!-- own cue list -->
<section class="wizard" data-wizard="checklist" data-wizard-beacon="off">…</section>       <!-- none -->
```

Cues: `pop` (1.24 −3° wobble) · `tada` (squeeze, then ±4° at 1.16) · `jelly` (squash/stretch) · `hop` (crouch, hop −38 %, land) · `glow` (1.1 + spreading accent ring + halo, the sheen sweeps the button).

## Ambience: aurora, border light, tilt

- **Aurora** — `.wizard::before` holds three soft radial gradients (accent, accent-2, ok) at 0.6 opacity. `.wizard-flare` (entrance, step change, completion) brightens it to 1, scales 1.28 and turns 28° over 4.2 s, once.
- **Border light** — `.wizard::after` is a conic gradient masked to a 2px ring; `.wizard-glow` turns it 3 times (`@property --wizard-angle`) and fades it out, 4.2 s, once.
- **Tilt** — `.wizard-tilt` follows the pointer: `rotateX(ty × −5°) rotateY(tx × 6°)` with a spring transition; pointer devices only, never in reduced motion, back to flat on leave. Not on steps with text inputs (a moving field is hard to type in).

## Hover and press

CSS only, also on `:focus-visible`: buttons rise 3px and scale 1.04 with a deeper colored shadow, press to 0.93, a sheen sweeps once (`wizard-shine`), arrows nudge 0.35em toward inline-end; `.wizard-link`'s "›" nudges; open markers jelly on hover; choice cards rise 3px; tiles rise 4px; rail dots scale 1.12; the toggle presses to 0.9; the peek rises.

## More: webmovie shots inside steps

The kit owns the wizard's own moments. For more motion *inside* a step (a headline split into letters, a number counting, a chart, an illustration that plays), load the webmovie kit too and mark elements with `data-webmovie`: hidden steps are `display: none`, so their shots play when the step appears (IntersectionObserver). Keep one driver per element: do not put `data-webmovie` on `.wizard-step-title` (the kit already smashes it) — use it on a second line, a number (`count`), a picture (`data-webmovie-picture`) or a list (`stagger`).

## Safety limits

Loud never overrides these:

- Reduced motion: no animation, no particles, no beacon, no tilt, instant collapse — state changes still happen.
- Every effect is finite: shots ≤ 1.5 s, ambience ≤ 4.4 s once, rings 3 loops, beacon 3 cues, stripes 3 runs, confetti ≤ 3.4 s. The only infinite animation is a confetti piece's flutter, removed with the piece.
- ≤ 3 flashes per second; no color strobing; no shaking of text after it has landed (the invalid-step shake is ≤ 600 ms, once, on demand).
- Animated properties: opacity, translate, scale, rotate, filter, clip-path, background-position/size on small elements, box-shadow on cues — plus the stage's block-size glide (one element) and the collapse fold (one element).
- Focus moves with the step; nothing moves the page scroll except bringing a wizard whose top went off-screen back into view.

## Review — is it loud enough?

Open the page and the check frames (`step-0.12/0.35/0.7.png`, `check-…png`):

1. From arm's length on a phone, can you see every beat (entrance, step change, check-off, arrival, completion)? If you have to look for it → raise the power or use a bolder transition.
2. Does each hit have anticipation, an overshoot or squash, and an impact (sparks, shockwave, flare)? A plain fade is a ✗.
3. Do the beats come one after another (not all at once), and does everything stop within ~2 s (4.4 s for ambience)?
4. Reduced motion and no-JS show the correct static states; `check.mjs` errors 0.
