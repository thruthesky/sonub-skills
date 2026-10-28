#!/usr/bin/env bash
# cowork.sh — 이 컴퓨터에 설치돼 **실제로 쓸 수 있는** AI CLI 들(claude·codex·copilot 두 두뇌·agy·gemini·grok·
#             kimi·opencode·사람이 더한 custom)을 읽기 전용 분석가로 병렬 실행한다.
#
#   처음 한 번:  bash <스킬 폴더>/scripts/cowork.sh init        → .cowork/.cowork-agents.json + .cowork/cowork-prompt.md
#   분석:        bash <스킬 폴더>/scripts/cowork.sh <폴더명> "<분석 요청>"
#   결과:        .cowork/<폴더명>/<AI>-cowork.md  (그 뒤 오케스트레이터가 final-report.md 로 종합)
#
# 무엇을 돌리나 — `.cowork/.cowork-agents.json` 이 정한다. init 이 설치된 AI 를 찾아 확인 질문으로 실제로 답하는지
# 시험해 기록하고, 분석은 그 기록에서 **쓸 수 있는 것만** 고른다. AI 를 새로 설치했거나 로그인했으면 init 을 다시
# 돌리면 된다(사람이 고친 값·실패 기록·메모는 보존). 실행 결과는 다시 그 파일에 쌓여 다음 실행을 바꾼다 —
#   인증·구독 실패 → 다음부터 건너뜀 · 사용량 한도 → 쉬는 시간 동안 건너뜀 · 시간 초과 → 그 AI 의 제한 시간을 늘림 ·
#   모델 거절 → 마지막으로 성공한 모델로 한 번 더. 세부: references/agents-registry.md
#
# 이 스크립트는 **분야를 가리지 않는다.** 작업공간의 성격은 `.cowork/cowork-prompt.md`(사람이 쓴 지침) + 실행 때
# 자동 감지로 주입한다 — 특정 분야를 이 스크립트나 페르소나에 하드코딩하지 말 것.
#
# 설계 요지
#   - AI 는 읽기 전용으로 강제된다(방어는 CLI 마다 다르다 — agents.sh·references/readonly-enforcement.md).
#     AI 는 분석을 stdout 으로만 내고 파일 기록은 이 스크립트가 한다.
#   - AI 들은 동시에 돈다. 하나가 실패해도 나머지는 계속 간다.
#   - macOS 에는 timeout(1) 이 없어 perl 워치독(run_timeout)을 쓴다.
set -uo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PERSONA_FILE="$SKILL_DIR/references/analyst-persona.md"
# 작업공간 루트: COWORK_ROOT → 지금 폴더의 git 최상위 → 지금 폴더.
# 🛑 스킬 위치에서 역산하지 않는다 — 전역 설치(~/.claude/skills·~/.agents/skills)나 플러그인 캐시에서 돌리면
#    엉뚱한 폴더(~/.claude/plugins/cache)를 분석하고 .cowork/ 도 거기 생겼다(2026-09-23 실측).
REPO_ROOT="${COWORK_ROOT:-$(git -C "$PWD" rev-parse --show-toplevel 2> /dev/null || pwd)}"
REPO_ROOT="$(cd "$REPO_ROOT" 2> /dev/null && pwd)" || { printf '오류: 작업공간 폴더가 없다: %s\n' "${COWORK_ROOT:-$PWD}" >&2; exit 1; }
# 심볼릭 링크를 따라간 물리 경로. 샌드박스 규칙은 실경로로 걸어야 우회되지 않는다.
REPO_ROOT_PHYS="$(cd "$REPO_ROOT" && pwd -P)"
DB_FILE="$REPO_ROOT/.cowork/.cowork-agents.json"

