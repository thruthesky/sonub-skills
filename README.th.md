# sonub-skills — Agent Skills จาก SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · **ไทย** · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

repository นี้คือ **ตลาดสกิล (skill marketplace)** ทุกสกิลเป็น [Agent Skill](https://agentskills.io) มาตรฐาน — คือโฟลเดอร์ที่มีไฟล์ `SKILL.md` — จึงใช้ได้ใน Claude Code, Codex, Gemini CLI, GitHub Copilot CLI และเอเจนต์อื่น ๆ ทุกตัวที่อ่าน Agent Skills ได้ ใน Claude Code ยังติดตั้งเป็นปลั๊กอินจากตลาดนี้ (`sonub-skills`) ได้ด้วย ทำให้อัปเดตได้ด้วยคำสั่งเดียว

| สกิล | ทำอะไร |
|------|------|
| [`gp`](skills/gp) | จัดการงานทั้งหมดของคุณใน **GitHub Projects** ด้วย git และ `gh` CLI |
| [`claude-skill`](skills/claude-skill) | **เรียน Claude Code และใช้ให้เก่งขึ้น** — บทเรียน 14 บทพร้อมแบบทดสอบ, คำตอบที่ตรวจกับเอกสารทางการ, ตัวตรวจการตั้งค่า (doctor), สรุปฟีเจอร์ใหม่ทุกตัวใน CHANGELOG และ `/claude-skill update` เพื่อดึงฟีเจอร์ใหม่ ๆ เข้ามา (ชื่อปลั๊กอิน `cc-skill`) |
| [`popup`](skills/popup) | **อธิบายศัพท์เฉพาะด้วยป๊อปอัปเมื่อเอาเมาส์ไปชี้** ในหน้าเว็บและเอกสารของโปรเจกต์ใดก็ได้ — ความหมาย คำอธิบายภาษาง่าย ๆ ตัวอย่าง ซอร์สโค้ด ศัพท์ที่เกี่ยวข้อง และลิงก์ "เรียนรู้เพิ่มเติม" ไปยังหน้าของคุณเอง ทั้งหมดมาจากไฟล์ JSON อภิธานศัพท์ไฟล์เดียว |

## การติดตั้ง — แบบ global (ผู้ใช้) หรือเฉพาะโปรเจกต์

ทุกสกิลติดตั้งด้วยวิธีเดียวกัน ให้ใส่ชื่อปลั๊กอินจากตาราง (`gp`, `cc-skill`, `popup`) แทน `<ปลั๊กอิน>`

**ขั้นที่ 1 — เพิ่มตลาดสกิล (ครั้งเดียวต่อเครื่อง)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**ขั้นที่ 2 — ติดตั้งในที่ที่ต้องการ**

| ขอบเขต | คำสั่ง | ใครได้ใช้ และใช้ที่ไหน | บันทึกไว้ที่ |
|------|------|------|------|
| **global (ผู้ใช้)** — ค่าเริ่มต้น | `claude plugin install <ปลั๊กอิน>@sonub-skills` | คุณ ในทุกโปรเจกต์บนเครื่องนี้ | `~/.claude/settings.json` |
| **โปรเจกต์ (ใช้ร่วมกับทีม)** | ในโฟลเดอร์โปรเจกต์: `claude plugin install <ปลั๊กอิน>@sonub-skills --scope project` | ทุกคนที่ทำงานใน repository นี้ | `.claude/settings.json` (commit ไว้) |
| **local (เฉพาะคุณ เฉพาะโปรเจกต์นี้)** | ในโฟลเดอร์โปรเจกต์: `claude plugin install <ปลั๊กอิน>@sonub-skills --scope local` | คุณ เฉพาะใน repository นี้ | `.claude/settings.local.json` |

- ในแชต `/plugin install <ปลั๊กอิน>@sonub-skills` จะเปิดหน้าจอให้เลือกขอบเขต ถ้าติดตั้งจากเทอร์มินัล ให้รัน `/reload-plugins` ในแชตที่เปิดอยู่
- ตรวจสอบ: `claude plugin list` (แสดงขอบเขตด้วย) อัปเดต: `claude plugin marketplace update sonub-skills && claude plugin update <ปลั๊กอิน>@sonub-skills` ถอนการติดตั้ง: `claude plugin uninstall <ปลั๊กอิน>@sonub-skills`
- ถ้าตั้งปลั๊กอินตัวเดียวกันไว้หลายขอบเขต local จะมาก่อน project และ project จะมาก่อน global

**ให้เพื่อนร่วมทีมได้รับอัตโนมัติ** — commit ส่วนนี้ลงใน `.claude/settings.json` ของ repository เมื่อเพื่อนร่วมทีมเชื่อถือ (trust) โฟลเดอร์แล้ว Claude Code จะเพิ่มตลาดสกิลและติดตั้งปลั๊กอินให้เอง

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**ไม่ใช้ปลั๊กอิน — คัดลอกโฟลเดอร์** ไปไว้ในโฟลเดอร์สกิลของเอเจนต์ (`<สกิล>` = `gp`, `claude-skill` หรือ `popup`)

| เครื่องมือ | global (ผู้ใช้) | โปรเจกต์ |
|------|------|------|
| Claude Code | `~/.claude/skills/<สกิล>` | `<โปรเจกต์>/.claude/skills/<สกิล>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<สกิล>` | `<โปรเจกต์>/.agents/skills/<สกิล>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # เฉพาะโปรเจกต์นี้: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**ง่ายที่สุด** — บอกเอเจนต์ว่า *"ติดตั้งปลั๊กอิน cc-skill จาก thruthesky/sonub-skills แบบ global"* (หรือ *"เฉพาะโปรเจกต์นี้"*) แล้วเอเจนต์จะรันคำสั่งข้างบนให้

---

## gp — งานทั้งหมดของคุณบนบอร์ด GitHub Project

คุณแค่พูดกับเอเจนต์ AI ด้วยภาษาธรรมดา — *"สร้าง issue: ปุ่มเข้าสู่ระบบบน iPhone กดแล้วไม่มีอะไรเกิดขึ้น แนบภาพหน้าจอนี้ด้วย"*, *"ย้ายไป Done"*, *"เพิ่มคอลัมน์ Review"*, *"ตอนนี้ฉันมีงานอะไรบ้าง?"* — แล้วเอเจนต์จะทำสิ่งนั้นบนบอร์ด GitHub Project ของคุณด้วย `gh` จากนั้นอ่านผลลัพธ์กลับมาเพื่อยืนยัน

### ครอบคลุมอะไรบ้าง

- **อธิบาย GitHub Projects** — repository, issue, project (บอร์ด), item, draft, field, Status = คอลัมน์, view, workflow เอเจนต์สามารถสอนเรื่องนี้เป็นภาษาของคุณได้
- **บัญชีและการเข้าสู่ระบบ** — ขั้นตอนสมัครบัญชี GitHub ใหม่, การติดตั้ง `gh`, `gh auth login`, สิทธิ์ (scope) `project` และ `repo`
- **บอร์ด** — สร้าง, เปลี่ยนชื่อ, เขียนคำอธิบาย, ตั้งเป็นสาธารณะ/ส่วนตัว, ปิด/เปิดใหม่, ลบ, เชื่อม repository, ดูรายการบอร์ดของคุณ, เลือกบอร์ดหลัก
- **คอลัมน์ (คัมบัง)** — เพิ่ม, เปลี่ยนชื่อ (การ์ดยังอยู่ที่เดิม), เรียงลำดับใหม่, ใส่สี, ลบ (ย้ายการ์ดไปที่อื่นก่อน)
- **field และ view** — field ที่กำหนดเอง (ข้อความ, ตัวเลข, วันที่, ตัวเลือกเดียว), view แบบบอร์ด/ตาราง/โรดแมปพร้อมตัวกรอง
- **issue** — สร้าง (ลงในคอลัมน์ พร้อม label, milestone, issue แม่, field ที่กำหนดเอง), แก้ไข, ย้ายระหว่างคอลัมน์, ปิด (ย้ายไป Done), เปิดใหม่, แสดงความคิดเห็น, เอาออกจากบอร์ด, เก็บถาวร, ลบ
- **รูปภาพ** — แนบภาพหน้าจอหรือวิดีโอในเนื้อหา issue หรือในความคิดเห็น
- **TODO** — เช็กลิสต์ `- [ ]` ภายใน issue: เพิ่ม, ติ๊ก, ยกเลิกติ๊ก, ลบ; แสดงความคืบหน้าในรายการ ส่วน draft item ใช้จดไอเดียแบบรวดเร็ว แล้วค่อยแปลงเป็น issue ทีหลัง
- **คน** — มอบหมายและยกเลิกการมอบหมาย, ดูว่าใครรับงานอะไรอยู่, เชิญผู้ร่วมงานเข้า repository และกำหนดบทบาทในบอร์ด

### สิ่งที่ต้องมี

- บัญชี GitHub (ฟรี) ยังไม่มีบัญชี? สมัครได้ที่ https://github.com/signup — รหัสทางอีเมล, ปริศนายืนยันตัวตน, แผน Free (ประมาณสามนาที)
- [`gh`](https://cli.github.com) — GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`) เข้าสู่ระบบด้วยสิทธิ์ `project` และ `repo`
- Python 3.8 ขึ้นไป (ใช้แค่ไลบรารีมาตรฐาน)

