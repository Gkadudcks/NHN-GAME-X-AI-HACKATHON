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
  assert.match(clue, /소유자: 서하린/);
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
  assert.equal(history.length, 7);
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
  assert.equal(history.find((message) => message.id === "harin-yesterday")?.room, "harin");
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
  assert.equal(overtimeChoices.find((choice) => choice.value === "verify-record").reply, "맞아요. 확인은 해야 해요. 이름만 보고 결론 내리지만 않으면 돼요.");
  assert.equal(overtimeChoices.find((choice) => choice.value === "take-responsibility").reply, "책임지는 것과 혼자 남는 건 다르다고 했어요. 오늘은 같이 가요.");
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
