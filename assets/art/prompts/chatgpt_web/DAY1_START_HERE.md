# DAY 1 ChatGPT 웹 이미지 생성 안내

이 파일만 시작점으로 사용합니다.

## 아직 생성되지 않은 DAY 1 관련 이미지

| 순서 | 구분 | 안정 ID | 쓰임 | 새 프롬프트 |
|---|---|---|---|---|
| 1 | 배경 편집 | `background.meeting_room.morning` | `coffeeResult`/`bossVerbal`/`harinInterpret`(오전 10:45~11:02 회의실 장면)이 노을 진 `meeting_room.afternoon`을 잘못 재사용 중 → 오전 톤으로 교체 | `meeting_room_morning_v001_prompt_v001.txt` |

이 회의실 배경은 DAY 1뿐 아니라 다른 날에도 재사용되는 공용 자산입니다. 지금은 "afternoon"(노을) 버전 하나뿐이라 오전 장면에도 그대로 쓰이고 있어 시간대가 안 맞습니다.

## 작업 원칙

1. 한 채팅에서 한 이미지 자산만 생성합니다.
2. 아래 지정된 레퍼런스와 해당 프롬프트 파일만 업로드합니다.
3. 프롬프트 파일의 내용을 처음부터 끝까지 그대로 붙여 넣습니다.
4. 한 이미지에 여러 장소, 여러 포즈, 비교표 또는 콘택트 시트를 만들지 않습니다.
5. 결과가 규격을 어기면 수정 지시를 누적하지 말고 새 채팅에서 같은 프롬프트로 다시 시작합니다.
6. ChatGPT가 임의의 글자, 로고, 인물, 소품 또는 배경을 추가한 결과는 사용하지 않습니다.

## 1. 회의실 오전 배경 (기존 회의실의 시간대만 편집)

업로드:

- `assets/art/backgrounds/approved/meeting_room_afternoon_v001.png` (편집 대상 원본이자 유일한 레퍼런스)

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/meeting_room_morning_v001_prompt_v001.txt`

다운로드 파일명:

- `meeting_room_morning_v001.png`

새 회의실을 만드는 작업이 아니라, 업로드한 이미지의 시간대·조명만 노을에서 맑은 오전으로 바꾸는 편집 작업입니다. 가구·구도·카메라 각도는 그대로 유지되어야 합니다.

## 다운로드 직후

- 승인 전 원본은 `assets/art/backgrounds/drafts/`에 둡니다.
- 모델명/버전, 생성 시각과 시간대, 프롬프트 파일명, 레퍼런스 파일명, 원본 다운로드 파일명, 표시되는 경우 seed를 `assets/art/generation_logs/meeting_room_morning_v001.jsonl`에 기록합니다.
- 검수 체크리스트(`docs/art/ASSET_REVIEW_CHECKLIST.md`) 통과 후 `assets/art/backgrounds/approved/`로 옮기고 manifest의 `background.meeting_room.morning` 항목 `status`를 `approved`, `active_version`을 `v001`로 바꿉니다.
- Python이 설치되어 있으면 저장소 루트에서 `python scripts/validate_art_assets.py`를 실행해 확인합니다.
