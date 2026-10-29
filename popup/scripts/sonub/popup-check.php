<?php

/*
 * 용어 팝업 사전 검사 — 팝업 내용을 더하거나 고친 뒤 돌린다. 문제가 있으면 줄마다 적고 종료 코드 1.
 *
 * 실행(저장소 루트에서):
 *   bash $POPUP/scripts/sonub/run.sh popup-check.php
 *
 * 검사
 *   1) 필수 필드 — 모든 용어의 term·short·long 이 17개 언어에 비지 않고 있다
 *   2) 선택 필드 — 어느 언어에든 있는 필드(FIELDS 의 easy·example 등)는 17개 언어 모두에 있다(en 만 쓰고 끝내지 않게).
 *      aliases(그 언어만의 다른 표기)는 언어마다 있어도 없어도 되므로 이 검사에서 뺀다
 *   3) 자리표시자 — :name 같은 자리표시자가 en 과 같다. 예시(example)의 줄 수와 줄 맨 앞 `코드` 가 en 과 같다(코드는 번역하지 않는다)
 *   4) 관련 용어 — related 가 가리키는 id 가 사전에 있다(Glossary::entry 가 조용히 빼 버리므로 여기서 잡는다)
 *   5) 죽은 참조 — Blade 의 data-term="…"·<x-glossary.info id="…">·:exclude="[…]" 가 사전에 있는 id 다
 *   6) 표기 충돌 — 한 언어에서 같은 표기를 두 용어가 가지면 문맥으로 고른다(Glossary::resolve — SSOT 23절 "용어 문맥 뜻").
 *      두 용어 모두 cues(문맥 신호)를 가져야 한다 — 없으면 문맥이 같아 늘 앞 용어만 잡히니(뒤 용어는 그 표기로 영영 안 뜬다) 문제다.
 *      두 용어의 cues 가 똑같으면 문맥으로 가를 수 없어 문제다. cues·context·shares 가 가리키는 id 도 사전에 있어야 한다(화면 이름 cue 는 scope 에 쓰인 이름).
 *      같은 층끼리만 센다 — 화면 전용 낱말(scope)이 모든 화면의 낱말을 이기는 것은 일부러 그렇게 둔 것이다('프롬프트').
 *      대소문자까지 같아야 하는 표기(case·exact)는 따로 센다('PATH' 와 'path')
 *      avoid 정규식이 컴파일되는지, avoid 에 같은 언어를 두 번 쓰지 않았는지, except·keys 의 번역 키가 lang/en 에 있는지도 본다
 *   7) 두 글자 이하 라틴 표기 — 다른 낱말에 박히기 쉽다(경고만, 실패로 치지 않는다)
 */

use App\Content\Glossary;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Lang;

ini_set('memory_limit', '1G'); // 17개 언어의 번역 그룹을 모두 읽는다 — 기본 한도면 아무 말 없이 멈춘다
$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

/** 용어 한 건의 번역 필드 — 필수 셋 다음에 선택 필드. 팝업에 새 필드를 더하면 여기에도 더한다(content.md "필드"). */
const POPUP_REQUIRED = ['term', 'short', 'long'];
const POPUP_OPTIONAL = ['easy', 'example'];

$locales = array_keys(config('locales.locales'));
$problems = [];
$warnings = [];

$key = fn (string $id, string $field) => 'glossary.'.str_replace('-', '_', $id).'_'.$field;
$has = fn (string $k, string $l) => Lang::has($k, $l, false) && trim((string) __($k, [], $l)) !== '';
$placeholders = function (string $text): string {
    preg_match_all('/:[a-z_]+/i', $text, $m);
    sort($m[0]);

    return implode(',', $m[0]);
};

