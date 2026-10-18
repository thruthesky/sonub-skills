# sonub-skills — 来自 SONUB 的 Agent Skills

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · **中文** · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

这个仓库是一个 **技能市场**。每个技能都是标准的 [Agent Skill](https://agentskills.io)（一个包含 `SKILL.md` 的文件夹），所以可以在 Claude Code、Codex、Gemini CLI、GitHub Copilot CLI 以及任何能读取 Agent Skills 的智能体中使用。Claude Code 还可以从这个市场（`sonub-skills`）把它作为插件安装，这样更新只需要一条命令。

| 技能 | 作用 |
|------|------|
| [`gp`](skills/gp) | 用 git 和 `gh` CLI 在 **GitHub Projects** 中管理你的所有工作 |
| [`claude-skill`](skills/claude-skill) | **学习 Claude Code，把它用得更好** —— 14 节课程和小测验、对照官方文档核实的回答、环境检查、CHANGELOG 中所有新功能的总结，以及用 `/claude-skill update` 引入新功能（插件名 `cc-skill`） |

## 安装 —— 全局（用户）或按项目

所有技能的安装方法都一样。把表格中的插件名（`gp`、`cc-skill`）填到 `<插件>` 处。

**第 1 步 —— 添加技能市场（每台电脑只需一次）**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**第 2 步 —— 安装到你想用的范围**

| 范围 | 命令 | 谁能用、在哪里用 | 记录在 |
|------|------|------|------|
| **全局（用户）** —— 默认 | `claude plugin install <插件>@sonub-skills` | 你自己，在这台电脑的所有项目中 | `~/.claude/settings.json` |
| **项目（与团队共享）** | 在项目文件夹中：`claude plugin install <插件>@sonub-skills --scope project` | 在这个仓库中工作的所有人 | `.claude/settings.json`（请提交它） |
| **本地（只有自己、只在此项目）** | 在项目文件夹中：`claude plugin install <插件>@sonub-skills --scope local` | 你自己，只在这个仓库中 | `.claude/settings.local.json` |

- 在对话中输入 `/plugin install <插件>@sonub-skills`，会打开一个选择安装范围的界面。如果是在终端中安装的，请在已打开的对话中运行 `/reload-plugins`。
- 查看：`claude plugin list`（会显示范围）。更新：`claude plugin marketplace update sonub-skills && claude plugin update <插件>@sonub-skills`。卸载：`claude plugin uninstall <插件>@sonub-skills`。
- 同一个插件在多个范围中都有设置时，本地优先于项目，项目优先于全局。

**让团队成员自动获得** —— 把下面的内容提交到仓库的 `.claude/settings.json`。团队成员信任（trust）这个文件夹后，Claude Code 会自动添加技能市场并安装插件。

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true }
}
```

**不用插件 —— 复制文件夹** 到智能体的技能文件夹中（`<技能>` = `gp` 或 `claude-skill`）。

| 工具 | 全局（用户） | 项目 |
|------|------|------|
| Claude Code | `~/.claude/skills/<技能>` | `<项目>/.claude/skills/<技能>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<技能>` | `<项目>/.agents/skills/<技能>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # 仅此项目：DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**最简单** —— 对智能体说 *"从 thruthesky/sonub-skills 全局安装 cc-skill 插件"*（或 *"只装在这个项目"*），它就会替你运行上面的命令。

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
   - 如果我说“只装在这个项目”，请在项目文件夹中运行最后一行，并加上 --scope project。
   - 如果已经安装过，请改为运行：claude plugin update gp@sonub-skills
2. 其他智能体：把它放到技能文件夹 DIR 中 —— 所有项目：~/.agents/skills，仅此项目：<项目>/.agents/skills。
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

#### 全局安装与本地（项目）安装

| | 全局 —— 所有项目 | 本地 —— 仅此项目 |
|------|------|------|
| Claude Code 插件 | `claude plugin install gp@sonub-skills` | 在项目文件夹中：`claude plugin install gp@sonub-skills --scope project`（写入 `.claude/settings.json`，与团队共享 · 仅自己：`--scope local`） |
| Claude Code 复制文件夹 | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| 使用的看板 | `/gp init <看板 URL> --global` → `~/.config/gp/config.json` | `/gp init <看板 URL>` → `<项目>/.gp.json` |

技能安装在哪里和使用哪个看板是分开决定的。通常只需全局安装一次技能，然后在每个项目中用 `/gp init <看板 URL>` 指定该项目的看板。

### 首次运行

对智能体说 *"设置 gp"*（Claude Code：`/gp:gp`，Codex：`$gp`）。它会运行：

