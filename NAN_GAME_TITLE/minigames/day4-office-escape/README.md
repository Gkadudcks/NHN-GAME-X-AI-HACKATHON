# [FEATURE ENTRYPOINT] DAY 4 오피스 이스케이프 V2

상태: **기존 구조·UI 개선 완료 · 남은 작업 3개: CUE-01 → 4프레임 달리기 → 최종 통합**

이 README는 DAY 4 `부장님 피해서 퇴근하기`의 파일 지도와 문서 진입점이다. 세부 제품 결정, Phase 범위, 완료 기준은 아래 `[AUTHORITATIVE]` 문서 하나만 따른다.

## 문서 권위

| 태그                            | 문서·경로                                          | 용도                            | 구현 결정 사용                     |
| ----------------------------- | ---------------------------------------------- | ----------------------------- | ---------------------------- |
| **[AUTHORITATIVE]**           | [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) | 현재 구조 재작업 계획, 확정 계약, 이슈·진행 추적 | **예 · 유일한 기준**               |
| **[FEATURE ENTRYPOINT]**      | 이 README                                       | 파일 위치와 읽기 순서 안내               | 세부 결정 금지                     |
| **[SCOPE INDEX]**             | [`../README.md`](../README.md)                 | 전체 미니게임 목록과 모듈 경계             | 세부 결정 금지                     |
| **[LEGACY — DO NOT USE]**     | `legacy/v044/`                                 | 이전 구현의 보존 코드                  | **아니오 · 명시적 디버깅 요청 전 열람 금지** |
| **[HISTORY — NON-NORMATIVE]** | Git 이력                                         | 변경 추적과 복구 수단                  | **아니오**                      |

과거 배경·UI 계획서는 활성 문서에서 제거했다. 삭제된 문서나 Git 이력의 결정을 현재 요구사항으로 되살리지 않는다. `[AUTHORITATIVE]` 문서에 없는 결정이 필요하면 legacy를 참고하지 말고 사용자에게 확인한다.

## 작업 전 읽기 순서

1. 저장소 루트 `AGENTS.md`
2. 이 README
3. [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) 전체
4. 현재 담당 Phase의 코드와 직접 관련 테스트
5. 이미지 작업을 실제로 시작할 때만 저장소 아트 파이프라인과 캐릭터 가이드

## 현재 생산 런타임

- 결정론적 코어: `core.js`
- DOM·입력·렌더링: `index.js`
- 시각 표현: `style.css`
- 아트 안정 ID·메트릭: `art-assets.js`
- 검수 페이지: `dev/index.html`
- 코어 테스트: `tests/core.test.js`
- DAY 4 통합 테스트: `../../tests/day4-integration.test.js`
- 본편 진입: `../../day4.html`

## 공개 계약

- `OfficeEscapeMinigame.start({ onComplete })`
- `OfficeEscapeMinigame.pause()`
- `OfficeEscapeMinigame.resume()`
- `OfficeEscapeMinigame.debugSnapshot()`

현재 구조 재작업은 위 API와 DAY 4 저장·스토리 복귀 계약을 유지한다. 구체적인 입력, 좌표, 판정, HUD, 결과, 애니메이션 계약은 `[AUTHORITATIVE]` 문서에만 기록한다.

## 개발·검수 진입점

- 기본 검수: `dev/index.html`
- 시작 안내: dev 페이지의 `실제 플레이`
- 시안 A: `dev/index.html?composition=a&scene=jump`
- 시안 B: `dev/index.html?composition=b&scene=slide`
- 시안 C: `dev/index.html?composition=c&scene=run`
- 상부 구조물: `dev/index.html?composition=c&scene=slide`
- 수집물 오라: `dev/index.html?composition=c&scene=collectible`
- 판정 확인: dev 페이지의 `판정 보기`

README에 테스트 명령이나 완료 수치를 중복 기록하지 않는다. 단계별 최소 검증과 최종 통합 검증은 [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)의 현재 Phase 지시를 따른다.

## 에셋 경계

- 생산 에셋과 생성 이력: `assets/art/`
- 비교 시안과 프롬프트: `assets/art/concepts/`
- 검수 보드와 가공 원본: `assets/art/reviews/`, `assets/art/work/`
- 저장소 공용 manifest: `../../../assets/art/manifests/art-assets.json`

신규 또는 재가공 이미지는 사용자 승인 전 production에 적용하지 않는다. 완료된 작업은 `[AUTHORITATIVE]` 문서의 압축 완료표에 기록돼 있으며, 현재 남은 순서는 `CUE-01 최초 jump·slide cue 제한 → 4프레임 달리기 → 최종 통합`이다.
