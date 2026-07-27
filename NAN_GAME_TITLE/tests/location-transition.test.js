const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const transition = require(path.join(root, "js", "location-transition.js"));

test("location transition only plays for an explicit different destination", () => {
  assert.equal(transition.shouldPlay("게임사업실 · 오전", "회사 밖 식당 · 점심"), true);
  assert.equal(transition.shouldPlay("회사 밖 식당 · 점심", "회사 밖 식당 · 점심"), false);
  assert.equal(transition.shouldPlay("회사 밖 식당 · 점심", undefined), false);
});

test("location transition enforces 1.3 seconds and blocks click skipping", () => {
  assert.equal(transition.DEFAULT_DURATION, 1300);
  const script = fs.readFileSync(path.join(root, "js", "location-transition.js"), "utf8");
  assert.match(script, /Math\.max\(DEFAULT_DURATION/);
  assert.doesNotMatch(script, /overlay\.addEventListener\("click", finish\)/);
  assert.match(script, /event\.preventDefault\(\)/);
  assert.match(script, /event\.stopPropagation\(\)/);
});

test("location transition displays numeric and bar progress from zero to one hundred", () => {
  const script = fs.readFileSync(path.join(root, "js", "location-transition.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "css", "location-transition.css"), "utf8");
  assert.match(script, /role="progressbar"/);
  assert.match(script, /progressText\.textContent = "0%"/);
  assert.match(script, /progressText\.textContent = "100%"/);
  assert.match(css, /\.location-transition-progress/);
});

test("location transition follows the shared cream and coral visual theme", () => {
  const css = fs.readFileSync(path.join(root, "css", "location-transition.css"), "utf8");
  assert.match(css, /var\(--ink,\s*#30272b\)/);
  assert.match(css, /var\(--coral,\s*#e9656e\)/);
  assert.match(css, /#fff9f2f7/);
  assert.match(css, /linear-gradient\(145deg,\s*#2f2229f2,\s*#5c3941ed\)/);
  assert.match(css, /@media \(max-width:\s*560px\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
});

test("all gameplay engines load and invoke the shared location transition", () => {
  for (const file of ["game.html", "day2.html", "day3.html"]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /location-transition\.css/);
    assert.match(html, /location-transition\.js/);
  }
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const script = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(script, /GameLocationTransition\.install\(\)/);
    assert.match(script, /locationTransition\.playIfChanged/);
    assert.match(script, /deferNotification/);
  }
});

test("game engines deliver destination messages after the location transition", () => {
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const script = fs.readFileSync(path.join(root, "js", file), "utf8");
    const transitionIndex = script.indexOf("await locationTransition.playIfChanged");
    const delayedMessageIndex = script.indexOf("notifyMessage(target");
    assert.ok(transitionIndex >= 0 && transitionIndex < delayedMessageIndex, file);
    assert.match(script, /setTimeout\(resolve,\s*500\)/);
  }
});

test("점심 장소에서 사무실로 돌아오는 첫 장면은 목적지를 명시한다", () => {
  const day1 = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const day2 = require(path.join(root, "js", "day2-story.js"));
  const day3 = require(path.join(root, "js", "day3-story.js"));

  assert.match(day1, /id:'direction'[^]*?location:'게임사업실 · 오후'/);
  for (const id of ["day2SubtaskA1", "day2SubtaskB1", "day2SubtaskC1"]) {
    assert.equal(day2.scenes.find((scene) => scene.id === id).location, "게임사업실 · 오후");
  }
  assert.equal(day3.scenes.find((scene) => scene.id === "day3OfficeReturn").location, "게임사업실 · 오후");
  assert.equal(day3.scenes.find((scene) => scene.id === "day3DepartureLead").location, "게임사업실 · 퇴근");
});

test("일일 정산을 닫은 뒤에도 장소 전환을 기다린 다음 장면을 렌더링한다", () => {
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const source = fs.readFileSync(path.join(root, "js", file), "utf8");
    const start = source.indexOf("async function closeDaySummary()");
    const end = source.indexOf(file === "game.js" ? "let deferNextNotification" : file === "day2.js" ? "function goToDay3" : "let deferNextNotification", start);
    const block = source.slice(start, end);
    assert.match(block, /await locationTransition\.playIfChanged/, file);
    assert.ok(block.indexOf("await locationTransition.playIfChanged") < block.indexOf("render()"), file);
  }
});
