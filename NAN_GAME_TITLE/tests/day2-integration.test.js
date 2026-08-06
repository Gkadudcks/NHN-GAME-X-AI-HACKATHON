const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("DAY 2는 개인 메시지 미니게임을 사용한다", () => {
  const script = read("js/day2.js");
  const html = read("day2.html");

  assert.match(script, /SecretChatMinigame\.start\(\{ onComplete: finishSecretChat, affection: state\.affection \}\)/);
  assert.doesNotMatch(script, /WorkAlertMinigame/);
    assert.match(html, /minigames\/day2-secret-chat\/style\.css\?v=10/);
    assert.match(html, /ui-sfx\.js\?v=13/);
    assert.match(html, /minigames\/day2-secret-chat\/index\.js\?v=15/);
  assert.match(html, /day2\.js\?v=55/);
});

test("비밀 채팅 완벽 등급은 경고 1회까지 허용하고 기준을 안내한다", () => {
  const core = require(path.join(root, "minigames/day2-secret-chat/index.js"));
  assert.deepEqual(core.grade({ sent: 3, warnings: 0, elapsed: 40 }), { grade: "perfect", workDelta: 0, affectionDelta: 2 });
  assert.deepEqual(core.grade({ sent: 3, warnings: 1, elapsed: 45 }), { grade: "perfect", workDelta: 0, affectionDelta: 2 });
  assert.deepEqual(core.grade({ sent: 3, warnings: 2, elapsed: 40 }), { grade: "good", workDelta: 0, affectionDelta: 1 });
  assert.deepEqual(core.grade({ sent: 3, warnings: 0, elapsed: 46 }), { grade: "good", workDelta: 0, affectionDelta: 1 });
  const script = read("minigames/day2-secret-chat/index.js");
  assert.match(script, /경고 1회 이하로 메시지 3개를 45초 안에 모두 보내면 호감도가 가장 많이 오릅니다/);
});

test("DAY 1의 이웃 대화는 DAY 2 아침 인사로 자연스럽게 이어진다", () => {
  const script = read("js/day2.js");
  assert.match(script, /"neighbor-joke": "어제는 아침에 먼저 인사하는 것부터 해보자고 하셨죠\. 좋은 아침입니다, 선배\."/);
  assert.match(script, /"neighbor-joke": "좋은 아침이네요, 도윤 씨\."/);
  assert.doesNotMatch(script, /사수와 이웃을 구분하는 기준이 지각입니까/);
});

