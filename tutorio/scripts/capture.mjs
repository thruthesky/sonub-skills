#!/usr/bin/env node
// Screenshot a real web page for a tutorial step, and measure where things are on it.
// The boxes (in % of the screenshot) go straight into a scene: the focus ring and the cursor land on the real button.
//
//   node capture.mjs <url> --out images/step-1.png [--size 1600x1000] [--scale 2] [--wait 800] [--dark] [--full] [--insecure]
//        [--mark "button[type=submit]"] [--mark "#email"]           # measure these (first match each)
//        [--do "click:#menu"] [--do "type:#email:me@example.com"] [--do "wait:500"] [--do "scroll:#pricing"]   # before the shot, in order
// Writes the PNG and <out>.json: { url, width, height, marks: { "<selector>": { x, y, w, h, cx, cy } } } — all in %.
import fs from 'node:fs';
import path from 'node:path';
import { launch } from './lib/chrome.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const all = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));
const url = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
const outFile = opt('out');
if (!url || !outFile) {
    console.error('usage: node capture.mjs <url> --out file.png [--size 1600x1000] [--mark selector]… [--do click:sel|type:sel:text|wait:ms|scroll:sel]…');
    process.exit(1);
}
const [w, h] = opt('size', '1600x1000').split('x').map(Number);
const target = /^[a-z]+:\/\//i.test(url) ? url : 'file://' + path.resolve(url);

const chrome = await launch({ ignoreCertErrors: args.includes('--insecure') || /localhost|\.test\b|127\.0\.0\.1/.test(target) });
try {
    const tab = await chrome.page(w, h, { scale: Number(opt('scale', 1)), dark: args.includes('--dark') });
    await tab.goto(target);
    await tab.evaluate('document.fonts.ready.then(() => true)');
    await new Promise((r) => setTimeout(r, Number(opt('wait', 800))));
    for (const step of all('do')) {
        const [kind, sel, ...rest] = step.split(':');
        const value = rest.join(':');
        const q = JSON.stringify(sel);
        if (kind === 'wait') await new Promise((r) => setTimeout(r, Number(sel)));
        else if (kind === 'click') await tab.evaluate(`(() => { const el = document.querySelector(${q}); if (!el) throw new Error('not found: ' + ${q}); el.click(); return true; })()`);
        else if (kind === 'scroll') await tab.evaluate(`(() => { document.querySelector(${q})?.scrollIntoView({ block: 'center' }); return true; })()`);
        else if (kind === 'type') await tab.evaluate(`(() => { const el = document.querySelector(${q}); if (!el) throw new Error('not found: ' + ${q});
            el.focus(); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
        else throw new Error(`unknown --do ${step}`);
        await new Promise((r) => setTimeout(r, 300));
    }
    const marks = await tab.evaluate(`(() => {
        const pct = (v, of) => +(v / of * 100).toFixed(2);
        return Object.fromEntries(${JSON.stringify(all('mark'))}.map((sel) => {
            const el = document.querySelector(sel);
            if (!el) return [sel, null];
            const r = el.getBoundingClientRect();
            return [sel, { x: pct(r.left, innerWidth), y: pct(r.top, innerHeight), w: pct(r.width, innerWidth), h: pct(r.height, innerHeight),
                cx: pct(r.left + r.width / 2, innerWidth), cy: pct(r.top + r.height / 2, innerHeight) }];
        }));
    })()`);
    fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
    await tab.screenshot(outFile, { full: args.includes('--full') });
    const info = { url, width: w, height: h, marks };
    fs.writeFileSync(outFile.replace(/\.\w+$/, '') + '.json', JSON.stringify(info, null, 2) + '\n');
    console.log(`→ ${outFile} (${w}×${h})`);
    for (const [sel, b] of Object.entries(marks)) {
        console.log(b ? `  ${sel}\n    focus:  style="--x:${b.x}%;--y:${b.y}%;--w:${b.w}%;--h:${b.h}%"\n    cursor: style="--x:${b.cx}%;--y:${b.cy}%"` : `  ${sel}: NOT FOUND`);
    }
} finally {
    await chrome.close();
}
