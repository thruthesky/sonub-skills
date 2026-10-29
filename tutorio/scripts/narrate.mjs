#!/usr/bin/env node
// narration.json → audio/<scene>.wav + audio/timing.json, with a free, local text-to-speech engine.
// Engines (auto picks the first that works): supertonic (natural, 31 languages, offline) → piper → say (macOS) → espeak-ng.
//
//   node narrate.mjs <project>                 # only scenes whose text/voice changed are re-spoken
//   node narrate.mjs <project> --install       # first time: download Supertonic 3 (~380 MB) + onnxruntime-node to ~/.cache/tutorio
//   node narrate.mjs <project> --engine say    # force an engine · --force re-speaks every scene · --list shows engines
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { readAudio, trimSilence, writeWav, cues } from './lib/audio.mjs';
import { loadProject } from './lib/project.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const dirArg = args.find((a, i) => !a.startsWith('--') && !['--engine'].includes(args[i - 1])) ?? '.';
const CACHE = process.env.TUTORIO_CACHE || path.join(os.homedir(), '.cache', 'tutorio');
const has = (cmd) => spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd]).status === 0;

// ---------- Supertonic 3 ----------
const HF = 'https://huggingface.co/Supertone/supertonic-3/resolve/main';
const SUPERTONIC_LANGS = ['en', 'ko', 'ja', 'ar', 'bg', 'cs', 'da', 'de', 'el', 'es', 'et', 'fi', 'fr', 'hi', 'hr', 'hu', 'id', 'it', 'lt', 'lv', 'nl', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sv', 'tr', 'uk', 'vi'];
const MODEL_FILES = ['onnx/tts.json', 'onnx/unicode_indexer.json', 'onnx/duration_predictor.onnx', 'onnx/text_encoder.onnx', 'onnx/vector_estimator.onnx', 'onnx/vocoder.onnx', 'LICENSE'];
const modelDir = (cfg, dir) => process.env.SUPERTONIC_DIR || (cfg.supertonicDir && path.resolve(dir, cfg.supertonicDir)) || path.join(CACHE, 'supertonic-3');
const ortRequire = () => {
    for (const prefix of [process.env.ORT_NODE_PREFIX, CACHE].filter(Boolean)) {
        try { return createRequire(path.join(prefix, 'package.json'))('onnxruntime-node'); } catch { /* next */ }
    }
    return null;
};

async function download(url, file) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file + '.part', Buffer.from(await res.arrayBuffer()));
    fs.renameSync(file + '.part', file);
}

async function installSupertonic(cfg, dir) {
    const md = modelDir(cfg, dir);
    for (const f of [...MODEL_FILES, `voice_styles/${cfg.voice}.json`]) {
        const file = path.join(md, f);
        if (fs.existsSync(file)) continue;
        console.log(`download ${f} …`);
        await download(`${HF}/${f}`, file);
    }
    if (!ortRequire()) {
        console.log(`npm i onnxruntime-node → ${CACHE}`);
        fs.mkdirSync(CACHE, { recursive: true });
        if (!fs.existsSync(path.join(CACHE, 'package.json'))) fs.writeFileSync(path.join(CACHE, 'package.json'), '{"private":true}\n');
        const r = spawnSync('npm', ['i', '--prefix', CACHE, 'onnxruntime-node'], { stdio: 'inherit' });
        if (r.status) throw new Error('npm install onnxruntime-node failed');
    }
}

async function supertonic(cfg, dir) {
    const md = modelDir(cfg, dir);
    const ort = ortRequire();
    if (!ort || !fs.existsSync(path.join(md, 'onnx/vocoder.onnx'))) return null;
    if (!SUPERTONIC_LANGS.includes(cfg.lang)) return null;
    const style = path.join(md, `voice_styles/${cfg.voice}.json`);
    if (!fs.existsSync(style)) await download(`${HF}/voice_styles/${cfg.voice}.json`, style); // voices are tiny
    const engine = await import('./lib/supertonic.mjs');
    engine.useOrt(ort);
    const json = (f) => JSON.parse(fs.readFileSync(path.join(md, f), 'utf8'));
    const sessions = [];
    for (const f of ['duration_predictor', 'text_encoder', 'vector_estimator', 'vocoder']) {
        sessions.push(await ort.InferenceSession.create(path.join(md, `onnx/${f}.onnx`), { graphOptimizationLevel: 'all' }));
    }
    const tts = new engine.TextToSpeech(json('onnx/tts.json'), new engine.UnicodeProcessor(json('onnx/unicode_indexer.json')), ...sessions);
    const voice = engine.styleFromJson([json(`voice_styles/${cfg.voice}.json`)]);
    return {
        name: 'supertonic', voice: cfg.voice,
        async speak(text) {
            const { wav, duration } = await tts.call(text, cfg.lang, voice, cfg.steps ?? 8, cfg.speed, 0.3);
            return { samples: Float32Array.from(wav.slice(0, Math.floor(tts.sampleRate * duration[0]))), rate: tts.sampleRate };
        },
    };
}

// ---------- command-line engines (they write a file; ffmpeg decodes it) ----------
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tutorio-tts-'));
function viaFile(name, voice, run) {
    return {
        name, voice,
        async speak(text) {
            const t = tmp();
            const txt = path.join(t, 'in.txt');
            fs.writeFileSync(txt, text);
            const out = run(txt, t, text);
            const samples = readAudio(out, 44100);
            fs.rmSync(t, { recursive: true, force: true });
            return { samples, rate: 44100 };
        },
    };
}
const check = (r, what) => { if (r.status) throw new Error(`${what} failed: ${r.stderr}`); };

