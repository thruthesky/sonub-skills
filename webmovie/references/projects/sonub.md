# SONUB(sonub.com)에 webmovie 적용하기

> 먼저 [SONUB-SSOT.md](../../../../SONUB-SSOT.md) 11절(개발·배포 — "디자인"·"페이지 본문·재사용 절대 규칙"·빌드 단계·외부 CDN 금지)을 읽는다. SSOT 가 이 문서보다 앞선다.
> 🛑 화면 디자인 작업이므로 **sonub-design 스킬**(`.claude/skills/sonub-design/SKILL.md` "필수 동반 스킬")과 popup·infographics·linkify·sonub-seo 스킬을 반드시 같이 쓴다(SSOT 11절 "디자인", 2026-10-26). 움직임은 그 디자인 위에 얹는 마지막 겹이다.

## 목차

- [현재 상태](#현재-상태)
- [넣을 곳](#넣을-곳)
- [위젯에서 쓰기](#위젯에서-쓰기)
- [번역 — 17개 언어](#번역--17개-언어)
- [테마 — 기본·다크·핑크](#테마--기본다크핑크)
- [SONUB 규칙과 맞추기](#sonub-규칙과-맞추기)
- [테스트와 확인](#테스트와-확인)

## 현재 상태

- 2026-10-25: 스킬 원본은 `skills/webmovie/`, 사이트 사본은 `public/js/webmovie.js` · `public/css/webmovie.css`(바이트가 같은지 `GuidePagesTest` 가 확인). 처음 쓰는 화면은 가이드 허브 `/guide`(`x-widget.guide.hub` 가 `@pushOnce('head', 'sonub-webmovie')` 로 싣는다). 다른 위젯도 **같은 키 `sonub-webmovie`** 로 같은 두 줄을 넣어 한 번만 실리게 한다. 키트를 고치면 `cp` 로 사본도 같게 한다.
- 그림 무비([../picture.md](../picture.md))의 예: `/guide` 갈림길 그림(`x-widget.guide.fork`). 바탕판 · 조각은 `public/images/learn/guide/movie/`(Codex CLI `image_gen` — 이미지 픽셀은 Codex 로만, 프롬프트 `plate.prompt.txt` · `sprites.prompt.txt` 동봉), 아틀라스 원본은 `docs/infographics/guide/movie/sprites-source.png`(공개 폴더 밖). 연출은 강하게(2026-10-25 「너무 소극적」 — [../acting.md](../acting.md)): 카메라 `dolly`(`--webmovie-focus` 소년) · 안쪽 `.webmovie-rig` `shake`(첫 화살표가 닿을 때) · 화살표 `unfold` + 불꽃(`--webmovie-burst` = 화살표 색) · 점 `ping` + 불꽃 · 이름표 `blast` → 차례 강조(`data-webmovie-spotlight="ripple glow"`, 이름표 `data-webmovie-cue` + `-cue-with` 점 · 카드 단추, 두 바퀴 — [../acting.md](../acting.md#spotlight--take-turns)). 요령 목록도 `ripple` 차례 강조. 조각 자리 · 띠 자르기 · 불꽃 색은 `public/css/pages/guide-overview.css`, 시간은 마크업의 `data-webmovie-delay`, [다시 보기]는 공통 부품 `x-ui.webmovie-replay`(아래 「다시 보기 단추」).
- 사이트에 이미 있는 움직임(겹치지 않게): 메인 광고 디자인의 빛·입체 전환(SSOT 11절 "디자인" — 움직임 줄이기·데이터 절약 설정 존중), okayteacher.com 첫 화면 슬라이드(`wa-carousel`), 인포그래픽 선(`public/js/ig-lines.js`), 단원 링크 빛남(`linkify`). 이들을 webmovie 로 바꾸라는 요청이 없으면 그대로 둔다.
- **다시 보기 단추**(SSOT 11절 "webmovie 다시 보기", 2026-10-28): `<button data-webmovie-replay>` 를 직접 쓰지 않고 `<x-ui.webmovie-replay class="자리-class" />`(다른 무비면 `target="무비 id"`)만 쓴다. 되감기 아이콘 하나, 강조 없이 흐리게 — 글(`guide.hub_replay`)은 `aria-label`·`title` 로만. 모양은 `public/css/webmovie-replay.css` 한 곳, 페이지 CSS 는 position·inset·color 같은 자리만. `WebmovieReplayTest` 가 확인한다.

## 넣을 곳

1. 키트를 그대로 복사한다(빌드·CDN 금지 — SSOT 11절). 사이트 사본은 스킬 원본과 **바이트가 같아야** 한다(LinkifyTest 처럼 테스트로 비교한다).
   ```bash
   cp skills/webmovie/assets/webmovie.js public/js/webmovie.js
   cp skills/webmovie/assets/webmovie.css public/css/webmovie.css
   ```
2. **`<head>` 에서 `defer` 없이** 싣는다 — 첫 줄이 `html.webmovie-js` 를 붙여야 글자가 한 번 보였다 사라지는 깜빡임이 없다. 키트는 작고(≈ 25KB, gzip 전) 다른 스크립트를 기다리지 않는다.
   - 사이트 전체에서 쓰게 되면: 메인 `layouts/main.blade.php` 와 서브도메인 `sites/head.blade.php` 의 `@stack('head')` 앞에
     ```blade
     <link rel="stylesheet" href="{{ asset_v('/css/webmovie.css') }}">
     <script src="{{ asset_v('/js/webmovie.js') }}"></script>
     ```
   - 몇 화면만 쓰면: 그 위젯에서 `@pushOnce('head')` 로 같은 두 줄을 넣는다(`@stack('head')` 가 `<head>` 안이다). 여러 위젯이 불러도 한 번만 실린다.
3. 공개 화면은 Cloudflare 캐시(`routes/public.php`)지만 키트는 브라우저에서만 돌아 캐시와 상관없다. HTML 에 최종 글과 숫자가 들어 있으므로 캐시된 HTML 그대로 SEO 가 된다.

## 위젯에서 쓰기

페이지 본문은 위젯(`resources/views/components/widget/`)으로 만든다(SSOT 11절 "페이지 본문·재사용 절대 규칙"). 움직임은 위젯 마크업의 `data-webmovie` 속성과 위젯 CSS(`public/css/pages/<섹션>.css`)의 변수로만 준다.

```blade
{{-- resources/views/components/widget/home/movie.blade.php --}}
@props(['scenes'])
@pushOnce('head')
    <link rel="stylesheet" href="{{ asset_v('/css/webmovie.css') }}">
    <script src="{{ asset_v('/js/webmovie.js') }}"></script>
@endPushOnce
<section class="home-movie" data-webmovie-player aria-label="{{ __('home.movie_label') }}"
         data-label-play="{{ __('webmovie.play') }}" data-label-pause="{{ __('webmovie.pause') }}"
         data-label-replay="{{ __('webmovie.replay') }}" data-label-scene="{{ __('webmovie.scene') }}">
    @foreach ($scenes as $scene)
        <section class="webmovie-scene">
            <h2 id="{{ $scene['id'] }}" data-webmovie="{{ $scene['effect'] }}">{{ __($scene['title']) }}</h2>
            <p data-webmovie="words">{{ __($scene['body']) }}</p>
        </section>
    @endforeach
</section>
```

- 숫자: 서버가 형식을 맞춘 값을 넣는다 — `<data value="{{ $n }}" data-webmovie="count">{{ \Illuminate\Support\Number::format($n, locale: app()->getLocale()) }}</data>`.
- 막대·원: `style="--pct: {{ $pct }}"` 는 허용되는 유일한 `style=""`(값 변수 `--pct`, SSOT 11절 CSS 규칙). 색·크기는 CSS 에서.
- Alpine 이 나중에 그린 요소(`x-if`, `x-for`)는 키트의 MutationObserver 가 알아서 준비한다. Alpine `<template>` 안에만 있는 글은 서버 HTML 에 없으므로 SEO 가 필요한 글은 템플릿 밖에 둔다(sonub-seo 스킬).
- 제목에는 번역과 상관없는 고정 ASCII `id` 를 단다(linkify). 무비 진행 막대 단추의 이름은 각 장면 제목에서 자동으로 만든다.
- 페이지 안 탭(`x-ui.page-tabs`)의 숨은 탭 안 요소는 보일 때(탭을 열 때) 재생된다 — IntersectionObserver 가 보이는 순간을 잡는다.

## 번역 — 17개 언어

- 화면 글은 모두 `lang/{17개}/*.php` 에서 온다. 애니메이션 속성에는 글을 넣지 않는다 — 예외는 무비 단추 이름(`data-label-*`)이고, 이것도 언어 파일에서 넣는다. 처음 쓸 때 `lang/*/webmovie.php` 에 `play`·`pause`·`replay`·`scene` 네 키를 17개 언어로 만든다.
- 키트가 언어별로 알아서 하는 것: 아랍어·우르두어는 글자 효과를 낱말 효과로 바꾸고(글자 이음 보존) RTL 방향으로 뒤집는다. 일본어·중국어·한국어는 원래 줄바꿈을 지킨다. 번역이 길어도 전체 시간은 같다.
- 한국어는 SONUB 에서 어절 단위 줄바꿈(`word-break: keep-all`)을 쓰는 곳이 있다 — 그 요소에서는 키트도 어절 단위로 나눠 줄이 튀지 않는다.
- 확인은 가장 긴 언어(de·ru), 한중일(ko·ja·zh), RTL(ar·ur)로 한다(`/ar/…` 주소).

## 테마 — 기본·다크·핑크

- 키트의 색은 `currentColor`·반투명 회색만 쓴다. 강조색은 위젯 CSS 에서 Web Awesome 토큰으로 준다:
  ```css
  .home-movie { --webmovie-mark: color-mix(in oklab, var(--wa-color-brand-fill-loud) 35%, transparent);
                --webmovie-pie: var(--wa-color-brand-fill-loud); --webmovie-c1: var(--wa-color-brand-fill-loud); }
  .home-movie .webmovie-controls { color: var(--wa-color-brand-fill-loud); }
  ```
- 세 테마(`data-sonub-theme`, 다크는 `html.wa-dark`)에서 멈춘 장면 대비를 본다 — `shine`·`webmovie-gradient-text` 는 다크에서 글자색이 바뀌므로 꼭 본다.

## SONUB 규칙과 맞추기

| SONUB 규칙 | webmovie 에서 |
| --- | --- |
| 빌드·외부 CDN 금지 | 키트 두 파일을 `public/` 에 복사, 라이브러리 없음 |
| `style=""`·`<style>` 금지(값 변수 `--pct` 만) | 프리셋 조정은 `public/css/` 의 위젯 CSS 에서 `--webmovie-*` 변수로 |
| 논리 속성·RTL | 키트가 `dir` 을 보고 가로 움직임을 뒤집는다, 위젯 CSS 도 `inline-start` |
| 본문은 위젯, 한 곳에서 정의 | 같은 움직임 묶음은 위젯 하나로(예: `x-widget.home.movie`), 페이지마다 복사하지 않는다 |
| 움직임 줄이기·데이터 절약 존중 | 움직임 줄이기는 키트가 처리, 데이터 절약(`prefers-reduced-data`)이면 무비의 큰 배경 그림을 싣지 않는다 |
| 이미지는 Codex CLI | 장면 배경·사진은 Codex `image_gen` 으로 만들고 글자는 넣지 않는다 — 글은 HTML 로 위에 얹는다 |

## 테스트와 확인

- 키트를 사이트에 넣으면 Pest 테스트를 만든다(`tests/Feature/WebmovieTest.php`): 사이트 사본과 스킬 원본의 바이트 비교, 그 화면 HTML 에 최종 글·숫자가 들어 있는지(`<data value=…>`), 레이아웃이 `<head>` 에서 `defer` 없이 싣는지.
- 브라우저 확인: `node skills/webmovie/scripts/check.mjs https://sonub.localhost:7843/<주소> --times 0.2,0.6,4` 그리고 `--width 390`, `/ar/<주소>`. 오류(✗) 0 이어야 하고, 프레임 그림을 열어 본다.
- 내부 스크롤 화면: `/vibe-coding`은 `--selector .vibe-intro --scroll .vibe-intro`로 검사한다. 창 대신 실제 내용 스크롤 상자를 끝까지 움직여야 화면 아래 연출도 검사된다.
- 공용 레이아웃을 고쳤으면 `LayoutTest`·`MenuPagesTest` 도 돌린다(AGENTS.md "작업 흐름").
