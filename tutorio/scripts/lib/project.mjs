// A tutorio project folder: index.html (scenes) + narration.json (script) + audio/ (made by narrate.mjs).
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULTS = {
    lang: 'en',
    engine: 'auto', // supertonic → piper → say → espeak (narrate.mjs)
    voice: 'F1', // Supertonic voice: F1–F5, M1–M5
    speed: 1.05,
    pad: 0.9, // seconds of picture after the voice ends
    tail: 1.5, // extra seconds on the last scene
    transition: 0.5, // xfade between scenes (s)
    lead: 0.2, // after the transition, before the voice starts (s)
};

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** Scenes in index.html order: <section id="…" class="webmovie-scene …" data-webmovie-exit data-webmovie-hold data-title>. */
export function parseScenes(html) {
    const tags = [...html.matchAll(/<section\b[^>]*>/g)].filter((m) => /class="[^"]*\bwebmovie-scene\b/.test(m[0]));
    return tags.map((m, i) => {
        const a = attrs(m[0]);
        if (!a.id) throw new Error(`scene ${i + 1} has no id: ${m[0]}`);
        const body = html.slice(m.index, tags[i + 1]?.index ?? html.length);
        const heading = body.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/);
        return {
            id: a.id,
            exit: a['data-webmovie-exit'] || 'fade',
            hold: a['data-webmovie-hold'] ? Number(a['data-webmovie-hold']) / 1000 : null,
            title: a['data-title'] || (heading ? text(heading[1]) : a.id),
            index: m.index,
            tag: m[0],
        };
    });
}

export function loadProject(dir) {
    dir = path.resolve(dir);
    const htmlFile = path.join(dir, 'index.html');
    if (!fs.existsSync(htmlFile)) throw new Error(`${htmlFile} not found — create the project with scripts/new.mjs`);
    const html = fs.readFileSync(htmlFile, 'utf8');
    const narrationFile = path.join(dir, 'narration.json');
    const cfg = { ...DEFAULTS, name: path.basename(dir), scenes: [], ...(fs.existsSync(narrationFile) ? JSON.parse(fs.readFileSync(narrationFile, 'utf8')) : {}) };
    const timingFile = path.join(dir, 'audio', 'timing.json');
    const timing = fs.existsSync(timingFile) ? JSON.parse(fs.readFileSync(timingFile, 'utf8')) : { scenes: {} };
    const scenes = parseScenes(html);
    const unknown = cfg.scenes.map((s) => s.id).filter((id) => !scenes.some((s) => s.id === id));
    if (unknown.length) throw new Error(`narration.json scenes missing in index.html: ${unknown.join(', ')}`);
    const voiced = (id) => timing.scenes[id] != null && fs.existsSync(path.join(dir, 'audio', `${id}.wav`));
    scenes.forEach((s, i) => {
        const line = cfg.scenes.find((n) => n.id === s.id);
        s.text = line?.text ?? '';
        s.voice = voiced(s.id) ? timing.scenes[s.id] : null;
        // a voiced scene lasts as long as its voice + pad; a silent one uses data-webmovie-hold (or 4 s)
        const base = s.voice != null ? s.voice + cfg.pad : (s.hold ?? 4);
        s.dur = +(base + (i === scenes.length - 1 ? cfg.tail : 0)).toFixed(3);
    });
    /** seconds from the start of scene k to the first word of its voice */
    const speechStart = (k) => (k ? cfg.transition : 0) + cfg.lead;
    return { dir, html, htmlFile, cfg, timing, scenes, speechStart };
}