# 화면 안내에 쓰는 이 스크립트 경로 — 작업공간 안이면 상대 경로, 밖이면 ~ 로 줄인다.
SELF="$SKILL_DIR/scripts/cowork.sh"
case "$SELF" in "$REPO_ROOT"/*) SELF_SHOW="${SELF#"$REPO_ROOT"/}" ;; "$HOME"/*) SELF_SHOW="~/${SELF#"$HOME"/}" ;; *) SELF_SHOW="$SELF" ;; esac
case "$SKILL_DIR" in "$REPO_ROOT"/*) SKILL_SHOW="${SKILL_DIR#"$REPO_ROOT"/}" ;; "$HOME"/*) SKILL_SHOW="~/${SKILL_DIR#"$HOME"/}" ;; *) SKILL_SHOW="$SKILL_DIR" ;; esac

# 분석 1건당 제한 시간(초). 사람이 COWORK_TIMEOUT 을 직접 주면 모든 AI 에 그 값을, 안 주면 AI 마다 배운
# 값(.cowork-agents.json 의 timeout — 시간 초과 때 1.5배씩 늘어난다)이나 기본 900 을 쓴다.
COWORK_TIMEOUT_SET="${COWORK_TIMEOUT:+1}"
COWORK_TIMEOUT="${COWORK_TIMEOUT:-900}"
# 특정 AI 만 (재)실행. 쉼표 목록(실패한 AI 재시도용). 비우면 .cowork-agents.json 에서 쓸 수 있는 것 전부.
COWORK_ONLY="${COWORK_ONLY:-}"

# shellcheck source=agents.sh
. "$SKILL_DIR/scripts/agents.sh"

die() { printf '오류: %s\n' "$1" >&2; exit 1; }
db() { perl "$SKILL_DIR/scripts/agents-db.pl" "$DB_FILE" "$@"; }

usage() {
  cat >&2 << EOF
사용법: cowork.sh <폴더명> <분석 요청 프롬프트>
        cowork.sh init [--quick] [--verify] [--force]
        cowork.sh agents | list | review <폴더명> | init-hook
        cowork.sh note <AI> "<메모>" | enable <AI> | disable <AI> | set <AI> key=value…
        cowork.sh add-custom <AI> '["cli","-p","{PROMPT}"]' [<모델>]

  <폴더명>    .cowork/<폴더명>/ — 작업 ID. 소문자·숫자·하이픈만(예: login-timeout). 사람이 준 이름 그대로 쓴다.
              init·list·agents·note·enable·disable·set·add-custom·review·init-hook·help 는 명령이라 폴더명으로 못 쓴다.
  init        설치된 AI CLI 를 찾아 확인 질문으로 실제로 답하는지 시험하고 .cowork/.cowork-agents.json 에 기록한다
              (다시 돌리면 갱신 — 사람이 고친 값·실패 기록·메모는 보존). 시스템 프롬프트 .cowork/cowork-prompt.md
              초안도 없으면 만든다(--force 면 새로, 기존은 .bak).
                --quick   확인 질문 생략(설치·버전·모델만)   --verify  읽기 전용 공격 실측까지
  agents      AI 목록·상태·통계·최근 실패·메모를 본다
  note        AI 의 실패 원인·해결을 메모로 남긴다 — 다음 실행 요약에 보인다
  enable/disable  AI 를 쓰거나 쓰지 않게 한다(init 을 다시 돌려도 유지)
  set         모델 고정 등: set codex model=gpt-6.1-sol modelPinned=true · set claude timeout=1800
  add-custom  어댑터 없는 CLI 를 더한다(sandbox-exec 안에서만 돈다). {PROMPT}·{PROMPT_FILE}·{MODEL} 자리 치환
  list        .cowork/ 작업 목록과 상태
  review      <폴더명>의 final-report.md 를 AI 들로 재검토해 갱신(보통 Stop hook 이 백그라운드로 부른다)
  init-hook   이 프로젝트 .claude/settings.json 의 Stop hook 에 final-report 리뷰를 멱등 설치

환경변수:
  COWORK_TIMEOUT       AI 1개당 제한 시간(초). 주면 모든 AI 에 그 값, 안 주면 AI 마다 배운 값 또는 900
  COWORK_TIMEOUT_MAX   시간 초과로 늘려 가는 상한(기본 2400)
  COWORK_ONLY          돌릴 AI(쉼표). 고르면 쉬는 시간·사용 안 함도 무시하고 돌린다
  COWORK_LIMIT_COOLDOWN_MIN  사용량 한도 뒤 건너뛰는 시간(분, 기본 180)
  COWORK_PROBE_TIMEOUT 확인 질문 제한 시간(초, 기본 120)
  COWORK_MODEL_<AI>·COWORK_EFFORT_<AI>  이번 실행만 모델·등급(AI 이름의 하이픈은 밑줄, 대문자 — COWORK_MODEL_COPILOT_GROK)
                       예전 이름도 받는다: COWORK_CLAUDE_MODEL·COWORK_CODEX_MODEL·COWORK_AGY_MODEL·COWORK_COPILOT_EFFORT …
  COWORK_ROOT          작업공간 루트(기본: 지금 폴더의 git 최상위, 아니면 지금 폴더)

예:
  bash $SELF_SHOW init
  bash $SELF_SHOW login-timeout "로그인이 가끔 끊기는 원인 분석"
  COWORK_ONLY=codex,agy COWORK_TIMEOUT=1800 bash $SELF_SHOW login-timeout "…"
  bash $SELF_SHOW note codex "모델 거절 — codex CLI 업데이트(npm i -g @openai/codex)로 해결"
EOF
  exit 2
}

# --- 지침 블록 추출 ---------------------------------------------------------
# 지침 파일에서 ---BEGIN <TAG>--- ~ ---END <TAG>--- 사이만 뽑는다(문서 설명문은 주입하지 않는다).
extract_block() { # <파일> <태그>
  sed -n "/^---BEGIN $2---$/,/^---END $2---$/p" "$1" | sed '1d;$d'
}

# --- 작업공간 감지 ------------------------------------------------------------
# 🛑 페르소나에 특정 프로젝트 문구가 박혀 있던 탓에 다른 프로젝트에서 세 AI 전부가 없는 디렉토리를 찾아
#    헤맸다(2026-07-17). 그래서 "무슨 작업공간인가" 를 실행 때 얕게 감지한다(파일 존재 = 사실).
detect_workspace_facts() {
  local root="$1" name docs stack f types
  name="$(basename "$root")"
  stack=""
  [ -f "$root/pubspec.yaml" ] && stack+="Flutter/Dart(pubspec.yaml), "
  [ -f "$root/package.json" ] && stack+="Node/JS(package.json), "
  [ -f "$root/go.mod" ] && stack+="Go(go.mod), "
  [ -f "$root/Cargo.toml" ] && stack+="Rust(Cargo.toml), "
  [ -f "$root/composer.json" ] && stack+="PHP(composer.json), "
  [ -f "$root/pom.xml" ] && stack+="Java/Maven(pom.xml), "
  { [ -f "$root/build.gradle" ] || [ -f "$root/build.gradle.kts" ]; } && stack+="Gradle, "
  { [ -f "$root/requirements.txt" ] || [ -f "$root/pyproject.toml" ]; } && stack+="Python, "
  [ -f "$root/Gemfile" ] && stack+="Ruby(Gemfile), "
  [ -f "$root/project.godot" ] && stack+="Godot(project.godot), "
  { [ -f "$root/docker-compose.yml" ] || [ -f "$root/docker-compose.yaml" ]; } && stack+="Docker Compose, "
  stack="${stack%, }"
  [ -n "$stack" ] || stack="(개발 매니페스트 없음 — 코드 프로젝트가 아닐 수 있다. 아래 파일 종류를 보라)"

  types="$(find "$root" -maxdepth 3 -type f -not -path '*/.*' -not -path '*/node_modules/*' -not -path '*/vendor/*' \
    -not -path '*/build/*' -not -path '*/dist/*' 2> /dev/null \
    | sed -n 's/.*\.\([A-Za-z0-9]\{1,8\}\)$/\1/p' | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn | head -8 \
    | awk '{printf "%s(%s), ", $2, $1}')"
  types="${types%, }"
  [ -n "$types" ] || types="(확장자 있는 파일을 찾지 못함)"

  docs=""
  for f in "$root"/*.md; do [ -f "$f" ] && docs+="$(basename "$f"), "; done
  docs="${docs%, }"
  [ -n "$docs" ] || docs="(루트에 마크다운 지침 문서 없음)"

  local dirs=""
  for f in "$root"/*/; do
    [ -d "$f" ] || continue
    case "$(basename "$f")" in node_modules | build | dist | .* | outputs | vendor) continue ;; esac
    dirs+="$(basename "$f")/ "
  done
  [ -n "$dirs" ] || dirs="(없음)"

  printf -- '- **작업공간 이름**: `%s`\n' "$name"
  printf -- '- **작업공간 경로**: `%s`\n' "$root"
  printf -- '- **감지된 개발 스택**: %s\n' "$stack"
  printf -- '- **파일 종류 분포**: %s\n' "$types"
  printf -- '- **루트 지침 문서**: %s\n' "$docs"
  printf -- '- **최상위 디렉토리**: %s\n' "$dirs"
}

