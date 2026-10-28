<?php

/*
 * 화면 전체 점검 — page-crawl.py 가 저장한 HTML 을 읽어, 화면에 보이는 글에서 팝업이 빠진 전문 용어를 찾는다.
 * 번역 파일이 아니라 실제로 그려진 화면을 보므로, 감싸지 않은 문장·탭마다 group 이 겹쳐 사라진 팝업까지 잡는다.
 *
 * 실행(저장소 루트에서, page-crawl.py 다음):
 *   bash skills/popup/scripts/sonub/run.sh page-audit.php ko            # 모든 페이지
 *   bash skills/popup/scripts/sonub/run.sh page-audit.php ko /ko/appdev/server   # 한 페이지만 자세히
 *
 * 결과: storage/app/popup-pages/<언어>/report.md(페이지별) · candidates.tsv(사전에 없는 라틴 낱말 → 페이지 수) · text/<페이지>.txt(화면 글 — 팝업이 붙은 용어는 ⟦ ⟧, 링크·제목 글 포함)
 *   빠짐   사전 용어가 화면 본문(문단·목록·표 칸)에 있는데 그 탭(보이는 본문 한 덩어리) 안에서 한 번도 팝업이 아니다
 *   링크   링크·단추·제목 글에만 있는 사전 용어 — 곁에 <x-glossary.info> 나 data-term 을 달지 본다
 *   후보   사전에 없는 라틴 낱말(GET·JSON·useState …). 한글 전문 용어는 text/ 의 글을 읽고 고른다
 */

use App\Content\Glossary;
use Illuminate\Contracts\Console\Kernel;

$root = getcwd();
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$locale = $argv[1] ?? 'ko';
$only = $argv[2] ?? null;
define('POPUP_CONTEXT', $only !== null); // 한 페이지만 볼 때는 용어가 든 줄도 보인다
app()->setLocale($locale);
$dir = "storage/app/popup-pages/{$locale}";
$pages = array_filter(array_map('trim', file("{$dir}/pages.txt")));
if ($only !== null) {
    $pages = [$only];
}
@mkdir("{$dir}/text", 0777, true);

