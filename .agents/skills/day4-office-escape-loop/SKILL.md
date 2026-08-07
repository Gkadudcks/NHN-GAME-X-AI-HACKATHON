---
name: day4-office-escape-loop
description: Continue, tune, test, or review the NAN DAY 4 “부장님 피해서 퇴근하기” auto-run browser minigame. Use for its gameplay core, HUD, dev page, DAY 4 integration, playtest loop, sprite or prop assets, art manifest entries, and result contract.
---

# DAY 4 Office Escape Loop

## Start

1. Read `AGENTS.md`.
2. Read `NAN_GAME_TITLE/minigames/day4-office-escape/README.md` completely.
3. For image work, read every required file under `docs/art/` before touching assets.
4. Inspect the existing core, runtime, dev page, tests, and manifest entries before editing.

Treat the feature README as the durable source of truth after context compaction. Update it only when a product or implementation contract actually changes.

## Route the work

- Use `$game-ui-frontend` and `impeccable` for HUD, responsive layout, interaction states, and playfield protection.
- Use `imagegen` for new raster seed frames or props.
- Use `$sprite-pipeline` only after the corresponding seed frame is approved. Generate a whole strip, normalize a shared bottom-center anchor, render a preview, and inspect it in-engine.
- Use the in-app browser for desktop and mobile playtests.

If an installed skill references a missing helper, stop that asset step and report the missing dependency. Do not recreate an official helper from memory.

## Implement

- Preserve `OfficeEscapeMinigame.start({ onComplete })`, `pause()`, and `resume()`.
- Keep deterministic rules in `NAN_GAME_TITLE/minigames/day4-office-escape/core.js`; keep DOM, input, audio, and animation in `NAN_GAME_TITLE/minigames/day4-office-escape/index.js`.
- Preserve `grade` and `caught`; add result fields without breaking saved DAY 4 data.
- Reuse `ArtAssets.resolve(id)` and approved active versions. Never hard-code a production art path.
- Keep test overrides confined to the dev harness.
- Do not couple Harin's mechanical assist to affection.

## Asset gate

Follow `planned -> draft -> review -> approved`. Generate and log candidates, but never set `active_version` to a review asset. Require explicit user approval before promoting a newly generated visual candidate to `approved`.

## Verify every loop

Run the Core or DAY 4 integration tests that directly cover the changed contract, then playtest the affected path on a PC desktop viewport. Run the full suite only for final integration, and run art validation whenever an image or manifest changes. Do not call the loop complete while a required targeted validation is failing.
