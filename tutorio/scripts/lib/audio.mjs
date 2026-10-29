// Small audio helpers shared by narrate.mjs and make.mjs — no npm packages.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

/** Decode any audio file to mono float32 at `rate` with ffmpeg. */
export function readAudio(file, rate = 44100) {
    const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(rate), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
    if (r.status) throw new Error(`ffmpeg could not read ${file}: ${r.stderr}`);
    const buf = r.stdout;
    return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4).slice();
}

/** Cut leading/trailing silence so scenes do not drag (keeps 0.04 s before and 0.12 s after the voice). */
export function trimSilence(samples, rate, threshold = 0.02) {
    const loud = (x) => Math.abs(x) > threshold;
    const first = samples.findIndex(loud);
    if (first < 0) return samples;
    const start = Math.max(0, first - Math.round(0.04 * rate));
    const end = Math.min(samples.length, samples.findLastIndex(loud) + Math.round(0.12 * rate));
    return samples.slice(start, end);
}

/** 16-bit PCM mono WAV. */
export function writeWav(file, samples, rate) {
    const data = Buffer.alloc(samples.length * 2);
    samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
    const head = Buffer.alloc(44);
    head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8);
    head.write('fmt ', 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22);
    head.writeUInt32LE(rate, 24); head.writeUInt32LE(rate * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34);
    head.write('data', 36); head.writeUInt32LE(data.length, 40);
    fs.writeFileSync(file, Buffer.concat([head, data]));
}

/** Split a narration into sentences (any script — Intl.Segmenter). */
export function sentences(text, lang = 'en') {
    const seg = new Intl.Segmenter(lang, { granularity: 'sentence' });
    return [...seg.segment(text)].map((s) => s.segment.trim()).filter(Boolean);
}

/**
 * Estimated sentence times inside one clip: speech speed is roughly even, so each sentence gets a share of the
 * clip proportional to its length. Good enough for captions and for choosing data-webmovie-delay values.
 */
export function cues(text, lang, seconds) {
    const parts = sentences(text, lang);
    const total = parts.reduce((n, s) => n + s.length, 0) || 1;
    let at = 0;
    return parts.map((s) => {
        const len = (s.length / total) * seconds;
        const cue = { text: s, start: +at.toFixed(3), end: +(at + len).toFixed(3) };
        at += len;
        return cue;
    });
}
