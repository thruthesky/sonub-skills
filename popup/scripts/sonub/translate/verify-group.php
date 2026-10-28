<?php

/*
 * 번역 그룹 작업 파일 검사 — 작업 폴더의 {언어}.json 이 en.json 과 같은 모양(키·목록 길이)인가, 빈 값·자리표시자·코드가 맞는가.
 * 사전 항목(verify.php)이 아니라 lang/{언어}/{그룹}.php 하나를 통째로 옮길 때 쓴다(예: shell_advanced — 쉘 심화 주제).
 *
 *   bash $POPUP/scripts/sonub/run.sh translate/verify-group.php storage/app/popup-work/advanced ja zh …
 *
 * 코드 규칙 — 이름이 code 인 값은 명령이다.
 *   ko.json 의 그 코드에 한글이 없으면(번역할 글이 없는 명령) en 과 한 글자도 다르지 않아야 한다.
 *   한글이 있으면(따옴표 속 문장·예시 값) 그 언어로 바꿔도 되지만 — ko 가 아닌 언어에 한글이 남으면 안 되고,
 *   $변수·${…} 모양과 맨 앞 낱말(명령 이름)이 en 과 같아야 한다.
 */

$root = getcwd(); // 저장소 루트(컨테이너의 /app) — run.sh 가 표준 입력으로 넘겨 실행한다
$dir = $root.'/'.trim($argv[1] ?? '', '/');
$load = fn (string $locale) => json_decode(file_get_contents("{$dir}/{$locale}.json"), true, 512, JSON_THROW_ON_ERROR);
$en = $load('en');
$ko = $load('ko');

// \p{Hangul} 은 쓰지 않는다 — PCRE2 가 문자 체계 확장을 따라 、(U+3001) 같은 한중일 공용 문장부호까지 한글로 본다
$hangul = fn (string $s) => preg_match('/[\x{AC00}-\x{D7A3}\x{1100}-\x{11FF}\x{3130}-\x{318F}]/u', $s) === 1;
// $변수 모양 — ${이름 뒤의 기호(:- := :? 등)까지만 본다. 그 뒤(기본값·오류 문장)는 번역한다
$vars = function (string $s): string {
    preg_match_all('/\$\{[#!]?[A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]*\])?[:\/%#^,=?+\-]*|\$[A-Za-z_][A-Za-z0-9_]*|\$[0-9?#@!$]/', $s, $m);

    return implode(' ', $m[0]);
};
// 맨 앞 명령 이름(person[name]="…" 은 person[name]) — 여러 줄(히어독 본문)은 줄 수와 마지막 줄(EOF)을 본다
$head = fn (string $s) => str_contains($s, "\n")
    ? substr_count($s, "\n").'|'.substr($s, strrpos($s, "\n") + 1)
    : (preg_match('/^\s*[A-Za-z0-9_.:\-\[\]()*{}]+/', $s, $m) ? $m[0] : '');
$placeholders = function (string $s): string {
    preg_match_all('/(?<![\w$]):[a-z_]+/i', $s, $m);
    sort($m[0]);

    return implode(',', $m[0]);
};

/** en 과 같은 자리의 값을 차례로 비교한다 — 문제를 $problems 에 모은다 */
$walk = function ($enNode, $koNode, $xNode, string $path, string $locale, array &$problems) use (&$walk, $hangul, $vars, $head, $placeholders) {
    if (is_array($enNode)) {
        if (! is_array($xNode)) {
            $problems[] = "{$path}: 목록·묶음이어야 한다";

            return;
        }
        if (array_is_list($enNode) && count($enNode) !== count($xNode)) {
            $problems[] = "{$path}: 개수 ".count($xNode).' (en '.count($enNode).')';
        }
        foreach ($enNode as $k => $v) {
            if (! array_key_exists($k, $xNode)) {
                $problems[] = "{$path}.{$k}: 빠짐";

                continue;
            }
            $walk($v, $koNode[$k] ?? null, $xNode[$k], "{$path}.{$k}", $locale, $problems);
        }
        foreach (array_diff_key($xNode, $enNode) as $k => $v) {
            $problems[] = "{$path}.{$k}: en 에 없는 키";
        }

        return;
    }
    if (! is_string($xNode) || trim($xNode) === '') {
        $problems[] = "{$path}: 빈 값";

        return;
    }
    if (preg_match('/&(?:gt|lt|amp|quot|#\d+);/', $xNode)) {
        $problems[] = "{$path}: HTML 엔티티가 섞였다";
    }
    if (str_ends_with($path, '.code')) {
        $localized = is_string($koNode) && $hangul($koNode);
        if (! $localized && $xNode !== $enNode) {
            $problems[] = "{$path}: 코드가 en 과 다르다 — {$xNode}";
        } elseif ($localized && $locale !== 'ko' && $hangul($xNode)) {
            $problems[] = "{$path}: 코드에 한글이 남았다 — {$xNode}";
        } elseif ($localized && ($vars($xNode) !== $vars($enNode) || $head($xNode) !== $head($enNode)) && $locale !== 'ko') {
            $problems[] = "{$path}: 명령 이름·변수 모양이 en 과 다르다 — {$xNode}";
        }

        return;
    }
    if ($placeholders($xNode) !== $placeholders((string) $enNode)) {
        $problems[] = "{$path}: 자리표시자가 en 과 다르다";
    }
};

$fail = 0;
foreach (array_slice($argv, 2) as $locale) {
    if (! is_file("{$dir}/{$locale}.json")) {
        echo "{$locale}: 파일 없음\n";
        $fail++;

        continue;
    }
    try {
        $x = $load($locale);
    } catch (Throwable $e) {
        echo "{$locale}: JSON 오류 ".$e->getMessage()."\n";
        $fail++;

        continue;
    }
    $problems = [];
    $walk($en, $ko, $x, $locale, $locale, $problems);
    if ($problems) {
        $fail++;
        echo "{$locale}: 문제 ".count($problems)."개\n  ".implode("\n  ", array_slice($problems, 0, 40))."\n";
    } else {
        echo "{$locale}: 정상\n";
    }
}
exit($fail ? 1 : 0);
