const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const css = fs.readFileSync(path.join(__dirname, "..", "css", "game.css"), "utf8");

test("카메라 연출은 자체 위치 transform을 가진 중앙 UI를 직접 변형하지 않는다", () => {
  assert.doesNotMatch(css, /camera-(?:focus|tension|romance|reveal|impact)[^{]*\.system-panel/);
  assert.doesNotMatch(css, /\[class\*="camera-"\][^{]*\.system-panel/);
});

test("선택지 패널 애니메이션은 중앙 정렬 transform을 보존한다", () => {
  assert.match(css, /@keyframes choices-panel-in\{from\{[^}]*translate\(-50%,calc\(-50% \+ 10px\)\)[^}]*\}to\{[^}]*translate\(-50%,-50%\)/);
});