### การติดตั้ง

**ง่ายที่สุด — ให้เอเจนต์ทำให้** คัดลอกกล่องนี้ไปวางใน Claude Code, Codex, Gemini CLI หรือ Copilot CLI แล้วส่ง:

```text
ติดตั้งสกิล gp จาก repository thruthesky/sonub-skills
ตำแหน่งสกิล: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — เป็น Agent Skill มาตรฐาน (โฟลเดอร์ที่มี SKILL.md)

1. ถ้าคุณคือ Claude Code ให้ติดตั้งเป็นปลั๊กอิน โดยรันคำสั่งเหล่านี้ตามลำดับ (ไม่ต้องสนใจข้อผิดพลาดว่า "already added"):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - ถ้าฉันบอกว่า "เฉพาะโปรเจกต์นี้" ให้รันบรรทัดสุดท้ายในโฟลเดอร์โปรเจกต์โดยเพิ่ม --scope project
   - ถ้าติดตั้งไว้แล้ว ให้รันคำสั่งนี้แทน: claude plugin update gp@sonub-skills
2. ถ้าเป็นเอเจนต์อื่น: ให้ใส่ไว้ในโฟลเดอร์สกิล DIR — ทุกโปรเจกต์: ~/.agents/skills, เฉพาะโปรเจกต์นี้: <โปรเจกต์>/.agents/skills
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. รัน: python3 <โฟลเดอร์สกิล>/scripts/gp.py doctor — แล้วแก้ปัญหาที่มันรายงาน (ติดตั้ง gh, gh auth login, gh auth refresh -s project,repo)
4. บอกฉันสั้น ๆ ว่าติดตั้งอะไรไปบ้าง ผลของ doctor เป็นอย่างไร และบอกว่าตอนนี้ฉันพูดได้เลย เช่น "แสดง GitHub project ของฉัน"
```

