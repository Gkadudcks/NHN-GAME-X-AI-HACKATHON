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
const scenes = Day2Story.scenes;
const $ = (selector) => document.querySelector(selector);

const refs = {
  stage: $("#stage"),
  characterLayer: $("#character-layer"),
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

const progress = new URLSearchParams(location.search).has("new")
  ? GameProgress.resetDay2(localStorage)
  : GameProgress.startDay2(localStorage);
const savedDay2 = progress.days[2];
const savedIndex = scenes.findIndex((scene) => scene.id === savedDay2.sceneId);
const state = {
  index: savedIndex >= 0 ? savedIndex : 0,
  work: progress.shared.work,
  affection: progress.shared.affection,
  trust: progress.shared.trust,
  clues: progress.shared.clues.slice(),
  decisions: { ...savedDay2.decisions },
  seenNotifications: { ...savedDay2.seenNotifications },
  summariesSeen: { ...savedDay2.summariesSeen },
  minigameResult: savedDay2.minigameResult,
  day1: { ...progress.shared.day1 },
  unreadClues: false,
};

let currentRoom = "";
let choiceResultTimer;
let sceneTransitionLocked = false;
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
  return Array.from({ length: 5 }, (_, index) => {
    const slotId = index + 1;
    try {
      const value = JSON.parse(localStorage.getItem(`nan-save-slot-${slotId}`));
      return value ? { slotId, empty: false, ...value } : { slotId, empty: true };
    } catch (_error) { return { slotId, empty: true }; }
  });
}

let gameSaveMode = "save";

