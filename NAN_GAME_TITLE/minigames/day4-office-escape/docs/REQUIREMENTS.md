# [AUTHORITATIVE] DAY 4 오피스 이스케이프 구조 재작업 계획·진행 추적

- 문서 ID: `DAY4-OFFICE-ESCAPE-STRUCTURAL-RESET-2026-08-05`
- 승인일: 2026-08-05
- 상태: Phase 1~4 `smoke_checked` · Phase 4R-A2 크기 사용자 승인 · Phase 4R-A3 `smoke_checked` · 위치 승인 대기
- 지원 환경: PC 데스크톱 브라우저 전용
- 현재 사용자 승인: Phase 4R-A2 캐릭터 크기는 승인, 세 캐릭터를 같은 이동폭으로 더 왼쪽에 배치해 부장님을 점프 버튼 쪽에 정렬

이 문서는 `부장님 피해서 퇴근하기`의 유일한 구현 요구사항, 실행 계획, 상태 추적 문서다. 구현 에이전트는 작업 전에 이 문서를 처음부터 끝까지 읽고, 현재 담당 Phase만 수정한다.

## 0. 문서 권위와 과거 결정 차단

1. 현재 작업에서 규범적 효력을 갖는 문서는 이 파일 하나뿐이다.
2. Git 이력, 삭제된 계획서, 이전 Phase 기록, `legacy/v044/` 문서, 현재 테스트의 기대값은 제품 결정을 정의하지 않는다.
3. 과거 코드와 테스트는 재사용 후보 또는 현재 동작의 증거일 뿐이다. 이 문서와 충돌하면 이 문서가 우선한다.
4. 이 문서에 없는 제품 결정을 Git 이력이나 legacy 문서에서 복원하지 않는다. 결정이 필요하면 구현을 멈추고 사용자에게 묻는다.
5. 이전 테스트가 예약 입력, 작은 버튼, 작은 시계처럼 폐기된 동작을 요구하면 테스트를 보존하지 않고 현재 계약에 맞게 교체한다.
6. README의 문서 태그는 탐색용이다. 세부 요구사항과 완료 판정은 항상 이 문서에서 확인한다.

### 작업 전 읽기 순서

1. 저장소 `AGENTS.md`
2. `NAN_GAME_TITLE/minigames/day4-office-escape/README.md`
3. 이 문서 전체
4. 담당 Phase의 현재 코드와 직접 관련된 테스트
5. 이미지 작업이 실제로 시작되는 Phase 5에서만 저장소 아트 파이프라인 문서

## 1. 확정 제품 계약

### 1.1 유지할 외부 계약

- 게임은 PC 데스크톱 브라우저만 지원한다. 모바일·터치·세로 화면은 범위 밖이다.
- 기본 플레이 시간은 64초다.
- 위험 오브젝트 18개, 수집물 3개, 현재 코스의 초반 학습·중반 혼합·후반 변주 구조를 유지한다.
- 공개 API `OfficeEscapeMinigame.start({ onComplete })`, `pause()`, `resume()`, `debugSnapshot()`을 유지한다.
- 결과 객체의 `grade`, `caught`, `elapsed`, `hitCount`, `collectedItems`, `maxCombo` 필드를 유지한다.
- `caught`도 정상적인 DAY 4 완료이며 저장·스토리 복귀 계약을 깨지 않는다.
- 하린의 기계적 보조는 호감도와 결합하지 않는다.
- 순수 규칙과 결정론은 `core.js`, DOM·입력·렌더링은 `index.js`, 시각 표현은 `style.css`에 둔다.
- 승인 이미지 경로를 직접 하드코딩하지 않고 `ArtAssets.resolve(id)`를 사용한다.

### 1.2 직접 입력 계약

- 점프·슬라이드는 사용자가 누른 프레임에 시작한다.
- 장애물 ID 기반 입력 예약, 자동 실행, 정답 행동 보정은 사용하지 않는다.
- production cue는 한 플레이에서 첫 점프 위험과 첫 슬라이드 위험에 각각 한 번만 보인다. 재도전은 새 플레이이므로 두 플래그를 초기화한다.
- cue는 행동을 설명하고 위험을 예고할 뿐 입력 시점을 통제하지 않는다. dev 정적 장면은 검수 목적으로 cue를 강제 표시할 수 있다.
- 너무 이르거나 늦은 입력은 실제 충돌 결과로 이어질 수 있다.
- 기존 120ms 점프 버퍼처럼 장애물과 무관한 일반 조작 보정만 허용한다.
- 공정성은 자동 실행이 아니라 가시거리, cue 시작 시점, 장애물 간격, 행동 지속시간으로 확보한다.

### 1.3 좌표·판정 계약

- 캐릭터, 캐릭터 판정, 장애물 art rect, 장애물 collision rect, cue는 하나의 world-to-screen projection을 사용한다.
- 캐릭터 크기를 `cqh`로 따로 확대하지 않는다.
- 도윤·하린·부장님은 모두 bottom-center 앵커를 사용한다. `left`가 어떤 actor에서는 중심이고 다른 actor에서는 왼쪽 모서리가 되는 혼합 규칙을 금지한다.
- 달리기 판정은 불투명 몸체의 약 70~80%, 슬라이드 판정은 실제 몸통·다리 영역의 약 65~75%를 초기 보정 범위로 사용한다.
- 머리카락, 넥타이, 뻗은 손발, 투명 여백 전체를 판정으로 사용하지 않는다.
- 디버그 판정은 코어 판정과 같아야 할 뿐 아니라 보이는 몸체와의 비율도 설명 가능해야 한다.
- Phase 4R-A에서 도윤·하린·부장님의 canonical visual 크기를 Phase 2 확정값의 정확히 `0.90`배로 함께 축소한다. 기준 불투명 높이는 도윤 `224 → 201.6wu`, 하린 `215 → 193.5wu`, 부장님 `233 → 209.7wu`다.
- 도윤의 run/jump/slide collision profile도 동일한 `0.90` 비율로 축소해 기존 body coverage 비율을 보존한다. 렌더 마지막 단계 외의 조기 정수 반올림은 금지한다.
- Phase 4R-A 사용자 반려 뒤 Phase 4R-A2에서 현재 크기를 다시 `0.70`배로 줄인다. 최초 Phase 2 기준 최종 배율은 `0.90 × 0.70 = 0.63`이며, run 불투명 높이는 도윤 `141.12wu`, 하린 `135.45wu`, 부장님 `146.79wu`, 도윤 slide는 `77.49wu`다.
- Phase 4R-A2의 도윤 collision profile은 run/jump `80.01×105.84wu`, slide `71.19×44.1wu`로 같은 비율을 적용한다.

### 1.4 캐릭터 대형 계약

