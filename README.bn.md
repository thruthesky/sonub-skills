# sonub-skills — SONUB-এর এজেন্ট স্কিল

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · **বাংলা** · [العربية](README.ar.md) · [اردو](README.ur.md)

এই রিপোজিটরিটি একটি **স্কিল মার্কেটপ্লেস**। প্রতিটি স্কিল একটি স্ট্যান্ডার্ড [Agent Skill](https://agentskills.io) — `SKILL.md` থাকা একটি ফোল্ডার — তাই এটি Claude Code, Codex, Gemini CLI, GitHub Copilot CLI এবং Agent Skills পড়তে পারে এমন যেকোনো এজেন্টে কাজ করে। Claude Code এই মার্কেটপ্লেস (`sonub-skills`) থেকে এটিকে প্লাগইন হিসেবেও ইনস্টল করতে পারে, তখন আপডেট করতে একটি কমান্ডই যথেষ্ট।

| স্কিল | কী করে |
|------|------|
| [`gp`](skills/gp) | git আর `gh` CLI দিয়ে আপনার সব কাজ **GitHub Projects**-এ পরিচালনা করে |
| [`claude-skill`](skills/claude-skill) | **Claude Code শিখুন এবং আরও দক্ষ হয়ে উঠুন** — কুইজসহ 14টি পাঠ, অফিশিয়াল ডকুমেন্টের সাথে মিলিয়ে দেখা উত্তর, সেটআপ ডাক্তার (doctor), CHANGELOG-এর প্রতিটি নতুন ফিচারের সারাংশ, আর নতুনগুলো আনতে `/claude-skill update` (প্লাগইনের নাম `cc-skill`) |
| [`popup`](skills/popup) | **হোভার পপআপে কঠিন শব্দ বুঝিয়ে দিন** — যেকোনো প্রজেক্টের পাতা ও ডকুমেন্টে অর্থ, সহজ ভাষায় ব্যাখ্যা, উদাহরণ, সোর্স কোড, সম্পর্কিত শব্দ আর আপনার নিজের পাতাগুলোর “আরও জানুন” লিংক — সবই একটি শব্দকোষ JSON থেকে |

## ইনস্টল — গ্লোবাল (ব্যবহারকারী) বা প্রজেক্ট অনুযায়ী

সব স্কিল একইভাবে ইনস্টল হয়। `<plugin>`-এর জায়গায় টেবিলের প্লাগইন নাম (`gp`, `cc-skill`, `popup`) বসান।

**ধাপ 1 — মার্কেটপ্লেস যোগ করুন (প্রতি কম্পিউটারে একবার)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**ধাপ 2 — যেখানে চান সেখানে ইনস্টল করুন**

| পরিসর | কমান্ড | কে পাবে, কোথায় | কোথায় লেখা থাকে |
|------|------|------|------|
| **গ্লোবাল (ব্যবহারকারী)** — ডিফল্ট | `claude plugin install <plugin>@sonub-skills` | আপনি, এই কম্পিউটারের সব প্রজেক্টে | `~/.claude/settings.json` |
| **প্রজেক্ট (টিমের সাথে শেয়ার)** | প্রজেক্ট ফোল্ডারে: `claude plugin install <plugin>@sonub-skills --scope project` | এই রিপোজিটরিতে যারা কাজ করেন সবাই | `.claude/settings.json` (কমিট করুন) |
| **লোকাল (শুধু আপনি, শুধু এই প্রজেক্ট)** | প্রজেক্ট ফোল্ডারে: `claude plugin install <plugin>@sonub-skills --scope local` | আপনি, শুধু এই রিপোজিটরিতে | `.claude/settings.local.json` |

- সেশনের ভেতরে `/plugin install <plugin>@sonub-skills` চালালে একটি স্ক্রিন খোলে, সেখানে পরিসর বেছে নিন। টার্মিনাল থেকে ইনস্টল করে থাকলে খোলা যেকোনো সেশনে `/reload-plugins` চালান।
- দেখতে: `claude plugin list` (পরিসরও দেখায়)। আপডেট: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`। সরাতে: `claude plugin uninstall <plugin>@sonub-skills`।
- একই প্লাগইন একাধিক পরিসরে সেট করা থাকলে লোকাল প্রজেক্টের চেয়ে, আর প্রজেক্ট গ্লোবালের চেয়ে অগ্রাধিকার পায়।

**টিমের সদস্যরা যেন আপনাআপনি পায়** — এটি রিপোজিটরির `.claude/settings.json`-এ কমিট করুন। কোনো সদস্য ফোল্ডারটিকে বিশ্বাস (trust) করার পর Claude Code নিজেই মার্কেটপ্লেস যোগ করে প্লাগইনগুলো ইনস্টল করে দেয়।

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**প্লাগইন ছাড়া — ফোল্ডারটি কপি করুন** আপনার এজেন্টের স্কিল ফোল্ডারে (`<skill>` = `gp`, `claude-skill` বা `popup`)।

| টুল | গ্লোবাল (ব্যবহারকারী) | প্রজেক্ট |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<project>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<project>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # শুধু এই প্রজেক্টে: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**সবচেয়ে সহজ** — এজেন্টকে বলুন *"thruthesky/sonub-skills থেকে cc-skill প্লাগইনটি গ্লোবালি ইনস্টল করো"* (অথবা *"শুধু এই প্রজেক্টে"*), তাহলে এটি ওপরের কমান্ডগুলো আপনার হয়ে চালিয়ে দেবে।

---

## gp — আপনার সব কাজ একটি GitHub Project বোর্ডে

আপনি আপনার AI এজেন্টকে সাধারণ কথায় বলবেন — *"একটা ইস্যু বানাও: iPhone-এ লগইন বোতাম কিছুই করে না, এই স্ক্রিনশটটা যুক্ত করো"*, *"এটা Done-এ সরাও"*, *"একটা Review কলাম যোগ করো"*, *"আমার হাতে কী কী কাজ আছে?"* — এজেন্ট `gh` দিয়ে আপনার GitHub Project বোর্ডে কাজটি করে, তারপর ফলাফল আবার পড়ে নিশ্চিত করে জানায়।

### কী কী আছে

- **GitHub Projects-এর ব্যাখ্যা** — রিপোজিটরি, ইস্যু, প্রজেক্ট (বোর্ড), আইটেম, ড্রাফট, ফিল্ড, Status = কলাম, ভিউ, ওয়ার্কফ্লো। আপনার এজেন্ট এগুলো আপনার ভাষায় শেখাতে পারে।
- **অ্যাকাউন্ট ও লগইন** — নতুন GitHub অ্যাকাউন্ট খোলার ধাপ, `gh` ইনস্টল, `gh auth login`, `project` ও `repo` স্কোপ।
- **বোর্ড** — তৈরি, নাম বদলানো, বিবরণ লেখা, পাবলিক/প্রাইভেট করা, বন্ধ/আবার খোলা, মুছে ফেলা, রিপোজিটরি যুক্ত করা, আপনার বোর্ডের তালিকা দেখা, একটি ডিফল্ট বোর্ড বেছে নেওয়া।
- **কলাম (কানবান)** — যোগ করা, নাম বদলানো (কার্ড যেমন আছে তেমনই থাকে), ক্রম বদলানো, রং, মুছে ফেলা (আগে কার্ডগুলো অন্য কলামে সরাতে হয়)।
- **ফিল্ড ও ভিউ** — কাস্টম ফিল্ড (লেখা, সংখ্যা, তারিখ, একক নির্বাচন), ফিল্টারসহ বোর্ড/টেবিল/রোডম্যাপ ভিউ।
- **ইস্যু** — তৈরি (কোনো কলামে, লেবেল, মাইলস্টোন, প্যারেন্ট ইস্যু, কাস্টম ফিল্ডসহ), সম্পাদনা, কলাম থেকে কলামে সরানো, বন্ধ করা (Done-এ চলে যায়), আবার খোলা, মন্তব্য, বোর্ড থেকে সরানো, আর্কাইভ, মুছে ফেলা।
- **ছবি** — ইস্যুর মূল লেখা বা মন্তব্যে স্ক্রিনশট বা ভিডিও যুক্ত করা।
- **TODO** — ইস্যুর ভেতরে একটি `- [ ]` চেকলিস্ট: যোগ করা, টিক দেওয়া, টিক তোলা, মুছে ফেলা; তালিকায় অগ্রগতি দেখা যায়। হঠাৎ মাথায় আসা আইডিয়ার জন্য ড্রাফট আইটেম, পরে সেগুলোকে ইস্যুতে বদলানো যায়।
- **মানুষ** — দায়িত্ব দেওয়া ও সরানো, কার কাছে কী কাজ আছে দেখা, রিপোজিটরিতে সহযোগী আমন্ত্রণ জানানো এবং বোর্ডের ভূমিকা দেওয়া।

### যা লাগবে

- একটি GitHub অ্যাকাউন্ট (বিনামূল্যে)। এখনও অ্যাকাউন্ট নেই? https://github.com/signup -এ সাইন আপ করুন — ই-মেইল কোড, পাজল, Free প্ল্যান (প্রায় তিন মিনিট)।
- [`gh`](https://cli.github.com) — GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`), `project` ও `repo` স্কোপ দিয়ে লগইন করা।
- Python 3.8 বা নতুন সংস্করণ (শুধু স্ট্যান্ডার্ড লাইব্রেরি)।

