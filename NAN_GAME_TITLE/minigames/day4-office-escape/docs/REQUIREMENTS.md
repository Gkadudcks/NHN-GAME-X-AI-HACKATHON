# DAY 4 오피스 이스케이프 V2 수정 요구사항·진행 추적

작성일: 2026-08-04  
상태: Phase 1·2 검증 완료 · Phase 3 결정 대기  
현재 사용자 관점 평가: 19/40

이 문서는 V2 `부장님 피해서 퇴근하기`의 현재 요구사항, 수정 순서, 결정, 검증 증거를 함께 관리하는 영속 기준 문서다. 모든 수정 에이전트는 작업 시작 전 이 문서를 읽고, 담당 이슈 상태와 검증 결과를 작업 직후 갱신한다.

완료된 과거 배경·UI 작업 기록은 `V2_BACKGROUND_TRANSITION_UI_REFINEMENT_PLAN.md`, 이전 V044 구현 기준은 `../legacy/v044/docs/REQUIREMENTS.md`에 보존한다. 과거 문서를 현재 작업 상태로 되돌리거나 덮어쓰지 않는다.

## 1. 운영 규칙

### 상태 흐름

각 이슈는 다음 상태만 사용한다.

`backlog → in_progress → code_complete → verified → user_accepted`

- `backlog`: 원인과 합격 기준이 기록됐지만 작업하지 않음.
- `in_progress`: 현재 단일 구현 에이전트가 담당 중.
- `code_complete`: 코드와 자동 테스트가 완료됐지만 브라우저 검증 전.
- `verified`: 자동 테스트와 지정 데스크톱 브라우저 검증을 모두 통과함.
- `user_accepted`: 사용자가 실제 화면을 확인하고 완료를 승인함.

실패하거나 회귀가 발견되면 이전 상태로 되돌리고 원인과 증거를 검증 기록에 남긴다.

### 에이전트 운영

- 구현 에이전트는 `gpt-5.6-sol`, reasoning `medium`을 기본으로 한다.
- 구현 에이전트는 한 번에 하나만 실행한다. 이 저장소의 에이전트는 같은 작업공간을 공유하므로 `core.js`, `index.js`, `style.css`를 병렬 수정하지 않는다.
- 한 에이전트가 작은 이슈 하나만 고치는 대신, 같은 원인과 파일을 공유하는 한 단계의 이슈 묶음을 담당한다.
- 좌표계 리팩터링이 medium에서 두 번 이상 실패하거나 요구사항 해석이 갈리면 해당 단계만 high로 재검토한다.
- 병렬 작업은 읽기 전용 UX 평가, 접근성 감사, 테스트 누락 조사에만 허용한다.
- 에이전트 프롬프트에는 담당 이슈 ID, 허용 파일, 금지 범위, 합격 기준, 실행할 테스트, 이 문서 업데이트 의무를 반드시 넣는다.
- 담당 범위를 벗어난 새 문제는 즉석에서 함께 고치지 않고 이슈 표에 `backlog`로 추가한다.

### 문서 업데이트 시점

1. 작업 시작 직전 담당 이슈를 `in_progress`로 바꾼다.
2. 코드와 자동 테스트가 끝나면 변경 파일과 테스트 결과를 기록하고 `code_complete`로 바꾼다.
3. 1280×720, 1440×900, 1920×1080 브라우저 검증 후에만 `verified`로 바꾼다.
4. 실제 제품·구현 결정이 달라진 경우에만 결정 로그를 추가한다.
5. 사용자가 결과를 승인하면 `user_accepted`로 바꾼다.

## 2. 변경 불가 계약

