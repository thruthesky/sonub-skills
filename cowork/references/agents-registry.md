# AI 목록 `.cowork/.cowork-agents.json` — 구조·학습 규칙·핵심 소스

## 목차

1. 핵심 개념 — 왜 목록을 두나
2. 파일과 역할
3. JSON 구조
4. 어댑터 표 — 지원하는 AI 와 읽기 전용 방어
5. init 스캔 흐름
6. 실행 계획(plan) — 무엇을 돌리고 무엇을 건너뛰나
7. 실패 분류(classify_failure)
8. 학습(record) — 실패가 다음 실행을 바꾸는 규칙
9. 모델 거절 재시도(exec_with_retry)
10. 새 어댑터를 넣을 때 체크리스트

## 1. 핵심 개념 — 왜 목록을 두나

cowork 가 쓰는 AI 는 **claude·codex·agy 셋**이다(2026-11-18 사용자 지시 — v3.0.0. 그전 v2 는 copilot 두 두뇌·gemini·grok·
kimi·opencode·custom 까지 아홉 가지를 스캔했다). 셋이라도 컴퓨터마다 설치·로그인·한도가 다르다. 기록 없이 돌리면 ① 없는
AI 를 매번 부르다 실패하고, ② 같은 원인(로그인 만료·한도)으로 매번 900초를 버려도 다음 실행이 그것을 모른다.

그래서 **"이 컴퓨터에서 무엇을 쓸 수 있나"를 파일 하나에 기록하고, 실행할 때마다 그 파일을 읽고, 실행 결과를 다시 그 파일에 쌓는다.**

- 스캔(`init`)이 설치·버전·모델을 찾고, **확인 질문으로 실제로 답하는지** 시험한다 — 설치됐다고 쓸 수 있는 것은 아니다
  (2026-10-20 실측: 그때 함께 쓰던 CLI 중 넷이 설치만 되고 로그인 대기·구독 없음·로그인 안 됨·월 한도 초과였다).
- 분석은 목록에서 쓸 수 있는 것만 돌린다.
- 실패는 원인별로 분류해 기록하고, 원인에 따라 다음 실행을 바꾼다(건너뜀·쉬는 시간·제한 시간 늘림·다른 모델).
- 사람·오케스트레이터는 `note` 로 원인과 해결을 남긴다 — 다음 실행 머리에 그대로 보인다.

## 2. 파일과 역할

| 파일 | 역할 |
|---|---|
| `scripts/cowork.sh` | 명령 분기·분석·리뷰·목록·시스템 프롬프트. `load_plan`·`exec_with_retry`·`run_analysis`·`finalize` |
| `scripts/agents.sh` | **AI 를 실행하는 유일한 곳**(`agent_exec`) · **기본 모델·등급의 SSOT**(`default_model`·`default_effort`) · `classify_failure` · `scan_agents`·`probe_one` |
| `scripts/agents-db.pl` | **JSON 을 쓰는 유일한 곳** — `merge`·`plan`·`record`·`note`·`set`·`show`·`brief` (flock 잠금). `COWORK_AGENTS`(셋)에 없는 AI 는 거른다 |
| `.cowork/.cowork-agents.json` | 목록(작업공간마다). 저장소에 커밋돼도 되게 로그의 키·토큰처럼 보이는 값은 가린다 |
| `.cowork/.probe/` | 마지막 init 의 확인 질문 원본(`<AI>.out`·`.log`·`.result`, `scan.tsv`) |

## 3. JSON 구조

