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
  const pageTurnAudio = new Audio("assets/audio/page-turn.wav");
  pageTurnAudio.preload = "auto";
  const presentationAudio = Object.freeze({
    errorDiscovery: new Audio("assets/audio/day5-error-discovery-v2.wav"),
    flashTransition: new Audio("assets/audio/day5-flash-transition.wav"),
    evaluatorSuspicion: new Audio("assets/audio/day5-evaluator-confused-cut-v1.mp3"),
    evidenceMatch: new Audio("assets/audio/day5-evidence-match.wav"),
  });
  Object.values(presentationAudio).forEach((audio) => { audio.preload = "auto"; });
  let sfxContext = null;

  function getVolume(multiplier = 0.6) {
    try {
      const settings = JSON.parse(localStorage.getItem("nan-game-settings-v1")) || {};
      if (settings.masterMuted || settings.sfxMuted) return 0;
      const master = (settings.masterVolume ?? 80) / 100;
      const sfx = (settings.sfxVolume ?? 80) / 100;
      return Math.min(1, Math.max(0, master * sfx * multiplier));
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

  function playPageTurn() {
    const volume = getVolume(1);
    if (!volume) return;
    pageTurnAudio.volume = volume;
    pageTurnAudio.currentTime = 0;
    pageTurnAudio.play().catch(() => {});
  }

  function playPresentationCue(name) {
    const audio = presentationAudio[name];
    if (!audio) return false;
    const volume = getVolume(name === "errorDiscovery" ? 1 : name === "flashTransition" ? 0.55 : name === "evaluatorSuspicion" ? 0.88 : 0.65);
    if (!volume) return false;
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    return true;
  }

  function getSfxContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!sfxContext) sfxContext = new AudioContext();
    if (sfxContext.state === "suspended") sfxContext.resume().catch(() => {});
    return sfxContext;
  }

  function playTone(context, destination, { delay = 0, frequency, duration, type = "square", gain = 1 }) {
    const startsAt = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startsAt);
    envelope.gain.setValueAtTime(0.0001, startsAt);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), startsAt + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration + 0.02);
  }

  function playMinigameCue(name) {
    const patterns = {
      warning: {
        multiplier: 0.21,
        notes: [
          { frequency: 740, duration: 0.075, type: "triangle" },
          { delay: 0.105, frequency: 620, duration: 0.09, type: "triangle" },
        ],
      },
      caught: {
        multiplier: 0.3,
        notes: [
          { frequency: 196, duration: 0.18, type: "sawtooth" },
          { delay: 0.08, frequency: 123, duration: 0.28, type: "square", gain: 0.72 },
        ],
      },
      success: {
        multiplier: 0.23,
        notes: [
          { frequency: 523.25, duration: 0.1, type: "square" },
          { delay: 0.09, frequency: 659.25, duration: 0.1, type: "square" },
          { delay: 0.18, frequency: 783.99, duration: 0.16, type: "triangle" },
        ],
      },
      smash: {
        multiplier: 0.34,
        notes: [
          { frequency: 160, duration: 0.22, type: "sawtooth" },
          { frequency: 90, duration: 0.3, type: "square", gain: 0.75 },
          { delay: 0.05, frequency: 260, duration: 0.09, type: "triangle", gain: 0.5 },
        ],
      },
    };
    const pattern = patterns[name];
    if (!pattern) return false;
    const volume = getVolume(pattern.multiplier);
    if (!volume) return false;
    const context = getSfxContext();
    if (!context) return false;
    const master = context.createGain();
    master.gain.value = volume;
    master.connect(context.destination);
    pattern.notes.forEach((note) => playTone(context, master, note));
    return true;
  }

  function playEmphasisCue() {
    const volume = getVolume(0.22);
    if (!volume) return false;
    const context = getSfxContext();
    if (!context) return false;
    const master = context.createGain();
    master.gain.value = volume;
    master.connect(context.destination);
    playTone(context, master, { frequency: 440, duration: 0.09, type: "triangle" });
    return true;
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest("button, a[href], [role='button']");
    if (!control || control.disabled || control.getAttribute("aria-disabled") === "true") return;
    playClick();
  });

  window.UiSfx = Object.freeze({ playClick, playPageTurn, playMinigameCue, playPresentationCue, playEmphasisCue, setVariant, variants, get activeVariant() { return activeVariant; } });
})();
