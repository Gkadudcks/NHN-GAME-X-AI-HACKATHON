(function () {
  const clickAudio = new Audio("assets/audio/ui-click.wav");
  clickAudio.preload = "auto";

  function getVolume() {
    try {
      const settings = JSON.parse(localStorage.getItem("nan-game-settings-v1")) || {};
      if (settings.masterMuted || settings.sfxMuted) return 0;
      const master = (settings.masterVolume ?? 80) / 100;
      const sfx = (settings.sfxVolume ?? 80) / 100;
      return Math.min(1, Math.max(0, master * sfx * 0.72));
    } catch {
      return 0.58;
    }
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

  window.UiSfx = Object.freeze({ playClick });
})();
