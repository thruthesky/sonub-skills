# 보기 좋은 팝업 — 모양과 동작

sonub 저장소의 laravel 스킬(`.claude/skills/laravel/site/`)의 팝업을 분석해 SONUB 초보자용으로 옮길 것과 옮기지 않을 것을 가르고,
트리거·팝업 틀·CSS 의 원칙을 둔다. 지금 코드는 current.md 가 정본이다. ⬜ 표시는 아직 없는 것의 청사진 — 만든 뒤 이 문서를 실제 코드로 바꾼다.

## 목차

- [laravel 스킬 팝업 분석](#laravel-스킬-팝업-분석)
- [SONUB 팝업의 원칙](#sonub-팝업의-원칙)
- [트리거](#트리거)
- [팝업 틀 ✅](#팝업-틀-)
- [CSS ✅](#css-)
- [동작 규칙](#동작-규칙)
- [레이아웃 전역 싣기 ✅](#레이아웃-전역-싣기-)
- [접근성 · RTL](#접근성--rtl)
- [실제로 깨졌던 것들](#실제로-깨졌던-것들)
- [테스트](#테스트)

## laravel 스킬 팝업 분석

laravel 스킬은 정적 문서 사이트다. `site/glossary.json`(용어 한 벌) → `site/lib.js` 의 `L.gloss.apply()` 가 본문 글자 노드를 훑어 `<span class="gl" data-t="id">` 로 감싸고 → `site/popup.js` 가 마우스 오버·탭에 팝업을 띄운다.

| laravel 스킬이 하는 것 | 어떻게 | SONUB 에 |
| --- | --- | --- |
| 용어 한 벌을 한 파일에 | `glossary.json` 항목 = term·kind·stage·short·desc·php·example{lang,caption,code}·see·official·aliases | ✅ 이미 같은 원칙 — `TERMS` + `lang/*/glossary.php` |
| 팝업 머리 | 표기(코드 용어면 고정폭) + 종류 칩 + 단계 칩 + × | ✅ 표기 + **분류 칩** + 🔊 + × |
| 굵은 한 줄 뜻 → 설명 | `.pop-b .short`(굵게) 다음 `desc` | ✅ `short` → `long` |
| "순수 PHP 로는" 비교 상자 | 이미 아는 것(PHP)에 새 개념을 잇는 색 상자 | ✅ **"쉽게 말하면"**(`easy`) — SONUB 학습자가 이미 아는 것은 일상이라 일상 비유로 |
| 예제 | 탭 하나, 하이라이트 + 복사 단추 | ✅ **"예시" 상자**(`example`) — 줄마다 `` `코드` 설명``, 팝업이 코드(고정폭)와 설명을 나눠 그린다(`examples`). 긴 코드는 넣지 않는다 |
| 탭(뜻·예제·자세히·쓰이는 곳) | 긴 내용을 탭으로 나눠 팝업을 작게 | ❌ SONUB 팝업은 짧다 — 탭 대신 위에서 아래로 쌓는다. 내용이 탭이 필요할 만큼 길면 내용을 줄인다 |
| 중첩 팝업 | 팝업 안의 용어·링크에서 또 팝업(stack, 깊이별 z-index) | ❌ **갈아타기**만 — 음성 세션(스피커·마이크)이 팝업 하나에 묶여 있어 겹치면 누가 말하는지 꼬인다 |
| 열기 지연 | 용어 150ms, 링크 380ms / 닫기 280ms | ✅ 링크(메뉴)만 400ms 지연 — 메뉴를 훑고 지나가는 마우스로 열리지 않게. 용어는 지금처럼 바로 열고 닫기 160ms |
| 누르면 고정 | `pin()` — 바깥 누르기·Esc 로 닫기, Esc 는 맨 위 하나만 | ✅ 이미 있음 |
| 좁은 화면 | ≤ 640px 에서 위치 계산을 건너뛰고 CSS 가 아래쪽 시트로 | ✅ `place()` 가 시트 모드로(`data-side='sheet'`) |
| 링크 미리보기 | `a[data-pv]` — 데스크톱은 호버 미리보기·클릭 이동, 휴대폰은 첫 탭 미리보기 | ✅ 누르면 할 일이 따로 있는 요소(`[data-term]` — 메뉴 링크·단원 카드·예제 단추) — 호버만. 휴대폰은 **첫 탭에도 원래 할 일**(탭이 두 번 필요하면 길을 잃는다). 휴대폰·키보드는 곁의 물음표(`<x-glossary.info>`)로 |
| 밑줄 모드 | 처음 두 번 / 전부 / 끔(localStorage) | ❌ SONUB 은 컴포넌트마다 첫 등장만(`once`) |
| 팝업 안 본문에도 용어 | `apply(body, {exclude: 자기, all: true})` | ❌ 대신 `related` 칩 — 팝업 글을 짧게 두고 다음 용어는 칩으로 |
| 스크롤 추적 | 스크롤·리사이즈마다 자리 다시 잡기, 화면 밖으로 나간 고정 안 된 팝업 닫기 | ✅ 이미 있음(`place()`) |
| 키보드 | 초점 간 용어에서 Enter·Space | ✅ 이미 있음(단추라 저절로) |

## SONUB 팝업의 원칙

1. **위에서 아래로 한 번에 읽힌다** — 표기·분류 → 한 줄 뜻(굵게) → 설명 → 쉽게 말하면 → 예시 → 관련 용어 → 음성·더 배우기. 어디서 멈춰도 그때까지가 쓸모 있다.
2. **색 상자는 역할이 다를 때만** — "쉽게 말하면"(강조색 옅은 바탕, 시작 쪽 굵은 선)과 "예시"(낮은 바탕)만 상자다. 나머지는 여백으로 나눈다.
3. **글 크기** — 본문 0.88rem · 줄 간격 1.6, 한 줄 뜻 0.92rem 굵게. 너비 최대 22rem(좁은 화면은 전체 폭 시트). 높이는 화면의 70% 를 넘으면 안에서 스크롤.
4. **디자인은 CSS 로** — Blade 틀에는 구조와 뜻을 담은 class 만. 색·간격은 Web Awesome 토큰(`--wa-color-*`·`--wa-space-*`), 방향은 논리 속성(AGENTS.md "CSS").
5. **팝업은 화면에 하나** — 모든 트리거가 같은 팝업을 쓴다. 관련 용어 칩은 그 팝업 안에서 갈아탄다.

## 트리거

| 트리거 | 마크업 | 열기 | 누르기 |
| --- | --- | --- | --- |
| 본문 용어 ✅ | `<x-glossary.text :text="…" scope="…" group="…" />` → `<button class="glossary-term" data-term="id" title="short">` | 마우스 올리기·포커스 | 고정/닫기 |
| 물음표 단추 ✅ | `<x-glossary.info id="…" />` → `<button class="glossary-term glossary-info" data-term data-term-label>` | 마우스 올리기·포커스 | 고정/닫기 |
| 할 일 있는 요소 ✅ | 메뉴 링크·카드·예제 단추에 `data-term="…" data-term-label="표기"` | 마우스만, 400ms 머문 뒤 | **원래 할 일**(이동·실행), 팝업은 닫는다 |
| 문장·개념 ✅ | `<x-glossary.term id="concept-id">구절</x-glossary.term>` → 같은 단추 + `data-kind="phrase"`·`data-term-label` | 마우스 올리기·포커스 | 고정/닫기 |
| 메인 메뉴·메가 메뉴·전체 메뉴 서랍 | 용어 팝업 제외(SSOT 11절 "메가 메뉴"). 링크는 이동, 그룹 제목은 일반 글자 | 팝업 없음 | 이동 |

코드는 current.md("컴포넌트"·"팝업 동작"). 쓰는 곳의 예는 쉘 화면(current.md "쉘 화면에 붙인 방법").

### 문장·개념 — `<x-glossary.term>` ✅

자동으로 찾으면 안 되는 항목(`'match' => false`)을 그 구절에 명시로 붙인다. 활용형·중의어처럼 자동 매칭이 못 잡는 용어에도 쓴다(예: `<x-glossary.term id="token">토큰화</x-glossary.term>`). 코드·쓰는 법은 current.md "컴포넌트".

- `resources/views/components/glossary/term.blade.php` — `@php echo` 로 단추를 바로 내보낸다(앞뒤 공백 없음). 단추는 `.glossary-term` + `data-kind="phrase"` + `data-term-label`(표기) + `title`(한 줄 뜻). 없는 id 면 글만.
- 자원은 `assets.blade.php` 의 `@once` 자리 하나라 `<x-glossary.text>`·`<x-glossary.info>` 와 섞여도 한 번만 실린다.
- `'match' => false` 항목은 `Glossary::wordIds()` 가 빼므로 `matcher()` 가 본문에서 찾지 않는다.
- CSS `.glossary-term[data-kind='phrase']` 가 밑줄을 옅게(브랜드색 35%) 한다 — 문장 전체에 진한 밑줄이 그어지지 않게.

### 할 일 있는 요소 — `[data-term]` ✅

`glossary.js` 의 `ACTION = '[data-term]:not(.glossary-term):not(.glossary-pop-chip)'` 이 받는다. 마우스로만 400ms 뒤 열고, 누르면 팝업을 닫고 원래 할 일을 둔다. 링크·카드에는 `aria-expanded` 를 달지 않는다(팝업을 여는 단추가 아니다).

- **`data-term-label` 을 꼭 단다** — 없으면 뜻을 받기 전 제목으로 요소의 글자 전체(카드 제목·설명·단추 글)가 잠깐 보인다.
- **휴대폰·키보드는 곁의 물음표로** — `<x-glossary.info>` 를 요소 곁에(안이 아니라) 둔다. 쉘 예제는 `.snippet-list` 를 2칸 격자로 두어 [예제][?] 가 한 줄이다.
- 메뉴 partial(레이아웃이 그리는 곳)은 자원을 `@push` 로 못 싣는다 → [레이아웃 전역 싣기](#레이아웃-전역-싣기-).

## 팝업 틀 ✅

지금 틀은 `resources/views/components/glossary/assets.blade.php`(current.md "팝업 틀"). 리엔 음성 요소(✅ 2026-10-21 — 상태·함수는 voice.md):

- `x-data="glossaryPop(뜻 API 주소, GlossaryVoice::clientConfig())"` · `x-bind:data-voice="voice.phase"` — CSS 가 상태별로 칠한다.
- 머리 — 닫기 앞의 스피커 `.glossary-pop-speaker`(`aria-pressed` = 음성 켬). **`<template x-if="voice.speakable">`** 로 둔다(x-show 가 아니다): 소리 내지 못하는 언어에서는 요소가 없어야 닫기 단추가 `margin-inline-start: auto` 로 끝에 붙는다(`.glossary-pop-speaker + .glossary-pop-close` 는 간격만).
- 끝 — 자막 `.glossary-pop-caption`(질문·답) · 발 `.glossary-pop-foot`(마이크 `.glossary-pop-mic` + 상태 `.glossary-pop-status` `role="status" aria-live="polite"`). 발은 마이크가 있거나 상태 글이 있을 때만 보인다.

## CSS ✅

지금 CSS 는 `public/css/pages/glossary.css`(current.md "CSS"). 리엔 음성은 그 파일의 "리엔 음성" 절(✅ 2026-10-21): 스피커(눌림 = 옅은 브랜드 바탕), 자막(시작 쪽 선), 발(마이크 알약·상태 줄), **소리가 나지 않은 상태**(`blocked`·`login`·`limit`·`siteLimit`·`exam`·`noSpeech`·`micDenied`·`error`)의 상태 줄은 경고색 `--wa-color-warning-on-quiet`, 듣는 중 마이크 깜빡임(움직임 줄이기면 멈춤). 문장·개념 단추의 옅은 밑줄(`.glossary-term[data-kind='phrase']`)은 단추 절에 있다.

위 토큰은 모두 `public/vendor/webawesome` 에 있다(2026-09-27 확인). 새 토큰을 쓸 때는 `grep -rl -- '--토큰이름:' public/vendor/webawesome` 로 먼저 확인한다.

## 동작 규칙

| 규칙 | 이유 |
| --- | --- |
| 팝업은 하나, 관련 용어는 갈아타기 | 음성 세션이 팝업 하나에 묶인다. 갈아타면 앞 용어의 음성을 멈춘다 |
| 마우스로 연 팝업은 단추·팝업을 벗어나면 160ms 뒤 닫는다 | 단추에서 팝업으로 옮기는 사이에 닫히면 칩·버튼을 못 누른다 |
| **리엔이 말하거나 듣는 중에는 마우스가 벗어나도 닫지 않는다** | 설명 도중 사라지면 무엇이 끊겼는지 모른다(이전 사이트 규칙) — `leave()` 가 음성 상태를 본다 |
| 명시적 닫기(×·Esc·바깥 누르기·다른 용어 누르기)는 음성도 멈춘다 | 팝업이 사라졌는데 리엔만 계속 말하면 안 된다 |
| 누르면 고정, 고정된 팝업은 지나가는 마우스에 빼앗기지 않는다 | 읽는 도중 다른 용어 위를 지나가도 바뀌지 않게 |
| Esc 는 닫고 단추로 포커스를 돌려준다(돌려준 포커스로 다시 열지 않는다) | 키보드 사용자가 제자리로 돌아온다 |
| 뜻을 받기 전에도 표기·한 줄 요약을 먼저 보인다 | 빈 팝업은 고장처럼 보인다 |
| **팝업은 용어를 덮지 않는다** — 아래(먼저)·위 어디에도 다 들어가지 않으면 넓은 쪽에 두고 남은 높이(`--glossary-pop-room`, `place()` 가 넣음)까지만, 안에서 스크롤 | 화면 가운데쯤의 용어에 긴 팝업이 뜨면 화면 안으로 밀려 올라와 용어를 덮었다 — 다시 누를 수 없고, 그 자리에서 시작한 드래그가 팝업 글을 골랐다(2026-10-26) |
| 늦게 온 응답은 버린다(`ticket`) | 빠르게 여러 용어를 지나가면 앞 용어의 뜻이 뒤 팝업을 덮는다 |
| **용어 글자도 드래그로 선택·복사된다**(SSOT 23절 "용어 글자 복사", 2026-10-26) — `.glossary-term` 에 `user-select: text`, 마우스 단추를 누른 채 지나가면(`event.buttons`) 열지 않고, 드래그 선택이 시작되면(`getSelection()` 이 비지 않음, 팝업 안 선택은 빼고) 닫는다, 용어 글자를 끌어 고르고 놓은 것은 누르기로 치지 않는다 | 용어는 `<button>` 이고 Web Awesome `native.css` 가 모든 `button` 에 `user-select: none` 을 건다 — 없으면 「Learn  in nine steps」처럼 용어만 빠져 복사된다. 드래그 중 팝업이 열리면 아랫줄을 덮어 드래그가 팝업 글을 고른다. 새 용어 마크업을 `<button>` 으로 만들면 이 class 를 꼭 쓴다 |

## 레이아웃 전역 싣기 ✅

메뉴 팝업처럼 레이아웃 partial 이 트리거를 그리면 컴포넌트의 `@push` 가 닿지 않는다. 그래서 **메인 레이아웃이 모든 화면에 싣는다**(2026-10-21):

```blade
{{-- resources/views/layouts/main.blade.php 의 <head> — @push('head') 는 @stack 보다 먼저 실행되어야 하므로 반드시 @stack('head') 앞 --}}
@include('components.glossary.assets')
@stack('head')
```

- 같은 `@once` 자리라 본문의 컴포넌트가 또 불러도 한 번이다. `GlossaryTest` 는 "본문에 용어가 없는 화면에도 한 번"을 본다(전에는 "안 쓰는 화면엔 없음" — 설계가 바뀌었다).
- 서브도메인 레이아웃(teacher·student·school)·`layouts/vibe` 는 아직 전역으로 싣지 않는다. 그 레이아웃의 partial 에 팝업을 달려면 같은 줄을 그 레이아웃의 `@stack('head')` 앞에 둔다.
- 메인 메뉴·메가 메뉴·전체 메뉴 서랍에는 `data-term`·`data-term-label`·`x-glossary.*`를 붙이지 않는다. 코딩 에이전트 등 그룹 제목은 일반 글자로만 그린다. 메뉴 탐색을 가리는 팝업을 없애라는 사용자 지시다(SSOT 11절 "메가 메뉴"). 본문 용어와 안내 팝업은 유지한다.
- 시험 응시 화면처럼 팝업이 방해되는 곳이 생기면 `data-no-glossary` 같은 표시로 트리거를 무시하게 한다 — 필요할 때만.

## 접근성 · RTL

- 트리거는 `<button>`(본문·문장) — 키보드로 닿고 Enter·Space 로 연다. 메뉴는 원래 링크.
- `aria-haspopup="dialog"`·`aria-expanded`·`aria-controls` 를 단추에, 팝업은 `role="dialog" tabindex="-1"`.
- 음성 상태는 `role="status" aria-live="polite"` — 화면을 못 보는 사용자도 "듣고 있어요"를 안다. 스피커는 `aria-pressed`.
- 색만으로 알리지 않는다 — 점선 밑줄 + 작은 물음표(`<i class="fa-solid fa-circle-question">` 클래스 방식).
- 논리 속성만(`margin-inline-start`·`border-inline-start`·`inset-inline`). ar·ur 에서 화살표 아이콘은 `[dir='rtl'] … { transform: scaleX(-1) }`.
- `prefers-reduced-motion` 이면 반짝임·강조 애니메이션을 끈다.

## 실제로 깨졌던 것들

이전 사이트(v1) 와 main 이식 때 실제로 있었던 것:

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| Esc 를 눌러도 안 닫힘 | 닫은 뒤 단추에 포커스를 돌려주자 포커스 핸들러가 다시 열었다 | 1회용 차단 플래그(`skipFocus`) |
| 물음표가 두부(□) | CSS `content: '\f059'` + 틀린 폰트 이름 | `<i class="fa-solid fa-circle-question">` 클래스 방식 |
| 목록 글자가 가운데로 몰림 | `display:grid` 가 상위의 `justify-items` 를 이어받음 | `display:flex` + `align-items:flex-start` |
| 문장부호가 떨어짐('용어 .') | Blade `{!! !!}` 가 뒤 줄바꿈을 남김 | 컴포넌트가 `@php echo` 로 바로 내보낸다 |
| 좁은 RTL 화면에서 팝업이 엇나감 | 옆으로 넘친 페이지에서 `fixed` 기준과 `getBoundingClientRect` 기준이 다름 | 놓인 자리를 다시 재서 차이만큼 옮긴다(`place()`) |
| 팝업은 뜨는데 칩·Esc 가 먹통(v1 Svelte) | 반응형 효과가 자기가 쓴 상태를 다시 읽음 | Alpine 에서는 DOM 요소·타이머를 반응형 데이터에 넣지 않는다 |

## 테스트

`tests/Feature/GlossaryTest.php` 에 더한다.

- ✅ `<x-glossary.term>` — 단추 모양(`data-term`·`data-kind="phrase"`·`data-term-label`·`title`)과 앞뒤 공백 없음, 없는 id 면 글만(슬롯 이스케이프 유지), 자원을 한 번만 싣기(세 컴포넌트를 섞어도).
- ✅ `'match' => false` 항목은 `segments()` 가 본문에서 찾지 않는다("never finds a menu entry inside a sentence").
- ✅ 메인 메뉴·전체 메뉴 서랍 — 옛 `term`·`group_term` 설정이 있어도 팝업 트리거가 없다. 본문 팝업 자원은 여전히 한 번 실린다.
- `entry()` 의 `categoryLabel` 이 그 언어 번역이다.
- 화면 동작(호버·고정·Esc·시트)은 Pest 로 못 본다 — 브라우저로 확인하고 보고한다(../sonub.md "검증").
