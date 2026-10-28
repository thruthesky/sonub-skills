<?php

/*
 * 용어가 잡힌 자리를 앞뒤 문맥과 함께 보인다 — 흔한 낱말이 다른 뜻에도 잡히는지(오탐) 가릴 때 쓴다.
 * 예: 프랑스어 'tableau'(배열)가 awk 의 '표'에, 베트남어 'biến'(변수)이 'phổ biến'(흔한)에 잡혔다(2026-09-28 쉘 작업).
 *
 *   bash $POPUP/scripts/sonub/run.sh popup-context.php <번역 그룹> <언어> <화면 범위|-> <id,id…>
 *   bash $POPUP/scripts/sonub/run.sh popup-context.php shell vi shell shell-variable,shell-conditional
 */

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[$group, $locale, $scope, $ids] = [$argv[1] ?? '', $argv[2] ?? 'ko', ($argv[3] ?? '-') === '-' ? null : $argv[3], explode(',', $argv[4] ?? '')];
$values = require "{$root}/lang/{$locale}/{$group}.php";
$texts = [];
array_walk_recursive($values, function ($v) use (&$texts) {
    if (is_string($v)) {
        $texts[] = $v;
    }
});
$seen = [];
foreach ($texts as $text) {
    $pos = 0;
    foreach (App\Content\Glossary::segments($text, $locale, false, [], $scope) as $s) {
        if ($s['term'] !== null && in_array($s['term'], $ids, true)) {
            $line = str_pad($s['term'], 22).' …'.mb_substr(substr($text, 0, $pos), -18).'【'.$s['text'].'】'.mb_substr(substr($text, $pos + strlen($s['text'])), 0, 18).'…';
            $seen[$line] = ($seen[$line] ?? 0) + 1;
        }
        $pos += strlen($s['text']);
    }
}
ksort($seen);
foreach ($seen as $line => $n) {
    echo ($n > 1 ? "×{$n} " : '   ').$line."\n";
}
echo count($seen) === 0 ? "잡힌 곳 없음\n" : '';
