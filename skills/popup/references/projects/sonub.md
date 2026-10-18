# SONUB 프로필 — 용어 팝업 (sonub.com)

SONUB 저장소(`app/Content/Glossary.php`·`SONUB-SSOT.md` 가 있는 곳)에서 popup 스킬을 쓸 때는 **이 문서가 SKILL.md 의 범용 절차보다 앞선다.**
SONUB 은 이미 Laravel 로 만든 용어 사전·팝업이 있으므로 `assets/popup.js`·`popup.py init` 키트를 쓰지 않는다 — 두 번째 팝업 체계가 된다.
범용 레퍼런스(content·design)의 원칙은 같고, SONUB 에서 다른 점(17개 언어·Laravel 컴포넌트·리엔 음성)은 아래와 `projects/sonub/` 의 문서가 정한다.

SONUB 은 왕초보를 가르친다. 설명 없이 지나간 "토큰" 한 낱말이 그 문단 전체를 잃게 만든다.
화면의 어려운 말 위에 마우스를 올리면(휴대폰은 탭) 뜻·쉬운 비유·예시가 담긴 팝업을 띄우고, 필요하면 **예시와 '더 배우기' 링크(`href`)로 SONUB 의 다른 화면에 잇는다.**
스피커를 켜 두면 리엔이 그 내용을 **귀로 듣기 좋은 말로 다시 써서** 읽어 주고, 마이크로 물으면 그 팝업에 대해 답하게 만든다.

`$POPUP` 은 이 스킬 폴더(이 문서의 두 단계 위)다. SONUB 스크립트는 모두 **sonub 저장소 루트에서** `bash $POPUP/scripts/sonub/run.sh <스크립트> [인자…]` 로 돌린다 — 스크립트를 표준 입력으로 앱 컨테이너에 넘기고, 컨테이너의 작업 폴더(`/app`)를 저장소 루트로 삼아 Laravel 을 띄운다.

## 🛑 먼저 지킬 것

1. **sonub 저장소의 `SONUB-SSOT.md` 를 먼저 읽는다** — 23절 "인공지능 생성"·"리엔"·"리엔 음성", 10절 다국어. 이 스킬·기존 코드보다 SSOT 가 이긴다. AGENTS.md 의 작업 흐름(테스트·커밋 규칙)도 그대로 따른다.
2. **사전은 한 곳이다.** 설명 문장을 Blade 에 직접 쓰지 않는다. 구조는 `App\Content\Glossary::TERMS`, 문장은 `lang/{17개}/glossary.php`. 같은 설명이 화면마다 갈라지면 어디를 고쳐야 할지 모른다.
   **두 번째 팝업 체계를 만들지 않는다** — 스킬 이름은 popup 이지만 코드 이름은 이미 있는 `glossary` 를 쓴다.
3. **17개 언어를 한 번에 쓴다**(AGENTS.md "다국어 번역"). en·ko 만 쓰고 끝내지 않는다. 용어 id 는 한 번 정하면 바꾸지 않는다(번역 키·`data-term` 이 가리킨다).
4. **스피커는 팝업 글자를 그대로 읽지 않는다.** 팝업 내용을 시스템 지침에 실어 DeepSeek 가 귀로 듣기 좋은 글을 새로 쓰고, 서버가 정리·청크 묶기를 한 뒤, 브라우저가 **한 번에** Supertonic 으로 읽는다(아래 "발화 글").
5. **리엔 음성 규정을 그대로 따른다** — 목소리는 Supertonic 3 F1 하나, 브라우저·운영체제 TTS(`speechSynthesis`) 는 어떤 경우에도 쓰지 않는다, 소리 내는 언어는 `voice.tts.languages`(en·ko·ja·hi) 뿐이고 나머지는 자막만. DeepSeek 는 로그인한 정상 회원만, 1분 10번(챗봇·바이브 코딩과 함께 센다)·하루 토큰 한도·시험 중 거절, 그리고 **웹 요청 안에서 기다리지 않고 큐에서** 부른다(SONUB-DESIGN "LLM").
6. **팝업 음성 규정은 아직 SSOT 에 없다.** 음성을 처음 만들 때 [sonub/voice.md](sonub/voice.md) 의 "SSOT 초안"을 사용자에게 보여 승인받고 SSOT 부터 고친 뒤 구현한다(AGENTS.md "SSOT 에 없는 규정은 지어내지 않는다").
7. **조용히 실패하지 않는다.** 소리가 안 났으면(준비 중·자동 재생 차단·못 읽는 언어·로그인 필요·한도·오류) 그 이유를 팝업에 한 줄로 보인다. 사용자는 버튼이 고장 난 줄 안다.
8. **검증 없이 "완료"라고 하지 않는다** — 아래 "검증"을 모두 돌리고, 못 한 것은 못 했다고 보고한다.

