#!/usr/bin/env node
// Check a web animation page the way search engines, translators and readers meet it.
//
//   node scripts/check.mjs <url-or-file> [--times 0.15,0.4,3] [--width 1280] [--height 900] [--out ./webmovie-check] [--wait 3500] [--selector body] [--eval "<js>"]
//
// Three passes in headless Chrome:
//   1. JavaScript off   — every [data-webmovie] / [data-webmovie-rotate] element must be visible, and its text is the "source" text.
//   2. normal           — scroll through the page, wait --wait ms: nothing stuck hidden, no split spans left, text equal to the source,
//                         no endless animation on text, no animated layout properties (width, top, margin, font-size …).
//   3. reduced motion   — nothing hidden, nothing moving.
// Then screenshots of the frozen frames (?webmovie-t=<s>, see assets/webmovie.js) at each --times value → <out>/t-<s>.png, and report.json.
// --eval runs JavaScript in each frozen frame and prints what it returns (read a state: --eval "getComputedStyle(document.querySelector('h1')).opacity").
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
    console.error('usage: node check.mjs <url-or-file> [--times 0.15,0.4,3] [--width 1280] [--height 900] [--out dir] [--wait 3500] [--selector body] [--scroll .scroll-container]');
    process.exit(2);
}
const url = fs.existsSync(target) ? pathToFileURL(path.resolve(target)).href : target;
const times = opt('times', '0.15,0.4,3').split(',').map(Number).filter((n) => !isNaN(n));
const width = Number(opt('width', 1280));
const height = Number(opt('height', 900));
const wait = Number(opt('wait', 3500));
const selector = opt('selector', 'body');
const scrollSelector = opt('scroll', ''); // App workspaces may scroll inside a fixed-height pane.
const out = path.resolve(opt('out', './webmovie-check'));
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
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'webmovie-check-'));
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

// Runs in the page: describe every animated element (text, visibility) inside the selector.
const COLLECT = `(() => {
    const root = document.querySelector(${JSON.stringify(selector)}) || document.body;
    const norm = (t) => t.replace(/\\s+/g, ' ').trim();
    // key = tag + index among same-tag siblings, so an element a script inserts (an ig-lines svg, a toast) does not shift the others
    const key = (el) => { const parts = []; for (let n = el; n && n !== root; n = n.parentElement) parts.unshift(n.tagName + ':' + Array.prototype.filter.call(n.parentElement.children, (c) => c.tagName === n.tagName).indexOf(n)); return parts.join('>'); };
    const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.dataset.webmovie ? '[data-webmovie=' + el.dataset.webmovie + ']' : el.hasAttribute('data-webmovie-rotate') ? '[data-webmovie-rotate]' : '');
    const seen = (el) => { if (el.closest('.webmovie-player-on .webmovie-scene:not(.webmovie-scene-on)')) return 'skip'; let visible = true; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === 'none') return 'skip'; if (+s.opacity < 0.99 || s.visibility === 'hidden') visible = false; } return visible; };
    return Array.from(root.querySelectorAll('[data-webmovie], [data-webmovie-rotate]')).map((el, i) => ({
        i, key: key(el), el: name(el), text: norm(el.textContent), h: Math.round(el.offsetHeight ?? el.getBoundingClientRect().height), // layout height: a scale or a camera move is not a reflow
        visible: seen(el), trigger: el.dataset.webmovieTrigger || 'view',
        classes: el.className && el.className.baseVal === undefined ? el.className : (el.getAttribute('class') || ''),
    }));
})()`;

const LAYOUT = /^(width|height|inline-size|block-size|min-|max-|top|left|right|bottom|inset|margin|padding|font-size|letter-spacing|line-height|border-width|gap)/;
const SAMPLE = `(() => {
    const props = new Set(); const infinite = [];
    for (const a of document.getAnimations()) {
        const t = a.effect && a.effect.target;
        if (!t) continue;
        for (const k of a.effect.getKeyframes()) for (const p of Object.keys(k)) if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()) + '|' + (t.closest('[data-webmovie]')?.dataset.webmovie || t.className || t.tagName));
        const timing = a.effect.getComputedTiming();
        if (timing.iterations === Infinity && (t.textContent || '').trim() && !String(t.className).includes('skeleton')) infinite.push((t.tagName || '').toLowerCase() + '.' + String(t.className).split(' ')[0] + ' ' + (a.animationName || ''));
    }
    return { props: [...props], infinite: [...new Set(infinite)] };
})()`;

