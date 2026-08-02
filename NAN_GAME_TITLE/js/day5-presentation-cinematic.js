(function initDay5PresentationCinematic(global) {
  "use strict";

  const START_ID = "day5PresentationStart";
  const END_ID = "day5PresentationEnd";
  const SOURCE_RECT = Object.freeze({ x: 621, y: 263, width: 703, height: 346 });
  const CAMERA_CLASSES = ["day5-cine-screen", "day5-cine-left", "day5-cine-right", "day5-cine-impact", "day5-cine-flash", "day5-cine-bars", "day5-cine-shake", "day5-side-cut-active", "day5-side-cut-left", "day5-side-cut-right"];
  const SIDE_CUT_ASSETS = Object.freeze({
    "서하린": "character.harin.relaxed_standing.neutral",
    "박태식": "character.boss.holding_cup.concerned",
  });
  const SIDE_CUT_SCENES = new Set(["day5BossPrompt", "day5HarinPrompt", "day5HarinConsequence"]);
  const FALLBACK_SLIDES = Object.freeze({
    day5PresentationStart: ["CONVERSION PRESENTATION", ["핵심 지표 · 7일 차 잔존율", "대상 · 신규 가입 사용자", "발표 상태 · 진행 중", "검증 · 원본 연결 정상"]],
    day5PresentationProblem: ["USER JOURNEY · BEFORE", ["관찰 구간 · 첫 플레이", "이탈 원인 · 목표 인지 전 이탈", "문제 · 다음 행동 불명확", "개선 방향 · 초반 동선 명확화"]],
    day5PresentationSolution: ["ONBOARDING FLOW", ["불필요한 안내 · 축소", "핵심 행동 · 전면 배치", "첫 성공 경험 · 앞당김", "측정 기준 · 동일 조건 비교"]],
    day5PresentationFocusDetail: ["PRESENTATION FOCUS", ["발표 원칙 · 선택 반영", "검증 순서 · 기록 우선", "답변 기준 · 확인된 사실", "추측 · 보류"]],
    day5FocusReaction: ["PRESENTATION REVIEW", ["문제 정의 · 확인", "개선 방향 · 확인", "검증 과정 · 확인", "발표 상태 · 계속"]],
    day5PresentationNormal: ["OFFICIAL EVIDENCE", ["발표 PT · 18.4%", "공식 증빙 · 불러오는 중", "출처 · retention_7d_verified", "상태 · 연결 갱신"]],
    day5MismatchDoyun: ["VALUE MISMATCH", ["발표 PT · 18.4%", "공식 증빙 · 12.7%", "확인 기준 · 보존 원본", "발표 상태 · 검증 대기"]],
    day5MismatchFollowup: ["VALUE MISMATCH", ["발표 PT · 18.4%", "공식 증빙 · 12.7%", "질문 · 변경 시점", "판정 · 확인 필요"]],
    day5BossPrompt: ["RESPONSE REQUIRED", ["확인 항목 · 정상 원본", "확인 항목 · 제출 시각", "확인 항목 · 변경 경로", "원인 추측 · 보류"]],
    day5HarinPrompt: ["RESPONSE ORDER", ["1 · 확인된 수치", "2 · 제출 직후 기록", "3 · 변경 시점", "4 · 원인 경로"]],
    day5StrategyCallback: ["RESPONSE", ["답변 원칙 · 기록 우선", "정상 수치 · 18.4%", "현재 수치 · 12.7%", "다음 단계 · 변경 시점 확인"]],
    day5Pause: ["PRESENTATION PAUSED", ["정상 원본 · 확인", "제출 기록 · 확인", "변경 경로 · 조사 필요", "특정인 지목 · 보류"]],
    day5FactSort: ["FACT VERIFICATION", ["확인된 사실 · 분류", "추측 · 분리", "변경 시점 · 조사", "발표 상태 · 일시 정지"]],
    day5MinjaeConfront: ["AUDIT RESULT", ["요청 계정 · 강민재", "실행 서비스 · 나나봇", "출처 변경 · 09:58", "직접 수치 입력 · 없음"]],
    day5MinjaeWhy: ["INCIDENT REVIEW", ["재활성화 요청 · 확인", "이상 징후 인지 · 확인", "사전 공유 · 없음", "책임 범위 · 검토"]],
    day5MinjaeAdmit: ["INCIDENT REVIEW", ["요청 사실 · 인정", "영향 범위 · 미확인", "이상 징후 · 인지", "보고 · 지연"]],
    day5HarinConsequence: ["INCIDENT BOUNDARY", ["초기 요청 · 실수", "이상 인지 후 미보고 · 문제", "직접 조작 · 확인 안 됨", "복구 · 필요"]],
    day5RecoverySource: ["EVIDENCE RECOVERY", ["후보 A · 현재 주차 원본", "후보 B · 구버전 보관본", "후보 C · 임시 미리보기", "선택 기준 · 제출 기록 일치"]],
    day5RecoveryBinding: ["SOURCE BINDING", ["별칭 연결 · 변경 가능", "고정 원본 ID · 안정", "자동 갱신 · 일시 중지", "검증 · 복구 후 재실행"]],
    day5Resume: ["PRESENTATION RESUMED", ["정상 수치 · 18.4%", "변경 원인 · 출처 별칭", "증빙 연결 · 복구", "발표 상태 · 재개"]],
    day5EvaluatorClose: ["FINAL REVIEW", ["정상 원본 · 확인", "제출 이후 변경 · 확인", "사고 대응 · 평가 반영", "최종 평가 · 검토 중"]],
  });

  let active = false;
  let memoryLocked = false;
  let typingLocked = false;
  let readyLocked = false;
  let lastSceneId = "";
  let memoryToken = 0;
  let typingToken = 0;
  let typingTimer = 0;
  let resizeBound = false;

  const $ = (selector) => document.querySelector(selector);

  function sceneRangeActive(scene) {
    const story = global.Day5Story?.scenes || [];
    const current = story.findIndex((entry) => entry.id === scene?.id);
    const start = story.findIndex((entry) => entry.id === START_ID);
    const end = story.findIndex((entry) => entry.id === END_ID);
    return current >= start && current <= end && start >= 0 && end >= start;
  }

  function splitRow(row) {
    const parts = String(row).split(/\s*[·•]\s*/);
    return [parts.shift() || "", parts.join(" · ") || ""];
  }

  function slideFor(scene) {
    if (scene.system) return [scene.system.title || "PRESENTATION", scene.system.rows || []];
    return FALLBACK_SLIDES[scene.id] || ["PRESENTATION", [
      `현재 시각 · ${scene.time || ""}`,
      `발표 단계 · ${scene.speaker || ""}`,
      "검증 기준 · 확인된 기록",
      "상태 · 진행 중",
    ]];
  }

  function renderSlide(scene) {
    const [title, rows] = slideFor(scene);
    $("#day5-cinematic-title").textContent = title;
    const danger = /MISMATCH|PAUSED|RESPONSE REQUIRED/.test(title);
    $("#day5-cinematic-rows").replaceChildren(...rows.slice(0, 4).map((row, index) => {
      const [label, value] = splitRow(row);
      const article = document.createElement("article");
      if (danger && index < 2) article.classList.add("danger");
      const caption = document.createElement("small");
      const content = document.createElement("strong");
      const footer = document.createElement("span");
      caption.textContent = label;
      content.textContent = value || label;
      footer.textContent = danger ? "CHECK REQUIRED" : "SOURCE VERIFIED";
      article.append(caption, content, footer);
      return article;
    }));
  }

  function layout() {
    const root = $("#day5-presentation-cinematic");
    const panel = $("#day5-cinematic-screen");
    if (!root || !panel || !active) return;
    const width = root.clientWidth;
    const height = root.clientHeight;
    const scale = Math.max(width / 1920, height / 1080);
    const offsetX = (width - 1920 * scale) / 2;
    const offsetY = (height - 1080 * scale) / 2;
    panel.style.left = `${offsetX + SOURCE_RECT.x * scale}px`;
    panel.style.top = `${offsetY + SOURCE_RECT.y * scale}px`;
    panel.style.width = `${SOURCE_RECT.width * scale}px`;
    panel.style.height = `${SOURCE_RECT.height * scale}px`;
  }

  function cameraFor(scene) {
    if (/Mismatch|EvidenceRefresh/.test(scene.id)) return "day5-cine-impact";
    if (/Submission|NormalProved|Alias|Audit|RecoveryVerify|Resume|PresentationEnd/.test(scene.id)) return "day5-cine-screen";
    if (/Question|Followup|Owner|Evaluator/.test(scene.id)) return "day5-cine-right";
    if (/Harin|Boss|Minjae/.test(scene.id)) return "day5-cine-left";
    return "day5-cine-screen";
  }

  function sideCutAsset(scene) {
    if (!SIDE_CUT_SCENES.has(scene.id) || !SIDE_CUT_ASSETS[scene.speaker]) return "";
    if (scene.speaker === "서하린") {
      const harin = scene.characters?.find((character) => character.id === "harin");
      return harin?.assetId || SIDE_CUT_ASSETS["서하린"];
    }
    return SIDE_CUT_ASSETS[scene.speaker];
  }

  function applySideCut(stage, scene) {
    const assetId = sideCutAsset(scene);
    const dialogueCard = $("#dialogue-card");
    if (!assetId || !dialogueCard) {
      dialogueCard?.style.removeProperty("--day5-side-cut-image");
      return;
    }
    const left = scene.speaker === "박태식";
    stage.classList.add("day5-side-cut-active", left ? "day5-side-cut-left" : "day5-side-cut-right");
    dialogueCard.style.setProperty("--day5-side-cut-image", `url("${ArtAssets.resolve(assetId)}")`);
  }

  function flash() {
    const stage = $("#stage");
    stage.classList.remove("day5-cine-flash");
    void stage.offsetWidth;
    stage.classList.add("day5-cine-flash");
    window.setTimeout(() => stage.classList.remove("day5-cine-flash"), 600);
  }

  function impact() {
    const stage = $("#stage");
    stage.classList.remove("day5-cine-shake");
    void stage.offsetWidth;
    stage.classList.add("day5-cine-shake");
    flash();
    window.setTimeout(() => stage.classList.remove("day5-cine-shake"), 600);
  }

  function playMemory(cuts) {
    const token = ++memoryToken;
    const memory = $("#day5-cinematic-memory");
    const next = $("#next");
    if (!memory || !cuts.length) return;
    memoryLocked = true;
    next.disabled = true;
    memory.hidden = false;
    let index = 0;
    const show = () => {
      if (token !== memoryToken) return;
      $("#day5-cinematic-memory-main").textContent = cuts[index][0];
      $("#day5-cinematic-memory-sub").textContent = cuts[index][1];
      flash();
      index += 1;
      if (index < cuts.length) {
        window.setTimeout(show, 500);
      } else {
        window.setTimeout(() => {
          if (token !== memoryToken) return;
          memory.hidden = true;
          memoryLocked = false;
          if (!typingLocked) next.disabled = false;
        }, 600);
      }
    };
    show();
  }

  function cancelMemory() {
    memoryToken += 1;
    memoryLocked = false;
    const memory = $("#day5-cinematic-memory");
    if (memory) memory.hidden = true;
  }

  function cancelTyping() {
    typingToken += 1;
    global.clearTimeout(typingTimer);
    typingTimer = 0;
    typingLocked = false;
  }

  function hideReady() {
    const ready = $("#day5-presentation-ready");
    $("#stage")?.classList.remove("day5-presentation-ready-active");
    if (ready) ready.hidden = true;
    readyLocked = false;
  }

  function showReady() {
    const ready = $("#day5-presentation-ready");
    const start = $("#day5-presentation-ready-start");
    const next = $("#next");
    if (!ready || !start || !next) return;
    ready.hidden = false;
    $("#stage").classList.add("day5-presentation-ready-active");
    readyLocked = true;
    next.disabled = true;
    start.onclick = () => {
      hideReady();
      next.disabled = false;
      next.click();
    };
    global.setTimeout(() => start.focus(), 0);
  }

  function finishDialogue(scene, text) {
    const dialogue = $("#dialogue");
    if (dialogue.textContent !== text) {
      dialogue.textContent = text;
      SceneMotion.applyDialogueEmphasis($("#stage"), scene);
    }
    typingLocked = false;
    if (scene.id === "day5SubmissionProved") {
      playMemory([
        ["DAY 4 · 17:08", "제출 직후 확인"],
        ["PT · 18.4%", "발표 자료 정상"],
        ["증빙 · 18.4%", "원본 연결 정상"],
        ["추가 수정 · 없음", "보존 상태 유지"],
      ]);
    } else if (!memoryLocked) {
      $("#next").disabled = false;
    }
  }

  function playDialogue(scene, text) {
    if (!active || !scene || typeof text !== "string") return false;
    cancelTyping();
    const token = ++typingToken;
    const dialogue = $("#dialogue");
    const next = $("#next");
    const delay = scene.id === "day5MismatchDoyun" ? 700 : 120;
    let cursor = 0;
    let revealDialogue = null;
    typingLocked = true;
    next.disabled = true;
    dialogue.textContent = scene.id === "day5MismatchDoyun" ? "……" : "";
    const tick = () => {
      if (token !== typingToken) return;
      if (cursor < text.length) {
        if (!revealDialogue) {
          revealDialogue = SceneMotion.prepareProgressiveDialogue($("#stage"), scene, text);
        }
        cursor += 1;
        revealDialogue(cursor);
        typingTimer = global.setTimeout(tick, 24);
      } else {
        finishDialogue(scene, text);
      }
    };
    typingTimer = global.setTimeout(tick, delay);
    return true;
  }

  function specialBeat(scene) {
    if (scene.id === lastSceneId) return;
    lastSceneId = scene.id;
    if (scene.id === "day5Mismatch") {
      impact();
    }
  }

  function apply(scene) {
    const root = $("#day5-presentation-cinematic");
    const stage = $("#stage");
    if (!root || !stage) return false;
    if (scene?.id === "day5ReadyToPresent") showReady();
    else hideReady();
    active = sceneRangeActive(scene);
    stage.classList.toggle("day5-presentation-active", active);
    CAMERA_CLASSES.forEach((name) => stage.classList.remove(name));
    if (!active) {
      cancelMemory();
      cancelTyping();
      lastSceneId = "";
      root.setAttribute("aria-hidden", "true");
      return false;
    }
    if (lastSceneId && lastSceneId !== scene.id) {
      cancelMemory();
      cancelTyping();
    }
    if (!resizeBound) {
      resizeBound = true;
      global.addEventListener("resize", layout);
    }
    root.setAttribute("aria-hidden", "false");
    $(".day5-cinematic-background").style.backgroundImage = `url("${ArtAssets.resolve("background.presentation_room.day")}")`;
    renderSlide(scene);
    stage.classList.add(cameraFor(scene));
    applySideCut(stage, scene);
    if (/PresentationStart|EvidenceRefresh|Mismatch|SubmissionProved/.test(scene.id)) stage.classList.add("day5-cine-bars");
    layout();
    specialBeat(scene);
    return true;
  }

  global.Day5PresentationCinematic = Object.freeze({
    apply,
    playDialogue,
    isLocked: () => readyLocked || memoryLocked || typingLocked,
  });
})(window);