## 지금 있는 것과 없는 것 (2026-10-18)

| | 무엇 | 어디 |
| --- | --- | --- |
| ✅ 있음 | 사전 360개(2026-10-18 `popup-check` 기준) — 모든 화면의 낱말(ai·data·dev·web·infra), 화면 전용 낱말(`scope` — 쉘 개념·명령, git, python, appdev, gamedev), 메뉴·화면 사용법 안내(menu — `'match' => false`) | `app/Content/Glossary.php` |
| ✅ | 본문 매칭 — 길이 내림차순·언어별 경계·한국어 조사·점 경계('index.html' 의 'html' ×), **화면 전용 낱말**(`scope` — 같은 표기면 그 화면의 뜻이 이긴다), **저절로 찾지 않는 낱말**(`auto` => false — for·if·set 같은 영어 낱말 명령), **대소문자까지 같은 표기**(`case`·`exact` — 'cat' ○ 'Cat' ×, 'PATH' 와 'path' 따로) | `Glossary::segments()`·`matcher()` |
| ✅ | 표기·요약·설명(term·short·long) + 쉽게 말하면(easy)·예시(example — 줄마다 `` `코드` `` 와 설명, `exampleLines()`) + 그 언어만의 다른 표기(aliases) 17개 언어, 음성 문구 17개 언어 | `lang/*/glossary.php` |
| ✅ | 평문을 감싸는 `<x-glossary.text>` — `scope`(화면 전용 낱말)·`group`(여러 문단에 걸쳐 한 용어는 처음 한 번만) | `resources/views/components/glossary/text.blade.php` |
| ✅ | 물음표 단추 `<x-glossary.info id="…">` — 글 없이 ? 하나. 예제 단추·단원 카드 곁(휴대폰·키보드용)과 화면 부분의 사용법 | `resources/views/components/glossary/info.blade.php` |
| ✅ | 팝업 자원(CSS·JS·틀) 한 곳 — 표기·분류 칩·닫기 → 한 줄 뜻 → 설명 → 쉽게 말하면 → 예시 줄 → 관련 용어 → 더 배우기 | `resources/views/components/glossary/assets.blade.php` |
| ✅ | 팝업(Alpine, 화면에 하나) — 호버·탭·키보드·Esc·고정·관련 용어 갈아타기·위치 계산·좁은 화면 아래쪽 시트, **누르면 할 일이 따로 있는 요소**(메뉴 링크·단원 카드·예제 단추 — `[data-term]` 이고 `.glossary-term` 이 아닌 것)는 마우스로 400ms 머물면 열고 누르면 원래 할 일 | `public/js/glossary.js` · `public/css/pages/glossary.css` |
| ✅ | 뜻 JSON(공개·Cloudflare 캐시) `/api/glossary/{locale}/{id}` — `examples` 줄 포함, 용어 사전 창 목록 `/api/glossary/{locale}` | `routes/public/glossary.php` · `app/Http/Controllers/Glossary/*` |
| ✅ | 용어 사전 창(빠른 막대) — 분류별 목록, 예시 줄 | `resources/views/partials/glossary-panel.blade.php` · `public/js/quickbar.js` |
| ✅ | 사이트 전체 적용(2026-10-15) — AI(허브·확률·만들기·실습·개발·심화·커리큘럼·내부 구조·진실), GIT(허브·단계 — `Git::inline($text, $group)`), 파이썬, 앱 개발(허브·주제 전부), 게임 개발(허브·주제), 가이드(트랙·어린이), 자격증, 홈, 쉘 단원 도입. 화면 머리의 한 줄 설명은 `<x-ui.page-header glossary>`(또는 `glossary="appdev"` 처럼 scope 이름) | `resources/views/**` |
| ✅ | 쉘 화면(/shell) 적용 — 본문 문장(문단·부분마다 첫 등장), 단원 카드, 13단원 정규 표현식의 카드(문법 표 머리의 BRE·ERE 물음표, 설명 문장 — 카드·운영체제 탭마다 `group`), 예제 단추 전부(`ShellCourse::SNIPPET_TERMS`), 심화 주제의 제목 물음표(`ADVANCED_TERMS`)·설명·예제 주석(17개 언어 `lang/*/shell_advanced.php`), 미션 문장·힌트, 화면 부분의 사용법(핵심 개념·주의·정규식 테스트기 포함), 단원 카드 곁 물음표(링크 밖 — 휴대폰·키보드), 개념 소제목은 `Glossary::textHtml`(RTL 기호 격리만) | `resources/views/shell/**` · `app/Content/ShellCourse.php` |
| ✅ | 오른쪽→왼쪽 언어(ar·ur) — 문장 속 기호 덩어리(2>&1·<<<·/dev/null, 안의 용어 단추째)를 `<bdi dir="ltr">` 로, 예제 코드 속 아랍 글을 `<bdi>` 로 격리 | `Glossary::segmentsHtml()`·`codeRuns()` · `ShellCourse::codeHtml()` |
| ✅ | 테스트 — 17개 언어 완비·매칭·렌더·API·쉘 화면 | `tests/Feature/GlossaryTest.php` · `tests/Feature/GlossaryShellTest.php` |
| ✅ | 리엔 음성 모듈 · DeepSeek 큐 파이프라인(음성 계층이 쓸 것) | `public/js/voice/index.js` · `app/Llm/ChatClient.php` · `app/Models/LlmUsage.php` |
| ⬜ 없음 | 문장·개념을 명시로 감싸는 `<x-glossary.term>`(`'match' => false` 문장 항목) | [sonub/design.md](sonub/design.md) |
| ⬜ | 레이아웃 partial(메인 메뉴)의 팝업 — 자원을 레이아웃에서 싣기 | [sonub/design.md](sonub/design.md) |
| ⬜ | 팝업 음성 — 스피커·마이크(`VoiceController`·`GenerateGlossarySpeech`·`SpeechText`·지침·브라우저 음성 세션) | [sonub/voice.md](sonub/voice.md) |

