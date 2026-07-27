"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const day2 = require("../js/day2-story.js");
const day3 = require("../js/day3-story.js");

test("구현된 모든 DAY의 점심 시간에는 능력치 부담 없는 메뉴 선택이 있다", () => {
  const day1Source = fs.readFileSync(path.join(__dirname, "..", "js", "game.js"), "utf8");
  const day1Choice = day1Source.match(/\{id:'lunchMenuChoice'[\s\S]*?choices:\[([\s\S]*?)\]\}/)?.[1] || "";
  const choices = [
    day2.scenes.find((scene) => scene.id === "day2LunchChoice"),
    day3.scenes.find((scene) => scene.id === "day3LunchChoice"),
  ];

  assert.match(day1Choice, /샌드위치/);
  assert.match(day1Choice, /참치김밥/);
  assert.match(day1Choice, /컵라면/);
  choices.forEach((scene) => {
    assert.equal(scene.choices.length, 3);
    assert.ok(scene.choices.every((choice) => Object.keys(choice.delta).length === 0));
    assert.match(scene.location, /점심/);
  });
});
