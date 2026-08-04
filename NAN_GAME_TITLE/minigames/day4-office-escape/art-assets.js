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
    "minigame_character.harin.run_alt.right": "minigames/day4-office-escape/assets/art/characters/harin/approved/mg_harin_run_alt_right_v003.png",
    "prop.office.access_card": "minigames/day4-office-escape/assets/art/props/approved/prop_office_access_card_v002.png",
    "prop.office.backup_usb": "minigames/day4-office-escape/assets/art/props/approved/prop_office_backup_usb_v002.png",
    "prop.office.cable": "minigames/day4-office-escape/assets/art/props/approved/prop_office_cable_v002.png",
    "prop.office.cart": "minigames/day4-office-escape/assets/art/props/approved/prop_office_cart_v002.png",
    "prop.office.chair": "minigames/day4-office-escape/assets/art/props/approved/prop_office_chair_v002.png",
    "prop.office.drawer": "minigames/day4-office-escape/assets/art/props/approved/prop_office_drawer_v002.png",
    "prop.office.papers": "minigames/day4-office-escape/assets/art/props/approved/prop_office_papers_v002.png",
    "prop.office.phone": "minigames/day4-office-escape/assets/art/props/approved/prop_office_phone_v002.png",
    "prop.office.sign": "minigames/day4-office-escape/assets/art/props/approved/prop_office_sign_v002.png",
  });

  // Alpha bounds are source-image facts, not layout guesses. Renderers use
  // them to align each pose on the same bottom-center baseline.
  const VISUAL_METRICS = Object.freeze({
    "minigame_character.doyun.run.right": Object.freeze({ alphaHeight: 1, alphaWidth: 386 / 512, bottomPadding: 0 }),
    "minigame_character.doyun.run_alt.right": Object.freeze({ alphaHeight: 494 / 512, alphaWidth: 361 / 512, bottomPadding: 18 / 512 }),
    "minigame_character.doyun.jump.right": Object.freeze({ alphaHeight: 480 / 512, alphaWidth: 365 / 512, bottomPadding: 0 }),
    "minigame_character.doyun.slide.right": Object.freeze({ alphaHeight: 198 / 512, alphaWidth: 480 / 512, bottomPadding: 0 }),
    "minigame_character.harin.run.right": Object.freeze({ alphaHeight: 1, alphaWidth: 354 / 512, bottomPadding: 0 }),
    "minigame_character.harin.run_alt.right": Object.freeze({ alphaHeight: 510 / 512, alphaWidth: 330 / 512, bottomPadding: 2 / 512 }),
    "minigame_character.boss.chase.right": Object.freeze({ alphaHeight: 511 / 512, alphaWidth: 436 / 512, bottomPadding: 1 / 512 }),
    "minigame_character.boss.chase_alt.right": Object.freeze({ alphaHeight: 1, alphaWidth: 402 / 512, bottomPadding: 0 }),
  });

  function resolve(id) {
    if (!Object.prototype.hasOwnProperty.call(ACTIVE, id)) throw new Error(`Unknown office escape asset id: ${id}`);
    return ACTIVE[id];
  }

  function metrics(id) {
    return VISUAL_METRICS[id] || Object.freeze({ alphaHeight: 1, alphaWidth: 1, bottomPadding: 0 });
  }

  return Object.freeze({ ACTIVE, VISUAL_METRICS, resolve, metrics });
});
