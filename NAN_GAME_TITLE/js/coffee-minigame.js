(function (global) {
  const INGREDIENTS = Object.freeze({
    espresso: { label: "커피 원액", icon: "cup" },
    "hot-water": { label: "뜨거운 물", icon: "kettle" },
    ice: { label: "얼음", icon: "ice" },
    milk: { label: "우유", icon: "milk" },
    mix: { label: "믹스커피", icon: "packet" },
  });

  const ICONS = Object.freeze({
    cup: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 11h16v8a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z"/><path d="M23 14h2.5a3.5 3.5 0 0 1 0 7H23M10 7c0-2 2-2 2-4m4 4c0-2 2-2 2-4"/></svg>',
    kettle: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 13h13l2 12H7z"/><path d="M11 13V9h8v4m3 3 5 3-3 3M12 6c0-2 2-2 2-4m4 4c0-2 2-2 2-4"/></svg>',
    ice: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m8 11 8-5 8 5v10l-8 5-8-5z"/><path d="m8 11 8 5 8-5m-8 5v10"/></svg>',
    milk: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 8h11l3 5v13H8V13z"/><path d="M10 8 8 13h16m-9-5v5m4-5 3 5"/></svg>',
    packet: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5h14l2 3-2 3 2 3-2 3 2 3-2 3 2 4H7l2-4-2-3 2-3-2-3 2-3-2-3z"/><path d="M13 12h6m-7 4h8m-7 4h6"/></svg>',
  });

  const ORDERS = Object.freeze([
    { key: "boss", name: "박태식", role: "부장", drink: "진한 아메리카노", recipe: ["espresso", "espresso", "hot-water"], method: "추출" },
    { key: "harin", name: "서하린", role: "사수", drink: "아이스 라테", recipe: ["ice", "milk", "espresso"], method: "혼합" },
    { key: "minjae", name: "강민재", role: "동기", drink: "달콤한 믹스커피", recipe: ["mix", "hot-water"], method: "젓기" },
  ]);

  function timingScore(position) {
    if (position >= 0.42 && position <= 0.68) return 25;
    if (position >= 0.25 && position <= 0.85) return 15;
    return 5;
  }

  function gradeForScore(score) {
    if (score >= 240) return { grade: "perfect", workDelta: 2 };
    if (score >= 180) return { grade: "good", workDelta: 1 };
    return { grade: "messy", workDelta: -1 };
  }

  function isRecipeStepCorrect(recipe, currentSteps, ingredient) {
    return recipe[currentSteps.length] === ingredient;
  }

  const core = Object.freeze({ INGREDIENTS, ORDERS, timingScore, gradeForScore, isRecipeStepCorrect });
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (!global.document) return;

  const $ = (selector) => document.querySelector(selector);
  const root = $("#minigame");
  const refs = {
    intro: $("#coffee-intro"),
    orderScreen: $("#coffee-order-screen"),
    play: $("#coffee-play"),
    result: $("#coffee-result"),
    start: $("#coffee-start"),
    orderCards: $("#coffee-order-cards"),
    orderSeconds: $("#coffee-order-seconds"),
    orderReady: $("#coffee-order-ready"),
    phase: $("#coffee-phase"),
    task: $("#coffee-task"),
    score: $("#coffee-score"),
    time: $("#coffee-time"),
    cups: $("#coffee-cups"),
    ingredients: $("#coffee-ingredients"),
    finishAction: $("#coffee-finish-action"),
    meter: $("#coffee-meter"),
    meterNeedle: $("#coffee-meter-needle"),
    trash: $("#coffee-trash"),
    tray: $("#coffee-tray"),
    feedback: $("#coffee-feedback"),
    orderToggle: $("#coffee-order-toggle"),
    orderDrawer: $("#coffee-order-drawer"),
    dragGhost: $("#coffee-drag-ghost"),
    resultIcon: $("#coffee-result-icon"),
    resultKicker: $("#coffee-result-kicker"),
    resultTitle: $("#coffee-result-title"),
    resultSummary: $("#coffee-result-summary"),
    resultScore: $("#coffee-result-score"),
    resultDrinks: $("#coffee-result-drinks"),
    resultStats: $("#coffee-result-stats"),
    resultContinue: $("#coffee-result-continue"),
  };

  let mode = "idle";
  let cups = [];
  let selectedIngredient = null;
  let selectedCupKey = null;
  let currentScore = 0;
  let currentOrderIndex = 0;
  let completedCups = [];
  let gameStartedAt = 0;
  let roundStartedAt = 0;
  let timeRemaining = 60;
  let timerInterval = null;
  let orderInterval = null;
  let transitionTimer = null;
  let meterFrame = null;
  let meterStartedAt = 0;
  let meterPosition = 0;
  let meterCupKey = null;
  let finishing = false;
  let completionSent = false;
  let onComplete = null;

  function cloneCup(order) {
    return { ...order, recipe: [...order.recipe], ingredients: [], resets: 0, hasError: false, ready: false, served: false, timing: 0, score: 0 };
  }

  function clearTimers() {
    clearInterval(timerInterval);
    clearInterval(orderInterval);
    clearTimeout(transitionTimer);
    timerInterval = null;
    orderInterval = null;
    transitionTimer = null;
    if (meterFrame) cancelAnimationFrame(meterFrame);
    meterFrame = null;
    meterCupKey = null;
  }

  function showScreen(screen) {
    [refs.intro, refs.orderScreen, refs.play, refs.result].forEach((item) => { item.hidden = item !== screen; });
  }

  function setFeedback(message, tone = "normal") {
    refs.feedback.textContent = message;
    refs.feedback.dataset.tone = tone;
  }

  function withObjectParticle(word) {
    const lastCode = word.charCodeAt(word.length - 1);
    const hasFinalConsonant = lastCode >= 0xac00 && lastCode <= 0xd7a3 && (lastCode - 0xac00) % 28 !== 0;
    return `${word}${hasFinalConsonant ? "을" : "를"}`;
  }

  function ingredientIconMarkup(key) {
    return `<span class="coffee-ingredient-icon coffee-ingredient-icon-${key}">${ICONS[INGREDIENTS[key].icon]}</span>`;
  }

  function ingredientMarkup(key, detailed = false, step = 0) {
    const ingredient = INGREDIENTS[key];
    return `<i title="${ingredient.label}">${detailed ? `<b class="recipe-step">${step}</b>` : ""}${ingredientIconMarkup(key)}${detailed ? `<small>${ingredient.label}</small>` : ""}</i>`;
  }

  function orderCardMarkup(order, compact = false) {
    if (compact) return `<article class="coffee-order-mini"><b>${order.name} · ${order.role}</b><span>${order.drink}</span></article>`;
    return `<article class="coffee-order-card"><small>${order.role.toUpperCase()} ORDER</small><b>${order.name}</b><p>${order.drink}</p><div class="coffee-recipe-label"><span>RECIPE</span><em>위에서부터 순서대로</em></div><div class="coffee-order-recipe">${order.recipe.map((key, index) => ingredientMarkup(key, true, index + 1)).join("")}<i class="recipe-method"><b class="recipe-step">${order.recipe.length + 1}</b><span>✓</span><small>${order.method}</small></i></div></article>`;
  }

  function renderOrders() {
    refs.orderCards.innerHTML = ORDERS.map((order) => orderCardMarkup(order)).join("");
    refs.orderDrawer.innerHTML = ORDERS.map((order) => orderCardMarkup(order, true)).join("");
  }

  function cupLiquid(cup) {
    const steps = cup.ingredients;
    if (steps.includes("milk") && steps.includes("espresso")) return "#b98b70";
    if (steps.includes("milk")) return "#ede4d7";
    if (steps.includes("mix")) return "#a96f49";
    if (steps.includes("espresso")) return "#603826";
    if (steps.includes("ice")) return "#d7eef4";
    return "#d8c4b5";
  }

  function cupStateLabel(cup) {
    if (cup.served) return "전달 완료";
    if (cup.hasError) return "레시피 오류 · 컵을 비워주세요";
    if (cup.ready) return "완성 · 트레이로 전달하세요";
    if (cup.ingredients.length === cup.recipe.length) return `${cup.method} 마무리 대기`;
    return `재료 ${cup.ingredients.length} / ${cup.recipe.length}`;
  }

  function renderCups() {
    refs.cups.innerHTML = cups.map((cup) => {
      const fill = cup.ingredients.length ? Math.min(78, 18 + cup.ingredients.length * 20) : 0;
      const classes = ["coffee-cup", selectedCupKey === cup.key ? "selected" : "", cup.hasError ? "error" : "", cup.ready ? "ready" : "", cup.served ? "served" : ""].filter(Boolean).join(" ");
      return `<button class="${classes}" type="button" data-cup="${cup.key}" ${cup.served ? "disabled" : ""}>
        <span class="coffee-cup-head"><b>${cup.name}</b><small>${cup.role}</small></span>
        <span class="coffee-cup-visual"><span class="cup-body"><span class="cup-fill" style="--fill:${fill}%;--liquid:${cupLiquid(cup)}"></span><strong>NAN</strong></span></span>
        <span class="coffee-cup-state">${cupStateLabel(cup)}</span>
      </button>`;
    }).join("");

    refs.cups.querySelectorAll(".coffee-cup").forEach((element) => {
      const cupKey = element.dataset.cup;
      attachPointerAction(element, () => ({ type: "cup", key: cupKey, label: cups.find((cup) => cup.key === cupKey)?.name || "컵" }), () => handleCupClick(cupKey));
    });
    updateFinishAction();
  }

  function renderIngredients() {
    refs.ingredients.innerHTML = Object.entries(INGREDIENTS).map(([key, ingredient]) => `<button class="coffee-ingredient${selectedIngredient === key ? " selected" : ""}" type="button" data-ingredient="${key}">${ingredientIconMarkup(key)}<b>${ingredient.label}</b></button>`).join("");
    refs.ingredients.querySelectorAll(".coffee-ingredient").forEach((element) => {
      const key = element.dataset.ingredient;
      attachPointerAction(element, () => ({ type: "ingredient", key, label: INGREDIENTS[key].label }), () => selectIngredient(key));
    });
  }

  function attachPointerAction(element, payloadFactory, onClick) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let moved = false;
    let suppressClick = false;

    element.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || element.disabled) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      moved = false;
      element.setPointerCapture?.(pointerId);
    });

    element.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      if (!moved && Math.hypot(event.clientX - startX, event.clientY - startY) < 7) return;
      moved = true;
      const payload = payloadFactory();
      refs.dragGhost.hidden = false;
      refs.dragGhost.textContent = payload.label;
      refs.dragGhost.style.left = `${event.clientX}px`;
      refs.dragGhost.style.top = `${event.clientY}px`;
      updateDropTarget(payload, event.clientX, event.clientY);
    });

    element.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pointerId) return;
      const payload = payloadFactory();
      if (moved) {
        suppressClick = true;
        handlePointerDrop(payload, event.clientX, event.clientY);
        setTimeout(() => { suppressClick = false; }, 0);
      }
      pointerId = null;
      clearDragState();
    });

    element.addEventListener("pointercancel", () => {
      pointerId = null;
      clearDragState();
    });

    element.addEventListener("click", (event) => {
      if (suppressClick) { event.preventDefault(); return; }
      onClick();
    });
  }

  function clearDragState() {
    refs.dragGhost.hidden = true;
    document.querySelectorAll(".drop-target").forEach((element) => element.classList.remove("drop-target"));
  }

  function updateDropTarget(payload, x, y) {
    document.querySelectorAll(".drop-target").forEach((element) => element.classList.remove("drop-target"));
    const target = document.elementFromPoint(x, y);
    if (!target) return;
    const dropTarget = payload.type === "ingredient" ? target.closest(".coffee-cup") : target.closest(".coffee-tray, .coffee-trash");
    dropTarget?.classList.add("drop-target");
  }

  function handlePointerDrop(payload, x, y) {
    const target = document.elementFromPoint(x, y);
    if (!target) return;
    if (payload.type === "ingredient") {
      const cupElement = target.closest(".coffee-cup");
      if (cupElement) addIngredient(cupElement.dataset.cup, payload.key);
      return;
    }
    if (target.closest(".coffee-tray")) serveCup(payload.key);
    if (target.closest(".coffee-trash")) resetCup(payload.key);
  }

  function selectIngredient(key) {
    selectedIngredient = selectedIngredient === key ? null : key;
    renderIngredients();
    setFeedback(selectedIngredient ? `${withObjectParticle(INGREDIENTS[key].label)} 선택했습니다. 넣을 컵을 고르세요.` : "재료 선택을 취소했습니다.");
  }

  function handleCupClick(cupKey) {
    if (selectedIngredient) {
      addIngredient(cupKey, selectedIngredient);
      selectedIngredient = null;
      renderIngredients();
      return;
    }
    selectCup(cupKey);
  }

  function selectCup(cupKey) {
    const cup = cups.find((item) => item.key === cupKey);
    if (!cup || cup.served) return;
    selectedCupKey = cupKey;
    renderCups();
    if (cup.ready) setFeedback(`${cup.name}의 커피가 완성됐습니다. 트레이를 누르거나 컵을 끌어다 놓으세요.`, "success");
    else setFeedback(`${cup.name}의 ${cup.drink} 컵을 선택했습니다.`);
  }

  function addIngredient(cupKey, ingredientKey) {
    const cup = cups.find((item) => item.key === cupKey);
    if (!cup || cup.served || cup.ready) return;
    selectedCupKey = cupKey;
    if (!isRecipeStepCorrect(cup.recipe, cup.ingredients, ingredientKey)) {
      cup.ingredients.push(ingredientKey);
      cup.hasError = true;
      setFeedback(`앗, ${cup.name}의 레시피 순서가 꼬였습니다. 컵을 비우고 다시 만드세요.`, "error");
    } else {
      cup.ingredients.push(ingredientKey);
      const complete = cup.ingredients.length === cup.recipe.length;
      setFeedback(complete ? `재료 준비 완료! ${cup.method} 마무리를 시작하세요.` : `${withObjectParticle(INGREDIENTS[ingredientKey].label)} 넣었습니다.`, complete ? "success" : "normal");
    }
    renderCups();
  }

  function resetCup(cupKey = selectedCupKey) {
    const cup = cups.find((item) => item.key === cupKey);
    if (!cup || cup.served) { setFeedback("비울 컵을 먼저 선택하세요.", "error"); return; }
    if (meterCupKey === cup.key) stopMeter(true);
    cup.ingredients = [];
    cup.hasError = false;
    cup.ready = false;
    cup.timing = 0;
    cup.resets += 1;
    selectedCupKey = cup.key;
    setFeedback(`${cup.name}의 컵을 비웠습니다. 시간은 계속 흐릅니다.`);
    renderCups();
  }

  function updateFinishAction() {
    if (meterCupKey) {
      refs.finishAction.disabled = false;
      refs.finishAction.classList.add("running");
      refs.finishAction.textContent = "지금 멈추기!";
      return;
    }
    refs.finishAction.classList.remove("running");
    const cup = cups.find((item) => item.key === selectedCupKey);
    if (!cup) { refs.finishAction.disabled = true; refs.finishAction.textContent = "컵을 선택하세요"; return; }
    if (cup.hasError) { refs.finishAction.disabled = true; refs.finishAction.textContent = "컵을 먼저 비워주세요"; return; }
    if (cup.ready) { refs.finishAction.disabled = true; refs.finishAction.textContent = "트레이로 전달하세요"; return; }
    const remaining = cup.recipe.length - cup.ingredients.length;
    refs.finishAction.disabled = remaining !== 0;
    refs.finishAction.textContent = remaining ? `재료 ${remaining}개 더 필요` : `${cup.method} 시작`;
  }

  function startMeter() {
    const cup = cups.find((item) => item.key === selectedCupKey);
    if (!cup || cup.hasError || cup.ready || cup.ingredients.length !== cup.recipe.length) return;
    meterCupKey = cup.key;
    meterStartedAt = performance.now();
    refs.meterNeedle.style.left = "0%";
    setFeedback(`${cup.name}의 ${cup.method} 중! 초록 구간에서 멈추세요.`, "warning");
    updateFinishAction();
    const tick = (now) => {
      const phase = ((now - meterStartedAt) % 1800) / 1800;
      meterPosition = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
      refs.meterNeedle.style.left = `${meterPosition * 100}%`;
      meterFrame = requestAnimationFrame(tick);
    };
    meterFrame = requestAnimationFrame(tick);
  }

  function stopMeter(cancelled = false) {
    if (!meterCupKey) return;
    if (meterFrame) cancelAnimationFrame(meterFrame);
    meterFrame = null;
    const cup = cups.find((item) => item.key === meterCupKey);
    meterCupKey = null;
    if (!cancelled && cup) {
      cup.timing = timingScore(meterPosition);
      cup.ready = true;
      selectedCupKey = cup.key;
      const quality = cup.timing === 25 ? "완벽한 타이밍입니다!" : cup.timing === 15 ? "조금 아쉽지만 괜찮습니다." : "타이밍이 크게 어긋났습니다.";
      setFeedback(`${cup.name}: ${quality} 이제 트레이로 전달하세요.`, cup.timing === 25 ? "success" : "warning");
    }
    renderCups();
  }

  function calculateCupScore(cup) {
    const elapsed = (performance.now() - roundStartedAt) / 1000;
    const recipeScore = Math.max(20, 60 - cup.resets * 10);
    const speedScore = elapsed <= 25 ? 15 : elapsed <= 45 ? 10 : 5;
    return Math.max(0, recipeScore + cup.timing + speedScore);
  }

  function serveCup(cupKey = selectedCupKey) {
    const cup = cups.find((item) => item.key === cupKey);
    if (!cup || cup.served) { setFeedback("전달할 컵을 먼저 선택하세요.", "error"); return; }
    if (!cup.ready) { setFeedback("재료를 모두 넣고 마무리 게이지를 먼저 완료하세요.", "error"); return; }
    cup.served = true;
    if (mode === "tutorial") {
      cup.score = 0;
      setFeedback("연습 완료! 이제 세 사람의 실제 주문을 확인합니다.", "success");
      renderCups();
      transitionTimer = setTimeout(beginOrderReveal, 650);
      return;
    }
    cup.score = calculateCupScore(cup);
    currentScore += cup.score;
    completedCups.push({ ...cup, recipe: [...cup.recipe], ingredients: [...cup.ingredients] });
    refs.score.textContent = currentScore;
    setFeedback(cup.timing === 25 ? `${cup.name}의 표정이 밝아졌습니다. 완벽한 한 잔!` : `${cup.name}에게 커피를 전달했습니다.`, cup.timing === 25 ? "success" : "normal");
    renderCups();
    if (currentOrderIndex >= ORDERS.length - 1) {
      finishing = true;
      clearInterval(timerInterval);
      transitionTimer = setTimeout(finishMainGame, 650);
    } else {
      currentOrderIndex += 1;
      transitionTimer = setTimeout(beginRound, 700);
    }
  }

  function beginRound() {
    const order = ORDERS[currentOrderIndex];
    selectedIngredient = null;
    selectedCupKey = order.key;
    cups = [cloneCup(order)];
    roundStartedAt = performance.now();
    refs.phase.textContent = `ROUND ${currentOrderIndex + 1} / ${ORDERS.length}`;
    refs.task.textContent = `${order.name} · ${order.drink} 한 잔`;
    refs.orderDrawer.hidden = true;
    refs.orderToggle.setAttribute("aria-expanded", "false");
    refs.orderToggle.textContent = "주문표 다시 보기";
    renderIngredients();
    renderCups();
    setFeedback(`${order.name}의 주문입니다. 기억한 순서대로 재료를 넣어주세요.`);
  }

  function beginTutorial() {
    mode = "tutorial";
    finishing = false;
    selectedIngredient = null;
    selectedCupKey = "tutorial";
    currentScore = 0;
    cups = [cloneCup({ key: "tutorial", name: "강민재", role: "연습", drink: "달콤한 믹스커피", recipe: ["mix", "hot-water"], method: "젓기" })];
    refs.phase.textContent = "PRACTICE";
    refs.task.textContent = "믹스커피 → 뜨거운 물 → 젓기 → 전달";
    refs.score.textContent = "--";
    refs.time.textContent = "--";
    refs.time.parentElement.classList.remove("danger");
    refs.orderToggle.hidden = true;
    refs.orderDrawer.hidden = true;
    showScreen(refs.play);
    renderIngredients();
    renderCups();
    setFeedback("믹스커피를 선택한 뒤 강민재의 컵을 누르세요.");
  }

  function beginOrderReveal() {
    mode = "orders";
    showScreen(refs.orderScreen);
    renderOrders();
    let seconds = 10;
    refs.orderSeconds.textContent = seconds;
    clearInterval(orderInterval);
    orderInterval = setInterval(() => {
      seconds -= 1;
      refs.orderSeconds.textContent = Math.max(0, seconds);
      if (seconds <= 0) beginMainGame();
    }, 1000);
    refs.orderReady.focus();
  }

  function beginMainGame() {
    if (mode === "playing") return;
    clearInterval(orderInterval);
    mode = "playing";
    finishing = false;
    selectedIngredient = null;
    currentScore = 0;
    currentOrderIndex = 0;
    completedCups = [];
    refs.score.textContent = "0";
    refs.time.textContent = "60";
    refs.time.parentElement.classList.remove("danger");
    refs.orderToggle.hidden = false;
    refs.orderToggle.setAttribute("aria-expanded", "false");
    refs.orderDrawer.hidden = true;
    timeRemaining = 60;
    gameStartedAt = performance.now();
    showScreen(refs.play);
    beginRound();
    timerInterval = setInterval(updateTimer, 100);
  }

  function updateTimer() {
    if (mode !== "playing" || finishing) return;
    timeRemaining = Math.max(0, 60 - (performance.now() - gameStartedAt) / 1000);
    refs.time.textContent = Math.ceil(timeRemaining);
    refs.time.parentElement.classList.toggle("danger", timeRemaining <= 10);
    if (timeRemaining <= 0) finishMainGame();
  }

  function finishMainGame() {
    if (mode === "result") return;
    mode = "result";
    finishing = true;
    clearTimers();
    const gradeData = gradeForScore(currentScore);
    const finishedCups = [...completedCups];
    if (cups[0] && !finishedCups.some((cup) => cup.key === cups[0].key)) finishedCups.push(cups[0]);
    const drinks = ORDERS.map((order) => finishedCups.find((cup) => cup.key === order.key) || { ...order, score: 0, served: false, resets: 0 });
    const result = { score: currentScore, grade: gradeData.grade, correctDrinks: drinks.filter((cup) => cup.served).length, mistakes: drinks.reduce((sum, cup) => sum + cup.resets, 0), workDelta: gradeData.workDelta, drinks: drinks.map((cup) => ({ key: cup.key, name: cup.name, drink: cup.drink, score: cup.score, served: cup.served })) };
    renderResult(result);
    showScreen(refs.result);
    refs.resultContinue.onclick = () => complete(result);
    refs.resultContinue.focus();
  }

  function renderResult(result) {
    const resultCopy = {
      perfect: { icon: "★", kicker: "PERFECT SERVICE", title: "세 잔 모두 훌륭하게 완성했습니다!", summary: "정확한 레시피와 타이밍 덕분에 팀의 분위기까지 좋아졌습니다." },
      good: { icon: "✓", kicker: "GOOD SERVICE", title: "커피 심부름을 무사히 마쳤습니다", summary: "조금 아쉬운 부분은 있었지만 회의 전에 모두 전달했습니다." },
      messy: { icon: "!", kicker: "MESSY SERVICE", title: "탕비실이 잠깐 전쟁터가 됐습니다", summary: "실수는 있었지만 끝까지 수습했습니다. 다음에는 더 잘할 수 있습니다." },
    }[result.grade];
    refs.resultIcon.textContent = resultCopy.icon;
    refs.resultIcon.classList.toggle("messy", result.grade === "messy");
    refs.resultKicker.textContent = resultCopy.kicker;
    refs.resultTitle.textContent = resultCopy.title;
    refs.resultSummary.textContent = resultCopy.summary;
    refs.resultScore.textContent = `${result.score} / 300`;
    refs.resultDrinks.innerHTML = result.drinks.map((drink) => `<article><b>${drink.name}</b><small>${drink.drink}</small><strong>${drink.served ? drink.score : "미완성"}</strong></article>`).join("");
    const statMarkup = (label, delta) => `<article><span>${label}</span><strong class="${delta > 0 ? "up" : delta < 0 ? "down" : ""}">${delta > 0 ? "+" : ""}${delta}</strong></article>`;
    refs.resultStats.innerHTML = statMarkup("업무력", result.workDelta);
  }

  function complete(result) {
    if (completionSent) return;
    completionSent = true;
    root.classList.remove("active");
    root.setAttribute("aria-hidden", "true");
    onComplete?.(result);
  }

  function toggleOrderDrawer() {
    if (mode !== "playing") return;
    const willOpen = refs.orderDrawer.hidden;
    refs.orderDrawer.hidden = !willOpen;
    refs.orderToggle.setAttribute("aria-expanded", String(willOpen));
    refs.orderToggle.textContent = willOpen ? "주문표 접기" : "주문표 다시 보기";
  }

  function start(options = {}) {
    clearTimers();
    mode = "intro";
    cups = [];
    selectedIngredient = null;
    selectedCupKey = null;
    currentScore = 0;
    currentOrderIndex = 0;
    completedCups = [];
    finishing = false;
    completionSent = false;
    onComplete = options.onComplete;
    root.classList.add("active");
    root.setAttribute("aria-hidden", "false");
    showScreen(refs.intro);
    refs.start.focus();
  }

  refs.start.addEventListener("click", beginTutorial);
  refs.orderReady.addEventListener("click", beginMainGame);
  refs.finishAction.addEventListener("click", () => meterCupKey ? stopMeter() : startMeter());
  refs.trash.addEventListener("click", () => resetCup());
  refs.tray.addEventListener("click", () => serveCup());
  refs.orderToggle.addEventListener("click", toggleOrderDrawer);

  global.CoffeeMinigame = Object.freeze({ start, core });
})(typeof window !== "undefined" ? window : globalThis);
