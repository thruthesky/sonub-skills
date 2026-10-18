# sonub-skills — Agent Skills dari SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · **Bahasa Indonesia** · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Repositori ini adalah sebuah **marketplace skill**. Setiap skill adalah [Agent Skill](https://agentskills.io) standar — sebuah folder berisi `SKILL.md` — sehingga bisa dipakai di Claude Code, Codex, Gemini CLI, GitHub Copilot CLI, dan agen lain mana pun yang membaca Agent Skills. Claude Code juga bisa memasangnya sebagai plugin dari marketplace ini (`sonub-skills`), sehingga pembaruan cukup dengan satu perintah.

| Skill | Fungsinya |
|------|------|
| [`gp`](skills/gp) | Kelola semua pekerjaan Anda di **GitHub Projects** dengan git dan `gh` CLI |
| [`claude-skill`](skills/claude-skill) | **Belajar Claude Code dan makin mahir memakainya** — 14 pelajaran dengan kuis, jawaban yang dicek dengan dokumentasi resmi, pemeriksa pengaturan (doctor), ringkasan setiap fitur baru di CHANGELOG, dan `/claude-skill update` untuk menarik fitur terbaru (nama plugin `cc-skill`) |

## Instalasi — global (pengguna) atau per proyek

Semua skill dipasang dengan cara yang sama. Ganti `<plugin>` dengan nama plugin dari tabel (`gp`, `cc-skill`).

**Langkah 1 — tambahkan marketplace (sekali per komputer)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**Langkah 2 — pasang di tempat yang Anda inginkan**

| Cakupan | Perintah | Siapa yang mendapatkannya, di mana | Dicatat di |
|------|------|------|------|
| **Global (pengguna)** — default | `claude plugin install <plugin>@sonub-skills` | Anda, di semua proyek di komputer ini | `~/.claude/settings.json` |
| **Proyek (dipakai bersama tim)** | di folder proyek: `claude plugin install <plugin>@sonub-skills --scope project` | semua orang yang bekerja di repositori ini | `.claude/settings.json` (commit file ini) |
| **Lokal (hanya Anda, hanya proyek ini)** | di folder proyek: `claude plugin install <plugin>@sonub-skills --scope local` | Anda, hanya di repositori ini | `.claude/settings.local.json` |

- Di dalam chat, `/plugin install <plugin>@sonub-skills` membuka layar untuk memilih cakupan. Jika Anda memasang dari terminal, jalankan `/reload-plugins` di chat yang sedang terbuka.
- Cek: `claude plugin list` (menampilkan cakupannya). Perbarui: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`. Hapus: `claude plugin uninstall <plugin>@sonub-skills`.
- Jika plugin yang sama diatur di beberapa cakupan, lokal mengalahkan proyek, dan proyek mengalahkan global.

**Agar rekan tim mendapatkannya otomatis** — commit ini ke `.claude/settings.json` di repositori. Setelah rekan tim memercayai (trust) folder tersebut, Claude Code akan menambahkan marketplace dan memasang plugin-pluginnya.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true }
}
```

**Tanpa plugin — salin foldernya** ke folder skill milik agen Anda (`<skill>` = `gp` atau `claude-skill`).