```bash
python3 scripts/gp.py doctor                    # gh ✓ · 已登录 ✓ · 权限范围 ✓ · 默认看板
gh auth login                                   # 仅在未登录时 —— 在浏览器中输入一次性代码
gh auth refresh -s project,repo                 # 仅在缺少权限范围时
python3 scripts/gp.py projects                  # 你的看板
python3 scripts/gp.py init <看板 URL>           # 本项目的看板（.gp.json）· 所有项目：--global ……或者新建一个：
python3 scripts/gp.py project-create --title "我的工作" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### 选择看板 —— `/gp init`

每个开发项目都可以有自己的 GitHub Project 看板。在项目文件夹中把看板地址告诉智能体，这个项目的工作就会放到那个看板上。

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

作为 Claude Code 插件安装时用 `/gp:gp init …`，Codex 用 `$gp init …`。也可以直接说“把 https://… 作为这个项目的看板”。

- **本地（默认）** —— 在 git 仓库中运行时，保存到 `<仓库根目录>/.gp.json`，只在该项目（及其子文件夹）中使用。其中没有任何机密：提交它，团队成员就会使用同一个看板；或者把它加入 `.gitignore`，只留给自己用。
- **全局** —— `/gp init <URL> --global`（或者说“设为所有项目的默认看板”）→ `~/.config/gp/config.json`，在所有没有 `.gp.json` 的文件夹中使用。
- 看板的任何页面地址都可以（`/views/2`、用户看板 `/users/…`、组织看板 `/orgs/…`）。保存前会检查看板是否存在且可以读取。
- 只输入 `/gp init` 会显示当前使用的看板及其设置文件。删除：`gp.py init --unset`（全局：`--unset --global`）。
- 决定使用哪个看板的顺序：`--owner/--number` → `GP_OWNER`/`GP_PROJECT` → 项目的 `.gp.json` → 全局设置。

### 使用方法 —— 直接说出来

| 你说 | 智能体运行 |
|------|------|
| "建一个 issue：在 iPhone 上点登录按钮没反应。步骤：复现、修复、测试。附上 shot.png" | `create --repo app --title "…" --todo 复现 --todo 修复 --todo 测试 --image shot.png` → Todo 列 |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → 保存为这个项目的看板（`.gp.json`） |
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
- **看板设置** 按项目保存在 `.gp.json`（本地），对所有项目则保存在 `~/.config/gp/config.json`（全局）。`--owner/--number` 或 `GP_OWNER`/`GP_PROJECT` 优先于这两者。

注意：刚创建 issue 后，GitHub 的项目列表可能要过几秒才会显示它。`check:` 这一行是直接读取 issue 的，所以总是最新的。

### 更新与卸载

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

其他智能体：再次运行 `curl … | tar` 那一行即可更新；删除 `gp` 文件夹即可卸载。

## claude-skill —— 学习 Claude Code，把它用得更好

Claude Code 几乎每天都会发布新版本（至今已超过 400 个）。这个技能会按顺序教你使用它，回答问题时查阅**当前的官方文档**而不是凭记忆，检查你的环境配置，并把 CHANGELOG 中的每个新功能整理成摘要。只需一条 `/claude-skill update`，新发布的功能就会加入技能。

### 涵盖的内容

- **14 节学习课程** —— 从安装和第一次提问，到 探索 → 计划 → 编码 → 提交、上下文管理、CLAUDE.md 与记忆、权限模式、检查点（checkpoint）、技能、子智能体（subagent）、钩子（hook）、MCP、插件与技能市场、无界面运行（headless）与 GitHub Actions，以及带验证的长时间无人值守工作。每节课都有**在你自己的项目中做的练习**和检查题，学习进度会被保存。
- **Claude Academy 分析** —— [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) 上的 64 个 Claude 教程，以及 Claude Code 的教程和课程（Claude Code 101、Claude Code in action、Agent Skills、Subagents）。把在聊天中学到的内容（Projects、记忆、连接器、技能、Research、选择模型和 effort……）对应到在 Claude Code 中的做法。
- **对照文档核实的回答** —— 对于"钩子怎么用？"或"插件范围是什么？"这样的问题，它会搜索并阅读 code.claude.com，然后用命令、示例和文档链接来回答。
- **CHANGELOG 中的每个新功能** —— [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) 的全部 422 个版本（v0.2.21 – v2.1.302），去掉 bug 修复后整理成 14 个主题，另外还挑出了值得了解的 30 个功能和最新新增的功能。
- **`/claude-skill update`** —— 获取最新的 CHANGELOG，找出技能还没涵盖的版本，把其中的功能加入笔记、速查表和课程，并记录已经涵盖到哪个版本。
- **环境检查（doctor）** —— 查看你的版本、设置文件（用户、项目、本地）、CLAUDE.md 的长度、规则、自动记忆、技能、子智能体、插件和 MCP 服务器，并给出修复建议。
- **速查表、技巧和构建指南** —— 命令、快捷键、CLI 选项和文件位置汇总在一页；好用的习惯；如何构建技能、子智能体、钩子、MCP 服务器、插件和技能市场。

### 安装

与上面的 [安装](#安装--全局用户或按项目) 相同。插件名是 **`cc-skill`**（Claude Code 把以 `claude-` 开头的插件名保留给 Anthropic 官方使用）。技能名仍然是 `claude-skill`，所以用 `/claude-skill` 来调用。

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # 全局 —— 所有项目
claude plugin install cc-skill@sonub-skills --scope project    # 此项目，与团队共享
```

