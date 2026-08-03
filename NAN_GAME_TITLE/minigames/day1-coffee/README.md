# DAY 1 커피 제조 미니게임

- 본편 진입점: `index.js`
- 스타일: `style.css`
- 공개 API: `CoffeeMinigame.start({ onComplete })`, `pause()`, `resume()`
- 빠른 확인: `dev/index.html`
- 단위 테스트: `tests/index.test.js`

내부 레시피와 점수 계산은 본편에서 직접 참조하지 않는다. 본편은 완료 콜백 결과만 소비한다.
