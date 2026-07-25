"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("../js/secret-chat-minigame.js");

test("몰래 연락은 추리에 필요한 질문 세 개로 구성된다", () => {
  assert.equal(core.QUESTIONS.length, 3);
  assert.match(core.QUESTIONS.join(" "), /PT 문서|자동화|복원 지점/);
});

test("세 질문을 경고 없이 보내면 완벽 등급이다", () => {
  assert.deepEqual(core.grade({ sent: 3, warnings: 0, elapsed: 40 }), { grade: "perfect", workDelta: 2, trustDelta: 1 });
});

test("실패해도 게임오버 대신 업무력만 감점한다", () => {
  assert.deepEqual(core.grade({ sent: 1, warnings: 3, elapsed: 20 }), { grade: "caught", workDelta: -1, trustDelta: 0 });
});

test("몰래 연락 화면은 게임 공용 크림·코랄 미니게임 테마를 사용한다", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "secret-chat-minigame.css"), "utf8");
  assert.match(css, /var\(--coral/);
  assert.match(css, /var\(--ink/);
  assert.match(css, /#fff9f2f7/);
  assert.match(css, /linear-gradient\(135deg,\s*#ec7279,\s*#d95462\)/);
  assert.doesNotMatch(css, /background:\s*linear-gradient\(145deg,#211927,#120e17\)/);
});
