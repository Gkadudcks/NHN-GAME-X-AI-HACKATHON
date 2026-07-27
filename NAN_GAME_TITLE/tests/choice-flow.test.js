const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("선택 장면은 결과 대사를 숨긴 채 선택지를 먼저 표시한다", () => {
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /pendingChoice/);
    assert.match(source, /dialogueCard\.hidden\s*=\s*pendingChoice/);
  }
});

test("선택을 완료한 뒤 결과 대화창을 다시 표시한다", () => {
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /dialogueCard\.hidden\s*=\s*false/);
  }
});
