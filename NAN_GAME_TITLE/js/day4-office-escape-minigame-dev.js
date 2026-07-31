(function initDay4OfficeEscapeDev() {
  "use strict";

  const form = document.querySelector("#dev-controls");
  const duration = document.querySelector("#dev-duration");
  const assist = document.querySelector("#dev-assist");
  const reviewArt = document.querySelector("#dev-review-art");
  const intro = document.querySelector("#dev-intro");
  const hitboxes = document.querySelector("#dev-hitboxes");
  const pause = document.querySelector("#dev-pause");
  const status = document.querySelector("#dev-run-status");
  const resultJson = document.querySelector("#dev-result-json");
  let monitorFrame = 0;
  let paused = false;
  let reviewAssetMap = {};

  async function loadReviewAssets() {
    try {
      const response = await fetch("../assets/art/manifests/art-assets.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`manifest ${response.status}`);
      const manifest = await response.json();
      reviewAssetMap = Object.fromEntries(manifest.assets.flatMap((asset) => {
        const activeNumber = Number(asset.active_version?.slice(1)) || 0;
        const candidate = [...asset.versions].reverse()
          .find((version) => version.status === "review"
            && version.path
            && Number(version.version.slice(1)) > activeNumber);
        return candidate ? [[asset.id, new URL(`../${candidate.path}`, document.baseURI).href]] : [];
      }));
    } catch (error) {
      reviewAssetMap = {};
      reviewArt.checked = false;
      reviewArt.disabled = true;
      console.warn("DAY 4 review asset preview unavailable", error);
    }
  }

  function monitor() {
    const snapshot = OfficeEscapeMinigame.debugSnapshot();
    if (snapshot && !snapshot.finished) {
      status.textContent = `${snapshot.zone.label} · ${Math.round(snapshot.progress * 100)}% · 피격 ${snapshot.hitCount} · 수집 ${snapshot.collectedItems.length}/3`;
    }
    monitorFrame = requestAnimationFrame(monitor);
  }

  function run() {
    cancelAnimationFrame(monitorFrame);
    const runDuration = Math.max(15, Math.min(90, Number(duration.value) || 64));
    paused = false;
    pause.textContent = "일시정지";
    pause.setAttribute("aria-pressed", "false");
    status.textContent = `실행 준비 · ${runDuration}초 · 보조 ${assist.checked ? "ON" : "OFF"}`;
    OfficeEscapeMinigame.start({
      autoStart: !intro.checked,
      testOverrides: {
        duration: runDuration,
        length: OfficeEscapeMinigameCore.DEFAULT_LENGTH * (runDuration / OfficeEscapeMinigameCore.DEFAULT_DURATION),
        assist: assist.checked,
      },
      reviewAssetMap: reviewArt.checked ? reviewAssetMap : {},
      showHitboxes: hitboxes.checked,
      onComplete(result) {
        resultJson.textContent = JSON.stringify(result, null, 2);
        status.textContent = `완료 · ${result.grade.toUpperCase()} · 피격 ${result.hitCount}`;
      },
    });
    monitor();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  pause.addEventListener("click", () => {
    paused = !paused;
    if (paused) OfficeEscapeMinigame.pause();
    else OfficeEscapeMinigame.resume();
    pause.textContent = paused ? "계속하기" : "일시정지";
    pause.setAttribute("aria-pressed", String(paused));
  });

  loadReviewAssets().finally(run);
})();
