# sonub-skills — Agent Skills จาก SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · **ไทย** · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

repository นี้คือ **ตลาดสกิล (skill marketplace)** ทุกสกิลเป็น [Agent Skill](https://agentskills.io) มาตรฐาน — คือโฟลเดอร์ที่มีไฟล์ `SKILL.md` — จึงใช้ได้ใน Claude Code, Codex, Gemini CLI, GitHub Copilot CLI และเอเจนต์อื่น ๆ ทุกตัวที่อ่าน Agent Skills ได้ ใน Claude Code ยังติดตั้งเป็นปลั๊กอินจากตลาดนี้ (`sonub-skills`) ได้ด้วย ทำให้อัปเดตได้ด้วยคำสั่งเดียว

| สกิล | ทำอะไร |
|------|------|
| [`gp`](skills/gp) | จัดการงานทั้งหมดของคุณใน **GitHub Projects** ด้วย git และ `gh` CLI |

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
   - ถ้าติดตั้งไว้แล้ว ให้รันคำสั่งนี้แทน: claude plugin update gp@sonub-skills
2. ถ้าเป็นเอเจนต์อื่น: ให้ใส่ไว้ในโฟลเดอร์สกิลของผู้ใช้ DIR (Codex, Gemini CLI, Copilot CLI: ~/.agents/skills)
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

### ใช้งานครั้งแรก

บอกเอเจนต์ว่า *"ตั้งค่า gp ให้หน่อย"* (Claude Code: `/gp:gp`, Codex: `$gp`) เอเจนต์จะรัน:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · เข้าสู่ระบบ ✓ · สิทธิ์ ✓ · บอร์ดหลัก
gh auth login                                   # เฉพาะเมื่อยังไม่ได้เข้าสู่ระบบ — พิมพ์รหัสใช้ครั้งเดียวในเบราว์เซอร์
gh auth refresh -s project,repo                 # เฉพาะเมื่อสิทธิ์ขาดไป
python3 scripts/gp.py projects                  # บอร์ดของคุณ
python3 scripts/gp.py use <owner> <number>      # เลือกหนึ่งบอร์ด … หรือสร้างใหม่:
python3 scripts/gp.py project-create --title "งานของฉัน" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### วิธีใช้ — แค่พูดออกมา

| คุณพูดว่า | เอเจนต์รัน |
|------|------|
| "สร้าง issue: ปุ่มเข้าสู่ระบบบน iPhone กดไม่ได้ ขั้นตอน: ทำซ้ำ, แก้ไข, ทดสอบ แนบ shot.png" | `create --repo app --title "…" --todo ทำซ้ำ --todo แก้ไข --todo ทดสอบ --image shot.png` → คอลัมน์ Todo |
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
- **บอร์ดหลัก** ถูกบันทึกไว้ใน `~/.config/gp/config.json`; เปลี่ยนได้ด้วย `--owner/--number` หรือ `GP_OWNER`/`GP_PROJECT`

หมายเหตุ: ทันทีหลังสร้าง issue รายการของ GitHub project อาจใช้เวลาสองสามวินาทีกว่าจะแสดง issue นั้น บรรทัด `check:` อ่าน issue โดยตรง จึงเป็นข้อมูลล่าสุดเสมอ

### อัปเดตและถอนการติดตั้ง

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

เอเจนต์อื่น: รันบรรทัด `curl … | tar` อีกครั้งเพื่ออัปเดต; ลบโฟลเดอร์ `gp` เพื่อถอนการติดตั้ง

### โครงสร้าง repository

```
.claude-plugin/marketplace.json   ← ตลาดสกิล (Claude Code)
skills/gp/
├─ SKILL.md                       ← ตัวสกิล: ใช้เมื่อไรและใช้อย่างไร
├─ .claude-plugin/plugin.json     ← ข้อมูลปลั๊กอิน (เฉพาะ Claude Code; เครื่องมืออื่นไม่สนใจไฟล์นี้)
├─ scripts/gp.py                  ← ตัวเครื่องมือ
└─ references/                    ← อ่านเมื่อจำเป็น
   ├─ github-projects.md          ← แนวคิด, บัญชี, การเข้าสู่ระบบ, บอร์ดแรก
   └─ commands.md                 ← ทุกคำสั่ง + ตัวอย่าง gh / GraphQL แบบตรง ๆ
```

เรียนรู้ว่าสกิลทำงานอย่างไรได้ในบท **Agent Skills** ของหลักสูตร AI ของ SONUB: https://sonub.com/th/learn/ai#agent-skill

สัญญาอนุญาต: [MIT](LICENSE)