- 화면 진행 방향은 오른쪽이며 대형은 `부장님 → 하린 → 도윤` 순서다.
- 평상시 세 캐릭터의 불투명 실루엣은 서로 겹치지 않는다.
- 추격 압박이 커져도 부장님과 하린의 실루엣은 닿지 않는다.
- 추격 압박은 간격을 줄일 수 있지만 동료처럼 나란히 붙어 달리는 인상을 만들면 안 된다.
- Phase 3의 `62.5%` 공유 anchor는 폐기한다. Phase 4R-A의 시작값은 화면 폭 `56.5%`이며, 단일 projection의 도윤 visual bottom-center·mechanical player center·world origin을 같은 양만큼 함께 이동한다.
- Phase 4R-A3의 최종 shared anchor는 화면 폭 `46%`다. 1440px 기준 기존 56.5% 위치에서 세 캐릭터와 world origin을 동일하게 `151.2px` 왼쪽으로 이동해 부장님 실루엣 왼쪽을 약 `82px`에 둔다.
- 최종 63% 크기에서도 세 캐릭터의 순서와 world-unit 실루엣 간격은 유지한다. 1440×900 steady 장면에서 부장님 실루엣의 80% 이상이 화면 안에 있고, 도윤 실루엣 오른쪽부터 플레이필드 오른쪽까지 화면 폭의 32% 이상이 보여야 한다.
- Phase 4R-A의 1.2초 노출 목표는 1.5배 속도 결정으로 대체한다. 새 속도의 실제 입력 여유는 자동 수치만으로 승인하지 않고 1440×900 점프·슬라이드 사용자 검수로 확정한다.

### 1.5 장애물 계약

- 기존 승인 에셋을 먼저 재사용하고 크기·위치·판정을 단일 projection 안에서 조정한다.
- 점프 장애물의 보이는 윗면과 충돌 상단은 같은 위치로 읽혀야 한다.
- 슬라이드 장애물은 서 있는 캐릭터의 머리·상체와 충돌하고 슬라이딩 몸체는 명확히 통과해야 한다.
- 슬라이드 장애물은 캐릭터에 비해 충분한 폭과 높이를 가져야 하며, 작은 물체가 공중에 떠 있는 인상을 허용하지 않는다.
- 기존 에셋의 의미가 동작과 맞지 않으면 억지로 확대하지 않고 별도 아트 후보로 분리한다.
- 충돌한 장애물은 판정 즉시 화면에서 제거한다. 피격 강조는 장애물 잔류가 아니라 별도의 충격·문구 효과로 표시한다.
- Phase 4R-B의 상단 장애물은 Phase 4R-A 크기 승인 뒤 다시 계산한다. 보이는 하단이 서 있는 도윤의 목 아래~어깨선 band에 오고, 슬라이드 몸체 위에는 명확한 가시 여유가 있어야 한다.
- 공중에 뜬 서랍·안내판 표현은 production 의미로 승인하지 않는다. overhead cabinet, 천장 beam 또는 cable-duct 계열의 새 후보로 교체하며 아트 파이프라인·manifest·사용자 승인 전에는 production `active_version`을 바꾸지 않는다.
- Phase 4R-A2에서 production 위험물의 logical width·height와 파생 art/collision rect를 현재 값의 `0.70`배로 축소한다. custom/dev course의 명시적 geometry는 자동 변환하지 않는다.
- 기본 64초와 각 beat의 충돌 시각은 유지하면서 world travel·위험물 접근·collision cue 속도를 현재의 `1.50`배로 높인다. 배경 경로 시간, 점프 물리, 0.7초 슬라이드 지속시간은 바꾸지 않는다.

### 1.6 오브젝트 구분 계약

- 위험물에는 초록 오라·수집 유도 테두리·수집용 sparkle을 적용하지 않는다.
- 수집물에만 부드러운 초록 오라를 적용한다. 오라는 낮은 강도의 pulse, 작은 상하 bob, 드문 소형 sparkle을 조합하되 collision rect와 DOM 위치 계산에는 영향을 주지 않는다.
- 색각 차이를 고려해 초록색만이 아니라 bob 또는 sparkle 중 하나 이상의 비색상 단서가 항상 남아야 한다.
- 오라가 인물, cue, 상단 HUD보다 강한 발광 면적을 만들거나 위험물의 윤곽을 가리면 실패다.

### 1.7 UI 계약

- 점프·슬라이드 조작은 `104×104px`, 원형, 2px 링, 약 34px 아이콘의 좌우 대칭 버튼으로 복원한다.
- 버튼 내부는 `JUMP`, `SLIDE` 행동 라벨을 사용하고 키보드 정보는 접근성 라벨 또는 방해되지 않는 보조 정보로 제공한다.
- 좌상단 `17:58`은 큰 시각 정보로 복원한다. 기본 크기 범위는 `30~46px`이며 `현재 시각`처럼 실제 동작과 맞지 않는 문구를 붙이지 않는다.
- 진행 경로의 아이콘·지명과 진행 bar는 서로 다른 행 또는 명확히 분리된 레이어를 사용한다. bar가 글자를 통과하면 실패다.
- 화면 하단 주황색 `.oe2-floor-guide`는 제거한다. 의미 없는 가로선을 다른 진행 정보로 오인하게 만들지 않는다.
- dev 도구 복구 버튼은 게임 HUD와 겹치지 않는 dev 전용 안전 영역에 둔다.
- 결과 화면은 배경 조작보다 높은 위계를 가지며 종료 후 점프·슬라이드·pause가 실행되지 않아야 한다.

### 1.8 결과 의미 계약

- `grade`는 기존 호환성을 위해 피격 횟수 기반으로 유지한다.
- 화면에서는 `무피격 PERFECT`처럼 등급 근거를 함께 표시한다.
- 수집물은 `수집 0/3 · 선택 목표`처럼 등급과 별도의 선택 목표로 표시한다.
- `PERFECT`와 `수집 0/3`이 설명 없이 병치되어 모순처럼 보이면 실패다.

### 1.9 애니메이션 계약

- 4프레임 달리기는 구조 수정과 사용자 플레이 승인이 끝난 뒤 별도 이미지 Phase로 진행한다.
- 프레임 수를 늘리기 전에 발바닥 중심, 몸 중심, 캔버스 여백, 불투명 bounds를 정규화한다.
- 각 캐릭터는 왼쪽 다리가 앞서는 서로 다른 2장과 오른쪽 다리가 앞서는 서로 다른 2장, 총 4장으로 구성한다. 순서는 `왼발 contact/recovery → 오른발 contact/recovery`로 읽혀야 한다.
- 한 4프레임 cycle은 정확히 `1.5초`, 프레임당 `375ms`로 반복한다. gameplay 속도·물리 시간은 바꾸지 않는다.
- 부장님은 같은 lead leg를 둔 2장을 반복하지 않는다. 하린은 한 프레임에서 무릎·발이 갑자기 과도하게 올라가는 high-knee 실루엣을 사용하지 않는다.
- 도윤·하린·부장님은 각각 독립된 gait phase offset을 사용하며 완전히 동기화된 단체 동작을 피한다.
- 신규 또는 재가공 이미지는 `planned → draft → review → approved`를 따르며 사용자 승인 전 production에 적용하지 않는다.

## 2. 현재 문제 목록

상태 흐름은 `planned → in_progress → code_complete → smoke_checked → user_accepted`만 사용한다. 개별 Phase에서 `verified`라는 표현을 사용하지 않는다. 최종 통합 게이트 이전의 자동 테스트 통과는 사용자 경험 완료를 의미하지 않는다.

