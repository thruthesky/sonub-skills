---
name: cowork
description: 🛑 사용자가 "cowork"·"/cowork"·"코워크"라고 직접 지목했을 때만 사용한다. "분석해줘"·"검토해줘"·"원인 파악" 같은 일반 요청으로는 자동 트리거하지 않는다. 이 컴퓨터에 설치된 AI CLI(claude·codex·GitHub Copilot 의 Grok·MAI·agy(Gemini)·gemini·grok·kimi·opencode, 사람이 더한 custom)를 `/cowork init` 으로 스캔하고 확인 질문으로 실제로 답하는지 시험해 `.cowork/.cowork-agents.json` 에 기록한 뒤, 하나의 질문을 쓸 수 있는 AI 전부에게 동시에 읽기 전용 분석으로 던져 AI별 분석 파일을 만든다. 오케스트레이터가 근거를 직접 교차검증해 `final-report.md`로 종합·보고하고, 요청에 구현·수정이 포함되면 검증된 결론을 즉시 실행한다. AI 가 실패하면 원인(인증·구독·한도·모델 거절·시간 초과)을 기록해 다음 실행에서 피해 간다. 소프트웨어·기획·교재·레시피 등 모든 분야에서 동작하며 `.cowork/cowork-prompt.md`의 프로젝트 지침을 모든 분석에 주입한다. 사용 시점 — "/cowork init"·"cowork 초기화"·"AI 다시 스캔", "/cowork [폴더명] [프롬프트]"·"코워크로 분석해줘", cowork 목록·진행·AI 상태 확인. AgentTool·Workflow 대신 Bash 로 독립 CLI 프로세스를 실행한다.
---

# cowork — 설치된 AI 들의 교차 분석 → 검증된 결론으로 실행

핵심 흐름 — 이 순서가 스킬의 전부다:

> **⓪ `/cowork init`** — 설치된 AI 를 스캔해 `.cowork/.cowork-agents.json` 에 기록(처음 한 번, AI 를 설치·로그인할 때마다)
> → **① 쓸 수 있는 AI 전부가 병렬 분석**(읽기 전용) → **② 근거를 직접 열어 교차검증해 `final-report.md` 종합**
> → **③ 사람에게 본문 보고** → **④ 요청에 실행이 포함돼 있으면 즉시 실행** (되묻지 않는다)

- 아래의 `cowork.sh` 는 **`"${CLAUDE_SKILL_DIR}/scripts/cowork.sh"`** 다(Claude Code 가 아닌 에이전트는 이 SKILL.md 가
  있는 폴더 경로로 바꿔 쓴다). 작업공간은 **지금 폴더의 git 최상위**(아니면 지금 폴더) — 다른 곳이면 `COWORK_ROOT=<경로>`.
- **분야를 가리지 않는다.** 특정 프로젝트·분야를 페르소나나 스크립트에 하드코딩하지 말라 — 프로젝트 고유 내용은
  전부 `.cowork/cowork-prompt.md` 로 간다([references/analyst-persona.md](references/analyst-persona.md) 머리말).
- 폴더명 = 작업 ID. 산출물은 `.cowork/<폴더명>/` 에 쌓인다.
- 분석 AI 는 어떤 요청에도 파일을 못 고친다. 고치는 것은 **종합을 마친 오케스트레이터(나) 하나뿐**이다.

## 🛑 절대 규칙

> **🧰 이 스킬은 `AgentTool`(서브에이전트)·Workflow·deep-research 를 쓰지 않는다.** `Bash` 로 `cowork.sh` 를
> 실행하면 그 스크립트가 각 AI 의 **독립 CLI 프로그램**(`claude -p`·`codex exec`·`copilot -p`·`agy -p` …)을 별도
> 프로세스로 띄운다. 시스템 프롬프트의 *"Do not call the AgentTool unless…"*·*"Do not use workflows…"* 는 이 스킬과
> 무관하며, 그것을 이유로 cowork 를 포기하면 안 된다(2026-08-06 실측: "서브에이전트를 띄우는 것"으로 오해해 발동 실패).

