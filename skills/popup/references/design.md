# How the card looks and behaves

The rules behind `assets/popup.js` and `assets/popup.css`, and why. Read before changing the kit or building the same thing inside a project's own framework.

## Contents

- [Principles](#principles)
- [Triggers](#triggers)
- [Behaviour](#behaviour)
- [Matching rules](#matching-rules)
- [Look and theming](#look-and-theming)
- [Accessibility and RTL](#accessibility-and-rtl)
- [Things that broke before](#things-that-broke-before)
- [Browser checklist](#browser-checklist)

## Principles

1. **Top to bottom in one read** — term · reading · category → one-line meaning (bold) → explanation → in plain words → example → code → related → learn more. Wherever the reader stops, what they read was useful.
2. **Boxes only for different jobs** — "In plain words" (accent tint, thick start border), "Example" (lowered background) and "Code" (bordered, with copy). Everything else is separated by space.
3. **Small but readable** — body ~0.88rem, line height 1.6, bold one-line meaning, width ≤ 24rem, height ≤ 70% of the screen (scrolls inside).
4. **One card per page.** Every trigger shares it. Related chips switch the card in place — no stacked popups: stacks get lost behind each other, and anything attached to the card (a voice reading it aloud, a "copied" state) would not know which card it belongs to.
5. **No tabs.** If a card needs tabs, it is too long — shorten it and move depth to the `href` page.
6. **Design in CSS only.** Markup carries structure and meaning classes; colours, spacing and direction come from CSS variables and logical properties.

## Triggers

| Trigger | Markup | Opens on | Click |
| --- | --- | --- | --- |
| word in text (automatic) | plain text inside `main`, `article`, `[data-popup-root]` (`data-root` to change) → `<button class="popup-term" data-term="id" title="short">` | mouse over, keyboard focus | pin / unpin |
| explicit word, phrase or sentence | `<span data-term="id">…</span>` (any non-interactive element) | mouse over, focus (made focusable) | pin / unpin |
| "?" button | `<button class="popup-info" data-term="id"></button>` | mouse over, focus | pin / unpin |
| element with its own job | `<a href data-term="id" data-term-label="Title">`, `<button data-term>`, `[role=tab][data-term]`, `[data-term-action]` | mouse only, after resting **400 ms** | **does its own job** (navigates, runs); the card closes |
| related chip | inside the card | — | switches the card |

- Use explicit markup for inflected forms automatic matching misses, for sentences/concepts (`match: false`), and inside places automatic wrapping skips (headings, links, buttons, `code`, `pre`, `[data-no-popup]`).
- Links and cards: **always add `data-term-label`** — otherwise the card title briefly shows the element's whole text. Phones and keyboards never open on links (navigating comes first), so put a `popup-info` **next to** (not inside) the link or card for them.
- A section whose words mean something special: `data-popup-scope="shell"` — terms with `"scope": "shell"` match only there.
- Wrapping happens once per root (the first use of each term). `data-popup-once="false"` on a root, or `data-once="false"` on the script, wraps every use.

## Behaviour

| Rule | Why |
| --- | --- |
| mouse-opened card closes 160 ms after leaving word and card | moving from the word onto the card must not close it |
| click pins; a pinned card is not stolen by the mouse passing other words | the reader can read without the card jumping |
| click the same word again, ×, Esc, or press outside → closes | many obvious ways out |
| Esc returns focus to the word **without reopening it** | keyboard users land where they were (a one-shot flag skips the reopening focus) |
| keyboard Enter/Space on a word moves focus into the card | so chips and "learn more" are reachable with Tab |
| focus leaving word and card closes it | no orphan card |
| the word's `title` is removed while the card is open, restored after | the browser tooltip would cover the card; without JavaScript the `title` still explains |
| card follows scroll and resize; closes if the word leaves the DOM | single-page apps re-render under it |
| ≤ 640px: bottom sheet, full width | a tiny card next to a finger covers the text and has tiny buttons |
| flips above the word when there is no room below | never cut off by the screen edge |

## Matching rules

Shared by `popup.js` and `popup.py`. Longest spelling first (so "API key" wins over "API"), scoped terms before site-wide ones, then glossary order.

| Script | Before the word | After the word |
| --- | --- | --- |
| Latin and digits | no Latin letter/digit/`_ $ # {`, and not `letter.` (`index.html` does not match `html`) | no Latin letter/digit/`_ [`/combining mark, and not `.letter` — a sentence-final full stop is fine. Hangul or kana right after is fine (`LLM이`, `APIを`) |
| Cyrillic | no Cyrillic letter | the rest of the word is taken (`токены`) |
| Hangul | no Hangul | either not Hangul, or a Korean particle/ending (`토큰을` ✓, `토큰화` ✗, `커밋합니다` ✓) |
| Arabic script | no Arabic letter, except word prefixes (`ال و ب ل ك ف` and combinations) | the rest of the word, without punctuation |
| Devanagari, Bengali | no letter of the same script | combining marks are kept |
| CJK, kana, Thai | — (no spaces between words) | combining marks are kept |

Spaces inside a spelling match any whitespace between Latin words, and are optional between other scripts (`API키`, `API密钥`). Matching is case-insensitive unless `case`/`exact`.

## Look and theming

Override variables on `:root` (or any ancestor):

| Variable | Default (light) | Use |
| --- | --- | --- |
| `--popup-accent` | `#6d4bd8` | term title, underline, chips, links — set it to the project's brand colour |
| `--popup-bg` / `--popup-fg` / `--popup-muted` | white / near-black / grey | card surface and text |
| `--popup-border` / `--popup-code-bg` / `--popup-soft` | | borders, code and example background, plain-words tint |
| `--popup-radius`, `--popup-width`, `--popup-font-size`, `--popup-font-code`, `--popup-z`, `--popup-shadow` | | shape, size, stacking |

Dark values apply with `prefers-color-scheme: dark` (unless `<html data-theme="light">` or `.light`), and with `data-theme="dark"`, `.dark` or `.theme-dark` on `<html>`/`<body>`. For a design system, map the variables to its tokens in one rule, e.g. `:root { --popup-accent: var(--brand-600); --popup-bg: var(--surface-raised); }`.

## Accessibility and RTL

- Words are `<button>`s (or get `role="button"` + `tabindex="0"`), with `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`. The card is `role="dialog"` with a label.
- Not by colour alone: a dotted underline marks every word; the "?" button has a visible circle.
- Only logical properties (`margin-inline-start`, `inset-inline`, `border-inline-start`), so `dir="rtl"` pages work. English words inside RTL text keep their own direction (`unicode-bidi: plaintext`); code is always `dir="ltr"`; the "learn more" arrow is mirrored.
- Text is inserted with `textContent` only — glossary strings cannot inject HTML. Inline `` `code` `` is the only formatting.
- Print: the card is hidden and underlines removed.

## Things that broke before

From the SONUB implementation and its predecessor:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Esc did not close | giving focus back to the word reopened it | one-shot "skip next focus" flag |
| question mark showed as a box | icon font `content: '\f059'` with a wrong font name | draw "?" with text/CSS, not an icon font |
| list items centred | `display: grid` inherited `justify-items` | `display: flex` + `align-items: flex-start` |
| punctuation detached ("word .") | template output left a newline after the word | emit the wrapped word without surrounding whitespace |
| card off-place on narrow RTL pages | sideways-overflowing page shifts the `fixed` origin | measure where the card landed and correct by the difference |
| chips and Esc dead (reactive framework) | an effect re-read the state it wrote; DOM elements put in reactive state | keep DOM nodes and timers out of reactive state |
| regex "too large" with hundreds of Korean terms (PHP) | the particle list was repeated for every spelling | define shared parts once (PCRE `(?(DEFINE)…)`), or split the pattern |
| a French/Vietnamese word wrapped everywhere | everyday word used as `term` | longer phrase as `term`, unambiguous alias only |

## Browser checklist

Hover opens, leaving closes, the gap between word and card does not close it · click pins, second click closes · chip switches · Esc closes and focus returns without reopening · Tab onto a word opens, Enter moves into the card · link with `data-term` opens only after a rest and still navigates on click · "learn more" lands on the right page · ≤ 640px bottom sheet, scrollable, close reachable · another locale · RTL · dark theme · no console errors.
