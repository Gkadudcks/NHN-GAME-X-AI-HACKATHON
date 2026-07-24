"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "day3.html"), "utf8");
const engine = fs.readFileSync(path.join(root, "js", "day3.js"), "utf8");
const day2Engine = fs.readFileSync(path.join(root, "js", "day2.js"), "utf8");

test("DAY 3 페이지는 스토리와 몰래 연락 미니게임을 순서대로 불러온다", () => {
  const records = html.indexOf('src="js/clue-records.js');
  const story = html.indexOf('src="js/day3-story.js');
  const minigame = html.indexOf('src="js/secret-chat-minigame.js');
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

test("없는 구내식당 배경은 시각 플레이스홀더로 표시한다", () => {
  const storySource = fs.readFileSync(path.join(root, "js", "day3-story.js"), "utf8");
  assert.match(storySource, /구내식당 · 점심/);
  assert.match(storySource, /placeholder:/);
});
