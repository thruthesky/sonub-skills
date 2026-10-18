<?php

/*
 * 용어 팝업 점검 — 화면(Blade)·번역 그룹·번역 키 하나의 문장에서 사전 용어가 어디에 잡히는지 보인다.
 * "/popup <화면>" 작업의 첫걸음이다: 이미 팝업이 붙은 문장, 감싸기만 하면 붙는 문장, 사전에 없어 새로 넣어야 할 후보를 가른다.
 *
 * 실행(저장소 루트에서):
 *   bash $POPUP/scripts/sonub/run.sh popup-audit.php resources/views/ai/build.blade.php ko
 *   bash $POPUP/scripts/sonub/run.sh popup-audit.php aib ko        # 번역 그룹 전체
 *   bash $POPUP/scripts/sonub/run.sh popup-audit.php ai.build_concept_p1 en   # 번역 키 하나
 *   bash $POPUP/scripts/sonub/run.sh popup-audit.php shell ko shell            # 셋째 인자 = 화면 범위(scope) — 그 화면 전용 낱말까지
 *
 * 표시
 *   [감쌈]      <x-glossary.text :text="__('키')"> 로 이미 감싼 문장 — 팝업이 뜬다
 *   [감쌀 수 있음] 사전 용어가 있는데 감싸지 않은 문장 — 감싸면 팝업이 붙는다(<a>·<button>·제목 안이면 감싸지 않는다)
 *   [용어 없음]  사전 용어가 하나도 없는 문장 — 새 용어·문장 팝업이 필요한지 본다
 *   [용어]       문장 속 [표기=용어id]. 같은 용어는 컴포넌트 한 번 안에서 첫 등장만 감싼다(once) — 화면과 같게 보인다
 *   후보          사전에 없는 영문 약어·낙타 표기(API·JSON·useState 같은 것). 한글 전문 용어는 사람이 문장을 읽고 고른다
 */

use App\Content\Glossary;
use Illuminate\Support\Facades\Lang;

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$target = $argv[1] ?? '';
$locale = $argv[2] ?? 'ko';
$scope = $argv[3] ?? null;   // <x-glossary.text scope="…"> 와 같은 값
if ($target === '') {
    fwrite(STDERR, "쓰는 법: php popup-audit.php <Blade 경로 | 번역 그룹 | 번역 키> [언어] [화면 범위]\n");
    exit(2);
}
if (! array_key_exists($locale, config('locales.locales'))) {
    fwrite(STDERR, "없는 언어: {$locale}\n");
    exit(2);
}
app()->setLocale($locale);

/** 문장을 [표기=id] 로 표시한 한 줄과 잡힌 용어 id 목록. */
function popupMarks(string $text, string $locale, ?string $scope = null): array
{
    $ids = [];
    $line = '';
    foreach (Glossary::segments($text, $locale, true, [], $scope) as $segment) {
        if ($segment['term'] === null) {
            $line .= $segment['text'];
        } else {
            $line .= "[{$segment['text']}={$segment['term']}]";
            $ids[] = $segment['term'];
        }
    }

    return [preg_replace('/\s+/u', ' ', trim($line)), $ids];
}

/** 사전에 없는 영문 약어·낙타 표기. 이미 어떤 용어의 표기인 것은 뺀다. */
function popupCandidates(string $text, string $locale): array
{
    static $known = null;
    $known ??= collect(Glossary::ids())
        ->flatMap(fn (string $id) => Glossary::surfaces($id, $locale))
        ->map(fn (string $s) => mb_strtolower($s))
        ->flip()
        ->all();

    preg_match_all('/(?<![\p{L}\p{N}])(?:[A-Z]{2,}[A-Za-z0-9]*|[a-z]+[A-Z][A-Za-z0-9]*)(?![\p{L}\p{N}])/u', $text, $m);

    return array_values(array_unique(array_filter($m[0], fn (string $w) => ! isset($known[mb_strtolower($w)]))));
}

