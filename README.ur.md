<div dir="rtl">

# sonub-skills — SONUB کی ایجنٹ اسکلز

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · **اردو**

یہ ریپوزیٹری ایک **اسکل مارکیٹ پلیس** ہے۔ ہر اسکل ایک معیاری [Agent Skill](https://agentskills.io) ہے — یعنی ایک فولڈر جس میں `SKILL.md` ہو — اس لیے یہ Claude Code، Codex، Gemini CLI، GitHub Copilot CLI اور Agent Skills پڑھنے والے کسی بھی دوسرے ایجنٹ میں کام کرتی ہے۔ Claude Code اسے اس مارکیٹ پلیس (`sonub-skills`) سے پلگ ان کے طور پر بھی انسٹال کر سکتا ہے، جس سے اپ ڈیٹ صرف ایک کمانڈ کا کام رہ جاتا ہے۔

| اسکل | کیا کرتی ہے |
|------|------|
| [`gp`](skills/gp) | git اور `gh` CLI کے ذریعے آپ کا سارا کام **GitHub Projects** میں سنبھالتی ہے |
| [`claude-skill`](skills/claude-skill) | **Claude Code سیکھیں اور اسے بہتر طریقے سے استعمال کریں** — کوئز کے ساتھ 14 اسباق، آفیشل دستاویزات سے جانچے گئے جوابات، سیٹ اپ ڈاکٹر، CHANGELOG کے ہر نئے فیچر کا خلاصہ، اور نئے فیچرز لانے کے لیے `/claude-skill update` (پلگ ان کا نام `cc-skill`) |
| [`popup`](skills/popup) | **ہوور پاپ اپ سے مشکل الفاظ سمجھائیں** — کسی بھی پروجیکٹ کے صفحات اور دستاویزات میں مطلب، آسان الفاظ میں وضاحت، مثالیں، سورس کوڈ، متعلقہ اصطلاحات اور آپ کے اپنے صفحات کے "مزید جانیں" لنکس، سب ایک ہی لغت JSON سے |

## انسٹال — گلوبل (یوزر) یا ہر پروجیکٹ کے لیے

ہر اسکل ایک ہی طریقے سے انسٹال ہوتی ہے۔ `<plugin>` کی جگہ ٹیبل سے پلگ ان کا نام (`gp`، `cc-skill`، `popup`) لکھیں۔

**مرحلہ 1 — مارکیٹ پلیس شامل کریں (ہر کمپیوٹر پر ایک بار)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**مرحلہ 2 — جہاں چاہیں وہاں انسٹال کریں**

| دائرہ | کمانڈ | کسے ملے گی، کہاں | کہاں درج ہوتی ہے |
|------|------|------|------|
| **گلوبل (یوزر)** — ڈیفالٹ | `claude plugin install <plugin>@sonub-skills` | آپ کو، اس کمپیوٹر کے تمام پروجیکٹس میں | `~/.claude/settings.json` |
| **پروجیکٹ (ٹیم کے ساتھ شیئر)** | پروجیکٹ فولڈر میں: `claude plugin install <plugin>@sonub-skills --scope project` | اس ریپوزیٹری میں کام کرنے والے ہر شخص کو | `.claude/settings.json` (اسے کمٹ کریں) |
| **لوکل (صرف آپ، صرف یہ پروجیکٹ)** | پروجیکٹ فولڈر میں: `claude plugin install <plugin>@sonub-skills --scope local` | آپ کو، صرف اس ریپوزیٹری میں | `.claude/settings.local.json` |

- سیشن کے اندر `/plugin install <plugin>@sonub-skills` ایک اسکرین کھولتا ہے جہاں آپ دائرہ چنتے ہیں۔ اگر آپ نے ٹرمینل سے انسٹال کیا ہے تو کسی بھی کھلے سیشن میں `/reload-plugins` چلائیں۔
- چیک کرنا: `claude plugin list` (دائرہ بھی دکھاتا ہے)۔ اپ ڈیٹ: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`۔ ہٹانا: `claude plugin uninstall <plugin>@sonub-skills`۔
- جب ایک ہی پلگ ان کئی دائروں میں سیٹ ہو تو لوکل کو پروجیکٹ پر، اور پروجیکٹ کو گلوبل پر ترجیح ملتی ہے۔

**ٹیم کے ساتھیوں کو یہ خود بخود مل جائے** — یہ ریپوزیٹری کی `.claude/settings.json` میں کمٹ کر دیں۔ جب کوئی ساتھی فولڈر پر بھروسہ (trust) کر لے تو Claude Code خود مارکیٹ پلیس شامل کر کے پلگ انز انسٹال کر دیتا ہے۔

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**پلگ ان کے بغیر — فولڈر کاپی کریں** اپنے ایجنٹ کے اسکل فولڈر میں (`<skill>` = `gp`، `claude-skill` یا `popup`)۔

| ٹول | گلوبل (یوزر) | پروجیکٹ |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<project>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<project>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # صرف اس پروجیکٹ کے لیے: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**سب سے آسان** — اپنے ایجنٹ سے کہیں *"thruthesky/sonub-skills سے cc-skill پلگ ان گلوبل انسٹال کرو"* (یا *"صرف اس پروجیکٹ کے لیے"*) اور وہ اوپر والی کمانڈز آپ کے لیے چلا دے گا۔

---

## gp — آپ کا سارا کام ایک GitHub Project بورڈ پر

آپ اپنے AI ایجنٹ سے عام الفاظ میں بات کرتے ہیں — *"ایک ایشو بناؤ: iPhone پر لاگ اِن بٹن کچھ نہیں کرتا، یہ اسکرین شاٹ ساتھ لگا دو"*، *"اسے Done میں لے جاؤ"*، *"ایک Review کالم شامل کرو"*، *"میرے ذمے کیا کیا کام ہیں؟"* — اور ایجنٹ `gh` کے ذریعے آپ کے GitHub Project بورڈ پر یہ کام کر دیتا ہے، پھر تصدیق کے لیے نتیجہ دوبارہ پڑھ کر بتاتا ہے۔

### اس میں کیا کیا شامل ہے

- **GitHub Projects کی وضاحت** — ریپوزیٹری، ایشو، پروجیکٹ (بورڈ)، آئٹم، ڈرافٹ، فیلڈ، Status = کالم، ویو، ورک فلو۔ آپ کا ایجنٹ یہ سب آپ کی زبان میں سکھا سکتا ہے۔
- **اکاؤنٹ اور لاگ اِن** — نیا GitHub اکاؤنٹ بنانے کے مراحل، `gh` انسٹال کرنا، `gh auth login`، `project` اور `repo` اسکوپ۔
- **بورڈ** — بنانا، نام بدلنا، تفصیل لکھنا، پبلک/پرائیویٹ کرنا، بند کرنا/دوبارہ کھولنا، حذف کرنا، ریپوزیٹریاں جوڑنا، اپنے بورڈز کی فہرست دیکھنا، ایک ڈیفالٹ بورڈ چننا۔
- **کالم (کانبان)** — شامل کرنا، نام بدلنا (کارڈ اپنی جگہ رہتے ہیں)، ترتیب بدلنا، رنگ، حذف کرنا (پہلے کارڈ کسی اور کالم میں منتقل کریں)۔
- **فیلڈز اور ویوز** — کسٹم فیلڈز (متن، نمبر، تاریخ، سنگل سلیکٹ)، فلٹرز کے ساتھ بورڈ/ٹیبل/روڈ میپ ویوز۔
- **ایشوز** — بنانا (کسی کالم میں، لیبلز، مائل اسٹون، پیرنٹ ایشو اور کسٹم فیلڈز کے ساتھ)، ترمیم کرنا، کالموں کے درمیان منتقل کرنا، بند کرنا (Done میں چلا جاتا ہے)، دوبارہ کھولنا، تبصرہ کرنا، بورڈ سے ہٹانا، آرکائیو کرنا، حذف کرنا۔
- **تصاویر** — ایشو کے متن یا تبصرے میں اسکرین شاٹ یا ویڈیو لگانا۔
- **TODO** — ایشو کے اندر `- [ ]` چیک لسٹ: شامل کرنا، ٹک کرنا، ٹک ہٹانا، حذف کرنا؛ فہرستوں میں پیش رفت نظر آتی ہے۔ فوری خیالات کے لیے ڈرافٹ آئٹمز، جنہیں بعد میں ایشوز میں بدلا جا سکتا ہے۔
- **لوگ** — ذمہ داری دینا اور ہٹانا، دیکھنا کہ کس کے پاس کیا کام ہے، ریپوزیٹری میں ساتھیوں کو مدعو کرنا اور بورڈ کے کردار دینا۔

### ضروریات

- ایک GitHub اکاؤنٹ (مفت)۔ ابھی اکاؤنٹ نہیں ہے؟ https://github.com/signup پر سائن اپ کریں — ای میل کوڈ، پزل، Free پلان (تقریباً تین منٹ)۔
- [`gh`](https://cli.github.com) — GitHub CLI (macOS پر `brew install gh`، Windows پر `winget install GitHub.cli`)، `project` اور `repo` اسکوپ کے ساتھ لاگ اِن۔
- Python 3.8 یا اس سے نیا (صرف اسٹینڈرڈ لائبریری)۔

### انسٹال

**سب سے آسان — یہ کام اپنے ایجنٹ کو دے دیں۔** یہ باکس کاپی کر کے Claude Code، Codex، Gemini CLI یا Copilot CLI میں پیسٹ کریں اور بھیج دیں:

```text
thruthesky/sonub-skills ریپوزیٹری سے gp اسکل انسٹال کرو۔
اسکل کا راستہ: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — یہ ایک معیاری Agent Skill ہے (ایک فولڈر جس میں SKILL.md ہے)۔

1. اگر تم Claude Code ہو تو اسے پلگ ان کے طور پر انسٹال کرو، یہ کمانڈز ترتیب سے چلاؤ ("already added" والی غلطیوں کو نظر انداز کرو):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - اگر میں نے "صرف اس پروجیکٹ کے لیے" کہا ہے تو آخری لائن پروجیکٹ فولڈر میں --scope project لگا کر چلاؤ۔
   - اگر یہ پہلے سے انسٹال ہے تو اس کی جگہ یہ چلاؤ: claude plugin update gp@sonub-skills
2. کوئی اور ایجنٹ: اسے اسکل فولڈر DIR میں رکھو — تمام پروجیکٹس: ~/.agents/skills، صرف یہ پروجیکٹ: <پروجیکٹ>/.agents/skills۔
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. چلاؤ: python3 <اسکل فولڈر>/scripts/gp.py doctor — اور جو مسئلہ یہ بتائے اسے ٹھیک کرو (gh انسٹال کرنا، gh auth login، gh auth refresh -s project,repo)۔
4. مجھے مختصر طور پر بتاؤ کہ کیا انسٹال ہوا، doctor کا نتیجہ کیا رہا، اور یہ کہ اب میں "میرے GitHub پروجیکٹس دکھاؤ" جیسی باتیں کہہ سکتا ہوں۔
```

**Claude Code — ٹرمینل میں دو لائنیں** (ہر ورژن میں کام کرتی ہیں):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

چیٹ کے اندر `/plugin marketplace add thruthesky/sonub-skills` اور پھر `/plugin install gp@sonub-skills` استعمال کریں۔ نئے ورژن ایک لائن بھی قبول کرتے ہیں: `claude plugin install gp --marketplace thruthesky/sonub-skills`۔ ٹرمینل سے انسٹال کرنے کے بعد کھلی ہوئی چیٹ میں `/reload-plugins` چلائیں (یا دوبارہ شروع کریں)۔

**کوئی بھی ایجنٹ — فولڈر کاپی کریں** ایجنٹ کے اسکل فولڈر میں:

| ٹول | یوزر اسکل فولڈر | پروجیکٹ اسکل فولڈر |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### گلوبل انسٹال اور لوکل (پروجیکٹ) انسٹال

| | گلوبل — تمام پروجیکٹس | لوکل — صرف یہ پروجیکٹ |
|------|------|------|
| Claude Code پلگ ان | `claude plugin install gp@sonub-skills` | پروجیکٹ فولڈر میں: `claude plugin install gp@sonub-skills --scope project` (`.claude/settings.json` میں لکھا جاتا ہے، ٹیم کے ساتھ شیئر ہوتا ہے · صرف آپ کے لیے: `--scope local`) |
| Claude Code فولڈر کاپی | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| استعمال ہونے والا بورڈ | `/gp init <بورڈ URL> --global` ← `~/.config/gp/config.json` | `/gp init <بورڈ URL>` ← `<پروجیکٹ>/.gp.json` |

اسکل کہاں انسٹال ہے اور وہ کون سا بورڈ استعمال کرتی ہے، یہ دونوں الگ الگ چنے جاتے ہیں۔ عام طور پر آپ اسکل کو ایک بار گلوبل انسٹال کرتے ہیں اور ہر پروجیکٹ کو `/gp init <بورڈ URL>` سے اس کا بورڈ دیتے ہیں۔

### پہلی بار چلانا

اپنے ایجنٹ سے کہیں *"gp سیٹ اپ کرو"* (Claude Code: `/gp:gp`، Codex: `$gp`)۔ یہ چلاتا ہے:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · لاگ اِن ✓ · اسکوپ ✓ · ڈیفالٹ بورڈ
gh auth login                                   # صرف اگر لاگ اِن نہیں ہیں — براؤزر میں ایک بار کا کوڈ لکھیں
gh auth refresh -s project,repo                 # صرف اگر کوئی اسکوپ موجود نہ ہو
python3 scripts/gp.py projects                  # آپ کے بورڈز
python3 scripts/gp.py init <بورڈ URL>           # اس پروجیکٹ کا بورڈ (.gp.json) · تمام پروجیکٹس: --global … یا نیا بنائیں:
python3 scripts/gp.py project-create --title "میرا کام" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### بورڈ چنیں — `/gp init`

ہر ڈیولپمنٹ پروجیکٹ کا اپنا GitHub Project بورڈ ہو سکتا ہے۔ پروجیکٹ فولڈر میں اپنے ایجنٹ کو بورڈ کا پتہ دیں، اور اس پروجیکٹ کا کام اسی بورڈ پر جائے گا۔

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Claude Code پلگ ان کے طور پر انسٹال ہو تو: `/gp:gp init …`؛ Codex: `$gp init …`۔ "https://… کو اس پروجیکٹ کا بورڈ بناؤ" کہنا بھی کام کرتا ہے۔

- **لوکل (ڈیفالٹ)** — git ریپوزیٹری کے اندر یہ `<ریپوزیٹری کی جڑ>/.gp.json` میں محفوظ ہوتا ہے اور صرف اسی پروجیکٹ (اور اس کے ذیلی فولڈرز) میں استعمال ہوتا ہے۔ اس میں کوئی خفیہ معلومات نہیں: اسے کمٹ کریں تاکہ ٹیم کے ساتھی بھی وہی بورڈ استعمال کریں، یا اسے صرف اپنے پاس رکھنے کے لیے `.gitignore` میں شامل کریں۔
- **گلوبل** — `/gp init <URL> --global` (یا "اسے تمام پروجیکٹس کا ڈیفالٹ بورڈ بنا دو") ← `~/.config/gp/config.json`، جو ہر اس فولڈر میں استعمال ہوتا ہے جہاں `.gp.json` نہیں۔
- بورڈ کا کوئی بھی صفحہ چلتا ہے (`/views/2`، یوزر بورڈز `/users/…`، تنظیم کے بورڈز `/orgs/…`)۔ محفوظ کرنے سے پہلے دیکھا جاتا ہے کہ بورڈ موجود ہے اور پڑھا جا سکتا ہے۔
- صرف `/gp init` لکھنے سے استعمال میں موجود بورڈ اور اس کی سیٹنگ فائل دکھائی دیتی ہے۔ ہٹانا: `gp.py init --unset` (گلوبل: `--unset --global`)۔
- `/gp init` اس پروجیکٹ کی `AGENTS.md`/`CLAUDE.md` اور آپ کی گلوبل `~/.claude/CLAUDE.md`/`~/.codex/AGENTS.md` میں ایک ہدایت بھی لکھتا ہے: "GitHub Project کے issues، کام اور TODO بنانے، بدلنے، حذف کرنے، فہرست دیکھنے یا تلاش کرنے کے لیے ہمیشہ gp skill استعمال کریں"۔ URL دینے پر اسی URL کے ساتھ "اس بورڈ پر کام کریں" بھی شامل ہوتا ہے۔ دوبارہ چلانے پر صرف وہی حصہ تازہ ہوتا ہے؛ `--show` صرف دکھاتا ہے، `--no-instructions` اسے چھوڑ دیتا ہے، `--remove-instructions` اسے ہٹاتا ہے۔
- کون سا بورڈ استعمال ہوگا: `--owner/--number` ← `GP_OWNER`/`GP_PROJECT` ← پروجیکٹ کی `.gp.json` ← گلوبل سیٹنگ۔

### استعمال — بس کہہ دیں

| آپ کہتے ہیں | ایجنٹ چلاتا ہے |
|------|------|
| "ایک ایشو بناؤ: iPhone پر لاگ اِن بٹن کچھ نہیں کرتا۔ مراحل: دہرانا، ٹھیک کرنا، ٹیسٹ۔ shot.png لگا دو" | `create --repo app --title "…" --todo دہرانا --todo "ٹھیک کرنا" --todo ٹیسٹ --image shot.png` ← Todo کالم |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` ← اس پروجیکٹ کے بورڈ کے طور پر محفوظ (`.gp.json`) |
| "اسے In Progress میں ڈال دو" · "‎#12 کو Review میں لے جاؤ" | `move app#12 doing` · `move app#12 review` |
| "ہو گیا!" | `close app#12` — ایشو بند کر کے اسے Done میں لے جاتا ہے |
| "اس کے TODO میں 'دستاویزات اپ ڈیٹ کرنا' شامل کرو" · "پہلے والے پر ٹک لگا دو" | `todo app#12 add "دستاویزات اپ ڈیٹ کرنا"` · `todo app#12 done 1` |
| "سب سے آگے Urgent کالم شامل کرو" · "Review کا نام بدل کر QA کر دو" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "یہ alice کو دے دو" · "bob کو ریپوزیٹری میں مدعو کرو" | `assign app#12 alice` · `invite bob --repo app` (پہلے پوچھتا ہے) |
| "میرے ذمے کیا کیا کام ہیں؟" | `list --assignee @me --state open`، پھر اگلا ایک کام تجویز کرتا ہے |
| "بورڈ پر ایک خیال لکھ لو: ڈارک موڈ" | `create --draft --title "ڈارک موڈ"` |
| "ایک Priority فیلڈ شامل کرو" | `field-add Priority --type single_select --options "High,Medium,Low"` |

تمام کمانڈز: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`۔

### یہ کیسے کام کرتی ہے

- **صرف `gh` اور Python اسٹینڈرڈ لائبریری۔** gh کو آرگیومنٹس کی فہرست کے ساتھ بلایا جاتا ہے (shell کے بغیر)، اور عنوان اور متن stdin کے ذریعے جاتے ہیں — اس لیے کوٹیشن مارکس، ایموجی اور نئی لائنیں کبھی نہیں ٹوٹتیں۔
- **ID نام سے۔** فیلڈ، کالم اور آپشن کی ID ہر بار چلانے پر تلاش کی جاتی ہیں، اس لیے آپ ویب سائٹ پر کالموں کے نام بدل سکتے ہیں اور کچھ نہیں ٹوٹتا۔ کالم کا نام بدلنے سے اس کے کارڈ وہیں رہتے ہیں۔
- **ہر تبدیلی دوبارہ پڑھی جاتی ہے۔** تبدیلی کے بعد اسکرپٹ GitHub کی اصل حالت (حالت، کالم، ذمہ دار افراد، لیبلز) کے ساتھ ایک `check:` لائن دکھاتا ہے۔ ایجنٹ اسی سے رپورٹ کرتا ہے۔
- **تصاویر** کے لیے gh کا `--attach` (GitHub user-attachments) استعمال ہوتا ہے۔ پرانے gh کے ساتھ تصاویر ایشو کی ریپوزیٹری کی `gp-assets` برانچ میں کمٹ کر کے لنک کی جاتی ہیں۔
- **ڈیفالٹ طور پر محفوظ۔** ہر تبدیلی کرنے والی کمانڈ میں `--dry-run` موجود ہے۔ ایشو، بورڈ، فیلڈ یا کارڈز والا کالم حذف کرنے کے لیے `--yes` چاہیے، اور اسکل ایجنٹ کو کہتی ہے کہ پہلے آپ سے پوچھے۔ دعوت نامے (جو کسی حقیقی شخص کو ای میل بھیجتے ہیں) بھیجنے سے پہلے بھی پوچھا جاتا ہے۔
- **بورڈ سیٹنگ** ہر پروجیکٹ کے لیے `.gp.json` (لوکل) میں اور تمام پروجیکٹس کے لیے `~/.config/gp/config.json` (گلوبل) میں محفوظ ہوتی ہے۔ `--owner/--number` یا `GP_OWNER`/`GP_PROJECT` دونوں پر فوقیت رکھتے ہیں۔

نوٹ: ایشو بنانے کے فوراً بعد GitHub کی پروجیکٹ فہرست میں اسے نظر آنے میں چند سیکنڈ لگ سکتے ہیں۔ `check:` لائن ایشو کو براہ راست پڑھتی ہے اور ہمیشہ تازہ ہوتی ہے۔

### اپ ڈیٹ کرنا اور ہٹانا

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

دوسرے ایجنٹ: اپ ڈیٹ کے لیے `curl … | tar` والی لائن دوبارہ چلائیں؛ ہٹانے کے لیے `gp` فولڈر حذف کر دیں۔

## claude-skill — Claude Code سیکھیں اور اسے بہتر طریقے سے استعمال کریں

Claude Code تقریباً ہر روز نیا ورژن جاری کرتا ہے (اب تک 400 سے زیادہ)۔ یہ اسکل اسے ترتیب سے سکھاتی ہے، سوالوں کے جواب یادداشت کے بجائے **موجودہ آفیشل دستاویزات** سے دیتی ہے، آپ کا سیٹ اپ چیک کرتی ہے، اور CHANGELOG کے ہر نئے فیچر کا خلاصہ رکھتی ہے۔ بس ایک `/claude-skill update` نئے جاری ہونے والے فیچرز اسکل میں لے آتا ہے۔

### اس میں کیا کیا شامل ہے

- **14 اسباق کا تعلیمی سلسلہ** — انسٹال اور پہلے پرامپٹس سے لے کر کھوج ← منصوبہ ← کوڈ ← کمٹ، کانٹیکسٹ کا انتظام، CLAUDE.md اور میموری، پرمیشن موڈز، چیک پوائنٹس، اسکلز، سب ایجنٹس، ہُکس، MCP، پلگ انز اور مارکیٹ پلیسز، ہیڈلیس رن اور GitHub Actions، اور تصدیق کے ساتھ لمبے، بغیر نگرانی کے کام تک۔ ہر سبق میں **آپ کے اپنے پروجیکٹ میں ایک مشق** اور جانچ کے سوالات ہیں، اور آپ کی پیش رفت محفوظ رہتی ہے۔
- **Claude Academy کا تجزیہ** — [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) کے 64 Claude ٹیوٹوریلز، ساتھ میں Claude Code کے ٹیوٹوریلز اور کورسز (Claude Code 101، Claude Code in action، Agent Skills، Subagents)؛ چیٹ میں جو کچھ آپ سیکھتے ہیں (Projects، میموری، کنیکٹرز، اسکلز، Research، ماڈل اور effort چننا…) اسے Claude Code میں کرنے کے طریقے سے جوڑ کر دکھایا گیا ہے۔
- **دستاویزات سے جانچے گئے جوابات** — "ہُکس کیسے کام کرتے ہیں؟" یا "پلگ ان کا دائرہ (scope) کیا ہے؟" جیسے سوال پر یہ code.claude.com میں تلاش کر کے پڑھتی ہے، پھر کمانڈ، مثال اور دستاویز کے لنک کے ساتھ جواب دیتی ہے۔
- **CHANGELOG کا ہر نیا فیچر** — [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) کے تمام 422 ورژن (v0.2.21 – v2.1.302)، بگ فکسز کے بغیر، 14 موضوعات میں خلاصہ؛ ساتھ میں جاننے کے لائق 30 فیچرز اور تازہ ترین اضافے۔
- **`/claude-skill update`** — تازہ ترین CHANGELOG لاتی ہے، وہ ورژن ڈھونڈتی ہے جو اسکل میں ابھی شامل نہیں، ان کے فیچرز نوٹس، چیٹ شیٹ اور اسباق میں شامل کرتی ہے، اور درج کرتی ہے کہ کہاں تک کور ہو چکا ہے۔
- **سیٹ اپ ڈاکٹر** — آپ کا ورژن، سیٹنگز فائلیں (یوزر، پروجیکٹ، لوکل)، CLAUDE.md کی لمبائی، رولز، آٹو میموری، اسکلز، سب ایجنٹس، پلگ انز اور MCP سرورز دیکھ کر اصلاحات تجویز کرتی ہے۔
- **چیٹ شیٹ، مشورے اور بنانے کی گائیڈز** — کمانڈز، شارٹ کٹس، CLI فلیگز اور فائلوں کی جگہیں ایک صفحے پر؛ کارآمد عادتیں؛ اسکلز، سب ایجنٹس، ہُکس، MCP سرورز، پلگ انز اور مارکیٹ پلیسز کیسے بنائیں۔

### انسٹال

اوپر والے [انسٹال](#انسٹال--گلوبل-یوزر-یا-ہر-پروجیکٹ-کے-لیے) حصے کی طرح۔ پلگ ان کا نام **`cc-skill`** ہے (Claude Code ان پلگ ان ناموں کو جو `claude-` سے شروع ہوں، Anthropic کے اپنے پلگ انز کے لیے مخصوص رکھتا ہے)۔ اسکل کا نام `claude-skill` ہی رہتا ہے، اس لیے آپ اسے `/claude-skill` سے بلاتے ہیں۔

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # گلوبل — تمام پروجیکٹس
claude plugin install cc-skill@sonub-skills --scope project    # یہ پروجیکٹ، ٹیم کے ساتھ شیئر
```

Python 3.8+ اور انٹرنیٹ کنکشن درکار ہے (یہ آفیشل دستاویزات اور CHANGELOG پڑھتی ہے)۔

### استعمال

| آپ کہتے ہیں | یہ کرتی ہے |
|------|------|
| `/claude-skill` · "چلو Claude Code سیکھتے ہیں" | اسباق اور آپ کی پیش رفت دکھاتی ہے، اگلا سبق شروع کرتی ہے |
| `/claude-skill lesson 5` · "اگلا سبق" | سبق سکھاتی ہے، آپ کے پروجیکٹ میں مشق کرواتی ہے، جانچ کے سوال پوچھتی ہے، پیش رفت محفوظ کرتی ہے |
| `/claude-skill quiz` | جو آپ نے پڑھا اس سے پانچ سوال، ایک ایک کر کے، نمبروں کے ساتھ |
| "ہر ایڈٹ کے بعد hook سے prettier کیسے چلاؤں؟" | آفیشل دستاویزات پڑھ کر کنفیگ کی مثال اور لنک کے ساتھ جواب دیتی ہے |
| `/claude-skill new` · "نیا کیا ہے؟" | سب سے کارآمد حالیہ فیچرز پہلے، ہر ایک کو آزمانے کے طریقے کے ساتھ |
| `/claude-skill doctor` · "میرا سیٹ اپ چیک کرو" | آپ کے سیٹ اپ کا جائزہ لے کر اصلاحات تجویز کرتی ہے (کچھ بھی بدلنے سے پہلے پوچھتی ہے) |
| `/claude-skill tips` · `cheatsheet` · `academy` | کارآمد عادتیں · کمانڈز اور شارٹ کٹس · Academy کا تجزیہ |
| `/claude-skill build skill` · "میرے لیے ایک hook بنا دو" | صحیح طریقہ چن کر آپ کے پروجیکٹ میں آپ کے ساتھ مل کر بناتی ہے |
| `/claude-skill update` | تازہ ترین CHANGELOG سے اسکل کے فیچر نوٹس اپ ڈیٹ کرتی ہے |

پلگ ان کے طور پر انسٹال ہو تو `/cc-skill:claude-skill …` بھی کام کرتا ہے۔ Codex میں: `$claude-skill …`۔

### `/claude-skill update` کیسے کام کرتا ہے

1. `scripts/cc.py update-check` اس ورژن کا، جس تک نوٹس کور کرتے ہیں (`references/changelog-features.md` میں `covered-through` نشان)، CHANGELOG کے تازہ ترین ورژن سے موازنہ کرتا ہے۔
2. انسٹال شدہ پلگ ان کاپی پر یہ پہلے `claude plugin update cc-skill@sonub-skills` چلا کر شائع شدہ نوٹس لیتا ہے۔ اسکل کا سورس (git checkout) ایڈٹ کرنا ہو تو `--source <folder>` دیں۔ سورس نہ ہو تو یہ `~/.config/claude-skill/changelog-local.md` میں لکھتا ہے، جو پلگ ان اپ ڈیٹس کے بعد بھی باقی رہتی ہے۔
3. `cc.py changelog --since <covered>` نئے ورژنز کے آئٹمز کی فہرست دیتا ہے (فکسز چھپے رہتے ہیں)؛ ایجنٹ نئے فیچرز ان کے موضوعات میں شامل کرتا ہے، "Latest additions" والا حصہ نئے سرے سے لکھتا ہے، نئی کمانڈز اور شارٹ کٹس چیٹ شیٹ میں ڈالتا ہے، اور جو اسباق غلط ہو گئے ہوں انہیں ٹھیک کرتا ہے۔
4. `cc.py mark-covered <latest>` نشان آگے بڑھاتا ہے؛ git checkout میں یہ ورژن بڑھا کر کمٹ کرتا ہے (push صرف آپ کے کہنے پر)۔
5. یہ بتاتا ہے کہ کون سی رینج کور ہوئی، اور آزمانے کے لائق 3–7 نئے فیچرز، ہر ایک کو آزمانے کے طریقے کے ساتھ۔

### ٹول — `scripts/cc.py`

صرف Python کی اسٹینڈرڈ لائبریری۔

```bash
python3 scripts/cc.py doctor                 # اپنا Claude Code سیٹ اپ چیک کریں + مشورے
python3 scripts/cc.py docs hooks             # آفیشل دستاویزات میں تلاش (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # کسی صفحے کا ایک حصہ پڑھیں
python3 scripts/cc.py changelog --count 5    # تازہ ترین 5 ورژن (فکسز چھپے ہوئے)
python3 scripts/cc.py changelog --grep worktree --count 400   # نام سے کوئی فیچر ڈھونڈیں
python3 scripts/cc.py update-check           # کور شدہ ورژن بمقابلہ تازہ ترین
python3 scripts/cc.py lessons                # اسباق اور پیش رفت
```

## popup — ہر مشکل لفظ کو وہیں سمجھائیں جہاں قاری اس سے ملتا ہے

قاری ایک انجان لفظ پر — "token"، "endpoint"، "idempotent" — رک جاتا ہے اور پورے پیراگراف کا سرا کھو بیٹھتا ہے۔ یہ اسکل اس لفظ پر ایک چھوٹا سا کارڈ لگا دیتی ہے: اس پر ماؤس لے جائیں (فون پر ٹیپ کریں، کی بورڈ سے فوکس کریں) اور وہ اصطلاح کو تہہ بہ تہہ سمجھاتا ہے — ایک سطر میں مطلب، مختصر وضاحت، روزمرہ کی مثال سے موازنہ، مثالوں کی سطریں، سورس کوڈ کا ٹکڑا، متعلقہ اصطلاحات، اور آپ کے اپنے پروجیکٹ کے کسی دوسرے صفحے کا **"مزید جانیں" لنک**۔ یہ کسی بھی پروجیکٹ میں چلتی ہے: اسٹیٹک سائٹس، دستاویزات بنانے والے ٹولز، سنگل پیج ایپس، سرور پر بننے والی سائٹس، اور GitHub پر پڑھی جانے والی سادہ Markdown بھی۔

### اس میں کیا کیا شامل ہے

- **ایک لغت، ایک جگہ** — ہر وضاحت ایک JSON فائل (یا ہر زبان کی ایک فائل) میں رہتی ہے؛ صفحات صرف اصطلاح کی id کی طرف اشارہ کرتے ہیں، اس لیے ایک ہی لفظ ہر جگہ ایک جیسا پڑھا جاتا ہے۔
- **سیدھا جوڑ لینے والی کٹ** — `popup.js` اور `popup.css`، نہ کوئی فریم ورک، نہ بلڈ کا مرحلہ۔ `main`/`article` کے اندر کا سادہ متن خود بخود لپیٹ دیا جاتا ہے (ہر صفحے پر پہلی بار استعمال پر)؛ فقروں، جملوں، "?" بٹنوں اور ہوور پر پیش منظر دکھانے والے لنکس کے لیے واضح مارک اپ بھی ہے۔ ہر صفحے پر ایک کارڈ، کلک کرنے پر ٹھہرا رہتا ہے، متعلقہ اصطلاحات کے چپ اسی جگہ کارڈ بدل دیتے ہیں، Esc سے فوکس واپس آتا ہے، فون پر نیچے سے کھلنے والی شیٹ، دائیں سے بائیں لکھی جانے والی زبانیں، ڈارک موڈ، اور CSS ویری ایبلز سے تھیم۔
- **سمجھدار مطابقت** — سب سے لمبے ہجے پہلے، ہر رسم الخط کے مطابق لفظ کی حدیں (لاطینی، سیریلک، کوریائی لاحقے، عربی سابقے، CJK)، ایسی اصطلاحات جو صرف ایک حصے پر لاگو ہوتی ہیں (`scope`)، اور بڑے چھوٹے حروف کا فرق رکھنے والے کمانڈ نام۔
- **لکھنے کے اصول** — پروجیکٹ جتنی زبانوں میں دستیاب ہے، ہر زبان میں ایسا کارڈ کیسے لکھیں جسے نیا سیکھنے والا ایک بار پڑھ کر سمجھ لے: ہر فیلڈ کس لیے ہے، لمبائی، ایک موازنہ، جانچی ہوئی باتیں، اور جہاں حقیقی مثالیں ہوں وہاں مثالیں۔
- **ٹول** — `popup.py check` لغت کی جانچ کرتا ہے (ہر لوکیل، تمام زبانوں میں ایک جیسا مثالی کوڈ، متعلقہ id، "مزید جانیں" کے ہدف موجود ہیں یا نہیں، ہجوں کا ٹکراؤ)؛ `audit` دکھاتا ہے کہ کوئی دستاویز پہلے سے کون سی اصطلاحات استعمال کرتی ہے اور کن مشکل الفاظ کا ابھی کوئی اندراج نہیں؛ `add` نئی اصطلاحات محفوظ طریقے سے ملا دیتا ہے؛ `md` + `link` لغت سے `GLOSSARY.md` بناتے ہیں اور آپ کی Markdown فائلوں میں ہر اصطلاح کے پہلے استعمال پر لنک لگاتے ہیں، جس کے ہوور ٹائٹل میں مطلب ہوتا ہے۔
- **SONUB** — SONUB ریپوزیٹری کے اندر یہ دوسرا نظام شامل کرنے کے بجائے SONUB کی اپنی Laravel لغت (17 زبانیں، AI ٹیوٹر کی آواز) پر بنتی ہے۔

### انسٹال

اوپر والے [انسٹال](#انسٹال--گلوبل-یوزر-یا-ہر-پروجیکٹ-کے-لیے) حصے کی طرح، پلگ ان کے نام **`popup`** کے ساتھ۔

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # گلوبل — تمام پروجیکٹس
claude plugin install popup@sonub-skills --scope project    # یہ پروجیکٹ، ٹیم کے ساتھ شیئر
```

ٹول کے لیے Python 3.8+ درکار ہے۔ کٹ کسی بھی جدید براؤزر میں چلتی ہے۔

### استعمال

| آپ کہتے ہیں | یہ کرتی ہے |
|------|------|
| `/popup docs/getting-started.md` · "اس صفحے میں اصطلاحات کے پاپ اپ شامل کرو" | مشکل الفاظ ڈھونڈتی ہے، ان کے اندراجات لکھتی ہے، کٹ جوڑتی ہے، اور براؤزر میں جانچتی ہے |
| `/popup token, sampling, temperature` | یہ تینوں اندراجات لکھتی ہے اور جہاں یہ الفاظ استعمال ہوئے ہیں وہاں جوڑ دیتی ہے |
| "مینو کی آئٹمز ہوور کرنے پر سمجھاؤ" | لنکس پر ہوور پیش منظر شامل کرتی ہے، فون اور کی بورڈ کے لیے "?" بٹنوں کے ساتھ |
| "README کو مبتدیوں کے لیے آسان بناؤ" | `GLOSSARY.md` بناتی ہے اور ہر اصطلاح کے پہلے استعمال پر لنک لگاتی ہے، مطلب ہوور کرنے پر نظر آتا ہے |
| "لغت کا جاپانی میں ترجمہ کرو" | ہر اندراج میں `ja` شامل کرتی ہے اور جانچتی ہے کہ کچھ رہ تو نہیں گیا |

پلگ ان کے طور پر انسٹال ہو تو `/popup:popup …` بھی کام کرتا ہے۔ Codex میں: `$popup …`۔

### ٹول — `scripts/popup.py`

صرف Python کی اسٹینڈرڈ لائبریری۔

```bash
python3 scripts/popup.py init popup --locales en,ko   # popup.js/css کاپی کرے، glossary.json شروع کرے، .popup.json لکھے
python3 scripts/popup.py audit docs                   # ہر فائل میں استعمال شدہ اصطلاحات + جن مشکل الفاظ کا اندراج نہیں
python3 scripts/popup.py add new-terms.json --dry-run # نئی اصطلاحات ملائے (جانچ کے ساتھ، خاموشی سے کچھ نہیں بدلتا)
python3 scripts/popup.py check                        # لغت کی جانچ کرے
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # GitHub پر Markdown کے لیے
```

پھر اپنے لے آؤٹ میں دو ٹیگ شامل کریں:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## ریپوزیٹری کی ساخت

```
.claude-plugin/marketplace.json   ← مارکیٹ پلیس (Claude Code)
skills/gp/
├─ SKILL.md                       ← اسکل: کب اور کیسے استعمال کرنی ہے
├─ .claude-plugin/plugin.json     ← پلگ ان کی معلومات (صرف Claude Code؛ دوسرے ٹول اسے نظر انداز کرتے ہیں)
├─ scripts/gp.py                  ← ٹول
└─ references/                    ← ضرورت پڑنے پر پڑھیں
   ├─ github-projects.md          ← تصورات، اکاؤنٹ، لاگ اِن، پہلا بورڈ
   └─ commands.md                 ← تمام کمانڈز + سادہ gh / GraphQL نسخے
skills/claude-skill/
├─ SKILL.md                       ← اسکل: کب اور کیسے استعمال کرنی ہے
├─ .claude-plugin/plugin.json     ← پلگ ان کی معلومات (پلگ ان کا نام cc-skill)
├─ scripts/cc.py                  ← سیکھنے کا ٹول: doctor، docs، read، changelog، update-check، lessons
└─ references/                    ← 14 اسباق · Academy کا تجزیہ · CHANGELOG فیچرز · چیٹ شیٹ · بنانے کی گائیڈز · مشورے · کوئز
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← اسکل: کب اور کیسے استعمال کرنی ہے
├─ .claude-plugin/plugin.json     ← پلگ ان کی معلومات
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← صرف SONUB کے ٹولز (Laravel لغت)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

اسکلز کیسے کام کرتی ہیں، یہ SONUB AI کورس کے **Agent Skills** باب میں سیکھیں: https://sonub.com/ur/learn/ai#agent-skill

لائسنس: [MIT](LICENSE)

</div>
