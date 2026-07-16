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