function renderGameSaveSlots() {
  const list = $("#game-save-list");
  const scene = scenes[state.index] || scenes[0];
  const loading = gameSaveMode === "load";
  list.replaceChildren(...getGameSaveSlots().map((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `game-save-slot${slot.empty ? " empty" : ""}`;
    button.disabled = loading && slot.empty;
    const day = slot.empty ? 2 : slot.day;
    const time = slot.empty ? scene.time : (slot.sceneTime || "--:--");
    const title = slot.empty ? "빈 저장 슬롯" : `DAY ${slot.day} · ${slot.sceneTitle}`;
    const stats = slot.empty ? (loading ? "불러올 저장 데이터가 없습니다." : "현재 진행을 이 슬롯에 새로 저장합니다.") : `업무력 ${slot.work} · 호감도 ${slot.affection} · 신뢰도 ${slot.trust}`;
    const command = loading ? (slot.empty ? "빈 슬롯" : "불러오기") : (slot.empty ? "새로 저장" : "덮어쓰기");
    button.innerHTML = `<span class="game-save-thumbnail${slot.empty ? " empty" : ""}"><b>${slot.empty ? "SLOT" : "DAY"} <em>${slot.empty ? String(slot.slotId).padStart(2, "0") : day}</em></b><small>${slot.empty ? "EMPTY" : time}</small></span><span class="game-save-body"><small>SLOT ${String(slot.slotId).padStart(2, "0")} · ${slot.empty ? "EMPTY SLOT" : "SAVED PROGRESS"}</small><strong>${title}</strong><span>${stats}</span><time>${slot.empty ? "저장 데이터 없음" : formatGameSavedAt(slot.savedAt)}</time></span><span class="game-save-command">${command} <b>›</b></span>`;
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
  saveProgress();
  const scene = scenes[state.index] || scenes[0];
  const saved = GameProgress.load(localStorage);
  localStorage.setItem(`nan-save-slot-${slotId}`, JSON.stringify({
    slotId, day: 2, sceneTitle: "이상한 익숙함", sceneTime: scene.time,
    savedAt: saved.savedAt, resumeUrl: "day2.html",
    work: state.work, affection: state.affection, trust: state.trust,
    lastDialogue: { speaker: scene.speaker, text: scene.dynamic ? resolveDynamic(scene.dynamic) : scene.text },
    thumbnail: "assets/image/office-background.png", progress: saved,
    day1Save: localStorage.getItem("nan-day1-save") ? JSON.parse(localStorage.getItem("nan-day1-save")) : null,
  }));
  toast(`SLOT ${String(slotId).padStart(2, "0")}에 저장했습니다.`);
  closeGameSave();
}

function loadFromGameSlot(slot) {
  if (slot.empty || !slot.progress) return;
  if (!confirm(`SLOT ${String(slot.slotId).padStart(2, "0")}의 진행을 불러올까요?\n현재 저장하지 않은 진행은 사라집니다.`)) return;
  localStorage.setItem(GameProgress.STORAGE_KEY, JSON.stringify(slot.progress));
  if (slot.day1Save) localStorage.setItem(GameProgress.LEGACY_DAY1_KEY, JSON.stringify(slot.day1Save));
  else localStorage.removeItem(GameProgress.LEGACY_DAY1_KEY);
  location.href = slot.resumeUrl || (Number(slot.day) === 2 ? "day2.html" : "game.html");
}

function saveProgress({ announce = false } = {}) {
  progress.shared.work = state.work;
  progress.shared.affection = state.affection;
  progress.shared.trust = state.trust;
  progress.shared.clues = state.clues.slice();
  progress.days[2] = {
    sceneId: scenes[state.index]?.id || "day2IntroCard",
    decisions: { ...state.decisions },
    seenNotifications: { ...state.seenNotifications },
    summariesSeen: { ...state.summariesSeen },
    minigameResult: state.minigameResult,
    complete: scenes[state.index]?.end === true,
  };
  progress.currentDay = 2;
  GameProgress.save(localStorage, progress);
  if (announce) toast("DAY 2 진행 상황을 저장했습니다.");
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
  const text = typeof clue === "string" ? clue : clue?.text;
  if (!text || state.clues.includes(text)) return;
  state.clues.push(text);
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
  const day1Count = progress.day2StartSnapshot?.clues?.length || 0;
  ClueMindmap.render(list, {
    clues: state.clues,
    currentDay: 2,
    dayForIndex: (index) => index < day1Count ? 1 : 2,
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

function roomForSender(sender) {
  if (sender.includes("서하린")) return "harin";
  if (sender.includes("박태식")) return "pt";
  if (sender.includes("강민재")) return "minjae";
  if (sender.includes("윤세아")) return "sea";
  return null;
}

function workAlertMessages() {
  if (!state.minigameResult || !isAtOrAfter("day2RequestResult")) return [];
  return state.minigameResult.results
    .map((result, index) => ({ result, room: roomForSender(result.sender), index }))
    .filter((entry) => entry.room)
    .slice(0, 8)
    .map(({ result, room, index }) => ({
      id: `work-alert-${result.id}`,
      room,
      sender: result.sender,
      text: result.outcome === "correct" ? result.response : result.outcome === "missed" ? `${result.request} · 응답하지 못함` : `${result.request} · 다른 행동으로 처리`,
      day: 2,
      time: `10:${String(39 + index).padStart(2, "0")}`,
    }));
}

const MESSAGE_DAY_NAMES = Object.freeze(["", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);

function messageDay(message, fallbackDay = 2) {
  const explicitDay = Number(message.day);
  if (explicitDay >= 1 && explicitDay <= 5) return explicitDay;
  const embeddedDay = String(message.time || "").match(/DAY\s*([1-5])/i);
  return embeddedDay ? Number(embeddedDay[1]) : fallbackDay;
}

function messageClock(message) {
  return String(message.time || "").replace(/^DAY\s*[1-5]\s*·\s*/i, "");
}

function messageDayDivider(day) {
  return `<div class="date-divider message-day-divider"><span>DAY ${day} · ${MESSAGE_DAY_NAMES[day]}</span></div>`;
}

function visibleMessages(room) {
  const storyMessages = Day2Story.MESSAGES.filter((message) => message.room === room && isAtOrAfter(message.at));
  return [...storyMessages, ...workAlertMessages().filter((message) => message.room === room)];
}

function renderMessages() {
  const allRooms = Object.keys(Day2Story.ROOMS);
  const visibleRooms = allRooms.filter((room) => visibleMessages(room).length);
  $("#chat-list-empty").hidden = visibleRooms.length > 0;
  allRooms.forEach((room) => {
    const button = $(`#chat-${room}`);
    const messages = visibleMessages(room);
    button.hidden = messages.length === 0;
    if (!messages.length) return;
    const latest = messages.at(-1);
    button.querySelector(".chat-copy small").textContent = `${latest.sender}: ${latest.text}`;
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
    return `${divider}<article class="message" data-message-day="${day}"><b>${escapeHtml(message.sender)}</b><p>${escapeHtml(message.text)}</p><small>${escapeHtml(messageClock(message))}</small></article>`;
  }).join("");
  box.scrollTop = box.scrollHeight;
}

function openChat(room) {
  currentRoom = room;
  const info = Day2Story.ROOMS[room];
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
  const message = Day2Story.MESSAGES.find((entry) => entry.id === id);
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
  const count = Object.keys(Day2Story.ROOMS).reduce((sum, room) => sum + unreadCount(room), 0);
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
  if (room) toast(`${Day2Story.ROOMS[room].title.replace(/^# /, "")}에 새 메시지가 도착했습니다.`);
  window.setTimeout(() => refs.messenger.classList.remove("message-arrived"), 1900);
  renderMessages();
}

function resolveDynamic(name) {
  const evening = state.day1.eveningTrust;
  const subtask = state.decisions.day2Subtask || "competitor";
  const grade = state.minigameResult?.grade || "good";
  const manualNana = state.day1.nanaUse !== "auto-summary";
  const coffeeHigh = state.day1.coffeeResult?.grade === "perfect" || state.day1.coffeeResult?.correctDrinks === 3;
  const values = {
    introHarin: {
      "accept-help": "어제는 든든하다더니 오늘은 저보다 먼저 왔네요.",
      "prove-self": "도움받는다고 도윤 씨 일이 사라지는 건 아니라는 말, 생각해 봤어요?",
      "neighbor-joke": "회사에서는 이웃보다 사수가 먼저예요. 지각하지 않은 건 칭찬해 줄게요.",
      "work-alone": "오늘도 혼자 하겠다고 하면 오전 일정 전부 제 자리에서 진행할 겁니다.",
    }[evening] || "오늘은 숫자부터 같이 봐요. 혼자 끝내겠다는 말은 잠깐 보류하고요.",
    introDoyun: {
      "accept-help": "같이 보려면 준비는 해둬야 하니까요.",
      "prove-self": "적어도 오늘은 확인받는 걸 피하지 않겠습니다.",
      "neighbor-joke": "사수와 이웃을 구분하는 기준이 지각입니까?",
      "work-alone": "그건 사실상 선택권이 없는 것 아닙니까?",
    }[evening] || "알겠습니다. 오늘은 같이 확인하겠습니다.",
    subtaskSelected: `${Day2Story.SUBTASKS[subtask].title}부터 해보자. 숫자와는 다른 방식으로 신규 유저의 첫 경험을 볼 수 있을 것 같다.`,
    workAlertResult: grade === "perfect" ? "생각보다 잘하네요. 제 요청도 안 놓쳤고." : grade === "good" ? "급한 건 다 처리했어요. 잡담에 너무 성실하게 답한 것만 빼면요." : "도윤 씨, 보안 교육을 스팸으로 보내면 인사팀에서 직접 찾아와요.",
    workAlertReply: grade === "perfect" ? "선배 메시지만 따로 표시가 눈에 띄었습니다." : grade === "good" ? "점심 메시지도 중요한 의사결정이라고 민재가 주장했습니다." : "제목이 너무 광고 같았습니다.",
    lunchBranchMinjae: {
      competitor: "신규 유저 경험이면 내가 하던 게임도 봐봐. 튜토리얼은 짧은데 첫 보스가 너무 세서 절반이 거기서 접었어.",
      reviews: "리뷰 읽다 보면 상처 안 받아?",
      journey: "첫 10분이면 로그인 보상 창 닫다가 절반 가겠네.",
    }[subtask],
    lunchBranchDoyun: {
      competitor: "좋은 예시인지 나쁜 예시인지 모르겠습니다.",
      reviews: "제가 만든 게임은 아니니까 아직은 괜찮습니다.",
      journey: "과장 아닙니까?",
    }[subtask],
    nanaLead: manualNana ? "재현 절차의 표현만 간결하게 정리할까요?" : "재현 결과를 한 문장으로 요약했습니다. ‘사용자 안내 경험을 개선할 기회가 발견되었습니다.’",
    nanaDoyun: manualNana ? "원문 단계는 유지하고 문장만 다듬어 줘." : "버그가 재현됐다는 말이 사라졌는데요.",
    nanaHarin: manualNana ? "어제보다 사용법이 확실해졌네요." : "그래서 오늘은 원문 단계를 먼저 적고 요약은 마지막에 써요.",
    coffeeHarin: coffeeHigh ? "첫날 주문은 정확히 기억하네요." : "이번에는 맞았어요. 첫날보다 발전했네요.",
    coffeeDoyun: coffeeHigh ? "다시 만들 일은 없었으니까요." : "아직도 기억하고 계셨습니까?",
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
    image.className = `character character-${entry.id} visible ${entry.id === active ? "speaking" : "listening"}`;
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
    if (!Day2Story.isVisible(scene, state.decisions)) continue;
    if (scene.placeholder && scene.placeholder !== "inherit") return scene.placeholder;
    if (scene.bg) return null;
  }
  return null;
}

function inheritedSceneValue(index, key) {
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const candidate = scenes[cursor];
    if (!Day2Story.isVisible(candidate, state.decisions)) continue;
    if (candidate[key]) return candidate[key];
  }
  return null;
}

function renderVisuals(scene) {
  const backgroundMap = { office: "day1-office.png" };
  const effectiveBg = inheritedSceneValue(state.index, "bg");
  const placeholder = scene.placeholder === "inherit" ? inheritedPlaceholder(state.index) : scene.placeholder;
  refs.scenePlaceholder.classList.toggle("show", Boolean(placeholder));
  refs.scenePlaceholder.setAttribute("aria-hidden", String(!placeholder));
  refs.stage.classList.toggle("stage-placeholder-active", Boolean(placeholder));
  if (placeholder) {
    refs.placeholderTitle.textContent = placeholder.title;
    refs.placeholderDetail.textContent = placeholder.detail;
    refs.stage.style.backgroundImage = "none";
  } else if (effectiveBg && backgroundMap[effectiveBg]) {
    refs.stage.style.backgroundImage = `url('${ASSET}backgrounds/${backgroundMap[effectiveBg]}')`;
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
  if (scene.systemPanel) {
    refs.systemPanelTitle.textContent = scene.systemPanel.title;
    refs.systemPanelRows.innerHTML = scene.systemPanel.rows.map((row) => `<p>${escapeHtml(row)}</p>`).join("");
  }
}

function nextVisibleIndex(fromIndex) {
  let index = Math.min(fromIndex, scenes.length - 1);
  while (index < scenes.length - 1 && !Day2Story.isVisible(scenes[index], state.decisions)) index += 1;
  return index;
}

function addStageChoice(choice, key, scene) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = choice.text;
  button.addEventListener("click", () => choose(choice, key, scene));
  refs.stageChoices.appendChild(button);
}

function choose(choice, key, scene) {
  const before = { work: state.work, affection: state.affection, trust: state.trust };
  Object.entries(choice.delta || {}).forEach(([stat, delta]) => { state[stat] += delta; });
  state.decisions[key] = choice.value || choice.text;
  refs.dialogue.textContent = `서하린: “${choice.reply}”`;
  refs.stageChoices.innerHTML = "";
  refs.stageChoices.classList.remove("show");
  refs.stage.classList.remove("choice-mode");
  refs.next.disabled = false;
  syncStats();
  showChoiceResult(choice, before, scene.relationshipChoice);
  saveProgress();
}

function showChoiceResult(choice, before, relationshipChoice) {
  const entries = Object.entries(choice.delta || {}).filter(([, delta]) => delta !== 0);
  if (!entries.length) return;
  const names = { work: "업무력", affection: "호감도", trust: "신뢰도" };
  const icons = { work: "◆", affection: "♡", trust: "◇" };
  $("#choice-result-title").textContent = relationshipChoice ? "서하린과의 관계가 변했습니다" : "선택이 능력치에 반영되었습니다";
  $("#choice-result-list").innerHTML = entries.map(([stat, delta]) => `<article class="${delta > 0 ? "gain" : "loss"}"><i>${icons[stat]}</i><div><span>${names[stat]}</span><small>${before[stat]} → ${state[stat]}</small></div><strong>${delta > 0 ? "+" : ""}${delta}</strong></article>`).join("");
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
  state.minigameResult = result;
  state.work += result.workDelta;
  if (result.grade === "perfect") state.trust += 1;
  if (result.grade === "perfect" && result.harinHandled) state.affection += 1;
  state.index = nextVisibleIndex(state.index + 1);
  syncStats();
  saveProgress();
  playBgm("daily");
  render();
}

function startWorkAlert() {
  const commonRequests = WorkAlertMinigame.core.REQUESTS.slice(0, 13);
  const subtaskRequests = WorkAlertMinigame.core.SUBTASK_REQUESTS[state.decisions.day2Subtask || "competitor"];
  const requests = [...commonRequests, ...subtaskRequests];
  WorkAlertMinigame.start({
    seed: 20260720,
    duration: 45,
    count: requests.length,
    requests,
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
  const snapshot = progress.day2StartSnapshot || { work: 0, affection: 0, trust: 0, clues: [] };
  const deltas = {
    work: state.work - snapshot.work,
    affection: state.affection - snapshot.affection,
    trust: state.trust - snapshot.trust,
  };
  const grade = deltas.work >= 4 ? "EXCELLENT" : deltas.work >= 1 ? "GOOD" : "NEEDS CARE";
  refs.daySummaryGrade.textContent = grade;
  const subtask = Day2Story.SUBTASKS[state.decisions.day2Subtask || "competitor"];
  const tasks = [
    "DAY 1 조사 수치 교차 확인",
    subtask.title,
    `쏟아지는 사내 요청 처리 · ${state.minigameResult?.grade?.toUpperCase() || "완료"}`,
    "오후 빌드 점검 지원",
    "조사 결과와 근거 링크 정리",
  ];
  refs.daySummaryWork.innerHTML = tasks.map((task, index) => summaryRow(index === 2 ? "✉" : "✓", task, index === 1 ? subtask.summary : "오늘 업무 완료")).join("");
  refs.daySummaryStats.innerHTML = [
    ["◆", "업무력", deltas.work, "조사·선택·미니게임 결과"],
    ["♡", "호감도", deltas.affection, "DAY 2 대화와 요청 처리"],
    ["◇", "신뢰도", deltas.trust, "협업 태도와 업무 분담"],
  ].map(([icon, name, value, detail]) => summaryRow(icon, name, detail, `${value >= 0 ? "+" : ""}${value}`)).join("");
  const dailyClues = state.clues.slice(snapshot.clues.length);
  refs.daySummaryRecords.innerHTML = dailyClues.slice(-5).map((clue) => summaryRow("◆", clue.split(" — ")[0], clue.includes(" — ") ? clue.split(" — ").slice(1).join(" — ") : "단서 탭에 기록됨")).join("") || summaryRow("◇", "새 기록 없음", "단서 탭을 확인해 주세요.");
  const beforeRelationship = relationshipName(snapshot.affection, snapshot.trust);
  const afterRelationship = relationshipName(state.affection, state.trust);
  refs.daySummaryReactions.innerHTML = `<blockquote><b>박태식 부장</b><p>“숫자만 보지 않고 실제 플레이와 유저 반응까지 본 건 좋아. 근거 링크는 그대로 유지해.”</p></blockquote><article class="relationship-result"><small>RELATIONSHIP</small><p><b>서하린</b><em>:</em><strong>${escapeHtml(beforeRelationship)}</strong><i>→</i><strong>${escapeHtml(afterRelationship)}</strong><span>— 여러 종류의 업무를 함께 처리하며 서로의 방식에 익숙해졌습니다.</span></p></article>`;
  refs.daySummary.classList.add("show");
  refs.daySummary.setAttribute("aria-hidden", "false");
  refs.next.disabled = true;
  window.setTimeout(() => refs.daySummaryExit.focus(), 50);
}

function closeDaySummary() {
  state.summariesSeen[2] = true;
  refs.daySummary.classList.remove("show");
  refs.daySummary.setAttribute("aria-hidden", "true");
  state.index = nextVisibleIndex(state.index + 1);
  saveProgress();
  render();
}

function render() {
  state.index = nextVisibleIndex(state.index);
  const scene = scenes[state.index] || scenes[0];
  const effectiveBgm = inheritedSceneValue(state.index, "bgm");
  if (scene.daySummary && state.summariesSeen[2]) {
    state.index = nextVisibleIndex(state.index + 1);
    render();
    return;
  }
  refs.clock.textContent = scene.time;
  refs.speaker.textContent = scene.speaker;
  refs.dialogue.textContent = scene.dynamic ? resolveDynamic(scene.dynamic) : scene.text;
  refs.next.disabled = false;
  refs.next.textContent = scene.end ? "타이틀로　›" : "다음　›";
  $("#scene-label").textContent = scene.location || (Number(scene.time.split(":")[0]) >= 12 ? "게임사업실 · 오후" : "게임사업실 · 오전");
  renderVisuals(scene);
  renderCharacters(scene);
  if (effectiveBgm) playBgm(effectiveBgm);
  if (scene.clue) addClue(scene.clue);
  if (scene.notification) notifyMessage(scene.notification);
  renderMessages();
  refs.stageChoices.innerHTML = "";
  refs.stageChoices.classList.remove("show");
  refs.stage.classList.remove("choice-mode");
  const choiceKey = scene.choiceKey || scene.id;
  if (scene.choices && !state.decisions[choiceKey]) {
    scene.choices.forEach((choice) => addStageChoice(choice, choiceKey, scene));
    refs.stageChoices.classList.add("show");
    refs.stage.classList.add("choice-mode");
    refs.next.disabled = true;
  }
  syncStats();
  saveProgress();
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
    || !!document.querySelector(".work-alert-minigame:not([hidden])");
}

function next() {
  if (sceneTransitionLocked || hasBlockingUi()) return;
  sceneTransitionLocked = true;
  refs.next.disabled = true;
  const scene = scenes[state.index];
  if (scene.end) {
    progress.days[2].complete = true;
    saveProgress();
    refs.dayComplete.classList.add("show");
    refs.dayComplete.setAttribute("aria-hidden", "false");
    refs.next.disabled = true;
    window.setTimeout(() => refs.dayCompleteMenu.focus(), 50);
    sceneTransitionLocked = false;
    return;
  }
  state.index = nextVisibleIndex(state.index + 1);
  saveProgress();
  render();
  sceneTransitionLocked = false;
}

document.querySelectorAll(".tabs button").forEach((button) => { button.onclick = () => setTab(button.dataset.tab); });
document.querySelectorAll(".chat-item").forEach((button) => { button.onclick = () => openChat(button.dataset.room); });
$("#chat-back").onclick = closeChat;
refs.next.onclick = next;
refs.daySummaryExit.onclick = closeDaySummary;
refs.dayCompleteMenu.onclick = () => { location.href = "index.html"; };
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
document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });

renderClues();
renderMessages();
syncStats();
render();
