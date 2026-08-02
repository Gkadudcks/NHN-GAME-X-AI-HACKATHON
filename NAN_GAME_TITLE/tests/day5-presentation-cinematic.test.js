const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const gameRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(gameRoot, "day5.html"), "utf8");
const game = fs.readFileSync(path.join(gameRoot, "js/day5.js"), "utf8");
const cinematic = fs.readFileSync(path.join(gameRoot, "js/day5-presentation-cinematic.js"), "utf8");
const css = fs.readFileSync(path.join(gameRoot, "css/day5-presentation-cinematic.css"), "utf8");
const recovery = fs.readFileSync(path.join(gameRoot, "js/evidence-recovery-minigame.js"), "utf8");
const story = fs.readFileSync(path.join(gameRoot, "js/day5-story.js"), "utf8");
const motion = fs.readFileSync(path.join(gameRoot, "js/scene-motion.js"), "utf8");
const locationTransition = fs.readFileSync(path.join(gameRoot, "js/location-transition.js"), "utf8");

test("DAY 5 loads the cinematic presentation module after shared presentation rendering", () => {
  assert.match(html, /css\/day5-presentation-cinematic\.css/);
  assert.match(html, /js\/presentation-screen\.js[\s\S]*js\/day5-presentation-cinematic\.js[\s\S]*js\/day5\.js/);
});

test("cinematic presentation covers the actual presentation story range", () => {
  assert.match(cinematic, /day5PresentationStart/);
  assert.match(cinematic, /const END_ID = "day5PresentationEnd"/);
  assert.match(cinematic, /sceneRangeActive/);
  assert.match(cinematic, /x:\s*621,\s*y:\s*263,\s*width:\s*703,\s*height:\s*346/);
});

test("camera zoom keeps the physical screen and rendered PPT in one coordinate system", () => {
  assert.match(html, /class="day5-cinematic-camera"[\s\S]*class="day5-cinematic-background"[\s\S]*id="day5-cinematic-screen"/);
  assert.match(css, /\.stage\.day5-cine-screen \.day5-cinematic-camera/);
  assert.match(css, /\.stage\.day5-cine-left \.day5-cinematic-camera/);
  assert.match(css, /\.stage\.day5-cine-right \.day5-cinematic-camera/);
  assert.match(css, /\.stage\.day5-cine-impact \.day5-cinematic-camera/);
  assert.doesNotMatch(css, /\.stage\.day5-cine-screen \.day5-cinematic-background\s*\{[^}]*transform/);
});

test("main renderer preserves blocking and delegates presentation scenes", () => {
  assert.match(game, /Day5PresentationCinematic\.apply\(scene\)/);
  assert.match(game, /Day5PresentationCinematic\.isLocked\(\)/);
  assert.match(game, /Day5PresentationCinematic\.playDialogue\(scene,\s*dynamicText\(scene\)\)/);
});

test("prototype dialogue pacing and emphasis are present in the integrated presentation", () => {
  assert.match(cinematic, /function playDialogue/);
  assert.match(cinematic, /prepareProgressiveDialogue/);
  assert.match(cinematic, /SceneMotion\.applyDialogueEmphasis/);
  assert.match(motion, /function prepareProgressiveDialogue/);
  assert.match(cinematic, /day5MismatchDoyun[\s\S]*……/);
  assert.match(story, /emphasis:\s*\["18\.4%",\s*"12\.7%"\]/);
  assert.match(story, /emphasis:\s*\["제출 전부터 12\.7%였던 것",\s*"제출 이후"\]/);
  assert.match(css, /\.stage\.day5-cine-bars/);
  assert.match(css, /\.stage\.day5-cine-shake/);
});

test("presentation waits on a dedicated instruction screen before 10:00", () => {
  assert.match(html, /id="day5-presentation-ready"/);
  assert.match(html, /대화가 완성되면 ‘다음’ 또는 Enter/);
  assert.match(html, /붉게 강조되는 수치와 기록/);
  assert.match(html, /id="day5-presentation-ready-start"/);
  assert.match(cinematic, /scene\?\.id === "day5ReadyToPresent"/);
  assert.match(cinematic, /isLocked:\s*\(\) => readyLocked \|\| memoryLocked \|\| typingLocked/);
  assert.match(cinematic, /next\.click\(\)/);
  assert.match(css, /\.stage\.day5-presentation-ready-active \.system-panel/);
});

test("location transitions hide every presentation layer until movement finishes", () => {
  assert.match(locationTransition, /classList\.add\("location-transition-active"\)/);
  assert.match(locationTransition, /classList\.remove\("location-transition-active"\)/);
  assert.match(css, /\.location-transition-active \.system-panel/);
  assert.match(css, /\.location-transition-active \.day5-presentation-cinematic/);
  assert.match(css, /\.location-transition-active \.stage\.system-panel-active::before/);
});

test("only important Harin and Boss asides use compact image-backed cutscenes", () => {
  assert.match(cinematic, /"서하린": "character\.harin\.relaxed_standing\.neutral"/);
  assert.match(cinematic, /"박태식": "character\.boss\.holding_cup\.concerned"/);
  assert.match(cinematic, /day5BossPrompt.*day5HarinPrompt.*day5HarinConsequence/);
  assert.doesNotMatch(cinematic, /"한도윤":/);
  assert.match(cinematic, /function applySideCut/);
  assert.match(css, /\.stage\.day5-presentation-active\.day5-side-cut-active \.dialogue-card/);
  assert.match(css, /var\(--day5-side-cut-image\)/);
  assert.match(css, /\.stage\.day5-presentation-active \.character-layer\{[^}]*visibility:hidden!important/);
});

