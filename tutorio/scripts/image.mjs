#!/usr/bin/env node
// Make one picture for a scene. Codex CLI's built-in image_gen first (free with a ChatGPT plan); if Codex is missing,
// logged out or out of quota, fall back to Pollinations (free, no key, online). The prompt is kept next to the picture.
//
//   node image.mjs --prompt-file images/cover.prompt.txt --out images/cover.png [--size 1536x1024] [--ref photo.png]…
//   node image.mjs --prompt "a friendly robot teacher …" --out images/robot.png --engine codex   # codex only — stop if it fails
//   --engine auto | codex | pollinations · --timeout 600 (s)
// Never put words in the picture — the scene writes them as HTML (translatable, searchable, sharp).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const all = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));
const outArg = opt('out');
const prompt = opt('prompt') ?? (opt('prompt-file') && fs.readFileSync(opt('prompt-file'), 'utf8'));
if (!outArg || !prompt) {
    console.error('usage: node image.mjs (--prompt "…" | --prompt-file p.txt) --out images/x.png [--size 1536x1024] [--ref img]… [--engine auto|codex|pollinations]');
    process.exit(1);
}
const out = path.resolve(outArg);
const [w, h] = opt('size', '1536x1024').split('x').map(Number);
const refs = all('ref').map((r) => path.resolve(r));
const engine = opt('engine', 'auto');
const timeout = Number(opt('timeout', 600)) * 1000;
fs.mkdirSync(path.dirname(out), { recursive: true });
if (fs.existsSync(out) && !args.includes('--overwrite')) { console.error(`${out} exists — pick a new name or pass --overwrite`); process.exit(1); }

const isImage = (f) => {
    if (!fs.existsSync(f) || fs.statSync(f).size < 2000) return false;
    const b = fs.readFileSync(f).subarray(0, 12);
    return b.subarray(1, 4).toString() === 'PNG' || (b[0] === 0xff && b[1] === 0xd8) || b.subarray(8, 12).toString() === 'WEBP';
};
const has = (cmd) => spawnSync('which', [cmd]).status === 0;

function codex() {
    if (!has('codex')) return 'codex CLI not installed (npm i -g @openai/codex, then codex login)';
    const feats = spawnSync('codex', ['features', 'list'], { encoding: 'utf8' });
    if (feats.status === 0 && !/image_generation\s+\S+\s+true/.test(feats.stdout)) return 'codex image_generation feature is off (codex features enable image_generation)';
    const ext = path.extname(out).slice(1).toLowerCase();
    const original = ext === 'png' ? out : out.replace(/\.\w+$/, '-original.png');
    const task = [
        'IMPORTANT: You ARE Codex and you already have the built-in image_gen tool. Call image_gen directly in this session.',
        'Never run `codex` as a shell command and do not use any API key or script for image generation.',
        'Do NOT run git. Do not read or modify any other files. Do not overwrite existing files.',
        refs.length ? `Use the attached image(s) as reference (${refs.map((r) => path.basename(r)).join(', ')}).` : '',
        `Picture size: ${w}x${h} (or the closest size image_gen supports, same orientation).`,
        'ABSOLUTELY NO readable text, letters, numbers, logos or watermarks in the picture — the video writes its words as HTML on top.',
        '', prompt.trim(), '',
        `SAVE the generated image as PNG to ${original} (copy it from $CODEX_HOME/generated_images/…).`,
        ext !== 'png' ? `Then convert it, resize only, to ${out} (cwebp -q 82 for .webp, or sips/ffmpeg for .jpg). Keep ${original}.` : '',
        'Look at the result once; if it shows readable text or broken hands/faces, regenerate once. Report the output path(s) and pixel size.',
    ].filter((l) => l !== null).join('\n');
    const cmd = ['exec', '--skip-git-repo-check', '--sandbox', 'workspace-write', '-C', path.dirname(out), '-'];
    for (const r of refs) cmd.push('-i', r); // the prompt (stdin "-") must come before -i
    console.log(`codex image_gen → ${path.relative(process.cwd(), out)} (1–3 min)…`);
    const r = spawnSync('codex', cmd, { input: task, encoding: 'utf8', timeout, maxBuffer: 1 << 26 });
    fs.writeFileSync(out.replace(/\.\w+$/, '') + '.codex.log', (r.stdout || '') + (r.stderr || ''));
    if (isImage(out)) return null;
    const why = `${r.stdout}\n${r.stderr}`;
    if (/log ?in|auth|401/i.test(why)) return 'codex is not logged in (codex login)';
    if (/quota|rate.?limit|usage limit|429/i.test(why)) return 'codex usage limit reached';
    return `codex finished but ${path.basename(out)} was not written (see ${path.basename(out).replace(/\.\w+$/, '')}.codex.log)`;
}

async function pollinations() {
    const text = `${prompt.replace(/\s+/g, ' ').trim()} No text, no letters, no logos, no watermark.`.slice(0, 1500);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=${w}&height=${h}&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1e6)}`;
    console.log('pollinations.ai (free, online) …');
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) }).catch((e) => ({ ok: false, status: e.message }));
    if (!res.ok) return `pollinations failed: ${res.status}`;
    const tmp = path.join(os.tmpdir(), `tutorio-${Date.now()}.img`);
    fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
    if (!isImage(tmp)) return 'pollinations returned no image';
    // convert to the requested format (format change only)
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, ...(out.endsWith('.webp') ? ['-c:v', 'libwebp', '-quality', '82'] : []), out]);
    fs.rmSync(tmp, { force: true });
    return r.status ? `ffmpeg could not save ${out}` : null;
}

const order = engine === 'auto' ? ['codex', 'pollinations'] : [engine];
const tried = [];
for (const name of order) {
    const fail = name === 'codex' ? codex() : name === 'pollinations' ? await pollinations() : `unknown engine ${name}`;
    if (!fail) {
        fs.writeFileSync(out.replace(/\.\w+$/, '') + '.prompt.txt', `# engine: ${name} · size ${w}x${h}${refs.length ? ` · refs ${refs.map((r) => path.basename(r)).join(', ')}` : ''}\n\n${prompt.trim()}\n`);
        console.log(`✓ ${name}: ${path.relative(process.cwd(), out)}`);
        process.exit(0);
    }
    tried.push(`${name}: ${fail}`);
    console.error(`✗ ${name}: ${fail}`);
}
console.error(`\nNo picture made. Tried:\n  ${tried.join('\n  ')}\nNext: a real screenshot (capture.mjs), a diagram drawn in the scene with HTML/CSS/SVG, or a picture from the user.`);
process.exit(2);
