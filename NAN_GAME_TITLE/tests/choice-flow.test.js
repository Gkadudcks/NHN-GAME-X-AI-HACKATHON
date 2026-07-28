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
    assert.match(source, /addStageChoicePrompt/);
    assert.match(source, /function escapeHtml\s*\(/);
  }
});

test("선택지 위에는 무엇을 고르는지 설명하는 장면 질문이 표시된다", () => {
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");
  assert.match(css, /\.stage-choice-prompt/);
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /stage-choice-prompt/);
  }
});

test("모든 선택지는 영향 능력치 또는 스토리 분기 태그를 표시한다", () => {
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");
  assert.match(css, /\.stage-choice-effects/);
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /choiceEffectTags/);
    assert.match(source, /스토리 분기/);
    assert.match(source, /업무력/);
    assert.match(source, /호감도/);
    assert.match(source, /신뢰도/);
    assert.match(source, /value\s*>\s*0\s*\?\s*["']상승["']\s*:\s*["']하락["']/);
  }
  assert.match(css, /\.stage-choice-effects i\.gain/);
  assert.match(css, /\.stage-choice-effects i\.loss/);
});

test("선택을 완료한 뒤 결과 대화창을 다시 표시한다", () => {
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /dialogueCard\.hidden\s*=\s*false/);
  }
});

test("DAY 2 선택 결과는 고정된 서하린 접두어 대신 장면별 화자를 사용한다", () => {
  const source = fs.readFileSync(path.join(root, "js", "day2.js"), "utf8");
  assert.match(source, /scene\.replySpeaker \|\| scene\.speaker/);
  assert.match(source, /choice\.reply \|\| choice\.text/);
  assert.doesNotMatch(source, /`서하린: “\$\{choice\.reply\}”`/);
});

test("모든 DAY는 선택 결과에 장면별 화자를 적용한다", () => {
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /replySpeaker\s*\|\|\s*scene\.speaker/, file);
  }
  const day1 = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  assert.match(day1, /id:'nanaChoice'.*replySpeaker:'한도윤'/);
  assert.doesNotMatch(day1, /reply:'서하린은|reply:'.*서하린의 표정/);
});
