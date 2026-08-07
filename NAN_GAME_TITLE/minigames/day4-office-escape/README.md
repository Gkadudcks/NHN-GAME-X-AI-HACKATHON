# DAY 4 오피스 이스케이프 V2

`부장님 피해서 퇴근하기`는 DAY 4 본편에 연결된 64초 자동 달리기 미니게임이다. 현재 구현과 본게임 연결은 완료됐으며, 이 README가 기능의 파일 지도와 유지보수 계약을 함께 담당한다.

## 현재 상태

- PC 데스크톱 브라우저 전용
- 64초 코스, 위험물 18개, 선택 수집물 3개
- 점프·슬라이드 직접 입력, 입력 예약과 자동 실행 없음
- 최초 점프·슬라이드 위험에서만 회차당 한 번씩 조작 cue 표시
- 고정 캐릭터 대형, 렌더 캐시, 배경 교차 전환 적용
- 하린은 도윤의 점프·슬라이드를 0.15초 지연으로 따라가는 시각 echo이며, 점프는 도윤과 동일한 `Core.JUMP_VELOCITY`/`Core.GRAVITY` 공식을 그대로 사용해 높이·체공시간이 일치한다
- 아이템 획득·장애물 회피·피격에는 `UiSfx.playMinigameCue` 효과음과 대응 애니메이션이 붙는다
- 부장님이 도윤이 처리한 장애물의 위치에 실제로 도달하는 시점(대형 간격 ÷ 현재 속도로 계산)에 파괴 연출이 재생된다
- 캐릭터 표시 크기는 서로 겹치지 않도록 전 포즈에 걸쳐 균일하게 0.82배 축소되어 있다
- 결과 화면의 `스토리 계속하기`로 DAY 4 성공·잡힘 후속 장면에 복귀
- 추가 구현 예정 작업 없음

## 파일 지도

| 파일 | 역할 |
| --- | --- |
| `core.js` | 코스, 입력, 이동, 충돌, 결과를 담당하는 결정론적 코어 |
| `index.js` | DOM, 키보드 입력, 렌더링, 효과음, 본게임 콜백 |
| `style.css` | HUD, 캐릭터, 장애물, 결과 화면의 시각 표현 |
| `art-assets.js` | 승인된 아트 ID와 메트릭 해석 |
| `dev/index.html` | 정적 장면과 실제 플레이 검수 진입점 |
| `tests/core.test.js` | 코어 규칙 테스트 |
| `../../tests/day4-integration.test.js` | DAY 4 본편·저장·스토리 연결 테스트 |
| `../../day4.html` | production 진입점 |

## 공개 계약

- `OfficeEscapeMinigame.start({ onComplete })`
- `OfficeEscapeMinigame.pause()`
- `OfficeEscapeMinigame.resume()`
- `OfficeEscapeMinigame.debugSnapshot()`
- 완료 결과 필드: `grade`, `caught`, `elapsed`, `hitCount`, `collectedItems`, `maxCombo`

`caught`도 정상적인 DAY 4 완료다. Production 결과 버튼은 재시작을 강제하지 않고 결과를 본편 콜백으로 전달한다. `caught: false`는 하린과 저녁 식사 장면, `caught: true`는 추가 확인 야근 장면으로 이어지며 저장 결과는 DAY 5의 전날 회상 대사에도 반영된다.

## 유지보수 규칙

- 게임 규칙은 `core.js`, 브라우저 상태와 표현은 `index.js`·`style.css`에 둔다.
- 공개 API와 결과 필드를 깨지 않는다.
- 점프·슬라이드는 실행 가능한 입력 프레임에만 시작하며 실행 불가 입력은 폐기한다.
- 하린의 기계적 보조는 호감도와 결합하지 않는다.
- production 아트는 `ArtAssets.resolve(id)`와 승인된 manifest 버전을 사용한다.
- 미니게임 루트의 `hidden` 상태는 반드시 `display: none`으로 처리해 본편 복귀 화면을 가리지 않게 한다.
- `index.js`는 Escape 키를 자체적으로 처리하지 않는다. 다른 미니게임과 동일하게 `nan:pause-open`/`nan:pause-close`/`nan:settings-open`/`nan:settings-close` 이벤트만 구독해 `pause()`/`resume()`을 호출한다. Escape를 직접 가로채면 본게임 전역 일시정지 메뉴와 상태가 어긋난다.
- 장애물은 회피·피격 판정과 동시에 `activeObjects`에서 제거되어 DOM 노드도 즉시 사라진다. 따라서 "부장님이 장애물에 도달"하는 연출은 장애물의 실시간 위치를 추적하지 않고, 판정 시점의 화면 좌표를 캡처한 뒤 대형 간격과 그 순간의 속도로 지연시간을 계산해 재생한다(`queueBossBreak`/`updateBossBreaks`).
- 변경 범위에 해당하는 Core 또는 DAY 4 integration 대상 테스트만 우선 실행한다. 전체 테스트와 아트 검증은 최종 통합이나 이미지·manifest 변경 때 수행한다.

## 검수 진입점

- 기본 검수: `dev/index.html`
- 실제 플레이: 시작 안내의 `퇴근 시작`
- 정적 장면: `?composition=c&scene=run`, `jump`, `slide`, `collectible`, `maximum`, `hit`, `arrival`, `result`
- 판정 확인: dev 페이지의 `판정 보기`

Legacy 구현은 `legacy/v044/`에 보존돼 있으며 명시적인 회귀 조사 외에는 현재 결정 근거로 사용하지 않는다.