/** 번역 값(배열이면 펼친다) → [키 => 문장]. */
function popupFlatten(array $values, string $prefix): array
{
    $out = [];
    foreach ($values as $key => $value) {
        if (is_array($value)) {
            $out += popupFlatten($value, "{$prefix}{$key}.");
        } elseif (is_string($value)) {
            $out["{$prefix}{$key}"] = $value;
        }
    }

    return $out;
}

$rows = [];      // [키, 상태, 표시한 문장, 후보]
$dynamic = [];   // Blade 의 동적 키 — 스크립트가 풀 수 없다
$used = [];      // 이 대상에서 잡힌 용어 id

if (is_file($root.'/'.$target)) {
    // ── Blade 파일 ──
    $blade = file_get_contents($root.'/'.$target);
    preg_match_all("/(?:__|trans|@lang)\\(\\s*'([a-z0-9_]+\\.[a-zA-Z0-9_.]+)'\\s*([,)])/", $blade, $m, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
    preg_match_all("/(?:__|trans|@lang)\\(\\s*'([a-z0-9_.]+)'\\s*\\./", $blade, $d);
    $dynamic = array_values(array_unique($d[1]));
    $seen = [];
    foreach ($m as $match) {
        $key = $match[1][0];
        $offset = $match[0][1];
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        if (! Lang::has($key, $locale, false) || ! is_string(__($key, [], $locale))) {
            continue;
        }
        // 바로 앞이 <x-glossary.text :text=" 이면 감싼 것이다
        $before = substr($blade, max(0, $offset - 40), min(40, $offset));
        $wrapped = (bool) preg_match('/<x-glossary\.text\s+:text="\s*$/', $before);
        $rows[] = [$key, $wrapped];
    }
} elseif (str_contains($target, '.')) {
    // ── 번역 키 하나 ──
    $rows[] = [$target, null];
} else {
    // ── 번역 그룹 ──
    $file = $root."/lang/{$locale}/{$target}.php";
    if (! is_file($file)) {
        fwrite(STDERR, "번역 그룹이 없다: lang/{$locale}/{$target}.php\n");
        exit(2);
    }
    foreach (array_keys(popupFlatten(require $file, "{$target}.")) as $key) {
        $rows[] = [$key, null];
    }
}

$count = ['감쌈' => 0, '감쌀 수 있음' => 0, '용어 있음' => 0, '용어 없음' => 0];
foreach ($rows as [$key, $wrapped]) {
    $text = (string) __($key, [], $locale);
    if (trim($text) === '' || str_contains($text, '<')) {
        // 태그가 든 번역 문장은 <x-glossary.text> 가 태그를 글자로 보인다 — 따로 표시한다
        echo "[태그 있음]   {$key}: 태그가 든 문장은 <x-glossary.text> 로 감싸지 않는다(content.md \"태그가 든 문장\")\n";

        continue;
    }
    [$line, $ids] = popupMarks($text, $locale, $scope);
    $candidates = popupCandidates($text, $locale);
    $used = array_merge($used, $ids);
    $state = match (true) {
        $wrapped === true => '감쌈',
        $ids === [] => '용어 없음',
        $wrapped === false => '감쌀 수 있음',
        default => '용어 있음',
    };
    $count[$state]++;
    printf("[%s] %s: %s%s\n", $state, $key, $line, $candidates ? '   후보: '.implode(', ', $candidates) : '');
}

echo "\n── 요약({$locale}) ──\n";
foreach ($count as $state => $n) {
    if ($n > 0) {
        echo "{$state}: {$n}\n";
    }
}
$used = array_count_values($used);
arsort($used);
echo '잡힌 용어: '.($used === [] ? '없음' : implode(', ', array_map(fn ($id, $n) => "{$id}×{$n}", array_keys($used), $used)))."\n";
if ($dynamic !== []) {
    echo '동적 키(직접 확인): '.implode(', ', array_map(fn ($k) => "'{$k}'.…", $dynamic))."\n";
}
