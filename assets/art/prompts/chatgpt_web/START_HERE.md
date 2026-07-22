# 다른 ChatGPT 웹 프로젝트로 옮기는 방법

## 업로드할 파일

다음 파일을 같은 ChatGPT 프로젝트에 업로드합니다.

### 공통 설정

- `PROJECT_INSTRUCTIONS.md`
- `CHATGPT_IMAGE_BATCH_001.json`
- `art-assets.json`
- `harin/CHARACTER_SPEC.md`
- `minjae/CHARACTER_SPEC.md`

### 마스터 레퍼런스

- `harin-source.png`
- `minjae-source.png`

### 렌더용 프롬프트

- `harin_holding_cup_tired_v001_prompt_v002.txt`
- `harin_arms_folded_concerned_v001_prompt_v001.txt`
- `minjae_neutral_standing_embarrassed_v001_prompt_v001.txt`
- `minjae_arms_folded_concerned_v001_prompt_v001.txt`

웹 프로젝트에 폴더 구조가 유지되지 않아도 괜찮습니다. 단, 파일명은 바꾸지 않습니다.

## 프로젝트 지침 설정

ChatGPT 프로젝트의 프로젝트 지침란에는 `PROJECT_INSTRUCTIONS.md`의 전체 내용을 붙여 넣습니다. 같은 파일을 프로젝트 자료로도 업로드해 두면 이후 지침을 확인하기 쉽습니다.

## 첫 요청

아래 문장을 새 채팅에 그대로 입력합니다.

```text
PROJECT_INSTRUCTIONS.md와 CHATGPT_IMAGE_BATCH_001.json을 먼저 모두 읽어주세요.
배치의 order 1만 작업합니다.
harin-source.png를 캐릭터 정체성과 의상의 절대 기준으로 사용하고,
harin_holding_cup_tired_v001_prompt_v002.txt의 허용 변경만 적용해
투명 배경 전신 캐릭터 후보를 생성해주세요.
생성 전에 이해한 asset_id, 레퍼런스, 변경 허용 범위, 출력 파일명을 짧게 확인하고 진행해주세요.
```

결과를 승인하거나 폐기한 뒤 `order 2`, `order 3`, `order 4` 순서로 한 장면씩 진행합니다. 한 요청에서 서로 다른 캐릭터나 포즈를 동시에 생성하지 않습니다.

## 다운로드 후 저장 위치

승인 전 후보는 다음 위치에 저장합니다.

```text
assets/art/characters/<character_id>/drafts/
```

검토할 후보는 다음 위치로 복사하고 매니페스트 상태를 `review`로 변경합니다.

```text
assets/art/characters/<character_id>/review/
```

승인이 끝나기 전에는 `approved/`에 넣지 않습니다. 승인본을 수정해야 할 때는 기존 파일을 덮어쓰지 말고 `v002`, `v003`처럼 새 버전을 만듭니다.

## 생성 결과와 함께 기록할 정보

- 사용한 ChatGPT 이미지 모델 또는 표시된 모델명
- 생성 날짜와 시간 및 시간대
- asset ID와 버전
- 프롬프트 파일명과 버전
- 사용한 레퍼런스 파일명
- 후보 번호
- seed가 표시된다면 seed, 표시되지 않으면 `null`
- 원본 다운로드 파일명

이 정보는 나중에 `assets/art/generation_logs/`의 JSONL 기록으로 옮깁니다.