| Alat | Global (pengguna) | Proyek |
|------|------|------|
| Claude Code | `~/.claude/skills/<skill>` | `<proyek>/.claude/skills/<skill>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<skill>` | `<proyek>/.agents/skills/<skill>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # hanya proyek ini: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**Paling mudah** — katakan kepada agen Anda *"pasang plugin cc-skill dari thruthesky/sonub-skills secara global"* (atau *"hanya untuk proyek ini"*), dan agen akan menjalankan perintah di atas untuk Anda.

---

## gp — semua pekerjaan Anda di papan GitHub Project

Anda cukup berbicara kepada agen AI dengan kata-kata biasa — *"buat issue: tombol login tidak merespons di iPhone, lampirkan tangkapan layar ini"*, *"pindahkan ke Done"*, *"tambahkan kolom Review"*, *"apa saja tugas saya?"* — lalu agen mengerjakannya di papan GitHub Project Anda dengan `gh`, kemudian membaca ulang hasilnya untuk memastikan.

### Cakupan

- **Penjelasan GitHub Projects** — repositori, issue, proyek (papan), item, draf, field, Status = kolom, view, workflow. Agen Anda bisa menjelaskannya dalam bahasa Anda.
- **Akun dan login** — langkah pendaftaran akun GitHub baru, instalasi `gh`, `gh auth login`, scope `project` dan `repo`.
- **Papan** — membuat, mengganti nama, menambah deskripsi, menjadikan publik/privat, menutup/membuka kembali, menghapus, menautkan repositori, menampilkan daftar papan Anda, memilih papan default.
- **Kolom (kanban)** — menambah, mengganti nama (kartu tetap di tempat), mengubah urutan, mengatur warna, menghapus (pindahkan kartu ke kolom lain terlebih dahulu).
- **Field dan view** — field kustom (teks, angka, tanggal, pilihan tunggal), view papan/tabel/roadmap dengan filter.
- **Issue** — membuat (langsung ke sebuah kolom, dengan label, milestone, issue induk, field kustom), mengedit, memindahkan antarkolom, menutup (pindah ke Done), membuka kembali, berkomentar, mengeluarkan dari papan, mengarsipkan, menghapus.
- **Gambar** — melampirkan tangkapan layar atau video ke isi issue atau komentar.
- **TODO** — checklist `- [ ]` di dalam issue: menambah, mencentang, menghapus centang, menghapus; progres tampil di daftar. Item draf untuk mencatat ide dengan cepat, lalu nanti diubah menjadi issue.
- **Orang** — menugaskan dan membatalkan penugasan, melihat siapa mengerjakan apa, mengundang kolaborator ke repositori, dan memberi peran di papan.

### Persyaratan

- Akun GitHub (gratis). Belum punya akun? Daftar di https://github.com/signup — kode lewat e-mail, teka-teki, paket Free (sekitar tiga menit).
- [`gh`](https://cli.github.com) — GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`), sudah login dengan scope `project` dan `repo`.
- Python 3.8 atau lebih baru (hanya pustaka standar).

### Instalasi

**Paling mudah — serahkan kepada agen Anda.** Salin kotak ini ke Claude Code, Codex, Gemini CLI, atau Copilot CLI lalu kirim:

```text
Pasang skill gp dari repositori thruthesky/sonub-skills.
Path skill: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — sebuah Agent Skill standar (folder berisi SKILL.md).

1. Jika kamu Claude Code, pasang sebagai plugin dengan menjalankan perintah berikut secara berurutan (abaikan error "already added"):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - Jika saya meminta "hanya untuk proyek ini", jalankan baris terakhir di folder proyek dengan menambahkan --scope project.
   - Jika sudah terpasang, jalankan ini sebagai gantinya: claude plugin update gp@sonub-skills
2. Agen lain: taruh di folder skill DIR — semua proyek: ~/.agents/skills, hanya proyek ini: <proyek>/.agents/skills.
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Jalankan: python3 <folder skill>/scripts/gp.py doctor — lalu perbaiki apa yang dilaporkannya (pasang gh, gh auth login, gh auth refresh -s project,repo).
4. Beri tahu saya secara singkat apa yang terpasang, hasil doctor, dan bahwa sekarang saya bisa mengatakan hal seperti "tampilkan GitHub project saya".
```

**Claude Code — dua baris di terminal** (berfungsi di semua versi):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

Di dalam chat, ketik `/plugin marketplace add thruthesky/sonub-skills` lalu `/plugin install gp@sonub-skills`. Versi yang lebih baru juga menerima satu baris: `claude plugin install gp --marketplace thruthesky/sonub-skills`. Setelah memasang dari terminal, jalankan `/reload-plugins` di chat yang sedang terbuka (atau mulai ulang).

**Agen apa pun — salin foldernya** ke folder skill milik agen:

| Alat | Folder skill pengguna | Folder skill proyek |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### Instalasi global dan instalasi lokal (proyek)

| | Global — semua proyek | Lokal — hanya proyek ini |
|------|------|------|
| Plugin Claude Code | `claude plugin install gp@sonub-skills` | di folder proyek: `claude plugin install gp@sonub-skills --scope project` (ditulis ke `.claude/settings.json`, dipakai bersama tim · hanya Anda: `--scope local`) |
| Salin folder Claude Code | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Papan yang dipakai | `/gp init <URL papan> --global` → `~/.config/gp/config.json` | `/gp init <URL papan>` → `<proyek>/.gp.json` |

Lokasi pemasangan skill dan papan yang dipakainya ditentukan secara terpisah. Biasanya Anda memasang skill secara global sekali, lalu memberi setiap proyek papannya sendiri dengan `/gp init <URL papan>`.

### Pertama kali dijalankan