- 지원 환경은 PC 데스크톱 브라우저 전용이다. 모바일·터치·세로 화면 대응은 범위 밖이다.
- 기본 플레이 시간은 64초이며, 시간 변경은 별도 제품 결정 없이는 하지 않는다.
- 공개 API `OfficeEscapeMinigame.start({ onComplete })`, `pause()`, `resume()`, `debugSnapshot()`을 유지한다.
- 결과의 `grade`, `caught`, `elapsed`, `hitCount`, `collectedItems`, `maxCombo` 의미를 깨지 않는다.
- `caught`도 정상 완료이며 DAY 4 저장·스토리 복귀 계약을 유지한다.
- 순수 규칙과 결정론은 `core.js`, DOM·입력·오디오·렌더링은 `index.js`, 시각 표현은 `style.css`에 둔다.
- 테스트 전용 옵션은 dev harness 밖의 본편 계약에 노출하지 않는다.
- 이미지와 manifest는 이번 코드 수정 파이프라인의 기본 범위가 아니다. 필요하면 아트 파이프라인과 사용자 승인 단계를 별도로 연다.
- review 이미지를 사용자 승인 없이 `approved` 또는 `active_version`으로 승격하지 않는다.

## 3. 사용자 경험 목표

- 처음 플레이하는 사용자가 첫 점프·슬라이드 안내를 보고 반응해도 성공할 수 있어야 한다.
- 보이는 도윤 몸체, 개발자 판정 표시, 실제 코어 판정이 같은 화면 좌표에서 설명돼야 한다.
- 해결된 장애물과 수집물은 다음 위험 판단을 방해하지 않아야 한다.
- 피격 원인, 하린 보조, 무적·회복, 붙잡힘 상태가 서로 다른 시각·문구로 분명해야 한다.
- 지속 UI는 플레이필드보다 낮은 위계를 가져야 하며 도윤의 진행 방향과 다음 장애물을 가리지 않아야 한다.
- 결과 화면은 명확한 종료 상태여야 하고, 이전 게임 조작이 실행되거나 포커스되지 않아야 한다.
- 64초 동안 초반 학습, 중반 변주, 후반 압박이 구분돼야 하며 단순 점프·슬라이드 교대 암기로 끝나지 않아야 한다.

## 4. 확인된 이슈

