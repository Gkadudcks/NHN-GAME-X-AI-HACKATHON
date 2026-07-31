(function exposeArtAssets(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ArtAssets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createArtAssets() {
  "use strict";

  // file:// compatible runtime map. A test keeps this path aligned with the
  // active version in assets/art/manifests/art-assets.json.
  const ACTIVE = Object.freeze({
    "background.cafeteria.day": "../assets/art/backgrounds/approved/cafeteria_day_v001.png",
    "background.elevator_lobby.night": "../assets/art/backgrounds/approved/elevator_lobby_night_v001.png",
    "background.meeting_room.afternoon": "../assets/art/backgrounds/approved/meeting_room_afternoon_v001.png",
    "background.office.day": "../assets/art/backgrounds/approved/office_day_v001.png",
    "background.office.evening": "../assets/art/backgrounds/approved/office_evening_v001.png",
    "background.office.night": "../assets/art/backgrounds/approved/office_night_v001.png",
    "background.recording_booth.day": "../assets/art/backgrounds/approved/recording_booth_day_v001.png",
    "background.qa_test_space.incident": "../assets/art/backgrounds/approved/qa_test_space_incident_v001.png",
    "background.restaurant.lunch": "../assets/art/backgrounds/approved/restaurant_lunch_v001.png",
    "character.boss.holding_cup.concerned": "../assets/art/characters/boss/approved/boss_holding_cup_concerned_v002.png",
    "character.harin.arms_folded.concerned": "../assets/art/characters/harin/approved/harin_arms_folded_concerned_v001.png",
    "character.harin.hand_to_chest.surprised": "../assets/art/characters/harin/approved/harin_hand_to_chest_surprised_v003.png",
    "character.harin.holding_cup.tired": "../assets/art/characters/harin/approved/harin_holding_cup_tired_v001.png",
    "character.harin.relaxed_standing.gentle_smile": "../assets/art/characters/harin/approved/harin_relaxed_standing_gentle_smile_v002.png",
    "character.harin.relaxed_standing.embarrassed": "../assets/art/characters/harin/approved/harin_relaxed_standing_embarrassed_v002.png",
    "character.harin.relaxed_standing.neutral": "../assets/art/characters/harin/approved/harin_relaxed_standing_neutral_v002.png",
    "character.sea.neutral_standing.gentle_smile": "../assets/art/characters/sea/approved/sea_neutral_standing_gentle_smile_v002.png",
    "event_cg.day3.elevator_waiting": "../assets/art/event_cg/approved/cg_day3_elevator_waiting_v001.png",
    "event_cg.day4.harin_headphone_handoff": "../assets/art/event_cg/approved/cg_day4_harin_headphone_handoff_v001.png",
    "minigame_character.boss.call.right": "../assets/art/characters/boss/approved/mg_boss_call_right_v001.png",
    "minigame_character.boss.chase.right": "../assets/art/characters/boss/approved/mg_boss_chase_right_v001.png",
    "minigame_character.doyun.jump.right": "../assets/art/characters/doyun/approved/mg_doyun_jump_right_v001.png",
    "minigame_character.doyun.run.right": "../assets/art/characters/doyun/approved/mg_doyun_run_right_v002.png",
    "minigame_character.doyun.slide.right": "../assets/art/characters/doyun/approved/mg_doyun_slide_right_v001.png",
    "minigame_character.harin.assist.right": "../assets/art/characters/harin/approved/mg_harin_assist_right_v001.png",
    "minigame_character.harin.run.right": "../assets/art/characters/harin/approved/mg_harin_run_right_v001.png",
    "prop.office.access_card": "../assets/art/props/approved/prop_office_access_card_v002.png",
    "prop.office.backup_usb": "../assets/art/props/approved/prop_office_backup_usb_v002.png",
    "prop.office.cable": "../assets/art/props/approved/prop_office_cable_v002.png",
    "prop.office.cart": "../assets/art/props/approved/prop_office_cart_v002.png",
    "prop.office.chair": "../assets/art/props/approved/prop_office_chair_v002.png",
    "prop.office.drawer": "../assets/art/props/approved/prop_office_drawer_v002.png",
    "prop.office.papers": "../assets/art/props/approved/prop_office_papers_v002.png",
    "prop.office.phone": "../assets/art/props/approved/prop_office_phone_v002.png",
    "prop.office.sign": "../assets/art/props/approved/prop_office_sign_v002.png",
  });

  function resolve(id) {
    if (!Object.prototype.hasOwnProperty.call(ACTIVE, id)) throw new Error(`Unknown art asset id: ${id}`);
    return ACTIVE[id];
  }

  return Object.freeze({ ACTIVE, resolve });
});