⬜ 는 필요해지는 첫 `/popup` 작업에서 레퍼런스의 청사진대로 만든다. **만든 뒤에는 그 레퍼런스의 청사진을 실제 코드로 바꾸고 표의 ⬜ 를 ✅ 로 고친다**(스킬 문서는 sonub-skills 저장소에 있으므로 그 저장소에서 고치고 커밋·푸시한다 — 그 저장소 AGENTS.md "작업을 마치면 항상 git push").

## /popup 요청을 받으면 — 작업 순서

`/popup <요청>` 의 요청은 무엇에 집중할지를 알려 준다. 예:

- `/popup 인공지능 만들기 화면의 핵심 개념 단락` → 그 단락의 용어만
- `/popup 확률, 샘플링, 온도를 초보자에게` → 그 세 낱말만(쓰이는 화면을 찾아 붙인다)
- `/popup 상단 메뉴의 공부 항목들` → 메뉴 항목 설명 팝업
- `/popup 스피커 누르면 리엔이 설명하게` → 음성 계층

1. **초점을 정한다** — 요청에서 화면(주소 → `routes/public/*.php` → 컨트롤러 → Blade)·범위(단락·단원·메뉴)·대상(용어·문장·개념)을 뽑는다. 모호하면 가장 좁게 해석하고, 요청에 없는 화면까지 넓히지 않는다.
2. **점검한다** — 그 화면(또는 번역 그룹)에서 무엇이 이미 팝업이고 무엇이 비었는지 본다.
   ```bash
   bash $POPUP/scripts/sonub/run.sh popup-audit.php resources/views/ai/build.blade.php ko
   ```
   `[감쌈]` 이미 팝업 · `[감쌀 수 있음]` 사전 용어가 있는데 안 감쌈 · `[용어 없음]` 새 항목이 필요한지 볼 문장 · `후보` 사전에 없는 영문 약어. 한글 개념어(확률·샘플링…)는 스크립트가 못 고르니 문장을 읽고 고른다.
