# SONUB 에이전트 스킬

SONUB 가 만든 Agent Skills 의 원본이다. sonub.com 이 이 폴더를 그대로 내주고, 누구나 이렇게 설치한다(SSOT 11절 "에이전트 스킬 배포").

```bash
npx skills add https://sonub.com            # 스킬·에이전트를 골라 지금 프로젝트에
npx skills add https://sonub.com -g -s gp   # gp 만, 이 컴퓨터의 모든 프로젝트에
npx skills update                           # 여기서 설치한 스킬을 최신으로
```

| 스킬 | 하는 일 |
| --- | --- |
| [gp](gp/SKILL.md) | 나의 모든 일감을 GitHub Project 보드에서 관리 |
| [claude-skill](claude-skill/SKILL.md) | Claude Code 배우기 · 공식 문서로 답 · 설정 점검 · CHANGELOG 새 기능 |
| [popup](popup/SKILL.md) | 어떤 프로젝트든 문서의 전문 용어를 팝업으로 설명 |
| [cowork](cowork/SKILL.md) | 설치된 AI CLI 를 스캔해 기록하고, 한 질문을 여러 AI 에게 동시에 읽기 전용으로 맡겨 교차검증 |
| [infographics](infographics/SKILL.md) | 원문 분석 → 정보 구성안 → 배치 설계 → 제작 → 검수·수정. 그림(Codex)과 선(곡선·직선·대각선·꺾은선, ig-lines.js)이 필수인 알찬 인포그래픽 · **webmovie 스킬 필수**(없으면 오류로 멈춤, 기존 인포그래픽은 손댈 때마다 webmovie 로 올림) |
| [linkify](linkify/SKILL.md) | 페이지의 단원·챕터·소제목·단락을 누르면 주소가 `…#단원` 으로 바뀌고 클립보드에 복사된다. 그 링크를 열면 그 자리로 스크롤 |
| [webmovie](webmovie/SKILL.md) | HTML 로 만드는 무비 — 동영상 파일 대신 진짜 HTML 장면을 영상처럼 재생한다(재생기·장면 전환·카메라·재생/일시 정지). 제목·숫자·차트·그림·단추는 CSS(필요할 때만 순수 JS) 연출로 움직이고, 글자는 끝까지 텍스트라 SEO·번역·수정이 쉽다. 검사 스크립트(check.mjs) 포함 |

- 설치 안내 화면: https://sonub.com/skills · 목록: https://sonub.com/.well-known/agent-skills/index.json
- 목록·압축(tar.gz)·digest 는 빌드 없이 요청 때 만든다 — [app/Services/SkillCatalog.php](../app/Services/SkillCatalog.php). 파일을 고쳐 배포하면 그대로 새 버전이다(버전 번호를 올리지 않는다).
- 새 스킬: `skills/<이름>/SKILL.md` — frontmatter `name` 은 폴더 이름(소문자·숫자·하이픈), `description` 은 1024자 이하. 숨김 파일·`__pycache__` 는 내주지 않는다. 화면 `/skills` 에 카드를 더한다([resources/views/skills/index.blade.php](../resources/views/skills/index.blade.php) · `lang/*/skills.php`).
- 확인: `docker compose exec app php artisan test tests/Feature/SkillsDiscoveryTest.php tests/Feature/SkillsPageTest.php`
- 라이선스: [MIT](LICENSE)