### ইনস্টল

**সবচেয়ে সহজ — কাজটা এজেন্টকে দিন।** এই বক্সটি কপি করে Claude Code, Codex, Gemini CLI বা Copilot CLI-তে পেস্ট করে পাঠান:

```text
thruthesky/sonub-skills রিপোজিটরি থেকে gp স্কিলটি ইনস্টল করো।
স্কিলের পাথ: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — এটি একটি স্ট্যান্ডার্ড Agent Skill (SKILL.md থাকা একটি ফোল্ডার)।

1. তুমি যদি Claude Code হও, তাহলে প্লাগইন হিসেবে ইনস্টল করো, এগুলো ক্রমানুসারে চালাও ("already added" ত্রুটি উপেক্ষা করো):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - আমি যদি "শুধু এই প্রজেক্টে" বলে থাকি, তাহলে শেষ লাইনটি প্রজেক্ট ফোল্ডারে --scope project যোগ করে চালাও।
   - যদি আগে থেকেই ইনস্টল করা থাকে, তার বদলে চালাও: claude plugin update gp@sonub-skills
2. অন্য যেকোনো এজেন্ট: এটি স্কিল ফোল্ডার DIR-এ রাখো — সব প্রজেক্ট: ~/.agents/skills, শুধু এই প্রজেক্ট: <প্রজেক্ট>/.agents/skills।
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. চালাও: python3 <স্কিল ফোল্ডার>/scripts/gp.py doctor — এবং এটি যা জানায় তা ঠিক করো (gh ইনস্টল, gh auth login, gh auth refresh -s project,repo)।
4. সংক্ষেপে আমাকে জানাও কী ইনস্টল হলো, doctor-এর ফলাফল কী, এবং এখন আমি "আমার GitHub প্রজেক্টগুলো দেখাও" এর মতো কথা বলতে পারি।
```

