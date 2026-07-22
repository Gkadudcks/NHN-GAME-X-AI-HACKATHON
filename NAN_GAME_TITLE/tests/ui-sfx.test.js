const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("클릭 효과음 후보는 원본을 보존한 별도 WAV 파일이다", () => {
  assert.equal(fs.existsSync(path.join(root, "assets/audio/ui-click.wav")), true);
  for (const name of ["soft", "warm", "paper", "glass"]) {
    const file = path.join(root, `assets/audio/ui-click-${name}.wav`);
    assert.equal(fs.existsSync(file), true, name);
    const size = fs.statSync(file).size;
    assert.ok(size > 2_000 && size < 12_000, `${name}: ${size}`);
  }
  for (const name of ["soft-v2", "warm-v2"]) {
    const file = path.join(root, `assets/audio/ui-click-${name}.wav`);
    assert.equal(fs.existsSync(file), true, name);
    const size = fs.statSync(file).size;
    assert.ok(size > 5_000 && size < 12_000, `${name}: ${size}`);
  }
});

test("기본 클릭음은 soft이며 후보를 런타임에서 바꿀 수 있다", () => {
  const source = fs.readFileSync(path.join(root, "js/ui-sfx.js"), "utf8");
  assert.match(source, /let activeVariant = "soft"/);
  assert.match(source, /function setVariant\(name\)/);
  assert.match(source, /soft: "assets\/audio\/ui-click-soft-v2\.wav"/);
  assert.match(source, /warm: "assets\/audio\/ui-click-warm-v2\.wav"/);
  assert.match(source, /master \* sfx \* 0\.46/);
});
