<?php

/*
 * 용어 뜻 색인 — 사이트의 모든 번역 문장에서 사전 용어가 잡힌 자리와 문맥으로 고른 뜻을 SQLite 데이터베이스에 넣고 보고한다(SSOT 23절 "용어 문맥 뜻").
 * 같은 표기가 화면마다 다른 뜻인지(branch: Git 갈래 · 학문의 갈래), 문맥으로 고른 결과가 맞는지 한 번에 훑고, 나중에 낱말 하나로 찾아본다.
 *
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php build [언어=en|all]      # 색인을 만들고 요약·검토 목록을 보인다(all = 17개 언어, 요약만)
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php report                    # 17개 언어 색인의 한 줄 요약(언어별 비교)
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php doubt [언어=en] [개수=40]  # 근거 없이 감싼 일반 낱말 — 뜻이 하나뿐인 용어가 다른 뜻으로 쓰인 곳 찾기
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php compare <언어> [기준=en]  # 언어 간 대조 — 기준 언어가 문맥으로 거절한 뜻을 이 언어는 감싼 곳
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php query <언어> <id|표기>    # 그 용어·표기가 잡힌 모든 문장과 고른 뜻
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php senses [언어=en]          # 뜻이 여럿인 표기 → 후보 id 와 문맥 신호(뜻 목록)
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php lookalike [언어=en] [개수=60]  # IT 밖 화면(용어가 드문 그룹)에 홀로 뜬 용어 — 일상 낱말이 IT 뜻으로 잡힌 곳
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php diff <언어> <예전.sqlite>  # 사전을 고치기 전 색인 사본과 비교 — 사라진·바뀐·새로 뜬 팝업
 *
 * 데이터베이스: storage/app/popup-index/<언어>.sqlite (git 에 안 들어간다). sqlite3 로 직접 물어도 된다 —
 *   terms(id, category, term, short, scope, context, cues)   사전 — 용어마다 표기·한 줄 뜻·문맥 신호
 *   surfaces(surface, candidates, ambiguous)                  표기 → 후보 뜻(뜻 목록 — 거꾸로 찾는 색인)
 *   texts(key, grp, scope, text) + texts_fts(FTS5)            번역 문장 — 낱말로 전문 검색
 *   hits(key, grp, scope, surface, offset, chosen, legacy, candidates, margin, evidence, page, shown, sentence)
 *     chosen  문맥으로 고른 뜻(없으면 NULL — 근거가 없어 감싸지 않음) · legacy  문맥을 보지 않던 예전 결과(첫 후보)
 *     margin  1등과 2등 후보의 점수 차(후보 하나면 NULL) — 10 미만이면 가까운 문맥(문장·글·주제)이 같아 페이지 문맥·등록 순서로 갈렸다
 *     evidence 고른 뜻에 다른 용어가 준 신호(문장 4·문단 1·화면 주제 2·앞 글 1 — 자기 이름은 빼고, 0 이면 그 낱말 하나뿐) · page 같은 그룹 앞 글의 신호 수(9까지)
 *     shown   팝업이 실제로 달리는 자리(그룹에서 그 뜻이 처음 나온 곳 — html() 이 한 화면에 한 번만 감싼다)
 *   contexts(surface, chosen, scope, grp, n, shown, near, bare)  문맥별 집계 — 표기 하나가 화면·그룹마다 어떤 뜻으로 몇 번,
 *     그중 가까운 다른 용어의 근거가 있는 곳(near)·하나도 없는 곳(bare: evidence 0)
 *
 * doubt — 뜻이 하나뿐인 용어는 문맥을 보지 않고 늘 감싼다. 그 표기가 일상어(라틴 문자는 소문자 낱말, 다른 문자는 모든 표기)면
 *   다른 뜻으로 쓰인 곳이 숨어 있다("differ in skill" 의 skill). bare 비율이 높은 용어부터 보이니 문장을 읽고 context·avoid·새 뜻으로 고친다.
 *
 * 화면 범위(scope)는 Blade 에서 그 번역 그룹을 감싸는 <x-glossary.text scope="…">(머리 카드 glossary="…"·lesson-text·글자로 정한 :scope="$변수" 포함) 중
 * 가장 많이 쓰인 값으로 짐작한다. PHP 가 정하는 그룹(DYNAMIC_SCOPES)과 AI 과정 챕터 글(키마다 AiCourse::glossaryScope())은 그 값을 쓴다 — 화면과 같은 뜻을 고르게.
 * 페이지 문맥은 그룹 하나를 한 페이지로 보고 앞 문장의 용어를 뒤 문장에 넘긴다(html() 이 요청 안에서 하는 것과 같다).
 */