| ID | 우선순위 | 현재 증상 | 구조 원인 | 담당 Phase | 상태 |
|---|---|---|---|---|---|
| INP-01 | P0 | 입력한 순간이 아니라 장애물 시점에 점프·슬라이드 실행 | 장애물별 예약 입력과 ACT 자동 실행 | 1 | smoke_checked |
| INP-02 | P1 | 같은 키가 cue 단계에 따라 즉시 실행되거나 예약됨 | 입력 API가 게임 상태에 따라 다른 의미를 가짐 | 1 | smoke_checked |
| GEO-01 | P0 | 캐릭터에 비해 도윤 판정이 지나치게 작음 | 캐릭터는 높이 기준, 판정은 너비 기준으로 확대 | 2 | smoke_checked |
| GEO-02 | P0 | 도윤과 하린이 거의 같은 위치에 겹침 | 도윤은 center, 하린은 left-edge 앵커 | 2·3 | smoke_checked |
| GEO-03 | P1 | 슬라이드 그림과 슬라이드 판정 폭·높이가 크게 다름 | 포즈 art와 물리 profile이 독립적으로 조정됨 | 2 | smoke_checked |
| FORM-01 | P1 | 부장님과 하린이 함께 달리는 것처럼 가까움 | left-edge 배치와 추격 이동이 실루엣 간격을 보장하지 않음 | 3 | smoke_checked |
| HAZ-01 | P1 | 슬라이드 장애물이 사람에 비해 작고 공중에 뜬 것처럼 보임 | 고정 world 크기와 actor 전용 스케일 분리 | 3 | smoke_checked (physics) · ART-BACKLOG |
| HAZ-02 | P1 | 보이는 물체와 실제 접촉 시점이 다르게 느껴짐 | visual rect, collision rect, player silhouette 관계 미검증 | 3 | smoke_checked |
| OBJ-01 | P1 | 피격 장애물이 버그처럼 잠시 남아 보임 | 해결 후 별도 exiting 상태로 재표시 | 3 | smoke_checked |
| UI-01 | P1 | 조작 버튼이 작고 사각형으로 회귀 | 보조 입력 위계를 이유로 승인된 원형 형태를 교체 | 4 | smoke_checked |
| UI-02 | P1 | `17:58`이 지나치게 작고 의미도 불분명 | HUD 축소 과정에서 정보 위계를 과도하게 낮춤 | 4 | smoke_checked |
| UI-03 | P1 | 진행 bar가 지명 글자를 통과 | bar와 milestone 텍스트가 같은 중앙 행을 공유 | 4 | smoke_checked |
| UI-04 | P2 | 화면 하단 주황선이 진행 정보처럼 보임 | 의미 없는 바닥 장식선 | 4 | smoke_checked |
| DEV-01 | P2 | `검수 도구 열기`가 좌상단 HUD를 침범 | dev toggle이 게임 HUD 좌표에 fixed 배치 | 4 | smoke_checked |
| RESULT-01 | P2 | `PERFECT`와 `수집 0/3`의 의미가 충돌 | 등급 근거와 선택 목표의 설명 부재 | 4 | smoke_checked |
| SCALE-01 | P0 | 확대된 세 캐릭터가 화면을 과도하게 점유 | Phase 2 canonical visual size가 실제 플레이 가시거리보다 큼 | 4R-A | code_complete |
| VIEW-01 | P0 | 도윤이 너무 앞에 있어 장애물 판단 시간이 부족 | 62.5% 공유 anchor와 큰 실루엣이 전방 시야를 압축 | 4R-A | code_complete |
| SCALE-02 | P0 | 4R-A 이후에도 캐릭터가 너무 큼 | 10% 축소만으로 실제 플레이 점유율을 해결하지 못함 | 4R-A2 | smoke_checked |
| HAZ-04 | P0 | 캐릭터 재축소 뒤 장애물 비율과 회피 판정 재동기화 필요 | actor와 production hazard geometry의 배율 분리 | 4R-A2 | smoke_checked |
| SPEED-01 | P0 | 점프·슬라이드를 실행해도 느린 장애물이 행동 종료 뒤 남아 충돌 | 세계 접근 속도와 고정 행동 지속시간의 부조화 | 4R-A2 | smoke_checked |
| POS-01 | P1 | 승인된 크기에서도 추격 대형 전체가 오른쪽에 치우침 | 56.5% shared anchor가 축소 후 대형에 비해 큼 | 4R-A3 | smoke_checked |
| HAZ-03 | P0 | 슬라이드 장애물 높이·크기가 조정 후 캐릭터와 불일치 | actor scale 확정 전에 장애물 세로 위치를 고정 | 4R-B | planned |
| ART-01 | P1 | 서랍·안내판이 머리 높이에서 공중에 뜬 가구로 보임 | 동작 의미와 기존 prop 실루엣 불일치 | 4R-B | planned · approval-gated |
| CUE-01 | P1 | 반복 cue가 플레이어 판단을 과도하게 대신함 | 모든 위험에서 같은 행동 안내가 반복됨 | 4R-C | planned |
| ITEM-01 | P1 | 피해야 할 위험물과 얻어야 할 수집물이 즉시 구분되지 않음 | 수집물만의 안정적인 시각 채널 부재 | 4R-C | planned |
| ANIM-01 | P2 | 달리기가 느린 두 장 교체처럼 보임 | 500ms 간격 2프레임과 프레임 anchor 부족 | 5 | planned |
| ANIM-02 | P2 | 세 캐릭터가 같은 박자로 움직임 | 캐릭터별 gait phase가 렌더링에 적용되지 않음 | 5 | planned |
| TEST-01 | P0 | 테스트가 잘못된 동작을 성공 조건으로 보호 | 내부 일치·문자열·overflow 중심 검증 | 1~6 | smoke_checked (Phase 1 timing · Phase 2 geometry · Phase 3 formation/hazard/lifecycle · Phase 4 HUD/result) · Phase 4R-A geometry code_complete |

## 3. 최소 검증 원칙

사용자 경험을 코드 수정 전에 테스트로 과도하게 고정하지 않는다.

- 각 구현 Phase는 담당 문제에 직접 관련된 테스트만 실행한다.
- 각 Phase의 브라우저 확인은 기본적으로 1440×900 한 해상도의 핵심 장면만 본다.
- 1280×720, 1440×900, 1920×1080 전체 검증은 Phase 6에서 한 번만 한다.
- 이미지 또는 manifest를 변경하지 않은 Phase에서는 아트 검증을 실행하지 않는다.
- 같은 증거를 부모 에이전트가 반복 재검증하지 않는다. 구현자가 기록한 명령·결과와 한 번의 smoke check를 사용한다.
- 자동 테스트는 구현 계약을 보호하되 캐릭터 겹침, 체감 크기, 조작감의 사용자 승인을 대신하지 않는다.
- `smoke_checked`는 핵심 장면이 열리고 목표 동작이 관찰됐다는 의미다. 완료 또는 사용자 승인과 동의어가 아니다.

## 4. 순차 구현 계획

### Phase 0 · 문서 하드 리셋

- 담당: 주 에이전트
- 상태: `completed`
- 제품 코드 변경: 금지

작업:

1. 과거 계획서를 활성 문서 트리에서 제거한다.
2. 이 파일을 유일한 권위 문서로 다시 작성한다.
3. README에 `[AUTHORITATIVE]`, `[FEATURE ENTRYPOINT]`, `[LEGACY — DO NOT USE]` 태그를 추가한다.
4. 과거 결정은 Git 이력에만 남기고 현재 구현 판단에 사용하지 않도록 명시한다.

