# sonub-skills — SONUB の Agent Skills

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · **日本語** · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

このリポジトリは **スキルマーケットプレイス** です。すべてのスキルは標準の [Agent Skill](https://agentskills.io)（`SKILL.md` が入ったフォルダ）なので、Claude Code、Codex、Gemini CLI、GitHub Copilot CLI など、Agent Skills を読み込めるあらゆるエージェントで動きます。Claude Code ではこのマーケットプレイス（`sonub-skills`）からプラグインとしてインストールでき、アップデートもコマンド一つで済みます。

| スキル | できること |
|------|------|
| [`gp`](skills/gp) | git と `gh` CLI で、あなたのすべての作業を **GitHub Projects** で管理 |

---

## gp — すべての作業を GitHub Project ボードで

AI エージェントにふだんの言葉で頼むだけです — *「issue を作って：iPhone でログインボタンが反応しない、このスクリーンショットを添付して」*、*「Done に移して」*、*「Review 列を追加して」*、*「自分の担当は何？」*。エージェントが `gh` で GitHub Project ボード上で実行し、結果を読み直して確認してから知らせます。

### できること

- **GitHub Projects の解説** — リポジトリ、issue、プロジェクト（ボード）、アイテム、ドラフト、フィールド、Status = 列、ビュー、ワークフロー。エージェントがあなたの言語で教えてくれます。
- **アカウントとログイン** — 新しい GitHub アカウントの登録手順、`gh` のインストール、`gh auth login`、`project` と `repo` のスコープ。
- **ボード** — 作成、名前の変更、説明の追加、公開/非公開、クローズ/再オープン、削除、リポジトリのリンク、自分のボード一覧、デフォルトボードの選択。
- **列（カンバン）** — 追加、名前の変更（カードはそのまま）、並べ替え、色、削除（先にカードを別の列へ移動）。
- **フィールドとビュー** — カスタムフィールド（テキスト、数値、日付、単一選択）、フィルター付きのボード/テーブル/ロードマップビュー。
- **Issue** — 作成（列・ラベル・マイルストーン・親 issue・カスタムフィールドまで指定）、編集、列の移動、クローズ（Done へ移動）、再オープン、コメント、ボードから外す、アーカイブ、削除。
- **画像** — issue 本文やコメントにスクリーンショットや動画を添付。
- **TODO** — issue の中の `- [ ]` チェックリスト：追加、チェック、チェックを外す、削除。一覧に進み具合を表示。思いついたアイデアはドラフトアイテムにメモしておき、あとで issue に変換。
- **メンバー** — 担当者の割り当てと解除、誰が何を担当しているかの確認、リポジトリへのコラボレーター招待、ボードのロール付与。

### 必要なもの

- GitHub アカウント（無料）。まだ持っていなければ https://github.com/signup で登録します — メールのコード、パズル、Free プランの選択（約 3 分）。
- [`gh`](https://cli.github.com) — GitHub CLI（macOS `brew install gh`、Windows `winget install GitHub.cli`）。`project` と `repo` のスコープでログインしておきます。
- Python 3.8 以上（標準ライブラリのみ使用）。

### インストール

**いちばん簡単 — エージェントに任せる。** 下のボックスをコピーして、Claude Code、Codex、Gemini CLI、Copilot CLI に貼り付けて送信します：

```text
thruthesky/sonub-skills リポジトリの gp スキルをインストールしてください。
スキルのパス：https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — 標準の Agent Skill（SKILL.md が入ったフォルダ）です。

1. あなたが Claude Code なら、プラグインとしてインストールします。次の順に実行してください（「already added」のようなエラーは無視）：
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - 「このプロジェクトだけ」と頼んだ場合は、プロジェクトフォルダで最後の行に --scope project を付けて実行してください。
   - すでにインストール済みなら、代わりに実行：claude plugin update gp@sonub-skills
2. それ以外のエージェント：スキルフォルダ DIR に入れます — すべてのプロジェクト：~/.agents/skills、このプロジェクトだけ：<プロジェクト>/.agents/skills。
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. 実行：python3 <スキルフォルダ>/scripts/gp.py doctor — 報告された問題を直してください（gh のインストール、gh auth login、gh auth refresh -s project,repo）。
4. 何をインストールしたか、doctor の結果、そしてこれからは「自分の GitHub プロジェクトを見せて」のように話しかければ使えることを、短く教えてください。
```

**Claude Code — ターミナルで 2 行**（どのバージョンでも動きます）：

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

チャットでは `/plugin marketplace add thruthesky/sonub-skills` のあと `/plugin install gp@sonub-skills` を入力します。新しいバージョンでは 1 行でもできます：`claude plugin install gp --marketplace thruthesky/sonub-skills`。ターミナルからインストールした場合は、開いているチャットで `/reload-plugins` を実行してください（または再起動）。

**どのエージェントでも — フォルダをコピー** して、エージェントのスキルフォルダに入れます：

| ツール | ユーザースキルフォルダ | プロジェクトスキルフォルダ |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### グローバルインストールとローカル（プロジェクト）インストール

| | グローバル — すべてのプロジェクト | ローカル — このプロジェクトだけ |
|------|------|------|
| Claude Code プラグイン | `claude plugin install gp@sonub-skills` | プロジェクトフォルダで：`claude plugin install gp@sonub-skills --scope project`（`.claude/settings.json` に書かれ、チームで共有 · 自分だけ：`--scope local`） |
| Claude Code フォルダをコピー | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| 使うボード | `/gp init <ボード URL> --global` → `~/.config/gp/config.json` | `/gp init <ボード URL>` → `<プロジェクト>/.gp.json` |

スキルをどこにインストールするかと、どのボードを使うかは別々に決めます。ふつうはスキルをグローバルに一度インストールし、プロジェクトごとに `/gp init <ボード URL>` でそのプロジェクトのボードを決めます。

### 最初の一回

エージェントに *「gp をセットアップして」* と頼みます（Claude Code：`/gp:gp`、Codex：`$gp`）。エージェントは次を実行します：

```bash
python3 scripts/gp.py doctor                    # gh ✓ · ログイン ✓ · スコープ ✓ · デフォルトボード
gh auth login                                   # ログインしていないときだけ — ブラウザにワンタイムコードを入力
gh auth refresh -s project,repo                 # スコープが足りないときだけ
python3 scripts/gp.py projects                  # 自分のボード
python3 scripts/gp.py init <ボード URL>         # このプロジェクトのボード（.gp.json）· すべてのプロジェクト：--global ……または新しく作る：
python3 scripts/gp.py project-create --title "自分の作業" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### ボードを選ぶ — `/gp init`

開発プロジェクトごとに、それぞれの GitHub Project ボードを使えます。プロジェクトフォルダでエージェントにボードのアドレスを渡すと、そのプロジェクトの作業はそのボードに入ります。

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Claude Code プラグインとしてインストールした場合は `/gp:gp init …`、Codex では `$gp init …` です。「このプロジェクトのボードは https://… にして」と言っても使えます。

- **ローカル（デフォルト）** — git リポジトリの中では `<リポジトリのルート>/.gp.json` に保存され、そのプロジェクト（とそのサブフォルダ）でだけ使われます。秘密の値は入っていないので、コミットすればチームメンバーも同じボードを使えます。自分だけで使うなら `.gitignore` に追加します。
- **グローバル** — `/gp init <URL> --global`（または「すべてのプロジェクトのデフォルトボードにして」）→ `~/.config/gp/config.json`。`.gp.json` がないすべてのフォルダで使われます。
- ボードのどのページのアドレスでも使えます（`/views/2`、ユーザーのボード `/users/…`、Organization のボード `/orgs/…`）。保存する前に、ボードが存在して読めるかを確認します。
- `/gp init` だけを入力すると、いま使っているボードとその設定ファイルを表示します。削除：`gp.py init --unset`（グローバル：`--unset --global`）。
- 使うボードを決める順序：`--owner/--number` → `GP_OWNER`/`GP_PROJECT` → プロジェクトの `.gp.json` → グローバル設定。

### 使い方 — 話しかけるだけ

| こう言うと | エージェントが実行 |
|------|------|
| 「issue を作って：iPhone でログインボタンが反応しない。手順：再現、修正、テスト。shot.png を添付」 | `create --repo app --title "…" --todo 再現 --todo 修正 --todo テスト --image shot.png` → Todo 列 |
| 「/gp init https://github.com/orgs/my-team/projects/3」 | `init …` → このプロジェクトのボードとして保存（`.gp.json`） |
| 「進行中にして」 · 「#12 を Review に移して」 | `move app#12 doing` · `move app#12 review` |
| 「終わった！」 | `close app#12` — issue をクローズして Done に移動 |
| 「TODO に『ドキュメントを更新』を追加」 · 「1 つ目にチェック」 | `todo app#12 add "ドキュメントを更新"` · `todo app#12 done 1` |
| 「先頭に Urgent 列を追加して」 · 「Review を QA に名前変更」 | `column-add Urgent --first --color red` · `column-rename Review QA` |
| 「alice に担当させて」 · 「bob をリポジトリに招待して」 | `assign app#12 alice` · `invite bob --repo app`（先に確認します） |
| 「自分の担当は何？」 | `list --assignee @me --state open`、そのあと次にやる作業を一つ提案 |
| 「ボードにアイデアをメモ：ダークモード」 | `create --draft --title "ダークモード"` |
| 「Priority フィールドを追加して」 | `field-add Priority --type single_select --options "High,Medium,Low"` |

すべてのコマンド：[skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`。

### しくみ

- **使うのは `gh` と Python 標準ライブラリだけ。** gh は引数リストで呼び出し（シェルを通さない）、タイトルと本文は標準入力（stdin）で渡すので、引用符・絵文字・改行が崩れません。
- **ID は名前で探します。** フィールド・列・選択肢の ID を実行のたびに調べるので、Web サイトで列の名前を変えても壊れません。列の名前を変えてもカードはその列に残ります。
- **変更はすべて読み直して確認します。** 変更のあと、スクリプトは GitHub 上の実際の状態（状態、列、担当者、ラベル）を `check:` 行で表示します。エージェントはその行をもとに報告します。
- **画像** は gh の `--attach`（GitHub user-attachments）を使います。gh が古いバージョンの場合は、issue のリポジトリの `gp-assets` ブランチに画像をコミットしてリンクします。
- **初期設定で安全。** 変更を行うコマンドにはすべて `--dry-run` があります。issue・ボード・フィールド・カードが入った列の削除には `--yes` が必要で、スキルはエージェントに先にあなたへ確認するよう指示します。実際の人にメールが届く招待も、先に確認します。
- **ボード設定** は、プロジェクトごとに `.gp.json`（ローカル）、すべてのプロジェクト共通で `~/.config/gp/config.json`（グローバル）に保存されます。`--owner/--number` または `GP_OWNER`/`GP_PROJECT` はその両方より優先されます。

注意：issue を作成した直後は、GitHub のプロジェクト一覧に表示されるまで数秒かかることがあります。`check:` 行は issue を直接読むので、常に最新です。

### アップデートと削除

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

その他のエージェント：`curl … | tar` の行をもう一度実行するとアップデート、`gp` フォルダを削除するとアンインストールです。

### リポジトリの構成

```
.claude-plugin/marketplace.json   ← マーケットプレイス（Claude Code）
skills/gp/
├─ SKILL.md                       ← スキル本体：いつ・どう使うか
├─ .claude-plugin/plugin.json     ← プラグイン情報（Claude Code 専用。他のツールは無視）
├─ scripts/gp.py                  ← ツール
└─ references/                    ← 必要なときに読む資料
   ├─ github-projects.md          ← 概念、アカウント、ログイン、最初のボード
   └─ commands.md                 ← すべてのコマンド + gh / GraphQL をそのまま使う例
```

スキルのしくみは、SONUB AI コースの **Agent Skills** の章で学べます：https://sonub.com/ja/learn/ai#agent-skill

ライセンス：[MIT](LICENSE)
