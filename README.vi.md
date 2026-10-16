# sonub-skills — Agent Skills từ SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · **Tiếng Việt** · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Kho lưu trữ này là một **chợ kỹ năng (skill marketplace)**. Mỗi kỹ năng là một [Agent Skill](https://agentskills.io) tiêu chuẩn — một thư mục chứa `SKILL.md` — nên nó chạy được trong Claude Code, Codex, Gemini CLI, GitHub Copilot CLI và mọi agent khác đọc được Agent Skills. Claude Code còn có thể cài nó dưới dạng plugin từ marketplace này (`sonub-skills`), nhờ đó việc cập nhật chỉ cần một lệnh.

| Kỹ năng | Chức năng |
|------|------|
| [`gp`](skills/gp) | Quản lý mọi công việc của bạn trong **GitHub Projects** bằng git và `gh` CLI |

---

## gp — mọi công việc của bạn trên một bảng GitHub Project

Bạn nói với AI agent bằng lời bình thường — *"tạo issue: nút đăng nhập không phản hồi trên iPhone, đính kèm ảnh chụp màn hình này"*, *"chuyển sang Done"*, *"thêm cột Review"*, *"tôi đang có những việc gì?"* — và agent làm việc đó trên bảng GitHub Project của bạn bằng `gh`, rồi đọc lại kết quả để xác nhận.

### Nội dung bao gồm

- **Giải thích GitHub Projects** — kho lưu trữ (repository), issue, dự án (bảng), mục (item), bản nháp (draft), trường (field), Status = các cột, chế độ xem (view), workflow. Agent có thể giải thích bằng ngôn ngữ của bạn.
- **Tài khoản và đăng nhập** — các bước đăng ký tài khoản GitHub mới, cài `gh`, `gh auth login`, các quyền (scope) `project` và `repo`.
- **Bảng** — tạo, đổi tên, thêm mô tả, đặt công khai/riêng tư, đóng/mở lại, xóa, liên kết kho lưu trữ, liệt kê các bảng của bạn, chọn bảng mặc định.
- **Cột (kanban)** — thêm, đổi tên (thẻ vẫn giữ nguyên), sắp xếp lại, đổi màu, xóa (chuyển thẻ sang cột khác trước).
- **Trường và chế độ xem** — trường tùy chỉnh (văn bản, số, ngày, chọn một), chế độ xem dạng bảng (board), bảng biểu (table) và lộ trình (roadmap) kèm bộ lọc.
- **Issue** — tạo (vào một cột, kèm nhãn, milestone, issue cha, trường tùy chỉnh), sửa, chuyển giữa các cột, đóng (chuyển sang Done), mở lại, bình luận, gỡ khỏi bảng, lưu trữ (archive), xóa.
- **Hình ảnh** — đính kèm ảnh chụp màn hình hoặc video vào nội dung issue hoặc bình luận.
- **TODO** — danh sách kiểm tra `- [ ]` bên trong issue: thêm, đánh dấu, bỏ đánh dấu, xóa; tiến độ hiển thị trong danh sách. Mục nháp (draft) để ghi nhanh ý tưởng, sau này chuyển thành issue.
- **Con người** — giao và bỏ giao việc, xem ai đang làm gì, mời cộng tác viên vào kho lưu trữ và cấp vai trò trên bảng.

### Yêu cầu

