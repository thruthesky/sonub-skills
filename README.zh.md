# sonub-skills — 来自 SONUB 的 Agent Skills

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · **中文** · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

这个仓库是一个 **技能市场**。每个技能都是标准的 [Agent Skill](https://agentskills.io)（一个包含 `SKILL.md` 的文件夹），所以可以在 Claude Code、Codex、Gemini CLI、GitHub Copilot CLI 以及任何能读取 Agent Skills 的智能体中使用。Claude Code 还可以从这个市场（`sonub-skills`）把它作为插件安装，这样更新只需要一条命令。

| 技能 | 作用 |
|------|------|
| [`gp`](skills/gp) | 用 git 和 `gh` CLI 在 **GitHub Projects** 中管理你的所有工作 |

---

## gp — 把你的所有工作放到 GitHub Project 看板上

你只需用平常的话告诉 AI 智能体 —— *"建一个 issue：在 iPhone 上点登录按钮没反应，附上这张截图"*、*"移到 Done"*、*"加一个 Review 列"*、*"我手上有哪些事？"* —— 智能体就会用 `gh` 在你的 GitHub Project 看板上完成操作，然后重新读取结果进行确认。

### 涵盖的内容

- **GitHub Projects 讲解** —— 仓库（repository）、issue、项目（看板）、条目（item）、草稿（draft）、字段（field）、Status = 列、视图（view）、工作流（workflow）。智能体可以用你的语言来讲解。
- **账号与登录** —— 注册新 GitHub 账号的步骤、安装 `gh`、`gh auth login`、`project` 和 `repo` 权限范围（scope）。
- **看板** —— 创建、改名、写说明、设为公开/私有、关闭/重新打开、删除、关联仓库、列出你的看板、选择默认看板。
- **列（看板列）** —— 添加、改名（卡片保持不动）、调整顺序、设置颜色、删除（先把卡片移到别的列）。
- **字段与视图** —— 自定义字段（文本、数字、日期、单选），带筛选的看板/表格/路线图视图。
- **Issue** —— 创建（放入某一列，并带上标签、里程碑、父 issue、自定义字段）、编辑、在列之间移动、关闭（移到 Done）、重新打开、评论、从看板移除、归档、删除。
- **图片** —— 在 issue 正文或评论中附上截图或视频。
- **TODO** —— issue 里的 `- [ ]` 清单：添加、勾选、取消勾选、删除；在列表中显示进度。临时想法可以先记成草稿条目，以后再转成 issue。
- **成员** —— 指派和取消指派负责人、查看谁负责什么、邀请协作者加入仓库并分配看板角色。

### 准备条件

- 一个 GitHub 账号（免费）。还没有账号？到 https://github.com/signup 注册 —— 输入邮箱验证码、完成拼图验证、选择 Free 套餐（大约三分钟）。
- [`gh`](https://cli.github.com) —— GitHub CLI（macOS `brew install gh`，Windows `winget install GitHub.cli`），并以 `project` 和 `repo` 权限范围登录。
- Python 3.8 或更高版本（只用标准库）。

### 安装

**最简单 —— 交给智能体来做。** 把下面这个框里的内容复制到 Claude Code、Codex、Gemini CLI 或 Copilot CLI 中发送：

```text
请从 thruthesky/sonub-skills 仓库安装 gp 技能。
技能路径：https://github.com/thruthesky/sonub-skills/tree/main/skills/gp —— 这是一个标准的 Agent Skill（包含 SKILL.md 的文件夹）。

1. 如果你是 Claude Code，请把它作为插件安装，按顺序运行下面的命令（忽略“already added”之类的错误）：
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - 如果已经安装过，请改为运行：claude plugin update gp@sonub-skills
2. 其他智能体：把它放到你的用户技能文件夹 DIR 中（Codex、Gemini CLI、Copilot CLI：~/.agents/skills）。
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. 运行：python3 <技能文件夹>/scripts/gp.py doctor —— 并修复它报告的问题（安装 gh、gh auth login、gh auth refresh -s project,repo）。
4. 简短告诉我安装了什么、doctor 的结果，以及我现在可以说“显示我的 GitHub 项目”之类的话来使用它。
```

**Claude Code —— 在终端里输入两行**（所有版本都可用）：

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

在对话中使用 `/plugin marketplace add thruthesky/sonub-skills`，然后 `/plugin install gp@sonub-skills`。较新的版本也支持一行完成：`claude plugin install gp --marketplace thruthesky/sonub-skills`。在终端中安装后，请在已打开的对话中运行 `/reload-plugins`（或重新启动）。

**任何智能体 —— 复制文件夹** 到智能体的技能文件夹中：

| 工具 | 用户技能文件夹 | 项目技能文件夹 |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

### 首次运行

对智能体说 *"设置 gp"*（Claude Code：`/gp:gp`，Codex：`$gp`）。它会运行：

```bash
python3 scripts/gp.py doctor                    # gh ✓ · 已登录 ✓ · 权限范围 ✓ · 默认看板
gh auth login                                   # 仅在未登录时 —— 在浏览器中输入一次性代码
gh auth refresh -s project,repo                 # 仅在缺少权限范围时
python3 scripts/gp.py projects                  # 你的看板
python3 scripts/gp.py use <owner> <number>      # 选一个……或者新建一个：
python3 scripts/gp.py project-create --title "我的工作" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### 使用方法 —— 直接说出来

| 你说 | 智能体运行 |
|------|------|
| "建一个 issue：在 iPhone 上点登录按钮没反应。步骤：复现、修复、测试。附上 shot.png" | `create --repo app --title "…" --todo 复现 --todo 修复 --todo 测试 --image shot.png` → Todo 列 |
| "改成进行中" · "把 #12 移到 Review" | `move app#12 doing` · `move app#12 review` |
| "完成了！" | `close app#12` —— 关闭 issue 并移到 Done |
| "在它的 TODO 里加上'更新文档'" · "勾选第一项" | `todo app#12 add "更新文档"` · `todo app#12 done 1` |
| "在最前面加一个 Urgent 列" · "把 Review 改名为 QA" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "交给 alice" · "邀请 bob 加入仓库" | `assign app#12 alice` · `invite bob --repo app`（会先询问） |
| "我手上有哪些事？" | `list --assignee @me --state open`，然后推荐一项接下来要做的事 |
| "在看板上记个想法：深色模式" | `create --draft --title "深色模式"` |
| "加一个 Priority 字段" | `field-add Priority --type single_select --options "High,Medium,Low"` |

全部命令：[skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`。

### 工作原理

- **只用 `gh` 和 Python 标准库。** 调用 gh 时传入参数列表（不经过 shell），标题和正文通过标准输入（stdin）传递 —— 引号、表情符号和换行都不会出错。
- **按名称查找 ID。** 每次运行都会重新查找字段、列和选项的 ID，所以你在网站上给列改名也不会出问题。列改名后，卡片仍留在该列。
- **每次修改都会读回确认。** 修改之后，脚本会输出一行 `check:`，显示 GitHub 上的真实状态（状态、列、负责人、标签）。智能体根据这一行来汇报。
- **图片** 使用 gh 的 `--attach`（GitHub user-attachments）。如果 gh 版本较旧，图片会提交到该 issue 所在仓库的 `gp-assets` 分支并加上链接。
- **默认安全。** 每个会做修改的命令都有 `--dry-run`。删除 issue、看板、字段或带卡片的列需要 `--yes`，并且技能会要求智能体先征求你的同意。邀请（会给真实的人发邮件）也会先询问。
- **默认看板** 保存在 `~/.config/gp/config.json`；可以用 `--owner/--number` 或 `GP_OWNER`/`GP_PROJECT` 覆盖。

注意：刚创建 issue 后，GitHub 的项目列表可能要过几秒才会显示它。`check:` 这一行是直接读取 issue 的，所以总是最新的。

### 更新与卸载

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

其他智能体：再次运行 `curl … | tar` 那一行即可更新；删除 `gp` 文件夹即可卸载。

### 仓库结构

```
.claude-plugin/marketplace.json   ← 技能市场（Claude Code）
skills/gp/
├─ SKILL.md                       ← 技能本身：何时使用、如何使用
├─ .claude-plugin/plugin.json     ← 插件信息（仅 Claude Code 使用；其他工具会忽略）
├─ scripts/gp.py                  ← 工具
└─ references/                    ← 需要时阅读
   ├─ github-projects.md          ← 概念、账号、登录、第一个看板
   └─ commands.md                 ← 所有命令 + 直接使用 gh / GraphQL 的示例
```

在 SONUB AI 课程的 **Agent Skills** 章节中了解技能是如何工作的：https://sonub.com/zh/learn/ai#agent-skill

许可证：[MIT](LICENSE)
