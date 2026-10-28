<?php

/*
 * 용어 뜻 색인 — 사이트의 모든 번역 문장에서 사전 용어가 잡힌 자리와 문맥으로 고른 뜻을 SQLite 데이터베이스에 넣고 보고한다(SSOT 23절 "용어 문맥 뜻").
 * 같은 표기가 화면마다 다른 뜻인지(branch: Git 갈래 · 학문의 갈래), 문맥으로 고른 결과가 맞는지 한 번에 훑고, 나중에 낱말 하나로 찾아본다.
 *
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php build [언어=en]          # 색인을 만들고 요약·검토 목록을 보인다
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php query <언어> <id|표기>    # 그 용어·표기가 잡힌 모든 문장과 고른 뜻
 *   bash $POPUP/scripts/sonub/run.sh popup-index.php senses [언어=en]          # 뜻이 여럿인 표기 → 후보 id 와 문맥 신호(뜻 목록)
 *
 * 데이터베이스: storage/app/popup-index/<언어>.sqlite (git 에 안 들어간다). sqlite3 로 직접 물어도 된다 —
 *   terms(id, category, term, short, scope, context, cues)   사전 — 용어마다 표기·한 줄 뜻·문맥 신호
 *   surfaces(surface, candidates, ambiguous)                  표기 → 후보 뜻(뜻 목록 — 거꾸로 찾는 색인)
 *   texts(key, grp, scope, text) + texts_fts(FTS5)            번역 문장 — 낱말로 전문 검색
 *   hits(key, surface, offset, chosen, legacy, candidates, margin, sentence)
 *     chosen  문맥으로 고른 뜻(없으면 NULL — 근거가 없어 감싸지 않음) · legacy  문맥을 보지 않던 예전 결과(첫 후보)
 *     margin  1등과 2등 후보의 점수 차(후보 하나면 NULL) — 10 미만이면 가까운 문맥(문장·글·주제)이 같아 페이지 문맥·등록 순서로 갈렸다
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
    CREATE TABLE hits (key TEXT, surface TEXT, offset INTEGER, chosen TEXT, legacy TEXT, candidates TEXT, margin INTEGER, sentence TEXT);
    CREATE INDEX hits_chosen ON hits(chosen); CREATE INDEX hits_surface ON hits(surface);');

app()->setLocale($locale);
$db->beginTransaction();
$insertTerm = $db->prepare('INSERT INTO terms VALUES (?, ?, ?, ?, ?, ?, ?)');
foreach (Glossary::wordIds() as $id) {
    $insertTerm->execute([$id, $terms[$id]['category'], Glossary::term($id, $locale), Glossary::short($id, $locale), implode(',', (array) ($terms[$id]['scope'] ?? [])),
        (int) ($terms[$id]['context'] ?? false), implode(',', $terms[$id]['cues'] ?? $terms[$id]['related'] ?? [])]);
}
$senses = Glossary::senses($locale);
$insertSurface = $db->prepare('INSERT INTO surfaces VALUES (?, ?, 1)');
foreach ($senses as $surface => $candidates) {
    $insertSurface->execute([$surface, implode(',', $candidates)]);
}

$insertText = $db->prepare('INSERT INTO texts VALUES (?, ?, ?, ?)');
$insertFts = $db->prepare('INSERT INTO texts_fts VALUES (?, ?)');
$insertHit = $db->prepare('INSERT INTO hits VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
$stats = ['texts' => 0, 'hits' => 0, 'ambiguous' => 0, 'changed' => 0, 'dropped' => 0];
$review = [];
foreach (glob("{$root}/lang/{$locale}/*.php") as $path) {
    $group = basename($path, '.php');
    if (in_array($group, ['glossary', 'glossary-detail'], true)) {
        continue;   // 팝업 글 자체 — 본문에서 감싸지 않는다
    }
    $scopes = $groupScopes[$group] ?? [];
    arsort($scopes);
    // Blade 에 scope 가 없으면 그룹 이름이 화면 이름인지 본다(git 은 Git::inline 이 PHP 에서 scope 'git' 을 넘긴다)
    $scope = array_key_first($scopes) ?? (isset($scopeNames[$group]) ? $group : null);
    $page = ['ids' => [], 'topics' => []];
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
            $ambiguous = count($ids) > 1 || $hit['term'] === null || ($terms[$legacy]['context'] ?? false);
            $sentence = sentence_around($text, $hit['offset'], $hit['surface']);
            $insertHit->execute([$key, $hit['surface'], $hit['offset'], $hit['term'], $legacy, json_encode(array_map(fn ($c) => $c['score'].($c['avoided'] ? '피함' : ($c['eligible'] ? '' : '×')), $hit['candidates']), JSON_UNESCAPED_UNICODE), $margin, $sentence]);
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

printf("색인 %s — 문장 %d · 잡힌 자리 %d · 뜻이 여럿/근거 필요 %d (예전과 다른 뜻 %d · 근거 없어 감싸지 않음 %d)\n", substr($file, strlen($root) + 1), $stats['texts'], $stats['hits'], $stats['ambiguous'], $stats['changed'], $stats['dropped']);
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