3. **고른다** — 기준: ① 그 화면을 처음 보는 왕초보가 멈출 말 ② 모르면 문단 전체를 놓치는 말 ③ 사이트 여러 곳에 되풀이되는 말(사전 한 곳의 이득이 크다). 일상어·화면이 본문에서 바로 설명 중인 말(`:exclude`)은 뺀다. 한 문단에 밑줄이 서너 개를 넘으면 산만하다 — 핵심만.
4. **내용을 쓴다** — 필드·문체·길이·17개 언어 절차는 [sonub/content.md](sonub/content.md)(범용 원칙은 [../content.md](../content.md)). 이미 있는 용어면 새로 만들지 말고 감싸기만 한다. 예시(`example`)는 가능하면 넣고, 더 깊은 내용은 `href` 로 SONUB 의 그 화면에 잇는다. 17개 언어는 JSON 하나에 모아 `add-terms.php` 로 넣는다(손으로 17개 파일을 열다 한 언어를 빠뜨리지 않게).
5. **붙인다** — 트리거는 넷이다(상세 [sonub/design.md](sonub/design.md)).

   | 대상 | 방법 |
   | --- | --- |
   | 본문 평문 속 용어 | `<p><x-glossary.text :text="__('group.key')" /></p>` — 서버가 지금 언어 표기로 찾아 감싼다(첫 등장만). 한 화면 전용 낱말이면 `scope="shell"`, 여러 문단에 걸쳐 한 번만 밑줄을 그으려면 `group="…"` |
   | 누르면 할 일이 따로 있는 요소(메뉴 링크·카드·예제 단추) | 그 요소에 `data-term="…" data-term-label="표기"` — 마우스로 400ms 머물면 열린다. 휴대폰·키보드를 위해 곁에 `<x-glossary.info id="…" />` |
   | 화면 부분의 사용법 | 그 부분의 작은 제목(`<small>`) 곁에 `<x-glossary.info id="menu-…" />` |
   | 문장·구절·개념(자동으로 찾으면 안 되는 것) | ⬜ `<x-glossary.term id="…">…</x-glossary.term>` + 사전 항목 `'match' => false` |

6. **음성** — 스피커·마이크가 아직 없으면 [sonub/voice.md](sonub/voice.md) 의 청사진대로 만든다(먼저 SSOT 초안 승인 — 위 6번). 있으면 새 항목이 그대로 쓰는지만 확인한다(음성은 항목마다 따로 할 일이 없다).
7. **디자인** — 보기 좋은 팝업의 구조·CSS 는 [sonub/design.md](sonub/design.md). 디자인은 CSS 로만 푼다(AGENTS.md "CSS"), 테마 토큰은 design 스킬.
8. **검증하고 보고한다** — 아래 "검증".

