(function exposeLocationTransition(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GameLocationTransition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createLocationTransition(global) {
  const DEFAULT_DURATION = 1300;

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
        <span>이동 중</span>
        <div class="location-transition-progress" role="progressbar" aria-label="장소 이동 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <i></i>
        </div>
        <em>0%</em>
      </div>`;
    documentRef.body.appendChild(overlay);
    return overlay;
  }

  function install(options = {}) {
    const documentRef = options.document || global.document;
    if (!documentRef) return null;
    const overlay = documentRef.querySelector("#location-transition") || createOverlay(documentRef);
    const locationText = overlay.querySelector("strong");
    const progress = overlay.querySelector(".location-transition-progress");
    const progressBar = progress.querySelector("i");
    const progressText = overlay.querySelector("em");
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
      const enforcedDuration = Math.max(DEFAULT_DURATION, Number(duration) || DEFAULT_DURATION);
      locationText.textContent = nextLocation;
      progress.setAttribute("aria-valuenow", "0");
      progressBar.style.width = "0%";
      progressText.textContent = "0%";
      overlay.classList.add("show");
      overlay.setAttribute("aria-hidden", "false");
      return new Promise((resolve) => {
        let completed = false;
        const fadeDuration = 260;
        const startedAt = Date.now();
        const progressTimer = global.setInterval(updateProgress, 50);
        const timer = global.setTimeout(complete, enforcedDuration);
        function updateProgress() {
          const percent = Math.min(100, Math.floor(((Date.now() - startedAt) / enforcedDuration) * 100));
          progress.setAttribute("aria-valuenow", String(percent));
          progressBar.style.width = `${percent}%`;
          progressText.textContent = `${percent}%`;
        }
        function complete() {
          if (completed) return;
          completed = true;
          global.clearTimeout(timer);
          global.clearInterval(progressTimer);
          progress.setAttribute("aria-valuenow", "100");
          progressBar.style.width = "100%";
          progressText.textContent = "100%";
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

    overlay.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    return Object.freeze({ play, playIfChanged, finish, isActive });
  }

  return Object.freeze({ DEFAULT_DURATION, shouldPlay, install });
});
