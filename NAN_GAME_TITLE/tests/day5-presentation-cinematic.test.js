const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const gameRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(gameRoot, "day5.html"), "utf8");
const game = fs.readFileSync(path.join(gameRoot, "js/day5.js"), "utf8");
const cinematic = fs.readFileSync(path.join(gameRoot, "js/day5-presentation-cinematic.js"), "utf8");
const css = fs.readFileSync(path.join(gameRoot, "css/day5-presentation-cinematic.css"), "utf8");
const day5Css = fs.readFileSync(path.join(gameRoot, "css/day5.css"), "utf8");
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
  assert.match(game, /Day5PresentationCinematic\.apply\(scene,\s*resolvedSystem\)/);
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
  assert.match(story, /id:\s*"day5MismatchFollowup"[^]*?emphasis:\s*"12\.7%"/);
  assert.match(css, /\.stage\.day5-cine-bars/);
  assert.match(css, /\.stage\.day5-cine-shake/);
});

test("presentation waits on a dedicated instruction screen before 10:00", () => {
  assert.match(html, /id="day5-presentation-ready"/);
  assert.match(html, /대화가 완성되면 ‘다음’ 또는 Enter/);
  assert.match(html, /붉게 강조되는 수치는/);
  assert.match(html, /id="day5-presentation-ready-start"/);
  assert.match(cinematic, /day5ReadyToPresent:\s*Object\.freeze/);
  assert.match(cinematic, /READY_CONFIGS\[scene\?\.id\]/);
  assert.match(cinematic, /isLocked:\s*\(\) => readyLocked \|\| resultLocked \|\| memoryLocked \|\| typingLocked/);
  assert.match(cinematic, /next\.click\(\)/);
  assert.match(css, /\.stage\.day5-presentation-ready-active \.system-panel/);
});

test("error verification shows a minigame waiting screen before its evidence flow", () => {
  assert.match(story, /id:\s*"day5HarinPrompt"[^]*?id:\s*"day5VerificationReady"[^]*?id:\s*"day5FactSort"/);
  assert.match(cinematic, /day5VerificationReady:\s*Object\.freeze/);
  assert.match(cinematic, /title:\s*"오류 검증"/);
  assert.match(cinematic, /button:\s*"오류 검증 시작"/);
  assert.match(cinematic, /오류 검증 자료 준비 완료/);
  assert.match(cinematic, /전체 오류 검증이 기회 5개를 공유/);
  assert.match(cinematic, /‘근거 있음’ 표시가 있는 DAY 탭/);
  assert.match(cinematic, /READY_CONFIGS\[scene\?\.id\]\)\s*showReady\(scene\)/);
  assert.match(cinematic, /최종 결과 영향.*오늘의 엔딩과 마무리 장면을 결정합니다/);
});

test("presentation and verification instruction screens use one shared modal and never stack", () => {
  assert.equal((html.match(/id="day5-presentation-ready"/g) || []).length, 1);
  assert.equal((cinematic.match(/day5ReadyToPresent:\s*Object\.freeze/g) || []).length, 1);
  assert.equal((cinematic.match(/day5VerificationReady:\s*Object\.freeze/g) || []).length, 1);
  assert.match(cinematic, /if \(READY_CONFIGS\[scene\?\.id\]\) showReady\(scene\);\s*else hideReady\(\);/);
});

test("location transitions hide every presentation layer until movement finishes", () => {
  assert.match(locationTransition, /classList\.add\("location-transition-active"\)/);
  assert.match(locationTransition, /classList\.remove\("location-transition-active"\)/);
  assert.match(css, /\.location-transition-active \.system-panel/);
  assert.match(css, /\.location-transition-active \.day5-presentation-cinematic/);
  assert.match(css, /\.location-transition-active \.stage\.system-panel-active::before/);
});

test("presentation dialogue uses the regular character layer without side cutscenes", () => {
  assert.doesNotMatch(cinematic, /SIDE_CUT/);
  assert.doesNotMatch(cinematic, /applySideCut/);
  assert.doesNotMatch(css, /day5-side-cut/);
  assert.doesNotMatch(css, /--day5-side-cut-image/);
  assert.match(css, /\.stage\.day5-presentation-active \.character-layer\{[^}]*opacity:1[^}]*visibility:visible/);
  assert.match(story, /id:\s*"day5BossPrompt"[^]*?characters:\s*boss/);
  assert.match(story, /id:\s*"day5HarinPrompt"[^]*?characters:\s*harinConcerned/);
  assert.doesNotMatch(story, /id:\s*"day5StrategyCallback"[^}]*characters\s*:/);
  assert.match(story, /id:\s*"day5MinjaeConfront"[^]*?characters:\s*minjaeConcerned/);
});

