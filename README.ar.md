<div dir="rtl">

# sonub-skills — مهارات الوكلاء من SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · **العربية** · [اردو](README.ur.md)

هذا المستودع هو **سوق للمهارات**. كل مهارة فيه هي [Agent Skill](https://agentskills.io) قياسية — مجلد يحتوي على `SKILL.md` — لذلك تعمل في Claude Code وCodex وGemini CLI وGitHub Copilot CLI وأي وكيل آخر يقرأ Agent Skills. ويمكن لـ Claude Code أيضًا تثبيتها كإضافة (plugin) من هذا السوق (`sonub-skills`)، فيصبح التحديث بأمر واحد.

| المهارة | ماذا تفعل |
|------|------|
| [`gp`](skills/gp) | تدير كل عملك في **GitHub Projects** باستخدام git وأداة `gh` CLI |

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
   - إذا كانت مثبّتة من قبل، فشغّل بدلًا من ذلك: claude plugin update gp@sonub-skills
2. أي وكيل آخر: ضعها في مجلد مهارات المستخدم DIR (في Codex وGemini CLI وCopilot CLI: ~/.agents/skills).
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

### التشغيل الأول

اطلب من وكيلك *"اضبط gp"* (في Claude Code: `/gp:gp`، وفي Codex: `$gp`). سيشغّل ما يلي:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · تسجيل الدخول ✓ · الصلاحيات ✓ · اللوحة الافتراضية
gh auth login                                   # فقط إذا لم تكن مسجّل الدخول — اكتب الرمز المؤقت في المتصفح
gh auth refresh -s project,repo                 # فقط إذا كانت إحدى الصلاحيات ناقصة
python3 scripts/gp.py projects                  # لوحاتك
python3 scripts/gp.py use <owner> <number>      # اختر واحدة … أو أنشئ واحدة:
python3 scripts/gp.py project-create --title "عملي" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### الاستخدام — قلها فقط

| تقول أنت | يشغّل الوكيل |
|------|------|
| "أنشئ مشكلة: زر تسجيل الدخول لا يعمل على iPhone. الخطوات: إعادة الإنتاج، إصلاح، اختبار. أرفق shot.png" | `create --repo app --title "…" --todo "إعادة الإنتاج" --todo إصلاح --todo اختبار --image shot.png` ← عمود Todo |
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
- **اللوحة الافتراضية** تُحفظ في `~/.config/gp/config.json`؛ ويمكن تجاوزها بـ `--owner/--number` أو `GP_OWNER`/`GP_PROJECT`.

ملاحظة: بعد إنشاء مشكلة مباشرة، قد تحتاج قائمة المشروع في GitHub بضع ثوانٍ لتظهر فيها. أما سطر `check:` فيقرأ المشكلة مباشرة ويكون محدّثًا دائمًا.

### التحديث والإزالة

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

الوكلاء الآخرون: شغّل سطر `curl … | tar` مرة أخرى للتحديث؛ واحذف مجلد `gp` للإزالة.

### بنية المستودع

```
.claude-plugin/marketplace.json   ← السوق (Claude Code)
skills/gp/
├─ SKILL.md                       ← المهارة: متى تُستخدم وكيف
├─ .claude-plugin/plugin.json     ← معلومات الإضافة (Claude Code فقط؛ تتجاهلها الأدوات الأخرى)
├─ scripts/gp.py                  ← الأداة
└─ references/                    ← تُقرأ عند الحاجة
   ├─ github-projects.md          ← المفاهيم، الحساب، تسجيل الدخول، أول لوحة
   └─ commands.md                 ← كل الأوامر + وصفات gh / GraphQL المباشرة
```

تعلّم كيف تعمل المهارات في فصل **Agent Skills** من دورة SONUB للذكاء الاصطناعي: https://sonub.com/ar/learn/ai#agent-skill

الترخيص: [MIT](LICENSE)

</div>