| ID | 우선순위 | 증상·근거 | 확인된 원인 | 의존성 | 주요 파일 | 합격 기준 | 상태 |
|---|---|---|---|---|---|---|---|
| OBJ-01 | P1 | hit/avoid/collect된 오브젝트가 화면에 얼어붙음. 1440×900에서 14개, 1920×1080에서 18개 잔류 | `hidden=true`를 `.oe2-object { display:block }`이 덮어씀 | 없음 | `index.js`, `style.css`, 테스트 | 해결·화면 이탈 노드의 계산 스타일이 `display:none`; 64초 종료 시 stale visible object 0개 | verified |
| COL-01 | P1 | 판정 보기와 실제 판정 크기·위치가 다름 | 플레이어 디버그 상자를 스프라이트 host 비율로 그림 | 없음 | `core.js`, `index.js`, `style.css`, 테스트 | 디버그 player body가 `snapshot.playerRect`의 동일 변환을 직접 사용하고 오차 1px 이하 | verified |
| COL-02 | P1 | 달리기→슬라이드에서 도윤 화면 X가 이동하고 접촉 시점이 어긋남 | 포즈별 정사각 canvas의 왼쪽을 `left`로 고정하고 bottom-center anchor를 쓰지 않음 | COL-01 | `index.js`, `style.css` | 모든 포즈·세 해상도에서 발바닥 중심 X 변화 1px 이하 | verified |
| COL-03 | P1 | A/B 시안의 도윤·바닥과 장애물 기준이 불일치 | 장애물은 항상 화면 31%·바닥 8.5%, composition은 다른 도윤 X·ground 사용 | COL-01 | `index.js`, `style.css`, dev | composition을 유지한다면 모두 동일한 물리 기준을 사용; 아니면 비생산 시안으로 명시·차단 | verified |
| COL-04 | P1 | 배경 의자·책상이 실제 장애물처럼 보임 | 배경 가구와 충돌 오브젝트의 깊이·강조 언어가 유사함 | COL-01 | 렌더링·CSS, 필요 시 별도 아트 이슈 | 5초 첫인상 테스트에서 비충돌 배경 소품을 위험으로 오인하지 않음 | verified |
| CUE-01 | P1 | `NOW`를 보고 입력하면 늦고 PREP에서 입력하면 행동이 먼저 끝남 | ACT가 충돌 150~160ms 전에만 열리고 예약 입력이 없음 | COL 단계 완료 | `core.js`, `index.js`, 테스트 | 문서에서 확정한 창 안의 사람 반응 입력이 성공; 입력 수락을 다음 프레임에 표시 | backlog |
| HUD-01 | P1 | dev 상단 UI가 플레이필드를 87~91px 덮음 | 툴바를 live play 중에도 상단 overlay로 유지 | OBJ/COL 검증 후 | `dev/index.html`, `dev/dev.js`, CSS | 실제 플레이 중 자동 접힘; 한 동작으로 다시 열 수 있음; 진행 방향 비가림 | backlog |
| HUD-02 | P2 | 게임 HUD의 정적 `17:58`이 가장 강하고 정보성이 낮음 | 고정 세계관 시각과 진행 정보가 같은 위계 | UI 결정 필요 | `index.js`, `style.css` | 확정된 HUD 정보만 남고 세 해상도에서 플레이필드 우선 위계 유지 | backlog |
| HUD-03 | P2 | 104px 행동 버튼이 PC 보조 입력치고 강하고 W/S 힌트가 없음 | 터치형 버튼 위계와 키 안내 부재 | HUD-02 | `index.js`, `style.css` | 키보드 기본·마우스 보조 관계가 5초 내 이해되고 위험·캐릭터 비가림 0 | backlog |
| FEED-01 | P2 | `7/3`, `17/3`처럼 잘못된 피격 문구 | caught 임계치와 누적 피격 횟수를 같은 분수로 표시 | 없음 | `index.js`, 테스트 | 3회 전·후 문구가 각각 남은 여유와 붙잡힘 상태를 정확히 설명 | backlog |
| FEED-02 | P2 | 행동 버튼의 눌림 상태가 계속 남음 | `pressed` 추가 후 해제 없음 | 없음 | `index.js`, `style.css`, 테스트 | 입력 피드백이 지정 시간 후 종료되고 재시작 시 잔류 class 0 | backlog |
| FEED-03 | P2 | 피격 원인·회복 시점이 약함 | 접촉점, 짧은 hit-stop, 무적 표시가 충분히 연결되지 않음 | COL, OBJ | `core.js`, `index.js`, `style.css` | 한 번의 피격당 접촉·결과·회복이 하나의 연속 연출로 읽힘 | backlog |
| PAUSE-01 | P2 | 일시정지 직후 진행 바와 CSS 애니메이션이 잠깐 계속됨 | core 시간은 멈추지만 transition·animation·실시간 피드백 타이머가 별도 동작 | UI 단계 | `index.js`, `style.css`, 테스트 | pause 500ms 관찰에서 모든 게임성 시각 좌표·상태 변화 0 | backlog |
| RESULT-01 | P2 | 결과가 떠도 포커스가 JUMP에 남고 게임 조작이 활성 | 결과 진입 시 focus/inert 상태 전환 없음 | UI 단계 | `index.js`, `style.css`, 테스트 | 결과 CTA로 포커스 이동; 배경 조작 실행·탭 진입 불가; dev 재도전 가능 | backlog |
| A11Y-01 | P2 | 진행 바에 수치 접근성 값이 없음 | CSS 시각 진행만 갱신 | UI 단계 | `index.js`, 테스트 | progressbar role/value 또는 동등한 현재 진행 상태 제공 | backlog |
| A11Y-02 | P2 | 오브젝트 live region이 미래·잔류 이미지를 과도하게 노출할 수 있음 | 시각 오브젝트와 상태 알림 채널이 분리되지 않음 | OBJ-01 | `index.js`, 테스트 | 시각 오브젝트는 낭독 제외; 행동·피격·수집 상태만 적절히 발표 | verified |
| GAME-01 | P2 | 18개 장애물이 점프→슬라이드를 끝까지 엄격히 반복 | `COURSE_BEATS`가 단일 교대 패턴 | CUE 단계 이후 | `core.js`, 테스트 | 초반 학습→중반 혼합→후반 변주가 존재하고 불공정 연속 입력 없음 | backlog |
| GAME-02 | P2 | 부장님이 피격·회복과 무관한 장식처럼 보임 | 추격 거리와 위험 상태의 시각 연결 없음 | FEED 단계 이후 | `core.js` 또는 snapshot, `index.js`, `style.css` | 피격·회복이 추격 압박 변화로 읽히되 결과 계약은 유지 | backlog |
| BG-01 | P2 | review OFF에서는 Office A/B/C가 같은 배경으로 보여 공간 진행이 약함 | 미승인 장면이 같은 approved 배경으로 폴백 | 사용자 아트 승인과 분리 | 배경 resolver·렌더링 | 승인 전 코드에서 가짜 차이를 만들지 않고, 보류 상태를 명확히 기록 | backlog |
| TEST-01 | P1 | 자동 테스트 49개가 통과해도 위 런타임 결함이 남음 | 코어·문자열 검증 중심이며 브라우저 geometry/cascade 검증 부재 | 모든 단계 | 테스트·dev | `hidden`, player anchor, collision overlay, focus, pause를 실제 계산값으로 회귀 검증 | in_progress |

