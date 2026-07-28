# Project TODO

## Settings follow-up

- Implement the saved `dialogueMode` setting so auto progression advances story text only after its full reveal and always stops for choices, overlays, and unread clue confirmations.
- Implement the saved `textSpeed` setting in every DAY story renderer, including instant/fast/normal/slow reveal timings and accessibility-safe defaults.
- Connect the existing `autoDelay` value to the implemented auto progression timing after the two items above are complete.

### Current scope

The global settings dialog currently applies volume, text size, dialogue opacity, reduced effects, and screen mode immediately. Auto progression, text speed, and auto-delay are intentionally not exposed as active controls until the DAY renderers support them consistently.


0728
- [ ] 장소 이동 버벅거리는 거 처럼 보여서 부드럽게 변경
- [ ]  호감도가 낮으면 영원히 호감도를 올리는 선택지를 선택할 수 없는 문제
- [ ] day2 미니게임 효과 수정
- [ ] day4 스토리 다듬고 1차구현하기
- [ ] day3 시작 시 메신저 기록 유지
- [ ] 단서 탭 topic 너무 나눌 필요 있을까? & day3 단서 개수 왤케 많지? 5개 이하로 했을텐데.. 보기 쉽게 개선
- [ ] 