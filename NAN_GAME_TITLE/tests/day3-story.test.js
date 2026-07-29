"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const story = require("../js/day3-story.js");
const day2Story = require("../js/day2-story.js");
const engine = fs.readFileSync(path.join(__dirname, "..", "js", "day3.js"), "utf8");

test("DAY 3 keeps the DAY 2 chat rooms and chat history", () => {
  assert.equal(story.ROOMS, day2Story.ROOMS);
  assert.equal(story.MESSAGES.length, day2Story.MESSAGES.length + 5);
  assert.ok(story.ROOMS.boss);
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
  assert.match(harinScenes, /제 이름/);
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

test("엘리베이터 CG는 충분한 호감도에서만 일반 대사 앞에 노출된다", () => {
  const cg = story.scenes.find((scene) => scene.id === "day3ElevatorCg");
  const after = story.scenes.find((scene) => scene.id === "day3ElevatorAfterCg");
  const fallback = story.scenes.find((scene) => scene.id === "day3DepartureHarin");
  assert.equal(story.isVisible(cg, {}, { affectionBeforeChat: 4 }), true);
  assert.equal(story.isVisible(after, {}, { affectionBeforeChat: 4 }), true);
  assert.equal(story.isVisible(fallback, {}, { affectionBeforeChat: 4 }), false);
  assert.equal(story.isVisible(cg, {}, { affectionBeforeChat: 3 }), false);
  assert.equal(story.isVisible(fallback, {}, { affectionBeforeChat: 3 }), true);
  assert.equal(cg.cgAssetId, "event_cg.day3.elevator_waiting");
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
  const minigame = story.scenes.findIndex((scene) => scene.id === "day3SecretChatStart");
  const accessLog = story.scenes.findIndex((scene) => scene.id === "day3AccessLog");
  assert.ok(decision >= 0 && decision < minigame && minigame < accessLog);
});

test("조사 확인 뒤 변조 관련 요청 대응 미니게임을 시작한다", () => {
  const workContact = story.scenes.findIndex((scene) => scene.id === "day3WorkContact");
  const workCheck = story.scenes.findIndex((scene) => scene.id === "day3HarinWorkCheck");
  const pressure = story.scenes.findIndex((scene) => scene.id === "day3BossPressure");
  const lead = story.scenes.findIndex((scene) => scene.id === "day3PrivateContactLead");
  const objective = story.scenes.findIndex((scene) => scene.id === "day3ContactObjective");
  const start = story.scenes.findIndex((scene) => scene.id === "day3SecretChatStart");
  assert.ok(workContact < workCheck && workCheck < pressure && pressure < lead && lead < objective && objective < start);
  assert.match(story.scenes[workCheck].text, /문서를 직접 열지 않았어요|자동화|복원 지점/);
  assert.match(story.scenes[objective].text, /변조 조사와 일반 업무 요청/);
  assert.equal(story.scenes[lead].startWorkAlert, undefined);
  assert.equal(story.scenes[start].startWorkAlert, true);
});

test("플레이어가 세 조사 기록 중 첫 순서를 선택한다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day3InvestigationStart");
  assert.deepEqual(scene.choices.map((choice) => choice.id), ["access", "automation", "folder"]);
  assert.equal(story.isVisible(story.scenes.find((entry) => entry.id === "day3AccessLogFirst"), { investigationFirst: "access" }), true);
  assert.equal(story.isVisible(story.scenes.find((entry) => entry.id === "day3AccessLog"), { investigationFirst: "access" }), false);
});

test("구내식당 뒤에는 사무실 복귀와 정리 대사를 거쳐 조사를 시작한다", () => {
  const lunchEnd = story.scenes.findIndex((scene) => scene.id === "day3HarinPastBoundary");
  const officeReturn = story.scenes.findIndex((scene) => scene.id === "day3OfficeReturn");
  const investigation = story.scenes.findIndex((scene) => scene.id === "day3InvestigationStart");
  assert.ok(lunchEnd < officeReturn && officeReturn < investigation);
  assert.equal(story.scenes[officeReturn].location, "게임사업실 · 오후");
  assert.match(story.scenes[officeReturn].text, /추측은 잠시 내려놓고/);
});