use App\Content\AiCourse;
use App\Content\AiInternals;
use App\Content\EnglishCourse;
use App\Content\Glossary;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Arr;

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$command = $argv[1] ?? 'build';
$locale = $argv[2] ?? 'en';
$dir = $root.'/storage/app/popup-index';
if (! in_array($locale, [...array_keys(config('locales.locales')), ...($command === 'build' ? ['all'] : [])], true)) {
    // 셸 변수가 안 나뉘어 "ar runner" 같은 값이 오면 그 이름의 빈 데이터베이스를 만들던 것을 막는다
    fwrite(STDERR, "모르는 언어 '{$locale}' — config/locales.php 의 17개 언어 중 하나(build 는 all 도)\n");
    exit(2);
}
@mkdir($dir, 0775, true);
$file = "{$dir}/{$locale}.sqlite";
$terms = (new ReflectionClassConstant(Glossary::class, 'TERMS'))->getValue();

/**
 * Blade 의 :scope="$변수" 처럼 PHP 가 화면 범위를 정하는 그룹 — 색인은 Blade 글자만 읽으므로 여기 적는다.
 * 쉘 강의(shell/partials/lesson.blade.php)는 ShellCourse::glossaryScope() 로 'shell'(+단원별 화면)을 넘긴다.
 * AI 과정(aicourse)은 /learn/ai 의 learn-ai — 챕터 글(aicourse.<챕터>_*)은 아래 $keyScopes 가 챕터마다 AiCourse::glossaryScope() 로 덮는다.
 * 여기 적은 그룹은 Blade 에서 짐작한 값보다 앞선다(다른 화면이 그 그룹 글 하나를 빌려 쓴 scope 로 그룹 전체를 짐작하지 않게).
 */
/**
 * 화면이 감싸지 않는 용어(<x-glossary.text :exclude="…">) — PHP 상수로 넘겨 Blade 글자로는 그룹을 알 수 없는 것. 색인은 이 용어를 고른 자리를 기록하지 않는다(화면에 없다).
 * 영어 교재(englesson·english)는 EnglishCourse::GLOSSARY_EXCLUDE, AI 해부학(aiint)은 AiInternals::GLOSSARY_EXCLUDE. 그 밖은 Blade 의 :exclude 글자·상수·$변수로 짐작한다.
 */
function group_excludes(): array
{
    return ['englesson' => EnglishCourse::GLOSSARY_EXCLUDE, 'english' => EnglishCourse::GLOSSARY_EXCLUDE, 'aiint' => AiInternals::GLOSSARY_EXCLUDE];
}

const DYNAMIC_SCOPES = ['aicourse' => 'learn-ai', 'shdeep' => 'shell', 'shpat' => 'shell', 'shchain' => 'shell', 'shfig' => 'shell', 'shell_advanced' => 'shell', 'shell_regex' => 'shell'];

/** 표기가 든 문장 — 앞뒤 문장 경계까지. 표기는 【】로 보인다. 표기 바로 앞 공백은 남겨 낱말 가운데서 시작한 표기(웹브라우저·메타데이터)와 구별한다. */
function sentence_around(string $text, int $offset, string $surface): string
{
    $before = substr($text, 0, $offset);
    $after = substr($text, $offset + strlen($surface));
    $start = preg_match('/^.*[.!?。！？।؟۔\n]\s*/su', $before, $m) ? strlen($m[0]) : 0;
    $end = preg_match('/[.!?。！？।؟۔](?=\s|$)|\n/u', $after, $m, PREG_OFFSET_CAPTURE) ? $m[0][1] + strlen($m[0][0]) : strlen($after);

    return ltrim(substr($before, $start)).'【'.$surface.'】'.rtrim(substr($after, 0, $end));
}

