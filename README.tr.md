# sonub-skills — SONUB'dan Agent Skills

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · **Türkçe** · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Bu depo bir **beceri pazaryeridir (skill marketplace)**. Her beceri standart bir [Agent Skill](https://agentskills.io)'dir — içinde `SKILL.md` bulunan bir klasör — bu yüzden Claude Code, Codex, Gemini CLI, GitHub Copilot CLI ve Agent Skills okuyabilen diğer tüm ajanlarda çalışır. Claude Code bunu ayrıca bu pazaryerinden (`sonub-skills`) eklenti olarak kurabilir; böylece güncellemek tek komutla olur.

| Beceri | Ne yapar |
|------|------|
| [`gp`](skills/gp) | Tüm işlerinizi git ve `gh` CLI ile **GitHub Projects** üzerinde yönetir |
| [`claude-skill`](skills/claude-skill) | **Claude Code'u öğrenin ve daha iyi kullanın** — testli 14 ders, resmî belgelerle doğrulanan yanıtlar, kurulum denetleyicisi (doctor), CHANGELOG'daki her yeni özelliğin özeti ve yenilerini eklemek için `/claude-skill update` (eklenti adı `cc-skill`) |
| [`popup`](skills/popup) | **Terimleri fare üzerine gelince açılan popup'larla açıklayın** — herhangi bir projenin sayfalarında ve belgelerinde anlam, sade anlatım, örnekler, kaynak kod, ilgili terimler ve kendi sayfalarınıza giden "daha fazla bilgi" bağlantıları, hepsi tek bir sözlük JSON'undan |

## Kurulum — global (kullanıcı) veya proje başına

Her beceri aynı şekilde kurulur. `<eklenti>` yerine tablodaki eklenti adını (`gp`, `cc-skill`, `popup`) yazın.

**1. adım — pazaryerini ekleyin (her bilgisayarda bir kez)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**2. adım — istediğiniz yere kurun**

| Kapsam | Komut | Kim, nerede kullanır | Nereye yazılır |
|------|------|------|------|
| **Global (kullanıcı)** — varsayılan | `claude plugin install <eklenti>@sonub-skills` | siz, bu bilgisayardaki tüm projelerde | `~/.claude/settings.json` |
| **Proje (ekiple paylaşılır)** | proje klasöründe: `claude plugin install <eklenti>@sonub-skills --scope project` | bu depoda çalışan herkes | `.claude/settings.json` (commit edin) |
| **Yerel (yalnızca siz, yalnızca bu proje)** | proje klasöründe: `claude plugin install <eklenti>@sonub-skills --scope local` | siz, yalnızca bu depoda | `.claude/settings.local.json` |

- Sohbette `/plugin install <eklenti>@sonub-skills` kapsamı seçeceğiniz bir ekran açar. Terminalden kurduysanız açık sohbetlerde `/reload-plugins` çalıştırın.
- Kontrol: `claude plugin list` (kapsamı da gösterir). Güncelleme: `claude plugin marketplace update sonub-skills && claude plugin update <eklenti>@sonub-skills`. Kaldırma: `claude plugin uninstall <eklenti>@sonub-skills`.
- Aynı eklenti birden fazla kapsamda ayarlıysa yerel projeden, proje de globalden önce gelir.

**Ekip arkadaşlarınız otomatik alsın** — bunu deponun `.claude/settings.json` dosyasına ekleyip commit edin. Bir ekip arkadaşınız klasöre güvendikten (trust) sonra Claude Code pazaryerini ekler ve eklentileri kurar.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**Eklentisiz — klasörü kopyalayın**, ajanınızın beceri klasörüne (`<beceri>` = `gp`, `claude-skill` veya `popup`).

| Araç | Global (kullanıcı) | Proje |
|------|------|------|
| Claude Code | `~/.claude/skills/<beceri>` | `<proje>/.claude/skills/<beceri>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<beceri>` | `<proje>/.agents/skills/<beceri>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # yalnızca bu proje: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**En kolayı** — ajanınıza *"thruthesky/sonub-skills'teki cc-skill eklentisini global olarak kur"* (ya da *"yalnızca bu proje için"*) deyin; yukarıdaki komutları sizin yerinize çalıştırır.

---

## gp — tüm işleriniz bir GitHub Project panosunda

Yapay zekâ ajanınızla sade bir dille konuşursunuz — *"bir issue aç: iPhone'da giriş düğmesi hiçbir şey yapmıyor, bu ekran görüntüsünü ekle"*, *"Done'a taşı"*, *"bir Review sütunu ekle"*, *"üzerimde hangi işler var?"* — ajan da bunu `gh` ile GitHub Project panonuzda yapar, ardından sonucu tekrar okuyup doğrular.

### Neleri kapsar

- **GitHub Projects'in açıklaması** — depo (repository), issue, proje (pano), öğe (item), taslak (draft), alan (field), Status = sütunlar, görünüm (view), iş akışı (workflow). Ajanınız bunu size kendi dilinizde öğretebilir.
- **Hesap ve giriş** — yeni bir GitHub hesabı açma adımları, `gh` kurulumu, `gh auth login`, `project` ve `repo` yetki kapsamları (scope).
- **Panolar** — oluşturma, yeniden adlandırma, açıklama yazma, herkese açık/gizli yapma, kapatma/yeniden açma, silme, depo bağlama, panolarınızı listeleme, varsayılan pano seçme.
- **Sütunlar (kanban)** — ekleme, yeniden adlandırma (kartlar yerinde kalır), sıralama, renk verme, silme (önce kartları başka yere taşıyarak).
- **Alanlar ve görünümler** — özel alanlar (metin, sayı, tarih, tek seçim), filtreli pano/tablo/yol haritası görünümleri.
- **Issue'lar** — oluşturma (bir sütuna, etiketler, kilometre taşı, üst issue ve özel alanlarla), düzenleme, sütunlar arasında taşıma, kapatma (Done'a taşınır), yeniden açma, yorum yazma, panodan çıkarma, arşivleme, silme.
- **Görseller** — issue gövdesine veya yoruma ekran görüntüsü ya da video ekleme.
- **TODO** — issue içinde `- [ ]` kontrol listesi: ekleme, işaretleme, işareti kaldırma, silme; ilerleme listelerde gösterilir. Hızlı fikirler için taslak öğeler, sonradan issue'ya dönüştürülür.
- **Kişiler** — atama ve atamayı kaldırma, kimin neyle ilgilendiğini görme, depoya ortak çalışan davet etme ve pano rolleri verme.

### Gereksinimler

- Bir GitHub hesabı (ücretsiz). Henüz hesabınız yok mu? https://github.com/signup adresinden kaydolun — e-posta kodu, bulmaca, Free plan (yaklaşık üç dakika).
- [`gh`](https://cli.github.com) — GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`), `project` ve `repo` kapsamlarıyla giriş yapılmış olmalı.
- Python 3.8 veya daha yenisi (yalnızca standart kütüphane).