Minta agen Anda *"siapkan gp"* (Claude Code: `/gp:gp`, Codex: `$gp`). Agen akan menjalankan:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · sudah login ✓ · scope ✓ · papan default
gh auth login                                   # hanya jika belum login — ketik kode sekali pakai di browser
gh auth refresh -s project,repo                 # hanya jika ada scope yang kurang
python3 scripts/gp.py projects                  # papan-papan Anda
python3 scripts/gp.py init <URL papan>          # papan proyek ini (.gp.json) · semua proyek: --global … atau buat yang baru:
python3 scripts/gp.py project-create --title "Pekerjaan saya" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Memilih papan — `/gp init`

Setiap proyek pengembangan bisa punya papan GitHub Project sendiri. Berikan alamat papan kepada agen Anda di folder proyek, maka pekerjaan proyek itu masuk ke papan tersebut.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Jika dipasang sebagai plugin Claude Code: `/gp:gp init …`; Codex: `$gp init …`. Mengatakan "pakai https://… sebagai papan proyek ini" juga bisa.

- **Lokal (default)** — di dalam repositori git, papan disimpan di `<root repositori>/.gp.json` dan hanya dipakai di proyek itu (beserta subfoldernya). File ini tidak berisi rahasia: commit agar rekan tim memakai papan yang sama, atau tambahkan ke `.gitignore` agar hanya untuk Anda sendiri.
- **Global** — `/gp init <URL> --global` (atau "jadikan papan default untuk semua proyek") → `~/.config/gp/config.json`, dipakai di setiap folder yang tidak punya `.gp.json`.
- Halaman mana pun dari papan bisa dipakai (`/views/2`, papan pengguna `/users/…`, papan organisasi `/orgs/…`). Sebelum disimpan, papan diperiksa apakah ada dan bisa dibaca.
- `/gp init` saja menampilkan papan yang sedang dipakai dan file pengaturannya. Hapus: `gp.py init --unset` (global: `--unset --global`).
- Urutan penentuan papan: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → `.gp.json` proyek → pengaturan global.

### Cara memakainya — cukup katakan

| Anda bilang | Agen menjalankan |
|------|------|
| "Buat issue: tombol login tidak merespons di iPhone. Langkah: reproduksi, perbaiki, uji. Lampirkan shot.png" | `create --repo app --title "…" --todo reproduksi --todo perbaiki --todo uji --image shot.png` → kolom Todo |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → disimpan sebagai papan proyek ini (`.gp.json`) |
| "Masukkan ke in progress" · "Pindahkan #12 ke Review" | `move app#12 doing` · `move app#12 review` |
| "Selesai!" | `close app#12` — menutup issue dan memindahkannya ke Done |
| "Tambahkan 'perbarui dokumentasi' ke TODO-nya" · "centang yang pertama" | `todo app#12 add "perbarui dokumentasi"` · `todo app#12 done 1` |
| "Tambahkan kolom Urgent di paling depan" · "Ganti nama Review menjadi QA" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "Serahkan ke alice" · "Undang bob ke repo" | `assign app#12 alice` · `invite bob --repo app` (bertanya dulu) |
| "Apa saja tugas saya?" | `list --assignee @me --state open`, lalu menyarankan satu tugas berikutnya |
| "Catat ide di papan: mode gelap" | `create --draft --title "mode gelap"` |
| "Tambahkan field Priority" | `field-add Priority --type single_select --options "High,Medium,Low"` |

Semua perintah: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### Cara kerjanya

- **Hanya `gh` dan pustaka standar Python.** gh dipanggil dengan daftar argumen (tanpa shell), dan judul serta isi dikirim lewat stdin — tanda kutip, emoji, dan baris baru tidak pernah rusak.
- **ID dicari lewat nama.** ID field, kolom, dan opsi dicari setiap kali dijalankan, jadi Anda bisa mengganti nama kolom di situs web tanpa merusak apa pun. Kartu tetap berada di kolomnya meski nama kolom diganti.
- **Setiap perubahan dibaca ulang.** Setelah ada perubahan, skrip mencetak baris `check:` berisi keadaan sebenarnya di GitHub (status, kolom, penanggung jawab, label). Agen melapor berdasarkan baris itu.
- **Gambar** memakai `--attach` milik gh (GitHub user-attachments). Dengan gh versi lama, gambar di-commit ke branch `gp-assets` di repositori issue lalu ditautkan.
- **Aman secara default.** Setiap perintah yang mengubah sesuatu punya `--dry-run`. Menghapus issue, papan, field, atau kolom yang berisi kartu memerlukan `--yes`, dan skill ini menyuruh agen bertanya kepada Anda dulu. Undangan (yang mengirim e-mail ke orang sungguhan) juga ditanyakan dulu.
- **Pengaturan papan** disimpan per proyek di `.gp.json` (lokal) dan untuk semua proyek di `~/.config/gp/config.json` (global). `--owner/--number` atau `GP_OWNER`/`GP_PROJECT` lebih diutamakan daripada keduanya.

