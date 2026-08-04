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

test("오류 검증 강조는 추리에 사용하는 숫자 기록에만 적용한다", () => {
  const emphasized = story.scenes.filter((scene) => scene.emphasis);
  assert.ok(emphasized.length > 0);
  for (const scene of emphasized) {
    const phrases = Array.isArray(scene.emphasis) ? scene.emphasis : [scene.emphasis];
    const auditRoleException = scene.id === "day5AuditResultReview"
      && phrases.join(",") === "서하린,강민재,나나봇";
    assert.ok(
      auditRoleException || phrases.every((phrase) => /\d/.test(phrase) && scene.text.includes(phrase)),
      scene.id,
    );
  }
  for (const id of ["day5HarinPrompt", "day5OwnerQuestion", "day5Responsibility"]) {
    assert.equal(story.scenes.find((scene) => scene.id === id)?.emphasis, undefined, id);
  }
  assert.deepEqual(
    story.scenes.find((scene) => scene.id === "day5AuditResultReview")?.emphasis,
    ["서하린", "강민재", "나나봇"],
  );
});

test("DAY 5는 확정된 사건과 세 통합 엔딩을 포함한다", () => {
  const source = JSON.stringify(story.scenes);
  assert.match(source, /18\.4%/);
  assert.match(source, /12\.7%/);
  assert.match(source, /minjae_request_concealment/);
  assert.deepEqual(new Set(story.scenes.filter((scene) => scene.ending).map((scene) => scene.ending)), new Set(["bad", "middle", "happy"]));
  assert.match(source, /이번 주말에/);
  assert.match(source, /시간 괜찮아요/);
  const happyEnd = story.scenes.find((scene) => scene.id === "day5HappyEnd");
  assert.equal(happyEnd.cgAssetId, "event_cg.day5.weekend_invitation");
  assert.equal(happyEnd.cinematicDelay, 1600);
  const middleEnd = story.scenes.find((scene) => scene.id === "day5MiddleEnd");
  assert.equal(middleEnd.cgAssetId, "event_cg.day5.colleague_departure");
  assert.equal(middleEnd.cinematicDelay, 1600);
  for (const id of ["day5MiddleExit", "day5MiddleOutside", "day5MiddleEnd"]) {
    assert.equal(story.scenes.find((scene) => scene.id === id)?.bgAssetId, "background.office_lobby.night", id);
  }
  const badEnd = story.scenes.find((scene) => scene.id === "day5BadEnd");
  assert.equal(badEnd.cgAssetId, "event_cg.day5.lone_departure");
  assert.equal(badEnd.cinematicDelay, 1600);
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
  assert.equal(story.scenes.find((scene) => scene.id === "day5ReadyToPresent").nextLabel, "발표 시작");

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
    "day5VerificationReady",
  ];
  assert.ok(sequence.every((id) => ids.includes(id)));
  assert.ok(ids.indexOf("day5HarinPrompt") < ids.indexOf("day5VerificationReady"));
  assert.match(story.scenes.find((scene) => scene.id === "day5MismatchFollowup").text, /산정 기준.*제출 이후/);
  assert.match(story.scenes.find((scene) => scene.id === "day5HarinPrompt").text, /어느 수치가 검증됐는지부터/);
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.match(runtime, /scenes\[fromIndex\]\?\.id === "day5HarinPrompt"/);
  assert.match(runtime, /migrateVerificationPrelude/);
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

test("DAY 5 근거 자료 복구는 발표 화면의 네 단계 선택으로 진행한다", () => {
  const html = fs.readFileSync(path.join(root, "day5.html"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.doesNotMatch(html, /evidence-recovery-minigame/);
  assert.doesNotMatch(runtime, /EvidenceRecoveryMinigame/);
  assert.equal(story.scenes.find((scene) => scene.id === "day5RecoveryRefresh").choiceKey, "recoveryRefresh");
  assert.equal(story.scenes.find((scene) => scene.id === "day5RecoverySource").choiceKey, "recoverySource");
  assert.equal(story.scenes.find((scene) => scene.id === "day5RecoveryBasis").choiceKey, "recoveryBasis");
  assert.equal(story.scenes.find((scene) => scene.id === "day5RecoveryBinding").choiceKey, "recoveryBinding");
});

test("보안 감사는 대기 상태에서 끝나지 않고 오류 검증 중 결과 단서로 도착한다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  const pending = story.scenes.find((scene) => scene.id === "day5AuditPending");
  const result = story.scenes.find((scene) => scene.id === "day5AuditResult");
  assert.match(pending.text, /아직 담당자 확인 중/);
  assert.ok(ids.indexOf("day5AliasCheck") < ids.indexOf("day5AuditResult"));
  assert.ok(ids.indexOf("day5AuditResult") < ids.indexOf("day5OwnerQuestion"));
  assert.equal(result.clue.id, "d5_security_audit_result");
  assert.match(result.clue.detail, /강민재.*나나봇.*서하린.*직접 접근/);
});

test("근거 자료 복구는 기존 PPT와 대화창을 유지하고 결과 키를 엔딩 판정에 사용한다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const source = story.scenes.find((scene) => scene.id === "day5RecoverySource");
  const binding = story.scenes.find((scene) => scene.id === "day5RecoveryBinding");
  assert.ok(source.choices.some((choice) => choice.id === "current_week"));
  assert.ok(binding.choices.some((choice) => choice.id === "fixed_source"));
  assert.match(runtime, /state\.decisions\.recoverySource === "current_week"/);
  assert.match(runtime, /state\.decisions\.recoveryBinding === "fixed_source"/);
  assert.doesNotMatch(runtime, /evidenceRecoveryActive/);
});

test("오류 검증은 전체 다섯 번의 실수 기회와 세 결과 등급을 공유한다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "day5.html"), "utf8");
  assert.match(runtime, /VERIFICATION_MISTAKE_LIMIT\s*=\s*5/);
  assert.match(runtime, /verificationMistakes/);
  assert.match(runtime, /"perfect"/);
  assert.match(runtime, /"partial"/);
  assert.match(runtime, /"failed"/);
  assert.match(runtime, /completeVerificationWithSupport/);
  assert.match(html, /id="day5-verification-result-mistakes"/);
  assert.match(html, /id="day5-verification-result-solved"/);
});

