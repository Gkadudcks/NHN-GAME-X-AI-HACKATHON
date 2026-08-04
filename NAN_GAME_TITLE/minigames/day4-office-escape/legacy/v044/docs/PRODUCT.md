# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

한국어 비주얼 노벨을 플레이하며 짧은 업무·관계 서사 사이에 들어가는 미니게임을 즐기는 플레이어. DAY 4에서는 발표 전날의 긴장을 해치지 않는 1분 안팎의 퇴근 추격전을 플레이한다.

## Product Purpose

`NAN`은 현대 한국 오피스를 배경으로 업무 선택, 미스터리 단서, 관계 변화를 엮는 비주얼 노벨이다. 미니게임은 이야기를 중단하는 별도 장르가 아니라 그날의 감정과 사건을 직접 체험하게 하는 짧은 장면이어야 한다.

## Positioning

업무 현실에서 나온 위험과 관계 캐릭터의 개입을, 실패해도 서사를 막지 않는 짧은 플레이로 변환한다.

## Operating Context

- 정적 HTML/CSS/JavaScript로 실행하며 `file://` 환경에서도 동작해야 한다.
- DAY별 스토리 화면, 공용 저장·설정·일시정지·오디오·아트 manifest 구조를 유지한다.
- DAY 4 퇴근 미니게임은 본편의 `OfficeEscapeMinigame.start({ onComplete })` 계약으로 실행된다.
- 개발 전용 화면은 `NAN_GAME_TITLE/minigames/day4-office-escape/dev/` 아래에서 본편과 독립적으로 반복 실행할 수 있어야 한다.

## Capabilities and Constraints

- DAY 4 미니게임은 자동 달리기, 점프, 슬라이드를 사용한다.
- 목표 플레이 시간은 60~75초이며 사무실, 회의실·복합기 복도, 엘리베이터 로비의 세 구간을 지난다.
- 실패는 재시작 강제나 스토리 차단으로 이어지지 않는다.
- 결과 등급은 피격 0회 `perfect`, 1~2회 `close`, 3회 이상 `caught`이다.
- 접근성 입력, 키보드 포커스, 모바일 터치, reduced motion, 공용 일시정지를 지원한다.
- 이미지 경로를 코드에 직접 쓰지 않고 승인된 manifest 안정 ID만 런타임에서 사용한다.

## Brand Commitments

- 현대 한국 오피스 로맨스 비주얼 노벨의 기존 세계관과 한국어 문체를 유지한다.
- 얇고 깨끗한 선, 2~3단 셀 셰이딩, 자연스러운 성인 비율을 사용한다.
- 치비, 픽셀 아트, 네온 중심 게임 UI, 3D 렌더 스타일은 사용하지 않는다.
- 레퍼런스는 Mario 계열의 읽기 쉬운 자동 달리기와 Danganronpa V3 `Death Road of Despair`의 집단 탈출 긴장감이다. 의도적 불공정함과 미끄러운 조작은 계승하지 않는다.

## Evidence on Hand

- DAY 4 서사 초안: `docs/story/DAY4_STORY_DRAFT.md`
- 아트 파이프라인과 스타일 제약: `docs/art/`
- 승인된 사무실·회의실·엘리베이터 배경과 서하린·부장 캐릭터 에셋
- 기존 DAY 4 본편 통합과 프로토타입: `NAN_GAME_TITLE/day4.html`, `NAN_GAME_TITLE/minigames/day4-office-escape/index.js`

## Product Principles

- 먼저 읽히고, 그다음 도전적이어야 한다.
- 실패는 이야기를 바꾸되 진행을 막지 않는다.
- 서하린의 도움은 항상 체감되며 호감도는 대사 톤만 바꾼다.
- 짧은 플레이 안에서 위험 예고, 입력, 결과의 인과가 명확해야 한다.
- 기존 공용 구조와 안정 ID를 확장하고 중복 런타임을 만들지 않는다.

## Accessibility & Inclusion

키보드와 포인터·터치 입력을 동등하게 제공하고, 입력 버퍼·코요테 타임·축소된 충돌 상자·위험 예고로 조작 부담을 낮춘다. 움직임 감소 설정에서는 장식성 흔들림과 플래시를 줄인다.