**Claude Code — สองบรรทัดในเทอร์มินัล** (ใช้ได้ทุกเวอร์ชัน):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

ในหน้าแชตให้ใช้ `/plugin marketplace add thruthesky/sonub-skills` แล้วตามด้วย `/plugin install gp@sonub-skills` เวอร์ชันใหม่ ๆ รับคำสั่งบรรทัดเดียวได้ด้วย: `claude plugin install gp --marketplace thruthesky/sonub-skills` หลังติดตั้งจากเทอร์มินัลแล้ว ให้รัน `/reload-plugins` ในแชตที่เปิดอยู่ (หรือเริ่มใหม่)

**เอเจนต์ใดก็ได้ — คัดลอกโฟลเดอร์** ไปไว้ในโฟลเดอร์สกิลของเอเจนต์:

| เครื่องมือ | โฟลเดอร์สกิลของผู้ใช้ | โฟลเดอร์สกิลของโปรเจกต์ |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### ติดตั้งแบบ global และแบบ local (เฉพาะโปรเจกต์)

| | global — ทุกโปรเจกต์ | local — เฉพาะโปรเจกต์นี้ |
|------|------|------|
| ปลั๊กอิน Claude Code | `claude plugin install gp@sonub-skills` | ในโฟลเดอร์โปรเจกต์: `claude plugin install gp@sonub-skills --scope project` (บันทึกลง `.claude/settings.json` ใช้ร่วมกันทั้งทีม · ใช้คนเดียว: `--scope local`) |
| คัดลอกโฟลเดอร์สำหรับ Claude Code | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| บอร์ดที่ใช้ | `/gp init <URL บอร์ด> --global` → `~/.config/gp/config.json` | `/gp init <URL บอร์ด>` → `<โปรเจกต์>/.gp.json` |

ตำแหน่งที่ติดตั้งสกิลกับบอร์ดที่ใช้นั้นเลือกแยกกัน โดยทั่วไปจะติดตั้งสกิลแบบ global ครั้งเดียว แล้วกำหนดบอร์ดให้แต่ละโปรเจกต์ด้วย `/gp init <URL บอร์ด>`

### ใช้งานครั้งแรก

บอกเอเจนต์ว่า *"ตั้งค่า gp ให้หน่อย"* (Claude Code: `/gp:gp`, Codex: `$gp`) เอเจนต์จะรัน:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · เข้าสู่ระบบ ✓ · สิทธิ์ ✓ · บอร์ดหลัก
gh auth login                                   # เฉพาะเมื่อยังไม่ได้เข้าสู่ระบบ — พิมพ์รหัสใช้ครั้งเดียวในเบราว์เซอร์
gh auth refresh -s project,repo                 # เฉพาะเมื่อสิทธิ์ขาดไป
python3 scripts/gp.py projects                  # บอร์ดของคุณ
python3 scripts/gp.py init <URL บอร์ด>          # บอร์ดของโปรเจกต์นี้ (.gp.json) · ทุกโปรเจกต์: --global … หรือสร้างใหม่:
python3 scripts/gp.py project-create --title "งานของฉัน" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### เลือกบอร์ด — `/gp init`

แต่ละโปรเจกต์ที่พัฒนาอยู่มีบอร์ด GitHub Project ของตัวเองได้ ให้ที่อยู่ของบอร์ดกับเอเจนต์ในโฟลเดอร์โปรเจกต์ แล้วงานของโปรเจกต์นั้นจะไปอยู่ที่บอร์ดนั้น

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

ถ้าติดตั้งเป็นปลั๊กอิน Claude Code: `/gp:gp init …` ส่วน Codex: `$gp init …` จะพูดว่า "ใช้ https://… เป็นบอร์ดของโปรเจกต์นี้" ก็ได้เช่นกัน

