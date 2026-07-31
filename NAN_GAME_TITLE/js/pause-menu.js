(function exposePauseMenu(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GamePauseMenu = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createPauseMenu(global) {
  function createMenu(documentRef) {
    const overlay = documentRef.createElement("div");
    overlay.id = "pause-menu";
    overlay.className = "pause-menu";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <section class="pause-menu-panel" role="dialog" aria-modal="true" aria-labelledby="pause-menu-title">
        <p class="pause-menu-kicker">PAUSED</p>
        <h2 id="pause-menu-title">일시정지</h2>
        <div class="pause-menu-actions">
          <button type="button" data-pause-action="main">메인 메뉴</button>
          <button type="button" data-pause-action="continue">이어하기<small>최근 저장 내용 불러오기</small></button>
          <button type="button" data-pause-action="settings">설정</button>
          <button type="button" data-pause-action="close">닫기<small>게임으로 돌아가기</small></button>
        </div>
        <p class="pause-menu-status" role="status" aria-live="polite"></p>
      </section>`;
    documentRef.body.appendChild(overlay);
    return overlay;
  }

  function install(options = {}) {
    const documentRef = options.document || global.document;
    if (!documentRef) return null;

    const overlay = documentRef.querySelector("#pause-menu") || createMenu(documentRef);
    const panel = overlay.querySelector(".pause-menu-panel");
    const status = overlay.querySelector(".pause-menu-status");
    let lastFocusedElement = null;
    let returnFromSettings = false;

    function isOpen() {
      return overlay.classList.contains("open");
    }

    function open() {
      if (isOpen()) return;
      lastFocusedElement = documentRef.activeElement;
      status.textContent = "";
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
      overlay.querySelector('[data-pause-action="close"]')?.focus();
      documentRef.dispatchEvent(new CustomEvent("nan:pause-open"));
      options.onOpen?.();
    }

    function close({ restoreFocus = true } = {}) {
      if (!isOpen()) return;
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      if (restoreFocus) lastFocusedElement?.focus?.();
      documentRef.dispatchEvent(new CustomEvent("nan:pause-close"));
      options.onClose?.();
    }

    function trapFocus(event) {
      if (event.key !== "Tab" || !isOpen()) return;
      const focusable = [...panel.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])")]
        .filter((element) => !element.closest?.("[hidden]") && element.getAttribute?.("aria-hidden") !== "true");
      if (!focusable.length) {
        event.preventDefault();
        panel.focus?.();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      const active = documentRef.activeElement;
      if (!overlay.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
      const action = event.target.closest?.("[data-pause-action]")?.dataset.pauseAction;
      if (action === "close") close();
      if (action === "main" && global.confirm("메인 메뉴로 이동하시겠습니까? 저장하지 않은 진행은 사라질 수 있습니다.")) {
        (options.location || global.location).href = "index.html";
      }
      if (action === "continue") {
        close({ restoreFocus: false });
        options.openLoad?.();
      }
      if (action === "settings") {
        returnFromSettings = true;
        close({ restoreFocus: false });
        options.openSettings?.();
      }
    });
    documentRef.addEventListener("nan:settings-close", () => {
      if (!returnFromSettings) return;
      returnFromSettings = false;
      open();
    });
    documentRef.addEventListener("keydown", trapFocus, true);

    return Object.freeze({ open, close, isOpen });
  }

  return Object.freeze({ install });
});
