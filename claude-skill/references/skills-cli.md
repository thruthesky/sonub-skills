# Managing installed skills — the skills CLI (`npx skills`)

How to see, check, update and remove Agent Skills installed with `npx skills add …`: global vs project, where the files are, the version and the install date. Checked 2026-10-19 (skills CLI `--help`, code.claude.com/docs/en/skills).

## Global vs project

| | Global (`-g`) | Project (no `-g`) |
|---|---|---|
| Used in | every project on this computer | only this project folder |
| Real files | `~/.agents/skills/<name>` | `<project>/.agents/skills/<name>` |
| What Claude Code reads | `~/.claude/skills/<name>` — a symlink to the folder above | `<project>/.claude/skills/<name>` (a link, or a copy with `-a claude-code`) |
| Version and dates | `~/.agents/.skill-lock.json` | `<project>/skills-lock.json` — **no dates**, only the digest |

Run project commands **inside the project folder**. If a skill with the same name is in both places, Claude Code uses the global (personal) one — the order is enterprise > personal > project.

🛑 **Claude Code does not read `~/.agents/skills` or `.agents/skills`.** It reads only `.claude/skills` (`~/.claude/skills`, the project's `.claude/skills`, nested and `--add-dir` folders, plugins). Codex, Gemini CLI and Copilot CLI read `.agents/skills`. The skills CLI keeps the real files in `.agents/skills` and adds a link in `.claude/skills` for Claude Code — so a skill copied by hand into `~/.agents/skills` alone does not show up in Claude Code. Put it (or a symlink) in `~/.claude/skills/<name>`, start a new session, and check with `/skills`.

## List and check

```bash
npx skills ls -g                     # global skills: name, path, agents, Source
npx skills ls                        # this project's skills
npx skills ls -g -a claude-code      # only the ones linked for Claude Code
npx skills ls -g --json              # JSON: name, path, scope, agents, source, sourceUrl
npx skills add https://sonub.com -l  # what a source offers, installs nothing
```

- `Source: sonub.com` (or a GitHub repo) → installed by the CLI; `update` and `remove` work on it.
- `Source: local` → a folder someone put there by hand; the CLI does not update it.
- Inside Claude Code, `/skills` shows what the session actually loaded.

## Where it came from

- Installed at: the path in `npx skills ls`.
- Downloaded from: `sourceUrl` in the lock file, e.g. `https://sonub.com/.well-known/agent-skills/gp.tar.gz?v=…`.
- The original: the publisher's source (for SONUB skills, the `skills/<name>/` folder of the sonub repository). Do not edit the installed folder — the next update overwrites it; change the original and publish it.

## Version and install date — `scripts/skill-versions.sh`

Skills have **no version number**. The version is the first 12 characters of the `digest` (sha256 of the skill archive) the source publishes in `/.well-known/agent-skills/index.json`; the CLI records it in the lock file with `installedAt` and `updatedAt` (UTC, global only).

The script in this skill shows it all in one table and compares it with the source:

```bash
sh <this skill folder>/scripts/skill-versions.sh             # global and this project
sh <this skill folder>/scripts/skill-versions.sh -g          # global only
sh <this skill folder>/scripts/skill-versions.sh -p          # this project only (run in its folder)
sh <this skill folder>/scripts/skill-versions.sh --offline   # skip asking the source
```

```
SKILL   SCOPE   VERSION       INSTALLED (UTC)   UPDATED (UTC)     SOURCE     NEWEST
gp      global  8188561e0e0f  2026-10-18 03:47  2026-10-19 01:32  sonub.com  update → 2c1de455707c
popup   global  de0138a39fa1  2026-10-18 03:47  2026-10-19 01:32  sonub.com  latest
```

`latest` = same digest as the source; `update → …` = run `npx skills update`; `?` = the source did not answer or no longer lists it; `-` = not a well-known source (GitHub — `npx skills update` checks those). For project skills the dates come from when `SKILL.md` was written (marked `*`). It only reads; it needs Node.js (the CLI needs it anyway). It is reusable: keep one copy and run it in any project — with claude-skill installed globally it is at `~/.claude/skills/claude-skill/scripts/skill-versions.sh`; without it, download it once with `curl -fsSL https://sonub.com/.well-known/skills/claude-skill/scripts/skill-versions.sh -o ~/skill-versions.sh` and run `sh ~/skill-versions.sh`. The sonub.com page `/skills` ("Manage installed skills") shows the same steps for people.

Without the script:

```bash
# installed (global)
node -e 'const s=require(require("os").homedir()+"/.agents/.skill-lock.json").skills.gp;console.log(s.wellKnownDigest.slice(7,19),s.installedAt,s.updatedAt)'
# newest on the source
curl -s https://sonub.com/.well-known/agent-skills/index.json | node -e 'let t="";process.stdin.on("data",d=>t+=d).on("end",()=>JSON.parse(t).skills.forEach(s=>console.log(s.name,s.digest.slice(7,19))))'
```

## Update

```bash
npx skills update gp -g    # one global skill
npx skills update -g       # every global skill
npx skills update -p       # every skill of this project
```

Only skills whose digest changed are downloaded again. Start a new agent session afterwards so it reads the new files, then run the script again — VERSION should now equal NEWEST.

## Remove

```bash
npx skills rm gp -g                  # from every agent, global (asks first; -y skips the question)
npx skills rm gp                     # this project
npx skills rm gp -g -a claude-code   # only unlink it from Claude Code
npx skills rm -g                     # choose from a list
```

Install again with `npx skills add https://sonub.com -s gp -g` (without `-g` for the project).