**Claude Code — টার্মিনালে দুই লাইন** (সব সংস্করণে কাজ করে):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

চ্যাটের ভেতরে `/plugin marketplace add thruthesky/sonub-skills` তারপর `/plugin install gp@sonub-skills` লিখুন। নতুন সংস্করণে এক লাইনেও হয়: `claude plugin install gp --marketplace thruthesky/sonub-skills`। টার্মিনাল থেকে ইনস্টল করার পর খোলা চ্যাটে `/reload-plugins` চালান (অথবা আবার চালু করুন)।

**যেকোনো এজেন্ট — ফোল্ডারটি কপি করুন** এজেন্টের স্কিল ফোল্ডারে:

| টুল | ব্যবহারকারী স্কিল ফোল্ডার | প্রজেক্ট স্কিল ফোল্ডার |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### গ্লোবাল ইনস্টল ও লোকাল (প্রজেক্ট) ইনস্টল

| | গ্লোবাল — সব প্রজেক্ট | লোকাল — শুধু এই প্রজেক্ট |
|------|------|------|
| Claude Code প্লাগইন | `claude plugin install gp@sonub-skills` | প্রজেক্ট ফোল্ডারে: `claude plugin install gp@sonub-skills --scope project` (`.claude/settings.json`-এ লেখা হয়, টিমের সাথে শেয়ার হয় · শুধু আপনার জন্য: `--scope local`) |
| Claude Code ফোল্ডার কপি | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| যে বোর্ড ব্যবহার হবে | `/gp init <বোর্ড URL> --global` → `~/.config/gp/config.json` | `/gp init <বোর্ড URL>` → `<প্রজেক্ট>/.gp.json` |

স্কিল কোথায় ইনস্টল হবে আর এটি কোন বোর্ড ব্যবহার করবে — এ দুটো আলাদাভাবে বেছে নেওয়া হয়। সাধারণত স্কিলটি একবার গ্লোবালি ইনস্টল করে প্রতিটি প্রজেক্টকে `/gp init <বোর্ড URL>` দিয়ে তার বোর্ড দিয়ে দিন।

### প্রথমবার চালানো

আপনার এজেন্টকে বলুন *"gp সেট আপ করো"* (Claude Code: `/gp:gp`, Codex: `$gp`)। এটি চালায়:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · লগইন ✓ · স্কোপ ✓ · ডিফল্ট বোর্ড
gh auth login                                   # শুধু লগইন না থাকলে — ব্রাউজারে এককালীন কোডটি লিখুন
gh auth refresh -s project,repo                 # শুধু কোনো স্কোপ না থাকলে
python3 scripts/gp.py projects                  # আপনার বোর্ডগুলো
python3 scripts/gp.py init <বোর্ড URL>          # এই প্রজেক্টের বোর্ড (.gp.json) · সব প্রজেক্ট: --global … অথবা নতুন একটি তৈরি করুন:
python3 scripts/gp.py project-create --title "আমার কাজ" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### বোর্ড বেছে নিন — `/gp init`

প্রতিটি ডেভেলপমেন্ট প্রজেক্টের নিজস্ব GitHub Project বোর্ড থাকতে পারে। প্রজেক্ট ফোল্ডারে আপনার এজেন্টকে বোর্ডের ঠিকানা দিন, তাহলে সেই প্রজেক্টের কাজ সেই বোর্ডে যাবে।

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Claude Code প্লাগইন হিসেবে ইনস্টল করা থাকলে: `/gp:gp init …`; Codex: `$gp init …`। "https://… কে এই প্রজেক্টের বোর্ড হিসেবে ব্যবহার করো" বললেও কাজ হয়।

