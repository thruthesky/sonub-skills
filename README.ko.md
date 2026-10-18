# sonub-skills — SONUB 의 에이전트 스킬

[README](README.md) · [English](README.en.md) · **한국어** · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

이 저장소는 **스킬 마켓플레이스**입니다. 모든 스킬은 표준 [Agent Skill](https://agentskills.io)(`SKILL.md` 가 든 폴더)이라서 Claude Code, Codex, Gemini CLI, GitHub Copilot CLI 등 Agent Skills 를 읽는 모든 에이전트에서 동작합니다. Claude Code 에서는 이 마켓플레이스(`sonub-skills`)에서 플러그인으로 설치할 수 있어 업데이트가 명령 하나로 끝납니다.

| 스킬 | 하는 일 |
|------|------|
| [`gp`](skills/gp) | git 과 `gh` CLI 로 나의 모든 일감을 **GitHub Project** 에서 관리 |
| [`claude-skill`](skills/claude-skill) | **Claude Code 를 공부하고 더 잘 쓰기** — 14개 레슨·퀴즈, 공식 문서로 확인한 답, 설정 점검, CHANGELOG 의 모든 새 기능 요약, `/claude-skill update` 로 새 기능 반영(플러그인 이름 `cc-skill`) |
| [`popup`](skills/popup) | 어떤 프로젝트의 페이지와 문서에서든 **어려운 용어를 마우스 오버 팝업으로 설명** — 뜻, 쉬운 말, 예시, 소스 코드, 관련 용어, 내 페이지로 가는 "더 알아보기" 링크를 용어 사전 JSON 하나로 |

## 설치 — 전역(사용자) 또는 프로젝트

모든 스킬은 같은 방법으로 설치합니다. 아래 `<플러그인>` 자리에 표의 플러그인 이름(`gp`, `cc-skill`, `popup`)을 넣습니다.

**1단계 — 마켓플레이스 추가(컴퓨터마다 한 번)**

```bash
claude plugin marketplace add thruthesky/sonub-skills
```

**2단계 — 어디에 쓸지 골라 설치**

| 범위 | 명령 | 누가·어디서 쓰나 | 기록되는 곳 |
|------|------|------|------|
| **전역(사용자)** — 기본값 | `claude plugin install <플러그인>@sonub-skills` | 나, 이 컴퓨터의 모든 프로젝트 | `~/.claude/settings.json` |
| **프로젝트(팀 공유)** | 프로젝트 폴더에서 `claude plugin install <플러그인>@sonub-skills --scope project` | 이 저장소에서 일하는 모든 사람 | `.claude/settings.json`(커밋) |
| **로컬(나만, 이 프로젝트만)** | 프로젝트 폴더에서 `claude plugin install <플러그인>@sonub-skills --scope local` | 나, 이 저장소에서만 | `.claude/settings.local.json` |

- 대화창에서는 `/plugin install <플러그인>@sonub-skills` 를 입력하면 설치 범위를 고르는 화면이 나옵니다. 터미널에서 설치했다면 열려 있는 대화창에서 `/reload-plugins` 를 실행합니다.
- 확인: `claude plugin list`(범위가 함께 보입니다). 업데이트: `claude plugin marketplace update sonub-skills && claude plugin update <플러그인>@sonub-skills`. 삭제: `claude plugin uninstall <플러그인>@sonub-skills`.
- 같은 플러그인이 여러 범위에 있으면 로컬 > 프로젝트 > 전역 순으로 앞선 것이 적용됩니다.

**팀원이 자동으로 받게 하기** — 저장소의 `.claude/settings.json` 에 아래를 넣어 커밋하면, 팀원이 폴더를 신뢰(trust)한 뒤 Claude Code 가 마켓플레이스를 더하고 플러그인을 설치합니다.

```json
{
  "extraKnownMarketplaces": {
    "sonub-skills": { "source": { "source": "github", "repo": "thruthesky/sonub-skills" } }
  },
  "enabledPlugins": { "gp@sonub-skills": true, "cc-skill@sonub-skills": true, "popup@sonub-skills": true }
}
```

**플러그인 없이 폴더 복사** — 스킬 폴더를 에이전트의 스킬 폴더에 넣어도 됩니다(`<스킬>` = `gp`, `claude-skill`, `popup`).

| 도구 | 전역(사용자) | 프로젝트 |
|------|------|------|
| Claude Code | `~/.claude/skills/<스킬>` | `<프로젝트>/.claude/skills/<스킬>` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills/<스킬>` | `<프로젝트>/.agents/skills/<스킬>` |

```bash
S=claude-skill; DIR=~/.claude/skills      # 프로젝트에만: DIR=.claude/skills
mkdir -p "$DIR" && rm -rf "$DIR/$S" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 "sonub-skills-main/skills/$S"
```

**가장 쉬운 방법** — 에이전트에게 *"thruthesky/sonub-skills 의 cc-skill 플러그인을 전역으로 설치해 줘"*(또는 *"이 프로젝트에만"*)라고 말하면 위 명령을 대신 실행합니다.

---

## gp — 나의 모든 일감을 GitHub Project 보드에서

AI 에이전트에게 평소 말로 부탁하면 됩니다 — *"이슈 만들어 줘: 아이폰에서 로그인 버튼이 안 눌려, 이 스크린샷 첨부해"*, *"Done 으로 옮겨"*, *"Review 칸 하나 만들어"*, *"내 일 보여 줘"*. 에이전트가 `gh` 로 GitHub Project 보드에서 그대로 처리하고, 결과를 다시 읽어 확인해 알려 줍니다.

### 다루는 것

- **GitHub Project 설명** — 저장소, 이슈, 프로젝트(보드), 아이템, 초안, 필드, Status = 칸, 뷰, 워크플로. 에이전트가 내 언어로 가르쳐 줍니다.
- **계정과 로그인** — 새 GitHub 계정 만드는 순서, `gh` 설치, `gh auth login`, `project`·`repo` 권한.
- **보드** — 만들기, 이름·설명 바꾸기, 공개/비공개, 닫기/다시 열기, 삭제, 저장소 연결, 내 보드 목록, 기본 보드 정하기.
- **칸(칸반 컬럼)** — 추가, 이름 변경(카드는 그대로), 순서 바꾸기, 색, 삭제(카드를 다른 칸으로 먼저 옮김).
- **필드와 뷰** — 사용자 필드(글·숫자·날짜·단일 선택), 보드·표·로드맵 뷰와 필터.
- **이슈** — 만들기(칸·라벨·마일스톤·상위 이슈·사용자 필드까지), 고치기, 칸 옮기기, 닫기(Done 으로 이동), 다시 열기, 댓글, 보드에서 빼기, 보관, 삭제.
- **이미지** — 이슈 본문이나 댓글에 스크린샷·동영상 첨부.
- **TODO** — 이슈 안의 `- [ ]` 체크리스트: 추가·체크·해제·삭제, 목록에서 진행률 표시. 떠오른 생각은 초안(draft)으로 적었다가 나중에 이슈로 바꾸기.
- **사람** — 담당자 지정·해제, 누가 무엇을 맡았는지 보기, 저장소에 협업자 초대, 보드 권한 주기.

### 준비물

- GitHub 계정(무료). 아직 없으면 https://github.com/signup 에서 가입합니다 — 이메일 코드, 퍼즐, Free 요금제 선택(약 3분).
- [`gh`](https://cli.github.com) — GitHub CLI(macOS `brew install gh`, Windows `winget install GitHub.cli`). `project`·`repo` 권한으로 로그인.
- Python 3.8 이상(표준 라이브러리만 씀).

### 설치

**가장 쉬운 방법 — 에이전트에게 맡기기.** 아래 상자를 복사해 Claude Code, Codex, Gemini CLI, Copilot CLI 대화창에 붙여 넣고 보냅니다.

```text
thruthesky/sonub-skills 저장소의 gp 스킬을 설치해 줘.
스킬 경로: https://github.com/thruthesky/sonub-skills/tree/main/skills/gp — 표준 Agent Skills 형식(폴더 안에 SKILL.md)이다.

1. 네가 Claude Code 면 플러그인으로 설치한다. 차례로 실행한다(이미 더해져 있다는 오류는 무시).
   claude plugin marketplace add thruthesky/sonub-skills
   claude plugin marketplace update sonub-skills
   claude plugin install gp@sonub-skills
   - "이 프로젝트에만" 설치하라고 했으면 프로젝트 폴더에서 마지막 줄에 --scope project 를 붙인다.
   - 이미 설치돼 있으면 마지막 줄 대신: claude plugin update gp@sonub-skills
2. 그 밖의 에이전트면 스킬 폴더 DIR 에 받는다 — 모든 프로젝트: ~/.agents/skills, 이 프로젝트만: <프로젝트>/.agents/skills.
   mkdir -p DIR && rm -rf DIR/gp && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C DIR --strip-components=2 sonub-skills-main/skills/gp
3. python3 <스킬 폴더>/scripts/gp.py doctor 를 실행하고, 알려 주는 문제를 고친다(gh 설치, gh auth login, gh auth refresh -s project,repo).
4. 무엇을 설치했는지, doctor 결과, 이제 "내 GitHub 프로젝트 보여 줘" 같은 말로 쓰면 된다는 것을 짧게 알려 준다.
```

**Claude Code — 터미널에서 두 줄**(모든 판에서 됨):

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install gp@sonub-skills
```

대화창에서는 `/plugin marketplace add thruthesky/sonub-skills` → `/plugin install gp@sonub-skills` 를 입력합니다. 새 판은 한 줄도 됩니다: `claude plugin install gp --marketplace thruthesky/sonub-skills`. 터미널에서 설치했다면 열려 있는 대화창에서 `/reload-plugins` 를 실행합니다(또는 다시 시작).

**모든 에이전트 — 폴더 복사.** 에이전트의 스킬 폴더에 넣습니다.

| 도구 | 사용자 스킬 폴더 | 프로젝트 스킬 폴더 |
|------|------|------|
| Claude Code | `~/.claude/skills` | `.claude/skills` |
| Codex · Gemini CLI · GitHub Copilot CLI | `~/.agents/skills` | `.agents/skills` |

```bash
DIR=~/.agents/skills
mkdir -p "$DIR" && rm -rf "$DIR/gp" && curl -fsSL https://codeload.github.com/thruthesky/sonub-skills/tar.gz/refs/heads/main | tar -xz -C "$DIR" --strip-components=2 sonub-skills-main/skills/gp
```

#### 전역 설치와 로컬(프로젝트) 설치

| | 전역 — 모든 프로젝트 | 로컬 — 이 프로젝트만 |
|------|------|------|
| Claude Code 플러그인 | `claude plugin install gp@sonub-skills` | 프로젝트 폴더에서 `claude plugin install gp@sonub-skills --scope project`(`.claude/settings.json` 에 적혀 팀이 함께 씀 · 나만: `--scope local`) |
| Claude Code 폴더 복사 | `~/.claude/skills/gp` | `.claude/skills/gp` |
| Codex · Gemini CLI · Copilot CLI | `~/.agents/skills/gp` | `.agents/skills/gp` |
| 쓸 보드 | `/gp init <보드 URL> --global` → `~/.config/gp/config.json` | `/gp init <보드 URL>` → `<프로젝트>/.gp.json` |

스킬을 어디에 설치했는지와 어느 보드를 쓰는지는 따로 정합니다. 보통은 스킬을 전역으로 한 번 설치하고, 프로젝트마다 `/gp init <보드 URL>` 로 그 프로젝트의 보드를 정합니다.

### 처음 한 번

에이전트에게 *"gp 설정해 줘"* 라고 말합니다(Claude Code: `/gp:gp`, Codex: `$gp`). 에이전트가 이렇게 합니다.

```bash
python3 scripts/gp.py doctor                    # gh ✓ · 로그인 ✓ · 권한 ✓ · 기본 보드
gh auth login                                   # 로그인이 안 돼 있을 때만 — 브라우저에 일회용 코드 입력
gh auth refresh -s project,repo                 # 권한이 빠졌을 때만
python3 scripts/gp.py projects                  # 내 보드 목록
python3 scripts/gp.py init <보드 URL>           # 이 프로젝트의 보드(.gp.json) · 모든 프로젝트는 --global … 없으면 새로 만들기:
python3 scripts/gp.py project-create --title "나의 일" --columns "Todo,In Progress,Review,Done" --repo you/your-repo --use
python3 scripts/gp.py view-add Board --layout board
```

### 보드 정하기 — `/gp init`

개발 프로젝트마다 GitHub Project 보드가 다를 수 있습니다. 프로젝트 폴더에서 에이전트에게 보드 주소를 주면, 그 프로젝트의 일은 그 보드에서 관리합니다.

```text
/gp init https://github.com/users/thruthesky/projects/17/views/1
```

Claude Code 플러그인으로 설치했으면 `/gp:gp init …`, Codex 는 `$gp init …` 입니다. "이 프로젝트 보드는 https://… 로 해 줘" 처럼 말해도 됩니다.

- **로컬(기본)** — git 저장소 안에서 하면 `<저장소 맨 위>/.gp.json` 에 저장되고, 그 프로젝트(하위 폴더 포함)에서만 씁니다. 비밀 값이 없으니 커밋하면 팀원도 같은 보드를 쓰고, 나만 쓰려면 `.gitignore` 에 넣습니다.
- **전역** — `/gp init <URL> --global`(또는 "모든 프로젝트의 기본 보드로") → `~/.config/gp/config.json`. `.gp.json` 이 없는 모든 폴더에서 씁니다.
- 주소는 보드의 어느 화면이든 됩니다(`/views/2`, 사용자 보드 `/users/…`, 조직 보드 `/orgs/…`). 저장하기 전에 보드가 있고 읽을 수 있는지 확인합니다.
- `/gp init` 만 입력하면 지금 쓰는 보드와 설정 파일을 보여 줍니다. 지우기: `gp.py init --unset`(전역은 `--unset --global`).
- `/gp init` 은 보드를 정하면서 이 프로젝트의 `AGENTS.md`·`CLAUDE.md` 와 전역 `~/.claude/CLAUDE.md`·`~/.codex/AGENTS.md` 에 "GitHub Project·이슈·일감·할 일·TODO 의 생성/수정/삭제/목록/검색은 반드시 gp 스킬로" 라는 지침도 넣습니다. URL 을 주면 그 보드 URL 로 일하라는 내용이 함께 들어갑니다. 다시 실행하면 그 부분만 새로 고치고, `--show` 는 보기만, `--no-instructions` 는 지침을 건너뛰고, `--remove-instructions` 는 지침을 지웁니다.
- 어느 보드를 쓸지 정하는 순서: `--owner/--number` → `GP_OWNER`/`GP_PROJECT` → 프로젝트의 `.gp.json` → 전역 설정.

### 쓰는 법 — 말로 부탁하기

| 이렇게 말하면 | 에이전트가 실행 |
|------|------|
| "이슈 만들어: 아이폰에서 로그인 버튼이 안 눌림. 단계: 재현, 수정, 테스트. shot.png 첨부" | `create --repo app --title "…" --todo 재현 --todo 수정 --todo 테스트 --image shot.png` → Todo 칸 |
| "/gp init https://github.com/orgs/my-team/projects/3" | `init …` → 이 프로젝트의 보드로 저장(`.gp.json`) |
| "진행 중으로" · "#12 Review 로 옮겨" | `move app#12 doing` · `move app#12 review` |
| "끝났어!" | `close app#12` — 이슈를 닫고 Done 칸으로 |
| "TODO 에 '문서 고치기' 추가" · "첫 번째 체크" | `todo app#12 add "문서 고치기"` · `todo app#12 done 1` |
| "맨 앞에 Urgent 칸 만들어" · "Review 를 QA 로 이름 바꿔" | `column-add Urgent --first --color red` · `column-rename Review QA` |
| "alice 에게 맡겨" · "bob 을 저장소에 초대해" | `assign app#12 alice` · `invite bob --repo app`(먼저 묻습니다) |
| "내 일 보여 줘" | `list --assignee @me --state open`, 그리고 다음에 할 일 하나 추천 |
| "보드에 아이디어 메모: 다크 모드" | `create --draft --title "다크 모드"` |
| "Priority 필드 추가" | `field-add Priority --type single_select --options "High,Medium,Low"` |

전체 명령: [skills/gp/references/commands.md](skills/gp/references/commands.md) · `python3 scripts/gp.py -h`.

### 동작 방식

- **`gh` 와 Python 표준 라이브러리만 씁니다.** gh 를 셸 없이 인자 목록으로 부르고 제목·본문은 표준 입력으로 보내서, 따옴표·이모지·줄바꿈이 깨지지 않습니다.
- **ID 는 이름으로 찾습니다.** 필드·칸·옵션 ID 를 실행할 때마다 찾으므로 웹에서 칸 이름을 바꿔도 문제가 없습니다. 칸 이름을 바꿔도 카드는 그 칸에 남습니다.
- **바꾼 것은 다시 읽어 확인합니다.** 바꾼 뒤 GitHub 의 실제 상태(열림·닫힘, 칸, 담당자, 라벨)를 `check:` 줄로 보여 주고, 에이전트는 그 줄로 보고합니다.
- **이미지**는 gh 의 `--attach`(GitHub user-attachments)로 올립니다. gh 가 오래된 판이면 이슈 저장소의 `gp-assets` 브랜치에 커밋하고 링크합니다.
- **기본이 안전합니다.** 바꾸는 명령은 모두 `--dry-run` 이 있습니다. 이슈·보드·필드·카드가 든 칸 삭제는 `--yes` 가 필요하고, 스킬은 에이전트에게 먼저 묻게 합니다. 실제 사람에게 이메일이 가는 초대도 먼저 묻습니다.
- **보드 설정**은 프로젝트마다 `.gp.json`(로컬), 모든 프로젝트 공통은 `~/.config/gp/config.json`(전역)에 저장됩니다. `--owner/--number` 나 `GP_OWNER`/`GP_PROJECT` 가 둘 다보다 앞섭니다.

참고: 이슈를 만든 직후에는 GitHub 의 보드 목록에 몇 초 늦게 나타날 수 있습니다. `check:` 줄은 이슈를 직접 읽으므로 항상 최신입니다.

### 업데이트와 삭제

```bash
claude plugin marketplace update sonub-skills && claude plugin update gp@sonub-skills   # Claude Code
claude plugin uninstall gp@sonub-skills
```

그 밖의 에이전트: `curl … | tar` 줄을 다시 실행하면 업데이트, `gp` 폴더를 지우면 삭제입니다.

## claude-skill — Claude Code 를 공부하고 더 잘 쓰기

Claude Code 는 거의 매일 새 판이 나옵니다(지금까지 400개가 넘는 판). 이 스킬은 Claude Code 를 순서대로 가르치고, 질문에는 기억이 아니라 **지금의 공식 문서**를 찾아 답하고, 내 설정을 점검하고, CHANGELOG 의 모든 새 기능을 정리해 둡니다. `/claude-skill update` 한 번이면 새로 나온 기능이 스킬에 반영됩니다.

### 다루는 것

- **학습 과정 14개 레슨** — 설치·첫 프롬프트부터 탐색→계획→코드→커밋, 컨텍스트 관리, CLAUDE.md·메모리, 권한 모드, 체크포인트, 스킬, 서브에이전트, 훅, MCP, 플러그인·마켓플레이스, 헤드리스·GitHub Actions, 오래 맡겨 두는 작업과 검증까지. 레슨마다 **내 프로젝트에서 하는 실습**과 확인 질문이 있고 진도가 저장됩니다.
- **Claude Academy 분석** — [Claude Academy](https://academy.claude.com/all?kind=tutorial&product=chat) 의 Claude 튜토리얼 64개와 Claude Code 튜토리얼·강좌(Claude Code 101, Claude Code in action, Agent Skills, Subagents)를 분석해, 채팅에서 배우는 것(Projects, 메모리, 커넥터, 스킬, 리서치, 모델·effort 고르기…)을 Claude Code 에서 하는 법으로 옮겨 정리했습니다.
- **공식 문서로 확인한 답** — "훅은 어떻게 써?", "플러그인 범위가 뭐야?" 같은 질문에 code.claude.com 문서를 찾아 읽고, 명령·예시·문서 링크로 답합니다.
- **CHANGELOG 의 모든 새 기능** — [CHANGELOG.md](https://raw.githubusercontent.com/anthropics/claude-code/refs/heads/main/CHANGELOG.md) 422개 판(v0.2.21 ~ v2.1.302)에서 버그 수정을 뺀 새 기능·변경·삭제를 14개 주제로 요약하고, 꼭 알아야 할 30가지와 최근 추가 기능을 따로 뽑았습니다.
- **`/claude-skill update`** — 최신 CHANGELOG 를 받아 스킬이 아직 다루지 않은 판의 새 기능을 찾아 요약 문서·치트시트·레슨에 반영하고, 어느 판까지 반영했는지 기록합니다.
- **내 설정 점검(doctor)** — 버전, 설정 파일(전역·프로젝트·로컬), CLAUDE.md 길이, 규칙, 자동 메모리, 스킬·서브에이전트·플러그인·MCP 를 훑어보고 고칠 점을 알려 줍니다.
- **치트시트·팁·만들기 안내** — 명령·단축키·CLI 옵션·파일 위치 한 장 정리, 잘 쓰는 법, 스킬·서브에이전트·훅·MCP·플러그인·마켓플레이스 만드는 법.

### 설치

위 [설치](#설치--전역사용자-또는-프로젝트) 절과 같습니다. 플러그인 이름은 **`cc-skill`** 입니다(Claude Code 는 `claude-` 로 시작하는 플러그인 이름을 Anthropic 공식용으로 막아 두었습니다). 스킬 이름은 그대로 `claude-skill` 이라 `/claude-skill` 로 부릅니다.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install cc-skill@sonub-skills                    # 전역 — 모든 프로젝트
claude plugin install cc-skill@sonub-skills --scope project    # 이 프로젝트(팀 공유)
```

준비물: Python 3.8 이상, 인터넷(공식 문서와 CHANGELOG 를 읽음).

### 쓰는 법

| 이렇게 말하면 | 하는 일 |
|------|------|
| `/claude-skill` · "클로드 코드 공부하자" | 레슨 목록과 진도를 보여 주고 다음 레슨을 시작 |
| `/claude-skill lesson 5` · "다음 레슨" | 그 레슨을 가르치고 내 프로젝트에서 실습, 확인 질문, 진도 저장 |
| `/claude-skill quiz` · "퀴즈 내 줘" | 배운 범위에서 5문제를 하나씩 내고 채점 |
| "훅으로 저장할 때마다 prettier 돌리려면?" | 공식 문서를 찾아 읽고 설정 예시와 링크로 답 |
| `/claude-skill new` · "새 기능 뭐 있어?" | 최근 추가된 기능 중 쓸모 있는 것부터, 써 보는 방법과 함께 |
| `/claude-skill doctor` · "내 설정 점검해 줘" | 설정을 훑어보고 고칠 점 제안(바꾸기 전에 먼저 물어봄) |
| `/claude-skill tips` · `cheatsheet` · `academy` | 잘 쓰는 법 · 명령·단축키 정리 · Academy 튜토리얼 분석 |
| `/claude-skill build skill` · "훅 만들어 줘" | 알맞은 방법을 고르고 내 프로젝트에 함께 만들어 시험 |
| `/claude-skill update` | 최신 CHANGELOG 로 스킬의 새 기능 문서를 갱신 |

플러그인으로 설치했으면 `/cc-skill:claude-skill …` 도 됩니다. Codex 는 `$claude-skill …`.

### `/claude-skill update` 는 이렇게 동작합니다

1. `scripts/cc.py update-check` 가 스킬 문서(`references/changelog-features.md` 의 `covered-through` 표시)가 어느 판까지 다루는지와 최신 CHANGELOG 판을 비교합니다.
2. 플러그인으로 설치된 사본이면 먼저 `claude plugin update cc-skill@sonub-skills` 로 배포된 최신판을 받습니다. 스킬 원본(git 저장소)을 고치려면 `--source <원본 폴더>` 를 줍니다. 원본이 없으면 개인 메모 `~/.config/claude-skill/changelog-local.md` 에 적어 플러그인 업데이트에도 남게 합니다.
3. `cc.py changelog --since <다룬 판>` 으로 새 판의 항목(버그 수정 제외)을 읽고, 새 기능을 주제별로 문서에 넣고, "최근 추가 기능"을 다시 쓰고, 새 명령·단축키는 치트시트에, 틀려진 레슨은 고칩니다.
4. `cc.py mark-covered <최신 판>` 으로 표시를 바꾸고, 원본이 git 저장소면 판 번호를 올려 커밋합니다(푸시는 요청할 때만).
5. 반영한 판 범위와 쓸 만한 새 기능 3~7개를 써 보는 방법과 함께 알려 줍니다.

### 도구 — `scripts/cc.py`

Python 표준 라이브러리만 씁니다.

```bash
python3 scripts/cc.py doctor                 # 내 Claude Code 설정 점검 + 조언
python3 scripts/cc.py docs hooks             # 공식 문서 찾기(llms.txt)
python3 scripts/cc.py read hooks --section "Hook events"   # 문서 한 절 읽기
python3 scripts/cc.py changelog --count 5    # 최근 5개 판(버그 수정 제외)
python3 scripts/cc.py changelog --grep worktree --count 400   # 기능 이름으로 찾기
python3 scripts/cc.py update-check           # 스킬이 다루는 판 vs 최신 판
python3 scripts/cc.py lessons                # 레슨과 진도
```

## popup — 어려운 낱말을 독자가 만나는 그 자리에서 설명하기

독자는 "토큰", "엔드포인트", "멱등성" 같은 낱말 하나에서 막히고, 그 단락 전체를 놓칩니다. 이 스킬은 그 낱말 위에 작은 카드를 붙입니다. 낱말에 마우스를 올리면(휴대폰은 탭, 키보드는 포커스) 용어를 겹겹이 설명해 줍니다 — 한 줄 뜻, 짧은 설명, 일상 속 비유, 예시 문장, 소스 코드 조각, 관련 용어, 그리고 **내 프로젝트의 다른 페이지로 가는 "더 알아보기" 링크**. 정적 사이트, 문서 생성기, 싱글 페이지 앱, 서버에서 그려 주는 사이트, GitHub 에서 읽는 일반 Markdown 까지 어떤 프로젝트에서도 동작합니다.

### 다루는 것

- **용어 사전은 한 곳에** — 모든 설명이 JSON 파일 하나(또는 언어마다 하나)에 있고, 페이지는 용어 id 만 가리킵니다. 그래서 같은 낱말은 어디서나 똑같이 읽힙니다.
- **끼워 넣기만 하면 되는 키트** — `popup.js` 와 `popup.css`, 프레임워크도 빌드 단계도 없습니다. `main`/`article` 안의 일반 글은 자동으로 감싸지고(페이지마다 처음 한 번), 구절·문장·"?" 버튼·마우스를 올리면 미리 보이는 링크는 직접 마크업합니다. 페이지당 카드 하나, 클릭하면 고정, 관련 용어 칩은 그 자리에서 바뀌고, Esc 로 포커스가 돌아오며, 휴대폰에서는 아래에서 올라오는 시트, 오른쪽에서 왼쪽으로 쓰는 언어, 다크 모드, CSS 변수로 테마를 지원합니다.
- **똑똑한 매칭** — 긴 표기부터, 문자 체계별 단어 경계(라틴·키릴·한국어 조사·아랍어 접두사·CJK), 한 절에서만 쓰는 용어(`scope`), 대소문자를 구분하는 명령어 이름.
- **쓰기 규칙** — 프로젝트가 내놓는 모든 언어에서, 초보자가 한 번 읽고 이해하는 카드 쓰는 법: 칸마다 무엇을 쓰는지, 길이, 비유 하나, 확인한 사실, 진짜 예시가 있으면 반드시 넣기.
- **도구** — `popup.py check` 는 용어 사전을 검증하고(모든 언어, 언어가 달라도 같은 예시 코드, 관련 id, 더 알아보기 대상이 실제로 있는지, 표기 충돌), `audit` 는 문서가 이미 쓰는 용어와 아직 항목이 없는 전문용어를 찾고, `add` 는 새 용어를 안전하게 합치고, `md` + `link` 는 용어 사전으로 `GLOSSARY.md` 를 만들고 Markdown 파일에서 처음 나오는 용어에 뜻을 마우스 오버 제목으로 단 링크를 겁니다.
- **SONUB** — SONUB 저장소 안에서는 두 번째 체계를 더하지 않고 SONUB 자체의 Laravel 용어 사전(17개 언어, AI 튜터의 목소리) 위에 얹어 동작합니다.

### 설치

위 [설치](#설치--전역사용자-또는-프로젝트) 절과 같고, 플러그인 이름은 **`popup`** 입니다.

```bash
claude plugin marketplace add thruthesky/sonub-skills
claude plugin install popup@sonub-skills                    # 전역 — 모든 프로젝트
claude plugin install popup@sonub-skills --scope project    # 이 프로젝트(팀 공유)
```

도구에는 Python 3.8 이상이 필요합니다. 키트는 최신 브라우저 어디서나 동작합니다.

### 쓰는 법

| 이렇게 말하면 | 하는 일 |
|------|------|
| `/popup docs/getting-started.md` · "이 페이지에 용어 팝업 달아 줘" | 어려운 낱말을 찾고, 항목을 쓰고, 키트를 연결하고, 브라우저에서 확인 |
| `/popup token, sampling, temperature` | 그 세 항목을 쓰고, 쓰이는 곳에 붙임 |
| "메뉴 항목을 마우스 올리면 설명해 줘" | 링크에 마우스 오버 미리 보기를 달고, 휴대폰과 키보드용 "?" 버튼도 넣음 |
| "README 를 초보자도 읽기 쉽게 만들어 줘" | `GLOSSARY.md` 를 만들고, 용어가 처음 나오는 곳마다 링크를 걸어 마우스를 올리면 뜻이 보이게 함 |
| "용어 사전을 일본어로 번역해 줘" | 모든 항목에 `ja` 를 더하고 빠진 것이 없는지 확인 |

플러그인으로 설치했으면 `/popup:popup …` 도 됩니다. Codex 는 `$popup …`.

### 도구 — `scripts/popup.py`

Python 표준 라이브러리만 씁니다.

```bash
python3 scripts/popup.py init popup --locales en,ko   # popup.js/css 복사, glossary.json 시작, .popup.json 작성
python3 scripts/popup.py audit docs                   # 파일별로 쓰인 용어 + 항목이 없는 전문용어
python3 scripts/popup.py add new-terms.json --dry-run # 새 용어 합치기(검사하며, 말없이 덮어쓰지 않음)
python3 scripts/popup.py check                        # 용어 사전 검증
python3 scripts/popup.py md && python3 scripts/popup.py link README.md docs --write   # GitHub 의 Markdown
```

그런 다음 레이아웃에 태그 두 개를 더합니다.

```html
<link rel="stylesheet" href="/popup/popup.css">
<script defer src="/popup/popup.js" data-glossary="/popup/glossary.json"></script>
```

## 저장소 구조

```
.claude-plugin/marketplace.json   ← 마켓플레이스(Claude Code)
skills/gp/
├─ SKILL.md                       ← 스킬: 언제·어떻게 쓰는지
├─ .claude-plugin/plugin.json     ← 플러그인 정보(Claude Code 전용, 다른 도구는 무시)
├─ scripts/gp.py                  ← 도구
└─ references/                    ← 필요할 때 읽는 문서
   ├─ github-projects.md          ← 개념, 계정, 로그인, 첫 보드
   └─ commands.md                 ← 모든 명령 + gh·GraphQL 예시
skills/claude-skill/
├─ SKILL.md                       ← 스킬: 언제·어떻게 쓰는지
├─ .claude-plugin/plugin.json     ← 플러그인 정보(플러그인 이름 cc-skill)
├─ scripts/cc.py                  ← 학습 도구: doctor·docs·read·changelog·update-check·lessons
└─ references/                    ← 레슨 14개 · Academy 분석 · CHANGELOG 기능 요약 · 치트시트 · 만들기 안내 · 팁 · 퀴즈
   ├─ curriculum.md · quiz.md · tips.md
   ├─ academy.md · changelog-features.md
   └─ cheatsheet.md · extend.md
skills/popup/
├─ SKILL.md                       ← 스킬: 언제·어떻게 쓰는지
├─ .claude-plugin/plugin.json     ← 플러그인 정보
├─ assets/                        ← popup.js · popup.css · glossary.example.json · demo.html
├─ scripts/popup.py               ← init, check, audit, add, show, md, link
├─ scripts/sonub/                 ← SONUB 전용 도구(Laravel 용어 사전)
└─ references/                    ← content.md · design.md · integrate.md · projects/sonub.md
```

스킬이 어떻게 동작하는지는 SONUB AI 과정의 **Agent Skills** 챕터에서 배울 수 있습니다: https://sonub.com/ko/learn/ai#agent-skill

라이선스: [MIT](LICENSE)
