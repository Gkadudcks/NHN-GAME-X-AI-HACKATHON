const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  ACTIONS,
  REQUESTS,
  SUBTASK_REQUESTS,
  DAY2_PRESET,
  DAY3_REQUESTS,
  DAY3_PRESET,
  buildDay2Requests,
  buildDay2Options,
  buildDay3Options,
  createSeededRandom,
  formatClock,
  buildSchedule,
  priorityForRequest,
  boardPlacement,
  evaluateAction,
  missedResult,
  scoreAfterPoints,
  calculateScore,
  maximumScore,
  scorePercentageFor,
  formatScorePercentage,
  gradeForScore,
  summarizeResults,
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
  assert.equal(maximumScore(options.requests), 880);
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
    assert.equal(maximumScore(requests), 880);
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

test("DAY 3 프리셋은 변조 조사 요청과 일반 업무를 16개 카드로 구성한다", () => {
  const options = buildDay3Options();
  assert.equal(DAY3_PRESET.seed, 20260729);
  assert.equal(options.duration, 45);
  assert.equal(options.lifeMs, 6500);
  assert.equal(options.count, 16);
  assert.deepEqual(options.requests, DAY3_REQUESTS);
  assert.notEqual(options.requests, DAY3_REQUESTS);
  assert.equal(DAY3_REQUESTS.some((request) => request.id === "d3-harin-preserve" && request.critical), true);
  assert.equal(DAY3_REQUESTS.some((request) => request.id === "d3-automation-owner" && request.action === "delegate"), true);
  assert.equal(DAY3_REQUESTS.some((request) => request.action === "spam"), true);
  assert.equal(DAY3_REQUESTS.every((request) => request.id.startsWith("d3-")), true);
});

test("피드백 타이머는 재시작·완료 시 정리되고 오답 테두리는 영구히 남지 않는다", () => {
  assert.match(source, /wrongFeedbackTimer/);
  assert.match(source, /comboEffectTimer/);
  assert.match(source, /historyScrollFrame/);
  assert.match(source, /state\.wrongFeedbackTimer = global\.setTimeout\([\s\S]*?wrong-feedback[\s\S]*?450\)/);
  assert.match(source, /function clearFeedbackTimers\(\)[\s\S]*?clearTimeout\(state\.feedbackTimer\)[\s\S]*?clearTimeout\(state\.wrongFeedbackTimer\)[\s\S]*?clearTimeout\(state\.comboEffectTimer\)[\s\S]*?cancelAnimationFrame\(state\.historyScrollFrame\)[\s\S]*?milestone/);
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
  assert.deepEqual(evaluateAction(urgent, "calendar"), { outcome: "correct", points: 70 });
  assert.deepEqual(evaluateAction(normal, "file"), { outcome: "correct", points: 50 });
  assert.deepEqual(evaluateAction(leisure, "later"), { outcome: "correct", points: 30 });
  assert.deepEqual(evaluateAction(urgent, "reply"), { outcome: "wrong", points: -30 });
  assert.deepEqual(evaluateAction(normal, "reply"), { outcome: "wrong", points: -20 });
  assert.deepEqual(missedResult(urgent), { outcome: "missed", points: -50 });
  assert.deepEqual(missedResult(normal), { outcome: "missed", points: -10 });
  assert.deepEqual(missedResult(leisure), { outcome: "missed", points: 0 });
});

test("실시간과 최종 점수는 처리마다 0점 하한을 적용하는 같은 누적 규칙을 쓴다", () => {
  assert.equal(scoreAfterPoints(0, -50), 0);
  assert.equal(scoreAfterPoints(50, -20), 30);
  assert.equal(calculateScore([{ points: -50 }, { points: 70 }, { points: -30 }]), 40);
  assert.equal(finalizeResults([
    { id: "missed", outcome: "missed", points: -50, critical: true, correctAction: "reply" },
    { id: "correct", outcome: "correct", points: 70, critical: true, correctAction: "reply" },
    { id: "wrong", outcome: "wrong", points: -30, critical: true, correctAction: "reply" },
  ], 210).score, 40);
});

test("담당자 전달 성공 피드백은 Figma 노트의 문구를 사용한다", () => {
  assert.equal(successFeedback("delegate", 70), "정확한 전달! +70");
  assert.equal(successFeedback("file", 50), "정확한 처리! +50");
});

test("880점 만점의 90%·70%·30% 경계에서 네 등급과 스탯을 판정한다", () => {
  assert.deepEqual(gradeForScore(800, 880), { grade: "perfect", workDelta: 2, trustDelta: 1 });
  assert.deepEqual(gradeForScore(790, 880), { grade: "good", workDelta: 1, trustDelta: 1 });
  assert.deepEqual(gradeForScore(620, 880), { grade: "good", workDelta: 1, trustDelta: 1 });
  assert.deepEqual(gradeForScore(610, 880), { grade: "normal", workDelta: 1, trustDelta: 0 });
  assert.deepEqual(gradeForScore(265, 880), { grade: "normal", workDelta: 1, trustDelta: 0 });
  assert.deepEqual(gradeForScore(264, 880), { grade: "bad", workDelta: 0, trustDelta: -1 });
  assert.deepEqual(gradeForPerformance([{ points: 800 }], 880), { grade: "perfect", workDelta: 2, trustDelta: 1 });
  assert.equal(scorePercentageFor(800, 880), 90.9);
  assert.equal(formatScorePercentage(90.9), "90.9%");
  assert.equal(formatScorePercentage(100), "100%");
});

