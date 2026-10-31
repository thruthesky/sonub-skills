#!/usr/bin/env node
// Browser check for linkify — opens a page in headless Chrome and proves the deep links work.
//
//   node scripts/check.mjs <url-or-file> [--widths 1280,390] [--ids a,b,c] [--max 8] [--out ./linkify-check] [--wait 800]
//
// For each width it:
//   1. lists the sections linkify.js decorated (id, tag, kind) and flags duplicate or non-ASCII ids
//   2. clicks the first visible heading like a person → the address must end in #id, the clipboard must hold
//      that URL and the "copied" toast must show (screenshot <out>/<width>-copied.png)
//   3. opens <url>#id fresh for each id (--ids, else the first --max) → the section must be visible and its top
//      must sit at its scroll-margin (below the sticky header), or the page must be scrolled to the end
// Prints PASS/FAIL lines and writes <out>/report.json. Exit code 1 when something failed.
// Needs Node 22+ (built-in WebSocket) and Chrome/Chromium (set CHROME_PATH to override).
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
	console.error('usage: node check.mjs <url-or-file> [--widths 1280,390] [--ids a,b] [--max 8] [--out dir] [--wait 800]');
	process.exit(2);
}
const page = new URL(fs.existsSync(target) ? pathToFileURL(path.resolve(target)).href : target);
page.hash = '';
const widths = opt('widths', '1280,390').split(',').map(Number).filter(Boolean);
const wantIds = opt('ids', '').split(',').map((s) => s.trim()).filter(Boolean);
const max = Number(opt('max', 8));
const out = path.resolve(opt('out', './linkify-check'));
const wait = Number(opt('wait', 800));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'linkify-check-'));
const chrome = spawn(chromePath, [
	'--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--ignore-certificate-errors',
	'--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
const cleanup = async () => {
	if (chrome.exitCode === null) {
		const exited = new Promise((r) => chrome.once('exit', r));
		chrome.kill();
		await Promise.race([exited, sleep(3000)]);
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
const errors = [];
ws.addEventListener('message', (ev) => {
	const msg = JSON.parse(ev.data);
	if (msg.id && pending.has(msg.id)) {
		const { resolve, reject } = pending.get(msg.id);
		pending.delete(msg.id);
		msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
	} else if (msg.method === 'Runtime.exceptionThrown') {
		errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
	}
});
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
	const id = ++seq;
	pending.set(id, { resolve, reject });
	ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});

const report = { url: page.href, widths: {} };
let failed = 0;

try {
	if (page.protocol.startsWith('http')) {
		await send('Browser.grantPermissions', { origin: page.origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
	}
	const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
	const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
	await send('Page.enable', {}, s);
	await send('Runtime.enable', {}, s);
	const ev = async (expression) => {
		const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }, s);
		if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
		return r.result.value;
	};
	const open = async (url) => {
		await send('Page.navigate', { url: 'about:blank' }, s); // a fresh load, not a same-document hash change
		await send('Page.navigate', { url }, s);
		for (let i = 0; i < 60 && (await ev('document.readyState')) !== 'complete'; i++) await sleep(100);
		await sleep(wait);
	};
	const click = async (x, y) => {
		for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
			await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }, s);
		}
	};

	for (const width of widths) {
		const r = (report.widths[width] = { checks: [] });
		const check = (name, ok, info = '') => {
			r.checks.push({ name, ok, info });
			if (!ok) failed++;
			console.log(`${ok ? 'PASS' : 'FAIL'} [${width}] ${name}${info ? ' — ' + info : ''}`);
		};
		await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 }, s);
		await send('Emulation.setTouchEmulationEnabled', { enabled: width < 600 }, s);
		await open(page.href);

		if (!(await ev('!!window.Linkify'))) {
			check('linkify.js loaded', false, 'window.Linkify is missing — check the <script> tag');
			continue;
		}
		const sections = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('[data-linkified]')].map((e) => ({
			id: e.id, tag: e.tagName.toLowerCase(), kind: e.dataset.linkified, visible: e.checkVisibility(), inControl: !!e.closest('a, button, summary'),
			count: document.querySelectorAll('[id="' + CSS.escape(e.id) + '"]').length })))`));
		r.sections = sections;
		check('sections linked', sections.length > 0, `${sections.length} (${sections.filter((x) => x.visible).length} visible)`);
		const dup = sections.filter((x) => x.count > 1).map((x) => x.id);
		check('ids are unique', dup.length === 0, dup.join(', '));
		const wide = sections.filter((x) => !/^[\x21-\x7e]+$/.test(x.id)).map((x) => x.id);
		if (wide.length) console.log(`note [${width}] non-ASCII ids paste as %XX: ${wide.slice(0, 5).join(', ')}${wide.length > 5 ? ' …' : ''}`);

		// click like a person
		const first = sections.find((x) => x.visible && x.kind === 'heading' && !x.inControl); // a heading inside a link card opens the link instead
		if (first) {
			await ev(`document.getElementById(${JSON.stringify(first.id)}).scrollIntoView({ block: 'center', behavior: 'instant' })`);
			// a long page still lays out while it loads — click only once the heading stands still
			let b = null;
			for (let i = 0, last = null; i < 40; i++) {
				await sleep(150);
				b = JSON.parse(await ev(`JSON.stringify(document.getElementById(${JSON.stringify(first.id)}).getBoundingClientRect())`));
				if (b.y === last) break;
				last = b.y;
			}
			await click(b.x + Math.min(12, b.width / 4), b.y + b.height / 2);
			await sleep(900);
			const after = JSON.parse(await ev(`(async () => JSON.stringify({ hash: location.hash, toast: document.querySelector('.linkify-toast.is-visible')?.textContent || '',
				clip: await navigator.clipboard.readText().catch((e) => 'ERR ' + e.message) }))()`));
			const shot = await send('Page.captureScreenshot', {}, s);
			fs.writeFileSync(path.join(out, `${width}-copied.png`), Buffer.from(shot.data, 'base64'));
			const wantHash = `#${encodeURIComponent(first.id)}`;
			check(`click "${first.id}" changes the address`, after.hash === wantHash || decodeURIComponent(after.hash) === `#${first.id}`, after.hash);
			check('toast shows', after.toast.length > 0, after.toast);
			if (!after.clip.startsWith('ERR')) check('clipboard holds the URL', decodeURIComponent(after.clip).endsWith(`#${first.id}`), after.clip);
			else console.log(`note [${width}] clipboard not readable here (${after.clip}) — check by pasting in a real browser`);
		}

		// open each link fresh
		const ids = wantIds.length ? wantIds : sections.slice(0, max).map((x) => x.id);
		for (const id of ids) {
			const u = new URL(page.href);
			u.hash = id;
			await open(u.href);
			const at = JSON.parse(await ev(`(() => { const e = document.getElementById(${JSON.stringify(id)}); if (!e) return JSON.stringify({ missing: true });
				const want = (parseFloat(getComputedStyle(e).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0); const top = e.getBoundingClientRect().top;
				const end = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
				const bar = document.querySelector(document.querySelector('script[data-header]')?.dataset.header || 'none');
				const barBottom = bar && ['sticky', 'fixed'].includes(getComputedStyle(bar).position) ? Math.round(bar.getBoundingClientRect().bottom) : 0;
				return JSON.stringify({ top: Math.round(top), want: Math.round(want), visible: e.checkVisibility(), end, barBottom }); })()`));
			const covered = !at.missing && at.top < at.barBottom; // a margin smaller than the real header still "matches" want — the reader sees no heading
			const ok = !at.missing && at.visible && !covered && (Math.abs(at.top - at.want) <= 6 || (at.end && at.top >= at.want - 6));
			check(`open #${id}`, ok, at.missing ? 'no such id' : `top ${at.top}px, want ${at.want}px${at.end ? ' (page end)' : ''}${at.visible ? '' : ', hidden'}${covered ? `, under the sticky header (bottom ${at.barBottom}px)` : ''}`);
		}
	}
	if (errors.length) console.log(`note: page errors —\n  ${[...new Set(errors)].slice(0, 5).join('\n  ')}`);
	report.errors = [...new Set(errors)];
} catch (e) {
	console.error('check stopped:', e.message);
	failed++;
}

fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(failed ? `${failed} FAILED — ${out}/report.json` : `ALL PASS — ${out}/report.json`);
ws.close();
await cleanup();
process.exit(failed ? 1 : 0);