- **local (ค่าเริ่มต้น)** — ถ้าอยู่ใน git repository จะบันทึกไว้ที่ `<รากของ repository>/.gp.json` และใช้เฉพาะในโปรเจกต์นั้น (รวมโฟลเดอร์ย่อย) ไฟล์นี้ไม่มีข้อมูลลับ: commit ไว้เพื่อให้เพื่อนร่วมทีมใช้บอร์ดเดียวกัน หรือใส่ใน `.gitignore` เพื่อใช้คนเดียว
- **global** — `/gp init <URL> --global` (หรือพูดว่า "ตั้งเป็นบอร์ดหลักของทุกโปรเจกต์") → `~/.config/gp/config.json` ใช้ในทุกโฟลเดอร์ที่ไม่มี `.gp.json`
- ใช้หน้าไหนของบอร์ดก็ได้ (`/views/2`, บอร์ดของผู้ใช้ `/users/…`, บอร์ดขององค์กร `/orgs/…`) ก่อนบันทึกจะตรวจว่าบอร์ดมีอยู่จริงและอ่านได้
- พิมพ์ `/gp init` อย่างเดียวจะแสดงบอร์ดที่ใช้อยู่และไฟล์ตั้งค่าของมัน ลบ: `gp.py init --unset` (global: `--unset --global`)
- `/gp init` ยังเขียนคำสั่งลงใน `AGENTS.md`/`CLAUDE.md` ของโปรเจกต์นี้และใน `~/.claude/CLAUDE.md`/`~/.codex/AGENTS.md` ระดับ global ว่า "การสร้าง แก้ไข ลบ ดูรายการ หรือค้นหา issue งาน และ TODO ของ GitHub Project ให้ใช้ skill gp เสมอ" ถ้าให้ URL จะเพิ่ม "ทำงานบนบอร์ดนี้" พร้อม URL นั้นด้วย รันซ้ำจะอัปเดตเฉพาะส่วนนั้น `--show` แสดงอย่างเดียว `--no-instructions` ข้ามคำสั่งนี้ `--remove-instructions` ลบออก
- ลำดับการเลือกบอร์ด: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → `.gp.json` ของโปรเจกต์ → ค่าตั้ง global

### วิธีใช้ — แค่พูดออกมา

| คุณพูดว่า | เอเจนต์รัน |
|------|------|
| "สร้าง issue: ปุ่มเข้าสู่ระบบบน iPhone กดไม่ได้ ขั้นตอน: ทำซ้ำ, แก้ไข, ทดสอบ แนบ shot.png" | `create --repo app --title "…" --todo ทำซ้ำ --todo แก้ไข --todo ทดสอบ --image shot.png` → คอลัมน์ Todo |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → บันทึกเป็นบอร์ดของโปรเจกต์นี้ (`.gp.json`) |
| "เปลี่ยนเป็นกำลังทำ" · "ย้าย #12 ไป Review" | `move app#12 doing` · `move app#12 review` |
| "เสร็จแล้ว!" | `close app#12` — ปิด issue และย้ายไป Done |
| "เพิ่ม 'อัปเดตเอกสาร' ใน TODO" · "ติ๊กข้อแรก" | `todo app#12 add "อัปเดตเอกสาร"` · `todo app#12 done 1` |
| "เพิ่มคอลัมน์ Urgent ไว้หน้าสุด" · "เปลี่ยนชื่อ Review เป็น QA" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "มอบให้ alice" · "เชิญ bob เข้า repo" | `assign app#12 alice` · `invite bob --repo app` (ถามก่อน) |
| "ตอนนี้ฉันมีงานอะไรบ้าง?" | `list --assignee @me --state open` แล้วแนะนำงานถัดไปหนึ่งงาน |
| "จดไอเดียไว้บนบอร์ด: โหมดมืด" | `create --draft --title "โหมดมืด"` |
| "เพิ่ม field Priority" | `field-add Priority --type single_select --options "High,Medium,Low"` |

