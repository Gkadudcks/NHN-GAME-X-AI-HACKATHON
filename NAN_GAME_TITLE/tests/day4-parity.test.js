"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const story = require("../js/day4-story.js");
const progressStore = require("../js/progress-store.js");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("DAY 4 메신저는 이전 DAY 대화를 누적하고 장면별 알림과 읽지 않음 상태를 지원한다", () => {
  const engine = read("js/day4.js");
  const html = read("day4.html");
  assert.ok(story.MESSAGES.some((message) => message.day < 4));
  assert.deepEqual(Object.keys(story.ROOMS), ["boss", "pt", "harin", "minjae", "sea"]);
  for (const id of ["d4-boss-recording", "d4-harin-studio", "d4-harin-audit", "d4-pt-evidence", "d4-pt-submit"]) {
    assert.ok(story.MESSAGES.some((message) => message.id === id));
  }
  for (const room of Object.keys(story.ROOMS)) assert.match(html, new RegExp(`id="chat-${room}"`));
  assert.match(engine, /function visibleMessages/);
  assert.match(engine, /function unreadCount/);
  assert.match(engine, /function notifyMessage/);
  assert.match(engine, /playMessageSfx/);
  assert.match(engine, /message-day-divider/);
});

test("DAY 4 캐릭터는 키·위치·화자·프레이밍과 이미지 오류 처리를 DAY 3 수준으로 지원한다", () => {
  const engine = read("js/day4.js");
  assert.match(engine, /farLeft: 18/);
  assert.match(engine, /farRight: 82/);
  assert.match(engine, /scene\.activeCharacter/);
  assert.match(engine, /"speaking" : "listening"/);
  assert.match(engine, /framing-/);
  assert.match(engine, /--sprite-height/);
  assert.match(engine, /image\.onerror = \(\) => image\.remove\(\)/);
});

test("DAY 4 CG는 프리로드·시네마틱 일시정지·갤러리 해금을 지원한다", () => {
  const engine = read("js/day4.js");
  const cgScene = story.scenes.find((scene) => scene.cgAssetId);
  assert.equal(cgScene.cinematicDelay, 1800);
  assert.match(engine, /function preloadSceneImages/);
  assert.match(engine, /function unlockCg/);
  assert.match(engine, /nan-unlocked-cgs-v1/);
  assert.match(engine, /function pauseCinematic/);
  assert.match(engine, /function resumeCinematic/);
  assert.match(engine, /nan:settings-open/);
  assert.match(engine, /nan:settings-close/);
});

test("DAY 4는 단서 읽음·호감도 잠금·미니게임 차단·도움말 접근성을 유지한다", () => {
  const engine = read("js/day4.js");
  assert.match(engine, /state\.unreadClues = !\$\("#clues-view"\)\.classList\.contains\("active"\)/);
  assert.match(engine, /"unread:clues": state\.unreadClues/);
  assert.match(engine, /function choiceLock/);
  assert.match(engine, /disabled class="choice-locked"/);
  assert.match(engine, /escapeActive/);
  assert.match(engine, /cinematicLocked/);
  assert.match(engine, /restoreFocus/);
  assert.match(engine, /window\.addEventListener\("resize"/);
  assert.match(engine, /document\.addEventListener\("scroll"/);
});

test("DAY 4 저장 스키마는 알림과 정산 상태를 손실하지 않는다", () => {
  const storage = {
    value: null,
    getItem() { return this.value; },
    setItem(_key, value) { this.value = value; },
    removeItem() { this.value = null; },
  };
  const progress = progressStore.startDay4(storage);
  progress.days[4].seenNotifications["notified:d4-boss-recording"] = true;
  progress.days[4].summariesSeen[4] = true;
  progressStore.save(storage, progress);
  const restored = progressStore.load(storage);
  assert.equal(restored.days[4].seenNotifications["notified:d4-boss-recording"], true);
  assert.equal(restored.days[4].summariesSeen[4], true);
});

test("DAY 4 장소 전환은 이미지 준비 후 실행하고 도착 메시지를 지연 전달한다", () => {
  const engine = read("js/day4.js");
  assert.ok(engine.indexOf("await preloadSceneImages(targetScene)") < engine.indexOf("await locationTransition.playIfChanged"));
  assert.ok(engine.indexOf("await locationTransition.playIfChanged") < engine.indexOf("notifyMessage(targetScene.notification)"));
  assert.match(engine, /setTimeout\(resolve, 500\)/);
  assert.match(engine, /deferNextNotification/);
});

test("DAY 4 설정 변경은 현재 BGM 볼륨과 음소거 UI에 즉시 반영된다", () => {
  const engine = read("js/day4.js");
  const html = read("day4.html");
  assert.match(engine, /window\.BGMManager = bgmManager/);
  assert.match(engine, /bgmManager\.setVolume\(GameSettingsDialog\.effectiveBgmVolume\(settings\)\)/);
  assert.match(engine, /function syncBgmUi/);
  assert.match(engine, /getBgmVolume\(\) > 0/);
  assert.match(html, /src="js\/day4\.js\?v=17"/);
});
