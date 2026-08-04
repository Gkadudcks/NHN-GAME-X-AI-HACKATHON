"use strict";

const DAY5_CHARACTER_PROFILES = Object.freeze({
  harin: Object.freeze({ name: "서하린", heightCm: 165 }),
  boss: Object.freeze({ name: "박태식", heightCm: 176 }),
  minjae: Object.freeze({ name: "강민재", heightCm: 178 }),
});
const DAY5_CHARACTER_BASE_HEIGHT = 182;
const DAY5_CHARACTER_STAGE_HEIGHT = 84;
const DAY5_CHARACTER_POSITIONS = Object.freeze({ farLeft: 18, left: 31, center: 50, right: 69, farRight: 82 });
function characterIdFromAsset(entry = {}) {
  if (entry.id) return entry.id;
  if (entry.assetId?.includes("harin")) return "harin";
  if (entry.assetId?.includes("boss")) return "boss";
  if (entry.assetId?.includes("minjae")) return "minjae";
  return "";
}
function characterIdFromSpeaker(speaker = "") {
  if (speaker === "서하린") return "harin";
  if (speaker === "박태식") return "boss";
  if (speaker === "강민재") return "minjae";
  return "";
}
function choicePromptLabel(scene) {
  const speaker = (scene?.speaker || "").trim();
  return speaker && !["한도윤", "시스템", "내레이션"].includes(speaker) ? speaker : "상황";
}
const scenes = Day5Story.scenes;
const PRESENTATION_EVIDENCE_PROMPTS = Object.freeze({
  day5SpeculationCorrection: Object.freeze({ clueIds: ["d4_evidence_submission"], decision: "return_to_evidence", title: "추측보다 제출 기록을 먼저 제시하세요." }),
  day5FactSort: Object.freeze({ clueIds: ["d4_evidence_submission"], decision: "verified_facts", title: "제출 당시 수치를 증명할 단서를 제시하세요.", showDayHint: true }),
  day5AliasCheck: Object.freeze({ clueIds: ["d2_inactive_automation", "d3_automation_run"], decision: "alias_changed_to_archive", title: "자료 연결이 바뀐 과정을 보여 줄 단서를 연결하세요.", showDayHint: true }),
  day5OwnerQuestion: Object.freeze({ clueIds: ["d3_direct_access_unconfirmed", "d5_security_audit_result"], decision: "distinguish_roles", title: "등록 담당자와 실제 요청자를 구분할 단서를 제시하세요.", showDayHint: true }),
  day5CausalOrder: Object.freeze({ clueIds: ["d2_inactive_automation", "d3_automation_run", "d4_evidence_submission", "d5_security_audit_result"], decision: "correct_chain", title: "요청부터 수치 변경까지 이어지는 기록을 제시하세요.", showDayHint: true }),
  day5Responsibility: Object.freeze({ clueIds: ["d3_direct_access_unconfirmed", "d5_security_audit_result"], decision: "minjae_request_concealment", title: "기록으로 확인되는 책임 범위를 제시하세요.", showDayHint: true }),
  day5RecoveryRefresh: Object.freeze({ clueIds: ["d3_automation_run"], decision: "pause_refresh", title: "자동 갱신을 먼저 멈춰야 하는 근거를 제시하세요.", showDayHint: true }),
  day5RecoverySource: Object.freeze({ clueIds: ["d2_cloud_restore_point"], decision: "current_week", title: "되돌릴 정상 원본을 증명할 단서를 제시하세요.", showDayHint: true }),
  day5RecoveryBasis: Object.freeze({ clueIds: ["d4_verified_retention"], decision: "new_users_current_week", title: "발표와 같은 분석 기준을 제시하세요.", showDayHint: true }),
  day5RecoveryBinding: Object.freeze({ clueIds: ["d4_evidence_submission"], decision: "fixed_source", title: "복구할 원본을 고정할 제출 기록을 제시하세요.", showDayHint: true }),
});
const VERIFICATION_SCENE_IDS = Object.freeze([
  "day5FactSort",
  "day5AliasCheck",
  "day5OwnerQuestion",
  "day5CausalOrder",
  "day5Responsibility",
]);
const RECOVERY_SCENE_IDS = Object.freeze([
  "day5RecoveryRefresh",
  "day5RecoverySource",
  "day5RecoveryBasis",
  "day5RecoveryBinding",
]);
const INCIDENT_MINIGAME_SCENE_IDS = Object.freeze([
  ...VERIFICATION_SCENE_IDS,
  ...RECOVERY_SCENE_IDS,
]);
const VERIFICATION_DECISIONS = Object.freeze([
  Object.freeze({ choiceKey: "factVerification", decision: "verified_facts" }),
  Object.freeze({ choiceKey: "aliasVerification", decision: "alias_changed_to_archive" }),
  Object.freeze({ choiceKey: "ownerDistinction", decision: "distinguish_roles" }),
  Object.freeze({ choiceKey: "causalChain", decision: "correct_chain" }),
  Object.freeze({ choiceKey: "responsibility", decision: "minjae_request_concealment" }),
]);
const VERIFICATION_MISTAKE_LIMIT = 5;
function evidencePromptFor(scene) {
  return PRESENTATION_EVIDENCE_PROMPTS[scene?.id] || null;
}
function locationAt(index) {
  for (let cursor = Math.min(index, scenes.length - 1); cursor >= 0; cursor -= 1) {
    if (sceneMatchesBranch(scenes[cursor]) && scenes[cursor]?.location) return scenes[cursor].location;
  }
  return "";
}
function bgmAt(index) {
  for (let cursor = Math.min(index, scenes.length - 1); cursor >= 0; cursor -= 1) {
    if (sceneMatchesBranch(scenes[cursor]) && scenes[cursor]?.bgm) return scenes[cursor].bgm;
  }
  return "";
}
const $ = (selector) => document.querySelector(selector);
const progress = new URLSearchParams(location.search).has("new") ? GameProgress.resetDay5(localStorage) : GameProgress.startDay5(localStorage);
const saved = progress.days[5];
const state = {
  index: Math.max(0, scenes.findIndex((scene) => scene.id === saved.sceneId)),
  work: progress.shared.work,
  affection: progress.shared.affection,
  trust: progress.shared.trust,
  clues: ClueRecords.normalizeList(progress.shared.clues),
  decisions: { ...saved.decisions },
  seenNotifications: { ...(progress.days[3]?.seenNotifications || {}), ...saved.seenNotifications },
  summariesSeen: { ...saved.summariesSeen },
  evidence: { ...saved.evidence },
  minigameResult: saved.minigameResult,
  ending: saved.ending,
  unreadClues: saved.seenNotifications?.["unread:clues"] === true,
};
const presentationClueIds = [...new Set(Object.values(PRESENTATION_EVIDENCE_PROMPTS).flatMap((prompt) => prompt.clueIds))];
presentationClueIds.forEach((id) => {
  if (state.clues.some((clue) => clue.id === id)) return;
  const archivedClue = ClueRecords.get(id);
  if (archivedClue) state.clues.push(archivedClue);
});
function sceneMatchesBranch(scene) {
  if (scene?.strategy && state.decisions.responseStrategy !== scene.strategy) return false;
  if (scene?.playerRecovery && verificationGrade() === "failed") return false;
  if (scene?.supportRecovery && verificationGrade() !== "failed") return false;
  if (scene?.ending && calculateEnding() !== scene.ending) return false;
  return true;
}

function verificationMistakes() {
  return Math.min(VERIFICATION_MISTAKE_LIMIT, Math.max(0, Number(state.decisions.verificationMistakes) || 0));
}

function verificationPlayerSolved() {
  const explicit = VERIFICATION_DECISIONS.filter(({ choiceKey }) => state.decisions[`${choiceKey}:playerSolved`] === true).length;
  const hasAssisted = VERIFICATION_DECISIONS.some(({ choiceKey }) => state.decisions[`${choiceKey}:assisted`] === true);
  const legacyComplete = VERIFICATION_DECISIONS.every(({ choiceKey, decision }) => state.decisions[choiceKey] === decision);
  return explicit === 0 && !hasAssisted && legacyComplete ? VERIFICATION_DECISIONS.length : explicit;
}

function verificationGrade() {
  if (state.decisions.verificationGrade) return state.decisions.verificationGrade;
  const mistakes = verificationMistakes();
  if (mistakes >= VERIFICATION_MISTAKE_LIMIT) return "failed";
  return mistakes === 0 ? "perfect" : "partial";
}

function verificationSequenceActive(scene) {
  const start = scenes.findIndex((item) => item.id === "day5VerificationReady");
  const end = scenes.findIndex((item) => item.id === "day5VerificationResult");
  const current = scenes.indexOf(scene);
  return start >= 0 && end >= start && current >= start && current <= end;
}

function recoverySequenceActive(scene) {
  const start = scenes.findIndex((item) => item.id === "day5RecoveryStart");
  const end = scenes.findIndex((item) => item.id === "day5VerificationResult");
  const current = scenes.indexOf(scene);
  return start >= 0 && end >= start && current >= start && current <= end;
}

function migrateLegacyVerificationFailure() {
  if (state.decisions.verificationGrade !== "failed") return;
  const start = scenes.findIndex((item) => item.id === "day5VerificationReady");
  const responsibility = scenes.findIndex((item) => item.id === "day5Responsibility");
  const supportRecovery = scenes.findIndex((item) => item.id === "day5SupportRecoveryStart");
  if (start < 0 || responsibility < 0 || supportRecovery < 0 || state.index < start || state.index > responsibility) return;
  state.decisions.verificationMistakes = VERIFICATION_MISTAKE_LIMIT;
  completeRecoveryWithSupport();
  state.index = supportRecovery;
}

function migrateVerificationPrelude() {
  const skippedPreludeIds = new Set([
    "day5StrategyCallback",
    "day5SpeculationCorrection",
    "day5NormalProved",
    "day5SubmissionProved",
    "day5Pause",
  ]);
  if (!skippedPreludeIds.has(scenes[state.index]?.id)) return;
  const verificationReady = scenes.findIndex((scene) => scene.id === "day5VerificationReady");
  if (verificationReady >= 0) state.index = verificationReady;
}