test("오류 검증과 원본 복구는 각각 독립된 생명 5개와 등급을 가진 별도의 미니게임이며, 검증 실패는 복구까지 담당자에게 넘긴다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const html = fs.readFileSync(path.join(root, "day5.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "css/day5-presentation-cinematic.css"), "utf8");
  assert.match(html, /id="day5-verification-lives"/);
  assert.match(html, /id="day5-verification-life-cells"[^]*?♥[^]*?♥[^]*?♥[^]*?♥[^]*?♥/);
  assert.match(runtime, /RECOVERY_MISTAKE_LIMIT\s*=\s*5/);
  assert.match(runtime, /function recoveryMistakes\(\)/);
  assert.match(runtime, /function recoveryGrade\(\)/);
  assert.match(runtime, /syncVerificationLives/);
  assert.match(runtime, /playMinigameCue\("success"\)/);
  assert.match(runtime, /"caught"\s*:\s*"warning"/);
  assert.match(runtime, /INCIDENT_MINIGAME_SCENE_IDS/);
  assert.match(runtime, /const inVerification = VERIFICATION_SCENE_IDS\.includes\(scene\.id\)/);
  assert.match(runtime, /const inRecovery = RECOVERY_SCENE_IDS\.includes\(scene\.id\)/);
  assert.match(runtime, /findIndex\(\(item\) => item\.id === "day5SupportRecoveryStart"\)/);
  assert.match(runtime, /findIndex\(\(item\) => item\.id === "day5RecoveryStart"\)/);
  assert.match(runtime, /completeRecoveryWithSupport/);
  assert.match(runtime, /completeVerificationWithSupport/);
  assert.match(runtime, /scene\?\.playerRecovery && recoveryGrade\(\) === "failed"/);
  assert.match(runtime, /scene\?\.supportRecovery && recoveryGrade\(\) !== "failed"/);
  assert.match(runtime, /migrateLegacyVerificationFailure/);
  assert.match(runtime, /state\.decisions\.verificationMistakes = VERIFICATION_MISTAKE_LIMIT/);
  assert.match(runtime, /if \(inVerification\) completeVerificationWithSupport\(\);\s*completeRecoveryWithSupport\(\);/);
  assert.match(runtime, /state\.decisions\.recoveryGrade = "failed";/);
  assert.match(css, /feedback-success/);
  assert.match(css, /feedback-hit/);
  assert.match(css, /feedback-failed/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("오류 검증 결과는 민재의 인정 과정과 정직원·관계 통합 엔딩에 연결된다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  for (const dynamic of ["verificationConfront", "verificationFollowup", "verificationAdmission"]) {
    assert.equal(story.scenes.some((scene) => scene.dynamic === dynamic), true, dynamic);
    assert.match(runtime, new RegExp(`scene\\.dynamic === "${dynamic}"`));
  }
  assert.match(runtime, /if \(vGrade === "failed" \|\| state\.trust < 0\) return "bad"/);
  assert.match(runtime, /vGrade !== "failed" && rGrade !== "failed" && state\.trust >= 8 && state\.affection >= 7/);
  assert.match(runtime, /state\.trust -= 1;/);
  assert.match(runtime, /state\.decisions\.recoveryBinding === "fixed_source"/);
  const ids = story.scenes.map((scene) => scene.id);
  assert.ok(ids.indexOf("day5Responsibility") < ids.indexOf("day5MinjaeConfront"));
  for (const id of [
    "day5SupportRecoveryStart",
    "day5SupportRecoveryPanic",
    "day5SupportRecoveryAudit",
    "day5SupportRecoveryProcess",
    "day5SupportRecoveryComplete",
  ]) {
    assert.equal(story.scenes.find((scene) => scene.id === id)?.supportRecovery, true, id);
  }
  assert.ok(ids.indexOf("day5SupportRecoveryShock") < ids.indexOf("day5SupportRecoveryPanic"));
  assert.ok(ids.indexOf("day5SupportRecoveryPanic") < ids.indexOf("day5SupportRecoveryAudit"));
  assert.match(runtime, /scene\.dynamic === "supportRecoveryPanic"/);
  assert.match(runtime, /진짜 큰일났다/);
  assert.ok(ids.indexOf("day5SupportRecoveryStart") < ids.indexOf("day5RecoveryVerify"));
  assert.ok(ids.indexOf("day5RecoveryVerify") < ids.indexOf("day5VerificationResult"));
  assert.ok(ids.indexOf("day5VerificationResult") < ids.indexOf("day5Resume"));
});