완료 기준:

- DAY 4 README에서 구현 기준으로 연결되는 문서는 이 파일 하나다.
- 삭제된 계획서 이름을 활성 README와 현재 `docs/`에서 찾을 수 없다.
- legacy 링크에는 구현·결정 참고 금지 표기가 있다.

### Phase 1 · 입력 예약 제거와 직접 조작 복구

- 상태: `smoke_checked`
- 담당 하위 모델: `gpt-5.6-sol`, reasoning `medium`, 단일 실행
- 의존성: Phase 0
- 담당 이슈: INP-01, INP-02, TEST-01 timing
- 허용 파일: `core.js`, `index.js`, 직접 관련 테스트, 캐시 버전이 있는 `day4.html`·`dev/index.html`
- 금지: 캐릭터 크기, 장애물 크기, HUD, 코스 순서, 이미지

구현 작업:

1. `reservedInput`, `reserveInput()`, `inputQueued`, `inputExecuted`와 장애물 ID 기반 자동 실행을 제거한다.
2. `pressJump()`와 `commitSlide()`가 호출된 fixed step에서 즉시 행동 상태를 시작하도록 복원한다.
3. queued 버튼 class와 `자동 실행 대기`, `알맞을 때 실행` 문구를 제거한다.
4. cue는 `준비`와 `지금`의 시각 안내만 제공하고 입력을 저장하지 않는다.
5. 기존 120ms 점프 버퍼, 고정 점프, 0.7초 슬라이드와 회복 규칙은 유지한다.
6. 예약 입력을 정답으로 요구하는 테스트를 삭제하고 즉시 반응 계약으로 교체한다.

합격 기준:

- 점프·슬라이드 입력 후 행동 이벤트가 최대 fixed step 1회 이내에 발생한다.
- 입력 직후 snapshot에서 점프 Y/velocity 또는 sliding 상태 변화가 관찰된다.
- snapshot과 DOM에 `reservedInput`, queued 상태, 자동 실행 문구가 없다.
- cue 단계가 달라도 동일한 입력 API의 의미가 바뀌지 않는다.
- 첫 점프·슬라이드는 1440×900 smoke play에서 키를 누른 순간 움직인다.

최소 검증:

- 입력·점프·슬라이드 관련 코어 테스트
- 예약 문자열과 상태가 production 코드에 남지 않았는지 정적 검사
- 1440×900에서 첫 점프와 첫 슬라이드 각 1회

중단 기준:

- 직접 입력을 살리기 위해 코스 순서나 장애물 크기를 함께 바꿔야 하면 Phase 1을 멈추고 Phase 3 backlog로 기록한다.

### Phase 2 · 캐릭터·판정 단일 스케일과 앵커

- 상태: `smoke_checked`
- 담당 하위 모델: `gpt-5.6-sol`, reasoning `medium`, 단일 실행
- 의존성: Phase 1 `smoke_checked`
- 담당 이슈: GEO-01, GEO-02의 앵커 부분, GEO-03, TEST-01 geometry
- 허용 파일: `core.js`, `index.js`, `style.css`, `art-assets.js`의 비이미지 메트릭, dev 판정 보기, 직접 관련 테스트
- 금지: actor 간 최종 간격, 장애물 코스 데이터, HUD, 이미지·manifest

구현 작업:

1. 1440×900에서 현재 승인 캐릭터의 목표 불투명 높이를 측정하고 world unit으로 한 번 변환해 canonical visual height를 정한다.
2. actor의 `cqh` 크기 규칙을 제거하고 canonical world 크기를 공통 projection으로 화면에 투영한다.
3. 도윤·하린·부장님 host를 모두 bottom-center 앵커로 통일한다.
4. run, jump, slide별 불투명 bounds와 발바닥 중심을 기록한다. 필요한 경우 기존 `Art.metrics()`를 수평 anchor 메타데이터까지 확장한다.
5. 코어 player profile과 보이는 도윤 몸체의 관계를 명시하고 run 판정을 불투명 몸체의 70~80% 범위로 보정한다.
6. slide 판정은 긴 투명 캔버스 전체가 아니라 실제 몸통·다리의 65~75% 범위로 보정한다.
7. dev 판정 보기에 opaque body 기준 가이드와 실제 collision rect를 동시에 표시한다.

합격 기준:

- 세 actor가 같은 projection과 같은 anchor 의미를 사용한다.
- run/jump/slide 전환 시 도윤 발바닥 중심 X 오차가 1px 이하이다.
- 1440×900에서 run 판정 높이는 불투명 몸체의 70~80%, slide 판정은 실제 몸통·다리 영역의 65~75%다.
- 캐릭터 크기 계산에 `cqh`가 사용되지 않는다.
- 디버그 판정과 실제 코어 판정의 오차가 1px 이하이며, 보이는 몸체와의 비율도 위 범위에 들어온다.

최소 검증:

- projection·pose anchor·player rect 관련 테스트
- 1440×900 판정 보기에서 run/jump/slide 각 1장

중단 기준:

- 승인 이미지의 프레임 여백 차이 때문에 코드 메트릭만으로 anchor를 맞출 수 없으면 이미지를 임의 편집하지 않고 Phase 5 입력으로 기록한다.

### Phase 3 · 캐릭터 간격, 장애물 물리 크기, 피격 수명주기

- 상태: `smoke_checked`

- 담당 하위 모델: `gpt-5.6-sol`, reasoning `medium`, 단일 실행
- 의존성: Phase 2 `smoke_checked`
- 담당 이슈: GEO-02의 대형 부분, FORM-01, HAZ-01, HAZ-02, OBJ-01
- 허용 파일: `core.js`, `index.js`, `style.css`, dev 장면·판정 보기, 직접 관련 테스트
- 금지: HUD, 결과 등급 계약, 이미지 생성·manifest, 4프레임

구현 작업:

1. actor 위치를 host left가 아니라 불투명 silhouette의 bottom-center 기준으로 배치한다.
2. steady 상태에서 도윤–하린, 하린–부장님 silhouette intersection이 0이 되도록 기준 대형을 정한다.
3. chase pressure는 부장님–하린 최소 가시 간격을 침범하지 않는 범위로 clamp한다.
4. 점프·슬라이드 장애물의 art rect와 collision rect를 Phase 2 projection으로 다시 계산한다.
5. 슬라이드 장애물은 서 있는 몸체와 겹치고 slide rect 위에 최소 8 world unit의 통과 여유가 생기도록 세로 위치를 맞춘다.
6. 슬라이드 장애물의 보이는 폭은 도윤 불투명 몸체 폭의 0.9배 이상을 시작 기준으로 삼고, 보이는 높이는 도윤 키의 18~32% 범위에서 조정한다.
7. 장애물의 보이는 하단·상단과 collision rect 경계가 1440×900에서 4px 이내로 설명되게 한다.
8. 충돌 시 해당 장애물을 즉시 hidden 처리하고 `exitingObjects` 재표시 경로를 제거한다.
9. hit-stop, 문구, 화면 플래시 등 별도 피격 피드백은 유지할 수 있으나 장애물 DOM을 잔류시키지 않는다.
10. 기존 에셋으로 의미가 성립하지 않는 슬라이드 장애물은 코드에서 억지 보정하지 않고 `ART-BACKLOG`로 기록한다.

