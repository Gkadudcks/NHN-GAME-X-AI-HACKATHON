const test = require("node:test");
const assert = require("node:assert/strict");
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
    history.filter((message) => message.room === "pt").map((message) => message.id),
    [
      "day1-boss-brief",
      "day1-doyun-reply",
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
