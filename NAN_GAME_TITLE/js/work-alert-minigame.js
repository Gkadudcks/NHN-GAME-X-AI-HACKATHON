(function (global) {
  "use strict";

  const ACTIONS = Object.freeze([
    { key: "reply", label: "답장 보내기", shortLabel: "답장", keyHint: "1" },
    { key: "file", label: "파일 전달", shortLabel: "파일", keyHint: "2" },
    { key: "calendar", label: "일정 등록", shortLabel: "일정", keyHint: "3" },
    { key: "delegate", label: "담당자에게 넘기기", shortLabel: "담당자 전달", keyHint: "4" },
    { key: "later", label: "나중에 확인", shortLabel: "나중에", keyHint: "5" },
    { key: "spam", label: "스팸 차단", shortLabel: "스팸 차단", keyHint: "6" },
  ]);

  const REQUESTS = Object.freeze([
    { id: "harin-layout", sender: "서하린", request: "공용 슬라이드 레이아웃 링크 부탁해요.", action: "file", critical: true, harin: true, response: "파일을 확인한 서하린이 짧게 고맙다고 답했다." },
    { id: "boss-meeting", sender: "박태식 부장", request: "오후 점검 회의, 3시로 잡아 둬.", action: "calendar", critical: true, response: "오후 점검 일정이 캘린더에 등록됐다." },
    { id: "minjae-lunch", sender: "강민재", request: "점심 메뉴 투표, 오늘은 진짜 참여할 거지?", action: "later", response: "점심 메뉴 투표는 업무가 정리된 뒤 보기로 했다." },
    { id: "qa-owner", sender: "QA 협업방", request: "스토리 빌드 재현 담당자를 연결해 주세요.", action: "delegate", critical: true, response: "재현 요청이 담당 QA에게 전달됐다." },
    { id: "planning-copy", sender: "기획팀 공용방", request: "지난 회의 요약본을 공유해 주세요.", action: "file", response: "회의 요약본이 기획팀 공용방에 공유됐다." },
    { id: "calendar-vendor", sender: "오세진", request: "외부 인터뷰 시간을 캘린더에 추가해 주세요.", action: "calendar", response: "외부 인터뷰 일정이 등록됐다." },
    { id: "harin-question", sender: "서하린", request: "리뷰 태깅 기준, 애매한 문장 하나만 같이 볼래요?", action: "reply", critical: true, harin: true, response: "서하린에게 확인하겠다고 바로 답했다." },
    { id: "security-spam", sender: "보안 알림", request: "[외부] 무료 쿠폰을 받으려면 사번을 입력하세요.", action: "spam", critical: true, response: "수상한 외부 메시지가 차단됐다." },
    { id: "art-owner", sender: "아트 협업방", request: "신규 배너 검수 요청, 담당 기획자 확인 부탁드립니다.", action: "delegate", response: "배너 검수 요청이 담당 기획자에게 넘어갔다." },
    { id: "minjae-reaction", sender: "강민재", request: "부장님 방금 농담한 거 맞아? 판정 좀.", action: "later", response: "판정하기 어려운 메시지는 잠시 미뤘다." },
    { id: "build-file", sender: "류지안", request: "오늘 테스트 빌드 경로를 보내 주세요.", action: "file", critical: true, response: "테스트 빌드 경로가 전달됐다." },
    { id: "room-booking", sender: "프로젝트 A 공용방", request: "오후 합동 테스트 회의실을 잡아 주세요.", action: "calendar", response: "합동 테스트 회의실 일정이 등록됐다." },
    { id: "review-reply", sender: "유저리서치 협업방", request: "리뷰 원문 사용 범위를 확인해 주실 수 있나요?", action: "reply", response: "사용 범위를 확인해 보겠다고 답했다." },
    { id: "mail-spam", sender: "외부 홍보 계정", request: "수상 경력 보장! 지금 링크를 눌러 등록하세요.", action: "spam", response: "광고성 외부 메시지가 차단됐다." },
    { id: "boss-owner", sender: "박태식 부장", request: "빌드 오류는 개발 담당자에게 바로 넘겨.", action: "delegate", critical: true, response: "빌드 오류가 개발 담당자에게 전달됐다." },
    { id: "harin-later", sender: "서하린", request: "급한 건 아니에요. 어제 편의점 영수증은 나중에 주세요.", action: "later", harin: true, response: "급하지 않은 요청은 업무가 끝난 뒤 확인하기로 했다." },
    { id: "ops-reply", sender: "라이브 운영방", request: "점검 공지 문구 확인 가능하신 분 답 주세요.", action: "reply", response: "공지 문구를 확인하겠다고 답했다." },
    { id: "research-file", sender: "김소라", request: "타회사 이탈률 조사표 링크를 공유해 주세요.", action: "file", response: "조사표 링크가 공유됐다." },
  ]);

  const SUBTASK_REQUESTS = Object.freeze({
    competitor: Object.freeze([
      { id: "subtask-competitor-capture", sender: "서하린", request: "비교 중인 게임의 첫 전투 화면 캡처를 보내주세요.", action: "file", harin: true, response: "비교용 첫 전투 화면이 서하린에게 전달됐다." },
      { id: "subtask-competitor-install", sender: "유저리서치 협업방", request: "비교 테스트 앱 세 개, 설치 완료 여부를 알려주세요.", action: "reply", response: "비교 테스트 준비가 끝났다고 답했다." },
      { id: "subtask-competitor-table", sender: "기획팀 공용방", request: "타회사 온보딩 비교표 링크를 공유해 주세요.", action: "file", response: "온보딩 비교표가 공유됐다." },
    ]),
    reviews: Object.freeze([
      { id: "subtask-reviews-rule", sender: "서하린", request: "리뷰 감정 태깅 기준을 보내주세요.", action: "file", harin: true, response: "감정 태깅 기준이 서하린에게 전달됐다." },
      { id: "subtask-reviews-scope", sender: "유저리서치 협업방", request: "리뷰 원문 사용 범위 확인 가능할까요?", action: "reply", response: "사용 범위를 확인해 보겠다고 답했다." },
      { id: "subtask-reviews-duplicate", sender: "고객지원 협업방", request: "중복 리뷰 묶음은 담당 분석가에게 넘겨주세요.", action: "delegate", response: "중복 리뷰가 담당 분석가에게 전달됐다." },
    ]),
    journey: Object.freeze([
      { id: "subtask-journey-recording", sender: "서하린", request: "첫 10분 화면 녹화 링크를 보내주세요.", action: "file", harin: true, response: "플레이 흐름 녹화 링크가 서하린에게 전달됐다." },
      { id: "subtask-journey-playtest", sender: "QA 협업방", request: "첫 10분 플레이테스트 참여 여부를 알려주세요.", action: "reply", response: "플레이테스트에 참여한다고 답했다." },
      { id: "subtask-journey-room", sender: "프로젝트 A 공용방", request: "플레이 흐름 검토 회의실을 2시로 잡아주세요.", action: "calendar", response: "플레이 흐름 검토 일정이 등록됐다." },
    ]),
  });

  function createSeededRandom(seed) {
    let state = (Number(seed) || 1) >>> 0;
    return function random() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  function shuffled(items, random) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function buildSchedule(options = {}) {
    const random = options.random || Math.random;
    const requests = Array.isArray(options.requests) && options.requests.length ? options.requests : REQUESTS;
    const count = Math.max(1, Math.min(requests.length, options.count || 16));
    const duration = Math.max(12, options.duration || 45);
    const lifeMs = Math.max(3200, options.lifeMs || 6500);
    const chosen = shuffled(requests, random).slice(0, count);
    const schedule = [];
    const firstSpawn = 800;
    const lastSpawn = Math.max(firstSpawn, duration * 1000 - 3200);
    const step = count > 1 ? (lastSpawn - firstSpawn) / (count - 1) : 0;
    let previousSpawn = 0;

    chosen.forEach((request, index) => {
      const jitter = index === 0 || index === count - 1 ? 0 : (random() - 0.5) * step * 0.7;
      const spawnAt = Math.max(previousSpawn + (index ? 650 : 0), Math.round(firstSpawn + step * index + jitter));
      previousSpawn = spawnAt;
      schedule.push({
        ...request,
        spawnAt,
        lifeMs,
        x: 4 + Math.floor(random() * 67),
        y: 5 + Math.floor(random() * 58),
      });
    });
    return schedule;
  }

  function priorityForRequest(request) {
    if (request.critical) return "urgent";
    if (["later", "spam"].includes(request.action)) return "leisure";
    return "normal";
  }

  function evaluateAction(request, selectedAction) {
    const correct = request.action === selectedAction;
    const reward = { urgent: 7, normal: 5, leisure: 3 }[priorityForRequest(request)];
    const points = correct ? reward : request.critical ? -8 : -5;
    return { outcome: correct ? "correct" : "wrong", points };
  }

  function missedResult(request) {
    return { outcome: "missed", points: request.critical ? -10 : -4 };
  }

  function successFeedback(actionKey, points) {
    return actionKey === "delegate" ? `정확한 전달! +${points}` : `정확한 처리! +${points}`;
  }

  function gradeForPerformance(results) {
    const correct = results.filter((result) => result.outcome === "correct").length;
    const missedCritical = results.filter((result) => result.critical && result.outcome !== "correct").length;
    const accuracy = results.length ? correct / results.length : 0;
    if (accuracy >= 0.8 && missedCritical === 0) return { grade: "perfect", workDelta: 2 };
    if (accuracy >= 0.5 && missedCritical <= 2) return { grade: "good", workDelta: 1 };
    return { grade: "messy", workDelta: -1 };
  }

  function finalizeResults(results) {
    const gradeData = gradeForPerformance(results);
    const score = Math.max(0, results.reduce((sum, result) => sum + result.points, 0));
    return {
      score,
      grade: gradeData.grade,
      workDelta: gradeData.workDelta,
      harinHandled: results.some((result) => result.harin && result.outcome === "correct"),
      missedCritical: results.filter((result) => result.critical && result.outcome !== "correct").map((result) => result.id),
      results: results.map((result) => ({ ...result })),
    };
  }

  const core = Object.freeze({ ACTIONS, REQUESTS, SUBTASK_REQUESTS, createSeededRandom, buildSchedule, priorityForRequest, evaluateAction, missedResult, successFeedback, gradeForPerformance, finalizeResults });
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (!global.document) return;

  const browserScriptSrc = document.currentScript?.src || "";
  let root = null;
  let refs = null;
  let state = null;
  let pointerDrag = null;

  function ensureStylesheet() {
    if (document.querySelector('link[data-work-alert-style]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.workAlertStyle = "true";
    link.href = browserScriptSrc ? new URL("../css/work-alert-minigame.css", browserScriptSrc).href : "css/work-alert-minigame.css";
    document.head.appendChild(link);
  }

  function ensureRoot() {
    if (root?.isConnected) return;
    root = document.createElement("section");
    root.id = "work-alert-minigame";
    root.className = "work-alert-minigame";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="wa-shell" role="dialog" aria-modal="true" aria-labelledby="wa-title">
        <header class="wa-header">
          <div class="wa-heading"><small>DAY 2 · MINI GAME</small><h2 id="wa-title">업무 알림 쳐내기</h2></div>
          <div class="wa-stats">
            <span><small>SCORE</small><b id="wa-score">0</b></span>
            <time id="wa-time" datetime="PT45S">00:45</time>
          </div>
        </header>
        <div id="wa-intro" class="wa-screen wa-intro">
          <div class="wa-intro-card">
            <div class="wa-intro-copy">
              <small>DAY 2 · MINI GAME</small>
              <h2>업무 알림 쳐내기</h2>
              <p>쌓여드는 요청을 읽고, 알맞은 업무 처리 방법을 선택하세요.</p>
              <strong>모르는 일은 담당자에게 넘기는 것도 업무입니다.</strong>
              <ul>
                <li>마우스 클릭으로 카드 선택 혹은 드래그앤 드롭</li>
                <li>업무 처리 1~6</li>
                <li>제한 시간 45초</li>
              </ul>
              <div class="wa-intro-start">
                <button id="wa-start" class="wa-primary" type="button">업무 시작</button>
                <kbd>ENTER</kbd>
              </div>
            </div>
            <div class="wa-intro-visual" aria-hidden="true">
              <article><b>긴급 회의 일정</b><span>10:45 임원 회의</span><em>URGENT</em></article>
            </div>
          </div>
        </div>
        <div id="wa-play" class="wa-screen wa-play" hidden>
          <div class="wa-board-wrap">
            <div id="wa-board" class="wa-board" aria-label="새 업무 요청" aria-live="polite"></div>
            <aside class="wa-messenger" aria-label="메신저 대화방">
              <b>사내 메신저</b>
              <span class="urgent"><i></i><span><strong>서하린</strong><small>긴급 요청</small></span><em>1</em></span>
              <span><i></i><span><strong>박태식 부장</strong><small>회의 관련</small></span></span>
              <span><i></i><span><strong>강민재</strong><small>파일 확인</small></span></span>
              <p><strong>TIP</strong>모르는 업무는<br>담당자에게 넘겨도 됩니다.</p>
            </aside>
          </div>
          <p id="wa-feedback" class="wa-feedback" role="status">요청 카드를 선택하세요.</p>
          <output id="wa-floating-feedback" class="wa-floating-feedback" aria-hidden="true"></output>
          <output id="wa-combo" class="wa-combo" hidden></output>
          <div id="wa-actions" class="wa-actions" aria-label="빠른 행동"></div>
        </div>
        <div id="wa-result" class="wa-screen wa-result" hidden>
          <div class="wa-result-card">
            <header>
              <small id="wa-result-kicker">RESULT</small>
              <h3 id="wa-result-title">업무 정리가 끝났습니다</h3>
              <p id="wa-result-summary"></p>
            </header>
            <div class="wa-result-body">
              <section class="wa-result-score"><span>FINAL SCORE</span><b id="wa-result-score">0</b></section>
              <section class="wa-result-stats">
                <p><span>업무력</span><b id="wa-result-work">+0</b></p>
                <p><span>신뢰도</span><b id="wa-result-trust">+0</b></p>
              </section>
              <section class="wa-result-history"><h4>처리 내역</h4><div id="wa-result-list" class="wa-result-list"></div></section>
            </div>
            <button id="wa-continue" class="wa-primary" type="button">계속하기</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(root);
    refs = {
      shell: root.querySelector(".wa-shell"),
      intro: root.querySelector("#wa-intro"), play: root.querySelector("#wa-play"), result: root.querySelector("#wa-result"),
      start: root.querySelector("#wa-start"), board: root.querySelector("#wa-board"), actions: root.querySelector("#wa-actions"),
      score: root.querySelector("#wa-score"), time: root.querySelector("#wa-time"), feedback: root.querySelector("#wa-feedback"),
      floatingFeedback: root.querySelector("#wa-floating-feedback"), combo: root.querySelector("#wa-combo"),
      resultKicker: root.querySelector("#wa-result-kicker"), resultTitle: root.querySelector("#wa-result-title"),
      resultSummary: root.querySelector("#wa-result-summary"), resultScore: root.querySelector("#wa-result-score"),
      resultWork: root.querySelector("#wa-result-work"), resultTrust: root.querySelector("#wa-result-trust"),
      resultList: root.querySelector("#wa-result-list"), continueButton: root.querySelector("#wa-continue"),
    };
    refs.start.addEventListener("click", beginGame);
    refs.actions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (button) handleAction(button.dataset.action);
    });
    refs.actions.addEventListener("dragover", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button || !state?.selectedId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      button.classList.add("drag-target");
    });
    refs.actions.addEventListener("dragleave", (event) => {
      event.target.closest("[data-action]")?.classList.remove("drag-target");
    });
    refs.actions.addEventListener("drop", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button || !state?.selectedId) return;
      event.preventDefault();
      clearActionDragState();
      handleAction(button.dataset.action);
    });
    root.addEventListener("pointermove", handlePointerDragMove);
    root.addEventListener("pointerup", finishPointerDrag);
    root.addEventListener("pointercancel", cancelPointerDrag);
    refs.continueButton.addEventListener("click", complete);
    root.addEventListener("keydown", handleKeyboard);
  }

  function showScreen(target) {
    if (target === refs.result) {
      refs.intro.hidden = true;
      refs.play.hidden = false;
      refs.result.hidden = false;
    } else {
      [refs.intro, refs.play, refs.result].forEach((screen) => { screen.hidden = screen !== target; });
    }
    refs.shell.dataset.screen = target.id.replace("wa-", "");
  }

  function requestResult(request, evaluation, selectedAction = null) {
    return {
      id: request.id,
      sender: request.sender,
      request: request.request,
      selectedAction,
      correctAction: request.action,
      outcome: evaluation.outcome,
      points: evaluation.points,
      critical: Boolean(request.critical),
      harin: Boolean(request.harin),
      response: request.response,
    };
  }

  function renderActions() {
    if (!refs.actions.children.length) {
      refs.actions.innerHTML = ACTIONS.map((action) => `<button type="button" data-action="${action.key}"><kbd>${action.keyHint}</kbd><span>${action.shortLabel}</span></button>`).join("");
    }
    refs.actions.querySelectorAll("[data-action]").forEach((button) => {
      button.setAttribute("aria-disabled", String(!state?.selectedId));
    });
  }

  function cardMarkup(request, slotIndex) {
    const cardKey = ["Q", "W", "E"][slotIndex] || "";
    const lane = priorityForRequest(request);
    const laneY = lane === "urgent" ? 8 + slotIndex * 2 : lane === "normal" ? 38 + slotIndex * 2 : 68 + slotIndex * 2;
    const tilt = [-2.5, 3.2, -3][slotIndex] || 0;
    return `<button type="button" class="wa-card${request.critical ? " critical" : ""}${state.selectedId === request.id ? " selected" : ""}" data-request-id="${request.id}" data-lane="${lane}" style="--x:${request.x}%;--y:${laneY}%;--tilt:${tilt}deg;--life:${request.lifeMs}ms" aria-label="${request.sender}의 요청: ${request.request}" aria-pressed="${state.selectedId === request.id}">
      <span class="wa-card-head"><b>${request.sender}</b><small>${request.critical ? `긴급 · ${cardKey}` : `요청 · ${cardKey}`}</small></span>
      <span class="wa-card-body">${request.request}</span>
      <i aria-hidden="true"></i>
    </button>`;
  }

  function wireCard(card) {
    card.addEventListener("click", (event) => {
      if (card.dataset.suppressClick === "true") {
        event.preventDefault();
        delete card.dataset.suppressClick;
        return;
      }
      selectRequest(card.dataset.requestId);
    });
    card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      pointerDrag = {
        card,
        requestId: card.dataset.requestId,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
      };
    });
  }

  function actionAtPoint(clientX, clientY) {
    const button = document.elementFromPoint(clientX, clientY)?.closest("[data-action]");
    return button && refs.actions.contains(button) ? button : null;
  }

  function handlePointerDragMove(event) {
    if (!pointerDrag) return;
    const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
    if (!pointerDrag.active && distance < 6) return;
    if (!pointerDrag.active) {
      pointerDrag.active = true;
      selectRequest(pointerDrag.requestId);
      pointerDrag.card.classList.add("dragging");
      refs.actions.classList.add("drag-ready");
    }
    refs.actions.querySelectorAll(".drag-target").forEach((button) => button.classList.remove("drag-target"));
    actionAtPoint(event.clientX, event.clientY)?.classList.add("drag-target");
    event.preventDefault();
  }

  function finishPointerDrag(event) {
    if (!pointerDrag) return;
    const drag = pointerDrag;
    pointerDrag = null;
    if (!drag.active) return;
    const actionButton = actionAtPoint(event.clientX, event.clientY);
    drag.card.dataset.suppressClick = "true";
    drag.card.classList.remove("dragging");
    clearActionDragState();
    event.preventDefault();
    if (actionButton) handleAction(actionButton.dataset.action);
  }

  function cancelPointerDrag() {
    if (!pointerDrag) return;
    pointerDrag.card.classList.remove("dragging");
    pointerDrag = null;
    clearActionDragState();
  }

  function clearActionDragState() {
    refs.actions.classList.remove("drag-ready");
    refs.actions.querySelectorAll(".drag-target").forEach((button) => button.classList.remove("drag-target"));
  }

  function renderBoard() {
    const active = [...state.active.values()];
    if (!refs.board.querySelector(".wa-board-lanes")) {
      refs.board.insertAdjacentHTML("afterbegin", '<div class="wa-board-lanes" aria-hidden="true"><span>긴급 업무</span><span>일반 업무</span><span>여유 업무</span></div>');
    }
    const activeIds = new Set(active.map((request) => request.id));
    refs.board.querySelectorAll(".wa-card").forEach((card) => {
      if (!activeIds.has(card.dataset.requestId)) card.remove();
    });
    active.forEach((request, slotIndex) => {
      let card = [...refs.board.querySelectorAll(".wa-card")].find((item) => item.dataset.requestId === request.id);
      if (!card) {
        refs.board.insertAdjacentHTML("beforeend", cardMarkup(request, slotIndex));
        card = [...refs.board.querySelectorAll(".wa-card")].find((item) => item.dataset.requestId === request.id);
        wireCard(card);
      }
      const cardKey = ["Q", "W", "E"][slotIndex] || "";
      const keyLabel = card.querySelector(".wa-card-head small");
      keyLabel.textContent = request.critical ? `긴급 · ${cardKey}` : `요청 · ${cardKey}`;
      card.classList.toggle("selected", state.selectedId === request.id);
      card.setAttribute("aria-pressed", String(state.selectedId === request.id));
    });
    renderActions();
  }

  function selectRequest(id) {
    if (!state?.active.has(id)) return;
    state.selectedId = id;
    const request = state.active.get(id);
    refs.feedback.textContent = `${request.sender}: ${request.request}`;
    refs.board.querySelectorAll(".wa-card").forEach((card) => {
      const selected = card.dataset.requestId === id;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });
    renderActions();
  }

  function showSuccessFeedback(actionKey, points) {
    refs.floatingFeedback.textContent = successFeedback(actionKey, points);
    refs.floatingFeedback.classList.remove("show");
    void refs.floatingFeedback.offsetWidth;
    refs.floatingFeedback.classList.add("show");
    global.clearTimeout(state.feedbackTimer);
    state.feedbackTimer = global.setTimeout(() => refs.floatingFeedback.classList.remove("show"), 1000);
  }

  function renderCombo() {
    refs.combo.hidden = state.combo < 2;
    refs.combo.textContent = state.combo < 2 ? "" : `COMBO ×${state.combo}`;
  }

  function handleAction(actionKey) {
    const request = state?.active.get(state.selectedId);
    if (!request) return;
    const evaluation = evaluateAction(request, actionKey);
    state.results.push(requestResult(request, evaluation, actionKey));
    state.active.delete(request.id);
    state.selectedId = null;
    state.score = Math.max(0, state.score + evaluation.points);
    refs.score.textContent = String(state.score);
    const action = ACTIONS.find((item) => item.key === actionKey);
    state.combo = evaluation.outcome === "correct" ? state.combo + 1 : 0;
    renderCombo();
    if (evaluation.outcome === "correct") showSuccessFeedback(actionKey, evaluation.points);
    refs.feedback.textContent = evaluation.outcome === "correct" ? `처리 완료 · ${request.response}` : `${action.label}은 맞지 않았습니다. 요청 내용을 다시 읽어 보세요.`;
    refs.feedback.dataset.tone = evaluation.outcome;
    renderBoard();
  }

  function handleKeyboard(event) {
    if (!state || refs.play.hidden) return;
    const action = ACTIONS.find((item) => item.keyHint === event.key);
    if (action && state.selectedId) {
      event.preventDefault();
      handleAction(action.key);
      return;
    }
    const active = [...state.active.values()];
    const cardKeys = { q: 0, w: 1, e: 2 };
    if (cardKeys[event.key.toLowerCase()] !== undefined && active[cardKeys[event.key.toLowerCase()]]) {
      event.preventDefault();
      selectRequest(active[cardKeys[event.key.toLowerCase()]].id);
    }
  }

  function expireRequests() {
    let changed = false;
    [...state.active.values()].forEach((request) => {
      if (request.expiresAt > state.elapsed) return;
      const evaluation = missedResult(request);
      state.results.push(requestResult(request, evaluation));
      state.active.delete(request.id);
      if (state.selectedId === request.id) state.selectedId = null;
      state.score = Math.max(0, state.score + evaluation.points);
      refs.feedback.textContent = `${request.sender}의 요청을 놓쳤습니다.`;
      refs.feedback.dataset.tone = "missed";
      state.combo = 0;
      changed = true;
    });
    if (changed) renderCombo();
    return changed;
  }

  function spawnRequests() {
    let changed = false;
    while (state.nextIndex < state.schedule.length && state.schedule[state.nextIndex].spawnAt <= state.elapsed && state.active.size < 3) {
      const request = { ...state.schedule[state.nextIndex], expiresAt: state.elapsed + state.schedule[state.nextIndex].lifeMs };
      state.active.set(request.id, request);
      state.nextIndex += 1;
      changed = true;
    }
    return changed;
  }

  function updateCardTimers() {
    refs.board.querySelectorAll(".wa-card").forEach((card) => {
      const request = state.active.get(card.dataset.requestId);
      if (!request) return;
      const ratio = Math.max(0, Math.min(1, (request.expiresAt - state.elapsed) / request.lifeMs));
      const bar = card.querySelector("i");
      if (bar) bar.style.setProperty("--remaining", ratio);
    });
  }

  function tick(now) {
    if (!state || state.finished || state.paused) return;
    const rawDelta = now - state.lastFrame;
    state.lastFrame = now;
    state.elapsed += rawDelta * (state.selectedId ? 0.45 : 1);
    const expired = expireRequests();
    const spawned = spawnRequests();
    const changed = expired || spawned;
    const remaining = Math.max(0, state.durationMs - state.elapsed);
    const remainingSeconds = Math.ceil(remaining / 1000);
    refs.time.textContent = `00:${String(remainingSeconds).padStart(2, "0")}`;
    refs.time.dateTime = `PT${remainingSeconds}S`;
    refs.time.classList.toggle("danger", remaining <= 10000);
    refs.score.textContent = String(state.score);
    if (changed) renderBoard();
    updateCardTimers();
    if (remaining <= 0) finishGame();
    else state.frame = requestAnimationFrame(tick);
  }

  function beginGame() {
    state.started = true;
    showScreen(refs.play);
    renderBoard();
    state.lastFrame = performance.now();
    state.frame = requestAnimationFrame(tick);
    refs.board.focus?.();
  }

  function finishGame() {
    if (!state || state.finished) return;
    state.finished = true;
    cancelAnimationFrame(state.frame);
    [...state.active.values()].forEach((request) => state.results.push(requestResult(request, missedResult(request))));
    state.schedule.slice(state.nextIndex).forEach((request) => state.results.push(requestResult(request, missedResult(request))));
    state.active.clear();
    state.finalResult = finalizeResults(state.results);
    renderResult(state.finalResult);
    showScreen(refs.result);
    refs.continueButton.focus();
  }

  function renderResult(result) {
    const copy = {
      perfect: { icon: "★", kicker: "CLEAR DESK", title: "쏟아진 요청을 정확하게 정리했습니다", summary: "서하린의 요청까지 놓치지 않았습니다. 전부 직접 하지 않고 필요한 곳에 잘 넘겼습니다." },
      good: { icon: "✓", kicker: "WORK COMPLETE", title: "급한 업무는 무사히 처리했습니다", summary: "몇 가지 잡담에는 너무 성실했지만 중요한 요청은 대부분 남았습니다." },
      messy: { icon: "!", kicker: "INBOX OVERFLOW", title: "메신저가 잠깐 전쟁터가 됐습니다", summary: "보안 교육을 스팸으로 보내지만 않으면 됩니다. 놓친 핵심 정보는 나중에 다시 확인할 수 있습니다." },
    }[result.grade];
    refs.resultKicker.textContent = "RESULT";
    refs.resultTitle.textContent = "업무 정리가 끝났습니다";
    refs.resultSummary.textContent = copy.summary;
    refs.resultScore.textContent = String(result.score);
    refs.resultWork.textContent = `${result.workDelta > 0 ? "+" : ""}${result.workDelta}`;
    refs.resultWork.className = result.workDelta > 0 ? "up" : "down";
    refs.resultTrust.textContent = result.grade === "perfect" ? "+1" : "+0";
    refs.resultTrust.className = result.grade === "perfect" ? "up" : "";
    refs.resultList.innerHTML = result.results.map((item) => `<article data-outcome="${item.outcome}"><b>${item.request || item.sender}</b><span>${item.outcome === "correct" ? "완료" : item.outcome === "missed" ? "누락" : "오류"}</span></article>`).join("");
  }

  function complete() {
    if (!state || state.completionSent) return;
    state.completionSent = true;
    global.clearTimeout(state.feedbackTimer);
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    state.onComplete?.(state.finalResult);
  }

  function start(options = {}) {
    ensureStylesheet();
    ensureRoot();
    if (state?.frame) cancelAnimationFrame(state.frame);
    if (state?.feedbackTimer) global.clearTimeout(state.feedbackTimer);
    const duration = options.duration || 45;
    const random = options.random || (options.seed === undefined ? Math.random : createSeededRandom(options.seed));
    state = {
      durationMs: duration * 1000,
      schedule: buildSchedule({ random, requests: options.requests, count: options.count || 16, duration, lifeMs: options.lifeMs }),
      nextIndex: 0, active: new Map(), selectedId: null, results: [], score: 0, combo: 0, elapsed: 0,
      lastFrame: 0, frame: null, started: false, paused: false, finished: false, completionSent: false,
      finalResult: null, feedbackTimer: null, onComplete: options.onComplete,
    };
    refs.score.textContent = "0";
    refs.time.textContent = `00:${String(duration).padStart(2, "0")}`;
    refs.time.dateTime = `PT${duration}S`;
    refs.time.classList.remove("danger");
    refs.feedback.textContent = "요청 카드를 선택하세요.";
    refs.feedback.dataset.tone = "normal";
    refs.floatingFeedback.classList.remove("show");
    renderCombo();
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    showScreen(refs.intro);
    refs.start.focus();
  }

  function pause() {
    if (!state?.started || state.finished || state.paused) return;
    state.paused = true;
    cancelAnimationFrame(state.frame);
    state.frame = null;
  }

  function resume() {
    if (!state?.paused || state.finished) return;
    state.paused = false;
    state.lastFrame = performance.now();
    state.frame = requestAnimationFrame(tick);
  }

  document.addEventListener("nan:settings-open", pause);
  document.addEventListener("nan:settings-close", resume);
  document.addEventListener("nan:pause-open", pause);
  document.addEventListener("nan:pause-close", resume);

  global.WorkAlertMinigame = Object.freeze({ start, pause, resume, core });
})(typeof window !== "undefined" ? window : globalThis);