```json
{
  "version": 1, "scannedAt": "2026-10-20T10:44:09+0900", "updatedAt": "…", "host": "mac", "sandbox": "sandbox-exec",
  "agents": {
    "codex": {
      "cli": "codex", "path": "/Users/me/.local/bin/codex", "version": "codex-cli 0.169.1",
      "enabled": true,            // 사람이 끄면 false — init 이 다시 켜지 않는다
      "available": true,          // 마지막 확인·실행에서 쓸 수 있었나
      "status": "ok",             // ok | installed | missing | no-sandbox | auth-failed | subscription | limited | probe-failed | unsafe
      "statusDetail": "GPT-6.2 Astra · high(기본값 고정 — ~/.codex/config.toml 의 모델을 쓰지 않는다)",
      "model": "gpt-6.2-astra", "modelPinned": false,   // 고정 아니면 기록용 — 실행은 agents.sh 기본값
      "effort": "high", "effortPinned": false,
      "timeout": null,            // 시간 초과 때 1.5배씩 늘어난다(null = COWORK_TIMEOUT 기본 900)
      "fallbackModels": ["gpt-6.2-sol"], "lastGoodModel": "gpt-6.2-astra",
      "cooldownUntil": null,      // 사용량 한도 뒤 이 시각까지 건너뜀
      "readonly": "codex --sandbox read-only (자체 OS 샌드박스)", "readonlyVerifiedAt": "…",
      "probe": { "at": "…", "result": "ok", "secs": 10, "diag": "" },
      "stats": { "runs": 3, "ok": 2, "fail": 1, "consecutiveFails": 0, "lastOkAt": "…", "lastFailAt": "…", "avgSecs": 410 },
      "failures": [ { "at": "…", "phase": "analysis", "task": "login-timeout", "exit": 124, "diag": "제한 시간 초과",
                      "secs": 900, "model": "gpt-6.2-astra", "log": "로그 끝 8줄(키는 가림)" } ],   // 최근 20개
      "notes": [ { "at": "…", "text": "넓은 요청은 1800초 필요" } ]                               // 최근 30개
    }
  },
  "candidates": {}                // v2 의 "어댑터 없는 후보 CLI" 자리 — v3 은 비워 둔다
}
```

`merge`(init) 가 **보존**하는 것: `enabled`·`timeout`·`notes`·`failures`·`stats`·`lastGoodModel`·`fallbackModels`·
`modelPinned`(이면 `model` 도)·`effortPinned`(이면 `effort` 도). **갱신**하는 것: `cli`·`path`·`version`·`readonly`·`status`·`statusDetail`·`probe`·
`model`·`effort`(고정 아니면 기본값으로). **지우는** 것: 셋에 없는 AI 의 기록 전부(예전 판의 copilot·gemini·grok·kimi·opencode·custom).
codex 의 `fallbackModels` 가 비었거나 예전 기본(`gpt-5.6-terra`)뿐이면 `gpt-6.2-sol` 로 바꾼다.
빠른 스캔(`--quick`)은 증거가 없으므로 같은 버전에서 막혔던 AI(auth-failed·subscription·probe-failed·unsafe·limited)를 되살리지 않는다.

## 4. 어댑터 표 — 지원하는 AI 와 읽기 전용 방어

| AI(id) | CLI | 기본 모델 · 등급 | 읽기 전용 방어 | 특이점 |
|---|---|---|---|---|
| `claude` | `claude -p` | `claude-fable-5-2` · `high` | `--allowedTools "Read Grep Glob"` + `--disallowedTools` + sandbox-exec | plan 모드 금지 |
| `codex` | `codex exec -o` | `gpt-6.2-astra` · `high` | `--sandbox read-only` | config 의 모델을 쓰지 않는다 · 거절되면 `gpt-6.2-sol` |
| `agy` | `agy -p` | `gemini-4-neon-xhigh` · `xhigh` | sandbox-exec 만 + `--dangerously-skip-permissions` | 없으면 실행 안 함 · ID 접미어가 곧 등급 |

기본값은 `agents.sh` 의 `default_model`·`default_effort` 한 곳에 있다(2026-11-18 세 모델 모두 확인 질문·읽기 전용 공격 실측·실제 분석 통과 —
claude 2.1.327 · codex-cli 0.169.1 · agy 1.5.11). 빠진 CLI(copilot·gemini·grok·kimi·opencode)의 실행법과 함정은 readonly-enforcement.md 에 남겨 두었다.

근거와 재현 절차: [readonly-enforcement.md](readonly-enforcement.md). 핵심 실행 코드(`agents.sh`):

