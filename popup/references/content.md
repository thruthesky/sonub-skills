# Writing the card

How to write an explanation a beginner understands in one read, in every language the project ships, and how to get it into the glossary without gaps.

## Contents

- [The idea](#the-idea)
- [Fields](#fields)
- [Term settings](#term-settings)
- [Style](#style)
- [Kinds of entries](#kinds-of-entries)
- [Spellings, aliases and false matches](#spellings-aliases-and-false-matches)
- [Words with several meanings](#words-with-several-meanings)
- [The sense index](#the-sense-index)
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
| `cues` | ids (or scope names) that show **this** meaning when they appear near the word — "branch" (Git): `["git", "commit", "repository"]`. Defaults to `related`. Language-independent, because a cue is a term already found in the text of that language |
| `context: true` | an everyday word that is jargon only in some sentences ("branch", "network"). Wrapped only when a cue is in the same sentence, paragraph or topic — no evidence, no popup |
| `shares: [...]` | borrow another term's spellings as a candidate meaning: neural-network `"shares": ["network"]` — "the network learns" in a neural-network paragraph. A borrowed spelling always needs evidence |
| `avoid: {locale: [regex…]}` | phrases where the word means something else; a pattern that covers the word rules this meaning out ("differ in skill", "a prompt reply"). Per locale, because other languages usually use a different word for the other meaning |

**Same spelling, several meanings.** If two terms share a spelling in one locale, both stay candidates and the context chooses (next section). `check` reports an error when one of them has no `cues`, or both have the same cues — then the context can never pick the later one.

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

## Words with several meanings

One spelling can mean different things on one site: "branch" (a Git branch · a branch of a science), "skill" (an agent skill package · ability), "network" (computer network · neural network), "Grok" (a model family · a coding agent). A popup with the wrong meaning teaches the wrong thing — worse than no popup. So a word is explained **in the meaning its sentence uses**:

1. **Candidates** — every term that has the spelling (and every term that `shares` it) is a candidate. Scoped terms of this section (`data-popup-scope`) always come before site-wide ones.
2. **Evidence** — the other glossary terms already found nearby: the same sentence (weight 4), the same paragraph (1), the topics of the section (`data-popup-scope`, `data-popup-topic`, `--topic`; 2). Only unambiguous spellings count as evidence — "branch" itself proves nothing. Terms wrapped earlier on the page add at most 9 points, so they only break ties.
3. **Avoid** — a candidate whose `avoid` pattern covers the word is out (`avoid` is per locale; `"*"` applies to every locale — names that are never translated, like a product called *Sonub Code*). Where the text lives in translation keys, a candidate can also list the keys whose sentence never means it (`except`) or always means it (`keys`) — see below.
4. **Eligible** — `context: true` words need evidence in the sentence, paragraph or topic; borrowed spellings (`shares`) need it in the same sentence or topic, because the owner's meaning is always there ("runs without a network connection" in a long list that mentions parameters elsewhere is still a computer network). A far paragraph of the same page never makes an everyday word jargon (a course page with a Git chapter and a Python chapter: "the else branch" is not Git).
5. **Pick** — the eligible candidate with the highest score; equal scores → glossary order. None eligible → plain text.

Writing cues: pick terms that appear **only** around this meaning — `commit`, `repository` for Git; `weight`, `activation-function` for neural networks. Weak, everywhere words (`model`, `data`, `agent`) make wrong guesses: "two agents that use the same model differ in skill" is not about skill packages. When a few English phrases still pick the wrong meaning, add them to `avoid` rather than piling up cues.

**The meaning belongs to the source sentence.** "Needs attention" on a booking board means the same in every translation, so when a project's text lives in translation keys, fix one sentence by its key, not by a regex in each language: `except: ["bookingflow.attention"]` takes the term out of that sentence in all locales, `keys: ["tool-master.harness_part_memory"]` gives a borrowed or `context` meaning that sentence without other evidence (and puts it ahead of scoped terms). Placeholders (`:count`) match anything. Use `avoid` for a phrase that recurs across sentences ("pay attention", "driver's licence", "a six-digit code"); use keys for a single sentence found by the index.

**Hidden meanings of single-meaning terms.** A term with one meaning is wrapped everywhere its spelling appears, so its other meanings never show up as a clash: "skill" (ability), "attention" (pay attention), "code" (a six-digit code, a country code, a product name like *Sonub Code*), "ID" (an ID card), "local" (local time, a local person), "certificate" (a course certificate vs a TLS one), "server" (a waiter), "weight" (body weight), "shell" (an egg shell), "runner" (a jump-runner game). Find them with the doubt list (below): everyday spellings wrapped with **no evidence from any other term**. Read every sentence of the top terms; most are right, the wrong ones get `avoid` / `except`, or — when the other meaning is jargon too — a new term that `shares` the spelling (agent memory next to RAM). If most uses on the site are the other meaning (SONUB's "AI certificate"), make the jargon one `context: true` with precise cues.

**Spellings inside other words (languages without spaces).** Japanese and Chinese don't separate words, so a short spelling is found inside a longer, unrelated word: ポート (port) in パスポート (passport), サポート, レポート; パス (path) in パスワード (password); コード in レコード (a record); リンター in プリンター (a printer); 库 (library) in 知识库 (a knowledge base); 云 (cloud) in 多云 (cloudy). Don't put a word boundary on every short katakana spelling — compounds are normal (シェルスクリプト, エージェントスキル, モデルファイル) and most would be lost. Instead list the containing words in that language's `avoid` (`"ja": ["(?:サ|レ|パス)ポート"]`). Find them in the index: every hit whose surface touches more katakana (or Han) on either side, grouped by the whole word. The same happens where a script has a start-of-word check but no end: in Hindi "वेट" (weights) was caught at the start of वेटर (a waiter) and वेटलिस्ट (a waitlist), "बग" (bug) in बगल (beside). Hindi writes postpositions apart and inflects with vowel signs, so end the spelling at the word and allow only the real endings (plural याँ·ओं·एँ, verb ता·ना·ने, borrowed -ing िंग, -s ्स, -ment मेंट). Bengali glues case endings to the noun (মডেলের, মডেলটি) — don't end the word there; list the few wrong words (বাগানে "in the garden" for bug) in `avoid`. Arabic script runs the same way: Arabic glues endings to the word, but a tail starting with the feminine ة makes a different word (المعرّف identifier → المعرفة knowledge, المعامل parameter → المعاملة transaction, المنطق logic → المنطقة region); Urdu writes postpositions apart like Hindi, so allow only its endings (وں·یں·اں·ات, verb تا·نا·نے, borrowed ز·س·نگ) — بٹن (a button) is not بٹ (a bit). Use letter ranges, not `\p{Arabic}`, which also matches the Arabic comma ،. Words that are two things in one language need a key or an avoid in that language only: Arabic نموذج is a model and also a form or prototype ("login form"), Vietnamese cổng is a port and a gate.

**Boundary and split pitfalls.** In PCRE2 (PHP 8.2+) and ES2018 regexes, `\p{Hangul}` and `\p{Katakana}` follow Script_Extensions and also match CJK punctuation such as 「 、 〈 — a "no Hangul before" check then rejects 「모델」 and 、モデル. Write the letter ranges instead (Hangul `\x{1100}-\x{11FF}\x{3131}-\x{318E}\x{A960}-\x{A97F}\x{AC00}-\x{D7FF}`). When aliases are a comma list, don't split on a comma between digits: "44,100Hz, 16,000Hz" split naively makes "16" a spelling of hertz in every "16-bit". And when a locale has no translation for a key, the page shows the fallback (en) sentence — match `except`/`keys` against that fallback too.

Writing a new meaning: if the other meaning is jargon too, add it as its own term with its own `cues` (`grok` the model family next to `grok-cli` the agent). If the other meaning is an everyday word (a branch of a science), don't add an entry — mark the jargon one `context: true`.

## The sense index

Before and after changing cues, look at **every** place a word is found and the meaning chosen — not just the page you are fixing:

```bash
python3 scripts/popup.py senses                      # spellings with several meanings → candidates and their cues
python3 scripts/popup.py index docs site/*.html     # build .popup-index.sqlite and print, per spelling, which meaning won how often
python3 scripts/popup.py index --query branch       # every sentence with "branch", the meaning chosen, the scores
python3 scripts/popup.py index --doubt 40           # everyday words wrapped with no evidence: hidden meanings of single-meaning terms
```

The index is a SQLite database (standard library, FTS5 when available) you can also query directly:

| Table | Holds |
| --- | --- |
| `terms(id, category, term, short, scope, context, cues)` | the glossary — one row per term |
| `surfaces(surface, candidates)` | the reverse index: a spelling → its candidate meanings (`~id` = borrowed) |
| `texts(file, paragraph, text)` + `texts_fts` | every paragraph, full-text searchable: `SELECT file FROM texts_fts WHERE texts_fts MATCH 'branch'` |
| `hits(file, paragraph, surface, offset, chosen, legacy, candidates, margin, evidence, page, shown, sentence)` | every spelling found: the meaning chosen (`NULL` = left plain), the first candidate (`legacy` — what order alone would pick), scores, `evidence` from other terms (0 = nothing but the word itself), page evidence, `shown` (the first place in the file — where the popup really appears), the sentence with 【the word】 |
| `contexts(surface, chosen, file, n, shown, near, bare)` | by context: one spelling per file and meaning — how often, how many with evidence (`near`) or none (`bare`) |
| `meta(k, v)` | the locale the index was built for |

Read four lists: `chosen <> legacy` (the context changed the meaning — right?), `chosen IS NULL` (left plain — was it really not jargon?), `margin < 10` (the nearby context was equal and page or order decided — add a cue), and `shown = 1 AND evidence = 0` (`--doubt` — a single meaning wrapped on the word alone). Build one index per locale (each locale's text is its own corpus) and compare the counts after every change.

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