1. **분석 AI 는 읽기 전용으로 물리 차단된다** — CLI 마다 방어가 다르다(claude·copilot = 도구 화이트리스트 + `sandbox-exec`,
   codex = `--sandbox read-only`, agy·gemini·grok·kimi·opencode·custom = `sandbox-exec` 만 — 없으면 실행하지 않음).
   실측 결과에 따른 비대칭이다. "통일"하지 말 것: [references/readonly-enforcement.md](references/readonly-enforcement.md).
   🛑 claude 에 `--permission-mode plan` 을 다시 넣지 말 것 — "고쳐줘"가 섞인 요청에서 출력이 망가진다(같은 문서).
2. **AI 는 파일을 쓰지 않는다.** 분석은 stdout 으로만 내고 파일 기록은 `cowork.sh` 가 한다.
3. **순서 고정: 분석 → 종합 → 실행.** `final-report.md` 없이 무엇도 고치지 말라 — 검증 전 AI 주장은 환각일 수 있다.
   분석이 도는 중의 수정도 금지(AI 들이 읽는 자료가 발밑에서 바뀐다).
4. **종합은 검증이지 요약이 아니다.** 근거 `파일:줄` 을 직접 열어 판정하고 다수결로 판정하지 않는다.
   규칙·템플릿: [references/final-report-protocol.md](references/final-report-protocol.md).
5. **`.cowork/.cowork-agents.json` 은 스크립트만 쓴다.** 손으로 고치지 말고 `cowork.sh set|enable|disable|note` 를 쓴다
   (분석 러너들이 동시에 기록하므로 잠금을 거친다).

