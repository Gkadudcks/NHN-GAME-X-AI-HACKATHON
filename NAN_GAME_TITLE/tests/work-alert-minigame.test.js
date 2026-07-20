const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ACTIONS,
  REQUESTS,
  SUBTASK_REQUESTS,
  createSeededRandom,
  buildSchedule,
  evaluateAction,
  missedResult,
  gradeForPerformance,
  finalizeResults,
} = require("../js/work-alert-minigame.js");

test("빠른 행동 여섯 종류와 사람/그룹 발신자만 제공한다", () => {
  assert.deepEqual(ACTIONS.map((action) => action.key), ["reply", "file", "calendar", "delegate", "later", "spam"]);
  assert.equal(REQUESTS.every((request) => request.sender && !request.sender.includes("단서")), true);
  assert.equal(REQUESTS.some((request) => request.sender === "서하린"), true);
  assert.equal(REQUESTS.some((request) => request.sender.endsWith("방")), true);
});

test("같은 시드는 같은 시간과 위치의 요청 스케줄을 만든다", () => {
  const first = buildSchedule({ random: createSeededRandom(2402), count: 16, duration: 45 });
  const second = buildSchedule({ random: createSeededRandom(2402), count: 16, duration: 45 });
  assert.deepEqual(first, second);
  assert.equal(first.length, 16);
  assert.equal(first.every((request) => request.x >= 4 && request.x <= 70 && request.y >= 5 && request.y <= 62), true);
  assert.equal(first.every((request) => request.spawnAt >= 0 && request.spawnAt < 45000), true);
  assert.equal(first.at(-1).spawnAt >= 40000, true);
});

test("선택한 하위 업무의 요청 세 개를 미니게임 풀에 주입할 수 있다", () => {
  const requests = [...REQUESTS.slice(0, 13), ...SUBTASK_REQUESTS.journey];
  const schedule = buildSchedule({ requests, random: createSeededRandom(2), count: requests.length, duration: 45 });
  assert.equal(schedule.length, 16);
  assert.equal(schedule.filter((request) => request.id.startsWith("subtask-journey-")).length, 3);
  assert.equal(Object.values(SUBTASK_REQUESTS).every((items) => items.length === 3), true);
});

test("올바른 행동은 보상하고 잘못된 행동과 긴급 누락은 감점한다", () => {
  const request = REQUESTS.find((item) => item.id === "boss-meeting");
  assert.deepEqual(evaluateAction(request, "calendar", 1), { outcome: "correct", points: 17 });
  assert.deepEqual(evaluateAction(request, "reply", 1), { outcome: "wrong", points: -8 });
  assert.deepEqual(missedResult(request), { outcome: "missed", points: -10 });
});

test("정확도와 긴급 요청 누락을 함께 반영해 등급을 정한다", () => {
  const perfect = Array.from({ length: 10 }, (_, index) => ({ outcome: "correct", critical: index < 2 }));
  const good = [...perfect.slice(0, 6), { outcome: "missed", critical: true }, { outcome: "wrong", critical: false }];
  const messy = [...perfect.slice(0, 3), ...Array.from({ length: 7 }, () => ({ outcome: "missed", critical: false }))];
  assert.deepEqual(gradeForPerformance(perfect), { grade: "perfect", workDelta: 2 });
  assert.deepEqual(gradeForPerformance(good), { grade: "good", workDelta: 1 });
  assert.deepEqual(gradeForPerformance(messy), { grade: "messy", workDelta: -1 });
});

test("완료 결과에 하린 처리 여부, 긴급 누락, 요청별 기록을 포함한다", () => {
  const results = [
    { id: "harin-layout", sender: "서하린", outcome: "correct", points: 14, critical: true, harin: true },
    { id: "boss-meeting", sender: "박태식 부장", outcome: "missed", points: -10, critical: true, harin: false },
  ];
  const final = finalizeResults(results);
  assert.equal(final.score, 4);
  assert.equal(final.harinHandled, true);
  assert.deepEqual(final.missedCritical, ["boss-meeting"]);
  assert.notEqual(final.results, results);
  assert.deepEqual(final.results, results);
});
