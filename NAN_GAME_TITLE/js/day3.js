"use strict";

const ASSET = "assets/";
const CHARACTER_PROFILES = {
  harin: { name: "서하린", heightCm: 165, image: "harin-standing.png" },
  minjae: { name: "강민재", heightCm: 182, image: "minjae-standing.png" },
  boss: { name: "박태식", heightCm: 176, image: "boss-standing.png" },
  sea: { name: "윤세아", heightCm: 161, assetId: "character.sea.neutral_standing.gentle_smile" },
  nanabot: { name: "나나봇", heightCm: 110, image: "nanabot-standing.png", scale: 0.52, defaultPosition: "center" },
};
const CHARACTER_POSITIONS = { farLeft: 18, left: 31, center: 50, right: 69, farRight: 82 };
const scenes = Day3Story.scenes;
const $ = (selector) => document.querySelector(selector);
const pageParams = new URLSearchParams(location.search);
const devSkipMinigames = pageParams.get("dev") === "skip-minigames";
const WORK_ALERT_REWARDS = Object.freeze({
  perfect: Object.freeze({ workDelta: 2, trustDelta: 1 }),
  good: Object.freeze({ workDelta: 1, trustDelta: 1 }),
  normal: Object.freeze({ workDelta: 1, trustDelta: 0 }),
  bad: Object.freeze({ workDelta: 0, trustDelta: -1 }),
});

function normalizeWorkAlertResult(result) {
  if (!result) return null;
  if (Number.isFinite(result.sent) || Number.isFinite(result.warnings)) {
    const grade = result.grade === "perfect" ? "perfect" : result.grade === "caught" ? "bad" : "good";
    return { grade, ...WORK_ALERT_REWARDS[grade], score: 0, maxScore: 0, results: [], migrated: true };
  }
  const legacyGrade = result.grade === "messy" ? "bad" : result.grade;
  const grade = Object.hasOwn(WORK_ALERT_REWARDS, legacyGrade) ? legacyGrade : "good";
  return { ...result, grade, ...WORK_ALERT_REWARDS[grade] };
}
const BACKGROUND_SOURCES = Object.freeze({
  cafeteria_day: ArtAssets.resolve("background.cafeteria.day"),
  elevator_lobby_night: ArtAssets.resolve("background.elevator_lobby.night"),
  office: `${ASSET}backgrounds/day1-office.png`,
  office_night: ArtAssets.resolve("background.office.night"),
  qa_test_space_incident: ArtAssets.resolve("background.qa_test_space.incident"),
  restaurant_lunch: ArtAssets.resolve("background.restaurant.lunch"),
});

const refs = {
  stage: $("#stage"),
  characterLayer: $("#character-layer"),
  cg: $("#event-cg"),
  cgImage: $("#event-cg-image"),
  scenePlaceholder: $("#scene-placeholder"),
  placeholderTitle: $("#placeholder-title"),
  placeholderDetail: $("#placeholder-detail"),
  systemPanel: $("#system-panel"),
  systemPanelTitle: $("#system-panel-title"),
  systemPanelRows: $("#system-panel-rows"),
  characterPlaceholder: $("#character-placeholder"),
  characterPlaceholderName: $("#character-placeholder-name"),
  characterPlaceholderDetail: $("#character-placeholder-detail"),
  messenger: $("#messenger"),
  messageSfx: $("#message-sfx"),
  clock: $("#clock"),
  speaker: $("#speaker"),
  dialogue: $("#dialogue"),
  dialogueCard: $("#dialogue-card"),
  stageChoices: $("#stage-choices"),
  next: $("#next"),
  toast: $("#toast"),
  soundPrompt: $("#sound-prompt"),
  daySummary: $("#day-summary"),
  daySummaryGrade: $("#day-summary-grade"),
  daySummaryWork: $("#day-summary-work"),
  daySummaryStats: $("#day-summary-stats"),
  daySummaryRecords: $("#day-summary-records"),
  daySummaryReactions: $("#day-summary-reactions"),
  daySummaryExit: $("#day-summary-exit"),
  dayComplete: $("#day-complete"),
  dayCompleteNext: $("#day-complete-next"),
  dayCompleteMenu: $("#day-complete-menu"),
  dayTransition: $("#day-transition"),
};

const progress = pageParams.has("new")
  ? GameProgress.resetDay3(localStorage)
  : GameProgress.startDay3(localStorage);
const day2Subtask = progress.days[2]?.decisions?.day2Subtask || "competitor";
const savedDay3 = progress.days[3];
const savedIndex = scenes.findIndex((scene) => scene.id === savedDay3.sceneId);
const state = {
  index: savedIndex >= 0 ? savedIndex : 0,
  work: progress.shared.work,
  affection: progress.shared.affection,
  trust: progress.shared.trust,
  clues: ClueRecords.normalizeList(progress.shared.clues),
  decisions: { ...savedDay3.decisions },
  seenNotifications: { ...savedDay3.seenNotifications },
  summariesSeen: { ...savedDay3.summariesSeen },
  minigameResult: normalizeWorkAlertResult(savedDay3.minigameResult),
  day1: { ...progress.shared.day1 },
  unreadClues: false,
};

let currentRoom = "";
let choiceResultTimer;
let sceneTransitionLocked = false;
let cinematicLocked = false;
let cinematicTimer;
let cinematicScene = null;
let cinematicDeadline = 0;
let cinematicRemaining = 0;
let cinematicPaused = false;
const audio = $("#bgm");

const statDescriptions = {
  work: "PT 준비와 업무 수행 성과를 나타냅니다. 높은 업무력은 업무 평가와 최종 결과에 유리하게 작용합니다.",
  affection: "서하린과의 감정적 거리를 나타냅니다. 대화 선택과 관계 중심 결과에 영향을 줍니다.",
  trust: "서하린과 팀이 플레이어를 업무 파트너로서 얼마나 신뢰하는지 나타냅니다.",
};
const statHelpPopover = $("#stat-help-popover");
let activeStatHelp = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSettings() {
  try {
    return JSON.parse(localStorage.getItem("nan-game-settings-v1")) || {};
  } catch (_error) {
    return {};
  }
}

