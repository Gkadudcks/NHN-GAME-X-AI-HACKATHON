(function exposeSettingsDialog(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GameSettingsDialog = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSettingsDialog(global) {
  "use strict";

  const EVENTS = Object.freeze({ OPEN: "nan:settings-open", CLOSE: "nan:settings-close", CHANGE: "nan:settings-change" });
  let installed;

  function dispatch(documentRef, type, detail) {
    documentRef.dispatchEvent(new CustomEvent(type, { detail }));
  }

  function applyDocumentSettings(settings, documentRef) {
    const root = documentRef.documentElement;
    root.style.setProperty("--dialogue-text-scale", settings.textSize / 100);
    root.style.setProperty("--dialogue-opacity", settings.dialogueOpacity / 100);
    root.style.setProperty("--master-volume", settings.masterMuted ? 0 : settings.masterVolume / 100);
    root.style.setProperty("--bgm-volume", settings.bgmMuted ? 0 : settings.bgmVolume / 100);
    root.style.setProperty("--sfx-volume", settings.sfxMuted ? 0 : settings.sfxVolume / 100);
    root.classList.toggle("reduce-effects", settings.reduceEffects);
    root.dataset.masterMuted = String(settings.masterMuted);
    root.dataset.bgmMuted = String(settings.bgmMuted);
    root.dataset.sfxMuted = String(settings.sfxMuted);
  }

  function outputText(name, value) {
    return name === "dialogueOpacity" || name === "textSize" || name.endsWith("Volume") ? `${value}%` : String(value);
  }

  function createDialog(documentRef) {
    const dialog = documentRef.createElement("dialog");
    dialog.id = "settings-dialog";
    dialog.className = "settings-dialog";
    dialog.setAttribute("aria-labelledby", "settings-title");
    dialog.innerHTML = `
      <form class="settings-panel" id="settings-form" method="dialog">
        <header class="settings-header"><div><p class="settings-eyebrow">SYSTEM PREFERENCES</p><h2 id="settings-title">설정</h2></div><button class="icon-button" type="button" data-settings-close aria-label="설정 닫기">×</button></header>
        <div class="settings-scroll">
          <fieldset class="settings-section"><legend>사운드</legend>
            <label class="range-setting" for="master-volume"><span><strong>전체 음량</strong><small>모든 소리의 기준 음량</small></span><span class="range-control"><input id="master-volume" name="masterVolume" type="range" min="0" max="100" step="5"><output>80%</output></span></label>
            <label class="range-setting" for="bgm-volume"><span><strong>BGM 음량</strong><small>배경 음악 음량</small></span><span class="range-control"><input id="bgm-volume" name="bgmVolume" type="range" min="0" max="100" step="5"><output>70%</output></span></label>
            <label class="range-setting" for="sfx-volume"><span><strong>효과음 음량</strong><small>버튼과 알림 효과음</small></span><span class="range-control"><input id="sfx-volume" name="sfxVolume" type="range" min="0" max="100" step="5"><output>80%</output></span></label>
          </fieldset>
          <fieldset class="settings-section"><legend>화면</legend>
            <label class="select-setting" for="screen-mode"><span><strong>화면 모드</strong><small>전체 화면은 브라우저 권한이 필요합니다</small></span><select id="screen-mode" name="screenMode"><option value="windowed">창 모드</option><option value="fullscreen">전체 화면</option></select></label>
            <label class="toggle-setting" for="reduce-effects"><span><strong>화면 효과 줄이기</strong><small>움직임과 전환 효과를 최소화합니다</small></span><input id="reduce-effects" name="reduceEffects" type="checkbox" role="switch"></label>
          </fieldset>
          <fieldset class="settings-section"><legend>대화</legend>
            <label class="range-setting" for="text-size"><span><strong>글자 크기</strong><small>대사와 선택지에 바로 적용됩니다</small></span><span class="range-control"><input id="text-size" name="textSize" type="range" min="90" max="130" step="10"><output>100%</output></span></label>
            <label class="range-setting" for="dialogue-opacity"><span><strong>대화창 투명도</strong><small>값이 높을수록 배경과 분리되어 보입니다</small></span><span class="range-control"><input id="dialogue-opacity" name="dialogueOpacity" type="range" min="0" max="100" step="5"><output>90%</output></span></label>
          </fieldset>
        </div>
        <footer class="settings-footer"><p id="settings-status" role="status" aria-live="polite">변경 사항은 자동으로 저장됩니다.</p><div><button class="secondary-button" id="reset-settings" type="button">기본값 복원</button><button class="primary-button" type="button" data-settings-close>완료</button></div></footer>
      </form>`;
    documentRef.body.appendChild(dialog);
    return dialog;
  }

  function install(options = {}) {
    if (!global.document || !global.GameSettings) return null;
    if (installed) return installed.api;
    const documentRef = global.document;
    const storage = options.storage || global.localStorage;
    const dialog = documentRef.querySelector("#settings-dialog") || createDialog(documentRef);
    const form = dialog.querySelector("#settings-form");
    const status = dialog.querySelector("#settings-status");
    let settings = global.GameSettings.load(storage);
    let lastFocusedElement = null;
    let previouslyOpen = dialog.open;

    // The title screen previously displayed these controls before the story engines
    // supported them. Keep old markup compatible, but make the unavailable scope clear.
    const deferredControls = [...form.querySelectorAll('[name="dialogueMode"], [name="textSpeed"], [name="autoDelay"]')];
    if (deferredControls.length) {
      deferredControls.forEach((control) => {
        control.disabled = true;
        control.closest(".choice-setting, .range-setting")?.classList.add("settings-deferred");
      });
      const section = deferredControls[0].closest("fieldset");
      if (section && !section.querySelector(".settings-deferred-note")) {
        const note = documentRef.createElement("p");
        note.className = "settings-deferred-note";
        note.textContent = "자동 진행과 글자 출력 속도는 다음 업데이트에서 지원됩니다.";
        section.prepend(note);
      }
    }

    function setStatus(message, isError = false) {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle("error", isError);
    }

    function populate() {
      Object.entries(settings).forEach(([name, value]) => {
        const control = form.elements[name];
        if (!control) return;
        if (typeof RadioNodeList !== "undefined" && control instanceof RadioNodeList) control.value = value;
        else if (control.type === "checkbox") control.checked = value;
        else control.value = value;
        const output = control.closest?.("label")?.querySelector("output");
        if (output) output.value = outputText(name, value);
      });
    }

    function apply() {
      applyDocumentSettings(settings, documentRef);
      global.BGMManager?.setVolume?.();
      options.onApply?.(settings);
      dispatch(documentRef, EVENTS.CHANGE, { settings: { ...settings } });
    }

    function persist() {
      const values = {};
      [...form.elements].forEach((control) => {
        if (!control.name || control.disabled || (control.type === "radio" && !control.checked)) return;
        values[control.name] = control.type === "checkbox" ? control.checked : control.value;
      });
      settings = global.GameSettings.sanitize({ ...settings, ...values });
      apply();
      const saved = global.GameSettings.save(storage, settings);
      setStatus(saved ? "변경 사항을 저장했습니다." : "이 브라우저에서는 설정을 저장할 수 없습니다.", !saved);
      return saved;
    }

    async function applyScreenMode() {
      try {
        if (settings.screenMode === "fullscreen" && !documentRef.fullscreenElement) await documentRef.documentElement.requestFullscreen();
        if (settings.screenMode === "windowed" && documentRef.fullscreenElement) await documentRef.exitFullscreen();
      } catch (_error) {
        settings.screenMode = documentRef.fullscreenElement ? "fullscreen" : "windowed";
        populate();
        setStatus("브라우저에서 화면 모드 변경을 허용하지 않았습니다.", true);
      }
    }

    function open() {
      if (dialog.open) return;
      lastFocusedElement = documentRef.activeElement;
      settings = global.GameSettings.load(storage);
      populate();
      dialog.showModal();
      dialog.querySelector("input, select, button")?.focus();
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
      const output = event.target.closest?.("label")?.querySelector("output");
      if (output) output.value = outputText(event.target.name, event.target.value);
    });
    form.addEventListener("change", (event) => { if (event.target.name === "screenMode") applyScreenMode(); });
    dialog.querySelectorAll("[data-settings-close]").forEach((button) => button.addEventListener("click", close));
    dialog.querySelector("#reset-settings")?.addEventListener("click", () => {
      settings = { ...global.GameSettings.DEFAULTS };
      populate();
      apply();
      global.GameSettings.save(storage, settings);
      applyScreenMode();
      setStatus("기본값으로 복원했습니다.");
    });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
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
      open();
    }, true);

    const api = Object.freeze({ open, close, apply, getSettings: () => ({ ...settings }), dialog, EVENTS });
    installed = { api, observer };
    apply();
    return api;
  }

  function isOpen() {
    return installed?.api?.dialog?.open === true;
  }

  return Object.freeze({ EVENTS, applyDocumentSettings, install, isOpen });
});
