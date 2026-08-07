const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const gameRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(gameRoot, "minigames/day5-presentation/dev/index.html"), "utf8");
const css = fs.readFileSync(path.join(gameRoot, "css/day5-presentation-motion-prototype.css"), "utf8");
const js = fs.readFileSync(path.join(gameRoot, "js/day5-presentation-motion-prototype.js"), "utf8");

test("prototype is isolated from the DAY 5 production entry", () => {
  const production = fs.readFileSync(path.join(gameRoot, "day5.html"), "utf8");
  assert.doesNotMatch(production, /day5-presentation-motion-prototype/);
});

test("prototype uses the stable presentation room asset id", () => {
  assert.match(html, /\.\.\/\.\.\/\.\.\/js\/art-assets\.js/);
  assert.match(js, /background\.presentation_room\.day/);
  assert.match(js, /document\.currentScript\?\.src/);
  assert.match(js, /new URL\(assetPath, scriptUrl\)/);
  assert.match(css, /\.camera\{[^}]*z-index:0/);
});

test("prototype contains the complete playable verification loop", () => {
  for (const marker of ["dialogue-card", "screenPanel", "memory", "choice", "ending", "restart"]) {
    assert.match(html, new RegExp(marker));
  }
  assert.match(js, /const scenes = \[/);
  assert.match(js, /playMemory/);
  assert.match(js, /typeText/);
  assert.match(js, /showEnding/);
  assert.match(js, /수치 불일치 발견/);
});

test("prototype supports keyboard escape and reduced motion", () => {
  assert.match(js, /event\.key\s*===\s*"Escape"/);
  assert.match(css, /prefers-reduced-motion/);
});