## 5. 결정 대기 목록

| ID | 결정 | 추천안 | 상태 | 차단 단계 |
|---|---|---|---|---|
| DEC-01 | 피격 장애물의 화면 처리 | 판정 즉시 해제 후 250~350ms 뒤로 튕기며 제거 | 사용자 확인 대기 | FEED-03 |
| DEC-02 | A/B/C composition 유지 범위 | 본편은 C로 고정. A/B는 dev 비교로 유지하되 플레이 시 C와 동일한 bottom-center 물리 앵커·바닥선·player body·장애물·cue 투영을 사용 | selected | COL-03 |
| DEC-03 | 상단 `17:58`의 역할 | 정보에서 제외하고 작은 `현재 시각` 분위기 표식으로 축소 | 사용자 확인 대기 | HUD-02 |
| DEC-04 | 기본 난도 철학 | 첫 플레이도 안내를 따르면 공정하게 완주 가능 | 사용자 확인 대기 | CUE-01, GAME-01 |
| DEC-05 | dev 결과의 재도전 | `다시 달리기` 제공, 본편은 기존 스토리 계속 계약 유지 | 사용자 확인 대기 | RESULT-01 |

결정되지 않은 항목은 추천안을 구현된 사실처럼 문서화하지 않는다. 해당 결정을 필요로 하지 않는 선행 버그 수정은 계속 진행할 수 있다.

## 6. 순차 수정 파이프라인

### Phase 0 · 기준선 동결

담당: 주 에이전트  
범위: 이 문서, 기존 증거, 현재 테스트 상태  
상태: `completed`

- 현재 이슈·결정·합격 기준을 이 문서에 고정한다.
- 기존 사용자 관점 평가와 자동 테스트 결과를 검증 기록에 연결한다.
- 제품 코드는 수정하지 않는다.

완료 게이트:

- 모든 P1 이슈에 재현 근거와 정량 합격 기준이 있다.
- 수정 에이전트의 상태 업데이트 규칙이 정의돼 있다.

### Phase 1 · 장애물 생명주기 정상화

담당 에이전트: `day4_object_lifecycle` · sol medium · 단일 실행  
담당 이슈: OBJ-01, A11Y-02, TEST-01의 lifecycle 부분  
주요 파일: `index.js`, `style.css`, 관련 테스트  
금지: 좌표계, cue 수치, HUD 재설계, 아트 변경

상태: `completed` · OBJ-01/A11Y-02 및 TEST-01 lifecycle 부분 `verified`

변경 파일:

- `minigames/day4-office-escape/index.js`: 시각 오브젝트 트리를 접근성 트리에서 제외하고 상태 알림 채널과 분리.
- `minigames/day4-office-escape/style.css`: 작성자 CSS 우선순위에서도 `[hidden]`이 `display:none`을 유지하도록 수명주기 규칙 추가.
- `minigames/day4-office-escape/tests/core.test.js`, `tests/day4-integration.test.js`: hit/avoid/collect 1회성 해결과 hidden cascade·알림 분리 회귀 검사 추가.
- `day4.html`, `minigames/day4-office-escape/dev/index.html`: 수정된 런타임·스타일 캐시 버전 갱신.

