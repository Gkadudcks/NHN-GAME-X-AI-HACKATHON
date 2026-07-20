(function (global) {
  const TRACKS = Object.freeze({
    title: { source: "assets/audio/looped/title.ogg", loopStart: 11.75 },
    daily: { source: "assets/audio/looped/daily.ogg", loopStart: 9.25 },
    harin: { source: "assets/audio/looped/harin.ogg", loopStart: 14.75 },
    overtime: { source: "assets/audio/looped/overtime.ogg", loopStart: 18.0 },
    mystery: { source: "assets/audio/looped/mystery.ogg", loopStart: 26.0 },
    minigame: { source: "assets/audio/looped/minigame.ogg", loopStart: 10.75 },
    happyEnding: { source: "assets/audio/looped/happy-ending.ogg", loopStart: 20.25 },
    middleEnding: { source: "assets/audio/looped/middle-ending.ogg", loopStart: 25.0 },
    badEnding: { source: "assets/audio/looped/bad-ending.ogg", loopStart: 5.5 },
    "day-transition": null,
  });

  class BGMManager {
    constructor(audio, getVolume) {
      this.audio = audio;
      this.getVolume = getVolume;
      this.context = null;
      this.gain = null;
      this.sourceNode = null;
      this.currentScene = null;
      this.currentVolume = 0;
      this.animationFrame = null;
      this.transitionId = 0;
      this.buffers = new Map();
      this.paused = true;

      // 기존 audio 요소는 Web Audio 미지원 시의 폴백으로만 사용합니다.
      if (this.audio) {
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.loop = false;
        this.audio.load();
      }
    }

    ensureContext() {
      if (this.context) return true;
      const AudioContext = global.AudioContext || global.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = this.currentVolume;
      this.gain.connect(this.context.destination);
      return true;
    }

    setInternalVolume(value) {
      this.currentVolume = Math.min(1, Math.max(0, value));
      if (this.gain) this.gain.gain.value = this.currentVolume;
      if (this.audio) this.audio.volume = this.currentVolume;
    }

    setVolume() {
      if (this.animationFrame) return;
      this.setInternalVolume(this.getVolume());
    }

    async load(track) {
      if (this.buffers.has(track.source)) return this.buffers.get(track.source);
      const request = fetch(track.source)
        .then((response) => {
          if (!response.ok) throw new Error(`BGM을 불러오지 못했습니다: ${track.source}`);
          return response.arrayBuffer();
        })
        .then((data) => this.context.decodeAudioData(data));
      this.buffers.set(track.source, request);
      try {
        return await request;
      } catch (error) {
        this.buffers.delete(track.source);
        throw error;
      }
    }

    async resume() {
      if (!this.ensureContext()) return this.resumeFallback();
      try {
        await this.context.resume();
        this.paused = this.context.state !== "running";
        return !this.paused;
      } catch (_error) {
        this.paused = true;
        return false;
      }
    }

    async resumeFallback() {
      if (!this.audio?.src) return false;
      try {
        await this.audio.play();
        this.paused = false;
        return true;
      } catch (_error) {
        this.paused = true;
        return false;
      }
    }

    async pause() {
      if (this.context) await this.context.suspend();
      if (this.audio) this.audio.pause();
      this.paused = true;
    }

    isPaused() {
      return this.paused;
    }

    fade(from, to, duration, transitionId) {
      if (duration <= 0) {
        this.setInternalVolume(to);
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        const startedAt = performance.now();
        const step = (now) => {
          if (transitionId !== this.transitionId) return resolve();
          const progress = Math.min(1, (now - startedAt) / duration);
          this.setInternalVolume(from + (to - from) * progress);
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

    stopSource() {
      if (!this.sourceNode) return;
      try { this.sourceNode.stop(); } catch (_error) {}
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    async play(scene, options = {}) {
      if (!(scene in TRACKS)) {
        console.warn(`[BGM] 등록되지 않은 상황입니다: ${scene}`);
        return false;
      }

      const track = TRACKS[scene];
      if (scene === this.currentScene && (this.sourceNode || this.audio?.src)) {
        this.setVolume();
        return this.resume();
      }

      const transitionId = ++this.transitionId;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      const fadeOut = this.currentScene ? (options.fadeOut ?? 650) : 0;
      const fadeIn = options.fadeIn ?? 450;

      if (!this.ensureContext()) return this.playFallback(scene, track, options);
      const bufferPromise = track ? this.load(track) : Promise.resolve(null);
      await this.fade(this.currentVolume, 0, fadeOut, transitionId);
      if (transitionId !== this.transitionId) return false;
      this.stopSource();
      this.currentScene = scene;
      if (this.audio) this.audio.dataset.scene = scene;
      if (!track) return true;

      try {
        const buffer = await bufferPromise;
        if (transitionId !== this.transitionId) return false;
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.loopStart = Math.min(track.loopStart, Math.max(0, buffer.duration - 0.05));
        source.loopEnd = buffer.duration;
        source.connect(this.gain);
        source.start();
        this.sourceNode = source;
        this.setInternalVolume(0);
        const resumed = await this.resume();
        if (transitionId !== this.transitionId) return false;
        await this.fade(0, this.getVolume(), fadeIn, transitionId);
        return resumed;
      } catch (error) {
        console.warn("[BGM] Web Audio 재생에 실패해 기본 재생으로 전환합니다.", error);
        return this.playFallback(scene, track, options);
      }
    }

    async playFallback(scene, track, options = {}) {
      if (!this.audio) return false;
      this.currentScene = scene;
      if (!track) {
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.load();
        return true;
      }
      this.audio.src = track.source;
      this.audio.currentTime = 0;
      this.audio.loop = true;
      this.setInternalVolume(this.getVolume());
      this.audio.load();
      return this.resumeFallback(options);
    }

    stop(options) {
      return this.play("day-transition", options);
    }
  }

  global.GameBgmTracks = TRACKS;
  global.GameBgmManager = BGMManager;
})(window);
