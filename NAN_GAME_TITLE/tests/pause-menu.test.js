const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
test("all gameplay pages load the shared pause menu", () => {
  for (const file of ["game.html", "day2.html", "day3.html"]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, /pause-menu\.css/);
    assert.match(html, /pause-menu\.js/);
  }
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const script = fs.readFileSync(path.join(root, "js", file), "utf8");
    assert.match(script, /GamePauseMenu\.install/);
    assert.match(script, /onEscape/);
    assert.match(script, /openLoad:\s*\(\)\s*=>\s*openGameSave\(["']load["']\)/);
  }
});

test("continue action delegates to the existing load-slot flow", () => {
  const script = fs.readFileSync(path.join(root, "js", "pause-menu.js"), "utf8");
  assert.match(script, /action === "continue"/);
  assert.match(script, /options\.openLoad\?\.\(\)/);
  assert.doesNotMatch(script, /setItem\(|getSaveSlots\(/);
});

test("pause menu is layered above every minigame overlay", () => {
  const pauseCss = fs.readFileSync(path.join(root, "css", "pause-menu.css"), "utf8");
  const minigameCss = [
    "coffee-minigame.css",
    "work-alert-minigame.css",
    "secret-chat-minigame.css",
  ].map((file) => fs.readFileSync(path.join(root, "css", file), "utf8")).join("\n");
  const pauseLayer = Number(pauseCss.match(/\.pause-menu\{[^}]*z-index:(\d+)/)?.[1]);
  const minigameLayers = [...minigameCss.matchAll(/z-index:\s*(\d+)/g)].map((match) => Number(match[1]));
  assert.ok(pauseLayer > Math.max(...minigameLayers));
});
