# Code — the kit's contract

`assets/wizard.css` + `assets/wizard.js` are the single source. Copy them unchanged into projects; restyle with `--wizard-*` variables in the project's CSS. If the kit is lost or must change, rebuild it from this file. Change it in the skill first, then copy — never let copies drift.

## Contents

- [Attributes](#attributes)
- [Labels](#labels)
- [Generated DOM](#generated-dom)
- [Classes](#classes)
- [Events](#events)
- [JS API](#js-api)
- [State machine](#state-machine)
- [Variables](#variables)
- [Core code — wizard.js](#core-code--wizardjs)
- [Core code — wizard.css](#core-code--wizardcss)
- [Add a transition, a cue or a look](#add-a-transition-a-cue-or-a-look)
- [Known limits](#known-limits)

## Attributes

| Attribute | On | Values / meaning |
| --- | --- | --- |
| `data-wizard` | container | `steps` · `checklist` (required) |
| `data-wizard-power` | any ancestor | `calm` · `bold` · `wild` (default wild) |
| `data-wizard-save` | container | localStorage key: steps → resume step; checklist → snapshot for "celebrate since last visit" + collapsed state |
| `data-wizard-transition` | steps | `slide` (default) `cube` `flip` `zoom` `drop` `warp` `swing` |
| `data-wizard-free` | steps | rail dots jump to any step (default: visited only) |
| `data-wizard-step` | section | one step; `data-wizard-title` = rail name; `data-wizard-current` = start here (no save) |
| `data-wizard-finale` | the last step | the goal screen (not a rail dot; 100 %) |
| `data-wizard-next` · `data-wizard-back` · `data-wizard-go="k"` | buttons | navigation (authored ones replace the generated nav) |
| `data-wizard-cta` | a button/link | what the beacon points at |
| `data-wizard-beacon` | container | cue list (`pop tada glow` default) or `off` |
| `data-wizard-item` | li | one task (give it an `id`) |
| `data-done` · `data-skipped` · `data-optional` · `data-locked` (`="manual"`) | item | state from the server |
| `aria-current="step"` | item | current (the kit recomputes it) |
| `data-wizard-new` | item with `data-done` | play the check-off after the entrance (server-side alternative to the snapshot) |
| `data-wizard-done` · `data-wizard-skip` · `data-wizard-undo` | buttons in an item | in-page actions |
| `data-wizard-ack` | checkbox in an item | checked = done, unchecked = undo |
| `data-wizard-complete` | element | shown (unhidden) when every task is done or skipped |
| `data-wizard-collapsed` | checklist | start collapsed |
| `data-wizard-autocollapse` | checklist | collapse 4.2 s after completion |

## Labels

All visible kit text comes from attributes on the container (fallback in English). Placeholders in braces.

| Attribute | Fallback | Placeholders |
| --- | --- | --- |
| `data-label-progress` | `{done} / {total}` | `{done}` `{total}` `{percent}` (formatted with `Intl.NumberFormat(lang)`) |
| `data-label-progress-name` | `Progress` | aria-label of the bar |
| `data-label-next` · `-back` · `-finish` | `Next` · `Back` · `Finish` | — |
| `data-label-step` | `Step {n} of {total}: {title}` | live region |
| `data-label-go` | `Step {n}: {title}` | rail dot aria-label |
| `data-label-expand` · `-collapse` | `View tasks` · `Hide tasks` | toggle |
| `data-label-next-task` · `-all-done` | `Next: {title}` · `All done!` | peek |

## Generated DOM

Only created when missing (authored elements with the same class are reused):

| Element | Where | Family |
| --- | --- | --- |
| `.wizard-meter` > `.wizard-progress[role=progressbar]` > `.wizard-progress-track` (`.wizard-progress-fill`, `.wizard-progress-head`) + `.wizard-progress-text` | before the stage / after the head | both |
| `ol.wizard-rail` > `li` > `button.wizard-dot[data-wizard-go]` + `span.wizard-rail-label` | after the meter | steps |
| `.wizard-stage` | wraps the steps | steps |
| `.wizard-nav` > Back (`.wizard-btn-ghost`) + Next (`.wizard-btn`, `data-wizard-cta`, arrow) | after the stage, if no `[data-wizard-next]` exists | steps |
| `p.wizard-sr[aria-live=polite]` | end of the container | steps |
| `button.wizard-toggle` (text + chevron) | inside the meter | checklist |
| `button.wizard-peek` (`.wizard-ring` + `.wizard-peek-text`) | after the meter | checklist |
| `.wizard-panel` | wraps everything after the meter except head, art, note, banner | checklist |
| `.wizard-fx` (sparks, confetti) | end of `<body>`, once | both |

Inline custom properties the kit writes: `--wizard-p`, `--wizard-dir`, `--wizard-stagger` (container), `--i`, `--side` (items, rail items, step children), `--wizard-tx/-ty` (tilt).

## Classes

| Class | Set by | Meaning |
| --- | --- | --- |
| `wizard-js` | JS on `<html>` | the kit runs (pre-init hide + 3 s fail-safe) |
| `wizard-on` | JS | prepared |
| `wizard-rtl` | JS | right-to-left |
| `wizard-wait` → `wizard-intro` | JS | hidden until in view → entrance (2.6 s) |
| `wizard-flare` · `wizard-glow` | JS | aurora · border light (4.4 s) |
| `wizard-bump` | JS | progress changed (2.6 s) |
| `wizard-current` · `wizard-leaving` · `wizard-entering` | JS | steps |
| `wizard-shake` · `wizard-error` | JS | invalid step / field |
| `is-done` · `is-current` · `is-open` | JS | rail items |
| `wizard-stamped` | JS | a rail dot just finished |
| `wizard-checking` · `wizard-arrive` · `wizard-unlocking` · `wizard-skipping` · `wizard-unchecking` | JS | item moments |
| `wizard-celebrate` | JS | banner entrance |
| `wizard-complete` · `wizard-collapsed` · `wizard-reveal` · `wizard-has-art` | JS | container states |
| `wizard-cue-pop|tada|jelly|hop|glow` | JS (beacon) | attention cue |
| `wizard-plain` · `wizard-tiles` · `wizard-side` · `wizard-dock` · `wizard-tilt` · `wizard-stack` | author | looks |

## Events

All bubble, prefix `wizard:`; `detail` in parentheses.

| Event | When |
| --- | --- |
| `wizard:step` (`index`, `id`, `title`) | a step became current |
| `wizard:finish` (`id`) — **cancelable** | Next on the last real step passed validation. `preventDefault()` → the kit does not advance; save on the server and call `wizard.go(w, finaleIndex)` |
| `wizard:complete` | finale reached / every task done or skipped |
| `wizard:check` · `wizard:uncheck` · `wizard:skip` (`id`) | on the item |

```js
document.addEventListener('wizard:check', (e) => fetch('/onboarding/' + e.detail.id, { method: 'POST', headers: { 'X-CSRF-TOKEN': token } }));
form.addEventListener('wizard:finish', async (e) => {
    e.preventDefault();
    const ok = (await fetch(form.action, { method: 'POST', body: new FormData(form) })).ok;
    if (ok) wizard.go(form, form.querySelectorAll('[data-wizard-step]').length - 1);
});
```

## JS API

`window.wizard`: `refresh(root?)` (prepare new containers — also automatic via MutationObserver) · `go(w, k)` · `next(w)` (validates) · `back(w)` · `check(itemOrId)` · `uncheck(itemOrId)` · `skip(itemOrId)` · `collapse(w, on = true)` · `celebrate(elOrWizard)` · `sparks(el, n, delayMs)` · `confetti(el, n, delayMs)`. `w` may be an element or a selector.

## State machine

```
(no JS) ─────────────────────────────────── plain HTML: states from attributes, all steps stacked
html.wizard-js        [data-wizard]:not(.wizard-on) hidden one frame (fail-safe: shown after 3 s)
init()                → generated parts, .wizard-on; reduced motion → painted at once, never moves
                        else .wizard-wait (+ progress shown as 0) and observed (fixed docks: next frame)
intro()               → .wizard-intro .wizard-flare .wizard-glow; paint(true): progress 0 → value; beacon / fresh check-offs
steps:  go(k)         → leaving/entering classes, stage height glide, paint (rail, progress, nav, live), focus, events
        next()        → validate → go(i+1) | wizard:finish → finale | form.requestSubmit()
checklist: check()    → data-done, .wizard-checking, sparks, paint: unlock → current → progress → banner → celebrate → save
        collapse()    → WAAPI fold, hidden panel, .wizard-collapsed, peek
```

## Variables

Tokens: `--wizard-accent`, `--wizard-accent-2`, `--wizard-ok`, `--wizard-ok-ink`, `--wizard-bad`, `--wizard-gold`, `--wizard-surface`, `--wizard-muted`, `--wizard-line`, `--wizard-soft`, `--wizard-radius`, `--wizard-dot`, `--wizard-gap`, `--wizard-burst`, `--wizard-confetti`. Motion: `--wizard-k`, `--wizard-out`, `--wizard-in`, `--wizard-out-dur`, `--wizard-in-dur`, `--wizard-in-delay`, `--wizard-origin`, easing tokens `--wizard-ease-punch|spring|expo|in|inout` on `:root`. Registered: `--wizard-p` (number, inherits — progress 0…1), `--wizard-angle` (border light).

## Core code — wizard.js

```js
doc.documentElement.classList.add('wizard-js');            // first line, in <head>
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const restart = (el, cls, dur) => {                         // every moment = a one-shot class; the animation is in CSS
    if (!el || still()) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    clearTimeout(el['wz-' + cls]); el['wz-' + cls] = setTimeout(() => el.classList.remove(cls), dur);
};

function setProgress(w, done, total, fx) {                  // one value drives bar, comet, ring
    w.style.setProperty('--wizard-p', (total ? done / total : 0).toFixed(4));   // CSS transitions it with overshoot
    bar.setAttribute('aria-valuenow', done); bar.setAttribute('aria-valuemax', total);
    countTo(out, fx ? shown : done, done, render, 900, 250);                    // the number counts after the bar starts
    if (fx && shown !== done) { restart(w, 'wizard-bump', 2600); sparks(head, 10, 900); }
}

function go(w, k) {                                          // steps
    const dir = (k > s.i ? 1 : -1) * (rtl ? -1 : 1);
    w.style.setProperty('--wizard-dir', dir);
    const h0 = stage.offsetHeight;
    from.classList.replace('wizard-current', 'wizard-leaving');
    to.classList.add('wizard-current', 'wizard-entering');      // children get --i for the cascade
    stage.animate([{ blockSize: h0 + 'px' }, { blockSize: to.offsetHeight + 'px' }], { duration: …, easing: 'cubic-bezier(0.2, 1, 0.3, 1)' });
    // cleanup after max(out, delay + in + 900) ms (durations read from --wizard-out-dur / -in-dur / -in-delay)
    paintSteps(w, true); focus(heading); emit('step'); if (k === finale) { confetti(trophy, 140); emit('complete'); } else beacon(w, to);
}

function paintChecklist(w, fx) {                             // checklist: one pass decides everything
    let blocked = false, current = null, done = 0;
    for (const it of items) {
        if (it.wzAuto && it.hasAttribute('data-locked') && !blocked) unlock(it, fx);  // rattle → remove → repaint
        if (done/skipped) done++; else if (!locked && !current) current = it;
        if (!done && !skipped && !optional) blocked = true;
    }
    // aria-current moves → .wizard-arrive + sparks + beacon; progress; peek text; banner hidden = !complete;
    // newly complete → celebrate(); save snapshot
}

function check(item) {
    item.setAttribute('data-done', ''); ack.checked = true; if (collapsed) collapse(w, false);
    restart(item, 'wizard-checking', 1700); sparks(marker, 18, 300);
    paintChecklist(w, true); emit(item, 'check', { id });
}

// init: fresh = items done now but not in the saved snapshot (or data-wizard-new) → shown as todo, checked one by one after the entrance
// IntersectionObserver rootMargin bottom −12 % → intro(); position: fixed (dock) → intro next frame
// beacon(w, host): cues in turn every 2.2 s; waits on :hover, typing, hidden tab; replaced on the next arrival
// collapse: WAAPI blockSize h → 0 + opacity, then hidden; expand reverse + .wizard-reveal (items fly in again)
// tilt: pointermove on .wizard-tilt → --wizard-tx/-ty (−1…1); pointer devices only
```

## Core code — wizard.css

```css
/* states without JS */
.wizard-item[data-done] .wizard-marker { border-color: var(--wizard-ok); background: var(--wizard-ok); color: var(--wizard-ok-ink); }
.wizard-item[data-done] .wizard-marker::before { content: ""; inline-size: 28%; block-size: 52%; border: solid currentColor; border-width: 0 3px 3px 0; rotate: 45deg; translate: 0 -12%; }
.wizard-item[data-done] .wizard-item-title { background-size: 100% 2px; color: var(--wizard-muted); }   /* strike = a background line */
.wizard-item[data-done]:not(:last-child)::after { scale: 1 1; }                                          /* connector fill */
.wizard-on .wizard-step:not(.wizard-current, .wizard-leaving) { display: none; }
.wizard-progress-fill { clip-path: inset(0 calc((1 - var(--wizard-p)) * 100%) 0 0 round 999px); }
.wizard-progress-head { translate: calc(var(--wizard-p) * 100cqw * var(--wizard-sx)) 0; }                 /* track is a size container */

@media screen and (prefers-reduced-motion: no-preference) {
    .wizard-js [data-wizard]:not(.wizard-on) { opacity: 0; animation: wizard-failsafe 1ms 3s forwards; }
    .wizard { transition: --wizard-p 1100ms var(--wizard-ease-punch); }
    .wizard-leaving  { transform-origin: var(--wizard-origin); animation: var(--wizard-out) var(--wizard-out-dur) var(--wizard-ease-in) both; }
    .wizard-entering { transform-origin: var(--wizard-origin); animation: var(--wizard-in) var(--wizard-in-dur) linear var(--wizard-in-delay) both; }
    .wizard-checking .wizard-marker { animation: wizard-stamp 820ms linear both; }
    .wizard-checking .wizard-marker::before { animation: wizard-check-draw 460ms ease-out 230ms both; }
    .wizard-checking:not(:last-child)::after { animation: wizard-fill-down 650ms var(--wizard-ease-expo) 480ms both; }
    /* … every moment in references/motion.md is one rule here … */
}
@keyframes wizard-check-draw { 0% { clip-path: inset(82% 100% 0 0); } 45% { clip-path: inset(82% 0 0 0); } 100% { clip-path: inset(0 0 0 0); } }
@keyframes wizard-stamp { 0% { scale: 1; } 14% { scale: 0.7; } 40% { scale: calc(1 + 0.2 * var(--wizard-k)); rotate: -14deg; } 58% { scale: 0.9; rotate: 4deg; } 76% { scale: 1.06; rotate: -1deg; } 100% { scale: 1; rotate: 0deg; } }
```

## Add a transition, a cue or a look

- **Transition**: add `@keyframes wizard-<name>-out` (to-state only) and `wizard-<name>-in` (acted phases, natural end), read `--wizard-dir` and `--wizard-k`; add `[data-wizard-transition="<name>"] { --wizard-out: …; --wizard-in: …; --wizard-out-dur: …; --wizard-in-dur: …; --wizard-in-delay: …; --wizard-origin: …; }` inside the motion block; add a link in `demo.html`; run the check with `?transition=<name>` and look at `step-*.png`.
- **Cue**: `@keyframes wizard-cue-<name>` (≤ 1.2 s, ends at the natural state) + `.wizard-cue-<name> { animation: … }` in the motion block.
- **Look**: a class with token overrides and layout rules only (no new JS); keep states attribute-based; add a section to `demo.html` and `layouts.md`.

## Known limits

- `--wizard-p` glides only where `@property` is supported (Firefox ≥ 128); elsewhere the bar jumps (still correct).
- The cube transition needs container query units (`cqw`) on the stage; tall steps on phones look better with `slide` or `flip`.
- `:has()` styles choice cards and the ack row; older browsers show plain radios still working.
- A link carrying `data-wizard-done` that navigates away will cut the animation — see layouts.md.
- The local snapshot is per browser; the server stays the source of truth.