완료 게이트:

- hit, avoid, collect, offscreen 네 경로의 resolved 노드가 보이지 않는다.
- 한 오브젝트가 두 번 결과 이벤트를 발생시키지 않는다.
- 실제 브라우저 계산 스타일과 화면 교차 개수가 기준을 통과한다.

### Phase 2 · 좌표·판정·앵커 단일화

담당 에이전트: `day4_collision_coordinates` · sol medium · 단일 실행  
담당 이슈: COL-01, COL-02, COL-03, COL-04, TEST-01의 geometry 부분  
주요 파일: `core.js`, `index.js`, `style.css`, dev, 관련 테스트  
금지: cue 타이밍, 코스 순서, HUD 문구, 아트 원본 변경

상태: `completed` · COL-01~04 및 TEST-01 geometry 부분 `verified`

변경 파일:

- `core.js`: 31% bottom-center 앵커, 9% 바닥선, 780px 기준 scale을 하나의 순수 projection 계약으로 정의하고 run/jump/slide player body의 중심을 일치시킴.
- `index.js`: 도윤 host, `snapshot.playerRect` 디버그 박스, 장애물 art/collision rect, cue를 공통 projection으로 렌더링하고 preview의 강제 snapshot 변조를 제거함.
- `style.css`: 도윤 canvas를 bottom-center로 고정하고 A/B/C의 별도 바닥선·도윤 X 규칙을 제거. 실제 장애물에만 최소한의 색·외곽 강조를 적용함.
- `tests/core.test.js`, `tests/day4-integration.test.js`: 포즈 X drift, player overlay 투영, composition 바닥·앵커 불일치 회귀 검증을 추가함.
- `day4.html`, `dev/index.html`: 변경된 core/runtime/style 캐시 버전을 갱신함.

자동 수치 증거:

- run/jump/slide의 투영된 발 중심 X 편차는 1280×720, 1440×900, 1920×1080 대응 월드 크기에서 모두 `0px`.
- player body와 앵커 중심 오차는 부동소수점 허용치 `0.000001px` 이하였고, 합격 기준 1px보다 작음.
- 대응 world 높이 641/814/982px에서 바닥선은 57.69/73.26/88.38px로 모두 동일한 9% 계약을 사용함.
- 투영 player body(run 기준)는 각각 72.21×144.41px, 81.23×162.46px, 108.31×216.62px이며 dev overlay가 동일 rect를 직접 사용하므로 크기·위치 산술 오차는 0px.

완료 게이트:

- 도윤 발바닥 중심, 실제 player body, 디버그 player body가 같은 world-to-screen 변환을 사용한다.
- run/jump/slide와 A/B/C 대상 범위에서 앵커 오차가 기준 이하다.
- 장애물 visible/collision rect와 화면 표시가 세 해상도에서 일치한다.

### Phase 3 · 행동 예고와 입력 공정성

담당 에이전트: `day4_cue_fairness` · sol medium · 단일 실행  
담당 이슈: CUE-01, GAME-01의 학습·입력 창 부분  
주요 파일: `core.js`, `index.js`, 관련 테스트  
선행: DEC-04 확정, Phase 2 verified  
금지: HUD 레이아웃, 결과 화면, 아트 변경

완료 게이트:

- PREP, input-ready, ACT, resolved 상태와 시간이 문서 수치에 일치한다.
- 사람 반응을 모사한 지연 입력 테스트가 세 프레임률에서 통과한다.
- 첫 점프·슬라이드는 설명을 읽고 반응해도 성공한다.

### Phase 4 · 피격·회복·HUD·결과 접근성