function syncVerificationLives(scene, feedback = "") {
  const hud = $("#day5-verification-lives");
  const stage = $("#stage");
  if (!hud || !stage) return;
  const active = verificationSequenceActive(scene);
  hud.hidden = !active;
  if (!active) return;
  const remaining = VERIFICATION_MISTAKE_LIMIT - verificationMistakes();
  const supportMode = recoverySequenceActive(scene) && verificationGrade() === "failed";
  const phaseLabel = $("#day5-verification-phase-label");
  if (phaseLabel) phaseLabel.textContent = supportMode ? "담당자 지원" : recoverySequenceActive(scene) ? "원본 복구" : "오류 검증";
  $("#day5-verification-life-label").textContent = `${remaining} / ${VERIFICATION_MISTAKE_LIMIT}`;
  $("#day5-verification-life-cells").querySelectorAll("i").forEach((cell, index) => {
    cell.classList.toggle("lost", index >= remaining);
  });
  hud.classList.toggle("support-mode", supportMode);
  if (!feedback) return;
  const hudClass = feedback === "success" ? "feedback-success" : feedback === "failed" ? "feedback-failed" : "feedback-hit";
  const stageClass = feedback === "success" ? "verification-success-flash" : feedback === "failed" ? "verification-failed-flash" : "verification-hit-flash";
  hud.classList.remove("feedback-success", "feedback-hit", "feedback-failed");
  stage.classList.remove("verification-success-flash", "verification-hit-flash", "verification-failed-flash");
  void hud.offsetWidth;
  hud.classList.add(hudClass);
  stage.classList.add(stageClass);
  window.clearTimeout(verificationFeedbackTimer);
  verificationFeedbackTimer = window.setTimeout(() => {
    hud.classList.remove("feedback-success", "feedback-hit", "feedback-failed");
    stage.classList.remove("verification-success-flash", "verification-hit-flash", "verification-failed-flash");
  }, feedback === "failed" ? 760 : 520);
}

function recoveryComplete() {
  return state.decisions.recoveryRefresh === "pause_refresh"
    && state.decisions.recoverySource === "current_week"
    && state.decisions.recoveryBasis === "new_users_current_week"
    && state.decisions.recoveryBinding === "fixed_source";
}

function calculateEnding() {
  const grade = verificationGrade();
  const recoveryFinished = Boolean(state.decisions.recoveryBinding);
  if (state.trust < 0) return "bad";
  if (grade === "failed") return "bad";
  if (recoveryFinished && state.decisions.recoveryBinding !== "fixed_source") return "bad";
  if (recoveryComplete() && state.trust >= 8 && state.affection >= 7) return "happy";
  return "middle";
}
function nextSceneIndex(fromIndex) {
  if (scenes[fromIndex]?.id === "day5RecoveryStart" && verificationGrade() === "failed") {
    completeRecoveryWithSupport();
    const supportRecovery = scenes.findIndex((scene) => scene.id === "day5SupportRecoveryStart");
    if (supportRecovery >= 0) return supportRecovery;
  }
  if (scenes[fromIndex]?.id === "day5HarinPrompt") {
    const verificationReady = scenes.findIndex((scene) => scene.id === "day5VerificationReady");
    if (verificationReady >= 0) return verificationReady;
  }
  for (let cursor = fromIndex + 1; cursor < scenes.length; cursor += 1) {
    if (sceneMatchesBranch(scenes[cursor])) return cursor;
  }
  return scenes.length - 1;
}
function normalizeSceneIndex() {
  if (!sceneMatchesBranch(scenes[state.index])) state.index = nextSceneIndex(state.index - 1);
}
function getBgmVolume() {
  const settings = GameSettings.load(localStorage);
  return settings.masterMuted || settings.bgmMuted ? 0 : (settings.masterVolume / 100) * (settings.bgmVolume / 100);
}
const bgmManager = new GameBgmManager($("#bgm"), getBgmVolume);
window.BGMManager = bgmManager;
bgmManager.preload(["daily", "harin", "mystery", "presentationCalm", "presentationUrgent", "minigame", "overtime", "badEnding", "middleEnding", "happyEnding"]);
let pauseMenu;
let locked = false;
let choiceResultTimer;
let currentRoom = "";
let activeStatHelp = null;
let cinematicLocked = false;
let cinematicTimer;
let cinematicScene = null;
let cinematicDeadline = 0;
let cinematicRemaining = 0;
let cinematicPaused = false;
let deferNextNotification = false;
let verificationFeedbackTimer;
let verificationFailBannerTimer;
const locationTransition = GameLocationTransition.install();
const day5Start = progress.day5StartSnapshot || { work: 0, affection: 0, trust: 0, clues: [] };
const AUTOSAVE_CHECKPOINTS = new Set(["day5PresentationStart", "day5Mismatch", "day5AuditArrives", "day5Result", "day5BadEnd", "day5MiddleEnd", "day5HappyEnd"]);
function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

const STAT_LABELS = Object.freeze({
  work: "◆ 업무력",
  affection: "♡ 호감도",
  trust: "◇ 신뢰도",
});

function choiceEffects(delta = {}) {
  const entries = Object.entries(delta).filter(([key, value]) => STAT_LABELS[key] && value !== 0);
  return entries.length ? entries : [["branch", 0]];
}

function choiceEffectMarkup(delta = {}) {
  return choiceEffects(delta).map(([key, value]) => {
    if (key === "branch") return '<i class="branch stat-branch"><b>↗</b><span>스토리 분기</span></i>';
    const icons = { work: "▤", affection: "♥", trust: "♢" };
    const label = STAT_LABELS[key].slice(2);
    return `<i class="${value > 0 ? "gain" : "loss"} stat-${key}"><b>${icons[key]}</b><span>${label}</span><em>${value > 0 ? "▲" : "▼"} ${Math.abs(value)}</em></i>`;
  }).join("");
}

function choiceLock(choice) {
  const required = Number(choice?.minAffection);
  return Number.isFinite(required) && state.affection < required ? { required, current: state.affection } : null;
}

function saveProgress() {
  progress.currentDay = 5;
  progress.shared.work = state.work;
  progress.shared.affection = state.affection;
  progress.shared.trust = state.trust;
  progress.shared.clues = ClueRecords.normalizeList(state.clues);
  progress.days[5] = {
    sceneId: scenes[state.index]?.id || "day5Intro",
    decisions: { ...state.decisions },
    seenNotifications: { ...state.seenNotifications, "unread:clues": state.unreadClues },
    summariesSeen: { ...state.summariesSeen },
    evidence: { ...state.evidence },
    minigameResult: state.minigameResult,
    ending: calculateEnding(),
    complete: progress.days[5].complete,
  };
  GameProgress.save(localStorage, progress);
}

function saveDay5Slot(checkpoint) {
  saveProgress();
  const scene = scenes[state.index] || scenes[0];
  const snapshot = GameProgress.load(localStorage);
  GameProgress.saveAutoSlot(localStorage, `day5:${checkpoint}`, {
    day: 5,
    sceneTitle: "정직원 전환 발표",
    sceneTime: scene.time,
    savedAt: snapshot.savedAt,
    resumeUrl: "day5.html",
    work: state.work,
    affection: state.affection,
    trust: state.trust,
    lastDialogue: { speaker: scene.speaker, text: dynamicText(scene) },
    thumbnail: "assets/image/office-background.png",
    progress: snapshot,
  });
}

async function unlockAudio() {
  const sceneBgm = bgmAt(state.index);
  const played = sceneBgm
    ? await bgmManager.play(sceneBgm, { fadeIn: 200 })
    : await bgmManager.resume();
  syncBgmUi(played);
  return played;
}

function syncBgmUi(played = !bgmManager.isPaused()) {
  const audible = played && getBgmVolume() > 0;
  $("#mute").classList.toggle("muted", !audible);
  $("#sound-prompt").classList.toggle("hidden", audible);
}

async function toggleBgm() {
  if (bgmManager.isPaused()) await unlockAudio();
  else {
    await bgmManager.pause();
    syncBgmUi(false);
  }
}

function autoSaveAtCheckpoint(scene) {
  if (!AUTOSAVE_CHECKPOINTS.has(scene.id)) return;
  const result = GameProgress.saveAutoSlot(localStorage, `day5:${scene.id}`, buildGameSavePayload(scene));
  if (result.status === "saved" || result.status === "updated") toast(`SLOT ${String(result.slotId).padStart(2, "0")}에 자동 저장했습니다.`);
}

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  window.setTimeout(() => $("#toast").classList.remove("show"), 1700);
}

