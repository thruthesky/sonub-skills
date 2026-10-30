#!/usr/bin/env node
// Check a page with wizard kit elements ([data-wizard="steps"|"checklist"]) the way crawlers, readers and the kit meet it.
//
//   node scripts/check.mjs <url-or-file> [--times 0.12,0.35,0.7] [--width 1280] [--height 900] [--out ./wizard-check] [--wait 3000] [--eval "<js>"]
//
// Passes in headless Chrome:
//   1. JavaScript off  — every step and checklist item is visible; its text is the "source" text.
//   2. normal          — scroll through, wait: every wizard prepared (.wizard-on), nothing stuck hidden (.wizard-wait),
//                        one visible step per steps-wizard, one aria-current item per unfinished checklist, progress values right;
//                        then DRIVE it: go() through every step and check() the current task of every checklist —
//                        after each change: one visible step, text unchanged, no leftover motion classes, particles removed.
//   3. reduced motion  — nothing hidden, nothing moving, even right after a change.
//   4. frames          — the first steps-wizard's Next transition frozen at each --times value (seconds after the click)
//                        → <out>/step-<t>.png, the first check-off → <out>/check-<t>.png, and the whole page → <out>/page.png.
// Exit code 1 when an error is found. Needs Node 22+ (built-in WebSocket) and Chrome/Chromium (CHROME_PATH to override).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : fallback;
};
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!target) {
    console.error('usage: node check.mjs <url-or-file> [--times 0.12,0.35,0.7] [--width 1280] [--height 900] [--out dir] [--wait 3000] [--eval "<js>"]');
    process.exit(2);
}
const url = fs.existsSync(target) ? pathToFileURL(path.resolve(target)).href : target;
const times = opt('times', '0.12,0.35,0.7').split(',').map(Number).filter((n) => !isNaN(n));
const width = Number(opt('width', 1280));
const height = Number(opt('height', 900));
const wait = Number(opt('wait', 3000));
const out = path.resolve(opt('out', './wizard-check'));
const probe = opt('eval', '');

const chromePath = process.env.CHROME_PATH || [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find((p) => fs.existsSync(p));
if (!chromePath) {
    console.error('Chrome not found — set CHROME_PATH');
    process.exit(2);
}

fs.mkdirSync(out, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'wizard-check-'));
const chrome = spawn(chromePath, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--ignore-certificate-errors',
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const cleanup = async () => {
    if (chrome.exitCode === null) {
        const exited = new Promise((r) => chrome.once('exit', r));
        chrome.kill();
        await Promise.race([exited, new Promise((r) => setTimeout(r, 3000))]);
    }
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* temp dir */ }
};

const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error('Chrome did not start')), 15000);
    chrome.stderr.on('data', (d) => {
        buf += d;
        const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
        if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    chrome.on('exit', () => reject(new Error('Chrome exited: ' + buf.slice(-400))));
}).catch(async (e) => { console.error(e.message); await cleanup(); process.exit(1); });

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
        listeners.forEach((l) => l(msg));
    }
});
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});
const once = (method, sessionId, ms = 30000) => new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    const l = (msg) => {
        if (msg.method === method && msg.sessionId === sessionId) {
            clearTimeout(timer);
            listeners.splice(listeners.indexOf(l), 1);
            resolve(msg);
        }
    };
    listeners.push(l);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs in the page: every wizard, its steps/items, visibility and text.
