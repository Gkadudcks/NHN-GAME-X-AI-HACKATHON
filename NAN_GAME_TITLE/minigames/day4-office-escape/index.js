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
    papers: "prop.office.papers",
    cart: "prop.office.cart",
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
  const PREVIEW_RESULT = Object.freeze({
    grade: "perfect",
    caught: false,
    elapsed: Core.DEFAULT_DURATION,
    hitCount: 0,
    collectedItems: Object.freeze([]),
    maxCombo: 18,
  });

  let root = null;
  let refs = null;
  let frame = 0;
  let state = {
    game: null,
    playing: false,
    awaitingStart: false,
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
    uiElapsed: 0,
    feedbackUntil: 0,
    assistUntil: 0,
    pressedUntil: { jump: 0, slide: 0 },
    hitStopUntil: 0,
    impactUntil: 0,
    wasInvulnerable: false,
    restartOnResult: false,
    restartOptions: null,
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
        <div class="oe2-clock"><strong id="oe2-clock">17:58</strong></div>
        <div class="oe2-route" role="progressbar" aria-label="엘리베이터까지 진행" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="사무실 · 0%">
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
      <section class="oe2-intro" id="oe2-intro" role="dialog" aria-modal="true" aria-labelledby="oe2-intro-title" aria-describedby="oe2-intro-copy" hidden>
        <div class="oe2-intro-panel">
          <div class="oe2-intro-copy">
            <h1 id="oe2-intro-title">부장님 피해서 퇴근하기</h1>
            <p id="oe2-intro-copy">장애물을 피하며 엘리베이터까지 달리세요. 초록빛 물건은 선택 수집 목표입니다.</p>
            <span>약 1분 · 장애물에 맞아도 하린이 한 번 도와줍니다</span>
          </div>
          <div class="oe2-intro-guide" aria-label="조작 방법">
            <div>${icon("up")}<p><strong>점프</strong><span><kbd>Space</kbd> 또는 <kbd>↑</kbd></span></p></div>
            <div>${icon("down")}<p><strong>슬라이드</strong><span><kbd>S</kbd> 또는 <kbd>↓</kbd></span></p></div>
            <p class="oe2-intro-item"><i aria-hidden="true"></i><span><strong>초록 오라</strong> 선택 수집 목표 · 위험물은 주황 안내</span></p>
            <button id="oe2-intro-start" type="button">퇴근 시작 <b aria-hidden="true">→</b></button>
          </div>
        </div>
      </section>
      <div class="oe2-world" aria-label="부장님을 피해 엘리베이터로 달리는 사무실" role="application">
        <div class="oe2-background-track" id="oe2-background-track" aria-hidden="true">${backgroundPanels()}</div>
        <div class="oe2-ground" aria-hidden="true"><i class="oe2-speed-line"></i><i class="oe2-speed-line"></i><i class="oe2-speed-line"></i></div>
        <ol class="oe2-zone-markers" aria-hidden="true"><li class="is-active"><span>1</span><b>사무실</b></li><li><span>2</span><b>복도</b></li><li><span>3</span><b>로비</b></li></ol>
        <div class="oe2-objects" id="oe2-objects" aria-hidden="true"></div>
        <div class="oe2-actors" aria-label="부장님, 서하린, 도윤의 추격 대형">
          <figure class="oe2-actor oe2-boss"><img id="oe2-boss" src="${resolve(CHARACTER_IDS.bossRun)}" alt="뒤에서 쫓아오는 부장님"></figure>
          <figure class="oe2-actor oe2-harin"><img id="oe2-harin" src="${resolve(CHARACTER_IDS.harinRun)}" alt="도윤과 함께 달리는 서하린"><div class="oe2-assist-badge" id="oe2-assist-badge" aria-hidden="true">${icon("shield")}<span>하린이 막아줬다!</span></div></figure>
          <figure class="oe2-actor oe2-doyun"><img id="oe2-doyun" src="${resolve(CHARACTER_IDS.doyunRun)}" alt="오른쪽으로 달리는 도윤"></figure>
        </div>
        <div class="oe2-player-reference" id="oe2-player-reference" aria-hidden="true"></div>
        <div class="oe2-player-body" id="oe2-player-body" aria-hidden="true"></div>
        <div class="oe2-telegraph" id="oe2-telegraph" hidden><strong id="oe2-telegraph-action">JUMP</strong><span id="oe2-telegraph-label"></span></div>
        <div class="oe2-feedback" id="oe2-feedback" role="status" aria-live="polite"></div>
        <button class="oe2-ring-action oe2-action oe2-jump" type="button" aria-label="점프, Space 또는 위 화살표">${icon("up")}<span>JUMP</span></button>
        <button class="oe2-ring-action oe2-action oe2-slide" type="button" aria-label="슬라이드, 아래 화살표 또는 S">${icon("down")}<span>SLIDE</span></button>
        <div class="oe2-pause-screen" aria-live="polite"><strong>일시정지</strong><span>ESC 또는 일시정지 버튼으로 계속합니다</span></div>
        <section class="oe2-result" id="oe2-result" hidden role="dialog" aria-modal="true" aria-labelledby="oe2-result-grade" aria-describedby="oe2-result-copy oe2-result-goal"><strong id="oe2-result-grade">무피격 PERFECT</strong><p id="oe2-result-copy"></p><p id="oe2-result-goal" class="oe2-result-goal"></p><button type="button" id="oe2-result-continue">스토리 계속하기</button></section>
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
      hud: root.querySelector(".oe2-hud"), intro: root.querySelector("#oe2-intro"), introStart: root.querySelector("#oe2-intro-start"),
      world: root.querySelector(".oe2-world"),
      clock: root.querySelector("#oe2-clock"), route: root.querySelector(".oe2-route"), progress: root.querySelector("#oe2-route-progress"),
      routeNodes: [...root.querySelectorAll(".oe2-route li")], zoneNodes: [...root.querySelectorAll(".oe2-zone-markers li")],
      backgroundPanels: [...root.querySelectorAll(".oe2-background-panel")],
      backgroundImages: [...root.querySelectorAll(".oe2-background-panel img")],
      objects: root.querySelector("#oe2-objects"), boss: root.querySelector(".oe2-boss"), harin: root.querySelector(".oe2-harin"), doyun: root.querySelector(".oe2-doyun"), playerReference: root.querySelector("#oe2-player-reference"), playerBody: root.querySelector("#oe2-player-body"),
      actors: { boss: root.querySelector("#oe2-boss"), harin: root.querySelector("#oe2-harin"), doyun: root.querySelector("#oe2-doyun") },
      telegraph: root.querySelector("#oe2-telegraph"), telegraphAction: root.querySelector("#oe2-telegraph-action"), telegraphLabel: root.querySelector("#oe2-telegraph-label"),
      feedback: root.querySelector("#oe2-feedback"), assistBadge: root.querySelector("#oe2-assist-badge"), jump: root.querySelector(".oe2-jump"), slide: root.querySelector(".oe2-slide"), pause: root.querySelector(".oe2-pause"),
      result: root.querySelector("#oe2-result"), resultGrade: root.querySelector("#oe2-result-grade"), resultCopy: root.querySelector("#oe2-result-copy"), resultGoal: root.querySelector("#oe2-result-goal"), resultAction: root.querySelector("#oe2-result-continue"),
      items: new Map([...root.querySelectorAll("[data-item]")].map((node) => [node.dataset.item, node])), objectNodes: new Map(),
    };
    refs.jump.addEventListener("click", triggerJump);
    refs.slide.addEventListener("click", triggerSlide);
    refs.introStart.addEventListener("click", beginRun);
    refs.pause.addEventListener("click", () => state.paused ? resume() : pause());
    refs.resultAction.addEventListener("click", handleResultAction);
    return root;
  }

  function setActorArt(role, id, projection, anchor) {
    const image = refs.actors[role];
    const host = refs[role];
    if (!image || !host) return;
    if (state.actorArt.get(role) !== id) {
      image.src = resolve(id);
      state.actorArt.set(role, id);
    }
    const metric = Art.metrics(id);
    const geometry = Core.actorScreenGeometry(metric, { x: 0, bottom: projection.ground }, projection);
    const canvasSize = geometry.canvasSize;
    host.style.setProperty("--oe2-alpha-height", String(metric.alphaHeight));
    host.style.setProperty("--oe2-bottom-padding", String(metric.bottomPadding));
    host.style.setProperty("--oe2-canvas-size", `${canvasSize}px`);
    host.style.translate = `${-metric.footAnchor.x * canvasSize}px 0`;
    host.style.left = `${anchor.x}px`;
    host.style.bottom = `${anchor.bottom}px`;
    return metric;
  }

  function renderPlayerReference(metric, projection) {
    const geometry = Core.actorScreenGeometry(metric, { x: projection.playerAnchorX, bottom: projection.playerAnchorBottom }, projection);
    refs.playerReference.style.left = `${geometry.reference.left}px`;
    refs.playerReference.style.bottom = `${geometry.reference.bottom}px`;
    refs.playerReference.style.width = `${geometry.reference.width}px`;
    refs.playerReference.style.height = `${geometry.reference.height}px`;
  }

  function updateBackgroundSources() {
    if (!refs) return;
    Core.BACKGROUND_ROUTE.forEach((segment, index) => {
      const id = BACKGROUND_IDS[segment.scene];
      const fallback = BACKGROUND_FALLBACKS[segment.scene];
      const image = refs.backgroundImages[index];
      const source = resolve(id, fallback);
      const fallbackSource = Art.resolve(fallback);
      image.onerror = () => {
        if (image.dataset.fallbackApplied === "true") { image.onerror = null; return; }
        image.dataset.fallbackApplied = "true";
        image.src = fallbackSource;
      };
      image.dataset.fallbackApplied = "false";
      image.src = source;
    });
  }

  function objectNode(object) {
    let node = refs.objectNodes.get(object.id);
    if (node) return node;
    node = document.createElement("figure");
    node.className = `oe2-object oe2-${object.kind} oe2-${object.type}`;
    node.dataset.objectId = object.id;
    node.setAttribute("aria-hidden", "true");
    node.innerHTML = object.avoid === "slide"
      ? '<span class="oe2-object-paint oe2-overhead-frame" aria-hidden="true"><i></i><i></i></span><span class="oe2-object-hitbox"></span>'
      : `<span class="oe2-object-paint"><span class="oe2-object-aura" aria-hidden="true"></span><img src="${resolve(PROP_IDS[object.type])}" alt="" aria-hidden="true"></span><span class="oe2-object-hitbox"></span>`;
    refs.objects.append(node);
    refs.objectNodes.set(object.id, node);
    return node;
  }

  function renderObjects(snapshot, projection) {
    const { width, scale } = projection;
    const active = new Set(snapshot.activeObjects.map((object) => object.id));
    refs.objectNodes.forEach((node, id) => {
      node.hidden = !active.has(id);
    });
    snapshot.activeObjects.forEach((object) => {
      const node = objectNode(object);
      const visible = object.visibleRect;
      const art = object.artRect || visible;
      const screen = Core.projectWorldRect(art, projection);
      const centerX = screen.left + screen.width / 2;
      node.hidden = centerX < -220 || centerX > width + 240;
      node.style.width = `${Math.max(20, screen.width)}px`;
      node.style.height = `${Math.max(16, screen.height)}px`;
      node.style.left = `${centerX}px`;
      node.style.bottom = `${screen.bottom}px`;
      node.classList.toggle("telegraphed", snapshot.upcomingHazard?.id === object.id);
      node.classList.toggle("overhead", object.avoid === "slide");
      node.dataset.motion = object.motion || "still";
      if (state.showHitboxes) {
        const collision = object.collisionRect;
        node.style.setProperty("--oe2-hit-left", `${(collision.x - art.x) * scale}px`);
        node.style.setProperty("--oe2-hit-bottom", `${(collision.y - art.y) * scale}px`);
        node.style.setProperty("--oe2-hit-width", `${collision.width * scale}px`);
        node.style.setProperty("--oe2-hit-height", `${collision.height * scale}px`);
      }
    });
  }

  function formatClock() { return "17:58"; }

  function renderBackgrounds(snapshot, width) {
    const reducedMotion = global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const presentation = Core.backgroundPresentationAt(snapshot.elapsed, { reducedMotion });
    refs.backgroundPanels.forEach((panel, index) => {
      const current = index === presentation.currentIndex;
      const next = index === presentation.nextIndex;
      const opacity = current ? presentation.currentOpacity : next ? presentation.nextOpacity : 0;
      panel.style.opacity = String(opacity);
      panel.style.zIndex = next ? "1" : current ? "0" : "-1";
      refs.backgroundImages[index].style.setProperty("--oe2-background-pan", `${current ? presentation.panPercent : 0}%`);
    });
    const floorCycle = width * 0.36;
    const floorOffset = floorCycle ? -((snapshot.distance * (width / 780)) % floorCycle) : 0;
    refs.world.style.setProperty("--oe2-floor-x", `${floorOffset}px`);
  }

  function showFeedback(text, kind = "") {
    refs.feedback.textContent = text;
    refs.feedback.dataset.kind = kind;
    if (kind === "assist") {
      refs.feedback.classList.remove("show");
      refs.assistBadge.classList.add("show");
      state.assistUntil = state.uiElapsed + 1;
      return;
    }
    refs.assistBadge.classList.remove("show");
    refs.feedback.classList.add("show");
    state.feedbackUntil = state.uiElapsed + 1.1;
  }

  function telegraphCenterX(rawCenter, playfieldWidth) {
    const worldRect = refs.world.getBoundingClientRect();
    const jumpRect = refs.jump.getBoundingClientRect();
    const slideRect = refs.slide.getBoundingClientRect();
    const cueHalfWidth = ((refs.telegraph.offsetWidth || 116) * 1.07) / 2;
    const controlGap = 16;
    const edgeGap = 24;
    const buttonSafeLeft = Math.max(edgeGap, jumpRect.right - worldRect.left + controlGap);
    const buttonSafeRight = Math.max(edgeGap, worldRect.right - slideRect.left + controlGap);
    const minimum = buttonSafeLeft + cueHalfWidth;
    const maximum = playfieldWidth - buttonSafeRight - cueHalfWidth;
    return minimum <= maximum
      ? Math.max(minimum, Math.min(maximum, rawCenter))
      : playfieldWidth / 2;
  }

  function consumeEvents(snapshot) {
    state.game.drainEvents().forEach((event) => {
      if (event.type === "jump") { state.pressedUntil.jump = state.uiElapsed + 0.16; showFeedback("점프!", "action"); }
      if (event.type === "slide") { state.pressedUntil.slide = state.uiElapsed + 0.16; showFeedback("슬라이드!", "action"); }
      if (event.type === "avoid") showFeedback(`${event.object.avoid === "jump" ? "점프" : "슬라이드"} 통과!`, "safe");
      if (event.type === "collect") showFeedback(`${event.object.label} 획득`, "collect");
      if (event.type === "assist") showFeedback("하린이 막아줬다!", "assist");
      if (event.type === "hit") {
        const remaining = Math.max(0, 3 - event.hitCount);
        const label = event.object?.label || "장애물";
        showFeedback(remaining > 0 ? `${label}에 부딪힘 · 남은 여유 ${remaining}회` : `${label}에 부딪힘 · 붙잡힘 확정`, "hit");
        state.hitStopUntil = state.uiElapsed + 0.09;
        state.impactUntil = state.uiElapsed + 0.3;
      }
      if (event.type === "finish") finishRun(event);
    });
    if (state.uiElapsed > state.feedbackUntil) refs.feedback.classList.remove("show");
    if (state.uiElapsed > state.assistUntil) refs.assistBadge.classList.remove("show");
    refs.jump.classList.toggle("pressed", state.uiElapsed < state.pressedUntil.jump);
    refs.slide.classList.toggle("pressed", state.uiElapsed < state.pressedUntil.slide);
    root.classList.toggle("is-impact", state.uiElapsed < state.impactUntil);
    if (state.wasInvulnerable && snapshot.invulnerable <= 0) showFeedback("회복 완료 · 다시 움직일 수 있습니다", "safe");
    state.wasInvulnerable = snapshot.invulnerable > 0;
  }

  function render(snapshot) {
    if (!root || !snapshot) return;
    const width = refs.world.clientWidth || global.innerWidth;
    const height = refs.world.clientHeight || global.innerHeight;
    const projection = Core.screenProjection(snapshot, width, height);
    const scale = projection.scale;
    const progress = snapshot.progress;
    if (state.playing) consumeEvents(snapshot);
    root.dataset.scene = snapshot.finished ? "arrival" : snapshot.sliding ? "slide" : snapshot.y > 1 ? "jump" : "run";
    root.dataset.zone = snapshot.zone.id;
    root.dataset.courseStage = snapshot.courseStage.id;
    root.classList.toggle("is-hurt", snapshot.invulnerable > 0);
    root.classList.toggle("show-hitboxes", state.showHitboxes);
    refs.clock.textContent = formatClock();
    refs.progress.style.setProperty("--oe2-progress", String(progress));
    renderBackgrounds(snapshot, width);
    const zoneIndex = snapshot.zone.id === "office" ? 0 : snapshot.zone.id === "corridor" ? 1 : 2;
    const progressValue = Math.round(progress * 100);
    refs.route.setAttribute("aria-valuenow", String(progressValue));
    refs.route.setAttribute("aria-valuetext", `${snapshot.zone.label} · ${progressValue}%`);
    refs.routeNodes.forEach((node, index) => node.classList.toggle("is-active", index === zoneIndex));
    refs.zoneNodes.forEach((node, index) => node.classList.toggle("is-active", index === zoneIndex));
    refs.items.forEach((node, id) => node.classList.toggle("is-collected", snapshot.collectedItems.includes(id)));

    const gait = Core.gaitFrameIndex(snapshot.elapsed);
    const doyunId = snapshot.sliding ? CHARACTER_IDS.doyunSlide : snapshot.y > 1 ? CHARACTER_IDS.doyunJump : gait ? CHARACTER_IDS.doyunRunAlt : CHARACTER_IDS.doyunRun;
    const harinId = snapshot.assistUsed && snapshot.invulnerable > 0 ? CHARACTER_IDS.harinAssist : gait ? CHARACTER_IDS.harinRunAlt : CHARACTER_IDS.harinRun;
    const bossId = gait ? CHARACTER_IDS.bossRunAlt : CHARACTER_IDS.bossRun;
    const actorMetrics = {
      doyun: Art.metrics(doyunId),
      harin: Art.metrics(harinId),
      boss: Art.metrics(bossId),
    };
    const formation = Core.actorFormationGeometry(actorMetrics, projection, snapshot.chasePressure);
    const doyunMetric = setActorArt("doyun", doyunId, projection, formation.anchors.doyun);
    setActorArt("harin", harinId, projection, formation.anchors.harin);
    setActorArt("boss", bossId, projection, formation.anchors.boss);
    refs.boss.dataset.chaseState = snapshot.chaseState;
    refs.boss.style.setProperty("--oe2-chase-pressure", String(snapshot.chasePressure));
    renderPlayerReference(doyunMetric, projection);
    const playerBody = Core.projectWorldRect(snapshot.playerRect, projection);
    refs.playerBody.style.left = `${playerBody.left}px`;
    refs.playerBody.style.bottom = `${playerBody.bottom}px`;
    refs.playerBody.style.width = `${playerBody.width}px`;
    refs.playerBody.style.height = `${playerBody.height}px`;
    renderObjects(snapshot, projection);
    const upcoming = snapshot.upcomingHazard;
    refs.telegraph.hidden = !upcoming;
    if (upcoming) {
      const object = snapshot.activeObjects.find((candidate) => candidate.id === upcoming.id) || upcoming;
      const cueRect = object.collisionRect || object.visibleRect || object;
      const cuePoint = Core.projectWorldPoint({ x: cueRect.x + cueRect.width / 2, y: cueRect.y + cueRect.height }, projection);
      refs.telegraph.dataset.phase = upcoming.telegraphPhase;
      const action = upcoming.avoid.toUpperCase();
      refs.telegraphAction.textContent = upcoming.telegraphPhase === "act" ? `${action} NOW` : action;
      refs.telegraphLabel.textContent = upcoming.telegraphPhase === "act" ? "지금!" : `${upcoming.label} · 준비`;
      refs.telegraph.style.left = `${telegraphCenterX(cuePoint.x, width)}px`;
      refs.telegraph.style.bottom = `${Math.max(projection.ground + 12, Math.min(height - 84, cuePoint.bottom + 12))}px`;
    }
    refs.jump.classList.toggle("active", root.dataset.scene === "jump");
    refs.slide.classList.toggle("active", snapshot.sliding);
  }

  function preview(scene = "run") {
    if (!new Set(["run", "jump", "slide", "collectible", "first-risk", "maximum", "hit", "arrival", "result"]).has(scene)) return;
    ensureRoot();
    cancelAnimationFrame(frame);
    state.playing = false;
    state.awaitingStart = false;
    state.paused = false;
    state.previewScene = scene;
    root.classList.remove("is-impact");
    root.classList.remove("is-awaiting-start");
    refs.intro.hidden = true;
    refs.world.inert = false;
    refs.hud.inert = false;
    refs.feedback.classList.remove("show");
    refs.feedback.textContent = "";
    refs.feedback.removeAttribute("data-kind");
    const hitCourse = [{ id: "preview-hit", kind: "hazard", type: "chair", avoid: "jump", label: "회전 의자", x: 70, y: 0, width: 72, height: 42 }];
    const previewCore = Core.create(scene === "hit"
      ? { duration: 8, length: 1800, assist: false, course: hitCourse }
      : { duration: Core.DEFAULT_DURATION, assist: true });
    if (scene === "hit") render(previewCore.snapshot());
    const seconds = scene === "arrival" || scene === "result" ? 61.5 : scene === "slide" ? 8.65 : scene === "collectible" ? 14.35 : scene === "jump" ? 4.5 : scene === "first-risk" ? 3.4 : scene === "hit" ? 0 : 2;
    for (let elapsed = 0; elapsed < seconds && !previewCore.snapshot().finished; elapsed += 0.1) previewCore.step(0.1);
    if (scene === "jump") { previewCore.pressJump(); previewCore.step(0.2); }
    if (scene === "slide") { previewCore.commitSlide(); previewCore.step(0.12); }
    if (scene === "hit") previewCore.step(Core.FIXED_STEP);
    const sourceSnapshot = previewCore.snapshot();
    const snapshot = scene === "maximum" ? {
      ...sourceSnapshot,
      chasePressure: Core.CHASE_PRESSURE.maximum,
      chaseState: "closing",
    } : sourceSnapshot;
    if (scene === "arrival" || scene === "result") snapshot.finished = true;
    render(snapshot);
    if (scene === "result") {
      if (state.restartOnResult && state.restartOptions) state.restartOptions = { ...state.restartOptions, previewScene: "run" };
      renderResultState(PREVIEW_RESULT);
    }
    if (scene === "hit") {
      refs.feedback.textContent = "회전 의자에 부딪힘 · 남은 여유 2회";
      refs.feedback.dataset.kind = "hit";
      refs.feedback.classList.add("show");
      root.classList.add("is-impact");
    }
  }

  function start(options = {}) {
    ensureRoot();
    cancelAnimationFrame(frame);
    state.composition = COMPOSITIONS.has(options.composition) ? options.composition : state.composition;
    state.reviewAssetMap = options.reviewAssetMap || {};
    state.reviewAssetsEnabled = Boolean(options.reviewAssetsEnabled);
    state.showHitboxes = Boolean(options.showHitboxes);
    state.onComplete = typeof options.onComplete === "function" ? options.onComplete : null;
    state.restartOnResult = options.resultAction === "restart";
    state.restartOptions = state.restartOnResult ? { ...options } : null;
    state.completed = false;
    state.playing = false;
    state.awaitingStart = false;
    state.paused = false;
    state.actorArt.clear();
    state.uiElapsed = 0;
    state.feedbackUntil = 0;
    state.assistUntil = 0;
    state.pressedUntil = { jump: 0, slide: 0 };
    state.hitStopUntil = 0;
    state.impactUntil = 0;
    state.wasInvulnerable = false;
    root.hidden = false;
    root.dataset.composition = state.composition;
    root.classList.remove("is-paused", "is-complete", "is-impact");
    refs.jump.disabled = false;
    refs.slide.disabled = false;
    refs.pause.disabled = false;
    refs.jump.classList.remove("pressed");
    refs.slide.classList.remove("pressed");
    refs.feedback.classList.remove("show");
    refs.feedback.textContent = "";
    refs.feedback.removeAttribute("data-kind");
    refs.assistBadge.classList.remove("show");
    refs.result.hidden = true;
    refs.intro.hidden = true;
    refs.world.inert = false;
    refs.hud.inert = false;
    refs.resultAction.textContent = state.restartOnResult ? "다시 달리기" : "스토리 계속하기";
    updateBackgroundSources();
    state.game = Core.create(options.testOverrides || {});
    if (options.autoStart === false) {
      preview(options.previewScene || "run");
      return;
    }
    render(state.game.snapshot());
    showIntro();
  }

  function showIntro() {
    state.awaitingStart = true;
    state.playing = false;
    refs.intro.hidden = false;
    refs.world.inert = true;
    refs.hud.inert = true;
    refs.jump.disabled = true;
    refs.slide.disabled = true;
    refs.pause.disabled = true;
    root.classList.add("is-awaiting-start");
    requestAnimationFrame(() => refs.introStart.focus({ preventScroll: true }));
  }

  function beginRun() {
    if (!state.awaitingStart || state.completed) return;
    state.awaitingStart = false;
    refs.intro.hidden = true;
    refs.world.inert = false;
    refs.hud.inert = false;
    refs.jump.disabled = false;
    refs.slide.disabled = false;
    refs.pause.disabled = false;
    root.classList.remove("is-awaiting-start");
    state.playing = true;
    state.lastFrame = performance.now();
    frame = requestAnimationFrame(tick);
    refs.jump.focus({ preventScroll: true });
  }

  function tick(now) {
    if (!state.playing) return;
    const delta = Math.min(0.1, Math.max(0, (now - state.lastFrame) / 1000));
    state.lastFrame = now;
    if (!state.paused) {
      state.uiElapsed += delta;
      if (state.uiElapsed >= state.hitStopUntil) state.game.step(delta);
    }
    render(state.game.snapshot());
    if (state.playing) frame = requestAnimationFrame(tick);
  }

  function triggerJump() {
    if (!state.playing || state.paused || state.completed) return;
    state.game.pressJump();
    state.pressedUntil.jump = state.uiElapsed + 0.16;
  }
  function triggerSlide() {
    if (!state.playing || state.paused || state.completed) return;
    state.game.commitSlide();
    state.pressedUntil.slide = state.uiElapsed + 0.16;
  }
  function pause() {
    if (!root || !state.playing || state.awaitingStart || state.paused || state.completed) return;
    state.paused = true;
    root.classList.add("is-paused");
    refs.pause.setAttribute("aria-pressed", "true");
    refs.pause.setAttribute("aria-label", "계속하기");
    refs.pause.innerHTML = icon("play");
  }
  function resume() {
    if (!root || !state.paused || state.completed) return;
    state.paused = false;
    state.lastFrame = performance.now();
    root.classList.remove("is-paused");
    refs.pause.setAttribute("aria-pressed", "false");
    refs.pause.setAttribute("aria-label", "일시정지");
    refs.pause.innerHTML = icon("pause");
  }
  function renderResultState(result) {
    state.completed = true;
    state.playing = false;
    state.awaitingStart = false;
    cancelAnimationFrame(frame);
    root.classList.add("is-complete");
    root.classList.remove("is-impact", "is-paused", "is-awaiting-start");
    refs.intro.hidden = true;
    refs.world.inert = false;
    refs.hud.inert = false;
    state.paused = false;
    refs.jump.disabled = true;
    refs.slide.disabled = true;
    refs.pause.disabled = true;
    refs.jump.classList.remove("pressed");
    refs.slide.classList.remove("pressed");
    refs.result.hidden = false;
    const grade = result.grade.toUpperCase();
    refs.resultGrade.textContent = result.caught
      ? `붙잡힘 ${grade}`
      : result.hitCount === 0 ? `무피격 ${grade}` : `피격 ${result.hitCount}회 ${grade}`;
    refs.resultCopy.textContent = result.caught
      ? "부장님에게 붙잡혔습니다. 확인 업무 후 퇴근합니다."
      : result.hitCount === 0 ? "장애물에 부딪히지 않고 도착했습니다." : "피격 횟수를 기준으로 산정한 등급입니다.";
    refs.resultGoal.textContent = `수집 ${result.collectedItems.length}/3 · 선택 목표`;
    state.finalResult = result;
    refs.resultAction.focus({ preventScroll: true });
  }
  function finishRun(event) {
    if (state.completed) return;
    renderResultState(event.result || state.game.result());
  }
  function handleResultAction() {
    if (!state.completed) return;
    if (state.restartOnResult && state.restartOptions) {
      const restartOptions = state.restartOptions;
      start(restartOptions);
      if (restartOptions.autoStart === false) refs.jump.focus({ preventScroll: true });
      return;
    }
    completeToStory();
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
    const snapshot = state.game?.snapshot() || {};
    const gait = Core.gaitFrameIndex(snapshot.elapsed);
    const metrics = {
      doyun: Art.metrics(snapshot.sliding ? CHARACTER_IDS.doyunSlide : snapshot.y > 1 ? CHARACTER_IDS.doyunJump : gait ? CHARACTER_IDS.doyunRunAlt : CHARACTER_IDS.doyunRun),
      harin: Art.metrics(snapshot.assistUsed && snapshot.invulnerable > 0 ? CHARACTER_IDS.harinAssist : gait ? CHARACTER_IDS.harinRunAlt : CHARACTER_IDS.harinRun),
      boss: Art.metrics(gait ? CHARACTER_IDS.bossRunAlt : CHARACTER_IDS.bossRun),
    };
    const width = refs.world?.clientWidth || global.innerWidth;
    const height = refs.world?.clientHeight || global.innerHeight;
    const geometry = Core.debugGeometry(snapshot, metrics, width, height);
    return Object.freeze({ ...snapshot, playing: state.playing, awaitingStart: state.awaitingStart, paused: state.paused, composition: state.composition, geometry });
  }

  global.addEventListener("keydown", (event) => {
    if (!root || root.hidden) return;
    if (state.awaitingStart) {
      if (event.code === "Enter" || event.code === "Space") { event.preventDefault(); beginRun(); }
      return;
    }
    if (JUMP_KEYS.has(event.code)) { event.preventDefault(); triggerJump(); }
    else if (SLIDE_KEYS.has(event.code)) { event.preventDefault(); triggerSlide(); }
    else if (event.code === "Escape") { event.preventDefault(); state.paused ? resume() : pause(); }
  });
  global.addEventListener("blur", () => { if (state.playing && !state.paused) pause(); });

  global.OfficeEscapeMinigame = Object.freeze({ start, pause, resume, preview, setComposition, debugSnapshot });
})(window);
