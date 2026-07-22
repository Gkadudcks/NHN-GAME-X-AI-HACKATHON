(function (global) {
  const TRACKS = Object.freeze({
    title: { source: "assets/audio/looped/title.ogg", loopSource: "assets/audio/looped/title-loop.ogg", loopStart: 11.75 },
    daily: { source: "assets/audio/looped/daily-v2.ogg", loopSource: "assets/audio/looped/daily-v2-loop.ogg", loopStart: 9.0 },
    harin: { source: "assets/audio/looped/harin.ogg", loopSource: "assets/audio/looped/harin-loop.ogg", loopStart: 14.75 },
    overtime: { source: "assets/audio/looped/overtime.ogg", loopSource: "assets/audio/looped/overtime-loop.ogg", loopStart: 18.0 },
    mystery: { source: "assets/audio/looped/mystery.ogg", loopSource: "assets/audio/looped/mystery-loop.ogg", loopStart: 26.0 },
    minigame: { source: "assets/audio/looped/minigame.ogg", loopSource: "assets/audio/looped/minigame-loop.ogg", loopStart: 10.75 },
    happyEnding: { source: "assets/audio/looped/happy-ending.ogg", loopSource: "assets/audio/looped/happy-ending-loop.ogg", loopStart: 20.25 },
    middleEnding: { source: "assets/audio/looped/middle-ending.ogg", loopSource: "assets/audio/looped/middle-ending-loop.ogg", loopStart: 25.0 },
    badEnding: { source: "assets/audio/looped/bad-ending.ogg", loopSource: "assets/audio/looped/bad-ending-loop.ogg", loopStart: 5.5 },
    "day-transition": null,
  });

  class BGMManager {
    constructor(audio, getVolume, options = {}) {
      this.audio = audio;
      this.getVolume = getVolume;
      this.preferHtmlAudio = options.preferHtmlAudio === true || global.location?.protocol === "file:";
      this.context = null;
      this.gain = null;
      this.sourceNode = null;
      this.currentScene = null;
      this.currentVolume = 0;
      this.transitionId = 0;
      this.fadeFrames = new Set();
      this.buffers = new Map();
      this.paused = true;
      this.backend = null;
      this.fallbackGeneration = 0;
      this.fallbackLoopAudio = null;
      this.activeFallbackAudio = audio;
      this.htmlPreloads = new Map();

      if (this.audio && !this.preferHtmlAudio) {
        this.audio.pause();
        this.audio.removeAttribute("src");
        this.audio.loop = false;
        this.audio.load();
      }
    }

    ensureContext() {
      if (this.preferHtmlAudio) return false;
      if (this.context) return true;
      const AudioContext = global.AudioContext || global.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = this.currentVolume;
      this.gain.connect(this.context.destination);
      return true;
    }

    createHtmlAudio(source) {
      if (typeof global.Audio !== "function") return null;
      const audio = new global.Audio(source);
      audio.preload = "auto";
      audio.playsInline = true;
      audio.volume = this.currentVolume;
      return audio;
    }

    setInternalVolume(value) {
      this.currentVolume = Math.min(1, Math.max(0, value));
      if (this.gain) this.gain.gain.value = this.currentVolume;
      if (this.audio) this.audio.volume = this.currentVolume;
      if (this.fallbackLoopAudio) this.fallbackLoopAudio.volume = this.currentVolume;
      if (this.activeFallbackAudio && this.activeFallbackAudio !== this.audio) {
        this.activeFallbackAudio.volume = this.currentVolume;
      }
    }

    setVolume() {
      if (this.fadeFrames.size) return;
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

    preload(sceneNames) {
      const tracks = [...new Set(sceneNames)]
        .map((scene) => TRACKS[scene])
        .filter(Boolean);

      if (this.preferHtmlAudio || !this.ensureContext()) {
        tracks.forEach((track) => {
          if (this.htmlPreloads.has(track.loopSource)) return;
          const audio = this.createHtmlAudio(track.loopSource);
          if (audio) this.htmlPreloads.set(track.loopSource, audio);
        });
        return Promise.resolve();
      }
      return Promise.allSettled(tracks.map((track) => this.load(track)));
    }

    async resume() {
      if (this.backend === "html") return this.resumeFallback();
      if (this.backend === "webaudio") {
        try {
          await this.context.resume();
          this.paused = this.context.state !== "running";
          return !this.paused;
        } catch (_error) {
          this.paused = true;
          return false;
        }
      }
      if (this.preferHtmlAudio || !this.ensureContext()) return this.resumeFallback();
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
      const audio = this.activeFallbackAudio || this.audio;
      if (!audio?.src) return false;
      try {
        await audio.play();
        this.backend = "html";
        this.paused = false;
        return true;
      } catch (_error) {
        this.paused = true;
        return false;
      }
    }

    async pause() {
      if (this.backend === "webaudio" && this.context) await this.context.suspend();
      if (this.backend === "html") this.activeFallbackAudio?.pause();
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
            const frame = requestAnimationFrame((time) => {
              this.fadeFrames.delete(frame);
              step(time);
            });
            this.fadeFrames.add(frame);
            return;
          }
          resolve();
        };
        step(startedAt);
      });
    }

    stopSource() {
      if (!this.sourceNode) return;
      try { this.sourceNode.stop(); } catch (_error) {}
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    stopFallback() {
      this.fallbackGeneration += 1;
      for (const audio of [this.audio, this.fallbackLoopAudio]) {
        if (!audio) continue;
        audio.onended = null;
        audio.pause();
      }
      this.fallbackLoopAudio = null;
      this.activeFallbackAudio = this.audio;
    }

    async switchToFallbackLoop(scene, track, generation) {
      if (generation !== this.fallbackGeneration || scene !== this.currentScene || this.paused) return;
      let loopAudio = this.fallbackLoopAudio;
      if (loopAudio) {
        loopAudio.currentTime = 0;
        loopAudio.loop = true;
        loopAudio.volume = this.currentVolume;
        try {
          await loopAudio.play();
          if (generation !== this.fallbackGeneration) {
            loopAudio.pause();
            return;
          }
          this.activeFallbackAudio = loopAudio;
          return;
        } catch (_error) {}
      }

      // loop 전용 파일을 쓸 수 없는 구형 브라우저에서도 음악이 멈추지는 않게 한다.
      this.audio.currentTime = Math.min(track.loopStart, Math.max(0, (this.audio.duration || track.loopStart) - 0.05));
      this.activeFallbackAudio = this.audio;
      try {
        await this.audio.play();
        this.paused = false;
      } catch (_error) {
        this.paused = true;
      }
    }

    async play(scene, options = {}) {
      if (!(scene in TRACKS)) {
        console.warn(`[BGM] 등록되지 않은 상황입니다: ${scene}`);
        return false;
      }

      const track = TRACKS[scene];
      if (scene === this.currentScene && (this.sourceNode || this.activeFallbackAudio?.src)) {
        this.setVolume();
        return this.resume();
      }
      if (this.preferHtmlAudio) return this.playFallback(scene, track);

      const transitionId = ++this.transitionId;
      const fadeOut = this.currentScene ? (options.fadeOut ?? 650) : 0;
      const fadeIn = options.fadeIn ?? 450;

      if (!this.ensureContext()) return this.playFallback(scene, track);
      const bufferPromise = track ? this.load(track) : Promise.resolve(null);
      await this.fade(this.currentVolume, 0, fadeOut, transitionId);
      if (transitionId !== this.transitionId) return false;
      this.stopSource();
      this.stopFallback();
      this.currentScene = scene;
      if (this.audio) this.audio.dataset.scene = scene;
      if (!track) {
        this.backend = null;
        this.paused = true;
        return true;
      }

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
        this.backend = "webaudio";
        this.setInternalVolume(0);
        const resumed = await this.resume();
        if (transitionId !== this.transitionId) return false;
        await this.fade(0, this.getVolume(), fadeIn, transitionId);
        return resumed;
      } catch (error) {
        console.warn("[BGM] Web Audio 재생에 실패해 기본 재생으로 전환합니다.", error);
        return this.playFallback(scene, track);
      }
    }

    async playFallback(scene, track) {
      if (!this.audio) return false;
      ++this.transitionId;
      this.stopSource();
      this.stopFallback();
      this.backend = "html";
      this.currentScene = scene;
      this.audio.dataset.scene = scene;
      if (!track) {
        this.audio.removeAttribute("src");
        this.audio.load();
        this.paused = true;
        return true;
      }

      const generation = this.fallbackGeneration;
      this.audio.src = track.source;
      this.audio.currentTime = 0;
      this.audio.loop = false;
      this.audio.volume = this.getVolume();
      this.setInternalVolume(this.getVolume());
      this.activeFallbackAudio = this.audio;
      this.audio.onended = () => this.switchToFallbackLoop(scene, track, generation);
      this.audio.load();

      this.fallbackLoopAudio = this.htmlPreloads.get(track.loopSource) || this.createHtmlAudio(track.loopSource);
      if (this.fallbackLoopAudio) {
        this.fallbackLoopAudio.loop = true;
        this.fallbackLoopAudio.volume = this.currentVolume;
      }
      return this.resumeFallback();
    }

    stop(options) {
      return this.play("day-transition", options);
    }
  }

  global.GameBgmTracks = TRACKS;
  global.GameBgmManager = BGMManager;
})(window);
