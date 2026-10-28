#!/usr/bin/env bash
# Make one infographic image with the Codex CLI's built-in image model and keep everything together.
#
#   scripts/codex-image.sh <out-dir | out-file.png|.webp|.jpg> <prompt-file> [reference-image ...]
#
# Folder mode (<out-dir>):               File mode (<dir>/<name>.<ext>):
#   <out-dir>/prompt.txt                   <dir>/<name>.prompt.txt   the exact prompt (copied from <prompt-file>)
#   <out-dir>/refs/                        <dir>/<name>.refs/        copies of the reference images
#   <out-dir>/result.png                   <dir>/<name>.<ext>        the new image
#   <out-dir>/codex.log                    <dir>/<name>.codex.log    what Codex printed
# An existing result is kept as <result>-<YYYYmmdd-HHMMSS>.<ext> — nothing is overwritten.
#
# Codex is told to call image_gen itself (not to run `codex` again), not to touch git and not to read
# project docs. In a sandboxed agent shell, run this outside the sandbox — Codex needs ~/.codex.
set -euo pipefail

if [ $# -lt 2 ]; then
    echo "usage: $0 <out-dir | out-file.png|.webp|.jpg> <prompt-file> [reference-image ...]" >&2
    exit 2
fi
command -v codex >/dev/null || { echo "codex CLI not found — install it, then run: codex login" >&2; exit 2; }

target="$1"; prompt_file="$2"; shift 2
[ -f "$prompt_file" ] || { echo "prompt file not found: $prompt_file" >&2; exit 2; }
case "$target" in
    *.png|*.webp|*.jpg|*.jpeg)
        mkdir -p "$(dirname "$target")"
        dir="$(cd "$(dirname "$target")" && pwd)"; file="$(basename "$target")"; base="${file%.*}"; ext="${file##*.}"
        result="$dir/$file"; prompt_copy="$dir/$base.prompt.txt"; refs="$dir/$base.refs"; log="$dir/$base.codex.log" ;;
    *)
        mkdir -p "$target"
        dir="$(cd "$target" && pwd)"; base="result"; ext="png"
        result="$dir/result.png"; prompt_copy="$dir/prompt.txt"; refs="$dir/refs"; log="$dir/codex.log" ;;
esac

# Keep the prompt next to the result (skip when the prompt file already is that file).
if [ "$(cd "$(dirname "$prompt_file")" && pwd)/$(basename "$prompt_file")" != "$prompt_copy" ]; then
    cp "$prompt_file" "$prompt_copy"
fi

image_args=()
for ref in "$@"; do
    [ -f "$ref" ] || { echo "reference image not found: $ref" >&2; exit 2; }
    mkdir -p "$refs"
    cp "$ref" "$refs/"
    image_args+=(-i "$refs/$(basename "$ref")")
done

if [ -f "$result" ]; then
    mv "$result" "${result%.*}-$(date +%Y%m%d-%H%M%S).$ext"
fi

codex_home="${CODEX_HOME:-$HOME/.codex}"
full_prompt="You ARE Codex and you already have the built-in image_gen tool. Call image_gen directly.
Never run \`codex\` or \`codex exec\` as a shell command. Do NOT run git (no add/commit/push).
Do not read project documents. Only generate the image described below, then save the final image as
${ext} to exactly this path: $result
(If image_gen saves under $codex_home/generated_images/, copy it there — convert to ${ext} if needed.)
Reference images, if attached, are in $refs/.

$(cat "$prompt_copy")"

# The prompt goes BEFORE -i: after -i, codex treats the next arguments as more image paths.
set +e
codex exec --skip-git-repo-check -s workspace-write -C "$dir" --add-dir "$dir" --add-dir "$codex_home" \
    "$full_prompt" "${image_args[@]+"${image_args[@]}"}" </dev/null >"$log" 2>&1
status=$?
set -e

if [ -f "$result" ]; then
    echo "result → $result"
    echo "prompt → $prompt_copy · log → $log${image_args[0]+" · refs → $refs/"}"
    echo "Now open the result and compare every word with the prompt."
else
    echo "no image (codex exit $status) — see $log" >&2
    tail -n 20 "$log" >&2
    exit 1
fi
