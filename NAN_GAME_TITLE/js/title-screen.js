const menuButtons = [...document.querySelectorAll(".menu-button")];
const overlay = document.querySelector(".start-overlay");
const savePanel = document.querySelector(".save-panel");
const saveSlots = document.querySelector(".save-slots");
const recordsPanel = document.querySelector(".records-panel");
const recordsGrid = document.querySelector("#records-grid");
const recordsCount = document.querySelector("#records-count");
const cgViewer = document.querySelector("#cg-viewer");
const cgViewerImage = document.querySelector("#cg-viewer-image");
const cgViewerDay = document.querySelector("#cg-viewer-day");
const cgViewerTitle = document.querySelector("#cg-viewer-title");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsForm = document.querySelector("#settings-form");
const settingsStatus = document.querySelector("#settings-status");
const titleBgm = document.querySelector("#title-bgm");
const titleSoundPrompt = document.querySelector("#title-sound-prompt");
const pageTurnSfx = new Audio("assets/audio/page-turn.wav");
pageTurnSfx.preload = "auto";
let activeIndex = 0;
let lastFocusedElement = null;
let settings = GameSettings.load(window.localStorage);
// 타이틀은 첫 사용자 입력에서 즉시 play()가 호출되도록 기본 audio 요소를 사용합니다.
// Web Audio의 비동기 디코딩은 브라우저의 자동 재생 허용 시점을 놓칠 수 있습니다.
const bgmManager = new GameBgmManager(titleBgm, getConfiguredBgmVolume, { preferHtmlAudio: true });
window.BGMManager = bgmManager;
let titleBgmPromise = null;

function setActiveMenu(index) {
  activeIndex = (index + menuButtons.length) % menuButtons.length;
  menuButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === activeIndex);
  });
}

function setStatus(message, isError = false) {
  settingsStatus.textContent = message;
  settingsStatus.classList.toggle("error", isError);
}

function updateOutput(name, value) {
  const input = settingsForm.elements[name];
  if (!input || typeof input.closest !== "function") return;
  const output = input.closest("label")?.querySelector("output");
  if (!output) return;
  output.value = name === "autoDelay" ? `${Number(value).toFixed(1)}초` : `${value}%`;
}

function updateVolumeButtons() {
  document.querySelectorAll(".volume-button").forEach((button) => {
    const volume = settings[button.dataset.volume];
    const muted = settings[button.dataset.mute];
    const state = muted || volume === 0 ? "muted" : volume <= 50 ? "low" : "high";
    button.classList.remove("is-muted", "is-low", "is-high");
    button.classList.add(`is-${state}`);
    button.setAttribute("aria-pressed", String(muted));
    button.setAttribute("aria-label", `${button.dataset.volume === "masterVolume" ? "전체" : button.dataset.volume === "bgmVolume" ? "BGM" : "효과음"} 음량 ${muted ? "음소거 해제" : "음소거"}`);
  });
}

function applySettings() {
  document.documentElement.style.setProperty("--dialogue-text-scale", settings.textSize / 100);
  document.documentElement.style.setProperty("--dialogue-opacity", settings.dialogueOpacity / 100);
  document.documentElement.classList.toggle("reduce-effects", settings.reduceEffects);
  document.documentElement.dataset.dialogueMode = settings.dialogueMode;
  document.documentElement.dataset.textSpeed = settings.textSpeed;
  document.documentElement.dataset.masterMuted = String(settings.masterMuted);
  document.documentElement.dataset.bgmMuted = String(settings.bgmMuted);
  document.documentElement.dataset.sfxMuted = String(settings.sfxMuted);
  document.documentElement.style.setProperty("--master-volume", settings.masterMuted ? 0 : settings.masterVolume / 100);
  document.documentElement.style.setProperty("--bgm-volume", settings.bgmMuted ? 0 : settings.bgmVolume / 100);
  document.documentElement.style.setProperty("--sfx-volume", settings.sfxMuted ? 0 : settings.sfxVolume / 100);
  bgmManager.setVolume();
  updateVolumeButtons();
}

function getConfiguredBgmVolume() {
  const masterVolume = settings.masterMuted ? 0 : settings.masterVolume / 100;
  const bgmVolume = settings.bgmMuted ? 0 : settings.bgmVolume / 100;
  return Math.min(1, Math.max(0, masterVolume * bgmVolume));
}

