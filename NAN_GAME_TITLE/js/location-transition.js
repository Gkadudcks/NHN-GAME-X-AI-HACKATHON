(function exposeLocationTransition(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GameLocationTransition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createLocationTransition(global) {
  const DEFAULT_DURATION = 2000;

  function shouldPlay(currentLocation, nextLocation) {
    return Boolean(nextLocation && currentLocation && nextLocation !== currentLocation);
  }

  function createOverlay(documentRef) {
    const overlay = documentRef.createElement("div");
    overlay.id = "location-transition";
    overlay.className = "location-transition";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="location-transition-content">
        <small>NOW MOVING</small>
        <strong></strong>
        <span>이동 중…</span>
        <em>클릭하여 건너뛰기</em>
      </div>`;
    documentRef.body.appendChild(overlay);
    return overlay;
  }

  function install(options = {}) {
    const documentRef = options.document || global.document;
    if (!documentRef) return null;
    const overlay = documentRef.querySelector("#location-transition") || createOverlay(documentRef);
    const locationText = overlay.querySelector("strong");
    let finishCurrent = null;

    function isActive() {
      return overlay.classList.contains("show");
    }

    function finish() {
      finishCurrent?.();
    }

    function play(nextLocation, duration = DEFAULT_DURATION) {
      if (!nextLocation) return Promise.resolve(false);
      finish();
      locationText.textContent = nextLocation;
      overlay.classList.add("show");
      overlay.setAttribute("aria-hidden", "false");
      return new Promise((resolve) => {
        let completed = false;
        const fadeDuration = 260;
        const timer = global.setTimeout(complete, Math.max(0, duration - fadeDuration));
        function complete() {
          if (completed) return;
          completed = true;
          global.clearTimeout(timer);
          overlay.classList.remove("show");
          overlay.setAttribute("aria-hidden", "true");
          finishCurrent = null;
          global.setTimeout(() => resolve(true), fadeDuration);
        }
        finishCurrent = complete;
      });
    }

    function playIfChanged(currentLocation, nextLocation, duration = DEFAULT_DURATION) {
      return shouldPlay(currentLocation, nextLocation) ? play(nextLocation, duration) : Promise.resolve(false);
    }

    overlay.addEventListener("click", finish);
    return Object.freeze({ play, playIfChanged, finish, isActive });
  }

  return Object.freeze({ DEFAULT_DURATION, shouldPlay, install });
});