test("DAY 2 개인 메시지 직행 모드는 메모리 진행을 사용하고 저장을 막은 뒤 반복한다", () => {
  const script = read("js/day2.js");
  const finishStart = script.indexOf("function finishSecretChat");
  const finishEnd = script.indexOf("function startSecretChat", finishStart);

  assert.match(script, /const devSecretChat = pageParams\.get\("dev"\) === "secret-chat"/);
  assert.match(script, /let progress = devSecretChat\s*\? GameProgress\.defaultProgress\(\)/);
  assert.match(script, /devSecretChat\s*\? scenes\.findIndex\(\(scene\) => scene\.id === "day2RequestGame"\)/);
  assert.match(script, /function saveProgress\([^)]*\) \{\s*if \(devSecretChat\) return;/);
  assert.match(script, /function autoSaveAtCheckpoint\(scene\) \{\s*if \(devSecretChat\) return;/);
  assert.match(script, /function saveToGameSlot\([^)]*\) \{\s*if \(devSecretChat\)/);
  assert.match(script, /function loadFromGameSlot\(slot\) \{\s*if \(devSecretChat\) return;/);
  assert.notEqual(finishStart, -1);
  assert.notEqual(finishEnd, -1);
  assert.match(script.slice(finishStart, finishEnd), /if \(devSecretChat\) \{\s*startSecretChat\(\);\s*return;/);
});

test("DAY 2 retains the existing skip-minigames GOOD completion path", () => {
  const script = read("js/day2.js");
  const start = script.indexOf("function startSecretChat");
  const end = script.indexOf("function summaryRow", start);

  assert.match(script, /const devSkipMinigames = pageParams\.get\("dev"\) === "skip-minigames"/);
  assert.match(script.slice(start, end), /if \(devSkipMinigames\)[\s\S]*grade: "good"/);
  assert.match(script.slice(start, end), /affectionDelta:\s*1[\s\S]*sent:\s*3[\s\S]*warnings:\s*1/);
});

test("DAY 2 개인 메시지 결과는 업무력과 호감도 및 직후 대사에 반영된다", () => {
  const script = read("js/day2.js");
  const finishStart = script.indexOf("function finishSecretChat");
  const finishEnd = script.indexOf("function startSecretChat", finishStart);
  const finish = script.slice(finishStart, finishEnd);

  assert.match(finish, /state\.work \+= result\.workDelta/);
  assert.match(finish, /state\.affection \+= result\.affectionDelta \|\| 0/);
  assert.match(script, /SecretChatMinigameCore\.reply\(grade, affectionBeforeChat\)/);
  assert.match(script, /caught:\s*"다음에는 점심시간까지 기다리겠습니다\."/);
  assert.match(script, /Number\.isFinite\(result\.sent\)[\s\S]*migrated: true/);
});

test("DAY 2 페이지는 필요한 스크립트를 올바른 순서로 불러온다", () => {
  const html = read("day2.html");
  const records = html.indexOf('src="js/clue-records.js');
  const progress = html.indexOf('src="js/progress-store.js');
  const clues = html.indexOf('src="js/clue-mindmap.js');
  const art = html.indexOf('src="js/art-assets.js');
  const story = html.indexOf('src="js/day2-story.js');
  const bgm = html.indexOf('src="js/bgm-manager.js');
  const minigame = html.indexOf('src="minigames/day2-secret-chat/index.js');
  const engine = html.indexOf('src="js/day2.js');
  assert.equal([records, progress, clues, art, story, bgm, minigame, engine].every((index) => index >= 0), true);
  assert.equal(records < progress && progress < art && art < story && story < clues && clues < bgm && bgm < minigame && minigame < engine, true);
});

test("DAY 2 직접 시작은 DAY 1 메시지를 즉시 보여주고 DAY 2 메시지는 장면 진행으로 제한한다", () => {
  const day2Html = read("day2.html");
  const day3Html = read("day3.html");
  const engine = read("js/day2.js");

  assert.match(day2Html, /id="chat-boss"[^>]+data-room="boss"/);
  assert.match(day3Html, /id="chat-boss"[^>]+data-room="boss"/);
  assert.match(engine, /messageDay\(message\) < 2 \|\| isAtOrAfter\(message\.at\)/);
  assert.match(engine, /messageDayDivider/);
});

test("두 날짜 모두 단서 탭에서 메신저 숫자 배지를 표시할 수 있다", () => {
  const day1Html = read("game.html");
  const day2Html = read("day2.html");
  const day1Script = read("js/game.js");
  const day2Script = read("js/day2.js");

  assert.match(day1Html, /id="message-new"/);
  assert.match(day2Html, /id="message-new"/);
  assert.match(day1Script, /renderMessageTabAlert/);
  assert.match(day2Script, /renderMessageTabAlert/);
  assert.match(day1Script, /unreadCount/);
  assert.match(day2Script, /unreadCount/);
  assert.match(day1Script, /clearUnread/);
  assert.match(day2Script, /clearUnread/);
  assert.doesNotMatch(day1Script, /setTab\('messages-view'\);render\(\)/);
  assert.doesNotMatch(day2Script, /setTab\("messages-view"\);\s*saveProgress/);
});

test("읽지 않은 메시지가 0개면 배지를 숨기고 탭은 작게, 내부 본문은 크게 표시한다", () => {
  const css = read("css/game.css");
  assert.match(css, /\.chat-meta em\[hidden\]\{display:none\}/);
  assert.match(css, /\.messenger-tabs button\{padding:0 28px;font-size:13px\}/);
  assert.match(css, /\.message p\{font-size:14px;line-height:1\.6\}/);
  assert.match(css, /\.clue-detail-orbit p\{max-height:82px;overflow:hidden;font-size:13px/);
  assert.match(css, /\.clue-inspector p\{[^}]*font-size:14px[^}]*line-height:1\.7/);
});

test("윤세아 런타임 ID는 manifest의 활성 파일과 일치한다", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "..", "assets", "art", "manifests", "art-assets.json"), "utf8"));
  const runtime = require("../js/art-assets.js");
  const asset = manifest.assets.find((entry) => entry.id === "character.sea.neutral_standing.gentle_smile");
  const version = asset.versions.find((entry) => entry.version === asset.active_version);
  const runtimePath = runtime.resolve(asset.id).replace(/^\.\.\//, "");

  assert.equal(runtimePath, version.path);
  assert.equal(fs.existsSync(path.resolve(root, runtime.resolve(asset.id))), true);
  assert.match(read("js/day2.js"), /assetId: "character\.sea\.neutral_standing\.gentle_smile"/);
});