const COLLECT = `(() => {
    const norm = (t) => t.replace(/\\s+/g, ' ').trim();
    const shown = (el) => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.99 || n.hidden) return false; } return true; };
    return [...document.querySelectorAll('[data-wizard]')].map((w, wi) => ({
        wi, kind: w.dataset.wizard, name: (w.getAttribute('aria-label') || w.querySelector('.wizard-title')?.textContent || '').trim().slice(0, 40),
        on: w.classList.contains('wizard-on'), wait: w.classList.contains('wizard-wait'), collapsed: w.classList.contains('wizard-collapsed'),
        parts: [...w.querySelectorAll('[data-wizard-step], [data-wizard-item]')].map((p, i) => ({ i, text: norm(p.textContent), visible: shown(p), done: p.hasAttribute('data-done'), current: p.getAttribute('aria-current') === 'step' || p.classList.contains('wizard-current') })),
        now: w.querySelector('.wizard-progress')?.getAttribute('aria-valuenow'), max: w.querySelector('.wizard-progress')?.getAttribute('aria-valuemax'),
        left: w.querySelectorAll('.wizard-leaving, .wizard-entering, .wizard-checking, .wizard-arrive, .wizard-unlocking, .wizard-skipping').length,
    }));
})()`;
const FREEZE = (ms) => `(() => { document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ${ms}; }); return true; })()`;

const report = { url, checkedAt: new Date().toISOString(), errors: [], warnings: [] };
const err = (kind, list, hint) => list.length && report.errors.push({ kind, hint, items: list });
const warn = (kind, list, hint) => list.length && report.warnings.push({ kind, hint, items: list });

