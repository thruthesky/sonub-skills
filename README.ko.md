# sonub-skills — SONUB 의 에이전트 스킬

[README](README.md) · [English](README.en.md) · **한국어** · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Português](README.pt.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [العربية](README.ar.md) · [اردو](README.ur.md)

이 저장소는 **스킬 마켓플레이스**입니다. 모든 스킬은 표준 [Agent Skill](https://agentskills.io)(`SKILL.md` 가 든 폴더)이라서 Claude Code, Codex, Gemini CLI, GitHub Copilot CLI 등 Agent Skills 를 읽는 모든 에이전트에서 동작합니다. Claude Code 에서는 이 마켓플레이스(`sonub-skills`)에서 플러그인으로 설치할 수 있어 업데이트가 명령 하나로 끝납니다.

| 스킬 | 하는 일 |
|------|------|
| [`gp`](skills/gp) | git 과 `gh` CLI 로 나의 모든 일감을 **GitHub Project** 에서 관리 |

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

### 저장소 구조

```
.claude-plugin/marketplace.json   ← 마켓플레이스(Claude Code)
skills/gp/
├─ SKILL.md                       ← 스킬: 언제·어떻게 쓰는지
├─ .claude-plugin/plugin.json     ← 플러그인 정보(Claude Code 전용, 다른 도구는 무시)
├─ scripts/gp.py                  ← 도구
└─ references/                    ← 필요할 때 읽는 문서
   ├─ github-projects.md          ← 개념, 계정, 로그인, 첫 보드
   └─ commands.md                 ← 모든 명령 + gh·GraphQL 예시
```

스킬이 어떻게 동작하는지는 SONUB AI 과정의 **Agent Skills** 챕터에서 배울 수 있습니다: https://sonub.com/ko/learn/ai#agent-skill

라이선스: [MIT](LICENSE)