function formatGameSavedAt(value) {
  if (!value) return "아직 수동 저장하지 않음";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

let gameSaveMode = "save";
let gameSavePauseHeld = false;
let gameSaveReturnFocus = null;

function buildGameSavePayload(scene) {
  saveProgress();
  const snapshot = GameProgress.load(localStorage);
  return {
    day: 5,
    sceneTitle: "정직원 전환 발표",
    sceneTime: scene.time,
    savedAt: snapshot.savedAt,
    resumeUrl: "day5.html",
    work: state.work,
    affection: state.affection,
    trust: state.trust,
    lastDialogue: { speaker: scene.speaker, text: dynamicText(scene) },
    thumbnail: "assets/image/office-background.png",
    progress: snapshot,
    day1Save: localStorage.getItem(GameProgress.LEGACY_DAY1_KEY) ? JSON.parse(localStorage.getItem(GameProgress.LEGACY_DAY1_KEY)) : null,
  };
}

function renderGameSaveSlots() {
  const scene = scenes[state.index] || scenes[0];
  const loading = gameSaveMode === "load";
  $("#game-save-list").replaceChildren(...GameProgress.getSaveSlots(localStorage).map((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `game-save-slot${slot.empty ? " empty" : ""}${slot.saveType === "auto" ? " autosave" : ""}`;
    button.disabled = loading && slot.empty;
    const day = slot.empty ? 4 : slot.day;
    const time = slot.empty ? scene.time : (slot.sceneTime || "--:--");
    const title = slot.empty ? "빈 저장 슬롯" : `DAY ${slot.day} · ${slot.sceneTitle}`;
    const stats = slot.empty ? (loading ? "불러올 저장 데이터가 없습니다." : "현재 진행을 이 슬롯에 새로 저장합니다.") : `업무력 ${slot.work} · 호감도 ${slot.affection} · 신뢰도 ${slot.trust}`;
    const command = loading ? (slot.empty ? "빈 슬롯" : "불러오기") : (slot.empty ? "새로 저장" : "덮어쓰기");
    button.innerHTML = `<span class="game-save-thumbnail${slot.empty ? " empty" : ""}"><b>${slot.empty ? "SLOT" : "DAY"} <em>${slot.empty ? String(slot.slotId).padStart(2, "0") : day}</em></b><small>${slot.empty ? "EMPTY" : time}</small></span><span class="game-save-body"><small>SLOT ${String(slot.slotId).padStart(2, "0")} · ${slot.empty ? "EMPTY SLOT" : slot.saveType === "auto" ? "AUTO SAVE" : "SAVED PROGRESS"}</small><strong>${title}</strong><span>${stats}</span><time>${slot.empty ? "저장 데이터 없음" : formatGameSavedAt(slot.savedAt)}</time></span>${slot.saveType === "auto" ? '<span class="game-autosave-badge">AUTO SAVE</span>' : ""}<span class="game-save-command">${command} <b>›</b></span>`;
    button.onclick = () => loading ? loadFromGameSlot(slot) : saveToGameSlot(slot.slotId, !slot.empty);
    return button;
  }));
}

function openGameSave(mode = "save") {
  const modal = $("#game-save-modal");
  if (!modal.classList.contains("open")) {
    const active = document.activeElement;
    gameSaveReturnFocus = active?.closest?.("#pause-menu") ? null : active;
    gameSavePauseHeld = true;
    document.dispatchEvent(new CustomEvent("nan:pause-open"));
    pauseCinematic();
  }
  gameSaveMode = mode;
  const loading = mode === "load";
  $("#game-save-kicker").textContent = loading ? "LOAD PROGRESS" : "SAVE PROGRESS";
  $("#game-save-title").textContent = loading ? "진행 불러오기" : "진행 저장";
  $("#game-save-guide").textContent = loading ? "불러올 카드를 선택하세요. 현재 진행은 선택한 저장 시점으로 바뀝니다." : "저장할 카드를 선택하세요. 타이틀의 이어하기와 같은 슬롯에 연동됩니다.";
  $("#game-save-help").textContent = loading ? "빈 슬롯은 선택할 수 없습니다. 다른 DAY의 저장도 바로 불러올 수 있습니다." : "빈 슬롯에는 새로 저장하고, 사용 중인 슬롯에는 확인 후 덮어씁니다.";
  renderGameSaveSlots();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => ($("#game-save-list button:not(:disabled)") || $("#game-save-close"))?.focus(), 50);
}

function closeGameSave() {
  const modal = $("#game-save-modal");
  if (!modal.classList.contains("open")) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (gameSavePauseHeld) {
    gameSavePauseHeld = false;
    document.dispatchEvent(new CustomEvent("nan:pause-close"));
    resumeCinematic();
  }
  const fallback = $(`#${gameSaveMode === "load" ? "load" : "save"}`);
  const target = gameSaveReturnFocus?.isConnected ? gameSaveReturnFocus : fallback;
  gameSaveReturnFocus = null;
  target?.focus();
}

function trapGameSaveFocus(event) {
  const modal = $("#game-save-modal");
  if (event.key !== "Tab" || !modal.classList.contains("open")) return false;
  const focusable = [...modal.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.closest("[hidden]") && element.getAttribute("aria-hidden") !== "true");
  if (!focusable.length) {
    event.preventDefault();
    modal.focus();
    return true;
  }
  const first = focusable[0];
  const last = focusable.at(-1);
  const active = document.activeElement;
  if (!modal.contains(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return true;
  }
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

function saveToGameSlot(slotId, occupied) {
  if (occupied && !confirm(`SLOT ${String(slotId).padStart(2, "0")}의 기존 저장을 덮어쓸까요?`)) return;
  const scene = scenes[state.index] || scenes[0];
  const result = GameProgress.saveManualSlot(localStorage, slotId, buildGameSavePayload(scene));
  if (result.status !== "saved") return toast("이 브라우저에서는 슬롯을 저장할 수 없습니다.");
  closeGameSave();
  toast(`SLOT ${String(slotId).padStart(2, "0")}에 저장했습니다.`);
}

function loadFromGameSlot(slot) {
  if (slot.empty || !slot.progress) return;
  if (!confirm(`SLOT ${String(slot.slotId).padStart(2, "0")}의 진행을 불러올까요?\n현재 저장하지 않은 진행은 사라집니다.`)) return;
  localStorage.setItem(GameProgress.STORAGE_KEY, JSON.stringify(slot.progress));
  if (slot.day1Save) localStorage.setItem(GameProgress.LEGACY_DAY1_KEY, JSON.stringify(slot.day1Save));
  else localStorage.removeItem(GameProgress.LEGACY_DAY1_KEY);
  location.href = slot.resumeUrl || (Number(slot.day) === 5 ? "day5.html" : Number(slot.day) === 4 ? "day4.html" : Number(slot.day) === 3 ? "day3.html" : Number(slot.day) === 2 ? "day2.html" : "game.html");
}

function addClue(clue) {
  if (!clue || state.clues.some((item) => item.id === clue.id)) return;
  state.clues.push({ ...clue });
  state.unreadClues = !$("#clues-view").classList.contains("active");
  if (clue.id === "d4_audit_request") state.evidence.auditRequested = true;
  if (clue.id === "d5_security_audit_result") {
    state.evidence.auditResolved = true;
    state.evidence.requestAccount = "강민재";
    state.evidence.executionService = "나나봇";
  }
  if (clue.id === "d4_verified_retention") state.evidence.verifiedRetention = 18.4;
  if (clue.id === "d4_evidence_submission") {
    state.evidence.packageId = "EVD-D4-1708";
    state.evidence.submittedAt = "DAY 5 · 17:08";
    state.evidence.ptValue = 18.4;
    state.evidence.evidenceValue = 18.4;
    state.evidence.sourceAlias = "retention_7d_verified";
  }
}

function renderRecords() {
  $("#clue-count").textContent = state.clues.length;
  $("#clue-new").hidden = !state.unreadClues;
  const scene = scenes[state.index];
  const prompt = evidencePromptFor(scene);
  $("#clue-list").classList.toggle("presentation-evidence-active", Boolean(prompt && !state.decisions[scene.choiceKey]));
  if (prompt && !state.decisions[scene.choiceKey]) {
    const selected = new Set(state.decisions[`${scene.choiceKey}:evidence`] || []);
    const nextRequiredId = prompt.clueIds.find((id) => !selected.has(id));
    const nextRequiredClue = state.clues.find((clue) => clue.id === nextRequiredId);
    if (nextRequiredClue) $("#clue-list").dataset.selectedDay = String(nextRequiredClue.day);
    ClueMindmap.render($("#clue-list"), {
      clues: state.clues,
      currentDay: 5,
      selection: {
        clueIds: prompt.clueIds,
        selectedIds: [...selected],
        showDayHint: Boolean(prompt.showDayHint),
        prompt: `${prompt.title} · ${selected.size}/${prompt.clueIds.length}${INCIDENT_MINIGAME_SCENE_IDS.includes(scene.id) ? ` · 실수 ${verificationMistakes()}/${VERIFICATION_MISTAKE_LIMIT}` : ""}`,
        onSelect: (clue) => presentEvidence(scene, prompt, clue.id),
      },
    });
    return;
  }
  if (!state.clues.length) {
    $("#clue-list").innerHTML = '<div class="clue-empty"><span>◇</span><strong>아직 기록된 단서가 없습니다</strong><p>대화와 자료를 조사하면 중요한 정보가 여기에 정리됩니다.</p></div>';
    return;
  }
  ClueMindmap.render($("#clue-list"), { clues: state.clues, currentDay: 5 });
}

function activateSideTab(tabId) {
  document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item.dataset.tab === tabId));
  document.querySelectorAll(".side-view").forEach((view) => view.classList.toggle("active", view.id === tabId));
}

function presentEvidence(scene, prompt, clueId) {
  const selected = new Set(state.decisions[`${scene.choiceKey}:evidence`] || []);
  if (!prompt.clueIds.includes(clueId)) {
    registerVerificationMistake(scene);
    saveProgress();
    return;
  }
  if (selected.has(clueId)) return;
  selected.add(clueId);
  state.decisions[`${scene.choiceKey}:evidence`] = [...selected];
  if (prompt.clueIds.every((id) => selected.has(id))) {
    const choice = scene.choices.find((item) => item.id === prompt.decision);
    if (choice) selectChoice(scene, choice);
    activateSideTab("messages-view");
    toast("근거가 발표 자료에 제시되었습니다.");
  } else {
    UiSfx.playPresentationCue("evidenceMatch");
    toast("단서가 연결되었습니다. 다음 근거를 제시하세요.");
  }
  renderRecords();
  saveProgress();
}

function completeVerificationWithSupport() {
  VERIFICATION_DECISIONS.forEach(({ choiceKey, decision }) => {
    if (!state.decisions[choiceKey]) state.decisions[choiceKey] = decision;
    if (!state.decisions[`${choiceKey}:playerSolved`]) state.decisions[`${choiceKey}:assisted`] = true;
  });
  state.decisions.verificationGrade = "failed";
}

