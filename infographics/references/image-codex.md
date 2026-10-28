# Images with the Codex CLI

Use this for slides, posters, social cards and application images — anything delivered as pixels. Web pages stay HTML with real text ([visual-forms.md](visual-forms.md) "HTML patterns").

## Contents

- Rules
- Prompt template
- Run it
- Check the result
- When Codex fails
- Series of images

## Rules

- **Pixels come from Codex's built-in `image_gen`** through `codex exec`. Do not draw or edit the image with SVG, Canvas, HTML-to-image, PIL, ImageMagick, sips or another image API. Taking screenshots and opening files to look at them is fine.
- **The prompt is the layout.** Write it from `brief.md` part C: every zone, in reading order, with every word and number spelled out exactly. The model invents text when you leave room for it.
- **Keep the set together**: `prompt.txt`, `refs/` and `result.png` in one folder per image (the script does this). Never overwrite a result — the script renames the old one.
- **Never overwrite the user's original image.** Pass it as a reference; the result is a new file.

## Prompt template

```
<format>: 16:9 slide 1920×1080 PNG / 1080×1350 card / A4 portrait 2480×3508. Reader: <who, where they see it>.

Design rules
- Background <color>. Structure color <brand> for <title, frames, strip>. ONE accent <color> only on <the key values>.
- Style: flat, clean, <rounded cards / thin lines>. No <decorations to avoid: stock people, coins, 3D>.
- Four text sizes only: big number > title > body > note. Text start-aligned. Outer margin about <N>px.

Layout (top to bottom, exactly this order and text)
1. Small label top-start: "<series label>"
2. Title (large, ≤ 2 lines): "<claim>"
3. Hero (<about N% of the height>): <form — table / 3 number columns / flow / chart> with exact contents:
   - "<value>" / "<name>" / "<one-line meaning>"
   - ...
4. <block> : <form and exact text>
5. Note (small, grey, bottom-end): "Source: <source>"
6. Bottom strip (<brand> background, white text): "<conclusion>"

Write every Korean/other-script word exactly as given, letter for letter. Do not add any text, number,
logo or watermark that is not listed. <If refs: Put the attached screenshot inside <zone> unchanged —
do not redraw or retype the text in it.>
```

Tips:
- Put the exact strings in quotes; keep them short (a slide holds ~40 words).
- Name the hero's share of the area; otherwise the model makes everything equal.
- Say what *not* to draw (stock illustrations, extra icons, fake charts).
- **Draw the connections** — a slide/poster is an infographic too: ask for the lines explicitly ("a thick curved arrow from box 1 to box 2", "dotted lines for optional links", "four colored paths branching from the start") and name each line's start, end and style.
- **Web item pictures** (one per option, matching the hero): no text at all, plain background equal to the page paper color, square, the hero attached as the reference with "the SAME style as the reference" — recipe in [lines-and-images.md](lines-and-images.md) "Images".
- A real screenshot (product, chart from real data) beats a drawn one — attach it as a reference and ask to place it unchanged.
- Write the prompt in the language of the text on the image; it reduces letter errors.

## Run it

```bash
# folder mode — one folder per image (decks, application images)
scripts/codex-image.sh docs/images/cost-slide prompt.txt [screenshot.png ...]
# → docs/images/cost-slide/{prompt.txt, refs/, result.png, codex.log}

# file mode — when the project keeps <name>.<ext> + <name>.prompt.txt side by side (web images)
scripts/codex-image.sh public/images/learn/cost.webp prompt.txt
# → public/images/learn/{cost.webp, cost.prompt.txt, cost.refs/, cost.codex.log}
```

Delete `codex.log` before committing if it holds nothing worth keeping (it contains local paths). Keep the prompt and refs.

- The script prefixes the prompt with: use the built-in `image_gen` directly, never run `codex` from the shell, never run git, do not read project docs, save to `<out>/result.png`. Without these lines Codex has called itself recursively (and failed) and has committed files in the repository on its own.
- The prompt goes **before** `-i`; arguments after `-i` are read as more image paths.
- One image at a time is the most reliable; when running several in parallel and one fails with an image-service error, rerun that one alone.
- In a sandboxed agent shell, run the script outside the sandbox (Codex needs `~/.codex`).
- Takes about 1–3 minutes per image.

## Check the result

Open `result.png` and check, in order:

1. **Every word** against `prompt.txt` — letter by letter for Korean/CJK/Arabic. Image models drop, double or swap letters (e.g. "상한" → "상환").
2. **Every number** against the brief's fact inventory.
3. **Layout**: hero is the largest; reading order matches the prompt; nothing touches the edge or is cut off; no overlap.
4. **Additions**: no extra text, numbers, logos, watermarks or decorations you did not ask for.
5. **Size**: the pixel size the destination needs (check the submission rules: count, size, file type, MB).

Write the result in `brief.md` part D. If anything fails, change the prompt (be more explicit about the failing part, shorten text that came out wrong) and rerun — the old result is kept for comparison. After 3 failed attempts on the same text, report it and suggest putting that text in HTML/slide software instead of the image.

## When Codex fails

| Symptom | Cause | Do |
| --- | --- | --- |
| `codex: command not found` | not installed | install the Codex CLI, then `codex login` |
| auth / 401 / "log in" in `codex.log` | login expired | `codex login` (a human step if it needs a browser sign-in) |
| image tool unavailable | feature off or plan limit | `codex features list`, `codex doctor`; report the limit |
| "failed to initialize in-process app-server client" | Codex tried to run `codex` itself | the script's prefix prevents this; check the prompt was not edited to remove it |
| no `result.png`, file under `~/.codex/generated_images/` | Codex did not copy it | copy that file to `<out>/result.png` (a copy is not an edit) |

If Codex cannot be used, stop and report the cause and the fix. Do not switch to drawing the image another way.

## Series of images

- Write one **frame** (label, title position, hero zone, strip, palette, sizes) in the brief and paste it unchanged into every prompt; change only the per-image content.
- Name folders in order: `01-cover/`, `02-problem/`, …
- Review the series side by side at the end: same margins, same title size, same colors, the same term for the same thing on every image.