- **লোকাল (ডিফল্ট)** — git রিপোজিটরির ভেতরে এটি `<রিপোজিটরির রুট>/.gp.json`-এ সংরক্ষিত হয় এবং শুধু সেই প্রজেক্টে (ও তার সাব-ফোল্ডারে) ব্যবহৃত হয়। এতে কোনো গোপন তথ্য নেই: টিমের সবাই যেন একই বোর্ড ব্যবহার করে সেজন্য এটি কমিট করুন, অথবা শুধু নিজের কাছে রাখতে `.gitignore`-এ যোগ করুন।
- **গ্লোবাল** — `/gp init <URL> --global` (অথবা "এটাকে সব প্রজেক্টের ডিফল্ট বোর্ড করো") → `~/.config/gp/config.json`, যেসব ফোল্ডারে `.gp.json` নেই সেখানে ব্যবহৃত হয়।
- বোর্ডের যেকোনো পেজ চলে (`/views/2`, ব্যবহারকারীর বোর্ড `/users/…`, সংগঠনের বোর্ড `/orgs/…`)। সংরক্ষণের আগে যাচাই করা হয় যে বোর্ডটি আছে এবং পড়া যায়।
- শুধু `/gp init` দিলে এখন ব্যবহৃত বোর্ড ও তার সেটিং ফাইল দেখায়। সরাতে: `gp.py init --unset` (গ্লোবাল: `--unset --global`)।
- `/gp init` এই প্রজেক্টের `AGENTS.md`/`CLAUDE.md` এবং আপনার গ্লোবাল `~/.claude/CLAUDE.md`/`~/.codex/AGENTS.md`-এ একটি নির্দেশও লেখে: "GitHub Project-এর issue, কাজ ও TODO তৈরি, সম্পাদনা, মুছে ফেলা, তালিকা দেখা বা খোঁজার জন্য সবসময় gp skill ব্যবহার করুন"। URL দিলে সেই URL সহ "এই বোর্ডে কাজ করুন" যোগ হয়। আবার চালালে শুধু সেই অংশটি হালনাগাদ হয়; `--show` শুধু দেখায়, `--no-instructions` বাদ দেয়, `--remove-instructions` মুছে দেয়।
- কোন বোর্ড ব্যবহৃত হবে: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → প্রজেক্টের `.gp.json` → গ্লোবাল সেটিং।

### ব্যবহার — শুধু বলুন

| আপনি বলেন | এজেন্ট চালায় |
|------|------|
| "একটা ইস্যু বানাও: iPhone-এ লগইন বোতাম কিছুই করে না। ধাপ: পুনরুৎপাদন, সংশোধন, পরীক্ষা। shot.png যুক্ত করো" | `create --repo app --title "…" --todo পুনরুৎপাদন --todo সংশোধন --todo পরীক্ষা --image shot.png` → Todo কলাম |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → এই প্রজেক্টের বোর্ড হিসেবে সংরক্ষিত হয় (`.gp.json`) |
| "এটা In Progress-এ দাও" · "#12 কে Review-তে সরাও" | `move app#12 doing` · `move app#12 review` |
| "শেষ!" | `close app#12` — ইস্যুটি বন্ধ করে Done-এ সরিয়ে দেয় |
| "এর TODO-তে 'ডকুমেন্ট হালনাগাদ' যোগ করো" · "প্রথমটায় টিক দাও" | `todo app#12 add "ডকুমেন্ট হালনাগাদ"` · `todo app#12 done 1` |
| "একদম সামনে Urgent নামে একটা কলাম যোগ করো" · "Review-এর নাম বদলে QA করো" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "এটা alice-কে দাও" · "bob-কে রিপোজিটরিতে আমন্ত্রণ জানাও" | `assign app#12 alice` · `invite bob --repo app` (আগে জিজ্ঞেস করে) |
| "আমার হাতে কী কী কাজ আছে?" | `list --assignee @me --state open`, তারপর পরের একটি কাজের পরামর্শ দেয় |
| "বোর্ডে একটা আইডিয়া লিখে রাখো: ডার্ক মোড" | `create --draft --title "ডার্ক মোড"` |
| "একটা Priority ফিল্ড যোগ করো" | `field-add Priority --type single_select --options "High,Medium,Low"` |

