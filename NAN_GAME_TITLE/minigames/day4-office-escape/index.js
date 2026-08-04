(function exposeOfficeEscapeMinigame(global) {
  "use strict";
  if (!global.document) return;

  const Core = global.OfficeEscapeMinigameCore;
  const Art = global.OfficeEscapeArtAssets;
  if (!Core || !Art) throw new Error("OfficeEscapeMinigame requires core.js and art-assets.js");

  const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW"]);
  const SLIDE_KEYS = new Set(["ArrowDown", "KeyS"]);
  const COMPOSITIONS = new Set(["a", "b", "c"]);
  const BACKGROUND_IDS = Object.freeze({
    office: "minigame_background.office_escape.office",
    "office-b": "minigame_background.office_escape.office_b",
    "office-c": "minigame_background.office_escape.office_c",
    corridor: "minigame_background.office_escape.corridor",
    "corridor-b": "minigame_background.office_escape.corridor_b",
    "lobby-a": "minigame_background.office_escape.lobby_a",
    "lobby-b": "minigame_background.office_escape.lobby_b",
  });
  const BACKGROUND_FALLBACKS = Object.freeze({
    office: "minigame_background.office_escape.office",
    "office-b": "minigame_background.office_escape.office",
    "office-c": "minigame_background.office_escape.office",
    corridor: "minigame_background.office_escape.corridor",
    "corridor-b": "minigame_background.office_escape.corridor",
    "lobby-a": "minigame_background.office_escape.elevator",
    "lobby-b": "minigame_background.office_escape.elevator",
  });
  const PROP_IDS = Object.freeze({
    chair: "prop.office.chair",
    cable: "prop.office.cable",
    drawer: "prop.office.drawer",
    papers: "prop.office.papers",
    cart: "prop.office.cart",
    sign: "prop.office.sign",
    "access-card": "prop.office.access_card",
    phone: "prop.office.phone",
    "backup-usb": "prop.office.backup_usb",
  });
  const CHARACTER_IDS = Object.freeze({
    doyunRun: "minigame_character.doyun.run.right",
    doyunRunAlt: "minigame_character.doyun.run_alt.right",
    doyunJump: "minigame_character.doyun.jump.right",
    doyunSlide: "minigame_character.doyun.slide.right",
    harinRun: "minigame_character.harin.run.right",
    harinRunAlt: "minigame_character.harin.run_alt.right",
    harinAssist: "minigame_character.harin.assist.right",
    bossRun: "minigame_character.boss.chase.right",
    bossRunAlt: "minigame_character.boss.chase_alt.right",
    bossCall: "minigame_character.boss.call.right",
  });
  const ITEM_IDS = Object.freeze(["access-card", "phone", "backup-usb"]);

  let root = null;
  let refs = null;
  let frame = 0;
  let state = {
    game: null,
    playing: false,
    paused: false,
    completed: false,
    lastFrame: 0,
    onComplete: null,
    composition: "c",
    previewScene: "run",
    reviewAssetMap: {},
    reviewAssetsEnabled: false,
    showHitboxes: false,
    actorArt: new Map(),
    feedbackUntil: 0,
  };

  function resolve(id, fallbackId = "") {
    if (state.reviewAssetsEnabled && state.reviewAssetMap[id]) return state.reviewAssetMap[id];
    try { return Art.resolve(id); } catch (error) {
      if (fallbackId) return Art.resolve(fallbackId);
      return "";
    }
  }

  function icon(name) {
    const paths = {
      building: '<path d="M5 20V5h10v15M9 9h2m-2 4h2m-2 4h2M3 20h18M15 10h4v10"/>',
      copier: '<path d="M7 8V3h10v5M6 17H4V9h16v8h-2M7 14h10v7H7zM16 11h1"/>',
      exit: '<path d="M5 21V3h11v18M9 12h11m-4-4 4 4-4 4M9 7h.01"/>',
      pause: '<path d="M8 5v14M16 5v14"/>',
      play: '<path d="m8 5 11 7-11 7z"/>',
      up: '<path d="m6 13 6-6 6 6M12 7v11"/>',
      down: '<path d="m6 11 6 6 6-6M12 17V6"/>',
      shield: '<path d="M12 3 5 6v5c0 4.4 2.8 8 7 10 4.2-2 7-5.6 7-10V6zM9 12l2 2 4-4"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
  }

  function backgroundPanels() {
    return Core.BACKGROUND_ROUTE.map((segment) => {
      const id = BACKGROUND_IDS[segment.scene];
      const fallback = BACKGROUND_FALLBACKS[segment.scene];
      return `<figure class="oe2-background-panel" data-route="${segment.id}"><img src="${resolve(id, fallback)}" alt="" aria-hidden="true"></figure>`;
    }).join("");
  }

  function markup() {
    return `
      <header class="oe2-hud" aria-label="퇴근 경로 상태">
        <div class="oe2-clock"><strong id="oe2-clock">17:58</strong><span>퇴근까지</span></div>
        <div class="oe2-route" aria-label="사무실에서 엘리베이터까지의 진행 경로">
          <div class="oe2-route-line"><i id="oe2-route-progress"></i></div>
          <ol>
            <li class="is-active">${icon("building")}<span>사무실</span></li>
            <li>${icon("copier")}<span>복도</span></li>
            <li>${icon("exit")}<span>로비</span></li>
          </ol>
        </div>
        <div class="oe2-tools">
          <ul class="oe2-items" aria-label="수집물">
            <li data-item="access-card"><img src="${resolve(PROP_IDS["access-card"])}" alt="출입카드"></li>
            <li data-item="phone"><img src="${resolve(PROP_IDS.phone)}" alt="휴대폰"></li>
            <li data-item="backup-usb"><img src="${resolve(PROP_IDS["backup-usb"])}" alt="백업 USB"></li>
          </ul>
          <button class="oe2-pause" type="button" aria-label="일시정지" aria-pressed="false">${icon("pause")}</button>
        </div>
      </header>
      <div class="oe2-world" aria-label="부장님을 피해 엘리베이터로 달리는 사무실" role="application">
        <div class="oe2-background-track" id="oe2-background-track" aria-hidden="true">${backgroundPanels()}</div>
        <div class="oe2-far-layer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="oe2-mid-layer" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="oe2-thresholds" aria-hidden="true"><i></i><i></i><i></i></div>
        <aside class="oe2-elevator" aria-label="도착 지점: 엘리베이터"><img src="${resolve("minigame_background.office_escape.elevator")}" alt="열린 엘리베이터"><span>${icon("exit")}</span></aside>
        <div class="oe2-ground" aria-hidden="true"><i class="oe2-floor-guide"></i><i class="oe2-speed-line"></i><i class="oe2-speed-line"></i><i class="oe2-speed-line"></i></div>
        <ol class="oe2-zone-markers" aria-hidden="true"><li class="is-active"><span>1</span><b>사무실</b></li><li><span>2</span><b>복도</b></li><li><span>3</span><b>로비</b></li></ol>
        <div class="oe2-objects" id="oe2-objects" aria-live="polite"></div>
        <div class="oe2-actors" aria-label="부장님, 서하린, 도윤의 추격 대형">
          <figure class="oe2-actor oe2-boss"><img id="oe2-boss" src="${resolve(CHARACTER_IDS.bossRun)}" alt="뒤에서 쫓아오는 부장님"></figure>
          <figure class="oe2-actor oe2-harin"><img id="oe2-harin" src="${resolve(CHARACTER_IDS.harinRun)}" alt="도윤과 함께 달리는 서하린"></figure>
          <figure class="oe2-actor oe2-doyun"><img id="oe2-doyun" src="${resolve(CHARACTER_IDS.doyunRun)}" alt="오른쪽으로 달리는 도윤"></figure>
        </div>
        <div class="oe2-telegraph" id="oe2-telegraph" hidden><strong id="oe2-telegraph-action">JUMP</strong><span id="oe2-telegraph-label"></span></div>
        <div class="oe2-feedback" id="oe2-feedback" role="status" aria-live="polite"></div>
        <button class="oe2-action oe2-jump" type="button" aria-label="점프, Space 또는 위 화살표">${icon("up")}<span>JUMP</span><kbd>SPACE</kbd></button>
        <button class="oe2-action oe2-slide" type="button" aria-label="슬라이드, 아래 화살표">${icon("down")}<span>SLIDE</span><kbd>↓</kbd></button>
        <div class="oe2-pause-screen" aria-live="polite"><strong>일시정지</strong><span>ESC 또는 일시정지 버튼으로 계속합니다</span></div>
        <section class="oe2-result" id="oe2-result" hidden aria-live="polite"><strong id="oe2-result-grade">PERFECT</strong><p id="oe2-result-copy"></p><button type="button" id="oe2-result-continue">스토리 계속하기</button></section>
      </div>`;
  }

  function ensureRoot() {
    if (root?.isConnected) return root;
    root = document.createElement("section");
    root.className = "office-escape office-escape-v2";
    root.setAttribute("aria-label", "부장님 피해서 퇴근하기");
    root.dataset.composition = state.composition;
    root.dataset.scene = state.previewScene;
    root.innerHTML = markup();
    document.body.append(root);
    refs = {
      world: root.querySelector(".oe2-world"),
      clock: root.querySelector("#oe2-clock"), progress: root.querySelector("#oe2-route-progress"),
      routeNodes: [...root.querySelectorAll(".oe2-route li")], zoneNodes: [...root.querySelectorAll(".oe2-zone-markers li")],
      backgroundTrack: root.querySelector("#oe2-background-track"), backgroundPanels: [...root.querySelectorAll(".oe2-background-panel img")],
      objects: root.querySelector("#oe2-objects"), boss: root.querySelector(".oe2-boss"), harin: root.querySelector(".oe2-harin"), doyun: root.querySelector(".oe2-doyun"),
      actors: { boss: root.querySelector("#oe2-boss"), harin: root.querySelector("#oe2-harin"), doyun: root.querySelector("#oe2-doyun") },
      telegraph: root.querySelector("#oe2-telegraph"), telegraphAction: root.querySelector("#oe2-telegraph-action"), telegraphLabel: root.querySelector("#oe2-telegraph-label"),
      feedback: root.querySelector("#oe2-feedback"), jump: root.querySelector(".oe2-jump"), slide: root.querySelector(".oe2-slide"), pause: root.querySelector(".oe2-pause"),
      result: root.querySelector("#oe2-result"), resultGrade: root.querySelector("#oe2-result-grade"), resultCopy: root.querySelector("#oe2-result-copy"),
      items: new Map([...root.querySelectorAll("[data-item]")].map((node) => [node.dataset.item, node])), objectNodes: new Map(),
    };
    refs.jump.addEventListener("click", triggerJump);
    refs.slide.addEventListener("click", triggerSlide);
    refs.pause.addEventListener("click", () => state.paused ? resume() : pause());
    root.querySelector("#oe2-result-continue").addEventListener("click", completeToStory);
    return root;
  }

  function setActorArt(role, id, targetVisualHeight) {
    const image = refs.actors[role];
    const host = refs[role];
    if (!image || !host) return;
    if (state.actorArt.get(role) !== id) {
      image.src = resolve(id);
      state.actorArt.set(role, id);
    }
    const metric = Art.metrics(id);
    host.style.setProperty("--oe2-alpha-height", String(metric.alphaHeight));
    host.style.setProperty("--oe2-bottom-padding", String(metric.bottomPadding));
    host.style.setProperty("--oe2-visual-height", `${targetVisualHeight}cqh`);
  }

  function updateBackgroundSources() {
    if (!refs) return;
    Core.BACKGROUND_ROUTE.forEach((segment, index) => {
      const id = BACKGROUND_IDS[segment.scene];
      const fallback = BACKGROUND_FALLBACKS[segment.scene];
      refs.backgroundPanels[index].src = resolve(id, fallback);
    });
  }

  function objectNode(object) {
    let node = refs.objectNodes.get(object.id);
    if (node) return node;
    node = document.createElement("figure");
    node.className = `oe2-object oe2-${object.kind} oe2-${object.type}`;
    node.dataset.objectId = object.id;
    node.innerHTML = `<img src="${resolve(PROP_IDS[object.type])}" alt="${object.label}"><span></span>`;
    refs.objects.append(node);
    refs.objectNodes.set(object.id, node);
    return node;
  }

  function renderObjects(snapshot, width, scale) {
    const active = new Set(snapshot.activeObjects.map((object) => object.id));
    refs.objectNodes.forEach((node, id) => { node.hidden = !active.has(id); });
    const playerX = width * 0.31;
    const ground = refs.world.clientHeight * 0.085;
    snapshot.activeObjects.forEach((object) => {
      const node = objectNode(object);
      const visible = object.visibleRect;
      const left = playerX + (visible.x - snapshot.playerRect.x) * scale;
      node.hidden = left < -220 || left > width + 240;
      node.style.width = `${Math.max(20, visible.width * scale)}px`;
      node.style.height = `${Math.max(16, visible.height * scale)}px`;
      node.style.left = `${left}px`;
      node.style.bottom = `${ground + visible.y * scale}px`;
      node.classList.toggle("telegraphed", snapshot.upcomingHazard?.id === object.id);
      node.classList.toggle("overhead", object.avoid === "slide");
      node.dataset.motion = object.motion || "still";
      if (state.showHitboxes) {
        const collision = object.collisionRect;
        node.style.setProperty("--oe2-hit-left", `${(collision.x - visible.x) * scale}px`);
        node.style.setProperty("--oe2-hit-bottom", `${(collision.y - visible.y) * scale}px`);
        node.style.setProperty("--oe2-hit-width", `${collision.width * scale}px`);
        node.style.setProperty("--oe2-hit-height", `${collision.height * scale}px`);
      }
    });
  }

  function formatClock(snapshot) {
    const remaining = Math.max(0, Math.ceil(snapshot.duration - snapshot.elapsed));
    return `17:${String(Math.max(0, 58 - Math.floor(snapshot.elapsed))).padStart(2, "0")} · ${remaining}s`;
  }

  function showFeedback(text, kind = "") {
    refs.feedback.textContent = text;
    refs.feedback.dataset.kind = kind;
    refs.feedback.classList.add("show");
    state.feedbackUntil = performance.now() + 1100;
  }

  function consumeEvents(snapshot) {
    state.game.drainEvents().forEach((event) => {
      if (event.type === "jump") { refs.jump.classList.add("pressed"); showFeedback("점프!", "action"); }
      if (event.type === "slide") { refs.slide.classList.add("pressed"); showFeedback("슬라이드!", "action"); }
      if (event.type === "avoid") showFeedback(`${event.object.avoid === "jump" ? "점프" : "슬라이드"} 통과!`, "safe");
      if (event.type === "collect") showFeedback(`${event.object.label} 획득`, "collect");
      if (event.type === "assist") showFeedback("하린이 막아줬다!", "assist");
      if (event.type === "hit") showFeedback(`부딪혔습니다 · ${event.hitCount}/3`, "hit");
      if (event.type === "finish") finishRun(event);
    });
    if (performance.now() > state.feedbackUntil) refs.feedback.classList.remove("show");
  }

  function render(snapshot) {
    if (!root || !snapshot) return;
    const width = refs.world.clientWidth || global.innerWidth;
    const scale = width / 780;
    const progress = snapshot.progress;
    root.dataset.scene = snapshot.finished ? "arrival" : snapshot.sliding ? "slide" : snapshot.y > 1 ? "jump" : "run";
    root.dataset.zone = snapshot.zone.id;
    root.classList.toggle("is-hurt", snapshot.invulnerable > 0);
    root.classList.toggle("show-hitboxes", state.showHitboxes);
    refs.clock.textContent = formatClock(snapshot);
    refs.progress.style.setProperty("--oe2-progress", String(progress));
    refs.backgroundTrack.style.transform = `translate3d(${-progress * 10 * width}px, 0, 0)`;
    // Preserve the 0.18 / 0.42 / 1.0 far-mid-near parallax contract.
    refs.world.style.setProperty("--oe2-far-x", `${-snapshot.distance * scale * 0.18}px`);
    refs.world.style.setProperty("--oe2-mid-x", `${-snapshot.distance * scale * 0.42}px`);
    refs.world.style.setProperty("--oe2-near-x", `${-snapshot.distance * scale}px`);
    const zoneIndex = snapshot.zone.id === "office" ? 0 : snapshot.zone.id === "corridor" ? 1 : 2;
    refs.routeNodes.forEach((node, index) => node.classList.toggle("is-active", index === zoneIndex));
    refs.zoneNodes.forEach((node, index) => node.classList.toggle("is-active", index === zoneIndex));
    refs.items.forEach((node, id) => node.classList.toggle("is-collected", snapshot.collectedItems.includes(id)));

    const gait = Core.gaitFrameIndex(snapshot.elapsed);
    const doyunId = snapshot.sliding ? CHARACTER_IDS.doyunSlide : snapshot.y > 1 ? CHARACTER_IDS.doyunJump : gait ? CHARACTER_IDS.doyunRunAlt : CHARACTER_IDS.doyunRun;
    const harinId = snapshot.assistUsed && snapshot.invulnerable > 0 ? CHARACTER_IDS.harinAssist : gait ? CHARACTER_IDS.harinRunAlt : CHARACTER_IDS.harinRun;
    const bossId = gait ? CHARACTER_IDS.bossRunAlt : CHARACTER_IDS.bossRun;
    setActorArt("doyun", doyunId, snapshot.sliding ? 27.5 : 50);
    setActorArt("harin", harinId, 48);
    setActorArt("boss", bossId, 52);
    refs.doyun.style.translate = `0 ${-snapshot.y * scale}px`;
    renderObjects(snapshot, width, scale);
    const upcoming = snapshot.upcomingHazard;
    refs.telegraph.hidden = !upcoming;
    if (upcoming) {
      const object = snapshot.activeObjects.find((candidate) => candidate.id === upcoming.id) || upcoming;
      const cueX = width * 0.31 + (object.x - snapshot.playerRect.x) * scale;
      refs.telegraph.style.left = `${Math.max(24, Math.min(width - 180, cueX))}px`;
      refs.telegraph.style.bottom = `${upcoming.avoid === "slide" ? 58 : 120}px`;
      refs.telegraph.dataset.phase = upcoming.telegraphPhase;
      refs.telegraphAction.textContent = upcoming.telegraphPhase === "act" ? `${upcoming.avoid.toUpperCase()} NOW` : upcoming.avoid.toUpperCase();
      refs.telegraphLabel.textContent = upcoming.telegraphPhase === "act" ? "지금!" : upcoming.label;
    }
    refs.jump.classList.toggle("active", root.dataset.scene === "jump");
    refs.slide.classList.toggle("active", snapshot.sliding);
    if (state.playing) consumeEvents(snapshot);
  }

  function preview(scene = "run") {
    if (!new Set(["run", "jump", "slide", "arrival"]).has(scene)) return;
    ensureRoot();
    cancelAnimationFrame(frame);
    state.playing = false;
    state.paused = false;
    state.previewScene = scene;
    const previewCore = Core.create({ duration: Core.DEFAULT_DURATION, assist: true });
    const seconds = scene === "arrival" ? 61.5 : scene === "slide" ? 9 : scene === "jump" ? 5 : 2;
    for (let elapsed = 0; elapsed < seconds && !previewCore.snapshot().finished; elapsed += 0.1) previewCore.step(0.1);
    const snapshot = previewCore.snapshot();
    if (scene === "jump") snapshot.y = 140;
    if (scene === "slide") snapshot.sliding = true;
    if (scene === "arrival") snapshot.finished = true;
    render(snapshot);
  }

  function start(options = {}) {
    ensureRoot();
    state.composition = COMPOSITIONS.has(options.composition) ? options.composition : state.composition;
    state.reviewAssetMap = options.reviewAssetMap || {};
    state.reviewAssetsEnabled = Boolean(options.reviewAssetsEnabled);
    state.showHitboxes = Boolean(options.showHitboxes);
    state.onComplete = typeof options.onComplete === "function" ? options.onComplete : null;
    state.completed = false;
    state.paused = false;
    state.actorArt.clear();
    root.hidden = false;
    root.dataset.composition = state.composition;
    root.classList.remove("is-paused");
    refs.result.hidden = true;
    updateBackgroundSources();
    state.game = Core.create(options.testOverrides || {});
    if (options.autoStart === false) {
      preview(options.previewScene || "run");
      return;
    }
    state.playing = true;
    state.lastFrame = performance.now();
    render(state.game.snapshot());
    frame = requestAnimationFrame(tick);
    refs.jump.focus({ preventScroll: true });
  }

  function tick(now) {
    if (!state.playing) return;
    const delta = Math.min(0.1, Math.max(0, (now - state.lastFrame) / 1000));
    state.lastFrame = now;
    if (!state.paused) state.game.step(delta);
    render(state.game.snapshot());
    if (state.playing) frame = requestAnimationFrame(tick);
  }

  function triggerJump() {
    if (!state.playing || state.paused || state.completed) return;
    state.game.pressJump();
    refs.jump.classList.add("pressed");
  }
  function triggerSlide() {
    if (!state.playing || state.paused || state.completed) return;
    state.game.commitSlide();
    refs.slide.classList.add("pressed");
  }
  function pause() {
    if (!root || state.paused || state.completed) return;
    state.paused = true;
    root.classList.add("is-paused");
    refs.pause.setAttribute("aria-pressed", "true");
    refs.pause.innerHTML = icon("play");
  }
  function resume() {
    if (!root || !state.paused || state.completed) return;
    state.paused = false;
    state.lastFrame = performance.now();
    root.classList.remove("is-paused");
    refs.pause.setAttribute("aria-pressed", "false");
    refs.pause.innerHTML = icon("pause");
  }
  function finishRun(event) {
    if (state.completed) return;
    state.completed = true;
    state.playing = false;
    cancelAnimationFrame(frame);
    const result = event.result || state.game.result();
    refs.result.hidden = false;
    refs.resultGrade.textContent = result.grade.toUpperCase();
    refs.resultCopy.textContent = result.caught ? "부장님에게 붙잡혔습니다. 확인 업무 후 퇴근합니다." : `피격 ${result.hitCount}회 · 수집 ${result.collectedItems.length}/3`;
    state.finalResult = result;
  }
  function completeToStory() {
    if (!state.completed) return;
    const callback = state.onComplete;
    const result = state.finalResult;
    root.hidden = true;
    if (callback) callback(result);
  }
  function setComposition(composition = "c") {
    if (!COMPOSITIONS.has(composition)) return;
    state.composition = composition;
    ensureRoot();
    root.dataset.composition = composition;
  }
  function debugSnapshot() {
    return Object.freeze({ ...(state.game?.snapshot() || {}), playing: state.playing, paused: state.paused, composition: state.composition });
  }

  global.addEventListener("keydown", (event) => {
    if (!root || root.hidden) return;
    if (JUMP_KEYS.has(event.code)) { event.preventDefault(); triggerJump(); }
    else if (SLIDE_KEYS.has(event.code)) { event.preventDefault(); triggerSlide(); }
    else if (event.code === "Escape") { event.preventDefault(); state.paused ? resume() : pause(); }
  });
  global.addEventListener("blur", () => { if (state.playing && !state.paused) pause(); });

  global.OfficeEscapeMinigame = Object.freeze({ start, pause, resume, preview, setComposition, debugSnapshot });
})(window);
