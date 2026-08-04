const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'bgm-manager.js'), 'utf8');

test('출근길 지하철 환경음은 Pixabay 루프 편집본을 사용한다', () => {
  const { GameBgmTracks } = loadManager();
  assert.equal(GameBgmTracks.commute.source, "assets/audio/looped/subway-ride-pixabay-57289-rail-only-v2.wav");
  assert.equal(GameBgmTracks.commute.loopSource, "assets/audio/looped/subway-ride-pixabay-57289-rail-only-v2.wav");
  assert.equal(GameBgmTracks.commute.loopStart, 0);
});

test('녹음실은 Shared Headphones 루프 편집본을 사용한다', () => {
  const { GameBgmTracks } = loadManager();
  assert.equal(GameBgmTracks.recordingStudio.source, "assets/audio/looped/shared-headphones-loop.wav");
  assert.equal(GameBgmTracks.recordingStudio.loopSource, "assets/audio/looped/shared-headphones-loop.wav");
  assert.equal(GameBgmTracks.recordingStudio.loopStart, 0);
  assert.ok(fs.existsSync(path.join(root, GameBgmTracks.recordingStudio.source)));
});

class MockAudio {
  constructor(src = '') {
    this.src = src;
    this.currentTime = 0;
    this.duration = 49.58;
    this.dataset = {};
    this.volume = 0;
    this.loop = false;
    this.paused = true;
    this.playCalls = 0;
    this.pauseCalls = 0;
    this.onended = null;
  }
  play() { this.playCalls += 1; this.paused = false; return Promise.resolve(); }
  pause() { this.pauseCalls += 1; this.paused = true; }
  load() {}
  removeAttribute(name) { if (name === 'src') this.src = ''; }
}

function loadManager({ protocol = 'http:' } = {}) {
  class MockSource {
    connect() {}
    disconnect() {}
    start() { this.started = true; }
    stop() { this.stopped = true; }
  }

  class MockAudioContext {
    constructor() { this.state = 'suspended'; }
    createGain() { return { gain: { value: 0 }, connect() {} }; }
    createBufferSource() { return new MockSource(); }
    decodeAudioData() { return Promise.resolve({ duration: 49.58 }); }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
  }

  const createdAudio = [];
  class WindowAudio extends MockAudio {
    constructor(src) { super(src); createdAudio.push(this); }
  }
  const window = {
    Audio: WindowAudio,
    AudioContext: MockAudioContext,
    location: { protocol },
  };
  const context = {
    window,
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }),
    console,
    performance,
    requestAnimationFrame: (callback) => setTimeout(() => callback(performance.now()), 0),
    cancelAnimationFrame: clearTimeout,
  };
  vm.runInNewContext(source, context);
  return { ...window, createdAudio };
}

test('모든 BGM 편집본과 file URL용 반복 파일이 존재한다', () => {
  const { GameBgmTracks } = loadManager();
  for (const [id, track] of Object.entries(GameBgmTracks)) {
    assert.ok(track.loopStart >= 0, `${id} loopStart`);
    assert.ok(fs.existsSync(path.join(root, track.source)), `${id} source`);
    assert.ok(fs.existsSync(path.join(root, track.loopSource)), `${id} loopSource`);
  }
});

test('HTTP에서는 Web Audio가 인트로 뒤 loopStart부터 샘플 단위로 반복한다', async () => {
  const { GameBgmManager } = loadManager();
  const audio = new MockAudio();
  const manager = new GameBgmManager(audio, () => 0.5);
  const played = await manager.play('daily', { fadeIn: 0 });

  assert.equal(played, true);
  assert.equal(manager.backend, 'webaudio');
  assert.equal(manager.sourceNode.started, true);
  assert.equal(manager.sourceNode.loop, true);
  assert.equal(manager.sourceNode.loopStart, 9.25);
  assert.equal(manager.sourceNode.loopEnd, 49.58);
});

test('기본 BGM 전환은 800ms 페이드아웃과 600ms 페이드인을 사용한다', async () => {
  const { GameBgmManager } = loadManager();
  const manager = new GameBgmManager(new MockAudio(), () => 0.5);
  const fades = [];
  manager.fade = async (from, to, duration) => {
    fades.push({ from, to, duration });
    manager.setInternalVolume(to);
  };

  await manager.play('daily');
  await manager.play('mystery');

  assert.deepEqual(fades.map(({ duration }) => duration), [0, 600, 800, 600]);
});

