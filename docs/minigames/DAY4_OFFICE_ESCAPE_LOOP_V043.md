# DAY 4 퇴근 미니게임 루프 V043

> 9시간 개선 목표의 3–6시간 체크포인트. 기록 시각: 2026-08-01 17:16:30 KST.

- 대상: `부장님 피해서 퇴근하기`
- 브랜치: `minigame/day4`
- 기준 HEAD: `38278f8e8038d3013ee68eaaa291d42393cf8ffb`
- 스냅샷 태그: core JS v17 / runtime JS v45 / CSS v39 / art resolver v14 / dev harness v9
- 상태: 커밋·스테이징하지 않은 작업 트리 스냅샷. 아래 SHA-256으로 이 시점의 실행 파일을 식별한다.
- 이미지 변경: 이 3시간 구간에서는 새 이미지 생성·교체·manifest 변경 없음.
- 출시 판정: 카메라·보행·장소 표시는 동결 가능하지만, 후속 실플레이에서 P1 입력 공정성이 확인되어 V044 수정 전 출시는 보류한다.

## 1. 이 구간에서 확정한 개선

| 축 | V043 결과 |
|---|---|
| 보행 | 500ms 교체 주기를 유지하면서 도윤·하린·부장을 0/150/300ms 위상으로 분산했다. 10초 표본에서 동시 source 교체 0회, 캐릭터 host X/Y 변화 0px이며 점프·슬라이드·보조·호출 정지 포즈와 모션 감소 폴백은 그대로다. |
| 장소 표시 | 359px에서도 `02 / 03 · 복합기 복도` 장소 스탬프가 잘리지 않도록 safe inset과 8px 진입 이동을 적용했다. 359/390px에서 전문 노출과 문서 overflow 0을 확인했다. |
| 전방 카메라 | 420px까지 기존 근거리 투영을 정확히 보존하고, 420~1400px를 smoothstep으로 원거리 압축한다. 일반 화면은 폭의 0.45배·최대 720px, 짧은 가로는 world scale을 반영한 0.65배·최대 1200px 전방 깊이를 사용한다. |
| 장애물 진입 | 640×360에서 후반 위험은 코스 밖 x=712~714px에서 준비되고 첫 16px가 `준비`보다 약 4.1~4.3초, ACT보다 약 4.7~4.9초 먼저 보인다. 390px에서도 후반 위험이 x=543~548px의 화면 밖에서 준비되어 갑작스러운 완성 크기 출현이 없다. |
| 호환성 | 월드 속도·코스 X·충돌 상자·점프 물리·결과 계약·승인 에셋은 바꾸지 않았다. 데스크톱 근거리 투영은 이전 수치와 동일하고, 30/60/120/240Hz 완주 결과는 모두 62.6초·피격 0·수집 3개다. |

## 2. 독립 평가

### 레퍼런스 디자이너

