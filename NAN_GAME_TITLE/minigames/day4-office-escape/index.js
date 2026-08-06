(function exposeOfficeEscapeMinigame(global) {
  "use strict";
  if (!global.document) return;

  const Core = global.OfficeEscapeMinigameCore;
  const Art = global.OfficeEscapeArtAssets;
  if (!Core || !Art) throw new Error("OfficeEscapeMinigame requires core.js and art-assets.js");

  const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW"]);
  const SLIDE_KEYS = new Set(["ArrowDown", "KeyS"]);
  const COMPOSITIONS = new Set(["a", "b", "c"]);
  const BACKGROUND_GROUPS = Object.freeze([
    Object.freeze({ key: "office", id: "minigame_background.office_escape.office", start: 0, end: 36 }),
    Object.freeze({ key: "corridor", id: "minigame_background.office_escape.corridor", start: 36, end: 48 }),
    Object.freeze({ key: "lobby", id: "minigame_background.office_escape.elevator", start: 48, end: Core.DEFAULT_DURATION }),
  ]);
  const PROP_IDS = Object.freeze({
    chair: "prop.office.chair",
    cable: "prop.office.cable",
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
  const FORMATION_IDS = Object.freeze({
    doyun: CHARACTER_IDS.doyunRun,
    harin: CHARACTER_IDS.harinRun,
    boss: CHARACTER_IDS.bossRun,
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
  const actorPreloads = new Map();

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
    actorLayout: new Map(),
    chaseRender: { state: "", pressure: "" },
    objectRender: new Map(),
    backgroundRender: new Map(),
    formationMetrics: null,
    viewport: { width: 0, height: 0, dirty: true },
    floorX: "",
    passedClipLeft: "",
    progressValue: -1,
    zoneId: "",
    routeIndex: -1,
    uiElapsed: 0,
    feedbackUntil: 0,
    assistUntil: 0,
    pressedUntil: { jump: 0, slide: 0 },
    hitStopUntil: 0,
    impactUntil: 0,
    wasInvulnerable: false,
    restartOnResult: false,
    restartOptions: null,
    cueLayout: null,
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
    return BACKGROUND_GROUPS.map((group, index) => {
      const priority = index === 0 ? ' fetchpriority="high"' : "";
      return `<figure class="oe2-background-panel" data-background="${group.key}"><img src="${resolve(group.id)}" decoding="async"${priority} alt="" aria-hidden="true"></figure>`;
    }).join("");
  }

  function preloadActorArt() {
    Object.values(CHARACTER_IDS).forEach((id) => {
      const source = resolve(id);
      if (!source || actorPreloads.has(source)) return;
      const image = new global.Image();
      image.decoding = "async";
      image.src = source;
      const ready = typeof image.decode === "function"
        ? Promise.resolve(image.decode()).catch(() => undefined)
        : Promise.resolve();
      actorPreloads.set(source, { image, ready });
    });
  }

  function backgroundGroupForScene(scene = "") {
    if (scene.startsWith("office")) return "office";
    if (scene.startsWith("corridor")) return "corridor";
    return "lobby";
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
      <div class="oe2-world" aria-label="부장님을 피해 엘리베이터로 달리는 사무실" role="application" tabindex="-1">
        <div class="oe2-background-track" id="oe2-background-track" aria-hidden="true">${backgroundPanels()}</div>
        <div class="oe2-ground" aria-hidden="true"><i class="oe2-speed-line"></i><i class="oe2-speed-line"></i><i class="oe2-speed-line"></i></div>
        <ol class="oe2-zone-markers" aria-hidden="true"><li class="is-active"><span>1</span><b>사무실</b></li><li><span>2</span><b>복도</b></li><li><span>3</span><b>로비</b></li></ol>
        <div class="oe2-passed-objects" id="oe2-passed-objects" aria-hidden="true"></div>
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
      objects: root.querySelector("#oe2-objects"), passedObjects: root.querySelector("#oe2-passed-objects"), boss: root.querySelector(".oe2-boss"), harin: root.querySelector(".oe2-harin"), doyun: root.querySelector(".oe2-doyun"), playerReference: root.querySelector("#oe2-player-reference"), playerBody: root.querySelector("#oe2-player-body"),
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
    global.addEventListener("resize", () => {
      state.cueLayout = null;
      state.viewport.dirty = true;
    }, { passive: true });
    return root;
  }

  function viewportSize() {
    if (state.viewport.dirty || !state.viewport.width || !state.viewport.height) {
      state.viewport.width = refs.world.clientWidth || global.innerWidth;
      state.viewport.height = refs.world.clientHeight || global.innerHeight;
      state.viewport.dirty = false;
    }
    return state.viewport;
  }

  function formationMetrics() {
    if (!state.formationMetrics) {
      state.formationMetrics = Object.freeze({
        doyun: Art.metrics(FORMATION_IDS.doyun),
        harin: Art.metrics(FORMATION_IDS.harin),
        boss: Art.metrics(FORMATION_IDS.boss),
      });
    }
    return state.formationMetrics;
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
    const geometry = Core.actorScreenGeometry(metric, anchor, projection);
    const canvasSize = geometry.canvasSize;
    const layout = {
      alphaHeight: String(metric.alphaHeight),
      bottomPadding: String(metric.bottomPadding),
      canvasSize: `${canvasSize}px`,
      transform: `translate3d(${geometry.host.left}px, ${-geometry.host.bottom}px, 0)`,
    };
    const previous = state.actorLayout.get(role) || {};
    if (previous.alphaHeight !== layout.alphaHeight) host.style.setProperty("--oe2-alpha-height", layout.alphaHeight);
    if (previous.bottomPadding !== layout.bottomPadding) host.style.setProperty("--oe2-bottom-padding", layout.bottomPadding);
    if (previous.canvasSize !== layout.canvasSize) host.style.setProperty("--oe2-canvas-size", layout.canvasSize);
    if (previous.transform !== layout.transform) host.style.transform = layout.transform;
    state.actorLayout.set(role, layout);
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
    BACKGROUND_GROUPS.forEach((group, index) => {
      const image = refs.backgroundImages[index];
      const source = resolve(group.id);
      image.onerror = () => {
        image.onerror = null;
        image.closest(".oe2-background-panel")?.classList.add("is-load-error");
      };
      if (image.getAttribute("src") !== source) image.src = source;
    });
  }

  function objectNode(object) {
    let node = refs.objectNodes.get(object.id);
    if (node) return node;
    node = document.createElement("figure");
    node.className = `oe2-object oe2-${object.kind} oe2-${object.type}`;
    node.dataset.objectId = object.id;
    node.setAttribute("aria-hidden", "true");
    const usesApprovedArt = object.avoid !== "slide" || object.type === "sign";
    node.innerHTML = usesApprovedArt
      ? `<span class="oe2-object-paint"><span class="oe2-object-aura" aria-hidden="true"></span><img src="${resolve(PROP_IDS[object.type])}" alt="" aria-hidden="true"></span><span class="oe2-object-hitbox"></span>`
      : '<span class="oe2-object-paint oe2-overhead-frame" aria-hidden="true"><i></i><i></i></span><span class="oe2-object-hitbox"></span>';
    refs.objects.append(node);
    refs.objectNodes.set(object.id, node);
    return node;
  }

  function renderObjects(snapshot, projection) {
    const { width, scale } = projection;
    const active = new Set(snapshot.activeObjects.map((object) => object.id));
    const visible = new Set();
    snapshot.activeObjects.forEach((object) => {
      const visibleRect = object.visibleRect;
      const art = object.artRect || visibleRect;
      const screen = Core.projectWorldRect(art, projection);
      const centerX = screen.left + screen.width / 2;
      if (centerX < -220 || centerX > width + 240) return;
      visible.add(object.id);
      const node = objectNode(object);
      if (node.hidden) node.hidden = false;
      const layout = {
        width: `${Math.max(20, screen.width)}px`,
        height: `${Math.max(16, screen.height)}px`,
        left: `${centerX}px`,
        bottom: `${screen.bottom}px`,
      };
      const previous = state.objectRender.get(object.id) || {};
      if (previous.width !== layout.width) node.style.width = layout.width;
      if (previous.height !== layout.height) node.style.height = layout.height;
      if (previous.left !== layout.left) node.style.left = layout.left;
      if (previous.bottom !== layout.bottom) node.style.bottom = layout.bottom;
      const behindRunners = screen.left + screen.width <= projection.playerAnchorX + 8;
      const targetLayer = behindRunners ? refs.passedObjects : refs.objects;
      if (node.parentElement !== targetLayer) targetLayer.append(node);
      node.classList.toggle("telegraphed", snapshot.upcomingHazard?.id === object.id);
      node.classList.toggle("overhead", object.avoid === "slide");
      node.classList.toggle("is-behind-runners", behindRunners);
      node.dataset.motion = object.motion || "still";
      if (state.showHitboxes) {
        const collision = object.collisionRect;
        const hitbox = `${(collision.x - art.x) * scale}px|${(collision.y - art.y) * scale}px|${collision.width * scale}px|${collision.height * scale}px`;
        if (previous.hitbox !== hitbox) {
          const [left, bottom, hitWidth, hitHeight] = hitbox.split("|");
          node.style.setProperty("--oe2-hit-left", left);
          node.style.setProperty("--oe2-hit-bottom", bottom);
          node.style.setProperty("--oe2-hit-width", hitWidth);
          node.style.setProperty("--oe2-hit-height", hitHeight);
          layout.hitbox = hitbox;
        } else layout.hitbox = previous.hitbox;
      }
      state.objectRender.set(object.id, layout);
    });
    refs.objectNodes.forEach((node, id) => {
      if (!active.has(id)) {
        node.remove();
        refs.objectNodes.delete(id);
        state.objectRender.delete(id);
      } else if (!visible.has(id) && !node.hidden) {
        node.hidden = true;
      }
    });
  }

  function formatClock() { return "17:58"; }

  function renderBackgrounds(snapshot, width) {
    const reducedMotion = global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const presentation = Core.backgroundPresentationAt(snapshot.elapsed, { reducedMotion });
    const currentKey = backgroundGroupForScene(presentation.segment.scene);
    const nextKey = presentation.nextSegment ? backgroundGroupForScene(presentation.nextSegment.scene) : currentKey;
    const changingGroup = currentKey !== nextKey;
    refs.backgroundPanels.forEach((panel, index) => {
      const key = panel.dataset.background;
      const current = key === currentKey;
      const next = changingGroup && key === nextKey;
      const active = current || next;
      const opacity = current ? (changingGroup ? presentation.currentOpacity : 1) : next ? presentation.nextOpacity : 0;
      const group = BACKGROUND_GROUPS.find((candidate) => candidate.key === key);
      const groupProgress = group ? Math.max(0, Math.min(1, (snapshot.elapsed - group.start) / (group.end - group.start))) : 0;
      const nextRender = {
        hidden: !active,
        opacity: String(opacity),
        zIndex: next ? "1" : current ? "0" : "-1",
        pan: `${reducedMotion || !active ? 0 : -3 * groupProgress}%`,
      };
      const previous = state.backgroundRender.get(key) || {};
      if (previous.hidden !== nextRender.hidden) panel.hidden = nextRender.hidden;
      if (previous.opacity !== nextRender.opacity) panel.style.opacity = nextRender.opacity;
      if (previous.zIndex !== nextRender.zIndex) panel.style.zIndex = nextRender.zIndex;
      if (active && previous.pan !== nextRender.pan) refs.backgroundImages[index].style.setProperty("--oe2-background-pan", nextRender.pan);
      state.backgroundRender.set(key, nextRender);
    });
    const floorCycle = width * 0.36;
    const floorOffset = floorCycle ? -((snapshot.distance * (width / 780)) % floorCycle) : 0;
    const floorX = `${Math.round(floorOffset * 100) / 100}px`;
    if (state.floorX !== floorX) {
      refs.world.style.setProperty("--oe2-floor-x", floorX);
      state.floorX = floorX;
    }
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
    if (!state.cueLayout || state.cueLayout.width !== playfieldWidth) {
      const worldRect = refs.world.getBoundingClientRect();
      const jumpRect = refs.jump.getBoundingClientRect();
      const slideRect = refs.slide.getBoundingClientRect();
      state.cueLayout = {
        width: playfieldWidth,
        buttonSafeLeft: Math.max(24, jumpRect.right - worldRect.left + 16),
        buttonSafeRight: Math.max(24, worldRect.right - slideRect.left + 16),
      };
    }
    const cueHalfWidth = 62;
    const { buttonSafeLeft, buttonSafeRight } = state.cueLayout;
    const minimum = buttonSafeLeft + cueHalfWidth;
    const maximum = playfieldWidth - buttonSafeRight - cueHalfWidth;
    return minimum <= maximum
      ? Math.max(minimum, Math.min(maximum, rawCenter))
      : playfieldWidth / 2;
  }

  function consumeEvents(snapshot) {
    state.game.drainEvents().forEach((event) => {
      if (event.type === "jump") state.pressedUntil.jump = state.uiElapsed + 0.16;
      if (event.type === "slide") state.pressedUntil.slide = state.uiElapsed + 0.16;
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
    const { width, height } = viewportSize();
    const projection = Core.screenProjection(snapshot, width, height);
    const scale = projection.scale;
    const progress = snapshot.progress;
    if (state.playing) consumeEvents(snapshot);
    const scene = snapshot.finished ? "arrival" : snapshot.sliding ? "slide" : snapshot.y > 1 ? "jump" : "run";
    if (root.dataset.scene !== scene) root.dataset.scene = scene;
    if (root.dataset.zone !== snapshot.zone.id) root.dataset.zone = snapshot.zone.id;
    if (root.dataset.courseStage !== snapshot.courseStage.id) root.dataset.courseStage = snapshot.courseStage.id;
    root.classList.toggle("is-hurt", snapshot.invulnerable > 0);
    root.classList.toggle("show-hitboxes", state.showHitboxes);
    refs.progress.style.setProperty("--oe2-progress", String(progress));
    renderBackgrounds(snapshot, width);
    const zoneIndex = snapshot.zone.id === "office" ? 0 : snapshot.zone.id === "corridor" ? 1 : 2;
    const routeIndex = snapshot.finished ? 2 : Math.min(zoneIndex, 1);
    const progressValue = Math.round(progress * 100);
    if (state.progressValue !== progressValue) {
      refs.route.setAttribute("aria-valuenow", String(progressValue));
      refs.route.setAttribute("aria-valuetext", `${snapshot.zone.label} · ${progressValue}%`);
      state.progressValue = progressValue;
    }
    if (state.routeIndex !== routeIndex) {
      refs.routeNodes.forEach((node, index) => {
        node.classList.toggle("is-passed", index < routeIndex);
        node.classList.toggle("is-active", index === routeIndex);
      });
      state.routeIndex = routeIndex;
    }
    if (state.zoneId !== snapshot.zone.id) {
      refs.zoneNodes.forEach((node, index) => node.classList.toggle("is-active", index === zoneIndex));
      state.zoneId = snapshot.zone.id;
    }
    refs.items.forEach((node, id) => node.classList.toggle("is-collected", snapshot.collectedItems.includes(id)));

    const doyunGait = Core.gaitFrameIndex(snapshot.elapsed, Core.GAIT_PHASE_DELAY_MS.doyun);
    const harinGait = Core.gaitFrameIndex(snapshot.elapsed, Core.GAIT_PHASE_DELAY_MS.harin);
    const bossGait = Core.gaitFrameIndex(snapshot.elapsed, Core.GAIT_PHASE_DELAY_MS.boss);
    const doyunId = snapshot.sliding ? CHARACTER_IDS.doyunSlide : snapshot.y > 1 ? CHARACTER_IDS.doyunJump : doyunGait ? CHARACTER_IDS.doyunRunAlt : CHARACTER_IDS.doyunRun;
    const harinId = snapshot.assistUsed && snapshot.invulnerable > 0 ? CHARACTER_IDS.harinAssist : harinGait ? CHARACTER_IDS.harinRunAlt : CHARACTER_IDS.harinRun;
    const bossId = bossGait ? CHARACTER_IDS.bossRunAlt : CHARACTER_IDS.bossRun;
    const formation = Core.actorFormationGeometry(formationMetrics(), projection, snapshot.chasePressure);
    const harinRight = formation.actors.harin.silhouette.left + formation.actors.harin.silhouette.width;
    const passedClipLeft = `${(harinRight + formation.actors.doyun.silhouette.left) / 2}px`;
    if (state.passedClipLeft !== passedClipLeft) {
      refs.passedObjects.style.setProperty("--oe2-passed-clip-left", passedClipLeft);
      state.passedClipLeft = passedClipLeft;
    }
    const doyunMetric = setActorArt("doyun", doyunId, projection, formation.anchors.doyun);
    setActorArt("harin", harinId, projection, formation.anchors.harin);
    setActorArt("boss", bossId, projection, formation.anchors.boss);
    const chasePressure = String(snapshot.chasePressure);
    if (state.chaseRender.state !== snapshot.chaseState) refs.boss.dataset.chaseState = snapshot.chaseState;
    if (state.chaseRender.pressure !== chasePressure) refs.boss.style.setProperty("--oe2-chase-pressure", chasePressure);
    state.chaseRender = { state: snapshot.chaseState, pressure: chasePressure };
    if (state.showHitboxes) {
      renderPlayerReference(doyunMetric, projection);
      const playerBody = Core.projectWorldRect(snapshot.playerRect, projection);
      refs.playerBody.style.left = `${playerBody.left}px`;
      refs.playerBody.style.bottom = `${playerBody.bottom}px`;
      refs.playerBody.style.width = `${playerBody.width}px`;
      refs.playerBody.style.height = `${playerBody.height}px`;
    }
    renderObjects(snapshot, projection);
    const upcoming = snapshot.upcomingHazard;
    if (refs.telegraph.hidden === Boolean(upcoming)) refs.telegraph.hidden = !upcoming;
    if (upcoming) {
      const object = snapshot.activeObjects.find((candidate) => candidate.id === upcoming.id) || upcoming;
      const cueRect = object.type === "sign"
        ? object.visibleRect
        : object.collisionRect || object.visibleRect || object;
      const cuePoint = Core.projectWorldPoint({ x: cueRect.x + cueRect.width / 2, y: cueRect.y + cueRect.height }, projection);
      if (refs.telegraph.dataset.phase !== upcoming.telegraphPhase) refs.telegraph.dataset.phase = upcoming.telegraphPhase;
      const action = upcoming.avoid.toUpperCase();
      const actionText = upcoming.telegraphPhase === "act" ? `${action} NOW` : action;
      const labelText = upcoming.telegraphPhase === "act" ? "지금!" : `${upcoming.label} · 준비`;
      if (refs.telegraphAction.textContent !== actionText) refs.telegraphAction.textContent = actionText;
      if (refs.telegraphLabel.textContent !== labelText) refs.telegraphLabel.textContent = labelText;
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
    state.actorLayout.clear();
    state.chaseRender = { state: "", pressure: "" };
    state.objectRender.clear();
    state.backgroundRender.clear();
    state.formationMetrics = null;
    state.viewport.dirty = true;
    state.floorX = "";
    state.passedClipLeft = "";
    state.progressValue = -1;
    state.zoneId = "";
    state.routeIndex = -1;
    state.uiElapsed = 0;
    state.feedbackUntil = 0;
    state.assistUntil = 0;
    state.pressedUntil = { jump: 0, slide: 0 };
    state.hitStopUntil = 0;
    state.impactUntil = 0;
    state.wasInvulnerable = false;
    state.cueLayout = null;
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
    preloadActorArt();
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
    refs.world.focus({ preventScroll: true });
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
    if (!state.game.pressJump()) return;
    state.pressedUntil.jump = state.uiElapsed + 0.16;
    render(state.game.snapshot());
  }
  function triggerSlide() {
    if (!state.playing || state.paused || state.completed) return;
    if (!state.game.commitSlide()) return;
    state.pressedUntil.slide = state.uiElapsed + 0.16;
    render(state.game.snapshot());
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
    const { width, height } = viewportSize();
    const geometry = Core.debugGeometry(snapshot, formationMetrics(), width, height);
    return Object.freeze({ ...snapshot, playing: state.playing, awaitingStart: state.awaitingStart, paused: state.paused, composition: state.composition, geometry });
  }

  global.addEventListener("keydown", (event) => {
    if (!root || root.hidden) return;
    if (state.awaitingStart) {
      if (event.code === "Enter" || event.code === "Space") { event.preventDefault(); beginRun(); }
      return;
    }
    if (event.repeat && (JUMP_KEYS.has(event.code) || SLIDE_KEYS.has(event.code))) { event.preventDefault(); return; }
    if (JUMP_KEYS.has(event.code)) { event.preventDefault(); triggerJump(); }
    else if (SLIDE_KEYS.has(event.code)) { event.preventDefault(); triggerSlide(); }
    else if (event.code === "Escape") { event.preventDefault(); state.paused ? resume() : pause(); }
  });
  global.addEventListener("blur", () => { if (state.playing && !state.paused) pause(); });

  global.OfficeEscapeMinigame = Object.freeze({ start, pause, resume, preview, setComposition, debugSnapshot });
})(window);
