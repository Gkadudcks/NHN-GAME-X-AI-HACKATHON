(function exposeOfficeEscapeArtAssets(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OfficeEscapeArtAssets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOfficeEscapeArtAssets() {
  "use strict";

  // Standalone DAY 4 minigame map. Keep aligned with the active versions in
  // The global asset index remains at assets/art/manifests/art-assets.json.
  // All DAY 4-owned files stay below this feature directory.
  const ACTIVE = Object.freeze({
    "minigame_background.office_escape.office": "minigames/day4-office-escape/assets/art/backgrounds/approved/mg_office_escape_office_v001.png",
    "minigame_background.office_escape.corridor": "minigames/day4-office-escape/assets/art/backgrounds/approved/mg_office_escape_corridor_v001.png",
    "minigame_background.office_escape.elevator": "minigames/day4-office-escape/assets/art/backgrounds/approved/mg_office_escape_elevator_v001.png",
    "minigame_character.boss.call.right": "minigames/day4-office-escape/assets/art/characters/boss/approved/mg_boss_call_right_v001.png",
    "minigame_character.boss.chase.right": "minigames/day4-office-escape/assets/art/characters/boss/approved/mg_boss_chase_right_v002.png",
    "minigame_character.boss.chase_alt.right": "minigames/day4-office-escape/assets/art/characters/boss/approved/mg_boss_chase_alt_right_v003.png",
    "minigame_character.doyun.jump.right": "minigames/day4-office-escape/assets/art/characters/doyun/approved/mg_doyun_jump_right_v001.png",
    "minigame_character.doyun.run.right": "minigames/day4-office-escape/assets/art/characters/doyun/approved/mg_doyun_run_right_v003.png",
    "minigame_character.doyun.run_alt.right": "minigames/day4-office-escape/assets/art/characters/doyun/approved/mg_doyun_run_alt_right_v003.png",
    "minigame_character.doyun.slide.right": "minigames/day4-office-escape/assets/art/characters/doyun/approved/mg_doyun_slide_right_v001.png",
    "minigame_character.harin.assist.right": "minigames/day4-office-escape/assets/art/characters/harin/approved/mg_harin_assist_right_v001.png",
    "minigame_character.harin.run.right": "minigames/day4-office-escape/assets/art/characters/harin/approved/mg_harin_run_right_v002.png",
    "minigame_character.harin.run_alt.right": "minigames/day4-office-escape/assets/art/characters/harin/approved/mg_harin_run_right_v001.png",
    "minigame_character.harin.jump.right": "minigames/day4-office-escape/assets/art/characters/harin/approved/mg_harin_run_alt_right_v003.png",
    "minigame_character.harin.slide.right": "minigames/day4-office-escape/assets/art/characters/harin/approved/mg_harin_slide_right_v001.png",
    "prop.office.access_card": "minigames/day4-office-escape/assets/art/props/approved/prop_office_access_card_v002.png",
    "prop.office.backup_usb": "minigames/day4-office-escape/assets/art/props/approved/prop_office_backup_usb_v002.png",
    "prop.office.cable": "minigames/day4-office-escape/assets/art/props/approved/prop_office_cable_v002.png",
    "prop.office.cart": "minigames/day4-office-escape/assets/art/props/approved/prop_office_cart_v002.png",
    "prop.office.chair": "minigames/day4-office-escape/assets/art/props/approved/prop_office_chair_v002.png",
    "prop.office.drawer": "minigames/day4-office-escape/assets/art/props/approved/prop_office_drawer_v002.png",
    "prop.office.obstacle_break": "minigames/day4-office-escape/assets/art/props/approved/prop_office_obstacle_break_v001.png",
    "prop.office.papers": "minigames/day4-office-escape/assets/art/props/approved/prop_office_papers_v002.png",
    "prop.office.phone": "minigames/day4-office-escape/assets/art/props/approved/prop_office_phone_v002.png",
    "prop.office.sign": "minigames/day4-office-escape/assets/art/props/approved/prop_office_sign_v002.png",
  });

  const bounds = (left, top, width, height) => Object.freeze({ left, top, width, height });
  const point = (x, y) => Object.freeze({ x, y });
  const actorMetric = ({ alpha, footX, canonicalOpaqueHeight, body = alpha }) => Object.freeze({
    alphaBounds: alpha,
    bodyBounds: body,
    footAnchor: point(footX, alpha.top + alpha.height),
    alphaHeight: alpha.height,
    alphaWidth: alpha.width,
    bottomPadding: 1 - alpha.top - alpha.height,
    canonicalOpaqueHeight,
  });

  // Normalized source-image facts. canonicalOpaqueHeight is measured once at
  // 1440x900 and converted to world units; every actor then uses Core.scale.
  const VISUAL_METRICS = Object.freeze({
    "minigame_character.doyun.run.right": actorMetric({ alpha: bounds(63 / 512, 0, 386 / 512, 1), footX: 256 / 512, canonicalOpaqueHeight: 115.72 }),
    "minigame_character.doyun.run_alt.right": actorMetric({ alpha: bounds(57 / 512, 0, 361 / 512, 494 / 512), footX: 237.5 / 512, canonicalOpaqueHeight: 115.72 }),
    "minigame_character.doyun.jump.right": actorMetric({ alpha: bounds(73 / 512, 32 / 512, 365 / 512, 480 / 512), footX: 255.5 / 512, canonicalOpaqueHeight: 115.72 }),
    "minigame_character.doyun.slide.right": actorMetric({ alpha: bounds(16 / 512, 314 / 512, 480 / 512, 198 / 512), body: bounds(175 / 512, 350 / 512, 260 / 512, 162 / 512), footX: 256 / 512, canonicalOpaqueHeight: 63.54 }),
    "minigame_character.harin.run.right": actorMetric({ alpha: bounds(79 / 512, 0, 354 / 512, 1), footX: 256 / 512, canonicalOpaqueHeight: 111.07 }),
    "minigame_character.harin.run_alt.right": actorMetric({ alpha: bounds(79 / 512, 0, 354 / 512, 1), footX: 256 / 512, canonicalOpaqueHeight: 111.07 }),
    "minigame_character.harin.jump.right": actorMetric({ alpha: bounds(91 / 512, 2 / 512, 330 / 512, 510 / 512), footX: 256 / 512, canonicalOpaqueHeight: 111.07 }),
    "minigame_character.harin.slide.right": actorMetric({ alpha: bounds(.0518, .2637, .8535, .5801), footX: .0974, canonicalOpaqueHeight: 59.04 }),
    "minigame_character.harin.assist.right": actorMetric({ alpha: bounds(77 / 512, 22 / 512, 357 / 512, 478 / 512), footX: 255.5 / 512, canonicalOpaqueHeight: 111.07 }),
    "minigame_character.boss.chase.right": actorMetric({ alpha: bounds(38 / 512, 1 / 512, 436 / 512, 511 / 512), footX: 256 / 512, canonicalOpaqueHeight: 120.37 }),
    "minigame_character.boss.chase_alt.right": actorMetric({ alpha: bounds(55 / 512, 0, 402 / 512, 1), footX: 256 / 512, canonicalOpaqueHeight: 120.37 }),
    "minigame_character.boss.call.right": actorMetric({ alpha: bounds(111 / 512, 24 / 512, 289 / 512, 476 / 512), footX: 255.5 / 512, canonicalOpaqueHeight: 120.37 }),
  });

  function resolve(id) {
    if (!Object.prototype.hasOwnProperty.call(ACTIVE, id)) throw new Error(`Unknown office escape asset id: ${id}`);
    return ACTIVE[id];
  }

  function metrics(id) {
    return VISUAL_METRICS[id] || Object.freeze({ alphaBounds: bounds(0, 0, 1, 1), bodyBounds: bounds(0, 0, 1, 1), footAnchor: point(.5, 1), alphaHeight: 1, alphaWidth: 1, bottomPadding: 0, canonicalOpaqueHeight: 224 });
  }

  return Object.freeze({ ACTIVE, VISUAL_METRICS, resolve, metrics });
});
