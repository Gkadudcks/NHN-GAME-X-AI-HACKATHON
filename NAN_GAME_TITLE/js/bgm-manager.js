(function (global) {
  const TRACKS = Object.freeze({
    title: "assets/audio/1. 기본 테마.wav",
    daily: "assets/audio/2. 일상.mp3",
    harin: "assets/audio/3. 서하린과의 일상.mp3",
    overtime: "assets/audio/4. 야근.mp3",
    mystery: "assets/audio/5. 추리.mp3",
    minigame: "assets/audio/MiniGame-theme.mp3",
    happyEnding: "assets/audio/주말에 시간 있어요 1차 엔딩.mp3",
    middleEnding: "assets/audio/중간 엔딩. 말하지 못한 마음.mp3",
    badEnding: "assets/audio/배드 엔딩. 계약 종료.mp3",
    "day-transition": null,
  });

  class BGMManager {
    constructor(audio, getVolume) {
      this.audio = audio;
      this.getVolume = getVolume;
      this.currentScene = "title";
      this.animationFrame = null;
      this.transitionId = 0;
    }

    setVolume() {
      if (!this.audio || this.animationFrame) return;
      this.audio.volume = this.getVolume();
    }

    async resume() {
      if (!this.audio || !this.audio.paused || !this.audio.src) return;
      try {
        await this.audio.play();
      } catch (_error) {
        // 브라우저가 자동 재생을 막으면 첫 사용자 입력에서 다시 시도합니다.
      }
    }

    fade(from, to, duration, transitionId) {
      if (!this.audio || duration <= 0) {
        if (this.audio) this.audio.volume = to;
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const startedAt = performance.now();
        const step = (now) => {
          if (transitionId !== this.transitionId) return resolve();
          const progress = Math.min(1, (now - startedAt) / duration);
          this.audio.volume = from + (to - from) * progress;
          if (progress < 1) {
            this.animationFrame = requestAnimationFrame(step);
            return;
          }
          this.animationFrame = null;
          resolve();
        };
        this.animationFrame = requestAnimationFrame(step);
      });
    }

    async play(scene, options = {}) {
      if (!(scene in TRACKS)) {
        console.warn(`[BGM] 등록되지 않은 상황입니다: ${scene}`);
        return;
      }
      if (!this.audio) return;

      const source = TRACKS[scene];
      if (scene === this.currentScene && source && this.audio.src) {
        this.setVolume();
        await this.resume();
        return;
      }

      this.transitionId += 1;
      const transitionId = this.transitionId;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      const fadeOut = options.fadeOut ?? 650;
      const fadeIn = options.fadeIn ?? 450;

      await this.fade(this.audio.volume, 0, fadeOut, transitionId);
      if (transitionId !== this.transitionId) return;
      this.audio.pause();
      this.currentScene = scene;
      this.audio.dataset.scene = scene;

      if (!source) {
        this.audio.removeAttribute("src");
        this.audio.load();
        return;
      }

      this.audio.src = source;
      this.audio.currentTime = 0;
      this.audio.loop = true;
      this.audio.volume = 0;
      this.audio.load();
      await this.resume();
      if (transitionId !== this.transitionId) return;
      await this.fade(0, this.getVolume(), fadeIn, transitionId);
    }

    stop(options) {
      return this.play("day-transition", options);
    }
  }

  global.GameBgmTracks = TRACKS;
  global.GameBgmManager = BGMManager;
})(window);