if ($command === 'senses') {
    app()->setLocale($locale);
    foreach (Glossary::senses($locale) as $surface => $candidates) {
        echo "'{$surface}'\n";
        foreach ($candidates as $candidate) {
            $id = ltrim($candidate, '~');
            $cues = $terms[$id]['cues'] ?? $terms[$id]['related'] ?? [];
            printf("   %-18s %s%s — 신호: %s\n", $id, str_starts_with($candidate, '~') ? '(빌린 표기) ' : (($terms[$id]['context'] ?? false) ? '(근거 있을 때만) ' : ''),
                Glossary::short($id, $locale), implode(', ', $cues));
        }
    }
    exit(0);
}

if ($command === 'query') {
    $needle = $argv[3] ?? '';
    if (! is_file($file)) {
        fwrite(STDERR, "색인이 없습니다 — 먼저 build {$locale}\n");
        exit(2);
    }
    $db = new PDO("sqlite:{$file}");
    $rows = $db->prepare('SELECT key, surface, chosen, legacy, candidates, margin, sentence FROM hits WHERE chosen = :n OR legacy = :n OR lower(surface) = lower(:n) ORDER BY chosen IS NULL DESC, margin, key');
    $rows->execute(['n' => $needle]);
    $n = 0;
    foreach ($rows as $row) {
        $n++;
        $mark = $row['chosen'] === null ? '감싸지 않음' : $row['chosen'];
        $changed = $row['chosen'] !== $row['legacy'] ? "  (예전: {$row['legacy']})" : '';
        echo "{$row['key']}  →  {$mark}{$changed}  ".($row['margin'] === null ? '' : "차이 {$row['margin']}")."\n    {$row['sentence']}\n    후보 {$row['candidates']}\n";
    }
    echo $n === 0 ? "잡힌 곳 없음\n" : "{$n}곳\n";
    exit(0);
}

