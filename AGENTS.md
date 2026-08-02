# Repository Instructions

## Platform scope

- 이 프로젝트의 모든 게임 화면은 PC 데스크톱 브라우저만 지원한다. 사용자가 별도로 요청하지 않는 한 모바일·터치·세로 화면 대응은 설계·구현·검증 범위에서 제외한다.

## Image asset work

- Read `docs/art/ART_PIPELINE.md` before adding or changing an image asset.
- Treat `docs/art/VISUAL_STYLE_GUIDE.md`, `docs/art/CHARACTER_GUIDE.md`, and `docs/art/BACKGROUND_GUIDE.md` as constraints, not suggestions.
- Keep character sprites, backgrounds, and event CGs separate. Reuse an approved body, expression, pose, or background before generating a new one.
- Never redesign an established face, hair, body type, outfit, or accessory unless the character specification is intentionally revised and reviewed.
- Use only pose, expression, position, and framing values declared in `assets/art/manifests/art-assets.json`.
- Reference art from game/scenario data by stable manifest `id`; never hard-code an image path.
- Record model name/version, prompt version, references, seed, resolution, settings, and generation time in `assets/art/generation_logs/`.
- Approved files are immutable. Add a higher `vNNN` file and update `active_version`; never overwrite an approved file.
- Follow `docs/art/ASSET_NAMING.md` and complete `docs/art/ASSET_REVIEW_CHECKLIST.md` before approval.
- Run `python scripts/validate_art_assets.py` after every manifest or image change. Do not approve an asset while validation fails.

## Code change reporting

- 코드 변경 작업을 완료한 응답의 맨 하단에는 이번 작업에서 실제로 변경한 내용을 5줄로 요약하여 출력한다.

## Implementation principles

- Don't reinvent the wheel: 구현 전에 관련 기존 모듈, 유틸리티, 컴포넌트, 데이터 모델, 테스트, 문서를 먼저 찾아 재사용한다.
- 기존 구조를 확장하여 해결할 수 있으면 별도의 병렬 구조, 중복 로직, 새 추상화 계층을 만들지 않는다.
- 새 구조가 반드시 필요할 때만 도입하며, 기존 구조로 해결할 수 없는 이유와 마이그레이션·호환성 영향을 작업 결과에 기록한다.

## Affection-gated choices

- 호감도에 따라 플레이어가 선택할 수 있는 대화 선택지가 달라지는 경우, 선택지를 숨기거나 렌더링 전에 필터링하지 않는다.
- 호감도 조건이 있는 선택지는 모든 단계의 항목을 항상 함께 노출한다.
- 현재 호감도가 조건보다 낮은 선택지는 비활성화하고, 잠금 아이콘·필요 호감도·현재 호감도를 가시적으로 표시한다.
- 조건을 충족한 선택지만 상호작용할 수 있게 하며, 잠긴 선택지는 마우스·키보드·보조기술에서 실행되지 않아야 한다.
- 호감도 기반 NPC 자동 반응이나 장면 분기는 별개로 유지할 수 있지만, 플레이어가 고르는 선택지를 호감도로 제한할 때는 반드시 위 방식을 사용한다.
