(function (global) {
  "use strict";

  const STEPS = Object.freeze([
    {
      label: "01 · 자동 갱신",
      prompt: "복구 중 출처가 다시 바뀌지 않도록 먼저 무엇을 할까?",
      signal: ["원본 다시 불러오는 중", "7일 차 잔존율 검증본", "12.7% · 연결 중"],
      options: [
        { id: "pause_refresh", text: "자동 갱신을 일시 중지한다.", correct: true },
        { id: "keep_refresh", text: "최신 값이 들어오도록 자동 갱신을 유지한다." },
      ],
    },
    {
      label: "02 · 제출 당시 원본",
      prompt: "18.4%를 검증한 복구 원본을 선택하세요.",
      signal: ["DAY 4 · 17:08", "18.4% · 제출 당시", "12.7% · 2024년 보관본"],
      options: [
        { id: "current_week", text: "현재 분석 원본 · 신규유저 7일 차 잔존율", correct: true },
        { id: "archive", text: "2024년 이전 자료 · 신규유저 7일 차 잔존율" },
        { id: "preview", text: "임시 미리보기 파일" },
      ],
    },
    {
      label: "03 · 분석 기준",
      prompt: "발표 자료와 같은 분석 대상과 기간을 선택하세요.",
      signal: ["TARGET · NEW USERS", "WINDOW · 7 DAYS", "SCOPE · CURRENT WEEK"],
      options: [
        { id: "new_users_current_week", text: "신규 가입 사용자 · 발표 전주", correct: true },
        { id: "all_users_current_week", text: "전체 사용자 · 발표 전주" },
        { id: "new_users_year", text: "신규 가입 사용자 · 연간 누적" },
      ],
    },
    {
      label: "04 · 출처 연결",
      prompt: "복구한 증빙을 어떤 방식으로 연결할까?",
      signal: ["원본 · 고정", "자동 갱신 · 중지", "근거 자료 · 다시 연결"],
      options: [
        { id: "fixed_source", text: "검증된 원본 ID를 고정하고 자동 갱신을 끈다.", correct: true },
        { id: "new_alias", text: "새 별칭을 만들고 자동 갱신을 유지한다." },
      ],
    },
  ]);
  const VALIDATION_STEPS = Object.freeze([
    {
      type: "capture", label: "01 · 사실 포착", speaker: "평가위원",
      claim: "제출 전부터 증빙 수치는 12.7%였을 수 있습니다.",
      prompt: "빠르게 지나가는 기록에서 이 주장을 반박할 확정 사실을 포착하세요.",
      options: [
        { id: "verified_facts", text: "발표 자료와 근거 자료 모두 18.4%", correct: true },
        { id: "blame_harin", text: "서하린이 실행했습니다" },
        { id: "blame_bot", text: "나나봇이 독립적으로 변경했습니다" },
      ],
    },
    {
      type: "connect", label: "02 · 연결 변경 추적", speaker: "평가위원",
      claim: "12.7%는 어떤 경로로 공식 증빙 화면에 나타났는가?",
      prompt: "로그를 발생 순서대로 연결해 직접 변경 경로를 완성하세요.",
      items: [
        { id: "verified_alias", text: "검증본 자동 연결", detail: "7일 차 잔존율 검증본" },
        { id: "alias_changed", text: "09:58 연결 변경", detail: "ALIAS CHANGED" },
        { id: "archive", text: "2024년 이전 자료", detail: "7일 차 잔존율 보관본" },
        { id: "alias_to_archive", text: "12.7% 화면 노출", detail: "제출 자료 다시 불러오기" },
      ],
      order: ["verified_alias", "alias_changed", "archive", "alias_to_archive"],
    },
    {
      type: "rebuttal", label: "03 · 실행자 반박", speaker: "평가위원",
      claim: "규칙 소유자는 서하린입니다. 따라서 이번 재활성화도 서하린이 요청했습니다.",
      prompt: "주장의 모순 문구를 지정한 뒤 반박 증거를 연결하세요.",
      contradiction: "이번 재활성화도 서하린이 요청했습니다.",
      evidence: [
        { id: "distinguish_roles", text: "REQUEST ACCOUNT · KANG MINJAE", correct: true },
        { id: "owner_is_actor", text: "OWNER · SEO HARIN" },
        { id: "bot_is_actor", text: "SERVICE · NANABOT" },
      ],
    },
    {
      type: "connect", label: "04 · 사건 경로 재구성", speaker: "한도윤",
      claim: "요청부터 공식 증빙 변경까지의 전체 경로를 확정합니다.",
      prompt: "감사 로그 조각을 시간순으로 연결하세요.",
      items: [
        { id: "request", text: "민재 재활성화 요청", detail: "REQUEST" },
        { id: "archive_link", text: "구버전 출처 연결", detail: "ARCHIVE LINK" },
        { id: "bot_run", text: "나나봇 규칙 실행", detail: "BOT RUN" },
        { id: "correct_chain", text: "공식 증빙 갱신", detail: "12.7%" },
      ],
      order: ["request", "archive_link", "bot_run", "correct_chain"],
    },
    {
      type: "verdict", label: "05 · 책임 범위 확정", speaker: "한도윤",
      claim: "기록으로 입증 가능한 책임만 최종 판정해야 합니다.",
      prompt: "직접 조작이라는 추측을 제외하고 입증된 책임을 확정하세요.",
      options: [
        { id: "minjae_request_concealment", text: "영향 확인 없는 재활성화 요청과 이상 인지 후 미보고", correct: true },
        { id: "intentional_manipulation", text: "민재가 12.7%를 직접 입력해 의도적으로 조작함" },
        { id: "harin_rule_creation", text: "과거 규칙을 만든 하린에게 이번 사고의 책임이 있음" },
      ],
    },
  ]);

  let root;
  let timer;
  let deadline;
  let pausedAt;
  let stepIndex;
  let answers;
  let onComplete;
  let durationMs;
  let activeSteps = STEPS;
  let mode = "recovery";
  let gameMount;

  function ensureRoot(mount) {
    if (root) {
      if (mount && root.parentElement !== mount) mount.append(root);
      return root;
    }
    root = document.createElement("section");
    root.className = "evidence-recovery-game";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="evidence-recovery-guide" data-guide role="dialog" aria-modal="true" aria-labelledby="evidence-recovery-guide-title">
        <small>LIVE SCREEN · EMERGENCY TRACE</small>
        <h2 id="evidence-recovery-guide-title">오류 검증 및 증빙 복구</h2>
        <p>흐르는 기록에서 검증된 항목을 포착해 정상 연결 경로를 완성하세요.</p>
        <div class="evidence-recovery-rules">
          <article><b>01</b><span><strong data-rule-title="0">포착</strong><i data-rule-detail="0">움직이는 기록에서 올바른 항목을 선택합니다.</i></span></article>
          <article><b>02</b><span><strong data-rule-title="1">추적</strong><i data-rule-detail="1">자동 갱신 중지 → 제출 당시 원본 → 분석 기준 → 원본 고정 순서입니다.</i></span></article>
          <article><b>03</b><span><strong data-rule-title="2">주의</strong><i data-rule-detail="2">오류 선택 시 5초가 차감되고 평가 기록에 남습니다.</i></span></article>
        </div>
        <button type="button" data-start>증빙 복구 시작 <b>›</b></button>
      </div>
      <div class="evidence-recovery-card" data-game hidden role="dialog" aria-modal="true" aria-labelledby="evidence-recovery-title">
        <header>
          <div><small>LIVE ERROR TRACE</small><h2 id="evidence-recovery-title">오류 검증</h2></div>
          <div class="evidence-recovery-timer"><span>남은 시간</span><strong data-time>01:15</strong></div>
        </header>
        <div class="evidence-recovery-progress" aria-label="복구 진행도"><i data-progress></i></div>
        <section class="evidence-recovery-workspace">
          <div class="evidence-recovery-stream" data-stream aria-hidden="true"></div>
          <small data-label></small><h3 data-prompt></h3><div class="evidence-recovery-options" data-options></div>
        </section>
        <footer><span data-status>검증된 항목을 순서대로 연결하세요.</span><b data-count>1 / 4</b></footer>
      </div>
      <div class="evidence-court" data-court hidden role="dialog" aria-modal="true" aria-labelledby="evidence-court-title">
        <header>
          <div><small>LIVE CONTRADICTION TRACE</small><h2 id="evidence-court-title">오류 검증 회의</h2></div>
          <div class="evidence-recovery-timer"><span>남은 시간</span><strong data-court-time>01:05</strong></div>
        </header>
        <div class="evidence-court-progress" data-court-progress></div>
        <section class="evidence-court-arena">
          <small data-court-label></small>
          <div class="evidence-court-dialogue">
            <strong data-court-speaker>평가위원</strong>
            <blockquote data-court-claim></blockquote>
          </div>
          <p data-court-prompt></p>
          <div class="evidence-court-playfield" data-court-playfield></div>
        </section>
        <footer><span data-court-status>주장의 모순과 기록을 연결하세요.</span><b data-court-count>1 / 5</b></footer>
      </div>`;
    (mount || document.body).append(root);
    root.querySelector("[data-start]").onclick = beginPlay;
    return root;
  }

  function beginPlay() {
    if (gameMount && root.parentElement !== gameMount) gameMount.append(root);
    root.classList.remove("presentation-guide");
    root.classList.toggle("embedded", Boolean(gameMount));
    root.querySelector("[data-guide]").hidden = true;
    root.querySelector("[data-game]").hidden = mode === "validation";
    root.querySelector("[data-court]").hidden = mode !== "validation";
    deadline = performance.now() + durationMs;
    if (mode === "validation") renderValidationStep();
    else renderStep();
    updateTimer();
    timer = window.setInterval(updateTimer, 200);
  }

  function finish(timedOut = false) {
    window.clearInterval(timer);
    timer = 0;
    root.classList.remove("show");
    root.setAttribute("aria-hidden", "true");
    root.querySelector("[data-game]").hidden = true;
    root.querySelector("[data-court]").hidden = true;
    const correct = answers.filter((answer) => answer.correct).length;
    const result = {
      timedOut,
      correct,
      total: activeSteps.length,
      selected: answers[0]?.id || "",
      selectedIds: answers.map((answer) => answer.id),
      source: answers.find((answer) => answer.step === 1)?.id || "",
      binding: answers.find((answer) => answer.step === 3)?.id || "",
      grade: !timedOut && correct === activeSteps.length ? "perfect" : (activeSteps.length > 1 && correct >= 3) ? "good" : "failed",
    };
    const callback = onComplete;
    onComplete = null;
    callback?.(result);
  }

  function updateTimer() {
    const remaining = Math.max(0, deadline - performance.now());
    const seconds = Math.ceil(remaining / 1000);
    root.querySelector("[data-time]").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    root.querySelector("[data-court-time]").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    root.classList.toggle("urgent", seconds <= 15);
    if (remaining <= 0) finish(true);
  }

  function renderStep() {
    const step = activeSteps[stepIndex];
    root.querySelector("[data-label]").textContent = step.label;
    root.querySelector("[data-prompt]").textContent = step.prompt;
    root.querySelector("[data-count]").textContent = `${stepIndex + 1} / ${activeSteps.length}`;
    root.querySelector("[data-progress]").style.width = `${(stepIndex / activeSteps.length) * 100}%`;
    root.querySelector("[data-stream]").replaceChildren(...step.signal.map((signal, index) => {
      const item = document.createElement("i");
      item.style.setProperty("--stream-index", index);
      const [title, detail = "TRACE VERIFIED"] = signal.split("\n");
      item.innerHTML = `<small>${String(index + 1).padStart(2, "0")}</small><span><b>${title}</b><em>${detail}</em></span>`;
      return item;
    }));
    const options = root.querySelector("[data-options]");
    options.replaceChildren(...step.options.map((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.style.setProperty("--node-index", optionIndex);
      button.innerHTML = `<i></i><span><small>TRACE NODE ${String(optionIndex + 1).padStart(2, "0")}</small><strong>${option.text}</strong></span>`;
      button.onclick = () => {
        options.querySelectorAll("button").forEach((item) => { item.disabled = true; });
        button.classList.add(option.correct ? "verified" : "rejected");
        answers.push({ ...option, step: stepIndex });
        if (!option.correct) deadline -= 5000;
        root.classList.toggle("fault", !option.correct);
        root.querySelector("[data-status]").textContent = option.correct ? "검증 완료 · 연결 경로를 확장합니다." : "검증 불일치 · 5초 차감 후 계속 추적합니다.";
        stepIndex += 1;
        if (stepIndex >= activeSteps.length) {
          root.querySelector("[data-progress]").style.width = "100%";
          window.setTimeout(() => finish(false), 650);
        } else {
          window.setTimeout(() => {
            root.classList.remove("fault");
            renderStep();
          }, 650);
        }
      };
      return button;
    }));
    options.querySelector("button")?.focus();
  }

  function validationFault(message) {
    deadline -= 5000;
    root.classList.add("fault");
    root.querySelector("[data-court-status]").textContent = `${message} · 5초 차감`;
    window.setTimeout(() => root.classList.remove("fault"), 420);
  }

  function completeValidationStep(id, correct = true) {
    answers.push({ id, correct, step: stepIndex });
    root.querySelector("[data-court-status]").textContent = correct ? "반박 성공 · 다음 기록으로 이동합니다." : "검증 불일치 · 다음 주장으로 이동합니다.";
    if (!correct) validationFault("근거가 주장과 일치하지 않습니다");
    stepIndex += 1;
    if (stepIndex >= activeSteps.length) {
      root.querySelector("[data-court-progress]").style.setProperty("--progress", "100%");
      window.setTimeout(() => finish(false), 700);
    } else {
      window.setTimeout(renderValidationStep, 700);
    }
  }

  function courtButton(item, index, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.style.setProperty("--item-index", index);
    button.innerHTML = `<small>TRACE ${String(index + 1).padStart(2, "0")}</small><strong>${item.text}</strong>${item.detail ? `<span>${item.detail}</span>` : ""}`;
    return button;
  }

  function renderValidationStep() {
    const step = activeSteps[stepIndex];
    const field = root.querySelector("[data-court-playfield]");
    const claim = root.querySelector("[data-court-claim]");
    root.querySelector("[data-court-speaker]").textContent = step.speaker;
    claim.textContent = step.claim;
    root.querySelector("[data-court-label]").textContent = step.label;
    root.querySelector("[data-court-prompt]").textContent = step.prompt;
    root.querySelector("[data-court-count]").textContent = `${stepIndex + 1} / ${activeSteps.length}`;
    root.querySelector("[data-court-progress]").style.setProperty("--progress", `${(stepIndex / activeSteps.length) * 100}%`);
    root.querySelector("[data-court-status]").textContent = step.type === "rebuttal" ? "먼저 모순 문구를 선택하세요." : "움직이는 기록을 분석하세요.";
    field.className = `evidence-court-playfield is-${step.type}`;
    field.replaceChildren();

    if (step.type === "connect") {
      const selected = [];
      const shuffled = [...step.items].reverse();
      shuffled.forEach((item, index) => {
        const button = courtButton(item, index, "court-node");
        button.onclick = () => {
          if (item.id !== step.order[selected.length]) {
            validationFault("연결 순서가 맞지 않습니다");
            selected.splice(0);
            field.querySelectorAll("button").forEach((node) => {
              node.classList.remove("linked");
              node.disabled = false;
            });
            return;
          }
          selected.push(item.id);
          button.classList.add("linked");
          button.disabled = true;
          root.querySelector("[data-court-status]").textContent = `경로 연결 ${selected.length} / ${step.order.length}`;
          if (selected.length === step.order.length) completeValidationStep(step.order.at(-1), true);
        };
        field.append(button);
      });
    } else if (step.type === "rebuttal") {
      const prefix = step.claim.replace(step.contradiction, "");
      claim.innerHTML = `${prefix}<button type="button" class="court-contradiction">${step.contradiction}</button>`;
      claim.querySelector("button").onclick = (event) => {
        event.currentTarget.classList.add("targeted");
        event.currentTarget.disabled = true;
        root.querySelector("[data-court-status]").textContent = "모순 지정 완료 · 반박 증거를 연결하세요.";
        step.evidence.forEach((item, index) => {
          const button = courtButton(item, index, "court-evidence");
          button.onclick = () => completeValidationStep(item.id, Boolean(item.correct));
          field.append(button);
        });
        field.querySelector("button")?.focus();
      };
    } else if (step.type === "capture") {
      const reply = document.createElement("div");
      reply.className = "court-answer-dialogue";
      reply.innerHTML = `<strong>한도윤</strong><p>DAY 4 17시 8분 제출 직후에는 <button type="button" data-answer="verified_facts">발표 자료와 근거 자료 모두 18.4%</button>였습니다. 기록만으로는 <button type="button" data-answer="blame_harin">서하린이 실행했습니다</button>거나 <button type="button" data-answer="blame_bot">나나봇이 독립적으로 변경했습니다</button>라고 단정할 수 없습니다.</p>`;
      reply.querySelectorAll("button").forEach((button) => {
        const item = step.options.find((option) => option.id === button.dataset.answer);
        button.onclick = () => completeValidationStep(item.id, Boolean(item.correct));
      });
      field.append(reply);
    } else {
      step.options.forEach((item, index) => {
        const button = courtButton(item, index, "court-verdict");
        button.onclick = () => completeValidationStep(item.id, Boolean(item.correct));
        field.append(button);
      });
    }
    field.querySelector("button")?.focus();
  }

  function start(options = {}) {
    gameMount = options.mount || null;
    ensureRoot(options.guideMount || document.body);
    window.clearInterval(timer);
    stepIndex = 0;
    answers = [];
    onComplete = options.onComplete;
    mode = options.mode === "validation" ? "validation" : "recovery";
    activeSteps = mode === "validation" ? VALIDATION_STEPS : STEPS;
    durationMs = options.durationMs || 75000;
    pausedAt = 0;
    root.classList.remove("embedded");
    root.classList.add("presentation-guide");
    root.classList.remove("fault");
    root.classList.add("show");
    root.setAttribute("aria-hidden", "false");
    root.querySelector("[data-guide]").hidden = false;
    root.querySelector("[data-game]").hidden = true;
    root.querySelector("[data-court]").hidden = true;
    root.querySelector("[data-status]").textContent = "검증된 항목을 순서대로 연결하세요.";
    root.querySelector("[data-time]").textContent = "01:15";
    root.querySelector("[data-progress]").style.width = "0";
    root.querySelector("#evidence-recovery-guide-title").textContent = mode === "validation" ? "실시간 오류 검증" : "오류 검증 및 증빙 복구";
    root.querySelector(".evidence-recovery-guide>p").textContent = mode === "validation"
      ? "움직이는 주장 속 모순을 포착하고, 감사 로그를 연결해 사건 경로를 완성하세요."
      : "흐르는 기록에서 검증된 항목을 포착해 정상 연결 경로를 완성하세요.";
    const validationRules = [
      ["포착", "빠르게 움직이는 기록에서 확정 사실을 직접 선택합니다."],
      ["반박", "주장 속 모순 문구를 지정하고 반박 증거를 연결합니다."],
      ["연결", "감사 로그를 시간순으로 이어 사건 경로를 완성합니다."],
    ];
    const recoveryRules = [
      ["포착", "움직이는 기록에서 올바른 항목을 선택합니다."],
      ["추적", "자동 갱신 중지 → 제출 당시 원본 → 분석 기준 → 원본 고정 순서입니다."],
      ["주의", "오류 선택 시 5초가 차감되고 평가 기록에 남습니다."],
    ];
    (mode === "validation" ? validationRules : recoveryRules).forEach(([title, detail], index) => {
      root.querySelector(`[data-rule-title="${index}"]`).textContent = title;
      root.querySelector(`[data-rule-detail="${index}"]`).textContent = detail;
    });
    root.querySelector("#evidence-recovery-title").textContent = mode === "validation" ? "사실 검증" : "오류 검증";
    root.querySelector("[data-start]").firstChild.textContent = mode === "validation" ? "오류 검증 시작 " : "증빙 복구 시작 ";
    root.querySelector("[data-start]").focus();
  }

  function pause() {
    if (!timer || pausedAt) return;
    pausedAt = performance.now();
    window.clearInterval(timer);
    timer = 0;
  }

  function resume() {
    if (!pausedAt || !root?.classList.contains("show")) return;
    deadline += performance.now() - pausedAt;
    pausedAt = 0;
    updateTimer();
    timer = window.setInterval(updateTimer, 200);
  }

  global.EvidenceRecoveryMinigame = Object.freeze({ start, pause, resume });
})(window);