const report = { url, selector, checkedAt: new Date().toISOString(), errors: [], warnings: [] };
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
        await send('Runtime.evaluate', { expression: 'document.fonts ? document.fonts.ready.then(() => true) : true', awaitPromise: true }, sessionId);
    };
    const run = async (expression) => {
        const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
        if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
        return result.value;
    };

    // 1. JavaScript off — what a crawler without JS, a reader-mode and a failed script see.
    await send('Emulation.setScriptExecutionDisabled', { value: true }, sessionId);
    await open(url);
    const source = await run(COLLECT);
    await send('Emulation.setScriptExecutionDisabled', { value: false }, sessionId);
    err('hidden-without-js', source.filter((e) => e.visible === false).map((e) => e.el),
        'Text is invisible when JS does not run. Hide only under html.webmovie-js (assets/webmovie.css), never in plain CSS.');
    report.elements = source.length;
    report.notInHtml = 0; // set below: animated elements that exist only after JS (not in the HTML a crawler without JS reads)

    // 2. normal run — scroll like a reader so every element enters the view.
    await open(url);
    const seenProps = new Set();
    const infinite = new Set();
    const scrollRoot = scrollSelector ? `document.querySelector(${JSON.stringify(scrollSelector)})` : 'document.scrollingElement';
    const total = await run(`${scrollRoot}.scrollHeight`);
    const scrollHeight = await run(`${scrollRoot}.clientHeight`);
    for (let y = 0, k = 0; k < 60; y += Math.round(scrollHeight * 0.6), k++) {
        await run(`${scrollRoot}.scrollTo(0, ${y})`);
        await sleep(160);
        const s = await run(SAMPLE);
        s.props.forEach((p) => seenProps.add(p));
        s.infinite.forEach((p) => infinite.add(p));
        if (y > total) break;
    }
    await sleep(wait);
    const s2 = await run(SAMPLE);
    // Movies keep playing scene after scene: stop them and end the current scene before reading the final text.
    await run(`window.webmovie?.stopSpotlights?.(), true`); // spotlight cues back to the plain HTML before reading the text
    report.movies = await run(`(() => { const m = [...document.querySelectorAll('.webmovie-player-on')]; m.forEach((el) => { window.webmovie.pause(el); el.querySelectorAll('[data-webmovie]').forEach((e) => window.webmovie.finish(e)); el.querySelectorAll('.webmovie-scene-on').forEach((sc) => sc.getAnimations().forEach((a) => a.animationName === 'webmovie-scene-in' && a.finish())); }); return m.length; })()`);
    const controls = await run(`[...document.querySelectorAll('.webmovie-player-on')].filter((m) => !m.querySelector('.webmovie-toggle')).length`);
    if (controls) err('movie-no-pause', [`${controls} movie(s)`], 'A movie without its play/pause button (WCAG 2.2.2).');
    s2.infinite.forEach((p) => infinite.add(p));
    s2.props.forEach((p) => seenProps.add(p));
    const after = await run(COLLECT);
    const byKey = new Map(source.map((e) => [e.key, e]));
    const leftovers = await run(`document.querySelectorAll(${JSON.stringify(selector)} + ' .webmovie-word').length`);
    // only elements with words count — a script-drawn svg of connector lines has no text to index
    const jsOnly = after.filter((e) => !byKey.has(e.key) && e.text);
    report.notInHtml = jsOnly.length;
    warn('js-only-content', jsOnly.map((e) => e.el).slice(0, 12),
        'These animated elements are created by JavaScript — their text is not in the HTML. Render the words on the server (SEO, translation).');
    const passive = (e) => ['hover', 'click', 'manual'].includes(e.trigger);
    err('stuck-hidden', after.filter((e) => e.visible === false && !passive(e)).map((e) => e.el),
        'Still invisible after scrolling and waiting — the element never played (manual trigger? display:none parent? JS error?).');
    err('text-changed', after.filter((e) => byKey.has(e.key) && e.text !== byKey.get(e.key).text && !e.el.includes('data-webmovie-rotate'))
        .map((e) => `${e.el}: "${byKey.get(e.key).text.slice(0, 60)}" → "${e.text.slice(0, 60)}"`),
        'After the animation the text differs from the HTML. The final frame must be the original text (counters end on the server value).');
    if (leftovers) err('split-left', [`${leftovers} .webmovie-word spans`], 'Split spans were not restored after the animation (still playing? raise --wait).');
    const layout = [...seenProps].filter((p) => LAYOUT.test(p.split('|')[0]));
    warn('layout-property', layout, 'Animating layout properties reflows the page every frame. Use translate / scale / clip-path / opacity instead (references/principles.md).');
    warn('endless-text', [...infinite], 'Moving text that never stops needs a pause button (WCAG 2.2.2). Give it a finite iteration count.');
    const media = await run(`({ video: document.querySelectorAll('video').length, canvas: document.querySelectorAll('canvas').length, gif: document.querySelectorAll('img[src$=".gif" i]').length })`);
    if (media.video || media.canvas || media.gif) warn('pixels', [`video:${media.video} canvas:${media.canvas} gif:${media.gif}`], 'Text inside video, canvas or GIF is not indexable or translatable — keep words as HTML on top.');

    // 3. reduced motion — the final frame, nothing moving.
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
    await open(url);
    await sleep(300);
    const calm = await run(COLLECT);
    const moving = await run(`document.getAnimations().filter((a) => a.playState === 'running' && !String(a.effect?.target?.className || '').includes('skeleton')).map((a) => (a.effect.target.tagName || '').toLowerCase() + '.' + String(a.effect.target.className).split(' ')[0] + ' ' + (a.animationName || '')).slice(0, 20)`);
    err('hidden-reduced-motion', calm.filter((e) => e.visible === false).map((e) => e.el), 'With prefers-reduced-motion the content must show at once.');
    err('moving-reduced-motion', moving, 'Something still animates with prefers-reduced-motion: put the motion inside @media (prefers-reduced-motion: no-preference).');
    await send('Emulation.setEmulatedMedia', { features: [] }, sessionId);

    // 4. frozen frames for the eye — every element plays at once and stops at t.
    report.frames = [];
    const doneByKey = new Map(after.map((e) => [e.key, e]));
    const last = Math.max(...times);
    for (const t of times) {
        const u = new URL(url);
        u.searchParams.set('webmovie-t', String(t));
        await open(u.href);
        await run('new Promise((r) => { const f = () => (window.__webmovieReady ? r(true) : setTimeout(f, 50)); f(); setTimeout(() => r(false), 5000); })');
        await sleep(120);
        if (t === last) {
            // Split (frozen) vs put back (done): a different height means the lines jump when the text is restored.
            const split = await run(COLLECT);
            warn('reflow', split.filter((e) => e.text && doneByKey.has(e.key) && Math.abs(e.h - doneByKey.get(e.key).h) > 2)
                .map((e) => `${e.el}: ${e.h}px while moving, ${doneByKey.get(e.key).h}px after`),
                'Lines break differently while the text is split, so it jumps when restored. Check word-break / white-space on that element (references/presets.md "Splitting").');
        }
        if (probe) console.log(`  t=${t}s eval → ${JSON.stringify(await run(probe))}`);
        const metrics = await send('Page.getLayoutMetrics', {}, sessionId);
        const h = Math.min(Math.ceil(metrics.cssContentSize.height), 16000);
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: h, scale: 1 } }, sessionId);
        const file = path.join(out, `t-${t}.png`);
        fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
        report.frames.push(file);
    }

    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`webmovie check  ${url}`);
    console.log(`  elements: ${source.length}  errors: ${report.errors.length}  warnings: ${report.warnings.length}`);
    for (const e of report.errors) console.log(`  ✗ ${e.kind} (${e.items.length}) — ${e.hint}\n      ${e.items.slice(0, 6).join('\n      ')}`);
    for (const w of report.warnings) console.log(`  ! ${w.kind} (${w.items.length}) — ${w.hint}\n      ${w.items.slice(0, 6).join('\n      ')}`);
    console.log(`  frames: ${report.frames.join(' · ')}`);
    console.log(`  report → ${path.join(out, 'report.json')}`);
    if (report.errors.length) process.exitCode = 1;
} catch (e) {
    console.error(e.message);
    process.exitCode = 1;
} finally {
    ws.close();
    await cleanup();
}