async function startTitleBgm() {
  if (!titleBgmPromise) {
    titleBgmPromise = bgmManager.play("title", { fadeIn: 300 }).finally(() => {
      if (bgmManager.currentScene !== "title") titleBgmPromise = null;
    });
  }
  const played = await titleBgmPromise;
  titleSoundPrompt.classList.toggle("hidden", played || getConfiguredBgmVolume() === 0);
  return played;
}

async function unlockAndStartTitleBgm() {
  // 사용자 입력이 유효한 바로 그 순간 AudioContext를 먼저 해제합니다.
  // 곡 디코딩을 기다린 뒤 resume하면 브라우저의 자동 재생 허용 시점을 놓칠 수 있습니다.
  const resumed = await bgmManager.resume();
  const played = resumed || await startTitleBgm();
  titleSoundPrompt.classList.toggle("hidden", played || getConfiguredBgmVolume() === 0);
}

function populateSettingsForm() {
  Object.entries(settings).forEach(([name, value]) => {
    const control = settingsForm.elements[name];
    if (!control) return;
    if (control instanceof RadioNodeList) control.value = value;
    else if (control.type === "checkbox") control.checked = value;
    else control.value = value;
    updateOutput(name, value);
  });
}

function readSettingsForm() {
  const values = Object.fromEntries(new FormData(settingsForm));
  settingsForm.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    values[input.name] = input.checked;
  });
  return GameSettings.sanitize({ ...settings, ...values });
}

async function applyScreenMode(mode) {
  try {
    if (mode === "fullscreen" && !document.fullscreenElement) await document.documentElement.requestFullscreen();
    if (mode === "windowed" && document.fullscreenElement) await document.exitFullscreen();
  } catch (_error) {
    settings.screenMode = document.fullscreenElement ? "fullscreen" : "windowed";
    populateSettingsForm();
    setStatus("브라우저에서 화면 모드 변경을 허용하지 않았습니다.", true);
  }
}

function persistSettings() {
  settings = readSettingsForm();
  applySettings();
  const saved = GameSettings.save(window.localStorage, settings);
  setStatus(saved ? "변경 사항을 저장했습니다." : "이 브라우저에서는 설정을 저장할 수 없습니다.", !saved);
}

function openSettings() {
  lastFocusedElement = document.activeElement;
  populateSettingsForm();
  setStatus("변경 사항은 자동으로 저장됩니다.");
  settingsDialog.showModal();
  settingsDialog.querySelector("input, select, button")?.focus();
}

function closeSettings() {
  settingsDialog.close();
  lastFocusedElement?.focus();
}

function runActiveMenu() {
  const action = menuButtons[activeIndex].dataset.action;
  if (action === "settings") {
    openSettings();
    return;
  }
  if (action === "new-game") {
    GameProgress.startNewGame(window.localStorage);
    bgmManager.stop({ fadeOut: 220 });
    pageTurnSfx.currentTime = 0;
    pageTurnSfx.volume = settings.sfxMuted ? 0 : (settings.masterMuted ? 0 : settings.masterVolume / 100) * (settings.sfxVolume / 100);
    pageTurnSfx.play().catch(() => {});
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      window.location.href = "game.html?new=1";
    }, 2200);
    return;
  }
  if (action === "continue") {
    openSavePanel();
    return;
  }
  if (action === "records") {
    openRecordsPanel();
    return;
  }

}

function getSaveSlots() {
  const manualSlots = Array.from({ length: 5 }, (_, index) => {
    const slotId = index + 1;
    const rawData = localStorage.getItem(`nan-save-slot-${slotId}`);
    if (!rawData) return { slotId, empty: true };

    try {
      return { slotId, empty: false, ...JSON.parse(rawData) };
    } catch {
      return { slotId, empty: true };
    }
  });
  return manualSlots;
}

