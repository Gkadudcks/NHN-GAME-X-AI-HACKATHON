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
  assert.equal(arrival.bgm, "recordingStudio");
  assert.match(arrival.text, /녹음실은 처음/);
  assert.match(question.text, /오신 적 있으세요/);
  assert.match(answer.text, /이벤트 대사 검수/);
  assert.equal(story.scenes.find((scene) => scene.id === "day4MoveStudio").cgAssetId, "event_cg.day4.harin_headphone_handoff");
  assert.match(read("day4.html"), /src="js\/day4-story\.js\?v=28"/);
});

test("DAY 4는 녹음 부스 내부의 헤드폰 CG에서 장소 이동을 반복하지 않는다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  const inheritedLocation = (index) => {
    for (let cursor = index; cursor >= 0; cursor -= 1) {
      if (story.scenes[cursor].location) return story.scenes[cursor].location;
    }
    return "";
  };
  assert.equal(
    inheritedLocation(ids.indexOf("day4StudioArrival")),
    inheritedLocation(ids.indexOf("day4MoveStudio")),
  );
});

test("DAY 4 녹음실에서 사무실로 돌아올 때 마무리·이동·재개 장면이 이어진다", () => {
  const ids = story.scenes.map((scene) => scene.id);
  const lastTake = ids.indexOf("day4LastTake");
  const wrapUp = ids.indexOf("day4StudioWrapUp");
  const returnWalk = ids.indexOf("day4ReturnWalk");
  const returnPrompt = ids.indexOf("day4ReturnPrompt");
  const doyunReturn = ids.indexOf("day4Return");
  assert.ok(lastTake < wrapUp && wrapUp < returnWalk && returnWalk < returnPrompt && returnPrompt < doyunReturn);
  const returnPromptScene = story.scenes[returnPrompt];
  assert.equal(returnPromptScene.location, "게임사업실 · 오전");
  assert.equal(returnPromptScene.bgm, "mystery");
  assert.equal(story.scenes[doyunReturn].bgm, undefined);
});

test("DAY 4 녹음실은 대사 분위기에 맞춰 서하린 표정 세 종류를 사용한다", () => {
  const assetOf = (id) => story.scenes.find((scene) => scene.id === id).characters[0].assetId;
  for (const id of ["day4StudioArrival", "day4StudioQuestion", "day4StudioAnswer", "day4HarinPast", "day4LastTake"]) {
    assert.equal(assetOf(id), "character.harin.relaxed_standing.gentle_smile");
  }
  for (const id of ["day4HeadphoneChoice", "day4MicSmallTalk", "day4MicChoice"]) {
    assert.equal(assetOf(id), "character.harin.relaxed_standing.embarrassed");
  }
  for (const id of ["day4GuideRecording", "day4MicShare"]) {
    assert.equal(assetOf(id), "character.harin.relaxed_standing.neutral");
  }
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
    "day4SuccessArrival",
    "day4SuccessDinnerInvite",
    "day4SuccessDinnerTalk",
    "day4FailureCaught",
    "day4FailureHarinLeaves",
  ]) {
    assert.ok(story.scenes.find((scene) => scene.id === id).characters?.length, `${id} should keep a character visible`);
  }
});

test("DAY 4 퇴근 반응은 누적 호감도와 탈출 결과를 함께 반영한다", () => {
  const reaction = story.scenes.find((scene) => scene.id === "day4SuccessDinnerTalk");
  const engine = read("js/day4.js");
  assert.equal(reaction.speaker, "서하린");
  assert.equal(reaction.dynamic, "dinnerConversation");
  assert.ok(story.scenes.findIndex((scene) => scene.id === "day4SuccessArrival")
    < story.scenes.findIndex((scene) => scene.id === reaction.id));
  assert.match(engine, /scene\.dynamic === "dinnerConversation"/);
  assert.match(engine, /state\.affection < 2/);
  assert.match(engine, /state\.affection < 4/);
  assert.match(engine, /편하게 같이 저녁 먹어요/);
  for (const id of ["day4StudioAnswer", "day4LastTake", "day4LeaveLead"]) {
    assert.ok(story.scenes.find((scene) => scene.id === id).dynamic);
  }
  assert.match(engine, /affectionTone === "low"/);
  assert.match(engine, /affectionTone === "mid"/);
});

test("DAY 4 미니게임 성공 뒤에는 서하린과 저녁 식사 장면이 이어진다", () => {
  const success = story.scenes.filter((scene) => scene.branch === "success");
  const ids = success.map((scene) => scene.id);
  assert.deepEqual(ids, [
    "day4SuccessArrival",
    "day4SuccessDinnerInvite",
    "day4SuccessDinnerArrival",
    "day4SuccessDinnerTalk",
    "day4SuccessDinnerReply",
    "day4SuccessEnd",
  ]);
  assert.match(success.find((scene) => scene.id === "day4SuccessDinnerInvite").text, /같이 먹고 갈래요/);
  assert.equal(success.find((scene) => scene.id === "day4SuccessDinnerArrival").bgAssetId, "background.bistro.evening");
  assert.equal(success.at(-1).end, true);
});

test("DAY 4 미니게임 실패 뒤에는 서하린이 먼저 퇴근하고 야근 장면이 이어진다", () => {
  const failure = story.scenes.filter((scene) => scene.branch === "failure");
  const ids = failure.map((scene) => scene.id);
  assert.deepEqual(ids, [
    "day4FailureCaught",
    "day4FailureHarinLeaves",
    "day4FailureOvertime",
    "day4FailureMessage",
    "day4FailureReply",
    "day4FailureEnd",
  ]);
  assert.match(failure.find((scene) => scene.id === "day4FailureHarinLeaves").text, /저 먼저 갈게요/);
  assert.equal(failure.find((scene) => scene.id === "day4FailureOvertime").bgAssetId, "background.office.night");
  assert.equal(failure.at(-1).end, true);
});

test("DAY 4 엔진은 미니게임 결과와 일치하는 후속 장면만 진행한다", () => {
  const engine = read("js/day4.js");
  assert.match(engine, /function sceneMatchesBranch\(scene\)/);
  assert.match(engine, /state\.minigameResult\.caught \? "failure" : "success"/);
  assert.match(engine, /function nextSceneIndex\(fromIndex\)/);
  assert.match(engine, /state\.index = nextSceneIndex\(state\.index\)/);
});

