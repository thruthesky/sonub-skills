/*! wizard.js — pair with wizard.css. MIT. https://sonub.com/skills
 *
 * [data-wizard="steps"]      one step per screen: rail, progress, Back/Next, validation, loud transitions, finale.
 * [data-wizard="checklist"]  vertical checklist with progress: check-off fireworks, unlocks, skip, collapse, completion.
 *
 * The HTML is the content AND the state (data-done · data-skipped · data-locked · aria-current written by the server).
 * This script only adds navigation, progress and motion. Without JS or with reduced motion the page is the plain HTML.
 * Put it in <head> without defer (its first line marks <html> so nothing flashes). Contract: references/code.md.
 */
(() => {
    'use strict';
    if (window.wizard) return;
    const doc = document;
    doc.documentElement.classList.add('wizard-js');

    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const still = () => reduce.matches;
    const num = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
    const cssVar = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();
    const time = (el, name, d) => { const v = cssVar(el, name); return v.endsWith('ms') ? num(v, d) : v.endsWith('s') ? num(v, d / 1000) * 1000 : d; };
    const rnd = (i, k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };  // fixed 0…1
    const lang = (el) => el.closest('[lang]')?.getAttribute('lang') || 'en';
    const fmt = (el, n) => new Intl.NumberFormat(lang(el)).format(n);
    const label = (w, key, fallback, vars = {}) => (w.getAttribute('data-label-' + key) || fallback).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    const emit = (el, name, detail = {}, cancelable = false) => el.dispatchEvent(new CustomEvent('wizard:' + name, { bubbles: true, cancelable, detail }));
    const make = (tag, cls, html) => { const el = doc.createElement(tag); if (cls) el.className = cls; if (html) el.innerHTML = html; return el; };
    let uid = 0;
    const idOf = (el, p) => el.id || (el.id = `${p}-${++uid}`);
    /** Restart a one-shot CSS class (the animation lives in wizard.css) and remove it after `dur` ms. */
    const restart = (el, cls, dur) => {
        if (!el || still()) return;
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
        clearTimeout(el['wz-' + cls]); el['wz-' + cls] = setTimeout(() => el.classList.remove(cls), dur);
    };
    const store = {
        get(k) { try { return JSON.parse(localStorage.getItem('wizard:' + k)); } catch { return null; } },
        set(k, v) { try { localStorage.setItem('wizard:' + k, JSON.stringify(v)); } catch { /* private mode */ } },
    };

    /* ───────────── particles: sparks (impact) and confetti (completion) on one fixed layer ───────────── */
    let fx;
    const layer = () => { if (!fx || !fx.isConnected) { fx = make('div', 'wizard-fx'); fx.setAttribute('aria-hidden', 'true'); doc.body.append(fx); } return fx; };
    const palette = (el, name) => { const v = cssVar(el, name); return v ? v.split(/,(?![^(]*\))/).map((c) => c.trim()).filter(Boolean) : [getComputedStyle(el).color]; };
    const power = (el) => num(cssVar(el.closest('.wizard') || el, '--wizard-k'), 2.4);

    function sparks(el, n = 14, at = 0) {
        if (!el || still()) return;
        setTimeout(() => {
            const r = el.getBoundingClientRect();
            if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
            const box = make('span', 'wizard-sparks');
            box.style.left = `${r.left + r.width / 2}px`; box.style.top = `${r.top + r.height / 2}px`;
            const colors = palette(el.closest('.wizard') || el, '--wizard-burst');
            const reach = Math.max(36, Math.min(150, Math.max(r.width, r.height) * 0.9)) * (0.6 + power(el) / 4);
            for (let i = 0; i < Math.min(n, 40); i++) {
                const a = (i / n) * Math.PI * 2 + rnd(i, 1) * 0.6, d = reach * (0.55 + rnd(i, 2) * 0.7);
                const p = make('i');
                p.style.cssText = `--tx:${(Math.cos(a) * d).toFixed(1)}px;--ty:${(Math.sin(a) * d).toFixed(1)}px;--ang:${Math.round(a * 57.3 + 90)}deg;--sz:${(5 + rnd(i, 3) * 7).toFixed(1)}px;--life:${Math.round(600 + rnd(i, 4) * 500)}ms;--c:${colors[i % colors.length]}`;
                box.append(p);
            }
            layer().append(box);
            setTimeout(() => box.remove(), 1300);
        }, at);
    }

    function confetti(el, n = 120, at = 0) {
        if (!el || still()) return;
        setTimeout(() => {
            const r = el.getBoundingClientRect();
            const box = make('span', 'wizard-confetti');
            box.style.left = `${r.left + r.width / 2}px`; box.style.top = `${Math.max(40, Math.min(innerHeight - 40, r.top + r.height / 2))}px`;
            const colors = palette(el.closest('.wizard') || el, '--wizard-confetti');
            const span = Math.min(innerWidth, 1000);
            for (let i = 0; i < Math.min(n, 160); i++) {
                const a = -Math.PI / 2 + (rnd(i, 5) - 0.5) * Math.PI * 1.15, v = (0.22 + rnd(i, 6) * 0.48) * span;
                const p = make('i');
                p.style.cssText = `--tx:${Math.round(Math.cos(a) * v)}px;--ty:${Math.round(Math.sin(a) * v * 0.75)}px;--fall:${Math.round(innerHeight * (0.45 + rnd(i, 7) * 0.45))}px;--spin:${Math.round((rnd(i, 8) - 0.5) * 1440)}deg;--sz:${(7 + rnd(i, 9) * 8).toFixed(1)}px;--life:${Math.round(1900 + rnd(i, 10) * 1100)}ms;--delay:${Math.round(rnd(i, 11) * 200)}ms;--c:${colors[i % colors.length]}`;
                box.append(p);
            }
            layer().append(box);
            setTimeout(() => box.remove(), 3400);
        }, at);
    }

    /** Count a number from → to inside `out` (the final text is always set). */
    function countTo(out, from, to, render, dur = 1000, delay = 0) {
        cancelAnimationFrame(out.wzRaf); clearTimeout(out.wzDelay);
        if (still() || from === to) { out.textContent = render(to); return; }
        out.wzDelay = setTimeout(() => {
            const t0 = performance.now();
            const step = (t) => {
                const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
                out.textContent = render(Math.round(from + (to - from) * e));
                if (p < 1) out.wzRaf = requestAnimationFrame(step);
            };
            out.wzRaf = requestAnimationFrame(step);
        }, delay);
    }

    /* ───────────── shared: progress bar (+ toggle row) ───────────── */
    function meter(w) {
        let row = w.querySelector('.wizard-meter');
        let bar = w.querySelector('.wizard-progress');
        if (!bar) {
            bar = make('div', 'wizard-progress', '<div class="wizard-progress-track"><span class="wizard-progress-fill"></span><span class="wizard-progress-head"></span></div><span class="wizard-progress-text"></span>');
        }
        if (!row) { row = make('div', 'wizard-meter'); }
        if (bar.parentElement !== row) row.prepend(bar);
        bar.setAttribute('role', 'progressbar');
        bar.setAttribute('aria-valuemin', '0');
        if (!bar.hasAttribute('aria-label')) bar.setAttribute('aria-label', label(w, 'progress-name', 'Progress'));
        return { row, bar, out: bar.querySelector('.wizard-progress-text'), head: bar.querySelector('.wizard-progress-head') };
    }

    function setProgress(w, done, total, fx) {
        const s = w.wz;
        w.style.setProperty('--wizard-p', (total ? done / total : 0).toFixed(4));
        s.bar.setAttribute('aria-valuemax', total);
        s.bar.setAttribute('aria-valuenow', done);
        const render = (n) => label(w, 'progress', '{done} / {total}', { done: fmt(w, n), total: fmt(w, total), percent: fmt(w, total ? Math.round((n / total) * 100) : 0) });
        s.bar.setAttribute('aria-valuetext', render(done));
        if (s.ring) s.ring.textContent = `${fmt(w, total ? Math.round((done / total) * 100) : 0)}%`;
        if (s.out) countTo(s.out, fx ? s.shown ?? done : done, done, render, 900, 250);
        if (fx && s.shown !== undefined && s.shown !== done) {
            restart(w, 'wizard-bump', 2600);
            sparks(s.head, 10, 900);
        }
        s.shown = done;
    }

    /* ───────────── attention: the beacon gives the current call to action a few turns, then stops ───────────── */
    function beacon(w, host, wait = 1800) {
        clearTimeout(w.wzBeacon);
        if (still() || !host || w.dataset.wizardBeacon === 'off') return;
        const el = host.querySelector('[data-wizard-cta]') || host.querySelector('.wizard-btn:not(.wizard-btn-ghost), .wizard-link');
        if (!el) return;
        const cues = (w.dataset.wizardBeacon || 'pop tada glow').split(/\s+/).filter(Boolean);
        let n = 0;
        const tick = () => {
            if (!el.isConnected || n >= cues.length) return;
            const typing = w.contains(doc.activeElement) && doc.activeElement.matches('input, textarea, select');
            if (doc.hidden || typing || w.matches(':hover')) { w.wzBeacon = setTimeout(tick, 700); return; }
            restart(el, 'wizard-cue-' + cues[n++], 1200);
            w.wzBeacon = setTimeout(tick, 2200);
        };
        w.wzBeacon = setTimeout(tick, wait);
    }

    function intro(w) {
        const s = w.wz;
        w.classList.remove('wizard-wait');
        if (still()) return;
        restart(w, 'wizard-intro', 2600);
        restart(w, 'wizard-flare', 4400);
        restart(w, 'wizard-glow', 4400);
        sparks(w.querySelector('.wizard-title'), 16, 560);
        setTimeout(() => s.paint(true), 420);   // progress fills from 0 with overshoot, the number counts
        s.afterIntro?.();
    }
    const io = 'IntersectionObserver' in window
        ? new IntersectionObserver((list) => list.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); intro(en.target); } }), { rootMargin: '0px 0px -12% 0px' })
        : null;

    /* ───────────── one-step wizard ───────────── */
    function initSteps(w) {
        const steps = [...w.querySelectorAll('[data-wizard-step]')];
        if (!steps.length) return false;
        const finale = steps.findIndex((st) => st.hasAttribute('data-wizard-finale'));
        const real = finale >= 0 ? steps.length - 1 : steps.length;    // steps that count in the progress
        const free = w.hasAttribute('data-wizard-free');
        const s = (w.wz = { kind: 'steps', steps, finale, real, i: 0, max: 0, free });
        let stage = steps[0].parentElement.classList.contains('wizard-stage') ? steps[0].parentElement : null;
        if (!stage) { stage = make('div', 'wizard-stage'); steps[0].before(stage); stage.append(...steps); }
        s.stage = stage;
        const m = meter(w);
        Object.assign(s, { bar: m.bar, out: m.out, head: m.head });
        if (!m.row.isConnected) stage.before(m.row);
        s.titles = steps.map((st, i) => st.dataset.wizardTitle || st.querySelector('h1, h2, h3, h4, legend')?.textContent.trim().replace(/\s+/g, ' ') || String(i + 1));

        // rail of real steps (the finale is the goal, not a step)
        let rail = w.querySelector('.wizard-rail');
        if (!rail) {
            rail = make('ol', 'wizard-rail');
            for (let k = 0; k < real; k++) {
                const li = make('li');
                const dot = make('button', 'wizard-dot');
                dot.type = 'button';
                dot.dataset.wizardGo = String(k);
                dot.setAttribute('aria-label', label(w, 'go', 'Step {n}: {title}', { n: fmt(w, k + 1), title: s.titles[k] }));
                const name = make('span', 'wizard-rail-label');
                name.textContent = s.titles[k];
                name.setAttribute('aria-hidden', 'true');
                li.append(dot, name);
                li.style.setProperty('--i', k);
                rail.append(li);
            }
            m.row.after(rail);
        }
        s.dots = [...rail.children];
        w.style.setProperty('--wizard-stagger', `${Math.min(110, 900 / Math.max(1, real - 1))}ms`);

        // Back / Next (generated only when the page has none)
        if (!w.querySelector('[data-wizard-next]')) {
            const nav = make('div', 'wizard-nav');
            s.genBack = make('button', 'wizard-btn wizard-btn-ghost');
            s.genBack.type = 'button'; s.genBack.dataset.wizardBack = '';
            s.genBack.textContent = label(w, 'back', 'Back');
            s.genNext = make('button', 'wizard-btn', '<span></span><span class="wizard-arrow" aria-hidden="true">→</span>');
            s.genNext.type = 'button'; s.genNext.dataset.wizardNext = ''; s.genNext.dataset.wizardCta = '';
            nav.append(s.genBack, s.genNext);
            stage.after(nav);
        }
        s.live = make('p', 'wizard-sr');
        s.live.setAttribute('aria-live', 'polite');
        w.append(s.live);

        w.addEventListener('click', (e) => {
            const t = e.target.closest('[data-wizard-next], [data-wizard-back], [data-wizard-go]');
            if (!t || t.closest('[data-wizard]') !== w) return;
            e.preventDefault();
            if (t.matches('[data-wizard-next]')) next(w);
            else if (t.matches('[data-wizard-back]')) go(w, s.i - 1);
            else { const k = num(t.dataset.wizardGo, -1); if (k >= 0 && (free || k <= s.max)) go(w, k); }
        });
        w.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' || e.isComposing) return;
            if (!e.target.matches('input:not([type=checkbox], [type=radio], [type=submit], [type=button], [type=file])')) return;
            e.preventDefault();
            next(w);
        });
        if (w.tagName === 'FORM') w.addEventListener('submit', (e) => { if (s.i < real - 1) { e.preventDefault(); next(w); } });

        const saved = w.dataset.wizardSave ? store.get(w.dataset.wizardSave) : null;
        const start = Math.max(0, Math.min(steps.length - 1, saved?.i ?? steps.findIndex((st) => st.hasAttribute('data-wizard-current'))));
        s.i = start;
        s.max = Math.max(start, saved?.max ?? 0);
        steps.forEach((st, k) => st.classList.toggle('wizard-current', k === start));
        s.shown = 0;
        s.paint = (fx) => paintSteps(w, fx);
        s.afterIntro = () => beacon(w, steps[s.i], 2600);
        return true;
    }

    function paintSteps(w, fx) {
        const s = w.wz;
        const done = s.i === s.finale ? s.real : s.i;
        s.dots.forEach((li, k) => {
            const isDone = k < done, isCur = k === s.i;
            const open = s.free || k <= s.max;
            li.classList.toggle('is-done', isDone);
            li.classList.toggle('is-current', isCur);
            li.classList.toggle('is-open', open);
            const dot = li.querySelector('.wizard-dot');
            if (dot) {
                dot.disabled = !open;
                isCur ? dot.setAttribute('aria-current', 'step') : dot.removeAttribute('aria-current');
                if (fx && isDone && !li.wzDone) { restart(dot, 'wizard-stamped', 900); sparks(dot, 12, 260); }
            }
            li.wzDone = isDone;
        });
        setProgress(w, done, s.real, fx);
        if (s.genBack) s.genBack.hidden = s.i === 0 || s.i === s.finale;
        if (s.genNext) {
            s.genNext.hidden = s.i === s.finale;
            const last = s.i >= s.real - 1;
            s.genNext.firstElementChild.textContent = last ? label(w, 'finish', 'Finish') : label(w, 'next', 'Next');
        }
        s.live.textContent = s.i === s.finale ? s.titles[s.i] : label(w, 'step', 'Step {n} of {total}: {title}', { n: fmt(w, s.i + 1), total: fmt(w, s.real), title: s.titles[s.i] });
        if (w.dataset.wizardSave) store.set(w.dataset.wizardSave, { i: s.i, max: s.max });
    }

    function next(w) {
        const s = w.wz;
        if (!s || s.kind !== 'steps') return;
        const cur = s.steps[s.i];
        const bad = [...cur.querySelectorAll('input, select, textarea')].find((f) => !f.disabled && !f.checkValidity());
        if (bad) {
            restart(cur, 'wizard-shake', 650);
            restart(bad.closest('.wizard-field, .wizard-choices, label') || bad, 'wizard-error', 750);
            bad.reportValidity?.();
            bad.focus({ preventScroll: true });
            return;
        }
        if (s.i >= s.real - 1) {                                     // the last real step: finish
            if (!emit(w, 'finish', { id: cur.id || null }, true)) return;   // the app called preventDefault: it will go() itself after saving
            if (s.finale >= 0) go(w, s.finale);
            else if (w.tagName === 'FORM') w.requestSubmit();
            return;
        }
        go(w, s.i + 1);
    }

    function go(w, k) {
        const s = w.wz;
        if (!s || s.kind !== 'steps') return;
        k = Math.max(0, Math.min(s.steps.length - 1, k));
        if (k === s.i) return;
        const from = s.steps[s.i], to = s.steps[k];
        const forward = k > s.i;
        const dir = (forward ? 1 : -1) * (w.classList.contains('wizard-rtl') ? -1 : 1);
        w.style.setProperty('--wizard-dir', dir);
        s.steps.forEach((st) => st.classList.remove('wizard-leaving', 'wizard-entering'));
        clearTimeout(s.wzT);
        if (still()) {
            from.classList.remove('wizard-current');
            to.classList.add('wizard-current');
        } else {
            const h0 = s.stage.offsetHeight;
            [...to.children].forEach((c, j) => c.style.setProperty('--i', j));
            to.querySelectorAll('.wizard-choice').forEach((c, j) => c.style.setProperty('--i', j));
            from.classList.remove('wizard-current');
            from.classList.add('wizard-leaving');
            to.classList.add('wizard-current', 'wizard-entering');
            const out = time(w, '--wizard-out-dur', 420), inDur = time(w, '--wizard-in-dur', 860), delay = time(w, '--wizard-in-delay', 90);
            const h1 = Math.max(to.offsetHeight, 1);
            // the stage height glides from the old step to the new one (one element, short — the only layout animation)
            s.stage.animate([{ blockSize: `${h0}px` }, { blockSize: `${h1}px` }], { duration: Math.min(600, out + delay + 200), easing: 'cubic-bezier(0.2, 1, 0.3, 1)' });
            s.wzT = setTimeout(() => {
                from.classList.remove('wizard-leaving');
                to.classList.remove('wizard-entering');
            }, Math.max(out, delay + inDur + 900));
            setTimeout(() => from.classList.remove('wizard-leaving'), out + 20);
            restart(w, 'wizard-flare', 4300);
            sparks(to.querySelector('.wizard-step-title, h2, h3'), 12, delay + 360);
        }
        s.i = k;
        s.max = Math.max(s.max, k);
        paintSteps(w, true);
        const focusTarget = to.querySelector('.wizard-step-title, h1, h2, h3, legend') || to;
        if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
        const top = w.getBoundingClientRect().top;
        if (top < 0) w.scrollIntoView({ block: 'start', behavior: still() ? 'auto' : 'smooth' });
        emit(w, 'step', { index: k, id: to.id || null, title: s.titles[k] });
        if (k === s.finale) {
            w.classList.add('wizard-complete');
            restart(w, 'wizard-glow', 4300);
            confetti(to.querySelector('.wizard-trophy') || to, 140, time(w, '--wizard-in-delay', 90) + 380);
            emit(w, 'complete', {});
        } else {
            w.classList.remove('wizard-complete');
            beacon(w, to, 2400);
        }
    }

    /* ───────────── checklist ───────────── */
    function initChecklist(w) {
        const items = [...w.querySelectorAll('[data-wizard-item]')];
        if (!items.length) return false;
        const key = w.dataset.wizardSave;
        const saved = key ? store.get(key) : null;
        const s = (w.wz = { kind: 'checklist', items, key, shown: 0 });
        const stagger = Math.min(110, 1000 / Math.max(1, items.length - 1));
        w.style.setProperty('--wizard-stagger', `${stagger}ms`);
        items.forEach((it, i) => { idOf(it, 'wizard-item'); it.style.setProperty('--i', i); it.style.setProperty('--side', i % 2 ? -1 : 1); });
        w.querySelectorAll('.wizard-group-title').forEach((g) => { const at = items.findIndex((it) => g.compareDocumentPosition(it) & Node.DOCUMENT_POSITION_FOLLOWING); g.style.setProperty('--i', Math.max(0, at)); });
        if (w.querySelector(':scope > .wizard-art')) w.classList.add('wizard-has-art');

        const m = meter(w);
        Object.assign(s, { bar: m.bar, out: m.out, head: m.head });
        const head = w.querySelector(':scope > .wizard-head');
        const banner = w.querySelector('[data-wizard-complete]');
        s.banner = banner;
        if (!m.row.isConnected) (head ? head.after(m.row) : w.prepend(m.row));

        // everything after the meter that is not the banner/art/note goes into a collapsible panel
        let panel = w.querySelector(':scope > .wizard-panel');
        if (!panel) {
            panel = make('div', 'wizard-panel');
            const keep = [...w.children].filter((c) => c !== m.row && c !== head && c !== banner && !c.matches('.wizard-art, .wizard-note, .wizard-sr') && m.row.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
            if (keep.length) { keep[0].before(panel); panel.append(...keep); }
        }
        s.panel = panel;
        idOf(panel, 'wizard-panel');

        s.toggle = make('button', 'wizard-toggle', '<span class="wizard-toggle-text"></span><span class="wizard-chev" aria-hidden="true"></span>');
        s.toggle.type = 'button';
        s.toggle.setAttribute('aria-controls', panel.id);
        m.row.append(s.toggle);
        s.peek = make('button', 'wizard-peek', '<span class="wizard-ring"><span></span></span><span class="wizard-peek-text"></span>');
        s.peek.type = 'button';
        m.row.after(s.peek);
        s.ring = s.peek.querySelector('.wizard-ring > span');

        // tasks completed since the last visit (or marked data-wizard-new by the server) are celebrated after the entrance
        const fresh = items.filter((it) => it.hasAttribute('data-done') && (it.hasAttribute('data-wizard-new') || (saved?.done && !saved.done.includes(it.id))));
        if (!still()) fresh.forEach((it) => { it.removeAttribute('data-done'); const a = it.querySelector('[data-wizard-ack]'); if (a) a.checked = false; });
        s.fresh = still() ? [] : fresh;
        items.forEach((it) => { if (it.hasAttribute('data-locked') && it.dataset.locked !== 'manual') it.wzAuto = true; });

        w.addEventListener('click', (e) => {
            const t = e.target.closest('[data-wizard-done], [data-wizard-skip], [data-wizard-undo], .wizard-toggle, .wizard-peek');
            if (!t || t.closest('[data-wizard]') !== w) return;
            const it = t.closest('[data-wizard-item]');
            if (t === s.toggle) collapse(w, !s.collapsed);
            else if (t === s.peek) collapse(w, false);
            else if (t.matches('[data-wizard-done]')) check(it);
            else if (t.matches('[data-wizard-skip]')) skip(it);
            else if (t.matches('[data-wizard-undo]')) uncheck(it);
        });
        w.addEventListener('change', (e) => {
            const a = e.target.closest('[data-wizard-ack]');
            if (a && a.closest('[data-wizard]') === w) a.checked ? check(a.closest('[data-wizard-item]')) : uncheck(a.closest('[data-wizard-item]'));
        });

        s.collapsed = false;
        const startCollapsed = saved?.collapsed ?? w.hasAttribute('data-wizard-collapsed');
        if (startCollapsed) { panel.hidden = true; w.classList.add('wizard-collapsed'); s.collapsed = true; }
        paintToggle(w);
        s.paint = (fx) => paintChecklist(w, fx);
        s.afterIntro = () => {
            const cur = items.find((it) => it.getAttribute('aria-current') === 'step');
            if (s.fresh.length) setTimeout(() => s.fresh.forEach((it, j) => setTimeout(() => check(it), j * 1150)), 1700);
            else beacon(w, cur, 2600);
        };
        return true;
    }

    function paintToggle(w) {
        const s = w.wz;
        s.toggle.setAttribute('aria-expanded', String(!s.collapsed));
        const text = s.collapsed ? label(w, 'expand', 'View tasks') : label(w, 'collapse', 'Hide tasks');
        s.toggle.querySelector('.wizard-toggle-text').textContent = text;
        s.toggle.setAttribute('aria-label', text);
    }

    function paintChecklist(w, fx) {
        const s = w.wz;
        let blocked = false, current = null, done = 0;
        for (const it of s.items) {
            const isDone = it.hasAttribute('data-done'), isSkipped = it.hasAttribute('data-skipped');
            if (it.wzAuto && it.hasAttribute('data-locked') && !blocked) unlock(it, fx);
            const locked = it.hasAttribute('data-locked');
            if (isDone || isSkipped) done++;
            else if (!locked && !current) current = it;
            if (!isDone && !isSkipped && !it.hasAttribute('data-optional')) blocked = true;
        }
        const prev = s.items.find((it) => it.getAttribute('aria-current') === 'step');
        s.items.forEach((it) => (it === current ? it.setAttribute('aria-current', 'step') : it.removeAttribute('aria-current')));
        if (fx && current && current !== prev && s.ready) {
            restart(current, 'wizard-arrive', 1800);
            sparks(current.querySelector('.wizard-marker'), 10, 900);
            beacon(w, current, 2400);
        }
        setProgress(w, done, s.items.length, fx);
        const complete = done === s.items.length;
        const title = current?.querySelector('.wizard-item-title')?.textContent.trim().replace(/\s+/g, ' ');
        s.peek.querySelector('.wizard-peek-text').textContent = complete ? label(w, 'all-done', 'All done!') : label(w, 'next-task', 'Next: {title}', { title: title || '' });
        if (s.banner) s.banner.hidden = !complete;
        if (complete && !s.complete && s.ready) celebrate(w, fx);
        w.classList.toggle('wizard-complete', complete);
        s.complete = complete;
        s.ready = true;
        save(w);
    }

    function save(w) {
        const s = w.wz;
        if (!s.key) return;
        const pending = new Set(s.fresh || []);
        store.set(s.key, { done: s.items.filter((it) => it.hasAttribute('data-done') || pending.has(it)).map((it) => it.id), collapsed: s.collapsed });
    }

    function unlock(it, fx) {
        if (!fx || still()) { it.removeAttribute('data-locked'); return; }
        restart(it, 'wizard-unlocking', 1000);
        setTimeout(() => {
            it.removeAttribute('data-locked');
            sparks(it.querySelector('.wizard-marker'), 10);
            const w = it.closest('[data-wizard]');
            if (w?.wz) paintChecklist(w, true);
        }, 480);
    }

    function itemOf(x) { return typeof x === 'string' ? doc.getElementById(x) : x?.closest?.('[data-wizard-item]'); }

    function check(x) {
        const it = itemOf(x), w = it?.closest('[data-wizard]');
        if (!it || !w?.wz || it.hasAttribute('data-done')) return;
        const s = w.wz;
        s.fresh = (s.fresh || []).filter((f) => f !== it);
        it.removeAttribute('data-skipped');
        it.setAttribute('data-done', '');
        const a = it.querySelector('[data-wizard-ack]');
        if (a) a.checked = true;
        if (s.collapsed) collapse(w, false);
        restart(it, 'wizard-checking', 1700);
        sparks(it.querySelector('.wizard-marker'), 18, 300);
        paintChecklist(w, true);
        emit(it, 'check', { id: it.id });
    }
    function uncheck(x) {
        const it = itemOf(x), w = it?.closest('[data-wizard]');
        if (!it || !w?.wz) return;
        it.removeAttribute('data-done'); it.removeAttribute('data-skipped');
        const a = it.querySelector('[data-wizard-ack]');
        if (a) a.checked = false;
        restart(it, 'wizard-unchecking', 800);
        paintChecklist(w, true);
        emit(it, 'uncheck', { id: it.id });
    }
    function skip(x) {
        const it = itemOf(x), w = it?.closest('[data-wizard]');
        if (!it || !w?.wz || it.hasAttribute('data-done')) return;
        it.setAttribute('data-skipped', '');
        restart(it, 'wizard-skipping', 900);
        paintChecklist(w, true);
        emit(it, 'skip', { id: it.id });
    }

    function celebrate(w, fx = true) {
        const s = w.wz;
        const target = s?.banner && !s.banner.hidden ? s.banner : w.querySelector('.wizard-head') || w;
        if (fx && !still()) {
            if (s?.banner) restart(s.banner, 'wizard-celebrate', 2000);
            restart(w, 'wizard-glow', 4400);
            restart(w, 'wizard-flare', 4400);
            confetti(target, 140, 650);
            sparks(target.querySelector('.wizard-trophy, .wizard-note-icon') || target, 24, 520);
            if (s?.kind === 'checklist' && w.hasAttribute('data-wizard-autocollapse')) setTimeout(() => collapse(w, true), 4200);
        }
        emit(w, 'complete', {});
    }

    function collapse(w, on) {
        const s = w.wz;
        if (!s?.panel || s.collapsed === on) return;
        s.collapsed = on;
        paintToggle(w);
        save(w);
        const p = s.panel;
        p.getAnimations().forEach((a) => a.cancel());
        if (still()) { p.hidden = on; w.classList.toggle('wizard-collapsed', on); return; }
        if (on) {
            const h = p.offsetHeight;
            p.style.overflow = 'hidden';
            p.animate([{ blockSize: `${h}px`, opacity: 1 }, { blockSize: '0px', opacity: 0 }], { duration: 460, easing: 'cubic-bezier(0.6, 0, 0.3, 1)' }).onfinish = () => {
                p.hidden = true; p.style.removeProperty('overflow'); if (!p.getAttribute('style')) p.removeAttribute('style');
                w.classList.add('wizard-collapsed');
                restart(s.peek, 'wizard-cue-pop', 1000);
            };
        } else {
            p.hidden = false;
            w.classList.remove('wizard-collapsed');
            const h = p.offsetHeight;
            p.style.overflow = 'hidden';
            p.animate([{ blockSize: '0px', opacity: 0 }, { blockSize: `${h}px`, opacity: 1 }], { duration: 560, easing: 'cubic-bezier(0.2, 1, 0.3, 1)' }).onfinish = () => {
                p.style.removeProperty('overflow'); if (!p.getAttribute('style')) p.removeAttribute('style');
            };
            restart(w, 'wizard-reveal', 2200);
        }
    }

    /* ───────────── tilt: cards follow the pointer in 3D (pointer devices only) ───────────── */
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    doc.addEventListener('pointermove', (e) => {
        if (still() || !fine.matches) return;
        const el = e.target.closest?.('.wizard-tilt');
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--wizard-tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        el.style.setProperty('--wizard-ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
        el.wzTilt = true;
    }, { passive: true });
    doc.addEventListener('pointerout', (e) => {
        const el = e.target.closest?.('.wizard-tilt');
        if (el?.wzTilt && !el.contains(e.relatedTarget)) { el.style.setProperty('--wizard-tx', '0'); el.style.setProperty('--wizard-ty', '0'); }
    });

    /* ───────────── setup ───────────── */
    function init(w) {
        if (w.wz) return;
        if (getComputedStyle(w).direction === 'rtl') w.classList.add('wizard-rtl');
        const kind = w.dataset.wizard;
        const ok = kind === 'steps' ? initSteps(w) : kind === 'checklist' ? initChecklist(w) : false;
        if (!ok) { w.classList.add('wizard-on'); return; }
        if (!still() && io) {
            w.classList.add('wizard-wait');
            if (getComputedStyle(w).position === 'fixed') requestAnimationFrame(() => intro(w));   // a dock is always in view
            else io.observe(w);
        }
        w.classList.add('wizard-on');
        w.wz.paint(false);
        if (!still() && io) {   // start from 0 so the entrance fills the bar and counts up
            w.style.setProperty('--wizard-p', '0');
            if (w.wz.out) w.wz.out.textContent = label(w, 'progress', '{done} / {total}', { done: fmt(w, 0), total: fmt(w, w.wz.kind === 'steps' ? w.wz.real : w.wz.items.length), percent: fmt(w, 0) });
            w.wz.shown = 0;
        }
    }
    const refresh = (root = doc) => { if (root.matches?.('[data-wizard]')) init(root); root.querySelectorAll?.('[data-wizard]').forEach(init); };
    const get = (w) => (typeof w === 'string' ? doc.querySelector(w) : w)?.closest?.('[data-wizard]');

    window.wizard = {
        refresh,
        go: (w, k) => go(get(w), k),
        next: (w) => next(get(w)),
        back: (w) => { const x = get(w); if (x?.wz) go(x, x.wz.i - 1); },
        check, uncheck, skip,
        collapse: (w, on = true) => collapse(get(w), on),
        celebrate: (el) => { const w = get(el); if (w?.wz) celebrate(w); else { confetti(el); sparks(el, 24); } },
        sparks, confetti,
    };

    const start = () => {
        refresh();
        new MutationObserver((muts) => {
            for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1 && !n.classList.contains('wizard-fx') && (n.matches('[data-wizard]') || n.querySelector?.('[data-wizard]'))) refresh(n);
        }).observe(doc.documentElement, { childList: true, subtree: true });
    };
    doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', start, { once: true }) : start();
})();
