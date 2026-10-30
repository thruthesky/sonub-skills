---
name: wizard
description: Design and build beautiful, heavily animated onboarding wizards and checklists — the setup guide or sign-up flow a new member follows (settings, information to enter, tasks, rules to acknowledge). One drop-in kit (wizard.css + wizard.js, no build), two families — one-step wizards (one step per screen, top or side rail, progress, Back/Next, validation, finale) and vertical checklist steppers with progress (card, flat task sections with an illustration like a store console's "Release your app" page, tiles, dock, collapsed peek). States are server HTML (done, current, locked, skipped); every change is loud on purpose — 3D step transitions, check-offs that stamp and throw sparks, overshooting progress, unlock shakes, confetti — then still. Use it whenever the user wants a wizard, stepper, multi-step form, onboarding or setup checklist, getting started guide, task list with progress, or says such a screen looks plain or boring.
license: MIT
compatibility: Plain CSS and JavaScript for evergreen browsers (individual transform properties, @property, :has(), container query units, IntersectionObserver, WAAPI) — no framework, no build. scripts/check.mjs needs Node 22+ and Google Chrome or Chromium. Pairs with the webmovie skill (same motion language) but does not require it.
---

# wizard — onboarding checklists and one-step wizards that move

A new member meets a site through a short list of things to do. That list decides whether they finish setting up. This skill designs it well and makes every step **feel like an event**: the step that leaves whips away in 3D, the next one lands with overshoot, a finished task stamps its check mark and throws sparks, the progress bar overshoots with a glowing comet, the next task jumps forward and its button calls for attention, the last one ends in confetti.

Two families, one kit (`assets/wizard.css` + `assets/wizard.js`):

| Family | Markup | Use when |
| --- | --- | --- |
| **One-step wizard** — one step per screen | `<form class="wizard" data-wizard="steps">` + `<section data-wizard-step>` per step | the steps must happen in order, now, in one sitting (sign-up, profile setup, a quiz, a purchase) |
| **Checklist stepper** — vertical list with progress | `<section class="wizard" data-wizard="checklist">` + `<li data-wizard-item>` per task | tasks live on other pages and take days (verify email, add photo, read rules, first lesson); progress is saved on the account |

**Talk to the user in their language.** These files are English; the page keeps its own languages (every label comes from `data-label-*`).

## The brief: excessive motion, safe brakes

The user asked for motion that is **too much on purpose** ("동적인 디자인을 과하게"). So the kit's default power is `wild` (`--wizard-k: 2.4`) and every moment is *acted* — anticipation, big travel, overshoot, squash, an impact (sparks, shockwave, flare), secondary motion — never a shy 8px fade. Being loud is acceptable only because of the brakes, which are never removed:

- **It stops.** Each effect is one shot ≤ ~1.5 s; ambience (aurora, border light) ≤ 4.4 s once; attention cues 3 turns; rings 3 loops; particles removed ≤ 3.4 s. Nothing loops forever (WCAG 2.2.2).
- **Reduced motion = no motion.** Everything moving is inside `@media (prefers-reduced-motion: no-preference)`; JS effects check `still()`. States still change instantly.
- **The final frame is the plain HTML.** States are attributes the server writes; without JS the page is a readable list or a long form.
- **Cheap properties only** (opacity, translate, scale, rotate, filter, clip-path) — the one exception is the stage height gliding between steps (one element, ≤ 600 ms).
- **≤ 3 flashes per second**, no full-screen strobes; reading text never shakes after it has landed.

`data-wizard-power="calm|bold|wild"` on any container scales every distance (1 · 1.6 · 2.4). Use `calm` only for long legal text or dense admin screens. Motion catalog, beat timelines and numbers: [references/motion.md](references/motion.md).

## Rules (why each exists)

1. **State lives in the HTML.** The server renders `data-done`, `data-skipped`, `data-locked`, `data-optional` and `aria-current="step"`. CSS styles those attributes directly, so the page is correct before (and without) JS, cached HTML stays right, and search engines and screen readers read the real list.
2. **Save progress on the account, not in the browser.** The server is the source; the kit's `data-wizard-save` (localStorage) only remembers what was shown last time so it can *celebrate what changed since the last visit*. Listen to `wizard:check` / `wizard:skip` / `wizard:finish` / `wizard:complete` and send them to the server.
3. **One driver per moment, then still.** A check-off is one sequence (stamp → check draws → shockwave + sparks → strike → nudge → line fills down → next task arrives). Do not stack a second loud effect on the same element at the same time; add effects to *different beats* instead.
4. **Text stays text.** Titles, counts, labels are HTML (translatable, indexable). Art is an `<img>` (made with the project's image tool — in SONUB the Codex CLI) or an emoji tile; never words inside pictures.
5. **Status is never color alone.** Each state has its own shape (check, ring, number, lock, dash) plus text (strike-through, "Optional" tag, aria attributes).
6. **Every language.** Labels from `data-label-*` with `{placeholders}`, numbers through `Intl.NumberFormat`, directions mirrored in RTL (`--wizard-sx`, `--wizard-dir`), no letter-splitting.

## Workflow

1. **Pick the family and the look** (tables above and below). Ask: must the steps happen now and in order? → one-step wizard. Do they happen elsewhere, over days? → checklist. Several related checklists on one page (release, launch, compliance)? → a `.wizard-stack` of `.wizard-plain` sections.
2. **Write the content** with the content rules below — titles first; if a list grows past 7, split it into groups or sections.
3. **Build with the kit.** Copy `assets/wizard.css` and `assets/wizard.js` unchanged (they are the single source; restyle by overriding `--wizard-*` variables in the project's CSS). Load both in `<head>`, the script **without** `defer`. Write the markup from [references/layouts.md](references/layouts.md).
4. **Wire the state.** Server renders the attributes; on in-page actions use `data-wizard-done` / `data-wizard-ack` / `data-wizard-skip`; for tasks finished on another page let the server render `data-done` (and `data-wizard-new` once) — the kit replays the check-off fireworks on arrival.
5. **Direct the motion.** Choose a step transition (`data-wizard-transition`), the power, the beacon cues; make sure each beat in [references/motion.md](references/motion.md) has an impact. If it can be bigger without breaking a brake, make it bigger.
6. **Check.** `node scripts/check.mjs <url-or-file>` (below) — errors 0 — then *look* at `page.png`, `step-*.png` and `check-*.png`, at a narrow width (`--width 390`) and in RTL.
7. **Report** the family and look, the steps/tasks, the motion beats, and the check result.

## Choose the look

| Look | Class | Picture it as | Good for |
| --- | --- | --- | --- |
| Card checklist (default) | `.wizard` | a glowing card: eyebrow, big title, striped progress with a comet, numbered markers on a line, the current task as a lit card | dashboard "Getting started" |
| **Plain task section** | `.wizard .wizard-plain` (+ `.wizard-art`) | flat, no card: illustration at inline-start · title · description · thin two-tone bar "1 of 4 complete ⌃" · group titles · small icons on a 1px line (✓ struck through, ○ current with a "›" link, 🔒 locked) · "View tasks ⌄" when collapsed · a notice box | settings / release / launch pages with several checklists |
| Stack of sections | `.wizard-stack` around `.wizard-plain` sections | sections divided by lines under one page title | "Release your app", "Set up your store" |
| Tiles | `.wizard .wizard-tiles` | tasks as cards in a grid, free order | "Explore the site", optional quests |
| Dock | `.wizard .wizard-dock` (+ `data-wizard-collapsed`) | a floating pill in the corner (ring + "Next: …") that opens into the checklist | a checklist that follows the user across pages |
| One-step wizard, top rail | `.wizard` + `data-wizard="steps"` | rail of numbered dots on a filling line, one step on stage, Back / Next | sign-up, short setup |
| One-step wizard, side rail | `.wizard .wizard-side` | vertical stepper at inline-start, the step beside it (≥ 52rem; top rail below) | long setup with 4–8 named steps |

Any look takes `.wizard-tilt` (3D follow-the-pointer) on cards without text inputs. Looks combine with every transition and power.

## Content rules

- **5–7 steps or tasks.** More → group them (`.wizard-group-title`) or split into sections; a long list looks endless and nobody starts it.
- **Title = a short action** with a verb: "Add a profile photo", not "Profile photo". Same grammar for all.
- Add **one line of why** (what it unlocks) and, when useful, the **time it takes** (`<span class="wizard-tag">1 min</span>`).
- Mark **required vs optional**: optional tasks get `data-optional`, a tag "Optional" and a **Skip** button (`data-wizard-skip`).
- Things to **know** (rules, terms) are completed with an acknowledgement checkbox (`data-wizard-ack`: "I have read the rules").
- The header says what finishing gives ("Finish setup, get a free lesson"); the completion banner says it happened and offers the next action.
- Lock only what truly depends on earlier steps (`data-locked` = opens when every earlier required task is done; `data-locked="manual"` = the app opens it). Everything else is free order.

## Behavior

- Progress is saved on the server (the account) so it follows the user to another device; the kit's local snapshot only powers "celebrate since last visit".
- A finished task checks itself (stamp + sparks) and the **next task becomes current** (it jumps forward, its call to action gets three attention cues).
- First visit: expanded. Later: a collapsed card (`data-wizard-collapsed`, the peek shows a ring and "Next: …") at the top of the dashboard, or a dock. When everything is done: banner + confetti, and the checklist can collapse itself (`data-wizard-autocollapse`) or be dismissed.
- One-step wizard: Next validates the current step (shake + wobble on the bad field), Enter means Next, the last real step fires `wizard:finish` (cancelable — save on the server, then `wizard.go(w, finale)`), the finale throws confetti.

## Accessibility

- Current step/task has `aria-current="step"`; the progress bar is `role="progressbar"` with `aria-valuenow/max/text`; step changes are announced in a polite live region and focus moves to the new step's heading.
- Keyboard: every control is a real `button`/`a`/`input`; rail dots are buttons; the collapse toggle has `aria-expanded` + `aria-controls`.
- Touch targets ≥ 44px; one column on phones; never rely on hover (hover effects also run on `:focus-visible`).

## The kit in one minute

```html
<link rel="stylesheet" href="/css/wizard.css">
<script src="/js/wizard.js"></script>

<!-- checklist stepper -->
<section class="wizard" data-wizard="checklist" data-wizard-save="onboarding" aria-labelledby="ob-title"
         data-label-progress="{done} / {total} done" data-label-next-task="Next: {title}">
  <header class="wizard-head">
    <h2 class="wizard-title" id="ob-title">Finish setup, <mark>get a free lesson</mark></h2>
    <p class="wizard-sub">Five short tasks.</p>
  </header>
  <div class="wizard-banner" data-wizard-complete hidden><span class="wizard-trophy" aria-hidden="true">🎉</span><strong>All set!</strong></div>
  <ol class="wizard-list">
    <li class="wizard-item" data-wizard-item id="ob-email" data-done>
      <span class="wizard-marker" aria-hidden="true"></span>
      <div class="wizard-item-body"><h3 class="wizard-item-title">Verify your email</h3></div>
    </li>
    <li class="wizard-item" data-wizard-item id="ob-photo" aria-current="step">
      <span class="wizard-marker" aria-hidden="true"></span>
      <div class="wizard-item-body">
        <h3 class="wizard-item-title">Add a profile photo <span class="wizard-tag">1 min</span></h3>
        <p class="wizard-item-desc">Teachers answer faces faster than names.</p>
        <div class="wizard-item-actions"><a class="wizard-btn wizard-btn-small" href="/profile/photo">Upload photo</a></div>
      </div>
    </li>
    <li class="wizard-item" data-wizard-item id="ob-test" data-locked>…</li>
  </ol>
</section>

<!-- one-step wizard -->
<form class="wizard" data-wizard="steps" data-wizard-transition="cube" aria-label="Create your account" novalidate
      data-label-next="Next" data-label-back="Back" data-label-finish="Finish" data-label-progress="{percent}%">
  <section class="wizard-step" data-wizard-step data-wizard-title="Name">
    <h3 class="wizard-step-title">What should we call you?</h3>
    <label class="wizard-field">Nickname <input name="nick" required></label>
  </section>
  <section class="wizard-step" data-wizard-step data-wizard-title="Goal">…</section>
  <section class="wizard-step wizard-finale" data-wizard-step data-wizard-finale>
    <span class="wizard-trophy" aria-hidden="true">🏆</span><h3 class="wizard-step-title wizard-finale-title">You are all set!</h3>
  </section>
</form>
```

The kit generates the progress row, rail, Back/Next, collapse toggle, peek and live region — and only when the page did not author its own. Full markup for every look (including the plain "Release your app" section): [references/layouts.md](references/layouts.md). Attributes, classes, events, API and core code: [references/code.md](references/code.md).

## What moves (summary)

| Moment | Motion |
| --- | --- |
| Wizard enters the view | card rises from blur and tilt; title smashes in + sparks; rail dots pop in turn; items fly in from alternating sides with squash; done connectors fill down; progress fills from 0 with overshoot, the number counts; aurora flare; border light runs 3 turns |
| Next / Back | 3D transition (`slide` default · `cube` · `flip` · `zoom` · `drop` · `warp` · `swing`), direction-aware and mirrored in RTL; step pieces cascade in; heading smashes + sparks; icon blasts; finished rail dot stamps its check + sparks; connector fills; stage height glides |
| Invalid Next | step shakes, field wobbles, browser message |
| Task checked | marker crouches and stamps (−14°), check mark draws, shockwave ring, 18 sparks, strike-through draws, item nudges, connector fills down with a glowing tip, progress overshoots + stripes run + comet flares + number punches |
| Next task arrives | marker pops, card jumps in, ring pulses 3×, its button: pop → tada → glow (pauses on hover/typing) |
| Locked → open | lock rattles, pops, sparks |
| Skip / undo | marker spins away / jellies |
| All done / finale | banner blasts in, trophy flips and hops, 140 confetti, sparks, aurora + border light; art hops |
| Collapse / expand | panel folds with fade; peek pops; on expand the items fly in again |
| Hover | buttons lift, press, sheen sweeps, arrows nudge; markers jelly; choices lift and jelly on select; tiles lift; tilt cards follow the pointer |

## Check

```bash
node scripts/check.mjs https://example.com/start            # or a local .html file
node scripts/check.mjs "file:///…/demo.html?dir=rtl&transition=cube" --width 390 --height 844
```

It runs headless Chrome without JS, normally, and with reduced motion, **drives** every wizard (`go()` through all steps, `check()` the current task) and prints ✗ errors (exit 1) and ! warnings: `hidden-without-js`, `not-prepared`, `stuck-hidden`, `steps-visible`, `step-not-shown`, `text-changed`, `no-aria-current`, `progress-max`, `check-failed`, `motion-left`, `particles-left`, `hidden-reduced-motion`, `moving-reduced-motion`, `no-current`. Frames → `./wizard-check/`: `page.png` (whole page), `step-<t>.png` (the first Next, frozen t s after the click), `check-<t>.png` (the first check-off). Open them — a check cannot see an ugly frame or a shy one.

## Files

| File | Use |
| --- | --- |
| `assets/wizard.css` · `assets/wizard.js` | the kit — copy unchanged |
| `assets/demo.html` | every look: plain "Release your app" stack, card checklist, top-rail wizard, side-rail cube wizard, tiles, dock; `?transition=` · `?power=` · `?dir=rtl` |
| `scripts/check.mjs` | the browser check above |
| [references/layouts.md](references/layouts.md) | **design** — anatomy of every look with full markup, state styling, the plain task section modeled on a store console, art, notices, banners, fields and choice cards, theming tokens, dark mode, mobile |
| [references/motion.md](references/motion.md) | **motion** — power, the eight acting principles mapped to wizard moments, beat timelines, amplitude numbers, sparks/confetti/beacon code, transitions, safety limits, review, adding webmovie shots inside steps |
| [references/code.md](references/code.md) | **contract** — attributes, generated DOM, classes, events, JS API, state machine, CSS variables, core code of wizard.js/css, adding a transition or look, known limits |
| [references/projects/sonub.md](references/projects/sonub.md) | **SONUB (sonub.com)** — read first when working in that repository |
