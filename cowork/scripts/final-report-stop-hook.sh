#!/usr/bin/env bash
# final-report-stop-hook.sh — Claude Code 의 Stop hook.
#
#   설치: bash <스킬 폴더>/scripts/cowork.sh init-hook  (settings.json 에 멱등 등록)
#         ⚠️ init 은 AI 목록·시스템 프롬프트를 만드는 별개 명령이다(혼동 주의).
#   역할: final-report.md 까지 만들어진 cowork 작업을 찾아, 분석에 참여했던 AI 들로 한 번 더
#         재검토(리뷰 라운드)하도록 백그라운드에 던진다.
#
# 설계 요지
#   - Stop hook 은 blocking 이다. 리뷰는 15분 안팎이라 nohup 백그라운드로 던지고 hook 은 즉시 끝낸다.
#   - 대상 판별은 파일 존재로만 한다(마커 .review-final-report + final-report.md). 리뷰가 끝나면 마커가 지워진다.
#   - 무한 루프 방지 3중: ① stop_hook_active 면 즉시 종료 ② decision block 을 하지 않는다 ③ 완료 시 마커 삭제.
#   - cowork.sh 는 이 파일 옆의 것을 부른다(스킬이 프로젝트 안이든 전역이든 같다). 작업공간은 COWORK_ROOT 로 넘긴다.
set -uo pipefail

payload=""
[ -t 0 ] || payload="$(cat 2> /dev/null || true)"
if [ -n "$payload" ] && command -v jq > /dev/null 2>&1; then
  active="$(printf '%s' "$payload" | jq -r '.stop_hook_active // false' 2> /dev/null || echo false)"
  [ "$active" = "true" ] && exit 0
fi

root="${CLAUDE_PROJECT_DIR:-$PWD}"
cowork_root="$root/.cowork"
runner="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cowork.sh"
[ -d "$cowork_root" ] || exit 0
[ -f "$runner" ] || exit 0

for marker in "$cowork_root"/*/.review-final-report; do
  [ -f "$marker" ] || continue
  dir="$(dirname "$marker")"
  slug="$(basename "$dir")"
  [ -f "$dir/final-report.md" ] || continue     # 아직 종합 전 — 다음 Stop 에서
  [ -d "$dir/.review-running" ] && continue      # 이미 리뷰 중
  COWORK_ROOT="$root" nohup bash "$runner" review "$slug" > "$dir/.review-hook.log" 2>&1 &
  disown 2> /dev/null || true
done
exit 0
