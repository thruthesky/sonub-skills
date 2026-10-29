#!/usr/bin/env node
// Project → MP4. Each scene is frozen frame by frame (?webmovie-scene=k&webmovie-t=s) in headless Chrome,
// then ffmpeg joins the scenes with transitions and lays each scene's voice at its start.
//
//   node make.mjs <project>                       # 16:9 + 9:16 → <project>/out/<name>-16x9.mp4 …
//   node make.mjs <project> --format landscape    # landscape | portrait | square (comma list)
//   node make.mjs <project> --stills              # 3 frames per scene (start · middle · end) → out/stills/ — look before rendering
//   node make.mjs <project> --stills --times 1.2,3 # chosen times per scene
//   node make.mjs <project> --music bgm.mp3       # music bed, quiet (only files you may use)
//   node make.mjs <project> --sync-hold           # write each scene's length into data-webmovie-hold (browser preview = video)
// Also writes out/<name>.srt (captions) and out/<name>-chapters.txt (YouTube chapters).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch } from './lib/chrome.mjs';
import { cues } from './lib/audio.mjs';
import { loadProject } from './lib/project.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const valued = ['--format', '--fps', '--jobs', '--times', '--music'];
const dirArg = args.find((a, i) => !a.startsWith('--') && !valued.includes(args[i - 1])) ?? '.';
const FORMATS = { landscape: [1920, 1080, '16x9'], portrait: [1080, 1920, '9x16'], square: [1080, 1080, '1x1'] };
const formats = opt('format', 'landscape,portrait').split(',');
const fps = Number(opt('fps', 30));
const jobs = Number(opt('jobs', Math.max(2, Math.min(8, os.cpus().length - 2))));
const stills = args.includes('--stills');
const stillTimes = opt('times', '').split(',').filter(Boolean).map(Number);
const music = opt('music', '');
// webmovie exit → ffmpeg xfade transition
const TRANSITIONS = { zoom: 'zoomin', whip: 'smoothleft', side: 'slideleft', drop: 'slidedown', fade: 'fade', up: 'smoothup', wipe: 'wipeleft' };

const project = loadProject(dirArg);
const { dir, cfg, scenes } = project;
const XFADE = cfg.transition;

if (args.includes('--sync-hold')) {
    let html = project.html;
    for (const s of [...scenes].reverse()) {
        const ms = Math.round(s.dur * 1000);
        const tag = /data-webmovie-hold="\d+"/.test(s.tag) ? s.tag.replace(/data-webmovie-hold="\d+"/, `data-webmovie-hold="${ms}"`) : s.tag.replace(/>$/, ` data-webmovie-hold="${ms}">`);
        html = html.slice(0, s.index) + tag + html.slice(s.index + s.tag.length);
    }
    fs.writeFileSync(project.htmlFile, html);
    console.log('data-webmovie-hold updated:', scenes.map((s) => `${s.id}=${Math.round(s.dur * 1000)}`).join(' '));
}

// Freeze the page at t. The kit already set its own shots (inside .webmovie-in) to t with negative delays, so those stay at 0;
// every other animation (camera push on a photo, cursor, focus ring — started by .webmovie-scene-on) is wound to t.
// Then computed styles are baked in and the animations removed, so the screenshot is exactly that frame.
const SEEK = (ms) => `(async () => {
    for (let i = 0; i < 250 && !(window.__webmovieReady && [...document.images].every((im) => im.complete)); i++) await new Promise((r) => setTimeout(r, 20));
    await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
    await document.fonts.ready;
    document.querySelectorAll('.webmovie-controls').forEach((el) => el.style.setProperty('display', 'none', 'important'));
    const props = ['opacity', 'translate', 'scale', 'rotate', 'transform', 'filter', 'box-shadow', 'clip-path', 'visibility', 'background-position', 'stroke-dashoffset', 'width'];
    const shots = document.getAnimations().filter((a) => a.effect && a.effect.target).map((a) => {
        a.pause();
        a.currentTime = a.effect.target.closest('.webmovie-in') ? 0 : Math.min(${ms}, a.effect.getComputedTiming().endTime ?? ${ms});
        return a;
    });
    const baked = shots.map((a) => { const cs = getComputedStyle(a.effect.target, a.effect.pseudoElement || null); return [a.effect.target, a.effect.pseudoElement, props.map((p) => [p, cs.getPropertyValue(p)])]; });
    shots.forEach((a) => a.cancel());
    // pseudo-elements (::before/::after) cannot take inline styles — keep their animation paused at t instead
    baked.forEach(([el, pseudo, values]) => { if (!pseudo) values.forEach(([p, v]) => el.style.setProperty(p, v, 'important')); });
    shots.filter((a) => a.effect.pseudoElement).forEach((a) => { a.play(); a.pause(); a.currentTime = Math.min(${ms}, a.effect.getComputedTiming().endTime ?? ${ms}); });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return true;
})()`;

const page = pathToFileURL(path.join(dir, 'index.html')).href;
const run = (cmd, a) => { const r = spawnSync(cmd, a, { stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 1 << 26 }); if (r.status) throw new Error(`${cmd} failed:\n${r.stderr.toString().slice(-1500)}`); };
const clock = (s, ms = true) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return ms ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0').replace('.', ',')}` : `${m}:${String(Math.floor(sec)).padStart(2, '0')}`;
};

// scene k starts here in the final video (scenes overlap by the transition)
const starts = [];
scenes.reduce((t, s) => { starts.push(t); return t + s.dur - XFADE; }, 0);
const length = starts.at(-1) + scenes.at(-1).dur;
const out = path.join(dir, 'out');
fs.mkdirSync(out, { recursive: true });