// 1)~3) 필드
foreach (Glossary::ids() as $id) {
    foreach (POPUP_REQUIRED as $field) {
        foreach ($locales as $locale) {
            if (! $has($key($id, $field), $locale)) {
                $problems[] = "필수 필드 없음: lang/{$locale}/glossary.php {$key($id, $field)}";
            }
        }
    }
    foreach (POPUP_OPTIONAL as $field) {
        $present = array_filter($locales, fn ($l) => $has($key($id, $field), $l));
        if ($present !== [] && count($present) !== count($locales)) {
            $missing = implode(',', array_diff($locales, $present));
            $problems[] = "선택 필드가 일부 언어에만 있음: {$key($id, $field)} — 빠진 언어 {$missing}";
        }
    }
    foreach ([...POPUP_REQUIRED, ...POPUP_OPTIONAL] as $field) {
        $k = $key($id, $field);
        if (! $has($k, 'en')) {
            continue;
        }
        $expected = $placeholders((string) __($k, [], 'en'));
        foreach ($locales as $locale) {
            if ($has($k, $locale) && $placeholders((string) __($k, [], $locale)) !== $expected) {
                $problems[] = "자리표시자가 en 과 다름: lang/{$locale}/glossary.php {$k}";
            }
        }
    }
    $exampleKey = $key($id, 'example');
    if ($has($exampleKey, 'en')) {
        $codes = fn (string $l) => array_column(Glossary::exampleLines((string) __($exampleKey, [], $l)), 'code');
        foreach ($locales as $locale) {
            if ($has($exampleKey, $locale) && $codes($locale) !== $codes('en')) {
                $problems[] = "예시의 코드나 줄 수가 en 과 다름: lang/{$locale}/glossary.php {$exampleKey}";
            }
        }
    }
}

// 4) 관련 용어 — TERMS 는 private 이라 리플렉션으로 읽는다
$terms = (new ReflectionClassConstant(Glossary::class, 'TERMS'))->getValue();
foreach ($terms as $id => $term) {
    foreach ($term['related'] ?? [] as $related) {
        if (! Glossary::has($related)) {
            $problems[] = "관련 용어가 사전에 없음: {$id} → {$related}";
        }
    }
}

// 5) 죽은 참조
$views = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/resources/views', FilesystemIterator::SKIP_DOTS));
foreach ($views as $file) {
    if (! str_ends_with($file->getFilename(), '.blade.php')) {
        continue;
    }
    $blade = file_get_contents($file->getPathname());
    $relative = substr($file->getPathname(), strlen($root) + 1);
    $refs = [];
    preg_match_all('/data-term="([a-z0-9-]+)"/', $blade, $m);
    $refs = array_merge($refs, $m[1]);
    preg_match_all('/<x-glossary\.(?:term|info)\s[^>]*\bid="([a-z0-9-]+)"/', $blade, $m);
    $refs = array_merge($refs, $m[1]);
    preg_match_all('/:exclude="\[([^\]]*)\]"/', $blade, $m);
    foreach ($m[1] as $list) {
        preg_match_all("/'([a-z0-9-]+)'/", $list, $ids);
        $refs = array_merge($refs, $ids[1]);
    }
    foreach (array_unique($refs) as $ref) {
        if (! Glossary::has($ref)) {
            $problems[] = "없는 용어를 가리킴: {$relative} → {$ref}";
        }
    }
}

