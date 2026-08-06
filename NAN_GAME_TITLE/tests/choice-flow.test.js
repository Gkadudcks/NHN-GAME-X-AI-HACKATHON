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
  assert.match(css, /\.stage-choice-prompt small\{[^}]*font-size:14px/);
  for (const file of ["game.js", "day2.js", "day3.js", "day4.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /stage-choice-prompt/);
    assert.match(source, /choicePromptLabel\(scene\)/);
    assert.match(source, /한도윤.*시스템.*내레이션/);
    assert.match(source, /['"]상황['"]/);
    assert.doesNotMatch(source, /<small>CHOICE<\/small>/);
  }
});

test("모든 DAY는 영향 능력치를 아이콘·수치 배지로, 없으면 스토리 분기 태그로 동일하게 표시한다", () => {
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");
  assert.match(css, /\.stage-choice-effects/);
  assert.match(css, /\.stage-choice-effects i\[class\*="stat-"\]/);
  for (const file of ["game.js", "day2.js", "day3.js", "day4.js", "day5.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /choiceEffectMarkup|choiceEffects/, file);
    assert.match(source, /스토리 분기/, file);
    assert.match(source, /업무력/, file);
    assert.match(source, /호감도/, file);
    assert.match(source, /신뢰도/, file);
    assert.match(source, /value\s*>\s*0\s*\?\s*["']▲["']\s*:\s*["']▼["']/, file);
    assert.doesNotMatch(source, /["']상승["']\s*:\s*["']하락["']/, file);
  }
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /function choiceEffectMarkup/, file);
  }
  assert.match(css, /\.stage-choice-effects i\.gain/);
  assert.match(css, /\.stage-choice-effects i\.loss/);
});

test("CG로 이어지는 선택지는 모든 DAY에서 동일한 배지로 표시된다", () => {
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");
  assert.match(css, /\.stage-choice-effects \.stat-cg\{/);
  for (const file of ["game.js", "day2.js", "day3.js", "day4.js", "day5.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(source, /function cgBadgeMarkup\(choice\)/, file);
    assert.match(source, /class="cg stat-cg"><b>🖼<\/b><span>CG 확인<\/span>/, file);
    assert.match(source, /cgBadgeMarkup\(choice\)/, file);
  }
});

test("잠긴 선택지는 CSS로만 자물쇠 아이콘을 붙이며 문자열에 중복해 넣지 않는다", () => {
  for (const file of ["game.js", "day2.js", "day3.js", "day4.js", "day5.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.doesNotMatch(source, /class="locked">🔒/, file);
  }
  const css = fs.readFileSync(path.join(root, "css", "game.css"), "utf8");
  assert.match(css, /i\.locked:before\{content:"🔒"/);
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