## 팝업 한 장의 모양

```
┌────────────────────────────────────────┐
│ 토큰  [인공지능]                    🔊  ✕ │  머리 — 표기(강조색) · 분류 칩 · 스피커 켜기/끄기 · 닫기
│ 인공지능이 실제로 세는 글자 조각           │  short — 한 줄 뜻(굵게)
│ 인공지능은 글자나 낱말 단위로 읽지 않고…    │  long — 쉬운 설명 두세 문장
│ ┃ 💡 쉽게 말하면  레고 블록처럼…            │  easy — 일상 비유 한 문장(색 상자)
│ ┃ ✏️ 예시  unbelievable → un·believ·able   │  example — 한두 줄 예
│ 관련 용어  (컨텍스트 창) (LLM)             │  related — 칩을 누르면 팝업 안에서 갈아탄다
│ 🎤 말로 묻기   리엔이 설명하는 중…  더 배우기 → │  발 — 마이크 · 상태/자막(aria-live) · 더 배우기(href → SONUB 의 다른 화면)
└────────────────────────────────────────┘
```

좁은 화면(≤ 640px)에서는 화면 아래에 붙는 시트로 띄운다. 팝업은 화면에 하나이고, 팝업 안의 관련 용어는 새 팝업을 겹쳐 열지 않고 **갈아탄다**(음성 세션이 팝업 하나에 묶여 있기 때문 — sonub/design.md).

## 발화 글 — Supertonic 이 부드럽게 읽는 글

사용자가 가장 강조한 부분이다. 엔진(`public/js/voice/tts/engine.js`)은 받은 글을 청크로 나눠 **모두 합성한 뒤 0.3초 무음으로 이어 붙인 WAV 하나**를 재생한다. 그래서 규칙은 셋으로 모인다.

1. **DeepSeek 가 처음부터 말로 쓴다** — 마크다운·목록·번호·괄호·별표·코드·이모지·URL 없이, 짧은 평서문 2~4개(설명) 또는 2~5개(질문 답), 문장마다 문장부호로 끝, 비유 하나, 팝업 글을 되읽지 않기, 요청 언어로만, 한국어면 영어 약어를 한글 소리로(API → 에이피아이), 숫자·기호는 말로(90% → 구십 퍼센트). 지침 전문은 voice.md.
2. **서버가 마지막 방어선이다** — `App\Lyen\SpeechText::clean()` 이 모델이 어긴 기호를 걷어내고, `::pack()` 이 문장 경계에서 청크 한도(ko·ja 120자, 그 밖 300자 — `voice.tts.chunk_*`) 이하로 묶어 **빈 줄로** 잇는다. 엔진의 청크 나누기는 `[.!?]` 뒤 공백에서만 문장을 자르므로 일본어 `。`·힌디어 `।` 문장은 이렇게 미리 묶지 않으면 한도를 넘는 한 덩어리가 된다(2026-09-27 코드로 확인).
3. **브라우저는 한 번에 읽는다** — 받은 글 전체를 `speak(text, lang, 'glossary', { wait: true })` 한 번으로 넘긴다. 문장마다 `speak()` 를 부르면 부를 때마다 앞 소리가 끊기고(`stopSpeaking`) 합성 대기로 틈이 생긴다. `markdownToSpeech()` 에 다시 통과시키지 않는다 — 빈 줄을 `. ` 로 바꿔 묶어 둔 청크 경계를 지운다.

## 검증