// 6) 문맥 신호 — cues·shares 가 가리키는 것이 사전 id 이거나 화면 이름(scope 에 쓰인 이름)이다
$scopeNames = [];
foreach ($terms as $spec) {
    foreach ((array) ($spec['scope'] ?? []) as $name) {
        $scopeNames[$name] = true;
    }
}
foreach ($terms as $id => $spec) {
    foreach ($spec['cues'] ?? [] as $cue) {
        if (! Glossary::has($cue) && ! isset($scopeNames[$cue])) {
            $problems[] = "없는 문맥 신호: {$id} 의 cues → {$cue}";
        }
    }
    foreach ($spec['shares'] ?? [] as $owner) {
        if (! Glossary::has($owner)) {
            $problems[] = "없는 용어의 표기를 빌림: {$id} 의 shares → {$owner}";
        }
    }
    // borrow 는 shares 가 있을 때만 뜻이 있고, 주인 표기와 같은 소문자로 적는다
    if (isset($spec['borrow']) && empty($spec['shares'])) {
        $problems[] = "shares 없는 borrow: {$id}";
    }
    foreach ($spec['borrow'] ?? [] as $text) {
        if ($text !== mb_strtolower($text)) {
            $problems[] = "borrow 표기는 소문자로: {$id} → {$text}";
        }
    }
    // avoid 정규식은 resolve() 처럼 '/…/iu' 로 감싸 컴파일된다 — 틀리면 그 화면 전체가 오류로 멈춘다
    foreach ($spec['avoid'] ?? [] as $locale => $patterns) {
        if ($locale !== '*' && ! in_array($locale, $locales, true)) {
            $problems[] = "없는 언어의 avoid: {$id} → {$locale}";
        }
        foreach ($patterns as $pattern) {
            if (@preg_match('/'.$pattern.'/iu', '') === false) {
                $problems[] = "avoid 정규식 오류: {$id} ({$locale}) {$pattern} — '/' 는 '\\/' 로";
            }
        }
    }
    // except·keys 는 번역 키 — 없는 키는 조용히 아무것도 가리지 않는다
    foreach (['except', 'keys'] as $field) {
        foreach ($spec[$field] ?? [] as $k) {
            if (! Lang::has($k, 'en', false)) {
                $problems[] = "없는 번역 키: {$id} 의 {$field} → {$k}";
            }
            // 자리표시자가 있는 짧은 번역문('Bölüm :number')은 같은 말로 시작하는 다른 글에 걸리기 쉽다
            foreach ($locales as $locale) {
                $raw = Lang::get($k, [], $locale);
                if (is_string($raw) && preg_match('/:[a-z_]+/i', $raw) && mb_strlen(trim(preg_replace('/:[a-z_]+/i', '', $raw))) < 12) {
                    $warnings[] = "자리표시자가 있는 짧은 번역 키: {$id} 의 {$field} → {$k} ({$locale} '{$raw}') — 같은 말로 시작하는 다른 글에 걸리지 않는지 색인에서 확인";
                    break;
                }
            }
        }
    }
}
$cuesOf = fn (string $id) => array_values(array_unique([$id, ...($terms[$id]['cues'] ?? $terms[$id]['related'] ?? [])]));
$senses = 0;

// 6)·7) 표기 — 층(모든 화면 · 화면 전용마다)별로
$tiers = [];
foreach (Glossary::ids() as $id) {
    if (($terms[$id]['match'] ?? true) === false || ($terms[$id]['auto'] ?? true) === false) {
        continue;   // 메뉴 항목·저절로 찾지 않는 낱말은 본문에서 찾지 않는다
    }
    // 화면 이름마다 한 층 — 여러 화면의 낱말(['appdev', 'gamedev'])은 그 화면들의 층에 모두 든다(같은 화면에서 맞붙는 표기를 빠뜨리지 않게)
    foreach ((array) ($terms[$id]['scope'] ?? '(모든 화면)') as $tier) {
        $tiers[$tier][] = $id;
    }
}
foreach ($locales as $locale) {
    foreach ($tiers as $tier => $tierIds) {
        $owner = [];
        foreach ($tierIds as $id) {
            foreach (Glossary::surfaces($id, $locale) as $surface) {
                $exact = ($terms[$id]['case'] ?? false) || in_array($surface, $terms[$id]['exact'] ?? [], true);
                $lower = $exact ? '='.$surface : mb_strtolower($surface);
                if (isset($owner[$lower]) && $owner[$lower] !== $id) {
                    // 뜻이 여럿인 표기 — 두 용어 모두 cues 가 있고 서로 다르면 문맥으로 고르니 정상
                    $first = $owner[$lower];
                    if (! isset($terms[$first]['cues']) || ! isset($terms[$id]['cues'])) {
                        $problems[] = "표기 충돌({$locale}·{$tier}): '{$surface}' — {$first}·{$id} 중 cues 없는 쪽이 있어 문맥으로 못 가른다(늘 {$first})";
                    } elseif ($cuesOf($first) === $cuesOf($id)) {
                        $problems[] = "표기 충돌({$locale}·{$tier}): '{$surface}' — {$first}·{$id} 의 cues 가 같아 문맥으로 못 가른다";
                    } else {
                        $senses++;
                    }
                }
                $owner[$lower] ??= $id;
                if (preg_match('/^[A-Za-z]{1,2}$/', $surface) && $locale === 'en' && ! $exact) {
                    $warnings[] = "짧은 라틴 표기: '{$surface}'({$id}) — 다른 낱말에 박히지 않는지 본문에서 확인";
                }
            }
        }
    }
}

