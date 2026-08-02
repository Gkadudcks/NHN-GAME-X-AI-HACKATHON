"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const story = require("../js/day5-story.js");
const Progress = require("../js/progress-store.js");

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("DAY 5 장면 ID와 필수 필드가 유효하다", () => {
  assert.deepEqual(story.validateScenes(story.scenes), []);
  assert.ok(story.scenes.length >= 50);
});

test("DAY 5는 확정된 사건과 세 통합 엔딩을 포함한다", () => {
  const source = JSON.stringify(story.scenes);
  const minigame = fs.readFileSync(path.join(root, "js/evidence-recovery-minigame.js"), "utf8");
  assert.match(source, /18\.4%/);
  assert.match(source, /12\.7%/);
  assert.match(minigame, /minjae_request_concealment/);
  assert.deepEqual(new Set(story.scenes.filter((scene) => scene.ending).map((scene) => scene.ending)), new Set(["bad", "middle", "nice"]));
  assert.match(source, /이번 주말에/);
  assert.match(source, /시간 괜찮아요/);
  const niceEnd = story.scenes.find((scene) => scene.id === "day5NiceEnd");
  assert.equal(niceEnd.cgAssetId, "event_cg.day5.weekend_invitation");
  assert.equal(niceEnd.cinematicDelay, 1600);
});

test("DAY 5 페이지는 DAY 1~4 공용 UI와 기능 모듈을 재사용한다", () => {
  const html = fs.readFileSync(path.join(root, "day5.html"), "utf8");
  for (const id of ["dialogue-card", "stage-choices", "messenger", "save", "load", "day-summary"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const module of ["pause-menu.js", "settings-dialog.js", "location-transition.js", "clue-mindmap.js", "presentation-screen.js"]) {
    assert.match(html, new RegExp(module.replace(".", "\\.")));
  }
});

test("DAY 5 발표 전 초반부는 확정 문서의 시간표와 대사를 빠짐없이 구현한다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  for (const id of [
    "day5NoEditConfirmed",
    "day5FinalCheckReply",
    "day5FinalCheckWarning",
    "day5StrategyPromise",
    "day5StrategySetup",
    "day5Rehearsal",
    "day5RehearsalFeedback",
    "day5EvaluatorsArrive",
    "day5ReadyToPresent",
    "day5FocusReaction",
  ]) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(ids.indexOf("day5StrategySetup") < ids.indexOf("day5AuditPending"));
  assert.ok(ids.indexOf("day5Rehearsal") < ids.indexOf("day5Focus"));
  assert.ok(ids.indexOf("day5EvaluatorsArrive") < ids.indexOf("day5TeaCallback"));
  assert.equal(story.scenes.find((scene) => scene.id === "day5ReadyToPresent").nextLabel, "발표 시작　›");

  const strategy = story.scenes.find((scene) => scene.id === "day5Strategy");
  assert.equal(strategy.choices[0].text, "제가 확인한 결론을 먼저 밝히고 그 근거를 바로 제시하겠습니다.");
  assert.equal(strategy.choices[1].text, "두 자료가 같은 대상과 기간을 사용하는지 질문의 전제부터 확인하겠습니다.");
  assert.equal(strategy.choices[2].text, "제가 발표 흐름을 유지하는 동안 선배에게 정상 원본을 열어 달라고 요청하겠습니다.");
  assert.equal(strategy.choices[3].text, "발생 가능한 원인을 먼저 설명해 평가위원의 불안을 줄이겠습니다.");
});

test("정상 발표는 문제·개선안·검증 수치·자동화 경계를 충분히 설명한다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  for (const id of [
    "day5PresentationProblem",
    "day5PresentationSolution",
    "day5PresentationFocusDetail",
    "day5PresentationMetric",
    "day5PresentationVerification",
    "day5PresentationBoundary",
  ]) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(ids.indexOf("day5PresentationStart") < ids.indexOf("day5PresentationProblem"));
  assert.ok(ids.indexOf("day5PresentationBoundary") < ids.indexOf("day5FocusReaction"));
  assert.match(JSON.stringify(story.scenes.slice(ids.indexOf("day5PresentationStart"), ids.indexOf("day5PresentationNormal") + 1)), /18\.4%/);
});