test("DAY 2 엔진이 참조하는 정적 ID가 페이지에 존재한다", () => {
  const html = read("day2.html");
  const script = read("js/day2.js");
  const ids = [...script.matchAll(/\$\("#([a-z0-9-]+)"\)/gi)].map((match) => match[1]);
  const missing = [...new Set(ids)].filter((id) => !html.includes(`id="${id}"`));
  assert.deepEqual(missing, []);
});

test("DAY 1·2 런타임의 서하린 팀 채팅과 동적 대사는 해요체를 유지한다", () => {
  const day1Script = read("js/game.js");
  const day2Script = read("js/day2.js");

  assert.match(day1Script, /v0\.1 확인했어요\. 방향은 괜찮아요\. 파일 버전 이름은 계속 유지해 주세요\./);
  assert.doesNotMatch(day1Script, /v0\.1 확인했어요\. 방향은 괜찮습니다\./);
  assert.match(day2Script, /오늘도 혼자 하겠다고 하면 오전 일정은 전부 제 자리에서 진행할 거예요\./);
  assert.doesNotMatch(day2Script, /오전 일정 전부 제 자리에서 진행할 겁니다\./);
});

test("DAY 1 종료는 공유 진행을 저장하고 DAY 2로 이동한다", () => {
  const html = read("game.html");
  const script = read("js/game.js");
  assert.match(html, /progress-store\.js/);
  assert.match(script, /syncCanonicalProgress\(true\)/);
  assert.match(script, /GameProgress\.startDay2/);
  assert.match(script, /day2\.html\?new=1/);
});