합격 기준:

- 1440×900 steady 상태에서 세 actor silhouette 교차 면적이 0이다.
- 최대 chase pressure에서도 부장님과 하린 사이에 최소 16px 또는 플레이필드 폭 1% 중 큰 값 이상의 가시 간격이 있다.
- 서 있는 도윤은 slide 장애물과 충돌하고, slide rect는 같은 장애물을 명확히 통과한다.
- 장애물이 캐릭터 대비 식별 가능한 크기이며 작은 물체가 공중에 떠 있는 인상을 주지 않는다.
- hit/avoid/collect된 오브젝트는 다음 렌더에서 보이지 않으며 결과 이벤트가 중복되지 않는다.

최소 검증:

- actor bounds, hazard vertical overlap, resolved lifecycle 관련 대상 테스트
- 1440×900에서 steady, maximum chase, jump hazard, slide hazard, hit 직후 각 1장

중단 기준:

- 기존 승인 에셋으로 슬라이드 동작의 의미가 성립하지 않으면 Phase 3 코드는 완료하고 해당 장애물만 Phase 5 이전 별도 사용자 아트 결정으로 남긴다.

ART-BACKLOG: 승인된 `drawer`·`sign`은 바닥 가구·안내판 실루엣이라 머리·상체 높이에 배치하면 공중에 뜬 물체로 읽힌다. Phase 3 물리·판정은 완료하되, production 의미 확정 전 overhead cabinet/beam 계열 별도 사용자 아트 결정을 진행한다.

구현 관계: Phase 3 최종 대형은 화면 폭 62.5%의 공유 anchor를 도윤 visual bottom-center이자 mechanical player collision 중심으로 함께 사용한다. world origin도 같은 양만큼 이동하므로 장애물 art/collision, cue, player 판정의 상대 좌표는 유지되며 대형만 별도 합성하지 않는다.

### Phase 4 · 조작 버튼·상단 HUD·진행도·결과 복원

- 상태: `smoke_checked`
- 담당 하위 모델: `gpt-5.6-sol`, reasoning `medium`, 단일 실행
- 의존성: Phase 3 `smoke_checked`
- 담당 이슈: UI-01~04, DEV-01, RESULT-01
- 허용 파일: `index.js`, `style.css`, `dev/index.html`, `dev/dev.js`, 직접 관련 통합 테스트, 캐시 버전 파일
- 금지: 코어 물리, 코스 순서, actor·장애물 크기, 이미지

구현 작업:

1. 점프·슬라이드를 104px 원형 링, 2px 테두리, 약 34px 아이콘의 대칭 컴포넌트로 복원한다.
2. 버튼 내부의 작은 사각 keycap 레이아웃을 제거하고 `JUMP`, `SLIDE` 행동 위계를 회복한다.
3. `17:58`을 `clamp(30px, 2.75vw, 46px)` 범위로 복원하고 고정 값과 모순되는 `현재 시각` 문구를 제거한다.
4. 진행 bar는 milestone 아이콘 행을 통과할 수 있지만 지명 텍스트 행과는 분리한다.
5. 상단 HUD는 플레이필드를 불필요하게 압박하지 않되 글자·bar·도구가 겹치지 않는 높이를 사용한다. 68px 강제 목표를 사용하지 않는다.
6. `.oe2-floor-guide` DOM과 CSS를 제거한다. 실제 속도선이 필요하면 의미가 다른 별도 요소만 유지한다.
7. dev 도구 toggle은 게임 HUD bounding rect와 교차하지 않는 오른쪽 가장자리 안전 영역으로 옮긴다.
8. 결과 제목을 `무피격 PERFECT`처럼 등급 근거와 결합하고 수집물을 선택 목표로 분리한다.
9. 결과 진입 시 조작 버튼 disabled, CTA focus, pause 중단, 재시작 초기화 계약은 유지한다.

합격 기준:

- 두 행동 버튼의 계산 크기가 104×104px이고 `border-radius: 50%`다.
- 1280px 이상 지원 폭에서 버튼이 도윤·첫 위험·cue와 겹치지 않는다.
- `17:58` 계산 글자 크기가 30px 미만으로 내려가지 않는다.
- 진행 bar와 지명 텍스트의 bounding rect 교차가 0이다.
- 주황색 바닥선이 DOM과 계산 스타일에 존재하지 않는다.
- dev toggle과 게임 HUD의 bounding rect 교차가 0이다.
- 결과 화면만 보고 등급과 수집 목표의 관계를 설명할 수 있다.

최소 검증:

- HUD 구조·결과 상태 관련 대상 테스트
- 1440×900에서 기본 HUD, 첫 위험, 결과, dev 접힘 상태 각 1장

중단 기준:

- HUD 높이를 줄이기 위해 시계 또는 조작 버튼을 다시 축소해야 하면 해당 변경을 하지 않고 레이아웃을 재구성한다.

### Phase 4R · 사용자 플레이 피드백 재조정

Phase 4R은 Phase 1~4의 기록을 되돌리지 않고, 실제 플레이에서 새로 드러난 크기·가시거리·오브젝트 구분 문제를 별도 이슈로 수정한다. 아래 A→B→C를 순차 실행하며, 앞 단계의 사용자 확인이 필요한 수치를 뒤 단계가 임의로 선행 확정하지 않는다.

#### Phase 4R-A · 캐릭터 10% 축소와 전방 판단시간 확보

- 상태: `code_complete`
- 담당 하위 모델: `gpt-5.6-sol`, reasoning `medium`, 단일 실행
- 의존성: Phase 4 `smoke_checked`
- 담당 이슈: SCALE-01, VIEW-01, TEST-01 geometry
- 허용 파일: `core.js`, `index.js`, `style.css`, `art-assets.js`의 비이미지 메트릭, dev 장면·판정 보기, 직접 관련 테스트, 캐시 버전 파일
- 금지: 장애물 크기·세로 위치·코스 시간, cue 횟수, 수집물 오라, HUD, 이미지·manifest, gait frame 수·속도

구현 작업:

1. 모든 actor canonical opaque height를 현재 값의 정확히 `0.90`배로 바꾼다: 도윤 `201.6wu`, 하린 `193.5wu`, 부장님 `209.7wu`.
2. 도윤 run/jump/slide collision profile과 pose reference size도 같은 비율로 축소해 보이는 몸체 대비 판정 비율을 유지한다.
3. 공유 anchor 시작값을 `62.5% → 56.5%`로 바꾸고 visual bottom-center, mechanical player center, world origin을 한 축으로 함께 이동한다.
4. actor 사이 world-unit silhouette gap은 유지하며 chase clamp와 화면 왼쪽 가시성을 다시 확인한다.
5. dev 판정 보기와 debug snapshot에 새 크기·anchor·forward-view 수치가 같은 projection에서 드러나게 한다.
6. 기존 테스트의 옛 절대 크기·62.5% 기대값을 새 계약으로 교체한다. legacy 값에 맞추려고 호환 분기를 만들지 않는다.

합격 기준:

