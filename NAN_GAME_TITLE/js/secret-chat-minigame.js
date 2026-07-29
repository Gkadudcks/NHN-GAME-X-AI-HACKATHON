(function exposeSecretChat(root, factory) {
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  if (root) root.SecretChatMinigameCore = core;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCore() {
  "use strict";

  const QUESTIONS = Object.freeze([
    "선배, 오전 조사 끝나면 점심 메뉴 뭐 드실 거예요?",
    "어제 편의점에서 추천한 음료, 생각보다 괜찮았습니다.",
    "오늘도 늦어질 것 같으면 커피라도 미리 사둘까요?",
  ]);

  function grade({ sent = 0, warnings = 0, elapsed = 0 } = {}) {
    if (sent >= 3 && warnings === 0 && elapsed <= 42) return { grade: "perfect", workDelta: 0, affectionDelta: 2 };
    if (sent >= 3) return { grade: "good", workDelta: 0, affectionDelta: 1 };
    return { grade: "caught", workDelta: -1, affectionDelta: 0 };
  }

  function reply(gradeResult = "good", affection = 0) {
    const level = affection >= 4 ? "high" : affection >= 2 ? "mid" : "low";
    const dialogue = {
      perfect: {
        low: "메시지 봤어요. 점심 메뉴는 조금 있다가 정하고, 지금은 조사부터 마무리해요.",
        mid: "추천한 음료 괜찮았다니 다행이네요. 점심 메뉴는 조사 끝나고 같이 정해요.",
        high: "그 음료 마음에 들었어요? 다음에는 다른 것도 추천해 줄게요. 커피는 제가 살게요.",
      },
      good: {
        low: "메시지 봤어요. 점심 이야기는 조사 끝나고 다시 해요.",
        mid: "음료는 입맛에 맞았다니 다행이에요. 시간 되면 점심 메뉴 같이 봐요.",
        high: "메시지 보자마자 웃었어요. 커피는 됐고, 일 끝나면 같이 고르러 가요.",
      },
      caught: {
        low: "부장님 바로 앞이라 길게 답은 못 하겠어요. 업무에 집중해요.",
        mid: "부장님 바로 앞이라 길게 답은 못 하겠어요. 음료 이야기는 나중에 해요.",
        high: "지금 부장님 보고 있죠? 답장은 나중에 해도 돼요. 커피 얘기는 일 끝나고 해요.",
      },
    }[gradeResult] || {};
    const message = {
      low: "메시지는 확인했어요. 점심 이야기는 조사 끝나고 다시 해요.",
      mid: "추천한 음료는 괜찮았다니 다행이에요. 점심 메뉴는 조금 있다가 같이 봐요.",
      high: "커피는 제가 살게요. 일 끝나면 어떤 걸 마실지 같이 골라요.",
    };
    return Object.freeze({ dialogue: dialogue[level] || dialogue.mid || "", message: message[level] });
  }

  return Object.freeze({ QUESTIONS, grade, reply });
});

(function initBrowser(global) {
  "use strict";
  if (!global.document || !global.SecretChatMinigameCore) return;

  let root;
  let refs;
  let state;

  function ensureRoot() {
    if (root?.isConnected) return;
    root = document.createElement("section");
    root.className = "secret-chat-minigame";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="sc-shell" role="dialog" aria-modal="true" aria-labelledby="sc-title">
        <header><div><small>DAY 2 · MINI GAME</small><h2 id="sc-title">업무 중 개인 메시지 답장하기</h2></div><span>남은 시간 <b id="sc-time">50</b></span></header>
        <section id="sc-intro" class="sc-screen sc-intro">
          <div class="sc-placeholder"><b>업무 자리 · 오전</b><span>박태식 부장의 시선을 피해 서하린의 개인 메시지에 짧게 답장하세요.</span></div>
          <p>버튼이나 Space를 누르는 동안 메시지를 작성합니다. 부장이 고개를 들면 즉시 손을 떼세요.</p>
          <button id="sc-start" class="sc-primary" type="button">대화 시작</button>
        </section>
        <section id="sc-play" class="sc-screen sc-play" hidden>
          <div class="sc-watch" id="sc-watch" data-phase="safe">
            <span class="sc-boss">박태식 부장</span><strong id="sc-status">서류 확인 중 · 안전</strong>
            <div class="sc-meter"><i id="sc-meter"></i></div>
          </div>
          <div class="sc-phone">
            <small>서하린 선배에게</small><p id="sc-question"></p>
            <div class="sc-progress"><i id="sc-progress"></i></div>
            <button id="sc-hold" type="button">누르고 답장 작성</button>
          </div>
          <p id="sc-feedback">부장의 움직임을 확인하세요.</p>
          <div class="sc-count"><span>전송 <b id="sc-sent">0</b>/3</span><span>경고 <b id="sc-warnings">0</b>/3</span></div>
        </section>
        <section id="sc-result" class="sc-screen sc-result" hidden>
          <small id="sc-result-kicker">CONTACT COMPLETE</small><h3 id="sc-result-title"></h3><p id="sc-result-text"></p>
          <div><span>업무력 <b id="sc-work"></b></span><span>호감도 <b id="sc-trust"></b></span></div>
          <button id="sc-continue" class="sc-primary" type="button">스토리 계속하기</button>
        </section>
      </div>`;
    document.body.appendChild(root);
    refs = {
      intro: root.querySelector("#sc-intro"), play: root.querySelector("#sc-play"), result: root.querySelector("#sc-result"),
      start: root.querySelector("#sc-start"), time: root.querySelector("#sc-time"), watch: root.querySelector("#sc-watch"),
      status: root.querySelector("#sc-status"), meter: root.querySelector("#sc-meter"), question: root.querySelector("#sc-question"),
      progress: root.querySelector("#sc-progress"), hold: root.querySelector("#sc-hold"), feedback: root.querySelector("#sc-feedback"),
      sent: root.querySelector("#sc-sent"), warnings: root.querySelector("#sc-warnings"), resultTitle: root.querySelector("#sc-result-title"),
      resultText: root.querySelector("#sc-result-text"), work: root.querySelector("#sc-work"), trust: root.querySelector("#sc-trust"),
      continueButton: root.querySelector("#sc-continue"),
    };
    refs.start.onclick = begin;
    refs.hold.addEventListener("pointerdown", () => setTyping(true));
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => refs.hold.addEventListener(type, () => setTyping(false)));
    root.addEventListener("keydown", (event) => { if (event.code === "Space") { event.preventDefault(); setTyping(true); } });
    root.addEventListener("keyup", (event) => { if (event.code === "Space") setTyping(false); });
    refs.continueButton.onclick = complete;
  }

  function screen(target) {
    [refs.intro, refs.play, refs.result].forEach((node) => { node.hidden = node !== target; });
  }

  function phaseAt(ms) {
    const cycle = ms % 7000;
    if (cycle < 3800) return "safe";
    if (cycle < 5000) return "warning";
    return "danger";
  }

  function phaseCopy(phase) {
    if (phase === "safe") return "서류 확인 중 · 안전";
    if (phase === "warning") return "커피를 내려놓았다 · 주의";
    return "도윤 쪽을 보는 중 · 멈춤";
  }

  function setTyping(value) {
    if (!state || state.done || state.paused) return;
    state.typing = value;
    refs.hold.classList.toggle("active", value);
  }

  function renderQuestion() {
    refs.question.textContent = global.SecretChatMinigameCore.QUESTIONS[state.sent] || "하고 싶었던 말을 모두 보냈습니다.";
    refs.progress.style.width = `${state.progress}%`;
    refs.sent.textContent = state.sent;
    refs.warnings.textContent = state.warnings;
  }

  function finish() {
    if (state.done) return;
    state.done = true;
    cancelAnimationFrame(state.frame);
    const result = { ...global.SecretChatMinigameCore.grade({ sent: state.sent, warnings: state.warnings, elapsed: state.elapsed }), sent: state.sent, warnings: state.warnings, elapsed: Math.round(state.elapsed) };
    state.result = result;
    const perfect = result.grade === "perfect";
    const caught = result.grade === "caught";
    refs.resultTitle.textContent = perfect ? "짧은 잡담을 자연스럽게 이어갔습니다" : caught ? "부장에게 개인 메시지를 들켰습니다" : "무리 없이 답장을 보냈습니다";
    refs.resultText.textContent = caught ? "답장은 짧게 끊겼지만, 하린은 메시지를 확인했습니다." : "업무 이야기 사이에 가벼운 잡담을 나눴습니다.";
    refs.work.textContent = `${result.workDelta >= 0 ? "+" : ""}${result.workDelta}`;
    refs.trust.textContent = `${result.affectionDelta >= 0 ? "+" : ""}${result.affectionDelta}`;
    screen(refs.result);
    refs.continueButton.focus();
  }

  function tick(now) {
    if (state.done || state.paused) return;
    const delta = Math.min(50, now - state.last);
    state.last = now;
    state.elapsed = (now - state.started) / 1000;
    const remaining = Math.max(0, 50 - state.elapsed);
    refs.time.textContent = String(Math.ceil(remaining));
    const phase = phaseAt(now - state.started);
    refs.watch.dataset.phase = phase;
    refs.status.textContent = phaseCopy(phase);
    refs.meter.style.width = `${Math.min(100, ((now - state.started) % 7000) / 70)}%`;
    if (state.typing && phase === "danger") {
      state.typing = false;
      state.warnings += 1;
      refs.feedback.textContent = "부장과 눈이 마주쳤습니다. 업무 화면으로 전환했습니다.";
      renderQuestion();
      if (state.warnings >= 3) return finish();
    } else if (state.typing && phase !== "danger") {
      state.progress += delta * (phase === "warning" ? 0.025 : 0.045);
      if (state.progress >= 100) {
        state.sent += 1;
        state.progress = 0;
        refs.feedback.textContent = "메시지를 전송했습니다.";
        renderQuestion();
        if (state.sent >= 3) return finish();
      } else renderQuestion();
    }
    if (remaining <= 0) return finish();
    state.frame = requestAnimationFrame(tick);
  }

  function begin() {
    state = { sent: 0, warnings: 0, progress: 0, typing: false, done: false, paused: false, started: performance.now(), last: performance.now(), frame: 0, onComplete: state?.onComplete };
    screen(refs.play);
    renderQuestion();
    refs.hold.focus();
    state.frame = requestAnimationFrame(tick);
  }

  function complete() {
    const callback = state.onComplete;
    const result = state.result;
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    callback?.(result);
  }

  function start(options = {}) {
    ensureRoot();
    state = { onComplete: options.onComplete, done: true };
    screen(refs.intro);
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    refs.start.focus();
  }

  function pause() {
    if (!state || state.done || state.paused || refs.play.hidden) return;
    state.paused = true;
    state.pausedAt = performance.now();
    state.typing = false;
    cancelAnimationFrame(state.frame);
    state.frame = 0;
  }

  function resume() {
    if (!state?.paused || state.done) return;
    const now = performance.now();
    state.started += now - state.pausedAt;
    state.last = now;
    state.paused = false;
    state.frame = requestAnimationFrame(tick);
  }

  document.addEventListener("nan:settings-open", pause);
  document.addEventListener("nan:settings-close", resume);
  document.addEventListener("nan:pause-open", pause);
  document.addEventListener("nan:pause-close", resume);

  global.SecretChatMinigame = Object.freeze({ start, pause, resume });
})(typeof globalThis !== "undefined" ? globalThis : this);
