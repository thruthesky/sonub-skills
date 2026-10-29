// Headless Chrome over the DevTools protocol — no puppeteer, no npm install (Node 22+ has WebSocket built in).
// Used by make.mjs (frame capture) and capture.mjs (real UI screenshots).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

export const findChrome = () => CHROME_CANDIDATES.find((p) => fs.existsSync(p));

export async function launch({ ignoreCertErrors = false } = {}) {
    const bin = findChrome();
    if (!bin) throw new Error('Google Chrome/Chromium not found — install it or set CHROME_PATH');
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tutorio-chrome-'));
    const flags = ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars', '--no-first-run',
        '--no-default-browser-check', '--allow-file-access-from-files', '--force-color-profile=srgb', '--font-render-hinting=none', '--mute-audio'];
    if (ignoreCertErrors) flags.push('--ignore-certificate-errors');
    const chrome = spawn(bin, [...flags, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    const wsUrl = await new Promise((resolve, reject) => {
        let buf = '';
        chrome.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
        chrome.on('exit', () => reject(new Error('Chrome exited: ' + buf.slice(-300))));
    });
    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let seq = 0;
    const pending = new Map();
    const listeners = new Set();
    ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && pending.has(msg.id)) {
            const p = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
        } else if (msg.method) listeners.forEach((l) => l(msg));
    });
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });

    /** A tab with a fixed viewport. */
    async function page(width, height, { scale = 1, dark = false } = {}) {
        const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
        await send('Page.enable', {}, sessionId);
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false }, sessionId);
        if (dark) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] }, sessionId);
        const evaluate = async (expression) => {
            const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
            if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
            return r.result.value;
        };
        return {
            sessionId,
            evaluate,
            send: (method, params) => send(method, params, sessionId),
            async goto(url, timeout = 30000) {
                const loaded = new Promise((resolve) => {
                    const l = (m) => { if (m.method === 'Page.loadEventFired' && m.sessionId === sessionId) { listeners.delete(l); resolve(); } };
                    listeners.add(l);
                    setTimeout(() => { listeners.delete(l); resolve(); }, timeout);
                });
                const nav = await send('Page.navigate', { url }, sessionId);
                if (nav.errorText) throw new Error(`${url}: ${nav.errorText}`);
                await loaded;
            },
            async screenshot(file, { format = 'png', quality = 94, full = false } = {}) {
                const params = { format, ...(format === 'jpeg' ? { quality } : {}) };
                if (full) {
                    const { cssContentSize } = await send('Page.getLayoutMetrics', {}, sessionId);
                    params.clip = { x: 0, y: 0, width: width, height: Math.ceil(cssContentSize.height), scale: 1 };
                    params.captureBeyondViewport = true;
                }
                const { data } = await send('Page.captureScreenshot', params, sessionId);
                fs.writeFileSync(file, Buffer.from(data, 'base64'));
            },
            close: () => send('Target.closeTarget', { targetId }),
        };
    }

    async function close() {
        chrome.kill();
        await new Promise((r) => setTimeout(r, 300));
        fs.rmSync(profile, { recursive: true, force: true });
    }

    return { page, close };
}