test('file URL에서는 인트로 종료 후 반복 전용 파일로 전환하고 기본 loop를 사용한다', async () => {
  const { GameBgmManager, createdAudio } = loadManager({ protocol: 'file:' });
  const audio = new MockAudio();
  const manager = new GameBgmManager(audio, () => 0.45);
  const played = await manager.play('daily');

  assert.equal(played, true);
  assert.equal(manager.backend, 'html');
  assert.equal(audio.src, 'assets/audio/looped/daily.ogg');
  assert.equal(audio.loop, false);
  assert.equal(createdAudio.length, 1);
  assert.equal(createdAudio[0].src, 'assets/audio/looped/daily-loop.ogg');

  await audio.onended();
  assert.equal(manager.activeFallbackAudio, createdAudio[0]);
  assert.equal(createdAudio[0].loop, true);
  assert.equal(createdAudio[0].playCalls, 1);
});

test('HTML Audio 백엔드는 일시정지 후 같은 반복 음원을 재개한다', async () => {
  const { GameBgmManager } = loadManager({ protocol: 'file:' });
  const manager = new GameBgmManager(new MockAudio(), () => 0.5);
  await manager.play('daily');
  await manager.audio.onended();
  const loopAudio = manager.activeFallbackAudio;

  await manager.pause();
  assert.equal(manager.isPaused(), true);
  assert.equal(loopAudio.paused, true);
  const resumed = await manager.resume();
  assert.equal(resumed, true);
  assert.equal(loopAudio.playCalls, 2);
  assert.equal(manager.isPaused(), false);
});

test('루프 파일을 만들 수 없는 브라우저에서도 끝난 원본을 되감고 다시 재생한다', async () => {
  const { GameBgmManager } = loadManager({ protocol: 'file:' });
  const audio = new MockAudio();
  const manager = new GameBgmManager(audio, () => 0.5);
  manager.createHtmlAudio = () => null;
  await manager.play('daily');
  await audio.onended();

  assert.equal(audio.currentTime, 9.25);
  assert.equal(audio.playCalls, 2);
  assert.equal(manager.isPaused(), false);
});

test('게임 화면은 HTML audio 전체 파일 loop 속성을 사용하지 않는다', () => {
  const titleHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const day1Html = fs.readFileSync(path.join(root, 'game.html'), 'utf8');
  const day2Html = fs.readFileSync(path.join(root, 'day2.html'), 'utf8');

  assert.match(titleHtml, /<audio id="title-bgm" preload="auto" playsinline><\/audio>/);
  assert.match(day1Html, /<audio id="bgm" preload="auto" playsinline><\/audio>/);
  assert.match(day2Html, /<audio id="bgm" preload="auto" playsinline><\/audio>/);
  assert.doesNotMatch(day1Html, /<audio id="bgm"[^>]*\sloop/);
  assert.doesNotMatch(day2Html, /<audio id="bgm"[^>]*\sloop/);
});

test('모든 BGM 진입 페이지는 같은 매니저 캐시 버전을 참조한다', () => {
  const pages = ['index.html', 'game.html', 'day2.html', 'day3.html', 'day4.html', 'bgm-loop-review.html'];
  pages.forEach((page) => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /src="js\/bgm-manager\.js\?v=22"/, page);
  });
});

test('DAY 전환 화면은 기존 BGM을 정지하고 전용 BGM을 재생하지 않는다', () => {
  const { GameBgmTracks, GameBgmManager } = loadManager();
  assert.equal(GameBgmTracks['day-transition'], undefined);
  assert.doesNotMatch(GameBgmManager.prototype.stop.toString(), /this\.play/);
  for (const file of ['game.js', 'day2.js', 'day3.js']) {
    const engine = fs.readFileSync(path.join(root, 'js', file), 'utf8');
    assert.match(engine, /bgmManager\.stop\(\)/, file);
    assert.doesNotMatch(engine, /preload\([^\n]*day-transition/, file);
  }
});

test('BGM 정지는 진행 중인 페이드를 취소하고 오류 없이 무음 상태가 된다', async () => {
  const { GameBgmManager } = loadManager();
  const audio = new MockAudio();
  const manager = new GameBgmManager(audio, () => 0.5);
  await manager.play('daily');

  assert.doesNotThrow(() => manager.stop());
  assert.equal(manager.currentScene, null);
  assert.equal(manager.isPaused(), true);
  assert.equal(audio.src, '');
});

test('설정에서 전달한 0%는 페이드 중에도 모든 BGM 출력에 즉시 적용된다', async () => {
  const { GameBgmManager } = loadManager();
  const audio = new MockAudio();
  const manager = new GameBgmManager(audio, () => 0.5);
  manager.ensureContext();
  manager.fallbackLoopAudio = new MockAudio();
  manager.activeFallbackAudio = new MockAudio();
  manager.setInternalVolume(0.5);

  const fading = manager.fade(0.5, 1, 100, manager.transitionId);
  manager.setVolume(0);
  await fading;

  assert.equal(manager.currentVolume, 0);
  assert.equal(manager.gain.gain.value, 0);
  assert.equal(audio.volume, 0);
  assert.equal(manager.fallbackLoopAudio.volume, 0);
  assert.equal(manager.activeFallbackAudio.volume, 0);
});
