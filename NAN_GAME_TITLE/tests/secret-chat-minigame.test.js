"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("../js/secret-chat-minigame.js");

test("개인 연락은 낮은 호감도에 맞는 가벼운 잡담 세 개로 구성된다", () => {
  assert.equal(core.QUESTIONS.length, 3);
  assert.match(core.QUESTIONS.join(" "), /점심|편의점|커피/);
  assert.doesNotMatch(core.QUESTIONS.join(" "), /반가웠|같이 걸을래/);
});

test("세 메시지를 경고 없이 보내면 호감도가 크게 오른다", () => {
  assert.deepEqual(core.grade({ sent: 3, warnings: 0, elapsed: 40 }), { grade: "perfect", workDelta: 0, affectionDelta: 2 });
});

test("실패하면 호감도 보상 없이 업무력만 감점한다", () => {
  assert.deepEqual(core.grade({ sent: 1, warnings: 3, elapsed: 20 }), { grade: "caught", workDelta: -1, affectionDelta: 0 });
});

test("같은 미니게임 결과라도 현재 호감도에 따라 하린의 답장이 달라진다", () => {
  const low = core.reply("good", 1);
  const mid = core.reply("good", 2);
  const high = core.reply("good", 4);
  assert.match(low.dialogue, /조사 끝나고/);
  assert.match(mid.dialogue, /점심 메뉴/);
  assert.match(high.dialogue, /같이 고르러/);
  assert.notEqual(low.message, high.message);
});

test("들킨 경우에도 호감도가 높아도 직진하는 퇴근 약속은 하지 않는다", () => {
  assert.match(core.reply("caught", 4).dialogue, /커피 얘기/);
  assert.doesNotMatch(core.reply("caught", 4).dialogue, /기다릴게요|같이 퇴근/);
});

test("몰래 연락 화면은 게임 공용 크림·코랄 미니게임 테마를 사용한다", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "secret-chat-minigame.css"), "utf8");
  assert.match(css, /var\(--coral/);
  assert.match(css, /var\(--ink/);
  assert.match(css, /#fff9f2f7/);
  assert.match(css, /linear-gradient\(135deg,\s*#ec7279,\s*#d95462\)/);
  assert.doesNotMatch(css, /background:\s*linear-gradient\(145deg,#211927,#120e17\)/);
});
