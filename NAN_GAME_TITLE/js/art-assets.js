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
    "background.presentation_room.day": "../assets/art/backgrounds/approved/presentation_room_day_v001.png",
    "background.office.day": "../assets/art/backgrounds/approved/office_day_v001.png",
    "background.office.secret_chat": "assets/backgrounds/office-secret-chat-pixel.png",
    "background.office.evening": "../assets/art/backgrounds/approved/office_evening_v001.png",
    "background.office.night": "../assets/art/backgrounds/approved/office_night_v001.png",
    "background.recording_booth.day": "../assets/art/backgrounds/approved/recording_booth_day_v001.png",
    "background.qa_test_space.incident": "../assets/art/backgrounds/approved/qa_test_space_incident_v001.png",
    "background.restaurant.lunch": "../assets/art/backgrounds/approved/restaurant_lunch_v001.png",
    "background.bistro.evening": "../assets/art/backgrounds/approved/bistro_evening_v001.png",
    "background.subway.morning": "../assets/art/backgrounds/approved/subway_morning_v003.png",
    "character.boss.holding_cup.concerned": "../assets/art/characters/boss/approved/boss_holding_cup_concerned_v002.png",
    "character.harin.arms_folded.concerned": "../assets/art/characters/harin/approved/harin_arms_folded_concerned_v001.png",
    "character.harin.hand_to_chest.surprised": "../assets/art/characters/harin/approved/harin_hand_to_chest_surprised_v003.png",
    "character.harin.holding_cup.tired": "../assets/art/characters/harin/approved/harin_holding_cup_tired_v001.png",
    "character.harin.relaxed_standing.gentle_smile": "../assets/art/characters/harin/approved/harin_relaxed_standing_gentle_smile_v002.png",
    "character.harin.relaxed_standing.embarrassed": "../assets/art/characters/harin/approved/harin_relaxed_standing_embarrassed_v002.png",
    "character.harin.relaxed_standing.neutral": "../assets/art/characters/harin/approved/harin_relaxed_standing_neutral_v002.png",
    "character.minjae.relaxed_standing.gentle_smile": "../assets/art/characters/minjae/approved/minjae_relaxed_standing_gentle_smile_v002.png",
    "character.sea.neutral_standing.gentle_smile": "../assets/art/characters/sea/approved/sea_neutral_standing_gentle_smile_v002.png",
    "event_cg.day3.elevator_waiting": "../assets/art/event_cg/approved/cg_day3_elevator_waiting_v001.png",
    "event_cg.day4.harin_headphone_handoff": "../assets/art/event_cg/approved/cg_day4_harin_headphone_handoff_v001.png",
    "event_cg.day5.colleague_departure": "../assets/art/event_cg/approved/cg_day5_colleague_departure_v001.png",
    "event_cg.day5.lone_departure": "../assets/art/event_cg/approved/cg_day5_lone_departure_v001.png",
    "event_cg.day5.weekend_invitation": "../assets/art/event_cg/approved/cg_day5_weekend_invitation_v001.png",
    "prop.day5.warm_tea": "../assets/art/props/approved/prop_day5_warm_tea_v001.png",
  });

  // Editable, code-owned SVG sources for the DAY 2 secret-chat minigame.
  // These are intentionally separate from approved generated-art manifest entries.
  const RUNTIME_SCENE = Object.freeze({
    "minigame.day2_secret_chat.map.office": "minigames/day2-secret-chat/assets/scene/office-map.svg",
    "minigame.day2_secret_chat.character.boss.back": "minigames/day2-secret-chat/assets/characters/boss-back.svg",
    "minigame.day2_secret_chat.character.boss.front": "minigames/day2-secret-chat/assets/characters/boss-front.svg",
    "minigame.day2_secret_chat.character.doyun.idle": "minigames/day2-secret-chat/assets/characters/doyun-idle.svg",
    "minigame.day2_secret_chat.character.harin.idle": "minigames/day2-secret-chat/assets/characters/harin-idle.svg",
    "minigame.day2_secret_chat.character.minjae.idle": "minigames/day2-secret-chat/assets/characters/minjae-idle.svg",
  });

  function resolve(id) {
    if (Object.prototype.hasOwnProperty.call(ACTIVE, id)) return ACTIVE[id];
    if (Object.prototype.hasOwnProperty.call(RUNTIME_SCENE, id)) return RUNTIME_SCENE[id];
    throw new Error(`Unknown art asset id: ${id}`);
  }

  return Object.freeze({ ACTIVE, RUNTIME_SCENE, resolve });
});
