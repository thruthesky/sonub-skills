#!/usr/bin/env node
// Start a tutorial video project from the template: index.html (scenes) · movie.css · narration.json · kit/ (webmovie, copied).
//
//   node new.mjs <folder> [--title "How to …"] [--lang en]
// Then: edit index.html + narration.json → narrate.mjs → make.mjs --stills → make.mjs
import fs from 'node:fs';
import path from 'node:path';
import { SKILL, findKit } from './lib/kit.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const dir = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
if (!dir) { console.error('usage: node new.mjs <folder> [--title "How to …"] [--lang en]'); process.exit(1); }
const target = path.resolve(dir);
if (fs.existsSync(path.join(target, 'index.html'))) { console.error(`${target}/index.html exists — not overwriting`); process.exit(1); }
const kit = findKit();
if (!kit) {
    console.error('The webmovie skill is required (tutorio scenes are webmovie scenes). Install it:\n  npx skills add https://sonub.com -s webmovie\nor set WEBMOVIE_DIR=<folder with webmovie.js and webmovie.css>.');
    process.exit(1);
}
const name = path.basename(target).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'tutorial';
const title = opt('title', 'How to get started');
const lang = opt('lang', 'en');

fs.mkdirSync(path.join(target, 'kit'), { recursive: true });
fs.mkdirSync(path.join(target, 'images'), { recursive: true });
fs.cpSync(path.join(SKILL, 'assets/template'), target, { recursive: true });
for (const f of ['webmovie.css', 'webmovie.js']) fs.copyFileSync(path.join(kit.assets, f), path.join(target, 'kit', f));
const fill = (f, map) => { const p = path.join(target, f); let s = fs.readFileSync(p, 'utf8'); for (const [k, v] of Object.entries(map)) s = s.replaceAll(k, v); fs.writeFileSync(p, s); };
fill('index.html', { '{{TITLE}}': title, '{{LANG}}': lang });
fill('narration.json', { '{{NAME}}': name, '{{LANG}}': lang, '{{TITLE}}': title });
fs.writeFileSync(path.join(target, '.gitignore'), 'out/\naudio/\n*.codex.log\n');
console.log(`✓ ${path.relative(process.cwd(), target) || '.'} — kit from ${kit.assets}`);
const S = path.join(SKILL, 'scripts');
console.log(`next:\n  open ${path.join(target, 'index.html')}   (plays in the browser)\n  node ${S}/narrate.mjs ${target}\n  node ${S}/make.mjs ${target} --stills\n  node ${S}/make.mjs ${target}`);
