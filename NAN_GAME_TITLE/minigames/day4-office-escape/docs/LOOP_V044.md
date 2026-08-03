# DAY 4 퇴근 미니게임 루프 V044

> 9시간 개선 목표의 6–9시간 체크포인트. 기록 시각: 2026-08-01 20:16 KST.

- 대상: `부장님 피해서 퇴근하기`
- 브랜치: `minigame/day4`
- 기준 HEAD: `38278f8e8038d3013ee68eaaa291d42393cf8ffb`
- 스냅샷 태그: core JS v19 / runtime JS v56 / CSS v45 / art resolver v14 / dev harness v9
- 상태: 커밋·스테이징하지 않은 작업 트리 스냅샷. 아래 SHA-256으로 이 시점의 실행 파일을 식별한다.
- 이미지 변경: 이 3시간 구간에서는 새 이미지 생성·교체·manifest 변경 없음. 사용자 승인 보행 6종을 그대로 사용한다.
- 출시 판정: **FREEZE**. 제품 P0/P1 0건이며 최신 블라인드 패스도 P2 제품 결함 0건으로 승인했다. 자동화 범위 보강과 선택적 감각 피드백은 비차단 V045 후보로 분리한다.

## 1. 이 구간에서 확정한 개선

| 축 | V044 결과 |
|---|---|
| 판정·예고 | 플레이어 standing body와 위험의 양축 18% inset `collisionRect` 사이 entry/exit 거리를 단일 기준으로 삼았다. PREP 1.25초, 점프 queue-ready 0.55초, 물리 ACT 약 0.26초, 슬라이드 ACT 0.75초를 분리해 보이는 신호와 실제 판정의 역전을 없앴다. |
| 조작 | 기존 점프 예약 하나를 `queued → executed → resolved`로 확장했다. pointer·keyboard·보조기술 click이 같은 위험을 공유하고, 혼합 입력은 비취소 소유로 승격하며 pointer가 만든 native click은 재실행하지 않는다. 모든 슬라이드 위험의 채운 ACT는 의미 커밋을 사용한다. |
| HUD·장소 | 481~1020px compact HUD에도 위험·시간·구간·진행률·수집·3구간 track을 유지하고, 1021px부터 desktop으로 전환한다. 장소명은 시간 진행률이 아니라 실제 거리 3/17/31/46/63/68%에서 사무실 출구·회의실 7F·유리 회의실·복합기 구간·복도 전환·엘리베이터 순으로 바뀐다. |
| 공간·속도·다양성 | 세 패럴랙스 층, 바닥선, 6개 랜드마크로 진행 방향을 유지한다. 코스는 사무실 0.95→복도 1.06→로비 1.15 속도, 위험 16개·6타입, roll/still/scatter/rattle/sway 변주를 사용하며 실제 충돌과 필수 입력 사이 회복 간격을 각각 0.5초 이상 보장한다. |
| VFX·보행 | PREP/ACT, 발구름·착지, 회피·피격, 구간 전환의 역할을 분리했다. 승인된 도윤·하린·부장 두 보폭은 500ms마다 0/150/300ms 위상으로 교대하고, 하린·부장은 하단 중앙에서 105%→100% 강조, 도윤은 확대 없이 고정 X를 유지한다. |
| pause·접근성 | pause는 course 하위·의사 요소 animation과 시뮬레이션을 함께 멈춘다. intro/play/result 모두 게임 root를 `inert`·`aria-hidden=true`로 만들고 resume/start에서 복구하며, 숨긴 surface는 포커스 트랩 대상에서 제외한다. |

## 2. 독립 평가

| 평가 | 결과 | 판정과 수정 제안 |
|---|---|---|
| 레퍼런스 디자이너 | **9.3/10**. UI 9.2, 장소 9.5, 속도 리듬 9.2, cue 9.6, VFX 9.0, 조작·접근성 9.5 | P0/P1 0, `FREEZE`. compact 캡처 명칭을 실제 1020/1021px 경계로 통일했고 문서도 수정했다. 후속은 640px ACT 간격과 선택적 audio/haptic뿐이다. |
| 최신 블라인드 플레이 | UI 8.0, 장소 7.5, 속도 7.5, VFX 8.0, 조작 8.5 | v56 제품 P0/P1/P2 0, `FREEZE`. 1280×720·640×360 비겹침과 첫 점프 공중 포즈를 확인했다. 390px override가 실제 1920px로 남은 표본은 제품 결함이 아니라 검증 실패로 제외했다. |
| 기술 감사 | `PASS` | v56 P0/P1 0. 혼합 입력 owner 승격, native click exactly-once, cancel/cleanup 불변식을 승인했다. 실제 DOM 이벤트와 자세별 1px 판정 경계 자동화는 P2 검증 범위 제안으로 남겼다. |
| 접근성 감사 | `PASS` | P0/P1 0. 중첩 모달에서 intro/play/result의 inert·ARIA 수명을 수정 후 재검증했다. 동작 변경 없이 실제 DOM 기반 회귀 자동화를 후속 제안했다. |

## 3. 브라우저·결정론 검증