test("DAY 4 캐릭터는 이전 DAY와 같은 실제 키 비율로 크기를 보정한다", () => {
  const engine = read("js/day4.js");
  const html = read("day4.html");
  assert.match(engine, /harin: Object\.freeze\(\{ name: "서하린", heightCm: 165 \}\)/);
  assert.match(engine, /boss: Object\.freeze\(\{ name: "박태식", heightCm: 176 \}\)/);
  assert.match(engine, /DAY4_CHARACTER_STAGE_HEIGHT \* \(profile\.heightCm \/ DAY4_CHARACTER_BASE_HEIGHT\)/);
  assert.match(engine, /image\.style\.setProperty\("--sprite-height", `\$\{spriteHeight\}cqh`\)/);
  assert.match(html, /src="js\/day4\.js\?v=36"/);
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

test("DAY 4에서 하린의 사적 대화를 업무 녹음으로 남기려 하면 호감도가 내려간다", () => {
  const scene = story.scenes.find((entry) => entry.id === "day4MicChoice");
  const guide = story.scenes.find((entry) => entry.id === "day4MicShare");
  const smallTalk = story.scenes.find((entry) => entry.id === "day4MicSmallTalk");
  const choice = scene.choices.find((entry) => entry.id === "keepTake");
  assert.equal(choice.delta.affection, -1);
  assert.match(guide.text, /문장 길이와 호흡을 확인/);
  assert.match(smallTalk.text, /생각보다 덜 긴장/);
  assert.ok(story.scenes.indexOf(guide) < story.scenes.indexOf(smallTalk));
  assert.ok(story.scenes.indexOf(smallTalk) < story.scenes.indexOf(scene));
  assert.match(scene.text, /방금 나눈 대화까지 녹음/);
  assert.match(choice.text, /참고용으로 남겨도/);
  assert.match(choice.reply, /동의 없이 사적인 대화를 남기는 건 싫어요/);
  assert.match(scene.choices.find((entry) => entry.id === "checkLevels").text, /새 테이크 번호/);
  assert.match(scene.choices.find((entry) => entry.id === "apologize").text, /의사를 먼저 확인/);
  assert.ok(scene.choices.every((entry) => entry.replySpeaker === "서하린"));
});

test("DAY 4 선택지는 겹치지 않는 행동과 한글 능력치 태그를 사용한다", () => {
  const headphone = story.scenes.find((scene) => scene.id === "day4HeadphoneChoice");
  const engine = read("js/day4.js");
  const style = read("css/game.css");
  assert.deepEqual(headphone.choices.map((choice) => choice.id), ["matchPace", "yieldHeadphone", "untangleTogether"]);
  assert.match(headphone.text, /각자 쓴 헤드폰 선/);
  assert.match(headphone.visual, /각자의 헤드폰/);
  assert.match(headphone.choices[0].text, /괜찮은 거리인지 먼저/);
  assert.match(headphone.choices[1].text, /좌우 채널과 음량부터/);
  assert.match(headphone.choices[2].text, /같은 소리를 나란히/);
  assert.deepEqual(headphone.choices.map((choice) => choice.delta), [
    { trust: 1 },
    { work: 1 },
    { affection: 1 },
  ]);
  assert.doesNotMatch(headphone.choices.map((choice) => choice.text).join(" "), /헤드폰을 잠시 넘기|엉킨 헤드폰 선|한쪽씩 나눠/);
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
  const minigameIndex = html.indexOf('src="minigames/day4-office-escape/index.js');
  const engineIndex = html.indexOf('src="js/day4.js');
  assert.ok(storyIndex >= 0 && storyIndex < minigameIndex && minigameIndex < engineIndex);
  assert.match(html, /day4-office-escape\/style\.css\?v=49/);
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
  assert.match(html, /href="css\/game\.css\?v=47"/);
  assert.match(html, /src="js\/art-assets\.js\?v=18"/);
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
    "background.bistro.evening",
    "background.elevator_lobby.night",
    "background.meeting_room.afternoon",
    "background.office.day",
    "background.office.evening",
    "background.office.night",
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

test("DAY 4 저장 모달은 미니게임 일시정지를 소유하고 키보드 포커스를 가둔다", () => {
  const html = read("day4.html");
  const engine = read("js/day4.js");
  const gameStyle = read("css/game.css");
  const minigameStyle = read("minigames/day4-office-escape/style.css");
  assert.match(html, /css\/game\.css\?v=47/);
  assert.match(engine, /gameSavePauseHeld = true/);
  assert.match(engine, /document\.dispatchEvent\(new CustomEvent\("nan:pause-open"\)\)/);
  assert.match(engine, /document\.dispatchEvent\(new CustomEvent\("nan:pause-close"\)\)/);
  assert.match(engine, /function trapGameSaveFocus\(event\)/);
  assert.match(engine, /if \(trapGameSaveFocus\(event\)\)/);
  assert.match(engine, /#game-save-list button:not\(:disabled\).*#game-save-close/);
  const saveModalLayer = Number(gameStyle.match(/\.game-save-modal\{[^}]*z-index:(\d+)/)?.[1]);
  const escapeLayer = Number(minigameStyle.match(/\.office-escape\s*\{[^}]*z-index:\s*(\d+)/)?.[1]);
  assert.ok(saveModalLayer > escapeLayer);
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

test.skip("V044 퇴근 미니게임의 정적 구현 상세", () => {
  const html = read("day4.html");
  const core = read("minigames/day4-office-escape/core.js");
  const script = read("minigames/day4-office-escape/index.js");
  const style = read("minigames/day4-office-escape/style.css");
  assert.ok(html.indexOf("day4-office-escape/core.js") < html.indexOf("day4-office-escape/index.js"));
  assert.doesNotMatch(script, /ArrowLeft|ArrowRight/);
  assert.match(script, /"Space", "ArrowUp", "KeyW"/);
  assert.match(script, /"ArrowDown", "KeyS"/);
  assert.match(core, /state\.distance = Math\.min\(length, state\.distance \+ speed \* dt\)/);
  assert.match(core, /const JUMP_BUFFER = 0\.15/);
  assert.match(core, /const COYOTE_TIME = 0\.12/);
  assert.match(core, /const SLIDE_MIN_DURATION = 0\.08/);
  assert.match(core, /const GRAVITY = 1800/);
  assert.match(core, /const PLAYER_X_OFFSET = 8/);
  assert.match(core, /const ACTION_LEAD_TIME = Object\.freeze\(\{ jump: 0\.26, slide: 0\.75 \}\)/);
  assert.match(core, /const JUMP_QUEUE_LEAD_TIME = 0\.55/);
  assert.match(core, /const MIN_PREPARE_LEAD_TIME = 1\.25/);
  assert.match(core, /function collisionCueMetrics\(object, speed\)/);
  assert.match(core, /const cuePlayerRight = cuePlayerLeft \+ PLAYER_WIDTH/);
  assert.match(core, /collisionGap: metrics\.entryGap/);
  assert.match(core, /jumpQueueReady: object\.avoid === "jump" && leadTime <= JUMP_QUEUE_LEAD_TIME/);
  assert.match(core, /const GAIT_FRAME_MS = 500/);
  assert.match(core, /const GAIT_PHASE_DELAY_MS = Object\.freeze\(\{ doyun: 0, harin: 150, boss: 300 \}\)/);
  assert.match(core, /function gaitFrameIndex\(elapsedSeconds, delayMs = 0\)/);
  assert.match(core, /speedMultiplier: 0\.95/);
  assert.match(core, /speedMultiplier: 1\.06/);
  assert.match(core, /speedMultiplier: 1\.15/);
  assert.match(core, /function nominalSpeedFor\(progress\)/);
  assert.match(core, /const nominalSpeed = nominalSpeedFor\(progressBefore\)/);
  assert.match(core, /telegraphDistanceFor\(nominalSpeed\)/);
  assert.match(core, /id: "corridor-sign-switch"[^\n]+avoid: "slide"[^\n]+motion: "sway"/);
  assert.match(core, /emit\("avoid", \{ object \}\)/);
  assert.match(core, /function commitJump\(seconds = 0\.42\)/);
  assert.match(core, /function cancelJump\(\)/);
  assert.match(core, /const INVULNERABLE_TIME = 0\.8/);
  assert.match(core, /const PROP_ART_FRAMING = Object\.freeze/);
  assert.match(core, /hitCount <= 2/);
  assert.match(core, /type: "chair"/);
  assert.match(core, /type: "backup-usb"/);
  assert.match(script, /minigame_background\.office_escape\.office/);
  assert.match(script, /minigame_background\.office_escape\.corridor/);
  assert.match(script, /minigame_background\.office_escape\.elevator/);
  assert.match(script, /OfficeEscapeArtAssets\?\.resolve/);
  assert.doesNotMatch(script, /global\.ArtAssets/);
  assert.match(script, /"prop\.office\.chair"/);
  assert.match(script, /"prop\.office\.sign"/);
  assert.match(script, /"minigame_character\.doyun\.run\.right"/);
  assert.match(script, /"minigame_character\.doyun\.run_alt\.right"/);
  assert.match(script, /"minigame_character\.doyun\.jump\.right"/);
  assert.match(script, /"minigame_character\.doyun\.slide\.right"/);
  assert.match(script, /"minigame_character\.harin\.run\.right"/);
  assert.match(script, /"minigame_character\.harin\.run_alt\.right"/);
  assert.match(script, /"minigame_character\.boss\.chase\.right"/);
  assert.match(script, /"minigame_character\.boss\.chase_alt\.right"/);
  assert.match(script, /const GAIT_PHASE_DELAY_MS = Core\.GAIT_PHASE_DELAY_MS/);
  assert.match(script, /const GAIT_EMPHASIS_MS = 70/);
  assert.match(script, /const SLIDE_FEEDBACK_MS = 320/);
  assert.match(script, /const ACCESSIBLE_JUMP_MS = 420/);
  assert.match(script, /const ACCESSIBLE_SLIDE_MS = 80/);
  assert.match(script, /const ARRIVAL_MS = 750/);
  assert.match(script, /const PLAYER_MOTION_FX_MS = 240/);
  assert.match(script, /const ZONE_ENTRY_LABELS = Object\.freeze/);
  assert.match(script, /function currentPlaceLabel\(snapshot, compact = false\)/);
  assert.match(script, /refs\.currentZone\.textContent = currentPlaceLabel\(snapshot, global\.innerWidth <= 1020\)/);
  assert.match(script, /refs\.currentZone\.setAttribute\("aria-label", `현재 장소: \$\{fullPlaceLabel\}`\)/);
  assert.match(script, /const CUE_JUMP_COMMIT_SECONDS = ACCESSIBLE_JUMP_MS \/ 1000/);
  assert.match(script, /const TUTORIAL_JUMP_ACCEPT_LEAD = 0\.9/);
  assert.match(script, /const TUTORIAL_TAP_IDS = Object\.freeze\(\{ jump: "chair-tutorial", slide: "drawer-tutorial" \}\)/);
  assert.match(script, /function gaitArtId\(baseId, altId, snapshot, delayMs = 0\)/);
  assert.match(script, /Core\.gaitFrameIndex\(snapshot\?\.elapsed, delayMs\)/);
  assert.match(script, /function hasGaitArt\(altId\)\s*\{\s*return !prefersReducedMotion\(\) && Boolean\(gameplayArt\(altId\)\)/);
  assert.match(script, /const doyunPose = snapshot\.sliding \? "slide" : snapshot\.y > 1 \? "jump" : "run"/);
  assert.match(script, /const harinPose = refs\.harin\.classList\.contains\("assisting"\) \? "assist" : "run"/);
  assert.match(script, /gaitArtId\(CHARACTER_ART_IDS\.doyun\.run, CHARACTER_ART_IDS\.doyun\.runAlt, snapshot, GAIT_PHASE_DELAY_MS\.doyun\)/);
  assert.match(script, /gaitArtId\(CHARACTER_ART_IDS\.harin\.run, CHARACTER_ART_IDS\.harin\.runAlt, snapshot, GAIT_PHASE_DELAY_MS\.harin\)/);
  assert.match(script, /gaitArtId\(CHARACTER_ART_IDS\.boss\.chase, CHARACTER_ART_IDS\.boss\.chaseAlt, snapshot, GAIT_PHASE_DELAY_MS\.boss\)/);
  assert.match(script, /function syncGaitEmphasis\(host, artId, enabled\)/);
  assert.match(script, /syncGaitEmphasis\(refs\.harinArt, harinArtId, hasHarinGait\)/);
  assert.match(script, /syncGaitEmphasis\(refs\.bossArt, bossArtId, hasBossGait\)/);
  assert.match(script, /const bossCalling = snapshot\.elapsed < state\.bossCallUntil/);
  assert.match(script, /const bossPose = bossCalling \? "call" : "chase"/);
  assert.match(script, /state\.bossCallUntil = Math\.max\(state\.bossCallUntil, snapshot\.elapsed \+ 0\.28\)/);
  assert.match(script, /bossCallUntil: 0/);
  assert.doesNotMatch(script, /snapshot\.hitCount >= 2 \? "call"/);
  assert.doesNotMatch(script, /syncGaitEmphasis\(refs\.player/);
  assert.match(script, /function preloadCharacterArt\(\)/);
  assert.match(script, /function startSlideFeedback\(\)/);
  assert.match(script, /function cancelSlideActivationTimer\(targetState = state\)/);
  assert.match(script, /function cancelJumpActivationTimer\(targetState = state\)/);
  assert.match(script, /function canQueueJump\(upcoming\)/);
  assert.match(script, /function clearPendingJump\(targetState = state\)/);
  assert.match(script, /function executePendingJump\(pending\)/);
  assert.match(script, /function flushPendingJump\(\)/);
  assert.match(script, /function activateJumpCue\(game, ownerToken = null\)/);
  assert.match(script, /status: "queued"/);
  assert.match(script, /pending\.status = "executed"/);
  assert.match(script, /existing\.status === "queued" && ownerToken === null\) existing\.ownerToken = null/);
  assert.match(script, /pending\.ownerToken !== ownerToken \|\| pending\.status !== "queued"/);
  assert.match(script, /refs\?\.jump\.classList\.add\("queued"\)/);
  assert.match(script, /flushPendingJump\(\);\s*const snapshot = state\.game\.step\(dt\)/);
  assert.match(script, /if \(snapshot\.finished\) render\(snapshot\);\s*handleEvents\(events, snapshot\);\s*if \(snapshot\.finished\) return/);
  assert.match(script, /pending\.game\.commitJump\(CUE_JUMP_COMMIT_SECONDS\)/);
  assert.match(script, /game\.commitSlide\(upcoming\.clearLeadTime \+ 0\.05\)/);
  assert.match(script, /activateJumpCue\(pointerGame, pointerToken\)/);
  assert.match(script, /activateSlideCue\(pointerGame\)/);
  assert.match(script, /activateJumpCue\(state\.game\)/);
  assert.match(script, /activateSlideCue\(state\.game\)/);
  assert.match(script, /function isDuplicateCueKeyboardClick\(action\)/);
  assert.match(script, /state\.cueKeyboardAction = "";\s*state\.cueKeyboardAt = -Infinity;\s*return true/);
  assert.match(script, /state\?\.cueKeyboardAction === "jump"\) state\.cueKeyboardAt = global\.performance\.now\(\)/);
  assert.match(script, /state\?\.cueKeyboardAction === "slide"\) state\.cueKeyboardAt = global\.performance\.now\(\)/);
  assert.equal((script.match(/if \(event\.detail !== 0\) return;/g) || []).length, 2);
  assert.equal((script.match(/if \(pointerId !== null\) return;/g) || []).length, 2);
  assert.equal((script.match(/if \(pointerId === null \|\| event\.pointerId !== pointerId\) return;/g) || []).length, 4);
  assert.equal((script.match(/button\.addEventListener\("lostpointercapture", cancel\)/g) || []).length, 2);
  assert.match(script, /&& !pendingJump\s*&& !\(upcoming && telegraphPhase === "act"\)/);
  assert.match(script, /event\.code === "Space" && refs\.slide\.contains\(event\.target\)/);
  assert.match(script, /refs\.jumpLabel\.textContent = jumpQueued/);
  assert.match(script, /"입력 완료 ✓"/);
  assert.match(script, /"미리 탭하세요 · 알맞을 때 점프합니다"/);
  assert.match(script, /function slideCueAcceptWindow\(game\)/);
  assert.match(script, /upcoming\?\.avoid === "slide" && upcoming\.telegraphPhase === "act"/);
  assert.match(script, /refs\.slideLabel\.textContent = slideCueTapReady/);
  assert.match(script, /refs\.telegraph\.dataset\.tapReady = cueTapReady \? "true" : "false"/);
  assert.match(script, /upcoming\.id === "chair-pair-a"\s*\? "첫 연속: 점프 뒤 슬라이드"/);
  assert.match(script, /firstComboPrepare\s*\? '<i aria-hidden="true">○<\/i><b>점프 후 ↓<\/b>'/);
  assert.match(script, /firstComboPrepare \? "첫 연속, 점프 뒤 슬라이드"/);
  assert.match(script, /"지금 점프, 탭하세요"/);
  assert.match(script, /"지금 슬라이드, 탭하세요"/);
  assert.match(script, /"복합기 복도 · 서랍과 케이블 조심!"/);
  assert.match(script, /state\.game\.cancelSlide\(\)/);
  assert.match(script, /upcoming\.telegraphPhase === "act"/);
  assert.match(script, /state\.lastTelegraphKey !== telegraphKey/);
  assert.match(script, /id: "meeting-7f", progress: 0\.17, kind: "glass"/);
  assert.match(script, /<span>슬라이드 · 길게<\/span>/);
  assert.match(script, /function showAvoidConfirm\(\)/);
  assert.match(script, /event\.hitCount >= 3[\s\S]+퇴근 위기 · \$\{event\.object\.label\} 충돌[\s\S]+\$\{event\.object\.label\} 충돌 · \$\{correction\}/);
  assert.match(script, /function triggerPlayerMotionFx\(type, duration = PLAYER_MOTION_FX_MS\)/);
  assert.match(script, /function pauseVisualFxTimers\(\)/);
  assert.match(script, /function resumeVisualFxTimers\(\)/);
  assert.match(script, /pauseVisualFxTimers\(\);\s*releaseControls\(\)/);
  assert.match(script, /resumeVisualFxTimers\(\);\s*root\.classList\.remove\("paused"\)/);
  assert.match(script, /triggerPlayerMotionFx\("jump", 180\)/);
  assert.match(script, /triggerPlayerMotionFx\("avoid"\)/);
  assert.match(script, /state\.wasAirborne && !airborne/);
  assert.match(script, /id="oe-remaining"/);
  assert.match(script, /remainingSeconds = Math\.max\(0, Math\.ceil\(\(1 - snapshot\.progress\) \* snapshot\.duration\)\)/);
  assert.match(script, /data-motion="\$\{object\.motion \|\| "still"\}"/);
  assert.match(script, /classList\.toggle\("passing", Math\.abs\(x - playerX\) <= 72\)/);
  assert.match(script, /classList\.toggle\("has-upcoming", Boolean\(upcoming\)\)/);
  assert.match(script, /refs\.course\.dataset\.zoneEnter = ZONE_ENTRY_LABELS/);
  assert.match(script, /function clearFeedback\(type\)/);
  assert.match(script, /HIT_FEEDBACK_MIN_SECONDS = 0\.4/);
  assert.match(script, /state\.feedbackLockedUntil = type === "hit"/);
  assert.match(script, /state\.feedbackExpiresAt = type === "hit"/);
  assert.match(script, /if \(type === "hit"\) \{\s*state\.feedbackTimer = 0;\s*return/);
  assert.match(script, /snapshot\.elapsed >= state\.feedbackExpiresAt\) clearFeedback\("hit"\)/);
  assert.match(script, /type === "hit" && \(state\.game\?\.snapshot\(\)\.elapsed \|\| 0\) < state\.feedbackLockedUntil/);
  assert.match(script, /if \(upcoming && telegraphPhase === "prepare"\) clearFeedback\("hit"\)/);
  assert.match(script, /feedback\("점프 통과!", "avoid", 1200\)/);
  assert.match(script, /feedback\("슬라이드 통과!", "avoid", 1200\)/);
  assert.match(script, /feedback\("엘리베이터 도착!", "arrival", ARRIVAL_MS\)/);
  assert.match(script, /refs\.telegraph\.hidden = true/);
  assert.match(script, /refs\.status\.textContent = "엘리베이터에 도착했습니다"/);
  assert.match(script, /root\.classList\.add\("arrival"\)/);
  assert.match(script, /state\.arrivalTimer = scheduleTransient\(\(\) => \{/);
  assert.match(script, /refs\.feedback\.textContent = ""/);
  assert.match(script, /prefersReducedMotion\(\)/);
  assert.match(script, /failedArtSources: new Set\(\)/);
  assert.match(script, /classList\.toggle\("has-gait-art"/);
  assert.match(script, /OfficeEscapeMinigame = Object\.freeze\(\{ start, pause, resume, debugSnapshot \}\)/);
  assert.match(script, /const playerX = playerScreenX\(width\)/);
  assert.match(script, /width \* 0\.32/);
  assert.match(script, /Math\.max\(96, width \* 0\.35\)/);
  assert.match(script, /const phonePortrait = width <= 480 && refs\.course\.clientHeight >= 600/);
  assert.match(script, /const shortLandscape = width <= 900 && refs\.course\.clientHeight <= 220/);
  assert.match(script, /const compact = width <= 850 \|\| shortLandscape/);
  assert.match(script, /const harinX = phonePortrait \? width \* 0\.143/);
  assert.match(script, /const dangerThreePhone = phonePortrait && dangerLevel === 3/);
  assert.match(script, /dangerThreePhone\s*\? harinX - 54/);
  assert.match(script, /refs\.danger\.textContent = dangerLevel === 0 \? "안전"[^;]+"퇴근 위기"/);
  assert.match(script, /refs\.course\.dataset\.dangerLevel = String\(dangerLevel\)/);
  assert.match(script, /width \* 0\.065 \+ dangerLevel \* 11/);
  assert.match(script, /const tinyPhone = phonePortrait && width < 360/);
  assert.match(script, /tinyPhone \? 0\.68 : 0\.74/);
  assert.match(script, /tinyPhone \? 0\.42 : 0\.46/);
  assert.match(script, /tinyPhone \? 0\.34 : 0\.38/);
  assert.match(script, /const SHORT_LANDSCAPE_WORLD_SCALE = 0\.52/);
  assert.match(script, /const SUCCESS_STATUS_SECONDS = 0\.5/);
  assert.match(script, /id="oe-item-count"/);
  assert.match(script, /refs\.itemCount\.textContent = `수집 \$\{snapshot\.collectedItems\.length\}\/3`/);
  assert.match(script, /state\.successStatusUntil = snapshot\.elapsed \+ SUCCESS_STATUS_SECONDS/);
  assert.match(script, /classList\.toggle\("success", showSuccessStatus\)/);
  assert.match(script, /!\(upcoming && telegraphPhase === "act"\)/);
  assert.match(script, /function syncObjectArtWorldScale\(course, worldScale\)/);
  assert.match(script, /const artSize = object\.width \/ frame\.alphaWidth \* worldScale/);
  assert.match(script, /state\.objectArtWorldScale = null;[\s\S]*course\.forEach\(\(object\) =>/);
  assert.match(script, /syncObjectArtWorldScale\(snapshot\.course, worldScale\)/);
  assert.match(script, /function renderPausedLayout\(\)[\s\S]*state\.paused[\s\S]*render\(state\.lastSnapshot\)/);
  assert.match(script, /global\.addEventListener\("resize", renderPausedLayout\)/);
  assert.match(script, /object\.kind === "item" \? "collection" : "collision"/);
  assert.match(script, /object\.kind === "item" \? "PICKUP" : "HIT"/);
  assert.match(style, /\.oe-debug-box\.collection/);
  assert.match(style, /\.oe-item-count/);
  assert.match(style, /grid-template-columns:\s*minmax\(176px, \.65fr\) minmax\(260px, 1fr\)/);
  assert.match(style, /\.oe-items span\s*\{[^}]*font-size:\s*13px/s);
  assert.match(style, /grid-template-columns:\s*124px minmax\(120px, 1fr\)/);
  assert.match(style, /\.oe-item-count\s*\{[^}]*display:\s*block[^}]*grid-column:\s*2[^}]*grid-row:\s*2[^}]*font-size:\s*13px/s);
  assert.match(style, /\.office-escape\.paused \.oe-course \*::after[\s\S]*animation-play-state:\s*paused !important/);
  assert.match(style, /\.oe-play-footer > p\.success/);
  assert.match(script, /const playerScale = shortLandscape \? worldScale/);
  assert.match(script, /const harinScale = shortLandscape \? worldScale/);
  assert.match(script, /const bossScale = shortLandscape \? worldScale/);
  assert.match(script, /const CAMERA_NEAR_BLEND_START = 420/);
  assert.match(script, /const CAMERA_FAR_BLEND_END = 1400/);
  assert.match(script, /const SHORT_LANDSCAPE_CAMERA_DEPTH_FACTOR = 0\.65/);
  assert.match(script, /const SHORT_LANDSCAPE_CAMERA_MAX_DEPTH = 1200/);
  assert.match(script, /function projectWorldDelta\(delta, width, worldScale = 1\)/);
  assert.match(script, /const nearDepth = clamp\(width \* 0\.2, 74, 360\)/);
  assert.match(script, /const farDepthFactor = shortLandscape \? SHORT_LANDSCAPE_CAMERA_DEPTH_FACTOR : 0\.45/);
  assert.match(script, /const farDepthMax = shortLandscape \? SHORT_LANDSCAPE_CAMERA_MAX_DEPTH : 720/);
  assert.match(script, /const farDepth = clamp\(width \* farDepthFactor \/ Math\.max\(worldScale, 0\.35\), 74, farDepthMax\)/);
  assert.match(script, /const smoothBlend = blendProgress \* blendProgress \* \(3 - 2 \* blendProgress\)/);
  assert.match(script, /projectWorldDelta\(worldX - snapshot\.distance, width, worldScale\) \* worldScale/);
  assert.match(script, /const OBJECT_DRAW_AHEAD = 1900/);
  assert.match(script, /const LANDMARK_DRAW_AHEAD = 2200/);
  assert.match(script, /const FINISH_DRAW_AHEAD = 3000/);
  assert.match(script, /const MAX_VISIBLE_LANDMARKS = 2/);
  assert.match(script, /const courseDrawScale = Math\.min\(1, snapshot\.length \/ Core\.DEFAULT_LENGTH\)/);
  assert.match(script, /visibleLandmarkCount < MAX_VISIBLE_LANDMARKS/);
  assert.match(script, /const itemCueDistance = Math\.max\(280, 620 \* courseDrawScale\)/);
  assert.match(script, /classList\.toggle\("collectible-cue", !upcoming && id === upcomingItem\?\.id\)/);
  assert.match(script, /`선택 수집물 · 점프로 \$\{upcomingItem\.label\} 획득`/);
  assert.match(script, /renderDebugGeometry\(snapshot, width, objectDrawAhead, worldScale\)/);
  assert.match(script, /rect: object\.collisionRect/);
  assert.match(script, /progress: 0\.03, kind: "door"/);
  assert.match(script, /translate3d\(\$\{playerX\}px, \$\{-snapshot\.y \* worldScale\}px, 0\) scale\(\$\{playerScale\}\)/);
  assert.match(script, /--oe-far-x/);
  assert.match(script, /--oe-mid-x/);
  assert.match(script, /--oe-near-x/);
  assert.match(script, /data-landmark/);
  assert.match(script, /oe-progress-bar/);
  assert.match(style, /\.oe-chair::before/);
  assert.match(style, /\.oe-drawer/);
  assert.match(style, /\.oe-touch-controls/);
  assert.match(style, /--oe-object-art-size/);
  assert.match(style, /\.oe-player-review-art\s*\{[^}]*left:\s*24px/s);
  assert.match(style, /\.oe-player\.has-review-art\.sliding \.oe-player-review-art\s*\{[^}]*left:\s*42px/s);
  assert.doesNotMatch(style, /rotate\(68deg\)/);
  assert.match(script, /Core\.PROP_ART_FRAMING\[object\.type\]/);
  const mobileStyle = style.slice(style.indexOf("@media (max-width: 1020px)"), style.indexOf("@media (max-width: 480px)"));
  assert.doesNotMatch(mobileStyle, /\.oe-harin\s*\{[^}]*display:\s*none/);
  assert.match(mobileStyle, /\.oe-harin\s*\{[^}]*scale:\s*\.62/);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)/);
  assert.match(style, /grid-template-rows: 64px minmax\(0, 1fr\) 72px/);
  assert.match(style, /\.oe-danger-meter/);
  assert.match(style, /\.oe-command-list/);
  assert.match(style, /\.oe-player\.has-gait-art/);
  assert.match(style, /@keyframes oe-gait-emphasis/);
  assert.match(style, /#oe-harin-art\.gait-emphasis,\s*#oe-boss-art\.gait-emphasis\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0/s);
  assert.match(style, /from \{ scale: 1\.05; \}/);
  assert.match(style, /to \{ scale: 1; \}/);
  assert.match(style, /@keyframes oe-slide-feedback/);
  assert.match(style, /@keyframes oe-telegraph-now/);
  assert.match(style, /@keyframes oe-avoid-confirm/);
  assert.match(style, /@keyframes oe-arrival/);
  assert.match(style, /@keyframes oe-zone-enter/);
  assert.match(style, /transform:\s*translateX\(var\(--oe-zone-enter-shift, 18px\)\);\s*clip-path:\s*inset\(0\)/);
  assert.match(style, /@media \(max-width: 1020px\)[\s\S]*\.oe-course::after\s*\{[^}]*--oe-zone-enter-shift:\s*8px[^}]*right:\s*max\(14px, env\(safe-area-inset-right, 0px\)\)/s);
  assert.match(style, /@media \(max-width: 480px\)[\s\S]*\.oe-course::after\s*\{[^}]*right:\s*max\(10px, env\(safe-area-inset-right, 0px\)\)/s);
  assert.match(style, /@keyframes oe-footfall-burst/);
  assert.match(style, /@keyframes oe-land-contact/);
  assert.match(style, /\.office-escape\.zone-change \.oe-course::after/);
  assert.match(style, /\.office-escape\.paused \.oe-course::after[\s\S]+animation-play-state:\s*paused/);
  assert.match(style, /\.oe-course\.has-upcoming \.oe-hazard:not\(\.telegraphed\)/);
  assert.match(style, /\.oe-item\.collectible-cue > span/);
  assert.doesNotMatch(style, /backdrop-filter/);
  assert.match(style, /\.oe-object\.telegraphed\[data-motion="roll"\]/);
  assert.match(style, /\.oe-player\.motion-feedback\[data-motion-fx="land"\]/);
  assert.match(style, /\.office-escape\.arrival \.oe-finish/);
  assert.match(style, /\.oe-feedback\.arrival/);
  assert.match(style, /\.oe-avoid-confirm\.show/);
  assert.match(style, /\.oe-telegraph\[data-phase="prepare"\]/);
  assert.match(style, /\.oe-telegraph\[data-phase="act"\]/);
  assert.match(style, /\.oe-telegraph\[data-phase="act"\] b\s*\{[^}]*font-size:\s*24px/s);
  assert.ok((style.match(/\.oe-telegraph\[data-phase="act"\] b\s*\{[^}]*font-size:\s*20px/gs) || []).length >= 3);
  assert.match(style, /\.oe-object\.telegraphed\.action-ready/);
  assert.match(style, /\.oe-player\.slide-feedback::before/);
  assert.match(style, /\.oe-player\.has-review-art\.sliding \.oe-player-review-art img/);
  assert.match(style, /\.oe-touch-controls button\.tap-feedback/);
  assert.match(style, /\.oe-touch-controls button\.queued/);
  assert.match(style, /@media \(max-width: 480px\)[\s\S]*\.oe-route-title small\s*\{[^}]*display:\s*block[^}]*grid-column:\s*1/s);
  assert.match(style, /@media \(max-width: 480px\)\s*\{\s*#oe-remaining\s*\{[^}]*font-size:\s*13px/s);
  assert.match(style, /@media \(max-width: 480px\)[\s\S]*\.oe-route ol\s*\{\s*display:\s*none/);
  assert.match(style, /@media \(max-width: 480px\)[\s\S]*grid-template-columns:\s*112px minmax\(0, 1fr\)/);
  assert.match(style, /@media \(max-width: 480px\)[\s\S]*\.oe-danger b\s*\{[^}]*font-size:\s*18px/s);
  assert.match(style, /@media \(max-width: 480px\)[\s\S]*\.oe-route-title strong\s*\{[^}]*font-size:\s*14px/s);
  assert.match(style, /@media \(max-width: 480px\)[\s\S]*\.oe-route-title > b\s*\{[^}]*font-size:\s*18px/s);
  assert.match(style, /@media \(max-width: 480px\) and \(min-height: 600px\)[\s\S]*\.oe-play-footer > p\s*\{[^}]*height:\s*16px[^}]*font-size:\s*14px[^}]*line-height:\s*16px/s);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)[\s\S]*\.oe-play-footer > p\s*\{[^}]*height:\s*14px[^}]*font-size:\s*12px[^}]*line-height:\s*14px/s);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)[\s\S]*\.oe-play-footer > p\s*\{[^}]*clip-path:\s*none[^}]*font-size:\s*12px/s);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)[\s\S]*\.oe-play-footer\s*\{[^}]*position:\s*static[^}]*inset:\s*auto[^}]*height:\s*64px/s);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)[\s\S]*grid-template-rows:\s*48px minmax\(0, 1fr\) 64px/);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)[\s\S]*--oe-ground:\s*6%/);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)[\s\S]*\.oe-touch-controls\s*\{[^}]*position:\s*static[^}]*inset:\s*auto[^}]*width:\s*100%/s);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)[\s\S]*\.oe-telegraph\s*\{[^}]*top:\s*8px[^}]*bottom:\s*auto/s);
  assert.match(style, /@media \(max-width: 900px\) and \(max-height: 560px\)[\s\S]*\.oe-player,[\s\S]*\.oe-harin,[\s\S]*\.oe-boss\s*\{[^}]*transform-origin:\s*bottom left/s);
  assert.match(style, /@media \(max-width: 480px\)[\s\S]*\.oe-danger b\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(style, /\.oe-course\[data-danger-level="3"\] \.oe-boss\.has-game-art img/);
  assert.match(style, /padding-inline:\s*max\(8px, env\(safe-area-inset-left, 0px\)\)/);
  assert.match(style, /transform-origin: 50% 100%/);
  const gaitEmphasisStyle = style.slice(
    style.indexOf("@keyframes oe-gait-emphasis"),
    style.indexOf("@keyframes oe-slide-feedback"),
  );
  assert.doesNotMatch(gaitEmphasisStyle, /translate|top:|left:/);
  assert.match(style, /prefers-reduced-motion/);
});

