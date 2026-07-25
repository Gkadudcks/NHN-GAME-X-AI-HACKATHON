(function exposeSettingsDialog(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GameSettingsDialog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSettingsDialog(global) {
  "use strict";

  const EVENTS = Object.freeze({
    OPEN: "nan:settings-open",
    CLOSE: "nan:settings-close",
    CHANGE: "nan:settings-change",
  });
  let installed;

  function dispatch(documentRef, type, detail) {
    documentRef.dispatchEvent(new CustomEvent(type, { detail }));
  }

  function effectiveBgmVolume(settings) {
    if (settings.masterMuted || settings.bgmMuted) return 0;
    return Math.min(1, Math.max(0, (settings.masterVolume / 100) * (settings.bgmVolume / 100)));
  }

  function applyDocumentSettings(settings, documentRef) {
    const root = documentRef.documentElement;
    root.style.setProperty("--dialogue-text-scale", settings.textSize / 100);
    root.style.setProperty("--dialogue-opacity", settings.dialogueOpacity / 100);
    root.style.setProperty("--master-volume", settings.masterMuted ? 0 : settings.masterVolume / 100);
    root.style.setProperty("--bgm-volume", settings.bgmMuted ? 0 : settings.bgmVolume / 100);
    root.style.setProperty("--sfx-volume", settings.sfxMuted ? 0 : settings.sfxVolume / 100);
    root.classList.toggle("reduce-effects", settings.reduceEffects);
    root.dataset.dialogueMode = settings.dialogueMode;
    root.dataset.textSpeed = settings.textSpeed;
    root.dataset.masterMuted = String(settings.masterMuted);
    root.dataset.bgmMuted = String(settings.bgmMuted);
    root.dataset.sfxMuted = String(settings.sfxMuted);
  }

  function outputText(name, value) {
    if (name === "autoDelay") return `${Number(value).toFixed(1)}초`;
    if (name === "dialogueOpacity" || name === "textSize" || name.endsWith("Volume")) return `${value}%`;
    return String(value);
  }

  function volumeIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="speaker" d="M4 9v6h4l5 4V5L8 9H4Z"/><path class="wave wave-low" d="M16 9.5a4 4 0 0 1 0 5"/><path class="wave wave-high" d="M18.5 7a7 7 0 0 1 0 10"/><path class="mute-slash" d="m4 4 16 16"/></svg>`;
  }

  function createDialog(documentRef) {
    const dialog = documentRef.createElement("dialog");
    dialog.id = "settings-dialog";
    dialog.className = "settings-dialog";
    dialog.setAttribute("aria-labelledby", "settings-title");
    dialog.innerHTML = `
      <form class="settings-panel" id="settings-form" method="dialog">
        <header class="settings-header">
          <div><p class="settings-eyebrow">SYSTEM PREFERENCES</p><h2 id="settings-title">설정</h2></div>
          <button class="icon-button" type="button" data-settings-close aria-label="설정 닫기">×</button>
        </header>
        <div class="settings-scroll">
          <fieldset class="settings-section">
            <legend>사운드</legend>
            <div class="range-setting volume-setting">
              <button class="volume-button" type="button" data-volume="masterVolume" data-mute="masterMuted" aria-label="전체 음량 음소거" aria-pressed="false">${volumeIcon()}</button>
              <label class="setting-label" for="master-volume"><strong>전체 음량</strong><small>모든 소리의 기준 음량</small></label>
              <label class="range-control" for="master-volume"><input id="master-volume" name="masterVolume" type="range" min="0" max="100" step="5"><output for="master-volume">80%</output></label>
            </div>
            <div class="range-setting volume-setting">
              <button class="volume-button" type="button" data-volume="bgmVolume" data-mute="bgmMuted" aria-label="BGM 음량 음소거" aria-pressed="false">${volumeIcon()}</button>
              <label class="setting-label" for="bgm-volume"><strong>BGM 음량</strong><small>배경 음악 음량</small></label>
              <label class="range-control" for="bgm-volume"><input id="bgm-volume" name="bgmVolume" type="range" min="0" max="100" step="5"><output for="bgm-volume">70%</output></label>
            </div>
            <div class="range-setting volume-setting">
              <button class="volume-button" type="button" data-volume="sfxVolume" data-mute="sfxMuted" aria-label="효과음 음량 음소거" aria-pressed="false">${volumeIcon()}</button>
              <label class="setting-label" for="sfx-volume"><strong>효과음 음량</strong><small>버튼과 연출 효과음</small></label>
              <label class="range-control" for="sfx-volume"><input id="sfx-volume" name="sfxVolume" type="range" min="0" max="100" step="5"><output for="sfx-volume">80%</output></label>
            </div>
          </fieldset>
          <fieldset class="settings-section">
            <legend>화면</legend>
            <label class="select-setting" for="screen-mode">
              <span><strong>화면 모드</strong><small>전체 화면은 브라우저 권한이 필요합니다</small></span>
              <select id="screen-mode" name="screenMode"><option value="windowed">창 모드</option><option value="fullscreen">전체 화면</option></select>
            </label>
            <label class="toggle-setting" for="reduce-effects">
              <span><strong>화면 효과 줄이기</strong><small>화면 흔들림, 깜빡임, 빠른 전환 애니메이션을 최소화합니다</small></span>
              <input id="reduce-effects" name="reduceEffects" type="checkbox" role="switch">
            </label>
          </fieldset>
          <fieldset class="settings-section">
            <legend>대화</legend>
            <p class="settings-deferred-note">자동 진행과 글자 출력 속도는 다음 업데이트에서 지원됩니다.</p>
            <div class="choice-setting settings-deferred">
              <span><strong>진행 방식</strong><small>자동 모드도 선택지에서는 멈춥니다</small></span>
              <div class="segmented-control">
                <input id="dialogue-click" name="dialogueMode" type="radio" value="click" disabled><label for="dialogue-click">클릭</label>
                <input id="dialogue-auto" name="dialogueMode" type="radio" value="auto" disabled><label for="dialogue-auto">자동</label>
              </div>
            </div>
            <div class="choice-setting settings-deferred">
              <span><strong>글자 출력 속도</strong><small>문장이 나타나는 속도</small></span>
              <div class="segmented-control speed-control">
                <input id="text-speed-slow" name="textSpeed" type="radio" value="slow" disabled><label for="text-speed-slow">느림</label>
                <input id="text-speed-normal" name="textSpeed" type="radio" value="normal" disabled><label for="text-speed-normal">중간</label>
                <input id="text-speed-fast" name="textSpeed" type="radio" value="fast" disabled><label for="text-speed-fast">빠름</label>
              </div>
            </div>
            <label class="range-setting settings-deferred" for="auto-delay">
              <span><strong>자동 진행 대기시간</strong><small>문장 출력이 끝난 뒤 기다리는 시간</small></span>
              <span class="range-control"><input id="auto-delay" name="autoDelay" type="range" min="0.5" max="5" step="0.5" disabled><output for="auto-delay">1.5초</output></span>
            </label>
            <label class="range-setting" for="text-size">
              <span><strong>글자 크기</strong><small>대화문과 선택지에 적용됩니다</small></span>
              <span class="range-control"><input id="text-size" name="textSize" type="range" min="90" max="130" step="10"><output for="text-size">100%</output></span>
            </label>
            <label class="range-setting" for="dialogue-opacity">
              <span><strong>대화창 투명도</strong><small>높을수록 배경과 분리되어 잘 보입니다</small></span>
              <span class="range-control"><input id="dialogue-opacity" name="dialogueOpacity" type="range" min="0" max="100" step="5"><output for="dialogue-opacity">90%</output></span>
            </label>
            <label class="toggle-setting" for="skip-read-only">
              <span><strong>읽은 대사만 건너뛰기</strong><small>처음 보는 대사가 실수로 넘어가지 않습니다</small></span>
              <input id="skip-read-only" name="skipReadOnly" type="checkbox" role="switch">
            </label>
            <div class="dialogue-preview" aria-label="대화 설정 미리보기">
              <span class="preview-name">서하린</span>
              <p>괜찮아요. 이번엔 제가 옆에 있을게요.</p>
            </div>
          </fieldset>
        </div>
        <footer class="settings-footer">
          <p id="settings-status" role="status" aria-live="polite">변경 사항은 자동으로 저장됩니다.</p>
          <div><button class="secondary-button" id="reset-settings" type="button">기본값 복원</button><button class="primary-button" type="button" data-settings-close>완료</button></div>
        </footer>
      </form>`;
    documentRef.body.appendChild(dialog);
    return dialog;
  }

  function install(options = {}) {
    if (!global.document || !global.GameSettings) return null;
    if (installed) return installed.api;

    const documentRef = global.document;
    const storage = options.storage || global.localStorage;
    const dialog = createDialog(documentRef);
    const form = dialog.querySelector("#settings-form");
    const status = dialog.querySelector("#settings-status");
    let settings = global.GameSettings.load(storage);
    let lastFocusedElement = null;
    let previouslyOpen = false;

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.classList.toggle("error", isError);
    }

    function updateOutput(name, value) {
      const control = form.elements[name];
      if (!control || typeof control.closest !== "function") return;
      const output = control.closest("label")?.querySelector("output");
      if (output) output.value = outputText(name, value);
    }

    function updateVolumeButtons() {
      dialog.querySelectorAll(".volume-button").forEach((button) => {
        const volume = settings[button.dataset.volume];
        const muted = settings[button.dataset.mute];
        const state = muted || volume === 0 ? "muted" : volume <= 50 ? "low" : "high";
        button.classList.remove("is-muted", "is-low", "is-high");
        button.classList.add(`is-${state}`);
        button.setAttribute("aria-pressed", String(muted));
        const label = button.dataset.volume === "masterVolume" ? "전체" : button.dataset.volume === "bgmVolume" ? "BGM" : "효과음";
        button.setAttribute("aria-label", `${label} 음량 ${muted ? "음소거 해제" : "음소거"}`);
      });
    }

    function populate() {
      Object.entries(settings).forEach(([name, value]) => {
        const control = form.elements[name];
        if (!control) return;
        if (typeof RadioNodeList !== "undefined" && control instanceof RadioNodeList) control.value = value;
        else if (control.type === "checkbox") control.checked = value;
        else control.value = value;
        updateOutput(name, value);
      });
      updateVolumeButtons();
    }

    function apply() {
      applyDocumentSettings(settings, documentRef);
      global.BGMManager?.setVolume?.(effectiveBgmVolume(settings));
      options.onApply?.({ ...settings });
      dispatch(documentRef, EVENTS.CHANGE, { settings: { ...settings } });
    }

    function persist(message = "변경 사항을 저장했습니다.") {
      const values = {};
      [...form.elements].forEach((control) => {
        if (!control.name || control.disabled || (control.type === "radio" && !control.checked)) return;
        values[control.name] = control.type === "checkbox" ? control.checked : control.value;
      });
      settings = global.GameSettings.sanitize({ ...settings, ...values });
      const saved = global.GameSettings.save(storage, settings);
      apply();
      updateVolumeButtons();
      setStatus(saved ? message : "이 브라우저에서는 설정을 저장할 수 없습니다.", !saved);
      return saved;
    }

    async function applyScreenMode() {
      try {
        if (settings.screenMode === "fullscreen" && !documentRef.fullscreenElement) await documentRef.documentElement.requestFullscreen();
        if (settings.screenMode === "windowed" && documentRef.fullscreenElement) await documentRef.exitFullscreen();
      } catch (_error) {
        settings.screenMode = documentRef.fullscreenElement ? "fullscreen" : "windowed";
        global.GameSettings.save(storage, settings);
        populate();
        setStatus("브라우저에서 화면 모드 변경을 허용하지 않았습니다.", true);
      }
    }

    function open() {
      if (dialog.open) return;
      lastFocusedElement = documentRef.activeElement;
      settings = global.GameSettings.load(storage);
      populate();
      setStatus("변경 사항은 자동으로 저장됩니다.");
      dialog.showModal();
      dialog.querySelector("input:not(:disabled), select, button")?.focus();
    }

    function close() {
      if (!dialog.open) return;
      dialog.close();
      lastFocusedElement?.focus?.();
    }

    function observeOpenState() {
      if (dialog.open === previouslyOpen) return;
      previouslyOpen = dialog.open;
      dispatch(documentRef, dialog.open ? EVENTS.OPEN : EVENTS.CLOSE, { settings: { ...settings } });
    }

    const observer = new MutationObserver(observeOpenState);
    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });

    form.addEventListener("input", (event) => {
      persist();
      updateOutput(event.target.name, event.target.value);
    });
    form.addEventListener("change", (event) => {
      if (event.target.name === "screenMode") applyScreenMode();
    });
    dialog.querySelectorAll(".volume-button").forEach((button) => {
      button.addEventListener("click", () => {
        const muteName = button.dataset.mute;
        const volumeName = button.dataset.volume;
        settings[muteName] = !settings[muteName];
        if (!settings[muteName] && settings[volumeName] === 0) {
          settings[volumeName] = 50;
          form.elements[volumeName].value = 50;
          updateOutput(volumeName, 50);
        }
        const saved = global.GameSettings.save(storage, settings);
        apply();
        updateVolumeButtons();
        setStatus(saved ? "변경 사항을 저장했습니다." : "이 브라우저에서는 설정을 저장할 수 없습니다.", !saved);
      });
    });
    dialog.querySelectorAll("[data-settings-close]").forEach((button) => button.addEventListener("click", close));
    dialog.querySelector("#reset-settings").addEventListener("click", () => {
      settings = { ...global.GameSettings.DEFAULTS };
      populate();
      const saved = global.GameSettings.save(storage, settings);
      apply();
      applyScreenMode();
      setStatus(saved ? "모든 설정을 기본값으로 복원했습니다." : "기본값은 적용했지만 저장할 수 없습니다.", !saved);
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    documentRef.addEventListener("fullscreenchange", () => {
      settings.screenMode = documentRef.fullscreenElement ? "fullscreen" : "windowed";
      global.GameSettings.save(storage, settings);
      populate();
    });
    documentRef.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (dialog.open) {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
        return;
      }
      if (options.closeOverlay?.()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (options.onEscape) options.onEscape();
      else open();
    }, true);

    const api = Object.freeze({
      open,
      close,
      apply,
      getSettings: () => ({ ...settings }),
      dialog,
      EVENTS,
    });
    installed = { api, observer };
    apply();
    return api;
  }

  function isOpen() {
    return installed?.api?.dialog?.open === true;
  }

  return Object.freeze({
    EVENTS,
    applyDocumentSettings,
    effectiveBgmVolume,
    install,
    isOpen,
  });
});
