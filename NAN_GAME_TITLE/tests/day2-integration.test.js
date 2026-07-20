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

test("타이틀 이어하기는 공유 진행 날짜에 맞는 페이지를 선택한다", () => {
  const html = read("index.html");
  const script = read("js/title-screen.js");
  assert.match(html, /progress-store\.js/);
  assert.match(script, /GameProgress\.load/);
  assert.match(script, /day2\.html/);
  assert.match(script, /resumeUrl/);
});