# 페르소나의 {{PROJECT_CONTEXT}} 에 들어갈 블록: 사람이 쓴 .cowork/cowork-prompt.md(최우선) + 자동 감지.
# 분석·리뷰가 같은 페르소나 문자열을 쓰므로 한 곳만 고치면 모든 경로에 전파된다.
build_project_context() {
  local root="$1"
  # 🛑 `local root="$1" pf="$root/…"` 처럼 한 줄에 쓰지 말 것 — set -u 에서 root 가 아직 없어 서브셸이 조용히 죽고
  #    빈 컨텍스트가 주입된다(2026-07-26 실측).
  local pf="$root/.cowork/cowork-prompt.md"
  [ -f "$pf" ] || pf="$root/.cowork/prompt.md"   # 예전 이름 하위 호환
  if [ -f "$pf" ]; then
    printf '### 🛑 이 작업공간의 시스템 프롬프트 — `.cowork/%s` (최우선 · 반드시 따르라)\n\n' "$(basename "$pf")"
    printf '아래는 이 작업공간의 담당자가 직접 작성한 지침이다. 이 프로젝트의 **특성·기획·계획·아바타\n'
    printf '(persona)·디자인·로직·개념**이 여기 정의돼 있다. **당신의 분석 전체가 이 내용을 전제로\n'
    printf '이뤄져야 한다** — 여기 적힌 목적·역할·규칙·용어를 그대로 따르라. 아래 자동 감지 사실이나\n'
    printf '당신의 일반 상식과 어긋나면 **이 문서가 맞다.** 여기 명시된 제약을 어긴 권고는 채택되지 않는다.\n\n---\n\n'
    cat "$pf"
    printf '\n\n---\n\n### 자동 감지 사실 (보조 — 위 시스템 프롬프트와 어긋나면 위가 맞다)\n\n'
  else
    printf '### 이 작업공간에는 시스템 프롬프트(`.cowork/cowork-prompt.md`)가 없다\n\n'
    printf '작업공간의 목적·역할·규칙이 명시돼 있지 않다. 아래 감지 사실과 실제 자료를 직접 열어\n'
    printf '파악하되, 넘겨짚은 전제는 §6 에 불확실성으로 남겨라.\n\n'
  fi
  detect_workspace_facts "$root"
}

# --- AI 목록 → 이번 실행 계획 ------------------------------------------------
# .cowork-agents.json 이 없으면 빠른 스캔으로 만든다(확인 질문은 생략 — 실패는 실행 결과로 배운다).
ensure_db() {
  [ -f "$DB_FILE" ] && return 0
  mkdir -p "$REPO_ROOT/.cowork"
  printf '💡 .cowork/.cowork-agents.json 이 없어 빠른 스캔으로 만든다. 확인 질문까지 하려면: bash %s init\n' "$SELF_SHOW" >&2
  scan_agents --quick > /dev/null 2>&1 || die "AI 목록을 만들지 못했다 — bash $SELF_SHOW init 을 직접 돌려 보라."
}

# 계획을 전역 배열에 싣는다: P_ID P_CLI P_MODEL P_EFFORT P_SECS P_GOOD P_FB. 건너뛴 것은 P_SKIP 에 "id — 이유".
# 🛑 모델은 여기(부모 셸)에서 정한다 — 러너는 백그라운드로 갈라지므로 자식에서 정한 값은 부모·기록에 안 보인다.
load_plan() { # [<only 쉼표 목록>]
  P_ID=(); P_CLI=(); P_MODEL=(); P_EFFORT=(); P_SECS=(); P_GOOD=(); P_FB=(); P_SKIP=()
  local kind id cli model effort tmo good fb why secs
  # 🛑 구분자는 탭이 아니라 \x1f — 탭은 IFS 공백 문자라 빈 칸(모델 자동 등)이 겹치면 칸이 밀린다.
  while IFS=$'\x1f' read -r kind id cli model effort tmo good fb why; do
    [ -n "$id" ] || continue
    if [ "$kind" != run ]; then P_SKIP+=("$id — $why"); continue; fi
    model="$(resolve_model "$id" "$cli" "$model")"
    effort="$(resolve_effort "$id" "$cli" "$model" "$effort")"
    secs="$COWORK_TIMEOUT"; [ -z "$COWORK_TIMEOUT_SET" ] && [ -n "$tmo" ] && secs="$tmo"
    P_ID+=("$id"); P_CLI+=("$cli"); P_MODEL+=("$model"); P_EFFORT+=("$effort"); P_SECS+=("$secs"); P_GOOD+=("$good"); P_FB+=("$fb")
  done < <(db plan "${1:-}")
}

# 한 번 실행 + 모델 거절이면 다른 모델로 한 번 더. 결과: EX_RC EX_DIAG EX_MODEL EX_SECS
exec_with_retry() { # <id> <cli> <model> <effort> <초> <마지막 성공 모델> <fallback(,)> <프롬프트> <출력> <로그>
  local id="$1" cli="$2" model="$3" effort="$4" secs="$5" good="$6" fb="$7" pf="$8" out="$9" lg="${10}"
  local t0=$SECONDS alt="" m
  agent_exec "$id" "$cli" "$model" "$effort" "$secs" "$pf" "$out" "$lg"
  EX_RC=$?; EX_MODEL="$model"
  exec_outcome "$cli" "$out" "$lg"
  if [ "$EX_DIAG" = "모델·추론 등급 거절" ]; then
    for m in $good ${fb//,/ }; do [ -n "$m" ] && [ "$m" != "$EX_MODEL" ] && { alt="$m"; break; }; done
    if [ -n "$alt" ]; then
      printf '   ↻ %s: 모델 %s 이(가) 거절돼 %s 로 다시 시도\n' "$id" "${EX_MODEL:-(기본)}" "$alt" >&2
      cp "$lg" "$lg.first" 2> /dev/null
      [ "$cli" = agy ] && effort="$(resolve_effort "$id" agy "$alt" "")"
      agent_exec "$id" "$cli" "$alt" "$effort" "$secs" "$pf" "$out" "$lg"
      EX_RC=$?; EX_MODEL="$alt"
      { printf -- '--- 1차 시도(모델 거절) ---\n'; cat "$lg.first"; printf -- '\n--- 2차 시도: %s ---\n' "$alt"; cat "$lg"; } > "$lg.both" 2> /dev/null
      mv "$lg.both" "$lg"; rm -f "$lg.first"
      exec_outcome "$cli" "$out" "$lg"
    fi
  fi
  EX_SECS=$((SECONDS - t0))
}
exec_outcome() { # <cli> <출력> <로그> — EX_RC 보정·EX_DIAG·실제 모델
  local size=0
  [ -f "$2" ] && size="$(wc -c < "$2" | tr -d ' ')"
  [ "$EX_RC" -eq 0 ] && [ "$size" -lt 50 ] && EX_RC=99   # 빈 응답은 성공 코드라도 실패
  EX_DIAG=""
  [ "$EX_RC" -ne 0 ] && EX_DIAG="$(classify_failure "$EX_RC" "$2" "$3")"
  # codex 는 config 모델을 상속하므로 실제 모델을 로그 머리말에서 읽어 기록한다(다음 모델 거절 때 되돌아갈 곳)
  if [ "$1" = codex ] && [ -z "$EX_MODEL" ]; then EX_MODEL="$(sed -n 's/^model: *//p' "$3" 2> /dev/null | head -1)"; fi
  return 0
}

# --- init ---------------------------------------------------------------------
do_init() {
  local force="" a scan_args=()
  for a in "$@"; do
    case "$a" in --force) force=--force ;; --quick | --verify) scan_args+=("$a") ;; *) die "init 옵션은 --quick·--verify·--force: $a" ;; esac
  done
  mkdir -p "$REPO_ROOT/.cowork" || die "작업 폴더를 만들 수 없다: $REPO_ROOT/.cowork"
  scan_agents ${scan_args[@]+"${scan_args[@]}"} || die "AI 스캔 실패"
  do_init_prompt "$force"
}

