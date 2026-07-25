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

test("location transition uses a two-second default and supports skipping", () => {
  assert.equal(transition.DEFAULT_DURATION, 2000);
  const script = fs.readFileSync(path.join(root, "js", "location-transition.js"), "utf8");
  assert.match(script, /overlay\.addEventListener\("click", finish\)/);
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