test.skip("V044 승인 아트 resolver 상세", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "..", "assets", "art", "manifests", "art-assets.json"), "utf8"));
  const runtime = require("../minigames/day4-office-escape/art-assets.js");
  const expectedVersions = new Map([
    ["minigame_background.office_escape.office", "v001"],
    ["minigame_background.office_escape.corridor", "v001"],
    ["minigame_background.office_escape.elevator", "v001"],
    ["minigame_character.doyun.run.right", "v003"],
    ["minigame_character.doyun.run_alt.right", "v003"],
    ["minigame_character.doyun.jump.right", "v001"],
    ["minigame_character.doyun.slide.right", "v001"],
    ["minigame_character.harin.run.right", "v002"],
    ["minigame_character.harin.run_alt.right", "v003"],
    ["minigame_character.harin.assist.right", "v001"],
    ["minigame_character.boss.chase.right", "v002"],
    ["minigame_character.boss.chase_alt.right", "v003"],
    ["minigame_character.boss.call.right", "v001"],
    ["prop.office.chair", "v002"],
    ["prop.office.cable", "v002"],
    ["prop.office.drawer", "v002"],
    ["prop.office.papers", "v002"],
    ["prop.office.cart", "v002"],
    ["prop.office.sign", "v002"],
    ["prop.office.access_card", "v002"],
    ["prop.office.phone", "v002"],
    ["prop.office.backup_usb", "v002"],
  ]);

  for (const [id, expectedVersion] of expectedVersions) {
    const asset = manifest.assets.find((entry) => entry.id === id);
    const version = asset?.versions.find((entry) => entry.version === asset.active_version);
    assert.equal(asset?.active_version, expectedVersion, `${id} should activate ${expectedVersion}`);
    assert.equal(version?.status, "approved", `${id} should resolve only approved art`);
    assert.match(version?.path || "", /\/approved\//, `${id} should use an immutable approved file`);
    assert.equal(runtime.resolve(id).replace(/^\.\.\//, ""), version.path);
    assert.equal(fs.existsSync(path.resolve(root, runtime.resolve(id))), true, `${id} runtime file should exist`);
  }
});

test.skip("V044 보행 프레임 보존 상세", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "..", "assets", "art", "manifests", "art-assets.json"), "utf8"));
  const runtime = require("../minigames/day4-office-escape/art-assets.js");
  const candidates = [
    ["minigame_character.doyun.run.right", "v003", "mg_doyun_run_right_v003"],
    ["minigame_character.doyun.run_alt.right", "v003", "mg_doyun_run_alt_right_v003"],
    ["minigame_character.harin.run.right", "v002", "mg_harin_run_right_v002"],
    ["minigame_character.harin.run_alt.right", "v003", "mg_harin_run_alt_right_v003"],
    ["minigame_character.boss.chase.right", "v002", "mg_boss_chase_right_v002"],
    ["minigame_character.boss.chase_alt.right", "v003", "mg_boss_chase_alt_right_v003"],
  ];

  for (const [id, approvedVersion, fileStem] of candidates) {
    const asset = manifest.assets.find((entry) => entry.id === id);
    const version = asset?.versions.find((entry) => entry.version === approvedVersion);
    assert.equal(asset?.active_version, approvedVersion, `${id} must activate the approved gait frame`);
    assert.equal(version?.status, "approved", `${id} must be approved`);
    assert.match(version?.path || "", /\/approved\//);
    assert.match(version?.sha256 || "", /^[a-f0-9]{64}$/);
    assert.equal(version?.reviewed_by, "user");
    assert.match(version?.reviewed_at || "", /^2026-08-01T/);
    assert.equal(runtime.resolve(id).replace(/^\.\.\//, ""), version.path);
    assert.equal(fs.existsSync(path.join(root, "..", version.path)), true, `${id} approved PNG should exist`);
    assert.equal(fs.existsSync(path.join(root, "..", version.path.replace("/approved/", "/review/"))), false, `${id} approved PNG must leave review staging`);
    assert.equal(fs.existsSync(path.join(root, "..", "assets", "art", "generation_logs", `${fileStem}.jsonl`)), true);
    assert.equal(fs.existsSync(path.join(root, "..", "assets", "art", "prompts", "rendered", `${fileStem}_prompt_v001.txt`)), true);
  }
});

test.skip("V044 개발 화면의 정적 구성", () => {
  const html = read("minigames/day4-office-escape/dev/index.html");
  const dev = read("minigames/day4-office-escape/dev/dev.js");
  const devCss = read("minigames/shared/dev.css");
  assert.match(html, /DAY 4 OFFICE ESCAPE LAB/);
  assert.match(html, /<base href="\.\.\/\.\.\/\.\.\/">/);
  assert.match(html, /day4-office-escape\/art-assets\.js\?v=1/);
  assert.match(html, /day4-office-escape\/core\.js\?v=19/);
  assert.match(html, /day4-office-escape\/style\.css\?v=46/);
  assert.match(html, /day4-office-escape\/index\.js\?v=59/);
  assert.match(html, /day4-office-escape\/dev\/dev\.js\?v=9/);
  assert.match(html, /minigames\/shared\/dev\.css\?v=2/);
  assert.doesNotMatch(html, /<style>/);
  assert.match(devCss, /html\[data-office-escape-dev\] body\.minigame-dev \.office-escape/);
  assert.match(devCss, /width:\s*min\(1600px, 99vw\)/);
  assert.match(devCss, /height:\s*min\(900px, calc\(100dvh - 84px\)\)/);
  assert.match(devCss, /grid-template-rows:\s*64px minmax\(0, 1fr\)/);
  assert.match(html, /id="dev-intro"/);
  assert.match(html, /id="dev-hitboxes"/);
  assert.match(dev, /autoStart: !intro\.checked/);
  assert.match(dev, /testOverrides/);
  assert.match(dev, /OfficeEscapeMinigameCore\.DEFAULT_LENGTH/);
  assert.match(dev, /OfficeEscapeMinigame\.pause\(\)/);
  assert.match(dev, /OfficeEscapeMinigame\.resume\(\)/);
  assert.match(dev, /fetch\("\.\.\/assets\/art\/manifests\/art-assets\.json", \{ cache: "no-store" \}\)/);
  assert.match(dev, /\[\.\.\.asset\.versions\]\.reverse\(\)/);
  assert.match(dev, /version\.status === "review"/);
  assert.match(dev, /Number\(version\.version\.slice\(1\)\) > activeNumber/);
  assert.match(dev, /reviewAssetMap: reviewArt\.checked/);
  assert.match(dev, /showHitboxes: hitboxes\.checked/);
  assert.match(html, /data-office-escape-dev="true"/);
  assert.match(read("minigames/day4-office-escape/index.js"), /dataset\.officeEscapeDev === "true"/);
  assert.match(dev, /JSON\.stringify\(result, null, 2\)/);
});

test.skip("V044 일시정지 내부 구현", () => {
  const script = read("minigames/day4-office-escape/index.js");
  assert.match(script, /root\?\.hidden \|\| !state\?\.playing \|\| state\.paused/);
  assert.match(script, /function clearTransientTimers\(targetState = state\)/);
  assert.match(script, /transientTimers: new Set\(\)/);
  assert.match(script, /clearTransientTimers\(state\)/);
  assert.match(script, /root\.classList\.remove\("paused", "hit", "zone-change", "arrival"\)/);
  assert.match(script, /refs\.harin\.classList\.remove\("assisting"\)/);
  assert.match(script, /refs\.jump\.classList\.remove\("pressed", "queued"\)/);
  assert.match(script, /refs\.slide\.classList\.remove\("pressed", "tap-feedback"\)/);
});

test.skip("V044 모달 포커스 내부 구현", () => {
  const script = read("minigames/day4-office-escape/index.js");
  assert.match(script, /function trapFocus\(event\)/);
  assert.match(script, /root\.hidden \|\| root\.hasAttribute\("inert"\)[\s\S]+root\.getAttribute\("aria-hidden"\) === "true"/);
  assert.match(script, /event\.key === "Tab" && trapFocus\(event\)/);
  assert.match(script, /function pause\(\) \{[\s\S]+root\.setAttribute\("inert", ""\);[\s\S]+root\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(script, /function resume\(\) \{[\s\S]+root\.removeAttribute\("inert"\);[\s\S]+root\.setAttribute\("aria-hidden", "false"\)/);
  assert.match(script, /function releaseControls\(\)/);
  assert.match(script, /global\.addEventListener\("blur", releaseControls\)/);
  assert.match(script, /document\.addEventListener\("visibilitychange"/);
  assert.match(script, /if \(devMode && options\.autoStart\) begin\(\)/);
});

test("V2 퇴근 미니게임은 공개 진입점·결과·저장 연동을 유지한다", () => {
  const html = read("day4.html");
  const core = read("minigames/day4-office-escape/core.js");
  const runtime = read("minigames/day4-office-escape/index.js");
  const art = read("minigames/day4-office-escape/art-assets.js");
  const dev = read("minigames/day4-office-escape/dev/dev.js");
  assert.ok(html.indexOf("day4-office-escape/core.js") < html.indexOf("day4-office-escape/index.js"));
  assert.match(core, /const FIXED_STEP = 1 \/ 120/);
  assert.match(core, /const JUMP_BUFFER = 0\.12/);
  assert.match(core, /const SLIDE_DURATION = 0\.7/);
  assert.match(core, /const SLIDE_RECOVERY = 0\.15/);
  assert.match(core, /const INVULNERABLE_TIME = 0\.75/);
  assert.match(core, /function gradeForHits\(hitCount\).*perfect.*close.*caught/s);
  assert.match(core, /BACKGROUND_ROUTE/);
  assert.match(core, /function backgroundPresentationAt\(elapsedSeconds, options = \{\}\)/);
  assert.match(core, /const BACKGROUND_TRANSITION_DURATION = 0\.7/);
  assert.match(runtime, /global\.OfficeEscapeMinigame = Object\.freeze\(\{ start, pause, resume, preview, setComposition, debugSnapshot \}\)/);
  assert.match(runtime, /onComplete/);
  assert.match(runtime, /result\.grade/);
  assert.match(runtime, /"Space", "ArrowUp", "KeyW"/);
  assert.match(runtime, /"ArrowDown", "KeyS"/);
  assert.match(art, /function resolve\(id\)/);
  assert.match(art, /function metrics\(id\)/);
  assert.match(dev, /reviewAssetsEnabled: reviewArt\.checked/);
  assert.match(dev, /backgroundBoard/);
});

test("V2 배경 전환과 조작 UI는 가짜 유리 없이 진행 정보와 버튼 규격을 통일한다", () => {
  const runtime = read("minigames/day4-office-escape/index.js");
  const style = read("minigames/day4-office-escape/style.css");
  const dev = read("minigames/day4-office-escape/dev/index.html");
  assert.match(runtime, /function renderBackgrounds\(snapshot, width\)/);
  assert.match(runtime, /Core\.backgroundPresentationAt\(snapshot\.elapsed/);
  assert.match(runtime, /function formatClock\(\) \{ return "17:58"; \}/);
  assert.doesNotMatch(runtime, /oe2-far-layer|oe2-mid-layer|oe2-thresholds|--oe2-far-x|--oe2-mid-x|--oe2-near-x/);
  assert.match(style, /grid-template-rows: clamp\(79px, 9\.6vh, 98px\)/);
  assert.match(style, /\.oe2-route\s*\{[^}]*height: 48px/s);
  assert.match(style, /\.oe2-route li svg\s*\{[^}]*width: 42px;[^}]*height: 42px;[^}]*box-sizing: border-box/s);
  assert.match(style, /\.oe2-ring-action\s*\{[^}]*width: 104px;[^}]*height: 104px;[^}]*border-radius: 50%/s);
  assert.match(style, /\.oe2-ring-action svg\s*\{[^}]*fill: none;[^}]*stroke: currentColor/s);
  assert.match(runtime, /class="oe2-ring-action oe2-action oe2-jump"/);
  assert.match(dev, /class="oe2-ring-action oe2-review-ring oe2-jump"/);
  assert.doesNotMatch(runtime, /<kbd>|oe2-elevator/);
  assert.match(runtime, /class="oe2-assist-badge"/);
  assert.match(style, /\.oe2-pause\s*\{[^}]*width: 48px;[^}]*height: 48px/s);
  assert.doesNotMatch(style, /\.oe2-far-layer|\.oe2-mid-layer|\.oe2-thresholds|--oe2-far-x|--oe2-mid-x|--oe2-near-x/);
  assert.match(style, /\.oe2-background-panel\s*\{[^}]*position: absolute[^}]*opacity: 0/s);
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
  assert.match(engine, /bgmManager\.stop\(\)/);
  assert.match(engine, /setTimeout\(\(\) => \{ location\.href = "day4\.html\?new=1"; \}, 2200\)/);
  assert.match(read("js/title-screen.js"), /Number\(slot\.day\) === 4 \? "day4\.html"/);
});