সব কমান্ড: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`।

### এটি কীভাবে কাজ করে

- **শুধু `gh` আর Python স্ট্যান্ডার্ড লাইব্রেরি।** gh-কে আর্গুমেন্টের তালিকা দিয়ে ডাকা হয় (শেল ছাড়া), আর শিরোনাম ও মূল লেখা stdin দিয়ে যায় — তাই উদ্ধৃতিচিহ্ন, ইমোজি আর নতুন লাইন কখনো ভাঙে না।
- **নাম দিয়ে ID খোঁজা।** ফিল্ড, কলাম ও অপশনের ID প্রতিবার চালানোর সময় খুঁজে নেওয়া হয়, তাই ওয়েবসাইটে কলামের নাম বদলালেও কিছু ভাঙে না। কলামের নাম বদলালে তার কার্ডগুলো সেখানেই থাকে।
- **প্রতিটি পরিবর্তন আবার পড়ে দেখা হয়।** কোনো পরিবর্তনের পর স্ক্রিপ্ট GitHub-এর আসল অবস্থা (অবস্থা, কলাম, দায়িত্বপ্রাপ্ত ব্যক্তি, লেবেল) দিয়ে একটি `check:` লাইন দেখায়। এজেন্ট সেটি দেখেই জানায়।
- **ছবি** gh-এর `--attach` (GitHub user-attachments) ব্যবহার করে। পুরনো gh হলে ছবিগুলো ইস্যুর রিপোজিটরির `gp-assets` ব্রাঞ্চে কমিট করে লিংক দেওয়া হয়।
- **ডিফল্টভাবে নিরাপদ।** পরিবর্তন করে এমন প্রতিটি কমান্ডে `--dry-run` আছে। ইস্যু, বোর্ড, ফিল্ড বা কার্ডসহ কলাম মুছতে `--yes` লাগে, আর স্কিল এজেন্টকে বলে আগে আপনাকে জিজ্ঞেস করতে। আমন্ত্রণ (যা একজন সত্যিকারের মানুষকে ই-মেইল পাঠায়) পাঠানোর আগেও জিজ্ঞেস করা হয়।
- **বোর্ড সেটিং** প্রতিটি প্রজেক্টের জন্য `.gp.json`-এ (লোকাল) এবং সব প্রজেক্টের জন্য `~/.config/gp/config.json`-এ (গ্লোবাল) সংরক্ষিত থাকে। `--owner/--number` বা `GP_OWNER`/`GP_PROJECT` দুটোর চেয়েই অগ্রাধিকার পায়।

মনে রাখবেন: ইস্যু তৈরির ঠিক পরে GitHub-এর প্রজেক্ট তালিকায় সেটি দেখাতে কয়েক সেকেন্ড লাগতে পারে। `check:` লাইন সরাসরি ইস্যুটি পড়ে, তাই সবসময় হালনাগাদ থাকে।

### আপডেট ও সরানো

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

অন্য এজেন্ট: আপডেট করতে `curl … | tar` লাইনটি আবার চালান; সরাতে `gp` ফোল্ডারটি মুছে ফেলুন।

## claude-skill — Claude Code শিখুন এবং আরও দক্ষ হয়ে উঠুন

Claude Code প্রায় প্রতিদিনই নতুন সংস্করণ প্রকাশ করে (এখন পর্যন্ত 400-এর বেশি)। এই স্কিল এটি ধাপে ধাপে শেখায়, স্মৃতি থেকে নয় বরং **বর্তমান অফিশিয়াল ডকুমেন্ট** দেখে প্রশ্নের উত্তর দেয়, আপনার সেটআপ পরীক্ষা করে, আর CHANGELOG-এর প্রতিটি নতুন ফিচারের সারাংশ রাখে। একবার `/claude-skill update` চালালেই নতুন প্রকাশিত ফিচারগুলো স্কিলে চলে আসে।

### কী কী আছে

- **14 পাঠের শেখার পথ** — ইনস্টল আর প্রথম প্রম্পট থেকে শুরু করে explore → plan → code → commit, কনটেক্সট ব্যবস্থাপনা, CLAUDE.md ও মেমরি, পারমিশন মোড, চেকপয়েন্ট, স্কিল, সাবএজেন্ট, হুক, MCP, প্লাগইন ও মার্কেটপ্লেস, হেডলেস চালানো ও GitHub Actions, এবং যাচাইসহ দীর্ঘ সময় তদারকি ছাড়া চলা কাজ পর্যন্ত। প্রতিটি পাঠে **আপনার নিজের প্রজেক্টে একটি অনুশীলন** আর যাচাইয়ের প্রশ্ন আছে, আর আপনার অগ্রগতি সংরক্ষিত থাকে।
- **Claude Academy-র বিশ্লেষণ** — [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat)-র 64টি Claude টিউটোরিয়াল, সাথে Claude Code-এর টিউটোরিয়াল ও কোর্স (Claude Code 101, Claude Code in action, Agent Skills, Subagents); চ্যাটে যা শেখেন (Projects, মেমরি, কানেক্টর, স্কিল, Research, মডেল ও effort বেছে নেওয়া…) তা Claude Code-এ কীভাবে করবেন তার সাথে মিলিয়ে দেখানো।
- **ডকুমেন্টের সাথে মিলিয়ে দেখা উত্তর** — "হুক কীভাবে কাজ করে?" বা "প্লাগইনের পরিসর (scope) কী?" জিজ্ঞেস করলে এটি code.claude.com খুঁজে পড়ে নেয়, তারপর কমান্ড, উদাহরণ আর ডকুমেন্টের লিংকসহ উত্তর দেয়।
- **CHANGELOG-এর প্রতিটি নতুন ফিচার** — [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md)-এর সব 422টি সংস্করণ (v0.2.21 – v2.1.302), বাগ ফিক্স বাদ দিয়ে, 14টি বিষয়ে সারাংশ করা; সাথে জেনে রাখার মতো 30টি ফিচার আর সর্বশেষ সংযোজন।
- **`/claude-skill update`** — সর্বশেষ CHANGELOG এনে স্কিল এখনো যে সংস্করণগুলো কভার করেনি সেগুলো খুঁজে বের করে, সেগুলোর ফিচার নোট, চিটশিট আর পাঠে যোগ করে, এবং কোন পর্যন্ত কভার হলো তা লিখে রাখে।
- **সেটআপ ডাক্তার (doctor)** — আপনার সংস্করণ, সেটিংস ফাইল (ব্যবহারকারী, প্রজেক্ট, লোকাল), CLAUDE.md-এর দৈর্ঘ্য, রুল, অটো মেমরি, স্কিল, সাবএজেন্ট, প্লাগইন ও MCP সার্ভার দেখে সমাধানের পরামর্শ দেয়।
- **চিটশিট, টিপস আর তৈরির গাইড** — কমান্ড, শর্টকাট, CLI ফ্ল্যাগ আর ফাইলের অবস্থান এক পাতায়; কাজে লাগে এমন অভ্যাস; স্কিল, সাবএজেন্ট, হুক, MCP সার্ভার, প্লাগইন ও মার্কেটপ্লেস কীভাবে বানাবেন।

### ইনস্টল

ওপরের [ইনস্টল](#ইনস্টল--গ্লোবাল-ব্যবহারকারী-বা-প্রজেক্ট-অনুযায়ী) অংশের মতোই। প্লাগইনের নাম **`cc-skill`** (Claude Code `claude-` দিয়ে শুরু হওয়া প্লাগইন নাম Anthropic-এর নিজের প্লাগইনের জন্য সংরক্ষিত রাখে)। স্কিলের নাম `claude-skill`-ই থাকে, তাই একে `/claude-skill` দিয়ে ডাকবেন।

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # গ্লোবাল — সব প্রজেক্ট
claude plugin install cc-skill@sonub-skills --scope project    # এই প্রজেক্ট, টিমের সাথে শেয়ার
```

