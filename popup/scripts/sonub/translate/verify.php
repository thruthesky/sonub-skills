<?php

/*
 * 번역 작업 파일 검사 — 작업 폴더의 {언어}.json 이 en.json 과 같은 항목·필드(aliases 제외)·예시 코드·예시 줄 수를 가졌는가.
 * 번역 작업자에게 "이 검사가 정상일 때까지 고쳐라"고 맡긴다(references/content.md "넣는 절차").
 *
 *   bash $POPUP/scripts/sonub/run.sh translate/verify.php storage/app/popup-work ja zh …
 *
 * 작업 폴더의 파일 모양: {"keys": {키: 값}, "terms": {id: {term, short, long, easy?, example?, aliases?}}}
 */

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$dir = $root.'/'.trim($argv[1] ?? '', '/');
$en = json_decode(file_get_contents("{$dir}/en.json"), true, 512, JSON_THROW_ON_ERROR);
$codes = fn (array $t) => array_column(App\Content\Glossary::exampleLines($t['example'] ?? ''), 'code');
$lines = fn (array $t) => count(App\Content\Glossary::exampleLines($t['example'] ?? ''));
$fail = 0;
foreach (array_slice($argv, 2) as $locale) {
    $file = "{$dir}/{$locale}.json";
    if (! is_file($file)) {
        echo "{$locale}: 파일 없음\n";
        $fail++;

        continue;
    }
    try {
        $x = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        echo "{$locale}: JSON 오류 ".$e->getMessage()."\n";
        $fail++;

        continue;
    }
    $problems = [];
    foreach ($en['keys'] ?? [] as $k => $v) {
        if (trim((string) ($x['keys'][$k] ?? '')) === '') {
            $problems[] = "키 {$k} 없음";
        }
    }
    foreach ($en['terms'] as $id => $t) {
        $y = $x['terms'][$id] ?? null;
        if (! $y) {
            $problems[] = "{$id} 없음";

            continue;
        }
        $want = array_diff(array_keys($t), ['aliases']);
        $got = array_diff(array_keys($y), ['aliases']);
        sort($want);
        sort($got);
        if ($want !== $got) {
            $problems[] = "{$id} 필드 다름(".implode(',', $got).')';
        }
        foreach ($y as $f => $v) {
            if (! is_string($v) || trim($v) === '') {
                $problems[] = "{$id}.{$f} 비었음";
            }
        }
        if ($codes($t) !== $codes($y)) {
            $problems[] = "{$id} 예시 코드 다름";
        }
        if ($lines($t) !== $lines($y)) {
            $problems[] = "{$id} 예시 줄 수 다름";
        }
    }
    foreach (array_diff(array_keys($x['terms'] ?? []), array_keys($en['terms'])) as $extra) {
        $problems[] = "{$extra} 남음";
    }
    echo $locale, ': ', $problems === [] ? '정상 ('.count($x['terms']).'개)' : count($problems).'개 문제 — '.implode(' / ', array_slice($problems, 0, 12)), "\n";
    $fail += count($problems);
}
exit($fail ? 1 : 0);
