# DAY 5 ChatGPT 웹 이미지 생성 안내

이 파일만 시작점으로 사용합니다.

## 아직 생성되지 않은 DAY 5 이미지

| 순서 | 구분 | 안정 ID | 쓰임 | 새 프롬프트 |
|---|---|---|---|---|
| 1 | 배경 | `background.presentation_hallway.day` | `day5HallwayPause`, `day5HarinHallway` (발표 종료 직후 복도 장면) 텍스트 전용 연출을 실제 배경으로 교체 | `presentation_hallway_day_v001_prompt_v001.txt` |
| 2 | 배경 | `background.office_lobby.night` | `day5MiddleExit`, `day5MiddleOutside` (MIDDLE 엔딩, 엘리베이터에서 내려 로비를 지나 나가는 장면) 배경 없음 → 실제 배경으로 교체. MIDDLE 엔딩 CG(`cg_day5_colleague_departure_v001.png`)와 같은 로비 | `office_lobby_night_v001_prompt_v001.txt` |

`docs/story/DAY5_STORY_DRAFT.md`는 원래 이 복도 장면을 "전용 배경이 없는" 텍스트 전용 장면으로 정의했습니다. 배경을 새로 만들면 해당 문서 설명과 `js/day5-story.js`의 `day5HallwayPause`/`day5HarinHallway` 씬에 `bgAssetId: "background.presentation_hallway.day"`를 추가해야 합니다(승인 후 진행).

`day5MiddleExit`/`day5MiddleOutside`도 현재 `bgAssetId`가 없어 VISUAL PLACEHOLDER로 표시됩니다. 로비 배경이 승인되면 두 씬에 `bgAssetId: "background.office_lobby.night"`를 추가합니다. 기존에 계획만 돼 있던 `background.office_exterior.night`(건물 밖 야간)는 실제 CG가 로비 장면이라 이 용도로는 더 이상 필요하지 않습니다 — 다른 장면에 쓸 계획이 없다면 manifest에서 제거해도 됩니다.

## 작업 원칙

1. 한 채팅에서 한 이미지 자산만 생성합니다.
2. 아래 지정된 레퍼런스와 해당 프롬프트 파일만 업로드합니다.
3. 프롬프트 파일의 내용을 처음부터 끝까지 그대로 붙여 넣습니다.
4. 한 이미지에 여러 장소, 여러 포즈, 비교표 또는 콘택트 시트를 만들지 않습니다.
5. 결과가 규격을 어기면 수정 지시를 누적하지 말고 새 채팅에서 같은 프롬프트로 다시 시작합니다.
6. ChatGPT가 임의의 글자, 로고, 인물, 소품 또는 배경을 추가한 결과는 사용하지 않습니다.

## 1. 발표실 밖 복도 배경

업로드:

- `assets/art/backgrounds/approved/presentation_room_day_v001.png` (건물·팔레트·마감 참고용. 발표실 자체를 다시 그리면 안 됩니다.)

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/presentation_hallway_day_v001_prompt_v001.txt`

다운로드 파일명:

- `presentation_hallway_day_v001.png`

발표실 내부가 아니라 발표실 밖 복도입니다. 닫힌 발표실 문, 창가의 늦은 오전 햇빛, 벽 쪽 대기 벤치, 멀리 이어지는 엘리베이터 로비 방향의 복도 원근감이 있어야 하며 인물·읽을 수 있는 글자는 없어야 합니다.

## 2. 1층 로비 배경 (MIDDLE 엔딩)

업로드:

- `assets/art/event_cg/approved/cg_day5_colleague_departure_v001.png` (이 로비를 그대로 배경으로 재현하는 레이아웃/건축 레퍼런스. 인물은 빼고 배경만.)
- `assets/art/backgrounds/approved/office_day_v001.png`
- `assets/art/backgrounds/approved/elevator_lobby_night_v001.png`

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/office_lobby_night_v001_prompt_v001.txt`

다운로드 파일명:

- `office_lobby_night_v001.png`

대리석 바닥, 목재 패널 리셉션 데스크, 원통형 회전문, 유리 너머로 보이는 노을/야간 도심 풍경이 있어야 하며, 인물·읽을 수 있는 글자는 없어야 합니다.

## 다운로드 직후

- 승인 전 원본은 `assets/art/backgrounds/drafts/`에 둡니다.
- 모델명/버전, 생성 시각과 시간대, 프롬프트 파일명, 레퍼런스 파일명, 원본 다운로드 파일명, 표시되는 경우 seed를 `assets/art/generation_logs/<자산명>_v001.jsonl`에 기록합니다 (예: `presentation_hallway_day_v001.jsonl`, `office_lobby_night_v001.jsonl`).
- 검수 체크리스트(`docs/art/ASSET_REVIEW_CHECKLIST.md`) 통과 후 `assets/art/backgrounds/approved/`로 옮기고 manifest의 해당 항목 `status`를 `approved`, `active_version`을 `v001`로 바꿉니다.
- Python이 설치되어 있으면 저장소 루트에서 `python scripts/validate_art_assets.py`를 실행해 확인합니다.