담당 에이전트: `day4_status_ui` · sol medium · 단일 실행  
담당 이슈: HUD-01~03, FEED-01~03, PAUSE-01, RESULT-01, A11Y-01  
주요 파일: `index.js`, `style.css`, dev 파일, 관련 테스트  
선행: DEC-01, DEC-03, DEC-05 확정, Phase 3 verified  
금지: 코스 순서, 캐릭터·배경 에셋 변경

완료 게이트:

- live play에서 dev 도구가 플레이필드를 가리지 않는다.
- 피격·보호·회복·붙잡힘 문구와 연출이 상태와 일치한다.
- pause가 CSS 움직임과 실시간 피드백까지 동결한다.
- 결과 진입 시 이전 조작이 inert이고 결과 CTA로 포커스가 이동한다.

### Phase 5 · 64초 리듬과 추격 압박

담당 에이전트: `day4_course_rhythm` · sol medium · 단일 실행  
담당 이슈: GAME-01, GAME-02  
주요 파일: `core.js`, `index.js`, `style.css`, 관련 테스트  
선행: Phase 4 verified, 사용자 중간 플레이테스트  
금지: 결과 계약, 아트 원본·manifest 변경

완료 게이트:

- 초반 학습, 중반 혼합, 후반 변주의 차이가 기록된다.
- 모든 연속 위험이 확정된 회복·반응 하한을 지킨다.
- 무입력, 정상 반응, perfect 스크립트가 결정론적으로 같은 결과를 낸다.

### Phase 6 · 통합 회귀와 사용자 승인

담당 에이전트: `day4_final_verification` · sol medium · 단일 실행  
범위: 수정이 아닌 통합 검증 우선, 발견된 회귀만 최소 수정  
선행: Phase 1~5 code_complete 이상

완료 게이트:

- 아트 검증과 전체 DAY 4·미니게임 테스트를 통과한다.
- 1280×720, 1440×900, 1920×1080에서 intro/first input/hit/assist/pause/resume/three zones/result/restart/callback을 확인한다.
- 브라우저 console error, overflow, ghost object, coordinate mismatch가 0이다.
- 이슈 표의 범위 항목이 모두 `verified` 이상이다.
- 사용자 확인 후 관련 항목을 `user_accepted`로 바꾼다.

## 7. 공통 검증 명령

단계별 대상 테스트를 먼저 실행한 뒤 최종 단계에서 다음을 실행한다.

```powershell
python scripts/validate_art_assets.py
Set-Location NAN_GAME_TITLE
node --test tests/*.test.js minigames/*/tests/*.test.js
```

브라우저 검수는 앱 내장 브라우저를 사용하고 다음 PC 해상도만 완료 게이트로 삼는다.

- 1280×720
- 1440×900
- 1920×1080

각 단계는 시작, 담당 상태 변화, 핵심 상호작용, 완료 상태를 확인한다. 테스트·브라우저·아트 검증 중 하나라도 실패하면 `verified`로 표시하지 않는다.

## 8. 검증 기록

