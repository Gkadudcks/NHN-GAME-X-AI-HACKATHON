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
    const auditRoleException = ["day5AuditResultReview", "day5AuditResultReviewDetail"].includes(scene.id)
      && phrases.every((phrase) => ["서하린", "강민재", "나나봇"].includes(phrase));
    assert.ok(
      auditRoleException || phrases.every((phrase) => /\d/.test(phrase) && scene.text.includes(phrase)),
      scene.id,
    );
  }
  for (const id of ["day5HarinPrompt", "day5OwnerQuestion", "day5Responsibility"]) {
    assert.equal(story.scenes.find((scene) => scene.id === id)?.emphasis, undefined, id);
  }
  assert.deepEqual(story.scenes.find((scene) => scene.id === "day5AuditResultReview")?.emphasis, ["서하린", "강민재"]);
  assert.equal(story.scenes.find((scene) => scene.id === "day5AuditResultReviewDetail")?.emphasis, "나나봇");
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
  assert.equal(happyEnd.cinematicDelay, 3000);
  const middleEnd = story.scenes.find((scene) => scene.id === "day5MiddleEnd");
  assert.equal(middleEnd.cgAssetId, "event_cg.day5.colleague_departure");
  assert.equal(middleEnd.cinematicDelay, 3000);
  for (const id of ["day5MiddleExit", "day5MiddleOutside", "day5MiddleEnd"]) {
    assert.equal(story.scenes.find((scene) => scene.id === id)?.bgAssetId, "background.office_lobby.night", id);
  }
  const badEnd = story.scenes.find((scene) => scene.id === "day5BadEnd");
  assert.equal(badEnd.cgAssetId, "event_cg.day5.lone_departure");
  assert.equal(badEnd.cinematicDelay, 3000);
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

