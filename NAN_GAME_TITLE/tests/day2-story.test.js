const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const story = require("../js/day2-story.js");

test("DAY 2 장면 ID와 필수 필드가 유효하다", () => {
  assert.deepEqual(story.validateScenes(), []);
  assert.equal(story.scenes[0].id, "day2IntroCard");
  assert.equal(story.scenes.at(-1).id, "day2End");
  assert.equal(story.scenes.at(-1).end, true);
});

test("세 가지 하위 업무가 각각 전용 장면을 가진다", () => {
  assert.deepEqual(Object.keys(story.SUBTASKS), ["competitor", "reviews", "journey"]);
  Object.keys(story.SUBTASKS).forEach((subtask) => {
    const visible = story.scenes.filter((scene) => story.isVisible(scene, { day2Subtask: subtask }));
    assert.equal(visible.some((scene) => scene.when?.equals === subtask), true);
  });
});

test("핵심 추리 단서는 자동화의 소유자만 기록하고 실행자를 단정하지 않는다", () => {
  const clue = story.CLUES.inactiveAutomation.detail;
  assert.match(clue, /등록 담당자: 서하린/);
  assert.match(clue, /마지막 실행: 2024-11-07 23:48/);
  assert.doesNotMatch(clue, /범인|실행자: 서하린/);
});

test("메신저 방은 실제 사람 또는 프로젝트 대화방 이름을 사용한다", () => {
  assert.equal(story.ROOMS.boss.title, "박태식 부장");
  assert.equal(story.ROOMS.harin.title, "서하린 사수");
  assert.equal(story.ROOMS.minjae.title, "강민재 동기");
  assert.equal(story.ROOMS.sea.title, "윤세아");
  assert.match(story.ROOMS.pt.title, /PT 전환과제 TF/);
});

test("DAY 2 시작부터 DAY 1 메신저 대화 기록을 이어서 보여준다", () => {
  const history = story.MESSAGES.filter((message) => message.time.startsWith("DAY 1"));
  assert.equal(history.length, 6);
  assert.ok(history.every((message) => message.at === "day2IntroCard"));
  assert.deepEqual(
    history.filter((message) => message.room === "boss").map((message) => message.id),
    [
      "day1-boss-brief",
      "day1-doyun-reply",
    ],
  );
  assert.deepEqual(
    history.filter((message) => message.room === "pt").map((message) => message.id),
    [
      "day1-harin-research",
      "day1-nanabot-notice",
      "day1-doyun-draft",
      "day1-harin-review",
    ],
  );
});

test("DAY 2 아침 인사 뒤에는 하린의 반응을 거쳐 업무 이야기로 넘어간다", () => {
  const reply = story.scenes.findIndex((entry) => entry.id === "day2ConvenienceReply");
  const reaction = story.scenes.findIndex((entry) => entry.id === "day2ConvenienceReaction");
  const smallTalkDoyun = story.scenes.findIndex((entry) => entry.id === "day2MorningSmallTalkDoyun");
  const smallTalkHarin = story.scenes.findIndex((entry) => entry.id === "day2MorningSmallTalkHarin");
  const work = story.scenes.findIndex((entry) => entry.id === "day2VerifyLead");
  assert.ok(reply < reaction && reaction < smallTalkDoyun && smallTalkDoyun < smallTalkHarin && smallTalkHarin < work);
  assert.equal(story.scenes[reaction].speaker, "서하린");
  assert.equal(story.scenes[reaction].dynamic, "introHarinReaction");
  assert.match(story.scenes[smallTalkDoyun].text, /지하철/);
  assert.match(story.scenes[smallTalkHarin].text, /저도요/);

  const smallTalkClose = story.scenes.findIndex((entry) => entry.id === "day2SmallTalkClose");
  const settleIn = story.scenes.findIndex((entry) => entry.id === "day2SettleIn");
  assert.ok(smallTalkHarin < smallTalkClose && smallTalkClose < settleIn && settleIn < work);
});

test("하린이 남기라고 한 계산식과 조회 링크가 검증 패널에 실제로 남는다", () => {
  const panel = story.scenes.find((entry) => entry.id === "day2VerifyPanel");
  assert.ok(panel.systemPanel.rows.some((row) => row.startsWith("계산식 ·")));
  assert.ok(panel.systemPanel.rows.some((row) => row.startsWith("조회 링크 ·")));
});

test("비밀 채팅을 부장에게 들키면 놀림을 받고, 그 외 등급에서는 나오지 않는다", () => {
  const tease = story.scenes.find((entry) => entry.id === "day2BossTease");
  const reaction = story.scenes.find((entry) => entry.id === "day2BossTeaseHarinReact");
  assert.equal(tease.speaker, "박태식");
  assert.deepEqual(tease.when, { decision: "secretChatOutcome", equals: "caught" });
  assert.equal(reaction.speaker, "서하린");
  assert.deepEqual(reaction.when, { decision: "secretChatOutcome", equals: "caught" });
  assert.equal(story.isVisible(tease, { secretChatOutcome: "caught" }), true);
  assert.equal(story.isVisible(tease, { secretChatOutcome: "perfect" }), false);
  assert.equal(story.isVisible(tease, { secretChatOutcome: "good" }), false);
  const replyIndex = story.scenes.findIndex((entry) => entry.id === "day2RequestResultReply");
  const teaseIndex = story.scenes.findIndex((entry) => entry.id === "day2BossTease");
  const reactionIndex = story.scenes.findIndex((entry) => entry.id === "day2BossTeaseHarinReact");
  assert.ok(replyIndex < teaseIndex && teaseIndex < reactionIndex);
});

