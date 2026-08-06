"use strict";

const DAY4_CHARACTER_PROFILES = Object.freeze({
  harin: Object.freeze({ name: "서하린", heightCm: 165 }),
  boss: Object.freeze({ name: "박태식", heightCm: 176 }),
});
const DAY4_CHARACTER_BASE_HEIGHT = 182;
const DAY4_CHARACTER_STAGE_HEIGHT = 84;
const DAY4_CHARACTER_POSITIONS = Object.freeze({ farLeft: 18, left: 31, center: 50, right: 69, farRight: 82 });
function characterIdFromAsset(entry = {}) {
  if (entry.id) return entry.id;
  if (entry.assetId?.includes("harin")) return "harin";
  if (entry.assetId?.includes("boss")) return "boss";
  return "";
}
function characterIdFromSpeaker(speaker = "") {
  if (speaker === "서하린") return "harin";
  if (speaker === "박태식") return "boss";
  return "";
}
function choicePromptLabel(scene) {
  const speaker = (scene?.speaker || "").trim();
  return speaker && !["한도윤", "시스템", "내레이션"].includes(speaker) ? speaker : "상황";
}
const scenes = Day4Story.scenes;
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
const progress = new URLSearchParams(location.search).has("new") ? GameProgress.resetDay4(localStorage) : GameProgress.startDay4(localStorage);
const saved = progress.days[4];
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
  unreadClues: saved.seenNotifications?.["unread:clues"] === true,
};
function sceneMatchesBranch(scene) {
  if (!scene?.branch) return true;
  if (!state.minigameResult) return false;
  const branch = state.minigameResult.caught ? "failure" : "success";
  return scene.branch === branch;
}
function nextSceneIndex(fromIndex) {
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
bgmManager.preload(["daily", "harin", "recordingStudio", "mystery", "minigame", "overtime"]);
let pauseMenu;
let locked = false;
let choiceResultTimer;
let currentRoom = "";
let activeStatHelp = null;
let escapeActive = false;
let cinematicLocked = false;
let cinematicTimer;
let cinematicScene = null;
let cinematicDeadline = 0;
let cinematicRemaining = 0;
let cinematicPaused = false;
let deferNextNotification = false;
const locationTransition = GameLocationTransition.install();
const day4Start = progress.day4StartSnapshot || { work: 0, affection: 0, trust: 0, clues: [] };
const AUTOSAVE_CHECKPOINTS = new Set(["day4AuditRequest", "day4Submit", "day4SuccessEnd", "day4FailureEnd"]);
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

function cgBadgeMarkup(choice) {
  return choice?.cg ? '<i class="cg stat-cg"><b>🖼</b><span>CG 확인</span></i>' : "";
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
    seenNotifications: { ...state.seenNotifications, "unread:clues": state.unreadClues },
    summariesSeen: { ...state.summariesSeen },
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
let gameSavePauseHeld = false;
let gameSaveReturnFocus = null;

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
  location.href = slot.resumeUrl || (Number(slot.day) === 4 ? "day4.html" : Number(slot.day) === 3 ? "day3.html" : Number(slot.day) === 2 ? "day2.html" : "game.html");
}

function addClue(clue) {
  if (!clue || state.clues.some((item) => item.id === clue.id)) return;
  state.clues.push({ ...clue });
  state.unreadClues = !$("#clues-view").classList.contains("active");
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
  $("#clue-count").textContent = state.clues.length;
  $("#clue-new").hidden = !state.unreadClues;
  if (!state.clues.length) {
    $("#clue-list").innerHTML = '<div class="clue-empty"><span>◇</span><strong>아직 기록된 단서가 없습니다</strong><p>대화와 자료를 조사하면 중요한 정보가 여기에 정리됩니다.</p></div>';
    return;
  }
  ClueMindmap.render($("#clue-list"), { clues: state.clues, currentDay: 4 });
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
  return embedded ? Number(embedded[1]) : 4;
}

function messageClock(message) {
  return String(message.time || "").replace(/^DAY\s*[1-5]\s*·\s*/i, "");
}

function visibleMessages(room) {
  return Day4Story.MESSAGES.filter((message) => message.room === room && (messageDay(message) < 4 || isAtOrAfter(message.at)));
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
  const count = Object.keys(Day4Story.ROOMS).reduce((sum, room) => sum + unreadCount(room), 0);
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
  const rooms = Object.keys(Day4Story.ROOMS);
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
  const message = Day4Story.MESSAGES.find((entry) => entry.id === id);
  if (!message) return;
  state.seenNotifications[`notified:${id}`] = true;
  if (currentRoom !== message.room) markUnread(message.room);
  $("#messenger").classList.remove("message-arrived");
  void $("#messenger").offsetWidth;
  $("#messenger").classList.add("message-arrived");
  renderMessages();
  renderMessageTabAlert({ pulse: true });
  playMessageSfx();
  toast(`${Day4Story.ROOMS[message.room].title.replace(/^# /, "")}에 새 메시지가 도착했습니다.`);
  window.setTimeout(() => $("#messenger").classList.remove("message-arrived"), 1900);
}

function openChat(roomId) {
  const room = Day4Story.ROOMS[roomId];
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
  const affectionTone = state.affection < 2 ? "low" : state.affection < 4 ? "mid" : "high";
  if (scene.dynamic === "studioAnswer") {
    if (affectionTone === "low") return scene.text;
    if (affectionTone === "mid") return "몇 번 와봤어요. 장비 이름은 다 외우지 않아도 돼요. 제가 옆에서 순서대로 알려드릴게요.";
    return "몇 번 와봤어요. 도윤 씨는 처음이니까 제가 옆에서 하나씩 알려드릴게요. 같이 맞추면 금방 익숙해질 거예요.";
  }
  if (scene.dynamic === "lastTake") {
    if (affectionTone === "low") return scene.text;
    if (affectionTone === "mid") return "처음인데 잘했어요. 같이 기록을 맞추니까 마지막 테이크도 금방 찾았네요.";
    return "처음인데도 저랑 호흡이 잘 맞았어요. 다음에도 같이 들어오면 든든하겠네요.";
  }
  if (scene.dynamic === "leaveLead") {
    if (affectionTone === "low") return scene.text;
    if (affectionTone === "mid") return "오늘도 같이 마무리했네요. 확인한 상태만 보존하고, 부장님 오시기 전에 같이 나가요.";
    return "오늘 확인한 상태만 보존하고 같이 퇴근해요. 도윤 씨랑 나가려는데 또 일을 붙잡히면 아쉽잖아요.";
  }
  if (scene.dynamic === "escapeArrival") {
    if (state.minigameResult?.grade === "perfect") return "도착했습니다. 이번에는 부장님 눈에 한 번도 안 띄었습니다.";
    return scene.text;
  }
  if (scene.dynamic === "dinnerConversation") {
    if (affectionTone === "low") {
      return "내일 발표가 있으니 오래 있지는 말아요. 그래도 오늘 맡은 일은 잘 마무리했어요. 수고했어요, 도윤 씨.";
    }
    if (affectionTone === "mid") {
      return "회사 밖에서 보니까 도윤 씨도 조금 편해 보이네요. 오늘처럼 서로 맞춰 가면 내일 발표도 괜찮을 것 같아요.";
    }
    return "오늘 같이 퇴근해서 다행이에요. 다음에는 이렇게 급하게 빠져나오지 않아도, 편하게 같이 저녁 먹어요.";
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
  const replySpeaker = choice.replySpeaker || scene.replySpeaker || scene.speaker;
  $("#speaker").textContent = replySpeaker;
  $("#dialogue").textContent = choice.reply;
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
    archive.push({ id: scene.cgAssetId, image, day: `DAY 4 · ${scene.time}`, title: scene.cgTitle || scene.location || "기록된 장면" });
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

function renderArt(scene) {
  const stage = $("#stage");
  const placeholder = $("#scene-placeholder");
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
  const characters = scene.characters || [];
  const visibleCharacterIds = characters.map(characterIdFromAsset);
  const speakerCharacter = characterIdFromSpeaker(scene.speaker);
  const active = scene.activeCharacter || (visibleCharacterIds.includes(speakerCharacter) ? speakerCharacter : "");
  $("#character-layer").dataset.count = String(characters.length);
  $("#character-layer").replaceChildren(...characters.map((entry, index) => {
    const characterId = characterIdFromAsset(entry);
    const profile = DAY4_CHARACTER_PROFILES[characterId];
    const image = document.createElement("img");
    const position = entry.position || (characters.length === 1 ? "right" : characters.length === 2 ? (index === 0 ? "left" : "right") : index === 0 ? "left" : index === 1 ? "center" : "right");
    const framingClass = entry.framing ? ` framing-${entry.framing.replace(/_/g, "-")}` : "";
    image.className = `character character-${characterId || "unknown"} visible ${characterId === active ? "speaking" : "listening"}${framingClass}`;
    image.src = ArtAssets.resolve(entry.assetId);
    image.alt = profile?.name || "등장인물";
    image.classList.toggle("boss-urgent", characterId === "boss");
    image.style.setProperty("--position-x", DAY4_CHARACTER_POSITIONS[position] ?? DAY4_CHARACTER_POSITIONS.right);
    if (profile) {
      const spriteHeight = DAY4_CHARACTER_STAGE_HEIGHT * (profile.heightCm / DAY4_CHARACTER_BASE_HEIGHT) * (entry.scale || 1);
      image.style.setProperty("--sprite-height", `${spriteHeight}cqh`);
    }
    image.onerror = () => image.remove();
    return image;
  }));
}

function finishEscape(result) {
  escapeActive = false;
  state.minigameResult = result;
  if (result.grade === "perfect") state.affection += 1;
  if (result.grade === "caught") state.work += 1;
  state.index = nextSceneIndex(state.index);
  saveProgress();
  render();
}

function summaryRow(icon, title, detail, value = "") {
  return `<article><i>${icon}</i><div><b>${escapeHtml(title)}</b><span>${escapeHtml(detail)}</span></div>${value ? `<strong>${escapeHtml(value)}</strong>` : ""}</article>`;
}

function showDaySummary() {
  const deltas = {
    work: state.work - day4Start.work,
    affection: state.affection - day4Start.affection,
    trust: state.trust - day4Start.trust,
  };
  const grade = deltas.work >= 3 ? "EXCELLENT" : deltas.work >= 1 ? "GOOD" : "NEEDS CARE";
  $("#day-summary-grade").textContent = grade;
  $("#day-summary-work").innerHTML = [
    summaryRow("✓", "녹음 지원", "가이드 녹음과 테이크 기록 완료"),
    summaryRow("✓", "증빙 패키지", "정상 수치 18.4%와 원본 링크 제출"),
    summaryRow("✓", "보안 감사 요청", "자동화 요청 계정 조회 접수"),
    summaryRow("↗", "정시 퇴근 작전", state.minigameResult?.caught ? "정시 퇴근 실패 · 추가 확인 업무 완료" : "정시 퇴근 성공 · 서하린과 저녁 식사"),
  ].join("");
  const details = $("#day-summary-work").closest(".day-summary-details");
  if (details) details.open = false;
  $("#day-summary-stats").innerHTML = [
    summaryRow("◆", "업무력", "DAY 4 시작 대비", `${deltas.work >= 0 ? "+" : ""}${deltas.work}`),
    summaryRow("♡", "호감도", "DAY 4 시작 대비", `${deltas.affection >= 0 ? "+" : ""}${deltas.affection}`),
    summaryRow("◇", "신뢰도", "DAY 4 시작 대비", `${deltas.trust >= 0 ? "+" : ""}${deltas.trust}`),
  ].join("");
  const startIds = new Set((day4Start.clues || []).map((clue) => clue.id));
  const records = state.clues.filter((clue) => !startIds.has(clue.id));
  const representativeClue = records.at(-1);
  $("#day-summary-records").innerHTML = summaryRow(
    "◆",
    `새로운 기록 ${records.length}개`,
    representativeClue?.title || "새로 기록된 단서가 없습니다",
  );
  const relationshipChanged = deltas.affection !== 0 || deltas.trust !== 0;
  const reactions = $("#day-summary-reactions");
  reactions.closest(".day-summary-relation").hidden = !relationshipChanged;
  reactions.innerHTML = relationshipChanged
    ? '<article class="relationship-result"><small>RELATIONSHIP</small><p><b>서하린</b><em>:</em><strong>함께 검증한 선후배</strong><i>→</i><strong>발표 준비 파트너</strong><span>— 근거를 함께 검증하며 발표 준비 파트너가 됐습니다.</span></p></article>'
    : "";
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
  normalizeSceneIndex();
  const deferNotification = deferNextNotification;
  deferNextNotification = false;
  const scene = scenes[state.index] || scenes[0];
  const pendingChoice = Boolean(scene.choices && !state.decisions[scene.choiceKey]);
  const cinematic = Boolean(scene.cinematicDelay);
  resetCinematic();
  $("#clock").textContent = scene.time;
  $("#scene-label").textContent = scene.location || $("#scene-label").textContent;
  renderArt(scene);
  if (!cinematic) {
    $("#speaker").textContent = scene.speaker;
    $("#dialogue").textContent = dynamicText(scene);
  }
  $("#next").disabled = cinematic;
  $("#next").textContent = scene.end ? "DAY 4 완료" : "다음";
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
  if (pendingChoice) {
    $("#dialogue-card").hidden = true;
    $("#stage-choices").innerHTML = `<header class="stage-choice-prompt"><small>${escapeHtml(choicePromptLabel(scene))}</small><strong>${escapeHtml(scene.text)}</strong></header>` +
      scene.choices.map((choice, index) => {
        const lock = choiceLock(choice);
        const effects = (lock
          ? `<i class="locked">호감도 ${lock.required} 필요 · 현재 ${lock.current}</i>`
          : choiceEffectMarkup(choice.delta)) + cgBadgeMarkup(choice);
        return `<button type="button" data-choice="${index}"${lock ? ` disabled class="choice-locked" aria-label="${escapeHtml(choice.text)} · 잠김 · 호감도 ${lock.required} 필요, 현재 ${lock.current}"` : ""}><span class="stage-choice-label">${escapeHtml(choice.text)}</span><small class="stage-choice-effects">${effects}</small></button>`;
      }).join("");
    $("#stage-choices").classList.add("show");
    $("#stage").classList.add("choice-mode");
    $("#stage-choices").querySelectorAll("button:not(:disabled)").forEach((button) => { button.onclick = () => selectChoice(scene, scene.choices[Number(button.dataset.choice)]); });
  }
  if (scene.bgm) bgmManager.play(scene.bgm);
  if (scene.notification && !deferNotification) notifyMessage(scene.notification);
  renderMessages();
  if (cinematic) startCinematic(scene);
  SceneMotion.play($("#stage"), scene);
  saveProgress();
  autoSaveAtCheckpoint(scene);
  if (scene.startEscape && !state.minigameResult) {
    escapeActive = true;
    OfficeEscapeMinigame.start({ onComplete: finishEscape });
  }
}

function hasBlockingUi() {
  return locked || cinematicLocked || escapeActive || GameSettingsDialog.isOpen() || pauseMenu?.isOpen() || $("#game-save-modal").classList.contains("open") || $("#day-summary").classList.contains("show") || $("#day-complete").classList.contains("show") || locationTransition?.isActive();
}

async function nextScene() {
  if (hasBlockingUi()) return;
  const scene = scenes[state.index];
  if (scene.choices && !state.decisions[scene.choiceKey]) return;
  if (scene.end) {
    progress.days[4].complete = true;
    saveDay4Slot(scene.id);
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
  if (!cinematicLocked) $("#next").disabled = false;
}

$("#next").onclick = nextScene;
$("#save").onclick = () => openGameSave("save");
$("#load").onclick = () => openGameSave("load");
$("#game-save-close").onclick = closeGameSave;
$("#game-save-modal").onclick = (event) => { if (event.target.id === "game-save-modal") closeGameSave(); };
$("#day-summary-exit").onclick = closeDaySummary;
$("#day-complete-next").onclick = () => {
  GameProgress.startDay5(localStorage);
  $("#day-complete").classList.remove("show");
  $("#day-complete").setAttribute("aria-hidden", "true");
  $("#day-transition").classList.add("show");
  $("#day-transition").setAttribute("aria-hidden", "false");
  bgmManager.stop();
  UiSfx.playPageTurn();
  window.setTimeout(() => { location.href = "day5.html?new=1"; }, 2200);
};
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
pauseMenu = GamePauseMenu.install({ openSettings: () => settingsApi.open(), openLoad: () => openGameSave("load"), onOpen: pauseCinematic, onClose: resumeCinematic });
$("#mute").onclick = toggleBgm;
$("#sound-prompt").onclick = unlockAudio;
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".side-view").forEach((view) => view.classList.toggle("active", view.id === button.dataset.tab));
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
render();
