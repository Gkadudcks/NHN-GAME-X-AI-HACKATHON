# Repository Instructions

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

- 코드 변경 작업을 완료한 응답의 맨 하단에는 이번 작업에서 실제로 변경한 내용을 정확히 5줄로 요약하여 출력한다.

## Implementation principles

- Don't reinvent the wheel: 구현 전에 관련 기존 모듈, 유틸리티, 컴포넌트, 데이터 모델, 테스트, 문서를 먼저 찾아 재사용한다.
- 기존 구조를 확장하여 해결할 수 있으면 별도의 병렬 구조, 중복 로직, 새 추상화 계층을 만들지 않는다.
- 새 구조가 반드시 필요할 때만 도입하며, 기존 구조로 해결할 수 없는 이유와 마이그레이션·호환성 영향을 작업 결과에 기록한다.
