"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const story = require("../js/day5-story.js");
const css = fs.readFileSync(path.join(root, "css/day5.css"), "utf8");
const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");

test("DAY 5 character scenes use stable declared positions and profile height", () => {
  const allowedPositions = new Set(["farLeft", "left", "center", "right", "farRight"]);
  const characters = story.scenes.flatMap((scene) => scene.characters || []);
  assert.ok(characters.length > 0);
  for (const character of characters) {
    assert.ok(allowedPositions.has(character.position), `${character.id}: ${character.position}`);
    assert.equal(character.scale, undefined, `${character.id} must use its profile height`);
  }
});

test("DAY 5 character motion returns to the fixed layout and clears transient classes", () => {
  for (const keyframe of [
    "day5-camera-focus",
    "day5-camera-tension",
    "day5-camera-romance",
    "day5-camera-reveal",
    "day5-camera-impact",
    "day5-speaker-focus-in",
    "day5-emotion-surprised",
    "day5-emotion-nervous",
    "day5-emotion-happy",
    "day5-emotion-embarrassed",
    "day5-emotion-angry",
    "day5-emotion-sad",
    "day5-emotion-determined",
    "day5-emotion-recover",
  ]) {
    const block = css.match(new RegExp(`@keyframes ${keyframe} \\{([\\s\\S]*?)\\n\\}`));
    assert.ok(block, keyframe);
    assert.match(block[1], /100%/);
  }
  assert.match(runtime, /classList\.remove\("speaker-beat", "emotion-beat", "emotion-recover"\)/);
});

test("비화자는 움직임을 즉시 멈추고 실제 신체 높이와 발끝 기준선을 유지한다", () => {
  const sharedCss = fs.readFileSync(path.join(root, "css/game.css"), "utf8");
  const motion = fs.readFileSync(path.join(root, "js/scene-motion.js"), "utf8");
  assert.match(sharedCss, /\.character\.listening\{[^}]*animation:none!important/);
  assert.match(motion, /const CHARACTER_BOUNDS/);
  assert.match(motion, /declaredHeight \/ bounds\[1\]/);
  assert.match(motion, /--foot-baseline-offset/);
});
