"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const story = require("../js/day3-story.js");

test("DAY 3 장면 ID와 필수 필드가 유효하다", () => {
  assert.deepEqual(story.validateScenes(story.scenes), []);
});

test("DAY 3은 첫 변조를 확인하지만 실행자를 단정하지 않는다", () => {
  const text = JSON.stringify(story.scenes);
  assert.match(text, /DAY 3 최초 변경본|직접 접근 여부 미확정/);
  assert.doesNotMatch(text, /강민재가 실행자|서하린이 범인/);
});

test("DAY 3 핵심 단서는 모두 구조화 레코드를 참조한다", () => {
  assert.equal(Object.keys(story.CLUES).length, 6);
  Object.values(story.CLUES).forEach((clue) => {
    assert.equal(clue.day, 3);
    assert.ok(clue.id && clue.title && clue.detail);
  });
});

test("의심 선택은 몰아붙이기·검증·맹목적 신뢰를 구분한다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day3Decision");
  assert.deepEqual(scene.choices.map((choice) => choice.id), ["accuse", "verify", "blindTrust"]);
  assert.ok(scene.choices.find((choice) => choice.id === "verify").delta.trust > 0);
});
