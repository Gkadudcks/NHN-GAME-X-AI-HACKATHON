# DAY 2 비밀 메신저 장면 편집 소스

현재 플레이 화면을 구성하는 코드 소유 SVG입니다. 생성·승인 아트 에셋이 아니라, 미니게임 화면을 빠르게 조정하기 위한 편집 원본입니다.

- `scene/office-map.svg`: 창문, 바닥, 부장님 책상, 팀 책상과 파티션
- `characters/boss-back.svg`, `characters/boss-front.svg`: 부장님 기본 자세
- `characters/doyun-idle.svg`, `characters/harin-idle.svg`, `characters/minjae-idle.svg`: 팀원 기본 자세

게임은 `js/art-assets.js`의 `minigame.day2_secret_chat.*` ID를 통해 이 파일을 불러옵니다. 화면 구조를 먼저 조정할 때는 맵 SVG와 `css/secret-chat-minigame.css`의 배치 값을 수정합니다. 캐릭터 도트를 바꿀 때는 각 캐릭터 SVG를 수정하거나 같은 위치에 새 포즈 SVG를 추가합니다.