คำสั่งทั้งหมด: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`

### ทำงานอย่างไร

- **ใช้แค่ `gh` และไลบรารีมาตรฐานของ Python** เรียก gh ด้วยรายการอาร์กิวเมนต์ (ไม่ผ่าน shell) และส่งหัวข้อกับเนื้อหาผ่าน stdin — เครื่องหมายคำพูด อีโมจิ และการขึ้นบรรทัดใหม่จึงไม่มีวันเพี้ยน
- **หา ID จากชื่อ** ID ของ field, คอลัมน์ และตัวเลือกจะถูกค้นหาใหม่ทุกครั้งที่รัน คุณจึงเปลี่ยนชื่อคอลัมน์บนเว็บไซต์ได้โดยไม่มีอะไรพัง การเปลี่ยนชื่อคอลัมน์ยังคงการ์ดไว้ในคอลัมน์นั้น
- **ทุกการเปลี่ยนแปลงจะถูกอ่านกลับมา** หลังเปลี่ยนแปลง สคริปต์จะพิมพ์บรรทัด `check:` ที่แสดงสถานะจริงบน GitHub (สถานะ, คอลัมน์, ผู้รับผิดชอบ, label) แล้วเอเจนต์จะรายงานจากบรรทัดนั้น
- **รูปภาพ** ใช้ `--attach` ของ gh (GitHub user-attachments) ถ้า gh เป็นเวอร์ชันเก่า รูปภาพจะถูก commit ลงใน branch `gp-assets` ของ repository ของ issue แล้วใส่ลิงก์
- **ปลอดภัยเป็นค่าเริ่มต้น** ทุกคำสั่งที่เปลี่ยนแปลงข้อมูลมี `--dry-run` การลบ issue, บอร์ด, field หรือคอลัมน์ที่มีการ์ดต้องใช้ `--yes` และสกิลจะบอกให้เอเจนต์ถามคุณก่อน การเชิญ (ซึ่งส่งอีเมลถึงคนจริง) ก็จะถามก่อนเช่นกัน
- **การตั้งค่าบอร์ด** ถูกบันทึกแยกตามโปรเจกต์ใน `.gp.json` (local) และสำหรับทุกโปรเจกต์ใน `~/.config/gp/config.json` (global); `--owner/--number` หรือ `GP_OWNER`/`GP_PROJECT` มีลำดับก่อนทั้งสองอย่าง

หมายเหตุ: ทันทีหลังสร้าง issue รายการของ GitHub project อาจใช้เวลาสองสามวินาทีกว่าจะแสดง issue นั้น บรรทัด `check:` อ่าน issue โดยตรง จึงเป็นข้อมูลล่าสุดเสมอ

### อัปเดตและถอนการติดตั้ง

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

เอเจนต์อื่น: รันบรรทัด `curl … | tar` อีกครั้งเพื่ออัปเดต; ลบโฟลเดอร์ `gp` เพื่อถอนการติดตั้ง

## claude-skill — เรียน Claude Code และใช้ให้เก่งขึ้น

Claude Code ออกเวอร์ชันใหม่แทบทุกวัน (จนถึงตอนนี้มากกว่า 400 เวอร์ชัน) สกิลนี้สอน Claude Code ทีละขั้นตามลำดับ ตอบคำถามจาก **เอกสารทางการฉบับปัจจุบัน** แทนการตอบจากความจำ ตรวจการตั้งค่าของคุณ และเก็บสรุปฟีเจอร์ใหม่ทุกตัวใน CHANGELOG ไว้ แค่สั่ง `/claude-skill update` ครั้งเดียว ฟีเจอร์ที่เพิ่งออกมาก็จะถูกเพิ่มเข้าในสกิล

### ครอบคลุมอะไรบ้าง

- **หลักสูตร 14 บท** — ตั้งแต่การติดตั้งและพรอมต์แรก ไปจนถึง สำรวจ → วางแผน → เขียนโค้ด → commit, การจัดการ context, CLAUDE.md และหน่วยความจำ (memory), โหมดสิทธิ์ (permission mode), checkpoint, สกิล, subagent, hook, MCP, ปลั๊กอินและตลาดสกิล, การรันแบบ headless และ GitHub Actions, และงานยาว ๆ ที่ปล่อยให้ทำเองพร้อมการตรวจสอบผล ทุกบทมี **แบบฝึกหัดในโปรเจกต์ของคุณเอง** และคำถามทบทวน โดยระบบจะบันทึกความคืบหน้าไว้ให้
- **วิเคราะห์ Claude Academy** — บทเรียน Claude 64 บทบน [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) รวมถึงบทเรียนและคอร์สของ Claude Code (Claude Code 101, Claude Code in action, Agent Skills, Subagents) โดยจับคู่สิ่งที่เรียนในแชต (Projects, memory, connector, สกิล, Research, การเลือกโมเดลและ effort…) เข้ากับวิธีทำใน Claude Code
- **คำตอบที่ตรวจกับเอกสาร** — สำหรับคำถามอย่าง "hook ทำงานอย่างไร?" หรือ "ขอบเขต (scope) ของปลั๊กอินคืออะไร?" สกิลจะค้นและอ่าน code.claude.com แล้วตอบพร้อมคำสั่ง ตัวอย่าง และลิงก์เอกสาร
- **ฟีเจอร์ใหม่ทุกตัวใน CHANGELOG** — ครบทั้ง 422 เวอร์ชันของ [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) (v0.2.21 – v2.1.302) ไม่นับการแก้บั๊ก สรุปเป็น 14 หัวข้อ พร้อม 30 ฟีเจอร์ที่ควรรู้ และสิ่งที่เพิ่มมาล่าสุด
- **`/claude-skill update`** — ดึง CHANGELOG ล่าสุด หาเวอร์ชันที่สกิลยังไม่ครอบคลุม เพิ่มฟีเจอร์ของเวอร์ชันเหล่านั้นลงในบันทึก cheatsheet และบทเรียน แล้วจดไว้ว่าครอบคลุมถึงเวอร์ชันไหนแล้ว
- **ตัวตรวจการตั้งค่า (doctor)** — ดูเวอร์ชันของคุณ ไฟล์ตั้งค่า (ผู้ใช้, โปรเจกต์, local) ความยาวของ CLAUDE.md, rules, auto memory, สกิล, subagent, ปลั๊กอิน และเซิร์ฟเวอร์ MCP แล้วแนะนำวิธีแก้
- **Cheatsheet, เคล็ดลับ และคู่มือการสร้าง** — คำสั่ง ปุ่มลัด แฟล็ก CLI และตำแหน่งไฟล์ในหน้าเดียว; นิสัยการใช้งานที่ได้ผล; วิธีสร้างสกิล, subagent, hook, เซิร์ฟเวอร์ MCP, ปลั๊กอิน และตลาดสกิล

### การติดตั้ง

ทำตามหัวข้อ [การติดตั้ง](#การติดตั้ง--แบบ-global-ผู้ใช้-หรือเฉพาะโปรเจกต์) ข้างบน ปลั๊กอินชื่อ **`cc-skill`** (Claude Code สงวนชื่อปลั๊กอินที่ขึ้นต้นด้วย `claude-` ไว้ให้ปลั๊กอินของ Anthropic เอง) ส่วนสกิลยังคงชื่อ `claude-skill` จึงเรียกใช้ด้วย `/claude-skill`

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # global — ทุกโปรเจกต์
claude plugin install cc-skill@sonub-skills --scope project    # โปรเจกต์นี้ ใช้ร่วมกับทีม
```

