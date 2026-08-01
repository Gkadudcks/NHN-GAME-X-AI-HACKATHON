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

test("각 사적 메시지에는 현재 호감도에 맞는 서하린의 즉시 답장이 있다", () => {
  for (let index = 0; index < core.QUESTIONS.length; index += 1) {
    const low = core.messageReply(index, 1);
    const mid = core.messageReply(index, 2);
    const high = core.messageReply(index, 4);
    assert.ok(low && mid && high);
    assert.notEqual(low, high);
  }
  assert.match(core.messageReply(1, 2), /음료/);
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

test("전용 사무실 배경 에셋은 나중에 사용할 수 있도록 안정 ID로 등록되어 있다", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "secret-chat-minigame.js"), "utf8");
  const runtime = require("../js/art-assets.js");
  assert.equal(runtime.resolve("background.office.secret_chat"), "assets/backgrounds/office-secret-chat-pixel.png");
  assert.equal(fs.existsSync(path.join(__dirname, "..", runtime.resolve("background.office.secret_chat"))), true);
  assert.doesNotMatch(source, /background\.office\.secret_chat/);
});

test("현재 플레이 화면은 통창 도트 사무실과 확정된 답장 UI를 함께 렌더링한다", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "secret-chat-minigame.js"), "utf8");
  assert.doesNotMatch(source, /id="sc-office-background"/);
  assert.doesNotMatch(source, /class="sc-phone"/);
  assert.doesNotMatch(source, /class="sc-thread"/);
  assert.match(source, /class="sc-office-scene"/);
  assert.match(source, /class="sc-office-window"/);
  assert.match(source, /class="sc-mission"/);
  assert.match(source, /class="sc-message-preview"/);
  assert.match(source, /sc-pixel-actor sc-actor-boss/);
  assert.match(source, /sc-pixel-actor sc-actor-doyun/);
  assert.match(source, /sc-pixel-actor sc-actor-harin/);
  assert.match(source, /sc-pixel-actor sc-actor-minjae/);
  assert.match(source, /class="sc-boss-back"/);
  assert.match(source, /class="sc-boss-front"/);
  assert.match(source, /shape-rendering="crispEdges"/);
  assert.match(source, /id="sc-scene-reply"/);
  assert.match(source, /id="sc-scene-result"/);
  assert.match(source, /id="sc-scene-warning"/);
});

test("미니게임 상황 변화는 전용 주의·발각·성공 효과음을 호출한다", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "secret-chat-minigame.js"), "utf8");
  assert.match(source, /playMinigameCue\?\.\("warning"\)/);
  assert.match(source, /playMinigameCue\?\.\("caught"\)/);
  assert.match(source, /playMinigameCue\?\.\("success"\)/);
  assert.match(source, /lastPhase: "safe"/);
});

test("부장 도트 캐릭터는 부장 책상보다 높은 레이어에서 보인다", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "secret-chat-minigame.css"), "utf8");
  const deskLayer = Number(css.match(/\.sc-boss-desk\s*\{[\s\S]*?z-index:\s*(\d+)/)?.[1]);
  const bossLayer = Number(css.match(/\.sc-actor-boss\s*\{[^}]*z-index:\s*(\d+)/)?.[1]);
  assert.ok(Number.isFinite(deskLayer));
  assert.ok(Number.isFinite(bossLayer));
  assert.ok(bossLayer > deskLayer, `${bossLayer} > ${deskLayer}`);
});
