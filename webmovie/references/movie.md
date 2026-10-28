# The player — HTML scenes that play like a video

The movie is what webmovie is named after. A movie is a sequence of scenes that plays one after another with a play/pause button and a progress bar — a promo clip, a product explainer, an animated title sequence, a data story. Every scene is ordinary HTML in the page, so it is indexed, translated and editable. Without JS or with reduced motion the scenes are simply the page: sections one after another (a storyboard).

## Contents

- [Storyboard first](#storyboard-first)
- [Markup](#markup)
- [How it plays](#how-it-plays)
- [Directing a scene](#directing-a-scene)
- [Scene recipes](#scene-recipes)
- [Accessibility and SEO](#accessibility-and-seo)
- [Core code](#core-code)
- [Check](#check)

## Storyboard first

Before any markup, write the storyboard as a short table — it is the plan of the movie and the report to the user:

| # | Scene heading (= scene button) | Shots | Exit · hold |
| --- | --- | --- | --- |
| 1 | Text that moves — and stays text. | `mask` headline · `soft-blur` line · camera push | `up` · auto |
| 2 | Search engines read it. | `converge` · `words` · rotating word | `zoom` · auto |
| 3 | One source, every language. | `flip` · `count` 17 · `pie` 83 % | `side` · 5 s |
| 4 | Start today. | `bounce` · `stagger` buttons with `webmovie-border-glow` | last scene, stays |

- Every heading and line comes from the page's content (language file, CMS, Markdown) — the storyboard never invents numbers; missing values are left as gaps and asked for.
- Read it top to bottom without the motion: if the scenes alone tell the story, the movie works for crawlers, translators and screen readers too.

## Markup

```html
<section class="stage" data-webmovie-player aria-label="What webmovie does"
         data-label-play="Play" data-label-pause="Pause" data-label-replay="Replay" data-label-scene="Scene">
  <span class="blob webmovie-ambient" aria-hidden="true"></span>            <!-- decoration, drifts only while playing -->

  <section class="webmovie-scene webmovie-push">                              <!-- slow camera push over the scene -->
    <p class="kicker" data-webmovie="fade">webmovie</p>
    <h1 data-webmovie="mask">Text that moves — and stays text.</h1>
    <p data-webmovie="soft-blur">No video files: every word is HTML.</p>
  </section>

  <section class="webmovie-scene" data-webmovie-exit="zoom">
    <h2 data-webmovie="converge">Search engines read it.</h2>
    <p data-webmovie="words">Headings, numbers and links stay in the page.</p>
  </section>

  <section class="webmovie-scene" data-webmovie-hold="5000" data-webmovie-exit="side">
    <h2 data-webmovie="flip">One source, every language.</h2>
    <data value="17" data-webmovie="count">17</data>
    <div class="webmovie-pie" data-webmovie="pie" style="--pct: 83" role="img" aria-labelledby="pie-l"><b id="pie-l">83%</b></div>
  </section>
</section>
```

| Attribute / class | On | Meaning |
| --- | --- | --- |
| `data-webmovie-player` | wrapper | makes its direct `.webmovie-scene` / `[data-webmovie-scene]` children a movie |
| `data-label-play` · `-pause` · `-replay` · `-scene` | wrapper | button labels — write them from the language file (read on every state change) |
| `data-webmovie-loops` | wrapper | extra rounds after the end (default 0 — stops on the last scene) |
| `data-webmovie-hold` | scene | scene length in ms (default: elements × cascade + 1.4 s + reading time) |
| `data-webmovie-autoplay` | player | `off` — the first scene stands still (plain HTML) until ▶; default: plays when ≥ 35 % in view |
| `data-webmovie-exit` | scene | `up` (default: fade + rise 48px + blur) · `zoom` (1.3, blur 16px) · `side` (−18 %, blur) · `whip` (−40 % smear, 480 ms) · `drop` (falls and tilts) · `fade` |
| `webmovie-push` | scene | slow 4.5 % camera push for the scene's length |
| `webmovie-ambient` | any decoration inside | drifts while playing, stops on pause and at the end |
| `?webmovie-scene=k` + `?webmovie-t=s` | page URL | freeze scene *k* at *s* seconds (screenshots, `check.mjs`) |

Write the label values and every scene text from the language file; nothing in the movie is hard-coded English except the fallbacks.

## How it plays

1. When ≥ 35 % of the movie is on screen (and the tab is visible) it starts at scene 1; off screen or in a hidden tab it pauses; back on screen it resumes — unless the reader pressed pause (the button wins).
2. A scene starts: it becomes visible (`.webmovie-scene-on`, `inert` removed); its `[data-webmovie]` elements play in DOM order, `--webmovie-cascade` (100 ms) apart, plus each element's own `data-webmovie-delay`. Its progress segment fills over the scene length.
3. After the hold, the scene exits (`.webmovie-scene-off`, 600 ms), its elements are first put back to plain text, and the next scene starts halfway through the exit (cross-fade).
4. After the last scene: the movie rests on it, the button becomes ↻ Replay. Segments are buttons labelled with each scene's heading — click to jump.
5. The scenes share one grid cell: the movie's height is the tallest scene, so nothing below jumps when scenes change.

API: `webmovie.pause(movie)`, `webmovie.resume(movie)`, `webmovie.go(movie, k)` — e.g. after a language switch: change the texts and labels, then `webmovie.go(movie, 0)`.

## Directing a scene

Think like an editor cutting a 20–40 s clip:

- **One idea per scene**: one headline + at most one supporting line or one number. A scene that needs a paragraph is a page section, not a scene.
- **Hold for reading**: the default hold adds ≈ 0.3 s per word (≥ 1.5 s) after the reveals — counted with `Intl.Segmenter` in the scene's language, so a Japanese scene gets as much time as its English one. Override with `data-webmovie-hold` only to slow down, rarely to speed up.
- **Vary the entrance per scene, keep one per moment**: scene 1 `mask`, scene 2 `converge`, scene 3 `flip` + `count`, scene 4 `bounce` + `stagger` buttons. The same reveal four times is a slideshow; four different reveals on the *same* scene is noise.
- **Cut on motion**: exits are quick (480–600 ms, ease-in) and the next scene enters during the exit with a cut-in (`webmovie-scene-in`: rise 34px + blur 8px, 650 ms — it always completes, even when paused). Inside the scene act the hero shot bold ([acting.md](acting.md)): `smash` · `whip` · `assemble` title, a `count` that punches, a `stamp` with sparks. Use `zoom` exits to "push into" the next idea, `side` for "next step", `fade` for a quiet change.
- **Camera and atmosphere**: `webmovie-push` on 1–2 scenes, one or two blurred `webmovie-ambient` shapes in the background. They make the frame feel alive like footage without competing with the text.
- **End on the call to action**: the last scene holds forever (until Replay), so make it the one you want on screen — a link or button.
- **Numbers**: one big number per scene (`count`), with a short label line; a chart scene uses `pie`/`ring`/`bar`/`draw` with the values written as text next to it.
- **Length**: 3–6 scenes, 20–45 s total. Longer stories become a scroll page (scroll-triggered reveals) instead.

## Scene recipes

```html
<!-- Title card -->
<section class="webmovie-scene webmovie-push">
  <p class="kicker" data-webmovie="fade">Chapter 1</p>
  <h2 data-webmovie="slam">Start small.</h2>
</section>

<!-- Big number -->
<section class="webmovie-scene" data-webmovie-exit="zoom">
  <h2 data-webmovie="words">Learners this year</h2>
  <p class="big"><data value="12500" data-webmovie="count">12,500</data></p>
</section>

<!-- Comparison bars (a real list with values) -->
<section class="webmovie-scene">
  <h2 data-webmovie="mask">Where the time goes</h2>
  <dl data-webmovie="stagger">
    <div><dt>Writing</dt><dd><span class="webmovie-bar" data-webmovie="bar" style="--pct: 72"></span> 72%</dd></div>
    <div><dt>Review</dt><dd><span class="webmovie-bar" data-webmovie="bar" style="--pct: 48"></span> 48%</dd></div>
  </dl>
</section>

<!-- Quote -->
<section class="webmovie-scene" data-webmovie-exit="fade">
  <blockquote><p data-webmovie="reveal">“Everybody will become an AI company.”</p>
  <footer data-webmovie="fade" data-webmovie-delay="900">— <cite>Speaker, Event 2026</cite></footer></blockquote>
</section>

<!-- Call to action -->
<section class="webmovie-scene">
  <h2 data-webmovie="bounce">Edit it like text.</h2>
  <p data-webmovie="stagger"><a class="btn webmovie-lift webmovie-sheen" href="/start">Start</a></p>
</section>
```

## Accessibility and SEO

- Play/pause is always there (WCAG 2.2.2); the movie also pauses off screen and in hidden tabs, and stops at the end. Ambient motion stops with it.
- Non-current scenes are `inert` and `visibility: hidden` (not `display: none`) — they keep their place in the layout and the DOM. The current scene is a normal region; segment buttons are named by the scene headings and mark the current one with `aria-current="step"`.
- Reduced motion or no JS: no movie at all — all scenes in reading order, fully visible.
- Use real headings (`h1` once on the page, the other scenes `h2`), `data`, `blockquote`/`cite`, `figure`, lists. Crawlers read every scene in the HTML.
- No sound and no autoplay video are involved; if a scene must show footage, put a `<video>` with captions in it and keep the words as HTML around it.

## Core code

```js
// webmovie.js — movie(root)
const scenes = Array.from(root.children).filter((c) => c.matches('.webmovie-scene, [data-webmovie-scene]'));
root.classList.add('webmovie-player-on'); scenes.forEach((sc) => (sc.inert = true));
// controls: <div class="webmovie-controls"><button class="webmovie-toggle"> + one <button class="webmovie-seg"><span></span></button> per scene
function show(k) {
    // leaving scene: finish() its elements (plain text), .webmovie-scene-off for 600 ms, then reset() them (waiting again)
    // new scene: hold = data-webmovie-hold ?? elements × cascade + 1400 + readingTime(scene)   (Intl.Segmenter words × 280 ms, ≥ 1500)
    //            .webmovie-scene-on, inert = false, --webmovie-scene-dur on the scene and its segment, aria-current="step"
    //            play(element, (prev ? 300 : 0) + n × cascade) for each [data-webmovie] in DOM order
    //            setTimeout(next, hold + enter) while playing
}
// next(): next scene · or round < loops → scene 0 · or end (.webmovie-player-end, button → Replay)
// pause(user): clear the timer, remember the time left, .webmovie-player-paused (CSS pauses every animation inside)
// resume(user): blocked while the reader's own pause is active; at the end or before the start → go(0)
// IntersectionObserver threshold 0.35 + visibilitychange → resume(false) / pause(false)
// elements inside a scene are never observed on their own: prepare() puts them in .webmovie-wait for their scene
```

```css
.webmovie-player-on { display: grid; grid-template-columns: minmax(0, 1fr); }
.webmovie-player-on > .webmovie-scene { grid-area: 1 / 1; }
.webmovie-player-on > .webmovie-scene:not(.webmovie-scene-on, .webmovie-scene-off) { visibility: hidden; }
.webmovie-player-on > .webmovie-controls { grid-row: 2; display: flex; gap: 6px; }
@media screen and (prefers-reduced-motion: no-preference) {
  .webmovie-player-on > .webmovie-scene-off { animation: webmovie-scene-out 600ms var(--webmovie-ease-in) both; }
  .webmovie-seg-on > span::after { animation: webmovie-bar var(--webmovie-scene-dur) linear both; }
  .webmovie-player-paused *, .webmovie-player-paused *::after { animation-play-state: paused !important; }
  .webmovie-player-on > .webmovie-scene-on.webmovie-push { animation: webmovie-push var(--webmovie-scene-dur) linear both; }
  .webmovie-player-on:not(.webmovie-player-paused, .webmovie-player-end) .webmovie-ambient { animation: webmovie-drift 9s var(--webmovie-ease-inout) infinite alternate; }
}
@keyframes webmovie-scene-out { to { opacity: 0; translate: 0 -18px; filter: blur(6px); } }
@keyframes webmovie-push { from { scale: 1; } to { scale: 1.045; } }
```

Style the stage in your own CSS (padding, background, `min-block-size` of scenes, colors of `.webmovie-controls` via `color`). Give each scene `display: grid; align-content: center; min-block-size: …` so short scenes sit in the middle of the frame.

## Check

```bash
node scripts/check.mjs page.html                           # movies are paused and their scene finished before the text check
node scripts/check.mjs "page.html?webmovie-scene=2" --times 0.4,1.2,4   # frames of scene 3
```

Look at every scene at start / middle / end; a scene that reads badly frozen will read badly playing.
