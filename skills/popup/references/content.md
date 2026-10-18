# Writing the card

How to write an explanation a beginner understands in one read, in every language the project ships, and how to get it into the glossary without gaps.

## Contents

- [The idea](#the-idea)
- [Fields](#fields)
- [Term settings](#term-settings)
- [Style](#style)
- [Kinds of entries](#kinds-of-entries)
- [Spellings, aliases and false matches](#spellings-aliases-and-false-matches)
- [Many languages](#many-languages)
- [A complete entry](#a-complete-entry)
- [Adding entries](#adding-entries)

## The idea

- **Read at the moment of being stuck.** The reader stopped mid-paragraph and wants to understand in a few seconds and go back. So the card goes from top to bottom: one-line meaning → explanation → comparison → example → code → related → learn more, and **stopping anywhere still leaves something useful**.
- **Detailed, but in layers.** Not one long block: each layer is short, and the deep material lives on the page `href` points to. If you need more than the lengths below, split it — `easy`, `example`, `related`, or a page of its own.
- **One source.** The same term reads the same on every page, menu and tooltip, and anything else that explains it (a chatbot, a voice reader, a printed glossary) uses the same text. That is why the facts must be right.

## Fields

Per locale, inside `text.<locale>`:

| Field | Required | Where it shows | How to write it | Length (rough) |
| --- | --- | --- | --- | --- |
| `term` | ✅ | card title (accent colour) | the word as people of that language actually write it. To show the original too, put it in brackets: `명령줄(CLI)`, `التوكن (Token)` — the part before the bracket is also matched in text | one word or short phrase |
| `short` | ✅ | bold line under the title; the `title` of the word | a **noun phrase**, no full stop, that tells this term apart from its neighbours | en 60 chars · ko/ja/zh 25 |
| `long` | ✅ | body | two or three sentences (four at most): ① what it is ② why it matters / where you meet it ③ one common misunderstanding, if there is one. Blank line = new paragraph; `` `code` `` is shown as code | en 420 chars · ko 250 |
| `easy` | optional* | "In plain words" box | **one** everyday comparison. Leave it out if `long` already uses one | en 110 · ko 60 |
| `example` | optional* | "Example" box | one item per line (`\n`). A line that starts with `` `code` `` is drawn as code + note. **Code is identical in every locale** — translate only the notes. Commands: 3–5 lines of common options. Concepts: 1–3 lines. No made-up examples that teach nothing | per line en 70 · ko 40 |
| `code` | optional* | code box with a copy button | a short, **runnable** snippet (≤ 15 lines) when the term is best understood by seeing code. Comments may be translated; the code itself is not. Set the language once per term in `codeLang` | ≤ 15 lines |
| `reading` | optional | grey, after the title | pronunciation or reading: `jay-son`, `에이피아이`, `とーくん`, IPA. Useful for acronyms and for language-learning pages | short |
| `aliases` | optional | — | other spellings **this language's text really uses**, comma-separated: plurals and inflections (`endpoints`, `токены`), variant spellings (`셸, 쉘`) | — |
| `href` | optional | "Learn more" | a per-locale page, overriding the term's `href` | — |

\* `easy`, `example` and `code`: **if one locale has it, every locale has it** (`check` enforces it). `aliases`, `reading` and `href` may differ per locale.

Rules that `check` enforces: no backtick inside example code (it would end the code early — use `$( )` for shell substitution); the code column of `example` matches across locales line by line.

## Term settings

Outside `text`, language-independent:

| Setting | Rule |
| --- | --- |
| id (the key) | lowercase letters, digits, hyphens; short English (`context-window`). **Never rename** — pages, `related` and links point at it |
| `category` | a key of `categories` (each with a label per locale). Shown as a chip |
| `aliases` | spellings shared by every language: acronyms (`LLM`), the English original (`fine-tuning`). Two-letter Latin aliases match inside other words easily — add them only when clearly worth it (`check` warns) |
| `related` | 2–3 ids, preferably terms the `long` text itself uses. Chips switch the card in place |
| `href` | the page of **this project** that explains more — a doc, a tutorial step, an API reference anchor. Relative to the glossary file (`../docs/api.md#auth`); `/absolute` site paths and full URLs also work; `{locale}` is replaced (`/{locale}/docs/api`). `check` verifies relative targets exist (and `/absolute` ones with `--site-root`) |
| `codeLang` | language of `code` (`json`, `bash`, `python`) — shown as the code box label and set as `class="language-…"` for highlighters |
| `match: false` | never searched in text — sentences, concepts, menu help. Only explicit `data-term` markup opens it |
| `auto: false` | a real word but too common in plain English to find automatically (shell commands `for`, `set`, `read`, `cut`) — explicit markup only |
| `scope` | meaning only right in one section (shell "prompt" vs AI "prompt"): `"scope": "shell"` matches only inside `data-popup-scope="shell"`, and wins there over a site-wide term with the same spelling |
| `case: true` · `exact: [...]` | match only with the same capitals (`cat` the command, not "Cat"); `exact` lists just the spellings that need it (`PATH`) |

**Order is priority.** If two terms have the same spelling in one locale, the one earlier in the file wins — `check` reports it as an error so you can fix the spelling or add a `scope`.

## Style

1. **Write for someone who has never heard the word.** Don't explain jargon with more jargon. If another term is unavoidable, it gets an entry too and goes in `related`.
2. **What → why/where.** A definition without "so why do I care" leaves the reader stuck again.
3. **One comparison, and it must not mislead.** If it misleads in one important way, say so in a phrase ("— but unlike a menu, …").
4. **Don't talk about software or AI as a person.** "computes", "picks", "produces" — not "thinks", "knows", "wants".
5. **Only checked facts.** Versions, limits, numbers, names: from the docs or by running it. Invented numbers are labelled as examples.
6. **Short sentences.** One idea per sentence; no chains of four commas.
7. **Same names as the page.** When a card mentions a menu or a page, use exactly the label the UI uses in that language.
8. **Tone of the project.** Match how the project's other texts address the reader (formal/informal, `du`/`Sie`, 합니다체, です・ます). Read two or three existing texts first.

## Kinds of entries

| Kind | Explains | `term` | `short` | `long` |
| --- | --- | --- | --- | --- |
| word / term | what a word means | the word | meaning as a noun phrase | what → why/where → one misunderstanding |
| concept | an idea spread over sentences ("next-word probability") | the concept's name | its core in one line | how it works, in two or three steps |
| sentence | one hard sentence on a page | a short title ("What this sentence means") | one-line summary | "Put simply, …" + why it matters here. Don't repeat the sentence. `match: false` |
| command / function / API | how to use one command or call | the exact name (same in every locale) | what it does (verb phrase) | what it does → common options → one pitfall. `example` lines like `` `ls -la` include hidden files``; `code` for a real snippet |
| menu / link | what a menu item or card opens | exactly the menu label | what you do on that page | what you learn there → how to use the page. `match: false`, id `menu-…` |
| screen help | a part of a screen (a button group, an editor, a progress bar) | the name the screen uses | what that part does | how to use it → what to do when stuck |

Ids that say what they are: `concept-next-word-probability`, `sentence-quickstart-auth`, `menu-python`.

## Spellings, aliases and false matches

Text is matched by `term`, the part of `term` before a bracket, `aliases` (shared) and `aliases` (per locale). Matching rules per script are in [design.md](design.md#matching-rules). Practical consequences:

- **Inflected forms** — in English `endpoints` needs to be an alias (Latin words must end at a word boundary). Korean particles are handled (`토큰을` ✓, `토큰화` ✗). Russian and Arabic suffixes are taken with the word.
- **Common words** — a term spelled like an everyday word (fr `tableau`, vi `biến`, en `set`) gets wrapped where it means something else. Fix by using a longer phrase as `term`, keeping only unambiguous forms as aliases, `scope`, or `auto: false`. After adding terms, run `popup.py audit` and read where each new term was found.
- **Text that doesn't match** — if the page writes the word differently from `term`, add that spelling as a per-locale alias, or mark the place by hand with `<span data-term="id">`.

## Many languages

- Write `en` (or the project's main language) first; translate **the meaning**, not the English sentence. If the comparison is odd in a culture, use another comparison with the same job.
- `term` is the word people of that language actually use — look at the project's existing translations first; don't invent words.
- Punctuation of that language (ja `。`, hi `।`, ar `،` `؟`). Right-to-left languages use the same structure; the CSS handles direction.
- **Many terms × many languages** — write the main language (and one more you check yourself), then give each remaining language to a separate helper (sub-agent) in parallel, with: the project's style rules, the source JSON, the existing vocabulary of that language (so `term` matches the words the pages use), "code is never translated", and the instruction to run `popup.py check` on its file until it is clean. Collect the files into one input and merge with `popup.py add`. The SONUB profile has a full brief template that worked for 106 terms × 15 languages (`references/projects/sonub/translate-brief.md`).
- A project may also keep one glossary file per locale (`glossary.ko.json`): `popup.js` loads `data-glossary="/popup/glossary.{locale}.json"`, and `popup.py check popup/glossary.*.json` checks them together.

## A complete entry

```json
"sampling": {
  "category": "ai",
  "aliases": ["sampling"],
  "related": ["temperature", "token"],
  "href": "../learn/how-llms-write.md#sampling",
  "text": {
    "en": {
      "term": "Sampling",
      "short": "Picking the next word by a weighted draw",
      "long": "When a language model writes, it gives every possible next token a probability. Sampling means drawing one of them at random, with likelier ones drawn more often, instead of always taking the top one. That is why the same question can get a slightly different answer each time.",
      "easy": "It is like pulling a ball from a bag where likely words have more balls inside.",
      "example": "Candidates: cat 60%, dog 30%, car 10% — about three draws in ten give dog."
    },
    "ko": {
      "term": "샘플링",
      "short": "확률에 따라 제비를 뽑듯 다음 낱말을 고르기",
      "long": "언어모델은 글을 쓸 때 다음에 올 수 있는 토큰마다 확률을 매깁니다. 샘플링은 늘 1등만 고르지 않고, 확률이 높을수록 자주 뽑히게 제비를 뽑아 하나를 고르는 방식입니다. 그래서 같은 질문에도 답이 조금씩 달라질 수 있습니다.",
      "easy": "가능성이 큰 낱말일수록 공이 많이 든 주머니에서 공 하나를 꺼내는 것과 같습니다.",
      "example": "후보가 고양이 60%, 강아지 30%, 자동차 10%이면 열 번 중 세 번쯤 강아지가 뽑힙니다."
    }
  }
}
```

## Adding entries

1. Put new terms (and any new `categories`/`labels`) in one input file, same shape as the glossary: `{"terms": {"sampling": {…}}}`.
2. `python3 scripts/popup.py add new.json --dry-run` — checks the merged result (every locale, shared optional fields, example code, related ids, links, spelling clashes) and refuses to change existing values. Fix and repeat until clean, then run it without `--dry-run`. Change existing text only when asked, with `--overwrite`.
3. `python3 scripts/popup.py check`, then `audit` the pages to see the new terms are found where you expect — and nowhere they mean something else.
4. Delete the input file (it is not the source; the glossary is).