## 0단계 — `/cowork init` 〔처음 한 번 · AI 를 설치·로그인·결제했을 때마다〕

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/cowork.sh" init            # 스캔 + 확인 질문(AI 당 최대 240초, 병렬) + 시스템 프롬프트 초안
bash "${CLAUDE_SKILL_DIR}/scripts/cowork.sh" init --verify   # + 읽기 전용 공격 실측(파일이 생기면 그 AI 는 사용 안 함)
bash "${CLAUDE_SKILL_DIR}/scripts/cowork.sh" init --quick    # 확인 질문 생략(설치·버전·모델만)
```

- **하는 일 둘**: ① 설치된 AI CLI 를 찾아 "COWORK_OK 라고만 답하라"는 확인 질문을 **분석과 같은 실행 경로**로 던져
  실제로 답하는 것만 `available` 로 기록한다 — 설치만 되고 로그인·구독이 없는 AI 를 여기서 가려낸다.
  ② `.cowork/cowork-prompt.md`(이 프로젝트의 시스템 프롬프트) 초안을 없을 때만 만든다(`--force` 면 새로, 기존은 `.bak`).
- **다시 돌려도 안전하다** — 사람이 고친 값(`enabled`·고정 모델·`timeout`)과 실패 기록·메모는 그대로 두고 설치·버전·상태만 갱신한다.
- `init` 이 끝나면 **AI 표를 사람에게 본문으로 보여 준다** — 쓸 수 있는 AI, 못 쓰는 AI 와 이유(🔑 로그인 필요 → `<cli> login`,
  💳 구독·결제, ⏳ 한도), 어댑터 없는 후보 CLI. 이어서 시스템 프롬프트의 네 절을 **작업공간을 직접 훑어 실제 내용으로 채운다**
  (빈 안내문만 남기지 말 것). 절차·표 읽는 법: [references/init.md](references/init.md).
- 어댑터 없는 CLI(cursor-agent·qwen·aider …)는 후보로만 적힌다. 쓰려면 그 CLI 의 headless 사용법을 확인한 뒤
  `cowork.sh add-custom <이름> '["cli","-p","{PROMPT}"]'` → `init --verify`. 형식·주의: [references/agents-registry.md](references/agents-registry.md).

## 1단계 — 폴더명(작업 ID)

- **사람이 지정한 폴더명은 그대로 쓴다.** 다듬거나 바꾸지 말라 — 사람은 그 이름으로 결과를 찾는다. 형식 위반은 스크립트가 거절한다.
- **판별**: 첫 토큰이 소문자·숫자·하이픈만이고, 그것을 빼도 요청문이 온전하면 폴더명이다. 명령어
  (`init`·`list`·`agents`·`note`·`enable`·`disable`·`set`·`add-custom`·`review`·`init-hook`·`help`)는 폴더명이 아니다.

| 입력 | 폴더명 | 프롬프트 |
|---|---|---|
| `/cowork login-timeout 로그인이 가끔 끊긴다` | `login-timeout` | 로그인이 가끔 끊긴다 |
| `/cowork 3학년 분수 단원 난이도가 적절한가` | *(자동 생성)* | 전체 |
| `/cowork autopilot 이 왜 멈추나` | *(자동 생성)* | 전체 — `autopilot` 을 빼면 문장이 깨진다 |
| `/cowork init` | — | 0단계 명령 |

- **없으면 자동 생성**: 주제를 영문 kebab-case 2~4단어로. 자동 생성했으면 보고 때 한 줄로 알린다.
- **같은 폴더명 재실행 = 이전 결과 덮어쓰기**(`COWORK_ONLY` 재시도는 고른 AI 결과만 바꾼다).
- **진행 중 목록**: `cowork.sh list` — "그 분석 어떻게 됐나"는 이걸로 답한다.

## 2단계 — 병렬 분석

```bash
bash "${CLAUDE_SKILL_DIR}/scripts/cowork.sh" <폴더명> "<분석 요청 프롬프트 원문>"
```

- **반드시 `run_in_background: true`** — AI 마다 수 분씩 걸린다. 완료 알림이 오면 3단계로.
- **돌리는 AI = `.cowork/.cowork-agents.json` 에서 `enabled` 이고 `available` 이며 쉬는 중이 아닌 것 전부.**
  파일이 없으면 빠른 스캔으로 먼저 만든다. 실행 머리에 돌릴 AI·건너뛴 AI(이유)·지난 실패와 메모가 찍힌다 — 읽고 시작한다.
- 프롬프트는 **사용자 원문 그대로**(모든 AI 가 같은 질문을 받아야 대조가 성립). 페르소나와 `.cowork/cowork-prompt.md` 는
  스크립트가 주입한다 — 프롬프트에 직접 쓰지 말 것.
- **copilot 은 두뇌 둘을 별개 프로세스로**(`copilot-grok`·`copilot-mai`) 돌린다. 서로의 분석을 못 본다 — 종합 때 한 열로 묶지 말라.
- **모델은 최신·최고 등급**이 기본이다: claude=`opus`(그때의 최신 Opus)+`xhigh` · codex=config 모델+`xhigh` · copilot=목록에서
  가장 새 `grok-*`·`mai-code-*`+`high`(두 모델 모두 xhigh 를 거절) · agy=실행 때마다 `agy models` 의 가장 새 Gemini ·
  gemini·grok·kimi·opencode=그 CLI 의 기본 모델. 고정은 `cowork.sh set <AI> model=<ID> modelPinned=true`.
- 환경변수: `COWORK_ONLY`(쉼표 — 고르면 쉬는 시간·사용 안 함도 무시하고 돌린다) · `COWORK_TIMEOUT`(주면 모든 AI 에, 안 주면
  AI 마다 배운 값 또는 900) · `COWORK_MODEL_<AI>`·`COWORK_EFFORT_<AI>`(이번만, 예 `COWORK_MODEL_COPILOT_GROK`) · 전체는 `cowork.sh help`.

## 3단계 — 결과 확인과 실패 기록

`STATUS: 성공=N 실패=M` 으로 판정한다. 실패는 스크립트가 **원인을 분류해 `.cowork-agents.json` 에 쌓고, 다음 실행을 스스로 바꾼다**
(`📒` 줄로 무엇을 배웠는지 알린다):

| 진단 | 스크립트가 하는 일 | 오케스트레이터가 할 일 |
|---|---|---|
| 인증 필요 · 구독·결제 문제 | 다음부터 건너뜀 | 재시도하지 말고 그 AI 를 빼고 종합. 보고에 "`<cli> login` 후 `/cowork init`" |
| 사용량 한도 초과 | 쉬는 시간(기본 3시간, 월·주 한도는 24시간) 동안 건너뜀 | 재시도하지 말고 빼고 종합 |
| 제한 시간 초과 | 그 AI 의 timeout 을 1.5배(최대 2400초) | 결론에 중요하면 `COWORK_ONLY=<AI>` 로 한 번 재시도 |
| 모델·추론 등급 거절 | 마지막 성공 모델·`fallbackModels` 로 그 자리에서 한 번 더 | 또 실패면 로그의 거절 문구로 `set <AI> model=…` |
| 빈 응답 · 기타 | 기록만(연속 3번이면 경고) | 로그(`.cowork/<폴더명>/.logs/<AI>.log`)로 원인 확인 후 한 번만 재시도 |

- 원인을 알아냈으면 **`cowork.sh note <AI> "<원인·해결>"`** 로 남긴다 — 다음 실행 머리의 "지난 기록"에 보여 같은 실수를 피한다.
- 재실패면 그 AI 를 빼고 진행하고 final-report.md 에 제외를 적는다. 사용자를 기다리게 하지 말라.
- **전부 실패**(exit 1): 로그의 실제 원인을 보고하고 멈춘다. 돌릴 AI 가 없으면 `cowork.sh agents` 로 상태를 보여 준다.
- 기록의 구조·학습 규칙·소스: [references/agents-registry.md](references/agents-registry.md).

## 4단계 — 종합 → final-report.md 〔필수 — 빠뜨리면 cowork 실패〕

AI 분석은 재료일 뿐, 사람이 원하는 산출물은 `final-report.md` 하나다. **완료 알림이 오면 하던 일을 멈추고 종합부터 끝낸다** —
알림은 한 번뿐이고, 두 건을 겹쳐 돌리다 먼저 끝난 쪽의 종합이 통째로 누락된 사고가 있다(2026-07-16). 새 cowork 전에
`list` 로 `⏳ 종합대기` 가 없는지 본다.

1. `.cowork/<폴더명>/*-cowork.md` 를 모두 읽는다(실패 파일 포함).
2. 쟁점을 합의 / 이견 / 고유 통찰 / 반증으로 분류한다.
3. **결론을 좌우하는 근거 `파일:줄` 을 직접 열어 검증한다.** 이 검증이 cowork 의 유일한 가치다.
4. `.cowork/cowork-prompt.md` 의 목적·용어·금지사항과 어긋나는 권고는 채택하지 않는다(§6 에 적는다).
5. [references/final-report-protocol.md](references/final-report-protocol.md) 템플릿으로 `final-report.md` 를 쓴다.

## 5단계 — 사용자 보고

결론을 **본문으로 요약**한다(파일 경로만 던지지 말 것): 최종 답 1~3줄 · AI 들이 갈린 지점과 자료로 내린 판정 · 반증된 주장 ·
권고 1~3순위(범위·리스크) · 참여 AI 와 빠진 AI(이유) · 파일 위치.
**요청에 실행이 포함돼 있었으면 멈추지 말고 곧바로 6단계로** — "진행할까요?" 라고 묻지 않는다. 분석만 요청받았으면 "수정은 하지 않았다"로 끝낸다.

## 6단계 — 리뷰 후 즉시 실행 〔요청에 실행이 포함된 경우〕

| 사용자 요청 | 어디까지 |
|---|---|
| "고쳐줘"·"수정까지"·"구현해줘"·"만들어줘"·"분석하고 적용해" | 6단계 — 보고 직후 **즉시 실행** |
| "분석해줘"·"왜 이런지 파봐"·"검토만 해줘"·"고치지 말고" · 애매하면 | 5단계에서 종료 |

1. 5단계 보고 직후 `cowork.sh review <폴더명>` 을 `run_in_background: true` 로 돌린다 — 분석에 성공했던 AI 들이 종합본을 재검토하고
   종합 AI 가 `final-report.md` 를 갱신한다(~15분). Stop hook 의 리뷰는 turn 이 끝난 *뒤*에 돌므로 기다리지 않는다.
2. 완료 알림을 받으면 `final-report-log.md` 의 **갱신/원본유지**부터 본다. 원본유지면 `.review/*-review.md` 를 직접 읽어 반영한다.
3. **(갱신된) §7 최종 권고가 작업 지시서다** — 우선순위대로. §6 반증 기반 수정·권고에 없는 임의 수정 금지.
4. 그 작업공간의 차단지점·검증 규칙(`.cowork/cowork-prompt.md`·`CLAUDE.md`·`AGENTS.md`)을 따른다. 검증 없이 "완료" 금지.
5. 검증 통과 후 커밋(메시지에 cowork 폴더명). `final-report.md` 끝에 **`## 9. 적용 결과`** 를 덧붙인다(§1~8 은 보존).
- 예외: "리뷰 없이 바로 고쳐"면 리뷰를 건너뛴다.

## 선택 — final-report 리뷰 라운드 (Stop hook)

- 설치(1회): `cowork.sh init-hook` — 이 프로젝트 `.claude/settings.json` 의 Stop hook 에 멱등 등록(기존 hook 보존, 예전 경로는 새 경로로).
  ⚠️ `init`(AI 스캔·시스템 프롬프트)과 **다른 명령**이다.
- 동작: 분석 시작 때 `.review-final-report` 마커가 생기고, `final-report.md` 를 쓰고 턴을 끝내면 hook 이 리뷰를 백그라운드로 던진다.
  리뷰는 몇 분 뒤 조용히 `final-report.md` 를 바꾸므로 "리뷰가 백그라운드에서 돌고 `final-report-log.md` 에 기록된다"고 한 줄 알린다.
- 리뷰 페르소나·종합 프롬프트·검증 규칙: [references/final-report-review.md](references/final-report-review.md).

## 산출물

```
.cowork/
├── .cowork-agents.json   ← AI 목록·상태·통계·실패 기록·메모 (init 이 만들고 실행마다 쌓인다 — 스크립트만 쓴다)
├── .probe/               ← 마지막 init 의 확인 질문 원본(AI 별 .out·.log — 왜 못 쓰는지 볼 때)
├── cowork-prompt.md      ← 이 프로젝트의 시스템 프롬프트 (모든 분석에 주입, 사람이 관리)
└── <폴더명>/
    ├── <AI>-cowork.md    ← AI 별 분석 (claude·codex·copilot-grok·copilot-mai·agy·… 이번에 돈 것만)
    ├── final-report.md   ← 최종 종합·결론 (오케스트레이터 작성 — 사람이 원하는 산출물)
    ├── final-report-log.md ← 리뷰 라운드 변경 이력
    ├── .prompt.md        ← 실제 주입된 프롬프트 (재현용)
    ├── .review/          ← 리뷰 라운드 산출물
    └── .logs/<AI>.log    ← 각 CLI 원시 로그 (copilot 은 *.jsonl 도)
```

## 자주 틀리는 지점

- **init 없이 쓰거나, AI 를 설치·로그인하고 init 을 안 돌리는 것** — 새 AI 가 목록에 없고, 로그인한 AI 는 계속 "로그인 필요"로 건너뛴다.
- **`.cowork-agents.json` 을 손으로 고치는 것** — 동시에 기록하는 러너와 부딪친다. `set`·`enable`·`disable`·`note` 를 쓴다.
- **"한도 초과"·"로그인 필요" AI 를 재시도하는 것** — 같은 실패만 반복된다. 빼고 종합한다.
- **실패 원인을 알아내고도 `note` 로 남기지 않는 것** — 다음 세션이 같은 원인을 처음부터 다시 판다.
- **`init` 과 `init-hook` 을 헷갈리는 것** — 앞은 AI 스캔·시스템 프롬프트, 뒤는 리뷰 hook 설치다.
- **특정 분야를 페르소나·스크립트에 하드코딩하는 것** · **사람이 준 폴더명을 바꾸는 것** · **폴더명을 프롬프트로 삼키는 것**.
- **완료 알림을 흘려보내는 것** · **실행 요청인데 보고 후 멈추는 것** · **순서를 뒤집는 것**(final-report.md 가 먼저).
- **종합을 요약으로 대체하는 것** · **다수결 판정** — 실제 자료가 판정한다.
- **foreground 실행** — Bash 10분 제한에 분석이 날아간다. `run_in_background: true`.
- **AI 에게 파일 저장을 시키는 것** — 샌드박스가 막는다. stdout → `cowork.sh` 가 기록한다.