```bash
agent_exec() {   # <id> <cli> <model> <effort> <초> <프롬프트파일> <출력파일> <로그파일>
  if cli_needs_sandbox "$cli" && ! has_sandbox; then …; return 98; fi        # agy
  bin="$(cli_path "$cli")" || return 96                                       # 비대화형 PATH 폴백 포함
  has_sandbox && g=(sandbox-exec -p "$(sbx_profile)")                         # (deny file-write* (subpath "<작업공간 실경로>"))
  cd "$REPO_ROOT"
  case "$cli" in
    claude) run_timeout "$secs" ${g[@]+"${g[@]}"} "$bin" -p "$(cat "$pf")" ${model:+--model "$model"} ${effort:+--effort "$effort"} \
              --allowedTools "Read Grep Glob" --disallowedTools "Edit Write NotebookEdit Bash" > "$out" 2>> "$lg" < /dev/null ;;
    codex)  run_timeout "$secs" "$bin" exec --sandbox read-only --skip-git-repo-check --color never \
              ${model:+-m "$model"} ${effort:+-c model_reasoning_effort="$effort"} -o "$out" - < "$pf" >> "$lg" 2>&1 ;;
    agy)    run_timeout "$secs" "${g[@]}" "$bin" -p "$(cat "$pf")" --output-format text --model "$model" --effort "$effort" \
              --dangerously-skip-permissions --disable-slash-commands --print-timeout "${secs}s" > "$out" 2>> "$lg" < /dev/null ;;
  esac
}
```

## 5. init 스캔 흐름 (`scan_agents`)

1. `ADAPTER_AGENTS`(claude·codex·agy)마다: 실행 파일(`cli_path`) → 없으면 `missing`, 샌드박스가 필요한데 없으면 `no-sandbox`.
2. 버전(`--version`, 15초) · 기록할 모델(`scan_model` = 기본값).
3. 확인 질문을 **분석과 같은 모델로 병렬**로(`probe_one &` — 사람이 고정한 모델이 있으면 그것) — 답에 `COWORK_OK` 가 있으면 ok,
   아니면 `classify_failure` 로 이유. `--verify` 면 이어서 공격 질문 → `.cowork/.probe/HACKED-<id>.txt` 가 생기면 `unsafe`(지우고 사용 안 함).
4. `agents-db.pl merge scan.tsv` → `show`(고정 안 한 AI 는 기본 모델·등급을 보여 준다).

## 6. 실행 계획 (`agents-db.pl plan` → `load_plan`)

```perl
if    ($status =~ /^(missing|no-sandbox|unsafe)$/)  { skip }          # 고른 것(COWORK_ONLY)이어도 돌리지 않는다
elsif (!%want && !$a->{enabled})                    { skip '사용 안 함' }
elsif (!%want && !$a->{available})                  { skip "$status — 이유" }
elsif (!%want && cooldownUntil > now)               { skip '사용량 한도 — HH:MM 까지 쉼' }
```

- `COWORK_ONLY` 로 고르면 사람이 직접 고른 것이므로 사용 안 함·쉬는 시간·available 을 무시하고 돌린다.
- 셋에 없는 AI 는 목록에 남아 있어도 내지 않는다. `COWORK_ONLY` 로 골랐으면 "cowork 는 이 AI 를 쓰지 않는다" 로 건너뛴다.
- 칸 구분은 `\x1f` — 🛑 탭은 bash `read` 에서 공백 문자라 빈 칸(고정 안 한 모델)이 겹치면 칸이 밀린다.
- 🛑 `plan` 의 모델·등급 칸은 **사람이 고정했을 때만** 채운다. init 이 적어 둔 예전 모델(v2 의 `opus`·`xhigh` 등)이 새 기본값을
  가리지 않게 하려는 것이다 — 그래서 init 을 다시 돌리지 않아도 기본값이 바로 적용된다.
- 모델·등급·제한 시간은 `load_plan` 이 **부모 셸에서** 정한다(러너는 백그라운드로 갈라진다):
  환경변수(`COWORK_MODEL_<AI>`, 예전 이름) > 고정한 JSON `model`(`set <AI> model=…`) > `default_model`. 등급도 같은 순서이고, agy 는
  고정 등급이 없으면 모델 ID 접미어를 쓴다. 제한 시간은 `COWORK_TIMEOUT` 을 사람이 줬으면 그 값, 아니면 JSON `timeout`, 아니면 900.

## 7. 실패 분류 (`classify_failure`)

종료 코드·로그·짧은 답을 보고 진단 하나를 낸다. **순서가 중요하다**(2026-10-20 실측 두 건이 근거):

1. `96` CLI 미설치 · `98` 샌드박스 없음
2. 시간 초과(124)인데 답이 2000바이트 이상 → `제한 시간 초과`(긴 분석 본문의 "billing"·"401" 로 오진하지 않게 로그를 먼저 본다)
3. 구독 문구(`subscription does not have access`·`out of balance`·`free tier can only be used` …) → `구독·결제 문제`
   — 구독 없음이 **429·rate_limit 과 함께** 오는 CLI 가 있었다(예전 kimi)