```bash
# 1) 사전 — 17개 언어 필드·선택 필드 일치·자리표시자·관련 용어·죽은 참조·표기 충돌 (문제 있으면 종료 코드 1)
bash $POPUP/scripts/sonub/run.sh popup-check.php

# 2) 번역 파일 문법·키·자리표시자 (AGENTS.md "다국어 번역"의 검사, G=glossary · 다른 그룹을 고쳤으면 그 그룹도)
docker compose exec -T app sh -c 'for f in lang/*/glossary.php; do php -l "$f" > /dev/null || echo "문법 오류: $f"; done'

# 3) 테스트 — 용어 사전 관련(전체는 ./deploy.sh 가 돌린다 — AGENTS.md "작업 흐름")
docker compose exec app php artisan test --filter=Glossary
docker compose exec app vendor/bin/pint <고친 PHP 파일>
```

4) **브라우저** — SONUB-DEV-GUIDE "브라우저 확인" 순서로 고친 화면을 연다(`https://sonub.localhost:7843`): 마우스 올리기(열림)·벗어나기(닫힘)·누르기(고정)·다시 누르기·Esc(닫고 단추로 포커스)·관련 용어 칩·더 배우기, 넓은 화면·좁은 화면(아래쪽 시트)·RTL(`/ar/…`)·다른 언어 하나 이상. 음성이 있으면 네트워크 요청 본문에 팝업 설명 원문이 **아니라** 용어 id·모드만 가는지, 스피커 끄기/켜기·자동 재생 차단 안내·로그인 안내·마이크 흐름을 본다. 확인하지 못한 것은 보고에 적는다.

## 보고

고친 파일, 새 용어 id·필드("번역 키 N개를 17개 언어에 넣었다"), 감싼 화면과 문장 키, 검증 결과(스크립트·테스트 통과 수·브라우저에서 본 화면), 확인하지 못한 것, 커밋 해시.

## 레퍼런스 (sonub/)

### 지금 있는 용어 팝업 → [sonub/current.md](sonub/current.md)

이미 main 에 있는 용어 사전과 팝업의 전체 구조와 핵심 소스코드다. `App\Content\Glossary` 의 `TERMS` 구조(id·category·aliases·related·href), 본문을 조각으로 나누는 `segments()`, 표기를 길이 내림차순으로 묶은 매칭 정규식과 언어별 경계 규칙(라틴·키릴·한글 조사·아랍·결합 문자), 괄호 앞 표기, 번역 키 규약, 죽은 링크를 내리지 않는 `href()` 를 싣는다. `<x-glossary.text>` 컴포넌트 전문, `glossary.js` 의 열고 닫기, 뜻 API 와 라우트, CSS 선택자, 기존 테스트가 지키는 것, 알려진 한계까지. 기존 동작을 건드리기 전에 읽는다.

### 팝업 내용 쓰기 → [sonub/content.md](sonub/content.md)

초보자가 한 번 읽고 이해하는 설명을 17개 언어로 쓰는 법이다. 필드마다 역할과 길이, 번역 키 이름(`glossary.<id>_<field>`, 하이픈은 밑줄), 사전 항목(`TERMS`)에 넣는 값과 id 짓기, 문장·개념 항목(`'match' => false`)과 메뉴 항목, 문체 원칙, 언어별 말투, 별칭(aliases), 태그가 든 번역 문장 처리, 예시 항목 전문, 17개 언어를 빠짐없이 넣고 검사하는 절차가 있다.

### 보기 좋은 팝업 — 모양·동작 → [sonub/design.md](sonub/design.md)

laravel 스킬의 팝업을 분석해 SONUB 에 가져올 것과 가져오지 않을 것을 가른 문서다. 트리거(`<x-glossary.text>`·`<x-glossary.term>`·`a[data-term]`)의 마크업과 청사진 코드, 메뉴 팝업을 위해 팝업 틀·CSS·JS 를 레이아웃으로 옮기는 법, 팝업 틀(Blade)과 CSS 청사진, 접근성·RTL·색각 규칙, 이전 사이트에서 실제로 깨졌던 것들이 있다.

### 스피커·마이크 — DeepSeek 와 Supertonic → [sonub/voice.md](sonub/voice.md)