test("DAY 5 발표 구간은 기존 컨트롤을 72px 5등분 내비게이션으로 전환한다", () => {
  const html = fs.readFileSync(path.join(root, "day5.html"), "utf8");
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "css/day5.css"), "utf8");
  const ids = story.scenes.map((scene) => scene.id);

  assert.match(html, /id="day5-game-controls"/);
  assert.match(html, /id="save"[^>]*aria-label="현재 진행 저장"/);
  assert.match(html, /id="load"[^>]*aria-label="저장한 진행 불러오기"/);
  assert.match(html, /data-compact-label="저장"/);
  assert.match(html, /data-compact-label="불러오기"/);

  assert.match(runtime, /DAY5_COMPACT_NAV_START_ID\s*=\s*"day5PresentationStart"/);
  assert.match(runtime, /DAY5_COMPACT_NAV_END_ID\s*=\s*"day5VerificationResult"/);
  assert.match(runtime, /classList\.toggle\("day5-compact-nav", compact\)/);
  assert.match(runtime, /classList\.toggle\("day5-compact-layout", compact\)/);
  assert.ok(ids.indexOf("day5PresentationStart") < ids.indexOf("day5VerificationResult"));
  assert.equal(ids.indexOf("day5VerificationResult") + 1, ids.indexOf("day5Resume"));

  assert.match(css, /#day5-game-controls\.day5-compact-nav\s*\{[^}]*height:\s*72px;/s);
  assert.match(css, /\.messenger\.day5-compact-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 3fr\) minmax\(0, 2fr\)/);
  assert.match(css, /\.system-grid\s*\{\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(css, /\.save-progress-panel\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s);
  assert.match(css, /\.stat-help\s*\{\s*display:\s*none;/s);
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
  assert.match(story.scenes.find((scene) => scene.id === "day5PresentationBoundary").text, /68\.1%.*73\.1%/);
  assert.match(story.scenes.find((scene) => scene.id === "day5PresentationBoundaryCriteria").text, /5%포인트.*잔존율.*사용자 반응/);
  assert.match(story.scenes.find((scene) => scene.id === "day5NormalQaAnswerDetail").text, /다음 날 복귀.*신규 유저 불편 의견/);
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
  assert.match(runtime, /검증을 놓쳤고 남은 복구도 담당자에게 달렸다/);
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

test("DAY 1 방향과 DAY 2 조사 선택값이 안정적인 내부 분기명으로 정규화된다", () => {
  assert.equal(story.normalizeDay1Direction("긴 튜토리얼을 줄이고 핵심 행동부터 경험하게 한다."), "shorten_tutorial");
  assert.equal(story.normalizeDay1Direction("첫 전투까지 상황별 가이드를 제공한다."), "contextual_guide");
  assert.equal(story.normalizeDay1Direction("AI가 플레이 상황에 맞는 도움말을 추천한다."), "ai_help");
  assert.equal(story.normalizeDay1Direction(undefined), "contextual_guide");
  assert.equal(story.normalizeDay1Direction("옛날 저장 데이터의 알 수 없는 문장"), "contextual_guide");

  assert.equal(story.normalizeDay2Subtask("competitor"), "competitor");
  assert.equal(story.normalizeDay2Subtask("reviews"), "reviews");
  assert.equal(story.normalizeDay2Subtask("journey"), "journey");
  assert.equal(story.normalizeDay2Subtask(undefined), "competitor");

  assert.equal(story.normalizePresentationFocus("verification"), "dropoff_scale");
  assert.equal(story.normalizePresentationFocus("automation_boundary"), "execution_plan");
  assert.equal(story.normalizePresentationFocus("user_experience"), "user_experience");
  assert.equal(story.normalizePresentationFocus("dropoff_scale"), "dropoff_scale");
  assert.equal(story.normalizePresentationFocus("execution_plan"), "execution_plan");
  assert.equal(story.normalizePresentationFocus(undefined), "dropoff_scale");
});

test("day5.js는 DAY 1·DAY 2 결정값을 읽기 전용으로만 초기화하고 day5 저장값에 복사하지 않는다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.match(runtime, /const day1Direction = Day5Story\.normalizeDay1Direction\(progress\.days\[1\]\?\.decisions\?\.direction\)/);
  assert.match(runtime, /const day2Subtask = Day5Story\.normalizeDay2Subtask\(progress\.days\[2\]\?\.decisions\?\.day2Subtask\)/);
  assert.doesNotMatch(runtime, /decisions\.day1Direction\s*=/);
  assert.doesNotMatch(runtime, /decisions\.day2Subtask\s*=/);
});

test("발표 강조점 선택은 이탈 규모·사용자 경험·실행 계획 3종으로 구성되고 능력치 배분이 유지된다", () => {
  const focus = story.scenes.find((scene) => scene.id === "day5Focus");
  assert.equal(focus.choiceKey, "presentationFocus");
  assert.deepEqual(focus.choices.map((choice) => choice.id), ["dropoff_scale", "user_experience", "execution_plan"]);
  assert.equal(focus.choices.find((choice) => choice.id === "dropoff_scale").delta.work, 1);
  assert.deepEqual(focus.choices.find((choice) => choice.id === "user_experience").delta, {});
  assert.equal(focus.choices.find((choice) => choice.id === "execution_plan").delta.trust, 1);
});

test("본 발표는 DAY 2 조사와 DAY 1 방향에 따라 아홉 조합 모두 올바른 근거와 개선안을 출력한다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const researchKeywords = {
    competitor: "동종 RPG 세 게임을 비교했습니다",
    reviews: "리뷰 불만은 두 갈래였습니다",
    journey: "첫 10분 동안 보상·출석·패키지 창을 닫고",
  };
  const proposalKeywords = {
    shorten_tutorial: "이동·전투·첫 목표에 필요한 안내만 남기겠습니다",
    contextual_guide: "전투·장비·성장 기능을 처음 쓸 때",
    ai_help: "나나봇의 개입 시점은 장시간 정체와 반복 실패 구간입니다",
  };
  for (const research of Object.keys(researchKeywords)) {
    for (const proposal of Object.keys(proposalKeywords)) {
      assert.match(runtime, new RegExp(researchKeywords[research].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${research}/${proposal} research text present`);
      assert.match(runtime, new RegExp(proposalKeywords[proposal].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${research}/${proposal} proposal text present`);
    }
  }
  assert.match(runtime, /if \(day2Subtask === "reviews"\) return/);
  assert.match(runtime, /if \(day2Subtask === "journey"\) return/);
  assert.match(runtime, /if \(day1Direction === "shorten_tutorial"\) return/);
  assert.match(runtime, /if \(day1Direction === "ai_help"\) return/);
});

test("선택하지 않은 조사와 개선안은 발표 화면에 노출되지 않는다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const researchBlockMatch = runtime.match(/if \(scene\.dynamic === "presentationResearchEvidence"\) \{([^]*?)\n  \}/);
  assert.ok(researchBlockMatch, "presentationResearchEvidence block found");
  assert.match(researchBlockMatch[1], /if \(day2Subtask === "reviews"\)/);
  assert.match(researchBlockMatch[1], /if \(day2Subtask === "journey"\)/);
  assert.match(researchBlockMatch[1], /return "동종 RPG/);

  const proposalBlockMatch = runtime.match(/if \(scene\.dynamic === "presentationProposalDetail"\) \{([^]*?)\n  \}/);
  assert.ok(proposalBlockMatch, "presentationProposalDetail block found");
  assert.match(proposalBlockMatch[1], /if \(day1Direction === "shorten_tutorial"\)/);
  assert.match(proposalBlockMatch[1], /if \(day1Direction === "ai_help"\)/);
});

test("발표 강조점 세 선택 모두 본래 PT 주제 안에서 도입부와 1차 반응을 제공한다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.match(runtime, /if \(focus === "dropoff_scale"\) return "신규 유저 첫 전투 도달률 개선안입니다\. 먼저 이탈 규모부터 보시죠/);
  assert.match(runtime, /if \(focus === "user_experience"\) return "신규 유저 첫 전투 도달률 개선안입니다\. 첫 10분의 경험부터 보겠습니다/);
  assert.match(runtime, /검증 가능한 범위부터 말씀드리죠/);
  assert.match(runtime, /if \(focus === "dropoff_scale"\) return "첫 전투 이전에 빠져나가는 사용자 규모/);
  assert.match(runtime, /if \(focus === "user_experience"\) return "유저가 핵심 플레이보다 안내를 먼저 경험하는/);
  assert.match(runtime, /return "작은 범위에서 검증한 뒤 확대하겠다는 실행 순서는 확인했습니다/);
});

test("본 발표를 끝낸 뒤 정상적인 질문과 답변을 한 번 진행한 다음에만 수치 불일치가 발견된다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  const sequence = [
    "day5PresentationNormal",
    "day5NormalQaQuestion",
    "day5NormalQaAnswer",
    "day5NormalQaAccepted",
    "day5EvidenceRefresh",
    "day5EvaluatorHold",
    "day5Mismatch",
  ];
  for (let i = 1; i < sequence.length; i += 1) {
    assert.ok(ids.indexOf(sequence[i - 1]) < ids.indexOf(sequence[i]), `${sequence[i - 1]} < ${sequence[i]}`);
  }
  assert.equal(story.scenes.find((scene) => scene.id === "day5PresentationNormal").speaker, "한도윤");
  assert.equal(story.scenes.find((scene) => scene.id === "day5NormalQaQuestion").speaker, "평가위원");
  assert.equal(story.scenes.find((scene) => scene.id === "day5NormalQaAnswer").speaker, "한도윤");
  assert.equal(story.scenes.find((scene) => scene.id === "day5NormalQaAccepted").speaker, "평가위원");
});

test("18.4%는 발표다운 현재 성과 지표로 설명하고, 12.7%는 2024년 당시 자료로 구분한다", () => {
  const storySource = fs.readFileSync(path.join(root, "js/day5-story.js"), "utf8");
  const engineSource = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.doesNotMatch(storySource, /개선 결과/);
  assert.doesNotMatch(storySource, /그 결과.*18\.4%/);
  assert.doesNotMatch(storySource + engineSource, /확인값|개선 후 성과가 아니라/);
  assert.match(storySource, /최근 신규 유저의 7일 후 잔존율은 18\.4%\. 개선 여지가 분명하죠/);
  assert.match(engineSource, /현재 잔존율은 18\.4%, 12\.7%는 2024년 자료였습니다/);
  const mismatch = story.scenes.find((scene) => scene.id === "day5Mismatch");
  assert.match(mismatch.text, /발표 자료는 18\.4%인데 제출 근거에는 12\.7%가 표시됩니다/);
});

test("발표 대사는 60자 이하이고 말하는 인원수만 100명 단위로 반올림한다", () => {
  const start = story.scenes.findIndex((scene) => scene.id === "day5PresentationStart");
  const end = story.scenes.findIndex((scene) => scene.id === "day5PresentationEnd");
  for (const scene of story.scenes.slice(start, end + 1)) {
    const lines = [scene.text, ...(scene.choices || []).flatMap((choice) => [choice.text, choice.reply])];
    for (const line of lines.filter((value) => typeof value === "string")) assert.ok(line.length <= 60, `${scene.id}: ${line}`);
  }
  const problem = story.scenes.find((scene) => scene.id === "day5PresentationProblem");
  assert.match(problem.text, /1만 2,500여 명.*8,500여 명/);
  assert.deepEqual(problem.system.rows.slice(0, 2), ["신규 설치 · 12,480명", "첫 전투 도달 · 8,502명"]);
  assert.match(story.scenes.find((scene) => scene.id === "day5PresentationProblemScale").text, /약 4,000명.*31\.9%/);
});

test("미니게임 전환 장면은 검증 1단계의 정답을 먼저 말하지 않는다", () => {
  const normalProved = story.scenes.find((scene) => scene.id === "day5NormalProved");
  const submissionProved = story.scenes.find((scene) => scene.id === "day5SubmissionProved");
  assert.doesNotMatch(normalProved.text, /18\.4%/);
  assert.doesNotMatch(submissionProved.text, /18\.4%/);
  assert.equal(submissionProved.speaker, "서하린");
  const factSort = story.scenes.find((scene) => scene.id === "day5FactSort");
  assert.match(factSort.choices.find((choice) => choice.id === "verified_facts").text, /제출 직후에는 발표 자료와 근거 자료 모두 18\.4%였습니다/);
});

test("복구 보고와 개선안 재진술은 60자 이하 문장 화면으로 이어진다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  assert.equal(ids.indexOf("day5Resume") + 1, ids.indexOf("day5ResumeDetail"));
  assert.equal(ids.indexOf("day5ResumeDetail") + 1, ids.indexOf("day5ProposalRestatement"));
  assert.equal(ids.indexOf("day5ProposalRestatement") + 1, ids.indexOf("day5ProposalRestatementDetail"));
  assert.ok(ids.indexOf("day5ProposalRestatement") < ids.indexOf("day5ResumeContinue"));
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.match(runtime, /if \(scene\.dynamic === "proposalRestatement"\) return/);
  assert.match(runtime, /if \(scene\.dynamic === "resumeStatementDetail"\) return/);
  assert.doesNotMatch(runtime, /"day5StrategyCallback",\s*\n\s*"day5SpeculationCorrection",/);
});

