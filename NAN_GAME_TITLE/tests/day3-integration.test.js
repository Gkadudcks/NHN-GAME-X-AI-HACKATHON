"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "day3.html"), "utf8");
const engine = fs.readFileSync(path.join(root, "js", "day3.js"), "utf8");
const day2Engine = fs.readFileSync(path.join(root, "js", "day2.js"), "utf8");

test("DAY 3는 놀란 서하린 장면과 구분된 퇴근 선택지가 반영된 스토리 캐시 버전을 사용한다", () => {
  assert.match(html, /day3-story\.js\?v=24/);
});

test("DAY 3 loads the DAY 2 story before its own story", () => {
  const day2Story = html.indexOf('src="js/day2-story.js');
  const day3Story = html.indexOf('src="js/day3-story.js');

  assert.ok(day2Story >= 0 && day2Story < day3Story);
});

test("DAY 3 shows prior-day messages immediately and gates DAY 3 messages", () => {
  assert.match(engine, /messageDay\(message\) < 3 \|\| isAtOrAfter\(message\.at\)/);
  assert.match(engine, /messageDayDivider/);
});

test("DAY 3 페이지는 스토리와 업무 알림 미니게임을 순서대로 불러온다", () => {
  const records = html.indexOf('src="js/clue-records.js');
  const story = html.indexOf('src="js/day3-story.js');
  const minigame = html.indexOf('src="minigames/day3-work-alert/index.js');
  const game = html.indexOf('src="js/day3.js');
  assert.ok(records >= 0 && records < story && story < minigame && minigame < game);
});

test("DAY 2 완료 후 DAY 3로 이동할 수 있다", () => {
  assert.match(day2Engine, /GameProgress\.startDay3\(localStorage\)/);
  assert.match(day2Engine, /day3\.html/);
});

test("DAY 3 엔진은 DAY 3 저장과 단서 날짜를 사용한다", () => {
  assert.match(engine, /progress\.days\[3\]/);
  assert.match(engine, /currentDay:\s*3/);
  assert.match(engine, /defaultDay:\s*3/);
});

test("DAY 3 업무 알림은 DAY 2 하위 업무와 원본 프리셋을 이어받고 네 등급 보상을 DAY 3에 반영한다", () => {
  assert.match(engine, /const day2Subtask = progress\.days\[2\]\?\.decisions\?\.day2Subtask \|\| "competitor"/);
  assert.match(engine, /WorkAlertMinigame\.startDay3\(\{\s*subtask: day2Subtask,\s*onComplete: finishWorkAlert,/s);
  assert.match(engine, /score:\s*620,\s*maxScore:\s*880,\s*scorePercentage:\s*70\.5,/s);
  assert.match(engine, /perfect:\s*Object\.freeze\(\{ workDelta: 2, trustDelta: 1 \}\)/);
  assert.match(engine, /bad:\s*Object\.freeze\(\{ workDelta: 0, trustDelta: -1 \}\)/);
  assert.match(engine, /state\.work \+= normalizedResult\.workDelta/);
  assert.match(engine, /state\.trust \+= normalizedResult\.trustDelta/);
  assert.match(engine, /변경본부터 건드리지 말고 보존해요/);
});

test("구내식당 장면은 승인된 전용 배경을 사용한다", () => {
  const storySource = fs.readFileSync(path.join(root, "js", "day3-story.js"), "utf8");
  assert.match(storySource, /구내식당 · 점심/);
  assert.match(storySource, /bg:\s*"cafeteria_day"/);
  assert.match(engine, /ArtAssets\.resolve\("background\.cafeteria\.day"\)/);
});
