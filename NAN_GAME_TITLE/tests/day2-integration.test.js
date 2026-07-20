const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("DAY 2 페이지는 필요한 스크립트를 올바른 순서로 불러온다", () => {
  const html = read("day2.html");
  const progress = html.indexOf('src="js/progress-store.js');
  const story = html.indexOf('src="js/day2-story.js');
  const minigame = html.indexOf('src="js/work-alert-minigame.js');
  const engine = html.indexOf('src="js/day2.js');
  assert.equal([progress, story, minigame, engine].every((index) => index >= 0), true);
  assert.equal(progress < story && story < minigame && minigame < engine, true);
});

test("DAY 2 엔진이 참조하는 정적 ID가 페이지에 존재한다", () => {
  const html = read("day2.html");
  const script = read("js/day2.js");
  const ids = [...script.matchAll(/\$\("#([a-z0-9-]+)"\)/gi)].map((match) => match[1]);
  const missing = [...new Set(ids)].filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, []);
});

test("DAY 1 종료는 공유 진행을 저장하고 DAY 2로 이동한다", () => {
  const html = read("game.html");
  const script = read("js/game.js");
  assert.match(html, /progress-store\.js/);
  assert.match(script, /syncCanonicalProgress\(true\)/);
  assert.match(script, /GameProgress\.startDay2/);
  assert.match(script, /day2\.html\?new=1/);
});

test("타이틀 이어하기는 선택한 수동 슬롯의 진행과 날짜를 복원한다", () => {
  const html = read("index.html");
  const script = read("js/title-screen.js");
  assert.match(html, /progress-store\.js/);
  assert.match(script, /nan-save-slot-/);
  assert.match(script, /GameProgress\.STORAGE_KEY/);
  assert.match(script, /GameProgress\.LEGACY_DAY1_KEY/);
  assert.match(script, /day2\.html/);
  assert.match(script, /resumeUrl/);
});

test("DAY 종료 화면은 다음 날과 메인 메뉴 선택지를 제공한다", () => {
  const day1 = read("game.html");
  const day2 = read("day2.html");
  for (const html of [day1, day2]) {
    assert.match(html, /id="day-complete-next"/);
    assert.match(html, /id="day-complete-menu"/);
    assert.match(html, /id="day-transition"/);
  }
  assert.match(read("js/game.js"), /function goToNextDay\(\)/);
  assert.match(read("js/game.js"), /day2\.html\?new=1/);
});

test("DAY 2 BGM은 실제 루프 편집본을 사용한다", () => {
  const script = read("js/day2.js");
  for (const track of ["daily", "minigame", "harin", "overtime", "mystery"]) {
    assert.match(script, new RegExp(`audio/looped/${track}\\.ogg`));
  }
  assert.doesNotMatch(script, /audio\/(?:2\. 일상|3\. 서하린과의 일상|4\. 야근|5\. 추리|MiniGame-theme)\.mp3/);
});

test("게임 화면은 재시작 대신 별도 진행 저장 영역을 제공한다", () => {
  for (const page of ["game.html", "day2.html"]) {
    const html = read(page);
    assert.match(html, /class="save-progress-panel"/);
    assert.match(html, /id="save"/);
    assert.match(html, /id="load"/);
    assert.doesNotMatch(html, /id="restart"/);
  }
});

test("진행 저장은 이어하기와 연동되는 카드형 슬롯을 연다", () => {
  for (const page of ["game.html", "day2.html"]) {
    const html = read(page);
    assert.match(html, /id="game-save-modal"/);
    assert.match(html, /id="game-save-list"/);
  }
  assert.match(read("js/game.js"), /function openGameSave\(mode='save'\)/);
  assert.match(read("js/day2.js"), /function openGameSave\(mode = "save"\)/);
  assert.match(read("js/game.js"), /Array\.from\(\{length:5\}/);
  assert.match(read("js/day2.js"), /Array\.from\(\{ length: 5 \}/);
  assert.match(read("js/title-screen.js"), /slot\.progress/);
});

test("게임 안에서도 수동 저장 슬롯을 불러올 수 있다", () => {
  for (const scriptName of ["js/game.js", "js/day2.js"]) {
    const script = read(scriptName);
    assert.match(script, /function loadFromGameSlot\(slot\)/);
    assert.match(script, /GameProgress\.STORAGE_KEY/);
    assert.match(script, /GameProgress\.LEGACY_DAY1_KEY/);
    assert.match(script, /openGameSave\(['"]load['"]\)/);
  }
});

test("중간 슬롯을 불러와도 직전 장면의 배경과 BGM을 복원한다", () => {
  for (const scriptName of ["js/game.js", "js/day2.js"]) {
    const script = read(scriptName);
    assert.match(script, /function inheritedSceneValue\(index,\s*key\)/);
    assert.match(script, /inheritedSceneValue\(state\.index,\s*["']bg["']\)/);
    assert.match(script, /inheritedSceneValue\(state\.index,\s*["']bgm["']\)/);
  }
});

test("장면 전환은 연속 입력과 모달 뒤쪽 진행을 차단한다", () => {
  const day1 = read("js/game.js");
  const day2 = read("js/day2.js");
  for (const script of [day1, day2]) {
    assert.match(script, /sceneTransitionLocked/);
    assert.match(script, /hasBlockingUi\(\)/);
  }
  assert.match(day1, /preloadSceneImage/);
  assert.match(day1, /refs\.dialogue\.textContent=cinematic\?'':s\.text/);
  assert.match(day1, /cinematicTimer=setTimeout\(\(\)=>\{refs\.speaker\.textContent=scene\.speaker;refs\.dialogue\.textContent=scene\.text/);
  const gameCss = read("css/game.css");
  assert.doesNotMatch(gameCss, /cinematic-only \.event-cg\{transition:none\}/);
  assert.match(gameCss, /cinematic-cg-reveal/);
  assert.match(gameCss, /cinematic-only \.event-cg:after/);
});

test("왼쪽 대사 진행은 오른쪽 메신저·단서 탭을 바꾸지 않는다", () => {
  assert.doesNotMatch(read("js/game.js"), /setTab\('messages-view'\)/);
  assert.doesNotMatch(read("js/day2.js"), /setTab\("messages-view"\)/);
});
