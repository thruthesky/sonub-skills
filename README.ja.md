# sonub-skills — SONUB の Agent Skills

[README](README.md) · [English](README.en.md) · [한국어](README.ko.md) · [中文](README.zh.md) · **日本語** · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

このリポジトリは **スキルマーケットプレイス** です。すべてのスキルは標準の [Agent Skill](https://agentskills.io)（`SKILL.md` が入ったフォルダ）なので、Claude Code、Codex、Gemini CLI、GitHub Copilot CLI など、Agent Skills を読み込めるあらゆるエージェントで動きます。Claude Code ではこのマーケットプレイス（`sonub-skills`）からプラグインとしてインストールでき、アップデートもコマンド一つで済みます。

| スキル | できること |
|------|------|
| [`gp`](skills/gp) | git と `gh` CLI で、あなたのすべての作業を **GitHub Projects** で管理 |
| [`claude-skill`](skills/claude-skill) | **Claude Code を学んで、もっと上手に使う** — 14 のレッスンとクイズ、公式ドキュメントで確かめた答え、設定チェック、CHANGELOG のすべての新機能のまとめ、`/claude-skill update` で新機能を取り込み（プラグイン名 `cc-skill`） |

## インストール — グローバル（ユーザー）またはプロジェクトごと

どのスキルも同じ方法でインストールします。`<プラグイン>` のところに表のプラグイン名（`gp`、`cc-skill`）を入れてください。

**ステップ 1 — マーケットプレイスを追加（コンピューターごとに一度だけ）**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**ステップ 2 — 使いたい範囲にインストール**

| 範囲 | コマンド | 誰が・どこで使えるか | 記録される場所 |
|------|------|------|------|
| **グローバル（ユーザー）** — デフォルト | `claude plugin install <プラグイン>@sonub-skills` | 自分、このコンピューターのすべてのプロジェクト | `~/.claude/settings.json` |
| **プロジェクト（チームで共有）** | プロジェクトフォルダで：`claude plugin install <プラグイン>@sonub-skills --scope project` | このリポジトリで作業する全員 | `.claude/settings.json`（コミットする） |
| **ローカル（自分だけ、このプロジェクトだけ）** | プロジェクトフォルダで：`claude plugin install <プラグイン>@sonub-skills --scope local` | 自分、このリポジトリだけ | `.claude/settings.local.json` |

- チャットで `/plugin install <プラグイン>@sonub-skills` と入力すると、範囲を選ぶ画面が開きます。ターミナルからインストールした場合は、開いているチャットで `/reload-plugins` を実行してください。
- 確認：`claude plugin list`（範囲も表示されます）。アップデート：`claude plugin marketplace update sonub-skills && claude plugin update <プラグイン>@sonub-skills`。削除：`claude plugin uninstall <プラグイン>@sonub-skills`。
- 同じプラグインが複数の範囲に設定されているときは、ローカルがプロジェクトより、プロジェクトがグローバルより優先されます。

**チームメンバーに自動で入るようにする** — 次の内容をリポジトリの `.claude/settings.json` に書いてコミットします。チームメンバーがフォルダを信頼（trust）すると、Claude Code がマーケットプレイスを追加してプラグインをインストールします。

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true }
}
```

**プラグインを使わずに — フォルダをコピー** して、エージェントのスキルフォルダに入れます（`<スキル>` = `gp` または `claude-skill`）。

| ツール | グローバル（ユーザー） | プロジェクト |
|------|------|------|
| Claude Code | `~/.claude/skills/<スキル>` | `<プロジェクト>/.claude/skills/<スキル>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<スキル>` | `<プロジェクト>/.agents/skills/<スキル>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # このプロジェクトだけ：DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**いちばん簡単** — エージェントに *「thruthesky/sonub-skills の cc-skill プラグインをグローバルにインストールして」*（または *「このプロジェクトだけに」*）と頼めば、上のコマンドを代わりに実行してくれます。

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

## claude-skill — Claude Code を学んで、もっと上手に使う

Claude Code はほぼ毎日新しいバージョンが出ます（これまでに 400 以上）。このスキルは Claude Code を順番に教え、質問には記憶ではなく**いまの公式ドキュメント**を調べて答え、あなたの設定をチェックし、CHANGELOG のすべての新機能をまとめておきます。`/claude-skill update` を一度実行すれば、新しく出た機能がスキルに取り込まれます。

### できること

- **14 レッスンの学習コース** — インストールと最初のプロンプトから、探索 → 計画 → コード → コミット、コンテキスト管理、CLAUDE.md とメモリ、権限モード、チェックポイント、スキル、サブエージェント、フック、MCP、プラグインとマーケットプレイス、ヘッドレス実行と GitHub Actions、検証つきで長く任せる作業まで。どのレッスンにも**自分のプロジェクトでやる実習**と確認問題があり、進み具合は保存されます。
- **Claude Academy の分析** — [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) の 64 本の Claude チュートリアルと、Claude Code のチュートリアル・講座（Claude Code 101、Claude Code in action、Agent Skills、Subagents）。チャットで学ぶこと（Projects、メモリ、コネクター、スキル、Research、モデルと effort の選び方…）を、Claude Code でのやり方に対応させています。
- **ドキュメントで確かめた答え** — 「フックはどう使うの？」「プラグインの範囲って何？」といった質問に、code.claude.com を検索して読み、コマンド・例・ドキュメントのリンクで答えます。
- **CHANGELOG のすべての新機能** — [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) の全 422 バージョン（v0.2.21 – v2.1.302）から、バグ修正を除いて 14 のテーマにまとめ、知っておきたい 30 の機能と最近追加された機能も選んであります。
- **`/claude-skill update`** — 最新の CHANGELOG を取得し、スキルがまだ扱っていないバージョンを見つけて、その機能をノート・チートシート・レッスンに加え、どのバージョンまで扱ったかを記録します。
- **設定チェック（doctor）** — バージョン、設定ファイル（ユーザー、プロジェクト、ローカル）、CLAUDE.md の長さ、ルール、自動メモリ、スキル、サブエージェント、プラグイン、MCP サーバーを見て、直すとよい点を提案します。
- **チートシート・コツ・作り方ガイド** — コマンド、ショートカット、CLI オプション、ファイルの場所を 1 ページに。うまくいく使い方。スキル、サブエージェント、フック、MCP サーバー、プラグイン、マーケットプレイスの作り方。

