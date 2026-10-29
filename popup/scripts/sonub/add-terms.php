<?php

/*
 * 팝업 내용을 17개 언어 번역 파일(lang/{언어}/glossary.php)에 한 번에 넣는다 — 손으로 17개 파일을 열다 한 언어를 빠뜨리는 일을 막는다.
 * 이전 사이트 .claude/skills/glossary/scripts/add-terms.mjs 의 역할을 옮겼다.
 *
 * 실행(저장소 루트에서):
 *   bash $POPUP/scripts/sonub/run.sh add-terms.php /app/storage/app/popup-terms.json            # 넣기
 *   bash $POPUP/scripts/sonub/run.sh add-terms.php /app/storage/app/popup-terms.json --dry-run  # 검사만
 *   (JSON 은 컨테이너가 읽을 수 있는 곳에 둔다 — 저장소 안 storage/app/ 에 두고, 넣은 뒤 지운다)
 *
 * 입력 JSON
 *   {
 *     "terms": {                       ← 용어 항목. 키 이름은 glossary.<id 의 하이픈을 밑줄로>_<필드>
 *       "sampling": {
 *         "en": { "term": "Sampling", "short": "…", "long": "…", "easy": "…", "example": "…" },
 *         "ko": { … }, …  17개 언어 모두
 *       }
 *     },
 *     "aliases": {                     ← 이미 있는 용어에 그 언어만의 다른 표기를 더할 때(선택) — 값은 그 키의 전체 값
 *       "shell-argument": { "ko": "[대상], 대상(인자)", "de": "Ziel" }   언어마다 있어도 없어도 된다. 기존 별칭을 모두 품어야 한다(더하기만)
 *     },
 *     "keys": {                        ← 팝업 문구처럼 용어가 아닌 키(선택)
 *       "easy_label": { "en": "In plain words", "ko": "쉽게 말하면", … 17개 언어 모두 }
 *     }
 *   }
 *
 * 검사 — 하나라도 어기면 아무 파일도 쓰지 않는다
 *   17개 언어가 모두 있다 · 언어마다 필드가 en 과 같다 · 빈 값이 없다 · 자리표시자(:name)가 en 과 같다
 *   필드는 term·short·long(필수) + easy·example(선택) + aliases(그 언어만의 다른 표기 — 언어마다 있어도 없어도 된다) · 용어 id 는 소문자·숫자·하이픈
 *   example 의 줄 수와 줄 맨 앞 `코드` 가 en 과 같다(코드는 번역하지 않는다 — Glossary::exampleLines)
 *   이미 있는 키를 다른 값으로 덮으려 하면 --overwrite 없이는 멈춘다(요청 없이 기존 번역을 고쳐 쓰지 않는다 — AGENTS.md)
 *
 * 쓰기 — 파일마다 원래 모양(return array ( 두 칸 · return [ 네 칸)을 지키고 키를 알파벳 순서로 둔다.
 *   쓰기 전에 원래 파일을 같은 규칙으로 다시 그려 한 글자도 다르지 않은지 확인한다 — 다르면 그 파일을 건드리지 않고 멈춘다.
 */

use App\Content\Glossary;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Lang;

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

const TERM_FIELDS = ['term', 'short', 'long', 'easy', 'example', 'aliases'];
const TERM_REQUIRED = ['term', 'short', 'long'];
/** 언어마다 있어도 없어도 되는 필드 — 그 언어의 본문에만 있는 다른 표기 */
const TERM_LOCAL = ['aliases'];

$path = $argv[1] ?? '';
$dry = in_array('--dry-run', $argv, true);
$overwrite = in_array('--overwrite', $argv, true);
if ($path === '' || ! is_file($path)) {
    fwrite(STDERR, "쓰는 법: php add-terms.php <입력.json> [--dry-run] [--overwrite]\n");
    exit(2);
}
$input = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
$locales = array_keys(config('locales.locales'));
$errors = [];
$placeholders = function (string $text): string {
    preg_match_all('/:[a-z_]+/i', $text, $m);
    sort($m[0]);

    return implode(',', $m[0]);
};

