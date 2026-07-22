# DAY 2 배경을 다른 ChatGPT 웹 프로젝트에서 생성하는 방법

## 업로드할 공통 설정

- `BACKGROUND_PROJECT_INSTRUCTIONS.md`
- `CHATGPT_BACKGROUND_BATCH_001.json`
- `art-assets.json`
- `BACKGROUND_GUIDE.md`

ChatGPT 프로젝트의 프로젝트 지침란에는 `BACKGROUND_PROJECT_INSTRUCTIONS.md` 전체 내용을 붙여 넣습니다.

## 업로드할 레퍼런스

- `day1-office.png`
- `day1-office-lounge.png`

`day1-office.png`는 야간 사무실의 구조 고정 레퍼런스입니다. 이름을 바꾸거나 리사이즈하지 않습니다.

## 업로드할 렌더용 프롬프트

- `restaurant_lunch_v001_prompt_v001.txt`
- `qa_test_space_incident_v001_prompt_v001.txt`
- `office_night_v001_prompt_v001.txt`

웹 프로젝트에서 폴더 구조가 유지되지 않아도 괜찮지만 파일명은 유지합니다.

## 첫 요청 — 점심 식당

```text
BACKGROUND_PROJECT_INSTRUCTIONS.md와 CHATGPT_BACKGROUND_BATCH_001.json을 모두 읽어주세요.
배치의 order 1만 작업합니다.
day1-office-lounge.png와 day1-office.png는 스타일·팔레트·마감 참고로만 사용하고 구조를 복사하지 마세요.
restaurant_lunch_v001_prompt_v001.txt를 그대로 적용하여 인물과 읽을 수 있는 글자가 없는 1920x1080 배경 후보를 생성해주세요.
생성 전에 asset_id, 허용된 레퍼런스 용도, 출력 파일명을 짧게 확인해주세요.
```

## 두 번째 요청 — QA 중복 팝업

```text
배치의 order 2만 작업합니다.
day1-office.png는 같은 회사의 스타일 참고로만 사용해주세요.
qa_test_space_incident_v001_prompt_v001.txt를 적용하여 중앙 테스트 화면에 글자 없는 동일한 튜토리얼 팝업 두 개가 동시에 겹쳐 보이게 해주세요.
배경에는 사람과 캐릭터를 넣지 마세요.
```

## 세 번째 요청 — 야간 사무실

```text
배치의 order 3만 작업합니다.
day1-office.png를 직접 편집하는 구조 고정 변형입니다.
office_night_v001_prompt_v001.txt에 따라 카메라, 창문, 책상, 의자, 모니터, 통로, 커피 공간과 모든 구조를 그대로 유지하고 시간대와 조명만 야간으로 변경해주세요.
```

한 번에 한 배경만 생성합니다. 식당과 QA 공간은 첫 승인본이 이후 변형의 구조 마스터가 됩니다.

## 다운로드 후 저장 위치

승인 전 후보:

```text
assets/art/backgrounds/drafts/
```

검토 후보:

```text
assets/art/backgrounds/review/
```

승인 전에는 `approved/`에 넣지 않습니다. 수정본은 기존 파일을 덮어쓰지 않고 `v002`, `v003`으로 올립니다.

## 기록할 생성 정보

- asset ID와 버전
- 모델명과 표시된 버전
- 프롬프트 파일명과 버전
- 레퍼런스 파일명과 용도
- 후보 번호
- seed가 제공되면 seed, 아니면 `null`
- 생성 시각과 시간대
- 원본 다운로드 파일명