function completeRecoveryWithSupport() {
  const supportedRecovery = {
    recoveryRefresh: "pause_refresh",
    recoverySource: "current_week",
    recoveryBasis: "new_users_current_week",
    recoveryBinding: "fixed_source",
  };
  Object.entries(supportedRecovery).forEach(([choiceKey, decision]) => {
    if (!state.decisions[choiceKey]) state.decisions[choiceKey] = decision;
    state.decisions[`${choiceKey}:assisted`] = true;
  });
}

function registerVerificationMistake(scene) {
  if (!INCIDENT_MINIGAME_SCENE_IDS.includes(scene.id) || verificationMistakes() >= VERIFICATION_MISTAKE_LIMIT) return;
  const mistakes = Math.min(VERIFICATION_MISTAKE_LIMIT, verificationMistakes() + 1);
  state.decisions.verificationMistakes = mistakes;
  state.trust -= 1;
  const remaining = VERIFICATION_MISTAKE_LIMIT - mistakes;
  let speaker = "평가위원";
  let feedback = "그 기록만으로는 단정하기 어렵습니다. 현재 질문을 직접 증명하는 단서를 다시 확인해 주세요.";
  if (mistakes === 2) {
    speaker = "서하린";
    feedback = "지금 필요한 사실이 기록된 DAY 탭부터 다시 확인해요. ‘근거 있음’ 표시가 있는 단서가 직접적인 증거예요.";
  }
  if (mistakes >= VERIFICATION_MISTAKE_LIMIT) {
    speaker = "시스템 담당자";
    feedback = "직접 처리를 중단합니다. 남은 검증과 원본 복구는 보안 감사 원문을 기준으로 담당자가 지원하겠습니다.";
    completeVerificationWithSupport();
    completeRecoveryWithSupport();
    const targetIndex = scenes.findIndex((item) => item.id === "day5SupportRecoveryStart");
    if (targetIndex >= 0) state.index = targetIndex;
    render();
  }
  UiSfx.playMinigameCue(mistakes >= VERIFICATION_MISTAKE_LIMIT ? "caught" : "warning");
  syncVerificationLives(scene, mistakes >= VERIFICATION_MISTAKE_LIMIT ? "failed" : "hit");
  $("#speaker").textContent = speaker;
  $("#dialogue").textContent = feedback;
  syncStats();
  toast(mistakes >= VERIFICATION_MISTAKE_LIMIT ? "직접 처리 실패 · 담당자 보조로 전환됩니다." : `잘못된 근거입니다. 남은 실수 기회 ${remaining}회`);
  renderRecords();
}

const MESSAGE_DAY_NAMES = Object.freeze(["", "월요일", "화요일", "수요일", "목요일", "금요일"]);

function sceneIndex(id) {
  return scenes.findIndex((scene) => scene.id === id);
}

function isAtOrAfter(id) {
  const target = sceneIndex(id);
  return target >= 0 && state.index >= target;
}

function messageDay(message) {
  const explicit = Number(message.day);
  if (explicit >= 1 && explicit <= 5) return explicit;
  const embedded = String(message.time || "").match(/DAY\s*([1-5])/i);
  return embedded ? Number(embedded[1]) : 5;
}

function messageClock(message) {
  return String(message.time || "").replace(/^DAY\s*[1-5]\s*·\s*/i, "");
}

function visibleMessages(room) {
  return Day5Story.MESSAGES.filter((message) => message.room === room && (messageDay(message) < 5 || isAtOrAfter(message.at)));
}

function messageText(message) {
  if (message.text) return message.text;
  if (message.dynamic === "workAlertMessage") return "조사 요청 처리 결과를 확인했어요. 보존한 기록을 이어서 검토해요.";
  if (message.dynamic === "eveningMessage") return "오늘 확인한 조사 기록은 그대로 보존해요. 내일 이어서 확인하겠습니다.";
  return "";
}

function unreadCount(room) {
  const count = Number(state.seenNotifications[`unread:count:${room}`]);
  if (Number.isFinite(count) && count > 0) return Math.floor(count);
  return state.seenNotifications[`unread:${room}`] === true ? 1 : 0;
}

function markUnread(room) {
  if (!room) return;
  state.seenNotifications[`unread:${room}`] = true;
  state.seenNotifications[`unread:count:${room}`] = unreadCount(room) + 1;
}

function clearUnread(room) {
  state.seenNotifications[`unread:${room}`] = false;
  state.seenNotifications[`unread:count:${room}`] = 0;
}

function renderMessageTabAlert({ pulse = false } = {}) {
  const tab = document.querySelector('[data-tab="messages-view"]');
  const badge = $("#message-new");
  const count = Object.keys(Day5Story.ROOMS).reduce((sum, room) => sum + unreadCount(room), 0);
  badge.textContent = String(count);
  badge.hidden = count === 0;
  tab.classList.toggle("has-unread", count > 0);
  if (pulse && count > 0 && $("#clues-view").classList.contains("active")) {
    tab.classList.remove("message-tab-alert");
    void tab.offsetWidth;
    tab.classList.add("message-tab-alert");
    window.setTimeout(() => tab.classList.remove("message-tab-alert"), 1900);
  }
}