// 넣을 키 → [언어 => 값]
$additions = [];
$localAdditions = [];   // 언어마다 있어도 없어도 되는 키 → [언어 => 값]
foreach ($input['terms'] ?? [] as $id => $byLocale) {
    if (! preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $id)) {
        $errors[] = "용어 id 는 소문자·숫자·하이픈만: {$id}";

        continue;
    }
    if (! Glossary::has($id)) {
        echo "알림  {$id} 는 아직 App\\Content\\Glossary::TERMS 에 없다 — 번역을 넣은 뒤 TERMS 에도 넣는다\n";
    }
    $fields = array_values(array_diff(array_keys($byLocale['en'] ?? []), TERM_LOCAL));
    foreach (TERM_REQUIRED as $required) {
        if (! in_array($required, $fields, true)) {
            $errors[] = "{$id}: en 에 필수 필드 {$required} 가 없다";
        }
    }
    foreach (array_diff($fields, TERM_FIELDS) as $unknown) {
        $errors[] = "{$id}: 모르는 필드 {$unknown}(쓸 수 있는 것: ".implode('·', TERM_FIELDS).')';
    }
    foreach ($fields as $field) {
        $key = str_replace('-', '_', $id).'_'.$field;
        $additions[$key] = array_map(fn ($values) => $values[$field] ?? null, $byLocale);
    }
    // 그 언어만의 표기 — 있는 언어에만 넣는다(모든 언어에 있어야 하는 검사에서 뺀다)
    foreach (TERM_LOCAL as $field) {
        $key = str_replace('-', '_', $id).'_'.$field;
        foreach ($byLocale as $locale => $values) {
            if (isset($values[$field]) && trim((string) $values[$field]) !== '') {
                $localAdditions[$key][$locale] = $values[$field];
            }
        }
    }
    // 예시의 코드는 번역하지 않는다 — 줄 수와 줄 맨 앞 `코드` 가 en 과 같아야 한다
    $codes = fn ($values) => array_column(Glossary::exampleLines((string) ($values['example'] ?? '')), 'code');
    foreach ($locales as $locale) {
        if (isset($byLocale[$locale]['example'], $byLocale['en']['example']) && $codes($byLocale[$locale]) !== $codes($byLocale['en'])) {
            $errors[] = "{$id}: {$locale} 예시의 코드(줄 맨 앞 `…`)나 줄 수가 en 과 다르다";
        }
    }
    foreach ($locales as $locale) {
        $got = array_values(array_diff(array_keys($byLocale[$locale] ?? []), TERM_LOCAL));
        sort($got);
        $want = $fields;
        sort($want);
        if ($got !== $want) {
            $errors[] = "{$id}: {$locale} 의 필드가 en 과 다르다(".implode('·', $got).' ≠ '.implode('·', $want).')';
        }
    }
}
foreach ($input['keys'] ?? [] as $key => $byLocale) {
    $additions[$key] = $byLocale;
}
// 이미 있는 용어의 그 언어만의 표기 — 더하기만 한다(기존 별칭을 빼는 값이면 --overwrite 없이는 멈춘다)
$aliasSplit = fn (string $v) => preg_split('/\s*(?:[，、]|(?<!\d),|,(?!\d))\s*/u', trim($v), -1, PREG_SPLIT_NO_EMPTY) ?: []; // 숫자 사이 쉼표(44,100Hz)는 나누지 않는다 — Glossary::surfaces 와 같게
$aliasOnly = [];
foreach ($input['aliases'] ?? [] as $id => $byLocale) {
    if (! Glossary::has($id)) {
        $errors[] = "aliases: {$id} 는 TERMS 에 없는 용어다";

        continue;
    }
    $key = str_replace('-', '_', $id).'_aliases';
    foreach ($byLocale as $locale => $value) {
        if (! in_array($locale, $locales, true) || ! is_string($value) || trim($value) === '') {
            $errors[] = "aliases: {$id}.{$locale} 값이 없거나 사이트 언어가 아니다";

            continue;
        }
        $old = Lang::has('glossary.'.$key, $locale, false) ? (string) __('glossary.'.$key, [], $locale) : '';
        if (! $overwrite && array_diff($aliasSplit($old), $aliasSplit($value)) !== []) {
            $errors[] = "aliases: {$id}.{$locale} 가 기존 별칭({$old})을 빠뜨렸다 — 기존 값에 이어 붙인 전체 값을 쓴다";

            continue;
        }
        $localAdditions[$key][$locale] = $value;
        $aliasOnly[$key] = true;
    }
}

foreach ($additions as $key => $byLocale) {
    foreach ($locales as $locale) {
        $value = $byLocale[$locale] ?? null;
        if (! is_string($value) || trim($value) === '') {
            $errors[] = "{$key}: {$locale} 값이 없거나 비었다";
        } elseif (isset($byLocale['en']) && is_string($byLocale['en']) && $placeholders($value) !== $placeholders($byLocale['en'])) {
            $errors[] = "{$key}: {$locale} 의 자리표시자가 en 과 다르다";
        }
    }
    foreach (array_diff(array_keys($byLocale), $locales) as $extra) {
        $errors[] = "{$key}: 사이트 언어가 아닌 {$extra}";
    }
}

/** 파일의 원래 모양 그대로 다시 그린다 — return array ( 는 두 칸, return [ 는 네 칸 들여쓰기. */
function glossaryRender(array $values, bool $arrayStyle): string
{
    $quote = fn (string $s) => "'".str_replace(['\\', "'"], ['\\\\', "\\'"], $s)."'";
    $indent = $arrayStyle ? '  ' : '    ';
    $out = "<?php\n\nreturn ".($arrayStyle ? 'array (' : '[')."\n";
    foreach ($values as $key => $value) {
        $out .= $indent.$quote((string) $key).' => '.$quote((string) $value).",\n";
    }

    return $out.($arrayStyle ? ');' : '];')."\n";
}

