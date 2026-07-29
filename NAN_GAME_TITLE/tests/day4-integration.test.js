"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const story = require("../js/day4-story.js");
const progressStore = require("../js/progress-store.js");

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("DAY 4 장면은 녹음 지원, 증빙 제출, 퇴근 미니게임 순서로 구성된다", () => {
  assert.deepEqual(story.validateScenes(story.scenes), []);
  const ids = story.scenes.map((scene) => scene.id);
  assert.ok(ids.indexOf("day4MoveStudio") < ids.indexOf("day4AuditRequest"));
  assert.ok(ids.indexOf("day4AuditRequest") < ids.indexOf("day4Submit"));
  assert.ok(ids.indexOf("day4Submit") < ids.indexOf("day4Escape"));
  assert.equal(story.scenes.find((scene) => scene.id === "day4Escape").startEscape, true);
});

test("DAY 4 발표 리허설은 역할 배정부터 발표와 질의응답까지 이어진다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  const rehearsalIds = [
    "day4RehearsalSetup",
    "day4RehearsalRole",
    "day4RehearsalScreen",
    "day4RehearsalStart",
    "day4RehearsalOpening",
    "day4RehearsalMetric",
    "day4RehearsalQuestion",
    "day4RehearsalAnswer",
    "day4RehearsalFollowUp",
    "day4RehearsalEvidenceAnswer",
    "day4Rehearsal",
    "day4RehearsalCommit",
  ];
  for (let index = 1; index < rehearsalIds.length; index += 1) {
    assert.ok(ids.indexOf(rehearsalIds[index - 1]) < ids.indexOf(rehearsalIds[index]));
  }
  assert.ok(ids.indexOf("day4RehearsalCommit") < ids.indexOf("day4Submit"));

  const rehearsal = story.scenes.filter((scene) => scene.id.startsWith("day4Rehearsal"));
  assert.equal(rehearsal.every((scene) => scene.bgAssetId === "background.meeting_room.afternoon"), true);
  const dialogue = rehearsal.map((scene) => scene.text).join(" ");
  assert.match(dialogue, /한 번 맞춰 보자/);
  assert.match(dialogue, /평가위원 역할/);
  assert.match(dialogue, /발표 시작하겠습니다/);
  assert.match(dialogue, /18\.4%/);
  assert.match(dialogue, /검증된 근거부터/);
  assert.match(dialogue, /결론부터/);
});

test("DAY 4는 녹음실 내부 대화를 거친 뒤 헤드폰 CG를 보여준다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  assert.ok(ids.indexOf("day4HarinReady") < ids.indexOf("day4StudioArrival"));
  assert.ok(ids.indexOf("day4StudioArrival") < ids.indexOf("day4StudioQuestion"));
  assert.ok(ids.indexOf("day4StudioQuestion") < ids.indexOf("day4StudioAnswer"));
  assert.ok(ids.indexOf("day4StudioAnswer") < ids.indexOf("day4MoveStudio"));
  const arrival = story.scenes.find((scene) => scene.id === "day4StudioArrival");
  const question = story.scenes.find((scene) => scene.id === "day4StudioQuestion");
  const answer = story.scenes.find((scene) => scene.id === "day4StudioAnswer");
  assert.equal(arrival.location, "사내 녹음실 · 부스");
  assert.equal(arrival.bgAssetId, "background.recording_booth.day");
  assert.match(arrival.text, /녹음실은 처음/);
  assert.match(question.text, /오신 적 있으세요/);
  assert.match(answer.text, /이벤트 대사 검수/);
  assert.equal(story.scenes.find((scene) => scene.id === "day4MoveStudio").cgAssetId, "event_cg.day4.harin_headphone_handoff");
  assert.match(read("day4.html"), /src="js\/day4-story\.js\?v=16"/);
});

test("DAY 4 녹음실은 대사 분위기에 맞춰 서하린 표정 세 종류를 사용한다", () => {
  const assetOf = (id) => story.scenes.find((scene) => scene.id === id).characters[0].assetId;
  for (const id of ["day4StudioArrival", "day4StudioQuestion", "day4StudioAnswer", "day4HarinPast", "day4LastTake"]) {
    assert.equal(assetOf(id), "character.harin.relaxed_standing.gentle_smile");
  }
  for (const id of ["day4HeadphoneChoice", "day4MicShare", "day4MicChoice"]) {
    assert.equal(assetOf(id), "character.harin.relaxed_standing.embarrassed");
  }
  assert.equal(assetOf("day4GuideRecording"), "character.harin.relaxed_standing.neutral");
  const resolver = read("js/art-assets.js");
  assert.match(resolver, /"character\.harin\.relaxed_standing\.gentle_smile"/);
  assert.match(resolver, /"character\.harin\.relaxed_standing\.embarrassed"/);
  assert.match(resolver, /"character\.harin\.relaxed_standing\.neutral"/);
});