test("수치 불일치 뒤에는 확정 문서의 평가위원·부장·하린 대응이 순서대로 이어진다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  const sequence = [
    "day5Mismatch",
    "day5MismatchDoyun",
    "day5MismatchFollowup",
    "day5BossPrompt",
    "day5HarinPrompt",
    "day5StrategyCallback",
  ];
  assert.deepEqual(sequence.map((id) => ids.indexOf(id)), [...sequence.map((id) => ids.indexOf(id))].sort((a, b) => a - b));
  assert.match(story.scenes.find((scene) => scene.id === "day5MismatchFollowup").text, /산정 기준.*제출 이후/);
  assert.match(story.scenes.find((scene) => scene.id === "day5HarinPrompt").text, /어느 수치가 검증됐는지부터/);
});

test("평가위원은 별도 캐릭터나 텍스트 플레이스홀더 없이 발표실 밖 화자로만 처리한다", () => {
  const evaluatorScenes = story.scenes.filter((scene) => scene.speaker === "평가위원" || scene.id === "day5EvaluatorsArrive" || scene.id === "day5EvaluatorsEnter");
  assert.ok(evaluatorScenes.length >= 4);
  assert.equal(evaluatorScenes.every((scene) => !scene.characterPlaceholder && !scene.placeholder), true);
  const html = fs.readFileSync(path.join(root, "day5.html"), "utf8");
  assert.doesNotMatch(html, /character-placeholder/);
});

test("DAY 5 발표 구간은 승인된 전용 발표실 배경을 사용한다", () => {
  const presentationScenes = story.scenes.slice(
    story.scenes.findIndex((scene) => scene.id === "day5MoveMeeting"),
    story.scenes.findIndex((scene) => scene.id === "day5PresentationEnd") + 1,
  );
  assert.ok(presentationScenes.length > 20);
  assert.equal(presentationScenes.every((scene) => scene.bgAssetId === "background.presentation_room.day"), true);
  assert.equal(story.scenes.find((scene) => scene.id === "day5MoveMeeting").location, "발표실 · 오전");
  assert.equal(story.scenes.find((scene) => scene.id === "day5PresentationStart").location, "발표실 · 발표");
});

test("DAY 5 시작과 재시작은 이전 날짜 완료 상태와 시작 스냅샷을 보존한다", () => {
  const storage = memoryStorage();
  Progress.startNewGame(storage);
  const started = Progress.startDay5(storage);
  assert.equal(started.currentDay, 5);
  assert.equal(started.days[4].complete, true);
  assert.ok(started.day5StartSnapshot);

  const restarted = Progress.resetDay5(storage);
  assert.equal(restarted.days[5].sceneId, "day5Intro");
  assert.equal(restarted.days[5].complete, false);
});

test("DAY 5 증빙 복구는 75초짜리 전용 미니게임으로 실제 진입한다", () => {
  const html = fs.readFileSync(path.join(root, "day5.html"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const minigame = fs.readFileSync(path.join(root, "js/evidence-recovery-minigame.js"), "utf8");
  const recovery = story.scenes.find((scene) => scene.id === "day5RecoveryStart");
  assert.equal(recovery.startEvidenceRecovery, true);
  assert.match(html, /evidence-recovery-minigame\.js\?v=9/);
  assert.match(runtime, /EvidenceRecoveryMinigame\.start\(\{[\s\S]*?durationMs:\s*75000/);
  assert.match(runtime, /scene\.id === "day5RecoveryVerify"/);
  assert.match(minigame, /const STEPS = Object\.freeze/);
  assert.match(minigame, /current_week/);
  assert.match(minigame, /fixed_source/);
});

test("증빙 복구는 안내 확인 후 시작하며 플레이 중 기존 PPT 화면을 숨긴다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const minigame = fs.readFileSync(path.join(root, "js/evidence-recovery-minigame.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "css/day5.css"), "utf8");
  assert.match(minigame, /data-guide/);
  assert.match(minigame, /증빙 복구 시작/);
  assert.match(minigame, /function beginPlay\(\)/);
  assert.match(minigame, /deadline = performance\.now\(\) \+ durationMs/);
  assert.match(runtime, /classList\.add\("evidence-recovery-active"\)/);
  assert.match(runtime, /classList\.remove\("evidence-recovery-active"\)/);
  assert.match(css, /\.stage\.evidence-recovery-active \.system-panel/);
});
