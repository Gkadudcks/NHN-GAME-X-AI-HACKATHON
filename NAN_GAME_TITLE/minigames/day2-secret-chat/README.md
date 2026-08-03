# DAY 2 비밀 메신저 미니게임

- 본편 진입점: `index.js`
- 스타일: `style.css`
- 공개 API: `SecretChatMinigame.start({ onComplete, affection })`, `pause()`, `resume()`
- 빠른 확인: `dev/index.html`
- 단위 테스트: `tests/index.test.js`
- 전용 설계 문서: `docs/`

`assets/`의 맵과 캐릭터 SVG는 현재 플레이 화면을 구성하는 코드 소유 편집 자산이다. 생성·승인 아트 에셋이 아니며, 본게임 공용 아트로 사용하지 않는다.

- `assets/scene/office-map.svg`: 창문, 바닥, 부장님 책상, 팀 책상과 파티션
- `assets/characters/boss-back.svg`, `assets/characters/boss-front.svg`: 부장님 기본 자세
- `assets/characters/doyun-idle.svg`, `assets/characters/harin-idle.svg`, `assets/characters/minjae-idle.svg`: 팀원 기본 자세

게임은 공용 `js/art-assets.js`의 `minigame.day2_secret_chat.*` ID를 통해 이 파일을 불러온다. 화면 구조는 맵 SVG와 이 폴더의 `style.css`에서 조정한다.
