"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const story = require("../js/day3-story.js");
const day2Story = require("../js/day2-story.js");

test("DAY 3 keeps the DAY 2 chat rooms and chat history", () => {
  assert.equal(story.ROOMS, day2Story.ROOMS);
  assert.equal(story.MESSAGES.length, day2Story.MESSAGES.length + 5);
  assert.ok(story.ROOMS.sea);
  assert.deepEqual(
    story.MESSAGES.slice(0, day2Story.MESSAGES.length).map((message) => message.day),
    day2Story.MESSAGES.map((message) => /^DAY\s*1\b/i.test(String(message.time || "")) ? 1 : 2),
  );
  assert.deepEqual(story.MESSAGES.slice(-5).map((message) => message.day), [3, 3, 3, 3, 3]);
});

test("Harin keeps her DAY 3 dialogue in the haeyo style", () => {
  const harinScenes = story.scenes.filter((scene) => scene.speaker === "서하린").map((scene) => scene.text || "").join("\n");

  assert.match(harinScenes, /하면 돼요/);
  assert.match(harinScenes, /제 이름이 있는 건 부정하지 않을게요/);
  assert.doesNotMatch(harinScenes, /하면 됩니다|내 이름을 지우지/);
});

test("하린은 첫 변조를 발견했을 때 당황한 뒤 보존 조치를 지시한다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day3HarinSeesChange");
  assert.match(scene.text, /^잠깐만요\./);
  assert.match(scene.text, /제가 검토한 문장이 아닌데요\?/);
  assert.match(scene.text, /지금 상태와 변경 기록부터 남겨요\.$/);
  assert.equal(scene.char, "harin");
});

test("하린은 수정 기록에서 자기 이름을 발견한 장면에 당황 스프라이트를 사용한다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day3HarinResponse");
  assert.match(scene.text, /왜 제 이름이 여기 남아 있죠\?/);
  assert.equal(scene.characters[0].assetId, "character.harin.hand_to_chest.surprised");
});

test("DAY 3 장면 ID와 필수 필드가 유효하다", () => {
  assert.deepEqual(story.validateScenes(story.scenes), []);
});

test("DAY 3은 첫 변조를 확인하지만 실행자를 단정하지 않는다", () => {
  const text = JSON.stringify(story.scenes);
  assert.match(text, /DAY 3 최초 변경본|직접 접근 여부 미확정/);
  assert.doesNotMatch(text, /강민재가 실행자|서하린이 범인/);
});

test("DAY 3 핵심 단서는 모두 구조화 레코드를 참조한다", () => {
  assert.equal(Object.keys(story.CLUES).length, 6);
  Object.values(story.CLUES).forEach((clue) => {
    assert.equal(clue.day, 3);
    assert.ok(clue.id && clue.title && clue.detail);
  });
});

test("의심 선택은 몰아붙이기·검증·맹목적 신뢰를 구분한다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day3Decision");
  assert.deepEqual(scene.choices.map((choice) => choice.id), ["accuse", "verify", "blindTrust"]);
  assert.ok(scene.choices.find((choice) => choice.id === "verify").delta.trust > 0);
});

test("하린에 대한 판단은 직접 접근 기록을 보기 전에 내려진다", () => {
  const decision = story.scenes.findIndex((scene) => scene.id === "day3Decision");
  const accessLog = story.scenes.findIndex((scene) => scene.id === "day3AccessLog");
  assert.ok(decision >= 0 && decision < accessLog);
});

test("플레이어가 세 조사 기록 중 첫 순서를 선택한다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day3InvestigationStart");
  assert.deepEqual(scene.choices.map((choice) => choice.id), ["access", "automation", "folder"]);
  assert.equal(story.isVisible(story.scenes.find((entry) => entry.id === "day3AccessLogFirst"), { investigationFirst: "access" }), true);
  assert.equal(story.isVisible(story.scenes.find((entry) => entry.id === "day3AccessLog"), { investigationFirst: "access" }), false);
});

test("몰래 연락에 실패하면 하린의 확인 답변이 점심 뒤로 미뤄진다", () => {
  const delayed = story.scenes.find((scene) => scene.id === "day3HarinDelayedReply");
  const firstMessage = story.MESSAGES.find((message) => message.id === "d3-harin-check");
  assert.equal(delayed.when.equals, "caught");
  assert.equal(firstMessage.dynamic, "secretChatMessage");
});

test("DAY 3 BGM은 이야기 구간이 바뀔 때만 전환한다", () => {
  const cues = story.scenes
    .filter((scene) => scene.bgm)
    .map((scene) => [scene.id, scene.bgm]);

  assert.deepEqual(cues, [
    ["day3IntroCard", "daily"],
    ["day3OpenDocument", "mystery"],
    ["day3PrivateContactLead", "minigame"],
    ["day3MinigameResult", "daily"],
    ["day3InvestigationStart", "mystery"],
    ["day3Summary", "daily"],
    ["day3EveningMessage", "harin"],
  ]);
});