### インストール

上の [インストール](#インストール--グローバルユーザーまたはプロジェクトごと) と同じです。プラグイン名は **`cc-skill`** です（Claude Code は `claude-` で始まるプラグイン名を Anthropic 公式用に予約しています）。スキル名は `claude-skill` のままなので、`/claude-skill` で呼び出します。

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # グローバル — すべてのプロジェクト
claude plugin install cc-skill@sonub-skills --scope project    # このプロジェクト、チームで共有
```

Python 3.8 以上とインターネット接続が必要です（公式ドキュメントと CHANGELOG を読むため）。

### 使い方

| こう言うと | こうします |
|------|------|
| `/claude-skill` · 「Claude Code を勉強しよう」 | レッスン一覧と進み具合を表示し、次のレッスンを始める |
| `/claude-skill lesson 5` · 「次のレッスン」 | レッスンを教え、自分のプロジェクトで実習し、確認問題を出し、進み具合を保存 |
| `/claude-skill quiz` | 学んだ範囲から 5 問を 1 問ずつ出して採点 |
| 「フックで編集のたびに prettier を実行するには？」 | 公式ドキュメントを読み、設定例とリンクで答える |
| `/claude-skill new` · 「新機能は？」 | 最近の役に立つ機能から順に、試し方と一緒に紹介 |
| `/claude-skill doctor` · 「自分の設定をチェックして」 | 設定を見て修正を提案（変更する前に確認します） |
| `/claude-skill tips` · `cheatsheet` · `academy` | うまくいく使い方 · コマンドとショートカット · Academy の分析 |
| `/claude-skill build skill` · 「フックを作って」 | 合うしくみを選び、自分のプロジェクトで一緒に作る |
| `/claude-skill update` | 最新の CHANGELOG からスキルの機能ノートを更新 |

プラグインとしてインストールした場合は `/cc-skill:claude-skill …` でも使えます。Codex：`$claude-skill …`。

### `/claude-skill update` のしくみ

1. `scripts/cc.py update-check` が、ノートが扱っているバージョン（`references/changelog-features.md` の `covered-through` マーク）と CHANGELOG の最新バージョンを比べます。
2. インストール済みのプラグインのコピーでは、まず `claude plugin update cc-skill@sonub-skills` を実行して公開済みのノートを取得します。スキルのソース（git のチェックアウト）を編集するには `--source <フォルダ>` を渡します。ソースがない場合は `~/.config/claude-skill/changelog-local.md` に書き込み、プラグインをアップデートしても残ります。
3. `cc.py changelog --since <扱ったバージョン>` が新しいバージョンの項目を一覧にし（修正は非表示）、エージェントが新機能をテーマごとに追加し、「最近の追加」を書き直し、新しいコマンドとショートカットをチートシートに加え、内容が古くなったレッスンを直します。
4. `cc.py mark-covered <最新バージョン>` がマークを進めます。git のチェックアウトではバージョンを上げてコミットします（プッシュは頼まれたときだけ）。
5. 扱ったバージョンの範囲と、試す価値のある新機能 3〜7 個をそれぞれの試し方と一緒に報告します。

### ツール — `scripts/cc.py`

Python 標準ライブラリだけを使います。

```bash
python3 scripts/cc.py doctor                 # Claude Code の設定をチェック + アドバイス
python3 scripts/cc.py docs hooks             # 公式ドキュメントを検索（llms.txt）
python3 scripts/cc.py read hooks --section "Hook events"   # ページの 1 節を読む
python3 scripts/cc.py changelog --count 5    # 最新 5 バージョン（修正は非表示）
python3 scripts/cc.py changelog --grep worktree --count 400   # 名前で機能を探す
python3 scripts/cc.py update-check           # 扱ったバージョン vs 最新
python3 scripts/cc.py lessons                # レッスンと進み具合
```

## リポジトリの構成

```
.claude-plugin/marketplace.json   ← マーケットプレイス（Claude Code）
skills/gp/
├─ SKILL.md                       ← スキル本体：いつ・どう使うか
├─ .claude-plugin/plugin.json     ← プラグイン情報（Claude Code 専用。他のツールは無視）
├─ scripts/gp.py                  ← ツール
└─ references/                    ← 必要なときに読む資料
   ├─ github-projects.md          ← 概念、アカウント、ログイン、最初のボード
   └─ commands.md                 ← すべてのコマンド + gh / GraphQL をそのまま使う例
skills/claude-skill/
├─ SKILL.md                       ← スキル本体：いつ・どう使うか
├─ .claude-plugin/plugin.json     ← プラグイン情報（プラグイン名 cc-skill）
├─ scripts/cc.py                  ← 学習ツール：doctor、docs、read、changelog、update-check、lessons
└─ references/                    ← 14 レッスン · Academy の分析 · CHANGELOG の機能 · チートシート · 作り方ガイド · コツ · クイズ
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
```

スキルのしくみは、SONUB AI コースの **Agent Skills** の章で学べます：https://sonub.com/ja/learn/ai#agent-skill

ライセンス：[MIT](LICENSE)
