(function exposeOfficeEscapeArtAssets(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OfficeEscapeArtAssets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOfficeEscapeArtAssets() {
  "use strict";

  // Standalone DAY 4 minigame map. Keep aligned with the active versions in
  // assets/art/manifests/art-assets.json.
  const ACTIVE = Object.freeze({
    "minigame_background.office_escape.office": "../assets/art/minigames/day4-office-escape/backgrounds/approved/mg_office_escape_office_v001.png",
    "minigame_background.office_escape.corridor": "../assets/art/minigames/day4-office-escape/backgrounds/approved/mg_office_escape_corridor_v001.png",
    "minigame_background.office_escape.elevator": "../assets/art/minigames/day4-office-escape/backgrounds/approved/mg_office_escape_elevator_v001.png",
    "minigame_character.boss.call.right": "../assets/art/minigames/day4-office-escape/characters/boss/approved/mg_boss_call_right_v001.png",
    "minigame_character.boss.chase.right": "../assets/art/minigames/day4-office-escape/characters/boss/approved/mg_boss_chase_right_v002.png",
    "minigame_character.boss.chase_alt.right": "../assets/art/minigames/day4-office-escape/characters/boss/approved/mg_boss_chase_alt_right_v003.png",
    "minigame_character.doyun.jump.right": "../assets/art/minigames/day4-office-escape/characters/doyun/approved/mg_doyun_jump_right_v001.png",
    "minigame_character.doyun.run.right": "../assets/art/minigames/day4-office-escape/characters/doyun/approved/mg_doyun_run_right_v003.png",
    "minigame_character.doyun.run_alt.right": "../assets/art/minigames/day4-office-escape/characters/doyun/approved/mg_doyun_run_alt_right_v003.png",
    "minigame_character.doyun.slide.right": "../assets/art/minigames/day4-office-escape/characters/doyun/approved/mg_doyun_slide_right_v001.png",
    "minigame_character.harin.assist.right": "../assets/art/minigames/day4-office-escape/characters/harin/approved/mg_harin_assist_right_v001.png",
    "minigame_character.harin.run.right": "../assets/art/minigames/day4-office-escape/characters/harin/approved/mg_harin_run_right_v002.png",
    "minigame_character.harin.run_alt.right": "../assets/art/minigames/day4-office-escape/characters/harin/approved/mg_harin_run_alt_right_v003.png",
    "prop.office.access_card": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_access_card_v002.png",
    "prop.office.backup_usb": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_backup_usb_v002.png",
    "prop.office.cable": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_cable_v002.png",
    "prop.office.cart": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_cart_v002.png",
    "prop.office.chair": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_chair_v002.png",
    "prop.office.drawer": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_drawer_v002.png",
    "prop.office.papers": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_papers_v002.png",
    "prop.office.phone": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_phone_v002.png",
    "prop.office.sign": "../assets/art/minigames/day4-office-escape/props/approved/prop_office_sign_v002.png",
  });

  function resolve(id) {
    if (!Object.prototype.hasOwnProperty.call(ACTIVE, id)) throw new Error(`Unknown office escape asset id: ${id}`);
    return ACTIVE[id];
  }

  return Object.freeze({ ACTIVE, resolve });
});
