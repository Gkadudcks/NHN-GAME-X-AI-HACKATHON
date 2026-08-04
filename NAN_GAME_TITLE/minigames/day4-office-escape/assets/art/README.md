# DAY 4 Office Escape art

`부장님 피해서 퇴근하기` 미니게임만 사용하는 이미지 폴더입니다. 본게임 대화형 캐릭터·배경과 물리적으로 분리되어 있습니다.

```text
day4-office-escape/
  backgrounds/approved/       전용 사무실·복도·엘리베이터 배경
  characters/<character>/
    references/               생성 참조
    review/                   비활성 검수 후보
    approved/                 런타임 사용 가능 불변 파일
  props/
    review/                   비활성 장애물·수집물 후보
    approved/                 런타임 사용 소품
  concepts/                   레이아웃 비교 시안과 시안 프롬프트
  reviews/                    아트 검수 보드
  work/                       정규화 전 가공 원본과 중간 산출물
  prompts/rendered/           DAY 4 전용 렌더 프롬프트
  generation_logs/            DAY 4 전용 생성 로그
```

## 참조 흐름

1. `assets/art/manifests/art-assets.json`이 안정 ID와 `active_version`을 결정합니다.
2. `NAN_GAME_TITLE/minigames/day4-office-escape/art-assets.js`가 활성 승인 파일만 브라우저 경로로 해석합니다.
3. `NAN_GAME_TITLE/minigames/day4-office-escape/index.js`는 경로를 직접 쓰지 않고 전용 리졸버만 호출합니다.

DAY 4 전용 생성 로그와 렌더 프롬프트도 이 폴더에 유지합니다. 과거 로그 안의 참조 경로는 생성 당시 위치를 보존할 수 있으므로, 현재 런타임 파일 위치는 항상 매니페스트를 기준으로 확인합니다.

본게임용 `NAN_GAME_TITLE/js/art-assets.js`에는 이 폴더의 ID를 등록하지 않습니다. 새 이미지는 `planned → draft → review → approved` 절차와 사용자 승인 게이트를 거쳐야 합니다.

배경 3장은 기존 승인 배경을 픽셀 변경 없이 복제한 미니게임 전용 승인 사본입니다. 원본과 사본의 SHA-256이 같으며, 이후 한쪽을 수정하지 말고 새 버전을 추가합니다.
