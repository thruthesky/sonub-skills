#!/usr/bin/env node
// Screenshot an HTML infographic at several widths and run scripts/audit.js on each.
//
//   node scripts/check.mjs <url-or-file> [--widths 1440,768,390] [--out ./info-check]
//                          [--selector body] [--height 900] [--wait 800] [--eval "<js>"] [--format png|webp|jpeg] [--clip] [--motion]
//
// The audit runs with prefers-reduced-motion: reduce, so webmovie shows the final frame (the plain HTML) and moving pieces
// are not reported as clipped or overlapping; --motion keeps the normal setting. It also reports "motion" — the webmovie
// kit and shots on the page (required: SKILL.md "Step 0"). Check the motion itself with webmovie's own scripts/check.mjs.
//
// --format webp captures smaller files (an example screenshot for a skill or a doc); --clip captures only the --selector box.
// --eval runs JavaScript in the page after it loads and before the audit — use it to check another state,
// e.g. a theme: --eval "document.documentElement.dataset.sonubTheme='dark';document.documentElement.classList.add('wa-dark')".
// A value the expression returns is printed (handy for reading positions: --eval "[...document.querySelectorAll('path')].map(p => p.getAttribute('d'))").
//
// Writes <out>/<width>.png (full page), <out>/<width>-01.png … (screen-sized slices you can actually read,
// skip with --no-slices) and <out>/report.json, and prints a short summary per width.
// Needs Node 22+ (built-in WebSocket) and Chrome/Chromium (set CHROME_PATH to override).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : fallback;
};
const flags = ['--no-slices', '--clip', '--motion'];
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && !flags.includes(args[i - 1])));
if (!target) {
    console.error('usage: node check.mjs <url-or-file> [--widths 1440,768,390] [--out dir] [--selector body] [--height 900] [--wait 800] [--eval js] [--format png|webp|jpeg] [--clip] [--motion]');
    process.exit(2);
}
const url = fs.existsSync(target) ? pathToFileURL(path.resolve(target)).href : target;
const widths = opt('widths', '1440,768,390').split(',').map(Number).filter(Boolean);
const out = path.resolve(opt('out', './info-check'));
const selector = opt('selector', 'body');
const height = Number(opt('height', 900));
const wait = Number(opt('wait', 800));
const slices = !args.includes('--no-slices');
const before = opt('eval', '');
const format = ['png', 'webp', 'jpeg'].includes(opt('format', 'png')) ? opt('format', 'png') : 'png';
const clipToSelector = args.includes('--clip');
const keepMotion = args.includes('--motion');
const auditSource = fs.readFileSync(path.join(here, 'audit.js'), 'utf8');

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
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'info-check-'));
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
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* temp dir, ignore */ }
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