### Kurulum

**En kolayı — ajanınıza yaptırın.** Bu kutuyu kopyalayıp Claude Code, Codex, Gemini CLI veya Copilot CLI'ye yapıştırın ve gönderin:

```text
thruthesky/sonub-skills deposundaki gp becerisini kur.
Beceri yolu: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — standart bir Agent Skill (içinde SKILL.md bulunan bir klasör).

1. Claude Code isen, bunu eklenti olarak kur; şu komutları sırayla çalıştır ("already added" hatalarını yok say):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - "Yalnızca bu proje" dediysem, son satırı proje klasöründe --scope project ekleyerek çalıştır.
   - Zaten kuruluysa bunun yerine şunu çalıştır: claude plugin update gp@sonub-skills
2. Başka bir ajansan: beceri klasörü DIR içine koy — tüm projeler: ~/.agents/skills, yalnızca bu proje: <proje>/.agents/skills.
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Çalıştır: python3 <beceri klasörü>/scripts/gp.py doctor — ve bildirdiği sorunları düzelt (gh kur, gh auth login, gh auth refresh -s project,repo).
4. Bana kısaca neyin kurulduğunu, doctor sonucunu ve artık "GitHub projelerimi göster" gibi şeyler söyleyebileceğimi bildir.
```

**Claude Code — terminalde iki satır** (her sürümde çalışır):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