Python 3.8+ আর ইন্টারনেট সংযোগ লাগবে (এটি অফিশিয়াল ডকুমেন্ট আর CHANGELOG পড়ে)।

### ব্যবহার

| আপনি বলেন | এটি যা করে |
|------|------|
| `/claude-skill` · "চলো Claude Code শিখি" | পাঠের তালিকা আর আপনার অগ্রগতি দেখায়, পরের পাঠ শুরু করে |
| `/claude-skill lesson 5` · "পরের পাঠ" | পাঠটি শেখায়, আপনার প্রজেক্টে অনুশীলন চালায়, যাচাইয়ের প্রশ্ন করে, অগ্রগতি সংরক্ষণ করে |
| `/claude-skill quiz` | যা পড়েছেন তা থেকে পাঁচটি প্রশ্ন, একটি একটি করে, নম্বরসহ |
| "প্রতিবার এডিটের পর হুক দিয়ে prettier কীভাবে চালাব?" | অফিশিয়াল ডকুমেন্ট পড়ে কনফিগের উদাহরণ আর লিংকসহ উত্তর দেয় |
| `/claude-skill new` · "নতুন কী এসেছে?" | সাম্প্রতিক সবচেয়ে কাজের ফিচারগুলো আগে, প্রতিটি কীভাবে চালিয়ে দেখবেন তাসহ |
| `/claude-skill doctor` · "আমার সেটআপ পরীক্ষা করো" | আপনার সেটআপ পর্যালোচনা করে সমাধান প্রস্তাব করে (কিছু বদলানোর আগে জিজ্ঞেস করে) |
| `/claude-skill tips` · `cheatsheet` · `academy` | কাজে লাগে এমন অভ্যাস · কমান্ড ও শর্টকাট · Academy বিশ্লেষণ |
| `/claude-skill build skill` · "আমার জন্য একটা হুক বানাও" | ঠিক উপায়টি বেছে নিয়ে আপনার প্রজেক্টে আপনার সাথে মিলে বানায় |
| `/claude-skill update` | সর্বশেষ CHANGELOG থেকে স্কিলের ফিচার নোট হালনাগাদ করে |

প্লাগইন হিসেবে ইনস্টল করলে `/cc-skill:claude-skill …`-ও কাজ করে। Codex: `$claude-skill …`।

### `/claude-skill update` কীভাবে কাজ করে

1. `scripts/cc.py update-check` নোটগুলো যে সংস্করণ পর্যন্ত কভার করে (`references/changelog-features.md`-এর `covered-through` চিহ্ন) তার সাথে CHANGELOG-এর সর্বশেষ সংস্করণ তুলনা করে।
2. ইনস্টল করা প্লাগইন কপিতে এটি আগে `claude plugin update cc-skill@sonub-skills` চালিয়ে প্রকাশিত নোটগুলো নিয়ে আসে। স্কিলের সোর্স (একটি git checkout) সম্পাদনা করতে চাইলে `--source <folder>` দিন। সোর্স না থাকলে এটি `~/.config/claude-skill/changelog-local.md`-এ লেখে, যা প্লাগইন আপডেটের পরও থেকে যায়।
3. `cc.py changelog --since <covered>` নতুন সংস্করণগুলোর আইটেম তালিকা দেয় (ফিক্স লুকানো থাকে); এজেন্ট নতুন ফিচারগুলো তাদের বিষয়ে যোগ করে, "Latest additions" অংশটি নতুন করে লেখে, নতুন কমান্ড ও শর্টকাট চিটশিটে যোগ করে, আর যে পাঠগুলো ভুল হয়ে গেছে সেগুলো ঠিক করে।
4. `cc.py mark-covered <latest>` চিহ্নটি এগিয়ে দেয়; git checkout হলে সংস্করণ বাড়িয়ে কমিট করে (push করে শুধু আপনি বললে)।
5. কোন পরিসর কভার হলো, আর চালিয়ে দেখার মতো 3–7টি নতুন ফিচার — প্রতিটি কীভাবে চালিয়ে দেখবেন তাসহ — জানায়।

