const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  ACTIONS,
  REQUESTS,
  SUBTASK_REQUESTS,
  DAY2_PRESET,
  buildDay2Requests,
  buildDay2Options,
  createSeededRandom,
  formatClock,
  buildSchedule,
  priorityForRequest,
  boardPlacement,
  evaluateAction,
  missedResult,
  successFeedback,
  gradeForPerformance,
  finalizeResults,
} = require("../js/work-alert-minigame.js");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const source = fs.readFileSync(path.join(__dirname, "../js/work-alert-minigame.js"), "utf8");

test("DAY 2 정식 프리셋은 고정 시드·45초·6.5초 수명과 16개 요청을 사용한다", () => {
  const options = buildDay2Options({ subtask: "competitor" });
  const schedule = buildSchedule({
    random: createSeededRandom(options.seed),
    requests: options.requests,
    count: options.count,
    duration: options.duration,
    lifeMs: options.lifeMs,
  });

  assert.equal(DAY2_PRESET.seed, 20260720);
  assert.equal(Object.isFrozen(DAY2_PRESET), true);
  assert.equal(Object.isFrozen(DAY2_PRESET.commonRequests), true);
  assert.equal(options.duration, 45);
  assert.equal(options.lifeMs, 6500);
  assert.equal(options.count, 16);
  assert.equal(schedule.length, 16);
  assert.equal(schedule.every((request) => request.lifeMs === 6500), true);
  assert.deepEqual(schedule, buildSchedule({
    random: createSeededRandom(DAY2_PRESET.seed),
    requests: buildDay2Requests("competitor"),
    count: 16,
    duration: DAY2_PRESET.duration,
    lifeMs: DAY2_PRESET.lifeMs,
  }));
});

test("DAY 2 요청은 공통 13개와 선택한 하위 업무 3개를 조합하고 잘못된 업무는 competitor로 대체한다", () => {
  ["competitor", "reviews", "journey"].forEach((subtask) => {
    const requests = buildDay2Requests(subtask);
    assert.equal(requests.length, 16);
    assert.deepEqual(requests.slice(0, 13), REQUESTS.slice(0, 13));
    assert.deepEqual(requests.slice(13), SUBTASK_REQUESTS[subtask]);
  });
  assert.deepEqual(buildDay2Requests("unknown"), buildDay2Requests("competitor"));
});

test("DAY 2 dev override는 시드와 시간만 변경하고 정식 카드 수명·요청 수·점수 원본을 유지한다", () => {
  const onComplete = () => {};
  const options = buildDay2Options({
    subtask: "reviews",
    onComplete,
    testOverrides: { seed: 99, duration: 18, lifeMs: 30000, count: 2, requests: [] },
  });

  assert.equal(options.seed, 99);
  assert.equal(options.duration, 18);
  assert.equal(options.lifeMs, DAY2_PRESET.lifeMs);
  assert.equal(options.count, 16);
  assert.equal(options.onComplete, onComplete);
  assert.deepEqual(options.requests, buildDay2Requests("reviews"));
});

test("피드백 타이머는 재시작·완료 시 정리되고 오답 테두리는 영구히 남지 않는다", () => {
  assert.match(source, /wrongFeedbackTimer/);
  assert.match(source, /state\.wrongFeedbackTimer = global\.setTimeout\([\s\S]*?wrong-feedback[\s\S]*?450\)/);
  assert.match(source, /function clearFeedbackTimers\(\)[\s\S]*?clearTimeout\(state\.feedbackTimer\)[\s\S]*?clearTimeout\(state\.wrongFeedbackTimer\)[\s\S]*?wrong-feedback/);
  assert.match(source, /function finishGame\(\)[\s\S]*?clearFeedbackTimers\(\)/);
  assert.match(source, /function complete\(\)[\s\S]*?clearFeedbackTimers\(\)/);
  assert.match(source, /function start\(options = \{\}\)[\s\S]*?clearFeedbackTimers\(\)/);
});