Catatan: tepat setelah issue dibuat, daftar project di GitHub bisa butuh beberapa detik untuk menampilkannya. Baris `check:` membaca issue secara langsung sehingga selalu terkini.

### Memperbarui dan menghapus

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Agen lain: jalankan lagi baris `curl … | tar` untuk memperbarui; hapus folder `gp` untuk menghapus.

## claude-skill — belajar Claude Code dan makin mahir memakainya

Claude Code merilis versi baru hampir setiap hari (sejauh ini lebih dari 400). Skill ini mengajarkannya secara berurutan, menjawab pertanyaan berdasarkan **dokumentasi resmi terkini**, bukan dari ingatan, memeriksa pengaturan Anda, dan menyimpan ringkasan setiap fitur baru di CHANGELOG. Cukup satu `/claude-skill update` untuk memasukkan fitur yang baru dirilis ke dalam skill.

### Cakupan

- **Jalur belajar 14 pelajaran** — mulai dari instalasi dan prompt pertama hingga eksplorasi → rencana → kode → commit, pengelolaan konteks, CLAUDE.md dan memori, mode izin, checkpoint, skill, subagen, hook, MCP, plugin dan marketplace, menjalankan tanpa antarmuka (headless) dan GitHub Actions, serta pekerjaan panjang tanpa diawasi dengan verifikasi. Setiap pelajaran punya **latihan di proyek Anda sendiri** dan pertanyaan pengecekan, dan progres Anda disimpan.
- **Analisis Claude Academy** — 64 tutorial Claude di [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) ditambah tutorial dan kursus Claude Code (Claude Code 101, Claude Code in action, Agent Skills, Subagents); apa yang Anda pelajari di chat (Projects, memori, konektor, skill, Research, memilih model dan tingkat usaha (effort)…) dipetakan ke cara melakukannya di Claude Code.
- **Jawaban yang dicek dengan dokumentasi** — untuk pertanyaan seperti "bagaimana cara kerja hook?" atau "apa itu cakupan (scope) plugin?", skill ini mencari dan membaca code.claude.com lalu menjawab dengan perintah, contoh, dan tautan dokumentasinya.
- **Setiap fitur baru di CHANGELOG** — seluruh 422 versi [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) (v0.2.21 – v2.1.302), tanpa perbaikan bug, diringkas menjadi 14 topik, ditambah 30 fitur yang patut diketahui dan tambahan terbaru.
- **`/claude-skill update`** — mengambil CHANGELOG terbaru, menemukan versi yang belum dicakup skill, menambahkan fiturnya ke catatan, lembar contekan, dan pelajaran, lalu mencatat sampai versi mana yang sudah dicakup.
- **Pemeriksa pengaturan (doctor)** — memeriksa versi Anda, file pengaturan (pengguna, proyek, lokal), panjang CLAUDE.md, aturan (rules), memori otomatis, skill, subagen, plugin, dan server MCP, lalu menyarankan perbaikan.
- **Lembar contekan, tips, dan panduan membuat** — perintah, pintasan, flag CLI, dan lokasi file dalam satu halaman; kebiasaan yang terbukti berhasil; cara membuat skill, subagen, hook, server MCP, plugin, dan marketplace.

### Instalasi