- Một tài khoản GitHub (miễn phí). Chưa có tài khoản? Đăng ký tại https://github.com/signup — mã gửi qua e-mail, câu đố, gói Free (khoảng ba phút).
- [`gh`](https://cli.github.com) — GitHub CLI (macOS `brew install gh`, Windows `winget install GitHub.cli`), đã đăng nhập với quyền `project` và `repo`.
- Python 3.8 trở lên (chỉ dùng thư viện chuẩn).

### Cài đặt

**Dễ nhất — để agent làm giúp.** Sao chép khung này vào Claude Code, Codex, Gemini CLI hoặc Copilot CLI rồi gửi đi:

```text
Hãy cài kỹ năng gp từ kho thruthesky/sonub-skills.
Đường dẫn kỹ năng: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — một Agent Skill tiêu chuẩn (thư mục chứa SKILL.md).

1. Nếu bạn là Claude Code, hãy cài nó dưới dạng plugin, chạy lần lượt các lệnh sau (bỏ qua lỗi "already added"):
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - Nếu đã cài rồi, hãy chạy lệnh này thay thế: claude plugin update gp@sonub-skills
2. Agent khác: đặt nó vào thư mục kỹ năng người dùng DIR của bạn (Codex, Gemini CLI, Copilot CLI: ~/.agents/skills).
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. Chạy: python3 <thư mục kỹ năng>/scripts/gp.py doctor — và sửa những gì nó báo (cài gh, gh auth login, gh auth refresh -s project,repo).
4. Cho tôi biết ngắn gọn những gì đã được cài, kết quả của doctor, và rằng giờ tôi có thể nói những câu như "cho tôi xem các GitHub project của tôi".
```

**Claude Code — hai dòng trong terminal** (chạy được ở mọi phiên bản):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

Trong khung chat, gõ `/plugin marketplace add thruthesky/sonub-skills` rồi `/plugin install gp@sonub-skills`. Các phiên bản mới hơn cũng chấp nhận một dòng: `claude plugin install gp --marketplace thruthesky/sonub-skills`. Sau khi cài từ terminal, hãy chạy `/reload-plugins` trong khung chat đang mở (hoặc khởi động lại).

**Mọi agent — sao chép thư mục** vào thư mục kỹ năng của agent:

| Công cụ | Thư mục kỹ năng người dùng | Thư mục kỹ năng dự án |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

### Lần chạy đầu tiên

Hãy nhờ agent *"thiết lập gp"* (Claude Code: `/gp:gp`, Codex: `$gp`). Agent sẽ chạy:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · đã đăng nhập ✓ · quyền ✓ · bảng mặc định
gh auth login                                   # chỉ khi chưa đăng nhập — nhập mã dùng một lần trong trình duyệt
gh auth refresh -s project,repo                 # chỉ khi thiếu quyền
python3 scripts/gp.py projects                  # các bảng của bạn
python3 scripts/gp.py use <owner> <number>      # chọn một bảng … hoặc tạo bảng mới:
python3 scripts/gp.py project-create --title "Công việc của tôi" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Cách dùng — cứ nói ra

| Bạn nói | Agent chạy |
|------|------|
| "Tạo issue: nút đăng nhập không phản hồi trên iPhone. Các bước: tái hiện, sửa, kiểm thử. Đính kèm shot.png" | `create --repo app --title "…" --todo "tái hiện" --todo sửa --todo "kiểm thử" --image shot.png` → cột Todo |
| "Chuyển sang đang làm" · "Chuyển #12 sang Review" | `move app#12 doing` · `move app#12 review` |
| "Xong rồi!" | `close app#12` — đóng issue và chuyển nó sang Done |
| "Thêm 'cập nhật tài liệu' vào TODO của nó" · "đánh dấu mục đầu tiên" | `todo app#12 add "cập nhật tài liệu"` · `todo app#12 done 1` |
| "Thêm cột Urgent ở đầu" · "Đổi tên Review thành QA" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "Giao cho alice" · "Mời bob vào kho" | `assign app#12 alice` · `invite bob --repo app` (hỏi trước) |
| "Tôi đang có những việc gì?" | `list --assignee @me --state open`, rồi gợi ý một việc nên làm tiếp |
| "Ghi một ý tưởng lên bảng: chế độ tối" | `create --draft --title "chế độ tối"` |
| "Thêm trường Priority" | `field-add Priority --type single_select --options "High,Medium,Low"` |

Tất cả lệnh: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### Cách hoạt động

- **Chỉ dùng `gh` và thư viện chuẩn của Python.** gh được gọi với một danh sách đối số (không qua shell), còn tiêu đề và nội dung được truyền qua stdin — dấu ngoặc kép, emoji và xuống dòng không bao giờ bị hỏng.
- **Tìm ID theo tên.** ID của trường, cột và tùy chọn được tra cứu mỗi lần chạy, nên bạn có thể đổi tên cột trên trang web mà không làm hỏng gì. Khi đổi tên cột, các thẻ trong cột vẫn được giữ nguyên.
- **Mọi thay đổi đều được đọc lại.** Sau mỗi thay đổi, script in ra một dòng `check:` với trạng thái thực trên GitHub (trạng thái, cột, người được giao, nhãn). Agent báo cáo dựa trên dòng đó.
- **Hình ảnh** dùng `--attach` của gh (GitHub user-attachments). Với gh phiên bản cũ, hình ảnh được commit vào nhánh `gp-assets` của kho chứa issue rồi gắn liên kết.
- **An toàn theo mặc định.** Mọi lệnh thay đổi dữ liệu đều có `--dry-run`. Xóa issue, bảng, trường hoặc cột còn thẻ cần `--yes`, và kỹ năng yêu cầu agent hỏi bạn trước. Lời mời (sẽ gửi e-mail đến một người thật) cũng được hỏi trước.
- **Bảng mặc định** được lưu trong `~/.config/gp/config.json`; có thể ghi đè bằng `--owner/--number` hoặc `GP_OWNER`/`GP_PROJECT`.

Lưu ý: ngay sau khi tạo issue, danh sách project của GitHub có thể mất vài giây mới hiển thị nó. Dòng `check:` đọc trực tiếp issue nên luôn là trạng thái mới nhất.

### Cập nhật và gỡ bỏ

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Agent khác: chạy lại dòng `curl … | tar` để cập nhật; xóa thư mục `gp` để gỡ bỏ.

### Cấu trúc kho

```
.claude-plugin/marketplace.json   ← marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← kỹ năng: khi nào dùng và dùng thế nào
├─ .claude-plugin/plugin.json     ← thông tin plugin (chỉ dành cho Claude Code; công cụ khác bỏ qua)
├─ scripts/gp.py                  ← công cụ
└─ references/                    ← đọc khi cần
   ├─ github-projects.md          ← khái niệm, tài khoản, đăng nhập, bảng đầu tiên
   └─ commands.md                 ← mọi lệnh + công thức dùng gh / GraphQL thuần
```

Tìm hiểu cách kỹ năng hoạt động trong chương **Agent Skills** của khóa học AI SONUB: https://sonub.com/vi/learn/ai#agent-skill

Giấy phép: [MIT](LICENSE)
