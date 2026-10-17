# sonub-skills — SONUB-এর এজেন্ট স্কিল

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · **বাংলা** · [العربية](README.ar.md) · [اردو](README.ur.md)

এই রিপোজিটরিটি একটি **স্কিল মার্কেটপ্লেস**। প্রতিটি স্কিল একটি স্ট্যান্ডার্ড [Agent Skill](https://agentskills.io) — `SKILL.md` থাকা একটি ফোল্ডার — তাই এটি Claude Code, Codex, Gemini CLI, GitHub Copilot CLI এবং Agent Skills পড়তে পারে এমন যেকোনো এজেন্টে কাজ করে। Claude Code এই মার্কেটপ্লেস (`sonub-skills`) থেকে এটিকে প্লাগইন হিসেবেও ইনস্টল করতে পারে, তখন আপডেট করতে একটি কমান্ডই যথেষ্ট।

| স্কিল | কী করে |
|------|------|
| [`gp`](skills/gp) | git আর `gh` CLI দিয়ে আপনার সব কাজ **GitHub Projects**-এ পরিচালনা করে |

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

### রিপোজিটরির গঠন

```
.claude-plugin/marketplace.json   ← মার্কেটপ্লেস (Claude Code)
skills/gp/
├─ SKILL.md                       ← স্কিল: কখন ও কীভাবে ব্যবহার করতে হয়
├─ .claude-plugin/plugin.json     ← প্লাগইনের তথ্য (শুধু Claude Code; অন্য টুল এটি উপেক্ষা করে)
├─ scripts/gp.py                  ← টুল
└─ references/                    ← প্রয়োজনে পড়ার ডকুমেন্ট
   ├─ github-projects.md          ← ধারণা, অ্যাকাউন্ট, লগইন, প্রথম বোর্ড
   └─ commands.md                 ← সব কমান্ড + সাধারণ gh / GraphQL উদাহরণ
```

স্কিল কীভাবে কাজ করে তা SONUB AI কোর্সের **Agent Skills** অধ্যায়ে শিখুন: https://sonub.com/bn/learn/ai#agent-skill

লাইসেন্স: [MIT](LICENSE)