Sama seperti bagian [Instalasi](#instalasi--global-pengguna-atau-per-proyek) di atas. Nama pluginnya **`cc-skill`** (Claude Code mencadangkan nama plugin yang diawali `claude-` untuk plugin milik Anthropic sendiri). Skill-nya tetap bernama `claude-skill`, jadi Anda memanggilnya dengan `/claude-skill`.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # global — semua proyek
claude plugin install cc-skill@sonub-skills --scope project    # proyek ini, dipakai bersama tim
```

Memerlukan Python 3.8+ dan akses internet (skill ini membaca dokumentasi resmi dan CHANGELOG).

### Cara memakainya

| Anda bilang | Yang dilakukan |
|------|------|
| `/claude-skill` · "ayo belajar Claude Code" | Menampilkan daftar pelajaran dan progres Anda, lalu memulai pelajaran berikutnya |
| `/claude-skill lesson 5` · "pelajaran berikutnya" | Mengajarkannya, menjalankan latihan di proyek Anda, memberi pertanyaan pengecekan, menyimpan progres |
| `/claude-skill quiz` | Lima soal dari materi yang sudah dipelajari, satu per satu, dengan nilai |
| "Bagaimana menjalankan prettier setiap kali selesai mengedit dengan hook?" | Membaca dokumentasi resmi lalu menjawab dengan contoh konfigurasi dan tautannya |
| `/claude-skill new` · "ada apa yang baru?" | Fitur terbaru yang paling berguna lebih dulu, masing-masing dengan cara mencobanya |
| `/claude-skill doctor` · "cek pengaturan saya" | Meninjau pengaturan Anda dan mengusulkan perbaikan (bertanya dulu sebelum mengubah apa pun) |
| `/claude-skill tips` · `cheatsheet` · `academy` | Kebiasaan yang berhasil · perintah dan pintasan · analisis Academy |
| `/claude-skill build skill` · "buatkan saya hook" | Memilih mekanisme yang tepat dan membuatnya bersama Anda di proyek Anda |
| `/claude-skill update` | Memperbarui catatan fitur skill dari CHANGELOG terbaru |

Jika dipasang sebagai plugin, `/cc-skill:claude-skill …` juga bisa. Codex: `$claude-skill …`.

### Cara kerja `/claude-skill update`

1. `scripts/cc.py update-check` membandingkan versi yang sudah dicakup catatan (penanda `covered-through` di `references/changelog-features.md`) dengan versi CHANGELOG terbaru.
2. Pada salinan plugin yang terpasang, perintah ini lebih dulu menjalankan `claude plugin update cc-skill@sonub-skills` untuk mendapatkan catatan yang sudah dipublikasikan. Untuk mengedit sumber skill (git checkout), berikan `--source <folder>`. Tanpa sumber, catatan ditulis ke `~/.config/claude-skill/changelog-local.md`, yang tetap ada meski plugin diperbarui.
3. `cc.py changelog --since <versi yang sudah dicakup>` menampilkan item dari versi-versi baru (perbaikan bug disembunyikan); agen menambahkan fitur baru ke topiknya, menulis ulang "Tambahan terbaru", menambahkan perintah dan pintasan baru ke lembar contekan, dan memperbaiki pelajaran yang sudah tidak benar.
4. `cc.py mark-covered <versi terbaru>` memindahkan penanda; di git checkout, versi dinaikkan lalu di-commit (push hanya jika Anda minta).
5. Terakhir, agen melaporkan rentang versi yang dicakup dan 3–7 fitur baru yang layak dicoba, beserta cara mencoba masing-masing.

### Alatnya — `scripts/cc.py`

Hanya pustaka standar Python.

```bash
python3 scripts/cc.py doctor                 # cek pengaturan Claude Code Anda + saran
python3 scripts/cc.py docs hooks             # cari di dokumentasi resmi (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # baca satu bagian halaman
python3 scripts/cc.py changelog --count 5    # 5 versi terbaru (perbaikan bug disembunyikan)
python3 scripts/cc.py changelog --grep worktree --count 400   # cari fitur berdasarkan nama
python3 scripts/cc.py update-check           # versi yang sudah dicakup vs terbaru
python3 scripts/cc.py lessons                # pelajaran dan progres
```

## Struktur repositori

```
.claude-plugin/marketplace.json   ← marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← skill: kapan dan bagaimana memakainya
├─ .claude-plugin/plugin.json     ← info plugin (hanya Claude Code; alat lain mengabaikannya)
├─ scripts/gp.py                  ← alatnya
└─ references/                    ← dibaca saat diperlukan
   ├─ github-projects.md          ← konsep, akun, login, papan pertama
   └─ commands.md                 ← semua perintah + resep gh / GraphQL murni
skills/claude-skill/
├─ SKILL.md                       ← skill: kapan dan bagaimana memakainya
├─ .claude-plugin/plugin.json     ← info plugin (nama plugin cc-skill)
├─ scripts/cc.py                  ← alat belajar: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 pelajaran · analisis Academy · fitur CHANGELOG · lembar contekan · panduan membuat · tips · kuis
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
```

Pelajari cara kerja skill di bab **Agent Skills** dalam kursus AI SONUB: https://sonub.com/id/learn/ai#agent-skill

Lisensi: [MIT](LICENSE)
