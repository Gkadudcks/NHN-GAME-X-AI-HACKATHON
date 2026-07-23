const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("DAY 2 페이지는 필요한 스크립트를 올바른 순서로 불러온다", () => {
  const html = read("day2.html");
  const records = html.indexOf('src="js/clue-records.js');
  const progress = html.indexOf('src="js/progress-store.js');
  const clues = html.indexOf('src="js/clue-mindmap.js');
  const art = html.indexOf('src="js/art-assets.js');
  const story = html.indexOf('src="js/day2-story.js');
  const bgm = html.indexOf('src="js/bgm-manager.js');
  const minigame = html.indexOf('src="js/work-alert-minigame.js');
  const engine = html.indexOf('src="js/day2.js');
  assert.equal([records, progress, clues, art, story, bgm, minigame, engine].every((index) => index >= 0), true);
  assert.equal(records < progress && progress < art && art < story && story < clues && clues < bgm && bgm < minigame && minigame < engine, true);
});

test("두 날짜 모두 단서 탭에서 메신저 숫자 배지를 표시할 수 있다", () => {
  const day1Html = read("game.html");
  const day2Html = read("day2.html");
  const day1Script = read("js/game.js");
  const day2Script = read("js/day2.js");

  assert.match(day1Html, /id="message-new"/);
  assert.match(day2Html, /id="message-new"/);
  assert.match(day1Script, /renderMessageTabAlert/);
  assert.match(day2Script, /renderMessageTabAlert/);
  assert.match(day1Script, /unreadCount/);
  assert.match(day2Script, /unreadCount/);
  assert.match(day1Script, /clearUnread/);
  assert.match(day2Script, /clearUnread/);
  assert.doesNotMatch(day1Script, /setTab\('messages-view'\);render\(\)/);
  assert.doesNotMatch(day2Script, /setTab\("messages-view"\);\s*saveProgress/);
});

test("읽지 않은 메시지가 0개면 배지를 숨기고 탭은 작게, 내부 본문은 크게 표시한다", () => {
  const css = read("css/game.css");
  assert.match(css, /\.chat-meta em\[hidden\]\{display:none\}/);
  assert.match(css, /\.messenger-tabs button\{padding:0 28px;font-size:13px\}/);
  assert.match(css, /\.message p\{font-size:14px;line-height:1\.6\}/);
  assert.match(css, /\.clue-detail-orbit p\{max-height:82px;overflow:hidden;font-size:13px/);
  assert.match(css, /\.clue-inspector p\{[^}]*font-size:14px[^}]*line-height:1\.7/);
});

test("윤세아 런타임 ID는 manifest의 활성 파일과 일치한다", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "..", "assets", "art", "manifests", "art-assets.json"), "utf8"));
  const runtime = require("../js/art-assets.js");
  const asset = manifest.assets.find((entry) => entry.id === "character.sea.neutral_standing.gentle_smile");
  const version = asset.versions.find((entry) => entry.version === asset.active_version);
  const runtimePath = runtime.resolve(asset.id).replace(/^\.\.\//, "");

  assert.equal(runtimePath, version.path);
  assert.equal(fs.existsSync(path.resolve(root, runtime.resolve(asset.id))), true);
  assert.match(read("js/day2.js"), /assetId: "character\.sea\.neutral_standing\.gentle_smile"/);
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
  const day2 = read("js/day2.js");
  const manager = read("js/bgm-manager.js");
  const script = manager;
  for (const track of ["minigame", "harin", "overtime", "mystery"]) {
    assert.match(manager, new RegExp(`audio/looped/${track}\\.ogg`));
  }
  assert.match(manager, /audio\/looped\/daily\.ogg/);
  assert.match(day2, /new GameBgmManager/);
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

test("DAY 2 야근 커피 장면은 승인된 서하린 피곤 스프라이트를 사용한다", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "..", "assets", "art", "manifests", "art-assets.json"), "utf8"));
  const runtime = require("../js/art-assets.js");
  const id = "character.harin.holding_cup.tired";
  const asset = manifest.assets.find((entry) => entry.id === id);
  const version = asset.versions.find((entry) => entry.version === asset.active_version);
  const runtimePath = runtime.resolve(id).replace(/^\.\.\//, "");
  const story = read("js/day2-story.js");

  assert.equal(runtimePath, version.path);
  assert.equal(fs.existsSync(path.resolve(root, runtime.resolve(id))), true);
  assert.match(story, /day2CoffeeHarin[^\n]+character\.harin\.holding_cup\.tired/);
  assert.doesNotMatch(story, /day2CoffeeHarin[^\n]+placeholderCharacter/);
});
