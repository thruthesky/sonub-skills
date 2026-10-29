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
 * 화면 범위(scope)는 Blade 에서 그 번역 그룹을 감싸는 <x-glossary.text scope="…"> 중 가장 많이 쓰인 값으로 짐작한다.
 * 페이지 문맥은 그룹 하나를 한 페이지로 보고 앞 문장의 용어를 뒤 문장에 넘긴다(html() 이 요청 안에서 하는 것과 같다).
 */

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
@mkdir($dir, 0775, true);
$file = "{$dir}/{$locale}.sqlite";
$terms = (new ReflectionClassConstant(Glossary::class, 'TERMS'))->getValue();

/**
 * Blade 의 :scope="$변수" 처럼 PHP 가 화면 범위를 정하는 그룹 — 색인은 Blade 글자만 읽으므로 여기 적는다.
 * 쉘 강의(shell/partials/lesson.blade.php)는 ShellCourse::glossaryScope() 로 'shell'(+단원별 화면)을 넘긴다.
 */
const DYNAMIC_SCOPES = ['shdeep' => 'shell', 'shpat' => 'shell', 'shchain' => 'shell', 'shfig' => 'shell', 'shell_advanced' => 'shell', 'shell_regex' => 'shell'];

/** 표기가 든 문장 — 앞뒤 문장 경계까지. 표기는 【】로 보인다. */
function sentence_around(string $text, int $offset, string $surface): string
{
    $before = substr($text, 0, $offset);
    $after = substr($text, $offset + strlen($surface));
    $start = preg_match('/^.*[.!?。！？।؟۔\n]\s*/su', $before, $m) ? strlen($m[0]) : 0;
    $end = preg_match('/[.!?。！？।؟۔](?=\s|$)|\n/u', $after, $m, PREG_OFFSET_CAPTURE) ? $m[0][1] + strlen($m[0][0]) : strlen($after);

    return trim(substr($before, $start)).'【'.$surface.'】'.rtrim(substr($after, 0, $end));
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
    $views = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/resources/views', FilesystemIterator::SKIP_DOTS));
    foreach ($views as $view) {
        if (! str_ends_with($view->getFilename(), '.blade.php')) {
            continue;
        }
        foreach (file($view->getPathname()) as $line) {
            if (preg_match('/scope="([a-z0-9,+-]+)"/', $line, $s) && preg_match_all("/__\\(['\"]([a-z0-9_-]+)\\./", $line, $g)) {
                foreach ($g[1] as $group) {
                    $groupScopes[$group][$s[1]] = ($groupScopes[$group][$s[1]] ?? 0) + 1;
                }
            }
        }
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
    $stats = ['texts' => 0, 'hits' => 0, 'ambiguous' => 0, 'changed' => 0, 'dropped' => 0];
    $review = [];
    foreach (glob("{$root}/lang/{$locale}/*.php") as $path) {
        $group = basename($path, '.php');
        if (in_array($group, ['glossary', 'glossary-detail'], true)) {
            continue;   // 팝업 글 자체 — 본문에서 감싸지 않는다
        }
        $scopes = $groupScopes[$group] ?? [];
        arsort($scopes);
        // Blade 에 scope 가 없으면 PHP 가 정하는 화면 범위(DYNAMIC_SCOPES), 그다음 그룹 이름이 화면 이름인지 본다(git 은 Git::inline 이 PHP 에서 scope 'git' 을 넘긴다)
        $scope = array_key_first($scopes) ?? DYNAMIC_SCOPES[$group] ?? (isset($scopeNames[$group]) ? $group : null);
        $page = ['ids' => [], 'topics' => []];
        $shownIds = [];
        foreach (Arr::dot((array) require $path) as $key => $text) {
            if (! is_string($text) || ! preg_match('/\p{L}{3}/u', $text)) {
                continue;
            }
            $key = "{$group}.{$key}";
            $stats['texts']++;
            $insertText->execute([$key, $group, $scope, $text]);
            $insertFts->execute([$key, $text]);
            foreach (Glossary::resolve($text, $locale, $scope, $page) as $hit) {
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
                $insertHit->execute([$key, $group, $scope, $hit['surface'], $hit['offset'], $hit['term'], $legacy,
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

    printf("색인 %s — 문장 %d · 잡힌 자리 %d · 뜻이 여럿/근거 필요 %d (예전과 다른 뜻 %d · 근거 없어 감싸지 않음 %d)\n", substr($file, strlen($root) + 1), $stats['texts'], $stats['hits'], $stats['ambiguous'], $stats['changed'], $stats['dropped']);
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
