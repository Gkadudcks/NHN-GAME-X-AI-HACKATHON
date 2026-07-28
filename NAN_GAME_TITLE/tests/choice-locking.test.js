"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const day2Story = require("../js/day2-story.js");
const day3Story = require("../js/day3-story.js");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("호감도 조건 선택지는 숨기지 않고 잠금 상태와 현재 수치를 표시한다", () => {
  for (const file of ["js/game.js", "js/day2.js", "js/day3.js"]) {
    const source = read(file);
    assert.match(source, /choiceLock/);
    assert.match(source, /button\.disabled|b\.disabled/);
    assert.match(source, /choice-locked/);
    assert.match(source, /호감도 \$\{lock\.required\} 필요 · 현재 \$\{lock\.current\}/);
  }
  assert.match(read("css/game.css"), /\.stage-choices button\.choice-locked/);
});

test("관계가 깊어지는 선택지는 단계별 필요 호감도를 가진다", () => {
  const overtime = day2Story.scenes.find((scene) => scene.id === "day2OvertimeChoice");
  const suspicion = day3Story.scenes.find((scene) => scene.id === "day3Decision");
  assert.equal(overtime.choices.find((choice) => choice.value === "finish-together").minAffection, 2);
  assert.equal(overtime.choices.find((choice) => choice.value === "wait-until-ready").minAffection, 4);
  assert.equal(suspicion.choices.find((choice) => choice.id === "blindTrust").minAffection, 3);
});
