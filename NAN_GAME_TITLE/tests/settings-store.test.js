const test = require("node:test");
const assert = require("node:assert/strict");
const settingsStore = require("../js/settings-store.js");

function createStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => { value = nextValue; },
    value: () => value,
  };
}

test("빈 저장소에서는 기본 설정을 불러온다", () => {
  assert.deepEqual(settingsStore.load(createStorage()), settingsStore.DEFAULTS);
});

test("손상되거나 범위를 벗어난 값은 안전한 값으로 정규화한다", () => {
  const result = settingsStore.sanitize({
    masterVolume: 999,
    bgmVolume: -10,
    dialogueMode: "invalid",
    textSpeed: "instant",
    autoDelay: "3",
  });
  assert.equal(result.masterVolume, 100);
  assert.equal(result.bgmVolume, 0);
  assert.equal(result.dialogueMode, "click");
  assert.equal(result.textSpeed, "fast");
  assert.equal(result.autoDelay, 3);
});

test("설정은 저장 후 동일하게 복원된다", () => {
  const storage = createStorage();
  const expected = settingsStore.sanitize({ ...settingsStore.DEFAULTS, bgmMuted: true, textSize: 120 });
  assert.equal(settingsStore.save(storage, expected), true);
  assert.deepEqual(settingsStore.load(storage), expected);
});

test("이전 전체 음소거와 즉시 출력 설정을 새 구조로 옮긴다", () => {
  const result = settingsStore.sanitize({ muted: true, textSpeed: "instant", dialogueOpacity: 0 });
  assert.equal(result.masterMuted, true);
  assert.equal(result.bgmMuted, false);
  assert.equal(result.textSpeed, "fast");
  assert.equal(result.dialogueOpacity, 0);
});

test("저장소 접근이 실패해도 기본값으로 복구한다", () => {
  const brokenStorage = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
  };
  assert.deepEqual(settingsStore.load(brokenStorage), settingsStore.DEFAULTS);
  assert.equal(settingsStore.save(brokenStorage, {}), false);
});
