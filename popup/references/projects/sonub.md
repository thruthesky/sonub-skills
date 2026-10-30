# SONUB 프로필 — 용어 팝업 (sonub.com)

SONUB 저장소(`app/Content/Glossary.php`·`SONUB-SSOT.md` 가 있는 곳)에서 popup 스킬을 쓸 때는 **이 문서가 SKILL.md 의 범용 절차보다 앞선다.**
SONUB 은 이미 Laravel 로 만든 용어 사전·팝업이 있으므로 `assets/popup.js`·`popup.py init` 키트를 쓰지 않는다 — 두 번째 팝업 체계가 된다.
범용 레퍼런스(content·design)의 원칙은 같고, SONUB 에서 다른 점(17개 언어·Laravel 컴포넌트·리엔 음성)은 아래와 `projects/sonub/` 의 문서가 정한다.

> 🛑 **화면 디자인 작업이면** sonub-design 스킬(`.claude/skills/sonub-design/SKILL.md` "필수 동반 스킬")과 infographics·linkify·sonub-seo·webmovie 스킬을 반드시 같이 쓴다(SSOT 11절 "디자인", 2026-10-23·10-26). 팝업만 달고 끝내지 않는다.

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
6. **팝업 음성 규정은 SSOT 23절 "리엔 음성"의 "용어 팝업" 줄이다**(2026-10-21 승인). 숫자(머무는 0.7초·캐시 30일·질문 300자)를 바꾸려면 SSOT 부터 고치고 `config/glossary.php` 를 맞춘다(AGENTS.md "SSOT 에 없는 규정은 지어내지 않는다").
7. **조용히 실패하지 않는다.** 소리가 안 났으면(준비 중·자동 재생 차단·못 읽는 언어·로그인 필요·한도·오류) 그 이유를 팝업에 한 줄로 보인다. 사용자는 버튼이 고장 난 줄 안다.
8. **검증 없이 "완료"라고 하지 않는다** — 아래 "검증"을 모두 돌리고, 못 한 것은 못 했다고 보고한다.

## 지금 있는 것과 없는 것 (2026-10-21)

| | 무엇 | 어디 |
| --- | --- | --- |
| ✅ 있음 | 사전 1481개(2026-10-22 `TERMS` 기준) — 모든 화면의 낱말(ai·data·dev·web·infra), 화면 전용 낱말(`scope` — 쉘 개념·명령, git, python, appdev, gamedev), 메뉴·화면 사용법 안내(menu — `'match' => false`) | `app/Content/Glossary.php` |
| ✅ | 본문 매칭 — 길이 내림차순·언어별 경계·한국어 조사·점 경계('index.html' 의 'html' ×), **화면 전용 낱말**(`scope` — 같은 표기면 그 화면의 뜻이 이긴다), **저절로 찾지 않는 낱말**(`auto` => false — for·if·set 같은 영어 낱말 명령), **대소문자까지 같은 표기**(`case`·`exact` — 'cat' ○ 'Cat' ×, 'PATH' 와 'path' 따로) | `Glossary::segments()`·`matcher()` |
| ✅ | 표기·요약·설명(term·short·long) + 쉽게 말하면(easy)·예시(example — 줄마다 `` `코드` `` 와 설명, `exampleLines()`) + 그 언어만의 다른 표기(aliases) 17개 언어, 음성 문구 17개 언어 | `lang/*/glossary.php` |
| ✅ | 평문을 감싸는 `<x-glossary.text>` — `scope`(화면 전용 낱말)·`group`(여러 문단에 걸쳐 한 용어는 처음 한 번만) | `resources/views/components/glossary/text.blade.php` |
| ✅ | 물음표 단추 `<x-glossary.info id="…">` — 글 없이 ? 하나. 예제 단추·단원 카드 곁(휴대폰·키보드용)과 화면 부분의 사용법 | `resources/views/components/glossary/info.blade.php` |
| ✅ | 팝업 자원(CSS·JS·틀) 한 곳 — 표기·분류 칩·닫기 → 한 줄 뜻 → 설명 → 쉽게 말하면 → 예시 줄 → 관련 용어 → 더 배우기 | `resources/views/components/glossary/assets.blade.php` |
| ✅ | 팝업(Alpine, 화면에 하나) — 호버·탭·키보드·Esc·고정·관련 용어 갈아타기·위치 계산·좁은 화면 아래쪽 시트, **팝업으로 가는 길**(용어를 벗어난 자리와 팝업의 가까운 변이 이루는 삼각형 — 그 안에서는 천천히 가도 닫지 않고, 스친 다른 줄의 용어로는 0.3초 머물 때만 바꾼다. SSOT 23절 "용어 팝업 마우스 이동"), **누르면 할 일이 따로 있는 요소**(메뉴 링크·단원 카드·예제 단추 — `[data-term]` 이고 `.glossary-term` 이 아닌 것)는 마우스로 400ms 머물면 열고 누르면 원래 할 일 | `public/js/glossary.js` · `public/css/pages/glossary.css` |
| ✅ | 뜻 JSON(공개·Cloudflare 캐시) `/api/glossary/{locale}/{id}` — `examples` 줄 포함, 용어 사전 창 목록 `/api/glossary/{locale}` | `routes/public/glossary.php` · `app/Http/Controllers/Glossary/*` |
| ✅ | 용어 사전 창(빠른 막대) — 분류별 목록, 예시 줄 | `resources/views/partials/glossary-panel.blade.php` · `public/js/quickbar.js` |
| ✅ | 용어집 화면 `/glossary` — 출처 묶음(`source` 가 있는 용어) 뒤에 **SONUB 용어 사전**(나머지 팝업 용어 전부를 분류마다, 2026-10-29 SSOT 23절 "용어집"). 새 용어는 따로 고치지 않아도 사전 묶음에 나오고, 출처는 지어내지 않는다 | `Glossary::sourced()`·`catalog()` · `x-widget.glossary.book`·`book-term` |
| ✅ | 사이트 전체 적용(2026-10-15) — AI(허브·확률·만들기·실습·개발·심화·커리큘럼·내부 구조·진실), GIT(허브·단계 — `Git::inline($text, $group)`), 파이썬, 앱 개발(허브·주제 전부), 게임 개발(허브·주제), 가이드(트랙·어린이), 자격증, 홈, 쉘 단원 도입. 화면 머리의 한 줄 설명은 `<x-ui.page-header glossary>`(또는 `glossary="appdev"` 처럼 scope 이름) | `resources/views/**` |
| ✅ | 쉘 화면(/shell) 적용 — 본문 문장(문단·부분마다 첫 등장), 단원 카드, 13단원 정규 표현식의 카드(문법 표 머리의 BRE·ERE 물음표, 설명 문장 — 카드·운영체제 탭마다 `group`), 예제 단추 전부(`ShellCourse::SNIPPET_TERMS`), 심화 주제의 제목 물음표(`ADVANCED_TERMS`)·설명·예제 주석(17개 언어 `lang/*/shell_advanced.php`), 미션 문장·힌트, 화면 부분의 사용법(핵심 개념·주의·정규식 테스트기 포함), 단원 카드 곁 물음표(링크 밖 — 휴대폰·키보드), 개념 소제목은 `Glossary::textHtml`(RTL 기호 격리만) | `resources/views/shell/**` · `app/Content/ShellCourse.php` |
| ✅ | 오른쪽→왼쪽 언어(ar·ur) — 문장 속 기호 덩어리(2>&1·<<<·/dev/null, 안의 용어 단추째)를 `<bdi dir="ltr">` 로, 예제 코드 속 아랍 글을 `<bdi>` 로 격리 | `Glossary::segmentsHtml()`·`codeRuns()` · `ShellCourse::codeHtml()` |
| ✅ | 언어별 낱말 꼴 — 아랍 글은 모음 부호(ـّ 등)가 있든 없든 같은 낱말(`wordPattern()`), 터키어는 그 언어로 옮긴 다섯 글자 이상 표기에 붙은 어미까지 낱말째(sunucuya·terminalde) 감싸되 영어 그대로인 표기(shellcheck)·동사 꼴(-mak·-mek·-sınız·-ılır, DEFINE 의 `trv`)은 잡지 않는다(2026-10-22). 다섯 글자 미만·자음이 바뀌는 꼴(betiğe)은 별칭으로. 영어 낱말과 같은 파이썬 키워드(return·print·import·else)는 spec `'code' => true` — en 에서 `(`·`:` 앞일 때만 | `Glossary::surfacePattern()`·`matcher()` |
| ✅ | 테스트 — 17개 언어 완비·매칭·렌더·API·쉘 화면 | `tests/Feature/GlossaryTest.php` · `tests/Feature/GlossaryShellTest.php` |
| ✅ | 리엔 음성 모듈 · DeepSeek 큐 파이프라인(음성 계층이 쓸 것) | `public/js/voice/index.js` · `app/Llm/ChatClient.php` · `app/Models/LlmUsage.php` |
| ✅ | 문장·개념·활용형을 명시로 감싸는 `<x-glossary.term id="…">구절</x-glossary.term>` — `'match' => false` 문장 항목, '토큰화' 같은 활용형. 단추에 `data-kind="phrase"`(옅은 밑줄)·`data-term-label`(뜻 받기 전 제목), 없는 id 면 글만(2026-10-21) | `resources/views/components/glossary/term.blade.php` |
| ✅ | 레이아웃 전역 싣기 — 메인 레이아웃이 `@stack('head')` 앞에서 팝업 자원을 모든 화면에 싣는다. **메인 메뉴·메가 메뉴·전체 메뉴 서랍은 팝업 적용 대상에서 제외한다**(SSOT 11절 "메가 메뉴") — 링크는 이동만 하고 그룹 제목은 일반 글자다. 본문 팝업은 유지한다 | `resources/views/layouts/main.blade.php` · `partials/main-menu.blade.php` · `partials/menu-group.blade.php` |
| ✅ | **문맥 뜻 가리기**(2026-10-28, SSOT 23절 "용어 문맥 뜻") — 같은 표기의 용어는 모두 후보, `resolve()` 가 같은 문장·문단·화면 주제의 다른 용어(`cues`)로 고른다. 흔한 낱말(`context`)은 근거가 있을 때만, 다른 용어의 표기 빌리기(`shares`), 다른 뜻 구절 빼기(`avoid`), 화면 주제 선언(`<x-glossary.text topic="git">`·`Glossary::topic()`) | `Glossary::resolve()`·`senses()`·`topic()` · `tests/Feature/GlossarySenseTest.php` |
| ✅ | **뜻 색인**(SQLite) — 17개 언어마다 모든 번역 문장의 용어 자리·고른 뜻·점수·다른 용어의 근거·실제 팝업 자리를 `storage/app/popup-index/<언어>.sqlite` 에, 문맥별 집계(`contexts`: 표기 × 화면 × 그룹 × 뜻), FTS5 전문 검색, `build all`·`report`(언어별 비교)·`doubt`(근거 없이 감싼 일반 낱말)·`query` | `$POPUP/scripts/sonub/popup-index.php` |
| ✅ | **번역 키로 뜻 가리기** — TERMS 의 `except`(이 키의 문장에서는 이 뜻이 아니다)·`keys`(이 키의 문장에서는 이 뜻이다). 뜻은 원문 문장의 성질이라 키 하나로 17개 언어가 함께 고쳐진다 | `App\Content\Glossary::resolve()` |
| ✅ | 팝업 음성 — 스피커(호버 0.7초 뒤·누르면 곧바로 리엔이 설명, 30일 저장)·마이크(말로 묻기), 손님·한도·시험 중·소리 없는 언어 안내(2026-10-21) | `app/Http/Controllers/Glossary/VoiceController.php` · `app/Jobs/GenerateGlossarySpeech.php` · `app/Lyen/SpeechText.php` · `app/Content/GlossaryVoice.php` · `public/js/glossary.js` — [sonub/voice.md](sonub/voice.md) |

