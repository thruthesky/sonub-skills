#!/bin/sh
# The infographics skill needs the webmovie skill (sonub.com). Run this before anything else.
#
#   sh scripts/require-webmovie.sh
#
# Found     → prints "webmovie: OK <dir>" and the kit paths, exit 0. Use that folder's SKILL.md, assets/ and scripts/.
# Not found → prints an error with the install commands, exit 1. Stop the infographics task and show the error to the user.
# Looks in: $WEBMOVIE_SKILL_DIR · next to this skill (../webmovie) · .claude/skills, .agents/skills and skills/ of the current
# folder and every parent · ~/.claude/skills · ~/.agents/skills · $CODEX_HOME/skills (~/.codex/skills).

here=$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)
searched=""

is_webmovie() {
    [ -f "$1/SKILL.md" ] && grep -q '^name: webmovie *$' "$1/SKILL.md" \
        && [ -f "$1/assets/webmovie.js" ] && [ -f "$1/assets/webmovie.css" ] && [ -f "$1/scripts/check.mjs" ]
}

try() {
    [ -n "$1" ] || return 1
    searched="$searched
    $1"
    if is_webmovie "$1"; then
        dir=$(cd "$1" && pwd)
        echo "webmovie: OK $dir"
        echo "  rules  $dir/SKILL.md"
        echo "  kit    $dir/assets/webmovie.js · $dir/assets/webmovie.css"
        echo "  check  node $dir/scripts/check.mjs <url-or-file>"
        exit 0
    fi
    return 1
}

try "$WEBMOVIE_SKILL_DIR"
try "$here/../webmovie"
d=$(pwd)
while :; do
    try "$d/.claude/skills/webmovie"
    try "$d/.agents/skills/webmovie"
    try "$d/skills/webmovie"
    [ "$d" = "/" ] && break
    d=$(dirname "$d")
done
try "$HOME/.claude/skills/webmovie"
try "$HOME/.agents/skills/webmovie"
try "${CODEX_HOME:-$HOME/.codex}/skills/webmovie"

cat >&2 <<EOF
✗ ERROR: the webmovie skill is not installed — the infographics skill does not run without it.

  Every infographic is built with webmovie (sonub.com): it moves like a video while every word stays
  real HTML text (search engines, translation, editing). The infographics skill stops here.

  Install webmovie, start a new agent session, then ask for the infographic again:

    npx skills add https://sonub.com -s webmovie        # this project
    npx skills add https://sonub.com -s webmovie -g     # every project on this computer

  ✗ 오류: webmovie 스킬이 설치되어 있지 않습니다. infographics 스킬은 webmovie 없이 동작하지 않습니다.
    위 명령으로 webmovie 를 먼저 설치하고, 에이전트를 새로 시작한 뒤 인포그래픽을 다시 부탁하세요.

  Searched:$searched
EOF
exit 1
