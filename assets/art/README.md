# Art source assets

이 폴더는 생성 이미지, 프롬프트, 생성 이력과 엔진 중립 안정 ID 레지스트리의 소스 오브 트루스입니다. 작업 전 `docs/art/ART_PIPELINE.md`를 읽고, 모든 `approved/` 파일은 불변으로 취급합니다.

## 어디를 보면 되는가

- `characters/`, `backgrounds/`, `event_cg/`: 본게임 대화형/VN 이미지
- `minigames/day4-office-escape/`: DAY 4 퇴근 미니게임 전용 이미지
- `manifests/art-assets.json`: 본게임과 미니게임의 안정 ID·활성 버전 레지스트리
- `generation_logs/`, `prompts/`: 생성 재현 기록과 실제 렌더 프롬프트

`NAN_GAME_TITLE/assets/`는 오디오·폰트·레거시 런타임 파일용이며, 생성 이미지 승인 파이프라인과 역할이 다릅니다.

