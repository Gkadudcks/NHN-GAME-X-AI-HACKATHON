const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'bgm-manager.js'), 'utf8');

function loadManager() {
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
    decodeAudioData() { return Promise.resolve({ duration: 31.75 }); }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
  }

  const window = { AudioContext: MockAudioContext };
  const context = {
    window,
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }),
    console,
    performance,
    requestAnimationFrame: (callback) => setTimeout(() => callback(performance.now()), 0),
    cancelAnimationFrame: clearTimeout,
  };
  vm.runInNewContext(source, context);
  return window;
}

test('모든 BGM 편집본이 존재하고 유효한 루프 시작점을 가진다', () => {
  const { GameBgmTracks } = loadManager();
  for (const [id, track] of Object.entries(GameBgmTracks)) {
    if (id === 'day-transition') continue;
    assert.ok(track.loopStart > 0, `${id} loopStart`);
    assert.ok(fs.existsSync(path.join(root, track.source)), `${id} source`);
  }
});

test('타이틀은 도입부 이후 지점부터 반복 재생한다', async () => {
  const { GameBgmManager } = loadManager();
  const audio = { pause() {}, removeAttribute() {}, load() {}, dataset: {}, volume: 0 };
  const manager = new GameBgmManager(audio, () => 0.5);
  const played = await manager.play('title', { fadeIn: 0 });

  assert.equal(played, true);
  assert.equal(manager.sourceNode.started, true);
  assert.equal(manager.sourceNode.loop, true);
  assert.equal(manager.sourceNode.loopStart, 11.75);
  assert.equal(manager.sourceNode.loopEnd, 31.75);
});

test('타이틀 화면 사운드 구성은 현재 자동재생 방식으로 고정한다', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const titleScript = fs.readFileSync(path.join(root, 'js', 'title-screen.js'), 'utf8');

  assert.match(html, /<audio id="title-bgm" src="assets\/audio\/looped\/title\.ogg" preload="auto" autoplay loop playsinline><\/audio>/);
  assert.match(titleScript, /new GameBgmManager\(titleBgm, getConfiguredBgmVolume, \{ preferHtmlAudio: true \}\)/);
  assert.match(titleScript, /startTitleBgm\(\);/);
  assert.match(titleScript, /document\.addEventListener\("pointerdown", unlockAndStartTitleBgm, \{ once: true \}\)/);
  assert.match(source, /if \(this\.audio && !this\.preferHtmlAudio\)/);
});
