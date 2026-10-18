# 스피커 · 마이크 — DeepSeek 와 Supertonic

팝업 음성의 설계와 청사진 코드다. **2026-09-27 에는 아직 없다(⬜).** 처음 만들 때 이 문서대로 만들고, 만든 뒤에는 청사진을 실제 코드로 바꾼다.
`SpeechText` 의 코드는 4개 언어 표본으로 실제로 돌려 확인했다(아래 "발화 글 정리"). 나머지 청사진은 main 의 리엔 코드(`Lyen\MessageController`·`GenerateLyenReply`·`lyen.js`·`page-guide.js`)와 같은 틀로 썼지만 아직 돌려 보지 않았다 — 테스트로 확인하며 만든다.

## 목차

- [핵심 개념](#핵심-개념)
- [SSOT 초안 — 먼저 승인받는다](#ssot-초안--먼저-승인받는다)
- [흐름](#흐름)
- [파일 지도](#파일-지도)
- [설정](#설정)
- [라우트](#라우트)
- [GlossaryVoice — 캐시 키·브라우저 설정](#glossaryvoice--캐시-키브라우저-설정)
- [VoiceController](#voicecontroller)
- [GenerateGlossarySpeech — 큐 잡](#generateglossaryspeech--큐-잡)
- [지침(시스템 프롬프트)](#지침시스템-프롬프트)
- [발화 글 정리 — SpeechText](#발화-글-정리--speechtext)
- [브라우저 — 음성 세션](#브라우저--음성-세션)
- [상태와 문구](#상태와-문구)
- [조용한 실패를 막는다](#조용한-실패를-막는다)
- [테스트](#테스트)

## 핵심 개념

| 버튼 | 하는 일 |
| --- | --- |
| 🔊 **스피커**(머리, 켜기/끄기) | 기본 켬. 켜져 있으면 팝업이 열릴 때 리엔이 이 낱말을 **귀로 듣기 좋은 말로** 설명한다. 끄면 멈추고 다음 팝업부터 말하지 않는다 |
| 🎤 **말로 묻기**(발) | 받아 적은 질문을 **이 팝업 내용을 지침에 실어** DeepSeek 에 묻고, 답을 자막으로 보이며 읽는다 |

1. **팝업 글을 그대로 읽지 않는다.** 팝업 문장은 눈으로 읽는 글이다(괄호·기호·명사 나열). 팝업 내용을 시스템 지침의 "근거"로 싣고 DeepSeek 가 말하기 좋은 2~4문장을 새로 쓴다. 눈으로 읽는 글과 귀로 듣는 말은 좋은 문장이 다르고, 그 차이는 왕초보일수록 크다(이전 사이트 규칙).
2. **마이크 질문도 팝업에 묶는다.** "그럼 이건 왜 필요해요?" 같은 대명사 질문이 그 낱말에 대한 답으로 돌아오게 한다.
3. **Supertonic 이 부드럽게 읽는 글** — 지침이 말하기 규칙을 걸고, 서버의 `SpeechText` 가 기호를 걷어내고 문장 경계에서 청크를 묶고, 브라우저가 **한 번에** `speak()` 한다. 엔진은 청크를 모두 합성해 0.3초 무음으로 이은 WAV 하나를 재생하므로, 한 번에 넘긴 글은 끊김 없이 이어진다.
4. **스피커 켜기·끄기는 사이트 하나의 음성 설정**이다 — 챗봇·페이지 안내와 같은 `sonub-lyen-voice-enabled`(`voiceEnabled()`·`setVoiceEnabled()`, SSOT 23절 "페이지 안내": "음성 켜기·끄기는 챗봇과 같은 설정이다(기본 켬)").
5. **설명 발화 글은 모두가 함께 쓰는 캐시다** — 같은 팝업·같은 언어면 두뇌를 다시 부르지 않는다. 그래서 **설명 지침에는 회원 이름 같은 개인 값을 넣지 않는다**(넣으면 다른 회원에게 남의 이름이 들린다). 이름은 질문 답에만 쓴다.
6. **두뇌는 큐에서** — 웹 요청은 기다리지 않고 202 로 답하고, 잡이 DeepSeek 를 부른 뒤 개인 실시간 채널(`stream:#회원`, kind `glossary`)로 결과를 보낸다. 실시간이 안 되면 브라우저가 결과를 폴링한다(SONUB-DESIGN "LLM").

## SSOT 초안 — 먼저 승인받는다

팝업 음성 규정은 SSOT 에 없다. 구현 전에 아래를 사용자에게 보여 승인받고, **SONUB-SSOT.md 23절 "리엔 음성" 표에 한 줄**로 넣은 뒤 `config/glossary.php` 를 만든다(숫자가 SSOT 와 설정에서 같아야 한다 — AGENTS.md).

| 규정 | 내용 | 설정 |
| --- | --- | --- |
| 용어 팝업 | 화면의 용어·문장·메뉴 설명 팝업에 스피커와 마이크를 둔다. 스피커는 챗봇·페이지 안내와 같은 음성 설정이다(기본 켬) — 켜져 있으면 팝업이 열릴 때(마우스로 열면 0.7초 머문 뒤) 리엔이 설명한다. 설명은 팝업 글을 그대로 읽지 않고, 팝업 내용을 지침에 실어 두뇌가 귀로 듣기 좋은 2~4문장을 새로 쓴다. 같은 팝업·같은 언어의 설명은 30일 동안 다시 쓴다(개인 정보를 넣지 않는다). 마이크로 물으면 팝업 내용을 지침에 실어 답한다(질문 300자). 두뇌를 쓰므로 로그인한 정상 회원만 — 요청 제한·하루 한도·시험 중 거절은 "인공지능 생성"과 같고 1분 10번을 챗봇·바이브 코딩과 함께 센다(저장된 설명을 받아 가는 것은 세지 않는다). 손님은 로그인 안내를 본다. 두뇌가 실패하면 설명은 사전 문장을 읽고, 질문은 실패를 알린다. 소리 내지 못하는 언어에서는 스피커를 두지 않고 질문의 답은 자막만 보인다 | `glossary.voice.*` |

승인 때 사용자에게 **고를 수 있는 것**을 함께 묻는다: 머무는 시간(0.7초), 캐시 기간(30일), 손님에게 저장된 설명만이라도 들려줄지(초안은 "안 된다" — SSOT 23절 "쓰는 사람"을 그대로 따른 것).

## 흐름

```
[팝업이 열림 — 스피커 켜짐, 소리 내는 언어(en·ko·ja·hi)]
  마우스로 열림 → dwell_ms(0.7초) 기다림 — 그사이 닫히면 아무것도 안 한다
  누르기·키보드·관련 용어 칩 → 곧바로
    → 손님이면 phase 'login' (요청 없음)
    → GET  /api/glossary/voice/{locale}/{term}      200 {text, lang} → 읽기  (두뇌·한도 안 씀)
                                                   204            → 아래
    → POST /api/glossary/voice {term, locale, mode:'explain'}
         200 {text, lang}        (그사이 누가 만들어 캐시됨) → 읽기
         202 {generationId}      → 잡 GenerateGlossarySpeech (큐 llm)
                                     → DeepSeek(system: 말하기 규칙 + 팝업 내용, user: 설명 요청)
                                     → SpeechText::clean → ::pack → 캐시(30일) → 결과 캐시(10분)
                                     → Centrifugo stream:#회원 {type:'done', kind:'glossary', generationId, status, text, lang}
                                 ← 실시간으로 받거나, 안 되면 GET /api/glossary/voice/result/{generationId} 폴링
    → speak(text, lang, 'glossary', {wait:true}) 한 번 → phase 'speaking' → 'idle'
       (자동 재생이 막혔으면 'blocked' — 스피커를 한 번 더 누르면 replayLast())

[🎤 말로 묻기]
  누름 → 손님이면 'login'
       → stopSpeaking() (자기 목소리를 받아 적지 않게) · 페이지 안내 멈춤 · SenseVoice 준비(최대 5초, 아니면 Web Speech)
       → 'starting' → onStart 에서야 'listening' (낙관적으로 켜지 않는다) — 받아 적는 중간 글은 자막에
       → onFinal(질문) → POST {term, locale, mode:'ask', question} → 202 → 위와 같이 기다림(캐시 없음)
       → 자막에 답 → 소리 내는 언어면 speak 한 번
```

## 파일 지도

| 역할 | 파일 | |
| --- | --- | --- |
| 설정 | `config/glossary.php` | ⬜ 새 파일 |
| 라우트(로그인) | `routes/web/glossary.php` — `routes/web.php` 가 `web/*.php` 를 glob 으로 싣는다 | ⬜ 새 파일 |
| 캐시 키·브라우저 설정 | `app/Content/GlossaryVoice.php` | ⬜ 새 파일 |
| 요청 | `app/Http/Controllers/Glossary/VoiceController.php` | ⬜ 새 파일 |
| 두뇌 호출(큐) | `app/Jobs/GenerateGlossarySpeech.php` | ⬜ 새 파일 |
| 지침 | `app/Llm/Prompts.php` 에 `GLOSSARY_VOICE`·`glossaryVoice()`·`glossaryVoiceTask()` | ⬜ 더하기 |
| 발화 글 정리 | `app/Lyen/SpeechText.php` | ⬜ 새 파일(코드 검증됨) |
| 브라우저 음성 세션 | `public/js/glossary.js` 에 더하기 | ⬜ |
| 팝업 틀·CSS | design.md "팝업 틀"·"CSS" | ⬜ |
| 문구 | `lang/*/glossary.php` 에 `voice_login` 새 키(17개 언어), 나머지는 기존 키 재사용 | ⬜ |
| 테스트 | `tests/Unit/SpeechTextTest.php` · `tests/Feature/GlossaryVoiceTest.php` | ⬜ |
| 쓰는 것(있음) | `App\Llm\ChatClient` · `App\Realtime\Centrifugo` · `App\Models\LlmUsage` · `App\Services\ExamService` · `/js/voice/index.js` · `/js/realtime.js` | ✅ |

## 설정

```php
<?php

// 용어 팝업 — SONUB-SSOT.md 23절 "리엔 음성"의 "용어 팝업" 줄이 이 값들을 가리킨다(값은 SSOT 와 같아야 한다).
// 두뇌의 한도(1분 10번·하루 토큰·질문 길이 밖의 요청 길이)는 config/llm.php 를 그대로 쓴다.
return [
    'voice' => [
        'dwell_ms' => 700,            // 마우스로 연 팝업은 이만큼 머문 뒤에 말한다 — 지나가는 마우스로 두뇌를 부르지 않게
        'max_output_tokens' => 600,   // 발화 글 상한 — 한국어·힌디어는 같은 내용에 토큰을 많이 써서 320 으로는 문장이 잘렸다(이전 사이트)
        'max_seconds' => 60,          // 두뇌 한 번을 기다리는 최대 시간(큐 잡)
        'question_max' => 300,        // 말로 물은 질문의 길이(글자)
        'cache_days' => 30,           // 같은 팝업·같은 언어의 설명 발화 글을 다시 쓰는 기간
        'result_seconds' => 600,      // 만든 발화 글을 폴링으로 가져갈 수 있는 시간
    ],
];
```

## 라우트

```php
<?php

use App\Http\Controllers\Glossary\VoiceController;
use Illuminate\Support\Facades\Route;

// 용어 팝업의 리엔 음성 — 스피커(설명)·마이크(질문). 두뇌를 쓰므로 로그인한 회원만(SONUB-SSOT.md 23절 "인공지능 생성").
// 뜻 JSON(routes/public/glossary.php)은 공개·캐시이고, 이것은 세션이 필요한 개인 요청이라 web 그룹에 둔다.
Route::middleware('auth')->prefix('/api/glossary/voice')->name('glossary.voice.')->group(function () {
    // 저장된 설명 발화 글 — 두뇌를 부르지 않으므로 1분 10번(llm)에 넣지 않는다
    Route::get('/{locale}/{term}', [VoiceController::class, 'cached'])
        ->whereIn('locale', array_keys(config('locales.locales')))->where('term', '[a-z0-9-]+')
        ->middleware('throttle:60,1')->name('cached');
    // 만들기 — 회원마다 1분에 config('llm.requests_per_minute') 번, 챗봇·바이브 코딩과 같은 limiter(llm)로 함께 센다
    Route::post('/', [VoiceController::class, 'store'])
        ->middleware('throttle:'.config('llm.requests_per_minute').',1,llm')->name('store');
    // 실시간이 안 될 때 결과를 가져간다
    Route::get('/result/{generation}', [VoiceController::class, 'result'])
        ->whereUuid('generation')->middleware('throttle:120,1')->name('result');
});
```

`/result/…` 는 `result` 가 언어 코드가 아니라서 위 `/{locale}/{term}` 에 잡히지 않는다.

## GlossaryVoice — 캐시 키·브라우저 설정

```php
<?php

namespace App\Content;

/**
 * 용어 팝업의 리엔 음성 — 캐시 키와 브라우저(glossary.js)가 쓰는 값.
 * 설명 발화 글은 모든 회원이 함께 쓰는 캐시다 — 팝업 내용이 바뀌면 키가 바뀌어 저절로 새로 쓴다.
 */
final class GlossaryVoice
{
    /** Supertonic 으로 소리 내는 언어면 그 언어, 아니면 null — 자막만(SONUB-SSOT.md 23절 "리엔 음성" 읽는 언어) */
    public static function ttsLang(string $locale): ?string
    {
        return in_array($locale, config('voice.tts.languages'), true) ? $locale : null;
    }

    /** 설명 발화 글의 캐시 키 — 언어·용어·팝업 내용의 해시. 개인 값은 넣지 않는다 */
    public static function cacheKey(array $entry, string $locale): string
    {
        $content = [$entry['term'], $entry['short'], $entry['long'], $entry['easy'] ?? '', $entry['example'] ?? ''];

        return "glossary:voice:{$locale}:{$entry['id']}:".sha1(json_encode($content, JSON_UNESCAPED_UNICODE));
    }

    /** 한 번의 생성 결과(폴링용) */
    public static function resultKey(string $generationId): string
    {
        return "glossary:voice:gen:{$generationId}";
    }

    /** 팝업 틀이 x-data 로 넘기는 값 — 모두에게 같다(공개·캐시 화면에 넣어도 된다) */
    public static function clientConfig(): array
    {
        $locale = app()->getLocale();

        return [
            'locale' => $locale,
            'ttsLang' => self::ttsLang($locale),
            'dwellMs' => (int) config('glossary.voice.dwell_ms'),
            'questionMax' => (int) config('glossary.voice.question_max'),
            'waitSeconds' => (int) config('glossary.voice.max_seconds') + 15,
            'endpoint' => url('/api/glossary/voice'),
            't' => [
                'thinking' => __('glossary.voice_thinking'),
                'preparing' => __('lyen.voice_preparing'),     // :percent
                'speaking' => __('glossary.voice_speaking'),
                'starting' => __('glossary.voice_starting'),
                'listening' => __('glossary.voice_listening'),
                'blocked' => __('glossary.voice_blocked'),
                'login' => __('glossary.voice_login'),
                'limit' => __('lyen.daily_limit'),
                'exam' => __('vibechat.examBlocked'),
                'noSpeech' => __('lyen.stt_no_speech'),
                'micDenied' => __('lyen.stt_not_allowed'),
                'error' => __('glossary.voice_error'),
            ],
        ];
    }
}
```

## VoiceController

```php
<?php

namespace App\Http\Controllers\Glossary;

use App\Content\Glossary;
use App\Content\GlossaryVoice;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateGlossarySpeech;
use App\Models\LlmUsage;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * 용어 팝업의 리엔 음성 — popup 스킬(sonub-skills) references/projects/sonub/voice.md, SONUB-SSOT.md 23절 "리엔 음성"(용어 팝업)·"인공지능 생성".
 *   cached  저장된 설명 발화 글(두뇌를 부르지 않는다)
 *   store   만들기 — 설명은 캐시에 있으면 바로 200, 아니면 잡을 넣고 202. 질문은 늘 잡
 *   result  실시간이 안 될 때 결과 가져가기(본인 것만)
 */
class VoiceController extends Controller
{
    public function cached(string $locale, string $term): JsonResponse|Response
    {
        $entry = Glossary::entry($term, $locale);
        abort_if($entry === null, 404);
        $text = Cache::get(GlossaryVoice::cacheKey($entry, $locale));

        return $text === null
            ? response()->noContent()
            : response()->json(['text' => $text, 'lang' => GlossaryVoice::ttsLang($locale)])->header('Cache-Control', 'no-store');
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'term' => ['required', 'string', Rule::in(Glossary::ids())],   // 등록된 용어만 — 임의 문자열을 지침에 싣는 통로가 되지 않게
            'locale' => ['required', 'string', Rule::in(array_keys(config('locales.locales')))],
            'mode' => ['required', Rule::in(['explain', 'ask'])],
            'question' => ['required_if:mode,ask', 'nullable', 'string', 'max:'.config('glossary.voice.question_max')],
        ]);

        abort_if($user->isSuspended(), 403, 'suspended');
        abort_if(ExamService::questionOpen($user), 403, 'exam_in_progress');
        abort_if(LlmUsage::overDailyLimit(LlmUsage::subjectOf($user)), 429, 'daily_token_limit');

        $entry = Glossary::entry($data['term'], $data['locale']);
        if ($data['mode'] === 'explain' && ($text = Cache::get(GlossaryVoice::cacheKey($entry, $data['locale']))) !== null) {
            return response()->json(['text' => $text, 'lang' => GlossaryVoice::ttsLang($data['locale'])]);
        }

        $generationId = (string) Str::uuid();
        Cache::put(GlossaryVoice::resultKey($generationId), ['user' => $user->id, 'status' => 'pending'], (int) config('glossary.voice.result_seconds'));
        GenerateGlossarySpeech::dispatch($user->id, $generationId, $data['term'], $data['locale'], $data['mode'], trim((string) ($data['question'] ?? '')));

        return response()->json(['generationId' => $generationId], 202);
    }

    public function result(Request $request, string $generation): JsonResponse
    {
        $result = Cache::get(GlossaryVoice::resultKey($generation));
        abort_if($result === null || $result['user'] !== $request->user()->id, 404);
        unset($result['user']);

        return response()->json($result)->header('Cache-Control', 'no-store');
    }
}
```

- 한도 확인 순서와 오류 문구(`suspended`·`exam_in_progress`·`daily_token_limit`)는 `Lyen\MessageController::store` 와 같다 — 브라우저가 같은 방식으로 문구를 고른다.
- 설명을 캐시에서 줄 때도 한도를 먼저 확인한다 — 시험 중에 팝업 음성으로 답을 얻는 우회를 막는다(SSOT 23절 "시험 중").

## GenerateGlossarySpeech — 큐 잡

```php
<?php

namespace App\Jobs;

use App\Content\Glossary;
use App\Content\GlossaryVoice;
use App\Llm\ChatClient;
use App\Llm\LlmException;
use App\Llm\LlmResult;
use App\Llm\Prompts;
use App\Lyen\SpeechText;
use App\Models\LlmUsage;
use App\Models\User;
use App\Realtime\Centrifugo;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * 리엔이 팝업을 소리로 설명하거나 팝업에 대한 질문에 답할 글을 쓴다(popup 스킬(sonub-skills) references/projects/sonub/voice.md).
 * 요청(Glossary\VoiceController)이 생성 번호를 잡고 이 잡을 넣는다 → 두뇌 → 발화 글 정리·청크 묶기 → 결과를 캐시에 두고
 * 개인 채널(stream:#{회원}, kind 'glossary')로 알린다. 발화 글은 짧아서 조각으로 흘리지 않고 끝에 한 번 보낸다(TTS 는 다 모여야 읽는다).
 */
class GenerateGlossarySpeech implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout;

    public bool $failOnTimeout = true;

    public function __construct(
        public int $userId,
        public string $generationId,
        public string $term,
        public string $locale,
        public string $mode,
        public string $question = '',
    ) {
        $this->onConnection(config('llm.queue_connection'));
        $this->onQueue(config('llm.queue'));
        $this->timeout = (int) config('glossary.voice.max_seconds') + 30;
    }

    public function handle(ChatClient $client, Centrifugo $realtime): void
    {
        $user = User::find($this->userId);
        $entry = Glossary::entry($this->term, $this->locale);
        if ($user === null || $entry === null) {
            return;
        }

        $ask = $this->mode === 'ask';
        $messages = [
            // 설명은 모든 회원이 함께 쓰는 캐시가 되므로 이름을 넣지 않는다 — 질문 답에만 이름을 쓴다
            ['role' => 'system', 'content' => Prompts::glossaryVoice($entry, $this->locale, $ask ? $user->name : null)],
            ['role' => 'user', 'content' => Prompts::glossaryVoiceTask($this->mode, $this->question)],
        ];

        $result = null;
        $text = '';
        try {
            $result = $client->stream($messages, (int) config('glossary.voice.max_output_tokens'), (int) config('glossary.voice.max_seconds'), fn () => null);
            $text = SpeechText::clean($result->content, $this->locale);
            if ($result->truncated()) {
                // 상한에 닿아 끝 문장이 잘렸다 — 잘린 문장은 읽지 않는다
                $sentences = SpeechText::sentences($text);
                array_pop($sentences);
                $text = SpeechText::clean(implode(' ', $sentences), $this->locale);
            }
        } catch (LlmException $e) {
            report($e);
        }

        $status = $text === '' ? ($ask ? 'failed' : 'fallback') : 'done';
        if ($status === 'fallback') {
            // 설명은 사전 문장이라도 들려준다(침묵보다 낫다). 질문의 답은 사전 문장이 아니므로 실패를 알린다
            $text = SpeechText::clean($entry['short'].'. '.$entry['long'], $this->locale);
        }

        $lang = GlossaryVoice::ttsLang($this->locale);
        $speech = $lang !== null && $text !== '' ? SpeechText::pack($text, $lang) : $text;
        if (! $ask && $status === 'done') {
            Cache::put(GlossaryVoice::cacheKey($entry, $this->locale), $speech, now()->addDays((int) config('glossary.voice.cache_days')));
        }

        $this->finish($realtime, ['status' => $status, 'text' => $status === 'failed' ? '' : $speech, 'lang' => $lang]);
        LlmUsage::record(LlmUsage::subjectOf($user), $user->id, 'glossary', $result ?? new LlmResult, $messages);
    }

    public function failed(?Throwable $e): void
    {
        $this->finish(app(Centrifugo::class), ['status' => 'failed', 'text' => '', 'lang' => null]);
    }

    /** 결과를 폴링용 캐시에 두고 개인 채널로 알린다 */
    private function finish(Centrifugo $realtime, array $payload): void
    {
        Cache::put(GlossaryVoice::resultKey($this->generationId), ['user' => $this->userId, ...$payload], (int) config('glossary.voice.result_seconds'));
        $realtime->publish(Centrifugo::streamChannel((string) $this->userId), [
            'type' => 'done',
            'kind' => 'glossary',
            'generationId' => $this->generationId,
            ...$payload,
        ]);
    }
}
```

- `ChatClient::stream()` 은 비추론(thinking 끔)으로 부른다 — 추론 모델은 `max_tokens` 를 생각에 먼저 써서 답이 빈 채로 온다(메모리 `deepseek-reasoning-model-tokens`).
- 사용량은 `feature => 'glossary'` 로 남아 하루 한도에 함께 들어간다. 받은 것이 없으면 `LlmUsage::record` 가 스스로 건너뛴다.
- `Centrifugo::publish()` 가 실패해도 결과는 캐시에 있으니 브라우저의 폴링이 가져간다.

## 지침(시스템 프롬프트)

`App\Llm\Prompts` 에 더한다. 앞부분(규칙)은 모든 팝업이 같고, 팝업 내용·이름은 뒤에 둔다 — 앞이 같아야 DeepSeek 의 프롬프트 캐시가 맞는다(`Prompts::lyen` 과 같은 이유).

```php
/**
 * 용어 팝업의 리엔 음성 — 팝업 내용을 근거로 "귀로 듣기 좋은" 글을 쓰게 한다(popup 스킬(sonub-skills) references/projects/sonub/voice.md).
 * 답은 화면에 쓰이지 않고 Supertonic 이 읽는다. 규칙을 어긴 기호는 App\Lyen\SpeechText 가 마지막으로 걷어낸다.
 */
public const GLOSSARY_VOICE = <<<'PROMPT'
너는 SONUB 의 AI 튜터 리엔이다. 학습자는 화면의 낱말 위에 띄운 설명 팝업을 보고 있다. 너의 답은 화면에 쓰이지 않고 음성 합성(TTS)으로 소리 내어 읽힌다.

[말하기 규칙 — 반드시 지켜라]
- 마크다운, 목록, 번호, 괄호, 별표, 코드, 이모지, URL, 표를 쓰지 않는다. 소리 내어 읽기 자연스러운 평서문만 쓴다.
- 문장을 짧게 쓰고 모든 문장을 그 언어의 문장부호로 끝낸다. 한 문장은 한국어·일본어 60자, 다른 언어 150자를 넘기지 않는다.
- 설명은 2~4문장, 질문의 답은 2~5문장이다. 인사말과 맺음말을 붙이지 않는다.
- 팝업 글을 그대로 되읽지 않는다. 같은 뜻을 귀로 듣기 쉬운 말로 다시 말하고, 일상의 비유는 하나만 쓴다.
- 요청한 언어로만 답한다. 한국어로 답할 때 영어 약어와 용어는 한글 발음으로 쓴다. 예: API→에이피아이, LLM→엘엘엠, GPU→지피유, JSON→제이슨. 일본어는 가타카나로, 힌디어는 데바나가리로 소리 나는 대로 쓴다.
- 숫자와 기호는 말로 쓴다. 예: 90%→구십 퍼센트, 3단계→세 단계, 1:1→일 대 일.
- 코드 이름, 파일 이름, 긴 식별자는 읽지 말고 "화면의 예시를 보세요"처럼 넘긴다.
- 인공지능을 계산 도구로 설명한다. 생각한다, 안다, 느낀다처럼 사람의 마음을 가진 것처럼 말하지 않는다.
- 팝업 내용에 없는 사실을 지어내지 않는다. 확인할 수 없으면 짧게 모른다고 말한다.
- 질문이 이 낱말과 관계없으면 짧게 답하고 이 낱말로 이야기를 돌린다.
PROMPT;

/** 용어 팝업 음성의 시스템 지침 — 규칙 + 답하는 언어 + 팝업 내용(근거) + (질문 답일 때만) 이름 */
public static function glossaryVoice(array $entry, string $locale, ?string $learnerName): string
{
    $language = config("locales.locales.{$locale}.name", $locale);
    $popup = array_filter([
        '[팝업 내용 — 근거로만 쓰고 그대로 읽지 않는다]',
        "낱말: {$entry['term']}",
        $entry['short'] !== '' ? "한 줄 뜻: {$entry['short']}" : null,
        $entry['long'] !== '' ? "설명: {$entry['long']}" : null,
        ($entry['easy'] ?? '') !== '' ? "쉽게 말하면: {$entry['easy']}" : null,
        ($entry['example'] ?? '') !== '' ? "예시: {$entry['example']}" : null,
        $entry['related'] !== [] ? '관련 용어: '.implode(', ', array_column($entry['related'], 'term')) : null,
    ]);

    return implode("\n\n", array_filter([
        self::GLOSSARY_VOICE,
        "답하는 언어: {$language} ({$locale})",
        implode("\n", $popup),
        self::learner($learnerName),
    ]));
}

/** 사용자 메시지 — 설명 요청 또는 학습자가 말로 물은 질문 */
public static function glossaryVoiceTask(string $mode, string $question): string
{
    return $mode === 'ask'
        ? "학습자가 이 팝업을 보며 소리 내어 물었다: \"{$question}\"\n이 낱말에 닿아 있게 답하라."
        : '이 낱말을 처음 듣는 사람에게 소리로 설명하라.';
}
```

- 사용자가 말한 "팝업 내용을 시스템 인스트럭션에 추가"가 `[팝업 내용]` 블록이다. 질문은 사용자 메시지로 보낸다.
- 지침 규칙을 고칠 때는 **말하기 규칙**을 약하게 만들지 않는다 — 이것이 Supertonic 발화의 첫째 방어선이다.

## 발화 글 정리 — SpeechText

`app/Lyen/SpeechText.php`. 아래 코드(설정 읽기만 뺀 같은 코드)를 2026-09-27 컨테이너에서 ko·ja·en·hi 표본으로 돌려 확인했다.

```php
<?php

namespace App\Lyen;

/**
 * 리엔이 소리 내어 읽을 글 — 두뇌가 쓴 글을 Supertonic 3 가 부드럽게 읽는 모양으로 만든다(popup 스킬(sonub-skills) references/projects/sonub/voice.md).
 *
 * clean — 지침으로 막아도 모델이 가끔 내는 기호를 걷어낸다. 그대로 두면 "별표"처럼 읽히거나 이상한 소리가 난다.
 * pack  — 문장 경계에서 청크 한도(voice.tts.chunk_*) 이하로 묶고 빈 줄로 잇는다. 엔진의 청크 나누기(public/js/voice/tts/engine.js
 *         chunkText)는 문단(빈 줄)을 먼저 가르고, 문장은 [.!?] 뒤 공백에서만 자른다 — 일본어 '。'·힌디어 '।' 문장은 이렇게
 *         미리 묶지 않으면 한도를 넘는 한 덩어리가 되고, 문장 안에서는 자르지 않으므로 긴 문장은 쉼표에서 미리 나눈다.
 */
final class SpeechText
{
    /** 한 청크의 최대 글자 — 엔진과 같은 기준: ko·ja 는 chunk_cjk, 그 밖은 chunk_other */
    public static function limitFor(string $lang): int
    {
        return in_array($lang, ['ko', 'ja'], true) ? (int) config('voice.tts.chunk_cjk') : (int) config('voice.tts.chunk_other');
    }

    /** 그 언어의 문장 끝 부호 — 줄 끝에 부호가 없으면 붙여 다음 줄과 한 문장으로 붙지 않게 한다 */
    public static function stop(string $lang): string
    {
        return match ($lang) {
            'ja', 'zh' => '。',
            'hi' => '।',
            default => '.',
        };
    }

    public static function clean(string $raw, string $lang): string
    {
        $stop = self::stop($lang);
        $text = str_replace('【음성요약】', ' ', $raw);
        $text = preg_replace('/```[\s\S]*?```/u', ' ', $text);                         // 코드 블록 — 읽지 않는다
        $text = preg_replace('/!?\[([^\]]*)\]\([^)]*\)/u', '$1', $text);                 // [글](주소) → 글
        $text = preg_replace('/https?:\/\/\S+|www\.\S+/u', ' ', $text);                    // 주소 — 소리로는 알아들을 수 없다
        $text = preg_replace('/^\s{0,3}(?:#{1,6}|>|[-*+•]|\d+[.)])\s+/mu', '', $text);   // 제목·인용·목록 머리
        $text = preg_replace('/[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}\x{200D}]/u', '', $text); // 이모지
        $text = preg_replace('/(\*\*|__|~~|\*|`)(?=\S)(.+?)(?<=\S)\1/u', '$2', $text);         // **강조**·`코드` 표시는 공백 없이 벗긴다
        $text = preg_replace('/\s*[(（][^()（）]{0,40}[)）]/u', '', $text);                 // 짧은 괄호 덧말 — '토큰(token)은' → '토큰은'
        $text = preg_replace('/[`*_#|~^=<>{}\[\]()（）\\\\\/→←⇒•·]+/u', ' ', $text);        // 기호 — 글자 그대로 읽히거나 이상한 소리가 난다
        $text = preg_replace('/([^\s.!?。！？।,:;、，])[ \t]*\n+/u', '$1'.$stop."\n", $text); // 부호 없이 끝난 줄(제목·목록)에 문장 끝
        $text = preg_replace('/\s*([,.!?。！？।、，])/u', '$1', $text);                     // 문장부호 앞 공백
        $text = trim(preg_replace('/\s+/u', ' ', $text));
        $text = preg_replace('/([。！？])\s+/u', '$1', $text);                             // 일본어·중국어 문장 사이 공백
        if ($text !== '' && ! preg_match('/[.!?。！？।]$/u', $text)) {
            $text .= $stop;
        }

        return $text;
    }

    /** @return list<string> 문장들 — 라틴 부호는 뒤 공백이 있어야(3.5 를 자르지 않게), 。！？। 는 공백 없이도 끝이다 */
    public static function sentences(string $text): array
    {
        $parts = preg_split('/(?<=[.!?])\s+|(?<=[。！？।])\s*/u', $text, -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_filter(array_map('trim', $parts), fn ($s) => $s !== ''));
    }

    public static function pack(string $text, string $lang, ?int $limit = null): string
    {
        $limit ??= self::limitFor($lang);
        $chunks = [];
        $current = '';
        foreach (self::sentences($text) as $sentence) {
            foreach (self::fit($sentence, $limit) as $piece) {
                // 일본어·중국어는 문장 사이에 띄어쓰기를 두지 않는다
                $glue = preg_match('/[。！？]$/u', $current) ? '' : ' ';
                $joined = $current === '' ? $piece : $current.$glue.$piece;
                if (mb_strlen($joined) <= $limit) {
                    $current = $joined;
                } else {
                    $chunks[] = $current;
                    $current = $piece;
                }
            }
        }
        if ($current !== '') {
            $chunks[] = $current;
        }

        return implode("\n\n", $chunks);
    }

    /** @return list<string> 한도를 넘는 문장은 쉼표 → 띄어쓰기 → 글자 순으로 나눈다(쉼표에서 나누면 쉬는 자리가 자연스럽다) */
    private static function fit(string $sentence, int $limit): array
    {
        if (mb_strlen($sentence) <= $limit) {
            return [$sentence];
        }
        $pieces = [];
        $rest = $sentence;
        while (mb_strlen($rest) > $limit) {
            $head = mb_substr($rest, 0, $limit);
            $cut = max((int) mb_strrpos($head, ','), (int) mb_strrpos($head, '、'), (int) mb_strrpos($head, '，'));
            if ($cut < $limit / 3) {
                $cut = (int) mb_strrpos($head, ' ');
            }
            if ($cut < $limit / 3) {
                $cut = $limit - 1;
            }
            $pieces[] = trim(mb_substr($rest, 0, $cut + 1));
            $rest = trim(mb_substr($rest, $cut + 1));
        }
        if ($rest !== '') {
            $pieces[] = $rest;
        }

        return $pieces;
    }
}
```

확인한 입력 → 출력(한도 ko·ja 120, en·hi 300):

| 언어 | 두뇌가 규칙을 어긴 입력 | `clean` → `pack` 결과 |
| --- | --- | --- |
| ko | `**토큰**(token)은 … 나뉘어요!\n- 요금도 토큰 수로 매겨요 👍\n자세한 건 https://… 를 보세요` | `토큰은 … 나뉘어요! 요금도 토큰 수로 매겨요. 자세한 건 를 보세요.` 한 청크(86자) — 괄호 덧말·강조·목록·이모지·주소가 빠지고 목록 줄에 마침표가 붙는다. **"자세한 건 를"처럼 문장이 어색해지는 것은 못 고친다** — 지침이 첫째 방어선이다 |
| ja | 。로 이은 다섯 문장(166자) | 두 청크 111자 · 53자 — 문장 사이 공백 없음. 엔진에 그대로 넘겼다면 한 덩어리 166자 |
| en | `## Token\nA token is … e.g. … → un, believ, able. … (see [docs](…)).` | `Token. A token is … e.g. … un, believ, able. Pricing is per token.` — 제목 줄에 마침표, `e.g.` 보존, 화살표·괄호 제거 |
| hi | । 로 끝난 세 문장, 끝 부호 없음 | 끝에 `।` 를 붙인 한 청크 |
| ko 긴 문장 | 145자 한 문장 | 쉼표에서 나눈 93자 · 51자 |

## 브라우저 — 음성 세션

`public/js/glossary.js` 의 `glossaryPop(endpoint, voiceConfig)` 에 더한다. 팝업이 하나이므로 음성 세션도 하나다.

### 닫힌 변수 · 반응형 데이터

```js
// ── 리엔 음성 — 스피커(설명)·마이크(질문). popup 스킬(sonub-skills) references/projects/sonub/voice.md
// 음성 모듈은 필요할 때만 부른다(워커·모델이 크다). 챗봇(lyen.js)·페이지 안내와 같은 모듈·같은 음성 설정을 쓴다.
const cfg = voiceConfig ?? null;       // 음성이 없는 틀이면 null — 아래 함수는 모두 아무것도 하지 않는다
let voiceModule = null;
const loadVoice = () => (voiceModule ??= import('/js/voice/index.js'));
let generation = 0;                    // 새 요청·닫기마다 늘린다 — 늦게 온 응답·닫힌 팝업의 발화를 버린다
let mine = false;                      // 지금 소리가 이 팝업 것인가 — 닫을 때 남(챗봇)의 소리를 끊지 않게
let dwellTimer = null;
let stopMic = null;
let waiting = null;                    // { generationId, resolve } — 실시간·폴링이 풀어 준다
let subscribed = false;
let csrf = null;
let lastVoiceState = null;
const BUSY = ['thinking', 'preparing', 'speaking', 'starting', 'listening'];
const signedIn = () => document.cookie.split('; ').includes('signed_in=1');

// 반응형(반환 객체에)
voice: {
	phase: 'idle', status: '', caption: '',
	on: true,                                   // init 에서 localStorage 'sonub-lyen-voice-enabled' 로 맞춘다
	speakable: !!cfg?.ttsLang,                  // 소리 내는 언어에서만 스피커를 둔다
	listenable: !!cfg && !!(window.SpeechRecognition || window.webkitSpeechRecognition || navigator.mediaDevices?.getUserMedia),
},
```

### 기존 함수에 거는 곳

| 기존 | 더할 것 |
| --- | --- |
| `init()` | `voice.on` 을 저장된 설정으로, `window.addEventListener('sonub:voice-enabled', (e) => (this.voice.on = e.detail))` |
| `show(term, pin)` | 팝업이 새로 열리거나 다른 용어로 바뀌면 `this.stopVoice()` 다음 `this.autoSpeak(pin)` — 마우스(호버)면 `dwellMs` 뒤, 누르기·키보드면 곧바로 |
| `navigate()`(관련 용어 칩) | `this.stopVoice()` 다음 `this.autoSpeak(true)` — 칩 누르기는 제스처라 곧바로 |
| `leave()` | 맨 앞에 `if (BUSY.includes(this.voice.phase)) return;` — 리엔이 말하거나 듣는 중에는 마우스가 벗어나도 닫지 않는다 |
| `hide()` | `this.stopVoice()` — 팝업이 사라졌는데 리엔만 계속 말하지 않게 |
| 빈 항목 모양(`entry` 초기값·`load()` 의 stub) | 음성은 `entry.id` 가 필요하다 — `load(id, stub)` 에서 `this.entry = { id, … }` 로 id 를 함께 둔다 |

### 음성 함수 (청사진)

```js
setPhase(phase, percent = null) {
	this.voice.phase = phase;
	const text = cfg?.t?.[phase] ?? '';
	this.voice.status = percent === null ? text : text.replace(':percent', String(percent));
},

// 스피커가 켜져 있고 소리 내는 언어면 설명한다. 호버로 연 팝업은 잠깐 머문 뒤에만 — 지나가는 마우스로 두뇌를 부르지 않게
autoSpeak(immediate) {
	if (!cfg || !this.voice.on || !cfg.ttsLang) return;
	clearTimeout(dwellTimer);
	dwellTimer = setTimeout(() => this.open && this.explain(), immediate ? 0 : cfg.dwellMs);
},

stopVoice() {
	generation += 1;
	clearTimeout(dwellTimer);
	stopMic?.();
	stopMic = null;
	waiting = null;
	if (mine) voiceModule?.then((v) => v.stopSpeaking());
	mine = false;
	this.voice.caption = '';
	this.setPhase('idle');
},

async explain() {
	const gen = ++generation;
	const term = this.entry.id;
	if (!signedIn()) return this.setPhase('login');
	this.setPhase('thinking');
	const got = await this.request(gen, { term, mode: 'explain' });
	if (got) await this.say(gen, got.text, got.lang, false);
},

async ask(gen, question) {
	if (!question) return this.setPhase('noSpeech');
	this.voice.caption = question;
	this.setPhase('thinking');
	const got = await this.request(gen, { term: this.entry.id, mode: 'ask', question: question.slice(0, cfg.questionMax) });
	if (got) await this.say(gen, got.text, got.lang, true);
},

// 설명은 저장된 글부터(두뇌·한도를 쓰지 않는다), 없으면 만든다. 실패는 phase 로 알리고 null
async request(gen, body) {
	const json = { Accept: 'application/json' };
	try {
		if (body.mode === 'explain') {
			const cached = await fetch(`${cfg.endpoint}/${cfg.locale}/${encodeURIComponent(body.term)}`, { headers: json });
			if (gen !== generation) return null;
			if (cached.status === 200) return cached.json();
			if (cached.status === 401) return this.setPhase('login'), null;
		}
		csrf ??= (await (await fetch('/me', { headers: json })).json()).csrf;   // 캐시된 공개 화면에는 CSRF 토큰이 없다(auth.js 와 같다)
		const res = await fetch(cfg.endpoint, {
			method: 'POST',
			headers: { ...json, 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
			body: JSON.stringify({ ...body, locale: cfg.locale }),
		});
		if (gen !== generation) return null;
		if (res.status === 200) return res.json();
		if (res.status === 202) return this.waitResult(gen, (await res.json()).generationId);
		const message = (await res.json().catch(() => ({}))).message;
		if (res.status === 419) csrf = null;                                    // 세션이 바뀌었다 — 다음에 다시 받는다
		this.setPhase(res.status === 401 ? 'login' : message === 'exam_in_progress' ? 'exam' : message === 'daily_token_limit' ? 'limit' : 'error');
	} catch {
		if (gen === generation) this.setPhase('error');
	}
	return null;
},

// 잡의 결과 — 개인 실시간 채널로 오거나, 실시간이 없거나 늦으면 폴링으로 가져간다
waitResult(gen, generationId) {
	if (!subscribed && window.sonubRealtime) {
		subscribed = true;
		window.sonubRealtime.subscribe((data) => {
			if (data?.kind === 'glossary' && data.generationId === waiting?.generationId) waiting.resolve(data);
		});
	}
	return new Promise((resolve) => {
		const startedAt = Date.now();
		const done = (data) => {
			clearInterval(poll);
			if (waiting?.generationId === generationId) waiting = null;
			if (gen !== generation) return resolve(null);
			if (!data || data.status === 'failed' || !data.text) return this.setPhase('error'), resolve(null);
			resolve(data);
		};
		waiting = { generationId, resolve: done };
		const poll = setInterval(async () => {
			if (waiting?.generationId !== generationId) return clearInterval(poll);
			if (Date.now() - startedAt > cfg.waitSeconds * 1000) return done(null);
			if (window.sonubRealtime?.live && Date.now() - startedAt < 8000) return;   // 실시간이 살아 있으면 잠깐은 기다린다
			const res = await fetch(`${cfg.endpoint}/result/${generationId}`, { headers: { Accept: 'application/json' } });
			if (res.ok) {
				const data = await res.json();
				if (data.status !== 'pending') done(data);
			}
		}, 1500);
	});
},

// 한 번에 읽는다 — 문장마다 speak 를 부르면 앞 소리가 끊기고 합성 대기로 틈이 생긴다. markdownToSpeech 로 다시 거르지 않는다(묶어 둔 빈 줄이 사라진다)
async say(gen, text, lang, showCaption) {
	if (gen !== generation) return;
	if (showCaption) this.voice.caption = text.replace(/\n\n/g, ' ');
	if (!lang || !this.voice.on) return this.setPhase('idle');   // 소리 내지 못하는 언어·음성 끔 — 자막만
	const v = await loadVoice();
	if (gen !== generation) return;
	const off = v.onVoiceState((state) => {
		lastVoiceState = state;
		if (gen !== generation) return;
		if (state.owner === 'glossary' && state.phase === 'speaking') this.setPhase('speaking');
		else if (!v.isReady() && this.voice.phase !== 'speaking') this.setPhase('preparing', state.percent ?? 0);   // 첫 방문 약 400MB — 준비되는 즉시 읽는다
	});
	mine = true;
	try {
		await v.speak(text, lang, 'glossary', { wait: true });
	} finally {
		off();
		mine = false;
	}
	if (gen !== generation) return;
	// speak() 는 자동 재생이 막혀도 예외 없이 needsGesture 만 세운다 — 보지 않으면 소리 없이 끝난 것을 성공으로 본다
	this.setPhase(lastVoiceState?.needsGesture ? 'blocked' : lastVoiceState?.error ? 'error' : 'idle');
},

// 스피커 — 켜기/끄기(사이트 하나의 음성 설정). 막혔던 소리는 한 번 더 누르면 다시 튼다
async toggleSpeaker() {
	const v = await loadVoice();
	v.unlockAudio();                                   // 누르기(제스처) 안에서 자동 재생 잠금을 푼다
	if (this.voice.phase === 'blocked') {
		this.setPhase('speaking');
		await v.replayLast();
		return this.setPhase('idle');
	}
	pinned = true;                                     // 스피커를 만진 팝업은 붙잡아 둔다
	if (this.voice.on) {
		this.stopVoice();
		v.setVoiceEnabled(false);
		return;
	}
	v.setVoiceEnabled(true);
	this.autoSpeak(true);
},

// 마이크 — 받아 적은 질문을 이 팝업 맥락으로 묻는다. 다시 누르면 멈춘다
async toggleMic() {
	if (this.voice.phase === 'starting' || this.voice.phase === 'listening') return this.stopVoice();
	const gen = ++generation;
	if (!signedIn()) return this.setPhase('login');
	pinned = true;                                     // 묻는 동안 팝업을 붙잡는다
	const v = await loadVoice();
	if (mine || v.isSpeaking()) v.stopSpeaking();      // 리엔이 말하는 중이면 먼저 멈춘다 — 자기 목소리를 받아 적지 않게
	v.unlockAudio();
	window.dispatchEvent(new CustomEvent('sonub:voice-interrupt-guide'));
	if (cfg.ttsLang && this.voice.on) v.preload();
	// 듣기 엔진(SenseVoice) — 받아 둔 모델이면 곧 준비된다(최대 5초). 아직이면 Web Speech 로 시작한다(SSOT 23절 "듣기")
	await v.preloadStt({ baseUrl: v.voiceConfig.assets?.sensevoice, locale: cfg.locale });
	await v.waitSttReady(5000);
	if (gen !== generation) return;
	this.voice.caption = '';
	this.setPhase('starting');                         // 권한 창·엔진 기동 중 — 실제로 열렸을 때(onStart) 비로소 listening
	stopMic = v.startDictation({
		onStart: () => gen === generation && this.setPhase('listening'),
		onPartial: (text) => gen === generation && (this.voice.caption = text),
		onFinal: (text) => {
			if (gen !== generation) return;
			stopMic = null;
			this.ask(gen, text.trim());
		},
		onError: (code) => gen === generation && this.setPhase(code === 'not-allowed' || code === 'service-not-allowed' ? 'micDenied' : 'error'),
		onEnd: () => {
			if (gen === generation && (this.voice.phase === 'starting' || this.voice.phase === 'listening')) this.setPhase('noSpeech');
		},
	}, { lang: v.sttLangFor(cfg.locale), silenceMs: v.voiceConfig.stt?.silence_ms ?? 1200 });
},
```

- `speak()` 의 소유자 이름 `'glossary'` 는 새 값이다. `tts.js` 는 `'guide'` 가 아니면 페이지 안내를 끊고(`interruptPageGuide`), `stopGuide()` 는 `'guide'` 만 멈추므로 새 이름이어도 된다.
- `onVoiceState` 는 부르자마자 지금 상태를 한 번 넘긴다 — `lastVoiceState` 는 그 값으로 시작한다.
- 스피커 끄기는 `setVoiceEnabled(false)` 라 **챗봇·페이지 안내도 함께 꺼진다** — SSOT 의 "같은 설정"이 뜻하는 바다. 스피커 버튼의 `aria-pressed` 가 지금 상태를 알린다.

## 상태와 문구

| phase | 뜻 | 문구(키) | 새 키? |
| --- | --- | --- | --- |
| `idle` | 아무것도 안 함 | — | |
| `thinking` | 두뇌를 기다림 | `glossary.voice_thinking` "리엔이 답을 준비하고 있어요…" | |
| `preparing` | Supertonic 준비 중(첫 방문) | `lyen.voice_preparing` "음성 준비 중… :percent%" | |
| `speaking` | 읽는 중 | `glossary.voice_speaking` "리엔이 설명하는 중" | |
| `starting` | 마이크 여는 중 | `glossary.voice_starting` | |
| `listening` | 듣는 중(받아 적는 글은 자막) | `glossary.voice_listening` | |
| `blocked` | 자동 재생이 막힘 | `glossary.voice_blocked` "…버튼을 한 번 더 누르면 들려요" | |
| `login` | 손님 | `glossary.voice_login` 예: "로그인하면 리엔이 소리로 설명하고 질문에 답해요." | ⬜ 17개 언어 |
| `limit` | 하루 한도 | `lyen.daily_limit` | |
| `exam` | 시험 문항이 열려 있음 | `vibechat.examBlocked` | |
| `noSpeech` | 말이 들리지 않음 | `lyen.stt_no_speech` | |
| `micDenied` | 마이크 권한 거부 | `lyen.stt_not_allowed` | |
| `error` | 그 밖(두뇌 실패·엔진 오류·네트워크) | `glossary.voice_error` | |

- 다른 그룹의 키를 쓰는 것은 **뜻이 같을 때만**이다. 팝업에 맞지 않는 문장이면 `glossary` 에 새 키를 17개 언어로 넣는다(`add-terms.php` 의 `"keys"`).
- `glossary.voice_no_voice`("이 브라우저에는 이 언어의 음성이 없어요")는 이전 사이트의 브라우저 TTS 시절 문장이다 — 지금은 소리 내지 못하는 언어에서 스피커를 두지 않으므로 쓰지 않는다.
- design.md 의 CSS 는 소리가 나지 않은 phase(`blocked`·`login`·`limit`·`exam`·`noSpeech`·`micDenied`·`error`)의 상태 줄을 경고색으로 칠한다.

## 조용한 실패를 막는다

음성은 예외 없이 실패하는 길이 많다. 모두 phase 로 바꿔 팝업에 보인다 — 성공처럼 넘기면 사용자는 버튼이 고장 난 줄 안다.

| 실패 | 어떻게 알아채나 | phase |
| --- | --- | --- |
| 자동 재생 차단(호버는 사용자 제스처가 아니다) | `speak()` 가 끝난 뒤 `needsGesture` | `blocked` → 스피커 누르면 `replayLast()` |
| 모델 준비 전(첫 방문 약 400MB) | `isReady()` false | `preparing`(퍼센트) — 준비되면 읽는다, **다른 목소리로 대신 읽지 않는다** |
| 엔진 오류(설치 안 됨 등) | 상태 `error` | `error` |
| 손님 | `signed_in` 쿠키 없음 / 401 | `login` |
| 시험 중·하루 한도 | 403 `exam_in_progress` / 429 `daily_token_limit` | `exam` / `limit` |
| 1분 10번 초과 | 429(다른 메시지) | `error` |
| 두뇌 실패 | 잡 결과 `fallback`(설명은 사전 문장으로 읽는다) / `failed`(질문) | 설명은 그대로 읽기, 질문은 `error` |
| 결과가 안 옴(실시간·큐 멈춤) | `waitSeconds` 초과 | `error` |
| 마이크 권한 거부·지원 안 함 | `onError('not-allowed')` 등 | `micDenied` / `error` |
| 아무 말도 안 함 | 확정 없이 `onEnd` | `noSpeech` |
| 사용자가 닫음·다른 용어·다시 누름 | `generation` 이 바뀜 | 조용히 원위치(오류가 아니다) |

## 테스트

Pest. 두뇌·실시간 서버는 가짜(`Http::fake` — `tests/Feature/LyenChatTest.php` 의 `lyenStream()`·`fakeLyenBrain()` 과 같은 방식, **도우미 이름은 새로** — 파일의 함수는 전역이다). 테스트에서 큐는 sync 라 요청 안에서 잡이 돈다.

`tests/Unit/SpeechTextTest.php`(순수 함수 — `pack()` 에 한도를 직접 넘긴다, Unit 에서는 `config()` 를 못 쓴다):
- 강조·괄호 덧말·목록·이모지·주소·코드 블록을 걷어내고, 괄호를 떼도 조사가 떨어지지 않는다('토큰(token)은' → '토큰은')
- 부호 없는 줄에 그 언어의 문장 끝(`.`·`。`·`।`)을 붙인다 / `e.g.`·`3.5` 를 깨지 않는다
- `pack` — 모든 청크가 한도 이하, 일본어 `。`·힌디어 `।` 에서 나뉜다, 일본어 문장 사이에 공백이 없다, 긴 문장은 쉼표에서 나뉜다, 청크는 빈 줄로 이어진다(위 표의 입력을 데이터셋으로)

`tests/Feature/GlossaryVoiceTest.php`:
- 손님 401, 정지 회원 403, 시험 문항이 열려 있으면 403 `exam_in_progress`, 하루 한도 429 `daily_token_limit`, 없는 용어·언어 422, 질문 없는 ask 422, 긴 질문 422
- 설명 — 두뇌에 보낸 system 이 `Prompts::GLOSSARY_VOICE` 로 시작하고 팝업의 term·short·long 을 담으며 **회원 이름을 담지 않는다**, user 는 설명 요청, `max_tokens` 는 설정값, thinking 끔
- 결과 글이 정리·묶기를 거쳤다(마크다운이 섞인 가짜 답 → 기호 없음·빈 줄 청크), `done` 이벤트(kind `glossary`·generationId·lang)를 보낸다, `LlmUsage` 의 feature 가 `glossary`
- 두 번째 설명 요청은 두뇌를 부르지 않고 200(캐시), `cached` 는 만들기 전 204·뒤 200, 팝업 내용(번역)이 바뀌면 캐시 키가 바뀐다
- 질문 — system 에 팝업 내용과 이름, user 에 질문, 캐시하지 않는다
- 소리 내지 못하는 언어(예: fr) — `lang` null, 글을 묶지 않는다
- 두뇌 실패 — 설명은 `fallback`(사전 문장)·캐시하지 않음, 질문은 `failed`
- `result` 는 본인 것만(다른 회원 404)
- 1분 10번은 챗봇과 함께 센다 — 리엔 대화 요청과 팝업 만들기를 합쳐 넘으면 429
- 화면 — 팝업 틀에 스피커·마이크가 소리 내는 언어에서만 스피커를 두고(ko 있음, fr 없음), `clientConfig` 문구가 그 언어다

브라우저(MCP)로 볼 것: 호버 0.7초 뒤 요청이 한 번만 가는지(지나가는 마우스는 요청 없음), 요청 본문에 팝업 설명 원문이 없고 term·mode·locale 만 있는지, 스피커 끄기가 챗봇의 음성 켜기와 함께 바뀌는지, 자동 재생 차단 안내와 다시 누르기, 손님 로그인 안내, 마이크 흐름(시작 → 듣기 → 답 자막 → 읽기), 말하는 도중 마우스가 벗어나도 팝업이 남는지, 닫으면 소리가 멈추는지.
