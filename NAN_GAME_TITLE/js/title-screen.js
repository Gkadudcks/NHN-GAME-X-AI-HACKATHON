const menuButtons = [...document.querySelectorAll(".menu-button")];
const notificationText = document.querySelector("#notification-text");
const notification = document.querySelector(".nana-notification");
const overlay = document.querySelector(".start-overlay");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsForm = document.querySelector("#settings-form");
const settingsStatus = document.querySelector("#settings-status");
let activeIndex = 0;
let lastFocusedElement = null;
let settings = GameSettings.load(window.localStorage);

const messages = {
  continue: "저장된 기록이 없습니다.",
  records: "아직 발견한 단서가 없습니다.",
};

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
  updateVolumeButtons();
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
    notification.hidden = false;
    notificationText.textContent = "서하림 선배: 좋아요. 그 파일 잊지 마세요.";
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
    }, 2200);
    return;
  }
  notification.hidden = false;
  notificationText.textContent = messages[action];
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
  if (settingsDialog.open) return;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") setActiveMenu(activeIndex + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") setActiveMenu(activeIndex - 1);
  if (event.key === "Enter") runActiveMenu();
});

document.querySelector(".close-notification").addEventListener("click", () => {
  notification.hidden = true;
});

applySettings();