# .cowork/cowork-prompt.md 초안 — 이 작업공간에서 모든 AI 분석에 주입할 시스템 프롬프트(Overview·Persona·
# Instructions·Tech stack). 🛑 이미 있으면 덮어쓰지 않는다(사람이 다듬은 지침 보호 — --force 로만 교체).
do_init_prompt() {
  local force="${1:-}" dir="$REPO_ROOT/.cowork"
  local pf="$dir/cowork-prompt.md"
  if [ ! -f "$pf" ] && [ -f "$dir/prompt.md" ]; then
    mv "$dir/prompt.md" "$pf" && printf '🔁 예전 이름을 새 이름으로 옮겼다: .cowork/prompt.md → .cowork/cowork-prompt.md\n' >&2
  fi
  if [ -f "$pf" ] && [ "$force" != "--force" ]; then
    printf '⏭️  시스템 프롬프트는 이미 있다 — 건드리지 않았다: .cowork/cowork-prompt.md (새로 만들려면 init --force)\n' >&2
    return 0
  fi
  [ -f "$pf" ] && cp "$pf" "$pf.bak" && printf '📦 기존 파일 백업: .cowork/cowork-prompt.md.bak\n' >&2
  local facts wsname
  facts="$(detect_workspace_facts "$REPO_ROOT")"
  wsname="$(basename "$REPO_ROOT")"
  cat > "$pf" << EOF
# cowork 시스템 프롬프트 — $wsname

> 🛑 이 파일은 \`cowork\` 이 여러 AI(\`.cowork/.cowork-agents.json\` 에 기록된, 이 컴퓨터에서 쓸 수 있는 AI 전부)에게
> 분석을 시킬 때마다 **프롬프트 맨 앞에 반드시 주입** 하는 **이 프로젝트의 시스템 프롬프트** 다.
>
> 이 프로젝트의 **특성·기획·계획·아바타(persona)·디자인·로직·개념** 을 여기에 적어 두면, 어떤 분석을
> 시키든 모든 AI 가 같은 맥락 위에서 답한다. 비워 두면 AI 들은 프로젝트의 목적을 모른 채 일반론으로 분석한다.
>
> \`cowork.sh init\` 이 자동 감지로 만든 **초안** 이다. 아래 네 절은 뼈대일 뿐이니, 필요하면 절을
> 더 추가하라(\`## 기획\`, \`## 용어 정의\`, \`## 설계 규칙\`, \`## 데이터 구조\`, \`## 금지사항\` …).
>
> ⚠️ 분석 AI 는 읽기 전용이다. 이 문서에 "파일을 만들어라" 같은 지시를 써도 물리적으로 실행되지 않는다
> (실제 작업은 종합(final-report.md)을 마친 오케스트레이터가 한다).

## Overview

(이 프로젝트가 **무엇인지**, 무엇을 만들고 있고 지금 어느 단계인지, 그리고 AI 들에게 **무엇을
 시키려는지** 를 쓴다. 프로젝트의 특성·기획 의도·목표·계획을 여기에 담는다.
 예: "초등 3~4학년 수학 교재를 만드는 프로젝트. 현재 1학기 분수 단원 초안까지 나왔다.
 단원 구성·난이도 배열·오답 유형의 타당성을 교차 검증시킨다."
 예: "웹 브라우저용 테트리스. 코어 로직은 완성, 지금은 난이도 곡선과 조작감을 다듬는 단계다.")

## Persona

(AI 들이 **어떤 전문가 역할(아바타)** 로 분석해야 하는지 쓴다. 분야에 맞는 인격을 주면 관점 자체가 달라진다.
 예: "초등 수학 교육과정 설계 전문가이자 아동 인지발달 관점의 교재 검수자."
 예: "낙하형 퍼즐 게임의 조작감·난이도 곡선을 설계해 온 시니어 게임 디자이너.")

## Instructions

(분석 시 **반드시 지킬 규칙·개념·설계 로직·우선순위·금지사항** 을 쓴다.
 예:
 - 모든 주장에는 \`파일:줄\` 근거를 붙이고, 근거 없는 주장은 \`[추측]\` 으로 표시한다.
 - 대상 독자는 만 9~10세다. 그 어휘 수준을 넘는 제안은 하지 않는다.
 - "레벨" 은 낙하 속도 단계를 뜻한다. 점수 구간과 혼동하지 말 것.)

## Tech stack

(이 프로젝트를 구성하는 **기술·도구·파일 형식·자료 구조·디자인 규격** 을 쓴다. 소프트웨어가 아니면
 문서 형식·템플릿·산출물 규격을 쓴다. 아래는 자동 감지 결과이니 직접 확인해 고쳐라.)

$facts
EOF
  printf '✅ 생성: .cowork/cowork-prompt.md — 네 절(Overview·Persona·Instructions·Tech stack)을 이 작업공간에 맞게 채워라.\n' >&2
}

# --- init-hook: Stop hook 멱등 설치 ------------------------------------------
# 스킬이 작업공간 안에 있으면 $CLAUDE_PROJECT_DIR 기준 경로로, 밖(전역 설치)이면 절대 경로로 등록한다.
# 예전 경로로 등록된 같은 hook 이 있으면 새 경로로 바꾼다.
do_init_hook() {
  local settings="$REPO_ROOT/.claude/settings.json" hook="$SKILL_DIR/scripts/final-report-stop-hook.sh" hookcmd
  case "$hook" in
    "$REPO_ROOT"/*) hookcmd="bash \"\$CLAUDE_PROJECT_DIR/${hook#"$REPO_ROOT"/}\"" ;;
    *) hookcmd="bash \"$hook\"" ;;
  esac
  command -v jq > /dev/null 2>&1 || die "jq 가 필요하다(brew install jq)."
  mkdir -p "$(dirname "$settings")"
  [ -f "$settings" ] || printf '{}\n' > "$settings"
  if jq -e --arg c "$hookcmd" '[.hooks.Stop // [] | .[]?.hooks[]?.command] | any(. == $c)' "$settings" > /dev/null 2>&1; then
    printf '✅ 이미 설치됨 — Stop hook 에 final-report 리뷰가 있다: %s\n' "$settings" >&2
    return 0
  fi
  local tmp; tmp="$(mktemp)"
  jq --arg c "$hookcmd" '
    .hooks = (.hooks // {})
    | .hooks.Stop = ([(.hooks.Stop // [])[] | .hooks = [(.hooks // [])[] | select((.command // "") | contains("final-report-stop-hook.sh") | not)] | select((.hooks | length) > 0)]
                     + [{ "hooks": [{ "type": "command", "command": $c, "timeout": 60 }] }])
  ' "$settings" > "$tmp" && mv "$tmp" "$settings" || die "settings.json 갱신 실패: $settings"
  printf '✅ 설치 완료: %s\n   hook: %s\n' "$settings" "$hookcmd" >&2
}

# --- 결과 파일 머리말 -------------------------------------------------------
# `## 1. 결론 요약` 같은 헤더가 줄 중간에 붙어 나오면(서두 뒤 개행 없이 — 2026-07-17 실측) 앞에 빈 줄을 넣는다.
normalize_sections() { perl -0pi -e 's/(?<!\n)(#{2,3} \d+\. )/\n\n$1/g' "$1" 2> /dev/null || true; }

finalize() { # <AI> <파일> <rc> <초> <명령 설명> <진단>
  local name="$1" file="$2" rc="$3" secs="$4" cmd="$5" diag="$6"
  local stamp body=""
  stamp="$(date '+%Y-%m-%d %H:%M:%S')"
  [ -f "$file" ] && normalize_sections "$file" && body="$(cat "$file")"
  if [ "$rc" -ne 0 ]; then
    {
      printf '<!-- cowork:%s | %s | 실패(exit=%s%s) | %ss -->\n' "$name" "$stamp" "$rc" "${diag:+ · $diag}" "$secs"
      printf '# ⚠️ %s 분석 실패\n\n' "$name"
      case "$diag" in
        "사용량 한도 초과") printf '> 🛑 **사용량 한도 초과다 — 지금 다시 해도 같은 실패가 난다.** 이 AI 를 빼고 종합하라. 쉬는 시간이 기록돼 그동안 자동으로 건너뛴다.\n\n' ;;
        "인증 필요" | "구독·결제 문제") printf '> 🛑 **%s — 다시 해도 소용없다.** 사람이 로그인·결제를 고친 뒤 `cowork.sh init` 을 돌려야 되살아난다. 그때까지 자동으로 건너뛴다.\n\n' "$diag" ;;
      esac
      local why=""   # bash 3.2 는 $( ) 안의 case 패턴 괄호를 잘못 읽는다 — 밖에서 정한다
      [ "$rc" -eq 124 ] && why="(제한 시간 ${secs}s 부근 초과)"
      [ "$rc" -eq 99 ] && why="(빈 응답)"
      printf -- '- 종료 코드: `%s` %s\n' "$rc" "$why"
      [ -n "$diag" ] && printf -- '- 진단: **%s**\n' "$diag"
      printf -- '- 명령: `%s`\n' "$cmd"
      printf -- '- 로그: `.cowork/%s/.logs/%s.log`\n\n' "$SLUG" "$name"
      printf '이 파일은 분석 결과가 아니다. 종합(final-report.md) 때 %s 의견은 **없는 것으로** 보고 그 사실을 적어라.\n' "$name"
      case "$diag" in
        "모델·추론 등급 거절") printf '설정 문제라 그대로 다시 해도 같다 — 로그의 거절 문구를 보고 `cowork.sh set %s model=…` 로 고친 뒤 다시 하라.\n' "$name" ;;
        "사용량 한도 초과" | "인증 필요" | "구독·결제 문제") : ;;
        *) printf '다시 하기: `COWORK_ONLY=%s bash %s %s "<같은 요청>"`\n' "$name" "$SELF_SHOW" "$SLUG" ;;
      esac
      printf '원인을 알아냈으면 `bash %s note %s "<원인·해결>"` 로 남겨라 — 다음 실행 요약에 보인다.\n' "$SELF_SHOW" "$name"
      [ -n "$body" ] && printf '\n<details><summary>부분 출력</summary>\n\n```\n%s\n```\n\n</details>\n' "$body"
    } > "$file"
    return 1
  fi
  {
    printf '<!-- cowork:%s | %s | exit=0 | %ss -->\n' "$name" "$stamp" "$secs"
    printf '# %s 분석 — %s\n\n' "$name" "$SLUG"
    printf '> 요청: %s\n> 생성: %s · 소요 %ss · `%s` · 읽기 전용 분석(작업공간 미수정)\n\n---\n\n' "$PROMPT_TEXT" "$stamp" "$secs" "$cmd"
    printf '%s\n' "$body"
  } > "$file"
}