if ($command === 'report') {
    foreach (array_keys(config('locales.locales')) as $l) {
        if (! is_file("{$dir}/{$l}.sqlite")) {
            echo "   {$l}  색인 없음 — build {$l}\n";

            continue;
        }
        $db = new PDO("sqlite:{$dir}/{$l}.sqlite");
        $r = $db->query('SELECT count(*) hits, sum(shown) shown, sum(chosen IS NULL) dropped, sum(chosen IS NOT NULL AND chosen <> legacy) changed,
            sum(shown AND evidence = 0) bare FROM hits')->fetch(PDO::FETCH_ASSOC);
        printf("   %-3s 잡힌 자리 %6d · 팝업 %5d · 근거 없는 팝업 %5d (%2d%%) · 문맥으로 바뀜 %4d · 근거 없어 뺌 %4d\n", $l, $r['hits'], $r['shown'], $r['bare'],
            $r['shown'] ? round(100 * $r['bare'] / $r['shown']) : 0, $r['changed'], $r['dropped']);
    }
    exit(0);
}

if ($command === 'compare') {
    // 뜻은 원문 문장의 성질 — 같은 번역 키에서 기준 언어(검토한 en)의 문맥이 이 뜻을 거절했는데(avoid·context·다른 뜻) 이 언어는 그 뜻으로 감쌌다면 의심한다
    $base = $argv[3] ?? 'en';
    if (! is_file($file) || ! is_file("{$dir}/{$base}.sqlite")) {
        fwrite(STDERR, "색인이 없습니다 — 먼저 build {$locale} · build {$base}\n");
        exit(2);
    }
    $db = new PDO("sqlite:{$file}");
    $db->exec("ATTACH DATABASE '{$dir}/{$base}.sqlite' AS base");
    $rows = $db->query('SELECT l.key, l.chosen, l.sentence, coalesce(b.chosen, \'(감싸지 않음)\') base_chosen, b.sentence base_sentence
        FROM hits l JOIN base.hits b ON b.key = l.key AND b.legacy = l.chosen AND (b.chosen IS NULL OR b.chosen <> l.chosen)
        WHERE l.shown = 1 AND l.chosen IS NOT NULL GROUP BY l.key, l.chosen ORDER BY l.chosen, l.key');
    $n = 0;
    foreach ($rows as $row) {
        $n++;
        echo "{$row['key']}  {$locale}: {$row['chosen']}  ←  {$base}: {$row['base_chosen']}\n    {$locale}  ".mb_strimwidth($row['sentence'], 0, 130, '…')."\n    {$base}  ".mb_strimwidth($row['base_sentence'], 0, 130, '…')."\n";
    }
    echo $n === 0 ? "어긋난 곳 없음\n" : "{$n}곳 — 이 언어의 문장도 그 뜻이 아니면 그 키를 except 에(17개 언어 함께), 그 언어만의 구절이면 avoid['{$locale}'] 에\n";
    exit(0);
}

if ($command === 'lookalike') {
    // 예약·채팅·알림·한국어 과정처럼 용어가 드문 그룹에서, 다른 용어의 근거 없이(evidence 0) 혼자 뜬 IT 용어는 일상 낱말일 때가 많다
    // (ja 「この端末」 = 기기, tr 「Ana sayfaya git」 = 가라, pt 「data」 = 날짜). 영어 교재·수업·메뉴 용어(category english·lesson·menu)는 뺀다
    $limit = (int) ($argv[3] ?? 60);
    if (! is_file($file)) {
        fwrite(STDERR, "색인이 없습니다 — 먼저 build {$locale}\n");
        exit(2);
    }
    $db = new PDO("sqlite:{$file}");
    // 영어 원문의 같은 키에 그 뜻이 없으면(en 에 없음) 그 언어만의 낱말이 IT 용어와 같은 글자인 것 — 먼저 보인다
    $inEn = '1';
    if ($locale !== 'en' && is_file("{$dir}/en.sqlite")) {
        $db->exec("ATTACH DATABASE '{$dir}/en.sqlite' AS base");
        $inEn = 'EXISTS (SELECT 1 FROM base.hits b WHERE b.key = h.key AND b.chosen = h.chosen)';
    }
    $rows = $db->query("WITH d AS (SELECT t.grp, count(DISTINCT t.key) texts, count(h.chosen) * 1.0 / count(DISTINCT t.key) density
            FROM texts t LEFT JOIN hits h ON h.key = t.key GROUP BY t.grp)
        SELECT h.key, h.chosen, h.surface, h.sentence, d.density, {$inEn} in_en FROM hits h JOIN d ON d.grp = h.grp JOIN terms m ON m.id = h.chosen
        WHERE h.shown = 1 AND h.evidence = 0 AND d.density < 0.35 AND m.category NOT IN ('english', 'lesson', 'menu')
        ORDER BY in_en, d.density, h.chosen LIMIT ".max(1, $limit));
    $n = 0;
    foreach ($rows as $row) {
        $n++;
        printf("%-42s %-16s %-14s (용어 %.2f/문장%s) %s\n", $row['key'], $row['chosen'], $row['surface'], $row['density'], $row['in_en'] ? '' : ' · en 에 없음', mb_strimwidth($row['sentence'], 0, 110, '…'));
    }
    echo $n === 0 ? "없음\n" : "{$n}곳 — 문장을 읽고 그 뜻이 아니면 그 언어만의 구절은 avoid['{$locale}'], 원문부터 다른 뜻이면 키를 except 에(17개 언어 함께)\n";
    exit(0);
}

if ($command === 'diff') {
    // 사전을 고치기 전에 cp storage/app/popup-index/*.sqlite storage/app/popup-index-old/ → 고치고 build → diff <언어> storage/app/popup-index-old/<언어>.sqlite
    // 사본은 저장소 안(storage/)에 둔다 — run.sh 가 컨테이너에서 돌아 호스트의 /tmp 는 보이지 않는다
    $old = $argv[3] ?? '';
    if (! is_file($file) || ! is_file($old) || filesize($old) === 0) {
        fwrite(STDERR, "비교할 색인이 없습니다 — diff <언어> <예전 사본.sqlite>\n");
        exit(2);
    }
    $db = new PDO("sqlite:{$file}");
    $db->exec('ATTACH DATABASE '.$db->quote($old).' AS old');
    $rows = $db->query("SELECT o.key, o.chosen was, h.chosen now, coalesce(h.sentence, o.sentence) sentence FROM old.hits o LEFT JOIN hits h ON h.key = o.key AND h.offset = o.offset
            WHERE o.shown = 1 AND (h.key IS NULL OR h.shown <> 1 OR coalesce(h.chosen, '') <> coalesce(o.chosen, ''))
        UNION ALL SELECT h.key, NULL, h.chosen, h.sentence FROM hits h LEFT JOIN old.hits o ON o.key = h.key AND o.offset = h.offset
            WHERE h.shown = 1 AND (o.key IS NULL OR o.shown <> 1) ORDER BY 1");
    $n = 0;
    foreach ($rows as $row) {
        $n++;
        printf("%-42s %s → %s  %s\n", $row['key'], $row['was'] ?? '(없음)', $row['now'] ?? '(안 뜸)', mb_strimwidth($row['sentence'], 0, 110, '…'));
    }
    echo $n === 0 ? "바뀐 팝업 없음\n" : "{$n}곳 바뀜\n";
    exit(0);
}

if ($command === 'doubt') {
    $limit = (int) ($argv[3] ?? 40);
    if (! is_file($file)) {
        fwrite(STDERR, "색인이 없습니다 — 먼저 build {$locale}\n");
        exit(2);
    }
    $db = new PDO("sqlite:{$file}");
    // 일상어 표기 — 라틴·키릴 문자는 소문자로만 된 낱말(대문자·숫자·기호가 든 'API'·'Node.js' 는 다른 뜻이 드물다), 다른 문자는 모든 표기
    $plain = fn (string $s) => ! preg_match('/[\p{Latin}\p{Cyrillic}]/u', $s) || preg_match('/^[\p{Ll}][\p{Ll}\s\'’-]*$/u', $s);
    $byTerm = [];
    foreach ($db->query('SELECT chosen, surface, key, sentence, evidence, page, shown FROM hits WHERE chosen IS NOT NULL AND shown = 1') as $row) {
        $context = $terms[$row['chosen']]['context'] ?? false;
        if (! $plain($row['surface']) || $context === true || in_array($locale, (array) $context, true)) {
            continue;   // context 낱말은 이미 근거가 있어야만 감싼다
        }
        $t = &$byTerm[$row['chosen']];
        $t['shown'] = ($t['shown'] ?? 0) + 1;
        if ((int) $row['evidence'] === 0) {
            $t['bare'][] = $row;
        }
        unset($t);
    }
    uasort($byTerm, fn ($a, $b) => count($b['bare'] ?? []) <=> count($a['bare'] ?? []));
    echo "근거 없이 감싼 일반 낱말({$locale}) — 용어 · 근거 없는 팝업/모든 팝업 · 문장 보기(전체는 query {$locale} <id>)\n";
    foreach (array_slice($byTerm, 0, $limit, true) as $id => $t) {
        $bare = $t['bare'] ?? [];
        if ($bare === []) {
            break;
        }
        printf("\n%s  %d/%d  — %s\n", $id, count($bare), $t['shown'], Glossary::short($id, $locale));
        foreach (array_slice($bare, 0, 4) as $row) {
            echo '    '.str_pad($row['key'], 34).' '.mb_strimwidth($row['sentence'], 0, 120, '…')."\n";
        }
    }
    exit(0);
}

$build = function (string $locale, bool $quiet) use ($root, $dir, $terms): void {
    $file = "{$dir}/{$locale}.sqlite";
    // build — 번역 그룹마다 화면 범위를 짐작한다
    $groupScopes = [];
    $excludeRules = [];
    // 수업 화면 <x-glossary.lesson-text> 가 고정한 제외 목록
    $lessonExclude = preg_match('/:exclude="\\[([^\\]]*)\\]"/', (string) @file_get_contents($root.'/resources/views/components/glossary/lesson-text.blade.php'), $lx) && preg_match_all("/'([a-z0-9-]+)'/", $lx[1], $lids) ? $lids[1] : [];
    $views = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/resources/views', FilesystemIterator::SKIP_DOTS));
    foreach ($views as $view) {
        if (! str_ends_with($view->getFilename(), '.blade.php')) {
            continue;
        }
        $lines = file($view->getPathname());
        // :scope="$scope" — 같은 파일에서 글자로 정한 값($scope = 'learn-ai,claude-code';)이면 그 값으로 읽는다(harness·mcp 화면)
        preg_match_all("/\\$([a-zA-Z_]+)\\s*=\\s*'([a-z0-9,+-]+)'\\s*;/", implode('', $lines), $vars, PREG_SET_ORDER);
        $literal = array_column($vars, 2, 1);
        // :exclude="$exclude" — 같은 파일의 $exclude = 클래스::상수; 로 읽는다
        preg_match_all('/\\$([a-zA-Z_]+)\\s*=\\s*\\\\?(?:App\\\\Content\\\\)?([A-Z][A-Za-z]+)::([A-Z_]+)\\s*;/', implode('', $lines), $consts, PREG_SET_ORDER);
        $constVars = [];
        foreach ($consts as [, $var, $class, $const]) {
            $constVars[$var] = [$class, $const];
        }
        foreach ($lines as $line) {
            $exclude = null;
            if (str_contains($line, '<x-glossary.lesson-text')) {
                $exclude = $lessonExclude;
            } elseif (preg_match('/:exclude="\\\\?(?:App\\\\Content\\\\)?([A-Z][A-Za-z]+)::([A-Z_]+)"/', $line, $x) || (preg_match('/:exclude="\\$([a-zA-Z_]+)"/', $line, $v) && isset($constVars[$v[1]]) && ($x = [null, ...$constVars[$v[1]]]))) {
                $exclude = defined("App\\Content\\{$x[1]}::{$x[2]}") ? constant("App\\Content\\{$x[1]}::{$x[2]}") : null;
            } elseif (preg_match('/:exclude="\\[([^\\]]*)\\]"/', $line, $x)) {
                preg_match_all("/'([a-z0-9-]+)'/", $x[1], $ids);
                $exclude = $ids[1];
            }
            // 머리 카드(<x-ui.page-header glossary="learn-ai">)의 glossary 값도 화면 범위다. 표의 <th scope="col|row"> 는 HTML 속성이라 뺀다
            // 수업 화면의 <x-glossary.lesson-text> 는 scope="lesson" 을 고정한 <x-glossary.text> 다(components/glossary/lesson-text.blade.php)
            $value = str_contains($line, '<x-glossary.lesson-text') ? 'lesson'
                : (preg_match('/(?<!:)(?:scope|glossary)="(?!(?:col|row|colgroup|rowgroup)")([a-z0-9,+-]+)"/', $line, $s) ? $s[1]
                : (preg_match('/:scope="\\$([a-zA-Z_]+)"/', $line, $s) ? ($literal[$s[1]] ?? null) : null));
            // 감싸는 글(:text="__('그룹.…')")이 있으면 그 그룹만 — 같은 줄의 다른 글자(<dt>{{ __('aicourse.easy_analogy') }}</dt>)는 그 화면 범위로 그리지 않는다
            if ($value !== null && (preg_match_all("/:text=\"__\\(['\"]([a-z0-9_-]+)\\./", $line, $g) || preg_match_all("/__\\(['\"]([a-z0-9_-]+)\\./", $line, $g))) {
                foreach ($g[1] as $group) {
                    $groupScopes[$group][$value] = ($groupScopes[$group][$value] ?? 0) + 1;
                }
            }
            // 제외는 그 줄이 그리는 글에만 — :text="__('shdeep.'.$key.'_challenge')" 는 키 꼴 ^shdeep\..+_challenge$ 로 적는다
            if ($exclude !== null && $exclude !== [] && preg_match("/:text=\"__\\(('[^']*'(?:\\s*\\.\\s*(?:\\$[A-Za-z_]+(?:\\[[^\\]]*\\])*|'[^']*'))*)/", $line, $t)) {
                preg_match_all("/'([^']*)'|(\\$[A-Za-z_]+(?:\\[[^\\]]*\\])*)/", $t[1], $parts, PREG_SET_ORDER);
                $pattern = implode('', array_map(fn ($part) => isset($part[2]) ? '.+' : preg_quote($part[1], '/'), $parts));
                $excludeRules[] = ['/^'.$pattern.'$/', $exclude];
            }
        }
    }

    // AI 과정 챕터(aicourse.<챕터>_*)는 챕터마다 화면 범위가 다르다 — AiCourse::glossaryScope(슬러그)를 키마다 쓴다(learn/ai-course.blade.php 와 같게)
    $keyScopes = [];
    foreach (AiCourse::chapters() as $chapter) {
        array_walk_recursive($chapter, function ($value) use (&$keyScopes, $chapter) {
            if (is_string($value) && str_starts_with($value, 'aicourse.')) {
                $keyScopes[$value] = AiCourse::glossaryScope($chapter['slug']);
            }
        });
    }

    $scopeNames = [];
    foreach ($terms as $spec) {
        foreach ((array) ($spec['scope'] ?? []) as $name) {
            $scopeNames[$name] = true;
        }
    }

    @unlink($file);
    $db = new PDO("sqlite:{$file}");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA journal_mode = OFF; PRAGMA synchronous = OFF;
    CREATE TABLE terms (id TEXT PRIMARY KEY, category TEXT, term TEXT, short TEXT, scope TEXT, context INTEGER, cues TEXT);
    CREATE TABLE surfaces (surface TEXT, candidates TEXT, ambiguous INTEGER);
    CREATE TABLE texts (key TEXT PRIMARY KEY, grp TEXT, scope TEXT, text TEXT);
    CREATE VIRTUAL TABLE texts_fts USING fts5(key UNINDEXED, text);
    CREATE TABLE hits (key TEXT, grp TEXT, scope TEXT, surface TEXT, offset INTEGER, chosen TEXT, legacy TEXT, candidates TEXT, margin INTEGER,
        evidence INTEGER, page INTEGER, shown INTEGER, sentence TEXT);
    CREATE INDEX hits_chosen ON hits(chosen); CREATE INDEX hits_surface ON hits(surface);');

    app()->setLocale($locale);
    $db->beginTransaction();
    $insertTerm = $db->prepare('INSERT INTO terms VALUES (?, ?, ?, ?, ?, ?, ?)');
    foreach (Glossary::wordIds() as $id) {
        $insertTerm->execute([$id, $terms[$id]['category'], Glossary::term($id, $locale), Glossary::short($id, $locale), implode(',', (array) ($terms[$id]['scope'] ?? [])),
            (int) (($terms[$id]['context'] ?? false) === true || in_array($locale, (array) ($terms[$id]['context'] ?? []), true)), implode(',', $terms[$id]['cues'] ?? $terms[$id]['related'] ?? [])]);
    }
    $senses = Glossary::senses($locale);
    $insertSurface = $db->prepare('INSERT INTO surfaces VALUES (?, ?, 1)');
    foreach ($senses as $surface => $candidates) {
        $insertSurface->execute([$surface, implode(',', $candidates)]);
    }

    $insertText = $db->prepare('INSERT INTO texts VALUES (?, ?, ?, ?)');
    $insertFts = $db->prepare('INSERT INTO texts_fts VALUES (?, ?)');
    $insertHit = $db->prepare('INSERT INTO hits VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stats = ['texts' => 0, 'hits' => 0, 'excluded' => 0, 'ambiguous' => 0, 'changed' => 0, 'dropped' => 0];
    $review = [];
    foreach (glob("{$root}/lang/{$locale}/*.php") as $path) {
        $group = basename($path, '.php');
        if (in_array($group, ['glossary', 'glossary-detail'], true)) {
            continue;   // 팝업 글 자체 — 본문에서 감싸지 않는다
        }
        $scopes = $groupScopes[$group] ?? [];
        arsort($scopes);
        // Blade 에 scope 가 없으면 PHP 가 정하는 화면 범위(DYNAMIC_SCOPES), 그다음 그룹 이름이 화면 이름인지 본다(git 은 Git::inline 이 PHP 에서 scope 'git' 을 넘긴다)
        $scope = DYNAMIC_SCOPES[$group] ?? array_key_first($scopes) ?? (isset($scopeNames[$group]) ? $group : null);
        $groupExcluded = group_excludes()[$group] ?? [];
        $page = ['ids' => [], 'topics' => []];
        $shownIds = [];
        foreach (Arr::dot((array) require $path) as $key => $text) {
            if (! is_string($text) || ! preg_match('/\p{L}{3}/u', $text)) {
                continue;
            }
            $key = "{$group}.{$key}";
            $keyScope = $keyScopes[$key] ?? $scope;
            $excluded = array_flip($groupExcluded);
            foreach ($excludeRules as [$rule, $ids]) {
                if (preg_match($rule, $key)) {
                    $excluded += array_flip($ids);
                }
            }
            $stats['texts']++;
            $insertText->execute([$key, $group, $keyScope, $text]);
            $insertFts->execute([$key, $text]);
            foreach (Glossary::resolve($text, $locale, $keyScope, $page) as $hit) {
                if ($hit['term'] !== null && isset($excluded[$hit['term']])) {
                    $stats['excluded']++;   // 화면이 :exclude 로 감싸지 않는 뜻 — 기록하지 않는다

                    continue;
                }
                $stats['hits']++;
                $ids = array_keys($hit['candidates']);
                $legacy = $ids[0];
                $scores = array_column(array_filter($hit['candidates'], fn ($c) => $c['eligible']), 'score');
                rsort($scores);
                $margin = count($hit['candidates']) > 1 ? ($scores[0] ?? 0) - ($scores[1] ?? 0) : null;
                $ambiguous = count($ids) > 1 || $hit['term'] === null || (($terms[$legacy]['context'] ?? false) === true || in_array($locale, (array) ($terms[$legacy]['context'] ?? []), true));
                $sentence = sentence_around($text, $hit['offset'], $hit['surface']);
                $chosen = $hit['term'] === null ? null : $hit['candidates'][$hit['term']];
                $shown = $hit['term'] !== null && ! isset($shownIds[$hit['term']]);
                $shownIds[$hit['term'] ?? ''] = true;
                $insertHit->execute([$key, $group, $keyScope, $hit['surface'], $hit['offset'], $hit['term'], $legacy,
                    json_encode(array_map(fn ($c) => $c['score'].($c['avoided'] ? '피함' : ($c['eligible'] ? '' : '×')), $hit['candidates']), JSON_UNESCAPED_UNICODE),
                    $margin, $chosen['others'] ?? null, $chosen === null ? null : $chosen['score'] - $chosen['local'] * 10, (int) $shown, $sentence]);
                if ($hit['term'] !== null) {
                    $page['ids'][$hit['term']] = ($page['ids'][$hit['term']] ?? 0) + 1;
                }
                if ($ambiguous) {
                    $stats['ambiguous']++;
                    $stats['changed'] += (int) ($hit['term'] !== $legacy && $hit['term'] !== null);
                    $stats['dropped'] += (int) ($hit['term'] === null);
                    // 검토 — 후보가 여럿인데 가까운 문맥(문장·글·주제) 점수가 같아 페이지·등록 순서로 갈린 곳(점수 차 10 미만)
                    if (count($ids) > 1 && $margin !== null && $margin < 10) {
                        $review[] = sprintf('%-34s %-16s 차이 %d  %s', $key, $hit['term'] ?? '감싸지 않음', $margin, mb_strimwidth($sentence, 0, 110, '…'));
                    }
                }
            }
        }
    }
    $db->commit();
    $db->exec('CREATE TABLE contexts AS SELECT lower(surface) surface, chosen, scope, grp, count(*) n, sum(shown) shown, sum(evidence > 0) near,
    sum(evidence = 0) bare FROM hits GROUP BY lower(surface), chosen, scope, grp;
    CREATE INDEX contexts_surface ON contexts(surface);');

    printf("색인 %s — 문장 %d · 잡힌 자리 %d · 뜻이 여럿/근거 필요 %d (예전과 다른 뜻 %d · 근거 없어 감싸지 않음 %d) · 화면이 제외한 자리 %d\n", substr($file, strlen($root) + 1), $stats['texts'], $stats['hits'], $stats['ambiguous'], $stats['changed'], $stats['dropped'], $stats['excluded']);
    if ($quiet) {
        return;
    }
    echo "\n표기별 고른 뜻\n";
    $rows = $db->query("SELECT lower(surface) s, coalesce(chosen, '(감싸지 않음)') c, count(*) n FROM hits WHERE surface IN (SELECT surface FROM surfaces) OR chosen IS NULL OR chosen <> legacy GROUP BY s, c ORDER BY s, n DESC");
    foreach ($rows as $row) {
        printf("   %-22s %-22s %d\n", $row['s'], $row['c'], $row['n']);
    }
    if ($review !== []) {
        echo "\n검토할 곳(가까운 문맥이 같아 페이지·등록 순서로 갈림 — popup-index.php query {$locale} <id> 로 문장 전체)\n";
        foreach (array_slice($review, 0, 40) as $line) {
            echo "   {$line}\n";
        }
        echo count($review) > 40 ? '   … 외 '.(count($review) - 40)."곳\n" : '';
    }
};

foreach ($locale === 'all' ? array_keys(config('locales.locales')) : [$locale] as $l) {
    $build($l, $locale === 'all');
}
