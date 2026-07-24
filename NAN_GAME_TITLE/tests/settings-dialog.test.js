const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const settingsDialog = require("../js/settings-dialog.js");

function createDocument() {
  const properties = new Map();
  const classes = new Map();
  return {
    documentElement: {
      style: { setProperty: (name, value) => properties.set(name, value) },
      classList: { toggle: (name, value) => classes.set(name, value) },
      dataset: {},
    },
    properties,
    classes,
  };
}

test("공용 설정은 즉시 반영 가능한 화면 값을 문서 루트에 적용한다", () => {
  const documentRef = createDocument();
  settingsDialog.applyDocumentSettings({
    masterVolume: 60, bgmVolume: 50, sfxVolume: 40,
    masterMuted: false, bgmMuted: true, sfxMuted: false,
    textSize: 120, dialogueOpacity: 75, reduceEffects: true,
  }, documentRef);

  assert.equal(documentRef.properties.get("--dialogue-text-scale"), 1.2);
  assert.equal(documentRef.properties.get("--dialogue-opacity"), 0.75);
  assert.equal(documentRef.properties.get("--master-volume"), 0.6);
  assert.equal(documentRef.properties.get("--bgm-volume"), 0);
  assert.equal(documentRef.properties.get("--sfx-volume"), 0.4);
  assert.equal(documentRef.classes.get("reduce-effects"), true);
  assert.equal(documentRef.documentElement.dataset.bgmMuted, "true");
});

test("공용 설정과 세 미니게임은 같은 pause/resume 이벤트 계약을 사용한다", () => {
  assert.equal(settingsDialog.isOpen(), false);
  assert.deepEqual(settingsDialog.EVENTS, {
    OPEN: "nan:settings-open",
    CLOSE: "nan:settings-close",
    CHANGE: "nan:settings-change",
  });
  ["coffee-minigame.js", "work-alert-minigame.js", "secret-chat-minigame.js"].forEach((file) => {
    const source = fs.readFileSync(path.join(__dirname, "..", "js", file), "utf8");
    assert.match(source, /function pause\(\)/);
    assert.match(source, /function resume\(\)/);
    assert.match(source, /nan:settings-open/);
    assert.match(source, /nan:settings-close/);
  });
});

test("타이틀은 공용 설정 스타일과 모듈을 불러오며, 미구현 대화 설정은 비활성화한다", () => {
  const title = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const source = fs.readFileSync(path.join(__dirname, "..", "js", "settings-dialog.js"), "utf8");
  assert.match(title, /css\/settings-dialog\.css/);
  assert.match(title, /js\/settings-dialog\.js/);
  assert.match(source, /자동 진행과 글자 출력 속도는 다음 업데이트에서 지원됩니다/);
  assert.match(source, /control\.disabled = true/);
});

test("세 DAY 페이지는 공용 설정을 엔진보다 먼저 불러오고 ESC 우선순위를 연결한다", () => {
  const pages = [
    ["game.html", "js/game.js"],
    ["day2.html", "js/day2.js"],
    ["day3.html", "js/day3.js"],
  ];
  pages.forEach(([page, engine]) => {
    const html = fs.readFileSync(path.join(__dirname, "..", page), "utf8");
    const script = fs.readFileSync(path.join(__dirname, "..", engine), "utf8");
    const store = html.indexOf('src="js/settings-store.js');
    const dialog = html.indexOf('src="js/settings-dialog.js');
    const engineIndex = html.indexOf(`src="${engine}`);
    assert.match(html, /css\/settings-dialog\.css/);
    assert.ok(store >= 0 && store < dialog && dialog < engineIndex);
    assert.match(script, /GameSettingsDialog\.install\(\{/);
    assert.match(script, /closeOverlay:/);
    assert.match(script, /GameSettingsDialog\.isOpen\(\)/);
    assert.match(script, /game-save-modal/);
    assert.match(script, /activeStatHelp/);
  });
});

test("세 DAY 시네마틱은 설정 화면 동안 남은 지연 시간을 보존한다", () => {
  ["game.js", "day2.js", "day3.js"].forEach((file) => {
    const source = fs.readFileSync(path.join(__dirname, "..", "js", file), "utf8");
    assert.match(source, /cinematicDeadline/);
    assert.match(source, /cinematicRemaining/);
    assert.match(source, /function pauseCinematic/);
    assert.match(source, /function resumeCinematic/);
    assert.match(source, /nan:settings-open/);
    assert.match(source, /nan:settings-close/);
  });
});

test("공용 CSS는 대화창과 선택지에 글자 크기 및 투명도 설정을 적용한다", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "game.css"), "utf8");
  assert.match(css, /background:rgba\(255,253,246,var\(--dialogue-opacity,.93\)\)/);
  assert.match(css, /\.dialogue-card p\{[^}]*var\(--dialogue-text-scale,1\)/);
  assert.match(css, /\.stage-choices button\{[^}]*var\(--dialogue-text-scale,1\)/);
});