- 정식 64초·하린 보조 OFF V044 런에서 화면의 16개 `data-tap-ready` 신호를 각 한 번만 입력해 `PERFECT`, 피격 0회, 회피 16회를 확인했다.
- 1280×720·390×844·481×844·640×360·1020×720·1021×720에서 HUD·코스·footer의 문서 overflow와 상호 겹침이 0이다. 390×844에서는 HUD 370×56, 481×844에서는 두 170×52px 조작부가 유지됐다.
- play·intro·result에서 pause `inert/aria-hidden=true/true`와 resume `false/false`를 확인했다. complete 뒤에는 hidden/inert/aria-hidden이 모두 적용되고 restart 뒤 정상 복구된다.
- 최신 v56 dev 화면을 20회 연속 재시작한 뒤 게임 root 1개, 오브젝트 19개, 랜드마크 6개, 중복 ID 0개를 유지하고 `안전 / 사무실 / 0%`로 초기화했다.
- 481×844·640×360·1020×720·1021×720·1280×720을 두 차례 왕복 리사이즈해 root·진행·pause 상태를 유지하고 문서 가로·세로 overflow 0을 확인했다.
- 별도 core 리플레이는 50개 경계 구성을 각각 두 번, 30/60/120/240Hz와 50ms step에 분산해 총 100회 실행했다. visible/collision overlap, hit/avoid, hitCount와 종료 프레임이 쌍마다 같고 가시 실루엣 밖 피격은 0회다.
- dev 15초 압축 모드는 공간·결과 시각 sweep에만 사용하고 입력 공정성 근거에서는 제외했다. 자동화 호출 사이 게임이 계속 진행된 최신 gap-run과 viewport override가 실패한 1920px 표본도 최종 sign-off에서 제외했다.

## 4. 자동·정적 검증

- `node --test NAN_GAME_TITLE/tests/*.test.js`: **249/249 통과**.
- core coverage: line 100%, branch 92.91%, function 100%.
- `python scripts/validate_art_assets.py`: 이미지 63개·생성 로그 63개 통과.
- core/runtime `node --check` 통과.
- `python -B .agents/scripts/normalize_sprite_strip.py --help` 통과.
- `git diff --check`: 기존 LF→CRLF 변환 예고 외 오류 없음.
- Impeccable 단일 최종 탐지 warning은 점프 방향선·CSS 삼각형·레인선·발구름 호와 런타임이 채우는 빈 event-CG `src`였다. 실제 카드 side-tab이나 깨진 출하 이미지가 아님을 수동 확인했으며 탐지를 반복 실행하지 않았다.

## 5. V043 차단 항목 해소

| V043 항목 | V044 해소 |
|---|---|
| 실제 collision보다 늦던 PREP/ACT | collision entry/exit 기준 1.25/0.55/0.26/0.75초로 재계산하고 전 위험·다중 step 테스트로 고정했다. |
| 즉시 점프를 따를수록 불리한 넓은 위험 | 미리 탭 예약과 물리 실행을 분리해 즉시·150ms 반응 모두 같은 한 번의 점프로 통과한다. |
| 481~850px 위험어 줄바꿈·수집 정보 소실 | compact 상한을 1020px로 확장하고 위험 18px 한 줄, 장소·진행·수집 13px, 3구간 track을 보존했다. |
| pause 중 CSS motion 잔류 | course와 모든 하위·pseudo animation을 명시적 pause 상태에 묶었다. |
| 후속 혼합 입력·중첩 모달 결함 | 단일 owner 예약과 native-click 필터, root inert/ARIA 수명으로 각각 해소했다. |

## 6. 비차단 V045 후보

1. 정규식 계약을 넘어 실제 dev DOM에 pointer·keyboard·보조기술 click·foreign cancel/lost-capture를 dispatch해 cue당 행동 1회와 pause 입력 격리를 자동 검증한다.
2. standing·상승·정점·하강·sliding 자세의 좌/우/상/하 1px 겹침·정접 행렬과 프레임률별 terminal trace를 core/browser 테스트로 확장한다.
3. 640×360 ACT와 HUD 사이 간격·텍스트 대비를 추가 계측하되, 확정된 위험·시간·장소·진행률·수집 정보는 숨기지 않는다.
4. 기존 master/SFX mute를 재사용해 `queued/executed/hit` 상태 전이당 최대 1회의 짧은 확인음과 선택적 햅틱을 검토한다. 거절·취소·중복 native click은 피드백 0회여야 한다. 근거: [Android haptic principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles), [Apple haptic guidance](https://developer.apple.com/design/human-interface-guidelines/playing-haptics).
5. 반응형 증거 캡처 이름을 실제 경계인 1020/1021px로 통일한다.

새 장애물·입력 동사·난도 규칙은 이 후보에 포함하지 않는다.

## 7. 실행 파일 SHA-256

| 파일 | SHA-256 |
|---|---|
| `js/office-escape-minigame-core.js` | `38B81D61CA663CBA09BEC5789F5B7E396E8C972E4DC4F6635B346F444F93160B` |
| `js/office-escape-minigame.js` | `6D8898EB33DB178D3C25196A45C956A3801F7F7A2362DD6A882894F54E51231C` |
| `css/office-escape-minigame.css` | `CA89D6E78BF76CC642069B1BB198F2EE9D9B5BA1DD2D8E9FA398F2F7288C4709` |
| `day4.html` | `C1C49BD642F3B4DFFF73BCCBFF7E80A5C84C127BB2FC04C4FB15BF82174DD834` |
| `dev/day4-office-escape-minigame.html` | `ACE46867DF5D16F62920C180937AD6113AF8609A9B2C4FA2DBB1C453A5FEEF1E` |
| `tests/office-escape-minigame-core.test.js` | `5EA75044F75E76BB7AFF9F5315478CC0E2EE7E4B7CCD7BC9D35F699D45ED7004` |
| `tests/day4-integration.test.js` | `747EF5DE95FC3B72D8487B6B5773BBFD863F9294E05FA9F1D7A317BAD2A8AA4B` |
| `docs/minigames/DAY4_OFFICE_ESCAPE_REQUIREMENTS.md` | `F62A2485DE7254E57EECB4F598F42EDCA8F0F259FCA0442CE7756B05E8B5D278` |
