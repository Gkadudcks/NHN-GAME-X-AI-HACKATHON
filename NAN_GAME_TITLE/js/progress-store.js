(function exposeProgressStore(root, factory) {
  const store = factory();
  if (typeof module === "object" && module.exports) module.exports = store;
  if (root) root.GameProgress = store;
})(typeof globalThis !== "undefined" ? globalThis : this, function createProgressStore() {
  "use strict";

  const STORAGE_KEY = "nan-game-progress-v1";
  const LEGACY_DAY1_KEY = "nan-day1-save";
  const SCHEMA_VERSION = 1;

  const NANA_USE_ALIASES = Object.freeze({
    "manual-core": "manual-core",
    "핵심 문장은 직접 작성하고 나나봇은 문장만 다듬게 한다.": "manual-core",
    "핵심 문장은 직접 작성하고 나나봇은 문장만 다듬게 한다": "manual-core",
    "auto-summary": "auto-summary",
    "조사 자료 전체를 나나봇으로 자동 요약한다.": "auto-summary",
    "조사 자료 전체를 나나봇으로 자동 요약한다": "auto-summary",
  });

  const EVENING_TRUST_ALIASES = Object.freeze({
    "accept-help": "accept-help",
    "선배가 같이 봐주시면 든든할 것 같아요.": "accept-help",
    "선배가 같이 봐주시면 든든할 것 같아요": "accept-help",
    "prove-self": "prove-self",
    "이번에는 제 실력으로 인정받고 싶었습니다.": "prove-self",
    "이번에는 제 실력으로 인정받고 싶었습니다": "prove-self",
    "제 실력으로 인정받고 싶었습니다": "prove-self",
    "neighbor-joke": "neighbor-joke",
    "회사에서도 이웃인 걸 모른 척해야 합니까?": "neighbor-joke",
    "회사에서도 이웃인 걸 모른 척해야 합니까": "neighbor-joke",
    "work-alone": "work-alone",
    "제가 맡은 일이니 혼자 해보겠습니다.": "work-alone",
    "제가 맡은 일이니 혼자 해보겠습니다": "work-alone",
  });

  function own(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function finiteNumber(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  function stringOr(value, fallback) {
    return typeof value === "string" && value ? value : fallback;
  }

  function cloneJson(value, fallback = null) {
    if (value === undefined) return fallback;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_error) {
      return fallback;
    }
  }

  function stringList(value) {
    return Array.isArray(value) ? value.filter((entry) => typeof entry === "string").slice() : [];
  }

  function objectCopy(value) {
    return isObject(value) ? cloneJson(value, {}) : {};
  }

  function normalizeNanaUse(value) {
    return typeof value === "string" ? NANA_USE_ALIASES[value.trim()] || null : null;
  }

  function normalizeEveningTrust(value) {
    return typeof value === "string" ? EVENING_TRUST_ALIASES[value.trim()] || null : null;
  }

  function defaultDay1() {
    return {
      sceneId: "intro",
      decisions: {},
      readMessage: false,
      seenNotifications: {},
      summariesSeen: {},
      complete: false,
    };
  }

  function defaultDay2() {
    return {
      sceneId: "day2IntroCard",
      decisions: {},
      seenNotifications: {},
      summariesSeen: {},
      minigameResult: null,
      complete: false,
    };
  }

  function defaultProgress() {
    return {
      schemaVersion: SCHEMA_VERSION,
      currentDay: 1,
      shared: {
        work: 0,
        affection: 0,
        trust: 0,
        clues: [],
        day1: {
          nanaUse: null,
          eveningTrust: null,
          coffeeResult: null,
        },
      },
      days: {
        1: defaultDay1(),
        2: defaultDay2(),
      },
      day2StartSnapshot: null,
      savedAt: null,
    };
  }

  function sanitizeDay1(value) {
    const input = isObject(value) ? value : {};
    return {
      sceneId: stringOr(input.sceneId, "intro"),
      decisions: objectCopy(input.decisions),
      readMessage: input.readMessage === true,
      seenNotifications: objectCopy(input.seenNotifications),
      summariesSeen: objectCopy(input.summariesSeen),
      complete: input.complete === true,
    };
  }

  function sanitizeDay2(value) {
    const input = isObject(value) ? value : {};
    return {
      sceneId: stringOr(input.sceneId, "day2_intro"),
      decisions: objectCopy(input.decisions),
      seenNotifications: objectCopy(input.seenNotifications),
      summariesSeen: objectCopy(input.summariesSeen),
      minigameResult: isObject(input.minigameResult) ? cloneJson(input.minigameResult) : null,
      complete: input.complete === true,
    };
  }

  function sanitizeSnapshot(value) {
    if (!isObject(value)) return null;
    return {
      work: finiteNumber(value.work),
      affection: finiteNumber(value.affection),
      trust: finiteNumber(value.trust),
      clues: stringList(value.clues),
    };
  }

  function sanitize(value) {
    const input = isObject(value) ? value : {};
    const shared = isObject(input.shared) ? input.shared : {};
    const day1Carry = isObject(shared.day1) ? shared.day1 : {};
    const days = isObject(input.days) ? input.days : {};
    return {
      schemaVersion: SCHEMA_VERSION,
      currentDay: input.currentDay === 2 ? 2 : 1,
      shared: {
        work: finiteNumber(shared.work),
        affection: finiteNumber(shared.affection),
        trust: finiteNumber(shared.trust),
        clues: stringList(shared.clues),
        day1: {
          nanaUse: normalizeNanaUse(day1Carry.nanaUse),
          eveningTrust: normalizeEveningTrust(day1Carry.eveningTrust),
          coffeeResult: isObject(day1Carry.coffeeResult) ? cloneJson(day1Carry.coffeeResult) : null,
        },
      },
      days: {
        1: sanitizeDay1(days[1]),
        2: sanitizeDay2(days[2]),
      },
      day2StartSnapshot: sanitizeSnapshot(input.day2StartSnapshot),
      savedAt: typeof input.savedAt === "string" ? input.savedAt : null,
    };
  }

  function snapshotShared(shared) {
    return {
      work: finiteNumber(shared.work),
      affection: finiteNumber(shared.affection),
      trust: finiteNumber(shared.trust),
      clues: stringList(shared.clues),
    };
  }

  function storageGet(storage, key) {
    try {
      return storage && typeof storage.getItem === "function" ? storage.getItem(key) : null;
    } catch (_error) {
      return null;
    }
  }

  function storageSet(storage, key, value) {
    try {
      if (!storage || typeof storage.setItem !== "function") return false;
      storage.setItem(key, value);
      return true;
    } catch (_error) {
      return false;
    }
  }

  function parseObject(raw) {
    if (typeof raw !== "string" || !raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return isObject(parsed) ? parsed : null;
    } catch (_error) {
      return null;
    }
  }

  function fromLegacyDay1(value) {
    if (!isObject(value) || value.version !== 3) return null;
    const decisions = isObject(value.decisions) ? value.decisions : {};
    const progress = defaultProgress();
    progress.shared.work = finiteNumber(value.work);
    progress.shared.affection = finiteNumber(value.affection);
    progress.shared.trust = finiteNumber(value.trust);
    progress.shared.clues = stringList(value.clues);
    progress.shared.day1.nanaUse = normalizeNanaUse(decisions.nanaUse);
    progress.shared.day1.eveningTrust = normalizeEveningTrust(decisions.eveningTrust);
    progress.shared.day1.coffeeResult = isObject(value.coffeeResult) ? cloneJson(value.coffeeResult) : null;
    progress.days[1] = sanitizeDay1({
      sceneId: value.sceneId,
      decisions,
      readMessage: value.readMessage,
      seenNotifications: value.seenNotifications,
      summariesSeen: value.summariesSeen,
      complete: value.sceneId === "end",
    });
    progress.savedAt = typeof value.savedAt === "string" ? value.savedAt : null;
    return progress;
  }

  function migrateLegacy(storage) {
    if (storageGet(storage, STORAGE_KEY) !== null) return null;
    const legacy = parseObject(storageGet(storage, LEGACY_DAY1_KEY));
    const migrated = fromLegacyDay1(legacy);
    if (!migrated) return null;
    storageSet(storage, STORAGE_KEY, JSON.stringify(migrated));
    return sanitize(migrated);
  }

  function load(storage) {
    const canonicalRaw = storageGet(storage, STORAGE_KEY);
    if (canonicalRaw !== null) {
      const canonical = parseObject(canonicalRaw);
      return canonical && canonical.schemaVersion === SCHEMA_VERSION
        ? sanitize(canonical)
        : defaultProgress();
    }
    return migrateLegacy(storage) || defaultProgress();
  }

  function save(storage, value) {
    const progress = sanitize(value);
    progress.savedAt = new Date().toISOString();
    return storageSet(storage, STORAGE_KEY, JSON.stringify(progress));
  }

  function startNewGame(storage) {
    const progress = defaultProgress();
    save(storage, progress);
    return load(storage);
  }

  function startDay2(storage) {
    const progress = load(storage);
    progress.currentDay = 2;
    progress.days[1].complete = true;
    if (!progress.day2StartSnapshot) progress.day2StartSnapshot = snapshotShared(progress.shared);
    save(storage, progress);
    return load(storage);
  }

  function resetDay2(storage) {
    const progress = load(storage);
    const snapshot = progress.day2StartSnapshot || snapshotShared(progress.shared);
    progress.shared.work = snapshot.work;
    progress.shared.affection = snapshot.affection;
    progress.shared.trust = snapshot.trust;
    progress.shared.clues = stringList(snapshot.clues);
    progress.currentDay = 2;
    progress.days[1].complete = true;
    progress.days[2] = defaultDay2();
    progress.day2StartSnapshot = snapshotShared(snapshot);
    save(storage, progress);
    return load(storage);
  }

  function updateDayState(storage, day, patch) {
    const dayNumber = Number(day);
    if (dayNumber !== 1 && dayNumber !== 2) return load(storage);
    const progress = load(storage);
    const current = progress.days[dayNumber];
    const nextPatch = typeof patch === "function" ? patch(cloneJson(current, {})) : patch;
    if (!isObject(nextPatch)) return progress;
    const merged = { ...current, ...cloneJson(nextPatch, {}) };
    progress.days[dayNumber] = dayNumber === 1 ? sanitizeDay1(merged) : sanitizeDay2(merged);
    save(storage, progress);
    return load(storage);
  }

  return Object.freeze({
    STORAGE_KEY,
    LEGACY_DAY1_KEY,
    SCHEMA_VERSION,
    defaultProgress,
    sanitize,
    normalizeNanaUse,
    normalizeEveningTrust,
    migrateLegacy,
    load,
    save,
    startNewGame,
    startDay2,
    resetDay2,
    updateDayState,
  });
});
