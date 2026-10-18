# sonub-skills — SONUB की Agent Skills

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · **हिन्दी** · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

यह रिपॉज़िटरी एक **स्किल मार्केटप्लेस** है। हर स्किल एक मानक [Agent Skill](https://agentskills.io) है — यानी एक फ़ोल्डर जिसमें `SKILL.md` होती है — इसलिए यह Claude Code, Codex, Gemini CLI, GitHub Copilot CLI और Agent Skills पढ़ने वाले किसी भी दूसरे एजेंट में काम करती है। Claude Code इसे इस मार्केटप्लेस (`sonub-skills`) से प्लगइन के रूप में भी इंस्टॉल कर सकता है, जिससे अपडेट करना सिर्फ़ एक कमांड का काम रह जाता है।

| स्किल | यह क्या करती है |
|------|------|
| [`gp`](skills/gp) | git और `gh` CLI से अपना सारा काम **GitHub Projects** में संभालें |
| [`claude-skill`](skills/claude-skill) | **Claude Code सीखें और उसे बेहतर ढंग से इस्तेमाल करें** — क्विज़ वाले 14 पाठ, आधिकारिक दस्तावेज़ों से जाँचे गए जवाब, सेटअप डॉक्टर, CHANGELOG की हर नई सुविधा का सार, और नई सुविधाएँ जोड़ने के लिए `/claude-skill update` (प्लगइन का नाम `cc-skill`) |
| [`popup`](skills/popup) | **होवर पॉपअप से कठिन शब्द समझाएँ** — किसी भी प्रोजेक्ट के पेजों और दस्तावेज़ों में अर्थ, सरल शब्दों में व्याख्या, उदाहरण, सोर्स कोड, जुड़े शब्द और आपके अपने पेजों के “और जानें” लिंक, सब एक ही शब्दकोश JSON से |

## इंस्टॉल — ग्लोबल (यूज़र) या प्रोजेक्ट के हिसाब से

हर स्किल एक ही तरीके से इंस्टॉल होती है। `<प्लगइन>` की जगह टेबल से प्लगइन का नाम (`gp`, `cc-skill`, `popup`) लिखें।

**चरण 1 — मार्केटप्लेस जोड़ें (हर कंप्यूटर पर एक बार)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**चरण 2 — जहाँ चाहिए वहाँ इंस्टॉल करें**

| दायरा (scope) | कमांड | कौन, कहाँ इस्तेमाल करेगा | कहाँ लिखा जाता है |
|------|------|------|------|
| **ग्लोबल (यूज़र)** — डिफ़ॉल्ट | `claude plugin install <प्लगइन>@sonub-skills` | आप, इस कंप्यूटर के हर प्रोजेक्ट में | `~/.claude/settings.json` |
| **प्रोजेक्ट (टीम के साथ साझा)** | प्रोजेक्ट फ़ोल्डर में: `claude plugin install <प्लगइन>@sonub-skills --scope project` | इस रिपॉज़िटरी में काम करने वाले सभी लोग | `.claude/settings.json` (इसे commit करें) |
| **लोकल (सिर्फ़ आप, सिर्फ़ यह प्रोजेक्ट)** | प्रोजेक्ट फ़ोल्डर में: `claude plugin install <प्लगइन>@sonub-skills --scope local` | आप, सिर्फ़ इस रिपॉज़िटरी में | `.claude/settings.local.json` |

- चैट में `/plugin install <प्लगइन>@sonub-skills` चलाने पर एक स्क्रीन खुलती है जिसमें आप दायरा चुनते हैं। अगर टर्मिनल से इंस्टॉल किया है, तो किसी खुली चैट में `/reload-plugins` चलाएँ।
- जाँचें: `claude plugin list` (दायरा भी दिखाता है)। अपडेट: `claude plugin marketplace update sonub-skills && claude plugin update <प्लगइन>@sonub-skills`। हटाएँ: `claude plugin uninstall <प्लगइन>@sonub-skills`।
- अगर एक ही प्लगइन कई दायरों में सेट है, तो लोकल प्रोजेक्ट से ऊपर और प्रोजेक्ट ग्लोबल से ऊपर रहता है।

**टीम के साथियों को अपने-आप मिल जाए** — इसे रिपॉज़िटरी की `.claude/settings.json` में डालकर commit करें। जब कोई साथी फ़ोल्डर पर भरोसा (trust) कर देता है, तो Claude Code मार्केटप्लेस जोड़कर प्लगइन इंस्टॉल कर देता है।

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**प्लगइन के बिना — फ़ोल्डर कॉपी करें**, अपने एजेंट के स्किल फ़ोल्डर में (`<स्किल>` = `gp`, `claude-skill` या `popup`)।

| टूल | ग्लोबल (यूज़र) | प्रोजेक्ट |
|------|------|------|
| Claude Code | `~/.claude/skills/<स्किल>` | `<प्रोजेक्ट>/.claude/skills/<स्किल>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<स्किल>` | `<प्रोजेक्ट>/.agents/skills/<स्किल>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # सिर्फ़ इस प्रोजेक्ट के लिए: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**सबसे आसान** — अपने एजेंट से कहें *"thruthesky/sonub-skills से cc-skill प्लगइन ग्लोबल इंस्टॉल करो"* (या *"सिर्फ़ इस प्रोजेक्ट के लिए"*), और वह ऊपर वाले कमांड आपके लिए चला देगा।

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
   - अगर मैंने "सिर्फ़ इस प्रोजेक्ट के लिए" कहा है, तो आख़िरी लाइन प्रोजेक्ट फ़ोल्डर में --scope project जोड़कर चलाओ।
   - अगर यह पहले से इंस्टॉल है, तो इसकी जगह यह चलाओ: claude plugin update gp@sonub-skills
2. कोई और एजेंट हो तो: इसे स्किल फ़ोल्डर DIR में रखो — सभी प्रोजेक्ट: ~/.agents/skills, सिर्फ़ यह प्रोजेक्ट: <प्रोजेक्ट>/.agents/skills।
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

#### ग्लोबल इंस्टॉल और लोकल (प्रोजेक्ट) इंस्टॉल

| | ग्लोबल — सभी प्रोजेक्ट | लोकल — सिर्फ़ यह प्रोजेक्ट |
|------|------|------|
| Claude Code प्लगइन | `claude plugin install gp@sonub-skills` | प्रोजेक्ट फ़ोल्डर में: `claude plugin install gp@sonub-skills --scope project` (`.claude/settings.json` में लिखा जाता है, टीम के साथ साझा होता है · सिर्फ़ आपके लिए: `--scope local`) |
| Claude Code फ़ोल्डर कॉपी | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| इस्तेमाल होने वाला बोर्ड | `/gp init <बोर्ड URL> --global` → `~/.config/gp/config.json` | `/gp init <बोर्ड URL>` → `<प्रोजेक्ट>/.gp.json` |

स्किल कहाँ इंस्टॉल है और वह कौन-सा बोर्ड इस्तेमाल करती है, ये दोनों अलग-अलग चुने जाते हैं। आमतौर पर आप स्किल को एक बार ग्लोबल इंस्टॉल करते हैं और हर प्रोजेक्ट को `/gp init <बोर्ड URL>` से उसका बोर्ड देते हैं।

### पहली बार चलाना

अपने एजेंट से कहें *"gp सेट अप करो"* (Claude Code: `/gp:gp`, Codex: `$gp`)। यह ये चलाता है:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · लॉगिन ✓ · अनुमतियाँ ✓ · डिफ़ॉल्ट बोर्ड
gh auth login                                   # सिर्फ़ तब जब लॉगिन न हो — ब्राउज़र में एक बार वाला कोड लिखें
gh auth refresh -s project,repo                 # सिर्फ़ तब जब कोई अनुमति छूट गई हो
python3 scripts/gp.py projects                  # आपके बोर्ड
python3 scripts/gp.py init <बोर्ड URL>          # इस प्रोजेक्ट का बोर्ड (.gp.json) · सभी प्रोजेक्ट: --global … या नया बनाएँ:
python3 scripts/gp.py project-create --title "मेरा काम" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### बोर्ड चुनें — `/gp init`

हर डेवलपमेंट प्रोजेक्ट का अपना GitHub Project बोर्ड हो सकता है। प्रोजेक्ट फ़ोल्डर में अपने एजेंट को बोर्ड का पता दें, और उस प्रोजेक्ट का काम उसी बोर्ड पर जाएगा।

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Claude Code प्लगइन के रूप में इंस्टॉल हो तो: `/gp:gp init …`; Codex: `$gp init …`। "https://… को इस प्रोजेक्ट का बोर्ड बनाओ" कहना भी काम करता है।

- **लोकल (डिफ़ॉल्ट)** — git रिपॉज़िटरी के अंदर यह `<रिपॉज़िटरी का रूट>/.gp.json` में सहेजा जाता है और सिर्फ़ उसी प्रोजेक्ट (और उसके सब-फ़ोल्डरों) में इस्तेमाल होता है। इसमें कोई गोपनीय जानकारी नहीं होती: इसे commit करें ताकि टीम के साथी भी वही बोर्ड इस्तेमाल करें, या इसे सिर्फ़ अपने पास रखने के लिए `.gitignore` में जोड़ें।
- **ग्लोबल** — `/gp init <URL> --global` (या "इसे सभी प्रोजेक्ट का डिफ़ॉल्ट बोर्ड बनाओ") → `~/.config/gp/config.json`, जो हर उस फ़ोल्डर में इस्तेमाल होता है जहाँ `.gp.json` नहीं है।
- बोर्ड का कोई भी पेज चलता है (`/views/2`, यूज़र बोर्ड `/users/…`, संगठन के बोर्ड `/orgs/…`)। सहेजने से पहले जाँचा जाता है कि बोर्ड मौजूद है और पढ़ा जा सकता है।
- सिर्फ़ `/gp init` लिखने पर इस्तेमाल हो रहा बोर्ड और उसकी सेटिंग फ़ाइल दिखती है। हटाना: `gp.py init --unset` (ग्लोबल: `--unset --global`)।
- कौन-सा बोर्ड इस्तेमाल होगा: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → प्रोजेक्ट की `.gp.json` → ग्लोबल सेटिंग।

### इस्तेमाल — बस कह दीजिए

| आप कहते हैं | एजेंट चलाता है |
|------|------|
| "issue बनाओ: iPhone पर लॉगिन बटन काम नहीं करता। चरण: दोहराएँ, सुधारें, जाँचें। shot.png जोड़ो" | `create --repo app --title "…" --todo दोहराएँ --todo सुधारें --todo जाँचें --image shot.png` → Todo कॉलम |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → इस प्रोजेक्ट के बोर्ड के रूप में सहेजा जाता है (`.gp.json`) |
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
- **बोर्ड सेटिंग** हर प्रोजेक्ट के लिए `.gp.json` (लोकल) में और सभी प्रोजेक्ट के लिए `~/.config/gp/config.json` (ग्लोबल) में सहेजी जाती है। `--owner/--number` या `GP_OWNER`/`GP_PROJECT` इन दोनों से ऊपर रहते हैं।

ध्यान दें: issue बनाने के ठीक बाद GitHub की प्रोजेक्ट सूची में उसे दिखने में कुछ सेकंड लग सकते हैं। `check:` लाइन issue को सीधे पढ़ती है, इसलिए हमेशा ताज़ा होती है।

### अपडेट करना और हटाना

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

दूसरे एजेंट: अपडेट करने के लिए `curl … | tar` वाली लाइन फिर से चलाएँ; हटाने के लिए `gp` फ़ोल्डर मिटा दें।

## claude-skill — Claude Code सीखें और उसे बेहतर ढंग से इस्तेमाल करें

Claude Code लगभग हर दिन नया वर्ज़न जारी करता है (अब तक 400 से ज़्यादा)। यह स्किल इसे क्रम से सिखाती है, सवालों के जवाब याद्दाश्त से नहीं बल्कि **मौजूदा आधिकारिक दस्तावेज़ों** से देती है, आपका सेटअप जाँचती है, और CHANGELOG की हर नई सुविधा का सार रखती है। बस एक `/claude-skill update` से नई जारी हुई सुविधाएँ स्किल में आ जाती हैं।

### इसमें क्या-क्या शामिल है

- **14 पाठों का अध्ययन क्रम** — इंस्टॉल और पहले प्रॉम्प्ट से लेकर खोजें → योजना बनाएँ → कोड लिखें → commit, context संभालना, CLAUDE.md और memory, अनुमति मोड (permission mode), checkpoint, स्किल, subagent, hook, MCP, प्लगइन और मार्केटप्लेस, headless रन और GitHub Actions, और जाँच के साथ बिना निगरानी चलने वाले लंबे काम तक। हर पाठ में **आपके अपने प्रोजेक्ट में एक अभ्यास** और जाँच के सवाल हैं, और आपकी प्रगति सहेजी जाती है।
- **Claude Academy का विश्लेषण** — [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) के 64 Claude ट्यूटोरियल, साथ में Claude Code के ट्यूटोरियल और कोर्स (Claude Code 101, Claude Code in action, Agent Skills, Subagents); चैट में जो सीखते हैं (Projects, memory, connector, स्किल, Research, मॉडल और effort चुनना…) उसे Claude Code में करने के तरीके से जोड़ा गया है।
- **दस्तावेज़ों से जाँचे गए जवाब** — "hook कैसे काम करते हैं?" या "प्लगइन का दायरा (scope) क्या है?" जैसे सवालों पर यह code.claude.com में खोजकर पढ़ती है और कमांड, उदाहरण और दस्तावेज़ के लिंक के साथ जवाब देती है।
- **CHANGELOG की हर नई सुविधा** — [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) के सभी 422 वर्ज़न (v0.2.21 – v2.1.302), बग फ़िक्स छोड़कर, 14 विषयों में सार के रूप में, साथ में जानने लायक 30 सुविधाएँ और सबसे नई जोड़ी गई सुविधाएँ।
- **`/claude-skill update`** — नया CHANGELOG लाती है, वे वर्ज़न ढूँढती है जो स्किल में अभी नहीं हैं, उनकी सुविधाएँ नोट्स, चीटशीट और पाठों में जोड़ती है, और दर्ज करती है कि कहाँ तक कवर हो चुका है।
- **सेटअप डॉक्टर** — आपका वर्ज़न, सेटिंग फ़ाइलें (यूज़र, प्रोजेक्ट, लोकल), CLAUDE.md की लंबाई, rules, auto memory, स्किल, subagent, प्लगइन और MCP सर्वर देखती है और सुधार सुझाती है।
- **चीटशीट, टिप्स और बनाने की गाइड** — कमांड, शॉर्टकट, CLI फ़्लैग और फ़ाइलों की जगहें एक ही पेज पर; काम आने वाली आदतें; स्किल, subagent, hook, MCP सर्वर, प्लगइन और मार्केटप्लेस कैसे बनाएँ।

### इंस्टॉल करना

ऊपर दिए [इंस्टॉल](#इंस्टॉल--ग्लोबल-यूज़र-या-प्रोजेक्ट-के-हिसाब-से) वाले हिस्से की तरह। प्लगइन का नाम **`cc-skill`** है (Claude Code ने `claude-` से शुरू होने वाले प्लगइन नाम Anthropic के अपने प्लगइन के लिए आरक्षित रखे हैं)। स्किल का नाम `claude-skill` ही रहता है, इसलिए आप इसे `/claude-skill` से बुलाते हैं।

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # ग्लोबल — हर प्रोजेक्ट
claude plugin install cc-skill@sonub-skills --scope project    # यह प्रोजेक्ट, टीम के साथ साझा
```

Python 3.8+ और इंटरनेट चाहिए (यह आधिकारिक दस्तावेज़ और CHANGELOG पढ़ती है)।

### इस्तेमाल

| आप कहते हैं | यह करती है |
|------|------|
| `/claude-skill` · "चलो Claude Code पढ़ते हैं" | पाठ और आपकी प्रगति दिखाती है, अगला पाठ शुरू करती है |
| `/claude-skill lesson 5` · "अगला पाठ" | पाठ सिखाती है, आपके प्रोजेक्ट में अभ्यास करवाती है, जाँच के सवाल पूछती है, प्रगति सहेजती है |
| `/claude-skill quiz` | जो पढ़ा है उसमें से पाँच सवाल, एक-एक करके, अंकों के साथ |
| "हर बदलाव के बाद hook से prettier कैसे चलाऊँ?" | आधिकारिक दस्तावेज़ पढ़कर सेटिंग के उदाहरण और लिंक के साथ जवाब देती है |
| `/claude-skill new` · "नया क्या है?" | सबसे काम की हाल की सुविधाएँ पहले, हर एक को आज़माने के तरीके के साथ |
| `/claude-skill doctor` · "मेरा सेटअप जाँचो" | आपका सेटअप देखती है और सुधार सुझाती है (कुछ भी बदलने से पहले पूछती है) |
| `/claude-skill tips` · `cheatsheet` · `academy` | काम आने वाली आदतें · कमांड और शॉर्टकट · Academy का विश्लेषण |
| `/claude-skill build skill` · "मेरे लिए एक hook बनाओ" | सही तरीका चुनती है और आपके प्रोजेक्ट में आपके साथ मिलकर बनाती है |
| `/claude-skill update` | नए CHANGELOG से स्किल के सुविधा नोट्स ताज़ा करती है |

प्लगइन के रूप में इंस्टॉल हो तो `/cc-skill:claude-skill …` भी चलता है। Codex: `$claude-skill …`।

### `/claude-skill update` कैसे काम करता है

1. `scripts/cc.py update-check` नोट्स जिस वर्ज़न तक कवर करते हैं (`references/changelog-features.md` में `covered-through` का निशान) उसकी तुलना CHANGELOG के सबसे नए वर्ज़न से करता है।
2. इंस्टॉल की गई प्लगइन कॉपी पर यह पहले `claude plugin update cc-skill@sonub-skills` चलाकर प्रकाशित नोट्स लाता है। स्किल का सोर्स (git checkout) बदलना हो तो `--source <फ़ोल्डर>` दें। सोर्स न हो तो यह `~/.config/claude-skill/changelog-local.md` में लिखता है, जो प्लगइन अपडेट के बाद भी बचा रहता है।
3. `cc.py changelog --since <कवर-हुआ-वर्ज़न>` नए वर्ज़न की चीज़ें दिखाता है (फ़िक्स छिपे रहते हैं); एजेंट नई सुविधाओं को उनके विषयों में जोड़ता है, "सबसे नई जोड़ी गई सुविधाएँ" दोबारा लिखता है, नए कमांड और शॉर्टकट चीटशीट में डालता है और जो पाठ अब गलत हो गए हैं उन्हें ठीक करता है।
4. `cc.py mark-covered <सबसे-नया-वर्ज़न>` निशान आगे बढ़ाता है; git checkout में यह वर्ज़न बढ़ाकर commit करता है (push सिर्फ़ तब, जब आप कहें)।
5. यह बताता है कि कौन-सा दायरा कवर हुआ और आज़माने लायक 3–7 नई सुविधाएँ, हर एक को आज़माने के तरीके के साथ।

### टूल — `scripts/cc.py`

सिर्फ़ Python की स्टैंडर्ड लाइब्रेरी।

```bash
python3 scripts/cc.py doctor                 # आपका Claude Code सेटअप जाँचे + सलाह
python3 scripts/cc.py docs hooks             # आधिकारिक दस्तावेज़ों में खोजे (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # किसी पेज का एक हिस्सा पढ़े
python3 scripts/cc.py changelog --count 5    # सबसे नए 5 वर्ज़न (फ़िक्स छिपे)
python3 scripts/cc.py changelog --grep worktree --count 400   # किसी सुविधा को नाम से ढूँढे
python3 scripts/cc.py update-check           # कवर हुए वर्ज़न बनाम सबसे नया वर्ज़न
python3 scripts/cc.py lessons                # पाठ और प्रगति
```

## popup — हर कठिन शब्द वहीं समझाएँ जहाँ पाठक उससे मिलता है

पाठक एक अनजान शब्द — "token", "endpoint", "idempotent" — पर अटक जाता है और पूरे अनुच्छेद का सिरा खो देता है। यह स्किल उस शब्द पर एक छोटा कार्ड लगा देती है: उस पर माउस ले जाएँ (फ़ोन पर टैप करें, कीबोर्ड से फ़ोकस करें) और वह शब्द को परत-दर-परत समझाता है — एक पंक्ति में अर्थ, छोटी व्याख्या, रोज़मर्रा की तुलना, उदाहरण की पंक्तियाँ, सोर्स कोड का टुकड़ा, जुड़े हुए शब्द, और आपके अपने प्रोजेक्ट के किसी दूसरे पेज का **“और जानें” लिंक**। यह किसी भी प्रोजेक्ट में चलती है: स्टैटिक साइट, दस्तावेज़ जनरेटर, सिंगल-पेज ऐप, सर्वर पर बनने वाली साइट, और GitHub पर पढ़ी जाने वाली सादी Markdown भी।

### इसमें क्या-क्या शामिल है

- **एक शब्दकोश, एक जगह** — हर व्याख्या एक JSON फ़ाइल (या हर भाषा की एक फ़ाइल) में रहती है; पेज सिर्फ़ शब्द के id की ओर इशारा करते हैं, इसलिए एक ही शब्द हर जगह एक जैसा पढ़ा जाता है।
- **सीधे जोड़ लेने वाला किट** — `popup.js` और `popup.css`, न कोई फ़्रेमवर्क, न बिल्ड स्टेप। `main`/`article` के अंदर का सादा पाठ अपने-आप लपेट दिया जाता है (हर पेज पर पहली बार इस्तेमाल होने पर); वाक्यांशों, वाक्यों, "?" बटनों और होवर पर पूर्वावलोकन दिखाने वाले लिंकों के लिए साफ़ मार्कअप भी है। हर पेज पर एक कार्ड, क्लिक करने पर टिका रहता है, जुड़े शब्दों के चिप उसी जगह कार्ड बदल देते हैं, Esc से फ़ोकस वापस आता है, फ़ोन पर नीचे से खुलने वाली शीट, दाएँ-से-बाएँ लिखी जाने वाली भाषाएँ, डार्क मोड, और CSS वेरिएबल से थीम।
- **समझदार मिलान** — सबसे लंबी वर्तनी पहले, हर लिपि के हिसाब से शब्द की सीमाएँ (लैटिन, सिरिलिक, कोरियाई परसर्ग, अरबी उपसर्ग, CJK), ऐसे शब्द जो सिर्फ़ एक खंड में लागू होते हैं (`scope`), और अक्षर-भेद वाले कमांड नाम।
- **लिखने के नियम** — प्रोजेक्ट जितनी भाषाओं में उपलब्ध है, हर भाषा में ऐसा कार्ड कैसे लिखें जिसे नया सीखने वाला एक बार पढ़कर समझ ले: हर फ़ील्ड किसलिए है, लंबाई, एक तुलना, जाँचे हुए तथ्य, और जहाँ असली उदाहरण हों वहाँ उदाहरण।
- **टूल** — `popup.py check` शब्दकोश को जाँचता है (हर लोकेल, सभी भाषाओं में एक-जैसा उदाहरण कोड, जुड़े हुए id, "और जानें" के लक्ष्य मौजूद हैं या नहीं, वर्तनी की टक्कर); `audit` दिखाता है कि कोई दस्तावेज़ पहले से कौन-से शब्द इस्तेमाल करता है और किन कठिन शब्दों की अभी कोई प्रविष्टि नहीं है; `add` नए शब्द सुरक्षित तरीके से मिला देता है; `md` + `link` शब्दकोश से `GLOSSARY.md` बनाते हैं और आपकी Markdown फ़ाइलों में हर शब्द के पहले इस्तेमाल पर लिंक लगाते हैं, जिसके होवर टाइटल में अर्थ होता है।
- **SONUB** — SONUB रिपॉज़िटरी के अंदर यह दूसरा सिस्टम जोड़ने के बजाय SONUB के अपने Laravel शब्दकोश (17 भाषाएँ, AI ट्यूटर की आवाज़) पर बनती है।

### इंस्टॉल करना

ऊपर दिए [इंस्टॉल](#इंस्टॉल--ग्लोबल-यूज़र-या-प्रोजेक्ट-के-हिसाब-से) वाले हिस्से की तरह, प्लगइन का नाम **`popup`** लेकर।

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # ग्लोबल — हर प्रोजेक्ट
claude plugin install popup@sonub-skills --scope project    # यह प्रोजेक्ट, टीम के साथ साझा
```

टूल के लिए Python 3.8+ चाहिए। किट किसी भी आधुनिक ब्राउज़र में चलता है।

### इस्तेमाल

| आप कहते हैं | यह करती है |
|------|------|
| `/popup docs/getting-started.md` · "इस पेज में शब्द-पॉपअप जोड़ दो" | कठिन शब्द ढूँढती है, उनकी प्रविष्टियाँ लिखती है, किट जोड़ती है, और ब्राउज़र में जाँचती है |
| `/popup token, sampling, temperature` | ये तीन प्रविष्टियाँ लिखती है और जहाँ ये शब्द इस्तेमाल हुए हैं वहाँ जोड़ देती है |
| "मेन्यू के आइटम होवर करने पर समझाओ" | लिंकों पर होवर पूर्वावलोकन जोड़ती है, फ़ोन और कीबोर्ड के लिए "?" बटन के साथ |
| "README को शुरुआती लोगों के लिए आसान बनाओ" | `GLOSSARY.md` बनाती है और हर शब्द के पहले इस्तेमाल पर लिंक लगाती है, अर्थ होवर करने पर दिखता है |
| "शब्दकोश का जापानी में अनुवाद करो" | हर प्रविष्टि में `ja` जोड़ती है और जाँचती है कि कुछ छूटा नहीं |

प्लगइन के रूप में इंस्टॉल हो तो `/popup:popup …` भी चलता है। Codex: `$popup …`।

### टूल — `scripts/popup.py`

सिर्फ़ Python की स्टैंडर्ड लाइब्रेरी।

```bash
python3 scripts/popup.py init popup --locales en,ko   # popup.js/css कॉपी करे, glossary.json शुरू करे, .popup.json लिखे
python3 scripts/popup.py audit docs                   # हर फ़ाइल में इस्तेमाल हुए शब्द + जिन कठिन शब्दों की प्रविष्टि नहीं
python3 scripts/popup.py add new-terms.json --dry-run # नए शब्द मिलाए (जाँच के साथ, चुपचाप कुछ नहीं बदलता)
python3 scripts/popup.py check                        # शब्दकोश की जाँच करे
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # GitHub पर Markdown के लिए
```

फिर अपने लेआउट में दो टैग जोड़ें:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## रिपॉज़िटरी की बनावट

```
.claude-plugin/marketplace.json   ← मार्केटप्लेस (Claude Code)
skills/gp/
├─ SKILL.md                       ← स्किल: कब और कैसे इस्तेमाल करें
├─ .claude-plugin/plugin.json     ← प्लगइन की जानकारी (सिर्फ़ Claude Code; दूसरे टूल इसे अनदेखा करते हैं)
├─ scripts/gp.py                  ← टूल
└─ references/                    ← ज़रूरत पड़ने पर पढ़ें
   ├─ github-projects.md          ← अवधारणाएँ, खाता, लॉगिन, पहला बोर्ड
   └─ commands.md                 ← हर कमांड + सीधे gh / GraphQL के नुस्ख़े
skills/claude-skill/
├─ SKILL.md                       ← स्किल: कब और कैसे इस्तेमाल करें
├─ .claude-plugin/plugin.json     ← प्लगइन की जानकारी (प्लगइन का नाम cc-skill)
├─ scripts/cc.py                  ← सीखने का टूल: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 पाठ · Academy का विश्लेषण · CHANGELOG की सुविधाएँ · चीटशीट · बनाने की गाइड · टिप्स · क्विज़
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← स्किल: कब और कैसे इस्तेमाल करें
├─ .claude-plugin/plugin.json     ← प्लगइन की जानकारी
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← सिर्फ़ SONUB के टूल (Laravel शब्दकोश)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

स्किल कैसे काम करती हैं, यह SONUB AI कोर्स के **Agent Skills** अध्याय में सीखें: https://sonub.com/hi/learn/ai#agent-skill

लाइसेंस: [MIT](LICENSE)