ต้องมี Python 3.8 ขึ้นไปและอินเทอร์เน็ต (สกิลอ่านเอกสารทางการและ CHANGELOG)

### วิธีใช้

| คุณพูดว่า | สกิลทำ |
|------|------|
| `/claude-skill` · "มาเรียน Claude Code กัน" | แสดงบทเรียนและความคืบหน้า แล้วเริ่มบทถัดไป |
| `/claude-skill lesson 5` · "บทถัดไป" | สอนบทนั้น ทำแบบฝึกหัดในโปรเจกต์ของคุณ ถามคำถามทบทวน และบันทึกความคืบหน้า |
| `/claude-skill quiz` | ถามห้าข้อจากสิ่งที่เรียนไปแล้ว ทีละข้อ พร้อมให้คะแนน |
| "จะใช้ hook ให้รัน prettier หลังแก้ไขทุกครั้งได้อย่างไร?" | อ่านเอกสารทางการแล้วตอบพร้อมตัวอย่างการตั้งค่าและลิงก์ |
| `/claude-skill new` · "มีอะไรใหม่บ้าง?" | ฟีเจอร์ล่าสุดที่มีประโยชน์ที่สุดก่อน แต่ละตัวบอกวิธีลองใช้ |
| `/claude-skill doctor` · "ช่วยตรวจการตั้งค่าของฉันหน่อย" | ตรวจการตั้งค่าและเสนอวิธีแก้ (ถามก่อนเปลี่ยนอะไรก็ตาม) |
| `/claude-skill tips` · `cheatsheet` · `academy` | นิสัยการใช้งานที่ได้ผล · คำสั่งและปุ่มลัด · บทวิเคราะห์ Academy |
| `/claude-skill build skill` · "สร้าง hook ให้หน่อย" | เลือกกลไกที่เหมาะสม แล้วสร้างไปพร้อมกับคุณในโปรเจกต์ของคุณ |
| `/claude-skill update` | อัปเดตบันทึกฟีเจอร์ของสกิลจาก CHANGELOG ล่าสุด |

ถ้าติดตั้งเป็นปลั๊กอิน ใช้ `/cc-skill:claude-skill …` ได้เช่นกัน ส่วน Codex: `$claude-skill …`

### `/claude-skill update` ทำงานอย่างไร

1. `scripts/cc.py update-check` เปรียบเทียบเวอร์ชันที่บันทึกครอบคลุมถึง (เครื่องหมาย `covered-through` ใน `references/changelog-features.md`) กับเวอร์ชันล่าสุดใน CHANGELOG
2. ถ้าเป็นสำเนาปลั๊กอินที่ติดตั้งไว้ จะรัน `claude plugin update cc-skill@sonub-skills` ก่อนเพื่อรับบันทึกที่เผยแพร่แล้ว ถ้าจะแก้ซอร์สของสกิล (git checkout) ให้ส่ง `--source <โฟลเดอร์>` ถ้าไม่มีซอร์ส จะเขียนลง `~/.config/claude-skill/changelog-local.md` ซึ่งยังอยู่แม้อัปเดตปลั๊กอินแล้ว
3. `cc.py changelog --since <เวอร์ชันที่ครอบคลุม>` แสดงรายการของเวอร์ชันใหม่ (ซ่อนการแก้บั๊ก) เอเจนต์จะเพิ่มฟีเจอร์ใหม่ลงในหัวข้อของมัน เขียนส่วน "สิ่งที่เพิ่มมาล่าสุด" ใหม่ เพิ่มคำสั่งและปุ่มลัดใหม่ลงใน cheatsheet และแก้บทเรียนที่ไม่ถูกต้องแล้ว
4. `cc.py mark-covered <เวอร์ชันล่าสุด>` ขยับเครื่องหมาย ถ้าเป็น git checkout จะเพิ่มเลขเวอร์ชันและ commit ให้ (push เฉพาะเมื่อคุณสั่ง)
5. รายงานช่วงเวอร์ชันที่ครอบคลุมแล้ว และฟีเจอร์ใหม่ 3–7 ตัวที่น่าลอง พร้อมวิธีลองแต่ละตัว

### เครื่องมือ — `scripts/cc.py`

ใช้แค่ไลบรารีมาตรฐานของ Python

