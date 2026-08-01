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

  function messageReply(index = 0, affection = 0) {
    const level = affection >= 4 ? "high" : affection >= 2 ? "mid" : "low";
    const replies = [
      {
        low: "점심 메뉴는 오전 조사부터 끝내고 생각해요.",
        mid: "아직 못 정했어요. 오전 조사 끝나면 같이 봐요.",
        high: "저도 고민 중이었어요. 조사 끝나면 같이 골라요.",
      },
      {
        low: "입맛에 맞았다니 다행이에요.",
        mid: "그 음료 괜찮죠. 너무 달지 않아서 저도 가끔 골라요.",
        high: "그거 괜찮죠? 다음에는 다른 것도 추천해 드릴게요.",
      },
      {
        low: "일단 오늘 일부터 마무리해요.",
        mid: "시간이 괜찮으면요. 우선 오늘 일부터 끝내요.",
        high: "좋아요. 오늘 일찍 끝나면 같이 내려가요.",
      },
    ];
    return replies[index]?.[level] || replies[index]?.low || "";
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

  return Object.freeze({ QUESTIONS, grade, reply, messageReply });
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
          <div class="sc-office-scene" aria-label="통창이 있는 도트 사무실">
            <div class="sc-office-wall"><div class="sc-office-window"></div></div>
            <div class="sc-boss-desk"><i></i></div>
            <div class="sc-team-pod" aria-hidden="true">
              <div class="sc-pixel-desk sc-desk-doyun"></div>
              <div class="sc-pixel-desk sc-desk-harin"></div>
              <div class="sc-pixel-desk sc-desk-minjae"></div>
            </div>
            <div class="sc-pixel-actor sc-actor-boss" id="sc-office-boss" aria-label="박태식 부장">
              <svg class="sc-boss-back" viewBox="0 0 56 80" shape-rendering="crispEdges" aria-hidden="true">
                <rect x="18" y="4" width="20" height="4" fill="#403739"/><rect x="12" y="8" width="32" height="5" fill="#403739"/>
                <rect x="9" y="13" width="38" height="25" fill="#d7a888"/><rect x="11" y="9" width="34" height="16" fill="#463b3a"/>
                <rect x="8" y="24" width="8" height="14" fill="#463b3a"/><rect x="40" y="24" width="8" height="14" fill="#463b3a"/>
                <rect x="18" y="37" width="20" height="6" fill="#d7a888"/><rect x="8" y="43" width="40" height="25" fill="#eee8df"/>
                <rect x="3" y="46" width="8" height="20" fill="#eee8df"/><rect x="45" y="46" width="8" height="20" fill="#eee8df"/>
                <rect x="12" y="68" width="14" height="10" fill="#34343c"/><rect x="31" y="68" width="14" height="10" fill="#34343c"/>
              </svg>
              <svg class="sc-boss-front" viewBox="0 0 56 80" shape-rendering="crispEdges" aria-hidden="true">
                <rect x="18" y="4" width="20" height="4" fill="#403739"/><rect x="12" y="8" width="32" height="5" fill="#403739"/>
                <rect x="9" y="13" width="38" height="24" fill="#d7a888"/><rect x="12" y="11" width="32" height="7" fill="#463b3a"/>
                <rect x="15" y="24" width="6" height="3" fill="#30292b"/><rect x="35" y="24" width="6" height="3" fill="#30292b"/>
                <rect x="19" y="31" width="18" height="4" fill="#8f604f"/><rect x="18" y="37" width="20" height="6" fill="#d7a888"/>
                <rect x="8" y="43" width="40" height="25" fill="#eee8df"/><rect x="25" y="43" width="7" height="24" fill="#34333a"/>
                <rect x="3" y="46" width="8" height="20" fill="#eee8df"/><rect x="45" y="46" width="8" height="20" fill="#eee8df"/>
                <rect x="12" y="68" width="14" height="10" fill="#34343c"/><rect x="31" y="68" width="14" height="10" fill="#34343c"/>
              </svg><span>박태식 부장</span>
            </div>
            <div class="sc-pixel-actor sc-actor-doyun" aria-label="한도윤">
              <svg viewBox="0 0 56 80" shape-rendering="crispEdges" aria-hidden="true">
                <rect x="17" y="3" width="22" height="4" fill="#252b38"/><rect x="11" y="7" width="35" height="13" fill="#252b38"/>
                <rect x="15" y="12" width="27" height="25" fill="#edbf9f"/><rect x="10" y="11" width="9" height="20" fill="#252b38"/><rect x="39" y="9" width="7" height="20" fill="#252b38"/>
                <rect x="20" y="24" width="4" height="3" fill="#303039"/><rect x="34" y="24" width="4" height="3" fill="#303039"/>
                <rect x="21" y="37" width="16" height="6" fill="#edbf9f"/><rect x="11" y="43" width="35" height="25" fill="#364b63"/>
                <rect x="24" y="43" width="9" height="22" fill="#e9edef"/><rect x="5" y="46" width="8" height="20" fill="#364b63"/><rect x="44" y="46" width="8" height="20" fill="#364b63"/>
                <rect x="13" y="68" width="14" height="10" fill="#252c3a"/><rect x="31" y="68" width="14" height="10" fill="#252c3a"/>
              </svg><span>한도윤</span>
            </div>
            <div class="sc-pixel-actor sc-actor-harin" aria-label="서하린">
              <svg viewBox="0 0 56 80" shape-rendering="crispEdges" aria-hidden="true">
                <rect x="17" y="3" width="22" height="4" fill="#5a3535"/><rect x="10" y="7" width="36" height="19" fill="#5a3535"/>
                <rect x="15" y="11" width="27" height="27" fill="#f0c2a5"/><rect x="9" y="12" width="9" height="29" fill="#5a3535"/><rect x="39" y="11" width="8" height="30" fill="#5a3535"/>
                <rect x="20" y="24" width="4" height="3" fill="#493134"/><rect x="34" y="24" width="4" height="3" fill="#493134"/><rect x="25" y="32" width="8" height="3" fill="#c16d72"/>
                <rect x="21" y="39" width="16" height="5" fill="#f0c2a5"/><rect x="11" y="44" width="35" height="24" fill="#202937"/>
                <rect x="23" y="44" width="12" height="22" fill="#edf0ef"/><rect x="5" y="47" width="8" height="19" fill="#202937"/><rect x="44" y="47" width="8" height="19" fill="#202937"/>
                <rect x="14" y="68" width="13" height="10" fill="#20232e"/><rect x="31" y="68" width="13" height="10" fill="#20232e"/>
              </svg><span>서하린</span>
            </div>
            <div class="sc-pixel-actor sc-actor-minjae" aria-label="강민재">
              <svg viewBox="0 0 56 80" shape-rendering="crispEdges" aria-hidden="true">
                <rect x="15" y="3" width="25" height="4" fill="#252a34"/><rect x="9" y="7" width="38" height="14" fill="#252a34"/>
                <rect x="15" y="12" width="27" height="26" fill="#e9bb9d"/><rect x="9" y="10" width="10" height="21" fill="#252a34"/><rect x="39" y="9" width="8" height="19" fill="#252a34"/>
                <rect x="19" y="23" width="7" height="5" fill="none" stroke="#39414c" stroke-width="2"/><rect x="32" y="23" width="7" height="5" fill="none" stroke="#39414c" stroke-width="2"/><rect x="26" y="25" width="6" height="2" fill="#39414c"/>
                <rect x="21" y="38" width="16" height="6" fill="#e9bb9d"/><rect x="11" y="44" width="35" height="24" fill="#68798b"/>
                <rect x="23" y="44" width="12" height="22" fill="#e9edef"/><rect x="5" y="47" width="8" height="19" fill="#68798b"/><rect x="44" y="47" width="8" height="19" fill="#68798b"/>
                <rect x="14" y="68" width="13" height="10" fill="#303746"/><rect x="31" y="68" width="13" height="10" fill="#303746"/>
              </svg><span>강민재</span>
            </div>
            <div class="sc-watch sc-patrol" id="sc-watch" data-phase="safe">
              <span class="sc-boss">박태식 부장</span><strong id="sc-status">서류 확인 중 · 안전</strong>
              <div class="sc-meter"><i id="sc-meter"></i></div>
            </div>
            <div class="sc-scene-warning" id="sc-scene-warning" aria-hidden="true"><b>!</b><span>잠시 후 부장님이 뒤돌아봅니다</span></div>
            <div class="sc-scene-reply" id="sc-scene-reply" aria-live="polite"><b>서하린</b><span></span></div>
            <div class="sc-scene-result" id="sc-scene-result" aria-live="assertive"><b></b><span></span></div>
          </div>
          <div class="sc-control-area">
            <div class="sc-mission">
              <b>각자의 책상에서 업무 중입니다</b>
              <span id="sc-feedback">부장의 움직임을 확인하세요.</span>
            </div>
            <div class="sc-message-preview">
              <small>서하린에게 · 보낼 메시지 <b id="sc-message-order">1/3</b></small>
              <p id="sc-question"></p>
              <div id="sc-thread" hidden aria-live="polite"></div>
              <div class="sc-progress"><i id="sc-progress"></i></div>
            </div>
            <div class="sc-actions">
              <button id="sc-hold" type="button">누르고 답장 작성</button>
              <div class="sc-count"><span class="sc-count-sent">전송 <b id="sc-sent">0</b>/3</span><span class="sc-count-warning">경고 <b id="sc-warnings">0</b>/3</span></div>
              <small>부장님이 돌아보면 버튼을 놓으세요</small>
            </div>
          </div>
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
      thread: root.querySelector("#sc-thread"),
      messageOrder: root.querySelector("#sc-message-order"),
      officeBoss: root.querySelector("#sc-office-boss"),
      sceneReply: root.querySelector("#sc-scene-reply"), sceneResult: root.querySelector("#sc-scene-result"),
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
    refs.messageOrder.textContent = `${Math.min(state.sent + 1, 3)}/3`;
    refs.progress.style.width = `${state.progress}%`;
    refs.sent.textContent = state.sent;
    refs.warnings.textContent = state.warnings;
  }

  function appendExchange(index) {
    const sent = global.SecretChatMinigameCore.QUESTIONS[index];
    const received = global.SecretChatMinigameCore.messageReply(index, state.affection);
    const exchange = document.createElement("div");
    exchange.className = "sc-exchange";
    exchange.innerHTML = `<p class="sc-message sc-message-sent"><small>한도윤</small>${sent}</p><p class="sc-message sc-message-received"><small>서하린</small>${received}</p>`;
    refs.thread.appendChild(exchange);
    refs.thread.scrollTop = refs.thread.scrollHeight;
    refs.sceneReply.querySelector("span").textContent = received;
    refs.sceneReply.classList.add("show");
    refs.sceneResult.querySelector("b").textContent = "전송 성공!";
    refs.sceneResult.querySelector("span").textContent = `${index + 1}번째 답장을 보냈습니다`;
    refs.sceneResult.classList.add("show", "success");
    global.UiSfx?.playMinigameCue?.("success");
    window.setTimeout(() => {
      refs.sceneReply.classList.remove("show");
      if (index < 2) refs.sceneResult.classList.remove("show", "success");
    }, index < 2 ? 1300 : 2100);
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
    refs.play.dataset.phase = phase;
    refs.officeBoss.dataset.phase = phase;
    if (phase !== state.lastPhase) {
      if (phase === "warning") global.UiSfx?.playMinigameCue?.("warning");
      state.lastPhase = phase;
    }
    refs.status.textContent = phaseCopy(phase);
    refs.meter.style.width = `${Math.min(100, ((now - state.started) % 7000) / 70)}%`;
    if (state.typing && phase === "danger") {
      state.typing = false;
      state.warnings += 1;
      refs.feedback.textContent = "부장과 눈이 마주쳤습니다. 업무 화면으로 전환했습니다.";
      refs.play.classList.remove("caught");
      void refs.play.offsetWidth;
      refs.play.classList.add("caught");
      refs.sceneResult.querySelector("b").textContent = "발각!";
      refs.sceneResult.querySelector("span").textContent = `경고 ${state.warnings}/3`;
      refs.sceneResult.className = "sc-scene-result show caught";
      global.UiSfx?.playMinigameCue?.("caught");
      window.setTimeout(() => {
        refs.play.classList.remove("caught");
        refs.sceneResult.classList.remove("show", "caught");
      }, 900);
      renderQuestion();
      if (state.warnings >= 3) return finish();
    } else if (state.typing && phase !== "danger") {
      state.progress += delta * (phase === "warning" ? 0.025 : 0.045);
      if (state.progress >= 100) {
        const messageIndex = state.sent;
        state.sent += 1;
        state.progress = 0;
        state.typing = false;
        appendExchange(messageIndex);
        refs.feedback.textContent = "서하린의 답장이 도착했습니다.";
        renderQuestion();
        if (state.sent >= 3) {
          refs.hold.disabled = true;
          state.finishTimer = window.setTimeout(finish, 2200);
          return;
        }
      } else renderQuestion();
    }
    if (remaining <= 0) return finish();
    state.frame = requestAnimationFrame(tick);
  }

  function begin() {
    state = { sent: 0, warnings: 0, progress: 0, typing: false, done: false, paused: false, started: performance.now(), last: performance.now(), lastPhase: "safe", frame: 0, onComplete: state?.onComplete, affection: state?.affection || 0 };
    refs.thread.replaceChildren();
    refs.sceneReply.classList.remove("show");
    refs.sceneResult.className = "sc-scene-result";
    refs.hold.disabled = false;
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
    state = { onComplete: options.onComplete, affection: Number(options.affection) || 0, done: true };
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