### টুল — `scripts/cc.py`

শুধু Python-এর স্ট্যান্ডার্ড লাইব্রেরি।

```bash
python3 scripts/cc.py doctor                 # আপনার Claude Code সেটআপ পরীক্ষা + পরামর্শ
python3 scripts/cc.py docs hooks             # অফিশিয়াল ডকুমেন্টে খুঁজুন (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # একটি পাতার একটি অংশ পড়ুন
python3 scripts/cc.py changelog --count 5    # সর্বশেষ 5টি সংস্করণ (ফিক্স লুকানো)
python3 scripts/cc.py changelog --grep worktree --count 400   # নাম দিয়ে একটি ফিচার খুঁজুন
python3 scripts/cc.py update-check           # কভার করা সংস্করণ বনাম সর্বশেষ
python3 scripts/cc.py lessons                # পাঠ ও অগ্রগতি
```

## popup — প্রতিটি কঠিন শব্দ ঠিক সেখানেই বুঝিয়ে দিন যেখানে পাঠক সেটির মুখোমুখি হন

পাঠক একটি অচেনা শব্দে — "token", "endpoint", "idempotent" — আটকে যান আর পুরো অনুচ্ছেদের সুতো হারিয়ে ফেলেন। এই স্কিল সেই শব্দের ওপর একটি ছোট কার্ড বসিয়ে দেয়: শব্দটির ওপর মাউস নিন (ফোনে ট্যাপ করুন, কীবোর্ডে ফোকাস করুন), আর সেটি শব্দটিকে স্তরে স্তরে বুঝিয়ে দেয় — এক লাইনের অর্থ, ছোট ব্যাখ্যা, দৈনন্দিন জীবনের তুলনা, উদাহরণের লাইন, সোর্স কোডের অংশ, সম্পর্কিত শব্দ, আর আপনার নিজের প্রজেক্টের অন্য কোনো পাতার **“আরও জানুন” লিংক**। এটি যেকোনো প্রজেক্টে কাজ করে: স্ট্যাটিক সাইট, ডকুমেন্টেশন জেনারেটর, সিঙ্গেল-পেজ অ্যাপ, সার্ভারে তৈরি হওয়া সাইট, এমনকি GitHub-এ পড়া সাধারণ Markdown-ও।

### কী কী আছে

- **একটি শব্দকোষ, এক জায়গায়** — প্রতিটি ব্যাখ্যা একটিমাত্র JSON ফাইলে (বা প্রতি ভাষায় একটি) থাকে; পাতাগুলো শুধু শব্দের id-র দিকে নির্দেশ করে, তাই একই শব্দ সবখানে একইভাবে পড়া যায়।
- **বসিয়ে দিলেই চলে এমন কিট** — `popup.js` ও `popup.css`, কোনো ফ্রেমওয়ার্ক নেই, কোনো বিল্ড ধাপ নেই। `main`/`article`-এর ভেতরের সাধারণ লেখা নিজে থেকেই মুড়ে দেওয়া হয় (প্রতি পাতায় প্রথমবার ব্যবহারে); শব্দগুচ্ছ, বাক্য, "?" বোতাম আর হোভার করলে প্রিভিউ দেখায় এমন লিংকের জন্য স্পষ্ট মার্কআপও আছে। প্রতি পাতায় একটি কার্ড, ক্লিক করলে আটকে থাকে, সম্পর্কিত শব্দের চিপ একই জায়গায় কার্ড বদলে দেয়, Esc চাপলে ফোকাস ফিরে আসে, ফোনে নিচ থেকে ওঠা শিট, ডান-থেকে-বাম লেখার ভাষা, ডার্ক মোড, আর CSS ভেরিয়েবল দিয়ে থিম।
- **বুদ্ধিমান মেলানো** — সবচেয়ে লম্বা বানান আগে, প্রতিটি লিপি অনুযায়ী শব্দের সীমা (ল্যাটিন, সিরিলিক, কোরিয়ান পদচিহ্ন, আরবি উপসর্গ, CJK), যে শব্দ শুধু একটি অংশে প্রযোজ্য (`scope`), এবং বড়-ছোট হাতের অক্ষর আলাদা ধরা কমান্ডের নাম।
- **লেখার নিয়ম** — প্রজেক্ট যত ভাষায় প্রকাশিত হয় প্রতিটিতে এমন কার্ড কীভাবে লিখবেন যা নতুন শিক্ষার্থী একবার পড়েই বোঝে: প্রতিটি ফিল্ড কীসের জন্য, দৈর্ঘ্য, একটি তুলনা, যাচাই করা তথ্য, আর বাস্তব উদাহরণ থাকলে সবসময় উদাহরণ।
- **টুল** — `popup.py check` শব্দকোষ যাচাই করে (প্রতিটি লোকেল, সব ভাষায় উদাহরণ কোড একই কি না, সম্পর্কিত id, "আরও জানুন"-এর গন্তব্য আছে কি না, বানানের সংঘাত); `audit` দেখায় একটি ডকুমেন্ট আগে থেকেই কোন শব্দ ব্যবহার করছে এবং কোন কঠিন শব্দের এখনো কোনো এন্ট্রি নেই; `add` নতুন শব্দ নিরাপদে মিলিয়ে দেয়; `md` + `link` শব্দকোষ থেকে `GLOSSARY.md` বানায় এবং আপনার Markdown ফাইলে প্রতিটি শব্দের প্রথম ব্যবহারে লিংক বসায়, অর্থটি থাকে হোভার টাইটেলে।
- **SONUB** — SONUB রিপোজিটরির ভেতরে এটি দ্বিতীয় কোনো ব্যবস্থা যোগ না করে SONUB-এর নিজস্ব Laravel শব্দকোষের (17টি ভাষা, AI টিউটরের কণ্ঠ) ওপর ভিত্তি করে কাজ করে।