test("DAY 4 긴급 녹음 도입은 마감 시각·업무 리스크·역할 분담을 대사로 전달한다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  assert.ok(ids.indexOf("day4BossCall") < ids.indexOf("day4RoleAssign"));
  assert.ok(ids.indexOf("day4RoleAssign") < ids.indexOf("day4PtConcern"));
  assert.ok(ids.indexOf("day4PtConcern") < ids.indexOf("day4BossDeadline"));
  assert.ok(ids.indexOf("day4BossDeadline") < ids.indexOf("day4HarinReady"));
  const intro = story.scenes.slice(ids.indexOf("day4BossCall"), ids.indexOf("day4MoveStudio"));
  const dialogue = intro.map((scene) => scene.text).join(" ");
  assert.match(dialogue, /9시 30분/);
  assert.match(dialogue, /9시 20분/);
  assert.match(dialogue, /다음 예약까지 기다려야/);
  assert.match(dialogue, /원고와 게임 용어/);
  assert.match(dialogue, /테이크 번호와 수정 요청/);
});

test("DAY 4 긴급 녹음 도입은 첫 대사에서만 짧은 긴박 연출을 사용한다", () => {
  const urgentIds = story.scenes.filter((scene) => scene.urgent).map((scene) => scene.id);
  assert.deepEqual(urgentIds, ["day4BossCall"]);
  const html = read("day4.html");
  const engine = read("js/day4.js");
  const style = read("css/day4.css");
  assert.match(html, /href="css\/day4\.css\?v=3"/);
  assert.match(engine, /stage\.classList\.remove\("urgent-scene"\)/);
  assert.match(engine, /if \(scene\.urgent\)/);
  assert.match(engine, /stage\.classList\.add\("urgent-scene"\)/);
  assert.match(engine, /stage\.classList\.toggle\("urgent-impact", scene\.urgent === "strong"\)/);
  assert.match(style, /@keyframes day4-urgent-screen-shake/);
  assert.match(style, /@keyframes day4-urgent-screen-shake-strong/);
  assert.doesNotMatch(style, /linear-gradient\(90deg/);
  assert.match(style, /@keyframes day4-urgent-dialogue-in/);
  assert.match(style, /@keyframes day4-urgent-clock/);
  assert.match(style, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(style, /\.reduce-effects \.stage\.urgent-scene/);
});

test("DAY 4 첫 긴급 지시에는 승인된 박태식 스프라이트가 등장한다", () => {
  const bossCall = story.scenes.find((scene) => scene.id === "day4BossCall");
  const bossDeadline = story.scenes.find((scene) => scene.id === "day4BossDeadline");
  assert.equal(bossCall.urgent, "strong");
  assert.equal(bossDeadline.urgent, undefined);
  assert.deepEqual(bossCall.characters, [{ id: "boss", assetId: "character.boss.holding_cup.concerned", position: "right" }]);
  assert.deepEqual(bossDeadline.characters, [{ assetId: "character.boss.holding_cup.concerned", position: "right" }]);
  const engine = read("js/day4.js");
  const style = read("css/day4.css");
  assert.match(engine, /image\.classList\.toggle\("boss-urgent", characterId === "boss"\)/);
  assert.match(style, /@keyframes day4-boss-urgent-enter/);
});

test("DAY 4 대화 장면은 현장에 남아 있는 상대 캐릭터를 유지한다", () => {
  for (const id of [
    "day4RoleAssign",
    "day4PtConcern",
    "day4BossDeadline",
    "day4HarinReady",
    "day4HeadphoneChoice",
    "day4GuideRecording",
    "day4MicShare",
    "day4HarinPast",
    "day4LastTake",
    "day4EvidenceBrief",
    "day4EvidenceChoice",
    "day4Rehearsal",
    "day4LeaveLead",
    "day4EscapeResult",
  ]) {
    assert.ok(story.scenes.find((scene) => scene.id === id).characters?.length, `${id} should keep a character visible`);
  }
});

test("DAY 4 캐릭터는 이전 DAY와 같은 실제 키 비율로 크기를 보정한다", () => {
  const engine = read("js/day4.js");
  const html = read("day4.html");
  assert.match(engine, /harin: Object\.freeze\(\{ name: "서하린", heightCm: 165 \}\)/);
  assert.match(engine, /boss: Object\.freeze\(\{ name: "박태식", heightCm: 176 \}\)/);
  assert.match(engine, /DAY4_CHARACTER_STAGE_HEIGHT \* \(profile\.heightCm \/ DAY4_CHARACTER_BASE_HEIGHT\)/);
  assert.match(engine, /image\.style\.setProperty\("--sprite-height", `\$\{spriteHeight\}cqh`\)/);
  assert.match(html, /src="js\/day4\.js\?v=17"/);
});

test("DAY 4는 캐릭터 ID가 생략돼도 현재 화자인 서하린을 불투명하게 표시한다", () => {
  const engine = read("js/day4.js");
  const harinScenes = story.scenes.filter((scene) => scene.speaker === "서하린"
    && scene.characters?.some((entry) => entry.assetId.includes("harin")));
  assert.ok(harinScenes.length >= 6);
  assert.match(engine, /function characterIdFromAsset\(entry = \{\}\)/);
  assert.match(engine, /function characterIdFromSpeaker\(speaker = ""\)/);
  assert.match(engine, /const visibleCharacterIds = characters\.map\(characterIdFromAsset\)/);
  assert.match(engine, /visibleCharacterIds\.includes\(speakerCharacter\) \? speakerCharacter : ""/);
  assert.match(engine, /characterId === active \? "speaking" : "listening"/);
});

test("DAY 4 선택지는 오전 관계·업무 선택과 오후 증빙 우선순위를 제공한다", () => {
  for (const id of ["day4HeadphoneChoice", "day4MicChoice", "day4EvidenceChoice"]) {
    const scene = story.scenes.find((item) => item.id === id);
    assert.equal(scene.choices.length, 3);
    assert.equal(scene.choices.every((choice) => choice.id && choice.text && choice.delta), true);
  }
});

test("DAY 4 선택지는 겹치지 않는 행동과 한글 능력치 태그를 사용한다", () => {
  const headphone = story.scenes.find((scene) => scene.id === "day4HeadphoneChoice");
  const engine = read("js/day4.js");
  const style = read("css/game.css");
  assert.deepEqual(headphone.choices.map((choice) => choice.id), ["matchPace", "yieldHeadphone", "untangleTogether"]);
  assert.match(headphone.text, /어깨가 가까워졌다/);
  assert.match(headphone.choices[0].text, /선이 짧네요/);
  assert.match(headphone.choices[1].text, /음량 표시/);
  assert.match(headphone.choices[2].text, /팀워크가 필요한 일/);
  assert.doesNotMatch(headphone.choices.map((choice) => choice.text).join(" "), /헤드폰을 잠시 넘기|엉킨 헤드폰 선/);
  assert.ok(headphone.choices.every((choice) => choice.replySpeaker === "서하린"));
  assert.ok(headphone.choices.every((choice) => !choice.reply.includes("하린은")));
  assert.match(engine, /const replySpeaker = choice\.replySpeaker \|\| scene\.replySpeaker \|\| scene\.speaker/);
  assert.match(engine, /image\.classList\.toggle\("speaking", speaking\)/);
  assert.match(engine, /image\.classList\.toggle\("listening", !speaking\)/);
  assert.match(engine, /work: "◆ 업무력"/);
  assert.match(engine, /affection: "♡ 호감도"/);
  assert.match(engine, /trust: "◇ 신뢰도"/);
  assert.match(engine, /filter\(\(\[key, value\]\) => STAT_LABELS\[key\] && value !== 0\)/);
  assert.match(engine, /stat-\$\{key\}/);
  assert.match(style, /\.stat-work/);
  assert.match(style, /\.stat-affection/);
  assert.match(style, /\.stat-trust/);
});

test("DAY 4 선택 결과 대사는 능력치 수치를 중복 표기하지 않는다", () => {
  const engine = read("js/day4.js");
  assert.match(engine, /\$\("#dialogue"\)\.textContent = choice\.reply/);
  assert.doesNotMatch(engine, /changes\.map\(\(key\) =>/);
});

test("공용 능력치 카드는 업무력·호감도·신뢰도를 서로 다른 일러스트로 구분한다", () => {
  const style = read("css/game.css");
  assert.match(style, /nth-child\(1\).*--stat-accent:#4d8fc2/);
  assert.match(style, /nth-child\(2\).*--stat-accent:#df617d/);
  assert.match(style, /nth-child\(3\).*--stat-accent:#b58a42/);
  assert.match(style, /nth-child\(1\) i:before\{content:"▤"\}/);
  assert.match(style, /nth-child\(2\) i:before\{content:"♥"\}/);
  assert.match(style, /nth-child\(3\) i:before\{content:"◈"\}/);
});

test("DAY 4 핵심 기록은 안정적인 단서 ID와 정상 제출 수치를 가진다", () => {
  assert.deepEqual(Object.keys(story.CLUES).sort(), ["auditRequest", "evidenceSubmission", "verifiedRetention"]);
  assert.equal(Object.values(story.CLUES).every((clue) => clue.day === 4), true);
  const submission = story.scenes.find((scene) => scene.id === "day4Submit");
  assert.match(submission.system.rows.join(" "), /18\.4%/);
  assert.match(submission.system.rows.join(" "), /DAY 4 17:08/);
});

test("DAY 4 페이지는 스토리와 추격 미니게임을 엔진 전에 불러온다", () => {
  const html = read("day4.html");
  const storyIndex = html.indexOf('src="js/day4-story.js');
  const minigameIndex = html.indexOf('src="js/office-escape-minigame.js');
  const engineIndex = html.indexOf('src="js/day4.js');
  assert.ok(storyIndex >= 0 && storyIndex < minigameIndex && minigameIndex < engineIndex);
  assert.match(html, /office-escape-minigame\.css\?v=4/);
});

test("모든 DAY 자료 화면은 공용 PPT형 슬라이드 스타일을 사용한다", () => {
  for (const file of ["game.html", "day2.html", "day3.html", "day4.html"]) {
    const html = read(file);
    assert.match(html, /presentation-screen\.css\?v=2/);
    assert.match(html, /presentation-screen\.js\?v=1/);
  }
  const css = read("css/presentation-screen.css");
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /INTERNAL PRESENTATION/);
  assert.match(css, /\.system-panel\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.system-panel\.show\s*\{\s*display:\s*block/);
  assert.match(css, /\.system-panel\s*\{[^}]*position:\s*absolute[^}]*left:\s*50%/s);
  assert.match(css, /\.stage\.system-panel-active \.choice-result\s*\{\s*display:\s*none/);
  assert.match(css, /@keyframes presentation-screen-in/);
  assert.match(css, /@keyframes presentation-card-in/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\[data-variant="metric"\]/);
  assert.match(css, /\[data-variant="compare"\]/);
  assert.match(css, /\[data-variant="timeline"\]/);
  assert.match(css, /\[data-variant="flow"\]/);
  const renderer = read("js/presentation-screen.js");
  assert.match(renderer, /function variantFor/);
  assert.match(renderer, /PresentationScreen/);
});

test("DAY 4는 모든 장면에 승인된 배경·캐릭터·CG를 적용한다", () => {
  const html = read("day4.html");
  const engine = read("js/day4.js");
  assert.match(html, /class="game" id="game"/);
  assert.match(html, /class="stage" id="stage"/);
  assert.match(html, /class="messenger" id="messenger"/);
  assert.match(html, /class="messenger-appbar"/);
  assert.match(html, /data-tab="messages-view"/);
  assert.match(html, /data-tab="clues-view"/);
  assert.match(html, /href="css\/game\.css\?v=28"/);
  assert.match(html, /src="js\/art-assets\.js\?v=11"/);
  assert.match(engine, /ArtAssets\.resolve\(scene\.bgAssetId\)/);
  assert.match(engine, /ArtAssets\.resolve\(entry\.assetId\)/);
  assert.match(engine, /ArtAssets\.resolve\(scene\.cgAssetId\)/);
  assert.match(engine, /stage\.classList\.add\("cg-active"\)/);
  assert.match(engine, /const showPlaceholder = !hasBackground && !scene\.system/);
  const referencedIds = story.scenes.flatMap((scene) => [
    scene.bgAssetId,
    scene.cgAssetId,
    ...(scene.characters || []).map((entry) => entry.assetId),
  ]).filter(Boolean);
  assert.deepEqual([...new Set(referencedIds)].sort(), [
    "background.elevator_lobby.night",
    "background.meeting_room.afternoon",
    "background.office.day",
    "background.office.evening",
    "background.recording_booth.day",
    "character.boss.holding_cup.concerned",
    "character.harin.arms_folded.concerned",
    "character.harin.relaxed_standing.embarrassed",
    "character.harin.relaxed_standing.gentle_smile",
    "character.harin.relaxed_standing.neutral",
    "event_cg.day4.harin_headphone_handoff",
  ]);
  const placeholders = story.scenes.filter((scene) => !scene.bgAssetId && !scene.system);
  assert.deepEqual(placeholders.map((scene) => scene.id), []);
  assert.equal(story.scenes.find((scene) => scene.id === "day4Rehearsal").bgAssetId, "background.meeting_room.afternoon");
});

test("DAY 4 저장은 이전 날짜 완료 상태와 시작 스냅샷을 보존한다", () => {
  const storage = memoryStorage();
  progressStore.startNewGame(storage);
  const started = progressStore.startDay4(storage);
  assert.equal(started.currentDay, 4);
  assert.equal(started.days[1].complete, true);
  assert.equal(started.days[2].complete, true);
  assert.equal(started.days[3].complete, true);
  assert.ok(started.day4StartSnapshot);
  assert.equal(started.days[4].sceneId, "day4Intro");
});

test("DAY 4는 공용 슬롯 UI로 진행을 저장하고 불러온다", () => {
  const html = read("day4.html");
  const engine = read("js/day4.js");
  assert.match(html, /id="save"/);
  assert.match(html, /id="load"/);
  assert.match(html, /id="game-save-modal"/);
  assert.match(html, /id="game-save-list"/);
  assert.match(engine, /GameProgress\.getSaveSlots\(localStorage\)/);
  assert.match(engine, /GameProgress\.saveManualSlot\(localStorage/);
  assert.match(engine, /openGameSave\("save"\)/);
  assert.match(engine, /openGameSave\("load"\)/);
  assert.match(engine, /localStorage\.setItem\(GameProgress\.STORAGE_KEY/);
  assert.match(engine, /openLoad: \(\) => openGameSave\("load"\)/);
});

test("DAY 4는 이전 DAY의 공용 게임 기능을 모두 연결한다", () => {
  const html = read("day4.html");
  const engine = read("js/day4.js");
  for (const id of ["choice-result", "sound-prompt", "message-sfx", "stat-help-popover", "day-summary", "day-complete"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /location-transition\.css\?v=2/);
  assert.match(html, /location-transition\.js\?v=2/);
  assert.match(engine, /GameLocationTransition\.install\(\)/);
  assert.match(engine, /playIfChanged\(/);
  assert.match(engine, /showChoiceResult\(/);
  assert.match(engine, /openChat\(roomId\)/);
  assert.match(engine, /openStatHelp\(button\)/);
  assert.match(engine, /toggleBgm/);
  assert.match(engine, /autoSaveAtCheckpoint\(scene\)/);
  assert.match(engine, /showDaySummary\(\)/);
  assert.match(engine, /hasBlockingUi\(\)/);
});

test("퇴근 미니게임은 방향키·Space·뒤따르는 부장 충돌 판정을 사용한다", () => {
  const script = read("js/office-escape-minigame.js");
  const style = read("css/office-escape-minigame.css");
  assert.match(script, /ArrowLeft/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /Space/);
  assert.match(script, /state\.bossX \+=/);
  assert.match(script, /state\.bossX \+ 42 >= state\.playerX/);
  assert.match(script, /grade = caught \? "caught" : elapsed <= 20 \? "perfect" : "close"/);
  assert.match(script, /type: "chair"/);
  assert.match(script, /oe-office-backdrop/);
  assert.match(script, /oe-progress-bar/);
  assert.match(style, /\.oe-chair:before/);
  assert.match(style, /\.oe-printer:before/);
  assert.match(style, /\.oe-office-desks/);
});

test("DAY 3 완료 화면에서 DAY 4를 시작할 수 있다", () => {
  const html = read("day3.html");
  const engine = read("js/day3.js");
  assert.doesNotMatch(html, /id="day-complete-next"[^>]*disabled/);
  assert.match(html, /id="day-transition"/);
  assert.match(html, /<p>DAY 4<\/p><strong>발표 전날<\/strong>/);
  assert.match(engine, /GameProgress\.startDay4\(localStorage\)/);
  assert.match(engine, /refs\.dayComplete\.classList\.remove\("show"\)/);
  assert.match(engine, /refs\.dayTransition\.classList\.add\("show"\)/);
  assert.match(engine, /bgmManager\.stop\(\{ fadeOut: 220 \}\)/);
  assert.match(engine, /setTimeout\(\(\) => \{ location\.href = "day4\.html\?new=1"; \}, 2200\)/);
  assert.match(read("js/title-screen.js"), /Number\(slot\.day\) === 4 \? "day4\.html"/);
});
