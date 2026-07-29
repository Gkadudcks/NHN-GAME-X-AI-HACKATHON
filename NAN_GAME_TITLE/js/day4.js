"use strict";

const scenes = Day4Story.scenes;
const $ = (selector) => document.querySelector(selector);
const progress = new URLSearchParams(location.search).has("new") ? GameProgress.resetDay4(localStorage) : GameProgress.startDay4(localStorage);
const saved = progress.days[4];
const state = {
  index: Math.max(0, scenes.findIndex((scene) => scene.id === saved.sceneId)),
  work: progress.shared.work,
  affection: progress.shared.affection,
  trust: progress.shared.trust,
  clues: ClueRecords.normalizeList(progress.shared.clues),
  decisions: { ...saved.decisions },
  evidence: { ...saved.evidence },
  minigameResult: saved.minigameResult,
};
const bgmManager = new GameBgmManager($("#bgm"), () => {
  const settings = GameSettings.load(localStorage);
  return settings.masterMuted || settings.bgmMuted ? 0 : (settings.masterVolume / 100) * (settings.bgmVolume / 100);
});
let pauseMenu;
let locked = false;
let choiceResultTimer;
const locationTransition = GameLocationTransition.install();
const day4Start = progress.day4StartSnapshot || { work: 0, affection: 0, trust: 0, clues: [] };
const AUTOSAVE_CHECKPOINTS = new Set(["day4AuditRequest", "day4Submit", "day4End"]);
const CHAT_ROOMS = Object.freeze({
  pt: {
    title: "PT 전환과제 TF",
    type: "GROUP MESSAGE",
    messages: [
      ["박태식", "평가용 증빙 패키지도 같이 제출해.", "13:35"],
      ["서하린", "수치와 출처 링크를 마지막에 다시 확인해요.", "14:00"],
      ["한도윤", "PT와 증빙 모두 18.4%로 확인했습니다.", "17:08"],
    ],
  },
  harin: {
    title: "서하린 사수",
    type: "DIRECT MESSAGE",
    messages: [
      ["서하린", "보안 감사 로그는 요청 계정을 확인하기 위한 기록이에요.", "11:43"],
      ["서하린", "발표 자료까지 마지막으로 확인해 둘게요.", "17:12"],
    ],
  },
});

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

function saveProgress() {
  progress.currentDay = 4;
  progress.shared.work = state.work;
  progress.shared.affection = state.affection;
  progress.shared.trust = state.trust;
  progress.shared.clues = ClueRecords.normalizeList(state.clues);
  progress.days[4] = {
    sceneId: scenes[state.index]?.id || "day4Intro",
    decisions: { ...state.decisions },
    evidence: { ...state.evidence },
    minigameResult: state.minigameResult,
    complete: progress.days[4].complete,
  };
  GameProgress.save(localStorage, progress);
}

function saveDay4Slot(checkpoint) {
  saveProgress();
  const scene = scenes[state.index] || scenes[0];
  const snapshot = GameProgress.load(localStorage);
  GameProgress.saveAutoSlot(localStorage, `day4:${checkpoint}`, {
    day: 4,
    sceneTitle: "발표 전날",
    sceneTime: scene.time,
    savedAt: snapshot.savedAt,
    resumeUrl: "day4.html",
    work: state.work,
    affection: state.affection,
    trust: state.trust,
    lastDialogue: { speaker: scene.speaker, text: dynamicText(scene) },
    thumbnail: "assets/image/office-background.png",
    progress: snapshot,
  });
}

async function unlockAudio() {
  await bgmManager.resume();
  $("#mute").classList.remove("muted");
  $("#sound-prompt").classList.add("hidden");
}

async function toggleBgm() {
  if (bgmManager.isPaused()) await unlockAudio();
  else {
    await bgmManager.pause();
    $("#mute").classList.add("muted");
    $("#sound-prompt").classList.remove("hidden");
  }
}

