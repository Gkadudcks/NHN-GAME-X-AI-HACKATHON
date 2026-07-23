const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ORDERS, timingScore, gradeForScore, isRecipeStepCorrect } = require("../js/coffee-minigame.js");

test("레시피는 현재 단계에 필요한 재료만 허용한다", () => {
  const mixRecipe = ORDERS.find((order) => order.key === "minjae").recipe;
  assert.equal(isRecipeStepCorrect(mixRecipe, [], "mix"), true);
  assert.equal(isRecipeStepCorrect(mixRecipe, [], "hot-water"), false);
  assert.equal(isRecipeStepCorrect(mixRecipe, ["mix"], "hot-water"), true);
});

test("마무리 게이지는 완벽·양호·실수 구간을 구분한다", () => {
  assert.equal(timingScore(0.5), 25);
  assert.equal(timingScore(0.3), 15);
  assert.equal(timingScore(0.1), 5);
});

test("총점에 따라 기존 스탯 보상 단계로 변환한다", () => {
  assert.deepEqual(gradeForScore(240), { grade: "perfect", workDelta: 2 });
  assert.deepEqual(gradeForScore(180), { grade: "good", workDelta: 1 });
  assert.deepEqual(gradeForScore(179), { grade: "messy", workDelta: -1 });
});

test("재료는 통일된 SVG 아이콘을 사용하고 컵 아래에 투입 목록을 노출하지 않는다", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "coffee-minigame.js"), "utf8");
  assert.match(source, /const ICONS = Object\.freeze/);
  assert.match(source, /coffee-ingredient-icon/);
  assert.doesNotMatch(source, /coffee-cup-steps/);
  assert.match(source, /<strong>NAN<\/strong>/);
  assert.doesNotMatch(source, /cup\.name\[0\]/);
  assert.match(source, /coffee-recipe-label/);
  assert.doesNotMatch(source, /aria-hidden="true">→/);
});