test("DAY 2에서 하린의 동행 제안을 다시 밀어내면 호감도가 내려간다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day2OvertimeChoice");
  const choice = scene.choices.find((entry) => entry.value === "take-responsibility");
  assert.deepEqual(choice.delta, { work: 1, affection: -1, trust: -1 });
});

test("서하린은 DAY 2 출근 전에 메시지를 보내고 메신저 화면으로 연결된다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day2HarinMessage");
  const message = story.MESSAGES.find((entry) => entry.id === "harin-morning");
  assert.equal(scene.notification, "harin-morning");
  assert.equal(scene.messageFocus, "harin");
  assert.equal(message.time, "DAY 2 · 08:47");
  assert.match(message.text, /출근하면/);
  assert.match(story.scenes.find((entry) => entry.id === "day2HarinMessage").text, /지하철 안에서/);
});

test("도윤은 서하린의 메시지를 확인한 뒤 예의 있게 답장한다", () => {
  const replyScene = story.scenes.find((entry) => entry.id === "day2HarinReplyChoice");
  const replyMessage = story.MESSAGES.find((entry) => entry.id === "day2-doyun-harin-reply");
  assert.equal(replyScene.speaker, "한도윤");
  assert.equal(replyScene.choiceKey, "day2MorningReply");
  assert.equal(replyScene.choices.length, 3);
  assert.ok(replyScene.choices.every((choice) => /확인|감사|같이/.test(choice.reply)));
  assert.equal(replyMessage.room, "harin");
  assert.equal(replyMessage.at, "day2HarinReplyChoice");
  assert.equal(replyMessage.requiresDecision, "day2MorningReply");
});

test("DAY 2는 혼잡한 출근길 지하철에서 시작하고 사무실로 이동한다", () => {
  const intro = story.scenes.find((entry) => entry.id === "day2IntroCard");
  const arrival = story.scenes.find((entry) => entry.id === "day2OfficeArrival");
  assert.equal(intro.bgAssetId, "background.subway.morning");
  const artAssets = require("../js/art-assets.js");
  assert.match(artAssets.resolve("background.subway.morning"), /subway_morning_v003\.png$/);
  assert.equal(intro.bgm, "commute");
  assert.match(intro.location, /출근길 지하철/);
  assert.equal(arrival.bg, "office");
  assert.equal(arrival.bgm, "daily");
  const engine = fs.readFileSync(path.join(__dirname, "..", "js", "day2.js"), "utf8");
  assert.match(engine, /bgmManager\.preload\(\["commute", "daily"/);
  assert.match(arrival.location, /게임사업실/);
});

test("DAY 2에는 실제 변조가 발생하지 않는다", () => {
  const ending = story.scenes.find((scene) => scene.id === "day2End");
  assert.match(ending.text, /아직 이상 현상이 없습니다/);
  assert.equal(story.scenes.some((scene) => /변조되었습니다|파일이 바뀌었습니다/.test(scene.text || "")), false);
});

test("서하린의 DAY 2 대사는 도윤에게 해요체로 일관되게 말한다", () => {
  const byId = (id) => story.scenes.find((scene) => scene.id === id);
  const day1Review = story.MESSAGES.find((message) => message.id === "day1-harin-review");
  const restorePoint = story.MESSAGES.find((message) => message.id === "pt-restore-point");
  const overtimeChoices = byId("day2OvertimeChoice").choices;

  assert.equal(day1Review.text, "v0.1 확인했어요. 방향은 괜찮아요. 파일 버전 이름은 계속 유지해 주세요.");
  assert.equal(restorePoint.text, "DAY 2 검증 완료 복원 지점을 만들어 뒀어요. 통계 원본과 조사 링크도 연결해 뒀어요.");
  assert.equal(byId("day2SubtaskLead").text, "숫자만 보고 있으면 발표가 또 보고서가 돼요. 오전에는 작은 조사 하나를 끝내봐요.");
  assert.equal(byId("day2SubtaskC1").text, "설치 끝났어요. 시작할게요.");
  assert.equal(byId("day2ArchiveExit").text, "빌드부터 보고 와요. 이건 나중에 확인해도 돼요.");
  assert.match(byId("day2ExitLead").text, /오늘 일이 끝났다는 실감이 났다/);
  assert.equal(byId("day2OvertimeHarin1").text, "오늘 하위 조사 문장만 정리하면 끝나요. 한 시간 안에 끝내고 가요.");
  assert.equal(overtimeChoices.find((choice) => choice.value === "verify-record").reply, "맞아요. 이름만 보고 결론 내리지 않고 차근차근 확인하면 돼요.");
  assert.equal(overtimeChoices.find((choice) => choice.value === "take-responsibility").reply, "제 몫을 다하는 것과 혼자 남는 건 달라요. 오늘은 같이 가요.");
});

test("외부 식당에서 도윤과 민재는 동기답게 반말로 대화한다", () => {
  const lunchScenes = story.scenes.filter((scene) =>
    scene.id.startsWith("day2Lunch") && ["한도윤", "강민재"].includes(scene.speaker)
  );
  const fixedDialogue = lunchScenes.map((scene) => scene.text || "").join("\n");
  assert.doesNotMatch(fixedDialogue, /(습니다|습니까|네요|같은데요|해요)(?:[.?!]|$)/);

  const engine = fs.readFileSync(path.join(__dirname, "..", "js", "day2.js"), "utf8");
  const branchBlock = engine.match(/lunchBranchDoyun:\s*\{([\s\S]*?)\}\[subtask\]/)?.[1] || "";
  assert.doesNotMatch(branchBlock, /(습니다|습니까|네요|같은데요|해요)(?:[.?!]|$)/);
});