/**
 * 손으로 고친 파일(다시 그리면 모양이 달라지는 파일)에 넣기 — 기존 항목 블록은 글자 그대로 두고, 바뀐 키만 그 자리에서 바꾸고
 * 새 키는 알파벳 순서상 제자리에 끼운다. 결과를 PHP 로 다시 읽어 $next 와 똑같을 때만 돌려준다(아니면 null).
 */
function glossarySplice(string $source, array $current, array $next, bool $arrayStyle): ?string
{
    $indent = $arrayStyle ? '  ' : '    ';
    $open = $arrayStyle ? "return array (\n" : "return [\n";
    $close = $arrayStyle ? ");\n" : "];\n";
    $start = strpos($source, $open);
    $end = strrpos($source, $close);
    if ($start === false || $end === false) {
        return null;
    }
    $head = substr($source, 0, $start + strlen($open));
    $body = substr($source, $start + strlen($open), $end - $start - strlen($open));
    $blocks = preg_split("/(?=^{$indent}'(?:[^'\\\\]|\\\\.)*' => )/m", $body, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    $keyed = [];
    foreach ($blocks as $block) {
        if (! preg_match("/^{$indent}'((?:[^'\\\\]|\\\\.)*)' => /", $block, $m)) {
            return null;
        }
        $keyed[] = [stripcslashes(str_replace("\\'", "'", $m[1])), $block];
    }
    if (array_column($keyed, 0) !== array_map('strval', array_keys($current))) {
        return null;
    }
    $quote = fn (string $s) => "'".str_replace(['\\', "'"], ['\\\\', "\\'"], $s)."'";
    $line = fn (string $key) => $indent.$quote($key).' => '.$quote((string) $next[$key]).",\n";
    $new = array_values(array_diff(array_map('strval', array_keys($next)), array_column($keyed, 0)));
    sort($new, SORT_STRING);
    $out = '';
    foreach ($keyed as [$key, $block]) {
        while ($new !== [] && strcmp($new[0], $key) < 0) {
            $out .= $line(array_shift($new));
        }
        $out .= ($next[$key] ?? null) === ($current[$key] ?? null) ? $block : $line($key);
    }
    foreach ($new as $key) {
        $out .= $line($key);
    }
    $result = $head.$out.substr($source, $end);
    $tmp = tempnam(sys_get_temp_dir(), 'glossary');
    file_put_contents($tmp, $result);
    $back = require $tmp;
    unlink($tmp);
    ksort($back, SORT_STRING);
    $want = $next;
    ksort($want, SORT_STRING);

    return $back === $want ? $result : null;
}

$plans = [];
foreach ($locales as $locale) {
    $file = $root."/lang/{$locale}/glossary.php";
    $source = file_get_contents($file);
    $current = require $file;
    $arrayStyle = str_starts_with(ltrim(substr($source, 5)), 'return array (');
    $handEdited = glossaryRender($current, $arrayStyle) !== $source;
    $next = $current;
    $changed = 0;
    foreach ($additions as $key => $byLocale) {
        $value = $byLocale[$locale] ?? null;
        if (! is_string($value)) {
            continue;
        }
        if (isset($current[$key]) && $current[$key] !== $value && ! $overwrite) {
            $errors[] = "lang/{$locale}/glossary.php {$key} 가 이미 다른 값으로 있다 — 고쳐 쓰려면 --overwrite";

            continue;
        }
        if (($current[$key] ?? null) !== $value) {
            $next[$key] = $value;
            $changed++;
        }
    }
    foreach ($localAdditions as $key => $byLocale) {
        $value = $byLocale[$locale] ?? null;
        if ($value === null || ($current[$key] ?? null) === $value) {
            continue;
        }
        if (isset($current[$key]) && ! $overwrite && ! isset($aliasOnly[$key])) {
            $errors[] = "lang/{$locale}/glossary.php {$key} 가 이미 다른 값으로 있다 — 고쳐 쓰려면 --overwrite";

            continue;
        }
        $next[$key] = $value;
        $changed++;
    }
    ksort($next, SORT_STRING);
    // 다시 그리면 모양이 달라지는 파일(누가 손으로 고친 파일)은 기존 블록을 그대로 두고 끼워 넣는다
    $content = $handEdited ? glossarySplice($source, $current, $next, $arrayStyle) : glossaryRender($next, $arrayStyle);
    if ($content === null) {
        $errors[] = "lang/{$locale}/glossary.php 에 기존 모양을 지키며 넣을 수 없다 — 손으로 넣는다";

        continue;
    }
    $plans[$locale] = [$file, $content, $changed];
}

if ($errors !== []) {
    foreach ($errors as $error) {
        echo "오류  {$error}\n";
    }
    echo "아무 파일도 쓰지 않았다.\n";
    exit(1);
}

foreach ($plans as $locale => [$file, $content, $changed]) {
    if (! $dry && $changed > 0) {
        file_put_contents($file, $content);
    }
    echo ($dry ? '검사  ' : '씀    ')."lang/{$locale}/glossary.php — 키 {$changed}개\n";
}
echo $dry ? "검사만 했다(--dry-run). 파일은 그대로다.\n" : "끝. 이어서 popup-check.php 와 번역 검사를 돌린다.\n";
