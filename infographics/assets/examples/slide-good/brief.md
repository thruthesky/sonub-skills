# 비용 슬라이드 — infographic brief (slide-good)

## A. Source analysis
- Source: docs/business/modoo-startup.md 1절 (1-1 음성 0원 · 대화 1회 비용 계산 · 하루 한도)
- Reader: 정부 창업지원사업 심사위원 — 화면으로 신청서 이미지 12장을 넘겨 본다
- Purpose: "무료 챗봇·음성 비용을 감당할 수 없다"는 지적이 틀렸다고 판단한다
- Core message: 음성은 0원, 대화 1회 약 1원 — 하루 상한으로 비용이 넘치지 않는다
- Reader questions: 1. 음성 비용은? 2. 대화 1회 비용은? 3. 많이 쓰면 비용이 폭주하나?
- Fact inventory:
  | # | Type | Fact | Source |
  | 1 | number | 음성(STT/TTS) 0원 — 학생 브라우저 안 SenseVoice · Supertonic 3 | 1-1 표 |
  | 2 | number | 대화 1회 약 0.0008달러 ≈ 1.1원 (1달러 = 1,400원 가정) | 대화 1회 비용 계산 |
  | 3 | number | 회원 하루 한도 100만 토큰 · 대화 1회 약 3,400토큰 → 하루 약 290번 | 한도 문단 |
  | 4 | case | 하루 30번 대화하는 학생도 한 달 약 900번 → 월 약 1,000원 | 계산 아래 |
  | 5 | process | 학생 기기(음성) → 서버(대화만) → 하루 상한 | 1절 구조 |
- Gaps: none

## B. Information plan
- Headline: 음성은 0원, 대화 1회 약 1원 — 하루 상한으로 비용이 넘치지 않는다
- Summary: (the three big numbers are the summary)
- Key blocks: 1. HERO three big numbers (facts 1–3) · 2. flow (fact 5) · conclusion strip (fact 4)
- Cut list: R2 storage cost (another slide), TTS languages (not about cost)

## C. Layout
- 16:9 1920×1080 · label → title (2 lines) → hero 3 columns (≈45%) → flow → source note → strip
- Colors: paper base · purple structure · orange accent only on the 3 big numbers

## D. Review
- 5-second: pass — title + "0원 / 약 1원 / 약 290번"
- 30-second: Q1 0원 ✓ · Q2 약 1원 ✓ · Q3 하루 약 290번 한도, 월 약 1,000원 ✓
- Fidelity: every string in result.webp matches prompt.txt letter by letter ✓
- Defects: none · converted to WebP (cwebp -q 82) by Codex to keep the skill small
