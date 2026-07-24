const test = require("node:test");
const assert = require("node:assert/strict");
const progressStore = require("../js/progress-store.js");

function createStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    value(key) {
      return values.get(key);
    },
  };
}

function legacySave(overrides = {}) {
  return {
    version: 3,
    sceneId: "eveningAdvice",
    work: 7,
    affection: 4,
    trust: 5,
    clues: ["첫 번째 단서", "두 번째 단서"],
    coffeeResult: { score: 242, grade: "perfect", correctDrinks: 3 },
    decisions: {
      nanaUse: "핵심 문장은 직접 작성하고 나나봇은 문장만 다듬게 한다.",
      eveningTrust: "선배가 같이 봐주시면 든든할 것 같아요.",
    },
    readMessage: true,
    seenNotifications: { "pt-first": true },
    summariesSeen: { 1: true },
    savedAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

test("DAY 1 v3 저장을 공유 진행 데이터로 옮기고 기존 키는 보존한다", () => {
  const rawLegacy = JSON.stringify(legacySave());
  const storage = createStorage({ [progressStore.LEGACY_DAY1_KEY]: rawLegacy });

  const progress = progressStore.load(storage);

  assert.equal(progress.shared.work, 7);
  assert.equal(progress.shared.affection, 4);
  assert.equal(progress.shared.trust, 5);
  assert.equal(progress.schemaVersion, 2);
  assert.deepEqual(progress.shared.clues.map((clue) => clue.detail), ["첫 번째 단서", "두 번째 단서"]);
  assert.ok(progress.shared.clues.every((clue) => clue.id && clue.day === 1));
  assert.equal(progress.shared.day1.nanaUse, "manual-core");
  assert.equal(progress.shared.day1.eveningTrust, "accept-help");
  assert.deepEqual(progress.shared.day1.coffeeResult, { score: 242, grade: "perfect", correctDrinks: 3 });
  assert.equal(progress.days[1].sceneId, "eveningAdvice");
  assert.equal(progress.days[1].readMessage, true);
  assert.equal(storage.value(progressStore.LEGACY_DAY1_KEY), rawLegacy);
  assert.ok(storage.value(progressStore.STORAGE_KEY));
});

test("손상된 현재 저장이나 잘못된 legacy 데이터는 안전한 기본값으로 복구한다", () => {
  const corruptedCurrent = createStorage({
    [progressStore.STORAGE_KEY]: "{broken",
    [progressStore.LEGACY_DAY1_KEY]: JSON.stringify(legacySave()),
  });
  const wrongLegacy = createStorage({
    [progressStore.LEGACY_DAY1_KEY]: JSON.stringify({ version: 2, work: 99 }),
  });

  assert.deepEqual(progressStore.load(corruptedCurrent), progressStore.defaultProgress());
  assert.deepEqual(progressStore.load(wrongLegacy), progressStore.defaultProgress());
});

test("기존 선택 문구와 안정적인 선택 ID를 동일한 값으로 정규화한다", () => {
  assert.equal(progressStore.normalizeNanaUse("조사 자료 전체를 나나봇으로 자동 요약한다."), "auto-summary");
  assert.equal(progressStore.normalizeNanaUse("manual-core"), "manual-core");
  assert.equal(progressStore.normalizeEveningTrust("회사에서도 이웃인 걸 모른 척해야 합니까?"), "neighbor-joke");
  assert.equal(progressStore.normalizeEveningTrust("제가 맡은 일이니 혼자 해보겠습니다."), "work-alone");
  assert.equal(progressStore.normalizeEveningTrust("알 수 없는 선택"), null);
});

test("DAY 2 재시작은 최초 진입 수치와 단서를 복원하고 DAY 2 진행만 비운다", () => {
  const storage = createStorage({
    [progressStore.LEGACY_DAY1_KEY]: JSON.stringify(legacySave()),
  });
  const started = progressStore.startDay2(storage);
  assert.equal(started.day2StartSnapshot.work, 7);
  assert.equal(started.day2StartSnapshot.affection, 4);
  assert.equal(started.day2StartSnapshot.trust, 5);
  assert.deepEqual(started.day2StartSnapshot.clues.map((clue) => clue.detail), ["첫 번째 단서", "두 번째 단서"]);

  started.shared.work = 11;
  started.shared.affection = 6;
  started.shared.trust = 8;
  started.shared.clues.push("DAY 2 단서");
  started.days[2] = {
    sceneId: "day2_overtime_response",
    decisions: { day2_subtask: "reviews" },
    seenNotifications: { build: true },
    summariesSeen: { 2: true },
    minigameResult: { score: 900 },
    complete: true,
  };
  progressStore.save(storage, started);

  const reset = progressStore.resetDay2(storage);
  assert.equal(reset.currentDay, 2);
  assert.equal(reset.shared.work, 7);
  assert.equal(reset.shared.affection, 4);
  assert.equal(reset.shared.trust, 5);
  assert.deepEqual(reset.shared.clues.map((clue) => clue.detail), ["첫 번째 단서", "두 번째 단서"]);
  assert.deepEqual(reset.shared.day1.coffeeResult, { score: 242, grade: "perfect", correctDrinks: 3 });
  assert.deepEqual(reset.days[2], progressStore.defaultProgress().days[2]);
});

test("DAY 상태 갱신은 다른 날짜와 공유 정보를 변경하지 않는다", () => {
  const storage = createStorage();
  progressStore.startNewGame(storage);
  const updated = progressStore.updateDayState(storage, 2, {
    sceneId: "day2_subtask",
    decisions: { day2_subtask: "competitors" },
  });

  assert.equal(updated.days[2].sceneId, "day2_subtask");
  assert.deepEqual(updated.days[2].decisions, { day2_subtask: "competitors" });
  assert.equal(updated.days[1].sceneId, "intro");
  assert.equal(updated.shared.work, 0);
});

test("canonical v1 문자열 단서를 v2 레코드로 승격하고 저장소에도 반영한다", () => {
  const legacyCanonical = progressStore.defaultProgress();
  legacyCanonical.schemaVersion = 1;
  legacyCanonical.shared.clues = [
    "박태식의 최초 지시: 유저 경험 중심·검증된 수치 사용",
    "DAY 3 변경 전후 문장 비교",
  ];
  const storage = createStorage({
    [progressStore.STORAGE_KEY]: JSON.stringify(legacyCanonical),
  });

  const migrated = progressStore.load(storage);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.shared.clues[0].id, "d1_boss_first_directive");
  assert.equal(migrated.shared.clues[1].day, 3);
  assert.equal(JSON.parse(storage.value(progressStore.STORAGE_KEY)).schemaVersion, 2);
});

test("구조화 단서는 저장·로드 왕복에서 모든 필드를 보존한다", () => {
  const storage = createStorage();
  const progress = progressStore.defaultProgress();
  progress.shared.clues = [{
    id: "d4_audit_link",
    day: 4,
    theme: "감사 로그",
    title: "변경자 연결",
    detail: "두 로그의 타임스탬프가 일치한다.",
  }];
  progressStore.save(storage, progress);

  assert.deepEqual(progressStore.load(storage).shared.clues, progress.shared.clues);
});

test("DAY 3 시작과 재시작은 DAY 2 완료 상태와 시작 스냅샷을 보존한다", () => {
  const storage = createStorage();
  const progress = progressStore.startNewGame(storage);
  progress.shared.work = 5;
  progress.shared.trust = 3;
  progress.shared.clues = [{
    id: "d2_cloud_restore_point",
    day: 2,
    theme: "검증 기록",
    title: "DAY 2 검증 완료 기록",
    detail: "정상 복원 지점",
  }];
  progressStore.save(storage, progress);

  const started = progressStore.startDay3(storage);
  assert.equal(started.currentDay, 3);
  assert.equal(started.days[2].complete, true);
  assert.equal(started.day3StartSnapshot.work, 5);

  started.shared.work = 99;
  started.days[3].sceneId = "day3Decision";
  progressStore.save(storage, started);
  const reset = progressStore.resetDay3(storage);
  assert.equal(reset.shared.work, 5);
  assert.equal(reset.days[3].sceneId, "day3IntroCard");
  assert.equal(reset.shared.clues[0].id, "d2_cloud_restore_point");
});