test("정시 퇴근 완벽 등급은 호감도 보상과 함께 다른 도착 대사로 안내된다", () => {
  const runtime = read("js/day4.js");
  assert.match(runtime, /if \(result\.grade === "perfect"\) state\.affection \+= 1/);
  assert.match(runtime, /scene\.dynamic === "escapeArrival"/);
  assert.match(runtime, /state\.minigameResult\?\.grade === "perfect"\) return "도착했습니다\. 이번에는 부장님 눈에 한 번도 안 띄었습니다\."/);
  const arrival = story.scenes.find((scene) => scene.id === "day4SuccessArrival");
  assert.equal(arrival.dynamic, "escapeArrival");
});

test("DAY 4는 18.4%를 개선 결과가 아니라 현재 확인값으로 표현한다", () => {
  const source = read("js/day4-story.js");
  assert.doesNotMatch(source, /개선 결과/);
  const verifyMetric = story.scenes.find((scene) => scene.id === "day4VerifyMetric");
  assert.ok(verifyMetric.system.rows.includes("현재 확인값 · 18.4%"));
  const rehearsalScreen = story.scenes.find((scene) => scene.id === "day4RehearsalScreen");
  assert.ok(rehearsalScreen.system.rows.includes("현재 확인값 · 7일 차 잔존율 18.4%"));
  const rehearsalMetric = story.scenes.find((scene) => scene.id === "day4RehearsalMetric");
  assert.equal(rehearsalMetric.system.title, "현재 확인값");
  assert.match(rehearsalMetric.text, /개선 효과가 아니라/);
  const submit = story.scenes.find((scene) => scene.id === "day4Submit");
  assert.ok(submit.system.rows.includes("발표 자료 수치 · 18.4%"));
  assert.ok(submit.system.rows.includes("근거 자료 수치 · 18.4%"));
  assert.match(submit.system.rows.find((row) => row.startsWith("제출 확인")), /17:08/);
});

test("DAY 4는 발표 전주 대신 가장 최근 자료로 기준 기간을 설명한다", () => {
  const source = read("js/day4-story.js");
  assert.doesNotMatch(source, /발표 전주/);
  assert.doesNotMatch(source, /7\/27~8\/2/);
  assert.doesNotMatch(source, /7월 27일/);
  const evidencePreview = story.scenes.find((scene) => scene.id === "day4EvidencePreview");
  assert.ok(evidencePreview.system.rows.includes("계산 기준 · 가장 최근 자료 신규 가입자"));
});