- 세 캐릭터의 canonical opaque height와 도윤 collision profile이 각각 이전 값의 `0.90`배다.
- 1440×900 steady 장면에서 actor 실루엣 교차가 0이고 부장님 불투명 실루엣의 80% 이상이 화면 안에 있다.
- 도윤 실루엣 오른쪽부터 화면 오른쪽까지 폭이 플레이필드 폭의 32% 이상이다.
- 첫 점프·첫 슬라이드 위험이 정상 속도에서 충돌 전 식별 가능한 상태로 목표 1.2초 이상 보인다. 시간 목표가 anchor 범위 `54~57%`와 화면 가시성 조건을 동시에 만족하지 못하면 코스 시간을 건드리지 않고 중단·보고한다.
- run/jump/slide 전환의 발바닥 중심 X 오차와 dev 판정/코어 판정 오차가 각각 1px 이하로 유지된다.

최소 검증:

- actor metric·collision profile·projection·formation 관련 대상 테스트
- production 코드의 폐기된 `0.625` anchor 정적 검사
- 1440×900 steady와 첫 점프 위험 진입 장면 각 1회

사용자 확인 게이트:

- 사용자가 캐릭터 크기를 여전히 너무 크다고 반려했으므로 Phase 4R-A는 `user_accepted`로 승격하지 않는다. 아래 A2 결과를 새 승인 대상으로 사용한다.

#### Phase 4R-A2 · 추가 30% 축소와 1.5배 접근 속도

- 상태: `smoke_checked`
- 담당: 주 에이전트
- 의존성: Phase 4R-A `code_complete`와 사용자 반려 피드백
- 담당 이슈: SCALE-02, HAZ-04, SPEED-01
- 허용 파일: `core.js`, `art-assets.js`, `index.js`, dev 장면, 직접 관련 테스트, 캐시 버전, 이 문서
- 금지: 새 이미지·manifest, HUD, cue 횟수, 수집물 오라, gait frame, course beat 시각·순서, 점프·슬라이드 지속시간

구현 작업:

1. 4R-A actor visual metric과 도윤 collision/reference profile을 다시 `0.70`배로 축소한다.
2. production `COURSE_BEATS`에서 만들어지는 위험물 logical width·height·y를 `0.70`배로 만들고 art/collision rect가 같은 파생 경로를 사용하게 한다.
3. dev/custom course의 명시 geometry는 테스트·검수 override이므로 자동 축소하지 않는다.
4. 64초와 beat 시각을 유지한 채 effective world travel distance, `distanceAt()`, `speedAt()`, course object X, progress/finish 기준을 일관되게 `1.50`배로 만든다.
5. fixed-step swept collision과 cue leadTime이 같은 속도 함수를 사용하게 유지한다.
6. 점프 정점 구간과 0.7초 slide 구간 중 장애물이 player collision rect를 완전히 통과해 `avoid`로 끝나는 대상 테스트를 추가한다.
7. 1440×900에서 run·첫 jump·첫 slide 화면과 실제 회피 이벤트를 확인하고 사용자에게 화면 검수를 요청한다.

합격 기준:

- actor·player profile의 새 값이 4R-A 값의 정확히 `0.70`배이며 최초 기준 `0.63`배다.
- production 위험물의 logical geometry와 파생 art/collision geometry가 현재 기준 `0.70`배다.
- 기본 게임은 여전히 64초에 종료되고 hazard beat 순서·목표 충돌 시각은 유지된다.
- 같은 시점의 `speedAt()`과 화면상 접근 속도가 4R-A 대비 정확히 `1.50`배다.
- 첫 점프와 첫 슬라이드를 올바른 행동 구간에 실행하면 `hit/assist`가 아니라 `avoid`가 발생한다.
- 1440×900 화면에서 크기·간격·가독성을 사용자가 승인하기 전 상태는 최대 `smoke_checked`까지만 기록한다.

사용자 확인 게이트:

- Phase 4R-B는 사용자가 A2 화면의 캐릭터 크기, 장애물 상대 크기, 점프·슬라이드 체감을 승인한 뒤 시작한다.

#### Phase 4R-A3 · 추격 대형 전체 좌측 이동

- 상태: `smoke_checked`
- 담당: 주 에이전트
- 의존성: Phase 4R-A2 캐릭터 크기 사용자 승인
- 담당 이슈: POS-01
- 허용 파일: `core.js`, projection·formation 관련 대상 테스트, dev·본편 캐시 버전, 이 문서와 README 상태
- 금지: 캐릭터·장애물 크기, actor 사이 gap, chase clamp, 속도·course, cue, HUD, 이미지·manifest

구현 작업:

1. shared player anchor ratio를 `0.565 → 0.46`으로 변경한다.
2. visual bottom-center, mechanical player center, world origin을 동일한 이동폭으로 유지해 세 캐릭터·판정·장애물의 상대 좌표를 보존한다.
3. 1440×900 steady 장면에서 부장님 실루엣 왼쪽이 점프 버튼 가로 영역 안인 약 `82px`에 오는지 확인한다.

합격 기준:

- 1440px에서 세 actor anchor와 world origin의 이동량이 모두 `-151.2px`다.
- 부장님·하린·도윤의 실루엣 교차는 0이며 기존 world-unit gap이 유지된다.
- 부장님 실루엣은 화면 안에 남고 왼쪽 경계가 `70~100px` 범위다.
- 크기·속도·장애물 geometry·HUD 값에는 변화가 없다.

#### Phase 4R-B · 상단 장애물 재보정과 prop 교체

- 상태: `planned`
- 담당 하위 모델: `gpt-5.6-sol`, reasoning `medium`, 단일 실행
- 의존성: Phase 4R-A2 사용자 크기·장애물 비율·회피 체감 확인
- 담당 이슈: HAZ-03, ART-01, HAZ-01의 ART-BACKLOG
- 사전 스킬: `day4-office-escape-loop`, `sprite-pipeline`; 새 raster 후보가 필요할 때 `imagegen`
- 허용 파일: 장애물 geometry·runtime·dev 장면·직접 관련 테스트, 승인된 아트 파이프라인 범위, manifest와 generation log
- 금지: actor 크기·anchor 재조정, 코스 시간, cue·수집물 오라, HUD, 4프레임 actor animation, 승인 전 production active version 교체

구현 작업:

1. Phase 4R-A에서 승인된 standing/slide body bounds를 기준으로 상단 장애물 하단을 목 아래~어깨선 band에 맞춘다.
2. standing rect는 확실히 충돌하고 slide rect 위에는 최소 8 world unit과 1440×900에서 식별 가능한 가시 여유가 모두 남게 한다.
3. 장애물 art rect와 collision rect의 하단·상단 오차를 1440×900에서 4px 이하로 유지한다.
4. 공중에 뜬 drawer/sign 의미를 overhead cabinet, beam 또는 cable-duct 후보로 교체한다. 기존 승인 에셋 재사용 가능성을 먼저 확인한다.
5. 새 이미지가 필요하면 draft review 자산과 generation log까지만 만들고, 사용자가 승인하기 전 manifest `active_version`과 production resolver를 바꾸지 않는다.

합격 기준:

- 서 있는 도윤의 목~어깨 영역과 장애물이 시각·판정상 일치하며, 슬라이드 실루엣은 여유 있게 통과한다.
- 장애물이 작은 가구가 공중에 뜬 것으로 읽히지 않고 천장 또는 상부 구조물의 지지 관계가 보인다.
- hit/avoid 뒤 즉시 제거되는 기존 lifecycle이 유지된다.
- 이미지·manifest가 바뀌었다면 아트 validation이 통과하고 production 승격에는 별도 사용자 승인이 기록돼 있다.