function piper(cfg, dir) {
    const model = process.env.PIPER_MODEL || (cfg.piperModel && path.resolve(dir, cfg.piperModel));
    if (!has('piper') || !model || !fs.existsSync(model)) return null;
    return viaFile('piper', path.basename(model), (txt, t, text) => {
        const out = path.join(t, 'out.wav');
        check(spawnSync('piper', ['--model', model, '--output_file', out, '--length_scale', String(1 / cfg.speed)], { input: text }), 'piper');
        return out;
    });
}

function say(cfg) {
    if (process.platform !== 'darwin' || !has('say')) return null;
    // pick the voice: narration.json sayVoice, else the first installed voice of the language
    // (skip the novelty voices — Albert, Bells, Zarvox … — and prefer the natural ones)
    const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Kathy|Grandma|Grandpa|Rocko|Sandy|Shelley|Eddy|Flo|Reed)\b/;
    const PREFER = { en: 'Samantha', ko: 'Yuna', ja: 'Kyoko', zh: 'Tingting', es: 'Mónica', fr: 'Thomas', de: 'Anna', it: 'Alice', pt: 'Luciana', ru: 'Milena' };
    const list = spawnSync('say', ['-v', '?']).stdout.toString().split('\n')
        .map((l) => l.match(/^(.+?)\s{2,}([a-z]{2,3})[_-]/i)).filter((m) => m && m[2] === cfg.lang && !NOVELTY.test(m[1])).map((m) => m[1].trim());
    const voice = cfg.sayVoice || list.find((v) => v.startsWith(PREFER[cfg.lang] ?? '\0')) || list[0];
    if (!voice) return null;
    return viaFile('say', voice, (txt, t) => {
        const out = path.join(t, 'out.aiff');
        check(spawnSync('say', ['-v', voice, '-r', String(Math.round(180 * cfg.speed)), '-o', out, '-f', txt]), 'say');
        return out;
    });
}

function espeak(cfg) {
    const bin = ['espeak-ng', 'espeak'].find(has);
    if (!bin) return null;
    const voice = cfg.espeakVoice || cfg.lang;
    return viaFile('espeak', voice, (txt, t) => {
        const out = path.join(t, 'out.wav');
        check(spawnSync(bin, ['-v', voice, '-s', String(Math.round(165 * cfg.speed)), '-w', out, '-f', txt]), bin);
        return out;
    });
}

const ENGINES = { supertonic, piper, say, espeak };

async function pickEngine(cfg, dir) {
    const want = opt('engine', cfg.engine);
    const order = want === 'auto' ? Object.keys(ENGINES) : [want];
    for (const name of order) {
        if (!ENGINES[name]) throw new Error(`unknown engine "${name}" — ${Object.keys(ENGINES).join(' | ')}`);
        const e = await ENGINES[name](cfg, dir);
        if (e) return e;
        if (want !== 'auto') throw new Error(`engine "${name}" is not available here — run with --list, or --install for supertonic`);
    }
    throw new Error('no text-to-speech engine found. Best: `node narrate.mjs <project> --install` (Supertonic, free, offline). '
        + 'Or install espeak-ng (brew/apt install espeak-ng) or piper.');
}

// ---------- main ----------
const project = loadProject(dirArg);
const { cfg, dir } = project;

if (args.includes('--list')) {
    for (const [name, make] of Object.entries(ENGINES)) {
        const e = await Promise.resolve().then(() => make(cfg, dir)).catch(() => null);
        console.log(`${e ? '✓' : '✗'} ${name}${e ? ` (voice ${e.voice})` : ''}`);
    }
    process.exit(0);
}
if (args.includes('--install')) await installSupertonic(cfg, dir);
if (!cfg.scenes.length) throw new Error('narration.json has no scenes — add { "id": "<section id>", "text": "…" } per scene');

const engine = await pickEngine(cfg, dir);
console.log(`engine: ${engine.name} · voice ${engine.voice} · lang ${cfg.lang} · speed ${cfg.speed}`);
const out = path.join(dir, 'audio');
fs.mkdirSync(out, { recursive: true });
const old = project.timing;
const timing = { engine: engine.name, voice: engine.voice, scenes: {}, hash: {} };
for (const line of cfg.scenes) {
    const hash = crypto.createHash('sha1').update(JSON.stringify([line.text, engine.name, engine.voice, cfg.lang, cfg.speed, cfg.steps])).digest('hex').slice(0, 12);
    const wav = path.join(out, `${line.id}.wav`);
    if (!args.includes('--force') && old.hash?.[line.id] === hash && fs.existsSync(wav)) {
        timing.scenes[line.id] = old.scenes[line.id];
        timing.hash[line.id] = hash;
        continue;
    }
    const { samples, rate } = await engine.speak(line.text);
    const voice = trimSilence(samples, rate);
    writeWav(wav, voice, rate);
    timing.scenes[line.id] = +(voice.length / rate).toFixed(3);
    timing.hash[line.id] = hash;
}
fs.writeFileSync(path.join(out, 'timing.json'), JSON.stringify(timing, null, 2) + '\n');

// cue sheet — when each sentence starts, in ms from the start of its scene: use these for data-webmovie-delay
const fresh = loadProject(dir);
fresh.scenes.forEach((s, k) => {
    if (s.voice == null) return console.log(`\n${s.id}: silent · ${s.dur}s (data-webmovie-hold)`);
    console.log(`\n${s.id}: voice ${s.voice}s · scene ${s.dur}s`);
    for (const c of cues(s.text, cfg.lang, s.voice)) console.log(`  ${String(Math.round((fresh.speechStart(k) + c.start) * 1000)).padStart(5)} ms  ${c.text}`);
});
