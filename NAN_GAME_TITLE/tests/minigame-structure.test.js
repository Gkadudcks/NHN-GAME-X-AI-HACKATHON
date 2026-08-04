"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const exists = (file) => fs.existsSync(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const FEATURES = Object.freeze({
  "day1-coffee": { page: "game.html", global: "CoffeeMinigame" },
  "day2-secret-chat": { page: "day2.html", global: "SecretChatMinigame" },
  "day3-work-alert": { page: "day3.html", global: "WorkAlertMinigame" },
  "day4-office-escape": { page: "day4.html", global: "OfficeEscapeMinigame" },
});

test("미니게임은 기능 폴더 안에 런타임·스타일·테스트·dev 진입점을 함께 둔다", () => {
  for (const feature of Object.keys(FEATURES)) {
    const base = `minigames/${feature}`;
    for (const file of ["README.md", "index.js", "style.css", "tests", "dev/index.html"]) {
      assert.equal(exists(`${base}/${file}`), true, `${base}/${file}`);
    }
  }
  assert.equal(exists("minigames/shared/dev.css"), true);
});

test("본편 페이지는 기능별 공개 진입점만 로드한다", () => {
  for (const [feature, contract] of Object.entries(FEATURES)) {
    const html = read(contract.page);
    const entry = `minigames/${feature}/index.js`;
    assert.match(html, new RegExp(entry.replaceAll("/", "\\/")));
    assert.match(read(entry), new RegExp(`global\\.${contract.global}\\s*=`));
  }
});

test("레거시 js·css·dev 폴더에는 미니게임 구현 파일을 다시 두지 않는다", () => {
  const legacyFiles = [
    "js/coffee-minigame.js",
    "js/secret-chat-minigame.js",
    "js/work-alert-minigame.js",
    "js/office-escape-minigame.js",
    "css/coffee-minigame.css",
    "css/secret-chat-minigame.css",
    "css/work-alert-minigame.css",
    "css/office-escape-minigame.css",
    "dev/day2-secret-chat-minigame.html",
    "dev/day3-work-alert-minigame.html",
    "dev/day4-office-escape-minigame.html",
  ];
  assert.deepEqual(legacyFiles.filter(exists), []);
});

test("DAY 4 V044 설계 문서는 V2 런타임과 분리된 기능 내부 legacy에 보존한다", () => {
  assert.equal(exists("../DESIGN.md"), false);
  assert.equal(exists("../PRODUCT.md"), false);
  assert.equal(exists("minigames/day4-office-escape/docs/DESIGN.md"), false);
  assert.equal(exists("minigames/day4-office-escape/legacy/v044/docs/DESIGN.md"), true);
  assert.equal(exists("minigames/day4-office-escape/legacy/v044/docs/PRODUCT.md"), true);
});
