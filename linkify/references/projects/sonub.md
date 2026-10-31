# SONUB(sonub.com)에 linkify 적용하기

> 먼저 [SONUB-SSOT.md](../../../../SONUB-SSOT.md) 11절(개발·배포 — 디자인·페이지 본문·재사용 규칙)과 23절(교재 주소)을 읽는다. SSOT 가 이 문서보다 앞선다.
> 사이트 전체에 새 동작을 넣는 일이므로 **SSOT 11절에 규정을 먼저 적고**(예: "단원 링크 복사") 그다음 코드를 고친다.

> 🛑 **화면 디자인 작업이면** sonub-design 스킬(`.claude/skills/sonub-design/SKILL.md` "필수 동반 스킬")과 popup·infographics·sonub-seo·webmovie 스킬을 반드시 같이 쓴다(SSOT 11절 "디자인", 2026-10-23·10-26). 새 위젯을 짤 때 고정 id 를 같이 넣는다.

## 목차

- [현재 상태](#현재-상태)
- [넣을 곳 — 파일과 레이아웃](#넣을-곳)
- [번역 — 17개 언어](#번역)
- [테마 — 기본·다크·핑크](#테마)
- [고정 id — 번역 제목은 반드시](#고정-id)
- [해시를 이미 쓰는 화면 — 반드시 같이 고칠 것](#해시를-이미-쓰는-화면)
- [숨은 내용 — 탭·단계·접기](#숨은-내용)
- [테스트와 확인](#테스트와-확인)

## 현재 상태

- 2026-10-23 **사이트에 넣었다** — 레이아웃은 `partials/linkify.blade.php` 하나를 메인(`layouts/main`)·서브도메인(`sites/head`)이 싣는다. 적용 화면 목록·자동 id 현황은 `docs/linkify-pages.md`(`node scripts/linkify-scan.mjs --md docs/linkify-pages.md` 가 만든다), 테스트 `tests/Feature/LinkifyTest.php`.
- 본문 제목에는 사이트 기본 여백 `.sonub-page :where(h1~h4) { scroll-margin }`(content.css)이 먼저 걸린다 — linkify.css 의 `:where([data-linkified])` 보다 앞선다. 값은 막대의 실제 높이 `--linkify-offset` 을 따른다(휴대폰 막대는 136px). 화면이 `html { scroll-padding }` 을 따로 두면(`/shell`) 그 화면 CSS 에서 링크 단원 여백을 간격만으로 줄인다(`shell.css`).
- 사이트에 이미 있는 해시·스크롤 코드(이것들과 겹치지 않게 넣는다):

| 파일 | 하는 일 | linkify 와의 관계 |
| --- | --- | --- |
| `public/js/course-chapters.js` | `/learn/ai#<챕터 슬러그>` — 해시가 챕터 id 면 그 챕터만 보이고, **모르는 해시면 목차**를 보인다(SSOT 23절 "교재 주소") | 챕터 안 소제목 링크(`#tokens-why`)가 목차로 떨어진다 → 아래 ① |
| `public/js/pages/chapter-navigation.js` | 상단 막대 실제 높이를 `--sonub-header-height` 로 두고, 해시로 연 직후 늦게 커진 메뉴 때문에 밀리지 않게 **다시 맞춘다**(`courseNavigation`·`documentAnchors`·`x-document-anchors`) | 챕터 화면에서는 "현재 챕터 맨 위"로, `data-anchor-container` 가 있으면 "그 상자"로 다시 맞춘다 → 소제목 링크가 챕터 맨 위로 끌려간다 → 아래 ② |
| `public/js/pages/guide.js` | `/guide` 어린이 과정 `#kids-lesson-N` 을 연다 | id 가 달라 겹치지 않는다 |
| `public/js/search-highlight.js` | 검색 결과 `?hl=` 이 있을 때만 낱말 강조. 해시가 있으면 그 요소 안을 먼저 찾는다. 숨은 탭·단계는 `data-search-reveal` → `search-reveal` 이벤트로 연다 | `?hl=` 없는 복사 링크에는 돌지 않는다. 숨은 내용 열기 장치를 **그대로 재사용**한다 → [숨은 내용](#숨은-내용) |
| `public/js/page-tabs.js` | 페이지 안 탭은 해시가 아니라 **주소 경로**(`/페이지/<탭>`)로 바뀐다(SSOT 11절 "페이지 안 탭") | 복사한 주소에 탭 경로가 들어 있어 그대로 열린다. 겹치지 않는다 |

## 넣을 곳

1. 키트를 복사한다(빌드·CDN 금지 — SSOT 11절). 스킬 원본과 같은 내용을 유지한다.
   ```bash
   cp skills/linkify/assets/linkify.js public/js/linkify.js
   cp skills/linkify/assets/linkify.css public/css/linkify.css
   ```
2. 본문이 있는 레이아웃 네 곳의 `<head>` 에 넣는다 — `asset_v()` 로 버전을 붙인다. Blade 에 `style=""` 를 쓰지 않는다.

| 레이아웃 | 본문(`data-root`) | 고정 막대(`data-header`) |
| --- | --- | --- |
| `resources/views/layouts/main.blade.php` (메인) | `main.content` | `.topbar` (sticky, 기본 80px = `--bar-height`) |
| `layouts/teacher.blade.php` · `student.blade.php` · `school.blade.php` (서브도메인) | `main.site-content` | `.site-bar` (`public/css/sites.css`, sticky) |

```blade
<link rel="stylesheet" href="{{ asset_v('/css/linkify.css') }}">
<script defer src="{{ asset_v('/js/linkify.js') }}"
        data-root="main.content" data-header=".topbar"
        data-skip="nav, dialog, wa-dialog, aside, footer, .course-toc, [data-linkify-skip]"
        data-reveal-attr="data-search-reveal" data-reveal-event="search-reveal"
        data-label-copy="{{ __('linkify.copy') }}" data-label-copied="{{ __('linkify.copied') }}" data-label-failed="{{ __('linkify.failed') }}"></script>
```

- `data-skip` 에서 기본값의 `header` 를 뺀다 — SONUB 위젯은 카드·절 머리에 `<header>` 안 `<h2>`·`<h3>` 를 쓰는 곳이 있어 기본값이면 그 제목이 빠진다. 넣은 뒤 화면마다 링크가 붙은 제목을 본다(`check.mjs` 의 sections 목록).
- 메인 사이드바(리엔 챗봇·공지)와 퀵메뉴 사이드바는 `main.content` 밖이라 저절로 빠진다. 수업(LMS)·`classroom`·`vibe` 레이아웃에는 넣지 않는다(본문이 문서가 아니다).
- 공개 화면은 Cloudflare 캐시(`routes/public.php`)지만 linkify 는 브라우저에서만 돌아 서버·캐시와 상관없다.

## 번역

새 파일 `lang/{17개 언어}/linkify.php` — 키 순서·자리표시자는 en 과 같게(`config/locales.php`, SONUB-DEV-GUIDE.md "다국어 번역"). `{title}` 은 linkify.js 가 바꾸는 자리라 Laravel 자리표시자(`:title`)로 쓰지 않는다.

```php
// lang/ko/linkify.php
return [
    'copy' => '“{title}” 링크 복사',
    'copied' => '링크를 복사했어요',
    'failed' => '복사하지 못했어요 — 주소창에 링크가 있어요',
];
```

## 테마

`public/css/linkify.css` 는 키트 그대로 두고, 색은 SONUB 토큰으로 `public/css/content.css` 에 한 번 정한다(sonub-design 스킬 "토큰 세 겹" — 기본·다크·핑크가 저절로 따라온다).

```css
:root {
	--linkify-accent: var(--wa-color-brand-fill-loud);
	--linkify-muted: var(--wa-color-text-quiet);
	--linkify-toast-bg: var(--wa-color-neutral-fill-loud);
	--linkify-toast-fg: var(--wa-color-neutral-on-loud);
}
```

토큰 이름은 `public/css/theme.css` 에 있는지 확인하고 쓴다. 세 테마와 `/ar/…`(RTL)·좁은 화면에서 버튼·알림을 본다.

## 고정 id

SONUB 제목은 거의 모두 번역(`{{ __('…') }}`)이다. 글자로 만든 id 는 언어마다 다르고(`/ko/…#설치` · `/en/…#install`) 한글 id 는 붙여 넣으면 `%EC%84%A4…` 로 길어진다. 그래서:

- 링크로 나눌 만한 절(챕터의 소단원·규정·FAQ·단계)의 제목에는 **바뀌지 않는 ASCII id** 를 마크업에 적는다. 값은 번역이 아니라 데이터의 키에서 온다:
  ```blade
  <h3 id="{{ $chapter['slug'] }}-{{ $section['key'] }}">{{ __($section['title']) }}</h3>
  ```
- 위젯(`resources/views/components/widget/`) 안에서 반복되는 제목은 `@props` 로 받은 키로 id 를 만든다. 같은 위젯이 한 페이지에 두 번 나오면 접두사를 받는다.
- 한 번 내보낸 id 는 바꾸지 않는다(채팅·문서에 붙여 넣은 링크가 깨진다). 꼭 바꿔야 하면 옛 id 를 빈 `<span id="옛-id"></span>` 로 남긴다.
- 점검: `python3 skills/linkify/scripts/linkify.py audit resources/views/components/widget/<섹션>` — `translated text — give a fixed id` 줄이 고정 id 를 줄 곳이다. 모든 제목에 줄 필요는 없다 — 링크할 만한 절만.

## 해시를 이미 쓰는 화면

**① `public/js/course-chapters.js`** — 해시가 챕터 id 가 아니면 그 요소가 든 챕터를 고르게 한다(지금은 목차로 간다).

```js
const current = () => {
	let hash;
	try { hash = decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
	if (chapters.has(hash)) return hash;
	// 챕터 안 소제목(linkify)으로 온 주소 — 그 소제목이 든 챕터를 연다
	return document.getElementById(hash)?.closest('[data-chapter]')?.dataset.chapter ?? hash;
};
```

`show(…, { move: true })` 가 챕터 맨 위로 옮긴 뒤 linkify 가 두 프레임 뒤 소제목으로 옮긴다. JS 없을 때의 CSS `:target` 대체는 챕터 id 에만 맞는다(그대로 둔다).

**② `public/js/pages/chapter-navigation.js`** — `update()` 의 다시 맞추기가 해시 요소 대신 "현재 챕터"(`course`)나 "`data-anchor-container` 상자"로 옮긴다. 해시 요소가 linkify 가 장식한 요소(`[data-linkified]`)면 **그 요소로** 맞추고, 아니면 지금 규칙을 그대로 둔다:

```js
let target;
try { target = document.getElementById(decodeURIComponent(anchorHash.slice(1))); } catch { return; }
if (!target?.matches('[data-linkified]')) {
	// 지금 규칙 그대로 — 챕터 화면은 현재 챕터, 아니면 해시 요소(data-anchor-container 가 있으면 그 상자)
}
```

같이 고친 뒤 `/learn/ai#<챕터>`·`/learn/ai#<챕터 안 소제목 id>`·`/guide` 어린이 과정 `#kids-lesson-2` 를 열어 모두 제자리(상단 막대 바로 아래)에 서는지 본다.

**③ linkify 자신** — 복사할 때는 `history.replaceState` 라 `hashchange` 가 나지 않는다 → 챕터가 바뀌지 않고 뒤로 가기 단계도 늘지 않는다(SSOT 23절 "뒤로 가기는 앞 챕터"와 맞다). 열 때는 linkify 가 장식한 id 만 다루므로 챕터 id·`kids-lesson-N` 은 원래 스크립트가 맡는다.

## 숨은 내용

- 숨은 탭·단계는 이미 `data-search-reveal="<값>"` 과 `search-reveal` 이벤트로 연다(`components/diagram/step-rail.blade.php`, `components/widget/game/topic.blade.php`, `public/js/pages/shell.js`). 위 스크립트 태그의 `data-reveal-attr`·`data-reveal-event` 로 linkify 가 **같은 장치를 쓴다** — 새 이벤트를 만들지 않는다.
- 새로 만드는 숨은 패널도 `data-search-reveal` 과 `x-on:search-reveal.stop="…($event.detail)"` 를 단다(검색과 링크가 함께 쓴다).
- `<details>` 는 저절로 열린다. `wa-details`(Web Awesome)는 `open` 속성을 직접 보지 않으므로, 그 안을 링크하려면 그 위젯에 `data-search-reveal` 과 이벤트 처리를 단다.

## 테스트와 확인

- Pest(`tests/Feature/LinkifyTest.php`):
  - 레이아웃 네 곳이 `linkify.js`·`linkify.css` 를 싣고 `data-label-*` 가 그 언어 문장인지(메인·서브도메인 각각 한 화면씩)
  - `public/js/linkify.js`·`public/css/linkify.css` 가 `skills/linkify/assets/` 와 **바이트까지 같은지**(복사본이 따로 놀지 않게)
  - `lang/*/linkify.php` 17개 언어의 키가 en 과 같은지
  - 고정 id 를 준 화면은 그 id 가 HTML 에 한 번만 있는지
- 공용 레이아웃을 고쳤으므로 `LayoutTest`·`MenuPagesTest` 도 돌린다(AGENTS.md "작업 흐름" 2).
- 브라우저: 로컬 `https://sonub.localhost:7843` 에서
  ```bash
  node skills/linkify/scripts/check.mjs https://sonub.localhost:7843/ko/learn/ai --widths 1280,390 --ids <챕터>,<챕터 안 소제목 id>
  node skills/linkify/scripts/check.mjs https://teacher.sonub.localhost:7843/<화면> --widths 1280,390
  ```
  `check.mjs` 는 자기 Chrome(로그인 안 한 손님)을 띄워 `*.localhost` 를 그대로 연다(인증서 오류 무시). 그래서 공개 화면으로 보고, 회원 전용 화면은 로그인된 브라우저(Claude in Chrome)로 직접 눌러 본다. 세 테마·`/ar/…`·좁은 화면 캡처를 보고 보고서에 적는다.