function renderMessages() {
  const rooms = Object.keys(Day5Story.ROOMS);
  const visibleRooms = rooms.filter((room) => visibleMessages(room).length);
  $("#chat-list-empty").hidden = visibleRooms.length > 0;
  rooms.forEach((room) => {
    const button = $(`#chat-${room}`);
    const messages = visibleMessages(room);
    if (!button) return;
    button.hidden = messages.length === 0;
    if (!messages.length) return;
    const latest = messages.at(-1);
    button.querySelector(".chat-copy small").textContent = `${latest.sender}: ${messageText(latest)}`;
    button.querySelector("time").textContent = messageClock(latest);
    const count = unreadCount(room);
    const unread = count > 0 && currentRoom !== room;
    button.querySelector("em").textContent = String(count);
    button.querySelector("em").hidden = !unread;
    button.classList.toggle("unread-pulse", unread);
  });
  renderMessageTabAlert();
  if (!currentRoom) return;
  const box = $("#messages");
  let renderedDay = 0;
  box.innerHTML = visibleMessages(currentRoom).map((message) => {
    const day = messageDay(message);
    const divider = day === renderedDay ? "" : `<div class="message-day-divider"><span>DAY ${day} · ${MESSAGE_DAY_NAMES[day]}</span></div>`;
    renderedDay = day;
    return `${divider}<article class="message"><b>${escapeHtml(message.sender)}</b><p>${escapeHtml(messageText(message))}</p><small>${escapeHtml(messageClock(message))}</small></article>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

function playMessageSfx() {
  const settings = GameSettings.load(localStorage);
  const volume = settings.masterMuted || settings.sfxMuted ? 0 : (settings.masterVolume / 100) * (settings.sfxVolume / 100);
  const audio = $("#message-sfx");
  audio.volume = Math.min(1, Math.max(0, volume));
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function notifyMessage(id) {
  if (!id || state.seenNotifications[`notified:${id}`]) return;
  const message = Day5Story.MESSAGES.find((entry) => entry.id === id);
  if (!message) return;
  state.seenNotifications[`notified:${id}`] = true;
  if (currentRoom !== message.room) markUnread(message.room);
  $("#messenger").classList.remove("message-arrived");
  void $("#messenger").offsetWidth;
  $("#messenger").classList.add("message-arrived");
  renderMessages();
  renderMessageTabAlert({ pulse: true });
  playMessageSfx();
  toast(`${Day5Story.ROOMS[message.room].title.replace(/^# /, "")}에 새 메시지가 도착했습니다.`);
  window.setTimeout(() => $("#messenger").classList.remove("message-arrived"), 1900);
}

function openChat(roomId) {
  const room = Day5Story.ROOMS[roomId];
  if (!room) return;
  currentRoom = roomId;
  $("#room-type").textContent = room.type;
  $("#room-title").textContent = room.title;
  $("#room-members").innerHTML = room.members.map((member) => `<span>${escapeHtml(member)}</span>`).join("");
  $("#chat-list").hidden = true;
  $("#chat-room").hidden = false;
  clearUnread(roomId);
  renderMessages();
  saveProgress();
}

function closeChat() {
  currentRoom = "";
  $("#chat-room").hidden = true;
  $("#chat-list").hidden = false;
  renderMessages();
}

const STAT_HELP = Object.freeze({
  work: ["업무력", "자료 검증, 기록 정리, 실무 선택에서 오릅니다."],
  affection: ["호감도", "서하린과의 개인적인 교감과 배려를 나타냅니다."],
  trust: ["신뢰도", "협업 태도와 근거 중심 판단에 대한 신뢰입니다."],
});

function closeStatHelp({ restoreFocus = false } = {}) {
  const previous = activeStatHelp;
  activeStatHelp = null;
  document.querySelectorAll(".stat-help").forEach((button) => button.setAttribute("aria-expanded", "false"));
  $("#stat-help-popover").hidden = true;
  if (restoreFocus) previous?.focus();
}

function openStatHelp(button) {
  const [title, detail] = STAT_HELP[button.dataset.stat] || [];
  if (!title) return;
  const rect = button.getBoundingClientRect();
  const popover = $("#stat-help-popover");
  popover.innerHTML = `<b>${title}</b><p>${detail}</p>`;
  popover.style.left = `${Math.max(12, rect.left - 110)}px`;
  popover.style.top = `${Math.max(12, rect.top - 92)}px`;
  popover.hidden = false;
  button.setAttribute("aria-expanded", "true");
  activeStatHelp = button;
}

function dynamicText(scene) {
  const escapedDay4 = progress.days[4]?.minigameResult && !progress.days[4].minigameResult.caught;
  if (scene.dynamic === "day4ResultGreeting") return escapedDay4 ? "생각보다 일찍 왔네요. 어제 저녁에는 그렇게 여유 있어 보이더니." : "어제 늦게 갔는데도 일찍 왔네요. 잠은 제대로 잤어요?";
  if (scene.dynamic === "day4ResultReply") return escapedDay4 ? "어제는 선배 덕분에 긴장을 좀 풀었습니다. 오늘은 제가 먼저 준비해 두려고 했고요." : "네. 어제 확인을 끝내고 간 덕분에 마음은 오히려 편했습니다.";
  if (scene.dynamic === "day4ResultClose") return escapedDay4 ? "그럼 어제 저녁도 나름 도움이 됐네요. 너무 일찍부터 긴장하지만 말아요." : "다행이네요. 오늘은 확인한 기록을 믿고 발표에만 집중해요.";
  if (scene.dynamic === "presentationOpening") {
    if (state.decisions.presentationFocus === "verification") return "정직원 전환 발표를 시작하겠습니다. 먼저 18.4%의 정상 원본과 교차 검증 과정부터 설명드리겠습니다.";
    if (state.decisions.presentationFocus === "user_experience") return "정직원 전환 발표를 시작하겠습니다. 신규 사용자가 실제로 체감한 개선 효과부터 말씀드리겠습니다.";
    return "정직원 전환 발표를 시작하겠습니다. 자동화는 보조 도구로만 사용했고 최종 수치는 사람이 검증했습니다.";
  }
  if (scene.dynamic === "presentationFocusDetail") {
    if (state.decisions.presentationFocus === "verification") return "이번 발표에서 가장 먼저 말씀드릴 부분은 결과보다 검증 과정입니다. 동일한 원본과 계산식을 두 차례 확인해 수치가 우연히 맞은 것이 아닌지 검증했습니다.";
    if (state.decisions.presentationFocus === "user_experience") return "이번 개선의 목적은 숫자만 높이는 것이 아니었습니다. 신규 사용자가 첫 목표를 더 빨리 이해하고, 실제 플레이의 재미까지 도달하도록 경험의 순서를 바꾸는 것이었습니다.";
    return "자동화가 계산 결과를 대신 판단하게 두지 않았습니다. 자동화는 반복 작업을 보조했고, 대상과 기간을 고정해 최종 수치를 승인한 것은 사람의 검증 과정이었습니다.";
  }
  if (scene.dynamic === "strategySetup") {
    if (state.decisions.responseStrategy === "defend_evidence") return "정상 원본과 DAY 2 교차 검증 기록을 첫 번째 증거 창에 열어 두겠습니다.";
    if (state.decisions.responseStrategy === "clarify_scope") return "대상과 기간을 바로 확인할 수 있도록 두 자료의 산정 기준을 나란히 띄워 두겠습니다.";
    if (state.decisions.responseStrategy === "coordinate_harin") return "선배는 정상 원본 창을 맡아 주십시오. 질문이 나오면 제가 요청하고 직접 설명하겠습니다.";
    return "가능한 원인을 메모해 뒀지만, 실제 답변에서는 확인된 기록을 먼저 열겠습니다.";
  }
  if (scene.dynamic === "focusReaction") {
    if (state.decisions.presentationFocus === "verification") return "수치뿐 아니라 교차 검증 과정을 먼저 제시한 점이 명확하군요. 계속해 주세요.";
    if (state.decisions.presentationFocus === "user_experience") return "사용자가 체감한 변화에서 출발하니 개선 목적이 잘 보입니다. 계속해 주세요.";
    return "자동화와 사람의 검증 범위를 구분한 점을 확인했습니다. 계속해 주세요.";
  }
  if (scene.dynamic === "strategyCallback") {
    if (state.decisions.responseStrategy === "defend_evidence") return "정상 수치는 18.4%입니다. 지금 보존된 원본과 교차 검증 기록을 바로 제시하겠습니다.";
    if (state.decisions.responseStrategy === "clarify_scope") return "먼저 두 자료가 같은 신규 가입 사용자와 같은 발표 전주를 대상으로 하는지 확인하겠습니다.";
    if (state.decisions.responseStrategy === "coordinate_harin") return "서하린 선배, 보존한 정상 원본을 열어 주십시오. 저는 발표 흐름을 유지하며 산정 기준을 설명하겠습니다.";
    return "자동화 과정에서 문제가 생겼을 가능성이… 잠깐, 원인을 단정하기 전에 검증된 기록부터 확인하겠습니다.";
  }
  if (scene.dynamic === "verificationConfront") {
    if (verificationGrade() === "perfect") return "재실행 요청은 내가 했어. 네가 정리한 경로가 맞아. 예전 검증 자료를 빨리 다시 쓰려던 거였고, 공식 근거 자료까지 바뀔 줄은 몰랐어.";
    if (verificationGrade() === "partial") return "재실행 요청은 내가 했어. 추가로 확인된 감사 기록까지 보니 부정할 수 없겠네. 공식 근거 자료까지 바뀔 줄은 몰랐어.";
    return "잠깐, 재실행을 요청한 건 맞지만 내가 직접 숫자를 바꾼 건 아니잖아. 그걸 전부 내 책임이라고 할 수 있어?";
  }
  if (scene.dynamic === "verificationFollowup") {
    if (verificationGrade() === "failed") return "시스템 담당자가 감사 로그 원문을 추가로 공개했습니다. 요청 직후 자료 연결이 변경된 기록과 이상 징후 이후 미보고 기록이 모두 남아 있습니다.";
    return "DAY 3에 이상 징후를 봤다면 왜 요청 사실을 말하지 않았습니까?";
  }
  if (scene.dynamic === "verificationAdmission") {
    if (verificationGrade() === "failed") return "…알겠어. 내 요청 뒤 연결이 바뀐 것도, 이상을 보고도 말하지 않은 것도 맞아. 평가에서 빠질까 봐 숨겼어. 지금은 일단 사실부터 정리해.";
    return "내 요청 때문일 수도 있다고 생각했어. 평가에서 빠질까 봐… 먼저 말하지 못했어. 사과는 이거 끝나고 제대로 할게.";
  }
  if (scene.dynamic === "recoveryResult") return verificationGrade() === "failed"
    ? "담당자 지원 복구를 확인했습니다. PT와 고정된 증빙은 18.4%로 일치하지만 플레이어 직접 검증 결과는 실패입니다."
    : state.decisions.recoverySource === "current_week" && state.decisions.recoveryBinding === "fixed_source"
      ? "복구 전후 검증을 완료했습니다. PT와 고정된 증빙이 모두 18.4%로 일치합니다."
      : "복구 검증에서 불안정한 연결이 남았습니다. 정상 원본은 구두로 제시할 수 있지만 증빙 완성도가 낮아집니다.";
  if (scene.dynamic === "resumeStatement") return verificationGrade() === "failed"
    ? "시스템 담당자의 지원으로 증빙 자료는 18.4% 정상 원본에 복구되었습니다. 직접 검증을 끝내지 못한 결과도 함께 보고드리겠습니다."
    : state.decisions.recoverySource === "current_week" && state.decisions.recoveryBinding === "fixed_source"
      ? "정상 원본과 동일한 18.4% 수치로 증빙 자료를 복구했습니다. 산정 기준과 변경 경로도 함께 제출하겠습니다."
      : "정상 원본의 18.4%는 확인했습니다. 다만 증빙 연결 복구는 추가 검토가 필요해 원본과 변경 기록으로 먼저 설명드리겠습니다.";
  if (scene.dynamic === "evaluatorCloseResult") return verificationGrade() === "failed"
    ? "정상 원본은 담당자 지원으로 복구됐습니다. 다만 직접 오류 검증이 중단된 사실과 지원 복구 전환을 최종 평가에 반영하겠습니다."
    : "발표 중 문제가 발생했지만 정상 원본과 제출 이후 변경 경로는 확인했습니다. 직접 복구한 대응을 포함해 최종 평가하겠습니다.";
  if (scene.dynamic === "postPresentationHarin") {
    if (verificationGrade() === "failed") return "끝났어요. 담당자 지원까지 받았지만 문제를 숨기지 않고 여기까지 이어 온 건 도윤 씨예요. 이제 숨 쉬어도 돼요.";
    if (calculateEnding() === "bad") return "끝나긴 했는데… 오늘 대응이 전부 매끄러웠다고는 못 하겠어요. 결과가 어떻게 나올지는 조금 더 지켜봐야 할 것 같아요.";
    if (verificationGrade() === "partial") return "끝났어요. 중간에 흔들렸어도 복구까지 직접 마쳤잖아요. 이제 숨 쉬어도 돼요.";
    return "끝났어요. 검증부터 복구까지 전부 직접 설명했어요. 이제 숨 쉬어도 돼요.";
  }
  if (scene.dynamic === "postPresentationMinjae") {
    if (verificationGrade() === "failed") return "처음엔 내 요청이 원인이라고 인정하고 싶지 않았어. 감사 로그까지 다시 공개되고 나서야 더는 피할 수 없었다. 이상한 걸 봤을 때 바로 말했어야 했어. 미안하다.";
    return "네가 기록을 순서대로 보여 주니까 더는 변명할 수 없더라. 내 요청 때문에 일이 커졌고, 이상한 걸 봤을 때 바로 말했어야 했어. 미안하다.";
  }
  if (scene.dynamic === "postPresentationReflection") {
    if (verificationGrade() === "failed") {
      if (state.affection >= 5) return "예전 같았으면 제가 만든 규칙이라는 이유만으로 혼자 책임지려고 했을 거예요. 이번엔 도윤 씨도 끝까지 못 갔지만, 그래도 둘 다 도망치진 않았잖아요. 그게 저한텐 달랐어요.";
      return "예전 같았으면 제가 만든 규칙이라는 이유만으로 혼자 책임지려고 했을 거예요. 이번엔 둘 다 끝까지 매달렸지만 결국 담당자 손을 빌렸죠. 그래도 숨기지 않은 건 도윤 씨 덕분이에요.";
    }
    if (state.affection >= 5) return "예전 같았으면 제가 만든 규칙이라는 이유만으로 혼자 책임지려고 했을 거예요. 이번에는 도윤 씨가 제 옆에서 기록을 끝까지 봐 줬어요. 혼자가 아니라는 게 이렇게 다른 건지 몰랐네요.";
    return "예전 같았으면 제가 만든 규칙이라는 이유만으로 혼자 책임지려고 했을 거예요. 이번에는 도윤 씨가 기록을 끝까지 봐 줘서 그러지 않았어요.";
  }
  if (scene.dynamic === "postPresentationReport") {
    if (verificationGrade() === "failed") return "제가 직접 확인한 부분과 담당자가 보완한 부분을 나눠 적었습니다. 실패한 과정도 숨기지 않고 복구 기록과 함께 남기겠습니다.";
    if (calculateEnding() === "bad") return "확인된 사실과 확인되지 않은 추측을 나눠 적었습니다. 다만 답변 중 몇 군데는 지금 다시 봐도 성급했던 것 같습니다. 그 부분도 그대로 남기겠습니다.";
    return "확인된 사실과 확인되지 않은 추측을 나눠 적었습니다. 제가 직접 검증한 경로와 복구 과정, 재발 방지 조치도 같은 기록에 연결하겠습니다.";
  }
  if (scene.dynamic === "postPresentationBeforeResult") {
    if (state.trust >= 5) return "결과가 어떻게 나오든 오늘 도윤 씨가 한 대응은 없어지지 않아요. 모두가 흔들릴 때 확인한 기록부터 다시 세웠고, 끝까지 정상 상태로 돌려놨으니까요.";
    return "결과를 기다리는 건 불편하겠지만, 오늘 문제를 숨기지 않고 끝까지 남아 정리한 건 분명해요. 그 부분은 평가에서도 기록으로 남을 거예요.";
  }
  if (scene.dynamic === "middleEndingTone") {
    if (!recoveryComplete()) return "복구 과정에서 조금 흔들리긴 했지만, 그래도 끝까지 포기하지 않았잖아요. 앞으로도 잘 부탁해요, 한도윤 씨.";
    return "오늘 대응은 나무랄 데 없었어요. 앞으로도 잘 부탁해요, 한도윤 씨.";
  }
  if (scene.dynamic === "badEndingReflection") {
    if (verificationGrade() === "failed") return "다섯 번의 실수 끝에 결국 담당자 손을 빌렸다. 근거는 정상으로 돌아왔지만, 내가 끝까지 확인했다고는 못 하겠다.";
    if (state.decisions.recoveryBinding === "live_alias") return "원본은 찾았는데, 마지막에 연결을 고정하지 않았다. 그 한 번의 선택이 오늘 전부를 흔들었다.";
    return "확인은 끝까지 했는데, 그 과정에서 놓친 판단들이 더 크게 남았다. 앞으로는 이런 실수를 잊지 말아야겠다.";
  }
  if (scene.dynamic === "evaluationResult") {
    const ending = calculateEnding();
    if (ending === "bad") return "문제를 숨기지 않은 태도는 확인했다. 하지만 검증과 복구 과정에서 핵심 근거를 충분히 확보하지 못해 발표 자료의 신뢰를 회복했다고 판단하기 어렵다. 정직원 전환은 무산됐고, 계약 기간도 오늘부로 종료된다.";
    if (ending === "happy") return "정직원 전환 승인이다. 정상 원본을 찾아낸 것뿐 아니라 변경 경로와 책임 범위를 기록으로 설명했고, 복구와 재발 방지까지 직접 마무리한 대응이 높게 평가됐다.";
    return "정직원 전환 승인이다. 일부 과정에는 지원이 필요했지만 문제를 숨기지 않고 검증 가능한 사실부터 복구한 대응은 충분히 인정받았다. 남은 기술 조사는 보안 담당이 이어 간다.";
  }
  return scene.text;
}

function selectChoice(scene, choice) {
  const before = { work: state.work, affection: state.affection, trust: state.trust };
  Object.entries(choice.delta || {}).forEach(([key, value]) => { state[key] += value; });
  state.decisions[scene.choiceKey] = choice.id;
  state.decisions[`${scene.choiceKey}:reply`] = choice.reply;
  if (VERIFICATION_SCENE_IDS.includes(scene.id)) {
    state.decisions[`${scene.choiceKey}:playerSolved`] = true;
    if (scene.id === "day5Responsibility") state.decisions.verificationGrade = verificationMistakes() === 0 ? "perfect" : "partial";
  }
  if (INCIDENT_MINIGAME_SCENE_IDS.includes(scene.id)) {
    UiSfx.playMinigameCue("success");
    syncVerificationLives(scene, "success");
  }
  saveProgress();
  $("#dialogue-card").hidden = false;
  $("#stage-choices").innerHTML = "";
  $("#stage-choices").classList.remove("show");
  $("#stage").classList.remove("choice-mode");
  $("#stage").classList.remove("presentation-evidence-mode");
  const nextButton = $("#next");
  nextButton.disabled = false;
  nextButton.textContent = scene.end ? "DAY 5 완료" : "다음";
  document.querySelector('[data-tab="clues-view"]')?.classList.remove("evidence-requested");
  $("#clue-new").textContent = "NEW";
  const replySpeaker = choice.replySpeaker || scene.replySpeaker || scene.speaker;
  $("#speaker").textContent = replySpeaker;
  $("#dialogue").textContent = choice.reply;
  Day5PresentationCinematic.playChoiceResult?.(scene, choice);
  const activeCharacter = characterIdFromSpeaker(replySpeaker);
  $("#character-layer").querySelectorAll(".character").forEach((image) => {
    const speaking = Boolean(activeCharacter) && image.classList.contains(`character-${activeCharacter}`);
    image.classList.toggle("speaking", speaking);
    image.classList.toggle("listening", !speaking);
  });
  syncStats();
  showChoiceResult(choice, before);
}

function showChoiceResult(choice, before) {
  const entries = Object.entries(choice.delta || {}).filter(([key, value]) => STAT_LABELS[key] && value !== 0);
  if (!entries.length) return;
  $("#choice-result-list").innerHTML = entries.map(([key, value]) => `<article class="${value > 0 ? "gain" : "loss"} stat-${key}"><i aria-hidden="true"></i><div><span>${STAT_LABELS[key].slice(2)}</span><small>${before[key]} → ${state[key]}</small></div><strong>${value > 0 ? "+" : ""}${value}</strong></article>`).join("");
  const panel = $("#choice-result");
  panel.classList.remove("show");
  panel.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => panel.classList.add("show"));
  window.clearTimeout(choiceResultTimer);
  choiceResultTimer = window.setTimeout(() => {
    panel.classList.remove("show");
    panel.setAttribute("aria-hidden", "true");
  }, 3000);
}

function syncStats() {
  $("#work").textContent = state.work;
  $("#sys-work").textContent = state.work;
  $("#affection").textContent = state.affection;
  $("#trust").textContent = state.trust;
}

function unlockCg(scene) {
  if (!scene.cgAssetId) return;
  try {
    const image = ArtAssets.resolve(scene.cgAssetId);
    const savedCgs = JSON.parse(localStorage.getItem("nan-unlocked-cgs-v1")) || [];
    const archive = savedCgs.filter((entry) => typeof entry === "object" && entry?.id !== scene.cgAssetId);
    archive.push({ id: scene.cgAssetId, image, day: `DAY 5 · ${scene.time}`, title: scene.cgTitle || scene.location || "기록된 장면" });
    localStorage.setItem("nan-unlocked-cgs-v1", JSON.stringify(archive));
  } catch (_error) {}
}

function resetCinematic() {
  window.clearTimeout(cinematicTimer);
  cinematicLocked = false;
  cinematicTimer = null;
  cinematicScene = null;
  cinematicDeadline = 0;
  cinematicRemaining = 0;
  cinematicPaused = false;
  $("#stage").classList.remove("cinematic-only", "cinematic-ready", "sprite-cinematic");
}

function completeCinematic(scene) {
  cinematicTimer = window.setTimeout(() => {
    $("#speaker").textContent = scene.speaker;
    $("#dialogue").textContent = dynamicText(scene);
    $("#dialogue-card").hidden = false;
    SceneMotion.applyDialogueEmphasis($("#stage"), scene);
    cinematicLocked = false;
    cinematicTimer = null;
    cinematicScene = null;
    cinematicRemaining = 0;
    $("#stage").classList.add("cinematic-ready");
    $("#next").disabled = false;
  }, cinematicRemaining);
}

function startCinematic(scene) {
  cinematicLocked = true;
  cinematicScene = scene;
  cinematicRemaining = scene.cinematicDelay;
  cinematicDeadline = performance.now() + cinematicRemaining;
  cinematicPaused = false;
  $("#dialogue-card").hidden = true;
  $("#stage").classList.add("cinematic-only");
  if (scene.cinematicTarget === "sprite") $("#stage").classList.add("sprite-cinematic");
  $("#next").disabled = true;
  completeCinematic(scene);
}

function pauseCinematic() {
  if (!cinematicLocked || cinematicPaused || !cinematicTimer) return;
  cinematicRemaining = Math.max(0, cinematicDeadline - performance.now());
  window.clearTimeout(cinematicTimer);
  cinematicTimer = null;
  cinematicPaused = true;
}

function resumeCinematic() {
  if (!cinematicLocked || !cinematicPaused || !cinematicScene) return;
  cinematicPaused = false;
  cinematicDeadline = performance.now() + cinematicRemaining;
  completeCinematic(cinematicScene);
}

function preloadSceneImages(scene) {
  const sources = [];
  if (scene?.cgAssetId) sources.push(ArtAssets.resolve(scene.cgAssetId));
  if (scene?.bgAssetId) sources.push(ArtAssets.resolve(scene.bgAssetId));
  if (scene?.propAssetId) sources.push(ArtAssets.resolve(scene.propAssetId));
  (scene?.characters || []).forEach((entry) => { if (entry.assetId) sources.push(ArtAssets.resolve(entry.assetId)); });
  return Promise.all(sources.map((source) => new Promise((resolve) => {
    const image = new Image();
    const done = () => resolve();
    image.onload = done;
    image.onerror = done;
    image.src = source;
    if (image.complete) resolve();
    window.setTimeout(resolve, 2500);
  })));
}

function sceneShowsAuditCutin(scene) {
  return Boolean(
    scene.auditCutin
    || (scene.id === "day5MinjaeWhy" && verificationGrade() === "failed")
  );
}

function renderVerificationFailBanner(scene) {
  const banner = $("#day5-verification-fail-banner");
  if (!banner) return;
  if (scene.id !== "day5SupportRecoveryStart") return;
  window.clearTimeout(verificationFailBannerTimer);
  banner.hidden = true;
  void banner.offsetWidth;
  banner.hidden = false;
  banner.setAttribute("aria-hidden", "false");
  verificationFailBannerTimer = window.setTimeout(() => {
    banner.hidden = true;
    banner.setAttribute("aria-hidden", "true");
  }, 2100);
}

function renderArt(scene) {
  const stage = $("#stage");
  const placeholder = $("#scene-placeholder");
  renderVerificationFailBanner(scene);
  stage.classList.remove("urgent-scene");
  stage.classList.remove("urgent-impact");
  if (scene.urgent) {
    void stage.offsetWidth;
    stage.classList.add("urgent-scene");
    stage.classList.toggle("urgent-impact", scene.urgent === "strong");
  }
  const hasBackground = Boolean(scene.bgAssetId);
  stage.style.backgroundImage = hasBackground ? `url('${ArtAssets.resolve(scene.bgAssetId)}')` : "none";
  const showPlaceholder = !hasBackground && !scene.system;
  stage.classList.toggle("stage-placeholder-active", showPlaceholder);
  placeholder.classList.toggle("show", showPlaceholder);
  placeholder.setAttribute("aria-hidden", String(!showPlaceholder));
  $("#placeholder-title").textContent = scene.visual?.split(".")[0] || scene.id;
  $("#placeholder-detail").textContent = scene.visual || "";
  const cg = $("#event-cg");
  const cgImage = $("#event-cg-image");
  if (scene.cgAssetId) {
    cgImage.src = ArtAssets.resolve(scene.cgAssetId);
    cgImage.alt = scene.cgTitle || "스토리 이벤트 CG";
    cg.classList.add("show");
    cg.setAttribute("aria-hidden", "false");
    stage.classList.add("cg-active");
    unlockCg(scene);
  } else {
    cg.classList.remove("show");
    cg.setAttribute("aria-hidden", "true");
    stage.classList.remove("cg-active");
    cgImage.removeAttribute("src");
    cgImage.alt = "";
  }
  const propCutin = $("#story-prop-cutin");
  const propCutinImage = $("#story-prop-cutin-image");
  const auditCutin = $("#security-audit-cutin");
  const showAuditCutin = sceneShowsAuditCutin(scene);
  if (scene.propAssetId || showAuditCutin) {
    propCutin.classList.toggle("audit", showAuditCutin);
    propCutinImage.hidden = showAuditCutin;
    auditCutin.hidden = !showAuditCutin;
    if (scene.propAssetId) {
      propCutinImage.src = ArtAssets.resolve(scene.propAssetId);
      propCutinImage.alt = scene.propTitle || "스토리 소품";
    }
    propCutin.classList.add("show");
    propCutin.setAttribute("aria-hidden", "false");
    stage.classList.add("prop-cutin-active");
  } else {
    propCutin.classList.remove("audit");
    propCutin.classList.remove("show");
    propCutin.setAttribute("aria-hidden", "true");
    stage.classList.remove("prop-cutin-active");
    propCutinImage.hidden = false;
    propCutinImage.removeAttribute("src");
    propCutinImage.alt = "";
    auditCutin.hidden = true;
  }
  const characters = scene.characters || [];
  const visibleCharacterIds = characters.map(characterIdFromAsset);
  const speakerCharacter = characterIdFromSpeaker(scene.speaker);
  const active = scene.activeCharacter || (visibleCharacterIds.includes(speakerCharacter) ? speakerCharacter : "");
  $("#character-layer").dataset.count = String(characters.length);
  $("#character-layer").replaceChildren(...characters.map((entry, index) => {
    const characterId = characterIdFromAsset(entry);
    const profile = DAY5_CHARACTER_PROFILES[characterId];
    const image = document.createElement("img");
    const position = entry.position || (characters.length === 1 ? "right" : characters.length === 2 ? (index === 0 ? "left" : "right") : index === 0 ? "left" : index === 1 ? "center" : "right");
    const framingClass = entry.framing ? ` framing-${entry.framing.replace(/_/g, "-")}` : "";
    image.className = `character character-${characterId || "unknown"} visible ${characterId === active ? "speaking" : "listening"}${framingClass}`;
    image.src = ArtAssets.resolve(entry.assetId);
    image.alt = profile?.name || "등장인물";
    image.classList.toggle("boss-urgent", characterId === "boss");
    image.style.setProperty("--position-x", DAY5_CHARACTER_POSITIONS[position] ?? DAY5_CHARACTER_POSITIONS.right);
    if (profile) {
      const spriteHeight = DAY5_CHARACTER_STAGE_HEIGHT * (profile.heightCm / DAY5_CHARACTER_BASE_HEIGHT) * (entry.scale || 1);
      image.style.setProperty("--sprite-height", `${spriteHeight}cqh`);
    }
    image.addEventListener("animationend", (event) => {
      if (event.target !== image) return;
      image.classList.remove("speaker-beat", "emotion-beat", "emotion-recover");
    });
    image.onerror = () => image.remove();
    return image;
  }));
}

function summaryRow(icon, title, detail, value = "") {
  return `<article><i>${icon}</i><div><b>${escapeHtml(title)}</b><span>${escapeHtml(detail)}</span></div>${value ? `<strong>${escapeHtml(value)}</strong>` : ""}</article>`;
}

function showDaySummary() {
  const deltas = {
    work: state.work - day5Start.work,
    affection: state.affection - day5Start.affection,
    trust: state.trust - day5Start.trust,
  };
  const ending = calculateEnding();
  const grade = ending.toUpperCase();
  $("#day-summary-grade").textContent = grade;
  $("#day-summary-conclusion").textContent = ending === "happy" ? "사건의 전체 경로를 밝히고 다음 일정으로 나아갔다."
    : ending === "middle" ? "정직원으로 인정받고 믿을 수 있는 동료가 되었다."
      : "발표의 신뢰를 충분히 회복하지 못해 계약이 종료됐다.";
  $("#day-summary-note").textContent = "DAY 5의 선택과 누적 신뢰·호감도를 합산한 최종 결과입니다.";
  $("#day-summary-work").innerHTML = [
    summaryRow("✓", "정상 수치 검증", "18.4% 원본과 DAY 4 제출 기록 확인"),
    summaryRow(verificationGrade() === "failed" ? "!" : "✓", "오류 검증", verificationGrade() === "perfect" ? "완전 검증 · 직접 변경 경로 완성" : verificationGrade() === "partial" ? "부분 검증 · 하린의 보조로 완성" : "검증 실패 · 담당자 확인으로 이관"),
    summaryRow("✓", "증빙 복구", state.decisions.recoveryBinding === "fixed_source" ? "고정 출처로 안정 복구" : "연결 안정성 추가 검토"),
    summaryRow("↗", "정직원 전환", ending === "bad" ? "불승인 · 계약 종료" : "승인"),
  ].join("");
  const details = $("#day-summary-work").closest(".day-summary-details");
  if (details) details.open = false;
  $("#day-summary-stats").innerHTML = [
    summaryRow("◆", "업무력", "DAY 5 시작 대비", `${deltas.work >= 0 ? "+" : ""}${deltas.work}`),
    summaryRow("♡", "호감도", "DAY 5 시작 대비", `${deltas.affection >= 0 ? "+" : ""}${deltas.affection}`),
    summaryRow("◇", "신뢰도", "DAY 5 시작 대비", `${deltas.trust >= 0 ? "+" : ""}${deltas.trust}`),
  ].join("");
  const startIds = new Set((day5Start.clues || []).map((clue) => clue.id));
  const records = state.clues.filter((clue) => !startIds.has(clue.id));
  const representativeClue = records.at(-1);
  $("#day-summary-records").innerHTML = summaryRow(
    "◆",
    `새로운 기록 ${records.length}개`,
    representativeClue?.title || "새로 기록된 단서가 없습니다",
  );
  const reactions = $("#day-summary-reactions");
  reactions.closest(".day-summary-relation").hidden = false;
  reactions.innerHTML = `<article class="relationship-result"><small>FINAL ENDING</small><p><b>${grade}</b><span>— 업무 평가와 서하린의 누적 신뢰가 함께 반영됐습니다.</span></p></article>`;
  $("#day-summary").classList.add("show");
  $("#day-summary").setAttribute("aria-hidden", "false");
  $("#day-summary-exit").focus();
}

function closeDaySummary() {
  $("#day-summary").classList.remove("show");
  $("#day-summary").setAttribute("aria-hidden", "true");
  $("#day-complete").classList.add("show");
  $("#day-complete").setAttribute("aria-hidden", "false");
  $("#day-complete-menu").focus();
}

function syncVerificationResult() {
  const card = $("#day5-verification-result .day5-verification-result-card");
  if (!card) return;
  const grade = verificationGrade();
  const mistakes = verificationMistakes();
  const recoveredDirectly = recoveryComplete() && !state.decisions["recoveryBinding:assisted"];
  const config = {
    perfect: { title: "완전 해결", grade: "COMPLETE", copy: "모든 사건 경로를 직접 입증하고 정상 원본 복구까지 완료했습니다." },
    partial: { title: "복구 완료", grade: "RECOVERED", copy: "일부 실수가 있었지만 사건 경로를 확인하고 정상 원본을 직접 복구했습니다." },
    failed: { title: "지원 복구", grade: "ASSISTED", copy: "직접 처리는 중단됐지만 시스템 담당자의 지원으로 정상 원본을 복구했습니다." },
  }[grade];
  card.classList.remove("grade-perfect", "grade-partial", "grade-failed");
  card.classList.add(`grade-${grade}`);
  $("#day5-verification-result-title").textContent = config.title;
  $("#day5-verification-result-copy").textContent = config.copy;
  $("#day5-verification-result-grade").textContent = config.grade;
  $("#day5-verification-result-solved").textContent = `${verificationPlayerSolved()} / 5`;
  $("#day5-verification-result-mistakes").textContent = `${mistakes} / ${VERIFICATION_MISTAKE_LIMIT}`;
  $("#day5-verification-result-route").textContent = recoveredDirectly ? "직접 복구" : "지원 복구";
}

function render() {
  normalizeSceneIndex();
  const deferNotification = deferNextNotification;
  deferNextNotification = false;
  const scene = scenes[state.index] || scenes[0];
  const evidencePrompt = evidencePromptFor(scene);
  const pendingEvidence = Boolean(evidencePrompt && !state.decisions[scene.choiceKey]);
  const pendingChoice = Boolean(scene.choices && !state.decisions[scene.choiceKey] && !pendingEvidence);
  const cinematic = Boolean(scene.cinematicDelay);
  syncVerificationLives(scene);
  resetCinematic();
  $("#clock").textContent = scene.time;
  $("#scene-label").textContent = scene.location || $("#scene-label").textContent;
  renderArt(scene);
  if (!cinematic) {
    $("#speaker").textContent = scene.speaker;
    $("#dialogue").textContent = dynamicText(scene);
  }
  $("#next").disabled = cinematic;
  $("#next").textContent = scene.end ? "DAY 5 완료" : (scene.nextLabel || "다음");
  $("#system-panel").classList.toggle("show", Boolean(scene.system));
  $("#system-panel").setAttribute("aria-hidden", String(!scene.system));
  $("#stage").classList.toggle("system-panel-active", Boolean(scene.system));
  $("#system-panel").classList.remove("show");
  if (scene.system) {
    void $("#system-panel").offsetWidth;
    $("#system-panel").classList.add("show");
  }
  if (scene.system) {
    PresentationScreen.apply($("#system-panel"), scene.system);
  }
  if (scene.verificationResult) syncVerificationResult();
  const cinematicPresentation = Day5PresentationCinematic.apply(scene);
  if (cinematicPresentation) {
    $("#system-panel").classList.remove("show");
    $("#system-panel").setAttribute("aria-hidden", "true");
  }
  if (scene.id === "day5Mismatch" && !state.seenNotifications["sfx:day5-mismatch"]) {
    state.seenNotifications["sfx:day5-mismatch"] = true;
    UiSfx.playPresentationCue("errorDiscovery");
  }
  if (scene.id === "day5EvaluatorHold" && !state.seenNotifications["sfx:day5-evaluator-hold"]) {
    state.seenNotifications["sfx:day5-evaluator-hold"] = true;
    bgmManager.stop();
    UiSfx.playPresentationCue("evaluatorSuspicion");
  }
  const auditResultIndex = scenes.findIndex((item) => item.id === "day5AuditResult");
  if (auditResultIndex >= 0 && state.index >= auditResultIndex) {
    addClue(ClueRecords.get("d5_security_audit_result"));
  }
  addClue(scene.clue);
  renderRecords();
  syncStats();
  $("#stage-choices").innerHTML = "";
  $("#stage-choices").classList.remove("show");
  $("#stage").classList.remove("choice-mode");
  $("#stage").classList.toggle("presentation-evidence-mode", pendingEvidence);
  $("#dialogue-card").hidden = false;
  if (pendingChoice) {
    $("#dialogue-card").hidden = true;
    $("#stage-choices").innerHTML = `<header class="stage-choice-prompt"><small>${escapeHtml(choicePromptLabel(scene))}</small><strong>${escapeHtml(scene.text)}</strong></header>` +
      scene.choices.map((choice, index) => {
        const lock = choiceLock(choice);
        const effects = lock
          ? `<i class="locked">🔒 호감도 ${lock.required} 필요 · 현재 ${lock.current}</i>`
          : choiceEffectMarkup(choice.delta);
        return `<button type="button" data-choice="${index}"${lock ? ` disabled class="choice-locked" aria-label="${escapeHtml(choice.text)} · 잠김 · 호감도 ${lock.required} 필요, 현재 ${lock.current}"` : ""}><span class="stage-choice-label">${escapeHtml(choice.text)}</span><small class="stage-choice-effects">${effects}</small></button>`;
      }).join("");
    $("#stage-choices").classList.add("show");
    $("#stage").classList.add("choice-mode");
    $("#stage-choices").querySelectorAll("button:not(:disabled)").forEach((button) => { button.onclick = () => selectChoice(scene, scene.choices[Number(button.dataset.choice)]); });
  }
  if (pendingEvidence) {
    $("#next").disabled = true;
    $("#next").textContent = "단서 제시 필요";
    const clueTab = document.querySelector('[data-tab="clues-view"]');
    clueTab?.classList.add("evidence-requested");
    activateSideTab("clues-view");
    $("#clue-new").hidden = false;
    $("#clue-new").textContent = "!";
  } else {
    document.querySelector('[data-tab="clues-view"]')?.classList.remove("evidence-requested");
    $("#clue-new").textContent = "NEW";
  }
  if (scene.stopBgm) bgmManager.stop();
  else if (scene.bgm) bgmManager.play(scene.bgm);
  if (scene.notification && !deferNotification) notifyMessage(scene.notification);
  renderMessages();
  if (cinematic) startCinematic(scene);
  SceneMotion.play($("#stage"), scene);
  if (cinematicPresentation && !pendingChoice && !cinematic) {
    Day5PresentationCinematic.playDialogue(scene, dynamicText(scene));
  }
  saveProgress();
  autoSaveAtCheckpoint(scene);
}

function hasBlockingUi() {
  return locked || cinematicLocked || Day5PresentationCinematic.isLocked() || GameSettingsDialog.isOpen() || pauseMenu?.isOpen() || $("#game-save-modal").classList.contains("open") || $("#day-summary").classList.contains("show") || $("#day-complete").classList.contains("show") || locationTransition?.isActive();
}

async function nextScene() {
  if (hasBlockingUi()) return;
  const scene = scenes[state.index];
  if (scene.choices && !state.decisions[scene.choiceKey]) return;
  if (scene.end) {
    progress.days[5].complete = true;
    saveDay5Slot(scene.id);
    showDaySummary();
    return;
  }
  const nextIndex = nextSceneIndex(state.index);
  const targetScene = scenes[nextIndex];
  locked = true;
  $("#next").disabled = true;
  await preloadSceneImages(targetScene);
  const locationChanged = await locationTransition.playIfChanged(locationAt(state.index), locationAt(nextIndex));
  state.index = nextIndex;
  deferNextNotification = locationChanged;
  render();
  if (locationChanged && targetScene.notification) {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    notifyMessage(targetScene.notification);
    saveProgress();
  }
  locked = false;
  if (!cinematicLocked && !Day5PresentationCinematic.isLocked()) $("#next").disabled = false;
}

$("#next").onclick = nextScene;
$("#save").onclick = () => openGameSave("save");
$("#load").onclick = () => openGameSave("load");
$("#game-save-close").onclick = closeGameSave;
$("#game-save-modal").onclick = (event) => { if (event.target.id === "game-save-modal") closeGameSave(); };
$("#day-summary-exit").onclick = closeDaySummary;
$("#day-complete-menu").onclick = () => { location.href = "index.html"; };
const settingsApi = GameSettingsDialog.install({
  onApply: (settings) => {
    bgmManager.setVolume(GameSettingsDialog.effectiveBgmVolume(settings));
    syncBgmUi(!bgmManager.isPaused());
  },
  onEscape: () => pauseMenu?.isOpen() ? pauseMenu.close() : pauseMenu?.open(),
  closeOverlay: () => {
    if ($("#game-save-modal").classList.contains("open")) { closeGameSave(); return true; }
    if (!$("#stat-help-popover").hidden) { closeStatHelp(); return true; }
    return false;
  },
});
pauseMenu = GamePauseMenu.install({
  openSettings: () => settingsApi.open(),
  openLoad: () => openGameSave("load"),
  onOpen: () => {
    pauseCinematic();
  },
  onClose: () => {
    resumeCinematic();
  },
});
$("#mute").onclick = toggleBgm;
$("#sound-prompt").onclick = unlockAudio;
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.onclick = () => {
    activateSideTab(button.dataset.tab);
    if (button.dataset.tab === "clues-view") {
      state.unreadClues = false;
      renderRecords();
      saveProgress();
    }
  };
});
document.querySelectorAll(".chat-item").forEach((button) => { button.onclick = () => openChat(button.dataset.room); });
$("#chat-back").onclick = closeChat;
document.querySelectorAll(".stat-help").forEach((button) => {
  button.addEventListener("mouseenter", () => openStatHelp(button));
  button.addEventListener("mouseleave", () => { if (activeStatHelp === button) closeStatHelp(); });
  button.addEventListener("focus", () => openStatHelp(button));
  button.addEventListener("blur", () => { if (activeStatHelp === button) closeStatHelp(); });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (matchMedia("(hover: hover)").matches) return;
    if (activeStatHelp === button) closeStatHelp();
    else openStatHelp(button);
  });
});
$("#stat-help-popover").addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", () => closeStatHelp());
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && activeStatHelp) closeStatHelp({ restoreFocus: true }); });
window.addEventListener("resize", () => closeStatHelp());
document.addEventListener("scroll", () => closeStatHelp(), true);
document.addEventListener("nan:settings-open", pauseCinematic);
document.addEventListener("nan:settings-close", resumeCinematic);
document.addEventListener("pointerdown", () => bgmManager.resume(), { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
document.addEventListener("keydown", (event) => {
  if (trapGameSaveFocus(event)) {
    event.stopImmediatePropagation();
    return;
  }
  if (event.key === "Escape" && $("#game-save-modal").classList.contains("open")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeGameSave();
  }
}, true);
migrateVerificationPrelude();
migrateLegacyVerificationFailure();
render();