test("타이틀 이어하기는 선택한 수동 슬롯의 진행과 날짜를 복원한다", () => {
  const html = read("index.html");
  const script = read("js/title-screen.js");
  assert.match(html, /progress-store\.js/);
  assert.match(read("js/progress-store.js"), /nan-save-slot-/);
  assert.match(script, /GameProgress\.getSaveSlots/);
  assert.match(script, /GameProgress\.STORAGE_KEY/);
  assert.match(script, /GameProgress\.LEGACY_DAY1_KEY/);
  assert.match(script, /day2\.html/);
  assert.match(script, /resumeUrl/);
  assert.match(script, /if \(!confirm\(`SLOT \$\{String\(slot\.slotId\)\.padStart\(2, "0"\)\}의 진행을 불러올까요\?\\n현재 저장하지 않은 진행은 사라집니다\.`\)\) return/);
  assert.match(
    script,
    /button\.addEventListener\("click", \(\) => \{\s*if \(!confirm\([^]*?\)\) return;\s*if \(slot\.progress\) localStorage\.setItem\(GameProgress\.STORAGE_KEY/
  );
});

test("DAY 종료 화면은 다음 날과 메인 메뉴 선택지를 제공한다", () => {
  const day1 = read("game.html");
  const day2 = read("day2.html");
  for (const html of [day1, day2]) {
    assert.match(html, /id="day-complete-next"/);
    assert.match(html, /id="day-complete-menu"/);
    assert.match(html, /id="day-transition"/);
  }
  assert.match(read("js/game.js"), /function goToNextDay\(\)/);
  assert.match(read("js/game.js"), /day2\.html\?new=1/);
});

test("DAY 2 BGM은 실제 루프 편집본을 사용한다", () => {
  const day2 = read("js/day2.js");
  const manager = read("js/bgm-manager.js");
  const script = manager;
  for (const track of ["minigame", "harin", "overtime", "mystery"]) {
    assert.match(manager, new RegExp(`audio/looped/${track}\\.ogg`));
  }
  assert.match(manager, /audio\/looped\/daily\.ogg/);
  assert.match(day2, /new GameBgmManager/);
  assert.doesNotMatch(script, /audio\/(?:2\. 일상|3\. 서하린과의 일상|4\. 야근|5\. 추리|MiniGame-theme)\.mp3/);
});

test("게임 화면은 재시작 대신 별도 진행 저장 영역을 제공한다", () => {
  for (const page of ["game.html", "day2.html"]) {
    const html = read(page);
    assert.match(html, /class="save-progress-panel"/);
    assert.match(html, /id="save"/);
    assert.match(html, /id="load"/);
    assert.doesNotMatch(html, /id="restart"/);
  }
});

test("진행 저장은 이어하기와 연동되는 카드형 슬롯을 연다", () => {
  for (const page of ["game.html", "day2.html"]) {
    const html = read(page);
    assert.match(html, /id="game-save-modal"/);
    assert.match(html, /id="game-save-list"/);
  }
  assert.match(read("js/game.js"), /function openGameSave\(mode='save'\)/);
  assert.match(read("js/day2.js"), /function openGameSave\(mode = "save"\)/);
  assert.match(read("js/game.js"), /GameProgress\.getSaveSlots/);
  assert.match(read("js/day2.js"), /GameProgress\.getSaveSlots/);
  assert.match(read("js/title-screen.js"), /slot\.progress/);
});

test("게임 안에서도 수동 저장 슬롯을 불러올 수 있다", () => {
  for (const scriptName of ["js/game.js", "js/day2.js"]) {
    const script = read(scriptName);
    assert.match(script, /function loadFromGameSlot\(slot\)/);
    assert.match(script, /GameProgress\.STORAGE_KEY/);
    assert.match(script, /GameProgress\.LEGACY_DAY1_KEY/);
    assert.match(script, /openGameSave\(['"]load['"]\)/);
  }
});

test("중간 슬롯을 불러와도 직전 장면의 배경과 BGM을 복원한다", () => {
  for (const scriptName of ["js/game.js", "js/day2.js"]) {
    const script = read(scriptName);
    assert.match(script, /function inheritedSceneValue\(index,\s*key\)/);
    if (scriptName === "js/day2.js") {
      assert.match(script, /for \(let cursor = state\.index; cursor >= 0; cursor -= 1\)/);
      assert.match(script, /candidate\.bgAssetId/);
      assert.match(script, /candidate\.bg && BACKGROUND_SOURCES\[candidate\.bg\]/);
    } else {
      assert.match(script, /inheritedSceneValue\(state\.index,\s*["']bg["']\)/);
    }
    assert.match(script, /inheritedSceneValue\(state\.index,\s*["']bgm["']\)/);
  }
});

test("개인 메시지 미니게임은 현재 호감도를 전달하고 하린의 실시간 답장을 표시한다", () => {
  const script = read("js/day2.js");
  const minigame = read("minigames/day2-secret-chat/index.js");
  const style = read("minigames/day2-secret-chat/style.css");
  assert.match(script, /SecretChatMinigame\.start\(\{ onComplete: finishSecretChat, affection: state\.affection \}\)/);
  assert.match(minigame, /messageReply\(index, state\.affection\)/);
  assert.match(minigame, /서하린의 답장이 도착했습니다/);
  assert.match(minigame, /setTimeout\(finish, 2200\)/);
  assert.match(style, /\.sc-message-received/);
});

test("기존 DAY 2 진행본은 지하철 도입부를 한 번만 다시 시작한다", () => {
  const script = read("js/day2.js");
  assert.match(script, /progress\.currentDay === 2/);
  assert.match(script, /!progress\.days\[2\]\.complete/);
  assert.match(script, /feature:subway-intro-v1/);
  assert.match(script, /progress = GameProgress\.resetDay2\(localStorage\)/);
  assert.match(script, /GameProgress\.save\(localStorage, progress\)/);
});

test("장면 전환은 연속 입력과 모달 뒤쪽 진행을 차단한다", () => {
  const day1 = read("js/game.js");
  const day2 = read("js/day2.js");
  for (const script of [day1, day2]) {
    assert.match(script, /sceneTransitionLocked/);
    assert.match(script, /hasBlockingUi\(\)/);
  }
  assert.match(day1, /preloadSceneImage/);
  assert.match(day1, /if\(!cinematic\)\{refs\.speaker\.textContent=s\.speaker;refs\.dialogue\.textContent=s\.text\}/);
  assert.match(day1, /cinematicTimer=setTimeout\(\(\)=>\{refs\.speaker\.textContent=scene\.speaker;refs\.dialogue\.textContent=scene\.text/);
  const gameCss = read("css/game.css");
  assert.doesNotMatch(gameCss, /cinematic-only \.event-cg\{transition:none\}/);
  assert.match(gameCss, /cinematic-cg-reveal/);
  assert.match(gameCss, /cinematic-only \.event-cg:after/);
});

test("일반 대사 진행은 탭을 바꾸지 않고 지정된 신규 메시지만 메신저로 전환한다", () => {
  assert.doesNotMatch(read("js/game.js"), /setTab\('messages-view'\)/);
  const day2 = read("js/day2.js");
  const focusStart = day2.indexOf("function focusIncomingMessage");
  const focusEnd = day2.indexOf("\n}", focusStart);
  assert.match(day2.slice(focusStart, focusEnd), /setTab\("messages-view"\)/);
  assert.doesNotMatch(day2.slice(focusEnd), /setTab\("messages-view"\)/);
});

test("DAY 2 야근 커피 장면은 승인된 서하린 피곤 스프라이트를 사용한다", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "..", "assets", "art", "manifests", "art-assets.json"), "utf8"));
  const runtime = require("../js/art-assets.js");
  const id = "character.harin.holding_cup.tired";
  const asset = manifest.assets.find((entry) => entry.id === id);
  const version = asset.versions.find((entry) => entry.version === asset.active_version);
  const runtimePath = runtime.resolve(id).replace(/^\.\.\//, "");
  const story = read("js/day2-story.js");

  assert.equal(runtimePath, version.path);
  assert.equal(fs.existsSync(path.resolve(root, runtime.resolve(id))), true);
  assert.match(story, /day2CoffeeHarin[^\n]+character\.harin\.holding_cup\.tired/);
  assert.doesNotMatch(story, /day2CoffeeHarin[^\n]+placeholderCharacter/);
});

test("DAY 2의 서하린 메시지는 도착 애니메이션 뒤 대화방을 열어 읽음 처리한다", () => {
  const engine = read("js/day2.js");
  assert.match(engine, /function focusIncomingMessage\(room, notificationId\)/);
  assert.match(engine, /setTab\("messages-view"\)/);
  assert.match(engine, /openChat\(room\)/);
  assert.match(engine, /focused:\$\{notificationId\}/);
  assert.match(engine, /}, 1750\)/);
  assert.match(engine, /message\.sender === "한도윤" \? " me" : ""/);
  assert.match(engine, /message\.requiresDecision/);
  assert.match(engine, /function resolveMessageText\(message\)/);
  assert.match(engine, /backgroundSource = ArtAssets\.resolve\(candidate\.bgAssetId\)/);
});

test("CG 진입 시 페이드아웃 중인 대화창을 먼저 비우지 않는다", () => {
  for (const file of ["game.js", "day2.js", "day3.js", "day4.js"]) {
    const engine = read(`js/${file}`);
    assert.doesNotMatch(engine, /textContent\s*=\s*cinematic\s*\?\s*["']{2}/, file);
  }
  assert.doesNotMatch(read("js/day4.js"), /function startCinematic[\s\S]*?#dialogue"\)\.textContent\s*=\s*""/);
});

test("CG 전용 구간에는 대화창을 완전히 숨기고 다음 대사에서 복원한다", () => {
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const engine = read(`js/${file}`);
    assert.match(engine, /dialogueCard\.hidden\s*=\s*true/, `${file}: CG 진입 시 숨김`);
    assert.match(engine, /dialogueCard\.hidden\s*=\s*false/, `${file}: CG 연출 후 복원`);
  }

  const day4 = read("js/day4.js");
  assert.match(day4, /dialogue-card"\)\.hidden\s*=\s*true/);
  assert.match(day4, /dialogue-card"\)\.hidden\s*=\s*false/);
});

test("CG 진입에는 PAGE-TURN 효과음을 재생하지 않는다", () => {
  for (const file of ["game.js", "day2.js", "day3.js", "day4.js"]) {
    const engine = read(`js/${file}`);
    const startCinematic = engine.match(/function startCinematic[\s\S]*?\n}/)?.[0] || "";
    assert.doesNotMatch(startCinematic, /UiSfx\.playPageTurn\(\)/, file);
  }
});

test("DAY 종료 후 다음 날 전환 화면에서 PAGE-TURN 효과음을 재생한다", () => {
  for (const file of ["game.js", "day2.js", "day3.js"]) {
    const engine = read(`js/${file}`);
    assert.match(engine, /dayTransition[\s\S]{0,300}UiSfx\.playPageTurn\(\)/, file);
  }
});
