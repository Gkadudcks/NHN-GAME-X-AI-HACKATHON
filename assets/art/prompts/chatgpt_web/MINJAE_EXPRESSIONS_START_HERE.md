# 강민재 신규 표정 2종 ChatGPT 웹 이미지 생성 안내

이 파일만 시작점으로 사용합니다.

## 아직 생성되지 않은 강민재 관련 이미지

| 순서 | 구분 | 안정 ID | 쓰임 | 새 프롬프트 |
|---|---|---|---|---|
| 1 | 표정 추가 | `character.minjae.arms_folded.concerned` | DAY5 `day5MinjaeConfront`(10:41, 재실행 요청을 인정/방어하는 대치) — 긴장하며 방어적으로 설명하는 표정 | `minjae_arms_folded_concerned_v001_prompt_v001.txt` |
| 2 | 표정 추가 | `character.minjae.neutral_standing.embarrassed` | DAY5 `day5MinjaeAdmit`(10:43)·`day5MinjaeApology`(11:06)·`day5MinjaeAfterHours`(16:10) — 조용히 잘못을 인정하고 사과하는 표정 | `minjae_neutral_standing_embarrassed_v001_prompt_v001.txt` |

강민재는 현재 `character.minjae.relaxed_standing.gentle_smile` 표정 하나만 존재해서, DAY5의 재실행 요청 은폐 고백/사과 장면에서도 계속 웃는 얼굴로 나오고 있습니다. 이 2종을 추가하면 대치(1)→인정·사과(2)로 표정이 자연스럽게 이어집니다.

## 작업 원칙

1. 한 채팅에서 한 이미지 자산만 생성합니다.
2. 아래 지정된 레퍼런스와 해당 프롬프트 파일만 업로드합니다.
3. 프롬프트 파일의 내용을 처음부터 끝까지 그대로 붙여 넣습니다.
4. 한 이미지에 여러 포즈, 비교표 또는 콘택트 시트를 만들지 않습니다.
5. 결과가 규격을 어기면 수정 지시를 누적하지 말고 새 채팅에서 같은 프롬프트로 다시 시작합니다.
6. ChatGPT가 임의의 글자, 로고, 소품 또는 배경을 추가한 결과는 사용하지 않습니다.

## 1. 팔짱 낀 긴장 표정 (대치 장면)

업로드:

- `NAN_GAME_TITLE/assets/characters/minjae-source.png` (유일한 정체성/의상 레퍼런스)

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/minjae_arms_folded_concerned_v001_prompt_v001.txt`

다운로드 파일명:

- `minjae_arms_folded_concerned_v001.png`

## 2. 고개 숙인 사과 표정 (인정·사과 장면)

업로드:

- `NAN_GAME_TITLE/assets/characters/minjae-source.png` (유일한 정체성/의상 레퍼런스)

붙여 넣을 프롬프트:

- `assets/art/prompts/rendered/minjae_neutral_standing_embarrassed_v001_prompt_v001.txt`

다운로드 파일명:

- `minjae_neutral_standing_embarrassed_v001.png`

## 다운로드 직후

- 승인 전 원본은 `assets/art/characters/minjae/drafts/`에 둡니다.
- 모델명/버전, 생성 시각, 프롬프트 파일명, 레퍼런스 파일명, 원본 다운로드 파일명, 표시되는 경우 seed를 각각 `assets/art/generation_logs/minjae_arms_folded_concerned_v001.jsonl` / `assets/art/generation_logs/minjae_neutral_standing_embarrassed_v001.jsonl`에 기록합니다.
- 검수 체크리스트(`docs/art/ASSET_REVIEW_CHECKLIST.md`) 통과 후 `assets/art/characters/minjae/approved/`로 옮기고 manifest의 해당 항목 `status`를 `approved`, `active_version`을 `v001`로 바꿉니다.
- Python이 설치되어 있으면 저장소 루트에서 `python scripts/validate_art_assets.py`를 실행해 확인합니다.