test("복도 감사 인사는 선택형이며 진심 어린 답변에 호감도가 오른다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day5DoyunThanks");
  assert.equal(scene.choiceKey, "hallwayThanks");
  assert.equal(scene.choices.length, 3);
  assert.equal(scene.choices.find((choice) => choice.id === "personal_thanks").delta.affection, 1);
  assert.equal(scene.choices.find((choice) => choice.id === "professional_thanks").delta.trust, 1);
  assert.deepEqual(scene.choices.find((choice) => choice.id === "quiet_thanks").delta, {});
});

test("호감도 선택지의 대사와 하린의 답변은 지원 필요 여부와 호감도 수준에 따라 4가지로 갈린다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.match(runtime, /function personalThanksVariant\(affectionAtPoint\)/);
  assert.match(runtime, /if \(neededSupport\(\)\) return affectionAtPoint >= 5 \? PERSONAL_THANKS_VARIANTS\.supportedWarm : PERSONAL_THANKS_VARIANTS\.supported/);
  assert.match(runtime, /return affectionAtPoint >= 5 \? PERSONAL_THANKS_VARIANTS\.warm : PERSONAL_THANKS_VARIANTS\.plain/);
  for (const reply of [
    "기대할게요\\. 도윤 씨가 사주는 건 또 처음이니까요\\.",
    "그 말 들으니까 저도 괜히 웃음이 나네요\\. 다음엔 뭘 살지 벌써 기대돼요\\.",
    "그렇게 말해주니 오늘 하루가 아주 헛되진 않았네요\\. 다음엔 기다릴게요\\.",
    "그런 순간에도 그 생각이 났다니… 그거면 오늘 버틴 보람이 있네요\\. 다음엔 꼭 같이 가요\\.",
  ]) {
    assert.match(runtime, new RegExp(reply));
  }
  assert.match(runtime, /function resolveChoiceText\(scene, choice, affectionAtPoint = state\.affection\)/);
  assert.match(runtime, /function resolveChoiceReply\(scene, choice, affectionAtPoint = state\.affection\)/);
  assert.match(runtime, /const resolvedReply = resolveChoiceReply\(scene, choice, before\.affection\)/);
});