| 날짜 | 단계·이슈 | 자동 검증 | 브라우저 검증 | 결과·증거 | 기록자 |
|---|---|---|---|---|---|
| 2026-08-04 | 수정 전 기준선 | 관련 49개 테스트: 43 pass, 6 legacy skip, 0 fail | 1280×720, 1440×900, 1920×1080 독립 평가 | ghost object, player overlay 약 2배, X 약 93px 오프셋, 상단 UI 최대 25.7% 확인 | dual-agent critique |
| 2026-08-04 | Phase 1 · OBJ-01/A11Y-02/TEST-01 lifecycle | 대상 47개: 41 pass, 6 legacy skip, 0 fail. 전체 329개: 323 pass, 6 legacy skip, 0 fail. 아트 83개·로그 83개 validation pass | 앱 내 브라우저 1280×720, 1440×900, 1920×1080 실제 플레이 | 세 해상도 첫 충돌 후 hidden-but-displayed 0, 해결된 `hazard-01` visible 0. 1920×1080 화면 진입 중에는 `hazard-01`만 표시·viewport 교차, 64초 CAUGHT 종료 시 DOM 21개 중 visible/intersection/stale 0. 시각 객체 트리 `aria-hidden=true`, 피드백은 별도 `role=status`. dev review manifest 404 경고 1건은 review 토글 비활성화로 이어지는 기존 별도 문제이며 Phase 1 경로에는 영향 없음 | day4_object_lifecycle |
| 2026-08-04 | Phase 2 · COL-01~04/TEST-01 geometry | 대상 50개: 44 pass, 6 legacy skip, 0 fail. 전체 332개: 326 pass, 6 legacy skip, 0 fail. 아트 83개·로그 83개 validation pass | 미수행: 앱 내장 브라우저 선택이 `No browser is available`로 실패. 공식 troubleshooting 후 1회 목록에서 Chrome extension만 확인되어 저장소 규칙에 따라 대체 사용하지 않음 | 순수 projection 테스트에서 run/jump/slide 앵커 X drift 0px, player body/overlay 산술 오차 0px, A/B/C 공통 31% anchor·9% ground 계약 통과. 실제 DOM·스프라이트 발바닥·장애물·cue 오차는 앱 내장 브라우저가 연결되면 세 해상도에서 추가 측정해야 함. 그때까지 COL-01~04는 `code_complete` | day4_collision_coordinates |
| 2026-08-04 | Phase 2 · 실브라우저 완료 게이트 | 위 Phase 2 자동·아트 검증 결과 재사용 | 앱 내장 브라우저 1280×720, 1440×900, 1920×1080에서 A/B/C × run/jump/slide 27개 조합 측정 | player anchor X 최대 오차 0.0084px, actor/player body 중심 X 0.0053px, actor/body 수직 앵커 0.0049px, body projection/DOM 0.0101px, run ground 0.0257px. cue 인라인 투영 좌표는 A/B/C에서 장면별 동일했고 console warning/error 0. jump 장면에서 실제 chair와 JUMP NOW 강조가 배경 가구와 구분됨. COL-01~04와 TEST-01 geometry를 `verified`로 전환 | root |

## 9. 결정 로그

- 2026-08-04: 완료된 배경 수정 계획과 분리해 이 문서를 V2의 현재 영속 요구사항·수정 추적 문서로 신설했다.
- 2026-08-04: 구현 에이전트는 sol medium을 기본으로 하며, 공유 파일 충돌과 회귀 원인 분리를 위해 Phase 1~6을 순차 실행하기로 했다.
- 2026-08-04: correctness(생명주기·좌표·판정)를 먼저 고치고 timing, UI, course rhythm 순으로 진행해 난이도 변화와 렌더링 결함을 분리한다.
- 2026-08-04: DEC-02를 선택했다. 본편은 composition C를 유지하고 A/B는 dev 비교로만 남기되, 플레이 중에는 C와 동일한 31% bottom-center 물리 앵커, 9% 바닥선, player body, 장애물, cue 투영을 사용한다. 배우·하린 배치만 비물리적 구도 차이로 허용한다.

## 10. 변경 이력

| 날짜 | 변경 | 관련 이슈 |
|---|---|---|
| 2026-08-04 | 최초 문서 작성, baseline 이슈·결정·Phase 0~6 등록 | 전체 |
| 2026-08-04 | Phase 1 완료: hidden cascade, 시각 객체 접근성 격리, hit/avoid/collect 수명주기 회귀 검증 및 3개 데스크톱 해상도 검증 | OBJ-01, A11Y-02, TEST-01 lifecycle |
| 2026-08-04 | Phase 2 코드·자동 검증 완료: 공통 world-to-screen projection, bottom-center 포즈 앵커, A/B/C 물리 기준 단일화, 직접 player body overlay, 장애물 구분 처리. 앱 내장 브라우저 미연결로 verified는 보류 | COL-01, COL-02, COL-03, COL-04, DEC-02, TEST-01 geometry |
| 2026-08-04 | Phase 2 앱 내장 브라우저 검증 완료: 3개 데스크톱 해상도·27개 조합에서 앵커/overlay 오차 1px 이하, composition별 cue 좌표 동일, console warning/error 0 확인 | COL-01, COL-02, COL-03, COL-04, TEST-01 geometry |