팝업 음성의 전체 설계와 청사진 코드다. 스피커(기본 켬)는 팝업이 열리면 팝업 내용을 시스템 지침에 실어 DeepSeek 에 "귀로 듣기 좋은 설명"을 받고, 마이크는 SenseVoice(준비 전엔 Web Speech)로 받아 적은 질문을 같은 지침으로 묻는다. 요청 → 큐 잡 → 개인 실시간 채널 흐름, 설명 발화 글 캐시, 로그인·정지·시험 중·하루 한도·1분 10번 처리, 지침 전문, `SpeechText::clean/pack`, 브라우저 음성 세션 상태 기계, 문구 키, Pest 테스트 목록, SSOT 초안이 있다.

### 번역 작업자 지침 틀 → [sonub/translate-brief.md](sonub/translate-brief.md)

항목이 수십 개 이상이라 15개 언어를 번역 작업자(Agent)에게 한 언어씩 나란히 맡길 때 쓰는 지침의 틀과 오케스트레이터의 뒷일이다. 2026-09-28 쉘 106개 항목을 번역할 때 든 시간·토큰도 적었다.

## 스크립트 (`$POPUP/scripts/sonub/`)

모두 sonub 저장소 루트에서 `bash $POPUP/scripts/sonub/run.sh <스크립트> …` 로 돌린다(파이썬 스크립트는 호스트에서 `python3 $POPUP/scripts/sonub/translate/…`).

| 스크립트 | 하는 일 |
| --- | --- |
| `popup-audit.php <Blade 경로 \| 번역 그룹 \| 번역 키> [언어] [범위]` | 그 화면·문장에서 사전 용어가 어디 잡히는지, 감쌌는지, 사전에 없는 영문 약어 후보를 보인다 |
| `add-terms.php <입력.json> [--dry-run] [--overwrite]` | 팝업 내용(용어 필드·문구 키·이미 있는 용어의 언어별 별칭 `aliases`)을 17개 언어 파일에 한 번에 넣는다 — 17개 언어·필드·빈 값·자리표시자·기존 값 덮기를 검사하고, 하나라도 어기면 아무 파일도 쓰지 않는다. 입력 JSON 은 컨테이너가 읽는 저장소 안(`storage/app/`)에 두고 `/app/storage/app/…` 로 준다. 입력 형식은 sonub/content.md "넣는 절차" |
| `popup-context.php <그룹> <언어> <범위\|-> <id,…>` | 용어가 잡힌 자리를 앞뒤 문맥과 함께 — 흔한 낱말이 다른 뜻에 잡히는지(오탐) 가린다 |
| `popup-counts.php <그룹> <범위\|-> <id 앞머리,…> [언어…]` | 언어마다 잡힘 횟수 — 한 언어에서만 유난히 많은 용어(오탐 의심)와 안 잡히는 용어(표기가 본문과 다름)를 본다 |
| `translate/verify.php` · `translate/merge-parts.py` · `translate/combine.py` | 여러 언어를 번역 작업자에게 나눠 맡길 때 — 작업 파일 검사(en 과 대조)·조각 합치기·17개를 add-terms 입력으로 묶기. 지침 틀은 [sonub/translate-brief.md](sonub/translate-brief.md) |
| `translate/verify-group.php <폴더> <언어…>` | 번역 그룹 하나(예: `shell_advanced`)를 통째로 맡길 때의 작업 파일 검사 |
| `translate/vocab.php <언어> [id 정규식]` | 그 언어의 사전 표기·별칭 목록 — 번역 작업자가 본문 낱말을 사전 표기와 맞추게 한다(같아야 팝업이 붙는다) |
| `popup-check.php` | 사전 완결성 검사 — 필수·선택 필드 17개 언어, 자리표시자, 관련 용어, Blade 의 죽은 참조, 표기 충돌. 선택 필드를 더하면 스크립트의 `POPUP_OPTIONAL`(과 `add-terms.php` 의 `TERM_FIELDS`)에도 더한다 |
