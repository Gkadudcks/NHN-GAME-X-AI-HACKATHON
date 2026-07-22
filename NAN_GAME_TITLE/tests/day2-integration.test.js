const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("DAY 2 페이지는 필요한 스크립트를 올바른 순서로 불러온다", () => {
  const html = read("day2.html");
  const progress = html.indexOf('src="js/progress-store.js');
  const clues = html.indexOf('src="js/clue-mindmap.js');
  const art = html.indexOf('src="js/art-assets.js');
  const story = html.indexOf('src="js/day2-story.js');
  const bgm = html.indexOf('src="js/bgm-manager.js');
  const minigame = html.indexOf('src="js/work-alert-minigame.js');
  const engine = html.indexOf('src="js/day2.js');
  assert.equal([progress, clues, art, story, bgm, minigame, engine].every((index) => index >= 0), true);
  assert.equal(progress < clues && clues < art && art < story && story < bgm && bgm < minigame && minigame < engine, true);
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
  assert.match(css, /\.clue-detail-orbit p\{max-height:82px;font-size:13px/);
  assert.match(css, /\.clue-inspector p\{font-size:14px;line-height:1\.7\}/);
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

test("타이틀 이어하기는 공유 진행 날짜에 맞는 페이지를 선택한다", () => {
  const html = read("index.html");
  const script = read("js/title-screen.js");
  assert.match(html, /progress-store\.js/);
  assert.match(script, /GameProgress\.load/);
  assert.match(script, /day2\.html/);
  assert.match(script, /resumeUrl/);
});
