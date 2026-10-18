<div dir="rtl">

# sonub-skills — مهارات الوكلاء من SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · **العربية** · [اردو](README.ur.md)

هذا المستودع هو **سوق للمهارات**. كل مهارة فيه هي [Agent Skill](https://agentskills.io) قياسية — مجلد يحتوي على `SKILL.md` — لذلك تعمل في Claude Code وCodex وGemini CLI وGitHub Copilot CLI وأي وكيل آخر يقرأ Agent Skills. ويمكن لـ Claude Code أيضًا تثبيتها كإضافة (plugin) من هذا السوق (`sonub-skills`)، فيصبح التحديث بأمر واحد.

| المهارة | ماذا تفعل |
|------|------|
| [`gp`](skills/gp) | تدير كل عملك في **GitHub Projects** باستخدام git وأداة `gh` CLI |
| [`claude-skill`](skills/claude-skill) | **تعلّم Claude Code وأتقن استخدامه** — 14 درسًا مع اختبارات قصيرة، وإجابات يُتحقَّق منها في التوثيق الرسمي، وفاحص للإعدادات، وملخّص لكل ميزة جديدة في CHANGELOG، و`/claude-skill update` لجلب الجديد منها (اسم الإضافة `cc-skill`) |

## التثبيت — عام (للمستخدم) أو لكل مشروع

كل المهارات تُثبَّت بالطريقة نفسها. ضع اسم الإضافة من الجدول (`gp`، `cc-skill`) مكان `<plugin>`.

**الخطوة 1 — أضف السوق (مرة واحدة لكل جهاز)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**الخطوة 2 — ثبّت حيث تريد**

| النطاق | الأمر | من يحصل عليها، وأين | أين تُسجَّل |
|------|------|------|------|
| **عام (للمستخدم)** — الافتراضي | `claude plugin install <plugin>@sonub-skills` | أنت، في كل مشاريع هذا الجهاز | `~/.claude/settings.json` |
| **المشروع (مشترك مع الفريق)** | في مجلد المشروع: `claude plugin install <plugin>@sonub-skills --scope project` | كل من يعمل في هذا المستودع | `.claude/settings.json` (اعمل له commit) |
| **محلي (لك وحدك، لهذا المشروع فقط)** | في مجلد المشروع: `claude plugin install <plugin>@sonub-skills --scope local` | أنت، في هذا المستودع فقط | `.claude/settings.local.json` |

- داخل الجلسة، يفتح `/plugin install <plugin>@sonub-skills` شاشة تختار فيها النطاق. إذا ثبّتَّ من الطرفية، فشغّل `/reload-plugins` في أي جلسة مفتوحة.
- للتحقق: `claude plugin list` (يعرض النطاق). للتحديث: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`. للإزالة: `claude plugin uninstall <plugin>@sonub-skills`.
- إذا ضُبطت الإضافة نفسها في أكثر من نطاق، فالمحلي يتقدّم على المشروع، والمشروع يتقدّم على العام.

**اجعل زملاءك يحصلون عليها تلقائيًا** — أضف هذا إلى ملف `.claude/settings.json` في المستودع واعمل له commit. بعد أن يثق زميلك بالمجلد (trust)، يضيف Claude Code السوق ويثبّت الإضافات من تلقاء نفسه.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true }
}
```

**بدون إضافات — انسخ المجلد** إلى مجلد مهارات وكيلك (`<skill>` = `gp` أو `claude-skill`).

| الأداة | عام (للمستخدم) | المشروع |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<project>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<project>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # لهذا المشروع فقط: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**الأسهل** — قل لوكيلك *"ثبّت إضافة cc-skill من thruthesky/sonub-skills تثبيتًا عامًا"* (أو *"لهذا المشروع فقط"*) وسيشغّل الأوامر أعلاه نيابةً عنك.

---

## gp — كل عملك على لوحة GitHub Project

تتحدث مع وكيل الذكاء الاصطناعي بكلام عادي — *"أنشئ مشكلة (issue): زر تسجيل الدخول لا يعمل على iPhone، وأرفق لقطة الشاشة هذه"*، *"انقلها إلى Done"*، *"أضف عمود Review"*، *"ما المهام التي لديّ؟"* — فينفّذ الوكيل ذلك على لوحة GitHub Project الخاصة بك باستخدام `gh`، ثم يقرأ النتيجة مرة أخرى ليتأكد منها.

### ما الذي تغطيه

- **شرح GitHub Projects** — المستودع، المشكلة (issue)، المشروع (اللوحة)، العنصر، المسودة، الحقل، Status = الأعمدة، العرض، سير العمل. يستطيع وكيلك أن يشرحها لك بلغتك.
- **الحساب وتسجيل الدخول** — خطوات إنشاء حساب GitHub جديد، تثبيت `gh`، `gh auth login`، وصلاحيتا `project` و`repo`.
- **اللوحات** — الإنشاء، إعادة التسمية، كتابة الوصف، جعلها عامة/خاصة، الإغلاق/إعادة الفتح، الحذف، ربط المستودعات، عرض قائمة لوحاتك، اختيار لوحة افتراضية.
- **الأعمدة (كانبان)** — الإضافة، إعادة التسمية (تبقى البطاقات كما هي)، تغيير الترتيب، اللون، الحذف (انقل البطاقات إلى عمود آخر أولًا).
- **الحقول والعروض** — حقول مخصصة (نص، رقم، تاريخ، اختيار واحد)، وعروض لوحة/جدول/خارطة طريق مع عوامل تصفية.
- **المشكلات (Issues)** — الإنشاء (في عمود معيّن، مع تسميات ومرحلة رئيسية ومشكلة أم وحقول مخصصة)، التعديل، النقل بين الأعمدة، الإغلاق (تنتقل إلى Done)، إعادة الفتح، التعليق، الإزالة من اللوحة، الأرشفة، الحذف.
- **الصور** — إرفاق لقطات شاشة أو مقاطع فيديو بنص المشكلة أو بتعليق.
- **TODO** — قائمة تحقق `- [ ]` داخل المشكلة: إضافة، تحديد، إلغاء تحديد، حذف؛ ويظهر التقدّم في القوائم. وعناصر مسودة للأفكار السريعة، تُحوَّل إلى مشكلات لاحقًا.
- **الأشخاص** — التكليف وإلغاؤه، معرفة من يتولّى ماذا، دعوة متعاونين إلى المستودع ومنحهم أدوارًا في اللوحة.

### المتطلبات

- حساب GitHub (مجاني). ليس لديك حساب بعد؟ سجّل في https://github.com/signup — رمز البريد الإلكتروني، لغز، خطة Free (نحو ثلاث دقائق).
- [`gh`](https://cli.github.com) — أداة GitHub CLI (على macOS `brew install gh`، وعلى Windows `winget install GitHub.cli`)، مع تسجيل الدخول بصلاحيتي `project` و`repo`.
- Python 3.8 أو أحدث (المكتبة القياسية فقط).

### التثبيت

**الأسهل — دع وكيلك يتولّى الأمر.** انسخ هذا المربع والصقه في Claude Code أو Codex أو Gemini CLI أو Copilot CLI ثم أرسله:

```text
ثبّت مهارة gp من المستودع thruthesky/sonub-skills.
مسار المهارة: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — وهي Agent Skill قياسية (مجلد يحتوي على SKILL.md).

1. إذا كنت Claude Code، فثبّتها كإضافة بتشغيل هذه الأوامر بالترتيب (تجاهل أخطاء "already added"):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - إذا طلبتُ "لهذا المشروع فقط"، فشغّل السطر الأخير في مجلد المشروع مع إضافة --scope project.
   - إذا كانت مثبّتة من قبل، فشغّل بدلًا من ذلك: claude plugin update gp@sonub-skills
2. أي وكيل آخر: ضعها في مجلد المهارات DIR — لكل المشاريع: ~/.agents/skills، ولهذا المشروع فقط: <المشروع>/.agents/skills.
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. شغّل: python3 <مجلد المهارة>/scripts/gp.py doctor — وأصلح ما يُبلغ عنه (تثبيت gh، gh auth login، gh auth refresh -s project,repo).
4. أخبرني باختصار بما تم تثبيته، وبنتيجة doctor، وبأنني أستطيع الآن أن أقول أشياء مثل "اعرض مشاريعي على GitHub".
```

**Claude Code — سطران في الطرفية** (يعمل في كل الإصدارات):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

داخل المحادثة استخدم `/plugin marketplace add thruthesky/sonub-skills` ثم `/plugin install gp@sonub-skills`. وتقبل الإصدارات الأحدث سطرًا واحدًا أيضًا: `claude plugin install gp --marketplace thruthesky/sonub-skills`. بعد التثبيت من الطرفية، شغّل `/reload-plugins` في محادثة مفتوحة (أو أعد التشغيل).

**أي وكيل — انسخ المجلد** إلى مجلد مهارات الوكيل:

| الأداة | مجلد مهارات المستخدم | مجلد مهارات المشروع |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### التثبيت العام والتثبيت المحلي (للمشروع)

| | عام — كل المشاريع | محلي — هذا المشروع فقط |
|------|------|------|
| إضافة Claude Code | `claude plugin install gp@sonub-skills` | في مجلد المشروع: `claude plugin install gp@sonub-skills --scope project` (يُكتب في `.claude/settings.json` ويُشارَك مع الفريق · لك وحدك: `--scope local`) |
| نسخ المجلد في Claude Code | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| اللوحة المستخدمة | `/gp init <رابط اللوحة> --global` ← `~/.config/gp/config.json` | `/gp init <رابط اللوحة>` ← `<المشروع>/.gp.json` |

مكان تثبيت المهارة واللوحة التي تستخدمها يُختاران كلٌّ على حدة. عادةً تثبّت المهارة تثبيتًا عامًا مرة واحدة، ثم تعطي كل مشروع لوحته بـ `/gp init <رابط اللوحة>`.

### التشغيل الأول

اطلب من وكيلك *"اضبط gp"* (في Claude Code: `/gp:gp`، وفي Codex: `$gp`). سيشغّل ما يلي:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · تسجيل الدخول ✓ · الصلاحيات ✓ · اللوحة الافتراضية
gh auth login                                   # فقط إذا لم تكن مسجّل الدخول — اكتب الرمز المؤقت في المتصفح
gh auth refresh -s project,repo                 # فقط إذا كانت إحدى الصلاحيات ناقصة
python3 scripts/gp.py projects                  # لوحاتك
python3 scripts/gp.py init <رابط اللوحة>        # لوحة هذا المشروع (.gp.json) · لكل المشاريع: --global … أو أنشئ واحدة:
python3 scripts/gp.py project-create --title "عملي" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### اختر اللوحة — `/gp init`

يمكن أن تكون لكل مشروع تطوير لوحة GitHub Project خاصة به. أعطِ وكيلك عنوان اللوحة داخل مجلد المشروع، فيذهب عمل ذلك المشروع إلى تلك اللوحة.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

إذا كانت مثبّتة كإضافة Claude Code: `/gp:gp init …`؛ وفي Codex: `$gp init …`. ويمكنك أيضًا أن تقول "استخدم https://… لوحةً لهذا المشروع".

- **محلي (الافتراضي)** — داخل مستودع git تُحفظ في `<جذر المستودع>/.gp.json` وتُستخدم في ذلك المشروع فقط (ومجلداته الفرعية). لا تحتوي على أي سرّ: أرسِلها (commit) ليستخدم زملاؤك اللوحة نفسها، أو أضفها إلى `.gitignore` لتبقى لك وحدك.
- **عام** — `/gp init <URL> --global` (أو "اجعلها اللوحة الافتراضية لكل المشاريع") ← `~/.config/gp/config.json`، وتُستخدم في كل مجلد لا يحتوي على `.gp.json`.
- أي صفحة من اللوحة تصلح (`/views/2`، ولوحات المستخدمين `/users/…`، ولوحات المؤسسات `/orgs/…`). ويُتحقَّق قبل الحفظ من أن اللوحة موجودة ويمكن قراءتها.
- `/gp init` وحده يعرض اللوحة المستخدمة وملف إعداداتها. للإزالة: `gp.py init --unset` (للعام: `--unset --global`).
- أي لوحة تُستخدم: `--owner/--number` ← `GP_OWNER`/`GP_PROJECT` ← ملف `.gp.json` في المشروع ← الإعداد العام.

### الاستخدام — قلها فقط

| تقول أنت | يشغّل الوكيل |
|------|------|
| "أنشئ مشكلة: زر تسجيل الدخول لا يعمل على iPhone. الخطوات: إعادة الإنتاج، إصلاح، اختبار. أرفق shot.png" | `create --repo app --title "…" --todo "إعادة الإنتاج" --todo إصلاح --todo اختبار --image shot.png` ← عمود Todo |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` ← تُحفظ لوحةً لهذا المشروع (`.gp.json`) |
| "ضعها قيد التنفيذ" · "انقل ‎#12 إلى Review" | `move app#12 doing` · `move app#12 review` |
| "انتهيت!" | `close app#12` — يغلق المشكلة وينقلها إلى Done |
| "أضف 'تحديث المستندات' إلى قائمة TODO الخاصة بها" · "حدّد الأول" | `todo app#12 add "تحديث المستندات"` · `todo app#12 done 1` |
| "أضف عمود Urgent في البداية" · "غيّر اسم Review إلى QA" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "أعطها لـ alice" · "ادعُ bob إلى المستودع" | `assign app#12 alice` · `invite bob --repo app` (يسأل أولًا) |
| "ما المهام التي لديّ؟" | `list --assignee @me --state open`، ثم يقترح مهمة واحدة تالية |
| "دوّن فكرة على اللوحة: الوضع الداكن" | `create --draft --title "الوضع الداكن"` |
| "أضف حقل Priority" | `field-add Priority --type single_select --options "High,Medium,Low"` |

كل الأوامر: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### كيف تعمل

- **فقط `gh` ومكتبة Python القياسية.** يُستدعى gh بقائمة من الوسائط (دون shell)، وتمرّ العناوين والنصوص عبر stdin — فلا تنكسر علامات الاقتباس ولا الرموز التعبيرية ولا الأسطر الجديدة أبدًا.
- **المعرّفات بالاسم.** يُبحث عن معرّفات الحقول والأعمدة والخيارات في كل تشغيل، لذا يمكنك إعادة تسمية الأعمدة على الموقع دون أن يتعطّل شيء. وإعادة تسمية عمود تُبقي بطاقاته فيه.
- **كل تغيير يُقرأ مرة أخرى.** بعد أي تغيير يطبع السكربت سطر `check:` بالحالة الحقيقية على GitHub (الحالة، العمود، المكلَّفون، التسميات). ويعتمد الوكيل عليه في تقريره.
- **الصور** تستخدم `--attach` في gh ‏(GitHub user-attachments). ومع إصدار أقدم من gh، تُرسَل الصور (commit) إلى فرع `gp-assets` في مستودع المشكلة ويُوضع رابط لها.
- **آمنة افتراضيًا.** كل أمر يُجري تغييرًا له خيار `--dry-run`. وحذف مشكلة أو لوحة أو حقل أو عمود فيه بطاقات يحتاج إلى `--yes`، والمهارة تطلب من الوكيل أن يسألك أولًا. والدعوات (التي ترسل بريدًا إلكترونيًا إلى شخص حقيقي) يُسأل عنها أولًا أيضًا.
- **إعداد اللوحة** يُحفظ لكل مشروع في `.gp.json` (محلي) ولكل المشاريع في `~/.config/gp/config.json` (عام). وتتقدّم `--owner/--number` أو `GP_OWNER`/`GP_PROJECT` على كليهما.

ملاحظة: بعد إنشاء مشكلة مباشرة، قد تحتاج قائمة المشروع في GitHub بضع ثوانٍ لتظهر فيها. أما سطر `check:` فيقرأ المشكلة مباشرة ويكون محدّثًا دائمًا.

### التحديث والإزالة

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

الوكلاء الآخرون: شغّل سطر `curl … | tar` مرة أخرى للتحديث؛ واحذف مجلد `gp` للإزالة.

## claude-skill — تعلّم Claude Code وأتقن استخدامه

يصدر Claude Code إصدارًا جديدًا كل يوم تقريبًا (أكثر من 400 حتى الآن). هذه المهارة تعلّمك إياه خطوة بخطوة، وتجيب عن أسئلتك من **التوثيق الرسمي الحالي** لا من الذاكرة، وتفحص إعداداتك، وتحتفظ بملخّص لكل ميزة جديدة في CHANGELOG. ويكفي أمر `/claude-skill update` واحد لإدخال الميزات المنشورة حديثًا إلى المهارة.

### ما الذي تغطيه

- **مسار تعلّم من 14 درسًا** — من التثبيت وأول الطلبات (prompts) إلى الاستكشاف ← التخطيط ← كتابة الكود ← الـ commit، وإدارة السياق، وCLAUDE.md والذاكرة، وأوضاع الأذونات، ونقاط الاستعادة (checkpoints)، والمهارات، والوكلاء الفرعيين (subagents)، والخطافات (hooks)، وMCP، والإضافات والأسواق، والتشغيل بلا واجهة (headless) وGitHub Actions، وصولًا إلى العمل الطويل دون إشراف مع التحقق. لكل درس **تمرين في مشروعك أنت** وأسئلة للتحقق، ويُحفظ تقدّمك.
- **تحليل Claude Academy** — دروس Claude الـ 64 على [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) إضافةً إلى دروس ودورات Claude Code ‏(Claude Code 101، Claude Code in action، Agent Skills، Subagents)، مع ربط ما تتعلّمه في المحادثة (Projects، الذاكرة، الموصلات، المهارات، Research، اختيار النموذج ومستوى الجهد…) بطريقة فعله في Claude Code.
- **إجابات يُتحقَّق منها في التوثيق** — عند سؤال مثل "كيف تعمل الخطافات (hooks)؟" أو "ما نطاق الإضافة؟" تبحث في code.claude.com وتقرؤه، ثم تجيب بالأمر ومثال ورابط التوثيق.
- **كل ميزة جديدة في CHANGELOG** — كل الإصدارات الـ 422 في [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) ‏(v0.2.21 – v2.1.302)، دون إصلاحات الأخطاء، ملخّصةً في 14 موضوعًا، إضافةً إلى 30 ميزة تستحق أن تعرفها وآخر الإضافات.
- **`/claude-skill update`** — يجلب أحدث CHANGELOG، ويجد الإصدارات التي لم تغطّها المهارة بعد، ويضيف ميزاتها إلى الملاحظات والورقة المختصرة والدروس، ويسجّل إلى أين وصلت التغطية.
- **فاحص الإعدادات (doctor)** — ينظر في إصدارك، وملفات الإعدادات (المستخدم، المشروع، المحلي)، وطول CLAUDE.md، والقواعد، والذاكرة التلقائية، والمهارات، والوكلاء الفرعيين، والإضافات، وخوادم MCP، ثم يقترح إصلاحات.
- **ورقة مختصرة ونصائح وأدلة بناء** — الأوامر والاختصارات وخيارات CLI ومواقع الملفات في صفحة واحدة؛ عادات مفيدة؛ وكيف تبني المهارات والوكلاء الفرعيين والخطافات وخوادم MCP والإضافات والأسواق.

### التثبيت

كما في قسم [التثبيت](#التثبيت--عام-للمستخدم-أو-لكل-مشروع) أعلاه. اسم الإضافة **`cc-skill`** (يحجز Claude Code أسماء الإضافات التي تبدأ بـ `claude-` لإضافات Anthropic نفسها). أما المهارة فتبقى باسم `claude-skill`، لذلك تستدعيها بـ `/claude-skill`.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # عام — كل المشاريع
claude plugin install cc-skill@sonub-skills --scope project    # هذا المشروع، مشترك مع الفريق
```

تحتاج إلى Python 3.8+ واتصال بالإنترنت (فهي تقرأ التوثيق الرسمي وCHANGELOG).

### الاستخدام

| تقول أنت | ماذا تفعل |
|------|------|
| `/claude-skill` · "لنتعلّم Claude Code" | تعرض الدروس وتقدّمك، وتبدأ الدرس التالي |
| `/claude-skill lesson 5` · "الدرس التالي" | تشرح الدرس، وتشغّل التمرين في مشروعك، وتطرح أسئلة التحقق، وتحفظ التقدّم |
| `/claude-skill quiz` | خمسة أسئلة مما درسته، واحدًا تلو الآخر، مع النتيجة |
| "كيف أشغّل prettier بعد كل تعديل باستخدام hook؟" | تقرأ التوثيق الرسمي وتجيب بمثال للإعدادات والرابط |
| `/claude-skill new` · "ما الجديد؟" | أنفع الميزات الحديثة أولًا، مع طريقة تجربة كل منها |
| `/claude-skill doctor` · "افحص إعداداتي" | تراجع إعداداتك وتقترح إصلاحات (تسأل قبل تغيير أي شيء) |
| `/claude-skill tips` · `cheatsheet` · `academy` | عادات مفيدة · الأوامر والاختصارات · تحليل Academy |
| `/claude-skill build skill` · "اصنع لي hook" | تختار الآلية المناسبة وتبنيها معك في مشروعك |
| `/claude-skill update` | تحدّث ملاحظات الميزات في المهارة من أحدث CHANGELOG |

عند تثبيتها كإضافة يعمل `/cc-skill:claude-skill …` أيضًا. وفي Codex: `$claude-skill …`.

### كيف يعمل `/claude-skill update`

1. يقارن `scripts/cc.py update-check` الإصدار الذي تغطيه الملاحظات (علامة `covered-through` في `references/changelog-features.md`) بأحدث إصدار في CHANGELOG.
2. في نسخة الإضافة المثبّتة يشغّل أولًا `claude plugin update cc-skill@sonub-skills` لجلب الملاحظات المنشورة. لتعديل مصدر المهارة (نسخة git)، مرّر `--source <folder>`. ومن دون مصدر يكتب في `~/.config/claude-skill/changelog-local.md`، الذي يبقى بعد تحديثات الإضافة.
3. يسرد `cc.py changelog --since <covered>` عناصر الإصدارات الجديدة (مع إخفاء الإصلاحات)؛ فيضيف الوكيل الميزات الجديدة إلى مواضيعها، ويعيد كتابة قسم "Latest additions"، ويضيف الأوامر والاختصارات الجديدة إلى الورقة المختصرة، ويصلح الدروس التي أصبحت خاطئة.
4. ينقل `cc.py mark-covered <latest>` العلامة؛ وفي نسخة git يرفع رقم الإصدار ويعمل commit (ولا يعمل push إلا إذا طلبت ذلك).
5. يُبلغك بالنطاق الذي غُطّي و3–7 ميزات جديدة تستحق التجربة، مع طريقة تجربة كل منها.

### الأداة — `scripts/cc.py`

تعتمد على مكتبة Python القياسية فقط.

```bash
python3 scripts/cc.py doctor                 # افحص إعداد Claude Code لديك + نصائح
python3 scripts/cc.py docs hooks             # ابحث في التوثيق الرسمي (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # اقرأ قسمًا واحدًا من صفحة
python3 scripts/cc.py changelog --count 5    # آخر 5 إصدارات (مع إخفاء الإصلاحات)
python3 scripts/cc.py changelog --grep worktree --count 400   # ابحث عن ميزة باسمها
python3 scripts/cc.py update-check           # الإصدارات المغطّاة مقابل الأحدث
python3 scripts/cc.py lessons                # الدروس والتقدّم
```

## بنية المستودع

```
.claude-plugin/marketplace.json   ← السوق (Claude Code)
skills/gp/
├─ SKILL.md                       ← المهارة: متى تُستخدم وكيف
├─ .claude-plugin/plugin.json     ← معلومات الإضافة (Claude Code فقط؛ تتجاهلها الأدوات الأخرى)
├─ scripts/gp.py                  ← الأداة
└─ references/                    ← تُقرأ عند الحاجة
   ├─ github-projects.md          ← المفاهيم، الحساب، تسجيل الدخول، أول لوحة
   └─ commands.md                 ← كل الأوامر + وصفات gh / GraphQL المباشرة
skills/claude-skill/
├─ SKILL.md                       ← المهارة: متى تُستخدم وكيف
├─ .claude-plugin/plugin.json     ← معلومات الإضافة (اسم الإضافة cc-skill)
├─ scripts/cc.py                  ← أداة التعلّم: doctor، docs، read، changelog، update-check، lessons
└─ references/                    ← 14 درسًا · تحليل Academy · ميزات CHANGELOG · ورقة مختصرة · أدلة البناء · نصائح · اختبار
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
```

تعلّم كيف تعمل المهارات في فصل **Agent Skills** من دورة SONUB للذكاء الاصطناعي: https://sonub.com/ar/learn/ai#agent-skill

الترخيص: [MIT](LICENSE)

</div>