#### Phase 4R-C · 최초 행동 cue와 수집물 전용 오라

- 상태: `planned`
- 담당 하위 모델: `gpt-5.6-sol`, reasoning `medium`, 단일 실행
- 의존성: Phase 4R-B `smoke_checked` 또는 아트 후보가 approval-gated로 명확히 분리됨
- 담당 이슈: CUE-01, ITEM-01
- 허용 파일: `core.js`, `index.js`, `style.css`, dev 장면, 직접 관련 테스트, 캐시 버전 파일
- 금지: actor·hazard geometry, 코스 시간·순서, HUD, 이미지·manifest, animation frame

구현 작업:

1. production cue는 첫 점프 위험과 첫 슬라이드 위험에서 각각 한 번만 발행하고 같은 avoid 유형의 후속 위험에는 발행하지 않는다.
2. 재시작 시 두 tutorial cue 상태를 초기화한다. dev 정적 장면의 강제 cue 경로는 production 상태와 분리한다.
3. 수집물 DOM에만 저강도 초록 aura, 부드러운 pulse, 작은 bob, 드문 sparkle을 적용한다.
4. animation transform이 world projection이나 collision rect를 움직이지 않도록 wrapper/paint 계층을 분리한다.
5. 위험물에는 수집용 glow·sparkle class가 들어가지 않는 정적·DOM 계약을 추가한다.

합격 기준:

- 자연 플레이 한 회차에 jump cue 1회, slide cue 1회만 보이며 후속 위험은 플레이어가 직접 읽는다.
- 재시작 뒤 두 최초 cue가 다시 각각 한 번 동작한다.
- 수집물은 위험물과 즉시 구분되며 초록색 외에 bob 또는 sparkle 단서가 있다.
- aura가 충돌 위치·수집 시점·HUD·캐릭터 가독성을 바꾸지 않고 위험물에는 적용되지 않는다.

### Phase 5 · 4프레임 달리기 에셋

- 상태: `planned`
- 담당 하위 모델: `gpt-5.6-sol`, reasoning `medium`, 단일 실행
- 의존성: Phase 4R-A 사용자 확인, Phase 4R-B/C `smoke_checked`, Phase 4R-B production prop이 필요하면 해당 아트 승인
- 담당 이슈: ANIM-01, ANIM-02
- 사전 스킬: `sprite-pipeline`; 새 seed가 필요할 때만 `imagegen`
- 허용 파일: 승인된 아트 파이프라인 범위, manifest, generation log, actor animation resolver·runtime
- 금지: 물리·판정·HUD·코스 재수정, 승인 전 active version 교체

구현 작업:

1. 저장소 아트 파이프라인과 캐릭터 가이드를 모두 읽는다.
2. 도윤·하린·부장님의 기존 승인 run 프레임을 seed로 사용할 수 있는지 먼저 확인한다.
3. 캐릭터마다 왼발이 앞서는 2장과 오른발이 앞서는 2장을 만들되 contact와 recovery가 서로 다른 자세로 읽히게 한다.
4. 모든 프레임의 bottom-center, 불투명 높이, 몸 중심, 캔버스 크기를 정규화한다. 부장님의 동일 lead-leg 반복과 하린의 갑작스러운 high-knee 자세를 허용하지 않는다.
5. production 적용 전 별도 preview에서 4프레임 `1.5초` cycle, 프레임당 `375ms` 속도와 연결감을 검수한다.
6. 사용자 승인을 받은 strip만 approved·active 절차로 승격한다.
7. runtime은 캐릭터별 독립 phase offset을 실제로 적용하고 4프레임 인덱스를 사용한다.

합격 기준:

- 각 캐릭터가 정확히 4개의 승인된 run 프레임을 사용한다.
- 각 strip에 왼쪽 lead 2장·오른쪽 lead 2장이 있고 한 cycle이 `1500ms`다.
- 프레임 전환 시 발바닥 중심 X/Y drift가 1px 이하이다.
- 캐릭터별 gait phase가 적용되어 세 명이 같은 프레임을 동시에 반복하지 않는다.
- 1440×900 preview에서 몸 크기 펌핑, 좌우 흔들림, 발 미끄러짐이 보이지 않는다.
- 아트 validation이 통과하고 사용자 승인이 기록돼 있다.

최소 검증:

- sprite preview 1개와 1440×900 실제 run 장면 1개
- manifest 또는 이미지가 변경되므로 이 Phase에서만 아트 validation 실행

중단 기준:

- 사용자 승인 전 production resolver 또는 `active_version`을 변경하지 않는다.

### Phase 6 · 최종 통합과 사용자 플레이

- 담당: 주 에이전트 또는 `gpt-5.6-sol` medium 단일 실행
- 의존성: Phase 1~4와 Phase 4R-A/B/C `smoke_checked`, Phase 5 `code_complete` 및 production 적용 자산 사용자 승인
- 목적: 반복 검증이 아니라 한 번의 최종 통합 확인

작업:

1. 전체 DAY 4·미니게임 테스트를 한 번 실행한다.
2. 이미지 또는 manifest가 변경된 경우에만 아트 validation 최종 1회를 실행한다.
3. 앱 내장 브라우저에서 1280×720, 1440×900, 1920×1080을 한 번씩 확인한다.
4. 각 해상도에서 intro, 직접 점프, 직접 슬라이드, hit, pause/resume, result만 확인한다.
5. 1440×900에서 실제 64초 플레이 1회와 의도적 피격 플레이 1회를 수행한다.
6. 사용자에게 동일한 두 플레이 시나리오와 체크 항목을 전달한다.

최종 합격 기준:

- 입력 시점과 행동 시작이 일치한다.
- 캐릭터·판정·장애물의 크기와 접촉이 시각적으로 설명된다.
- 세 캐릭터가 겹치지 않고 추격 대형으로 읽힌다.
- 도윤 앞쪽 판단 공간이 확보되고 상단 장애물이 승인된 캐릭터 목~어깨 높이에 맞는다.
- 최초 jump/slide cue만 남고 수집물만 부드러운 초록 오라로 구분된다.
- 4프레임 cycle과 캐릭터별 gait phase가 승인된 형태로 동작한다.
- 원형 조작 버튼, 큰 `17:58`, 분리된 진행도, 제거된 주황선이 세 해상도에서 유지된다.
- 피격 장애물 잔류, console error, viewport overflow가 없다.
- 사용자가 관련 항목을 승인한 뒤에만 이슈 상태를 `user_accepted`로 변경한다.

## 5. 하위 모델 실행 파이프라인