# 분석 러너 하나(백그라운드). 실행 → 머리말 → 기록(배운 것은 화면에).
run_analysis() { # <계획 번호>
  local i="$1"
  local id="${P_ID[$i]}" cli="${P_CLI[$i]}" effort="${P_EFFORT[$i]}"
  local file="$OUT_DIR/$id-cowork.md" log="$LOG_DIR/$id.log" learned
  exec_with_retry "$id" "$cli" "${P_MODEL[$i]}" "$effort" "${P_SECS[$i]}" "${P_GOOD[$i]}" "${P_FB[$i]}" "$PROMPT_FILE" "$file" "$log"
  finalize "$id" "$file" "$EX_RC" "$EX_SECS" "$(agent_cmd_desc "$cli" "$EX_MODEL" "$effort")" "$EX_DIAG"
  learned="$(db record "$id" analysis "$SLUG" "$EX_RC" "$EX_DIAG" "$EX_SECS" "$EX_MODEL" "$log" 2>&1)"
  [ -n "$learned" ] && printf '   📒 %s — %s\n' "$id" "$learned" >&2
  [ "$EX_RC" -eq 0 ]
}

# --- review: final-report.md 최종 리뷰 라운드 -------------------------------
# Stop hook 이 nohup 백그라운드로 부른다. 분석에 성공했던 AI 들이 종합본을 재검토 → 종합 AI 가 반영해 갱신.
# 상세·페르소나·종합 프롬프트 SSOT: references/final-report-review.md
do_review() {
  local slug="$1"
  [[ "$slug" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { printf '리뷰: 잘못된 폴더명 "%s"\n' "$slug" >&2; return 2; }
  local dir="$REPO_ROOT/.cowork/$slug"
  local marker="$dir/.review-final-report" report="$dir/final-report.md" lock="$dir/.review-running"
  local rdir="$dir/.review" logf="$dir/final-report-log.md" review_ref="$SKILL_DIR/references/final-report-review.md"
  SLUG="$slug"

  [ -f "$marker" ] || return 0             # 마커 없으면 할 일 없음
  mkdir "$lock" 2> /dev/null || return 0   # 이미 리뷰 진행 중
  trap 'rm -rf "$lock"' EXIT
  if [ ! -f "$report" ]; then rm -rf "$lock"; trap - EXIT; return 0; fi   # 종합 전 — 다음 Stop 에서

  mkdir -p "$rdir"
  cp "$report" "$rdir/final-report.before.md"
  local rpersona f id
  rpersona="$(extract_block "$review_ref" REVIEW-PERSONA)"
  [ -n "$rpersona" ] || { printf 'REVIEW-PERSONA 마커 없음: %s\n' "$review_ref" >&2; return 1; }

  # 분석에 성공했던 AI 만 리뷰한다(분석 파일 첫 줄 exit=0). 원본 분석은 실패 파일까지 함께 싣는다.
  local participants="" names=""
  for f in "$dir"/*-cowork.md; do
    [ -f "$f" ] || continue
    id="$(basename "$f" -cowork.md)"; names="$names $id"
    head -1 "$f" | grep -q 'exit=0' && participants="$participants,$id"
  done
  local rprompt="$rdir/.review-prompt.md"
  {
    printf '%s\n\n' "$rpersona"
    printf -- '## 대상 작업공간\n\n%s\n\n---\n\n' "$(build_project_context "$REPO_ROOT")"
    printf '## 검토 대상 작업\n\n폴더: `.cowork/%s/` · 분석에 참여한 AI: %s\n\n---\n\n' "$slug" "${names# }"
    printf '## final-report.md (검토할 종합본)\n\n'
    cat "$report"
    for id in $names; do printf -- '\n\n---\n\n## 원본 분석: %s-cowork.md\n\n' "$id"; cat "$dir/$id-cowork.md"; done
  } > "$rprompt"

  ensure_db
  load_plan ""
  local i pids=() idx=() want
  for i in "${!P_ID[@]}"; do
    want="${P_ID[$i]}"
    [ -z "$participants" ] || [[ "$participants," == *",$want,"* ]] || continue
    rm -f "$rdir/$want-review.md"   # 🛑 지난 라운드 리뷰가 새 리뷰인 척 실리지 않게(2026-08-08 감사)
    review_one "$i" "$rprompt" "$rdir" & pids+=("$!"); idx+=("$i")
  done
  local ok=0 k
  for k in "${!pids[@]}"; do
    if wait "${pids[$k]}" && [ -s "$rdir/${P_ID[${idx[$k]}]}-review.md" ]; then ok=$((ok + 1))
    else printf '   ⚠️  리뷰 실패: %s (.review/.%s.log)\n' "${P_ID[${idx[$k]}]}" "${P_ID[${idx[$k]}]}" >&2; rm -f "$rdir/${P_ID[${idx[$k]}]}-review.md"; fi
  done
  if [ "$ok" -eq 0 ]; then printf '   ❌ 리뷰가 전부 실패했다 — final-report.md 를 건드리지 않는다.\n' >&2; return 1; fi
  printf '   리뷰 %d/%d 성공\n' "$ok" "${#pids[@]}" >&2

  # 종합 AI: claude → codex → 그 밖의 첫 AI (형식 지시를 가장 잘 지킨 순서 — 실측)
  local synth="" s
  for s in claude codex "${P_ID[@]}"; do for i in "${!P_ID[@]}"; do [ "${P_ID[$i]}" = "$s" ] && { synth="$i"; break 2; }; done; done
  local sp; sp="$(extract_block "$review_ref" REVIEW-SYNTHESIS)"
  [ -n "$sp" ] || { printf 'REVIEW-SYNTHESIS 마커 없음: %s\n' "$review_ref" >&2; return 1; }
  local sprompt="$rdir/.synth-prompt.md"
  {
    printf '%s\n\n---\n\n## 원본 final-report.md\n\n' "$sp"
    cat "$rdir/final-report.before.md"
    for f in "$rdir"/*-review.md; do [ -f "$f" ] && { printf -- '\n\n---\n\n## %s 리뷰\n\n' "$(basename "$f" -review.md)"; cat "$f"; }; done
  } > "$sprompt"
  exec_with_retry "${P_ID[$synth]}" "${P_CLI[$synth]}" "${P_MODEL[$synth]}" "${P_EFFORT[$synth]}" "${P_SECS[$synth]}" "${P_GOOD[$synth]}" "${P_FB[$synth]}" \
    "$sprompt" "$rdir/synthesis.md" "$rdir/.synth.log"
  db record "${P_ID[$synth]}" synthesis "$slug" "$EX_RC" "$EX_DIAG" "$EX_SECS" "$EX_MODEL" "$rdir/.synth.log" > /dev/null 2>&1

  local synout="$rdir/synthesis.md" newreport changelog applied
  newreport="$(awk '/^===FINAL-REPORT===$/{f=1;next} /^===CHANGELOG===$/{f=0} f' "$synout" 2> /dev/null)"
  changelog="$(awk '/^===CHANGELOG===$/{f=1;next} f' "$synout" 2> /dev/null)"
  # 검증: §1 결론 포함 + 최소 크기라야 교체(종합 실패가 보고서를 망가뜨리지 않게)
  if printf '%s' "$newreport" | grep -q '^## 1\. 결론' && [ "${#newreport}" -ge 200 ]; then
    printf '%s\n' "$newreport" > "$report"; applied="갱신"
  else
    applied="원본유지(종합 출력이 유효하지 않아 반영 안 함 — .review/*-review.md 를 직접 읽어 반영하라)"
  fi
  {
    printf '## 리뷰 라운드 — %s\n\n' "$(date '+%Y-%m-%d %H:%M')"
    printf '> 리뷰 %d개(%s) → %s 종합 → final-report.md **%s**\n\n' "$ok" "${participants#,}" "${P_ID[$synth]}" "$applied"
    [ -n "$changelog" ] && printf '%s\n\n' "$changelog"
    printf -- '- 원본 백업: `.review/final-report.before.md`\n\n---\n\n'
  } >> "$logf"
  rm -f "$marker"; rm -rf "$lock"; trap - EXIT
  return 0
}
review_one() { # <계획 번호> <프롬프트> <리뷰 폴더>
  local i="$1" id="${P_ID[$1]}"
  exec_with_retry "$id" "${P_CLI[$i]}" "${P_MODEL[$i]}" "${P_EFFORT[$i]}" "${P_SECS[$i]}" "${P_GOOD[$i]}" "${P_FB[$i]}" "$2" "$3/$id-review.md" "$3/.$id.log"
  db record "$id" review "$SLUG" "$EX_RC" "$EX_DIAG" "$EX_SECS" "$EX_MODEL" "$3/.$id.log" > /dev/null 2>&1
  [ "$EX_RC" -eq 0 ]
}

# --- list: 작업 목록 -----------------------------------------------------------
# 상태는 산출물 파일의 존재로 판정한다(별도 상태 파일을 두지 않는다 — 단일 소스).
list_coworks() {
  local root="$REPO_ROOT/.cowork" d name req status n_ok n_fail mtime f found=0
  [ -d "$root" ] || { printf '(.cowork 에 작업이 없다)\n'; return 0; }
  printf '.cowork 작업 목록\n\n'
  for d in "$root"/*/; do
    [ -d "$d" ] || continue
    name="$(basename "$d")"; found=1
    req="$(awk '/^## 분석 요청$/{f=1;next} f&&NF{print;exit}' "$d/.prompt.md" 2> /dev/null)"
    [ -n "$req" ] || req="(요청 불명)"
    n_ok=0; n_fail=0
    for f in "$d"*-cowork.md; do
      [ -f "$f" ] || continue
      if head -1 "$f" | grep -q 'exit=0'; then n_ok=$((n_ok + 1)); else n_fail=$((n_fail + 1)); fi
    done
    if [ -f "$d/final-report.md" ]; then status="✅ 종합완료"
    elif [ "$n_ok" -gt 0 ]; then status="⏳ 종합대기"
    elif [ "$n_fail" -gt 0 ]; then status="❌ 전부실패"
    else status="🔄 분석중"; fi
    [ "$n_fail" -gt 0 ] && [ "$n_ok" -gt 0 ] && [ ! -f "$d/final-report.md" ] && status="⚠️ ${n_ok}/$((n_ok + n_fail)) 성공"
    mtime="$(date -r "$d" '+%m-%d %H:%M' 2> /dev/null || echo '-')"
    [ "${#req}" -gt 46 ] && req="${req:0:46}…"   # 문자 단위로 자른다(printf %.Ns 는 바이트라 한글이 깨진다)
    printf '  %s  %s  (%s)\n      %s\n' "$status" "$name" "$mtime" "$req"
  done
  [ "$found" -eq 1 ] || printf '(.cowork 에 작업이 없다)\n'
}

# =============================================================================
# 실행부 — 🛑 모든 함수는 위에 정의돼 있어야 한다(예전에는 --review 가 아래쪽 함수를 정의 전에 불러
# "command not found" 로 codex 리뷰가 빠졌다).
# =============================================================================
case "${1:-}" in
  init | --init) shift; do_init "$@"; exit $? ;;
  list | --list | -l) list_coworks; exit 0 ;;
  agents | --agents) [ -f "$DB_FILE" ] || { printf '목록이 없다 — 먼저: bash %s init\n' "$SELF_SHOW" >&2; exit 1; }; db show; exit $? ;;
  note) [ $# -ge 3 ] || usage; db note "$2" "${@:3}"; exit $? ;;
  enable | disable) [ $# -ge 2 ] || usage; db set "$2" "enabled=$([ "$1" = enable ] && echo true || echo false)"; exit $? ;;
  set) [ $# -ge 3 ] || usage; db set "$2" "${@:3}"; exit $? ;;
  add-custom) [ $# -ge 3 ] || usage; mkdir -p "$REPO_ROOT/.cowork"; db add-custom "$2" "$3" "${4:-}"; exit $? ;;
  init-hook | --init-hook) do_init_hook; exit $? ;;
  review | --review) [ -n "${2:-}" ] || die "review 에는 폴더명이 필요하다. 예: cowork.sh review login-timeout"; do_review "$2"; exit $? ;;
  help | -h | --help | "") usage ;;
