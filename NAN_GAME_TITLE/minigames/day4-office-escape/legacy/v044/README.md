# DAY 4 퇴근 추격 미니게임

- 본편 진입점: `index.js`
- 결정론 코어: `core.js`
- 전용 아트 resolver: `art-assets.js`
- 스타일: `style.css`
- 공개 API: `OfficeEscapeMinigame.start({ onComplete })`, `pause()`, `resume()`
- 빠른 확인: `dev/index.html`
- 단위 테스트: `tests/core.test.js`
- 전용 설계 문서: `docs/`

`docs/`의 `DESIGN.md`와 `PRODUCT.md`를 포함한 모든 문서는 이 미니게임에만 적용된다. 본게임 전체 디자인이나 제품 기준을 선언하지 않는다.

승인 이미지와 생성 이력은 상위 기능 폴더의 `../../assets/art/` 및 전역 manifest에서 관리하며 이 legacy 폴더에 복사하지 않는다.
