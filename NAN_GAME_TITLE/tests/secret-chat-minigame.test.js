"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
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