- 1차 시각 동결: **9.0/10**, UI 8.9, 장소 9.2, 속도 9.0, 다양성 8.8, VFX 8.6, 조작 9.2, 공정성 9.5, 보행 9.0. 카메라·스탬프·보행에는 P0/P1 0건으로 `ACCEPT` 판정했다.
- 후속 실제 판정 감사에서는 장애물 원점과 실제 collision rect를 혼동한 타이밍 결함을 P1로 승격했다. PREP 목표 1.25초, 슬라이드 ACT 0.75초, 점프는 0.55초 미리 입력과 약 0.26초 물리 실행을 분리하도록 제안했다.
- 근거: [Super Mario Run](https://supermariorun.com/en/index.html), [Tuning Canabalt](https://www.gamedeveloper.com/design/tuning-canabalt), [Celeste & Forgiveness](https://www.mattmakesgames.com/articles/celeste_and_forgiveness/index.html), [Danganronpa V3](https://www.spike-chunsoft.com/games/danganronpa-v3-killing-harmony/).

### 블라인드 플레이 평가자

- 화면 캡처 기반 평가는 **8.5/10**, 다양성 8, VFX 7이며 성공 결과를 1280/390/640px에서 식별했다.
- 별도 Chrome 실플레이는 첫 점프의 상승·통과를 확인했지만 첫 슬라이드 `지금 슬라이드`를 보고 입력한 뒤 `열린 서랍 충돌 · 슬라이드가 늦었어요`가 발생해 P1을 제기했다.
- 64초 추가 실플레이는 보조 OFF로 41%까지 진행해 사무실→복합기 복도 전환과 케이블 통과를 확인했다. 슬라이드는 다시 충돌했으며 GUI의 실제 hold 재현 한계 때문에 홀드 판정은 루트 지연 입력 계측과 함께 해석한다. P0는 없었다.

### 기술 감사

- 카메라 투영, 짧은 가로 world scale, 보행 위상, cache tag는 `ACCEPT`, P0/P1 0건이다.
- 후속 공정성 감사는 고정 standing player와 hazard collision rect 사이의 진입·이탈 거리로 cue를 계산하고, 기존 단일 점프 예약 상태를 `queued → executed`로 일반화하도록 승인했다. 새 병렬 상태나 월드 변경은 필요하지 않다.

## 3. 브라우저·결정론 검증

| 화면 | V043 계측 | 판정 |
|---|---|---|
| 1280×720 | 코스 폭 1265px, 후반 위험 첫 진입 x=1239~1243px, 화면 진입 뒤 양의 X 역행 0회 | 통과 |
| 390×844 | 첫 점프·슬라이드 각각 클릭 통과, 버튼 170×52px, 장소 스탬프 전문 | 통과 |
| 359×844 | `02 / 03 · 복합기 복도` 전문, 가로 overflow 0 | 통과 |
| 640×360 | 후반 위험 화면 밖 준비, 첫 16px부터 충분한 전방 노출, 월드 X 역행 0회 | 카메라 통과·HUD 후속 결함 있음 |
| 880×360 | 코스 폭 878px, 후반 위험 첫 진입 16~25px, 월드 X 역행 0회 | 통과 |

- 19개 오브젝트(위험 16·수집 3), 위험 6타입, roll/still/scatter/rattle/sway, 세 배경, 랜드마크 6종을 한 압축 런에서 모두 확인했다.
- caught 무입력 결과는 11회 피격, 수집 0/3, 콤보 0으로 정상 완료됐다.
- 일시정지 중 게임 시간·진행률·캐릭터 source/host는 정지한다.

## 4. 자동 검증

- `node --test NAN_GAME_TITLE/tests/*.test.js`: **248/248 통과**.
- core coverage: line 100%, branch 92.56%, function 100%.
- 30/60/120/240Hz perfect-run: 모두 62.6초·피격 0·수집 3·콤보 3.
- core/runtime 문법 검사 통과.
- `python scripts/validate_art_assets.py`: 이미지 63개·생성 로그 63개 통과.
- `git diff --check`: 줄바꿈 변환 예고 외 오류 없음.

## 5. V043에서 발견해 V044로 넘기는 결함

### P1 · cue가 실제 충돌보다 늦다

- 현재 `leadTime=(object.x-state.distance)/speed`는 standing player 우측 `distance+56`과 hazard 좌측 `object.x+width×0.09`를 무시한다.
- 6타입 무입력 1ms trace의 실제 접촉까지 PREP는 1.007~1.029초, jump ACT는 0.323~0.341초, slide ACT는 약 0.515초였다. 요구한 준비 하한 1.10초와 명목 0.55/0.72초에 미달한다.
- 브라우저 첫 슬라이드 ACT는 세 번 478/520/475ms였고, 보조 OFF 지연 입력은 300/400ms 성공·500ms 실패였다.

### P1 · `지금 점프` 즉시 준수가 일부 넓은 위험에서 실패한다

- 현행 ACT 진입 즉시 420ms 점프를 실행하면 기본 위치의 `cable-tutorial`, `paper-stack`, `cart`가 피격되고, 100ms 늦춘 입력은 9개 점프 위험 모두 통과한다. 즉 안내를 더 빨리 따른 플레이어가 불리한 역전 affordance다.
- V044에서는 물리를 바꾸지 않고 0.55초 `미리 탭` 예약과 약 0.26초 물리 실행을 기존 단일 pending 상태로 분리한다.

### P1/P2 · 481~850px HUD

- 640×360에서 90px 위험 열의 18px `퇴근 위기`가 두 행 39.6px이 되어 48px HUD 아래로 침범한다(P1).
- 같은 범위에서 `.oe-items`와 `.oe-item-count`가 모두 숨겨져 선택 수집 진행이 사라진다(P2). 기존 HUD의 첫 열·route grid만 재배치하고 새 카드나 HUD는 만들지 않는다.

### P2 · 일시정지 CSS 동작

- 일시정지 중 논리 상태와 캐릭터 source는 멈추지만 `.oe-item`의 float animation 때문에 1초 동안 화면 Y가 약 6.98px 이동했다. V044에서 기존 course 범위 animation을 일괄 pause한다.

## 6. V044 우선순위와 수용 기준

1. collision-aware 진입·이탈 거리로 PREP 1.25초, slide ACT 0.75초, jump queue 0.55초, physical ACT 약 0.26초를 계산한다.
2. 기존 `pendingTutorialJump` 책임을 단일 `pendingJump { status: queued | executed }`로 확장해 모든 점프를 정확히 한 번 실행하고, pointer/keyboard 중복·취소·pause·blur·visibility·restart·stale target을 정리한다.
3. 500ms 지연 슬라이드와 queue-ready 뒤 150ms 점프 입력을 30/60/120/240Hz 및 50ms step에서 전 위험 무피격으로 고정한다.
4. 481~850px에서 18px 위험어 한 줄, 현재 구간+`수집 n/3` 12px, 3구간 track을 같은 48/56px HUD 안에 유지한다. 480px 기존 단일행은 보존한다.
5. pause 중 course·하위·의사 요소 animation 위치 변화 0.1px 이하, 재개 뒤 정상 진행을 브라우저로 확인한다.
6. 문구는 `미리 탭 → 입력 완료 → 지금 탭/점프 실행` 순서로 단순화하고 role=status 전환은 semantic state당 한 번만 발생시킨다.

## 7. 실행 파일 SHA-256

| 파일 | SHA-256 |
|---|---|
| `js/office-escape-minigame-core.js` | `4B58FB969421E8A396DCFB74C100D56858776708BAFF1B4675D7A4FEBA430ACB` |
| `js/office-escape-minigame.js` | `C1B1FC6FEB535C50B949B44EFEE1D56CFF3E9AABE8F03291221CF43DA7B60650` |
| `css/office-escape-minigame.css` | `BFA5ECC43ADE13FEAA17F0E1D645679A7C83F6496ADC00903B358A2330F1ADA4` |
| `day4.html` | `D875D3EAE060452B8100C3A14EFB0F08C7A221C8A77B74B8D2D6E7B7642AAD10` |
| `dev/day4-office-escape-minigame.html` | `D2EE9BF327A1D9CFDCCDAD6111498495604A48313F08A1C6764AA74B64483F61` |
| `tests/office-escape-minigame-core.test.js` | `E9EA8E7A5651C9125BD67D384897CDBFA5BC68EB3D25FCB388F978F1C36E3B53` |
| `tests/day4-integration.test.js` | `F3EEC870EF24B080632B8AB4F3AFB95AA435FF0A04B23CC3C42277907A7EB07E` |
