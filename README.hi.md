# sonub-skills — SONUB की Agent Skills

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · **हिन्दी** · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

यह रिपॉज़िटरी एक **स्किल मार्केटप्लेस** है। हर स्किल एक मानक [Agent Skill](https://agentskills.io) है — यानी एक फ़ोल्डर जिसमें `SKILL.md` होती है — इसलिए यह Claude Code, Codex, Gemini CLI, GitHub Copilot CLI और Agent Skills पढ़ने वाले किसी भी दूसरे एजेंट में काम करती है। Claude Code इसे इस मार्केटप्लेस (`sonub-skills`) से प्लगइन के रूप में भी इंस्टॉल कर सकता है, जिससे अपडेट करना सिर्फ़ एक कमांड का काम रह जाता है।

| स्किल | यह क्या करती है |
|------|------|
| [`gp`](skills/gp) | git और `gh` CLI से अपना सारा काम **GitHub Projects** में संभालें |

---

## gp — आपका सारा काम एक GitHub Project बोर्ड पर

आप अपने AI एजेंट से आम बोलचाल की भाषा में बात करते हैं — *"एक issue बनाओ: iPhone पर लॉगिन बटन कुछ नहीं करता, यह स्क्रीनशॉट जोड़ दो"*, *"इसे Done में ले जाओ"*, *"एक Review कॉलम जोड़ो"*, *"मेरे पास कौन-कौन से काम हैं?"* — और एजेंट `gh` से आपके GitHub Project बोर्ड पर वह काम कर देता है, फिर पुष्टि के लिए नतीजे को दोबारा पढ़ता है।

### इसमें क्या-क्या शामिल है

- **GitHub Projects की समझ** — रिपॉज़िटरी, issue, प्रोजेक्ट (बोर्ड), आइटम, ड्राफ़्ट, फ़ील्ड, Status = कॉलम, व्यू, वर्कफ़्लो। आपका एजेंट यह सब आपकी भाषा में सिखा सकता है।
- **खाता और लॉगिन** — नया GitHub खाता बनाने के चरण, `gh` इंस्टॉल करना, `gh auth login`, `project` और `repo` अनुमतियाँ (scope)।
- **बोर्ड** — बनाना, नाम बदलना, विवरण लिखना, सार्वजनिक/निजी करना, बंद करना/फिर से खोलना, हटाना, रिपॉज़िटरी जोड़ना, अपने बोर्डों की सूची देखना, डिफ़ॉल्ट बोर्ड चुनना।
- **कॉलम (कानबान)** — जोड़ना, नाम बदलना (कार्ड वहीं रहते हैं), क्रम बदलना, रंग देना, हटाना (पहले कार्डों को कहीं और ले जाकर)।
- **फ़ील्ड और व्यू** — कस्टम फ़ील्ड (टेक्स्ट, संख्या, तारीख़, एकल चयन), फ़िल्टर के साथ बोर्ड/टेबल/रोडमैप व्यू।
- **Issue** — बनाना (किसी कॉलम में, लेबल, माइलस्टोन, पैरेंट issue और कस्टम फ़ील्ड के साथ), बदलना, कॉलमों के बीच ले जाना, बंद करना (Done में चला जाता है), फिर से खोलना, टिप्पणी करना, बोर्ड से हटाना, संग्रहित (archive) करना, मिटाना।
- **तस्वीरें** — issue के मुख्य भाग या टिप्पणी में स्क्रीनशॉट या वीडियो जोड़ना।
- **TODO** — issue के अंदर `- [ ]` चेकलिस्ट: जोड़ना, टिक करना, टिक हटाना, मिटाना; सूचियों में प्रगति दिखती है। झटपट आए विचारों के लिए ड्राफ़्ट आइटम, जिन्हें बाद में issue में बदला जा सकता है।
- **लोग** — काम सौंपना और हटाना, कौन क्या संभाल रहा है यह देखना, रिपॉज़िटरी में सहयोगियों को आमंत्रित करना और बोर्ड की भूमिकाएँ देना।

### ज़रूरी चीज़ें

- एक GitHub खाता (मुफ़्त)। अभी खाता नहीं है? https://github.com/signup पर साइन अप करें — ई-मेल कोड, पहेली, Free प्लान (लगभग तीन मिनट)।
- [`gh`](https://cli.github.com) — GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`), `project` और `repo` अनुमतियों के साथ लॉगिन किया हुआ।
- Python 3.8 या नया (सिर्फ़ स्टैंडर्ड लाइब्रेरी)।

### इंस्टॉल करना

**सबसे आसान — अपने एजेंट से करवाएँ।** इस बॉक्स को कॉपी करके Claude Code, Codex, Gemini CLI या Copilot CLI में चिपकाएँ और भेज दें:

```text
thruthesky/sonub-skills रिपॉज़िटरी से gp स्किल इंस्टॉल करो।
स्किल का पाथ: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — यह एक मानक Agent Skill है (SKILL.md वाला एक फ़ोल्डर)।

1. अगर तुम Claude Code हो, तो इसे प्लगइन के रूप में इंस्टॉल करो, ये कमांड क्रम से चलाओ ("already added" वाली त्रुटियों को अनदेखा करो):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - अगर यह पहले से इंस्टॉल है, तो इसकी जगह यह चलाओ: claude plugin update gp@sonub-skills
2. कोई और एजेंट हो तो: इसे अपने यूज़र स्किल फ़ोल्डर DIR में रखो (Codex, Gemini CLI, Copilot CLI: ~/.agents/skills)।
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. चलाओ: python3 <स्किल फ़ोल्डर>/scripts/gp.py doctor — और जो समस्याएँ यह बताए उन्हें ठीक करो (gh इंस्टॉल करना, gh auth login, gh auth refresh -s project,repo)।
4. मुझे संक्षेप में बताओ कि क्या इंस्टॉल हुआ, doctor का नतीजा क्या रहा, और यह कि अब मैं "मेरे GitHub प्रोजेक्ट दिखाओ" जैसी बातें कह सकता हूँ।
```

**Claude Code — टर्मिनल में दो लाइनें** (हर वर्ज़न में काम करती हैं):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

चैट में पहले `/plugin marketplace add thruthesky/sonub-skills` और फिर `/plugin install gp@sonub-skills` इस्तेमाल करें। नए वर्ज़न एक लाइन भी स्वीकार करते हैं: `claude plugin install gp --marketplace thruthesky/sonub-skills`। टर्मिनल से इंस्टॉल करने के बाद किसी खुली चैट में `/reload-plugins` चलाएँ (या दोबारा शुरू करें)।

**कोई भी एजेंट — फ़ोल्डर कॉपी करें**, एजेंट के स्किल फ़ोल्डर में:

| टूल | यूज़र स्किल फ़ोल्डर | प्रोजेक्ट स्किल फ़ोल्डर |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

### पहली बार चलाना

अपने एजेंट से कहें *"gp सेट अप करो"* (Claude Code: `/gp:gp`, Codex: `$gp`)। यह ये चलाता है:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · लॉगिन ✓ · अनुमतियाँ ✓ · डिफ़ॉल्ट बोर्ड
gh auth login                                   # सिर्फ़ तब जब लॉगिन न हो — ब्राउज़र में एक बार वाला कोड लिखें
gh auth refresh -s project,repo                 # सिर्फ़ तब जब कोई अनुमति छूट गई हो
python3 scripts/gp.py projects                  # आपके बोर्ड
python3 scripts/gp.py use <owner> <number>      # एक चुनें … या नया बनाएँ:
python3 scripts/gp.py project-create --title "मेरा काम" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### इस्तेमाल — बस कह दीजिए

| आप कहते हैं | एजेंट चलाता है |
|------|------|
| "issue बनाओ: iPhone पर लॉगिन बटन काम नहीं करता। चरण: दोहराएँ, सुधारें, जाँचें। shot.png जोड़ो" | `create --repo app --title "…" --todo दोहराएँ --todo सुधारें --todo जाँचें --image shot.png` → Todo कॉलम |
| "इसे प्रगति में डालो" · "#12 को Review में ले जाओ" | `move app#12 doing` · `move app#12 review` |
| "हो गया!" | `close app#12` — issue बंद करता है और उसे Done में ले जाता है |
| "इसके TODO में 'दस्तावेज़ अपडेट करें' जोड़ो" · "पहले वाले पर टिक करो" | `todo app#12 add "दस्तावेज़ अपडेट करें"` · `todo app#12 done 1` |
| "सबसे आगे Urgent कॉलम जोड़ो" · "Review का नाम बदलकर QA करो" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "इसे alice को दो" · "bob को रिपॉज़िटरी में आमंत्रित करो" | `assign app#12 alice` · `invite bob --repo app` (पहले पूछता है) |
| "मेरे पास कौन-कौन से काम हैं?" | `list --assignee @me --state open`, फिर अगला एक काम सुझाता है |
| "बोर्ड पर एक विचार लिख लो: डार्क मोड" | `create --draft --title "डार्क मोड"` |
| "एक Priority फ़ील्ड जोड़ो" | `field-add Priority --type single_select --options "High,Medium,Low"` |

सारे कमांड: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`।

### यह कैसे काम करता है

- **सिर्फ़ `gh` और Python की स्टैंडर्ड लाइब्रेरी।** gh को आर्ग्युमेंट की सूची के साथ बुलाया जाता है (shell के बिना), और शीर्षक व मुख्य भाग stdin से जाते हैं — उद्धरण चिह्न, इमोजी और नई लाइनें कभी नहीं बिगड़तीं।
- **ID नाम से ढूँढे जाते हैं।** फ़ील्ड, कॉलम और विकल्पों के ID हर बार चलाने पर ढूँढे जाते हैं, इसलिए आप वेबसाइट पर कॉलमों के नाम बदल सकते हैं और कुछ नहीं टूटता। कॉलम का नाम बदलने पर उसके कार्ड उसी में रहते हैं।
- **हर बदलाव दोबारा पढ़ा जाता है।** बदलाव के बाद स्क्रिप्ट एक `check:` लाइन छापती है जिसमें GitHub पर असली स्थिति (स्थिति, कॉलम, ज़िम्मेदार लोग, लेबल) होती है। एजेंट उसी के आधार पर रिपोर्ट करता है।
- **तस्वीरें** gh के `--attach` (GitHub user-attachments) से जाती हैं। पुराने gh में तस्वीरें issue की रिपॉज़िटरी की `gp-assets` ब्रांच में commit होती हैं और उनका लिंक दिया जाता है।
- **डिफ़ॉल्ट रूप से सुरक्षित।** बदलाव करने वाले हर कमांड में `--dry-run` है। किसी issue, बोर्ड, फ़ील्ड या कार्ड वाले कॉलम को मिटाने के लिए `--yes` चाहिए, और स्किल एजेंट से कहती है कि पहले आपसे पूछे। आमंत्रण (जो किसी असली व्यक्ति को ई-मेल भेजते हैं) के लिए भी पहले पूछा जाता है।
- **डिफ़ॉल्ट बोर्ड** `~/.config/gp/config.json` में सहेजा जाता है; इसे `--owner/--number` या `GP_OWNER`/`GP_PROJECT` से बदला जा सकता है।

ध्यान दें: issue बनाने के ठीक बाद GitHub की प्रोजेक्ट सूची में उसे दिखने में कुछ सेकंड लग सकते हैं। `check:` लाइन issue को सीधे पढ़ती है, इसलिए हमेशा ताज़ा होती है।

### अपडेट करना और हटाना

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

दूसरे एजेंट: अपडेट करने के लिए `curl … | tar` वाली लाइन फिर से चलाएँ; हटाने के लिए `gp` फ़ोल्डर मिटा दें।

### रिपॉज़िटरी की बनावट

```
.claude-plugin/marketplace.json   ← मार्केटप्लेस (Claude Code)
skills/gp/
├─ SKILL.md                       ← स्किल: कब और कैसे इस्तेमाल करें
├─ .claude-plugin/plugin.json     ← प्लगइन की जानकारी (सिर्फ़ Claude Code; दूसरे टूल इसे अनदेखा करते हैं)
├─ scripts/gp.py                  ← टूल
└─ references/                    ← ज़रूरत पड़ने पर पढ़ें
   ├─ github-projects.md          ← अवधारणाएँ, खाता, लॉगिन, पहला बोर्ड
   └─ commands.md                 ← हर कमांड + सीधे gh / GraphQL के नुस्ख़े
```

स्किल कैसे काम करती हैं, यह SONUB AI कोर्स के **Agent Skills** अध्याय में सीखें: https://sonub.com/hi/learn/ai#agent-skill

लाइसेंस: [MIT](LICENSE)