```bash
python3 scripts/cc.py doctor                 # ตรวจการตั้งค่า Claude Code ของคุณ + คำแนะนำ
python3 scripts/cc.py docs hooks             # ค้นเอกสารทางการ (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # อ่านหัวข้อเดียวของหน้าเอกสาร
python3 scripts/cc.py changelog --count 5    # 5 เวอร์ชันล่าสุด (ซ่อนการแก้บั๊ก)
python3 scripts/cc.py changelog --grep worktree --count 400   # หาฟีเจอร์จากชื่อ
python3 scripts/cc.py update-check           # เวอร์ชันที่ครอบคลุม vs เวอร์ชันล่าสุด
python3 scripts/cc.py lessons                # บทเรียนและความคืบหน้า
```

## popup — อธิบายทุกคำยากตรงที่ผู้อ่านเจอมัน

ผู้อ่านแค่สะดุดกับคำที่ไม่รู้จักสักคำ — "token", "endpoint", "idempotent" — ก็หลุดจากทั้งย่อหน้าแล้ว สกิลนี้วางการ์ดเล็ก ๆ ไว้บนคำนั้น: เอาเมาส์ไปชี้ (บนมือถือให้แตะ ถ้าใช้คีย์บอร์ดให้โฟกัส) แล้วการ์ดจะอธิบายศัพท์เป็นชั้น ๆ — ความหมายบรรทัดเดียว คำอธิบายสั้น ๆ การเปรียบเทียบกับเรื่องในชีวิตประจำวัน บรรทัดตัวอย่าง ตัวอย่างซอร์สโค้ด ศัพท์ที่เกี่ยวข้อง และ**ลิงก์ "เรียนรู้เพิ่มเติม" ไปยังอีกหน้าหนึ่งในโปรเจกต์ของคุณเอง** ใช้ได้กับทุกโปรเจกต์: เว็บไซต์แบบสถิต ตัวสร้างเอกสาร แอปหน้าเดียว (SPA) เว็บไซต์ที่เรนเดอร์ฝั่งเซิร์ฟเวอร์ และ Markdown ธรรมดาที่อ่านบน GitHub

### ครอบคลุมอะไรบ้าง

- **อภิธานศัพท์เดียว ที่เดียว** — คำอธิบายทั้งหมดอยู่ในไฟล์ JSON ไฟล์เดียว (หรือหนึ่งไฟล์ต่อภาษา) หน้าเว็บแค่อ้างถึง id ของศัพท์ คำเดียวกันจึงถูกอธิบายเหมือนกันทุกที่
- **ชุดเครื่องมือที่วางใช้ได้ทันที** — `popup.js` และ `popup.css` ไม่ต้องใช้เฟรมเวิร์กและไม่มีขั้นตอน build ข้อความธรรมดาใน `main`/`article` จะถูกห่อให้อัตโนมัติ (ครั้งแรกที่ใช้ในแต่ละหน้า) และมี markup แบบระบุชัดสำหรับวลี ประโยค ปุ่ม "?" และลิงก์ที่แสดงตัวอย่างเมื่อเอาเมาส์ไปชี้ หนึ่งการ์ดต่อหน้า คลิกเพื่อตรึง ชิปศัพท์ที่เกี่ยวข้องสลับได้ที่เดิม Esc คืนโฟกัส บนมือถือเป็น bottom sheet รองรับภาษาที่เขียนจากขวาไปซ้าย โหมดมืด และปรับธีมได้ด้วยตัวแปร CSS
- **จับคู่คำอย่างฉลาด** — ใช้การสะกดที่ยาวที่สุดก่อน กำหนดขอบเขตคำตามระบบตัวอักษร (ละติน ซีริลลิก ตัวช่วยท้ายคำภาษาเกาหลี คำนำหน้าภาษาอาหรับ CJK) ศัพท์ที่ใช้เฉพาะในบางส่วน (`scope`) และชื่อคำสั่งที่แยกตัวพิมพ์เล็กพิมพ์ใหญ่
- **กฎการเขียน** — วิธีเขียนการ์ดที่มือใหม่อ่านรอบเดียวก็เข้าใจ ในทุกภาษาที่โปรเจกต์ออกให้: แต่ละช่องมีไว้ทำอะไร ความยาว การเปรียบเทียบหนึ่งอย่าง ข้อเท็จจริงที่ตรวจแล้ว และใส่ตัวอย่างเสมอเมื่อมีตัวอย่างจริง
- **เครื่องมือ** — `popup.py check` ตรวจอภิธานศัพท์ (ทุก locale โค้ดตัวอย่างต้องเหมือนกันทุกภาษา id ที่เกี่ยวข้อง ปลายทางของลิงก์ "เรียนรู้เพิ่มเติม" ต้องมีอยู่จริง การสะกดที่ชนกัน); `audit` แสดงว่าเอกสารใช้ศัพท์ใดไปแล้วบ้าง และหาศัพท์เฉพาะที่ยังไม่มีรายการ; `add` รวมศัพท์ใหม่เข้าไปอย่างปลอดภัย; `md` + `link` เปลี่ยนอภิธานศัพท์เป็น `GLOSSARY.md` และใส่ลิงก์ที่การใช้ครั้งแรกในไฟล์ Markdown ของคุณ โดยใช้ความหมายเป็นข้อความเมื่อเอาเมาส์ไปชี้
- **SONUB** — ภายใน repository ของ SONUB สกิลนี้ต่อยอดจากอภิธานศัพท์ Laravel ของ SONUB เอง (17 ภาษา เสียงของติวเตอร์ AI) แทนที่จะเพิ่มระบบที่สอง