Sohbet penceresinde önce `/plugin marketplace add thruthesky/sonub-skills`, ardından `/plugin install gp@sonub-skills` kullanın. Yeni sürümler tek satırı da kabul eder: `claude plugin install gp --marketplace thruthesky/sonub-skills`. Terminalden kurduktan sonra açık bir sohbette `/reload-plugins` çalıştırın (ya da yeniden başlatın).

**Herhangi bir ajan — klasörü kopyalayın**, ajanın beceri klasörüne:

| Araç | Kullanıcı beceri klasörü | Proje beceri klasörü |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### Global kurulum ve yerel (proje) kurulum

| | Global — tüm projeler | Yerel — yalnızca bu proje |
|------|------|------|
| Claude Code eklentisi | `claude plugin install gp@sonub-skills` | proje klasöründe: `claude plugin install gp@sonub-skills --scope project` (`.claude/settings.json` dosyasına yazılır, ekiple paylaşılır · yalnızca siz: `--scope local`) |
| Claude Code klasör kopyası | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Kullanılacak pano | `/gp init <pano URL'si> --global` → `~/.config/gp/config.json` | `/gp init <pano URL'si>` → `<proje>/.gp.json` |

Becerinin nereye kurulduğu ile hangi panoyu kullandığı ayrı ayrı seçilir. Genellikle beceriyi bir kez global olarak kurar, her projeye panosunu `/gp init <pano URL'si>` ile verirsiniz.

### İlk çalıştırma

Ajanınıza *"gp'yi kur ve ayarla"* deyin (Claude Code: `/gp:gp`, Codex: `$gp`). Şunları çalıştırır:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · giriş yapıldı ✓ · kapsamlar ✓ · varsayılan pano
gh auth login                                   # yalnızca giriş yapılmamışsa — tek kullanımlık kodu tarayıcıya yazın
gh auth refresh -s project,repo                 # yalnızca bir kapsam eksikse
python3 scripts/gp.py projects                  # panolarınız
python3 scripts/gp.py init <pano URL'si>        # bu projenin panosu (.gp.json) · tüm projeler: --global … ya da yeni bir tane oluşturun:
python3 scripts/gp.py project-create --title "İşlerim" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Panoyu seçin — `/gp init`

Her geliştirme projesinin kendi GitHub Project panosu olabilir. Proje klasöründe ajanınıza panonun adresini verin; o projenin işleri o panoya gider.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Claude Code eklentisi olarak kurulduysa: `/gp:gp init …`; Codex: `$gp init …`. "https://… adresini bu projenin panosu olarak kullan" demek de işe yarar.

- **Yerel (varsayılan)** — bir git deposunun içinde `<depo kökü>/.gp.json` dosyasına kaydedilir ve yalnızca o projede (ve alt klasörlerinde) kullanılır. Gizli bir bilgi içermez: ekip arkadaşlarınız aynı panoyu kullansın diye commit edin ya da yalnızca size kalsın diye `.gitignore` dosyasına ekleyin.
- **Global** — `/gp init <URL> --global` (ya da "bunu tüm projeler için varsayılan pano yap") → `~/.config/gp/config.json`; `.gp.json` olmayan her klasörde kullanılır.
- Panonun herhangi bir sayfası olur (`/views/2`, kullanıcı panoları `/users/…`, kuruluş panoları `/orgs/…`). Kaydetmeden önce panonun var olduğu ve okunabildiği kontrol edilir.
- Tek başına `/gp init`, kullanılan panoyu ve ayar dosyasını gösterir. Kaldırma: `gp.py init --unset` (global: `--unset --global`).
- Hangi pano kullanılır: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → projenin `.gp.json` dosyası → global ayar.

### Kullanım — sadece söyleyin