test("과거 저장 데이터의 발표 강조점 ID는 새 의미로 정상 해석된다", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.match(runtime, /Day5Story\.normalizePresentationFocus\(state\.decisions\.presentationFocus\)/);
});

test("DAY 5 CG preview URLs start immediately before each ending CG without saving progress", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  assert.match(runtime, /bad:\s*Object\.freeze\(\{ sceneId: "day5BadMessage", trust: -1, affection: 0 \}\)/);
  assert.match(runtime, /middle:\s*Object\.freeze\(\{ sceneId: "day5MiddleOutside", trust: 0, affection: 0 \}\)/);
  assert.match(runtime, /happy:\s*Object\.freeze\(\{ sceneId: "day5HappyPause", trust: 8, affection: 7 \}\)/);
  assert.match(runtime, /const progress = cgPreview\s*\? GameProgress\.load\(localStorage\)/);
  assert.match(runtime, /function saveProgress\(\) \{\s*if \(cgPreview\) return;/);
  assert.match(runtime, /function autoSaveAtCheckpoint\(scene\) \{\s*if \(cgPreview\) return;/);
  assert.match(runtime, /function unlockCg\(scene\) \{\s*if \(cgPreview \|\| !scene\.cgAssetId\) return;/);

  const ids = story.scenes.map((scene) => scene.id);
  for (const [beforeId, cgId] of [
    ["day5BadMessage", "day5BadEnd"],
    ["day5MiddleOutside", "day5MiddleEnd"],
    ["day5HappyPause", "day5HappyEnd"],
  ]) {
    assert.equal(ids.indexOf(beforeId) + 1, ids.indexOf(cgId));
    assert.ok(story.scenes.find((scene) => scene.id === cgId)?.cgAssetId);
  }
});

test("all DAY 5 ending CGs fill the complete desktop viewport", () => {
  const runtime = fs.readFileSync(path.join(root, "js/day5.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "css/day5.css"), "utf8");
  assert.match(runtime, /const endingCgActive = Boolean\(scene\.ending && scene\.cgAssetId\)/);
  assert.match(runtime, /classList\.toggle\("ending-cg-fullscreen", endingCgActive\)/);
  assert.match(css, /\.game\.ending-cg-fullscreen\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /\.game\.ending-cg-fullscreen \.messenger\s*\{[^}]*display:\s*none/s);
  assert.equal(story.scenes.filter((scene) => scene.ending && scene.cgAssetId).length, 3);
});

