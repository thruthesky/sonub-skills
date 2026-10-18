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
 *   6) 표기 충돌 — 한 언어에서 같은 표기를 두 용어가 가지면 먼저 등록된 용어만 잡힌다(뒤 용어는 그 표기로 영영 안 뜬다).
 *      같은 층끼리만 센다 — 화면 전용 낱말(scope)이 모든 화면의 낱말을 이기는 것은 일부러 그렇게 둔 것이다('프롬프트').
 *      대소문자까지 같아야 하는 표기(case·exact)는 따로 센다('PATH' 와 'path')
 *   7) 두 글자 이하 라틴 표기 — 다른 낱말에 박히기 쉽다(경고만, 실패로 치지 않는다)
 */

use App\Content\Glossary;
use Illuminate\Support\Facades\Lang;

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

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

// 6)·7) 표기 — 층(모든 화면 · 화면 전용마다)별로
$tiers = [];
foreach (Glossary::ids() as $id) {
    if (($terms[$id]['match'] ?? true) === false || ($terms[$id]['auto'] ?? true) === false) {
        continue;   // 메뉴 항목·저절로 찾지 않는 낱말은 본문에서 찾지 않는다
    }
    $tiers[$terms[$id]['scope'] ?? '(모든 화면)'][] = $id;
}
foreach ($locales as $locale) {
    foreach ($tiers as $tier => $tierIds) {
        $owner = [];
        foreach ($tierIds as $id) {
            foreach (Glossary::surfaces($id, $locale) as $surface) {
                $exact = ($terms[$id]['case'] ?? false) || in_array($surface, $terms[$id]['exact'] ?? [], true);
                $lower = $exact ? '='.$surface : mb_strtolower($surface);
                if (isset($owner[$lower]) && $owner[$lower] !== $id) {
                    $problems[] = "표기 충돌({$locale}·{$tier}): '{$surface}' — {$owner[$lower]} 이 먼저라 {$id} 는 이 표기로 안 뜬다";
                }
                $owner[$lower] ??= $id;
                if (preg_match('/^[A-Za-z]{1,2}$/', $surface) && $locale === 'en' && ! $exact) {
                    $warnings[] = "짧은 라틴 표기: '{$surface}'({$id}) — 다른 낱말에 박히지 않는지 본문에서 확인";
                }
            }
        }
    }
}

foreach (array_unique($warnings) as $warning) {
    echo "경고  {$warning}\n";
}
foreach ($problems as $problem) {
    echo "문제  {$problem}\n";
}
printf("용어 %d개 · 언어 %d개 · 문제 %d · 경고 %d\n", count(Glossary::ids()), count($locales), count($problems), count(array_unique($warnings)));
exit($problems === [] ? 0 : 1);
