(function exposeArtAssets(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ArtAssets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createArtAssets() {
  "use strict";

  // file:// compatible runtime map. A test keeps this path aligned with the
  // active version in assets/art/manifests/art-assets.json.
  const ACTIVE = Object.freeze({
    "character.harin.holding_cup.tired": "../assets/art/characters/harin/approved/harin_holding_cup_tired_v001.png",
    "character.sea.neutral_standing.gentle_smile": "../assets/art/characters/sea/approved/sea_neutral_standing_gentle_smile_v001.png",
  });

  function resolve(id) {
    if (!Object.prototype.hasOwnProperty.call(ACTIVE, id)) throw new Error(`Unknown art asset id: ${id}`);
    return ACTIVE[id];
  }

  return Object.freeze({ ACTIVE, resolve });
});
