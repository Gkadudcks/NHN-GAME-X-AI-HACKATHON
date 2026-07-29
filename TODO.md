# Project TODO

## Settings follow-up

- Implement the saved `dialogueMode` setting so auto progression advances story text only after its full reveal and always stops for choices, overlays, and unread clue confirmations.
- Implement the saved `textSpeed` setting in every DAY story renderer, including instant/fast/normal/slow reveal timings and accessibility-safe defaults.
- Connect the existing `autoDelay` value to the implemented auto progression timing after the two items above are complete.

### Current scope

The global settings dialog currently applies volume, text size, dialogue opacity, reduced effects, and screen mode immediately. Auto progression, text speed, and auto-delay are intentionally not exposed as active controls until the DAY renderers support them consistently.


### 0728 수정할 것
- [x] 장소 이동 버벅거리는 거 처럼 보여서 부드럽게 변경 - 효과 제한 시에만 생기는 문제였음
- [x]  호감도가 낮으면 영원히 호감도를 올리는 선택지를 선택할 수 없는 문제 - 전달완료
- [x] day2 미니게임 효과 수정
	- [x] 정답 효과, 오답 효과 애니메이션 다시 들어오게
	- [x] 마지막 처리내역에서 스크롤 없애고 요약해서 한번에 나오게?
	- [x] final score 기준 표 보여주기
	- [x] score 숫자 오른쪽 정렬로 바꾸기
	- [x] 콤보 효과 더 주기
- [x] day4 스토리 오전 확정
- [x] day3 시작 시 메신저 기록 유지
- [ ] 단서 탭 topic 너무 나눌 필요 있을까? & day3 단서 개수 왤케 많지? 5개 이하로 했을텐데.. 보기 쉽게 개선
- [x] 스프라이트 확인해보기(호감도 조정된 개발자모드 일시적으로 사용)
- [ ] 메신저인데 보내는 메시지는 없고 받는 메시지만 있음.
	- [ ] 한도윤이 말하는 말풍선은 오른쪽에서 나오고 색상 다르게 하기
- [x] day3 미니게임이 몰래 서하린이랑 연락하는건데, 스토리상 의심한 뒤라면 뭔가 이상함. day2랑 day3 미니게임 순서 바꾸기?
#### 추후 수정
---
1. 호감도 수치 조정
2. 메신저에서도 호감도 혹은 추가 기능 넣기
3. 스프라이트 분기에서도 cg 존재여부를 알게하기
4. 오늘의 마무리 화면에 정보가 너무 많음. 솔직히 안볼 듯 