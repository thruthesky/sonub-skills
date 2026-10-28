# CSS animation and transition — the reference

The language every preset is written in. Newer features (scroll timelines, `@starting-style`, view transitions, `linear()`, `@property`) are in [techniques.md](techniques.md).

## Contents

- [Transition or animation?](#transition-or-animation)
- [Animation properties](#animation-properties)
- [The shorthand](#the-shorthand)
- [@keyframes rules](#keyframes-rules)
- [Fill mode, direction, iteration](#fill-mode-direction-iteration)
- [Several animations at once](#several-animations-at-once)
- [Timing functions](#timing-functions)
- [Events](#events)
- [Transitions](#transitions)
- [Gotchas](#gotchas)

## Transition or animation?

| | `transition` | `animation` + `@keyframes` |
| --- | --- | --- |
| Starts when | a property value changes (`:hover`, a class, a state) | the animation is applied (class added) |
| Steps | start → end | any number of keyframes |
| Repeats, alternates | no | `iteration-count`, `direction` |
| Use for | UI feedback: hover, press, focus, open/close | entrances, sequences, loops, staggered pieces |

## Animation properties

| Property | Values | Notes |
| --- | --- | --- |
| `animation-name` | a `@keyframes` name, `none` | can come from a variable: `var(--webmovie-name)` |
| `animation-duration` | `600ms`, `1.2s` | default `0s` = nothing plays |
| `animation-timing-function` | `ease` (default), `linear`, `ease-in`, `ease-out`, `ease-in-out`, `cubic-bezier()`, `steps(n, start\|end\|jump-none\|jump-both)`, `linear()` | applies **between each pair of keyframes**; can be set per keyframe |
| `animation-delay` | `200ms`, negative values | a negative delay starts part-way through (`-400ms` = the frame at 0.4 s) — webmovie's freeze uses it |
| `animation-iteration-count` | `1`, `3`, `infinite`, `0.5` | text: finite only |
| `animation-direction` | `normal`, `reverse`, `alternate`, `alternate-reverse` | `alternate` for back-and-forth without a jump |
| `animation-fill-mode` | `none`, `forwards`, `backwards`, `both` | `both` = from-state during the delay + end-state after |
| `animation-play-state` | `running`, `paused` | a pause button, `.webmovie-player-paused` |
| `animation-composition` | `replace`, `add`, `accumulate` | not in the shorthand |
| `animation-timeline` | `auto`, `scroll()`, `view()`, `--name` | not in the shorthand; set **after** it |
| `animation-range` | `entry 0% cover 40%` … | with a scroll/view timeline |

## The shorthand

```css
animation: <name> <duration> <timing-function> <delay> <iteration-count> <direction> <fill-mode> <play-state>;
animation: rise 700ms cubic-bezier(0.22, 1, 0.36, 1) 120ms 1 normal both running;
```

- The **first** time value is the duration, the **second** the delay.
- Every omitted sub-property is reset to its initial value — the shorthand overrides an earlier `animation-delay`, `animation-timeline` etc.; write longhands after it.
- A name must not look like a keyword (`ease`, `infinite`, `both` …).

## @keyframes rules

```css
@keyframes rise {
  from { opacity: 0; translate: 0 0.6em; }        /* = 0% */
  60%  { opacity: 1; }
  to   { translate: 0 0; }                         /* = 100% */
}
@keyframes grow-shrink { 25%, 75% { scale: 1; } 50% { scale: 1.2; color: magenta; } }
```

- `from`/`to` are optional: a missing end keyframe uses the element's **own computed style** — webmovie's keyframes only write `from`, so the end is always the natural state.
- Custom properties work inside keyframes and resolve per element: `from { translate: 0 var(--webmovie-y); }`.
- A property that cannot interpolate (most keywords, `display`, gradients, `clip-path` shape → `none`, `font-variation-settings` → `normal`) flips at 50 % — give both ends explicitly in a compatible form.
- `!important` inside keyframes is ignored.
- Duplicate `@keyframes` names: the last one wins (no merging).

## Fill mode, direction, iteration

- `backwards`: the first keyframe applies during the delay — needed for staggered pieces, otherwise each piece shows its final state until its delay ends, then jumps back.
- `forwards`: the last keyframe stays after the end. Side effects: the element keeps a stacking context and acts like `will-change` for the animated properties (webmovie removes its classes at the end instead of relying on `forwards`).
- `alternate` + an even iteration count ends where it started; odd ends at the end.
- No `animationiteration` event fires after the last iteration; `animationend` does.

## Several animations at once

```css
animation-name: fade, slide, pulse;
animation-duration: 600ms, 900ms;      /* list cycles: fade 600, slide 900, pulse 600 */
animation-iteration-count: 1, 1, 3;
```

Values match by position; a shorter list repeats; extra values are ignored. Two animations on the same property: the later one in the list wins (unless `animation-composition: add`).

## Timing functions

| Keyword | Curve | Feel |
| --- | --- | --- |
| `ease` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | default, slightly fast start |
| `ease-in` | `cubic-bezier(0.42, 0, 1, 1)` | accelerates — exits |
| `ease-out` | `cubic-bezier(0, 0, 0.58, 1)` | decelerates — entrances |
| `ease-in-out` | `cubic-bezier(0.42, 0, 0.58, 1)` | moves between two places |
| `linear` | straight | progress, scroll-linked, typing |
| `steps(4, end)` | 4 jumps | sprites, ticking, typewriter |
| `cubic-bezier(x1, y1, x2, y2)` | y outside 0–1 = overshoot | springy UI |
| `linear(0, …, 1)` | piecewise | bounce, elastic, spring |

webmovie tokens: [principles.md#easing](principles.md#easing).

## Events

```js
el.addEventListener('animationstart', (e) => console.log(e.animationName, e.elapsedTime));
el.addEventListener('animationiteration', …);
el.addEventListener('animationend', …);     // bubbles: one listener on a parent catches every piece
el.addEventListener('transitionend', (e) => e.propertyName);
```

- If the animation is applied on load, `animationstart` can fire before your listener exists — add the class from JS after attaching listeners.
- Event times are approximate. webmovie uses its own timer + the `webmovie:done` event instead of counting `animationend` of hundreds of pieces.

## Transitions

```css
.btn { transition: translate 200ms var(--webmovie-ease), box-shadow 200ms var(--webmovie-ease); }
.btn:is(:hover, :focus-visible) { translate: 0 -2px; box-shadow: 0 10px 24px -12px #0008; }
```

- List the properties — never `transition: all` (it animates layout changes you did not intend, e.g. a theme switch).
- `transition-delay` on the *leave* state makes a menu stay a moment after the pointer leaves.
- `display`/`content-visibility`/`overlay` transition only with `transition-behavior: allow-discrete` (see techniques).

## Gotchas

1. `transform`/`translate` do nothing on non-replaced **inline** elements → `display: inline-block` (webmovie's pieces are).
2. Animating `font-size`, `width`, `height`, `top`, `margin`, `padding` re-lays-out every frame → scale a wrapper, use `translate`, `clip-path`.
3. `display` in keyframes is discrete: from `none` it flips at 0 %, to `none` at 100 % — a fade-out-then-remove: `@keyframes out { to { opacity: 0; display: none; } }`.
4. A `transform` on an ancestor creates a containing block for `position: fixed` children — don't animate the transform of a wrapper that holds a fixed header or a modal.
5. `overflow: hidden` on an `inline-block` moves its baseline to the bottom margin edge → masks with `clip-path` (webmovie's `mask`), not overflow, keep lines aligned.
6. `filter`/`opacity < 1`/`transform` create stacking contexts — a z-index puzzle during the animation; it ends when the animation class is removed.
7. Hidden tabs throttle animations and timers; a sequence driven by `setTimeout` must tolerate it (webmovie movies pause on `visibilitychange`).
8. `prefers-reduced-motion: reduce` is a user setting, not a hint — give the final frame, not a shorter animation.

Sources: [MDN — Using CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using) · [W3Schools — CSS animations](https://www.w3schools.com/css/css3_animations.asp).
