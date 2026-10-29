<?php

/*
 * 평문 문단 찾기 — Blade 가 팝업 부품 없이 그대로 찍는 본문 문단(<p>·<li>·<dd>·<td> 안의 {{ __('…') }}·{{ $t('…') }} 하나)인데
 * 그 문장에 사전 용어가 있는 곳. 그 문단의 용어는 설명이 없다 → <x-glossary.text :text="…"> 로 바꾸고 그 파일이 쓰는 scope·group·exclude 를 그대로 단다.
 * 상태·오류 안내(알림 종·관리 화면·진행 메시지)는 감싸지 않아도 되니 목록에서 학습 내용만 고른다.
 * 감싼 뒤에는 그 문장을 HTML 그대로 찾던 테스트가 깨진다 — withoutGlossary($html)·->withoutGlossary()->assertSee() 로 본다(tests/Pest.php).
 *
 *   bash $POPUP/scripts/sonub/run.sh popup-plain.php [언어=ko] [최소 글자=25]
 *   → 파일:줄 | 번역 키 | 잡힌 용어 | 문장 앞부분      (파일별 개수는 끝에)
 */

use App\Content\Glossary;
use Illuminate\Contracts\Console\Kernel;

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$locale = $argv[1] ?? 'ko';
$min = (int) ($argv[2] ?? 25);
app()->setLocale($locale);

$rows = [];
$perFile = [];
$views = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/resources/views', FilesystemIterator::SKIP_DOTS));
foreach ($views as $view) {
    if (! str_ends_with($view->getFilename(), '.blade.php')) {
        continue;
    }
    $src = file_get_contents($view->getPathname());
    // $t = fn (string $key, …) => __('그룹.'.$key, …) 처럼 그룹을 앞에 붙이는 단축 함수
    $prefix = preg_match("/\\\$t = fn \\(string \\\$key[^=]*=> __\\('([a-z0-9_-]+)\\.'/", $src, $m) ? $m[1] : null;
    foreach (explode("\n", $src) as $n => $line) {
        if (! preg_match_all("/<(p|li|dd|td)( [^>]*)?>\\s*\\{\\{ (__|\\\$t)\\(['\"]([a-z0-9_.-]+)['\"][^}]*\\) \\}\\}\\s*<\\/(p|li|dd|td)>/", $line, $found, PREG_SET_ORDER)) {
            continue;
        }
        foreach ($found as $hit) {
            $key = $hit[3] === '$t' ? ($prefix === null ? null : $prefix.'.'.$hit[4]) : $hit[4];
            $text = $key === null ? null : __($key);
            if (! is_string($text) || $text === $key || mb_strlen($text) < $min) {
                continue;
            }
            $terms = array_values(array_unique(array_filter(array_column(Glossary::resolve($text, $locale, null), 'term'))));
            if ($terms === []) {
                continue;
            }
            $file = substr($view->getPathname(), strlen($root.'/resources/views/'));
            $rows[] = $file.':'.($n + 1).' | '.$key.' | '.implode(',', array_slice($terms, 0, 5)).' | '.mb_substr($text, 0, 60);
            $perFile[$file] = ($perFile[$file] ?? 0) + 1;
        }
    }
}
echo implode("\n", $rows), "\n\n";
arsort($perFile);
foreach ($perFile as $file => $count) {
    echo "{$count}\t{$file}\n";
}
echo count($rows)."곳 · 파일 ".count($perFile)."개 ({$locale})\n";
