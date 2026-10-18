<?php

/*
 * 한 언어의 사전 표기 목록 — 번역 작업자가 본문을 옮길 때 그 언어의 사전 표기(term·aliases)와 같은 낱말을 쓰게 한다.
 * 본문 낱말이 사전 표기와 같아야 팝업이 붙는다(Glossary::segments 는 표기·별칭으로 찾는다).
 *
 *   bash $POPUP/scripts/sonub/run.sh translate/vocab.php ja            # 쉘 화면 항목(shell·cmd-)
 *   bash $POPUP/scripts/sonub/run.sh translate/vocab.php ja '^(ai|llm)'  # id 를 정규식으로 고른다
 */

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$locale = $argv[1] ?? 'en';
$filter = '/'.($argv[2] ?? '^(shell|cmd-)').'/';
foreach (App\Content\Glossary::ids() as $id) {
    if (! preg_match($filter, $id)) {
        continue;
    }
    $key = 'glossary.'.str_replace('-', '_', $id);
    $aliases = Lang::has("{$key}_aliases", $locale, false) ? ' / 별칭: '.__("{$key}_aliases", [], $locale) : '';
    echo $id, ' = ', __("{$key}_term", [], $locale), $aliases, "\n";
}
