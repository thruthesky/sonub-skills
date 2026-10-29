#!/usr/bin/env node
// What can this machine do? Checks every tool tutorio uses and prints the fix for each missing one.
//   node doctor.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { findChrome } from './lib/chrome.mjs';
import { findKit } from './lib/kit.mjs';

const has = (cmd) => spawnSync('which', [cmd]).status === 0;
const out = (cmd, a) => { const r = spawnSync(cmd, a, { encoding: 'utf8' }); return r.status === 0 ? r.stdout + r.stderr : ''; };
const row = (ok, name, detail, fix) => console.log(`${ok ? '✓' : ok === null ? '·' : '✗'} ${name.padEnd(22)} ${ok ? detail : fix}`);
const cache = process.env.TUTORIO_CACHE || path.join(os.homedir(), '.cache', 'tutorio');

console.log('required');
const node = Number(process.versions.node.split('.')[0]);
row(node >= 22, 'node 22+', `v${process.versions.node}`, `v${process.versions.node} — install Node 22 or newer`);
const chrome = findChrome();
row(!!chrome, 'chrome', chrome, 'install Google Chrome or Chromium (or set CHROME_PATH)');
const ff = out('ffmpeg', ['-version']).split('\n')[0];
row(!!ff, 'ffmpeg', ff, 'brew install ffmpeg · apt install ffmpeg');
const kit = findKit();
row(!!kit, 'webmovie skill', kit?.assets, 'npx skills add https://sonub.com -s webmovie');

console.log('\nvoice (first ✓ is used by --engine auto)');
const md = process.env.SUPERTONIC_DIR || path.join(cache, 'supertonic-3');
let ort = false;
for (const p of [process.env.ORT_NODE_PREFIX, cache].filter(Boolean)) { try { createRequire(path.join(p, 'package.json'))('onnxruntime-node'); ort = true; break; } catch { /* next */ } }
const st = ort && fs.existsSync(path.join(md, 'onnx/vocoder.onnx'));
row(st ? true : null, 'supertonic (best)', `${md}`, 'node scripts/narrate.mjs <project> --install   (free, offline, 31 languages, ~380 MB once)');
row(has('piper') && !!process.env.PIPER_MODEL ? true : null, 'piper', process.env.PIPER_MODEL, 'optional — pip install piper-tts + a voice model, PIPER_MODEL=<model.onnx>');
row(process.platform === 'darwin' && has('say') ? true : null, 'say (macOS)', 'built in', 'macOS only');
row(has('espeak-ng') || has('espeak') ? true : null, 'espeak-ng', 'robotic but everywhere', 'optional — brew/apt install espeak-ng');

console.log('\npictures');
const codex = has('codex');
const feats = codex ? out('codex', ['features', 'list']) : '';
row(codex && /image_generation\s+\S+\s+true/.test(feats) ? true : codex ? false : null, 'codex image_gen (best)', out('codex', ['--version']).trim(),
    codex ? 'codex features enable image_generation · codex login' : 'npm i -g @openai/codex && codex login (ChatGPT plan)');
row(null, 'pollinations.ai', '', 'fallback, free, online — used automatically by image.mjs');
row(null, 'screenshots', '', 'scripts/capture.mjs — real UI, always available with Chrome');
