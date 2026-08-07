# [SCOPE INDEX] 미니게임 모듈

이 디렉터리는 본편과 독립적으로 수정·검증할 수 있는 미니게임 기능 단위만 관리한다.

이 파일은 기능 목록과 모듈 경계만 설명한다. 각 미니게임의 구현 결정은 해당 기능 README가 `[AUTHORITATIVE]`로 연결한 문서에서 확인한다. legacy 또는 Git 이력은 현재 요구사항으로 사용하지 않는다.

## 경계 규칙

- 본편은 각 미니게임의 `index.js`가 노출하는 공개 API만 호출한다.
- 미니게임의 내부 상태, dev 도구, 테스트, 전용 문서는 본편 코드에서 참조하지 않는다.
- 전용 CSS와 코드 소유 SVG는 해당 미니게임 폴더에 둔다.
- 승인 이미지와 생성 이력은 저장소 루트 `assets/art/`의 manifest 파이프라인에 둔다.
- 저장, 설정, 일시정지, 오디오처럼 여러 화면이 사용하는 기능은 기존 공용 모듈을 재사용한다.
- 각 `docs/`의 설계 문서는 해당 미니게임에만 적용되며 본게임 전체 설계 기준이 아니다.

## 기능 목록

- `day1-coffee`: DAY 1 커피 제조
- `day2-secret-chat`: DAY 2 부장님 몰래 메신저하기
- `day3-work-alert`: DAY 3 업무 알림 처리
- [`day4-office-escape`](day4-office-escape/README.md): DAY 4 부장님 피해서 퇴근하기 · **[ACTIVE STRUCTURAL REWORK]**
- `shared/dev.css`: 독립 실행 화면이 함께 사용하는 dev 셸 스타일

각 기능의 빠른 확인 화면은 `<feature>/dev/index.html`에서 실행한다.
