// Find the webmovie kit (webmovie.css + webmovie.js) — tutorio scenes are webmovie scenes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SKILL = path.resolve(here, '../..');

export function findKit() {
    const home = os.homedir();
    const dirs = [
        process.env.WEBMOVIE_DIR,
        path.resolve(SKILL, '../webmovie'), // installed side by side (npx skills add …, plugin, repo checkout)
        path.join(home, '.claude/skills/webmovie'),
        path.join(home, '.agents/skills/webmovie'),
        path.join(home, '.codex/skills/webmovie'),
        path.resolve('.claude/skills/webmovie'),
        path.resolve('skills/webmovie'),
    ].filter(Boolean);
    for (const d of dirs) {
        const assets = fs.existsSync(path.join(d, 'assets/webmovie.js')) ? path.join(d, 'assets') : d;
        if (fs.existsSync(path.join(assets, 'webmovie.js')) && fs.existsSync(path.join(assets, 'webmovie.css'))) return { dir: d, assets };
    }
    return null;
}