4. 인증 문구(`not authenticated`·`opening authentication page`·`401` …) → `인증 필요`
5. 한도 문구(`exceeded your monthly quota`·`quota_exceeded`·`429` …) → `사용량 한도 초과` — 월 한도가 **402 와 함께** 오는 CLI 가 있었다(예전 copilot)
6. 남은 `402` → `구독·결제 문제`
7. 모델 문구(`is not supported for model`·`requires a newer version`·`is not configured` …) → `모델·추론 등급 거절`
8. 124 → `제한 시간 초과` · 50바이트 미만 → `빈 응답`

## 8. 학습 (`agents-db.pl record`)

```perl
if ($exit eq '0') { ok++; consecutiveFails = 0; lastGoodModel = $model; cooldownUntil = undef; status installed/probe-failed/limited → ok }
else {
  push failures (최근 20개, 로그 끝 8줄 — 키·토큰은 가림);
  'CLI 미설치'·'샌드박스 없음'  → status missing/no-sandbox, available=false
  '인증 필요'·'구독·결제 문제'   → status auth-failed/subscription, available=false   # 사람이 고친 뒤 init 이 되살린다
  '사용량 한도 초과'             → cooldownUntil = now + 180분(COWORK_LIMIT_COOLDOWN_MIN), 로그에 monthly·weekly 면 24시간
  '제한 시간 초과…'              → timeout = min(timeout × 1.5, COWORK_TIMEOUT_MAX=2400)
  '모델·추론 등급 거절'          → (러너가 이미 다른 모델로 재시도) 기록만
  consecutiveFails ≥ 3           → "원인을 확인해 note 로 남겨라" 경고
}
```

배운 것은 한 줄로 돌려주고 `run_analysis` 가 `📒 <AI> — …` 로 화면에 찍는다. 확인 질문 실패도 `phase: "probe"` 로 같은 기록에 쌓인다.
실행 머리의 "지난 기록"(`brief`)은 이번에 돌릴 AI 의 **최근 7일 실패 수·마지막 진단·메모 2개**를 보여 준다.

## 9. 모델 거절 재시도 (`exec_with_retry`)

```bash
agent_exec … "$model" …; EX_RC=$?; exec_outcome …          # 빈 응답 → 99, 진단, codex 실제 모델
if [ "$EX_DIAG" = "모델·추론 등급 거절" ]; then
  for m in $good ${fb//,/ }; do [ -n "$m" ] && [ "$m" != "$EX_MODEL" ] && { alt="$m"; break; }; done   # 마지막 성공 모델 → fallbackModels
  [ -n "$alt" ] && agent_exec … "$alt" …                     # 한 번만. 1차·2차 로그를 합쳐 남긴다
fi
```

예: 고정한 새 모델을 옛 CLI 가 거절(`requires a newer version of Codex`)하면 지난번에 성공한 모델로 그 자리에서 다시 돈다.

## 10. 새 어댑터를 넣을 때 체크리스트

🛑 v3 은 사람의 지시로 셋만 쓴다 — 넷째 AI 는 사람이 요청할 때만 넣는다. 예전 판의 실행법(copilot·gemini·grok·kimi·opencode)은
git 이력(`sonub-skills` 의 v3.0.0 이전)과 readonly-enforcement.md 에 있다.

1. `agents.sh` 의 `ADAPTER_AGENTS` 에 id, `default_model`·`default_effort`, `cli_needs_sandbox`(CLI 옵션 방어를 실측으로 확인하기
   전에는 **넣는다**), `agent_exec` 의 분기, `agent_cmd_desc`, `scan_model`, `readonly_desc`, `env_override` 의 예전 이름을 더한다.
2. 임시 git 저장소에서 공격 실측(readonly-enforcement.md §재현 절차) — 파일이 안 생기고, 읽기는 되는지.
3. `init --verify` 가 ok·읽기 전용 통과를 찍는지, 짧은 분석 한 번이 `## 1.`~`## 6.` 형식으로 나오는지.
4. 실패 문구가 새 형태면 `classify_failure` 에 넣는다(순서 7절).
5. readonly-enforcement.md 의 실측 표·SKILL.md 의 방어 목록과 모델 표·이 문서 4절 표를 함께 고친다.
