(function exposeSettingsStore(root, factory) {
  const store = factory();
  if (typeof module === "object" && module.exports) module.exports = store;
  if (root) root.GameSettings = store;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSettingsStore() {
  const STORAGE_KEY = "nan-game-settings-v1";
  const DEFAULTS = Object.freeze({
    masterVolume: 80,
    bgmVolume: 70,
    sfxVolume: 80,
    masterMuted: false,
    bgmMuted: false,
    sfxMuted: false,
    screenMode: "windowed",
    reduceEffects: false,
    dialogueMode: "click",
    textSpeed: "normal",
    autoDelay: 1.5,
    textSize: 100,
    dialogueOpacity: 90,
    skipReadOnly: true,
  });

  const allowed = {
    screenMode: ["windowed", "fullscreen"],
    dialogueMode: ["click", "auto"],
    textSpeed: ["slow", "normal", "fast"],
  };

  function numberInRange(value, fallback, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }

  function sanitize(value) {
    const input = value && typeof value === "object" ? value : {};
    return {
      masterVolume: numberInRange(input.masterVolume, DEFAULTS.masterVolume, 0, 100),
      bgmVolume: numberInRange(input.bgmVolume, DEFAULTS.bgmVolume, 0, 100),
      sfxVolume: numberInRange(input.sfxVolume, DEFAULTS.sfxVolume, 0, 100),
      masterMuted: typeof input.masterMuted === "boolean" ? input.masterMuted : input.muted === true,
      bgmMuted: typeof input.bgmMuted === "boolean" ? input.bgmMuted : DEFAULTS.bgmMuted,
      sfxMuted: typeof input.sfxMuted === "boolean" ? input.sfxMuted : DEFAULTS.sfxMuted,
      screenMode: allowed.screenMode.includes(input.screenMode) ? input.screenMode : DEFAULTS.screenMode,
      reduceEffects: typeof input.reduceEffects === "boolean" ? input.reduceEffects : DEFAULTS.reduceEffects,
      dialogueMode: allowed.dialogueMode.includes(input.dialogueMode) ? input.dialogueMode : DEFAULTS.dialogueMode,
      textSpeed: input.textSpeed === "instant" ? "fast" : allowed.textSpeed.includes(input.textSpeed) ? input.textSpeed : DEFAULTS.textSpeed,
      autoDelay: numberInRange(input.autoDelay, DEFAULTS.autoDelay, 0.5, 5),
      textSize: numberInRange(input.textSize, DEFAULTS.textSize, 90, 130),
      dialogueOpacity: numberInRange(input.dialogueOpacity, DEFAULTS.dialogueOpacity, 0, 100),
      skipReadOnly: typeof input.skipReadOnly === "boolean" ? input.skipReadOnly : DEFAULTS.skipReadOnly,
    };
  }

  function load(storage) {
    try {
      return sanitize(JSON.parse(storage.getItem(STORAGE_KEY)));
    } catch (_error) {
      return sanitize();
    }
  }

  function save(storage, value) {
    const settings = sanitize(value);
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch (_error) {
      return false;
    }
  }

  return { STORAGE_KEY, DEFAULTS, sanitize, load, save };
});
