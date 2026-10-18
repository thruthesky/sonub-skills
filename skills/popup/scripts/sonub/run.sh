#!/usr/bin/env bash
# SONUB 용어 팝업 스크립트를 앱 컨테이너 안에서 돌린다 — sonub 저장소 루트에서 실행한다.
#   bash <popup 스킬>/scripts/sonub/run.sh popup-check.php
#   bash <popup 스킬>/scripts/sonub/run.sh popup-audit.php resources/views/ai/build.blade.php ko
#   bash <popup 스킬>/scripts/sonub/run.sh translate/verify.php storage/app/popup-work ja zh
# 스크립트는 스킬 폴더(저장소 밖)에 있어 컨테이너가 볼 수 없다. 그래서 표준 입력으로 넘기고(php -- 인자 < 파일),
# 스크립트는 컨테이너의 작업 폴더(/app = 저장소 루트)를 기준으로 Laravel 을 띄운다.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
script="${1:?스크립트 이름을 주세요 (예: popup-check.php)}"
shift
[ -f "$here/$script" ] || { echo "없는 스크립트: $script" >&2; exit 2; }
[ -f app/Content/Glossary.php ] || { echo "sonub 저장소 루트에서 실행하세요 (app/Content/Glossary.php 가 없습니다)" >&2; exit 2; }
exec docker compose exec -T app php -- "$@" < "$here/$script"