### การติดตั้ง

ทำตามหัวข้อ [การติดตั้ง](#การติดตั้ง--แบบ-global-ผู้ใช้-หรือเฉพาะโปรเจกต์) ข้างบน โดยใช้ชื่อปลั๊กอิน **`popup`**

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # global — ทุกโปรเจกต์
claude plugin install popup@sonub-skills --scope project    # โปรเจกต์นี้ ใช้ร่วมกับทีม
```

เครื่องมือต้องใช้ Python 3.8+ ส่วนชุด popup ทำงานได้ในเบราว์เซอร์รุ่นใหม่ทุกตัว

### วิธีใช้

| คุณพูดว่า | สกิลทำ |
|------|------|
| `/popup docs/getting-started.md` · "เพิ่มป๊อปอัปอภิธานศัพท์ให้หน้านี้" | หาคำยาก เขียนรายการศัพท์ ต่อชุด popup เข้ากับหน้า แล้วตรวจในเบราว์เซอร์ |
| `/popup token, sampling, temperature` | เขียนศัพท์สามรายการนั้นและแนบไว้ตรงที่ใช้คำเหล่านั้น |
| "อธิบายรายการเมนูเมื่อเอาเมาส์ไปชี้" | เพิ่มตัวอย่างเมื่อเอาเมาส์ไปชี้ให้ลิงก์ พร้อมปุ่ม "?" สำหรับมือถือและคีย์บอร์ด |
| "ทำให้ README เหมาะกับมือใหม่" | สร้าง `GLOSSARY.md` และใส่ลิงก์ที่การใช้ครั้งแรกของแต่ละศัพท์ โดยแสดงความหมายเมื่อเอาเมาส์ไปชี้ |
| "แปลอภิธานศัพท์เป็นภาษาญี่ปุ่น" | เพิ่ม `ja` ให้ทุกรายการ และตรวจว่าไม่มีรายการใดตกหล่น |

ถ้าติดตั้งเป็นปลั๊กอิน ใช้ `/popup:popup …` ได้เช่นกัน ส่วน Codex: `$popup …`

### เครื่องมือ — `scripts/popup.py`

ใช้แค่ไลบรารีมาตรฐานของ Python

```bash
python3 scripts/popup.py init popup --locales en,ko   # คัดลอก popup.js/css, สร้าง glossary.json, เขียน .popup.json
python3 scripts/popup.py audit docs                   # ศัพท์ที่ใช้ในแต่ละไฟล์ + ศัพท์เฉพาะที่ยังไม่มีรายการ
python3 scripts/popup.py add new-terms.json --dry-run # รวมศัพท์ใหม่ (ตรวจแล้ว ไม่เขียนทับแบบเงียบ ๆ)
python3 scripts/popup.py check                        # ตรวจอภิธานศัพท์
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # Markdown บน GitHub
```

จากนั้นเพิ่มสองแท็กลงใน layout ของคุณ:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## โครงสร้าง repository

```
.claude-plugin/marketplace.json   ← ตลาดสกิล (Claude Code)
skills/gp/
├─ SKILL.md                       ← ตัวสกิล: ใช้เมื่อไรและใช้อย่างไร
├─ .claude-plugin/plugin.json     ← ข้อมูลปลั๊กอิน (เฉพาะ Claude Code; เครื่องมืออื่นไม่สนใจไฟล์นี้)
├─ scripts/gp.py                  ← ตัวเครื่องมือ
└─ references/                    ← อ่านเมื่อจำเป็น
   ├─ github-projects.md          ← แนวคิด, บัญชี, การเข้าสู่ระบบ, บอร์ดแรก
   └─ commands.md                 ← ทุกคำสั่ง + ตัวอย่าง gh / GraphQL แบบตรง ๆ
skills/claude-skill/
├─ SKILL.md                       ← ตัวสกิล: ใช้เมื่อไรและใช้อย่างไร
├─ .claude-plugin/plugin.json     ← ข้อมูลปลั๊กอิน (ชื่อปลั๊กอิน cc-skill)
├─ scripts/cc.py                  ← เครื่องมือเรียน: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← บทเรียน 14 บท · บทวิเคราะห์ Academy · ฟีเจอร์ใน CHANGELOG · cheatsheet · คู่มือการสร้าง · เคล็ดลับ · แบบทดสอบ
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← ตัวสกิล: ใช้เมื่อไรและใช้อย่างไร
├─ .claude-plugin/plugin.json     ← ข้อมูลปลั๊กอิน
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← เครื่องมือเฉพาะ SONUB (อภิธานศัพท์ Laravel)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

เรียนรู้ว่าสกิลทำงานอย่างไรได้ในบท **Agent Skills** ของหลักสูตร AI ของ SONUB: https://sonub.com/th/learn/ai#agent-skill

สัญญาอนุญาต: [MIT](LICENSE)
