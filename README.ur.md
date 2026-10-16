<div dir="rtl">

# sonub-skills — SONUB کی ایجنٹ اسکلز

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · **اردو**

یہ ریپوزیٹری ایک **اسکل مارکیٹ پلیس** ہے۔ ہر اسکل ایک معیاری [Agent Skill](https://agentskills.io) ہے — یعنی ایک فولڈر جس میں `SKILL.md` ہو — اس لیے یہ Claude Code، Codex، Gemini CLI، GitHub Copilot CLI اور Agent Skills پڑھنے والے کسی بھی دوسرے ایجنٹ میں کام کرتی ہے۔ Claude Code اسے اس مارکیٹ پلیس (`sonub-skills`) سے پلگ ان کے طور پر بھی انسٹال کر سکتا ہے، جس سے اپ ڈیٹ صرف ایک کمانڈ کا کام رہ جاتا ہے۔

| اسکل | کیا کرتی ہے |
|------|------|
| [`gp`](skills/gp) | git اور `gh` CLI کے ذریعے آپ کا سارا کام **GitHub Projects** میں سنبھالتی ہے |

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
   - اگر یہ پہلے سے انسٹال ہے تو اس کی جگہ یہ چلاؤ: claude plugin update gp@sonub-skills
2. کوئی اور ایجنٹ: اسے اپنے یوزر اسکل فولڈر DIR میں رکھو (Codex، Gemini CLI، Copilot CLI: ~/.agents/skills)۔
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

### پہلی بار چلانا

اپنے ایجنٹ سے کہیں *"gp سیٹ اپ کرو"* (Claude Code: `/gp:gp`، Codex: `$gp`)۔ یہ چلاتا ہے:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · لاگ اِن ✓ · اسکوپ ✓ · ڈیفالٹ بورڈ
gh auth login                                   # صرف اگر لاگ اِن نہیں ہیں — براؤزر میں ایک بار کا کوڈ لکھیں
gh auth refresh -s project,repo                 # صرف اگر کوئی اسکوپ موجود نہ ہو
python3 scripts/gp.py projects                  # آپ کے بورڈز
python3 scripts/gp.py use <owner> <number>      # ایک چنیں … یا نیا بنائیں:
python3 scripts/gp.py project-create --title "میرا کام" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### استعمال — بس کہہ دیں

| آپ کہتے ہیں | ایجنٹ چلاتا ہے |
|------|------|
| "ایک ایشو بناؤ: iPhone پر لاگ اِن بٹن کچھ نہیں کرتا۔ مراحل: دہرانا، ٹھیک کرنا، ٹیسٹ۔ shot.png لگا دو" | `create --repo app --title "…" --todo دہرانا --todo "ٹھیک کرنا" --todo ٹیسٹ --image shot.png` ← Todo کالم |
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
- **ڈیفالٹ بورڈ** `~/.config/gp/config.json` میں محفوظ ہوتا ہے؛ اسے `--owner/--number` یا `GP_OWNER`/`GP_PROJECT` سے بدلا جا سکتا ہے۔

نوٹ: ایشو بنانے کے فوراً بعد GitHub کی پروجیکٹ فہرست میں اسے نظر آنے میں چند سیکنڈ لگ سکتے ہیں۔ `check:` لائن ایشو کو براہ راست پڑھتی ہے اور ہمیشہ تازہ ہوتی ہے۔

### اپ ڈیٹ کرنا اور ہٹانا

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

دوسرے ایجنٹ: اپ ڈیٹ کے لیے `curl … | tar` والی لائن دوبارہ چلائیں؛ ہٹانے کے لیے `gp` فولڈر حذف کر دیں۔

### ریپوزیٹری کی ساخت

```
.claude-plugin/marketplace.json   ← مارکیٹ پلیس (Claude Code)
skills/gp/
├─ SKILL.md                       ← اسکل: کب اور کیسے استعمال کرنی ہے
├─ .claude-plugin/plugin.json     ← پلگ ان کی معلومات (صرف Claude Code؛ دوسرے ٹول اسے نظر انداز کرتے ہیں)
├─ scripts/gp.py                  ← ٹول
└─ references/                    ← ضرورت پڑنے پر پڑھیں
   ├─ github-projects.md          ← تصورات، اکاؤنٹ، لاگ اِن، پہلا بورڈ
   └─ commands.md                 ← تمام کمانڈز + سادہ gh / GraphQL نسخے
```

اسکلز کیسے کام کرتی ہیں، یہ SONUB AI کورس کے **Agent Skills** باب میں سیکھیں: https://sonub.com/ur/learn/ai#agent-skill

لائسنس: [MIT](LICENSE)

</div>