test("발표 종료 뒤에는 사건 후속 조치와 감정적 여운을 거쳐 결과를 통보한다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const ids = story.scenes.map((scene) => scene.id);
  const aftermath = [
    "day5AfterPresentationSilence",
    "day5HarinRelease",
    "day5BossFollowup",
    "day5MinjaeApology",
    "day5HarinBoundaryAfter",
    "day5HallwayPause",
    "day5HarinHallway",
    "day5ReturnOffice",
    "day5IncidentReport",
    "day5AuditClosed",
    "day5WaitingForResult",
    "day5HarinBeforeResult",
  ];
  let previous = ids.indexOf("day5PresentationEnd");
  for (const id of aftermath) {
    const current = ids.indexOf(id);
    assert.ok(current > previous, id);
    previous = current;
  }
  assert.ok(ids.indexOf("day5Result") > previous);
  assert.equal(story.scenes.find((scene) => scene.id === "day5HallwayPause")?.bgAssetId, "background.presentation_hallway.day");
  assert.equal(story.scenes.find((scene) => scene.id === "day5AuditClosed")?.bgAssetId, "background.office.day");
  for (const dynamic of [
    "postPresentationHarin",
    "postPresentationMinjae",
    "postPresentationReflection",
    "postPresentationReport",
    "postPresentationBeforeResult",
  ]) {
    assert.match(runtime, new RegExp(`scene\\.dynamic === "${dynamic}"`));
  }
});