const SKIP_TAGS = ['script', 'style', 'pre', 'code', 'kbd', 'samp', 'textarea', 'svg', 'template', 'noscript', 'select', 'option', 'math'];
const INLINE_TAGS = ['a', 'button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'summary', 'legend', 'caption', 'th'];
const BLOCK_TAGS = ['p', 'li', 'td', 'th', 'dd', 'dt', 'div', 'section', 'article', 'figcaption', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'ul', 'ol', 'header', 'footer', 'aside', 'nav', 'details', 'summary', 'br', 'table', 'figure', 'label', 'small'];

/** 본문 → 탭(보이는 덩어리)마다 [본문 글, 링크·제목 글, 감싼 용어, data-term 용어]. */
function popupBuckets(DOMNode $node, string $bucket, bool $inline, array &$out): void
{
    foreach ($node->childNodes as $child) {
        if ($child instanceof DOMText) {
            $out[$bucket][$inline ? 'inline' : 'body'] .= $child->nodeValue;
            $out[$bucket]['show'] .= $child->nodeValue;

            continue;
        }
        if (! $child instanceof DOMElement) {
            continue;
        }
        $tag = strtolower($child->tagName);
        if (in_array($tag, SKIP_TAGS, true)) {
            continue;
        }
        $class = ' '.$child->getAttribute('class').' ';
        $here = $bucket;
        if ($child->hasAttribute('hidden') || str_contains($class, ' appdev-panel ') || $child->hasAttribute('data-tab-panel')) {
            $here = $child->getAttribute('id') ?: ($child->getAttribute('data-tab') ?: ($child->getAttribute('data-tab-panel') ?: 'hidden-'.spl_object_id($child)));
        }
        $out[$here] ??= ['body' => '', 'inline' => '', 'show' => '', 'wrapped' => [], 'marked' => []];
        if (str_contains($class, ' glossary-term ')) {
            $out[$here]['wrapped'][] = $child->getAttribute('data-term');
            $out[$here]['body'] .= ' ';
            $out[$here]['show'] .= '⟦'.$child->textContent.'⟧';

            continue;
        }
        if ($child->hasAttribute('data-term')) {
            $out[$here]['marked'][] = $child->getAttribute('data-term');
        }
        $block = in_array($tag, BLOCK_TAGS, true);
        if ($block) {
            $out[$here]['body'] .= "\n";
            $out[$here]['inline'] .= "\n";
            $out[$here]['show'] .= "\n";
        }
        popupBuckets($child, $here, $inline || in_array($tag, INLINE_TAGS, true), $out);
        if ($block) {
            $out[$here]['body'] .= "\n";
            $out[$here]['inline'] .= "\n";
            $out[$here]['show'] .= "\n";
        }
    }
}

/** 사전 용어 id → 잡힌 표기 */
function popupFind(string $text, string $locale, array $scopes): array
{
    $found = [];
    foreach ([null, ...$scopes] as $scope) {
        foreach (preg_split('/\n+/u', $text) as $line) {
            foreach (Glossary::segments($line, $locale, false, [], $scope) as $segment) {
                if ($segment['term'] !== null) {
                    $found[$segment['term']] ??= $segment['text'].(POPUP_CONTEXT ? ' «'.mb_substr(trim($line), 0, 50).'»' : '');
                }
            }
        }
    }

    return $found;
}

$known = collect(Glossary::ids())->flatMap(fn (string $id) => [...Glossary::surfaces($id, $locale), ...Glossary::surfaces($id, 'en')])
    ->flatMap(fn (string $s) => preg_split('/[\s()·,]+/u', mb_strtolower($s)))->filter()->flip()->all();
$scopesOf = [];
foreach (Glossary::ids() as $id) {
    $scopesOf[$id] = (array) ((new ReflectionClassConstant(Glossary::class, 'TERMS'))->getValue()[$id]['scope'] ?? []);
}

$report = "# 화면 용어 점검 ({$locale}) — ".date('Y-m-d H:i')."\n\n";
$candidates = [];
$totals = ['missed' => 0, 'pages' => 0];
foreach ($pages as $path) {
    $file = "{$dir}/html/".(preg_replace('/[^A-Za-z0-9._-]+/', '_', trim($path, '/')) ?: 'index').'.html';
    if (! is_file($file)) {
        continue;
    }
    $dom = new DOMDocument;
    libxml_use_internal_errors(true);
    $dom->loadHTML('<?xml encoding="utf-8"?>'.file_get_contents($file));
    $xp = new DOMXPath($dom);
    $main = $xp->query('//main[contains(concat(" ", @class, " "), " content ")]')->item(0) ?? $xp->query('//main')->item(0);
    if ($main === null) {
        continue;
    }
    $buckets = ['main' => ['body' => '', 'inline' => '', 'show' => '', 'wrapped' => [], 'marked' => []]];
    popupBuckets($main, 'main', false, $buckets);

    // 이 페이지가 쓰는 화면 범위(scope) — 감싼 용어의 scope 로 짐작한다
    $scopes = [];
    foreach ($buckets as $b) {
        foreach ($b['wrapped'] as $id) {
            foreach ($scopesOf[$id] ?? [] as $one) {
                $scopes[$one] = true;
            }
        }
    }
    $scopes = array_keys($scopes);

    $lines = [];
    $plain = '';
    foreach ($buckets as $name => $b) {
        $body = preg_replace('/[ \t\x{00A0}]+/u', ' ', $b['body']);
        $inline = preg_replace('/[ \t\x{00A0}]+/u', ' ', $b['inline']);
        // 탭 밖(머리·공통 부분)에서 감싼 용어는 모든 탭에 보이므로 탭에서 다시 감싸지 않아도 된다
        $have = array_flip([...$b['wrapped'], ...$b['marked'], ...($name === 'main' ? [] : $buckets['main']['wrapped'])]);
        $missed = array_diff_key(popupFind($body, $locale, $scopes), $have);
        $linkOnly = array_diff_key(popupFind($inline, $locale, $scopes), $have, $missed, popupFind($body, $locale, $scopes));
        $text = trim(preg_replace('/\n\s*\n+/u', "\n", preg_replace('/[ \t\x{00A0}]+/u', ' ', $b['show'])));
        if ($text === '' && $inline === '') {
            continue;
        }
        $plain .= "## {$name}\n{$text}\n\n";
        preg_match_all('/(?<![\p{L}\p{N}_\/.-])[A-Za-z][A-Za-z0-9+#]*(?:[.-][A-Za-z0-9+#]+)*(?![\p{L}\p{N}_\/])/u', $body.' '.$inline, $m);
        foreach (array_unique($m[0]) as $word) {
            if (mb_strlen($word) < 2 || isset($known[mb_strtolower($word)])) {
                continue;
            }
            $candidates[$word][$path] = true;
        }
        if ($missed || $linkOnly) {
            $lines[] = "- `{$name}` 빠짐: ".implode(', ', array_map(fn ($id, $s) => "{$s}={$id}", array_keys($missed), $missed))
                .($linkOnly ? ' · 링크·제목만: '.implode(', ', array_map(fn ($id, $s) => "{$s}={$id}", array_keys($linkOnly), $linkOnly)) : '');
            $totals['missed'] += count($missed);
        }
    }
    file_put_contents("{$dir}/text/".(preg_replace('/[^A-Za-z0-9._-]+/', '_', trim($path, '/')) ?: 'index').'.txt', $plain);
    $totals['pages']++;
    if ($lines) {
        $report .= "## {$path}\n".implode("\n", $lines)."\n\n";
    }
}

arsort($candidates);
uasort($candidates, fn ($a, $b) => count($b) <=> count($a));
$tsv = '';
foreach ($candidates as $word => $where) {
    $tsv .= $word."\t".count($where)."\t".implode(' ', array_slice(array_keys($where), 0, 6))."\n";
}
// 한 페이지만 볼 때는 전체 결과(report.md·candidates.tsv)를 덮지 않는다
if ($only === null) {
    file_put_contents("{$dir}/candidates.tsv", $tsv);
    file_put_contents("{$dir}/report.md", $report);
}
echo "페이지 {$totals['pages']}개 · 빠진 용어 {$totals['missed']}개 · 사전 밖 라틴 낱말 ".count($candidates)."개\n";
echo "→ {$dir}/report.md · candidates.tsv · text/\n";
if ($only !== null) {
    echo $report;
}
