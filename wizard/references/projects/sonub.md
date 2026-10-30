# Using the wizard kit in SONUB (sonub.com)

> Read [SONUB-SSOT.md](../../../../SONUB-SSOT.md) section 11 first (design, "page body and reuse — absolute rules", no build step, no external CDN). The SSOT wins over this file.
> This is design work: use the **sonub-design** skill and its required companions (popup · infographics · linkify · sonub-seo · webmovie) together with this skill. Motion is the last layer on top of that design.

## Contents

- [Where the files go](#where-the-files-go)
- [Widgets, not page bodies](#widgets-not-page-bodies)
- [Theme tokens](#theme-tokens)
- [17 languages](#17-languages)
- [State and saving](#state-and-saving)
- [Art](#art)
- [Tests and checks](#tests-and-checks)

## Where the files go

1. Copy the kit unchanged — the site copies must stay byte-identical to the skill (test it like `GuidePagesTest` does for webmovie):
   ```bash
   cp skills/wizard/assets/wizard.js public/js/wizard.js
   cp skills/wizard/assets/wizard.css public/css/wizard.css
   ```
2. Load both in `<head>`, the script **without** `defer`, once per page, from the widget that needs them:
   ```blade
   @pushOnce('head', 'sonub-wizard')
       <link rel="stylesheet" href="{{ asset_v('/css/wizard.css') }}">
       <script src="{{ asset_v('/js/wizard.js') }}"></script>
   @endPushOnce
   ```
   Every widget uses the same key `sonub-wizard` so the files load once. Never a CDN, never a build step.
3. Public pages are cached by Cloudflare (`routes/public.php`): a checklist with per-user state is personal, so render it from `routes/web.php` (session) — or render the public, stateless part publicly and load the state with a small fetch.

## Widgets, not page bodies

Every wizard is a reusable widget under `resources/views/components/widget/` (SSOT 11 "page body and reuse"): data in, markup out, CSS and JS through `@pushOnce`. One widget per family, used by the main site and the subdomain sites (`teacher.`, `student.`, `school.`):

```blade
{{-- resources/views/components/widget/onboarding/checklist.blade.php --}}
@props(['title', 'sub' => null, 'tasks', 'save' => null, 'plain' => false, 'art' => null, 'collapsed' => false])
@pushOnce('head', 'sonub-wizard') … @endPushOnce
<section @class(['wizard', 'wizard-plain' => $plain]) data-wizard="checklist" @if($save) data-wizard-save="{{ $save }}" @endif
         @if($collapsed) data-wizard-collapsed @endif aria-labelledby="{{ $id = 'wz-'.Str::random(6) }}"
         data-label-progress="{{ __('wizard.progress') }}" data-label-expand="{{ __('wizard.expand') }}"
         data-label-collapse="{{ __('wizard.collapse') }}" data-label-next-task="{{ __('wizard.next_task') }}" data-label-all-done="{{ __('wizard.all_done') }}">
    @if($art)<figure class="wizard-art" aria-hidden="true"><img src="{{ $art }}" alt="" width="240" height="240"></figure>@endif
    <header class="wizard-head"><h2 class="wizard-title" id="{{ $id }}">{{ $title }}</h2>@if($sub)<p class="wizard-sub">{{ $sub }}</p>@endif</header>
    <ol class="wizard-list">
        @foreach ($tasks as $t)
            <li class="wizard-item" data-wizard-item id="{{ $t['id'] }}" @if($t['done']) data-done @endif @if($t['new'] ?? false) data-wizard-new @endif
                @if($t['optional'] ?? false) data-optional @endif @if($t['locked'] ?? false) data-locked @endif>
                <span class="wizard-marker" aria-hidden="true"></span>
                <div class="wizard-item-body">
                    <h3 class="wizard-item-title">@if(!empty($t['url']))<a class="wizard-link" href="{{ $t['url'] }}">{{ $t['title'] }}</a>@else{{ $t['title'] }}@endif</h3>
                    @if(!empty($t['desc']))<p class="wizard-item-desc">{{ $t['desc'] }}</p>@endif
                </div>
            </li>
        @endforeach
    </ol>
</section>
```

- Blade carries structure and meaning classes only; no `style=""` or `<style>` (SSOT 11 CSS). Site-specific looks go into `public/css/pages/<section>.css` by overriding `--wizard-*`.
- Page tabs, popups and anchors follow their own skills: headings of tasks can carry linkify ids; jargon in descriptions can use popup terms.

## Theme tokens

Map the kit to Web Awesome tokens so default, dark and pink themes follow (never palette `--theme-*` values directly, never numbers):

```css
/* public/css/wizard-theme.css (or the page CSS) */
.wizard {
    --wizard-accent: var(--wa-color-brand-fill-loud);
    --wizard-accent-2: color-mix(in srgb, var(--wa-color-brand-fill-loud) 55%, var(--wa-color-danger-fill-loud, #db2777));
    --wizard-ok: var(--wa-color-success-fill-loud);
    --wizard-ok-ink: var(--wa-color-success-on-loud);
    --wizard-surface: var(--wa-color-surface-raised);
    --wizard-line: var(--wa-color-surface-border);
    --wizard-muted: var(--wa-color-text-quiet);
    --wizard-soft: var(--wa-color-brand-fill-quiet);
    --wizard-radius: var(--wa-border-radius-l);
}
```

Check all three themes in the browser (sonub-design "check in three themes"). `/admin` is light only — a wizard inside Filament uses the light values as they are.

## 17 languages

- Every visible text — titles, descriptions, button labels and every `data-label-*` — comes from `lang/{17 locales}/*.php` (e.g. `lang/*/wizard.php` for the kit labels, the feature's own file for task texts). Write all 17 at once, same keys and placeholders as `en` (`{done}`, `{total}`, `{percent}`, `{title}`, `{n}` stay untranslated).
- Do not run pint on `lang/*.php`; check with `php -l` and the project's key/placeholder check (SONUB-DEV-GUIDE "translation").
- Arabic and Urdu are RTL: open `/ar/...` and check the rail, the strike direction, the nudges and the "›" mirror.

## State and saving

- The server is the source (SSOT: progress follows the account across devices). Store task completion per user (a table or a JSON column), render `data-done` from it, and mark tasks completed since the last render with `data-wizard-new` once (or rely on `data-wizard-save`'s local snapshot).
- In-page actions (`data-wizard-done`, `data-wizard-ack`, `data-wizard-skip`) must call a `routes/web.php` endpoint from a `wizard:check` / `wizard:skip` listener with the CSRF token; forms in a one-step wizard save on `wizard:finish` (call `preventDefault()`, POST, then `wizard.go(...)`).
- Never put personal state into publicly cached HTML.

## Art

Section illustrations, finale trophies and empty-state pictures are images: make them **only with the Codex CLI** (`codex exec "<prompt>" -i <ref>` — prompt before `-i`; never SVG/CSS/Canvas drawing). Flat, soft shapes, the site's palette, 1:1, one style for all sections; save WebP under `public/images/<section>/wizard/` with the prompt text beside it. Until then use `.wizard-art-tile` with an emoji or a Font Awesome icon.

## Tests and checks

- Pest (`tests/Feature`): the page renders the widget, states come out as attributes (`data-done`, `data-locked`, `aria-current`), labels exist in all 17 locales, `public/js/wizard.js` and `public/css/wizard.css` equal the skill copies, the kit loads once (`substr_count($html, '/css/wizard.css') === 1`).
- Browser: `node skills/wizard/scripts/check.mjs https://sonub.localhost:7843/<page> --out /tmp/wizard-check` (errors 0), also `--width 390` and `/ar/...`; look at the frames; then the three themes.
- `LayoutTest` / `MenuPagesTest` when shared layouts change (AGENTS.md workflow).