const report = { url, selector, checkedAt: new Date().toISOString(), widths: {} };
try {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    if (!keepMotion) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId);
    for (const width of widths) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }, sessionId);
        const loaded = once('Page.loadEventFired', sessionId);
        await send('Page.navigate', { url }, sessionId);
        await loaded;
        await send('Runtime.evaluate', { expression: 'document.fonts ? document.fonts.ready.then(() => true) : true', awaitPromise: true }, sessionId);
        if (before) {
            const { result: value } = await send('Runtime.evaluate', { expression: before, awaitPromise: true, returnByValue: true }, sessionId);
            if (value && value.value !== undefined) console.log(`${width}px  eval → ${JSON.stringify(value.value)}`);
        }
        await new Promise((r) => setTimeout(r, wait));
        const { result, exceptionDetails } = await send('Runtime.evaluate', {
            expression: `${auditSource}\ninfographicAudit(${JSON.stringify(selector)})`,
            returnByValue: true,
        }, sessionId);
        if (exceptionDetails) throw new Error('audit failed: ' + (exceptionDetails.exception?.description || exceptionDetails.text));
        const metrics = await send('Page.getLayoutMetrics', {}, sessionId);
        const fullHeight = Math.min(Math.ceil(metrics.cssContentSize.height), 16000);
        let area = { x: 0, y: 0, width, height: fullHeight, scale: 1 };
        if (clipToSelector) {
            const { result: box } = await send('Runtime.evaluate', {
                expression: `(() => { const r = (document.querySelector(${JSON.stringify(selector)}) || document.body).getBoundingClientRect();
                    return { x: Math.max(0, r.left + scrollX - 16), y: Math.max(0, r.top + scrollY - 16), width: r.width + 32, height: Math.min(r.height + 32, 16000) }; })()`,
                returnByValue: true,
            }, sessionId);
            area = { ...box.value, scale: 1 };
        }
        const shot = await send('Page.captureScreenshot', {
            format, quality: format === 'png' ? undefined : 80, captureBeyondViewport: true, clip: area,
        }, sessionId);
        const file = path.join(out, `${width}.${format}`);
        fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
        const pieces = [];
        if (slices && fullHeight > height) {
            for (let y = 0, n = 1; y < fullHeight; y += height, n++) {
                const piece = await send('Page.captureScreenshot', {
                    format, quality: format === 'png' ? undefined : 80, captureBeyondViewport: true, clip: { x: 0, y, width, height: Math.min(height, fullHeight - y), scale: 1 },
                }, sessionId);
                const name = path.join(out, `${width}-${String(n).padStart(2, '0')}.${format}`);
                fs.writeFileSync(name, Buffer.from(piece.data, 'base64'));
                pieces.push(name);
            }
        }
        const a = result.value;
        report.widths[width] = { screenshot: file, slices: pieces, ...a };
        console.log(`${width}px  overflowX:${a.pageOverflowX ? 'YES' : 'no'}  clipped:${a.clipped.length}  scrolledX:${a.scrolledX.length}  brokenShort:${a.brokenShort.length}  overlaps:${a.overlaps.length}`
            + `  tinyText:${a.tinyText.length}  levels:${a.typeScale.levels} (title/body ${a.typeScale.titleToBody})`
            + `  equalCardRows:${a.equalCardRows.length}  lowContrast:${a.lowContrast.length}  → ${file}${pieces.length ? ` + ${pieces.length} slices` : ''}`);
        const v = a.visuals;
        console.log(`        crowding: lines:${a.crowdedLines.length}${a.crowdedLines.length ? ' ✗' : ''}  marks:${a.crowdedMarks.length}${a.crowdedMarks.length ? ' ✗' : ''}  edges:${a.hugEdges.length}${a.hugEdges.length ? ' ✗' : ''}`
            + (a.crowdedLines.length || a.crowdedMarks.length || a.hugEdges.length ? '  — lines/dots too close to follow (references/readability.md R10)' : '')
            + `  unlinked:${a.unlinkedNodes.length}` + (a.unlinkedNodes.length ? ` (${a.unlinkedNodes.slice(0, 3).map((t) => t.slice(0, 20)).join(' · ')}) — no page? (SKILL.md "Link every item")` : ''));
        console.log(`        visuals: images:${v.images}${v.images ? '' : ' ✗'} (${v.imageShare}% of area)  lines:${v.lines}${v.lines ? '' : ' ✗'}  longText:${v.longText.length}`
            + (v.images && v.lines ? '' : '  — an infographic needs pictures AND lines (SKILL.md "The four must-haves")'));
        const m = a.motion;
        console.log(`        motion: webmovie kit:${m.kit ? 'yes' : 'no ✗'}  shots:${m.shots}${m.shots ? '' : ' ✗'}  line layers:${m.lineLayers}  player:${m.player}`
            + (m.kit && m.shots ? '' : '  — not made with webmovie: upgrade it (SKILL.md "Step 0" and "Every task updates the infographic")'));
        console.log(`        largest: ${a.largestText.slice(0, 3).map((t) => `${t.px}px "${t.text.slice(0, 40)}"`).join(' · ')}`);
        console.log(`        blocks (first-screen %): ${a.blocks.slice(0, 4).map((b) => `${b.firstScreenShare}% ${b.el.slice(0, 30)}`).join(' · ')}`);
    }
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`report → ${path.join(out, 'report.json')}`);
} catch (e) {
    console.error(e.message);
    process.exitCode = 1;
} finally {
    ws.close();
    await cleanup();
}
