# sonub-skills — SONUB'dan Agent Skills

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · **Türkçe** · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Bu depo bir **beceri pazaryeridir (skill marketplace)**. Her beceri standart bir [Agent Skill](https://agentskills.io)'dir — içinde `SKILL.md` bulunan bir klasör — bu yüzden Claude Code, Codex, Gemini CLI, GitHub Copilot CLI ve Agent Skills okuyabilen diğer tüm ajanlarda çalışır. Claude Code bunu ayrıca bu pazaryerinden (`sonub-skills`) eklenti olarak kurabilir; böylece güncellemek tek komutla olur.

| Beceri | Ne yapar |
|------|------|
| [`gp`](skills/gp) | Tüm işlerinizi git ve `gh` CLI ile **GitHub Projects** üzerinde yönetir |

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
   - Zaten kuruluysa bunun yerine şunu çalıştır: claude plugin update gp@sonub-skills
2. Başka bir ajansan: kullanıcı beceri klasörün DIR içine koy (Codex, Gemini CLI, Copilot CLI: ~/.agents/skills).
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

### İlk çalıştırma

Ajanınıza *"gp'yi kur ve ayarla"* deyin (Claude Code: `/gp:gp`, Codex: `$gp`). Şunları çalıştırır:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · giriş yapıldı ✓ · kapsamlar ✓ · varsayılan pano
gh auth login                                   # yalnızca giriş yapılmamışsa — tek kullanımlık kodu tarayıcıya yazın
gh auth refresh -s project,repo                 # yalnızca bir kapsam eksikse
python3 scripts/gp.py projects                  # panolarınız
python3 scripts/gp.py use <owner> <number>      # birini seçin … ya da yeni bir tane oluşturun:
python3 scripts/gp.py project-create --title "İşlerim" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Kullanım — sadece söyleyin

| Siz dersiniz | Ajan çalıştırır |
|------|------|
| "Bir issue aç: iPhone'da giriş düğmesi çalışmıyor. Adımlar: tekrarla, düzelt, test. shot.png ekle" | `create --repo app --title "…" --todo tekrarla --todo düzelt --todo test --image shot.png` → Todo sütunu |
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
- **Varsayılan pano** `~/.config/gp/config.json` dosyasına kaydedilir; `--owner/--number` ya da `GP_OWNER`/`GP_PROJECT` ile geçersiz kılabilirsiniz.

Not: bir issue oluşturduktan hemen sonra GitHub'ın proje listesinde görünmesi birkaç saniye sürebilir. `check:` satırı issue'yu doğrudan okur ve her zaman günceldir.

### Güncelleme ve kaldırma

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Diğer ajanlar: güncellemek için `curl … | tar` satırını yeniden çalıştırın; kaldırmak için `gp` klasörünü silin.

### Depo yapısı

```
.claude-plugin/marketplace.json   ← pazaryeri (Claude Code)
skills/gp/
├─ SKILL.md                       ← beceri: ne zaman ve nasıl kullanılacağı
├─ .claude-plugin/plugin.json     ← eklenti bilgisi (yalnızca Claude Code; diğer araçlar yok sayar)
├─ scripts/gp.py                  ← araç
└─ references/                    ← gerektiğinde okunur
   ├─ github-projects.md          ← kavramlar, hesap, giriş, ilk pano
   └─ commands.md                 ← tüm komutlar + düz gh / GraphQL tarifleri
```

Becerilerin nasıl çalıştığını SONUB yapay zekâ kursunun **Agent Skills** bölümünde öğrenin: https://sonub.com/tr/learn/ai#agent-skill

Lisans: [MIT](LICENSE)