test("빠른 행동 여섯 종류와 사람/그룹 발신자만 제공한다", () => {
  assert.deepEqual(ACTIONS.map((action) => action.key), ["reply", "file", "calendar", "delegate", "later", "spam"]);
  assert.deepEqual(ACTIONS.map((action) => action.shortLabel), ["답장하기", "파일 전달", "일정 등록", "담당자 전달", "나중에 답장", "스팸 차단"]);
  assert.equal(ACTIONS.every((action) => action.keyHint === undefined), true);
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

test("개발용 긴 제한 시간도 분과 초로 올바르게 표시한다", () => {
  assert.equal(formatClock(45), "00:45");
  assert.equal(formatClock(120), "02:00");
  assert.equal(formatClock(71), "01:11");
});

test("같은 우선순위의 카드 세 장은 서로 다른 고정 슬롯에 배치된다", () => {
  const requests = REQUESTS.filter((request) => priorityForRequest(request) === "normal").slice(0, 3);
  const placed = [];
  requests.forEach((request) => placed.push({ ...request, ...boardPlacement(request, placed) }));
  assert.equal(new Set(placed.map((request) => request.boardX)).size, 3);
  assert.equal(new Set(placed.map((request) => request.boardY)).size, 1);
  assert.equal(placed.every((request) => request.lane === "normal"), true);
});

test("올바른 행동은 보상하고 잘못된 행동과 긴급 누락은 감점한다", () => {
  const urgent = REQUESTS.find((item) => item.id === "boss-meeting");
  const normal = REQUESTS.find((item) => item.id === "planning-copy");
  const leisure = REQUESTS.find((item) => item.id === "minjae-lunch");
  assert.equal(priorityForRequest(urgent), "urgent");
  assert.equal(priorityForRequest(normal), "normal");
  assert.equal(priorityForRequest(leisure), "leisure");
  assert.deepEqual(evaluateAction(urgent, "calendar"), { outcome: "correct", points: 7 });
  assert.deepEqual(evaluateAction(normal, "file"), { outcome: "correct", points: 5 });
  assert.deepEqual(evaluateAction(leisure, "later"), { outcome: "correct", points: 3 });
  assert.deepEqual(evaluateAction(urgent, "reply"), { outcome: "wrong", points: -3 });
  assert.deepEqual(evaluateAction(normal, "reply"), { outcome: "wrong", points: -2 });
  assert.deepEqual(missedResult(urgent), { outcome: "missed", points: -5 });
  assert.deepEqual(missedResult(normal), { outcome: "missed", points: -1 });
  assert.deepEqual(missedResult(leisure), { outcome: "missed", points: 0 });
});

test("담당자 전달 성공 피드백은 Figma 노트의 문구를 사용한다", () => {
  assert.equal(successFeedback("delegate", 7), "정확한 전달! +7");
  assert.equal(successFeedback("file", 5), "정확한 처리! +5");
});

test("정확도와 긴급 요청 누락을 함께 반영해 등급을 정한다", () => {
  const perfect = Array.from({ length: 10 }, (_, index) => ({ outcome: "correct", critical: index < 2 }));
  const good = [...perfect.slice(0, 5), { outcome: "missed", critical: true }, ...Array.from({ length: 4 }, () => ({ outcome: "wrong", critical: false }))];
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

test("dev launcher only supplies formal Day 2 inputs and permitted test overrides", () => {
  const dev = read("js/day2-minigame-dev.js");
  const html = read("dev/day2-minigame.html");

  assert.match(dev, /WorkAlertMinigame\.startDay2\(\{/);
  assert.match(dev, /subtask:\s*subtask\.value/);
  assert.match(dev, /testOverrides:\s*\{\s*duration:\s*runDuration,\s*seed:\s*runSeed,/s);
  assert.doesNotMatch(dev, /WorkAlertMinigame\.start\(/);
  assert.doesNotMatch(dev, /lifeMs\s*:/);
  assert.doesNotMatch(dev, /requestsFor|SUBTASK_REQUESTS|REQUESTS\.slice/);
  assert.match(html, /work-alert-minigame\.css\?v=4/);
  assert.match(html, /work-alert-minigame\.js\?v=4/);
  assert.match(html, /day2-minigame-dev\.js\?v=2/);
});

test("motion and reduced-effect feedback CSS contracts remain visible", () => {
  const css = read("css/work-alert-minigame.css");

  assert.match(css, /\.wa-card\s*\{[\s\S]*?animation:\s*wa-pop/);
  assert.match(css, /\.wa-floating-feedback\.show\s*\{\s*animation:\s*wa-feedback-rise 1s ease-out forwards;/);
  assert.match(css, /\.wa-combo\.bump\s*\{\s*animation:\s*wa-combo-bump/);
  assert.match(css, /\.wa-stats time\.danger\s*\{[\s\S]*?animation:\s*wa-pulse/);
  assert.match(css, /\.wa-shell\.wrong-feedback\s*\{\s*animation:\s*wa-wrong-shake/);

  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-floating-feedback\.show\s*\{[\s\S]*?animation:\s*none !important;[\s\S]*?opacity:\s*1;/);
  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-shell\.wrong-feedback::after\s*\{[\s\S]*?animation:\s*none !important;[\s\S]*?border-width:\s*3px;[\s\S]*?opacity:\s*1;/);
  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-combo\.bump/);
  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-stats time\.danger/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.work-alert-minigame \.wa-floating-feedback\.show\s*\{[\s\S]*?animation:\s*none !important;[\s\S]*?opacity:\s*1;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.work-alert-minigame \.wa-shell\.wrong-feedback::after\s*\{[\s\S]*?animation:\s*none !important;[\s\S]*?border-width:\s*3px;[\s\S]*?opacity:\s*1;/);
});
