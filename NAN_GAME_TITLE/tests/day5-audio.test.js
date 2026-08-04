const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const story = read("js/day5-story.js");
const engine = read("js/day5.js");
const manager = read("js/bgm-manager.js");
const sfx = read("js/ui-sfx.js");
const html = read("day5.html");

function wavInfo(file) {
  const buffer = fs.readFileSync(path.join(root, file));
  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WAVE");
  return {
    channels: buffer.readUInt16LE(22),
    sampleRate: buffer.readUInt32LE(24),
    bitsPerSample: buffer.readUInt16LE(34),
    bytes: buffer.length,
    duration: (buffer.length - 44) / (buffer.readUInt32LE(24) * buffer.readUInt16LE(22) * (buffer.readUInt16LE(34) / 8)),
  };
}

test("DAY 5 presentation uses a dedicated original loop", () => {
  const calm = wavInfo("assets/audio/looped/day5-presentation-loop.wav");
  assert.equal(calm.channels, 1);
  assert.equal(calm.sampleRate, 22050);
  assert.equal(calm.bitsPerSample, 16);
  assert.ok(calm.duration > 28);
  const urgentPath = path.join(root, "assets/audio/looped/day5-error-reveal-suno-v1.mp3");
  assert.equal(fs.statSync(urgentPath).size, 1447488);
  assert.match(manager, /presentationCalm:\s*\{\s*source:\s*"assets\/audio\/looped\/day5-presentation-loop\.wav"/);
  assert.match(manager, /presentationUrgent:\s*\{\s*source:\s*"assets\/audio\/looped\/day5-error-reveal-suno-v1\.mp3"/);
  assert.match(engine, /preload\(\[[^\]]*"presentationCalm"[^]*"presentationUrgent"/);
  assert.match(story, /id:\s*"day5PresentationStart"[^]*?bgm:\s*"presentationCalm"/);
  assert.match(story, /id:\s*"day5EvidenceRefresh"[^]*?bgm:\s*"presentationCalm"/);
  assert.match(story, /id:\s*"day5Mismatch"[^]*?bgm:\s*"presentationUrgent"/);
  assert.match(story, /id:\s*"day5Pause"[^]*?bgm:\s*"presentationUrgent"/);
});

test("error discovery and evidence matching use separate SFX assets", () => {
  const error = wavInfo("assets/audio/day5-error-discovery-v2.wav");
  const flash = wavInfo("assets/audio/day5-flash-transition.wav");
  const match = wavInfo("assets/audio/day5-evidence-match.wav");
  assert.equal(error.sampleRate, 22050);
  assert.equal(flash.sampleRate, 22050);
  assert.equal(match.sampleRate, 22050);
  assert.ok(error.bytes > match.bytes);
  assert.match(sfx, /errorDiscovery:\s*new Audio\("assets\/audio\/day5-error-discovery-v2\.wav"\)/);
  assert.match(sfx, /flashTransition:\s*new Audio\("assets\/audio\/day5-flash-transition\.wav"\)/);
  assert.match(sfx, /evidenceMatch:\s*new Audio\("assets\/audio\/day5-evidence-match\.wav"\)/);
  assert.match(sfx, /function playPresentationCue/);
  assert.match(sfx, /getVolume\(name === "errorDiscovery" \? 0\.82 : name === "flashTransition" \? 0\.42 : name === "evaluatorSuspicion" \? 0\.68 : 0\.5\)/);
  assert.match(engine, /scene\.id === "day5Mismatch"[^]*?playPresentationCue\("errorDiscovery"\)/);
  assert.match(engine, /function presentEvidence[^]*?UiSfx\.playPresentationCue\("evidenceMatch"\)/);
  assert.match(html, /ui-sfx\.js\?v=13/);
});

test("every cinematic flash plays its synchronized transition cue", () => {
  const cinematic = read("js/day5-presentation-cinematic.js");
  assert.match(cinematic, /function flash\(\)[^]*?classList\.add\("day5-cine-flash"\);\s*UiSfx\.playPresentationCue\("flashTransition"\)/);
  assert.match(html, /day5-presentation-cinematic\.js\?v=15/);
});

test("the evaluator pause silences BGM for two seconds before the urgent reversal", () => {
  const suspicion = fs.statSync(path.join(root, "assets/audio/day5-evaluator-confused-cut-v1.mp3"));
  const cinematic = read("js/day5-presentation-cinematic.js");
  assert.ok(suspicion.size > 50_000 && suspicion.size < 60_000);
  assert.match(sfx, /evaluatorSuspicion:\s*new Audio\("assets\/audio\/day5-evaluator-confused-cut-v1\.mp3"\)/);
  assert.match(story, /id:\s*"day5EvaluatorHold"[^]*?text:\s*"잠시만요……\."[^]*?holdDelay:\s*2000[^]*?stopBgm:\s*true/);
  assert.match(story, /id:\s*"day5Mismatch"[^]*?text:\s*"발표 자료와 제출용 검증 자료의 수치가 다릅니다!/);
  assert.match(engine, /scene\.id === "day5EvaluatorHold"[^]*?bgmManager\.stop\(\);[^]*?playPresentationCue\("evaluatorSuspicion"\)/);
  assert.match(engine, /if \(scene\.stopBgm\) bgmManager\.stop\(\)/);
  assert.match(cinematic, /if \(scene\.holdDelay\)[^]*?setTimeout\([^]*?scene\.holdDelay/);
});

test("the mismatch cue is saved as heard and does not replay on rerender", () => {
  assert.match(engine, /!state\.seenNotifications\["sfx:day5-mismatch"\]/);
  assert.match(engine, /state\.seenNotifications\["sfx:day5-mismatch"\] = true/);
  assert.match(engine, /if \(selected\.has\(clueId\)\) return/);
});
