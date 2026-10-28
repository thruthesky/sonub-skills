<?php

/*
 * 언어마다 그 번역 그룹의 문장 전체에서 용어가 몇 번 잡히는지 — 한 언어에서만 유난히 자주 잡히는 용어(흔한 낱말일 수 있다 → popup-context.php 로
 * 문맥 확인)와, 한 번도 안 잡히는 용어(표기가 그 언어 본문의 낱말과 다르다 → 별칭)를 한눈에 본다.
 *
 *   bash $POPUP/scripts/sonub/run.sh popup-counts.php <번역 그룹> <화면 범위|-> <id 앞머리,…> [언어…]
 *   bash $POPUP/scripts/sonub/run.sh popup-counts.php shell shell shell,shell- en ko ja vi
 */

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[$group, $scope, $prefixes] = [$argv[1] ?? '', ($argv[2] ?? '-') === '-' ? null : $argv[2], explode(',', $argv[3] ?? '')];
$locales = array_slice($argv, 4) ?: array_keys(config('locales.locales'));
$watched = array_filter(App\Content\Glossary::wordIds(), function (string $id) use ($prefixes) {
    foreach ($prefixes as $p) {
        if ($id === $p || ($p !== '' && str_ends_with($p, '-') && str_starts_with($id, $p))) {
            return true;
        }
    }

    return false;
});
foreach ($locales as $locale) {
    $values = require "{$root}/lang/{$locale}/{$group}.php";
    $texts = [];
    array_walk_recursive($values, function ($v) use (&$texts) {
        if (is_string($v)) {
            $texts[] = $v;
        }
    });
    $count = [];
    foreach ($texts as $text) {
        foreach (App\Content\Glossary::segments($text, $locale, false, [], $scope) as $s) {
            if ($s['term'] !== null && in_array($s['term'], $watched, true)) {
                $count[$s['term']] = ($count[$s['term']] ?? 0) + 1;
            }
        }
    }
    arsort($count);
    $top = array_map(fn ($k, $v) => "{$k}×{$v}", array_slice(array_keys($count), 0, 8), array_slice($count, 0, 8));
    echo "{$locale} 많이: ".implode(' ', $top)."\n   안 잡힘: ".implode(' ', array_diff($watched, array_keys($count)))."\n";
}
