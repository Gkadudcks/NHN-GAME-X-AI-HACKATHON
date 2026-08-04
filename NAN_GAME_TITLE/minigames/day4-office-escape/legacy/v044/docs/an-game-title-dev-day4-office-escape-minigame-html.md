---
version: 1
slug: "nan-game-title-dev-day4-office-escape-minigame-html"
primary_target: "NAN_GAME_TITLE/dev/day4-office-escape-minigame.html"
related_targets: ["NAN_GAME_TITLE/js/office-escape-minigame.js", "NAN_GAME_TITLE/css/office-escape-minigame.css"]
---

Scope: DAY 4 `부장님 피해서 퇴근하기` development surface and its embedded DAY 4 runtime. Mode: Experience.

Audience and job: a first-time browser-game player must instantly understand that Doyun auto-runs toward the elevator and that only JUMP and SLIDE matter. The screen must make speed, route progress, safe clearance, Harin's support, and the boss's pursuit readable without prose.

Chosen direction: `17:58 엘리베이터 막차 러시`, rendered as Korean office emergency wayfinding × last-train platform × polished 2D arcade runner. Approved composition: `../../../assets/art/concepts/day4_comp_c_threshold_rhythm.png` (`구간 문턱 리듬`). The memorable moment is a physical office doorway passing the fixed player while the floor line changes from warning orange to exit green.

Must preserve: deterministic core/result contract, approved character identities and office art style, stable manifest IDs, keyboard/touch parity, Harin's affection-independent assist, pause/resume, and DAY 4 save integration.

Must not literalize from the comp: HUD text and controls remain semantic DOM rather than raster; the elevator does not stay visible for the whole course; desktop action hints remain corner-bound while mobile controls grow into full buttons; generated comp poses are not production assets; perspective decoration may never change collision geometry.

Implementation inventory:

| Visible ingredient | Medium | Commitment |
| --- | --- | --- |
| Compact top status, route, items, pause | semantic HTML/CSS/SVG glyphs | 56–64px, no dashboard cards, critical values at least 18px |
| Far office/skyline atmosphere | existing approved raster backdrops | zone crossfade plus distance-driven 0.15× movement |
| Glass/desk/door mid layer | existing DOM/CSS geometry and approved visual cues | 0.4× parallax, continuous through zone changes |
| Floor seams, guidance strip, ground shadow | CSS geometry | 1.0× movement, shared foot/collider baseline |
| Office door, corridor portal, elevator threshold | existing object-layer DOM | world-space landmarks physically pass Doyun |
| Doyun, Harin, boss actions | approved stable IDs plus review-only missing actions | one right-facing 3/4 family and bottom-center anchors |
| Hazards and pickups | existing approved prop stable IDs | common world projection, 0.8–1.0 arrival scale, grounded shadow |
| Telegraph, clearance line, impact spark | semantic DOM/CSS | attached to projected hazard/contact point, never fixed cards |
| Hitbox inspection | dev-only DOM overlay | core geometry is the sole source of truth |
| Action controls | semantic buttons | two at least 48px actions; readable corner hints on desktop and full-width mobile buttons |

Unresolved gate: six new action candidates may be used in development review only until explicit user approval promotes them to approved/active.