esac

[ $# -ge 2 ] || usage
SLUG="$1"; shift
PROMPT_TEXT="$*"
[[ "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]] || die "폴더명은 소문자·숫자·하이픈만 가능하다(작업 ID): '$SLUG'  예: login-timeout"
[ -n "${PROMPT_TEXT// /}" ] || die "분석 요청 프롬프트가 비어 있다."
[ -f "$PERSONA_FILE" ] || die "페르소나 파일이 없다: $PERSONA_FILE"

OUT_DIR="$REPO_ROOT/.cowork/$SLUG"
LOG_DIR="$OUT_DIR/.logs"
if [ -d "$OUT_DIR" ]; then
  printf '⚠️  기존 작업 폴더에 덮어쓴다: .cowork/%s\n' "$SLUG" >&2
  [ -f "$OUT_DIR/final-report.md" ] && printf '    (이전 final-report.md 가 사라진다 — 남기려면 다른 폴더명으로)\n' >&2
fi
mkdir -p "$LOG_DIR" || die "출력 폴더를 만들 수 없다: $OUT_DIR"

ensure_db
load_plan "$COWORK_ONLY"
[ "${#P_ID[@]}" -gt 0 ] || {
  printf '돌릴 AI 가 없다.\n' >&2
  for s in ${P_SKIP[@]+"${P_SKIP[@]}"}; do printf '   ⏭  %s\n' "$s" >&2; done
  die "로그인·설치 뒤 bash $SELF_SHOW init 으로 다시 스캔하거나 COWORK_ONLY='$COWORK_ONLY' 를 확인하라."
}

# 리뷰 대기 마커 — Stop hook 이 보고 final-report.md 를 재검토한다(hook 미설치 프로젝트에선 무해한 빈 파일).
printf '%s\n%s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$PROMPT_TEXT" > "$OUT_DIR/.review-final-report"

# 프롬프트 = 페르소나({{PROJECT_CONTEXT}} 치환) + 사용자 요청 원문
persona="$(extract_block "$PERSONA_FILE" PERSONA)"
[ -n "$persona" ] || die "페르소나 마커(---BEGIN PERSONA---)를 찾지 못했다: $PERSONA_FILE"
project_context="$(build_project_context "$REPO_ROOT")"
# 🛑 bash 자체 치환만 쓴다 — sed 는 경로의 `/`·`&` 에, awk -v 는 여러 줄 값에 깨진다(둘 다 실측).
if [[ "$persona" == *"{{PROJECT_CONTEXT}}"* ]]; then
  persona="${persona/'{{PROJECT_CONTEXT}}'/$project_context}"
else
  printf '⚠️  페르소나에 {{PROJECT_CONTEXT}} 마커가 없다 — 프로젝트 정보가 주입되지 않는다.\n' >&2
fi
PROMPT_FILE="$OUT_DIR/.prompt.md"
{ printf '%s\n\n' "$persona"; printf '## 분석 요청\n\n%s\n' "$PROMPT_TEXT"; } > "$PROMPT_FILE"
# 지난 실행의 결과가 이번 것처럼 섞이지 않게 지운다. COWORK_ONLY 재시도는 고른 AI 것만 지운다(나머지 결과는 보존).
if [ -n "$COWORK_ONLY" ]; then for id in "${P_ID[@]}"; do rm -f "$OUT_DIR/$id-cowork.md"; done
else rm -f "$OUT_DIR"/*-cowork.md; fi

printf '🔍 cowork: %s\n   요청: %s\n   출력: .cowork/%s/\n' "$SLUG" "$PROMPT_TEXT" "$SLUG" >&2
if [ -f "$REPO_ROOT/.cowork/cowork-prompt.md" ]; then printf '   지침: .cowork/cowork-prompt.md 를 모든 AI 에 주입함\n' >&2
else printf '   💡 .cowork/cowork-prompt.md 가 없다 — `bash %s init` 으로 이 프로젝트의 시스템 프롬프트를 만들어 두면 분석 품질이 오른다.\n' "$SELF_SHOW" >&2; fi
for s in ${P_SKIP[@]+"${P_SKIP[@]}"}; do printf '   ⏭  건너뜀: %s\n' "$s" >&2; done
brief="$(db brief "$(IFS=,; printf '%s' "${P_ID[*]}")")"
[ -n "$brief" ] && printf '   지난 기록:\n%s\n' "$brief" >&2

declare -a PIDS=()
for i in "${!P_ID[@]}"; do
  run_analysis "$i" & PIDS+=("$!")
  printf '   ▶ %-13s %s · 제한 %ss\n' "${P_ID[$i]}" "$(agent_cmd_desc "${P_CLI[$i]}" "${P_MODEL[$i]}" "${P_EFFORT[$i]}" | cut -c1-70)" "${P_SECS[$i]}" >&2
done
printf '\n   … %d개 AI 가 동시에 작업공간을 읽는 중 (수 분 소요)\n\n' "${#PIDS[@]}" >&2

ok=0; fail=0; FAILED=()
for i in "${!PIDS[@]}"; do
  if wait "${PIDS[$i]}"; then printf '   ✅ %-13s → .cowork/%s/%s-cowork.md\n' "${P_ID[$i]}" "$SLUG" "${P_ID[$i]}" >&2; ok=$((ok + 1))
  else printf '   ❌ %-13s 실패 → .cowork/%s/.logs/%s.log\n' "${P_ID[$i]}" "$SLUG" "${P_ID[$i]}" >&2; fail=$((fail + 1)); FAILED+=("${P_ID[$i]}"); fi
done
printf '\nSTATUS: 성공=%d 실패=%d 폴더=.cowork/%s\n' "$ok" "$fail" "$SLUG" >&2
[ "$fail" -gt 0 ] && printf 'FAILED: %s\n' "${FAILED[*]}" >&2
if [ "$ok" -eq 0 ]; then rm -f "$OUT_DIR/.review-final-report"; exit 1; fi

# --- 배턴 넘기기 (이 블록을 지우지 말 것) -----------------------------------
# 이 스크립트는 파이프라인의 절반(분석)만 한다. 종합은 오케스트레이터가 해야 하는데, 완료 알림에 "STATUS" 만
# 실려 와 종합을 통째로 빠뜨린 사고가 있었다(2026-07-16). 다음 단계를 출력에 실어 보낸다.
cowork_files=""
for f in "$OUT_DIR"/*-cowork.md; do [ -f "$f" ] && cowork_files+="       .cowork/$SLUG/$(basename "$f")"$'\n'; done
cat >&2 << EOF

════════════════════════════════════════════════════════════════
⏭️  아직 끝나지 않았다 — 종합(final-report.md)이 남았다 [필수]

  1. 아래 분석 파일을 모두 읽어라
$cowork_files  2. 결론을 좌우하는 근거(파일:줄)를 실제로 열어 교차검증하라 (환각 제거 = cowork 의 핵심 가치)
  3. .cowork/$SLUG/final-report.md 를 작성하라
       규칙·템플릿: $SKILL_SHOW/references/final-report-protocol.md
  4. 결론을 사용자에게 본문으로 보고하라 (파일 경로만 던지지 말 것)
  5. 사용자 요청에 구현·수정이 포함돼 있었다면 보고 직후 되묻지 말고 즉시 구현하라
       (final-report.md §7 권고 = 작업 지시서. 분석만 요청받았으면 여기서 멈춘다)
$([ "$fail" -gt 0 ] && printf '  6. 실패한 AI(%s)는 로그로 원인을 확인해 bash %s note <AI> "<원인·해결>" 로 남겨라\n       — .cowork/.cowork-agents.json 에 쌓여 다음 실행이 피해 간다\n' "${FAILED[*]}" "$SELF_SHOW")
  ⚠️ 종합(final-report.md) 완성 전에는 무엇도 수정하지 말라 — 검증 전 주장은 환각일 수 있다.
  ⚠️ 지금 다른 작업 중이어도 이 종합을 건너뛰지 말라. 종합이 안 끝난 작업: bash $SELF_SHOW list
════════════════════════════════════════════════════════════════
EOF
exit 0