| 순서 | 작업명 권장 | 모델 | 입력 | 출력 | 병렬 허용 |
|---|---|---|---|---|---|
| 1 | `day4_direct_input` | `gpt-5.6-sol` medium | Phase 1 전체 | 코드·대상 테스트·문서 상태 | 아니오 |
| 2 | `day4_unified_geometry` | `gpt-5.6-sol` medium | Phase 2 전체, Phase 1 결과 | 단일 projection·판정 보기 | 아니오 |
| 3 | `day4_formation_hazards` | `gpt-5.6-sol` medium | Phase 3 전체, Phase 2 수치 | 대형·장애물·수명주기 | 아니오 |
| 4 | `day4_ui_restore` | `gpt-5.6-sol` medium | Phase 4 전체, Phase 3 화면 | HUD·버튼·결과 | 아니오 |
| 5 | `day4_scale_lookahead` | `gpt-5.6-sol` medium | Phase 4R-A, 현재 projection·actor metric | 10% 축소·좌측 shared anchor | 아니오 |
| 6 | `day4_overhead_hazard` | `gpt-5.6-sol` medium | Phase 4R-B, 승인된 4R-A 크기 | 상단 판정·review prop | 아니오 |
| 7 | `day4_first_cues_collectible_aura` | `gpt-5.6-sol` medium | Phase 4R-C | 최초 cue·수집물 전용 시각 채널 | 아니오 |
| 8 | `day4_four_frame_run` | `gpt-5.6-sol` medium | Phase 5, 사용자 아트 승인 | 1500ms review strip·독립 gait phase runtime | 아니오 |
| 9 | `day4_final_acceptance` | `gpt-5.6-sol` medium 또는 주 에이전트 | 완료된 Phase | 최종 통합 기록 | 아니오 |

### 각 하위 모델 프롬프트에 반드시 포함할 항목

- 이 문서의 절대 경로와 담당 Phase
- 담당 이슈 ID
- 허용 파일과 금지 범위
- 유지할 공개 API와 결과 계약
- 실행할 최소 테스트와 단일 브라우저 장면
- 작업 전 상태를 `in_progress`, 구현 후 `code_complete` 또는 `smoke_checked`로 갱신할 의무
- 범위 밖 문제는 즉시 고치지 않고 이 문서 backlog에만 추가한다는 규칙
- 과거 Git 이력·legacy 문서·삭제된 계획에서 제품 결정을 가져오지 않는다는 규칙

## 6. 진행 기록

| 날짜 | Phase | 상태 변화 | 변경 파일 | 최소 검증 | 사용자 확인 | 기록자 |
|---|---|---|---|---|---|---|
| 2026-08-05 | 0 | planned → completed | `docs/REQUIREMENTS.md`, README 문서 지도, 과거 계획 삭제 | 문서 링크·태그 확인 | 문서 구조와 전체 추천안 승인 | root |
| 2026-08-05 | 1 | planned → in_progress → code_complete → smoke_checked | `core.js`, `index.js`, 직접 관련 테스트, 캐시 버전, `docs/REQUIREMENTS.md` | 입력·점프·슬라이드 코어 4건, V2 입력 통합 1건, 금지 문자열 정적 검사, `git diff --check`, 1440×900 키보드 점프·슬라이드 각 1회 | Phase 1 직접 입력 smoke 확인 | day4_direct_input · root |
| 2026-08-05 | 2 | planned → in_progress → code_complete → smoke_checked | `core.js`, `index.js`, `style.css`, `art-assets.js`, 캐시 버전, 직접 관련 테스트, `docs/REQUIREMENTS.md` | projection·pose anchor·player rect·preview geometry 6건, production `cqh` 정적 검사, `git diff --check`, 1440×900 run/jump/slide 판정 보기 | 첫 smoke 캐시 불일치 수정 후 세 포즈의 opaque/core 정렬 재확인 | day4_unified_geometry · root |
| 2026-08-05 | 3 | planned → in_progress → code_complete → smoke_checked | `core.js`, `index.js`, `style.css`, dev·본편 캐시 버전, 직접 관련 테스트, `docs/REQUIREMENTS.md` | steady·maximum viewport actor bounds·hazard overlap·lifecycle 3건, dev 정적 장면 포함 정적 통합 5건, production 금지 경로·syntax·`git diff --check`, 1440×900 장면 5종 | 첫 steady smoke의 화면 밖 대형 수정 후 steady·maximum·jump hazard·slide hazard·hit 직후 재확인, slide prop은 ART-BACKLOG 유지 | day4_formation_hazards · root |
| 2026-08-05 | 4 | planned → in_progress → code_complete → smoke_checked | `index.js`, `style.css`, dev·본편 캐시 버전, 직접 관련 통합 테스트, `docs/REQUIREMENTS.md` | HUD·cue·결과 정적 상태 3건, syntax 2건, production 금지 문자열·DOM 검사, `git diff --check`, Impeccable detector, 1440×900 UI 장면 4종 | ghost cue와 결과 preview 경로 수정 후 기본 HUD·첫 위험·결과/재시작·dev 접힘 재확인 | day4_ui_restore · root |
| 2026-08-06 | 4R-A | planned → in_progress → code_complete | `core.js`, `index.js`, `art-assets.js`, dev·본편 캐시 버전, 직접 관련 테스트, `docs/REQUIREMENTS.md` | actor metric·collision·projection·formation·위험 노출 대상 7건, syntax 3건, 폐기 anchor 정적 검사, `git diff --check`; 1440×900 브라우저는 dev 런타임 미로드로 미확인 | 새 크기·좌우 위치·판단시간 사용자 확인 대기 | day4_scale_lookahead |
| 2026-08-06 | 4R-A2 | planned → in_progress → code_complete → smoke_checked | `core.js`, `art-assets.js`, 대상 테스트, dev·본편 캐시 버전, `docs/REQUIREMENTS.md`, README | 코어 22건·DAY 4 통합 43건 통과, 첫 jump/slide avoid 확인, 1440×900 run·jump·slide 캡처 | 최종 63% 캐릭터 크기·70% 장애물·1.5배 접근 속도 사용자 승인 대기 | root |
| 2026-08-06 | 4R-A3 | planned → in_progress → code_complete → smoke_checked | `core.js`, projection·통합 테스트, dev·본편 캐시 버전, `docs/REQUIREMENTS.md`, README | 코어 22건·DAY 4 통합 43건 통과, 1440×900 steady 캡처에서 부장님 left 약 82px 확인 | 46% shared anchor 위치 사용자 승인 대기 | root |

새 구현 기록은 위 표에 한 줄씩만 추가한다. 과거 검증 수치와 폐기된 결정은 다시 복사하지 않는다.

## 7. 사용자 플레이 기록 양식

```text
해상도:
회차: 자연 플레이 / 의도적 피격
입력 즉시 반응: 좋음 / 보통 / 나쁨
도윤 판정 납득도: 좋음 / 보통 / 나쁨
하린·도윤 겹침: 없음 / 있음
부장님·하린 간격: 적절 / 너무 가까움 / 너무 멂
도윤 앞쪽 판단 공간: 충분 / 부족
첫 위험 식별 후 입력 여유: 충분 / 부족
점프 장애물 크기·위치: 적절 / 문제 있음
슬라이드 장애물 크기·위치: 적절 / 문제 있음
점프 cue 노출 횟수: 1회 / 반복됨 / 안 보임
슬라이드 cue 노출 횟수: 1회 / 반복됨 / 안 보임
수집물·위험물 구분: 명확 / 불명확
상단 HUD 가독성: 좋음 / 보통 / 나쁨
주황색 바닥선 잔류: 없음 / 있음
달리기 모션: 자연스러움 / 같은 다리 반복 / 다리 들림 과함 / 동기화됨
결과 등급·수집 의미: 명확 / 불명확
문제가 발생한 초·장애물·누른 키:
추가 의견:
```

이 양식의 사용자 응답이 자동 테스트보다 최종 완료 판정에 우선한다.