// TERMS 한 항목에 같은 필드를 두 번 쓰면(PHP 는 뒤의 것만 남긴다) 앞의 avoid·except 가 조용히 사라진다 — 원본 글로 센다
$source = (string) file_get_contents($root.'/app/Content/Glossary.php');
$termsEnd = strpos($source, "\n    ];", (int) strpos($source, 'const TERMS'));
preg_match_all("/^        '([a-z0-9-]+)' => \\[/m", substr($source, 0, $termsEnd ?: strlen($source)), $entries, PREG_OFFSET_CAPTURE);
foreach ($entries[1] as $n => [$entryId, $at]) {
    $body = substr($source, $at, ($entries[0][$n + 1][1] ?? $termsEnd) - $at);
    foreach (['aliases', 'exact', 'scope', 'context', 'cues', 'shares', 'borrow', 'avoid', 'except', 'keys', 'related', 'href'] as $field) {
        if (preg_match_all("/'{$field}' => /", $body) > 1) {
            $problems[] = "같은 필드를 두 번 씀(뒤의 것만 남는다): {$entryId} 의 {$field}";
        }
    }
    // avoid 안에 같은 언어를 두 번 쓰면('ar' => […], 'ar' => […]) 앞 언어의 정규식이 조용히 사라진다 — 바로 아래 층의 키만 센다
    if (preg_match("/'avoid' => \\[/", $body, $open, PREG_OFFSET_CAPTURE)) {
        $depth = 0;
        $keys = [];
        $text = substr($body, $open[0][1] + strlen($open[0][0]) - 1);
        for ($i = 0, $len = strlen($text); $i < $len; $i++) {
            $c = $text[$i];
            if ($c === "'") {
                $end = $i + 1;
                while ($end < $len && $text[$end] !== "'") {
                    $end += $text[$end] === '\\' ? 2 : 1;
                }
                if ($depth === 1 && preg_match('/^\s*=>/', substr($text, $end + 1, 4))) {
                    $keys[] = substr($text, $i + 1, $end - $i - 1);
                }
                $i = $end;
            } elseif ($c === '[') {
                $depth++;
            } elseif ($c === ']' && --$depth === 0) {
                break;
            }
        }
        foreach (array_keys(array_filter(array_count_values($keys), fn ($n) => $n > 1)) as $dup) {
            $problems[] = "avoid 에 같은 언어를 두 번 씀(뒤의 것만 남는다): {$entryId} 의 '{$dup}' — 한 배열로 합친다";
        }
    }
}

foreach (array_unique($warnings) as $warning) {
    echo "경고  {$warning}\n";
}
foreach ($problems as $problem) {
    echo "문제  {$problem}\n";
}
printf("용어 %d개 · 언어 %d개 · 뜻이 여럿인 표기 %d(문맥으로 고름) · 문제 %d · 경고 %d\n", count(Glossary::ids()), count($locales), $senses, count($problems), count(array_unique($warnings)));
exit($problems === [] ? 0 : 1);
