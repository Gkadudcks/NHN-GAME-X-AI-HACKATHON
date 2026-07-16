# AI 이미지 에셋 파이프라인

## 적용 전제

현재 저장소에는 게임 엔진과 시나리오 데이터 형식이 아직 없습니다. 따라서 이 파이프라인은 엔진 중립 JSON을 원본(source of truth)으로 사용합니다. 엔진이 도입되면 빌드 단계에서 `assets/art/manifests/art-assets.json`을 읽거나 엔진 전용 리소스로 변환하되, 안정 ID와 버전 규칙은 유지합니다.

## 디렉터리 역할

```text
assets/art/
  characters/<character_id>/{references,drafts,review,approved,archive}/
  backgrounds/{references,drafts,review,approved,archive}/
  event_cg/{references,drafts,review,approved,archive}/
  prompts/{templates,rendered}/
  generation_logs/
  manifests/
```

- `references`: 승인된 마스터 이미지와 외부 참조. 생성 결과물이 아님.
- `drafts`: 생성 직후 원본 또는 작업 중 결과.
- `review`: 규격 보정이 끝나 검수 대기 중인 후보.
- `approved`: 게임에서 사용 가능한 불변 파일.
- `archive`: 더 이상 활성은 아니지만 재현성과 이력 때문에 보존하는 버전.
- `prompts/rendered`: 실제 생성에 투입한 완성 프롬프트. 템플릿만 기록하지 말고 렌더링 결과도 저장한다.

## 작업 순서

1. **재사용 확인**: manifest에서 같은 캐릭터의 몸통·pose·expression 또는 같은 장소의 시간대 변형이 이미 있는지 확인한다.
2. **계획 등록**: 안정 ID와 `planned` 버전을 manifest에 먼저 등록한다. ID는 파일 버전과 무관하다.
3. **프롬프트 조립**: 공통 스타일 + 대상 명세 + 장면 변경분 + 출력 조건 + 네거티브 스타일 순서로 조립한다.
4. **생성 기록**: 실행마다 generation log 한 줄을 추가한다. 모델/버전, 프롬프트 버전, 참조 파일과 강도, seed, 해상도, 설정을 빠뜨리지 않는다.
5. **소량 생성**: 한 번에 3~4개 후보만 만들고 얼굴·헤어·체형·의상 드리프트를 먼저 확인한다.
6. **규격화**: 정해진 캔버스, 눈/발 기준선, 알파 채널, 색공간과 파일명으로 보정한다.
7. **검수 이동**: 후보를 `review/`에 두고 manifest 버전을 `review`로 바꾼 뒤 체크리스트를 수행한다.
8. **승인**: 통과 파일을 `approved/`에 새 파일명으로 복사하고, 상태를 `approved`, `active_version`을 해당 버전으로 바꾼다. 리뷰 담당자와 시각을 기록한다.
9. **검증**: 저장소 루트에서 `python scripts/validate_art_assets.py`를 실행한다.

## 상태와 버전

`planned -> draft -> review -> approved -> retired` 순서를 사용합니다. `approved` 파일은 수정하거나 같은 이름으로 교체하지 않습니다. 수정이 필요하면 다음 `vNNN`을 만들고 승인 후 `active_version`만 이동합니다. 이전 버전은 `archive/`로 옮기고 `retired`로 기록합니다.

게임/시나리오는 다음처럼 파일 경로가 아닌 안정 ID를 저장합니다.

```json
{
  "sprite_id": "character.seoyeon.neutral_standing.neutral",
  "position": "center"
}
```

런타임은 `active_version`을 따라 실제 경로를 해석합니다. `active_version: null`인 계획 에셋은 빌드 또는 실행에 사용할 수 없습니다.

## 완료 조건

- 체크리스트 승인 완료
- generation log와 manifest가 서로 연결됨
- 승인 파일을 덮어쓰지 않음
- 검사 스크립트 오류 0건
- 새 pose/expression/background가 실제로 필요한 이유가 검토 기록에 남음