test("구내식당에서는 능력치 부담 없이 점심 메뉴를 골라 환기한다", () => {
  const lunchChoice = story.scenes.find((scene) => scene.id === "day3LunchChoice");
  const lunch = story.scenes.findIndex((scene) => scene.id === "day3Lunch");
  const choice = story.scenes.findIndex((scene) => scene.id === "day3LunchChoice");
  assert.deepEqual(lunchChoice.choices.map((item) => item.id), ["porkCutlet", "stew", "salad"]);
  assert.ok(lunchChoice.choices.every((item) => Object.keys(item.delta).length === 0));
  assert.ok(choice < lunch);
  assert.equal(lunchChoice.location, "구내식당 · 점심");
});

test("조사 답변은 미니게임 결과와 무관하고 조사 후속 메시지만 결과에 따라 바뀐다", () => {
  const delayed = story.scenes.find((scene) => scene.id === "day3HarinDelayedReply");
  const workMessage = story.MESSAGES.find((message) => message.id === "d3-harin-check");
  const resultMessage = story.MESSAGES.find((message) => message.id === "d3-harin-investigation");
  assert.equal(delayed, undefined);
  assert.match(workMessage.text, /자동화|복원 지점/);
  assert.equal(resultMessage.dynamic, "workAlertMessage");
});

test("DAY 3 선택 완료 후 장면 전환 잠금과 다음 버튼을 해제한다", () => {
  assert.match(engine, /sceneTransitionLocked\s*=\s*false;\s*refs\.next\.disabled\s*=\s*false;/);
  assert.match(engine, /requestAnimationFrame\(\(\)\s*=>\s*\{[\s\S]*activeScene\s*===\s*scene[\s\S]*refs\.next\.disabled\s*=\s*false/);
  assert.match(engine, /function resolveDynamic\(name\)\s*\{[\s\S]*const affectionBeforeChat\s*=\s*state\.affection;/);
});

test("부장의 점심 전 보고 지시는 실제 조사 방향 보고로 회수된다", () => {
  const pressure = story.scenes.findIndex((scene) => scene.id === "day3BossPressure");
  const report = story.scenes.findIndex((scene) => scene.id === "day3BossReport");
  const response = story.scenes.findIndex((scene) => scene.id === "day3BossReportResponse");
  const lunch = story.scenes.findIndex((scene) => scene.id === "day3LunchChoice");
  assert.ok(pressure < report && report < response && response < lunch);
  assert.equal(story.scenes[report].dynamic, "bossReport");
});

test("첫 조사 기록 뒤에는 선택한 근거에 따른 임시 판단이 나온다", () => {
  const firstLogs = ["day3AccessLogFirst", "day3AutomationLogFirst", "day3FolderPathFirst"]
    .map((id) => story.scenes.findIndex((scene) => scene.id === id));
  const inference = story.scenes.findIndex((scene) => scene.id === "day3FirstInference");
  const reaction = story.scenes.findIndex((scene) => scene.id === "day3InvestigationReaction");
  assert.ok(firstLogs.every((index) => index < inference));
  assert.ok(inference < reaction);
  assert.equal(story.scenes[inference].dynamic, "firstInvestigationInference");
});

test("일일 정산 뒤에는 하린과의 실제 퇴근 장면이 이어진다", () => {
  const summary = story.scenes.findIndex((scene) => scene.id === "day3Summary");
  const departure = story.scenes.findIndex((scene) => scene.id === "day3DepartureLead");
  const harin = story.scenes.findIndex((scene) => scene.id === "day3DepartureHarin");
  const message = story.scenes.findIndex((scene) => scene.id === "day3EveningMessage");
  assert.ok(summary < departure && departure < harin && harin < message);
  assert.equal(story.scenes[departure].location, "게임사업실 · 퇴근");
});

test("DAY 3 BGM은 이야기 구간이 바뀔 때만 전환한다", () => {
  const cues = story.scenes
    .filter((scene) => scene.bgm)
    .map((scene) => [scene.id, scene.bgm]);

  assert.deepEqual(cues, [
    ["day3IntroCard", "daily"],
    ["day3OpenDocument", "mystery"],
    ["day3SecretChatStart", "minigame"],
    ["day3MinigameResult", "daily"],
    ["day3OfficeReturn", "mystery"],
    ["day3Summary", "daily"],
    ["day3DepartureLead", "harin"],
  ]);
});
