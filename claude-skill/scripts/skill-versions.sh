#!/bin/sh
# skill-versions.sh — the version, install date and update date of every agent skill installed with
# the skills CLI (npx skills), and whether a newer version is out. Skills have no version number:
# the version is the first 12 characters of the digest (sha256) the source published.
#
#   sh skill-versions.sh            # global (~/.agents/.skill-lock.json) and this project (./skills-lock.json)
#   sh skill-versions.sh -g         # global only
#   sh skill-versions.sh -p         # this project only — run it in the project folder
#   sh skill-versions.sh --offline  # do not ask the sources for the newest version
#
# Reads only the lock files and the sources' /.well-known/agent-skills/index.json; changes nothing.
# Needs Node.js, which the skills CLI needs anyway. Newer version → npx skills update <name> [-g].

scope=all
online=1
for arg in "$@"; do
  case "$arg" in
    -g|--global) scope=global ;;
    -p|--project) scope=project ;;
    --offline) online=0 ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $arg (try -h)" >&2; exit 2 ;;
  esac
done

command -v node >/dev/null 2>&1 || { echo "Node.js is needed (the skills CLI needs it too)" >&2; exit 1; }

SCOPE="$scope" ONLINE="$online" node - <<'JS'
const fs = require('fs'), os = require('os'), path = require('path');
const { SCOPE, ONLINE } = process.env;

const lists = [];
if (SCOPE !== 'project') lists.push(['global', path.join(os.homedir(), '.agents', '.skill-lock.json'), os.homedir()]);
if (SCOPE !== 'global') lists.push(['project', path.resolve('skills-lock.json'), process.cwd()]);

const short = (d) => (d || '').replace(/^sha256:/, '').slice(0, 12);
const day = (t) => (t ? t.slice(0, 16).replace('T', ' ') : '');

// The project lock file has no dates — fall back to when SKILL.md was written (marked with *).
function fileDate(base, name) {
  for (const dir of ['.agents/skills', '.claude/skills']) {
    try { return fs.statSync(path.join(base, dir, name, 'SKILL.md')).mtime.toISOString(); } catch {}
  }
  return '';
}

async function newest(base, cache) {
  if (!(base in cache)) {
    cache[base] = fetch(new URL('/.well-known/agent-skills/index.json', base), { signal: AbortSignal.timeout(10000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => Object.fromEntries((j?.skills || []).map((s) => [s.name, short(s.digest)])))
      .catch(() => null);
  }
  return cache[base];
}

(async () => {
  const rows = [], cache = {};
  for (const [scope, file, base] of lists) {
    let skills;
    try { skills = JSON.parse(fs.readFileSync(file, 'utf8')).skills || {}; } catch { continue; }
    for (const [name, s] of Object.entries(skills)) {
      const version = short(s.wellKnownDigest || s.computedHash || s.skillFolderHash) || '-';
      let installed = day(s.installedAt), updated = day(s.updatedAt);
      if (!installed) installed = updated = day(fileDate(base, name)) + '*';
      let status = '';
      if (ONLINE === '1') {
        const site = s.sourceType === 'well-known' && (s.sourceBaseUrl || s.sourceUrl);
        const index = site ? await newest(site, cache) : null;
        const latest = index?.[name];
        status = !site ? '-' : !latest ? '?' : latest === short(s.wellKnownDigest) ? 'latest' : `update → ${latest}`;
      }
      rows.push([name, scope, version, installed, updated, s.source || '-', status]);
    }
  }
  if (!rows.length) { console.log('No skills installed with the skills CLI here (no lock file).'); return; }
  const head = ['SKILL', 'SCOPE', 'VERSION', 'INSTALLED (UTC)', 'UPDATED (UTC)', 'SOURCE', ONLINE === '1' ? 'NEWEST' : ''];
  const all = [head, ...rows];
  const width = head.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  for (const r of all) console.log(r.map((c, i) => c.padEnd(width[i])).join('  ').trimEnd());
  if (rows.some((r) => r[3].endsWith('*'))) console.log('* the project lock file keeps no dates — this is when SKILL.md was written');
  if (rows.some((r) => r[6].startsWith('update'))) console.log('Newer version out → npx skills update <skill> (-g for global)');
})();
JS