test("cinematic overlay yields to the evidence recovery minigame", () => {
  assert.match(css, /\.stage\.evidence-recovery-active \.day5-presentation-cinematic/);
  assert.match(css, /\.stage\.evidence-recovery-active \.day5-presentation-cinematic\s*\{[^}]*opacity:\s*1[^}]*pointer-events:\s*auto/);
  assert.match(css, /\.stage\.evidence-recovery-active \.day5-cinematic-camera\s*\{[^}]*z-index:\s*20/);
  assert.match(css, /\.stage\.evidence-recovery-active \.day5-cinematic-screen\s*\{[^}]*pointer-events:\s*auto/);
  assert.match(css, /\.day5-cinematic-background,[\s\S]*?\.day5-cinematic-impact\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.day5-cinematic-memory\[hidden\][^{]*\{[^}]*display:\s*none\s*!important/);
  assert.match(cinematic, /cancelMemory/);
  assert.match(css, /prefers-reduced-motion/);
});

test("evidence recovery still opens its guide before the timed game", () => {
  assert.match(recovery, /root\.querySelector\("\[data-guide\]"\)\.hidden = false/);
  assert.match(recovery, /root\.querySelector\("\[data-game\]"\)\.hidden = true/);
  assert.match(recovery, /root\.querySelector\("\[data-start\]"\)\.focus\(\)/);
});

test("evidence recovery runs dynamically across the full stage", () => {
  assert.match(game, /mount:\s*\$\("#stage"\)/);
  assert.match(game, /guideMount:\s*\$\("#stage"\)/);
  assert.match(recovery, /options\.mount/);
  assert.match(recovery, /data-stream/);
  assert.match(recovery, /deadline -= 5000/);
  assert.match(recovery, /classList\.add\(option\.correct \? "verified" : "rejected"\)/);
  assert.match(recovery, /TRACE NODE/);
});

test("dynamic verification uses a full-stage trace layout instead of the physical PPT screen", () => {
  const recoveryCss = fs.readFileSync(path.join(gameRoot, "css/evidence-recovery-minigame.css"), "utf8");
  assert.doesNotMatch(game, /mount:\s*\$\("#day5-cinematic-screen"\)/);
  assert.match(recovery, /data-court-playfield/);
  assert.match(recovery, /type:\s*"capture"/);
  assert.match(recovery, /type:\s*"rebuttal"/);
  assert.match(recovery, /court-contradiction/);
  assert.match(recoveryCss, /evidence-recovery-game\.embedded[\s\S]*z-index:\s*1900/);
  assert.match(recoveryCss, /evidence-court-dialogue/);
  assert.match(recoveryCss, /court-response-in/);
  assert.doesNotMatch(recoveryCss, /court-record-pass/);
});

test("the instruction screen stays large until play moves into the physical screen", () => {
  assert.match(recovery, /ensureRoot\(options\.guideMount \|\| document\.body\)/);
  assert.match(recovery, /if \(gameMount && root\.parentElement !== gameMount\) gameMount\.append\(root\)/);
  assert.match(recovery, /root\.classList\.add\("presentation-guide"\)/);
  assert.match(recovery, /root\.classList\.remove\("presentation-guide"\)/);
  assert.match(
    fs.readFileSync(path.join(gameRoot, "css/evidence-recovery-minigame.css"), "utf8"),
    /\.evidence-recovery-guide\[hidden\],\.evidence-recovery-card\[hidden\],\.evidence-court\[hidden\]\{display:none!important\}/
  );
});

test("the first fact-verification choice is replaced by the same dynamic screen interaction", () => {
  assert.match(story, /id:\s*"day5FactSort"[^}]*startFactVerification:\s*true/);
  assert.doesNotMatch(story, /id:\s*"day5FactSort"[^}]*choiceKey:\s*"factVerification"/);
  assert.match(recovery, /const VALIDATION_STEPS/);
  assert.match(game, /mode:\s*"validation"/);
  assert.match(game, /onComplete:\s*finishFactVerification/);
  assert.match(game, /scene\.id === "day5MinjaeConfront"/);
});

test("the entire error-verification sequence stays inside the dynamic trace game", () => {
  assert.match(recovery, /02 · 연결 변경 추적/);
  assert.match(recovery, /03 · 실행자 반박/);
  assert.match(recovery, /04 · 사건 경로 재구성/);
  assert.match(recovery, /05 · 책임 범위 확정/);
  assert.match(recovery, /selectedIds:\s*answers\.map/);
  assert.match(game, /state\.decisions\.ownerDistinction = selectedIds\[2\]/);
  assert.match(game, /state\.decisions\.causalChain = selectedIds\[3\]/);
  assert.match(game, /state\.decisions\.responsibility = selectedIds\[4\]/);
  assert.match(game, /scene\.id === "day5MinjaeConfront"/);
  assert.match(game, /durationMs:\s*65000/);
  assert.doesNotMatch(story, /id:\s*"day5OwnerQuestion"/);
  assert.doesNotMatch(story, /id:\s*"day5AliasCheck"/);
  assert.doesNotMatch(story, /id:\s*"day5AuditArrives"/);
  assert.doesNotMatch(story, /id:\s*"day5CausalOrder"/);
  assert.doesNotMatch(story, /id:\s*"day5Responsibility"/);
  assert.doesNotMatch(story, /id:\s*"day5RecoverySource"/);
  assert.doesNotMatch(story, /id:\s*"day5RecoveryBinding"/);
});
