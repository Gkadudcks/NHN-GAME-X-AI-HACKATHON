(function initOfficeEscapeDev() {
  "use strict";
  const params = new URLSearchParams(location.search);
  const composition = ["a", "b", "c"].includes(params.get("composition")) ? params.get("composition") : "c";
  const defaultScene = { a: "jump", b: "slide", c: "run" };
  let reviewAssetMap = {};
  let currentComposition = composition;
  let selectedCandidate = "";
  const DAY4_ASSET_PREFIX = "NAN_GAME_TITLE/minigames/day4-office-escape/";
  const status = document.querySelector("#oe2-dev-status");
  const reviewArt = document.querySelector("#oe2-dev-review-art");
  const hitboxes = document.querySelector("#oe2-dev-hitboxes");
  const backgroundBoard = document.querySelector("#oe2-background-board");

  function renderBackgroundBoard() {
    document.querySelectorAll("[data-review-background]").forEach((host) => {
      const source = reviewAssetMap[host.dataset.reviewBackground];
      if (!source) return;
      let image = host.querySelector("img");
      if (!image) {
        image = document.createElement("img");
        image.alt = host.getAttribute("aria-label") || "review 배경 후보";
        host.append(image);
      }
      image.src = source;
    });
  }

  async function loadReviewAssets() {
    try {
      const manifestUrl = new URL("../../../../assets/art/manifests/art-assets.json", document.baseURI);
      const response = await fetch(manifestUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`manifest ${response.status}`);
      const manifest = await response.json();
      reviewAssetMap = Object.fromEntries(manifest.assets.flatMap((asset) => {
        const candidate = [...asset.versions].reverse().find((version) => version.status === "review" && version.path);
        if (!candidate) return [];
        const localPath = candidate.path.startsWith(DAY4_ASSET_PREFIX)
          ? `minigames/day4-office-escape/${candidate.path.slice(DAY4_ASSET_PREFIX.length)}`
          : `../${candidate.path}`;
        return [[asset.id, new URL(localPath, document.baseURI).href]];
      }));
    } catch (error) {
      reviewArt.checked = false;
      reviewArt.disabled = true;
      console.warn("DAY 4 review preview unavailable", error);
    }
  }
  function setQuery(key, value) { const next = new URL(location.href); next.searchParams.set(key, value); history.replaceState(null, "", next); }
  function staticPreview(scene = defaultScene[currentComposition]) {
    OfficeEscapeMinigame.start({ composition: currentComposition, autoStart: false, previewScene: scene, reviewAssetMap, reviewAssetsEnabled: reviewArt.checked, showHitboxes: hitboxes.checked });
    status.textContent = `정적 · ${currentComposition.toUpperCase()} · ${scene}`;
    setQuery("scene", scene);
  }
  function startPlay() {
    OfficeEscapeMinigame.start({ composition: currentComposition, reviewAssetMap, reviewAssetsEnabled: reviewArt.checked, showHitboxes: hitboxes.checked, onComplete(result) { status.textContent = `완료 · ${result.grade.toUpperCase()} · 피격 ${result.hitCount}`; } });
    status.textContent = `플레이 · ${currentComposition.toUpperCase()} · 64초`;
  }
  function selectComposition(value) {
    currentComposition = value;
    setQuery("composition", value);
    document.querySelectorAll("[data-composition]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.composition === value)));
    staticPreview(defaultScene[value]);
  }
  document.querySelectorAll("[data-composition]").forEach((button) => button.addEventListener("click", () => selectComposition(button.dataset.composition)));
  document.querySelectorAll("[data-preview]").forEach((button) => button.addEventListener("click", () => staticPreview(button.dataset.preview)));
  document.querySelector("#oe2-dev-play").addEventListener("click", startPlay);
  document.querySelector("#oe2-clean").addEventListener("click", () => document.body.classList.add("clean-preview"));
  document.querySelector("#oe2-dev-buttons").addEventListener("click", () => document.body.classList.add("show-button-review"));
  document.querySelector("#oe2-dev-backgrounds").addEventListener("click", () => { renderBackgroundBoard(); backgroundBoard.setAttribute("aria-hidden", "false"); });
  document.querySelector("#oe2-review-close").addEventListener("click", () => document.body.classList.remove("show-button-review"));
  document.querySelector("#oe2-background-close").addEventListener("click", () => backgroundBoard.setAttribute("aria-hidden", "true"));
  document.querySelectorAll("[data-button-candidate]").forEach((button) => button.addEventListener("click", () => {
    selectedCandidate = button.dataset.buttonCandidate;
    document.querySelectorAll("[data-button-candidate]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
    status.textContent = `버튼 후보 선택 · ${selectedCandidate} · 사용자 승인 대기`;
  }));
  [reviewArt, hitboxes].forEach((input) => input.addEventListener("change", () => staticPreview(defaultScene[currentComposition])));
  globalThis.addEventListener("keydown", (event) => { if (event.code === "KeyH") document.body.classList.toggle("clean-preview"); if (event.code === "Escape") { document.body.classList.remove("show-button-review"); backgroundBoard.setAttribute("aria-hidden", "true"); } });
  loadReviewAssets().finally(() => { renderBackgroundBoard(); selectComposition(composition); });
})();
