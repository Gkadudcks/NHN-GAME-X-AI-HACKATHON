# 이미지 에셋 명명 규칙

## 공통 규칙

- 소문자 영문, 숫자, 밑줄만 사용합니다.
- 파일명 끝에는 반드시 `_vNNN` 3자리 버전을 둡니다.
- 공백, 한글, 대문자, 날짜, `final`, `new`, `latest`, 괄호를 쓰지 않습니다.
- 안정 manifest ID에는 파일 버전을 넣지 않습니다.
- 승인 파일은 이름과 내용을 변경하지 않고 다음 버전을 추가합니다.

## 파일 패턴

| 종류 | 패턴 | 예시 |
|---|---|---|
| 캐릭터 | `<character>_<pose>_<expression>_vNNN.png` | `seoyeon_neutral_standing_neutral_v001.png` |
| 배경 | `<location>_<variant>_vNNN.<ext>` | `office_day_v001.png` |
| 이벤트 CG | `cg_<scene>_<beat>_vNNN.<ext>` | `cg_seoyeon_reveal_v001.png` |
| 렌더링 프롬프트 | `<asset-file-stem>_prompt_vNNN.txt` | `seoyeon_neutral_standing_neutral_v001_prompt_v001.txt` |

## 안정 ID

- 캐릭터: `character.<character>.<pose>.<expression>`
- 배경: `background.<location>.<variant>`
- 이벤트 CG: `event_cg.<scene>.<beat>`

코드는 안정 ID만 참조합니다. 실제 파일 경로는 manifest의 `active_version`으로 해석합니다. 버전은 `v001`부터 1씩 올리며, 번호를 재사용하거나 중간 버전을 덮어쓰지 않습니다.

