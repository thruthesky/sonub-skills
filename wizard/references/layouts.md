# Layouts — the design of every look, with full markup

Every look is one markup family (checklist or steps) plus a class. States are attributes; the kit adds the generated parts. Copy a block, change the words, keep the structure.

## Contents

- [Design principles](#design-principles)
- [Anatomy: checklist](#anatomy-checklist)
- [States and how they look](#states-and-how-they-look)
- [Card checklist (default)](#card-checklist-default)
- [Plain task section — the "Release your app" pattern](#plain-task-section--the-release-your-app-pattern)
- [Stack of sections](#stack-of-sections)
- [Tiles](#tiles)
- [Dock and collapsed peek](#dock-and-collapsed-peek)
- [Anatomy: one-step wizard](#anatomy-one-step-wizard)
- [Top rail and side rail](#top-rail-and-side-rail)
- [Fields and choice cards](#fields-and-choice-cards)
- [Finale, banner, notice](#finale-banner-notice)
- [Art](#art)
- [Theming, dark mode, RTL, mobile](#theming-dark-mode-rtl-mobile)

## Design principles

| Principle | Do | Why |
| --- | --- | --- |
| One clear "next" | exactly one current task/step, visibly lit (accent ring, soft card, the only filled button) | the eye needs one place to go; two equal buttons stall the reader |
| Progress always visible | bar + "N / M" (or "N of M complete") at the top; a ring in the collapsed peek | finishing is motivated by seeing the gap close |
| Finished work recedes | done tasks: green check, struck title, muted, actions hidden | the list shortens visually as you go |
| Calm surface, loud events | static design is clean (one accent gradient, generous space, 1–1.25rem radius); the motion carries the energy | a busy static design plus loud motion is noise; a clean one plus loud motion is delight |
| Shapes, not just colors | number → ring → check, lock, dash | color-blind users and grayscale printing still read states |
| Rhythm | marker column = `--wizard-dot`, gap between tasks `--wizard-gap`, one type scale (title 1.35–2rem, task 1rem, meta 0.78–0.92rem) | alignment on the marker column makes the list read as a path |

## Anatomy: checklist

```
section.wizard[data-wizard=checklist]
├─ figure.wizard-art                 (optional, plain look: illustration at inline-start)
├─ header.wizard-head  → .wizard-eyebrow? .wizard-title .wizard-sub
├─ div.wizard-meter                  (generated) → .wizard-progress (bar + text) + button.wizard-toggle
├─ button.wizard-peek                (generated, shown only when collapsed: ring + "Next: …")
├─ .wizard-note                      (optional notice, stays visible when collapsed)
├─ div.wizard-banner[data-wizard-complete][hidden]   (shown when all done)
└─ div.wizard-panel                  (generated wrapper of the rest — collapses)
   ├─ h3.wizard-group-title          (optional)
   └─ ol.wizard-list > li.wizard-item[data-wizard-item][id]
        ├─ span.wizard-marker[aria-hidden]     (number / ring / check / lock / dash — all CSS)
        └─ div.wizard-item-body
             ├─ h4.wizard-item-title (+ span.wizard-tag)
             ├─ p.wizard-item-desc
             └─ div.wizard-item-actions → a/button.wizard-btn · button.wizard-text-btn[data-wizard-skip] · label.wizard-ack
```

Give every item a stable `id` (the save snapshot and events use it). Use real headings in order (`h2` title → `h3` group → `h4` task, shifted to fit the page).

## States and how they look

| State | Server writes | Marker | Title | Body |
| --- | --- | --- | --- | --- |
| todo | — | grey circle with its number | normal | desc + actions |
| current | `aria-current="step"` (the kit recomputes it) | accent ring 3px + halo (plain: bold ring) | normal | lit soft card |
| done | `data-done` | filled green + drawn check (plain: green check only) | struck through, muted | desc and actions hidden |
| skipped | `data-skipped` (only for `data-optional`) | dashed circle with "—" | italic, muted | actions hidden |
| locked | `data-locked` (`="manual"` = only the app opens it) | lock (body + shackle, CSS) | muted | actions hidden; links inert |
| new | `data-wizard-new` with `data-done` | (shown as todo, then checked with fireworks after the entrance) | | |

The kit computes **current** = the first task that is not done, not skipped, not locked. A `data-locked` task opens (rattle + pop + sparks) when every earlier *required* task (not `data-optional`) is done or skipped.

## Card checklist (default)

```html
<section class="wizard wizard-tilt" data-wizard="checklist" data-wizard-save="onboarding" aria-labelledby="ob-title"
         data-label-progress="{done} / {total} done" data-label-next-task="Next: {title}"
         data-label-expand="View tasks" data-label-collapse="Hide tasks" data-label-all-done="All done!">
  <header class="wizard-head">
    <p class="wizard-eyebrow">Getting started</p>
    <h2 class="wizard-title" id="ob-title">Finish setup, <mark>get a free lesson</mark></h2>
    <p class="wizard-sub">Five short tasks. Your progress is saved to your account.</p>
  </header>
  <div class="wizard-banner" data-wizard-complete hidden>
    <span class="wizard-trophy" aria-hidden="true">🎉</span>
    <strong>All set — your free lesson is unlocked!</strong>
    <a class="wizard-btn wizard-btn-small" href="/book">Book it now</a>
  </div>
  <h3 class="wizard-group-title">Your profile</h3>
  <ol class="wizard-list">
    <li class="wizard-item" data-wizard-item id="ob-email" data-done>
      <span class="wizard-marker" aria-hidden="true"></span>
      <div class="wizard-item-body"><h4 class="wizard-item-title">Verify your email</h4></div>
    </li>
    <li class="wizard-item" data-wizard-item id="ob-bio" data-optional>
      <span class="wizard-marker" aria-hidden="true"></span>
      <div class="wizard-item-body">
        <h4 class="wizard-item-title">Write a short bio <span class="wizard-tag">Optional</span></h4>
        <p class="wizard-item-desc">Two sentences about what you want to learn.</p>
        <div class="wizard-item-actions">
          <a class="wizard-btn wizard-btn-small" href="/profile/bio">Write bio <span class="wizard-arrow" aria-hidden="true">→</span></a>
          <button type="button" class="wizard-text-btn" data-wizard-skip>Skip</button>
        </div>
      </div>
    </li>
  </ol>
  <h3 class="wizard-group-title">Before your first lesson</h3>
  <ol class="wizard-list">
    <li class="wizard-item" data-wizard-item id="ob-rules">
      <span class="wizard-marker" aria-hidden="true"></span>
      <div class="wizard-item-body">
        <h4 class="wizard-item-title">Read the lesson rules</h4>
        <p class="wizard-item-desc">Cancel at least 3 hours before. Be on time.</p>
        <div class="wizard-item-actions"><label class="wizard-ack"><input type="checkbox" data-wizard-ack> I have read the rules</label></div>
      </div>
    </li>
    <li class="wizard-item" data-wizard-item id="ob-test" data-locked>…</li>
  </ol>
</section>
```

- `data-wizard-done` on a button = done on click (in-page actions). A **link to another page** should not carry it — the click would navigate away mid-animation; the server renders `data-done` (+ `data-wizard-new`) when the user comes back and the kit plays the check-off then.
- `data-wizard-ack` checkbox: checking = done, unchecking = undo. When done the checkbox stays visible so it can be unchecked.

## Plain task section — the "Release your app" pattern

Modeled on store-console release pages: a page of flat sections, each with an illustration at inline-start and a thin checklist. No card, no shadow — the content is the design. Use it inside settings, release, launch, compliance or admin pages where several checklists sit together.

```
[ art ]   Let anyone sign up to test your app                      ← .wizard-title (600, 1.35rem)
          With open testing, anyone can join your tests. …         ← .wizard-sub (muted, full width)
          ███▒▒▒▒▒▒▒▒▒▒▒  1 of 4 complete  ⌃                       ← thin two-tone bar + text + toggle
          Set up your open test track                               ← .wizard-group-title (muted, 1rem)
          ✓  S̶e̶l̶e̶c̶t̶ ̶c̶o̶u̶n̶t̶r̶i̶e̶s̶ ̶a̶n̶d̶ ̶r̶e̶g̶i̶o̶n̶s̶
          │
          Create and roll out a release
          ○  Create a new release ›                                 ← current: bold ring + link with ›
          🔒 Preview and confirm the release                        ← locked: lock, no ›
          🔒 Send the release for review
──────────────────────────────────────────────────────────────────  ← divider between sections (.wizard-stack)
[ art ]   Build excitement with pre-registration
          With pre-registration, you can publish …
          View tasks ⌄                                              ← collapsed (data-wizard-collapsed)
```

```html
<section class="wizard wizard-plain" data-wizard="checklist" data-wizard-save="open-testing" aria-labelledby="open-title"
         data-label-progress="{done} of {total} complete" data-label-expand="View tasks" data-label-collapse="Hide tasks">
  <figure class="wizard-art" aria-hidden="true"><img src="/img/wizard/open-testing.webp" alt="" width="240" height="240"></figure>
  <header class="wizard-head">
    <h3 class="wizard-title" id="open-title">Let anyone sign up to test your app</h3>
    <p class="wizard-sub">With open testing, anyone can join your tests. Testers can give feedback without it affecting your public rating.</p>
  </header>
  <h4 class="wizard-group-title">Set up your open test track</h4>
  <ol class="wizard-list">
    <li class="wizard-item" data-wizard-item id="open-countries" data-done>
      <span class="wizard-marker" aria-hidden="true"></span>
      <div class="wizard-item-body"><h5 class="wizard-item-title">Select countries and regions</h5></div>
    </li>
  </ol>
  <h4 class="wizard-group-title">Create and roll out a release</h4>
  <ol class="wizard-list">
    <li class="wizard-item" data-wizard-item id="open-release">
      <span class="wizard-marker" aria-hidden="true"></span>
      <div class="wizard-item-body">
        <h5 class="wizard-item-title"><a class="wizard-link" href="/releases/new">Create a new release</a></h5>
        <p class="wizard-item-desc">Shown only while this task is current.</p>
      </div>
    </li>
    <li class="wizard-item" data-wizard-item id="open-preview" data-locked>
      <span class="wizard-marker" aria-hidden="true"></span>
      <div class="wizard-item-body"><h5 class="wizard-item-title"><a class="wizard-link" href="/releases/preview">Preview and confirm the release</a></h5></div>
    </li>
  </ol>
</section>
```

Plain-look details (all in `wizard.css`): markers 1.35rem; done = green check glyph only; current = a 2.5px ring; todo = a 1.5px ring; lock = outlined body with a keyhole dot + shackle; connector 1px; the bar 0.5rem in a light green track with dark green fill, the comet hidden until a change flares it; title weight 400 (done keeps the ink color with a 1.5px strike); the task description only shows on the current task; `.wizard-link` adds "›" (mirrored "‹" in RTL) and loses it when locked or done. Collapsed: description stays, bar hides, the toggle reads "View tasks ⌄". Narrow screens: the art moves above the title (6rem).

A **notice** at the top of a section (granted access, a warning) uses `.wizard-note`; it stays visible when collapsed. The completion banner of a plain section is a neutral tinted box.

## Stack of sections

```html
<div class="wizard-stack">
  <h2 class="wizard-stack-title">Release your app</h2>
  <section class="wizard wizard-plain" data-wizard="checklist" …>…</section>
  <section class="wizard wizard-plain" data-wizard="checklist" data-wizard-collapsed …>…</section>
  <section class="wizard wizard-plain" data-wizard="checklist" …>…</section>
</div>
```

Sections are divided by a 1px line. Each section enters on its own when scrolled into view (title smash, art drop-in, items fly in) — the page assembles itself while the reader scrolls. Collapse sections that are not started or fully done; keep the one in progress open.

## Tiles

`.wizard.wizard-tiles` — same markup; the list becomes a grid (`minmax(13rem, 1fr)`), connectors hidden, each item a card; the current card glows with an accent border; done cards are tinted green. Use for free-order tasks (`data-optional` on all of them). The check-off adds a jelly squash of the whole tile.

## Dock and collapsed peek

`.wizard.wizard-dock` is `position: fixed` at the bottom inline-end corner (≤ 24rem wide). With `data-wizard-collapsed` it shrinks to a pill: the ring with the percentage and "Next: …" — clicking it opens the checklist. A check-off while collapsed opens it so the fireworks are seen. One dock per page; never over the main call to action on phones (put it in a page-level layout that leaves room).

Any card checklist collapses with the generated toggle; the peek (ring + next title) replaces the bar and description. The state is remembered when `data-wizard-save` is set.

## Anatomy: one-step wizard

```
form.wizard[data-wizard=steps][data-wizard-transition]
├─ header.wizard-head
├─ div.wizard-meter (generated)  → .wizard-progress
├─ ol.wizard-rail   (generated)  → li > button.wizard-dot[data-wizard-go] + span.wizard-rail-label
├─ div.wizard-stage (generated wrapper; steps share one grid cell)
│   ├─ section.wizard-step[data-wizard-step][data-wizard-title]   → .wizard-icon? h3.wizard-step-title p.wizard-step-lead fields…
│   └─ section.wizard-step.wizard-finale[data-wizard-step][data-wizard-finale]
├─ div.wizard-nav   (generated unless the page has [data-wizard-next]) → Back (ghost) · Next (gradient, arrow)
└─ p.wizard-sr[aria-live=polite] (generated)
```

- `data-wizard-title` names the rail dot (else the step's first heading).
- The finale is not a rail dot; reaching it fills the bar to 100 %.
- `data-wizard-free` lets the rail jump to any step; otherwise only to visited ones.
- `data-wizard-save="key"` resumes at the last step on reload.
- Put your own `[data-wizard-next]` / `[data-wizard-back]` buttons anywhere (e.g. inside each step) to replace the generated nav.
- Without JS all steps show one after another as a single long form with its own submit button — keep a real `<button type="submit">` in the last step for that case.

## Top rail and side rail

- **Top rail** (default): dots 2.25rem on a 4px line; the line fills (green → accent) up to the current dot; the current dot is a gradient disc scaled 1.16 with a halo and 3 pulse rings; done dots are green with a drawn check; labels under the dots (hidden below 40rem — the step title says it).
- **Side rail** `.wizard-side` (≥ 52rem): a soft panel at inline-start with the dots in a column, labels beside them, vertical connectors; header across the top; progress, stage and nav at inline-end. Below 52rem it falls back to the top rail.

## Fields and choice cards

```html
<label class="wizard-field">Nickname <input name="nick" required minlength="2"><span class="wizard-hint">2 letters or more.</span></label>

<fieldset class="wizard-choices">
  <legend>What is your goal?</legend>
  <label class="wizard-choice"><input type="radio" name="goal" value="talk" required>
    <span class="wizard-choice-icon" aria-hidden="true">💬</span><span class="wizard-choice-title">Speak with confidence</span><span class="wizard-choice-desc">Daily conversation</span></label>
  …
</fieldset>
```

Fields: 2.9rem tall, 0.9rem radius, accent focus ring, red border on `:user-invalid`. Choice cards: a grid of cards (≥ 10rem), the input visually hidden but focusable, the checked card gets the accent border, soft fill, a ✓ badge popping in and a jelly squash; keyboard focus shows an outline. Use checkboxes the same way for multi-select.

## Finale, banner, notice

- **Finale step** `.wizard-finale` — centered: `.wizard-trophy` (emoji or `<img>`), `h3.wizard-step-title.wizard-finale-title`, a lead line, one call to action (`data-wizard-cta`, maybe `.wizard-tilt`).
- **Banner** `[data-wizard-complete]` (class `.wizard-banner`) — `hidden` until every task is done or skipped; trophy + strong line + optional button. The server renders it visible when the list is already complete.
- **Notice** `.wizard-note` — `.wizard-note-icon` (✓ in a ring) + `.wizard-note-title` + text with a link; `role="status"` when it reports a change.

## Art

- Plain sections and finales look best with a **flat illustration** (soft shapes, 2–4 brand colors, lots of white) in a 1:1 frame, one per section, same style for all sections. Make the pictures with the project's image tool (SONUB: Codex CLI only) and save them as WebP with `width`/`height`; decorative → `alt=""` + `aria-hidden`.
- Until art exists, `.wizard-art-tile` (an emoji in a tinted rounded square) is an acceptable placeholder. Never draw illustrations with CSS shapes.
- Art acts too: drops in with squash on entrance, hops twice when the section completes.

## Theming, dark mode, RTL, mobile

Override tokens in your CSS (never edit `wizard.css`):

```css
.wizard {
  --wizard-accent: var(--brand);          /* gradient start, current ring, links */
  --wizard-accent-2: var(--brand-2);      /* gradient end, comet */
  --wizard-ok: var(--success);  --wizard-ok-ink: #fff;
  --wizard-surface: var(--surface);       /* card background — set it for class-based dark themes (Canvas only follows color-scheme) */
  --wizard-radius: 1rem;  --wizard-dot: 2.25rem;  --wizard-gap: 1.25rem;
  --wizard-burst: var(--brand), gold, #fff;               /* spark colors (comma list) */
  --wizard-confetti: #7c3aed, #ec4899, #f59e0b, #10b981;  /* confetti colors */
}
```

- Lines, muted text and soft fills are mixed from `currentColor`, so a dark theme only needs `--wizard-surface` (and maybe brighter accents).
- RTL: everything uses logical properties; JS sets `.wizard-rtl` (`--wizard-sx: -1`), transitions and nudges mirror, arrows flip.
- Mobile: one column, rail labels hidden, art above the title, buttons ≥ 44px, the dock shrinks to a pill.
- Print shows every step and the whole list; forced-colors mode drops gradients and particles.
