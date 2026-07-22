(function () {
  const variants = Object.freeze({
    soft: "assets/audio/ui-click-soft-v2.wav",
    warm: "assets/audio/ui-click-warm-v2.wav",
    paper: "assets/audio/ui-click-paper.wav",
    glass: "assets/audio/ui-click-glass.wav",
  });
  let activeVariant = "soft";
  try {
    const saved = localStorage.getItem("nan-ui-click-variant");
    if (saved in variants) activeVariant = saved;
  } catch (_error) {}
  const clickAudio = new Audio(variants[activeVariant]);
  clickAudio.preload = "auto";

  function getVolume() {
    try {
      const settings = JSON.parse(localStorage.getItem("nan-game-settings-v1")) || {};
      if (settings.masterMuted || settings.sfxMuted) return 0;
      const master = (settings.masterVolume ?? 80) / 100;
      const sfx = (settings.sfxVolume ?? 80) / 100;
      return Math.min(1, Math.max(0, master * sfx * 0.46));
    } catch {
      return 0.37;
    }
  }

  function setVariant(name) {
    if (!(name in variants)) return false;
    activeVariant = name;
    clickAudio.src = variants[name];
    clickAudio.load();
    try { localStorage.setItem("nan-ui-click-variant", name); } catch (_error) {}
    return true;
  }

  function playClick() {
    const volume = getVolume();
    if (!volume) return;
    clickAudio.volume = volume;
    clickAudio.currentTime = 0;
    clickAudio.play().catch(() => {});
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest("button, a[href], [role='button']");
    if (!control || control.disabled || control.getAttribute("aria-disabled") === "true") return;
    playClick();
  });

  window.UiSfx = Object.freeze({ playClick, setVariant, variants, get activeVariant() { return activeVariant; } });
})();
