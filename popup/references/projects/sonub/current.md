# 지금 있는 용어 팝업 (main, 2026-09-28)

이전 사이트(`v1` 브랜치의 SvelteKit `glossary` 스킬)의 용어 사전을 Laravel 로 옮기고, 쉘 화면(/shell)을 위해 넓힌 것이다.
음성(스피커·마이크)은 voice.md 가 정본이다(2026-10-21). 사전 밖 용어를 그 자리에서 찾는 기능은 아직 없다. 기존 동작을 건드리기 전에 이 문서를 읽고, 고친 뒤에는 이 문서의 코드를 실제 코드와 맞춘다.

## 목차

- [핵심 개념](#핵심-개념)
- [파일 지도](#파일-지도)
- [사전 — TERMS](#사전--terms)
- [공개 함수](#공개-함수)
- [본문 매칭 — segments · matcher](#본문-매칭--segments--matcher)
- [컴포넌트 — x-glossary.text · x-glossary.info](#컴포넌트--x-glossarytext--x-glossaryinfo)
- [팝업 틀 — assets](#팝업-틀--assets)
- [팝업 동작 — glossary.js](#팝업-동작--glossaryjs)
- [뜻 API · 용어 사전 창](#뜻-api--용어-사전-창)
- [CSS](#css)
- [쉘 화면에 붙인 방법](#쉘-화면에-붙인-방법)
- [테스트](#테스트)
- [알려진 한계](#알려진-한계)

## 핵심 개념

- **설명은 사전 한 곳에만 있다.** 구조는 PHP 상수 `Glossary::TERMS`, 사람이 읽는 문장은 `lang/{17개}/glossary.php` 의 `<id>_term`·`_short`·`_long`(필수)과 `_easy`·`_example`(선택, 한 언어에 있으면 17개 모두)·`_aliases`(그 언어만의 다른 표기, 언어마다 있어도 없어도 된다).
- **서버가 감싼다.** `<x-glossary.text>` 가 평문에서 지금 언어의 표기를 찾아 `<button class="glossary-term" data-term="id">` 로 감싼다. 공개 화면은 모두에게 같은 HTML 이라(Cloudflare 캐시) 서버에서 감싸도 된다.
- **팝업은 화면에 하나다.** 트리거마다 만들지 않고 문서에 건 이벤트 하나가 모든 트리거를 받는다. 관련 용어 칩은 팝업을 겹쳐 열지 않고 갈아탄다.
- **뜻은 열 때 받는다.** 트리거에는 표기(`data-term-label` 또는 글자)와 `title`(한 줄 요약)만 있고, 나머지는 `/api/glossary/{locale}/{id}` JSON 으로 받는다.
- **트리거는 다섯이다** — 본문 용어 단추(`.glossary-term`), 문장·개념 단추(`<x-glossary.term>` — `.glossary-term[data-kind='phrase']`), 물음표 단추(`<x-glossary.info>` — 역시 `.glossary-term`), 누르면 할 일이 따로 있는 요소(`[data-term]` 인데 `.glossary-term` 이 아닌 것 — 메뉴 링크·단원 카드·예제 단추, 마우스로만), 그리고 팝업 안의 관련 용어 칩.

## 파일 지도

| 역할 | 파일 |
| --- | --- |
| 사전 구조·매칭·뜻 조립 | `app/Content/Glossary.php` |
| 문장(17개 언어) + 팝업 문구·분류 이름(`cat_*`) | `lang/{언어}/glossary.php` |
| 평문 감싸기(scope·group) | `resources/views/components/glossary/text.blade.php` |
| 문장·개념·활용형을 명시로 감싸기 | `resources/views/components/glossary/term.blade.php` |
| 물음표 단추 | `resources/views/components/glossary/info.blade.php` |
| 팝업 자원(CSS·JS·틀, 한 번만) | `resources/views/components/glossary/assets.blade.php` — 메인 레이아웃(`layouts/main.blade.php`)이 `@stack('head')` 앞에서 모든 화면에 싣는다 |
| 팝업 동작(Alpine `glossaryPop`) · 리엔 음성 세션 | `public/js/glossary.js` — 음성은 voice.md |
| 리엔 음성(서버) | `routes/web/glossary.php` → `app/Http/Controllers/Glossary/VoiceController.php` → `app/Jobs/GenerateGlossarySpeech.php`(큐 llm) · `app/Lyen/SpeechText.php` · `app/Content/GlossaryVoice.php` · `config/glossary.php` |
| 팝업·단추 디자인 | `public/css/pages/glossary.css` |
| 뜻 JSON · 사전 창 목록(공개) | `routes/public/glossary.php` → `app/Http/Controllers/Glossary/TermController.php` · `IndexController.php` |
| 용어 사전 창(빠른 막대) | `resources/views/partials/glossary-panel.blade.php` · `public/js/quickbar.js`(`glossaryPanel`) · `public/css/quickbar.css` |
| 메뉴 탭(a[data-term]) | `resources/views/appdev/topic.blade.php` · `app/Content/AppDev.php` |
| 메인 메뉴(a[data-term]) | `config/menu.php` 의 서브메뉴 항목 `'term' => 'menu-…'` → `resources/views/partials/main-menu.blade.php` |
| 쉘 화면 | `resources/views/shell/**` · `app/Content/ShellCourse.php`(짝) · `lang/*/shell_advanced.php`(심화 설명·예제) · `public/css/pages/shell.css` |
| 테스트 | `tests/Feature/GlossaryTest.php` · `tests/Feature/GlossaryShellTest.php` |

## 사전 — TERMS

```php
/** 분류 순서. 화면 이름은 glossary.cat_<분류>. menu 는 메뉴·탭 링크의 설명(사전 창에는 없다). */
public const CATEGORIES = ['ai', 'data', 'dev', 'web', 'infra', 'shell', 'command', 'menu'];

private const TERMS = [
    // 모든 화면의 낱말
    'token' => ['category' => 'ai', 'aliases' => ['token'], 'related' => ['context-window', 'llm']],
    // 쉘 화면 전용 개념 — scope. 같은 표기면 이쪽이 이긴다('prompt' → 쉘 프롬프트)
    'shell-prompt' => ['category' => 'shell', 'scope' => 'shell', 'aliases' => ['prompt'], 'related' => ['terminal', 'shell-command', 'cmd-pwd']],
    // 대소문자까지 같아야 잡는 표기 — exact('PATH' 가 낱말 'path' 를 잡지 않게)
    'shell-env-var' => ['category' => 'shell', 'scope' => 'shell', 'aliases' => ['environment variable', 'environment variables'], 'exact' => ['PATH', '$PATH'], 'related' => […]],
    // 명령 — case(모든 표기를 대소문자까지 같을 때만: 'cat' ○ 'Cat' ×)
    'cmd-ls' => ['category' => 'command', 'scope' => 'shell', 'case' => true, 'related' => ['cmd-cd', 'shell-hidden-file', 'shell-option']],
    // 영어 낱말과 같은 명령 — auto => false(본문에서 찾지 않고 예제 단추·심화 주제에만 명시로)
    'cmd-for' => ['category' => 'command', 'scope' => 'shell', 'case' => true, 'auto' => false, 'related' => [...]],
    // 메뉴 안내 — match => false(본문에서 찾지 않고 사전 창에도 없다). id 는 menu- 로 시작(GlossaryTest 가 지킨다)
    'menu-shell-terminal' => ['category' => 'menu', 'match' => false, 'related' => [...], 'href' => '/shell?lesson=sh_terminal'],
];
```

| 값 | 뜻 |
| --- | --- |
| id | 소문자·하이픈, 번역 키 접미사(하이픈 → 밑줄). **바꾸지 않는다** |
| `category` | `CATEGORIES` 중 하나 — 팝업 머리의 칩(`cat_*`), 사전 창의 묶음 |
| `aliases` | 언어와 무관한 표기(약어·영문 원어·흔한 이표기) |
| `exact` | aliases 와 같되 대소문자까지 같아야 잡는 표기 |
| `related` | 등록된 id — 팝업 안 칩(갈아타기) |
| `href` | 더 배울 화면(언어 접두사 없이, 쿼리 가능). 라우트가 없으면 링크를 내리지 않는다 |
| `match` => false | 낱말이 아니라 화면 안내 — 본문 매칭·사전 창에서 빠진다(`wordIds()`) |
| `scope` | 그 화면이 `<x-glossary.text scope="…">` 로 감쌀 때만 본문에서 찾는다. 사전 창에는 나온다 |
| `auto` => false | 낱말(사전 창에 나온다)이지만 본문에서 저절로 찾지 않는다 |
| `case` => true | 이 항목의 모든 표기를 대소문자까지 같을 때만 잡는다 |

**등록 순서가 우선순위다** — 같은 층(모든 화면 / 같은 화면 전용)에서 같은 표기를 두 항목이 가지면 먼저 등록된 쪽이 잡힌다(`popup-check.php` 가 알린다).

## 공개 함수

| 함수 | 돌려주는 것 |
| --- | --- |
| `ids()` | 모든 id(메뉴 안내까지) |
| `wordIds()` | 낱말 id — `match` => false 를 뺀 것(사전 창 목록·매칭 후보) |
| `has($id)` · `term($id, $locale)` · `short($id, $locale)` | 등록 여부 · 표기(없으면 id) · 한 줄 요약 |
| `index($locale)` | 사전 창 목록 `[{id, category, term, short, search}]` |
| `entry($id, $locale)` | 팝업 JSON `{id, category, categoryLabel, term, short, long, easy, example, examples:[{code, note}], related:[{id, term}], href}` |
| `exampleLines($example)` | 예시를 줄로 — 줄 맨 앞의 `` `코드` `` 는 code, 나머지는 note |
| `surfaces($id, $locale)` | 본문에서 찾을 표기 — 표기, 괄호 앞부분, 그 언어의 `_aliases`, `aliases`, `exact` |
| `segments($text, $locale, $once, $exclude, $scope)` | 평문 → 조각 `[{text, term|null}]` |
| `html($text, $scope, $group, $exclude, $once)` | 평문 → 용어를 단추로 감싼 HTML(지금 언어, 오른쪽→왼쪽 격리 포함). `<x-glossary.text>` 와 PHP 에서 문장을 조립하는 곳(`Git::inline($text, $group)` — 백틱 코드 사이의 글)이 같이 쓴다. `group` 은 이 요청 안에서 같은 이름끼리 한 용어를 처음 한 번만 |

```php
public static function exampleLines(string $example): array
{
    $lines = [];
    foreach (preg_split('/\R/u', $example) ?: [] as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        $lines[] = preg_match('/^`([^`]+)`\s*(.*)$/u', $line, $m)
            ? ['code' => $m[1], 'note' => trim($m[2])]
            : ['code' => '', 'note' => $line];
    }

    return $lines;
}

public static function surfaces(string $id, string $locale): array
{
    if (! self::has($id)) {
        return [];
    }

    $label = self::text($id, 'term', $locale);
    $local = preg_split('/\s*[,，、]\s*/u', self::text($id, 'aliases', $locale), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $candidates = [$label, ...self::parenthesizedHead($label), ...$local, ...(self::TERMS[$id]['aliases'] ?? []), ...(self::TERMS[$id]['exact'] ?? [])];

    $out = [];
    foreach ($candidates as $candidate) {
        $candidate = trim($candidate);
        if ($candidate !== '' && ! isset($out[mb_strtolower($candidate)])) {
            $out[mb_strtolower($candidate)] = $candidate;
        }
    }

    return array_values($out);
}
```

- `entry()` 는 `'categoryLabel' => __('glossary.cat_'.$category)`, `'example' => $example`, `'examples' => self::exampleLines($example)` 를 더해 돌려준다. 키가 없는 필드는 빈 문자열(또는 빈 배열) — 화면이 그 상자를 숨긴다.
- `text($id, $field, $locale)` 는 `glossary.<id 밑줄>_<field>` 를 읽고, 없으면 빈 문자열(키 원문이 화면에 새지 않게).
- `href()` 는 `Route::getRoutes()->match(Request::create($path))` 로 화면이 있을 때만 `lurl($path, $locale)`.

## 본문 매칭 — segments · matcher

> 2026-10-28 부터 **같은 표기를 가진 용어가 모두 후보로 남고 `resolve()` 가 문맥으로 하나를 고른다**(SSOT 23절 "용어 문맥 뜻"). 아래 `matcher()` 코드는 그 전 모양이다 — 지금은 `matcherParts()` 가 표기마다 후보 목록(`terms` — `['grok', 'grok-cli']`, 빌린 표기는 `'~neural-network'`)을 만들고, `find()` 가 `[표기, 위치, 후보 목록]` 을 내고, `segments()` 는 `resolve()` 가 고른 id 로 조각을 만든다.
>
> ```php
> Glossary::resolve($text, $locale, $scope, $page)   // [{surface, offset, term: ?id, ambiguous, candidates: {id: {score, local, eligible, avoided, tier}}}]
> Glossary::senses($locale, $scope)                 // 뜻 색인 — 표기 → 후보 id(둘 이상이거나 근거가 있어야 하는 것만)
> Glossary::topic('git')                            // 이 요청에서 뒤에 그리는 글의 화면 주제 — <x-glossary.text topic="git"> 와 같다
> ```
>
> 고르는 순서: ① 근거 — 후보가 하나뿐이고 `context` 가 아닌 표기의 id(흔한 낱말 자신은 근거가 아니다) ② `avoid` 가 표기를 덮으면 탈락 ③ 점수 = (같은 문장 4 + 같은 문단 1 + 화면 주제 2) × 10 + 페이지 앞 글(`html()` 이 요청에 모은 `glossary.page`, 9점까지) ④ 자격 — `context` 낱말은 문장·문단·화면 주제, 빌린 표기는 같은 문장·화면 주제에 신호가 있어야 한다(페이지의 먼 문단은 자격을 주지 않는다 — /learn/ai 처럼 Git 장과 파이썬 장이 한 페이지인 곳의 "else branch") ⑤ 층(그 화면 전용 낱말 먼저) → 점수 → 등록 순서. 자격 있는 후보가 없으면 감싸지 않는다.

```php
public static function segments(string $text, ?string $locale = null, bool $once = true, array $exclude = [], ?string $scope = null): array
// matcher($locale, $scope) 의 정규식으로 찾고, exclude·once 를 거른 뒤 조각을 만든다. 조각을 이어 붙이면 원문과 똑같다.

private static function matcher(string $locale, ?string $scope = null): array
{
    $key = $locale.'|'.$scope;
    if (isset(self::$matchers[$key])) {
        return self::$matchers[$key];
    }

    $surfaces = [];
    foreach (self::matchIds($scope) as $id) {
        $exactAll = (bool) (self::TERMS[$id]['case'] ?? false);
        foreach (self::surfaces($id, $locale) as $surface) {
            $exact = $exactAll || in_array($surface, self::TERMS[$id]['exact'] ?? [], true);
            // 표기가 겹치면 먼저 온 용어가 이긴다 — 그 화면 전용 낱말이 먼저 온다(matchIds).
            $surfaces[$exact ? '='.$surface : mb_strtolower($surface)] ??= ['text' => $surface, 'term' => $id, 'exact' => $exact];
        }
    }
    $surfaces = array_values($surfaces);
    usort($surfaces, fn (array $a, array $b) => (mb_strlen($b['text']) <=> mb_strlen($a['text'])) ?: ($b['exact'] <=> $a['exact']));

    $alternatives = array_map(fn (array $s) => '('.self::surfacePattern($s['text'], $s['exact']).')', $surfaces);

    return self::$matchers[$key] = [
        $alternatives === [] ? null : '/'.implode('|', $alternatives).'/iu',
        array_column($surfaces, 'term'),
    ];
}

private static function matchIds(?string $scope): array
{
    $auto = array_filter(self::wordIds(), fn (string $id) => (self::TERMS[$id]['auto'] ?? true) !== false);
    $scoped = $scope === null ? [] : array_filter($auto, fn (string $id) => (self::TERMS[$id]['scope'] ?? null) === $scope);
    $everywhere = array_filter($auto, fn (string $id) => ! isset(self::TERMS[$id]['scope']));

    return [...array_values($scoped), ...array_values($everywhere)];
}
```

- **길이 내림차순이 핵심이다** — 정규식은 같은 자리에서 먼저 적힌 쪽을 고르므로 'API' 가 앞서면 'API 키' 가 영원히 안 잡힌다. 길이가 같으면 대소문자까지 같은 표기가 먼저다('PATH' → 환경 변수).
- 대소문자까지 같은 표기는 키를 `=표기` 로 따로 세서, 'PATH'(환경 변수)와 'path'(경로)가 둘 다 남는다.
- `surfacePattern($surface, $exact)` 는 표기 앞뒤에 경계 검사를 붙이고, `$exact` 면 몸통을 `(?-i:…)` 로 감싼다(정규식 전체는 `/iu`).
- **정규식 크기 한도(PCRE 컴파일 64KB)** — 한글로 끝나는 표기마다 조사 목록(60여 개)을 통째로 붙이던 때, 쉘 표기가 늘자 ko 정규식이 한도를 넘어 `/ko/shell` 이 500 이었다(2026-09-28). 지금은 조사 목록을 정규식 끝에 한 번만 정의하고(`(?(DEFINE)(?<kop>…))` — 표기 묶음들 뒤라 번호를 밀지 않는다) 표기마다 `(?=(?&kop))` 로 부른다. 라틴 낱말 경계도 같은 까닭으로 한 번만 정의해 부른다(`lwb`·`lwn`·`lwa` — 표기마다 글자 묶음을 붙이던 때 tr 쉘 정규식이 경계에 글자 셋을 더하자 한도를 넘었다). 그래도 넘으면 `matcher()` 가 컴파일을 시험해 그 언어의 밑줄을 빼고(`$pattern = null`) `report()` 로 알린다 — 화면은 죽지 않는다. `GlossaryShellTest` 가 17개 언어 × (전체·쉘) 정규식이 컴파일되는지 본다. 원문 크기는 2026-09-28 기준 쉘 화면 언어마다 14~25KB(경계를 한 번만 정의한 뒤).

| 문자 | 앞 | 뒤 | 이유 |
| --- | --- | --- | --- |
| 라틴 | 라틴 글자·숫자 없음, `글자.` 도 없음 | 라틴·숫자·결합 문자 없음, `.글자` 도 없음 | 'AI' 가 'Email' 에서, 'ls' 가 'ls.txt' 에서, 'html' 이 'index.html' 에서 잡히지 않게. 'LLM이' 는 된다 |
| 키릴 | 키릴 없음 | 뒤 키릴 글자까지 낱말째 | 러시아어 어미('токены') |
| 한글 | 한글 없음 | 한글이면 조사일 때만(`KO_PARTICLES` — '입니다'·'하다'·'되다'의 첫 음절 포함) | '토큰을'·'엔진입니다'·'배포하면' ○ · '토큰값' × |
| 아랍 | — | 뒤 아랍 글자까지(문장부호 빼고) | 접미사 'ات' |
| 그 밖 | — | 결합 문자만 | 가나·한자·타이·데바나가리는 공백으로 낱말을 가르지 않는다 |

## 컴포넌트 — x-glossary.text · x-glossary.term · x-glossary.info

`text.blade.php`(주석 제외) — 감싸기는 `Glossary::html()` 이 한다:

```blade
@props(['text' => '', 'once' => true, 'exclude' => [], 'scope' => null, 'group' => null])
@include('components.glossary.assets')
@php
    // 문장 앞뒤에 공백을 내지 않으려고 여기서 바로 내보낸다({!! !!} 는 뒤 줄바꿈을 남겨 '용어 .' 처럼 문장부호가 떨어진다).
    echo \App\Content\Glossary::html((string) $text, $scope, $group, (array) $exclude, (bool) $once);
@endphp
```

```php
public static function html(string $text, ?string $scope = null, ?string $group = null, array $exclude = [], bool $once = true): string
{
    // group — 이 요청 안에서 같은 이름끼리 이미 감싼 용어(요청마다 새로 시작한다 — 정적 변수는 워커 모드에서 요청을 넘어 남는다)
    $key = $group === null ? null : 'glossary.group.'.$group;
    $seen = $key === null ? [] : (array) request()->attributes->get($key, []);
    $html = self::segmentsHtml(self::segments($text, app()->getLocale(), $once, [...$exclude, ...$seen], $scope), function (array $segment) use (&$seen) {
        $seen[] = $segment['term'];

        return '<button type="button" class="glossary-term" data-term="'.e($segment['term']).'" title="'.e(self::short($segment['term'])).'" aria-haspopup="dialog">'
            .e($segment['text']).'<i class="fa-solid fa-circle-question" aria-hidden="true"></i></button>';
    });
    if ($key !== null) {
        request()->attributes->set($key, $seen);
    }

    return $html;
}
```

`term.blade.php`(주석 제외) — 본문에서 저절로 찾지 않는 문장·개념 항목(`'match' => false`)이나 자동 매칭이 못 잡는 활용형('토큰화' → `token`)을 그 구절에 명시로 붙인다. `text` 처럼 `@php echo` 로 바로 내보낸다(`@if` 로 쓰면 뒤 줄바꿈이 남아 '토큰화 를' 처럼 조사가 떨어진다 — 2026-10-21 확인). 없는 id 면 단추 없이 글만 낸다:

```blade
@props(['id'])
@include('components.glossary.assets')
@php
    echo \App\Content\Glossary::has($id)
        ? '<button type="button" '.$attributes->class('glossary-term').' data-term="'.e($id).'" data-kind="phrase" data-term-label="'.e(\App\Content\Glossary::term($id)).'" title="'.e(\App\Content\Glossary::short($id)).'" aria-haspopup="dialog">'.$slot.'<i class="fa-solid fa-circle-question" aria-hidden="true"></i></button>'
        : $slot;
@endphp
```

```blade
<p><x-glossary.term id="token">토큰화</x-glossary.term>를 해 봅니다.</p>
<p><x-glossary.term id="concept-…">{{ __('ai.build_concept_p1') }}</x-glossary.term></p>   {{-- 슬롯의 번역 문장은 {{ }} 로 이스케이프 --}}
```

- `data-term-label` 은 뜻을 받기 전 팝업 제목이다 — 없으면 구절 전체가 제목으로 잠깐 보인다(`glossary.js` 가 `dataset.termLabel ?? textContent`).
- `data-kind="phrase"` 는 CSS 가 밑줄을 옅게 하는 표시다(아래 "CSS"). 동작은 본문 용어 단추와 같다(`.glossary-term` — 호버·누르면 고정·Esc).
- `'match' => false` 항목은 `matchIds()` → `wordIds()` 가 빼므로 본문 매칭에 잡히지 않는다(이미 있던 규칙 — 메뉴 안내와 같다).

`info.blade.php`(주석 제외):

```blade
@props(['id'])
@include('components.glossary.assets')
<button type="button" {{ $attributes->class('glossary-term glossary-info') }} data-term="{{ $id }}" data-term-label="{{ \App\Content\Glossary::term($id) }}" title="{{ \App\Content\Glossary::short($id) }}" aria-label="{{ \App\Content\Glossary::term($id) }} — {{ \App\Content\Glossary::short($id) }}" aria-haspopup="dialog"><i class="fa-solid fa-circle-question" aria-hidden="true"></i></button>
```

쓰는 법과 금지:

- `<x-glossary.text>` 는 `<p>·<li>·<td>·<span>` 같은 글 요소 **안에** 넣는다. `<a>`·`<button>`·제목 안에는 쓰지 않는다. 부모가 flex·grid 면 글을 `<p>`·`<span>` 으로 한 번 묶는다(감싼 단추가 따로 떨어진 칸이 된다 — 쉘 목표 목록).
- `:text` 는 **평문**이다(모두 이스케이프). 태그가 든 번역 문장은 감싸지 않는다(content.md).
- `scope="shell"` 그 화면 전용 낱말까지, `group="…"` 여러 문단에 걸쳐 처음 한 번만, `:once="false"` 한 문단 안에서도 모두, `:exclude="['token']"` 그 화면이 본문에서 설명 중인 용어 빼기.
- `<x-glossary.info>` 는 `<a>`·`<button>` 안에 두지 않는다. 작은 제목(`<small>`)·라벨 곁이 알맞다.
- JS 가 고르는 글(지금 단원의 심화 주제·지금 미션 문장)도 글이 번역 파일에 있으면 **서버가 모두 그려 두고 `x-show` 로 고른다** — 그래야 `<x-glossary.text>` 로 용어를 감쌀 수 있다(쉘 심화 주제·미션 문장). `x-text`·`x-for` 로 그리면 팝업을 못 붙인다.
- 화면 머리의 한 줄 설명은 `<x-ui.page-header :description="…" glossary>`(그 화면 전용 낱말까지면 `glossary="appdev"`)로 감싼다.
- 자원은 `assets.blade.php` 의 `@once @push('head')` 로 한 번 실린다. 메인 레이아웃이 `@stack('head')` 바로 앞에서 `@include('components.glossary.assets')` 하므로 **메인 사이트의 모든 화면에 이미 실려 있다** — 메인 메뉴 같은 레이아웃 partial 의 `a[data-term]` 도 그대로 뜬다. 컴포넌트가 또 불러도 `@once` 자리 하나라 한 번이다. 서브도메인 레이아웃(teacher·student·school)과 `layouts/vibe` 는 컴포넌트가 본문에서 부를 때만 실린다(그 레이아웃의 partial 에 팝업을 달려면 같은 줄을 그 레이아웃의 `@stack('head')` 앞에 둔다).
- **메인 메뉴 팝업** — `config/menu.php` 의 서브메뉴 항목에 `'term' => 'menu-…'`(분류 menu·`'match' => false` 항목, 17개 언어 문장 필요)를 적으면 `partials/main-menu.blade.php` 가 그 링크에 단다. 마우스로 400ms 머물면 뜨고 누르면 그대로 이동한다(할 일 있는 요소). 2026-10-21 현재 `term` 을 단 메뉴 항목은 없다 — 메뉴 안내 문장을 쓰는 작업에서 더한다.
  ```blade
  <a href="{{ $item['url'] }}" @if ($item['current']) aria-current="page" @endif @isset($item['term']) data-term="{{ $item['term'] }}" data-term-label="{{ \App\Content\Glossary::term($item['term']) }}" @endisset>
  ```

## 팝업 틀 — assets

`assets.blade.php` 의 틀(요점 — 파일이 정본):

```blade
<template id="glossary-pop-template">
    <div id="glossary-pop" class="glossary-pop" role="dialog" tabindex="-1" aria-label="{{ __('glossary.panel_title') }}"
        x-data="glossaryPop(@js(url('/api/glossary/'.app()->getLocale())))" x-show="open" x-cloak
        x-bind:data-side="side" x-bind:aria-busy="loading" x-on:pointerenter="stay" x-on:pointerleave="leave">
        <header class="glossary-pop-top">
            <strong class="glossary-pop-term" x-text="entry.term"></strong>
            <span class="glossary-pop-cat" x-show="entry.categoryLabel" x-text="entry.categoryLabel"></span>
            <button type="button" class="glossary-pop-close" x-on:click="hide" aria-label="{{ __('glossary.close') }}" title="{{ __('glossary.close') }}"><x-fa name="xmark" /></button>
        </header>
        <p class="glossary-pop-short" x-show="entry.short" x-text="entry.short"></p>
        <p class="glossary-pop-long" x-show="entry.long" x-text="entry.long"></p>
        <p class="glossary-pop-easy" x-show="entry.easy">…쉽게 말하면 <span x-text="entry.easy"></span></p>
        <div class="glossary-pop-example" x-show="entry.examples.length">
            <span class="glossary-pop-label"><x-fa name="pen" />{{ __('glossary.example_label') }}</span>
            <ul class="glossary-pop-examples">
                <template x-for="(line, i) in entry.examples" x-bind:key="i">
                    <li><code dir="ltr" x-show="line.code" x-text="line.code"></code><span x-show="line.note" x-text="line.note"></span></li>
                </template>
            </ul>
        </div>
        <p class="glossary-pop-related" x-show="entry.related.length">…관련 용어 칩(x-on:click="navigate")…</p>
        <a class="glossary-pop-more" x-show="entry.href" x-bind:href="entry.href">{{ __('glossary.learn_more') }}<x-fa name="arrow-right" /></a>
    </div>
</template>
```

새 필드를 틀에 더하면 `glossary.js` 의 `EMPTY` 에도 더한다 — 빠지면 앞 용어의 값이 잠깐 보인다.

## 팝업 동작 — glossary.js

```js
const HOVER_CLOSE_DELAY = 160;   // 단추에서 팝업으로 옮기는 사이 닫히지 않게
const GAP = 8;
const LINK_OPEN_DELAY = 400;     // 할 일 있는 요소 위에 마우스가 머문 뒤 연다(훑고 지나가는 마우스로 열리지 않게)
const SHEET = '(max-width: 640px)';   // 이 폭 이하는 화면 아래 시트
const EMPTY = { term: '', short: '', long: '', easy: '', example: '', examples: [], categoryLabel: '', related: [], href: null };
// 누르면 할 일이 따로 있는 요소 — 마우스로만, 잠깐 머문 뒤 연다(용어 단추·팝업 안의 관련 용어 칩은 빼고)
const ACTION = '[data-term]:not(.glossary-term):not(.glossary-pop-chip)';

const termAt = (target) => (target instanceof Element ? target.closest('.glossary-term[data-term]') : null);
const linkAt = (target) => (target instanceof Element ? target.closest(ACTION) : null);
```

| 입력 | 용어 단추·물음표(`.glossary-term`) | 할 일 있는 요소(`ACTION`) |
| --- | --- | --- |
| `pointerover`(마우스) | 바로 `show()`. 고정된 팝업은 빼앗지 않는다 | 400ms 뒤 `show()` |
| `pointerout` | 160ms 뒤 닫기(`leave`) — 팝업 위로 들어가면 `stay` | 여는 타이머 취소, 열려 있었으면 `leave` |
| `click` | 고정(`show(term, true)`), 고정된 같은 단추면 닫기. 키보드로 눌렀으면 팝업으로 포커스 | 팝업을 닫고 원래 할 일(이동·실행)은 브라우저·화면이 한다 |
| `focusin` | 누르기로 생긴 포커스가 아니면 열기 | 열지 않는다(이동이 먼저) |
| Escape | 닫고 단추로 포커스(돌려준 포커스가 다시 열지 않게 `skipFocus`) | 같음 |
| 바깥 `pointerdown` | 닫기 | 같음 |

`show(term, pin)` 은 `aria-expanded`·`aria-controls` 를 **용어 단추에만** 달고(`!term.matches(ACTION)`), `title` 을 `data-short` 로 옮기고, `load(id, { term: term.dataset.termLabel ?? term.textContent.trim(), short })` 로 뜻을 받기 전에 표기를 먼저 보인다. `load()` 는 `ticket` 으로 늦게 온 응답을 버리고, `place()` 는 단추 옆(좁은 화면은 `side='sheet'`)에 둔다. 전문은 파일이 정본이다.

## 뜻 API · 용어 사전 창

```php
// routes/public/glossary.php — 세션 없는 공개 그룹(Cloudflare 캐시, SSOT 11절)
Route::get('/api/glossary/{locale}/{term}', TermController::class)->whereIn('locale', …)->where('term', '[a-z0-9-]+')->name('glossary.term');
// IndexController — 사전 창 목록 Glossary::index($locale)(낱말만, 메뉴 안내 빼고)
```

- 모두에게 같은 응답이므로 개인 상태(로그인·음성)를 섞지 않는다 — 음성은 `routes/web/` 로 따로(voice.md).
- 사전 창은 `CATEGORIES` 순서로 묶고 빈 분류는 숨긴다. 쉘 개념·명령도 "쉘"·"쉘 명령어" 묶음으로 나온다(`scope` 는 본문 매칭만 좁힌다). 창의 예시도 팝업처럼 줄마다 코드·설명(`glossary-panel-examples`).

## CSS

`public/css/pages/glossary.css` — 모든 선택자가 `glossary-` 로 시작한다. 방향 속성은 논리 속성만.

| 선택자 | 역할 |
| --- | --- |
| `.glossary-term` | 단추를 글자처럼, 점선 밑줄(색만으로 알리지 않는다), `cursor: help`, 작은 물음표 `i` |
| `.glossary-term[data-kind='phrase']` | 문장·개념 단추(`<x-glossary.term>`) — 구절 전체에 진한 밑줄이 그어지지 않게 `text-decoration-color: color-mix(in oklab, var(--wa-color-brand-fill-loud) 35%, transparent)`, 물음표는 그대로 |
| `.glossary-term.glossary-info` | 물음표 단추 — 1.5rem 동그라미, 밑줄 없음, 마우스·열림 때 옅은 강조 바탕 |
| `.glossary-pop` | `fixed`, `inline-size: min(24rem, calc(100vw - 1rem))`, `max-block-size: min(70vh, 34rem)` 안에서 스크롤 |
| `.glossary-pop-top` · `-term` · `-cat` · `-close` | 머리 — 표기(강조색)·분류 칩·닫기 |
| `.glossary-pop-short` · `-long` | 굵은 한 줄 뜻 · 설명 |
| `.glossary-pop-easy` · `-example` | 색 상자(쉽게 말하면 — 시작 쪽 굵은 선) · 낮은 바탕 상자(예시) |
| `.glossary-pop-examples` | 예시 줄 — `code`(고정폭·`pre-wrap`·`overflow-wrap: anywhere`) + 설명(옅은 색) |
| `.glossary-pop-related` · `-chip` · `-more` | 관련 용어 칩 · 더 배우기(`[dir='rtl']` 에서 화살표 뒤집기) |
| `.glossary-pop[data-side='sheet']` | 좁은 화면 아래쪽 시트 |

쉘 화면의 배치(예제 단추 곁 물음표를 한 줄에, 목표 문장 `<p>`, 작은 제목 곁 물음표 정렬)는 `public/css/pages/shell.css` 의 "용어 팝업" 절.

## 쉘 화면에 붙인 방법

| 어디 | 무엇 | 사전 |
| --- | --- | --- |
| 첫 화면 본문(기본기·소개·왜 쉘인가·웹 서버 설명·특징 칩·로드맵 설명) | `<x-glossary.text … scope="shell" group="shell-hub-{부분}" />` — 부분(essentials·hero·why·webserver)마다 한 번, 로드맵 설명은 그 문단 안에서 한 번 | 개념·명령·모든 화면의 낱말 |
| 단원 카드 12개(`<a class="lesson-card">`) | `data-term="{{ ShellCourse::lessonTerm($key) }}" data-term-label="{{ 단원 제목 }}"` — 마우스를 올리면 그 단원 안내 | `menu-shell-<단원>` |
| 나의 학습 여정(진도) 제목 곁 | `<x-glossary.info id="menu-shell-progress" />` | 메뉴 안내 |
| 단원 머리의 "실습 NN" 곁 | `<x-glossary.info :id="ShellCourse::lessonTerm($key)" />` | `menu-shell-<단원>` |
| 단원 요약·목표 | `<x-glossary.text … scope="shell" :group="'shell-'.$key.'-intro'" />` | 개념·명령 |
| 핵심 개념 본문 | `<x-glossary.text … scope="shell" />` — 문단마다 한 번(개념 문단마다 그 문단의 용어를 다시 설명한다) | 개념·명령 |
| 주의할 점 | `<x-glossary.text … scope="shell" :group="'shell-'.$key.'-pitfalls'" />` | 개념·명령 |
| 학습 목표·따라 해 보기·실시간 실습·미션·심화 학습 곁 | `<x-glossary.info id="menu-shell-lesson|examples|lab|missions|advanced" />` | 메뉴 안내 |
| 예제 단추(`button.snippet`) | `data-term`·`data-term-label` + 곁의 `<x-glossary.info>` | `ShellCourse::SNIPPET_TERMS[$key][$i]` |
| 심화 주제(제목·설명·예제 주석) | 단원마다 서버가 그려 두고 `x-show="active === '단원'"`. 제목 곁 `<x-glossary.info :id="ADVANCED_TERMS[…]" />`, 설명·주석은 `<x-glossary.text … scope="shell" group="shell-{단원}-advanced-{번호}" />`(주제마다 한 번) | `ShellCourse::ADVANCED_TERMS` · `shell_advanced.{단원}` |
| 미션 문장·힌트(`terminal.blade.php`) | 단원·미션마다 서버가 그려 두고 `x-show="active === '단원' && missionIdx === N"`, `<x-glossary.text … scope="shell" />` | 개념·명령 |

```php
// app/Content/ShellCourse.php — 예제 코드 속 글자는 언어마다 번역되어 있어(echo "안녕하세요") 코드로 찾지 않고 순서로 짝짓는다
public const SNIPPET_TERMS = [
    'sh_terminal' => ['cmd-pwd', 'cmd-ls', 'cmd-ls', 'cmd-cd', 'cmd-echo'],
    // … 12단원 — 개수·순서가 shell.{단원}.snippets 와 같다(GlossaryShellTest 가 본다)
];
public const ADVANCED_TERMS = [
    'sh_terminal' => ['cmd-read', 'shell-subshell', 'cmd-man'],
    // … 개수·순서가 shell.{단원}.advanced(제목) · shell_advanced.{단원}(설명·예제) 와 같다
];
public static function lessonTerm(string $key): string
{
    return 'menu-shell-'.substr($key, 3);   // sh_terminal → menu-shell-terminal
}
```

예제를 더하거나 빼면 `SNIPPET_TERMS` 도 같이 고친다. 단원 안내 항목의 표기(`_term`)는 17개 언어 모두 `shell.{단원}.title` 과 글자 하나까지 같다(테스트가 본다).

## 테스트

`tests/Feature/GlossaryTest.php`(기존):

- 17개 언어, 모든 용어의 term·short·long, 선택 필드(easy·example)는 한 언어에 있으면 17개 모두, 모든 낱말이 모든 언어에서 찾을 표기를 가진다, 관련 용어는 등록된 것만
- 매칭 — 그 언어 표기만, 긴 표기 먼저, 조사·활용, 괄호 앞 표기, once·exclude, 아랍 접미사, 점 경계, 메뉴 안내는 문장에서 안 잡힘
- 렌더·자원(한 번만·Alpine 보다 먼저·**본문에 용어가 없는 화면에도 한 번** — 레이아웃 partial 용, 세 컴포넌트를 섞어 써도 한 번)·API(17개 언어, 404, 쉽게 말하면·예시·분류 이름)·사전 창
- `<x-glossary.term>` — 단추 모양(`data-kind="phrase"`·`data-term-label`·`title`)과 앞뒤 공백 없음('토큰화</button>를'), 없는 id 면 글만(슬롯 이스케이프 유지)
- 메인 메뉴 — `config/menu.php` 항목의 `term` 이 그 링크에만 `data-term`·`data-term-label` 을 단다

`tests/Feature/GlossaryShellTest.php`(쉘):

- 화면 전용 낱말은 scope 가 있을 때만·같은 표기면 이긴다, 명령은 대소문자까지, 'PATH' 와 'path' 따로, 영어 낱말 명령은 안 잡힘, 그 언어의 별칭, 'ls.txt' 속 'ls' 는 안 잡힘
- 쉘 항목 127개 17개 언어 완비, 새 분류 이름, 예시 코드가 모든 언어에서 같다, 예시 줄 나누기, API 의 examples
- 코드 조각 속 낱말(`${#array[@]}` 의 array)은 안 잡힘, 오른쪽→왼쪽 문장의 기호 덩어리 격리(용어 단추째)·왼쪽→오른쪽 언어는 그대로, 예제 코드 속 아랍 글 격리

`tests/Feature/ShellPageTest.php`(쉘 화면): 심화 설명·예제가 17개 언어에 있고 명령은 그대로(번역할 글만 그 언어로), 심화·미션 문장이 서버 HTML 에 팝업과 함께 있다(en·ko·ar)
- group 은 문단을 넘어 한 번만, 물음표 단추의 이름·요약, 예제·심화 짝의 개수와 id, 단원 안내 표기 = 단원 제목, /en·/ko·/ar 쉘 화면에 트리거들이 있다

화면 테스트(`AiPagesTest`·`GitPagesTest`·`AppDevPagesTest` 등)는 본문 문장이 그대로 있는지 볼 때 `withoutGlossary($html)`(tests/Pest.php)로 팝업 단추와 `<bdi dir="ltr">` 격리만 벗기고 `e(문장)` 과 비교한다 — 단추 안의 글은 원문 조각이라 벗기면 한 글자도 다르지 않다. 팝업이 붙는 화면의 문장 단언을 새로 쓸 때도 이렇게 한다.

## 알려진 한계

| 한계 | 대응 |
| --- | --- |
| 평문만 감싼다 — 마크다운 HTML·리엔 답·게시판 글, JS 가 `x-text` 로 그리는 글은 못 감싼다 | 번역 파일에 있는 글이면 서버가 모두 그려 두고 `x-show` 로 고른다(쉘 심화·미션). HTML 은 laravel 스킬 `site/lib.js` 의 `G.apply`(TreeWalker) 방식 브라우저 스캔 + 표기 목록 API 가 필요해지면 만든다 |
| 할 일 있는 요소(카드·예제 단추)는 마우스로만 열린다 | 곁에 `<x-glossary.info>` 를 둔다(휴대폰·키보드) |
| 서브도메인·`layouts/vibe` 의 partial 에서는 자원을 못 싣는다(메인 레이아웃만 전역으로 싣는다) | 필요해지면 그 레이아웃의 `@stack('head')` 앞에 `@include('components.glossary.assets')` |
| 사전 밖 용어 발견 없음 | 필요해지면 SSOT 부터 정한다. 음성은 있다(voice.md) |