function autoSaveAtCheckpoint(scene) {
  if (!AUTOSAVE_CHECKPOINTS.has(scene.id)) return;
  const result = GameProgress.saveAutoSlot(localStorage, `day4:${scene.id}`, buildGameSavePayload(scene));
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

function buildGameSavePayload(scene) {
  saveProgress();
  const snapshot = GameProgress.load(localStorage);
  return {
    day: 4,
    sceneTitle: "발표 전날",
    sceneTime: scene.time,
    savedAt: snapshot.savedAt,
    resumeUrl: "day4.html",
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
  gameSaveMode = mode;
  const loading = mode === "load";
  $("#game-save-kicker").textContent = loading ? "LOAD PROGRESS" : "SAVE PROGRESS";
  $("#game-save-title").textContent = loading ? "진행 불러오기" : "진행 저장";
  $("#game-save-guide").textContent = loading ? "불러올 카드를 선택하세요. 현재 진행은 선택한 저장 시점으로 바뀝니다." : "저장할 카드를 선택하세요. 타이틀의 이어하기와 같은 슬롯에 연동됩니다.";
  $("#game-save-help").textContent = loading ? "빈 슬롯은 선택할 수 없습니다. 다른 DAY의 저장도 바로 불러올 수 있습니다." : "빈 슬롯에는 새로 저장하고, 사용 중인 슬롯에는 확인 후 덮어씁니다.";
  renderGameSaveSlots();
  $("#game-save-modal").classList.add("open");
  $("#game-save-modal").setAttribute("aria-hidden", "false");
  window.setTimeout(() => $("#game-save-list button:not(:disabled)")?.focus(), 50);
}

function closeGameSave() {
  $("#game-save-modal").classList.remove("open");
  $("#game-save-modal").setAttribute("aria-hidden", "true");
  $(`#${gameSaveMode === "load" ? "load" : "save"}`).focus();
}

function saveToGameSlot(slotId, occupied) {
  if (occupied && !confirm(`SLOT ${String(slotId).padStart(2, "0")}의 기존 저장을 덮어쓸까요?`)) return;
  const result = GameProgress.saveManualSlot(localStorage, slotId, buildGameSavePayload(scenes[state.index] || scenes[0]));
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
  location.href = slot.resumeUrl || (Number(slot.day) === 4 ? "day4.html" : Number(slot.day) === 3 ? "day3.html" : Number(slot.day) === 2 ? "day2.html" : "game.html");
}

function addClue(clue) {
  if (!clue || state.clues.some((item) => item.id === clue.id)) return;
  state.clues.push({ ...clue });
  if (clue.id === "d4_audit_request") state.evidence.auditRequested = true;
  if (clue.id === "d4_verified_retention") state.evidence.verifiedRetention = 18.4;
  if (clue.id === "d4_evidence_submission") {
    state.evidence.packageId = "EVD-D4-1708";
    state.evidence.submittedAt = "DAY 4 · 17:08";
    state.evidence.ptValue = 18.4;
    state.evidence.evidenceValue = 18.4;
    state.evidence.sourceAlias = "retention_7d_verified";
  }
}

function renderRecords() {
  const records = state.clues.filter((clue) => clue.day === 4);
  $("#clue-count").textContent = state.clues.length;
  $("#clue-new").hidden = !records.length;
  if (!state.clues.length) {
    $("#clue-list").innerHTML = '<div class="clue-empty"><span>◇</span><strong>아직 기록된 단서가 없습니다</strong><p>대화와 자료를 조사하면 중요한 정보가 여기에 정리됩니다.</p></div>';
    return;
  }
  ClueMindmap.render($("#clue-list"), { clues: state.clues, currentDay: 4 });
}

function openChat(roomId) {
  const room = CHAT_ROOMS[roomId];
  if (!room) return;
  $("#room-type").textContent = room.type;
  $("#room-title").textContent = room.title;
  $("#room-members").textContent = room.type === "GROUP MESSAGE" ? "박 · 서 · 한" : "서";
  $("#messages").innerHTML = `<div class="message-day-divider"><span>목요일</span></div>` + room.messages.map(([speaker, text, time]) => `<article class="message${speaker === "한도윤" ? " me" : ""}"><b>${escapeHtml(speaker)}</b><p>${escapeHtml(text)}</p><time>${time}</time></article>`).join("");
  $("#chat-list").hidden = true;
  $("#chat-room").hidden = false;
}

function closeChat() {
  $("#chat-room").hidden = true;
  $("#chat-list").hidden = false;
}

const STAT_HELP = Object.freeze({
  work: ["업무력", "자료 검증, 기록 정리, 실무 선택에서 오릅니다."],
  affection: ["호감도", "서하린과의 개인적인 교감과 배려를 나타냅니다."],
  trust: ["신뢰도", "협업 태도와 근거 중심 판단에 대한 신뢰입니다."],
});

function closeStatHelp() {
  document.querySelectorAll(".stat-help").forEach((button) => button.setAttribute("aria-expanded", "false"));
  $("#stat-help-popover").hidden = true;
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
}

function dynamicText(scene) {
  if (scene.dynamic === "escapeResult") {
    const grade = state.minigameResult?.grade;
    if (grade === "perfect") return "엘리베이터 도착. 오늘은 추가 업무 없이 정시에 퇴근했다.";
    if (grade === "caught") return "부장님에게 붙잡혀 10분짜리 확인 업무를 마쳤지만, 하린은 엘리베이터 앞에서 기다리고 있었다.";
    return "마지막 호출을 아슬아슬하게 피하고 하린과 같은 엘리베이터에 탔다.";
  }
  return scene.text;
}

function selectChoice(scene, choice) {
  const before = { work: state.work, affection: state.affection, trust: state.trust };
  Object.entries(choice.delta || {}).forEach(([key, value]) => { state[key] += value; });
  state.decisions[scene.choiceKey] = choice.id;
  state.decisions[`${scene.choiceKey}:reply`] = choice.reply;
  saveProgress();
  $("#dialogue-card").hidden = false;
  $("#stage-choices").innerHTML = "";
  $("#stage-choices").classList.remove("show");
  $("#stage").classList.remove("choice-mode");
  $("#speaker").textContent = scene.speaker;
  const changes = Object.keys(choice.delta || {}).filter((key) => STAT_LABELS[key] && before[key] !== state[key]);
  $("#dialogue").textContent = changes.length
    ? `${choice.reply} (${changes.map((key) => `${STAT_LABELS[key].slice(2)} ${before[key]}→${state[key]}`).join(", ")})`
    : choice.reply;
  syncStats();
  showChoiceResult(choice, before);
}

function showChoiceResult(choice, before) {
  const entries = Object.entries(choice.delta || {}).filter(([key, value]) => STAT_LABELS[key] && value !== 0);
  if (!entries.length) return;
  const icons = { work: "◆", affection: "♡", trust: "◇" };
  $("#choice-result-list").innerHTML = entries.map(([key, value]) => `<article class="${value > 0 ? "gain" : "loss"}"><i>${icons[key]}</i><div><span>${STAT_LABELS[key].slice(2)}</span><small>${before[key]} → ${state[key]}</small></div><strong>${value > 0 ? "+" : ""}${value}</strong></article>`).join("");
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

function renderArt(scene) {
  const stage = $("#stage");
  const placeholder = $("#scene-placeholder");
  const hasBackground = Boolean(scene.bgAssetId);
  stage.style.backgroundImage = hasBackground ? `url('${ArtAssets.resolve(scene.bgAssetId)}')` : "none";
  const showPlaceholder = !hasBackground && !scene.system;
  stage.classList.toggle("stage-placeholder-active", showPlaceholder);
  placeholder.classList.toggle("show", showPlaceholder);
  placeholder.setAttribute("aria-hidden", String(!showPlaceholder));
  $("#placeholder-title").textContent = scene.visual?.split(".")[0] || scene.id;
  $("#placeholder-detail").textContent = scene.visual || "";
  const positions = { left: 30, center: 50, right: 70 };
  $("#character-layer").replaceChildren(...(scene.characters || []).map((entry) => {
    const image = document.createElement("img");
    image.className = "character visible speaking";
    image.src = ArtAssets.resolve(entry.assetId);
    image.alt = entry.assetId.includes("harin") ? "서하린" : "등장인물";
    image.style.setProperty("--position-x", positions[entry.position] || positions.center);
    return image;
  }));
}

function finishEscape(result) {
  state.minigameResult = result;
  if (result.grade === "perfect") state.affection += 1;
  if (result.grade === "caught") state.work += 1;
  state.index += 1;
  saveProgress();
  render();
}

function summaryRow(icon, title, detail, value = "") {
  return `<article><i>${icon}</i><div><b>${escapeHtml(title)}</b><span>${escapeHtml(detail)}</span></div>${value ? `<strong>${escapeHtml(value)}</strong>` : ""}</article>`;
}

function showDaySummary() {
  const grade = state.work - day4Start.work >= 3 ? "EXCELLENT" : state.work - day4Start.work >= 1 ? "GOOD" : "NEEDS CARE";
  $("#day-summary-grade").textContent = grade;
  $("#day-summary-work").innerHTML = [
    summaryRow("✓", "녹음 지원", "가이드 녹음과 테이크 기록 완료"),
    summaryRow("✓", "증빙 패키지", "정상 수치 18.4%와 원본 링크 제출"),
    summaryRow("✓", "보안 감사 요청", "자동화 요청 계정 조회 접수"),
    summaryRow("↗", "정시 퇴근 작전", state.minigameResult?.caught ? "추가 확인 업무 후 퇴근" : "엘리베이터 도착"),
  ].join("");
  $("#day-summary-stats").innerHTML = [
    summaryRow("◆", "업무력", "DAY 4 시작 대비", `${state.work - day4Start.work >= 0 ? "+" : ""}${state.work - day4Start.work}`),
    summaryRow("♡", "호감도", "DAY 4 시작 대비", `${state.affection - day4Start.affection >= 0 ? "+" : ""}${state.affection - day4Start.affection}`),
    summaryRow("◇", "신뢰도", "DAY 4 시작 대비", `${state.trust - day4Start.trust >= 0 ? "+" : ""}${state.trust - day4Start.trust}`),
  ].join("");
  const startIds = new Set((day4Start.clues || []).map((clue) => clue.id));
  const records = state.clues.filter((clue) => !startIds.has(clue.id));
  $("#day-summary-records").innerHTML = records.map((clue) => summaryRow("◇", clue.title, clue.detail)).join("") || summaryRow("◇", "새 기록 없음", "단서 탭을 확인해 주세요.");
  $("#day-summary-reactions").innerHTML = '<blockquote><b>박태식 부장</b><p>“제출 기록까지 남겼으면 됐어. 내일 발표만 잘해.”</p></blockquote><article class="relationship-result"><small>RELATIONSHIP</small><p><b>서하린</b><em>:</em><strong>발표 준비 파트너</strong><span>— 근거를 함께 검증했다.</span></p></article>';
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

function render() {
  const scene = scenes[state.index] || scenes[0];
  $("#clock").textContent = scene.time;
  $("#scene-label").textContent = scene.location || $("#scene-label").textContent;
  renderArt(scene);
  $("#speaker").textContent = scene.speaker;
  $("#dialogue").textContent = dynamicText(scene);
  $("#next").textContent = scene.end ? "DAY 4 완료　›" : "다음　›";
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
  addClue(scene.clue);
  renderRecords();
  syncStats();
  $("#stage-choices").innerHTML = "";
  $("#stage-choices").classList.remove("show");
  $("#stage").classList.remove("choice-mode");
  $("#dialogue-card").hidden = false;
  if (scene.choices && !state.decisions[scene.choiceKey]) {
    $("#dialogue-card").hidden = true;
    $("#stage-choices").innerHTML = `<header class="stage-choice-prompt"><small>CHOICE</small><strong>${escapeHtml(scene.text)}</strong></header>` +
      scene.choices.map((choice, index) => `<button type="button" data-choice="${index}"><span class="stage-choice-label">${escapeHtml(choice.text)}</span><small class="stage-choice-effects">${choiceEffectMarkup(choice.delta)}</small></button>`).join("");
    $("#stage-choices").classList.add("show");
    $("#stage").classList.add("choice-mode");
    $("#stage-choices").querySelectorAll("button").forEach((button) => { button.onclick = () => selectChoice(scene, scene.choices[Number(button.dataset.choice)]); });
  }
  if (scene.bgm) bgmManager.play(scene.bgm);
  saveProgress();
  autoSaveAtCheckpoint(scene);
  if (scene.startEscape && !state.minigameResult) OfficeEscapeMinigame.start({ onComplete: finishEscape });
}

function hasBlockingUi() {
  return locked || GameSettingsDialog.isOpen() || pauseMenu?.isOpen() || $("#game-save-modal").classList.contains("open") || $("#day-summary").classList.contains("show") || $("#day-complete").classList.contains("show") || locationTransition?.isActive();
}

async function nextScene() {
  if (hasBlockingUi()) return;
  const scene = scenes[state.index];
  if (scene.choices && !state.decisions[scene.choiceKey]) return;
  if (scene.end) {
    progress.days[4].complete = true;
    saveDay4Slot("day4End");
    showDaySummary();
    return;
  }
  const nextIndex = Math.min(scenes.length - 1, state.index + 1);
  const next = scenes[nextIndex];
  await locationTransition.playIfChanged($("#scene-label").textContent, next.location);
  state.index = nextIndex;
  render();
}

$("#next").onclick = nextScene;
$("#save").onclick = () => openGameSave("save");
$("#load").onclick = () => openGameSave("load");
$("#game-save-close").onclick = closeGameSave;
$("#game-save-modal").onclick = (event) => { if (event.target.id === "game-save-modal") closeGameSave(); };
$("#day-summary-exit").onclick = closeDaySummary;
$("#day-complete-menu").onclick = () => { location.href = "index.html"; };
const settingsApi = GameSettingsDialog.install({
  onApply: () => {},
  onEscape: () => pauseMenu?.isOpen() ? pauseMenu.close() : pauseMenu?.open(),
  closeOverlay: () => {
    if ($("#game-save-modal").classList.contains("open")) { closeGameSave(); return true; }
    if (!$("#stat-help-popover").hidden) { closeStatHelp(); return true; }
    return false;
  },
});
pauseMenu = GamePauseMenu.install({ openSettings: () => settingsApi.open(), openLoad: () => openGameSave("load") });
$("#mute").onclick = toggleBgm;
$("#sound-prompt").onclick = unlockAudio;
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".side-view").forEach((view) => view.classList.toggle("active", view.id === button.dataset.tab));
    if (button.dataset.tab === "clues-view") $("#clue-new").hidden = true;
  };
});
document.querySelectorAll(".chat-item").forEach((button) => { button.onclick = () => openChat(button.dataset.room); });
$("#chat-back").onclick = closeChat;
document.querySelectorAll(".stat-help").forEach((button) => {
  button.onmouseenter = () => openStatHelp(button);
  button.onmouseleave = closeStatHelp;
  button.onfocus = () => openStatHelp(button);
  button.onblur = closeStatHelp;
  button.onclick = (event) => { event.stopPropagation(); openStatHelp(button); };
});
document.addEventListener("click", closeStatHelp);
document.addEventListener("pointerdown", () => bgmManager.resume(), { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("#game-save-modal").classList.contains("open")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeGameSave();
  }
}, true);
render();
