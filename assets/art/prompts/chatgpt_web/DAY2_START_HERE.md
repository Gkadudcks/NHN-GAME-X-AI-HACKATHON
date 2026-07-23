# DAY 2 ChatGPT 웹 이미지 생성 안내

이 파일만 시작점으로 사용합니다. 이전 캐릭터/배경 배치 JSON과 분리된 안내서는 삭제했습니다.

## 아직 생성되지 않은 DAY 2 이미지

| 순서 | 구분 | 안정 ID | 쓰임 | 새 프롬프트 |
|---|---|---|---|---|
| 1 | 배경 | `background.restaurant.lunch` | `day2Lunch1`부터 이어지는 점심 식당 플레이스홀더 교체 | `restaurant_lunch_v001_prompt_v002.txt` |
| 2 | 배경 | `background.qa_test_space.incident` | `day2BuildSea`부터 이어지는 QA 테스트 공간 플레이스홀더 교체 | `qa_test_space_incident_v001_prompt_v002.txt` |
| 3 | 배경 편집 | `background.office.night` | `day2OvertimeLead`부터 DAY 2 종료까지의 야간 사무실 플레이스홀더 교체 | `office_night_v001_prompt_v002.txt` |
| 4 | 캐릭터 변형 | `character.harin.arms_folded.concerned` | 하린이 혼자 처리하려는 동료를 걱정하는 업무 장면용 연출 보강 | `harin_arms_folded_concerned_v001_prompt_v002.txt` |

우선순위는 플레이스홀더를 직접 교체하는 배경 3개가 높습니다. 4번 하린 변형은 manifest에 계획되어 있지만 현재 `day2-story.js`에는 아직 연결되지 않은 연출 보강용입니다.

## 생성하지 않아도 되는 항목

- `character.harin.holding_cup.tired`: 승인본 생성 완료
- `character.sea.neutral_standing.gentle_smile`: 승인본 생성 완료
- `background.office.day`: `day1-office.png` 재사용
- 하린·민재·박태식·나나봇의 기본 스프라이트: 기존 게임 에셋 재사용
- 민재의 `embarrassed`, `arms_folded.concerned`: DAY 5용이므로 이 DAY 2 작업에서 제외

`assets/art/prompts/rendered/harin_holding_cup_tired_v001_prompt_v002.txt`는 승인된 하린 커피 이미지의 생성 기록입니다. 새 생성 작업에 쓰지 말고 재현 기록으로만 보존합니다.

## 작업 원칙

1. 한 채팅에서 한 이미지 자산만 생성합니다.
2. 아래 지정된 레퍼런스와 해당 프롬프트 파일만 업로드합니다.
3. 프롬프트 파일의 내용을 처음부터 끝까지 그대로 붙여 넣습니다.
4. 한 이미지에 여러 장소, 여러 포즈, 비교표 또는 콘택트 시트를 만들지 않습니다.
5. 결과가 규격을 어기면 수정 지시를 누적하지 말고 새 채팅에서 같은 프롬프트로 다시 시작합니다.
6. ChatGPT가 임의의 글자, 로고, 인물, 소품 또는 배경을 추가한 결과는 사용하지 않습니다.

## 1. 점심 식당 배경

업로드:

- `NAN_GAME_TITLE/assets/backgrounds/day1-office-lounge.png`
- `NAN_GAME_TITLE/assets/backgrounds/day1-office.png`

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/restaurant_lunch_v001_prompt_v002.txt`

다운로드 파일명:

- `restaurant_lunch_v001.png`

두 이미지는 스타일·팔레트·마감 참고일 뿐입니다. 식당 구조를 사무실처럼 만들면 안 됩니다.

## 2. QA 테스트 공간 배경

업로드:

- `NAN_GAME_TITLE/assets/backgrounds/day1-office.png`

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/qa_test_space_incident_v001_prompt_v002.txt`

다운로드 파일명:

- `qa_test_space_incident_v001.png`

중앙 테스트 화면에는 글자가 없는 동일한 튜토리얼 팝업이 정확히 두 개 보여야 합니다.

## 3. 야간 사무실 배경

업로드:

- `NAN_GAME_TITLE/assets/backgrounds/day1-office.png`

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/office_night_v001_prompt_v002.txt`

다운로드 파일명:

- `office_night_v001.png`

새 사무실을 생성하는 작업이 아니라 업로드한 낮 사무실의 시간대·조명만 편집하는 작업입니다.

## 4. 하린 걱정 표정 스프라이트

업로드:

- `NAN_GAME_TITLE/assets/characters/harin-source.png`

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/harin_arms_folded_concerned_v001_prompt_v002.txt`

다운로드 파일명:

- `harin_arms_folded_concerned_v001.png`

투명처럼 보이는 체크무늬가 이미지에 그려져 있으면 실패입니다. 실제 알파 투명 PNG만 받습니다.

## 다운로드 직후

- 승인 전 원본은 캐릭터의 경우 `assets/art/characters/<character_id>/drafts/`, 배경의 경우 `assets/art/backgrounds/drafts/`에 둡니다.
- 기존 파일을 덮어쓰지 않습니다. 재생성본은 이미지 검수 후 필요하면 `v002`로 올립니다.
- 모델명/버전, 생성 시각과 시간대, 프롬프트 파일명, 레퍼런스 파일명, 원본 다운로드 파일명, 표시되는 경우 seed를 기록합니다.
- manifest 또는 이미지가 바뀌면 `python scripts/validate_art_assets.py`를 실행합니다.