### ইনস্টল

ওপরের [ইনস্টল](#ইনস্টল--গ্লোবাল-ব্যবহারকারী-বা-প্রজেক্ট-অনুযায়ী) অংশের মতোই, প্লাগইনের নাম **`popup`** দিয়ে।

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # গ্লোবাল — সব প্রজেক্ট
claude plugin install popup@sonub-skills --scope project    # এই প্রজেক্ট, টিমের সাথে শেয়ার
```

টুলের জন্য Python 3.8+ লাগবে। কিটটি যেকোনো আধুনিক ব্রাউজারে চলে।

### ব্যবহার

| আপনি বলেন | এটি যা করে |
|------|------|
| `/popup docs/getting-started.md` · "এই পাতায় শব্দ-পপআপ যোগ করো" | কঠিন শব্দ খুঁজে বের করে, এন্ট্রি লেখে, কিট জুড়ে দেয়, আর ব্রাউজারে যাচাই করে |
| `/popup token, sampling, temperature` | এই তিনটি এন্ট্রি লেখে এবং যেখানে শব্দগুলো ব্যবহৃত হয়েছে সেখানে জুড়ে দেয় |
| "মেনুর আইটেমগুলো হোভার করলে বুঝিয়ে দাও" | লিংকে হোভার প্রিভিউ যোগ করে, ফোন ও কীবোর্ডের জন্য "?" বোতামসহ |
| "README-টা নতুনদের উপযোগী করো" | `GLOSSARY.md` বানায় আর প্রতিটি শব্দের প্রথম ব্যবহারে লিংক বসায়, হোভার করলে অর্থ দেখা যায় |
| "শব্দকোষ জাপানিতে অনুবাদ করো" | প্রতিটি এন্ট্রিতে `ja` যোগ করে আর যাচাই করে কিছু বাদ পড়েনি |

প্লাগইন হিসেবে ইনস্টল করলে `/popup:popup …`-ও কাজ করে। Codex: `$popup …`।

### টুল — `scripts/popup.py`

শুধু Python-এর স্ট্যান্ডার্ড লাইব্রেরি।

```bash
python3 scripts/popup.py init popup --locales en,ko   # popup.js/css কপি করে, glossary.json শুরু করে, .popup.json লেখে
python3 scripts/popup.py audit docs                   # প্রতিটি ফাইলে ব্যবহৃত শব্দ + যে কঠিন শব্দের এন্ট্রি নেই
python3 scripts/popup.py add new-terms.json --dry-run # নতুন শব্দ মেলায় (যাচাইসহ, চুপচাপ কিছু বদলায় না)
python3 scripts/popup.py check                        # শব্দকোষ যাচাই করে
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # GitHub-এ Markdown-এর জন্য
```

তারপর আপনার লেআউটে দুটি ট্যাগ যোগ করুন:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## রিপোজিটরির গঠন

```
.claude-plugin/marketplace.json   ← মার্কেটপ্লেস (Claude Code)
skills/gp/
├─ SKILL.md                       ← স্কিল: কখন ও কীভাবে ব্যবহার করতে হয়
├─ .claude-plugin/plugin.json     ← প্লাগইনের তথ্য (শুধু Claude Code; অন্য টুল এটি উপেক্ষা করে)
├─ scripts/gp.py                  ← টুল
└─ references/                    ← প্রয়োজনে পড়ার ডকুমেন্ট
   ├─ github-projects.md          ← ধারণা, অ্যাকাউন্ট, লগইন, প্রথম বোর্ড
   └─ commands.md                 ← সব কমান্ড + সাধারণ gh / GraphQL উদাহরণ
skills/claude-skill/
├─ SKILL.md                       ← স্কিল: কখন ও কীভাবে ব্যবহার করতে হয়
├─ .claude-plugin/plugin.json     ← প্লাগইনের তথ্য (প্লাগইনের নাম cc-skill)
├─ scripts/cc.py                  ← শেখার টুল: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14টি পাঠ · Academy বিশ্লেষণ · CHANGELOG ফিচার · চিটশিট · তৈরির গাইড · টিপস · কুইজ
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← স্কিল: কখন ও কীভাবে ব্যবহার করতে হয়
├─ .claude-plugin/plugin.json     ← প্লাগইনের তথ্য
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← শুধু SONUB-এর টুল (Laravel শব্দকোষ)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

স্কিল কীভাবে কাজ করে তা SONUB AI কোর্সের **Agent Skills** অধ্যায়ে শিখুন: https://sonub.com/bn/learn/ai#agent-skill

লাইসেন্স: [MIT](LICENSE)
