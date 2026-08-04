(function initDay5PresentationCinematic(global) {
  "use strict";

  const START_ID = "day5PresentationStart";
  const END_ID = "day5PresentationEnd";
  const SOURCE_RECT = Object.freeze({ x: 621, y: 263, width: 703, height: 346 });
  const CAMERA_CLASSES = ["day5-cine-screen", "day5-cine-left", "day5-cine-right", "day5-cine-impact", "day5-cine-flash", "day5-cine-bars", "day5-cine-shake"];
  const READY_CONFIGS = Object.freeze({
    day5ReadyToPresent: Object.freeze({
      eyebrow: "DAY 5 · PRESENTATION MISSION",
      kicker: "발표 진행 안내",
      title: "정직원 전환 발표",
      copy: "발표를 진행하며 핵심 근거를 지키고, 예상하지 못한 질문에 대응하세요.",
      rules: [
        ["발표 진행", "대화가 완성되면 ‘다음’ 또는 Enter로 발표를 이어갑니다."],
        ["핵심 문구", "붉게 강조되는 수치와 기록은 이후 대응의 중요한 근거입니다."],
        ["돌발 대응", "질문이 나오면 확인된 사실을 기준으로 선택하세요. 선택은 평가에 반영됩니다."],
      ],
      status: "발표 자료 연결 완료",
      button: "발표 시작",
    }),
    day5VerificationReady: Object.freeze({
      eyebrow: "DAY 5 · ERROR VERIFICATION",
      kicker: "미니게임 진행 안내",
      title: "오류 검증",
      copy: "단서 탭의 기록을 연결해 수치가 바뀐 과정과 책임 범위를 직접 입증하세요.",
      rules: [
        ["단서 제시", "‘근거 있음’ 표시가 있는 DAY 탭을 열고 질문에 맞는 단서를 제시합니다."],
        ["검증 기회", "전체 오류 검증이 기회 5개를 공유하며 오답마다 하트가 하나씩 줄어듭니다."],
        ["실패 분기", "기회를 모두 잃으면 즉시 실패 결과가 표시되고 담당자 확인 분기로 이어집니다."],
      ],
      status: "오류 검증 자료 준비 완료",
      button: "오류 검증 시작",
    }),
  });
  const FALLBACK_SLIDES = Object.freeze({
    day5PresentationStart: ["신규 사용자 초반 경험 개선안", ["개선 결과 · 7일 차 잔존율", "분석 대상 · 신규 가입 사용자", "현재 순서 · 결과 설명", "근거 자료 · 원본 연결 정상"]],
    day5PresentationProblem: ["USER JOURNEY · BEFORE", ["관찰 구간 · 첫 플레이", "이탈 원인 · 목표 인지 전 이탈", "문제 · 다음 행동 불명확", "개선 방향 · 초반 동선 명확화"]],
    day5PresentationSolution: ["ONBOARDING FLOW", ["불필요한 안내 · 축소", "핵심 행동 · 전면 배치", "첫 성공 경험 · 앞당김", "측정 기준 · 동일 조건 비교"]],
    day5PresentationFocusDetail: ["이번 발표의 핵심", ["발표 원칙 · 결론부터 설명", "확인 순서 · 제출 기록 우선", "답변 기준 · 확인된 사실", "원인 판단 · 기록 확인 후"]],
    day5FocusReaction: ["발표 내용 확인", ["현재 문제 · 확인", "개선안 · 확인", "수치 확인 과정 · 확인", "발표 · 계속"]],
    day5PresentationNormal: ["제출 자료 확인", ["발표 자료 수치 · 18.4%", "제출 근거 수치 · 불러오는 중", "연결된 자료 · 7일 차 잔존율 검증본", "현재 상태 · 원본 다시 확인 중"]],
    day5MismatchDoyun: ["수치 불일치 발견", ["발표 자료 수치 · 18.4%", "제출 근거 수치 · 12.7%", "비교 자료 · 제출 당시 보관본", "현재 상태 · 원인 확인 필요"]],
    day5MismatchFollowup: ["수치 불일치 발견", ["발표 자료 수치 · 18.4%", "제출 근거 수치 · 12.7%", "확인할 내용 · 수치가 바뀐 시점", "현재 판단 · 추가 확인 필요"]],
    day5BossPrompt: ["확인이 필요한 내용", ["첫 번째 · 제출 당시 원본", "두 번째 · 제출 확인 시각", "세 번째 · 자료 연결 변경", "원인 판단 · 기록 확인 후"]],
    day5HarinPrompt: ["RESPONSE ORDER", ["1 · 확인된 수치", "2 · 제출 직후 기록", "3 · 변경 시점", "4 · 원인 경로"]],
    day5StrategyCallback: ["대응 순서", ["답변 원칙 · 기록 우선", "제출 당시 수치 · 18.4%", "현재 표시 수치 · 12.7%", "다음 단계 · 변경 시점 확인"]],
    day5Pause: ["발표 일시 정지", ["제출 당시 원본 · 확인", "제출 기록 · 확인", "수치가 바뀐 과정 · 조사 필요", "특정인 지목 · 기록 확인 후"]],
    day5FactSort: ["01 · 제출 당시 사실 확인", ["평가위원 주장 · 제출 전부터 12.7%", "발표 자료 · 18.4%", "제출 근거 · 18.4%", "선택 · 기록으로 확인된 사실"]],
    day5AliasCheck: ["02 · 자료 연결 변경", ["09:57 · 잔존율 검증본", "09:58 · 연결 대상 변경", "변경 대상 · 2024년 이전 자료", "표시 수치 · 12.7%"]],
    day5AuditResult: ["SECURITY AUDIT · RESULT", ["규칙 소유자 · 서하린", "재활성화 요청 계정 · 강민재", "실행 서비스 · 나나봇", "연결 대상 · 2024년 이전 자료"]],
    day5AuditResultReview: ["감사 로그 확인", ["규칙 소유자 · 서하린", "실제 요청 계정 · 강민재", "실행 서비스 · 나나봇", "연결 변경 · 2024년 이전 자료"]],
    day5OwnerQuestion: ["03 · 등록 담당자와 요청 계정", ["등록 담당자 · 서하린", "이번 요청 계정 · 강민재", "실행 기능 · 나나봇", "확인 · 역할 구분"]],
    day5CausalOrder: ["04 · 수치가 바뀐 과정", ["1 · 민재 재실행 요청", "2 · 이전 자료 연결", "3 · 나나봇 자동 실행", "4 · 근거 화면 12.7%"]],
    day5Responsibility: ["05 · 확인된 책임 범위", ["확인 · 영향 미확인 재실행", "확인 · 이상 인지 후 미보고", "미확인 · 직접 수치 입력", "판단 · 기록으로 입증된 범위"]],
    day5MinjaeConfront: ["AUDIT RESULT", ["요청 계정 · 강민재", "실행 서비스 · 나나봇", "출처 변경 · 09:58", "직접 수치 입력 · 없음"]],
    day5MinjaeWhy: ["INCIDENT REVIEW", ["재활성화 요청 · 확인", "이상 징후 인지 · 확인", "사전 공유 · 없음", "책임 범위 · 검토"]],
    day5MinjaeAdmit: ["INCIDENT REVIEW", ["요청 사실 · 인정", "영향 범위 · 미확인", "이상 징후 · 인지", "보고 · 지연"]],
    day5HarinConsequence: ["INCIDENT BOUNDARY", ["초기 요청 · 실수", "이상 인지 후 미보고 · 문제", "직접 조작 · 확인 안 됨", "복구 · 필요"]],
    day5RecoveryStart: ["근거 자료 복구", ["1 · 자동 갱신 일시 중지", "2 · 제출 당시 원본 선택", "3 · 분석 대상과 기간 확인", "4 · 원본 고정 연결"]],
    day5RecoveryRefresh: ["01 · 자동 갱신 제어", ["현재 · 자동 갱신 중", "위험 · 연결 대상 재변경", "우선 조치 · 갱신 상태 결정", "목표 · 복구 기준 고정"]],
    day5RecoverySource: ["02 · 복구할 원본 선택", ["현재 분석 원본 · 18.4%", "2024년 이전 자료 · 12.7%", "임시 미리보기 · 출처 불명", "선택 기준 · DAY 4 제출 기록"]],
    day5RecoveryBasis: ["03 · 분석 기준 확인", ["대상 · 신규 가입 사용자", "기간 · 발표 전주", "측정 · 가입 7일 후", "선택 · 같은 분석 기준"]],
    day5RecoveryBinding: ["04 · 원본 연결 방식", ["자동 연결 · 변경 가능", "원본 고정 · 선택 자료 유지", "자동 갱신 · 일시 중지", "목표 · 18.4% 유지"]],
    day5Resume: ["발표 재개", ["복구된 수치 · 18.4%", "변경 원인 · 연결 자료 변경", "근거 자료 · 정상 복구", "발표 상태 · 재개"]],
    day5ResumeContinue: ["발표 재개", ["7일 차 잔존율 · 18.4%", "개선 방향 · 유지", "발표 상태 · 진행 재개", "다음 순서 · 질의응답"]],
    day5EvaluatorFollowUp: ["추가 질의", ["질문 · 개선안 신뢰도", "근거 자료 · 복구 완료", "판단 기준 · 사고와 개선안 분리", "현재 상태 · 답변 대기"]],
    day5ResumeAnswer: ["신뢰도 답변", ["개선안 근거 · 오늘 재검증", "사고 원인 · 자료 관리 과정", "판단 기준 · 효과와 사고 분리", "발표 상태 · 마무리 단계"]],
    day5EvaluatorClose: ["최종 확인 결과", ["제출 당시 원본 · 확인", "제출 이후 변경 · 확인", "문제 대응 · 평가 반영", "최종 평가 · 검토 중"]],
  });

  let active = false;
  let memoryLocked = false;
  let typingLocked = false;
  let readyLocked = false;
  let resultLocked = false;
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
    if (scene.system) return [scene.system.title || "발표 자료", scene.system.rows || []];
    return FALLBACK_SLIDES[scene.id] || ["발표 자료", [
      `현재 시각 · ${scene.time || ""}`,
      `발표 단계 · ${scene.speaker || ""}`,
      "검증 기준 · 확인된 기록",
      "상태 · 진행 중",
    ]];
  }

  function renderSlide(scene) {
    const [title, rows] = slideFor(scene);
    $("#day5-cinematic-title").textContent = title;
    const danger = /MISMATCH|PAUSED|RESPONSE REQUIRED|불일치|일시 정지|확인이 필요한/.test(title);
    $("#day5-cinematic-rows").replaceChildren(...rows.slice(0, 4).map((row, index) => {
      const [label, value] = splitRow(row);
      const article = document.createElement("article");
      if (danger && index < 2) article.classList.add("danger");
      const caption = document.createElement("small");
      const content = document.createElement("strong");
      const footer = document.createElement("span");
      caption.textContent = label;
      content.textContent = value || label;
      footer.textContent = danger ? "확인 필요" : "원본 확인 완료";
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

  function flash() {
    const stage = $("#stage");
    stage.classList.remove("day5-cine-flash");
    void stage.offsetWidth;
    stage.classList.add("day5-cine-flash");
    UiSfx.playPresentationCue("flashTransition");
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

  function playMemory(cuts, finalHoldMs = 600) {
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
        }, finalHoldMs);
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

  function hideVerificationResult() {
    const result = $("#day5-verification-result");
    if (result) result.hidden = true;
    resultLocked = false;
  }

  function showVerificationResult() {
    const result = $("#day5-verification-result");
    const confirm = $("#day5-verification-result-confirm");
    const next = $("#next");
    if (!result || !confirm || !next) return;
    result.hidden = false;
    resultLocked = true;
    next.disabled = true;
    confirm.onclick = () => {
      hideVerificationResult();
      next.disabled = false;
      next.click();
    };
    global.setTimeout(() => confirm.focus(), 0);
  }

  function showReady(scene) {
    const ready = $("#day5-presentation-ready");
    const start = $("#day5-presentation-ready-start");
    const next = $("#next");
    const config = READY_CONFIGS[scene?.id];
    if (!ready || !start || !next || !config) return;
    $("#day5-presentation-ready-eyebrow").textContent = config.eyebrow;
    $("#day5-presentation-ready-kicker").textContent = config.kicker;
    $("#day5-presentation-ready-title").textContent = config.title;
    $("#day5-presentation-ready-copy").textContent = config.copy;
    $("#day5-presentation-ready-rules").replaceChildren(...config.rules.map(([title, detail], index) => {
      const article = document.createElement("article");
      const number = document.createElement("b");
      const wrapper = document.createElement("span");
      const heading = document.createElement("strong");
      number.textContent = String(index + 1).padStart(2, "0");
      heading.textContent = title;
      wrapper.append(heading, detail);
      article.append(number, wrapper);
      return article;
    }));
    $("#day5-presentation-ready-status").textContent = config.status;
    start.firstChild.textContent = `${config.button} `;
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
    if (scene.verificationResult) {
      showVerificationResult();
      return;
    }
    if (scene.holdDelay) {
      typingLocked = true;
      typingTimer = global.setTimeout(() => {
        typingLocked = false;
        typingTimer = 0;
        $("#next").disabled = false;
      }, scene.holdDelay);
      return;
    }
    if (scene.id === "day5SubmissionProved") {
      playMemory([
        ["DAY 4 · 17:08", "제출 직후 확인"],
        ["발표 자료 · 18.4%", "제출 자료 정상"],
        ["근거 자료 · 18.4%", "원본 연결 정상"],
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

  function playChoiceResult(scene, choice) {
    if (!active || !scene || !choice) return false;
    const cutsByScene = {
      day5FactSort: choice.id === "verified_facts"
        ? [["DAY 4 · 17:08", "제출 직후 확인"], ["발표 자료 · 18.4%", "근거 자료 · 18.4%"]]
        : [["판단 보류", "기록으로 확인되지 않음"]],
      day5AliasCheck: choice.id === "alias_changed_to_archive"
        ? [["09:57", "잔존율 검증본 연결"], ["09:58", "2024년 이전 자료로 변경"], ["12.7%", "근거 화면 갱신"]]
        : [["순서 불일치", "제출 기록을 다시 확인"]],
      day5OwnerQuestion: choice.id === "distinguish_roles"
        ? [["등록 담당자", "서하린"], ["이번 요청 계정", "강민재"], ["실행 기능", "나나봇"]]
        : [["역할 혼동", "등록 · 요청 · 실행을 구분"]],
      day5CausalOrder: choice.id === "correct_chain"
        ? [["요청", "강민재"], ["연결", "2024년 이전 자료"], ["실행", "나나봇"], ["결과", "12.7% 표시"]]
        : [["시간 순서 불일치", "요청 기록부터 다시 확인"]],
      day5Responsibility: choice.id === "minjae_request_concealment"
        ? [["확인된 책임", "영향 미확인 재실행"], ["확인된 책임", "이상 인지 후 미보고"]]
        : [["입증 범위 초과", "직접 조작 기록 없음"]],
      day5RecoveryRefresh: choice.id === "pause_refresh"
        ? [["자동 갱신", "일시 중지"], ["현재 연결 상태", "보존 완료"]]
        : [["복구 불안정", "자동 갱신이 계속 실행 중"]],
      day5RecoverySource: choice.id === "current_week"
        ? [["DAY 4 제출 기록", "18.4%"], ["복구 원본", "현재 분석 원본 선택"]]
        : [["원본 불일치", "DAY 4 제출 기록과 다름"]],
      day5RecoveryBasis: choice.id === "new_users_current_week"
        ? [["분석 대상", "신규 가입 사용자"], ["분석 기간", "발표 전주"], ["측정 시점", "가입 7일 후"]]
        : [["분석 기준 불일치", "대상과 기간을 다시 확인"]],
      day5RecoveryBinding: choice.id === "fixed_source"
        ? [["원본 연결", "18.4% 검증본에 고정"], ["자동 갱신", "중지"], ["복구 상태", "완료"]]
        : [["연결 불안정", "다른 자료로 다시 바뀔 수 있음"]],
    };
    const cuts = cutsByScene[scene.id];
    if (!cuts) return false;
    if (choice.id !== "verified_facts"
      && choice.id !== "alias_changed_to_archive"
      && choice.id !== "distinguish_roles"
      && choice.id !== "correct_chain"
      && choice.id !== "minjae_request_concealment"
      && choice.id !== "pause_refresh"
      && choice.id !== "current_week"
      && choice.id !== "new_users_current_week"
      && choice.id !== "fixed_source") impact();
    playMemory(cuts, scene.id === "day5Responsibility" ? 1100 : 600);
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
    if (READY_CONFIGS[scene?.id]) showReady(scene);
    else hideReady();
    if (!scene?.verificationResult) hideVerificationResult();
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
    if (/PresentationStart|EvidenceRefresh|Mismatch|SubmissionProved/.test(scene.id)) stage.classList.add("day5-cine-bars");
    layout();
    specialBeat(scene);
    return true;
  }

  global.Day5PresentationCinematic = Object.freeze({
    apply,
    playDialogue,
    playChoiceResult,
    isLocked: () => readyLocked || resultLocked || memoryLocked || typingLocked,
  });
})(window);