test("recovery stays inside the cinematic overlay and keeps memory cuts accessible", () => {
  assert.match(story, /id:\s*"day5RecoveryRefresh"[^]*?choiceKey:\s*"recoveryRefresh"/);
  assert.match(story, /id:\s*"day5RecoverySource"[^]*?choiceKey:\s*"recoverySource"/);
  assert.match(story, /id:\s*"day5RecoveryBasis"[^]*?choiceKey:\s*"recoveryBasis"/);
  assert.match(story, /id:\s*"day5RecoveryBinding"[^]*?choiceKey:\s*"recoveryBinding"/);
  assert.match(cinematic, /day5RecoveryRefresh/);
  assert.match(cinematic, /day5RecoverySource/);
  assert.match(cinematic, /day5RecoveryBasis/);
  assert.match(cinematic, /day5RecoveryBinding/);
  assert.match(css, /\.day5-cinematic-background,[\s\S]*?\.day5-cinematic-impact\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.day5-cinematic-memory\[hidden\][^{]*\{[^}]*display:\s*none\s*!important/);
  assert.match(cinematic, /cancelMemory/);
  assert.match(css, /prefers-reduced-motion/);
});

test("error verification stays in the presentation room and resolves evidence through the cinematic result", () => {
  assert.doesNotMatch(story, /startFactVerification:\s*true/);
  assert.doesNotMatch(game, /mode:\s*"validation"/);
  assert.doesNotMatch(game, /finishFactVerification/);
  assert.match(story, /id:\s*"day5FactSort"[^]*?choiceKey:\s*"factVerification"/);
  assert.match(game, /Day5PresentationCinematic\.playChoiceResult/);
});

test("presentation decisions use the clue tab instead of static stage choices", () => {
  [
    "day5SpeculationCorrection",
    "day5FactSort",
    "day5AliasCheck",
    "day5OwnerQuestion",
    "day5CausalOrder",
    "day5Responsibility",
    "day5RecoveryRefresh",
    "day5RecoverySource",
    "day5RecoveryBasis",
    "day5RecoveryBinding",
  ].forEach((sceneId) => {
    assert.match(game, new RegExp(`${sceneId}: Object\\.freeze\\(\\{ clueIds:`));
  });
  assert.match(game, /pendingChoice = Boolean\(scene\.choices && !state\.decisions\[scene\.choiceKey\] && !pendingEvidence\)/);
  assert.match(game, /activateSideTab\("clues-view"\)/);
  assert.match(game, /function presentEvidence/);
  assert.match(game, /ClueMindmap\.render\(\$\("#clue-list"\),\s*\{[^]*?selection:/);
  assert.match(day5Css, /\.clue-list\.presentation-evidence-active \.clue-detail-orbit\.evidence-candidate/);
  assert.match(day5Css, /\.evidence-selection-progress/);
  assert.match(day5Css, /\.clue-day-tab\.has-evidence/);
  assert.match(day5Css, /\.clue-day-orbit\.has-evidence::after\s*\{[^}]*inset:\s*-9px -8px auto auto/s);
  assert.match(game, /day5FactSort:[^]*?showDayHint: true/);
  assert.match(game, /day5RecoveryRefresh:[^]*?showDayHint: true/);
  assert.match(game, /day5RecoverySource:[^]*?showDayHint: true/);
  assert.match(game, /day5RecoveryBasis:[^]*?showDayHint: true/);
  assert.match(game, /day5RecoveryBinding:[^]*?showDayHint: true/);
  assert.match(game, /showDayHint: Boolean\(prompt\.showDayHint\)/);
  assert.match(day5Css, /\.messenger-tabs button\.evidence-requested/);
  assert.match(game, /nextButton\.disabled = false/);
  assert.match(game, /nextButton\.textContent = scene\.end \? "DAY 5 완료" : "다음"/);
  assert.match(game, /classList\.remove\("presentation-evidence-mode"\)/);
});

test("opening the clue mind map preserves the default stage-to-sidebar ratio and status controls", () => {
  assert.doesNotMatch(game, /clue-panel-open/);
  assert.doesNotMatch(day5Css, /\.game\.clue-panel-open/);
});

test("Minjae responsibility is confirmed by the completed security audit, not the pending request", () => {
  assert.match(game, /day5Responsibility: Object\.freeze\(\{ clueIds: \["d3_direct_access_unconfirmed", "d5_security_audit_result"\], decision: "minjae_request_concealment"/);
  assert.doesNotMatch(game, /day5Responsibility: Object\.freeze\(\{ clueIds: \[[^\]]*"d4_audit_request"/);
  assert.match(story, /id:\s*"day5Responsibility"[^]*?choiceKey:\s*"responsibility"/);
});

test("fact verification reveals the answer through the presentation memory animation", () => {
  assert.match(story, /id:\s*"day5FactSort"[^]*?id:\s*"verified_facts"/);
  assert.match(cinematic, /day5FactSort:\s*choice\.id === "verified_facts"/);
  assert.match(cinematic, /playChoiceResult/);
  assert.match(cinematic, /playMemory\(cuts, scene\.id === "day5Responsibility" \? 1100 : 600\)/);
  assert.match(cinematic, /function playMemory\(cuts, finalHoldMs = 600\)/);
});

test("the error-verification sequence pauses for the security-audit result before identifying the requester", () => {
  assert.match(story, /id:\s*"day5FactSort"[^]*?choiceKey:\s*"factVerification"/);
  assert.match(story, /id:\s*"day5AliasCheck"[^]*?choiceKey:\s*"aliasVerification"/);
  assert.match(story, /id:\s*"day5AliasCheck"[^]*?id:\s*"day5AuditResult"[^]*?clue:\s*auditResult[^]*?id:\s*"day5AuditResultReview"[^]*?id:\s*"day5OwnerQuestion"/);
  assert.match(story, /id:\s*"day5OwnerQuestion"[^]*?choiceKey:\s*"ownerDistinction"/);
  assert.match(story, /id:\s*"day5CausalOrder"[^]*?choiceKey:\s*"causalChain"/);
  assert.match(story, /id:\s*"day5Responsibility"[^]*?choiceKey:\s*"responsibility"/);
  assert.match(story, /id:\s*"day5MinjaeConfront"/);
  assert.match(cinematic, /day5AliasCheck/);
  assert.match(cinematic, /day5AuditResult/);
  assert.match(cinematic, /day5AuditResultReview/);
  assert.match(cinematic, /day5OwnerQuestion/);
  assert.match(cinematic, /day5CausalOrder/);
  assert.match(cinematic, /day5Responsibility/);
  assert.match(story, /id:\s*"day5RecoverySource"/);
  assert.match(story, /id:\s*"day5RecoveryBinding"/);
});

test("security audit review opens the full audit log with execution and source-link records", () => {
  assert.match(story, /id:\s*"day5AuditResultReview"[^]*?auditCutin:\s*true/);
  assert.match(html, /id="security-audit-cutin"/);
  for (const clue of [
    "자동화 규칙 소유자", "서하린",
    "재활성화 요청 계정", "강민재",
    "실행 서비스", "나나봇",
    "표시 자료명", "7일 차 잔존율 검증본",
    "변경된 연결 대상", "2024년 이전 자료",
    "retention_7d_verified",
    "직접 수치 입력", "기록 없음",
  ]) {
    assert.match(html, new RegExp(clue));
  }
  assert.match(game, /scene\.propAssetId \|\| showAuditCutin/);
  assert.match(game, /auditCutin\.hidden = !showAuditCutin/);
});

test("failed verification reopens the full audit log source instead of leaving the generic incident slide visible", () => {
  assert.match(game, /scene\.id === "day5MinjaeWhy" && verificationGrade\(\) === "failed"/);
  assert.match(game, /const showAuditCutin = sceneShowsAuditCutin\(scene\)/);
  assert.match(story, /id:\s*"day5MinjaeWhy"[^]*?보안 감사 로그 원문 전체가 다시 열리고/);
});

test("security audit conclusion emphasizes the three role names inside the dialogue", () => {
  assert.match(story, /id:\s*"day5AuditResultReview"[^]*?emphasis:\s*\["서하린",\s*"강민재",\s*"나나봇"\]/);
});

test("verification and recovery end on one player-confirmed result screen using the existing minigame palette", () => {
  assert.match(story, /id:\s*"day5RecoveryVerify"[^]*?id:\s*"day5VerificationResult"[^]*?verificationResult:\s*true[^]*?id:\s*"day5Resume"/);
  assert.match(html, /id="day5-verification-result"/);
  assert.match(html, /INCIDENT RECOVERY · RESULT/);
  assert.match(html, /id="day5-verification-result-confirm"[^>]*>결과 확인</);
  assert.match(cinematic, /function showVerificationResult\(\)/);
  assert.match(cinematic, /resultLocked/);
  assert.match(css, /--result-coral:#df6871/);
  assert.match(css, /--result-paper:#fffaf4/);
});
