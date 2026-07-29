"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const story = require("../js/day4-story.js");
const progressStore = require("../js/progress-store.js");

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("DAY 4 장면은 녹음 지원, 증빙 제출, 퇴근 미니게임 순서로 구성된다", () => {
  assert.deepEqual(story.validateScenes(story.scenes), []);
  const ids = story.scenes.map((scene) => scene.id);
  assert.ok(ids.indexOf("day4MoveStudio") < ids.indexOf("day4AuditRequest"));
  assert.ok(ids.indexOf("day4AuditRequest") < ids.indexOf("day4Submit"));
  assert.ok(ids.indexOf("day4Submit") < ids.indexOf("day4Escape"));
  assert.equal(story.scenes.find((scene) => scene.id === "day4Escape").startEscape, true);
});

test("DAY 4 선택지는 오전 관계·업무 선택과 오후 증빙 우선순위를 제공한다", () => {
  for (const id of ["day4HeadphoneChoice", "day4MicChoice", "day4EvidenceChoice"]) {
    const scene = story.scenes.find((item) => item.id === id);
    assert.equal(scene.choices.length, 3);
    assert.equal(scene.choices.every((choice) => choice.id && choice.text && choice.delta), true);
  }
});

test("DAY 4 선택지는 겹치지 않는 행동과 한글 능력치 태그를 사용한다", () => {
  const headphone = story.scenes.find((scene) => scene.id === "day4HeadphoneChoice");
  const engine = read("js/day4.js");
  const style = read("css/game.css");
  assert.deepEqual(headphone.choices.map((choice) => choice.id), ["matchPace", "yieldHeadphone", "untangleTogether"]);
  assert.match(engine, /work: "◆ 업무력"/);
  assert.match(engine, /affection: "♡ 호감도"/);
  assert.match(engine, /trust: "◇ 신뢰도"/);
  assert.match(engine, /filter\(\(\[key, value\]\) => STAT_LABELS\[key\] && value !== 0\)/);
  assert.match(engine, /stat-\$\{key\}/);
  assert.match(style, /\.stat-work/);
  assert.match(style, /\.stat-affection/);
  assert.match(style, /\.stat-trust/);
});

