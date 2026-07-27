const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

function sliceBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `${start} 구간을 찾을 수 없습니다.`);
  assert.notEqual(endIndex, -1, `${end} 구간을 찾을 수 없습니다.`);
  return source.slice(startIndex, endIndex);
}

test("세 DAY 엔진은 확정된 낮·밤 체크포인트에서 자동저장을 실행한다", () => {
  const day1 = read("js/game.js");
  const day2 = read("js/day2.js");
  const day3 = read("js/day3.js");

  assert.match(day1, /new Set\(\['eveningLead','end'\]\)/);
  assert.match(day1, /saveSilently\(\);autoSaveAtCheckpoint\(s\)/);
  assert.match(day2, /new Set\(\["day2OvertimeLead", "day2End"\]\)/);
  assert.match(day3, /new Set\(\["day3EveningMessage", "day3End"\]\)/);

  const day2Render = sliceBetween(day2, "function render() {", "function hasBlockingUi()");
  const day3Render = sliceBetween(day3, "function render() {", "function hasBlockingUi()");
  assert.match(day2Render, /saveProgress\(\);\s*autoSaveAtCheckpoint\(scene\);\s*if \(scene\.startWorkAlert/);
  assert.match(day3Render, /saveProgress\(\);\s*autoSaveAtCheckpoint\(scene\);\s*if \(scene\.startSecretChat/);
});

test("미니게임 완료 함수에는 정의되지 않은 scene 자동저장 호출이 없다", () => {
  const day2 = read("js/day2.js");
  const day3 = read("js/day3.js");
  const finishWorkAlert = sliceBetween(day2, "function finishWorkAlert", "function startWorkAlert");
  const finishSecretChat = sliceBetween(day3, "function finishSecretChat", "function startSecretChat");

  assert.doesNotMatch(finishWorkAlert, /autoSaveAtCheckpoint\(scene\)/);
  assert.doesNotMatch(finishSecretChat, /autoSaveAtCheckpoint\(scene\)/);
});

test("수동 저장과 자동저장은 세 엔진에서 같은 payload 생성기를 공유한다", () => {
  for (const file of ["js/game.js", "js/day2.js", "js/day3.js"]) {
    const source = read(file);
    assert.match(source, /function buildGameSavePayload\(/, file);
    assert.match(source, /GameProgress\.saveManualSlot\(localStorage,slotId,buildGameSavePayload\(scene\)\)|GameProgress\.saveManualSlot\(localStorage, slotId, buildGameSavePayload\(scene\)\)/, file);
    assert.match(source, /GameProgress\.saveAutoSlot\(localStorage,/, file);
    assert.match(source, /buildGameSavePayload\(scene\)/, file);
  }
});

test("타이틀과 인게임 저장 카드에 AUTO SAVE 배지가 노출된다", () => {
  const title = read("js/title-screen.js");
  const titleCss = read("css/title-screen.css");
  const gameCss = read("css/game.css");

  assert.match(title, /autosave-badge/);
  assert.match(title, /slot\.saveType === "auto"/);
  assert.match(titleCss, /\.autosave-badge/);
  assert.match(gameCss, /\.game-autosave-badge/);
  for (const file of ["js/game.js", "js/day2.js", "js/day3.js"]) {
    assert.match(read(file), /game-autosave-badge/, file);
  }
});

test("자동저장 관련 정적 자산 캐시 버전이 모든 진입 페이지에서 갱신된다", () => {
  const index = read("index.html");
  const game = read("game.html");
  const day2 = read("day2.html");
  const day3 = read("day3.html");

  assert.match(index, /title-screen\.css\?v=11/);
  assert.match(index, /progress-store\.js\?v=3/);
  assert.match(index, /title-screen\.js\?v=14/);
  for (const html of [game, day2, day3]) {
    assert.match(html, /game\.css\?v=17/);
    assert.match(html, /progress-store\.js\?v=3/);
    assert.match(html, /settings-dialog\.css\?v=2/);
    assert.match(html, /settings-store\.js\?v=3/);
    assert.match(html, /settings-dialog\.js\?v=2/);
  }
  assert.match(game, /game\.js\?v=25/);
  assert.match(day2, /day2\.js\?v=15/);
  assert.match(day3, /day3\.js\?v=8/);
});