function getBgmVolume() {
  const settings = getSettings();
  if (settings.masterMuted || settings.bgmMuted) return 0;
  return Math.min(1, Math.max(0, ((settings.masterVolume ?? 80) / 100) * ((settings.bgmVolume ?? 70) / 100)));
}

function getSfxVolume() {
  const settings = getSettings();
  if (settings.masterMuted || settings.sfxMuted) return 0;
  return Math.min(1, Math.max(0, ((settings.masterVolume ?? 80) / 100) * ((settings.sfxVolume ?? 80) / 100)));
}

const bgmManager = new GameBgmManager(audio, getBgmVolume);
window.BGMManager = bgmManager;
bgmManager.preload(["daily", "minigame", "mystery", "overtime", "happyEnding", "middleEnding", "badEnding"]);

function syncBgmUi(played) {
  refs.soundPrompt.classList.toggle("hidden", played);
  $("#mute").classList.toggle("muted", !played || getBgmVolume() === 0);
}

async function unlockAudio() {
  const played = await bgmManager.resume();
  syncBgmUi(played);
  return played;
}

async function playBgm(name) {
  if (!name) return false;
  const played = await bgmManager.play(name);
  syncBgmUi(played);
  return played;
}

function playMessageSfx() {
  refs.messageSfx.volume = getSfxVolume();
  refs.messageSfx.currentTime = 0;
  refs.messageSfx.play().catch(() => {});
}

function toast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add("show");
  window.setTimeout(() => refs.toast.classList.remove("show"), 1700);
}