| Siz dersiniz | Ajan çalıştırır |
|------|------|
| "Bir issue aç: iPhone'da giriş düğmesi çalışmıyor. Adımlar: tekrarla, düzelt, test. shot.png ekle" | `create --repo app --title "…" --todo tekrarla --todo düzelt --todo test --image shot.png` → Todo sütunu |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → bu projenin panosu olarak kaydedilir (`.gp.json`) |
| "Devam ediyor yap" · "#12'yi Review'a taşı" | `move app#12 doing` · `move app#12 review` |
| "Bitti!" | `close app#12` — issue'yu kapatır ve Done'a taşır |
| "TODO'suna 'belgeleri güncelle' ekle" · "ilkini işaretle" | `todo app#12 add "belgeleri güncelle"` · `todo app#12 done 1` |
| "En başa Urgent sütunu ekle" · "Review'un adını QA yap" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "alice'e ver" · "bob'u depoya davet et" | `assign app#12 alice` · `invite bob --repo app` (önce sorar) |
| "Üzerimde hangi işler var?" | `list --assignee @me --state open`, ardından sıradaki bir işi önerir |
| "Panoya bir fikir not et: karanlık mod" | `create --draft --title "karanlık mod"` |
| "Bir Priority alanı ekle" | `field-add Priority --type single_select --options "High,Medium,Low"` |

Tüm komutlar: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### Nasıl çalışır

- **Yalnızca `gh` ve Python standart kütüphanesi.** gh bir argüman listesiyle çağrılır (shell kullanılmaz), başlıklar ve gövdeler stdin üzerinden gider — tırnaklar, emojiler ve satır sonları asla bozulmaz.
- **ID'ler adla bulunur.** Alan, sütun ve seçenek ID'leri her çalıştırmada yeniden aranır; bu yüzden web sitesinde sütun adlarını değiştirseniz de hiçbir şey bozulmaz. Bir sütunu yeniden adlandırmak kartlarını korur.
- **Her değişiklik geri okunur.** Bir değişiklikten sonra betik, GitHub'daki gerçek durumu (durum, sütun, atananlar, etiketler) gösteren bir `check:` satırı yazdırır. Ajan raporunu bu satıra göre verir.
- **Görseller** gh'nin `--attach` seçeneğini (GitHub user-attachments) kullanır. Daha eski bir gh ile görseller, issue'nun deposundaki `gp-assets` dalına commit edilir ve bağlantısı verilir.
- **Varsayılan olarak güvenli.** Değişiklik yapan her komutun `--dry-run` seçeneği vardır. Bir issue'yu, panoyu, alanı ya da kart içeren bir sütunu silmek `--yes` gerektirir ve beceri ajana önce size sormasını söyler. Davetler (gerçek bir kişiye e-posta gönderir) için de önce sorulur.
- **Pano ayarı** proje başına `.gp.json` dosyasına (yerel), tüm projeler için `~/.config/gp/config.json` dosyasına (global) kaydedilir. `--owner/--number` ya da `GP_OWNER`/`GP_PROJECT` ikisinden de önce gelir.

Not: bir issue oluşturduktan hemen sonra GitHub'ın proje listesinde görünmesi birkaç saniye sürebilir. `check:` satırı issue'yu doğrudan okur ve her zaman günceldir.

### Güncelleme ve kaldırma

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Diğer ajanlar: güncellemek için `curl … | tar` satırını yeniden çalıştırın; kaldırmak için `gp` klasörünü silin.

## claude-skill — Claude Code'u öğrenin ve daha iyi kullanın