⬜ 는 필요해지는 첫 `/popup` 작업에서 레퍼런스의 청사진대로 만든다. **만든 뒤에는 그 레퍼런스의 청사진을 실제 코드로 바꾸고 표의 ⬜ 를 ✅ 로 고친다**(스킬 문서의 원본은 SONUB 저장소의 `skills/popup/` 이므로 거기서 고치고 커밋한다 — 배포하면 https://sonub.com 이 새 스킬을 내준다).

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
4. **문맥을 본다** — 고를 낱말마다 "이 표기가 사이트 어디선가 다른 뜻으로 쓰이나?"를 뜻 색인으로 확인한다. 다른 뜻이 있으면 [sonub/content.md](sonub/content.md#사전-항목terms) "같은 표기, 여러 뜻" 대로 `cues`·`context`·`shares`·`avoid`·`except`·`keys` 를 정한다. **틀린 뜻의 팝업은 팝업 없음보다 나쁘다.** 뜻이 하나뿐인 용어도 의심한다 — `doubt` 가 다른 용어의 근거 없이 낱말 하나로 감싼 일반 낱말을 용어별로 모아 보인다("Needs attention"·"six-digit code"·"government-issued ID"·"Sonub Code"·"The server asks"(웨이터)·"Jump runner"). 위 몇 용어의 문장을 **모두** 읽는다.
   ```bash
   bash $POPUP/scripts/sonub/run.sh popup-index.php build en        # 색인(약 2분) — 표기별 고른 뜻 수와 검토 목록
   bash $POPUP/scripts/sonub/run.sh popup-index.php build all       # 17개 언어 모두(요약만) — 4개씩 나란히: printf '%s\n' en ko … | xargs -P 4 -I{} … build {}
   bash $POPUP/scripts/sonub/run.sh popup-index.php report          # 언어별 한 줄 — 팝업 수·근거 없는 팝업 비율·문맥으로 바뀜·뺌
   bash $POPUP/scripts/sonub/run.sh popup-index.php doubt en 60     # 근거 없이 감싼 일반 낱말(용어별, 문장 4개씩) — 숨은 다른 뜻 찾기
   bash $POPUP/scripts/sonub/run.sh popup-index.php doubt en 400 - 1  # 근거상한 1 — 앞 글·문단 신호 하나뿐인 자리까지(그림 설명 비유 'handshake'·'socket', 'ln 40'·'math domain error' 가 여기서 나왔다)
   bash $POPUP/scripts/sonub/run.sh popup-index.php compare ko      # 언어 간 대조 — 검토한 en 이 문맥으로 거절한 뜻을 ko 는 감싼 곳(같은 키)
   bash $POPUP/scripts/sonub/run.sh popup-index.php query en branch  # 그 표기·뜻이 잡힌 모든 문장과 점수
   bash $POPUP/scripts/sonub/run.sh popup-index.php senses en        # 뜻이 여럿인 표기 → 후보와 문맥 신호
   bash $POPUP/scripts/sonub/run.sh popup-index.php lookalike tr 400 # 용어가 드문 그룹(예약·채팅·알림·한국어 과정)에 홀로 뜬 용어 — en 원문에 없는 뜻이 먼저
   bash $POPUP/scripts/sonub/run.sh popup-index.php lookalike tr 400 all  # 모든 그룹에서 — en 원문의 같은 키에 없는 뜻만(번역에서 생긴 낱말, 언어마다 100~160곳)
   bash $POPUP/scripts/sonub/run.sh popup-index.php pages en 60      # 실제 화면(page-crawl.py 가 저장한 HTML)의 팝업을 page_hits 에 넣고 — ① 색인에 없는 뜻 ② 같은 표기가 화면마다 뜬 뜻들(【】가 팝업 자리) · page-crawl.py 는 시작할 때 지난 HTML 을 지운다(옮긴 주소 /lab/* → /claude-code/* 의 옛 화면이 남아 지금 없는 틀린 뜻을 보고했다)
   bash $POPUP/scripts/sonub/run.sh popup-index.php cut ja           # 낱말 가운데서 끝난 표기 — 「パラメータ」ー(장음 별칭을 더한다)·「ホーム」ページ(홈페이지가 홈 폴더로 — avoid)
   cp storage/app/popup-index/*.sqlite storage/app/popup-index-old/  # 사전을 고치기 전 사본(저장소 안 — run.sh 는 컨테이너라 /tmp 가 안 보인다)
   bash $POPUP/scripts/sonub/run.sh popup-index.php diff tr storage/app/popup-index-old/tr.sqlite  # 고친 뒤 — 사라진·바뀐·새로 뜬 팝업
   sqlite3 storage/app/popup-index/en.sqlite "select key, sentence from hits where chosen is null"   # 근거가 없어 감싸지 않은 곳
   ```
   고친 뒤 다시 만들어 **예전과 다른 뜻**(`chosen <> legacy`)·**감싸지 않음**(`chosen is null`)·**동점**(`margin < 10`)·**근거 없는 팝업**(`shown = 1 and evidence = 0` = `doubt`) 네 목록을 읽는다. en 과 ko·ja 처럼 언어 둘 이상 — 언어마다 낱말의 뜻 갈래가 다르다(ko "모델"·"코드", ja "コード").
   한 문장이 틀렸으면 그 **번역 키**를 `except`·`keys` 에 넣어 17개 언어를 함께 고친다. 여러 문장에 되풀이되는 일상 구절("pay attention")만 언어별 `avoid` 정규식으로. 순서: en 을 `doubt` 로 다 읽고 고친 뒤 → 다른 언어는 `compare <언어>` 로 en 과 어긋난 곳을 본다(en 의 `avoid` 는 다른 언어에 통하지 않으니 그 문장은 키로) → 그 언어의 `doubt` 에서 그 언어만의 뜻 갈래("학습"·"프로그램")를 본다.
   한 낱말이 그 언어에서만 두 뜻인 것은 그 언어만 `context` 로 둔다(`'context' => ['fr', 'zh']` — 중국어 '参数' 는 모델 파라미터이자 명령·함수의 인자 "关键字参数·--settings 参数·JSON 参数" 라, `cues`(모델·학습·GPT-2) 가 있을 때만 파라미터). 동사·일상 꼴은 그 언어의 `avoid` 로 — 일본어 '繰り返し' 는 "〜を繰り返します"(되풀이하다)·"同じ文の繰り返し"(되풀이)가 반복문이 아니다, 중국어 '托管' 은 "托管设置·托管的键"(관리 설정)이면 호스팅이 아니다. 비유 문장("MCP 는 AI 앱의 USB 포트")은 `except` 키 하나로 17개 언어의 포트·엔드포인트를 뺀다. 첫 자리를 막으면 **같은 글의 다음 자리가 새로 뜬다** — diff 의 "(없음) →" 줄을 꼭 읽는다
   `avoid` 를 넣은 뒤에는 **너무 넓지 않은지** 감싸지 않은 목록(`chosen is null`)을 꼭 읽는다 — "attention to" 를 막았다가 "use attention to mix in information"(모델의 어텐션)까지 빠졌다.
   ja·zh 는 띄어 쓰지 않아 짧은 표기가 다른 낱말 속에서 잡힌다(ポート ← パスポート·レポート, パス ← パスワード, コード ← レコード, リンター ← プリンター, 库 ← 知识库, 云 ← 多云) — 표기 앞뒤에 가타카나·한자가 붙은 자리를 낱말째 묶어 읽고, 다른 낱말이면 그 언어의 `avoid` 에 그 낱말을 넣는다. 가타카나 표기 전체에 경계를 걸지 않는다(시험해 보니 シェルスクリプト·エージェントスキル 같은 정상 합성어 300여 곳이 빠졌다).
   ```bash
   sqlite3 -separator $'\t' storage/app/popup-index/ja.sqlite "select chosen, sentence from hits where chosen is not null" | python3 -c 'import re,sys,collections as C; K="[\u30A1-\u30FA\u30FC-\u30FF]"; c=C.Counter((t, m.group(1)+"["+m.group(2)+"]"+m.group(3)) for t,s in (l.rstrip("\n").split("\t",1) for l in sys.stdin) for m in [re.search("("+K+"*)【([^】]+)】("+K+"*)", s)] if m and (m.group(1) or m.group(3))); [print(t,w,n) for (t,w),n in sorted(c.items())]'
   ```
   `Glossary` 의 함정 셋: ① `\p{Hangul}`·`\p{Katakana}` 는 PCRE2 가 Script_Extensions 로 읽어 「 、 〈 까지 넣는다 — 경계는 글자 범위로(`Glossary::HANGUL`) ② 별칭 목록은 숫자 사이 쉼표에서 나누지 않는다("44,100Hz" 를 나눠 "16" 이 헤르츠가 됐다) ③ 번역이 없는 언어는 화면에 en 문장이 나오므로 `except`·`keys` 도 대체 언어 문장으로 맞춘다. ④ 데바나가리(hi)는 뒤 경계를 둔다 — 낱말 뒤에 데바나가리 글자가 이어지면 다른 낱말(वेटर·बगल), 어미(याँ·ओं·एँ·ता·ना·िंग·्स·मेंट)만 허용. 벵골어(bn)는 격 어미를 붙여 쓰므로 경계를 두지 않고 틀린 낱말만 `avoid`. ⑤ 아랍 문자: ar 은 ة 로 시작하는 꼬리를 막고(المعرفة 지식·المعاملة 거래·الشرطة 경찰), ur 은 정해진 어미만 허용한다(بٹن 버튼·ٹکٹ 표·ویٹر 웨이터). 사전 표기보다 길게 잡힌 꼴은 `Glossary::surfaces()` 와 색인 `hits.surface` 를 모음 부호를 빼고 맞대어 찾는다. ⑥ 이미 `avoid`·`except` 가 있는 항목에 새로 더할 때는 그 목록에 합친다 — 같은 필드를 두 번 쓰면 PHP 가 뒤의 것만 남겨 앞의 고침이 조용히 사라진다(`popup-check.php` 가 "같은 필드를 두 번 씀"으로 잡는다). ⑦ `shares` 로 남의 표기를 빌리면 그 표기는 뜻이 여럿이 되어 **다른 용어의 문맥 신호로 세지지 않는다** — reasoning-mode 가 inference 의 표기를 빌리자 "학습과 추론" 문장의 학습(training, 추론이 cue)이 17개 언어에서 빠졌다. 한 언어의 두 뜻은 먼저 키(`except`)로 풀고, `shares` 를 쓴 뒤에는 전후 비교에서 다른 용어가 빠지지 않았는지 본다. 언어 하나를 `context` 에 넣기 전에도 그 언어에서 빠지는 문장을 읽는다(ru "параметры" 를 context 로 막자 모델 파라미터까지 빠졌다). ⑧ `except`·`keys` 의 번역문에 자리표시자가 있으면 그 자리는 아무 글자다 — 'Bölüm :number' 가 "Bölüm (partition), …" 문단 전체에 걸려 파티션 설명이 빠졌다. 그래서 `keyed()` 는 자리표시자를 한 줄 80자까지만 맞추고, `popup-check.php` 는 글자 부분이 12자 안 되는 그런 키를 경고한다. ⑨ 장음·이어 쓰는 표기는 별칭으로 통째 잡는다 — ja 「メモリー」를 사전 표기 「メモリ」로만 감싸 「ー」가 밖에 남았다(`memory_aliases`). ⑩ 같은 영어 표기가 Claude Code 명령(`/memory`)·지시 층 목록에 나오면 기기 RAM 이 아니다 — 문맥 신호가 모자라면 그 키를 빌린 뜻의 `keys` 에 넣는다(17개 언어가 한 번에 바뀐다).
   다른 문자 언어(hi·bn·th·ar·ur)는 표기 뒤에 붙은 글자를 묶어 읽는다 — 위 명령의 가타카나 범위를 그 문자 범위(hi `\u0900-\u097F`, bn `\u0980-\u09FF`)로 바꾸고, 알려진 어미를 빼면 진짜 다른 낱말만 남는다.
   **비율 점검** — 같은 용어인데 한 언어의 팝업이 en 보다 훨씬 많으면 그 언어 표기가 일상어다. en 에 없는 키의 문장을 읽는다:
   ```bash
   sqlite3 storage/app/popup-index/ru.sqlite "attach 'storage/app/popup-index/en.sqlite' as e; select h.chosen, count(*) n, (select count(*) from e.hits x where x.chosen=h.chosen) en from hits h group by h.chosen having n > 3*en + 10 order by n - en desc limit 20"
   ```
   찾은 원인 셋과 고침: ① 별칭 구절 속 쉼표 — 'запрос, ключ и значение' 가 나뉘어 "запрос"(요청) 하나가 표기가 됐다 → 별칭 구절에 쉼표를 쓰지 않는다 ② 두 낱말 용어의 한 낱말 번역 — function call 이 "호출"·"调用"·"Aufruf"(조회수까지) → 그 언어만 `context` 에 넣고 `cues` 로 함수 문맥에서만 ③ 한 낱말이 그 언어에서 두 뜻 — ru "словарь"(dict·어휘), ar "وكيل"(에이전트·프록시) → 그 낱말을 맞는 용어에 별칭으로 주고, 남는 문장은 키로(`except`).
   표기 단위로도 본다 — en 에는 그 뜻이 없는 키에서 같은 표기가 여러 화면에 붙었으면 그 언어의 일상어일 수 있다(th "ข้อมูล" 은 "정보" — 예약 정보·내 정보, tr "izin ver" 는 "허락하다", ar "حقوق النشر" 는 저작권, vi "chỉ đọc" 은 "읽기만"). 일상 뜻이 여러 화면에 흩어져 있으면 그 언어만 `context` + `cues`, 굳은 구절이면 그 언어 `avoid`:
   ```bash
   sqlite3 storage/app/popup-index/th.sqlite "attach 'storage/app/popup-index/en.sqlite' as e; select h.chosen, lower(h.surface), count(distinct h.key) k from hits h where h.chosen is not null and not exists (select 1 from e.hits x where x.key=h.key and x.chosen=h.chosen) group by 1,2 having k >= 12 order by k desc limit 10"
   ```
   어미를 붙여 쓰는 언어(ru·tr·de)는 **꼬리 점검**도 한다 — 사전 표기(`Glossary::surfaces()`)보다 길게 잡힌 꼴의 꼬리를 모아, 흔한 어미(-а·-ов·-ını)는 빼고 드문 꼬리만 읽는다. 다른 낱말이 나온다: ru порт→портал(포털)·портфолио, раздел(파티션)→разделяет(나누다), стек→стеклянный(유리), код→кодировка(인코딩), баг→багаж(짐), tr istem(프롬프트)→istemeden(원하지 않고), sınıf→sınıflandırır(분류하다), bağlam(문맥)→bağlamadan(묶지 않고). 그 언어 `avoid` 에 그 낱말 줄기를 넣는다.
   띄어쓰기가 없거나 음절을 띄어 쓰는 언어는 **경계 점검**을 한다. 색인 `hits.sentence` 는 표기 바로 앞 공백을 남기므로, 【 바로 앞 글자로 낱말 가운데서 시작한 표기를 고를 수 있다. ja 는 앞뒤가 가타카나(・·ー 는 빼고)이고, th·zh 는 길이 5자 이하의 짧은 표기를 문맥과 함께 읽는다. 찾은 것: th 'คำชี้แจง'(해명)의 คำชี้ 가 한국어 조사, 'สำนวน'(표현)이 관용구였다. ar·ur 은 【 앞에 붙은 아랍 글자 가운데 접두사(و·ف·ب·ل·ك·ال)가 아닌 것을 읽고, ف 로 끝나는 것도 따로 본다 — 'فشل·فشلت'(실패)의 شل 이 오류 문장 45곳에서 쉘로 잡혔다. ko 는 표기 뒤에 붙은 한글이 조사·어미(을·에서·하려면·라면…)가 아닌 곳을 읽는다 — '로그인' 의 로그가 로그(logarithm)로 4곳 잡혔다. vi 는 표기의 첫·끝 음절과 바깥 음절의 쌍이 번역 전체(`lang/vi/*.php`)에서 표기 안의 쌍보다 흔한 곳을 읽는다. 찾은 것: "chia … thành ngữ pháp"(문법으로)의 thành ngữ(관용구), "Mô hình mở rộng"(확장 모델)의 mô hình mở(오픈 모델), "cung cấp quyền"(제공)의 cấp quyền(권한). 'một tệp' 처럼 기능어와 붙은 쌍은 버린다. 고칠 때는 그 구절 전체를 `avoid` 에 넣고, 같은 문구가 되풀이되지 않으면 키(`except`)로 막는다. 🛑 Blade 가 번역 둘 이상을 이어 붙인 글("tagline · 나이 · 활동")은 키 전체를 맞추는 `except` 에 걸리지 않는다 — th /learn/english 의 'สำนวนในชีวิตประจำวัน'(일상 표현)이 except 뒤에도 남았다. 그런 문구는 구절 `avoid` 로 막고 화면 HTML(`curl -skL https://sonub.localhost:7843/<언어>/<주소> | grep -c 'data-term=\\\?"<id>'`)로 확인한다.
5. **내용을 쓴다** — 필드·문체·길이·17개 언어 절차는 [sonub/content.md](sonub/content.md)(범용 원칙은 [../content.md](../content.md)). 이미 있는 용어면 새로 만들지 말고 감싸기만 한다. 예시(`example`)는 가능하면 넣고, 더 깊은 내용은 `href` 로 SONUB 의 그 화면에 잇는다. 17개 언어는 JSON 하나에 모아 `add-terms.php` 로 넣는다(손으로 17개 파일을 열다 한 언어를 빠뜨리지 않게). 넣은 직후 `popup-check.php` 로 빠진 언어·자리표시자·죽은 참조(관련 용어·Blade 의 id)·표기 충돌을 검사한다 — 종료 코드 1 이면 고친 뒤 다시.
   ```bash
   # 입력은 컨테이너가 읽는 저장소 안에 둔다(storage/app/). --dry-run 으로 먼저 본다
   bash $POPUP/scripts/sonub/run.sh add-terms.php /app/storage/app/popup-terms.json --dry-run
   bash $POPUP/scripts/sonub/run.sh add-terms.php /app/storage/app/popup-terms.json
   bash $POPUP/scripts/sonub/run.sh popup-check.php
   ```
   `TERMS` 의 구조(분류·aliases·related·href·`match`)는 `add-terms.php` 가 넣지 않는다 — `app/Content/Glossary.php` 에 손으로 한 줄 더한다.
6. **붙인다** — 트리거는 다섯이다(상세 [sonub/design.md](sonub/design.md)).

   | 대상 | 방법 |
   | --- | --- |
   | 본문 평문 속 용어 | `<p><x-glossary.text :text="__('group.key')" /></p>` — 서버가 지금 언어 표기로 찾아 감싼다(첫 등장만). 한 화면 전용 낱말이면 `scope="shell"`(여러 화면의 낱말을 함께 찾으려면 `scope="learn-ai,shell"` 처럼 쉼표 — 같은 표기면 앞 이름의 뜻. 쉘이 본업이 아닌 화면은 `+shell` — 명령·쉘 고유 낱말만, 프롬프트·권한 같은 일상어는 `Glossary::SIDE_SKIP` 로 뺀다. MCP·하네스처럼 일반 개념 화면은 `learn-ai,+claude-code` — 곁들인 화면의 낱말은 주 화면·모든 화면의 낱말과 표기가 같으면 빠지고(스킬·MCP·시스템 프롬프트·MCP 서버는 일반 뜻), 도구·명령·세션·규칙·턴은 `SIDE_SKIP_CLAUDE` 로 뺀다), 수업·강사 화면의 안내 문장은 `<x-glossary.lesson-text>`, 여러 문단에 걸쳐 한 번만 밑줄을 그으려면 `group="…"` |
   | 누르면 할 일이 따로 있는 요소(메뉴 링크·카드·예제 단추) | 그 요소에 `data-term="…" data-term-label="표기"` — 마우스로 400ms 머물면 열린다. 휴대폰·키보드를 위해 곁에 `<x-glossary.info id="…" />` |
   | 화면 부분의 사용법 | 그 부분의 작은 제목(`<small>`) 곁에 `<x-glossary.info id="menu-…" />` |
   | 문장·구절·개념(자동으로 찾으면 안 되는 것), 자동 매칭이 못 잡는 활용형 | `<x-glossary.term id="…">{{ __('group.key') }}</x-glossary.term>` + (문장·개념이면) 사전 항목 `'match' => false` |
   | 메인 메뉴·메가 메뉴·전체 메뉴 서랍 | 팝업을 붙이지 않는다. `data-term`·`x-glossary.*` 없이 실제 링크와 일반 그룹 제목만 둔다(SSOT 11절 "메가 메뉴") |

7. **음성** — 스피커·마이크는 이미 있다([sonub/voice.md](sonub/voice.md)). 새 항목은 따로 할 일이 없다 — 모든 팝업(본문 용어·`<x-glossary.term>`·물음표·메뉴 링크)이 같은 음성을 쓴다. 팝업 내용(번역)을 고치면 캐시 키가 바뀌어 다음 설명을 새로 쓴다.
8. **디자인** — 보기 좋은 팝업의 구조·CSS 는 [sonub/design.md](sonub/design.md). 디자인은 CSS 로만 푼다(AGENTS.md "CSS"), 테마 토큰은 sonub-design 스킬.
9. **검증하고 보고한다** — 아래 "검증".

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
# 1) 사전 — 17개 언어 필드·선택 필드 일치·자리표시자·관련 용어·죽은 참조·문맥 신호(cues·shares·borrow)·같은 표기의 cues 유무 (문제 있으면 종료 코드 1)
bash $POPUP/scripts/sonub/run.sh popup-check.php

# 1-2) 뜻 색인 — 고친 낱말의 모든 자리가 그 문장의 뜻인지(예전과 다른 뜻·감싸지 않음·동점·근거 없는 팝업)
bash $POPUP/scripts/sonub/run.sh popup-index.php build en
bash $POPUP/scripts/sonub/run.sh popup-index.php doubt en

# 2) 번역 파일 문법·키·자리표시자 (AGENTS.md "다국어 번역"의 검사, G=glossary · 다른 그룹을 고쳤으면 그 그룹도)
docker compose exec -T app sh -c 'for f in lang/*/glossary.php; do php -l "$f" > /dev/null || echo "문법 오류: $f"; done'

# 3) 테스트 — 용어 사전 관련(전체는 ./deploy.sh 가 돌린다 — AGENTS.md "작업 흐름")
docker compose exec app php artisan test --filter=Glossary
docker compose exec app vendor/bin/pint <고친 PHP 파일>   # lang/*.php 에는 돌리지 않는다 — 두 칸 들여쓰기 파일 전체를 다시 써 수천 줄이 바뀐다
```

4) **글자 복사** — 모든 페이지의 용어 글자가 드래그 선택·복사에 들어가는지 실제 마우스 드래그로 본다(Chromium·WebKit, SSOT 23절 "용어 글자 복사"). 용어 CSS·JS·마크업을 고쳤으면 꼭 돌린다:

```bash
mkdir -p /tmp/pw && (cd /tmp/pw && npm i playwright && npx playwright install chromium webkit)   # 한 번
python3 $POPUP/scripts/sonub/page-crawl.py en 2000                                             # 주소 목록
PLAYWRIGHT_DIR=/tmp/pw node $POPUP/scripts/sonub/select-check.mjs                              # 실패하면 종료 코드 1
```

5) **브라우저** — SONUB-DEV-GUIDE "브라우저 확인" 순서로 고친 화면을 연다(`https://sonub.localhost:7843`): 문단을 드래그해 붙여 넣기(용어 글자가 있다)·마우스 올리기(열림)·아랫줄 용어를 지나 천천히·비스듬히 팝업으로 옮기기(그대로 열림)·벗어나기(닫힘)·누르기(고정)·다시 누르기·Esc(닫고 단추로 포커스)·관련 용어 칩·더 배우기, 넓은 화면·좁은 화면(아래쪽 시트)·RTL(`/ar/…`)·다른 언어 하나 이상. 음성이 있으면 네트워크 요청 본문에 팝업 설명 원문이 **아니라** 용어 id·모드만 가는지, 스피커 끄기/켜기·자동 재생 차단 안내·로그인 안내·마이크 흐름을 본다. 확인하지 못한 것은 보고에 적는다.

## 보고

고친 파일, 새 용어 id·필드("번역 키 N개를 17개 언어에 넣었다"), 감싼 화면과 문장 키, 뜻이 여럿인 낱말과 가르는 법(cues·context·avoid)과 뜻 색인의 바뀐 곳·감싸지 않은 곳 수, 검증 결과(스크립트·테스트 통과 수·브라우저에서 본 화면), 확인하지 못한 것, 커밋 해시.

## 레퍼런스 (sonub/)

### 지금 있는 용어 팝업 → [sonub/current.md](sonub/current.md)

이미 main 에 있는 용어 사전과 팝업의 전체 구조와 핵심 소스코드다. `App\Content\Glossary` 의 `TERMS` 구조(id·category·aliases·related·href), 본문을 조각으로 나누는 `segments()`, 표기를 길이 내림차순으로 묶은 매칭 정규식과 언어별 경계 규칙(라틴·키릴·한글 조사·아랍·결합 문자), 괄호 앞 표기, 번역 키 규약, 죽은 링크를 내리지 않는 `href()` 를 싣는다. `<x-glossary.text>` 컴포넌트 전문, `glossary.js` 의 열고 닫기, 뜻 API 와 라우트, CSS 선택자, 기존 테스트가 지키는 것, 알려진 한계까지. 기존 동작을 건드리기 전에 읽는다.

### 팝업 내용 쓰기 → [sonub/content.md](sonub/content.md)

초보자가 한 번 읽고 이해하는 설명을 17개 언어로 쓰는 법이다. 필드마다 역할과 길이, 번역 키 이름(`glossary.<id>_<field>`, 하이픈은 밑줄), 사전 항목(`TERMS`)에 넣는 값과 id 짓기, 문장·개념 항목(`'match' => false`)과 메뉴 항목, 문체 원칙, 언어별 말투, 별칭(aliases), 태그가 든 번역 문장 처리, 예시 항목 전문, 17개 언어를 빠짐없이 넣고 검사하는 절차가 있다.

### 보기 좋은 팝업 — 모양·동작 → [sonub/design.md](sonub/design.md)

laravel 스킬의 팝업을 분석해 SONUB 에 가져올 것과 가져오지 않을 것을 가른 문서다. 트리거(`<x-glossary.text>`·`<x-glossary.term>`·`a[data-term]`·메인 메뉴의 `term`)의 마크업과 실제 코드, 메인 레이아웃이 팝업 자원을 모든 화면에 싣는 방법, 팝업 틀(Blade)과 CSS(리엔 음성 요소 포함), 접근성·RTL·색각 규칙, 이전 사이트에서 실제로 깨졌던 것들이 있다.

### 스피커·마이크 — DeepSeek 와 Supertonic → [sonub/voice.md](sonub/voice.md)

팝업 음성의 전체 설계와 실제 코드다(2026-10-21 만듦). 스피커(기본 켬)는 팝업이 열리면 팝업 내용을 시스템 지침에 실어 DeepSeek 에 "귀로 듣기 좋은 설명"을 받고, 마이크는 SenseVoice(준비 전엔 Web Speech)로 받아 적은 질문을 같은 지침으로 묻는다. 요청 → 큐 잡 → 개인 실시간 채널 흐름, 설명 발화 글 캐시, 로그인·정지·시험 중·하루 한도·1분 10번 처리, 지침 전문, `SpeechText::clean/pack`, 브라우저 음성 세션 상태 기계, 문구 키, Pest 테스트 목록, SSOT 초안이 있다.

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
| `popup-plain.php [언어] [최소 글자]` | **평문 문단 찾기** — Blade 가 팝업 부품 없이 `<p>{{ __('…') }}</p>` 처럼 그대로 찍는 문단인데 사전 용어가 든 곳(파일:줄·키·잡힌 용어). 학습 내용이면 `<x-glossary.text>` 로 바꾸고 그 파일의 scope·group·exclude 를 그대로 단다. 알림 종·관리 화면·진행 메시지는 그대로 둔다. 감싼 문장을 HTML 그대로 찾던 테스트는 `withoutGlossary()` 로 본다(2026-10-29 — /tool-master·/lab·DeepSeek·OpenRouter·MoE 출처 등 34곳을 감쌈) |
| `translate/verify.php` · `translate/merge-parts.py` · `translate/combine.py` | 여러 언어를 번역 작업자에게 나눠 맡길 때 — 작업 파일 검사(en 과 대조)·조각 합치기·17개를 add-terms 입력으로 묶기. 지침 틀은 [sonub/translate-brief.md](sonub/translate-brief.md) |
| `translate/verify-group.php <폴더> <언어…>` | 번역 그룹 하나(예: `shell_advanced`)를 통째로 맡길 때의 작업 파일 검사 |
| `translate/vocab.php <언어> [id 정규식]` | 그 언어의 사전 표기·별칭 목록 — 번역 작업자가 본문 낱말을 사전 표기와 맞추게 한다(같아야 팝업이 붙는다) |
| `select-check.mjs [주소목록\|/주소…]` (node, 컨테이너 밖) | 용어 글자 복사 검사 — 페이지마다 보이는 용어 문단을 Chromium·WebKit 에서 실제 마우스로 드래그해 선택 글자에 용어가 빠지지 않았는지, 모든 용어의 계산된 `user-select` 가 `text` 인지 본다. 주소 목록은 `page-crawl.py` 결과(`storage/app/popup-pages/en/pages.txt`), Playwright 는 `PLAYWRIGHT_DIR` |
| `popup-index.php build\|report\|doubt\|compare\|query\|senses\|outliers\|shadow [언어\|all] […]` | **뜻 색인** — 모든 번역 문장(glossary 빼고)에서 용어가 잡힌 자리·문맥으로 고른 뜻·점수·예전 결과(첫 후보)·다른 용어의 근거(`evidence`)·실제 팝업 자리(`shown`)를 SQLite(`storage/app/popup-index/<언어>.sqlite` — `terms`·`surfaces`·`texts`+FTS5·`hits`·`contexts`)에 넣고, 표기별 고른 뜻 수와 동점 목록을 보인다. `report` 는 17개 언어 비교, `doubt` 는 근거 없이 감싼 일반 낱말, `compare` 는 같은 키에서 en 이 거절한 뜻을 감싼 다른 언어의 자리. `lookalike` 는 용어가 드문 그룹(문장당 0.35개 미만)에서 다른 용어의 근거 없이 혼자 뜬 용어 — 일상 낱말이 IT 용어와 같은 글자인 곳(ja 「この端末」 = 기기, tr 「Ana sayfaya git」 = 가라, pt 「data」 = 날짜, ar 「المشغّلين」 = 운영자들, tr 「ders programı」 = 시간표). en 원문의 같은 키에 그 뜻이 없는 곳(`en 에 없음`)을 먼저 보인다. 끝에 `all` 을 붙이면 그룹 밀도와 상관없이 en 에 없는 뜻만 모두 보인다 — 15개 언어를 4묶음으로 나눠 읽으면(하위 에이전트에 판정만 맡기고 고치기 전 문장을 다시 확인) 한 차례에 다 본다. 고친 뒤에는 꼭 `diff` 로 `(없음) → 뜻` 줄을 다시 읽는다 — 같은 그룹의 다음 자리가 팝업을 이어받아, 같은 실수(ar 「المعالج」 = CPU, tr 강사 화면의 「program」 = 시간표, vi 「chỉ đọc」 = 읽기만)가 두세 번 이어진다. 같은 그룹·같은 낱말이 되풀이되면 키를 하나씩 빼지 말고 그 그룹의 같은 뜻을 한 번에 모아(`select … where chosen='program' and grp in (…)`) 뺀다. 그 언어 전체에 문맥 요구(`context`)를 걸면 맞는 팝업도 함께 사라지니(tr program — 맞는 7곳을 잃음) diff 로 잃은 것을 먼저 센다. 색인은 자리표시자 이름(`:form`·`:px`)을 용어로 세지 않는다 — 화면에서는 값으로 바뀐다. 테스트에서 범위 용어(momentum·attention-qkv)의 '없음' 은 색인의 그 키 범위(`texts.scope`)를 넘겨 확인한다 — 범위 없이 보면 저절로 맞는다. `diff <언어> <예전.sqlite>` 는 고치기 전 사본과 비교한다 — 첫 자리를 빼면 같은 화면의 다음 자리가 팝업을 받으니(`(없음) → 뜻`) 새로 뜬 곳도 꼭 읽는다. 언어 이름이 17개 밖이면(셸 변수가 안 나뉘어 `"ar runner"`) 빈 데이터베이스를 만들지 않고 멈춘다. 화면 범위는 화면이 실제로 넘기는 값으로 정한다 — Blade 의 `scope="…"`·머리 카드 `glossary="…"`·`<x-glossary.lesson-text>`(lesson)·같은 파일에서 글자로 정한 `:scope="$scope"`, AI 과정 챕터 글(`aicourse.<챕터>_*`)은 키마다 `AiCourse::glossaryScope()`, PHP 가 정하는 그룹은 `DYNAMIC_SCOPES`(Blade 짐작보다 앞, 쉘 강의 → shell · aicourse → learn-ai). 표의 `<th scope="col">` 은 HTML 속성이라 빼고, 감싸는 글(`:text="__('그룹.…')"`)이 있는 줄은 그 그룹만 센다. 화면이 감싸지 않는 뜻(`:exclude`)은 기록하지 않는다 — 그 줄이 그리는 키(또는 `'shdeep.'.$key.'_challenge'` 같은 키 꼴)에만, 수업 화면 `lesson-text` 의 고정 목록, 그룹 전체에 쓰는 상수(`group_excludes()` — 영어 교재 `EnglishCourse::GLOSSARY_EXCLUDE`·AI 해부학 `AiInternals::GLOSSARY_EXCLUDE`). 제외된 자리 수는 build 끝줄에 나온다. 이렇게 맞추기 전에는 /mcp·/harness 가 색인에는 일반 뜻, 화면에는 클로드 코드 뜻으로 달라 점검이 놓쳤다(2026-10-29). `pages <언어>` 는 화면과 색인을 맞댄다 — 색인은 번역 문장으로 짐작하지만 화면은 Blade·화면 범위·조각이 섞인다. 이 점검으로 `<x-ui.rich-text>` 가 여러 줄 번역을 문단·목록 조각(`RichText::blocks`)으로 나눠 조각마다 감싸는데 `except`·`keys` 는 번역 **전체**와 같을 때만 걸려, 색인에서는 고쳐진 /ai/build 의 어텐션 Key 가 화면에서는 여전히 Python 사전 키로 뜨던 것을 찾았다(2026-10-29) — 지금은 `keyed()` 가 12자 이상인 조각에도 걸고, 색인 build 도 같은 조각(`rich_pieces()`)으로 뜻을 고른다. AI 도구 목록 항목은 `AiTools::ltrTokens()` 가 경로·명령(`/install-github-app`·`setup-token`)을 떼어 내고 그 사이 글 조각마다 감싸서, 색인에서는 빠진 tr "claude setup-token ile yapılmış bir token"(접근 토큰)이 화면에서는 LLM 토큰으로 남았다(2026-10-30) — `keyed()` 는 번역문 안에 그대로 든 24자 이상 조각도 같은 키로 본다(16자로 하니 vi 제목 "Mô hình suy luận" 이 다른 키 문장 속에 들어 있어 잘못 걸렸다). `keys` 로 고른 뜻이 그 화면 범위(`scope`) 밖이면 후보에도 없어 `keys` 가 걸리지 않았다 — 클로드 코드 화면의 그 토큰은 LLM 토큰을 `except` 로 빼자 팝업이 아예 없었다. 지금은 `resolve()` 끝의 `forceKeyed()` 가 그 키의 문장에서 같은 표기로 잡힌 자리를 그 뜻으로 바꾸고, 그 화면에 그 표기를 잡는 용어가 없으면(fr `jeton`·zh 「令牌」·th 「โทเค็น」) 그 뜻의 표기를 문장에서 찾아 첫 자리를 더한다. 문장에서 찾은 긴 표기 안에 짧은 자리가 다 들어가면(“prompt injection” 안의 “prompt”) 그 자리를 지우고 긴 뜻이 차지한다 — 짧은 낱말 뜻을 `except` 로 뺀 뒤에도 남은 빈 자리가 긴 표기를 막던 것(Claude Duet·Codex dots 의 프롬프트 인젝션). 그래도 안 뜨면 그 언어 번역의 낱말이 사전 표기에 없는 것이다 — 그 언어 `<id>_aliases` 에 더한다(ar 「رمز」 는 상태 코드·기호와 같은 글자라 더하지 않았다). 고친 뒤에는 page-crawl.py 로 화면을 다시 모아 `pages` 를 다시 돈다. 용어 상세(`/glossary/<이름>`, `glossary-detail` 그룹)도 화면에서 감싸므로 색인에 넣는다 — 화면처럼 범위 없이, `` `코드` `` 조각을 떼고(`detail_pieces()`), 설명하는 용어 자신은 빼고(`detail_term()`), 용어마다 한 페이지로 센다. 넣기 전에는 색인이 이 글을 빼서 QR·종료·짝짓기 코드, `claude.ai/code`, 데스크톱 앱의 Code 탭(→ 소스 코드), 프로젝트 하네스의 runner(→ 모델 러너), project memory(→ RAM)를 놓쳤다(2026-10-30). 그 `` `코드` `` 사이 글은 짧아서(zh 20자 미만) `keyed()` 의 조각 기준이 한자·가나는 12자다. `keyed()` 는 번역문을 `` `코드` `` 로 나눈 12자 이상 조각도 같은 키로 본다 — 그 전에는 "`` `MEMORY.md` `` lists every memory" 의 조각(18자)이 24자 기준에 못 미쳐 고친 뜻이 화면에 걸리지 않았다. `outliers [언어]`(언어를 빼면 모든 언어)는 뜻마다 실제 팝업 수를 en 과 견줘 두 배 + 4 이상인 뜻과 en 에 없는 예문을 보인다 — 그 언어 낱말이 다른 뜻까지 잡은 곳(zh 「再次调用抓到的分组」 = 정규식 되부르기가 함수 호출, 「秘【密钥】匙」 = 비밀 열쇠 가운데). 맞는 경우도 많으니(es·hi 'terminal de práctica' = 연습 상자) 문장을 읽고 고친다. 반대로 크게 적은 뜻(`빠짐`)은 그 언어 번역 낱말이 사전 표기에 없는 곳이다 — zh 「记忆」(에이전트 메모리)·id 「izin」(권한)은 별칭으로 더하고 일상 뜻(凭记忆·izin usaha)만 `avoid`. 일상 뜻이 많은 낱말(th 「สิทธิ์」 = 체험 자격·권리, es·tr 「panel」 = 개발자 도구·옆 패널, zh 「安全」 = 안전)은 더하지 않는다 — 빠진 팝업이 틀린 팝업보다 낫다. `doubt <언어> 40 <id,id…>` 는 그 용어의 근거 없는 자리를 **모두** 보인다 — 기본 예문 4개로는 놓친다(en 관리자 통계의 'profile score weights' 가 모델 가중치였던 것은 다섯째 자리). 한 그룹에서 그 뜻이 거의 다 틀리면(쉘 강의의 fetch = curl 로 내려받기, Git 강의만 git fetch) 하나씩 빼지 말고 17개 언어 색인에서 그 그룹의 **후보** 키를 모두 모아 한 번에 `except` 한다 — `select distinct key from hits where candidates like '%"<id>"%' and grp in (…)`(지금 팝업이 아닌 다음 자리까지 잡힌다). 화면 범위에 그 주제가 들어 있으면(쉘 강의 scope shell,git) 화면 주제가 신호로 세져 `context` 로는 막지 못한다. `빠짐`의 en 문장도 읽는다 — en 이 틀린 뜻으로 감싼 것일 수 있다(ar 레이아웃 빠짐 → en 'four keyboard layouts'·'zip layout' 이 화면 레이아웃이었다). `cut <언어>` 는 표기가 낱말 가운데서 끝난 자리를 모은다 — 「ー」가 이어진 것(ja 「パラメーター」 38곳이 「パラメータ」만 감쌌다)은 그 언어 `<id>_aliases` 에 긴 표기를, 가타카나가 이어진 것은 복합어(エージェントツール — 그대로)인지 다른 낱말(ホームページ = 홈페이지, 홈 폴더가 아님 — `avoid`)인지 읽고 정한다. zh·ja 는 ICU 사전 낱말 경계(`IntlBreakIterator`)로도 본다(`경계`) — 띄어 쓰지 않아 다른 낱말 속에 용어 글자가 숨는다: zh 「测试运行」(테스트 실행) 속 「试运行」, 「钩子命令」 속 「子命令」, 「第一次运行时」(처음 실행할 때)의 「运行时」, 「稍微调高」(조금 올리다)의 「微调」, ja 「エラーコード」. ICU 도 틀리게 나누니(智能体和|子智能体) 대부분은 맞는 복합어다 — 읽고 다른 낱말일 때만 `avoid`. th 는 ICU 가 너무 잘게 나눠 쓰지 않는다. 번역 그룹 하나를 한 페이지로 본다 `shadow [언어]` 는 색인 없이 사전만 본다 — 범위(`scope`)가 있는 용어가 범위 없는 다른 용어의 **이름** 표기를 같이 가진 곳. 그 화면에서는 범위 층(1)이 이겨 정확한 용어가 늘 진다. 화면 전용 뜻(클로드 코드 화면의 `cc-skill`·쉘 화면의 `shell-prompt`)이면 맞고, 묶음 용어가 낱낱 용어 이름을 가진 것이면 틀리다 — `hook-event`(claude-code)가 `PreToolUse`·`PostToolUse` 를 `exact` 로 가져 자기 용어 `hook-pretooluse`·`hook-posttooluse` 가 훅 화면에서 한 번도 뜨지 않았다(2026-10-30, 그 표기를 빼고 `related` 로). en 동점(`margin < 10`)을 읽다 찾았다 — 동점은 이런 층 차이를 숨긴다. `compare` 는 다른 팀이 새 번역을 넣은 뒤에도 돈다 — 새 wizard 스킬 문장에서 en 'attention cues'(화면 효과)가 AI 어텐션, id 'bunga api'(불꽃)가 API, ar 「معالجات」(위저드)가 핸들러로 떴다. 한 언어만 다른 뜻이면 그 언어의 표기가 별칭에 없는 것일 때가 많다 — ar·bn·ur·zh 가 'loop 장치'를 「جهاز loop」·「loop ডিভাইস」·「loop ڈیوائس」·「loop 设备」로 써서 사전 표기(「回环设备」 등)와 달라 `loop` 만 반복문으로 잡혔다(`<id>_aliases` 로). 용어 상세의 `` `코드` `` 조각(RichText·백틱 조각)도 한자·가나는 8자면 같은 키로 본다 — ja 「に全メモリーの一覧」(9자)가 12자 기준에 못 미쳐 RAM 으로 남았다. 색인은 그룹 하나에 화면 범위 하나를 짐작하므로, 같은 그룹 글을 범위 없이 그리는 부품이 섞이면 색인은 맞고 화면만 틀린다 — Git 강의 본문(`Git::inline` → git)과 달리 그림 설명(`x-ui.figure`)에 `scope` 가 없어 「작업 디렉터리」가 셸 디렉터리로 떴다(2026-10-30, `pages ko` ①에서 찾음). 그래서 위젯의 `x-ui.figure`·`x-glossary.text`·`x-ui.rich-text` 는 그 화면 본문과 같은 `scope` 를 넘긴다 — `grep -rn 'x-ui.figure' resources/views | grep -v scope=` 로 범위 있는 화면의 빠진 곳을 찾는다. 반대로 그 그룹 글을 PHP(`Glossary::html($m[0], 'python')`)로만 감싸면 색인이 Blade 글자에서 범위를 못 읽는다 — 파이썬 강의 그림에 `scope="python"` 을 넣자 `pylesson` 그룹이 python 범위로 짐작돼 17개 언어 249곳(딕셔너리·range·def…)이 처음으로 색인에 들어왔다. 범위를 고친 뒤에는 `diff` 의 `(없음) → 뜻` 묶음을 그룹별로 세어(`grep -c ' pylesson\.'`) 범위 밖 뜻만 읽는다. 생성이 같은 말에 갇히는 'loop'("is warn is warn")처럼 원문(en)부터 틀린 뜻은 `compare` 로는 안 보인다 — 화면 대조 ②의 예문을 읽어 찾는다(7개 언어에서 파이썬 반복문이었다). 팝업 글 그룹(`glossary`)은 본문이 아니라 빼지만, 화면이 감싸는 두 군데는 넣는다 — 쉘 강의 단원 머리의 '쉽게 말하면'(`glossary.menu_shell_<단원>_easy`, 단원 범위)과 용어 본문(term-body)이 그리는 그 용어의 `_easy`·`_example`(범위 없이, 자신 제외). term-body 를 그리는 용어는 용어 상세 화면 + 하네스 탭(`Harness::term`) — `detail_ids()`. 넣고 보니 비유 속 일상 낱말이 기술 뜻으로 떴다: LEGO 'any model'(15개 언어 AI 모델)·'safety options'(보안)·'a form with named boxes'(HTML 폼)·'An inspector who tastes'(디버깅 창)·vi 「phiên dịch」(통역사 → 셸 세션). 비유 글은 키 `except` 로 뺀다(2026-10-30). |
| `popup-check.php` | 사전 완결성 검사 — 필수·선택 필드 17개 언어, 자리표시자, 관련 용어, Blade 의 죽은 참조, 표기 충돌. 선택 필드를 더하면 스크립트의 `POPUP_OPTIONAL`(과 `add-terms.php` 의 `TERM_FIELDS`)에도 더한다 |