if (!stills) {
    // captions: each sentence timed inside its scene's voice · chapters: each scene's heading
    const srt = [];
    scenes.forEach((s, k) => {
        if (s.voice == null || !s.text) return;
        const at = starts[k] + project.speechStart(k);
        for (const c of cues(s.text, cfg.lang, s.voice)) srt.push(`${srt.length + 1}\n${clock(at + c.start)} --> ${clock(at + c.end)}\n${c.text}\n`);
    });
    if (srt.length) fs.writeFileSync(path.join(out, `${cfg.name}.srt`), srt.join('\n'));
    fs.writeFileSync(path.join(out, `${cfg.name}-chapters.txt`), scenes.map((s, k) => `${clock(k ? starts[k] + XFADE / 2 : 0, false)} ${s.title}`).join('\n') + '\n');
}

const chrome = await launch();
try {
    for (const name of formats) {
        const size = FORMATS[name];
        if (!size) throw new Error(`unknown format: ${name} (landscape | portrait | square)`);
        const frames = path.join(out, stills ? 'stills' : `frames-${size[2]}`);
        if (!stills || name === formats[0]) fs.rmSync(frames, { recursive: true, force: true });
        const queue = [];
        scenes.forEach((s, k) => {
            fs.mkdirSync(stills ? frames : path.join(frames, s.id), { recursive: true });
            const times = stills ? (stillTimes.length ? stillTimes : [0.4, s.dur / 2, s.dur - 0.05]) : Array.from({ length: Math.round(s.dur * fps) }, (_, i) => i / fps);
            times.forEach((t, i) => queue.push({
                t, url: `${page}?webmovie-scene=${k}&webmovie-t=${t.toFixed(4)}`,
                file: stills ? path.join(frames, `${size[2]}-${k + 1}-${s.id}-${stillTimes.length ? `t${t}` : ['start', 'mid', 'end'][i]}.jpg`) : path.join(frames, s.id, `${String(i).padStart(5, '0')}.jpg`),
            }));
        });
        const total = queue.length;
        const started = Date.now();
        let n = 0;
        await Promise.all(Array.from({ length: Math.min(jobs, total) }, async () => {
            const tab = await chrome.page(size[0], size[1]);
            for (let job = queue.shift(); job; job = queue.shift()) {
                await tab.goto(job.url);
                await tab.evaluate(SEEK(Math.round(job.t * 1000)));
                await tab.screenshot(job.file, { format: 'jpeg', quality: 94 });
                if (++n % 60 === 0 || n === total) process.stdout.write(`\r${name}: ${n}/${total} frames (${((Date.now() - started) / 1000).toFixed(0)}s)`);
            }
            await tab.close();
        }));
        process.stdout.write('\n');
        if (stills) { console.log(`→ ${path.relative(process.cwd(), frames)}`); continue; }

        // video: scenes joined with xfade · audio: each voice delayed to its scene start, mixed, padded, loudness-normalized
        const inputs = [];
        const filters = [];
        let last = '[0:v]';
        scenes.forEach((s, k) => {
            inputs.push('-framerate', String(fps), '-i', path.join(frames, s.id, '%05d.jpg'));
            if (k > 0) {
                filters.push(`${last}[${k}:v]xfade=transition=${TRANSITIONS[scenes[k - 1].exit] ?? 'fade'}:duration=${XFADE}:offset=${starts[k].toFixed(3)}[v${k}]`);
                last = `[v${k}]`;
            }
        });
        const voiced = scenes.map((s, k) => [s, k]).filter(([s]) => s.voice != null);
        let audio = 0;
        voiced.forEach(([s, k]) => {
            inputs.push('-i', path.join(dir, 'audio', `${s.id}.wav`));
            const delay = Math.round((starts[k] + project.speechStart(k)) * 1000);
            filters.push(`[${scenes.length + audio}:a]adelay=${delay}:all=1,aresample=48000[a${audio}]`);
            audio++;
        });
        if (audio) filters.push(`${Array.from({ length: audio }, (_, i) => `[a${i}]`).join('')}amix=inputs=${audio}:normalize=0:duration=longest[voice]`);
        else { inputs.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'); filters.push(`[${scenes.length}:a]anull[voice]`); audio = 1; }
        let mix = '[voice]';
        if (music) {
            inputs.push('-stream_loop', '-1', '-i', path.resolve(music));
            filters.push(`[${scenes.length + audio}:a]aresample=48000,volume=${voiced.length ? 0.12 : 0.5},afade=t=out:st=${Math.max(0, length - 2).toFixed(2)}:d=2[bgm]`, `[voice][bgm]amix=inputs=2:normalize=0:duration=first[mixed]`);
            mix = '[mixed]';
        }
        filters.push(`${mix}apad,atrim=0:${length.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11[aout]`);
        const file = path.join(out, `${cfg.name}-${size[2]}.mp4`);
        run('ffmpeg', ['-y', '-hide_banner', ...inputs, '-filter_complex', filters.join(';'), '-map', last, '-map', '[aout]',
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', length.toFixed(3), file]);
        // poster: the first scene once it has settled
        const poster = path.join(frames, scenes[0].id, `${String(Math.max(0, Math.round(scenes[0].dur * fps) - 2)).padStart(5, '0')}.jpg`);
        if (fs.existsSync(poster)) fs.copyFileSync(poster, path.join(out, `${cfg.name}-${size[2]}-poster.jpg`));
        console.log(`→ ${path.relative(process.cwd(), file)} (${length.toFixed(1)}s)`);
    }
} finally {
    await chrome.close();
}
