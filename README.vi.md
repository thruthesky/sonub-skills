# sonub-skills — Agent Skills từ SONUB

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · **Tiếng Việt** · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

Kho lưu trữ này là một **chợ kỹ năng (skill marketplace)**. Mỗi kỹ năng là một [Agent Skill](https://agentskills.io) tiêu chuẩn — một thư mục chứa `SKILL.md` — nên nó chạy được trong Claude Code, Codex, Gemini CLI, GitHub Copilot CLI và mọi agent khác đọc được Agent Skills. Claude Code còn có thể cài nó dưới dạng plugin từ marketplace này (`sonub-skills`), nhờ đó việc cập nhật chỉ cần một lệnh.

| Kỹ năng | Chức năng |
|------|------|
| [`gp`](skills/gp) | Quản lý mọi công việc của bạn trong **GitHub Projects** bằng git và `gh` CLI |
| [`claude-skill`](skills/claude-skill) | **Học Claude Code và dùng nó giỏi hơn** — 14 bài học kèm câu đố, câu trả lời được đối chiếu với tài liệu chính thức, công cụ kiểm tra cài đặt (doctor), tóm tắt mọi tính năng mới trong CHANGELOG, và `/claude-skill update` để cập nhật tính năng mới (tên plugin `cc-skill`) |
| [`popup`](skills/popup) | **Giải thích thuật ngữ bằng popup khi rê chuột** trên các trang và tài liệu của bất kỳ dự án nào — nghĩa, lời lẽ dễ hiểu, ví dụ, mã nguồn, thuật ngữ liên quan và liên kết "tìm hiểu thêm" tới các trang của chính bạn, tất cả từ một tệp JSON bảng thuật ngữ |

## Cài đặt — toàn cục (người dùng) hoặc theo dự án

Mọi kỹ năng đều được cài theo cùng một cách. Thay `<plugin>` bằng tên plugin trong bảng (`gp`, `cc-skill`, `popup`).

**Bước 1 — thêm marketplace (mỗi máy tính một lần)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**Bước 2 — cài ở nơi bạn muốn**

| Phạm vi | Lệnh | Ai dùng được, ở đâu | Ghi vào |
|------|------|------|------|
| **Toàn cục (người dùng)** — mặc định | `claude plugin install <plugin>@sonub-skills` | bạn, trong mọi dự án trên máy tính này | `~/.claude/settings.json` |
| **Dự án (dùng chung với nhóm)** | trong thư mục dự án: `claude plugin install <plugin>@sonub-skills --scope project` | mọi người làm việc trong kho này | `.claude/settings.json` (hãy commit tệp này) |
| **Cục bộ (chỉ bạn, chỉ dự án này)** | trong thư mục dự án: `claude plugin install <plugin>@sonub-skills --scope local` | bạn, chỉ trong kho này | `.claude/settings.local.json` |

- Trong khung chat, `/plugin install <plugin>@sonub-skills` mở một màn hình để bạn chọn phạm vi. Nếu bạn cài từ terminal, hãy chạy `/reload-plugins` trong khung chat đang mở.
- Kiểm tra: `claude plugin list` (hiển thị cả phạm vi). Cập nhật: `claude plugin marketplace update sonub-skills && claude plugin update <plugin>@sonub-skills`. Gỡ bỏ: `claude plugin uninstall <plugin>@sonub-skills`.
- Khi cùng một plugin được đặt ở nhiều phạm vi, cục bộ được ưu tiên hơn dự án, và dự án được ưu tiên hơn toàn cục.

**Để đồng đội tự động có nó** — hãy commit đoạn sau vào `.claude/settings.json` của kho. Sau khi đồng đội tin cậy (trust) thư mục, Claude Code sẽ tự thêm marketplace và cài các plugin.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**Không dùng plugin — sao chép thư mục** vào thư mục kỹ năng của agent (`<kỹ năng>` = `gp`, `claude-skill` hoặc `popup`).

| Công cụ | Toàn cục (người dùng) | Dự án |
|------|------|------|
| Claude Code | `~/.claude/skills/<kỹ năng>` | `<dự án>/.claude/skills/<kỹ năng>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<kỹ năng>` | `<dự án>/.agents/skills/<kỹ năng>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # chỉ dự án này: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**Dễ nhất** — hãy nói với agent *"cài plugin cc-skill từ thruthesky/sonub-skills ở phạm vi toàn cục"* (hoặc *"chỉ cho dự án này"*), agent sẽ chạy các lệnh trên giúp bạn.

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
   - Nếu tôi yêu cầu "chỉ cho dự án này", hãy chạy dòng cuối trong thư mục dự án và thêm --scope project.
   - Nếu đã cài rồi, hãy chạy lệnh này thay thế: claude plugin update gp@sonub-skills
2. Agent khác: đặt nó vào thư mục kỹ năng DIR — mọi dự án: ~/.agents/skills, chỉ dự án này: <dự án>/.agents/skills.
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

#### Cài toàn cục và cài cục bộ (theo dự án)

| | Toàn cục — mọi dự án | Cục bộ — chỉ dự án này |
|------|------|------|
| Plugin Claude Code | `claude plugin install gp@sonub-skills` | trong thư mục dự án: `claude plugin install gp@sonub-skills --scope project` (ghi vào `.claude/settings.json`, dùng chung với nhóm · chỉ riêng bạn: `--scope local`) |
| Sao chép thư mục cho Claude Code | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| Bảng sử dụng | `/gp init <URL bảng> --global` → `~/.config/gp/config.json` | `/gp init <URL bảng>` → `<dự án>/.gp.json` |

Nơi cài kỹ năng và bảng mà nó dùng được chọn riêng. Thông thường bạn cài kỹ năng toàn cục một lần, rồi chỉ định bảng cho từng dự án bằng `/gp init <URL bảng>`.

### Lần chạy đầu tiên

Hãy nhờ agent *"thiết lập gp"* (Claude Code: `/gp:gp`, Codex: `$gp`). Agent sẽ chạy:

```bash
python3 scripts/gp.py doctor                    # gh ✓ · đã đăng nhập ✓ · quyền ✓ · bảng mặc định
gh auth login                                   # chỉ khi chưa đăng nhập — nhập mã dùng một lần trong trình duyệt
gh auth refresh -s project,repo                 # chỉ khi thiếu quyền
python3 scripts/gp.py projects                  # các bảng của bạn
python3 scripts/gp.py init <URL bảng>           # bảng của dự án này (.gp.json) · mọi dự án: --global … hoặc tạo bảng mới:
python3 scripts/gp.py project-create --title "Công việc của tôi" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### Chọn bảng — `/gp init`

Mỗi dự án phát triển có thể có bảng GitHub Project riêng. Đưa địa chỉ bảng cho agent trong thư mục dự án, công việc của dự án đó sẽ được quản lý trên bảng đó.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Nếu cài dưới dạng plugin Claude Code: `/gp:gp init …`; Codex: `$gp init …`. Nói "dùng https://… làm bảng của dự án này" cũng được.

- **Cục bộ (mặc định)** — bên trong một kho git, bảng được lưu vào `<thư mục gốc của kho>/.gp.json` và chỉ dùng trong dự án đó (kể cả các thư mục con). Tệp này không chứa bí mật: hãy commit để đồng đội dùng cùng một bảng, hoặc thêm vào `.gitignore` để giữ riêng cho bạn.
- **Toàn cục** — `/gp init <URL> --global` (hoặc "đặt làm bảng mặc định cho mọi dự án") → `~/.config/gp/config.json`, dùng ở mọi thư mục không có `.gp.json`.
- Trang nào của bảng cũng được (`/views/2`, bảng của người dùng `/users/…`, bảng của tổ chức `/orgs/…`). Trước khi lưu, bảng được kiểm tra xem có tồn tại và đọc được không.
- Chỉ gõ `/gp init` sẽ hiển thị bảng đang dùng và tệp cài đặt của nó. Xóa: `gp.py init --unset` (toàn cục: `--unset --global`).
- Thứ tự chọn bảng: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → `.gp.json` của dự án → cài đặt toàn cục.

### Cách dùng — cứ nói ra

| Bạn nói | Agent chạy |
|------|------|
| "Tạo issue: nút đăng nhập không phản hồi trên iPhone. Các bước: tái hiện, sửa, kiểm thử. Đính kèm shot.png" | `create --repo app --title "…" --todo "tái hiện" --todo sửa --todo "kiểm thử" --image shot.png` → cột Todo |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → lưu làm bảng của dự án này (`.gp.json`) |
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
- **Cài đặt bảng** được lưu cho từng dự án trong `.gp.json` (cục bộ) và cho mọi dự án trong `~/.config/gp/config.json` (toàn cục). `--owner/--number` hoặc `GP_OWNER`/`GP_PROJECT` được ưu tiên hơn cả hai.

Lưu ý: ngay sau khi tạo issue, danh sách project của GitHub có thể mất vài giây mới hiển thị nó. Dòng `check:` đọc trực tiếp issue nên luôn là trạng thái mới nhất.

### Cập nhật và gỡ bỏ

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

Agent khác: chạy lại dòng `curl … | tar` để cập nhật; xóa thư mục `gp` để gỡ bỏ.

## claude-skill — học Claude Code và dùng nó giỏi hơn

Claude Code ra phiên bản mới gần như mỗi ngày (đến nay đã hơn 400 phiên bản). Kỹ năng này dạy Claude Code theo thứ tự, trả lời câu hỏi dựa trên **tài liệu chính thức hiện hành** thay vì trí nhớ, kiểm tra cài đặt của bạn và lưu bản tóm tắt mọi tính năng mới trong CHANGELOG. Chỉ một lệnh `/claude-skill update` là đưa các tính năng vừa phát hành vào kỹ năng.

### Nội dung bao gồm

- **Lộ trình học 14 bài** — từ cài đặt và những câu lệnh đầu tiên đến quy trình khám phá → lập kế hoạch → viết code → commit, quản lý ngữ cảnh, CLAUDE.md và bộ nhớ, các chế độ quyền, điểm khôi phục (checkpoint), kỹ năng, subagent, hook, MCP, plugin và marketplace, chạy không giao diện (headless) và GitHub Actions, cùng những việc dài chạy không cần trông kèm bước kiểm chứng. Bài nào cũng có **bài tập ngay trong dự án của bạn** và câu hỏi kiểm tra, tiến độ của bạn được lưu lại.
- **Phân tích Claude Academy** — 64 bài hướng dẫn về Claude trên [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) cùng các bài hướng dẫn và khóa học Claude Code (Claude Code 101, Claude Code in action, Agent Skills, Subagents); những gì bạn học trong chat (Projects, bộ nhớ, connector, kỹ năng, Research, chọn mô hình và mức nỗ lực (effort)…) được đối chiếu với cách làm tương ứng trong Claude Code.
- **Câu trả lời được đối chiếu với tài liệu** — với những câu như "hook hoạt động thế nào?" hay "phạm vi (scope) của plugin là gì?", kỹ năng tìm và đọc code.claude.com rồi trả lời kèm lệnh, ví dụ và liên kết tài liệu.
- **Mọi tính năng mới trong CHANGELOG** — toàn bộ 422 phiên bản của [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) (v0.2.21 – v2.1.302), bỏ qua các bản sửa lỗi, tóm tắt thành 14 chủ đề, kèm 30 tính năng nên biết và những bổ sung mới nhất.
- **`/claude-skill update`** — tải CHANGELOG mới nhất, tìm các phiên bản kỹ năng chưa bao quát, thêm tính năng của chúng vào ghi chú, bảng tra cứu nhanh và bài học, rồi ghi lại đã bao quát đến đâu.
- **Kiểm tra cài đặt (doctor)** — xem phiên bản, các tệp cài đặt (người dùng, dự án, cục bộ), độ dài CLAUDE.md, quy tắc (rules), bộ nhớ tự động, kỹ năng, subagent, plugin và máy chủ MCP của bạn, rồi gợi ý cách sửa.
- **Bảng tra cứu nhanh, mẹo và hướng dẫn tự xây dựng** — lệnh, phím tắt, cờ CLI và vị trí tệp trên một trang; những thói quen hiệu quả; cách tạo kỹ năng, subagent, hook, máy chủ MCP, plugin và marketplace.

### Cài đặt

Như phần [Cài đặt](#cài-đặt--toàn-cục-người-dùng-hoặc-theo-dự-án) ở trên. Plugin có tên **`cc-skill`** (Claude Code dành riêng các tên plugin bắt đầu bằng `claude-` cho plugin của chính Anthropic). Kỹ năng vẫn giữ tên `claude-skill`, nên bạn gọi nó bằng `/claude-skill`.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # toàn cục — mọi dự án
claude plugin install cc-skill@sonub-skills --scope project    # dự án này, dùng chung với nhóm
```

Cần Python 3.8 trở lên và kết nối internet (kỹ năng đọc tài liệu chính thức và CHANGELOG).

### Cách dùng

| Bạn nói | Kỹ năng làm |
|------|------|
| `/claude-skill` · "học Claude Code nào" | Hiển thị các bài học và tiến độ của bạn, bắt đầu bài tiếp theo |
| `/claude-skill lesson 5` · "bài tiếp theo" | Dạy bài đó, làm bài tập trong dự án của bạn, hỏi câu kiểm tra, lưu tiến độ |
| `/claude-skill quiz` | Năm câu hỏi từ những gì bạn đã học, lần lượt từng câu, có chấm điểm |
| "Làm sao dùng hook để chạy prettier sau mỗi lần sửa?" | Đọc tài liệu chính thức và trả lời kèm ví dụ cấu hình và liên kết |
| `/claude-skill new` · "có gì mới?" | Những tính năng mới hữu ích nhất trước, mỗi cái kèm cách dùng thử |
| `/claude-skill doctor` · "kiểm tra cài đặt của tôi" | Rà soát cài đặt và đề xuất cách sửa (hỏi trước khi thay đổi bất cứ điều gì) |
| `/claude-skill tips` · `cheatsheet` · `academy` | Thói quen hiệu quả · lệnh và phím tắt · bài phân tích Academy |
| `/claude-skill build skill` · "tạo cho tôi một hook" | Chọn cơ chế phù hợp và cùng bạn xây dựng nó trong dự án |
| `/claude-skill update` | Làm mới ghi chú tính năng của kỹ năng từ CHANGELOG mới nhất |

Nếu cài dưới dạng plugin, `/cc-skill:claude-skill …` cũng dùng được. Codex: `$claude-skill …`.

### Cách `/claude-skill update` hoạt động

1. `scripts/cc.py update-check` so sánh phiên bản mà ghi chú đã bao quát (dấu `covered-through` trong `references/changelog-features.md`) với phiên bản mới nhất trong CHANGELOG.
2. Với bản sao plugin đã cài, trước tiên nó chạy `claude plugin update cc-skill@sonub-skills` để lấy ghi chú đã phát hành. Để sửa mã nguồn của kỹ năng (một bản git checkout), hãy truyền `--source <thư mục>`. Không có mã nguồn thì nó ghi vào `~/.config/claude-skill/changelog-local.md`, tệp này vẫn còn sau khi cập nhật plugin.
3. `cc.py changelog --since <phiên bản đã bao quát>` liệt kê các mục của phiên bản mới (ẩn bản sửa lỗi); agent thêm tính năng mới vào đúng chủ đề, viết lại phần "Bổ sung mới nhất", thêm lệnh và phím tắt mới vào bảng tra cứu nhanh và sửa những bài học đã trở nên sai.
4. `cc.py mark-covered <phiên bản mới nhất>` dời dấu bao quát; trong bản git checkout, nó tăng số phiên bản và commit (chỉ push khi bạn yêu cầu).
5. Cuối cùng, nó báo khoảng phiên bản đã bao quát và 3–7 tính năng mới đáng thử, kèm cách thử từng cái.

### Công cụ — `scripts/cc.py`

Chỉ dùng thư viện chuẩn của Python.

```bash
python3 scripts/cc.py doctor                 # kiểm tra cài đặt Claude Code + lời khuyên
python3 scripts/cc.py docs hooks             # tìm trong tài liệu chính thức (llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # đọc một mục của trang
python3 scripts/cc.py changelog --count 5    # 5 phiên bản mới nhất (ẩn bản sửa lỗi)
python3 scripts/cc.py changelog --grep worktree --count 400   # tìm tính năng theo tên
python3 scripts/cc.py update-check           # phiên bản đã bao quát so với mới nhất
python3 scripts/cc.py lessons                # bài học và tiến độ
```

## popup — giải thích mọi từ khó ngay tại nơi người đọc gặp nó

Người đọc chỉ cần vấp ở một từ lạ — "token", "endpoint", "idempotent" — là mất mạch cả đoạn văn. Kỹ năng này gắn một tấm thẻ nhỏ lên đúng từ đó: rê chuột vào (trên điện thoại thì chạm, với bàn phím thì focus), thẻ sẽ giải thích thuật ngữ theo từng lớp — nghĩa trong một dòng, lời giải thích ngắn, một phép so sánh đời thường, các dòng ví dụ, một đoạn mã nguồn, các thuật ngữ liên quan và **liên kết "tìm hiểu thêm" tới một trang khác trong chính dự án của bạn**. Dùng được trong mọi dự án: trang web tĩnh, công cụ sinh tài liệu, ứng dụng một trang (SPA), trang web render phía máy chủ và cả Markdown thuần đọc trên GitHub.

### Nội dung bao gồm

- **Một bảng thuật ngữ, một nơi duy nhất** — mọi lời giải thích nằm trong một tệp JSON (hoặc mỗi ngôn ngữ một tệp); các trang chỉ trỏ tới id của thuật ngữ, nên cùng một từ luôn được giải thích giống nhau ở mọi nơi.
- **Bộ công cụ dùng ngay** — `popup.js` và `popup.css`, không framework, không bước build. Văn bản thường bên trong `main`/`article` được bọc tự động (lần dùng đầu tiên trên mỗi trang); có markup tường minh cho cụm từ, câu, nút "?" và liên kết xem trước khi rê chuột. Mỗi trang một thẻ, nhấp để ghim, các chip liên quan chuyển ngay tại chỗ, Esc trả focus về chỗ cũ, dạng bottom sheet trên điện thoại, hỗ trợ ngôn ngữ viết từ phải sang trái, chế độ tối, tùy biến giao diện bằng biến CSS.
- **Khớp từ thông minh** — cách viết dài nhất được ưu tiên, ranh giới từ theo từng hệ chữ viết (Latin, Cyrillic, tiểu từ tiếng Hàn, tiền tố tiếng Ả Rập, CJK), thuật ngữ chỉ áp dụng trong một phần (`scope`), tên lệnh phân biệt chữ hoa/thường.
- **Quy tắc viết** — cách viết một tấm thẻ mà người mới đọc một lần là hiểu, bằng mọi ngôn ngữ dự án phát hành: mỗi trường dùng để làm gì, độ dài, một phép so sánh, sự kiện đã kiểm chứng, có ví dụ thật thì luôn thêm.
- **Công cụ** — `popup.py check` kiểm tra bảng thuật ngữ (mọi ngôn ngữ, mã ví dụ giống hệt nhau ở các ngôn ngữ, id liên quan, đích của liên kết "tìm hiểu thêm" có tồn tại, trùng cách viết); `audit` cho biết một tài liệu đã dùng những thuật ngữ nào và tìm các từ chuyên môn chưa có mục; `add` gộp thuật ngữ mới một cách an toàn; `md` + `link` biến bảng thuật ngữ thành `GLOSSARY.md` và gắn liên kết ở lần dùng đầu tiên trong các tệp Markdown của bạn, với nghĩa làm tiêu đề khi rê chuột.
- **SONUB** — bên trong kho SONUB, kỹ năng xây trên bảng thuật ngữ Laravel của chính SONUB (17 ngôn ngữ, giọng nói của gia sư AI) thay vì thêm một hệ thống thứ hai.

### Cài đặt

Như phần [Cài đặt](#cài-đặt--toàn-cục-người-dùng-hoặc-theo-dự-án) ở trên, với tên plugin **`popup`**.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # toàn cục — mọi dự án
claude plugin install popup@sonub-skills --scope project    # dự án này, dùng chung với nhóm
```

Công cụ cần Python 3.8+. Bộ popup chạy được trên mọi trình duyệt hiện đại.

### Cách dùng

| Bạn nói | Kỹ năng làm |
|------|------|
| `/popup docs/getting-started.md` · "thêm popup thuật ngữ cho trang này" | Tìm các từ khó, viết các mục, nối bộ popup vào trang, kiểm tra trong trình duyệt |
| `/popup token, sampling, temperature` | Viết ba mục đó và gắn vào những chỗ chúng được dùng |
| "giải thích các mục menu khi rê chuột" | Thêm bản xem trước khi rê chuột cho các liên kết, kèm nút "?" cho điện thoại và bàn phím |
| "làm cho README thân thiện với người mới" | Tạo `GLOSSARY.md` và gắn liên kết ở lần dùng đầu tiên của mỗi thuật ngữ, với nghĩa hiện khi rê chuột |
| "dịch bảng thuật ngữ sang tiếng Nhật" | Thêm `ja` vào mọi mục và kiểm tra không thiếu mục nào |

Nếu cài dưới dạng plugin, `/popup:popup …` cũng dùng được. Codex: `$popup …`.

### Công cụ — `scripts/popup.py`

Chỉ dùng thư viện chuẩn của Python.

```bash
python3 scripts/popup.py init popup --locales en,ko   # chép popup.js/css, tạo glossary.json, ghi .popup.json
python3 scripts/popup.py audit docs                   # thuật ngữ dùng trong từng tệp + từ chuyên môn chưa có mục
python3 scripts/popup.py add new-terms.json --dry-run # gộp thuật ngữ mới (có kiểm tra, không bao giờ ghi đè âm thầm)
python3 scripts/popup.py check                        # kiểm tra bảng thuật ngữ
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # Markdown trên GitHub
```

Sau đó thêm hai thẻ vào layout của bạn:

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## Cấu trúc kho

```
.claude-plugin/marketplace.json   ← marketplace (Claude Code)
skills/gp/
├─ SKILL.md                       ← kỹ năng: khi nào dùng và dùng thế nào
├─ .claude-plugin/plugin.json     ← thông tin plugin (chỉ dành cho Claude Code; công cụ khác bỏ qua)
├─ scripts/gp.py                  ← công cụ
└─ references/                    ← đọc khi cần
   ├─ github-projects.md          ← khái niệm, tài khoản, đăng nhập, bảng đầu tiên
   └─ commands.md                 ← mọi lệnh + công thức dùng gh / GraphQL thuần
skills/claude-skill/
├─ SKILL.md                       ← kỹ năng: khi nào dùng và dùng thế nào
├─ .claude-plugin/plugin.json     ← thông tin plugin (tên plugin cc-skill)
├─ scripts/cc.py                  ← công cụ học: doctor, docs, read, changelog, update-check, lessons
└─ references/                    ← 14 bài học · phân tích Academy · tính năng trong CHANGELOG · bảng tra cứu nhanh · hướng dẫn xây dựng · mẹo · câu đố
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← kỹ năng: khi nào dùng và dùng thế nào
├─ .claude-plugin/plugin.json     ← thông tin plugin
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← công cụ chỉ dành cho SONUB (bảng thuật ngữ Laravel)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

Tìm hiểu cách kỹ năng hoạt động trong chương **Agent Skills** của khóa học AI SONUB: https://sonub.com/vi/learn/ai#agent-skill

Giấy phép: [MIT](LICENSE)