function formatGameSavedAt(value) {
  if (!value) return "아직 수동 저장하지 않음";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getGameSaveSlots() {
  return GameProgress.getSaveSlots(localStorage);
}

let gameSaveMode = "save";

function renderGameSaveSlots() {
  const list = $("#game-save-list");
  const scene = scenes[state.index] || scenes[0];
  const loading = gameSaveMode === "load";
  list.replaceChildren(...getGameSaveSlots().map((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `game-save-slot${slot.empty ? " empty" : ""}${slot.saveType === "auto" ? " autosave" : ""}`;
    button.disabled = loading && slot.empty;
    const day = slot.empty ? 3 : slot.day;
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

function buildGameSavePayload(scene) {
  const saved = GameProgress.load(localStorage);
  return {
    day: 3, sceneTitle: "첫 번째 변조", sceneTime: scene.time,
    savedAt: saved.savedAt, resumeUrl: "day3.html",
    work: state.work, affection: state.affection, trust: state.trust,
    lastDialogue: { speaker: scene.speaker, text: scene.dynamic ? resolveDynamic(scene.dynamic) : scene.text },
    thumbnail: "assets/image/office-background.png", progress: saved,
    day1Save: localStorage.getItem("nan-day1-save") ? JSON.parse(localStorage.getItem("nan-day1-save")) : null,
  };
}

function saveToGameSlot(slotId, occupied) {
  if (occupied && !confirm(`SLOT ${String(slotId).padStart(2, "0")}의 기존 저장을 덮어쓸까요?`)) return;
  saveProgress();
  const scene = scenes[state.index] || scenes[0];
  const result = GameProgress.saveManualSlot(localStorage, slotId, buildGameSavePayload(scene));
  if (result.status !== "saved") {
    toast("이 브라우저에서는 슬롯을 저장할 수 없습니다.");
    return;
  }
  toast(`SLOT ${String(slotId).padStart(2, "0")}에 저장했습니다.`);
  closeGameSave();
}

const AUTOSAVE_CHECKPOINTS = new Set(["day3EveningMessage", "day3End"]);

function autoSaveAtCheckpoint(scene) {
  if (!AUTOSAVE_CHECKPOINTS.has(scene.id)) return;
  const result = GameProgress.saveAutoSlot(localStorage, `day3:${scene.id}`, buildGameSavePayload(scene));
  if (result.status === "saved" || result.status === "updated") {
    toast(`SLOT ${String(result.slotId).padStart(2, "0")}에 자동 저장했습니다.`);
  }
}

function loadFromGameSlot(slot) {
  if (slot.empty || !slot.progress) return;
  if (!confirm(`SLOT ${String(slot.slotId).padStart(2, "0")}의 진행을 불러올까요?\n현재 저장하지 않은 진행은 사라집니다.`)) return;
  localStorage.setItem(GameProgress.STORAGE_KEY, JSON.stringify(slot.progress));
  if (slot.day1Save) localStorage.setItem(GameProgress.LEGACY_DAY1_KEY, JSON.stringify(slot.day1Save));
  else localStorage.removeItem(GameProgress.LEGACY_DAY1_KEY);
  location.href = slot.resumeUrl || (Number(slot.day) === 3 ? "day3.html" : Number(slot.day) === 2 ? "day2.html" : "game.html");
}

function saveProgress({ announce = false } = {}) {
  progress.shared.work = state.work;
  progress.shared.affection = state.affection;
  progress.shared.trust = state.trust;
  progress.shared.clues = state.clues.slice();
  progress.days[3] = {
    sceneId: scenes[state.index]?.id || "day3IntroCard",
    decisions: { ...state.decisions },
    seenNotifications: { ...state.seenNotifications },
    summariesSeen: { ...state.summariesSeen },
    minigameResult: state.minigameResult,
    complete: scenes[state.index]?.end === true,
  };
  progress.currentDay = 3;
  GameProgress.save(localStorage, progress);
  if (announce) toast("DAY 3 진행 상황을 저장했습니다.");
}

function syncStats() {
  $("#work").textContent = state.work;
  $("#sys-work").textContent = state.work;
  $("#affection").textContent = state.affection;
  $("#trust").textContent = state.trust;
}

function closeStatHelp({ restoreFocus = false } = {}) {
  if (!activeStatHelp) return;
  const button = activeStatHelp;
  activeStatHelp = null;
  button.setAttribute("aria-expanded", "false");
  button.removeAttribute("aria-describedby");
  statHelpPopover.hidden = true;
  if (restoreFocus) button.focus();
}

function openStatHelp(button) {
  closeStatHelp();
  activeStatHelp = button;
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-describedby", "stat-help-popover");
  statHelpPopover.textContent = statDescriptions[button.dataset.stat];
  statHelpPopover.hidden = false;
  const rect = button.getBoundingClientRect();
  const popoverRect = statHelpPopover.getBoundingClientRect();
  const gap = 8;
  const left = Math.min(innerWidth - popoverRect.width - 12, Math.max(12, rect.left + rect.width / 2 - popoverRect.width / 2));
  let top = rect.bottom + gap;
  if (top + popoverRect.height > innerHeight - 12) top = Math.max(12, rect.top - popoverRect.height - gap);
  statHelpPopover.style.left = `${left}px`;
  statHelpPopover.style.top = `${top}px`;
}

function addClue(clue) {
  const record = ClueRecords.normalize(clue, { defaultDay: 3 });
  if (!record || state.clues.some((entry) => entry.id === record.id)) return;
  state.clues.push(record);
  state.unreadClues = !$("#clues-view").classList.contains("active");
  renderClues();
  toast("새 단서가 기록되었습니다.");
}

function renderClues() {
  const list = $("#clue-list");
  $("#clue-count").textContent = state.clues.length;
  $("#clue-new").hidden = !state.unreadClues;
  if (!state.clues.length) {
    list.innerHTML = '<div class="clue-empty"><span>◇</span><strong>아직 기록된 단서가 없습니다</strong><p>대화와 자료를 조사하면 중요한 정보가 여기에 정리됩니다.</p></div>';
    return;
  }
  ClueMindmap.render(list, {
    clues: state.clues,
    currentDay: 3,
  });
}

function setTab(name) {
  document.querySelectorAll(".tabs button").forEach((button) => button.classList.toggle("active", button.dataset.tab === name));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === name));
  if (name === "clues-view") {
    state.unreadClues = false;
    renderClues();
    saveProgress();
  }
}

function sceneIndex(id) {
  return scenes.findIndex((scene) => scene.id === id);
}

function isAtOrAfter(id) {
  const target = sceneIndex(id);
  return target >= 0 && state.index >= target;
}

const MESSAGE_DAY_NAMES = Object.freeze(["", "월요일", "화요일", "수요일", "목요일", "금요일"]);

function messageDay(message, fallbackDay = 3) {
  const explicitDay = Number(message.day);
  if (explicitDay >= 1 && explicitDay <= 5) return explicitDay;
  const embeddedDay = String(message.time || "").match(/DAY\s*([1-5])/i);
  return embeddedDay ? Number(embeddedDay[1]) : fallbackDay;
}

function messageClock(message) {
  return String(message.time || "").replace(/^DAY\s*[1-5]\s*·\s*/i, "");
}

function messageDayDivider(day) {
  return `<div class="date-divider message-day-label message-day-divider"><span>DAY ${day} · ${MESSAGE_DAY_NAMES[day]}</span></div>`;
}

function visibleMessages(room) {
  return Day3Story.MESSAGES.filter((message) => (
    message.room === room
    && (messageDay(message) < 3 || isAtOrAfter(message.at))
  ));
}

function renderMessages() {
  const allRooms = Object.keys(Day3Story.ROOMS);
  const visibleRooms = allRooms.filter((room) => visibleMessages(room).length);
  $("#chat-list-empty").hidden = visibleRooms.length > 0;
  allRooms.forEach((room) => {
    const button = $(`#chat-${room}`);
    const messages = visibleMessages(room);
    button.hidden = messages.length === 0;
    if (!messages.length) return;
    const latest = messages.at(-1);
    const latestText = latest.dynamic ? resolveDynamic(latest.dynamic) : latest.text;
    button.querySelector(".chat-copy small").textContent = `${latest.sender}: ${latestText}`;
    button.querySelector("time").textContent = latest.time;
    const count = unreadCount(room);
    const unread = count > 0 && currentRoom !== room;
    button.querySelector("em").textContent = String(count);
    button.querySelector("em").hidden = !unread;
    button.classList.toggle("unread-pulse", unread);
  });
  renderMessageTabAlert();

  const box = $("#messages");
  if (!currentRoom) return;
  const messages = visibleMessages(currentRoom);
  if (!messages.length) {
    box.innerHTML = '<div class="message-empty"><span>✦</span><b>아직 대화가 없습니다</b><p>새 메시지가 도착하면 여기에 표시됩니다.</p></div>';
    return;
  }
  let renderedDay = 0;
  box.innerHTML = messages.map((message) => {
    const day = messageDay(message);
    const divider = day === renderedDay ? "" : messageDayDivider(day);
    renderedDay = day;
    const text = message.dynamic ? resolveDynamic(message.dynamic) : message.text;
    return `${divider}<article class="message" data-message-day="${day}"><b>${escapeHtml(message.sender)}</b><p>${escapeHtml(text)}</p><small>${escapeHtml(messageClock(message))}</small></article>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

function openChat(room) {
  currentRoom = room;
  const info = Day3Story.ROOMS[room];
  $("#room-type").textContent = info.type;
  $("#room-title").textContent = info.title;
  $("#room-members").innerHTML = info.members.map((member) => `<span>${escapeHtml(member)}</span>`).join("");
  $("#chat-list").hidden = true;
  $("#chat-room").hidden = false;
  clearUnread(room);
  renderMessages();
  renderMessageTabAlert();
  saveProgress();
}

function closeChat() {
  currentRoom = "";
  $("#chat-room").hidden = true;
  $("#chat-list").hidden = false;
  renderMessages();
}

function notificationRoom(id) {
  const message = Day3Story.MESSAGES.find((entry) => entry.id === id);
  return message?.room || null;
}

function unreadCount(room) {
  const count = Number(state.seenNotifications[`unread:count:${room}`]);
  if (Number.isFinite(count) && count > 0) return Math.floor(count);
  return state.seenNotifications[`unread:${room}`] === true ? 1 : 0;
}

function markUnread(room, count = 1) {
  if (!room || count < 1) return;
  state.seenNotifications[`unread:${room}`] = true;
  state.seenNotifications[`unread:count:${room}`] = unreadCount(room) + count;
}

function clearUnread(room) {
  state.seenNotifications[`unread:${room}`] = false;
  state.seenNotifications[`unread:count:${room}`] = 0;
}

function renderMessageTabAlert({ pulse = false } = {}) {
  const button = document.querySelector('[data-tab="messages-view"]');
  const badge = $("#message-new");
  const count = Object.keys(Day3Story.ROOMS).reduce((sum, room) => sum + unreadCount(room), 0);
  const hasUnread = count > 0;
  badge.textContent = String(count);
  badge.hidden = !hasUnread;
  button.classList.toggle("has-unread", hasUnread);
  if (pulse && hasUnread && $("#clues-view").classList.contains("active")) {
    button.classList.remove("message-tab-alert");
    void button.offsetWidth;
    button.classList.add("message-tab-alert");
    window.setTimeout(() => button.classList.remove("message-tab-alert"), 1900);
  }
}

function notifyMessage(id) {
  if (!id || state.seenNotifications[`notified:${id}`]) return;
  state.seenNotifications[`notified:${id}`] = true;
  const room = notificationRoom(id);
  if (room) markUnread(room);
  refs.messenger.classList.remove("message-arrived");
  void refs.messenger.offsetWidth;
  refs.messenger.classList.add("message-arrived");
  renderMessageTabAlert({ pulse: true });
  playMessageSfx();
  if (room) toast(`${Day3Story.ROOMS[room].title.replace(/^# /, "")}에 새 메시지가 도착했습니다.`);
  window.setTimeout(() => refs.messenger.classList.remove("message-arrived"), 1900);
  renderMessages();
}

function resolveDynamic(name) {
  const grade = normalizeWorkAlertResult(state.minigameResult)?.grade || "good";
  const affectionBeforeChat = state.affection;
  const values = {
    workAlertResult: {
      perfect: "중요한 기록을 전부 지켰네요. 조사 방향도 흔들리지 않았어요.",
      good: "급한 조사 요청은 대부분 처리했어요. 이제 기록을 순서대로 확인해요.",
      normal: "필요한 기록은 남았어요. 다음에는 보존 요청부터 먼저 구분해요.",
      bad: "놓친 요청은 다시 확인할 수 있어요. 변경본부터 건드리지 말고 보존해요.",
    }[grade],
    workAlertMessage: {
      perfect: "복원 지점과 변경본 모두 확인했어요. 그대로 보존해 주세요.",
      good: "중요한 조사 요청은 확인했어요. 오후에 기록을 같이 비교해요.",
      normal: "누락된 요청은 제가 다시 표시했어요. 보존본부터 확인해요.",
      bad: "지금은 복원하지 마세요. 변경본을 보존한 뒤 하나씩 다시 확인해요.",
    }[grade],
    decisionResponse: {
      accuse: "의심할 수는 있어요. 하지만 이름 하나만으로 결론부터 내리지는 말아 주세요.",
      verify: "좋아요. 믿는다는 말보다 그게 더 안심되네요. 기록으로 확인해요.",
      blindTrust: "그렇게 복원하면 같은 일이 반복돼요. 저를 믿는 것과 기록을 확인하지 않는 건 다른 문제예요.",
    }[state.decisions.harinSuspicion] || "이름과 실행자가 같은지 끝까지 확인해요.",
    decisionIntent: {
      accuse: "선배의 이름이 남아 있다. 직접 물어서 설명을 들어야 한다.",
      verify: "이름만으로 실행자를 단정할 수 없다. 기록이 남은 이유부터 확인해야 한다.",
      blindTrust: "선배가 아니라고 믿고 복원하면 빠르다. 그래도 확인 없이 움직여도 되는 걸까.",
    }[state.decisions.harinSuspicion] || "먼저 선배에게 사실을 확인해야 한다.",
    bossReport: {
      accuse: "수정 기록에는 서하린 선배의 이름이 있습니다. 다만 자동화가 그 이름을 소유자로 표시했을 가능성도 있어, 실행 기록을 더 확인하겠습니다.",
      verify: "표시된 이름과 실제 실행자가 같은지는 아직 확인되지 않았습니다. 오후에는 직접 접근 기록과 자동화 경로를 비교하겠습니다.",
      blindTrust: "서하린 선배는 직접 열지 않았다고 했습니다. 그 말을 전제로 복원하기보다, 실행 기록을 확인한 뒤 판단하겠습니다.",
    }[state.decisions.harinSuspicion] || "표시된 이름만으로는 실행자를 단정할 수 없습니다. 오후에 관련 기록을 교차 확인하겠습니다.",
    lunchBreak: {
      porkCutlet: "돈가스 골랐네. 그래, 아침부터 분위기가 무거웠으니까 이럴 때는 든든하게 먹어야지. 무슨 일 있었는지는 먹으면서 천천히 말해봐.",
      stew: "김치찌개 잘 골랐다. 뜨거울 때 먹어. 아침부터 무슨 일 있었는지 얼굴에 다 보여. 급하게 말하지 말고 천천히.",
      salad: "오늘은 가볍게 먹네. 천천히 먹어. 아침부터 또 자료 때문에 정신없었지? 무슨 일인지 들어는 볼게.",
    }[state.decisions.lunchMenu] || "아침부터 분위기가 왜 그래? 설마 자료 또 꼬였어?",
    firstInvestigationInference: {
      access: "09:03에 선배가 문서를 직접 연 기록은 없다. 적어도 이름이 남았다는 사실만으로 선배가 직접 수정했다고 볼 수는 없다.",
      automation: "문장이 바뀐 시각에 구버전 연결과 나나봇 정리가 연달아 실행됐다. 이제 중요한 건 소유자 이름이 아니라 실제 호출 경로다.",
      folder: "현재 작업본이 과거 폴더와 연결돼 있다. 이번 변조를 오늘만의 실수로 보기보다, 과거 작업이 다시 불려온 이유부터 확인해야 한다.",
    }[state.decisions.investigationFirst] || "첫 기록만으로 결론을 내릴 수는 없다. 나머지 기록과 교차해서 봐야 한다.",
    departureLead: affectionBeforeChat < 2
      ? "퇴근 준비를 마치고 고개를 들었을 때 선배의 자리는 이미 비어 있었다. 오늘 같이 가자는 말은 조금 성급했던 걸까."
      : affectionBeforeChat < 4
        ? "로비로 내려가자 선배가 출입문 옆에서 휴대폰을 내려다보고 있었다. 정말 퇴근 시간을 맞춰 준 모양이었다."
        : "엘리베이터 문이 열리자 선배가 먼저 나를 발견하고 손을 들었다. 어제 편의점에서 마주쳤을 때보다 훨씬 자연스러운 미소였다.",
    departureHarin: affectionBeforeChat < 2
      ? "오늘은 먼저 갈게요. 아까 메시지는 고마웠어요. 내일 봐요."
      : affectionBeforeChat < 4
        ? (grade === "caught" ? "아까는 제대로 답을 못 했죠. 역까지는 같이 가요." : "시간 맞았네요. 역까지 같이 걸어요.")
        : (grade === "caught" ? "아까 놀랐죠? 그래도 약속은 약속이니까, 오늘은 제가 기다렸어요." : "기다렸어요. 오늘은 편의점보다 조금 더 오래 이야기할 수 있겠네요."),
    eveningMessage: affectionBeforeChat < 2
      ? "오늘은 먼저 가서 미안해요. 퇴근 이야기는 우리 조금 더 천천히 해요. 내일 기록 확인부터 마무리하고요."
      : affectionBeforeChat < 4
        ? "오늘 역까지 같이 걸어서 좋았어요. 내일은 실제 실행 계정부터 확인해요."
        : "오늘 같이 퇴근하길 잘했어요. 어제 편의점 이야기는 다음에 더 해요. 내일은 기록도 끝까지 같이 확인하고요.",
    investigationReaction: {
      access: "제 이름이 보였으니 직접 접근부터 보는 게 맞아요. 기록이 없다는 사실도 따로 보존해요.",
      automation: "실행 시각부터 좁히는군요. 소유자 이름보다 실제 호출 기록을 먼저 봐요.",
      folder: "그 폴더부터 보는군요. 예전 일과 지금 일을 섞지 않도록 연결 경로만 정확히 기록해요.",
    }[state.decisions.investigationFirst] || "확인한 순서까지 기록해 둬요. 나중에 판단이 바뀐 이유도 증거가 되니까요.",
  };
  return values[name] || "";
}

function renderCharacters(scene) {
  refs.characterLayer.innerHTML = "";
  if (scene.placeholderCharacter) return;
  const characters = scene.characters || (scene.char ? [{ id: scene.char }] : []);
  const active = scene.activeCharacter || scene.char || characters[0]?.id;
  refs.characterLayer.dataset.count = characters.length;
  characters.forEach((entry, index) => {
    const profile = CHARACTER_PROFILES[entry.id];
    if (!profile) return;
    const image = document.createElement("img");
    const position = entry.position || profile.defaultPosition || (characters.length === 1 ? "right" : characters.length === 2 ? (index === 0 ? "left" : "right") : index === 0 ? "left" : index === 1 ? "center" : "right");
    const framingClass = entry.framing ? ` framing-${entry.framing.replace(/_/g, "-")}` : "";
    image.className = `character character-${entry.id} visible ${entry.id === active ? "speaking" : "listening"}${framingClass}`;
    const assetId = entry.assetId || profile.assetId;
    image.src = assetId ? ArtAssets.resolve(assetId) : `${ASSET}characters/${profile.image}`;
    image.alt = profile.name;
    image.style.setProperty("--position-x", CHARACTER_POSITIONS[position] ?? CHARACTER_POSITIONS.right);
    image.style.setProperty("--sprite-height", `${84 * (profile.heightCm / 182) * (profile.scale || 1)}cqh`);
    image.onerror = () => image.remove();
    refs.characterLayer.appendChild(image);
  });
}

function inheritedPlaceholder(index) {
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const scene = scenes[cursor];
    if (scene.placeholder && scene.placeholder !== "inherit") return scene.placeholder;
    if (scene.bg) return null;
  }
  return null;
}

function inheritedSceneValue(index, key) {
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const candidate = scenes[cursor];
    if (!Day3Story.isVisible(candidate, state.decisions, visibilityContext())) continue;
    if (candidate[key]) return candidate[key];
  }
  return null;
}

function visibilityContext() {
  return {
    affectionBeforeChat: state.affection,
  };
}

function unlockCg(scene) {
  if (!scene.cgAssetId) return;
  try {
    const image = ArtAssets.resolve(scene.cgAssetId);
    const saved = JSON.parse(localStorage.getItem("nan-unlocked-cgs-v1")) || [];
    const archive = saved.filter((entry) => typeof entry === "object" && entry?.id !== scene.cgAssetId);
    archive.push({
      id: scene.cgAssetId,
      image,
      day: `DAY 3 · ${scene.time}`,
      title: scene.cgTitle || scene.location || "기록된 장면",
    });
    localStorage.setItem("nan-unlocked-cgs-v1", JSON.stringify(archive));
  } catch (_error) {}
}

function renderVisuals(scene) {
  const effectiveBg = inheritedSceneValue(state.index, "bg");
  const placeholder = scene.placeholder === "inherit" ? inheritedPlaceholder(state.index) : scene.placeholder;
  refs.scenePlaceholder.classList.toggle("show", Boolean(placeholder));
  refs.scenePlaceholder.setAttribute("aria-hidden", String(!placeholder));
  refs.stage.classList.toggle("stage-placeholder-active", Boolean(placeholder));
  if (placeholder) {
    refs.placeholderTitle.textContent = placeholder.title;
    refs.placeholderDetail.textContent = placeholder.detail;
    refs.stage.style.backgroundImage = "none";
  } else if (effectiveBg && BACKGROUND_SOURCES[effectiveBg]) {
    refs.stage.style.backgroundImage = `url('${BACKGROUND_SOURCES[effectiveBg]}')`;
  }

  if (scene.cgAssetId) {
    refs.cgImage.src = ArtAssets.resolve(scene.cgAssetId);
    refs.cgImage.alt = scene.cgTitle || "스토리 이벤트 CG";
    refs.cg.classList.add("show");
    refs.cg.setAttribute("aria-hidden", "false");
    refs.stage.classList.add("cg-active");
    unlockCg(scene);
  } else {
    refs.cg.classList.remove("show");
    refs.cg.setAttribute("aria-hidden", "true");
    refs.stage.classList.remove("cg-active");
  }

  const characterPlaceholder = scene.placeholderCharacter;
  refs.characterPlaceholder.classList.toggle("show", Boolean(characterPlaceholder));
  refs.characterPlaceholder.setAttribute("aria-hidden", String(!characterPlaceholder));
  if (characterPlaceholder) {
    refs.characterPlaceholderName.textContent = characterPlaceholder.name;
    refs.characterPlaceholderDetail.textContent = characterPlaceholder.detail;
  }

  refs.systemPanel.classList.toggle("show", Boolean(scene.systemPanel));
  refs.systemPanel.setAttribute("aria-hidden", String(!scene.systemPanel));
  refs.stage.classList.toggle("system-panel-active", Boolean(scene.systemPanel));
  if (scene.systemPanel) {
    PresentationScreen.apply(refs.systemPanel, scene.systemPanel);
  }
}

function resetCinematic() {
  window.clearTimeout(cinematicTimer);
  cinematicLocked = false;
  cinematicScene = null;
  cinematicDeadline = 0;
  cinematicRemaining = 0;
  cinematicPaused = false;
  refs.stage.classList.remove("cinematic-only", "cinematic-ready", "sprite-cinematic");
}

function completeCinematic(scene) {
  cinematicTimer = window.setTimeout(() => {
    refs.speaker.textContent = scene.speaker;
    refs.dialogue.textContent = scene.dynamic ? resolveDynamic(scene.dynamic) : scene.text;
    refs.dialogueCard.hidden = false;
    SceneMotion.applyDialogueEmphasis(refs.stage, scene);
    cinematicLocked = false;
    cinematicScene = null;
    cinematicDeadline = 0;
    cinematicRemaining = 0;
    refs.stage.classList.add("cinematic-ready");
    refs.next.disabled = false;
  }, cinematicRemaining);
}

function startCinematic(scene) {
  cinematicLocked = true;
  cinematicScene = scene;
  cinematicRemaining = scene.cinematicDelay;
  cinematicDeadline = performance.now() + cinematicRemaining;
  cinematicPaused = false;
  refs.dialogueCard.hidden = true;
  refs.stage.classList.add("cinematic-only");
  if (scene.cinematicTarget === "sprite") refs.stage.classList.add("sprite-cinematic");
  refs.next.disabled = true;
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
  if (!scene?.cinematicDelay) return Promise.resolve();
  const sources = [];
  if (scene.cgAssetId) sources.push(ArtAssets.resolve(scene.cgAssetId));
  if (scene.bg && BACKGROUND_SOURCES[scene.bg]) sources.push(BACKGROUND_SOURCES[scene.bg]);
  (scene.characters || []).forEach((entry) => {
    if (entry.assetId) sources.push(ArtAssets.resolve(entry.assetId));
  });
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

function nextVisibleIndex(fromIndex) {
  let index = Math.min(fromIndex, scenes.length - 1);
  while (index < scenes.length - 1 && !Day3Story.isVisible(scenes[index], state.decisions, visibilityContext())) index += 1;
  return index;
}

function choicePromptLabel(scene) {
  const speaker = (scene?.speaker || "").trim();
  return speaker && !["한도윤", "시스템", "내레이션"].includes(speaker) ? speaker : "상황";
}

function addStageChoicePrompt(scene) {
  const prompt = document.createElement("header");
  prompt.className = "stage-choice-prompt";
  const text = scene.dynamic ? resolveDynamic(scene.dynamic) : scene.text;
  prompt.innerHTML = `<small>${escapeHtml(choicePromptLabel(scene))}</small><strong>${escapeHtml(text)}</strong>`;
  refs.stageChoices.appendChild(prompt);
}

function choiceEffectTags(choice) {
  const labels = { work: "◆ 업무력", affection: "♡ 호감도", trust: "◇ 신뢰도" };
  const tags = Object.entries(choice.delta || {})
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => labels[key] ? ({
      text: `${labels[key]} ${value > 0 ? "상승" : "하락"}`,
      tone: value > 0 ? "gain" : "loss",
    }) : null)
    .filter(Boolean);
  return tags.length ? tags : [{ text: "스토리 분기", tone: "branch" }];
}

function choiceLock(choice) {
  const required = Number(choice?.minAffection);
  return Number.isFinite(required) && state.affection < required
    ? { required, current: state.affection }
    : null;
}

function addStageChoice(choice, key, scene) {
  const button = document.createElement("button");
  const lock = choiceLock(choice);
  const tags = lock
    ? [{ text: `호감도 ${lock.required} 필요 · 현재 ${lock.current}`, tone: "locked" }]
    : choiceEffectTags(choice);
  button.type = "button";
  button.disabled = Boolean(lock);
  button.classList.toggle("choice-locked", Boolean(lock));
  if (lock) button.setAttribute("aria-label", `${choice.text} · 잠김 · 호감도 ${lock.required} 필요, 현재 ${lock.current}`);
  button.innerHTML = `<span class="stage-choice-label">${escapeHtml(choice.text)}</span><small class="stage-choice-effects">${tags.map((tag) => `<i class="${tag.tone}">${escapeHtml(tag.text)}</i>`).join("")}</small>`;
  if (!lock) button.addEventListener("click", () => choose(choice, key, scene));
  refs.stageChoices.appendChild(button);
}

function choose(choice, key, scene) {
  const before = { work: state.work, affection: state.affection, trust: state.trust };
  Object.entries(choice.delta || {}).forEach(([stat, delta]) => { state[stat] += delta; });
  state.decisions[key] = choice.id || choice.value || choice.text;
  refs.dialogueCard.hidden = false;
  refs.speaker.textContent = scene.replySpeaker || scene.speaker;
  refs.dialogue.textContent = choice.reply || choice.text;
  refs.stageChoices.innerHTML = "";
  refs.stageChoices.classList.remove("show");
  refs.stage.classList.remove("choice-mode");
  sceneTransitionLocked = false;
  refs.next.disabled = false;
  window.requestAnimationFrame(() => {
    const activeScene = scenes[state.index];
    if (activeScene === scene && state.decisions[key] && !cinematicLocked) refs.next.disabled = false;
  });
  syncStats();
  showChoiceResult(choice, before, scene.relationshipChoice);
  saveProgress();
}

function showChoiceResult(choice, before, relationshipChoice) {
  const entries = Object.entries(choice.delta || {}).filter(([, delta]) => delta !== 0);
  if (!entries.length) return;
  const names = { work: "업무력", affection: "호감도", trust: "신뢰도" };
  $("#choice-result-title").textContent = relationshipChoice ? "서하린과의 관계가 변했습니다" : "선택이 능력치에 반영되었습니다";
  $("#choice-result-list").innerHTML = entries.map(([stat, delta]) => `<article class="${delta > 0 ? "gain" : "loss"} stat-${stat}"><i aria-hidden="true"></i><div><span>${names[stat]}</span><small>${before[stat]} → ${state[stat]}</small></div><strong>${delta > 0 ? "+" : ""}${delta}</strong></article>`).join("");
  const panel = $("#choice-result");
  panel.classList.remove("show");
  panel.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => panel.classList.add("show"));
  clearTimeout(choiceResultTimer);
  choiceResultTimer = window.setTimeout(() => {
    panel.classList.remove("show");
    panel.setAttribute("aria-hidden", "true");
  }, 3000);
}

function finishWorkAlert(result) {
  if (state.minigameResult) return;
  const normalizedResult = normalizeWorkAlertResult(result);
  state.minigameResult = normalizedResult;
  state.work += normalizedResult.workDelta;
  state.trust += normalizedResult.trustDelta;
  state.index = nextVisibleIndex(state.index + 1);
  syncStats();
  saveProgress();
  playBgm("daily");
  render();
}

function startWorkAlert() {
  if (devSkipMinigames) {
    console.info("[DEV] 조사 업무 알림 미니게임을 GOOD 결과로 스킵했습니다.");
    finishWorkAlert({
      score: 620,
      maxScore: 880,
      scorePercentage: 70.5,
      grade: "good",
      workDelta: 1,
      trustDelta: 1,
      outcomeCounts: { correct: 0, wrong: 0, missed: 0, criticalHandled: 0, criticalTotal: 0 },
      harinHandled: false,
      missedCritical: [],
      results: [],
      skipped: true,
    });
    return;
  }
  WorkAlertMinigame.startDay3({
    subtask: day2Subtask,
    onComplete: finishWorkAlert,
  });
}

function summaryRow(icon, title, detail, value = "") {
  return `<article><i>${icon}</i><div><b>${escapeHtml(title)}</b><small>${escapeHtml(detail)}</small></div>${value ? `<strong>${escapeHtml(value)}</strong>` : ""}</article>`;
}

function relationshipName(affection, trust) {
  if (trust >= 5 && affection >= 4) return "일상을 나누는 업무 파트너";
  if (trust >= 2) return "호흡을 맞추기 시작한 선후배";
  return "필요한 일은 함께하는 선후배";
}

function showDaySummary() {
  const snapshot = progress.day3StartSnapshot || { work: 0, affection: 0, trust: 0, clues: [] };
  const deltas = {
    work: state.work - snapshot.work,
    affection: state.affection - snapshot.affection,
    trust: state.trust - snapshot.trust,
  };
  const grade = deltas.work >= 4 ? "EXCELLENT" : deltas.work >= 1 ? "GOOD" : "NEEDS CARE";
  refs.daySummaryGrade.textContent = grade;
  const tasks = [
    "DAY 3 최초 변경본 보존",
    "정상 원본과 변경본 비교",
    `변조 조사 요청 대응 · ${state.minigameResult?.grade?.toUpperCase() || "완료"}`,
    "접근·자동화·폴더 연결 기록 조사",
    "DAY 2 복원 지점 유지",
  ];
  refs.daySummaryWork.innerHTML = tasks.map((task, index) => summaryRow(index === 2 ? "✉" : "✓", task, "오늘 업무 완료")).join("");
  const details = refs.daySummaryWork.closest(".day-summary-details");
  if (details) details.open = false;
  refs.daySummaryStats.innerHTML = [
    ["◆", "업무력", deltas.work, "조사·선택·미니게임 결과"],
    ["♡", "호감도", deltas.affection, "DAY 3 의심과 관계 선택"],
    ["◇", "신뢰도", deltas.trust, "증거와 조사 요청을 대하는 태도"],
  ].map(([icon, name, value, detail]) => summaryRow(icon, name, detail, `${value >= 0 ? "+" : ""}${value}`)).join("");
  const snapshotIds = new Set(snapshot.clues.map((clue) => clue.id));
  const dailyClues = state.clues.filter((clue) => !snapshotIds.has(clue.id));
  const representativeClue = dailyClues.at(-1);
  refs.daySummaryRecords.innerHTML = summaryRow(
    "◆",
    `새로운 기록 ${dailyClues.length}개`,
    representativeClue?.title || "새로 기록된 단서가 없습니다",
  );
  const beforeRelationship = relationshipName(snapshot.affection, snapshot.trust);
  const afterRelationship = relationshipName(state.affection, state.trust);
  const relationshipChanged = beforeRelationship !== afterRelationship;
  const relationSection = refs.daySummaryReactions.closest(".day-summary-relation");
  relationSection.hidden = !relationshipChanged;
  refs.daySummaryReactions.innerHTML = relationshipChanged
    ? `<article class="relationship-result"><small>RELATIONSHIP</small><p><b>서하린</b><em>:</em><strong>${escapeHtml(beforeRelationship)}</strong><i>→</i><strong>${escapeHtml(afterRelationship)}</strong><span>— 의심스러운 기록 앞에서 어떤 태도를 보였는지가 관계에 남았습니다.</span></p></article>`
    : "";
  refs.daySummary.classList.add("show");
  refs.daySummary.setAttribute("aria-hidden", "false");
  refs.next.disabled = true;
  window.setTimeout(() => refs.daySummaryExit.focus(), 50);
}

async function closeDaySummary() {
  state.summariesSeen[3] = true;
  refs.daySummary.classList.remove("show");
  refs.daySummary.setAttribute("aria-hidden", "true");
  const targetIndex = nextVisibleIndex(state.index + 1);
  const targetScene = scenes[targetIndex];
  await locationTransition.playIfChanged($("#scene-label").textContent, targetScene.location);
  state.index = targetIndex;
  saveProgress();
  render();
}

let deferNextNotification = false;

function render() {
  const deferNotification = deferNextNotification;
  deferNextNotification = false;
  state.index = nextVisibleIndex(state.index);
  const scene = scenes[state.index] || scenes[0];
  const choiceKey = scene.choiceKey || scene.id;
  const pendingChoice = Boolean(scene.choices && !state.decisions[choiceKey]);
  const cinematic = Boolean(scene.cinematicDelay);
  const effectiveBgm = inheritedSceneValue(state.index, "bgm");
  resetCinematic();
  if (scene.daySummary && state.summariesSeen[3]) {
    state.index = nextVisibleIndex(state.index + 1);
    render();
    return;
  }
  refs.clock.textContent = scene.time;
  refs.dialogueCard.hidden = pendingChoice;
  if (!cinematic) {
    refs.speaker.textContent = scene.speaker;
    refs.dialogue.textContent = scene.dynamic ? resolveDynamic(scene.dynamic) : scene.text;
  }
  refs.next.disabled = cinematic;
  refs.next.textContent = scene.end ? "타이틀로" : "다음";
  $("#scene-label").textContent = inheritedSceneValue(state.index, "location") || (Number(scene.time.split(":")[0]) >= 12 ? "게임사업실 · 오후" : "게임사업실 · 오전");
  renderVisuals(scene);
  renderCharacters(scene);
  if (effectiveBgm) playBgm(effectiveBgm);
  if (scene.clue) addClue(scene.clue);
  if (scene.notification && !deferNotification) notifyMessage(scene.notification);
  renderMessages();
  refs.stageChoices.innerHTML = "";
  refs.stageChoices.classList.remove("show");
  refs.stage.classList.remove("choice-mode");
  if (pendingChoice) {
    addStageChoicePrompt(scene);
    scene.choices.forEach((choice) => addStageChoice(choice, choiceKey, scene));
    refs.stageChoices.classList.add("show");
    refs.stage.classList.add("choice-mode");
    refs.next.disabled = true;
  }
  if (cinematic) startCinematic(scene);
  SceneMotion.play(refs.stage, scene);
  syncStats();
  saveProgress();
  autoSaveAtCheckpoint(scene);
  if (scene.startWorkAlert && !state.minigameResult) {
    startWorkAlert();
    return;
  }
  if (scene.daySummary) showDaySummary();
}

function hasBlockingUi() {
  return refs.daySummary.classList.contains("show")
    || refs.dayComplete.classList.contains("show")
    || $("#game-save-modal").classList.contains("open")
    || GameSettingsDialog.isOpen()
    || !!document.querySelector(".work-alert-minigame:not([hidden])");
}

async function next() {
  if (cinematicLocked || sceneTransitionLocked || hasBlockingUi()) return;
  sceneTransitionLocked = true;
  refs.next.disabled = true;
  const scene = scenes[state.index];
  if (scene.end) {
    progress.days[3].complete = true;
    saveProgress();
    refs.dayComplete.classList.add("show");
    refs.dayComplete.setAttribute("aria-hidden", "false");
    refs.next.disabled = true;
    window.setTimeout(() => refs.dayCompleteMenu.focus(), 50);
    sceneTransitionLocked = false;
    return;
  }
  const targetIndex = nextVisibleIndex(state.index + 1);
  const targetScene = scenes[targetIndex];
  await preloadSceneImages(targetScene);
  const locationChanged = await locationTransition.playIfChanged($("#scene-label").textContent, targetScene.location);
  state.index = targetIndex;
  saveProgress();
  deferNextNotification = locationChanged;
  render();
  if (locationChanged && targetScene.notification) {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    notifyMessage(targetScene.notification);
  }
  sceneTransitionLocked = false;
}

document.querySelectorAll(".tabs button").forEach((button) => { button.onclick = () => setTab(button.dataset.tab); });
document.querySelectorAll(".chat-item").forEach((button) => { button.onclick = () => openChat(button.dataset.room); });
$("#chat-back").onclick = closeChat;
refs.next.onclick = next;
refs.daySummaryExit.onclick = closeDaySummary;
refs.dayCompleteMenu.onclick = () => { location.href = "index.html"; };
refs.dayCompleteNext.onclick = () => {
  GameProgress.startDay4(localStorage);
  refs.dayComplete.classList.remove("show");
  refs.dayComplete.setAttribute("aria-hidden", "true");
  refs.dayTransition.classList.add("show");
  refs.dayTransition.setAttribute("aria-hidden", "false");
  bgmManager.stop();
  UiSfx.playPageTurn();
  window.setTimeout(() => { location.href = "day4.html?new=1"; }, 2200);
};
$("#save").onclick = () => openGameSave("save");
$("#load").onclick = () => openGameSave("load");
$("#game-save-close").onclick = closeGameSave;
$("#game-save-modal").onclick = (event) => { if (event.target.id === "game-save-modal") closeGameSave(); };
$("#mute").onclick = async () => {
  if (bgmManager.isPaused()) await unlockAudio();
  else {
    await bgmManager.pause();
    $("#mute").classList.add("muted");
    refs.soundPrompt.classList.remove("hidden");
  }
};
refs.soundPrompt.onclick = unlockAudio;

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
statHelpPopover.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", () => closeStatHelp());
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && activeStatHelp) closeStatHelp({ restoreFocus: true }); });
window.addEventListener("resize", () => closeStatHelp());
document.addEventListener("scroll", () => closeStatHelp(), true);
document.addEventListener("nan:settings-open", pauseCinematic);
document.addEventListener("nan:settings-close", resumeCinematic);
let pauseMenu;
const settingsDialogApi = GameSettingsDialog.install({
  onApply: () => syncBgmUi(!bgmManager.isPaused()),
  onEscape: () => pauseMenu?.isOpen() ? pauseMenu.close() : pauseMenu?.open(),
  closeOverlay: () => {
    if ($("#game-save-modal").classList.contains("open")) { closeGameSave(); return true; }
    if (activeStatHelp) { closeStatHelp({ restoreFocus: true }); return true; }
    return false;
  },
});
pauseMenu = GamePauseMenu.install({
  openSettings: () => settingsDialogApi.open(),
  openLoad: () => openGameSave("load"),
  onOpen: pauseCinematic,
  onClose: resumeCinematic,
});
const locationTransition = GameLocationTransition.install();
document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

renderClues();
renderMessages();
syncStats();
render();