需要 Python 3.8 或更高版本，以及网络连接（它会读取官方文档和 CHANGELOG）。

### 使用方法

| 你说 | 它会 |
|------|------|
| `/claude-skill` · "我们来学 Claude Code 吧" | 显示课程和你的进度，开始下一节 |
| `/claude-skill lesson 5` · "下一节课" | 讲解这节课，在你的项目中做练习，提出检查题，保存进度 |
| `/claude-skill quiz` | 从学过的内容中出 5 道题，一次一道，并打分 |
| "怎么用钩子在每次编辑后运行 prettier？" | 阅读官方文档，用配置示例和链接来回答 |
| `/claude-skill new` · "有什么新功能？" | 先介绍最近最有用的功能，并说明每个怎么试用 |
| `/claude-skill doctor` · "检查一下我的配置" | 检查你的环境并提出修复建议（修改前会先询问） |
| `/claude-skill tips` · `cheatsheet` · `academy` | 好用的习惯 · 命令和快捷键 · Academy 分析 |
| `/claude-skill build skill` · "帮我做一个钩子" | 选出合适的机制，在你的项目中和你一起构建 |
| `/claude-skill update` | 根据最新的 CHANGELOG 更新技能的功能笔记 |

作为插件安装时，也可以用 `/cc-skill:claude-skill …`。Codex：`$claude-skill …`。

### `/claude-skill update` 的工作原理

1. `scripts/cc.py update-check` 比较笔记已涵盖的版本（`references/changelog-features.md` 中的 `covered-through` 标记）和 CHANGELOG 的最新版本。
2. 如果是已安装的插件副本，它会先运行 `claude plugin update cc-skill@sonub-skills` 获取已发布的笔记。要修改技能的源码（git 检出的仓库），请传入 `--source <文件夹>`。没有源码时，它会写入 `~/.config/claude-skill/changelog-local.md`，插件更新后也会保留。
3. `cc.py changelog --since <已涵盖版本>` 列出新版本的条目（隐藏修复）；智能体把新功能加入对应的主题，重写"最新新增"，把新命令和快捷键加入速查表，并修正已经不对的课程内容。
4. `cc.py mark-covered <最新版本>` 移动标记；在 git 检出的仓库中，它会提升版本号并提交（只有在你要求时才推送）。
5. 它会汇报涵盖的版本范围，以及 3–7 个值得一试的新功能和各自的试用方法。

### 工具 —— `scripts/cc.py`

只用 Python 标准库。

```bash
python3 scripts/cc.py doctor                 # 检查你的 Claude Code 配置 + 建议
python3 scripts/cc.py docs hooks             # 搜索官方文档（llms.txt）
python3 scripts/cc.py read hooks --section "Hook events"   # 阅读页面中的一节
python3 scripts/cc.py changelog --count 5    # 最近 5 个版本（隐藏修复）
python3 scripts/cc.py changelog --grep worktree --count 400   # 按名称查找功能
python3 scripts/cc.py update-check           # 已涵盖的版本 vs 最新版本
python3 scripts/cc.py lessons                # 课程和进度
```

## 仓库结构

```
.claude-plugin/marketplace.json   ← 技能市场（Claude Code）
skills/gp/
├─ SKILL.md                       ← 技能本身：何时使用、如何使用
├─ .claude-plugin/plugin.json     ← 插件信息（仅 Claude Code 使用；其他工具会忽略）
├─ scripts/gp.py                  ← 工具
└─ references/                    ← 需要时阅读
   ├─ github-projects.md          ← 概念、账号、登录、第一个看板
   └─ commands.md                 ← 所有命令 + 直接使用 gh / GraphQL 的示例
skills/claude-skill/
├─ SKILL.md                       ← 技能本身：何时使用、如何使用
├─ .claude-plugin/plugin.json     ← 插件信息（插件名 cc-skill）
├─ scripts/cc.py                  ← 学习工具：doctor、docs、read、changelog、update-check、lessons
└─ references/                    ← 14 节课程 · Academy 分析 · CHANGELOG 功能 · 速查表 · 构建指南 · 技巧 · 测验
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
```

在 SONUB AI 课程的 **Agent Skills** 章节中了解技能是如何工作的：https://sonub.com/zh/learn/ai#agent-skill

许可证：[MIT](LICENSE)