test("공용 능력치 카드는 업무력·호감도·신뢰도를 서로 다른 일러스트로 구분한다", () => {
  const style = read("css/game.css");
  assert.match(style, /nth-child\(1\).*--stat-accent:#4d8fc2/);
  assert.match(style, /nth-child\(2\).*--stat-accent:#df617d/);
  assert.match(style, /nth-child\(3\).*--stat-accent:#b58a42/);
  assert.match(style, /nth-child\(1\) i:before\{content:"▤"\}/);
  assert.match(style, /nth-child\(2\) i:before\{content:"♥"\}/);
  assert.match(style, /nth-child\(3\) i:before\{content:"◈"\}/);
});

test("DAY 4 핵심 기록은 안정적인 단서 ID와 정상 제출 수치를 가진다", () => {
  assert.deepEqual(Object.keys(story.CLUES).sort(), ["auditRequest", "evidenceSubmission", "verifiedRetention"]);
  assert.equal(Object.values(story.CLUES).every((clue) => clue.day === 4), true);
  const submission = story.scenes.find((scene) => scene.id === "day4Submit");
  assert.match(submission.system.rows.join(" "), /18\.4%/);
  assert.match(submission.system.rows.join(" "), /DAY 4 17:08/);
});

test("DAY 4 페이지는 스토리와 추격 미니게임을 엔진 전에 불러온다", () => {
  const html = read("day4.html");
  const storyIndex = html.indexOf('src="js/day4-story.js');
  const minigameIndex = html.indexOf('src="js/office-escape-minigame.js');
  const engineIndex = html.indexOf('src="js/day4.js');
  assert.ok(storyIndex >= 0 && storyIndex < minigameIndex && minigameIndex < engineIndex);
  assert.match(html, /office-escape-minigame\.css\?v=4/);
});

test("모든 DAY 자료 화면은 공용 PPT형 슬라이드 스타일을 사용한다", () => {
  for (const file of ["game.html", "day2.html", "day3.html", "day4.html"]) {
    const html = read(file);
    assert.match(html, /presentation-screen\.css\?v=2/);
    assert.match(html, /presentation-screen\.js\?v=1/);
  }
  const css = read("css/presentation-screen.css");
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /INTERNAL PRESENTATION/);
  assert.match(css, /\.system-panel\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.system-panel\.show\s*\{\s*display:\s*block/);
  assert.match(css, /\.system-panel\s*\{[^}]*position:\s*absolute[^}]*left:\s*50%/s);
  assert.match(css, /\.stage\.system-panel-active \.choice-result\s*\{\s*display:\s*none/);
  assert.match(css, /@keyframes presentation-screen-in/);
  assert.match(css, /@keyframes presentation-card-in/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\[data-variant="metric"\]/);
  assert.match(css, /\[data-variant="compare"\]/);
  assert.match(css, /\[data-variant="timeline"\]/);
  assert.match(css, /\[data-variant="flow"\]/);
  const renderer = read("js/presentation-screen.js");
  assert.match(renderer, /function variantFor/);
  assert.match(renderer, /PresentationScreen/);
});

test("DAY 4는 기존 게임 화면 구조와 승인된 아트를 재사용하고 미확보 장면만 텍스트로 남긴다", () => {
  const html = read("day4.html");
  const engine = read("js/day4.js");
  assert.match(html, /class="game" id="game"/);
  assert.match(html, /class="stage" id="stage"/);
  assert.match(html, /class="messenger" id="messenger"/);
  assert.match(html, /class="messenger-appbar"/);
  assert.match(html, /data-tab="messages-view"/);
  assert.match(html, /data-tab="clues-view"/);
  assert.match(html, /href="css\/game\.css\?v=27"/);
  assert.match(html, /src="js\/art-assets\.js\?v=4"/);
  assert.match(engine, /ArtAssets\.resolve\(scene\.bgAssetId\)/);
  assert.match(engine, /ArtAssets\.resolve\(entry\.assetId\)/);
  assert.match(engine, /const showPlaceholder = !hasBackground && !scene\.system/);
  const referencedIds = story.scenes.flatMap((scene) => [
    scene.bgAssetId,
    ...(scene.characters || []).map((entry) => entry.assetId),
  ]).filter(Boolean);
  assert.deepEqual([...new Set(referencedIds)].sort(), [
    "background.elevator_lobby.night",
    "background.office.night",
    "character.harin.arms_folded.concerned",
  ]);
});

test("DAY 4 저장은 이전 날짜 완료 상태와 시작 스냅샷을 보존한다", () => {
  const storage = memoryStorage();
  progressStore.startNewGame(storage);
  const started = progressStore.startDay4(storage);
  assert.equal(started.currentDay, 4);
  assert.equal(started.days[1].complete, true);
  assert.equal(started.days[2].complete, true);
  assert.equal(started.days[3].complete, true);
  assert.ok(started.day4StartSnapshot);
  assert.equal(started.days[4].sceneId, "day4Intro");
});

test("DAY 4는 공용 슬롯 UI로 진행을 저장하고 불러온다", () => {
  const html = read("day4.html");
  const engine = read("js/day4.js");
  assert.match(html, /id="save"/);
  assert.match(html, /id="load"/);
  assert.match(html, /id="game-save-modal"/);
  assert.match(html, /id="game-save-list"/);
  assert.match(engine, /GameProgress\.getSaveSlots\(localStorage\)/);
  assert.match(engine, /GameProgress\.saveManualSlot\(localStorage/);
  assert.match(engine, /openGameSave\("save"\)/);
  assert.match(engine, /openGameSave\("load"\)/);
  assert.match(engine, /localStorage\.setItem\(GameProgress\.STORAGE_KEY/);
  assert.match(engine, /openLoad: \(\) => openGameSave\("load"\)/);
});

test("DAY 4는 이전 DAY의 공용 게임 기능을 모두 연결한다", () => {
  const html = read("day4.html");
  const engine = read("js/day4.js");
  for (const id of ["choice-result", "sound-prompt", "message-sfx", "stat-help-popover", "day-summary", "day-complete"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /location-transition\.css\?v=2/);
  assert.match(html, /location-transition\.js\?v=2/);
  assert.match(engine, /GameLocationTransition\.install\(\)/);
  assert.match(engine, /playIfChanged\(/);
  assert.match(engine, /showChoiceResult\(/);
  assert.match(engine, /openChat\(roomId\)/);
  assert.match(engine, /openStatHelp\(button\)/);
  assert.match(engine, /toggleBgm/);
  assert.match(engine, /autoSaveAtCheckpoint\(scene\)/);
  assert.match(engine, /showDaySummary\(\)/);
  assert.match(engine, /hasBlockingUi\(\)/);
});

test("퇴근 미니게임은 방향키·Space·뒤따르는 부장 충돌 판정을 사용한다", () => {
  const script = read("js/office-escape-minigame.js");
  const style = read("css/office-escape-minigame.css");
  assert.match(script, /ArrowLeft/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /Space/);
  assert.match(script, /state\.bossX \+=/);
  assert.match(script, /state\.bossX \+ 42 >= state\.playerX/);
  assert.match(script, /grade = caught \? "caught" : elapsed <= 20 \? "perfect" : "close"/);
  assert.match(script, /type: "chair"/);
  assert.match(script, /oe-office-backdrop/);
  assert.match(script, /oe-progress-bar/);
  assert.match(style, /\.oe-chair:before/);
  assert.match(style, /\.oe-printer:before/);
  assert.match(style, /\.oe-office-desks/);
});

test("DAY 3 완료 화면에서 DAY 4를 시작할 수 있다", () => {
  assert.doesNotMatch(read("day3.html"), /id="day-complete-next"[^>]*disabled/);
  assert.match(read("js/day3.js"), /GameProgress\.startDay4\(localStorage\)/);
  assert.match(read("js/day3.js"), /day4\.html\?new=1/);
  assert.match(read("js/title-screen.js"), /Number\(slot\.day\) === 4 \? "day4\.html"/);
});