function formatSavedAt(savedAt) {
  if (!savedAt) return "저장 시간 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(savedAt));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSaveSlots() {
  const slots = getSaveSlots();
  const savedSlots = slots.filter((slot) => !slot.empty);
  const latestSavedAt = savedSlots
    .map((slot) => slot.savedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  saveSlots.replaceChildren(...slots.map((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "save-slot";

    if (slot.empty) {
      button.disabled = true;
      button.innerHTML = `
        <span class="slot-thumbnail empty"></span>
        <span class="slot-body">
          <span class="slot-number">SLOT ${String(slot.slotId).padStart(2, "0")}</span>
          <strong class="slot-title">저장 데이터 없음</strong>
          <span class="slot-dialogue">새 게임을 시작한 뒤 저장할 수 있습니다.</span>
          <span class="slot-meta">EMPTY SLOT</span>
        </span>`;
      return button;
    }

    const dialogue = slot.lastDialogue
      ? `${escapeHtml(slot.lastDialogue.speaker)}: “${escapeHtml(slot.lastDialogue.text)}”`
      : "저장된 대화 내용이 없습니다.";
    const thumbnail = escapeHtml(slot.thumbnail || "assets/image/office-background.png");
    button.innerHTML = `
      <span class="slot-thumbnail"><img src="${thumbnail}" alt="SLOT ${slot.slotId} 저장 장면" /></span>
      <span class="slot-body">
        <span class="slot-number">SLOT ${String(slot.slotId).padStart(2, "0")}</span>
        <strong class="slot-title">DAY ${escapeHtml(slot.day ?? "-")} · ${escapeHtml(slot.sceneTitle ?? "저장된 장면")}</strong>
        <span class="slot-dialogue">${dialogue}</span>
        <span class="slot-meta">${formatSavedAt(slot.savedAt)}</span>
      </span>
      ${slot.savedAt === latestSavedAt ? '<span class="latest-badge">최근 플레이</span>' : ""}`;
    button.addEventListener("click", () => {
      if (slot.progress) localStorage.setItem(GameProgress.STORAGE_KEY, JSON.stringify(slot.progress));
      if (slot.day1Save) localStorage.setItem(GameProgress.LEGACY_DAY1_KEY, JSON.stringify(slot.day1Save));
      else localStorage.removeItem(GameProgress.LEGACY_DAY1_KEY);
      closeSavePanel();
      window.location.href = slot.resumeUrl || (Number(slot.day) === 2 ? "day2.html" : "game.html");
    });
    return button;
  }));
}

function openSavePanel() {
  renderSaveSlots();
  savePanel.classList.add("open");
  savePanel.setAttribute("aria-hidden", "false");
  document.querySelector(".close-save-panel").focus();
}

function closeSavePanel() {
  savePanel.classList.remove("open");
  savePanel.setAttribute("aria-hidden", "true");
  menuButtons[activeIndex].focus();
}

function getCgArchive() {
  const legacy = { id: "day1-harin-convenience-cg-v2.png", day: "DAY 1 · 20:18", title: "퇴근 후, 뜻밖의 이웃", image: "assets/CG/day1-harin-convenience-cg-v2.png" };
  try {
    const saved = JSON.parse(localStorage.getItem("nan-unlocked-cgs-v1")) || [];
    return saved.map((entry) => typeof entry === "string" ? legacy : entry).filter((entry) => entry?.id && entry?.image);
  } catch { return []; }
}

function openCgViewer(entry) {
  cgViewerImage.src = entry.image;
  cgViewerImage.alt = entry.title;
  cgViewerDay.textContent = entry.day;
  cgViewerTitle.textContent = entry.title;
  cgViewer.classList.add("open");
  cgViewer.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("cg-viewer-active");
  document.querySelector(".cg-viewer-close").focus();
}

function closeCgViewer() {
  cgViewer.classList.remove("open");
  cgViewer.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("cg-viewer-active");
  recordsGrid.querySelector("button:not(:disabled)")?.focus();
}

function renderRecords() {
  const archive = getCgArchive();
  recordsCount.textContent = String(archive.length);
  if (!archive.length) {
    recordsGrid.innerHTML = '<div class="records-empty"><span>NO MEMORY</span><strong>아직 기록된 CG가 없습니다</strong><p>게임에서 특별한 장면을 감상하면 이곳에 자동으로 전시됩니다.</p></div>';
    return;
  }
  recordsGrid.replaceChildren(...archive.map((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "record-card unlocked";
    button.innerHTML = `<span class="record-image"><img src="${escapeHtml(entry.image)}" alt="" /></span><span class="record-copy"><small>${escapeHtml(entry.day || "SPECIAL CG")}</small><strong>${escapeHtml(entry.title || "기록된 장면")}</strong></span><span class="record-number">CG ${String(index + 1).padStart(2, "0")}</span>`;
    button.addEventListener("click", () => openCgViewer(entry));
    return button;
  }));
}

function openRecordsPanel() {
  renderRecords();
  recordsPanel.classList.add("open");
  recordsPanel.setAttribute("aria-hidden", "false");
  document.querySelector(".close-records-panel").focus();
}

function closeRecordsPanel() {
  recordsPanel.classList.remove("open");
  recordsPanel.setAttribute("aria-hidden", "true");
  menuButtons[activeIndex].focus();
}

menuButtons.forEach((button, index) => {
  button.addEventListener("mouseenter", () => setActiveMenu(index));
  button.addEventListener("focus", () => setActiveMenu(index));
  button.addEventListener("click", runActiveMenu);
});

settingsForm.addEventListener("input", (event) => {
  persistSettings();
  updateOutput(event.target.name, event.target.value);
});

document.querySelectorAll(".volume-button").forEach((button) => {
  button.addEventListener("click", () => {
    const muteName = button.dataset.mute;
    const volumeName = button.dataset.volume;
    settings[muteName] = !settings[muteName];
    if (!settings[muteName] && settings[volumeName] === 0) {
      settings[volumeName] = 50;
      settingsForm.elements[volumeName].value = 50;
      updateOutput(volumeName, 50);
    }
    applySettings();
    const saved = GameSettings.save(window.localStorage, settings);
    setStatus(saved ? "변경 사항을 저장했습니다." : "이 브라우저에서는 설정을 저장할 수 없습니다.", !saved);
  });
});

settingsForm.elements.screenMode.addEventListener("change", (event) => applyScreenMode(event.target.value));
document.querySelectorAll("[data-settings-close]").forEach((button) => button.addEventListener("click", closeSettings));
document.querySelector("#reset-settings").addEventListener("click", () => {
  settings = { ...GameSettings.DEFAULTS };
  populateSettingsForm();
  applySettings();
  const saved = GameSettings.save(window.localStorage, settings);
  setStatus(saved ? "모든 설정을 기본값으로 복원했습니다." : "기본값은 적용했지만 저장할 수 없습니다.", !saved);
  applyScreenMode(settings.screenMode);
});

settingsDialog.addEventListener("click", (event) => {
  if (event.target === settingsDialog) closeSettings();
});

document.addEventListener("fullscreenchange", () => {
  settings.screenMode = document.fullscreenElement ? "fullscreen" : "windowed";
  populateSettingsForm();
  GameSettings.save(window.localStorage, settings);
});

document.addEventListener("keydown", (event) => {
  if (cgViewer.classList.contains("open")) {
    if (event.key === "Escape") closeCgViewer();
    return;
  }
  if (recordsPanel.classList.contains("open")) {
    if (event.key === "Escape") closeRecordsPanel();
    return;
  }
  if (savePanel.classList.contains("open")) {
    if (event.key === "Escape") closeSavePanel();
    return;
  }
  if (settingsDialog.open) return;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") setActiveMenu(activeIndex + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") setActiveMenu(activeIndex - 1);
  if (event.key === "Enter") runActiveMenu();
});

document.querySelector(".close-save-panel").addEventListener("click", closeSavePanel);
document.querySelector(".close-records-panel").addEventListener("click", closeRecordsPanel);
document.querySelector(".cg-viewer-close").addEventListener("click", closeCgViewer);
savePanel.addEventListener("click", (event) => {
  if (event.target === savePanel) closeSavePanel();
});
recordsPanel.addEventListener("click", (event) => {
  if (event.target === recordsPanel) closeRecordsPanel();
});
cgViewer.addEventListener("click", (event) => {
  if (event.target === cgViewer) closeCgViewer();
});

applySettings();
startTitleBgm();
titleSoundPrompt.addEventListener("click", unlockAndStartTitleBgm);
document.addEventListener("pointerdown", unlockAndStartTitleBgm, { once: true });
document.addEventListener("keydown", unlockAndStartTitleBgm, { once: true });