try {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }, sessionId);
    const open = async (u) => {
        const loaded = once('Page.loadEventFired', sessionId);
        await send('Page.navigate', { url: u }, sessionId);
        await loaded;
        await send('Runtime.evaluate', { expression: 'localStorage.clear(); document.fonts ? document.fonts.ready.then(() => true) : true', awaitPromise: true }, sessionId);
    };
    const run = async (expression) => {
        const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
        if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
        return result.value;
    };
    const scrollAll = async () => {
        const total = await run('document.scrollingElement.scrollHeight');
        for (let y = 0; y <= total + height; y += Math.round(height * 0.6)) { await run(`scrollTo(0, ${y})`); await sleep(140); }
        await run('scrollTo(0, 0)');
    };
    const shot = async (file, full = false) => {
        const metrics = await send('Page.getLayoutMetrics', {}, sessionId);
        const h = full ? Math.min(Math.ceil(metrics.cssContentSize.height), 16000) : height;
        const y = full ? 0 : await run('scrollY');
        const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, clip: { x: 0, y, width, height: h, scale: 1 } }, sessionId);
        fs.writeFileSync(path.join(out, file), Buffer.from(r.data, 'base64'));
        report.frames.push(path.join(out, file));
    };
    report.frames = [];

    // 1. JavaScript off
    await send('Emulation.setScriptExecutionDisabled', { value: true }, sessionId);
    await open(url);
    const source = await run(COLLECT);
    await send('Emulation.setScriptExecutionDisabled', { value: false }, sessionId);
    report.wizards = source.length;
    err('hidden-without-js', source.flatMap((w) => w.parts.filter((p) => !p.visible).map((p) => `${w.kind} "${w.name}" part ${p.i}`)),
        'A step or task is invisible without JS. Hide only under .wizard-js / .wizard-on (wizard.css), never in plain CSS or with hidden.');
    if (!source.length) err('no-wizard', ['no [data-wizard] element'], 'Nothing to check.');

    // 2. normal run
    await open(url);
    await scrollAll();
    await sleep(wait);
    const ready = await run(COLLECT);
    const textOf = (w) => new Map(source[w.wi]?.parts.map((p) => [p.i, p.text]) || []);
    err('not-prepared', ready.filter((w) => !w.on).map((w) => `${w.kind} "${w.name}"`), 'wizard.js did not prepare this element (script missing, JS error, or no steps/items inside).');
    err('stuck-hidden', ready.filter((w) => w.wait).map((w) => `${w.kind} "${w.name}"`), 'Still waiting for its entrance after scrolling through — IntersectionObserver never fired?');
    for (const w of ready) {
        if (w.kind === 'steps') {
            const vis = w.parts.filter((p) => p.visible).length;
            if (vis !== 1) report.errors.push({ kind: 'steps-visible', hint: 'A steps-wizard must show exactly one step.', items: [`"${w.name}": ${vis} visible`] });
        } else if (w.kind === 'checklist') {
            const open = w.parts.filter((p) => !p.done).length, cur = w.parts.filter((p) => p.current).length;
            if (open && cur !== 1 && !w.collapsed) warn('no-current', [`"${w.name}": ${cur} current`], 'An unfinished checklist should have one aria-current="step" task (all remaining tasks locked?).');
            if (String(w.max) !== String(w.parts.length)) err('progress-max', [`"${w.name}": aria-valuemax ${w.max}, items ${w.parts.length}`], 'The progress bar does not count every task.');
        }
    }

    // drive every wizard
    const driven = await run(`(async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const norm = (t) => t.replace(/\\s+/g, ' ').trim();
        const out = [];
        for (const [wi, w] of [...document.querySelectorAll('[data-wizard]')].entries()) {
            if (w.dataset.wizard === 'steps') {
                const steps = [...w.querySelectorAll('[data-wizard-step]')];
                for (let k = 1; k < steps.length; k++) {
                    window.wizard.go(w, k); await sleep(1900);
                    const vis = steps.filter((s) => getComputedStyle(s).display !== 'none');
                    out.push({ wi, k, kind: 'steps', vis: vis.length, isK: vis[0] === steps[k], text: norm(steps[k].textContent), left: w.querySelectorAll('.wizard-leaving, .wizard-entering').length, cur: w.querySelector('.wizard-dot[aria-current="step"]') ? 1 : 0, finale: steps[k].hasAttribute('data-wizard-finale') });
                }
                window.wizard.go(w, 0); await sleep(1600);
            } else if (w.dataset.wizard === 'checklist') {
                const cur = w.querySelector('[data-wizard-item][aria-current="step"]');
                if (!cur) continue;
                const before = +w.querySelector('.wizard-progress').getAttribute('aria-valuenow');
                window.wizard.check(cur); await sleep(2300);
                out.push({ wi, kind: 'checklist', id: cur.id, done: cur.hasAttribute('data-done'), before, after: +w.querySelector('.wizard-progress').getAttribute('aria-valuenow'), left: w.querySelectorAll('.wizard-checking, .wizard-arrive, .wizard-unlocking').length, cur: w.querySelectorAll('[aria-current="step"]').length, open: w.querySelectorAll('[data-wizard-item]:not([data-done], [data-skipped])').length });
            }
        }
        await sleep(3600);
        return { out, fx: document.querySelector('.wizard-fx')?.children.length || 0 };
    })()`);
    for (const d of driven.out) {
        const w = ready[d.wi];
        if (d.kind === 'steps') {
            if (d.vis !== 1 || !d.isK) err('step-not-shown', [`"${w.name}" step ${d.k}: ${d.vis} visible, right one: ${d.isK}`], 'go(k) did not end with exactly step k visible.');
            if (d.left) err('motion-left', [`"${w.name}" step ${d.k}: ${d.left} element(s)`], 'Transition classes stayed after the step change.');
            if (!d.cur && !d.finale) err('no-aria-current', [`"${w.name}" step ${d.k}`], 'The rail has no aria-current="step" dot.');
            if (d.text !== textOf(w).get(d.k)) err('text-changed', [`"${w.name}" step ${d.k}`], 'The step text differs from the HTML after the transition.');
        } else {
            if (!d.done || d.after !== d.before + 1) err('check-failed', [`"${w.name}" ${d.id}: done ${d.done}, progress ${d.before} → ${d.after}`], 'check() did not mark the task done and move the progress by one.');
            if (d.left) err('motion-left', [`"${w.name}": ${d.left} element(s)`], 'Check-off classes stayed after the animation.');
            if (d.open && d.cur !== 1) warn('no-current-after', [`"${w.name}": ${d.cur} current after check`], 'After a check-off the next open task should become current.');
        }
    }
    if (driven.fx) err('particles-left', [`${driven.fx} particle box(es)`], 'Sparks/confetti were not removed (they must be gone ≤ 3.4 s).');
    await run('scrollTo(0, 0)');
    await sleep(300);
    await shot('page.png', true);

    // 3. reduced motion
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
    await open(url);
    await sleep(300);
    const calm = await run(COLLECT);
    err('hidden-reduced-motion', calm.flatMap((w) => [...(w.wait ? [`"${w.name}" waiting`] : []), ...(w.kind === 'checklist' && !w.collapsed ? w.parts.filter((p) => !p.visible).map((p) => `"${w.name}" item ${p.i}`) : [])]), 'With reduced motion everything shows at once.');
    const moving = await run(`(async () => {
        const w = document.querySelector('[data-wizard="steps"]'); if (w) window.wizard.next(w);
        const c = document.querySelector('[data-wizard="checklist"] [aria-current="step"]'); if (c) window.wizard.check(c);
        await new Promise((r) => setTimeout(r, 120));
        return document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.effect?.target?.tagName || '').toLowerCase() + '.' + String(a.effect?.target?.className || '').split(' ')[0] + ' ' + (a.animationName || '')).slice(0, 20);
    })()`);
    err('moving-reduced-motion', moving, 'Something animates with prefers-reduced-motion: keep motion inside @media (prefers-reduced-motion: no-preference) and gate JS effects with still().');
    await send('Emulation.setEmulatedMedia', { features: [] }, sessionId);

    // 4. frames: the Next transition of the first steps-wizard and the first check-off, frozen at t seconds
    const stage = async (prefix, trigger) => {
        for (const t of times) {
            await open(url);
            await scrollAll();
            const ok = await run(`(async () => { const r = (${trigger})(); if (!r) return false; r.scrollIntoView({ block: 'center' }); await new Promise((x) => setTimeout(x, 2800)); return true; })()`);
            if (!ok) return;
            await run(`(${trigger})(true)`);
            await sleep(Math.round(t * 1000));
            await run(FREEZE(Math.round(t * 1000)));
            await sleep(80);
            if (probe) console.log(`  ${prefix} t=${t}s eval → ${JSON.stringify(await run(probe))}`);
            await shot(`${prefix}-${t}.png`);
        }
    };
    // trigger(go): without go → return the element to look at; with go → start the change
    await stage('step', `(go) => { const w = document.querySelector('[data-wizard="steps"]'); if (!w) return null; if (go) window.wizard.go(w, 1); return w; }`);
    await stage('check', `(go) => { const w = [...document.querySelectorAll('[data-wizard="checklist"]')].find((x) => x.querySelector('[aria-current="step"]') && !x.classList.contains('wizard-collapsed')); if (!w) return null; if (go) window.wizard.check(w.querySelector('[aria-current="step"]')); return w; }`);

    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ ...report, driven }, null, 2));
    console.log(`wizard check  ${url}`);
    console.log(`  wizards: ${source.length}  changes driven: ${driven.out.length}  errors: ${report.errors.length}  warnings: ${report.warnings.length}`);
    for (const e of report.errors) console.log(`  ✗ ${e.kind} (${e.items.length}) — ${e.hint}\n      ${e.items.slice(0, 6).join('\n      ')}`);
    for (const w of report.warnings) console.log(`  ! ${w.kind} (${w.items.length}) — ${w.hint}\n      ${w.items.slice(0, 6).join('\n      ')}`);
    console.log(`  frames: ${report.frames.map((f) => path.basename(f)).join(' · ')}  (in ${out})`);
    if (report.errors.length) process.exitCode = 1;
} catch (e) {
    console.error(e.message);
    process.exitCode = 1;
} finally {
    ws.close();
    await cleanup();
}