Claude Code neredeyse her gün yeni bir sürüm çıkarıyor (şu ana kadar 400'den fazla). Bu beceri onu sırayla öğretir, soruları hafızadan değil **güncel resmî belgelerden** yanıtlar, kurulumunuzu denetler ve CHANGELOG'daki her yeni özelliğin özetini tutar. Tek bir `/claude-skill update` yeni çıkan özellikleri beceriye ekler.

### Neleri kapsar

- **14 derslik bir çalışma yolu** — kurulum ve ilk istemlerden keşfet → planla → kodla → commit akışına, bağlam (context) yönetimine, CLAUDE.md ve belleğe (memory), izin modlarına, kontrol noktalarına (checkpoint), becerilere, alt ajanlara (subagent), hook'lara, MCP'ye, eklentilere ve pazaryerlerine, headless çalıştırmaya ve GitHub Actions'a, doğrulamayla yürüyen uzun ve gözetimsiz işlere kadar. Her derste **kendi projenizde bir alıştırma** ve kontrol soruları vardır; ilerlemeniz kaydedilir.
- **Claude Academy analizi** — [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat)'deki 64 Claude eğitimi ile Claude Code eğitimleri ve kursları (Claude Code 101, Claude Code in action, Agent Skills, Subagents); sohbette öğrendikleriniz (Projects, bellek, bağlayıcılar, beceriler, Research, model ve effort seçimi…) Claude Code'da nasıl yapıldığıyla eşleştirilir.
- **Belgelerle doğrulanan yanıtlar** — "hook'lar nasıl çalışır?" ya da "eklenti kapsamı nedir?" gibi sorularda code.claude.com'da arar, okur ve komut, örnek ve belge bağlantısıyla yanıtlar.
- **CHANGELOG'daki her yeni özellik** — [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md)'nin 422 sürümünün tamamı (v0.2.21 – v2.1.302), hata düzeltmeleri hariç, 14 konuda özetlenmiş; ayrıca bilmeye değer 30 özellik ve en son eklenenler.
- **`/claude-skill update`** — en son CHANGELOG'u indirir, becerinin henüz kapsamadığı sürümleri bulur, bu sürümlerin özelliklerini notlara, kopya kâğıdına ve derslere ekler ve nereye kadar kapsadığını kaydeder.
- **Kurulum denetleyicisi (doctor)** — sürümünüze, ayar dosyalarınıza (kullanıcı, proje, yerel), CLAUDE.md uzunluğuna, kurallara (rules), otomatik belleğe (auto memory), becerilere, alt ajanlara, eklentilere ve MCP sunucularına bakar ve düzeltmeler önerir.
- **Kopya kâğıdı, ipuçları ve yapım kılavuzları** — komutlar, kısayollar, CLI bayrakları ve dosya konumları tek sayfada; işe yarayan alışkanlıklar; beceri, alt ajan, hook, MCP sunucusu, eklenti ve pazaryeri nasıl yapılır.

### Kurulum

Yukarıdaki [Kurulum](#kurulum--global-kullanıcı-veya-proje-başına) bölümündeki gibi. Eklentinin adı **`cc-skill`**'dir (Claude Code, `claude-` ile başlayan eklenti adlarını Anthropic'in kendi eklentilerine ayırır). Becerinin adı `claude-skill` olarak kalır, bu yüzden onu `/claude-skill` ile çağırırsınız.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # global — tüm projeler
claude plugin install cc-skill@sonub-skills --scope project    # bu proje, ekiple paylaşılır
```

Python 3.8+ ve internet erişimi gerekir (resmî belgeleri ve CHANGELOG'u okur).

### Kullanım

| Siz dersiniz | O yapar |
|------|------|
| `/claude-skill` · "Claude Code çalışalım" | Dersleri ve ilerlemenizi gösterir, sıradakini başlatır |
| `/claude-skill lesson 5` · "sonraki ders" | Dersi anlatır, alıştırmayı projenizde yaptırır, kontrol soruları sorar, ilerlemeyi kaydeder |
| `/claude-skill quiz` | Çalıştıklarınızdan beş soru, birer birer, puanlı |
| "Her düzenlemeden sonra prettier'ı bir hook ile nasıl çalıştırırım?" | Resmî belgeleri okur, ayar örneği ve bağlantıyla yanıtlar |
| `/claude-skill new` · "neler yeni?" | Önce en işe yarar son özellikler, her biri nasıl deneneceğiyle |
| `/claude-skill doctor` · "kurulumumu kontrol et" | Kurulumunuzu inceler ve düzeltmeler önerir (bir şey değiştirmeden önce sorar) |
| `/claude-skill tips` · `cheatsheet` · `academy` | İşe yarayan alışkanlıklar · komutlar ve kısayollar · Academy analizi |
| `/claude-skill build skill` · "bana bir hook yap" | Doğru mekanizmayı seçer ve projenizde sizinle birlikte kurar |
| `/claude-skill update` | Becerinin özellik notlarını en son CHANGELOG'dan yeniler |

Eklenti olarak kurulduysa `/cc-skill:claude-skill …` da çalışır. Codex: `$claude-skill …`.

### `/claude-skill update` nasıl çalışır

1. `scripts/cc.py update-check`, notların kapsadığı sürümü (`references/changelog-features.md` içindeki `covered-through` işareti) en son CHANGELOG sürümüyle karşılaştırır.
2. Kurulu bir eklenti kopyasında önce yayımlanmış notları almak için `claude plugin update cc-skill@sonub-skills` çalıştırır. Becerinin kaynağını (bir git checkout) düzenlemek için `--source <klasör>` verin. Kaynak yoksa, eklenti güncellemelerinden etkilenmeyen `~/.config/claude-skill/changelog-local.md` dosyasına yazar.
3. `cc.py changelog --since <kapsanan>` yeni sürümlerin maddelerini listeler (düzeltmeler gizli); ajan yeni özellikleri konularına ekler, "En son eklenenler" bölümünü yeniden yazar, yeni komut ve kısayolları kopya kâğıdına ekler ve artık yanlış olan dersleri düzeltir.
4. `cc.py mark-covered <en-son>` işareti ilerletir; bir git checkout'ta sürümü yükseltir ve commit eder (yalnızca siz isterseniz push eder).
5. Kapsanan aralığı ve denemeye değer 3–7 yeni özelliği, her birinin nasıl deneneceğiyle birlikte bildirir.

### Araç — `scripts/cc.py`

Yalnızca Python standart kütüphanesi.

```bash
python3 scripts/cc.py doctor                 # Claude Code kurulumunuzu denetler + öneriler
python3 scripts/cc.py docs hooks             # resmî belgelerde arar (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # bir sayfanın tek bölümünü okur
python3 scripts/cc.py changelog --count 5    # en son 5 sürüm (düzeltmeler gizli)
python3 scripts/cc.py changelog --grep worktree --count 400   # bir özelliği adıyla bulur
python3 scripts/cc.py update-check           # kapsanan sürümler ve en son sürüm
python3 scripts/cc.py lessons                # dersler ve ilerleme
```

## popup — her zor kelimeyi okurun onunla karşılaştığı yerde açıklayın

Okur tek bir bilinmeyen kelimede — "token", "endpoint", "idempotent" — takılır ve tüm paragrafın akışını kaybeder. Bu beceri o kelimenin üzerine küçük bir kart koyar: üzerine gelin (telefonda dokunun, klavyede odaklanın) ve kart terimi katman katman açıklar — tek satırlık anlam, kısa bir açıklama, gündelik bir benzetme, örnek satırlar, bir kaynak kod parçası, ilgili terimler ve **kendi projenizdeki başka bir sayfaya giden "daha fazla bilgi" bağlantısı**. Her projede çalışır: statik siteler, belge üreticileri, tek sayfalık uygulamalar (SPA), sunucu tarafında oluşturulan siteler ve GitHub'da okunan düz Markdown.

### Neleri kapsar

- **Tek sözlük, tek yer** — tüm açıklamalar tek bir JSON dosyasında (ya da dil başına bir dosyada) durur; sayfalar yalnızca terim id'lerine işaret eder, böylece aynı kelime her yerde aynı şekilde açıklanır.
- **Hazır bir takım** — `popup.js` ve `popup.css`, framework yok, build adımı yok. `main`/`article` içindeki düz metin otomatik sarılır (her sayfada ilk kullanım); ifadeler, cümleler, "?" düğmeleri ve üzerine gelince önizleme gösteren bağlantılar için açık işaretleme de vardır. Sayfa başına tek kart, tıklayınca sabitlenir, ilgili çipler yerinde değişir, Esc odağı geri verir, telefonda alt sayfa (bottom sheet) olarak açılır, sağdan sola yazılan diller, karanlık mod, CSS değişkenleriyle tema.
- **Akıllı eşleştirme** — önce en uzun yazım, yazı sistemine göre kelime sınırları (Latin, Kiril, Korece ekler, Arapça önekler, CJK), yalnızca tek bir bölümde geçerli olan terimler (`scope`), büyük/küçük harfe duyarlı komut adları.
- **Yazım kuralları** — bir acemi tek okumada anlasın diye kart nasıl yazılır, projenin yayımladığı her dilde: her alan ne işe yarar, uzunluklar, tek bir benzetme, doğrulanmış bilgiler, gerçek örnek varsa her zaman örnek.
- **Araç** — `popup.py check` sözlüğü doğrular (her locale, diller arasında aynı olan örnek kodlar, ilgili id'ler, "daha fazla bilgi" hedeflerinin var olması, yazım çakışmaları); `audit` bir belgenin hangi terimleri zaten kullandığını gösterir ve henüz girdisi olmayan jargonu bulur; `add` yeni terimleri güvenle birleştirir; `md` + `link` sözlüğü `GLOSSARY.md` dosyasına dönüştürür ve Markdown dosyalarınızdaki ilk kullanımı, anlamı üzerine gelince görünen başlık olarak, bağlar.
- **SONUB** — SONUB deposunun içinde ikinci bir sistem eklemek yerine SONUB'un kendi Laravel sözlüğü (17 dil, yapay zekâ öğretmenin sesi) üzerine kurulur.

### Kurulum

Yukarıdaki [Kurulum](#kurulum--global-kullanıcı-veya-proje-başına) bölümündeki gibi, eklenti adı **`popup`** olarak.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # global — tüm projeler
claude plugin install popup@sonub-skills --scope project    # bu proje, ekiple paylaşılır
```

Araç için Python 3.8+ gerekir. Popup takımı her modern tarayıcıda çalışır.

### Kullanım

| Siz dersiniz | O yapar |
|------|------|
| `/popup docs/getting-started.md` · "bu sayfaya sözlük popup'ları ekle" | Zor kelimeleri bulur, girdileri yazar, takımı sayfaya bağlar, tarayıcıda kontrol eder |
| `/popup token, sampling, temperature` | Bu üç girdiyi yazar ve kullanıldıkları yerlere ekler |
| "menü öğelerini üzerine gelince açıkla" | Bağlantılara üzerine gelince önizleme ekler; telefon ve klavye için "?" düğmeleri koyar |
| "README'yi yeni başlayanlara uygun yap" | `GLOSSARY.md` oluşturur ve her terimin ilk kullanımını, anlamı üzerine gelince görünecek şekilde bağlar |
| "sözlüğü Japoncaya çevir" | Her girdiye `ja` ekler ve eksik bir şey olmadığını kontrol eder |

Eklenti olarak kurulduysa `/popup:popup …` da çalışır. Codex: `$popup …`.

### Araç — `scripts/popup.py`

Yalnızca Python standart kütüphanesi.

```bash
python3 scripts/popup.py init popup --locales en,ko   # popup.js/css dosyalarını kopyalar, glossary.json başlatır, .popup.json yazar
python3 scripts/popup.py audit docs                   # dosya başına kullanılan terimler + girdisi olmayan jargon
python3 scripts/popup.py add new-terms.json --dry-run # yeni terimleri birleştirir (kontrol edilir, sessizce üzerine yazmaz)
python3 scripts/popup.py check                        # sözlüğü doğrular
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # GitHub'daki Markdown
```

Ardından layout'unuza iki etiket ekleyin:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## Depo yapısı

```
.claude-plugin/marketplace.json   ← pazaryeri (Claude Code)
skills/gp/
├─ SKILL.md                       ← beceri: ne zaman ve nasıl kullanılacağı
├─ .claude-plugin/plugin.json     ← eklenti bilgisi (yalnızca Claude Code; diğer araçlar yok sayar)
├─ scripts/gp.py                  ← araç
└─ references/                    ← gerektiğinde okunur
   ├─ github-projects.md          ← kavramlar, hesap, giriş, ilk pano
   └─ commands.md                 ← tüm komutlar + düz gh / GraphQL tarifleri
skills/claude-skill/
├─ SKILL.md                       ← beceri: ne zaman ve nasıl kullanılacağı
├─ .claude-plugin/plugin.json     ← eklenti bilgisi (eklenti adı cc-skill)
├─ scripts/cc.py                  ← çalışma aracı: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 ders · Academy analizi · CHANGELOG özellikleri · kopya kâğıdı · yapım kılavuzları · ipuçları · test
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← beceri: ne zaman ve nasıl kullanılacağı
├─ .claude-plugin/plugin.json     ← eklenti bilgisi
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← yalnızca SONUB'a özel araçlar (Laravel sözlüğü)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

Becerilerin nasıl çalıştığını SONUB yapay zekâ kursunun **Agent Skills** bölümünde öğrenin: https://sonub.com/tr/learn/ai#agent-skill

Lisans: [MIT](LICENSE)