test("완료 결과에 점수 비율, 신뢰도, 처리 집계와 기존 상세 기록을 포함한다", () => {
  const results = [
    { id: "harin-layout", sender: "서하린", outcome: "correct", points: 140, critical: true, harin: true },
    { id: "boss-meeting", sender: "박태식 부장", outcome: "missed", points: -100, critical: true, harin: false },
  ];
  const final = finalizeResults(results, 140);
  assert.equal(final.score, 40);
  assert.equal(final.maxScore, 140);
  assert.equal(final.scorePercentage, 28.6);
  assert.equal(final.grade, "bad");
  assert.equal(final.workDelta, 0);
  assert.equal(final.trustDelta, -1);
  assert.deepEqual(final.outcomeCounts, { correct: 1, wrong: 0, missed: 1, criticalHandled: 1, criticalTotal: 2 });
  assert.deepEqual(summarizeResults(results), final.outcomeCounts);
  assert.equal(final.harinHandled, true);
  assert.deepEqual(final.missedCritical, ["boss-meeting"]);
  assert.notEqual(final.results, results);
  assert.deepEqual(final.results, results);
});

test("dev launcher only supplies formal Day 3 inputs and permitted test overrides", () => {
  const dev = read("js/day2-minigame-dev.js");
  const html = read("dev/day2-minigame.html");
  const devCss = read("css/day2-minigame-dev.css");

  assert.match(dev, /WorkAlertMinigame\.startDay3\(\{/);
  assert.match(dev, /testOverrides:\s*\{\s*duration:\s*runDuration,\s*seed:\s*runSeed,/s);
  assert.doesNotMatch(dev, /WorkAlertMinigame\.start\(/);
  assert.doesNotMatch(dev, /lifeMs\s*:/);
  assert.doesNotMatch(dev, /subtask|requestsFor|SUBTASK_REQUESTS|REQUESTS\.slice/);
  assert.match(html, /work-alert-minigame\.css\?v=9/);
  assert.match(html, /work-alert-minigame\.js\?v=8/);
  assert.match(html, /day2-minigame-dev\.css\?v=2/);
  assert.match(html, /day2-minigame-dev\.js\?v=3/);
  assert.match(devCss, /\.minigame-dev \.work-alert-minigame\s*\{[\s\S]*?padding:\s*0 16px;/);
  assert.match(devCss, /\.minigame-dev \.wa-shell\s*\{[\s\S]*?calc\(100dvh - 64px\)/);
});

test("motion and reduced-effect feedback CSS contracts remain visible", () => {
  const css = read("css/work-alert-minigame.css");

  assert.match(css, /\.wa-card\s*\{[\s\S]*?animation:\s*wa-pop/);
  assert.match(css, /\.wa-floating-feedback\.show\s*\{\s*animation:\s*wa-feedback-rise 1s ease-out forwards;/);
  assert.match(css, /\.wa-combo\.bump\s*\{\s*animation:\s*wa-combo-bump/);
  assert.match(css, /\.wa-combo\.milestone::before\s*\{\s*animation:\s*wa-combo-callout/);
  assert.match(css, /\.wa-combo\.milestone::after\s*\{\s*animation:\s*wa-combo-ring/);
  assert.match(css, /\.wa-combo\[data-tier="gold"\]/);
  assert.match(css, /\.wa-combo\[data-tier="mint"\]/);
  assert.match(css, /\.wa-stats time\.danger\s*\{[\s\S]*?animation:\s*wa-pulse/);
  assert.match(css, /\.wa-shell\.wrong-feedback\s*\{\s*animation:\s*wa-wrong-shake/);

  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-floating-feedback\.show\s*\{[\s\S]*?animation:\s*none !important;[\s\S]*?opacity:\s*1;/);
  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-shell\.wrong-feedback::after\s*\{[\s\S]*?animation:\s*none !important;[\s\S]*?border-width:\s*3px;[\s\S]*?opacity:\s*1;/);
  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-combo\.bump/);
  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-combo\.milestone::before\s*\{[\s\S]*?opacity:\s*1;/);
  assert.match(css, /\.reduce-effects \.work-alert-minigame \.wa-stats time\.danger/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.work-alert-minigame \.wa-floating-feedback\.show\s*\{[\s\S]*?animation:\s*none !important;[\s\S]*?opacity:\s*1;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.work-alert-minigame \.wa-shell\.wrong-feedback::after\s*\{[\s\S]*?animation:\s*none !important;[\s\S]*?border-width:\s*3px;[\s\S]*?opacity:\s*1;/);
});

test("콤보 표시는 업무 메시지를 가리지 않도록 플레이 헤더 쪽에 배치된다", () => {
  const css = read("css/work-alert-minigame.css");
  assert.match(css, /\.wa-combo\s*\{[\s\S]*?top:\s*-56px;[\s\S]*?left:\s*50%;/);
  for (const file of ["day3.html", "dev/day2-minigame.html"]) {
    assert.match(read(file), /work-alert-minigame\.css\?v=9/);
  }
});

test("결과 화면은 Figma 03 Result의 중앙 세로 정산 배치와 요청별 스크롤 처리 내역을 사용한다", () => {
  const css = read("css/work-alert-minigame.css");

  assert.match(source, /id="wa-result-grade"[\s\S]*?class="wa-result-score-raw"[\s\S]*?class="wa-result-stats"[\s\S]*?class="wa-result-history"/);
  assert.match(source, /item\.outcome === "missed" \? "지연"/);
  assert.doesNotMatch(source, /wa-result-percentage|id="wa-result-percentage"/);
  assert.match(source, /id="wa-result-list" class="wa-result-list"/);
  assert.doesNotMatch(source, /wa-result-summary-grid/);
  assert.match(css, /\.wa-result-card > header\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--wa-muted\);/);
  assert.match(css, /\.wa-result-card > header::before,[\s\S]*?\.wa-result-card > header::after\s*\{[\s\S]*?transform:\s*rotate\(45deg\);/);
  assert.match(css, /\.wa-result-score\s*\{[\s\S]*?min-height:\s*144px;[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;/);
  assert.match(css, /\.wa-result-score-raw span\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--wa-line\);[\s\S]*?font-size:\s*26px;/);
  assert.match(css, /\.wa-result-score-raw b\s*\{[\s\S]*?font-size:\s*68px;/);
  assert.match(css, /\.wa-result-history\s*\{[\s\S]*?width:\s*min\(254px, 100%\);[\s\S]*?height:\s*222px;/);
  assert.match(css, /\.wa-stats span\s*\{[\s\S]*?justify-items:\s*end;/);
  assert.match(css, /\.wa-stats small\s*\{[\s\S]*?text-align:\s*right;[\s\S]*?transform:\s*translateX\(-4px\);/);
  assert.match(css, /\.wa-stats b\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums;[\s\S]*?text-align:\s*right;/);
  assert.match(css, /\.wa-result-list\s*\{[\s\S]*?overflow-y:\s*auto;[\s\S]*?scrollbar-color:[\s\S]*?scrollbar-width:\s*thin;/);
  assert.match(css, /\.wa-result-list::\-webkit-scrollbar-button\s*\{[\s\S]*?display:\s*none;/);
  assert.match(css, /\.wa-result-list::\-webkit-scrollbar-thumb\s*\{[\s\S]*?border-radius:\s*999px;[\s\S]*?rgba\(107, 91, 87, \.22\)/);
});

test("처리 내역은 결과 진입 시 1.5초 동안 점점 빠르게 내려가며 감소 효과와 정리를 지원한다", () => {
  assert.match(source, /const RESULT_SCROLL_DURATION_MS = 1500;/);
  assert.match(source, /function startResultHistoryScroll\(\)[\s\S]*?list\.scrollTop = 0;[\s\S]*?progress \*\* 3[\s\S]*?requestAnimationFrame\(scroll\)/);
  assert.match(source, /function prefersReducedResultMotion\(\)[\s\S]*?reduce-effects[\s\S]*?prefers-reduced-motion: reduce/);
  assert.match(source, /if \(prefersReducedResultMotion\(\)\) \{\s*list\.scrollTop = maxScroll;/);
  assert.match(source, /function finishGame\(\)[\s\S]*?showScreen\(refs\.result\);[\s\S]*?startResultHistoryScroll\(\)/);
  assert.match(source, /function clearFeedbackTimers\(\)[\s\S]*?cancelAnimationFrame\(state\.historyScrollFrame\)/);
});

test("네 등급은 지정한 fallback 색과 글자 그라데이션을 사용한다", () => {
  const css = read("css/work-alert-minigame.css");

  assert.match(css, /\.wa-result-grade\[data-grade="perfect"\]\s*\{\s*color:\s*#7046c8;/);
  assert.match(css, /\.wa-result-grade\s*\{[\s\S]*?color:\s*#28b95f;/);
  assert.match(css, /\.wa-result-grade\[data-grade="normal"\]\s*\{\s*color:\s*#8b8178;/);
  assert.match(css, /\.wa-result-grade\[data-grade="bad"\]\s*\{\s*color:\s*#4b4141;/);
  for (const gradient of [
    "#7046c8, #d06cff",
    "#28b95f, #a4ed83",
    "#8b8178, #edcf78",
    "#4b4141, #922f3d",
  ]) {
    assert.match(css, new RegExp(`linear-gradient\\(135deg, ${gradient}\\)`));
  }
  assert.match(css, /@media \(forced-colors:\s*active\)[\s\S]*?-webkit-text-fill-color:\s*CanvasText;/);
});
