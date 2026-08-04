# DAY 4 오피스 이스케이프 V2

DAY 4 미니게임의 코드, 문서, 생산 에셋, 시안과 생성 이력을 이 기능 폴더에서 함께 관리한다. 전역 `assets/art/manifests/art-assets.json`은 안정 ID를 위한 저장소 공용 색인으로만 남긴다.

- V2 플레이 런타임: `core.js`, `index.js`, `style.css`
- 검수 페이지와 승인 보드: `dev/index.html`
- 시안 A: `dev/index.html?composition=a&scene=jump`
- 시안 B: `dev/index.html?composition=b&scene=slide`
- 시안 C: `dev/index.html?composition=c&scene=run`
- 생산 에셋과 생성 이력: `assets/art/`
- 비교 시안과 프롬프트: `assets/art/concepts/`
- 검수 보드와 가공 원본: `assets/art/reviews/`, `assets/art/work/`
- 공개 API: `OfficeEscapeMinigame.start({ onComplete })`, `pause()`, `resume()`, `debugSnapshot()`
- 이전 V044 구현: `legacy/v044/`

V2는 64초 고정 자동 러너다. 1/120초 고정 스텝, 고정 점프, 0.7초 슬라이드, swept AABB 판정으로 18개 장애물과 3개 수집물을 처리한다. 배경 순서는 사무실 A-B-C-A-B-C → 복도 A-B → 로비 A-B-A이며, 마지막에는 기존 승인 엘리베이터 아트가 도착 장면으로 남는다.

`dev/index.html`의 `review 배경` 토글은 Office B/C, Corridor B, Lobby A/B 후보를 본편과 분리해 확인한다. 이 5장은 `review` 상태이며, 버튼 통일안 A/B/C와 함께 사용자 승인 전에는 production UI 또는 active asset에 적용되지 않는다.

검증 명령: `node --test NAN_GAME_TITLE/minigames/day4-office-escape/tests/core.test.js`, `python scripts/validate_art_assets.py` (저장소 루트에서 실행).
