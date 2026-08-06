(function exposeOfficeEscapeCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OfficeEscapeMinigameCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOfficeEscapeCoreApi() {
  "use strict";

  const DEFAULT_DURATION = 64;
  const DEFAULT_LENGTH = 16000;
  const WORLD_SPEED_MULTIPLIER = 1.5;
  const PRODUCTION_HAZARD_SCALE = 0.7;
  const FIXED_STEP = 1 / 120;
  const PLAYER_X_OFFSET = 8;
  const PLAYER_PATH_WIDTH = 44;
  const PLAYER_BOTTOM_FORGIVENESS = 8;
  const PLAYER_WIDTH = 80.01;
  const STANDING_HEIGHT = 105.84;
  const SLIDING_WIDTH = 71.19;
  const SLIDING_HEIGHT = 44.1;
  const PLAYER_PROFILES = Object.freeze({
    run: Object.freeze({ width: PLAYER_WIDTH, height: STANDING_HEIGHT, referenceWidth: 141.12 * 386 / 512, referenceHeight: 141.12 }),
    jump: Object.freeze({ width: PLAYER_WIDTH, height: STANDING_HEIGHT, referenceWidth: 141.12 * 365 / 480, referenceHeight: 141.12 }),
    slide: Object.freeze({ width: SLIDING_WIDTH, height: SLIDING_HEIGHT, referenceWidth: 77.49 * 260 / 198, referenceHeight: 77.49 * 162 / 198 }),
  });
  const GRAVITY = 1900;
  const JUMP_VELOCITY = 760;
  const JUMP_BUFFER = 0.12;
  const SLIDE_DURATION = 0.7;
  const SLIDE_RECOVERY = 0.15;
  const ACTION_LEAD_TIME = Object.freeze({ jump: 0.16, slide: 0.15 });
  const TUTORIAL_PREPARE_LEAD_TIME = 1.8;
  const INVULNERABLE_TIME = 0.75;
  const MIN_HAZARD_GAP_SECONDS = 2.8;
  const CHASE_PRESSURE = Object.freeze({
    stageBase: Object.freeze({ learning: 0.18, mixed: 0.28, finale: 0.38 }),
    assistBoost: 0.16,
    hitBoost: 0.28,
    recoveryPerSecond: 0.32,
    maximum: 0.82,
  });
  const GAIT_FRAME_MS = 500;
  const GAIT_PHASE_DELAY_MS = Object.freeze({ doyun: 0, harin: 150, boss: 300 });
  const COLLISION_INSET = Object.freeze({ horizontal: 0.11, vertical: 0.15 });
  const VIEW_REFERENCE_WIDTH = 780;
  const VIEW_PLAYER_ANCHOR_X_RATIO = 0.46;
  const VIEW_GROUND_RATIO = 0.09;
  const ACTOR_FORMATION = Object.freeze({
    doyunHarinGap: 12,
    bossHarinSteadyGap: 30,
    bossHarinMinimumGap: 10,
    viewportMarginRatio: 0.016,
    viewportMarginMinimum: 16,
    minimumForwardViewRatio: 0.32,
  });
  const HAZARD_EDGE_ALIGNMENT = 1.4;
  const SLIDE_CLEARANCE = 5.6;
  const SLIDE_HAZARD_REFERENCE_HEIGHT = 49;
  const SLIDE_DRAWER_WIDTH = 152;

  const PROP_ART_FRAMING = Object.freeze({
    chair: Object.freeze({ alphaWidth: 333 / 512, alphaHeight: 468 / 512, bottomPadding: 12 / 512 }),
    cable: Object.freeze({ alphaWidth: 468 / 512, alphaHeight: 96 / 512, bottomPadding: 12 / 512 }),
    drawer: Object.freeze({ alphaWidth: 468 / 512, alphaHeight: 150 / 512, bottomPadding: 12 / 512 }),
    papers: Object.freeze({ alphaWidth: 468 / 512, alphaHeight: 153 / 512, bottomPadding: 12 / 512 }),
    cart: Object.freeze({ alphaWidth: 468 / 512, alphaHeight: 334 / 512, bottomPadding: 12 / 512 }),
    sign: Object.freeze({ alphaWidth: 468 / 512, alphaHeight: 274 / 512, bottomPadding: 12 / 512 }),
    "access-card": Object.freeze({ alphaWidth: 287 / 512, alphaHeight: 468 / 512, bottomPadding: 12 / 512 }),
    phone: Object.freeze({ alphaWidth: 329 / 512, alphaHeight: 468 / 512, bottomPadding: 12 / 512 }),
    "backup-usb": Object.freeze({ alphaWidth: 468 / 512, alphaHeight: 349 / 512, bottomPadding: 12 / 512 }),
  });

  const ZONES = Object.freeze([
    Object.freeze({ id: "office", label: "사무실", start: 0, end: 36 / DEFAULT_DURATION, pace: "탈출 시작" }),
    Object.freeze({ id: "corridor", label: "유리 복도", start: 36 / DEFAULT_DURATION, end: 48 / DEFAULT_DURATION, pace: "추격 가속" }),
    Object.freeze({ id: "lobby", label: "엘리베이터 로비", start: 48 / DEFAULT_DURATION, end: 1, pace: "마지막 질주" }),
  ]);

  const BACKGROUND_ROUTE = Object.freeze([
    Object.freeze({ id: "office-a", scene: "office", start: 0, end: 6 }),
    Object.freeze({ id: "office-b", scene: "office-b", start: 6, end: 12 }),
    Object.freeze({ id: "office-c", scene: "office-c", start: 12, end: 18 }),
    Object.freeze({ id: "office-a-repeat", scene: "office", start: 18, end: 24 }),
    Object.freeze({ id: "office-b-repeat", scene: "office-b", start: 24, end: 30 }),
    Object.freeze({ id: "office-c-repeat", scene: "office-c", start: 30, end: 36 }),
    Object.freeze({ id: "corridor-a", scene: "corridor", start: 36, end: 42 }),
    Object.freeze({ id: "corridor-b", scene: "corridor-b", start: 42, end: 48 }),
    Object.freeze({ id: "lobby-a", scene: "lobby-a", start: 48, end: 53.333 }),
    Object.freeze({ id: "lobby-b", scene: "lobby-b", start: 53.333, end: 58.667 }),
    Object.freeze({ id: "lobby-a-repeat", scene: "lobby-a", start: 58.667, end: DEFAULT_DURATION }),
  ]);
  const BACKGROUND_TRANSITION_DURATION = 0.7;

  const COURSE_STAGES = Object.freeze([
    Object.freeze({ id: "learning", label: "초반 학습", start: 0, end: 20, intent: "첫 점프·슬라이드와 한 번의 교대 반복으로 조작을 익힌다." }),
    Object.freeze({ id: "mixed", label: "중반 혼합", start: 20, end: 48, intent: "같은 행동 2회와 행동 전환을 섞어 단순 교대 암기를 깬다." }),
    Object.freeze({ id: "finale", label: "후반 압박", start: 48, end: DEFAULT_DURATION, intent: "슬라이드 반복과 점프 반복을 짧게 교차해 마지막 변주를 만든다." }),
  ]);

  const COURSE_BEATS = Object.freeze([
    Object.freeze({ time: 5, stage: "learning", pattern: "introduce", avoid: "jump", type: "chair", label: "회전 의자", width: 76, height: 42, motion: "roll" }),
    Object.freeze({ time: 9, stage: "learning", pattern: "introduce", avoid: "slide", type: "drawer", label: "낮은 서랍", width: SLIDE_DRAWER_WIDTH, height: 36, y: 56 }),
    Object.freeze({ time: 13, stage: "learning", pattern: "reinforce", avoid: "jump", type: "cable", label: "전원 케이블", width: 122, height: 24 }),
    Object.freeze({ time: 16.7, stage: "learning", pattern: "reinforce", avoid: "slide", type: "sign", label: "낮은 안내 표지", width: 70, height: 36, y: 56, motion: "sway" }),
    Object.freeze({ time: 20, stage: "mixed", pattern: "repeat-jump", avoid: "jump", type: "papers", label: "쏟아진 서류", width: 112, height: 34, motion: "scatter" }),
    Object.freeze({ time: 23, stage: "mixed", pattern: "repeat-jump", avoid: "jump", type: "chair", label: "밀려난 의자", width: 78, height: 42, motion: "roll" }),
    Object.freeze({ time: 26.4, stage: "mixed", pattern: "repeat-slide", avoid: "slide", type: "drawer", label: "열린 급지함", width: SLIDE_DRAWER_WIDTH, height: 36, y: 56 }),
    Object.freeze({ time: 29.6, stage: "mixed", pattern: "repeat-slide", avoid: "slide", type: "sign", label: "낮은 표지판", width: 72, height: 36, y: 56, motion: "sway" }),
    Object.freeze({ time: 32.8, stage: "mixed", pattern: "switch", avoid: "jump", type: "cart", label: "서류 카트", width: 112, height: 44, motion: "rattle" }),
    Object.freeze({ time: 36.2, stage: "mixed", pattern: "switch", avoid: "slide", type: "drawer", label: "복도 서랍", width: SLIDE_DRAWER_WIDTH, height: 36, y: 56 }),
    Object.freeze({ time: 39.1, stage: "mixed", pattern: "repeat-slide", avoid: "slide", type: "sign", label: "유리 복도 표지", width: 74, height: 36, y: 56, motion: "sway" }),
    Object.freeze({ time: 42, stage: "mixed", pattern: "repeat-jump", avoid: "jump", type: "cable", label: "복합기 케이블", width: 124, height: 24 }),
    Object.freeze({ time: 44.9, stage: "mixed", pattern: "repeat-jump", avoid: "jump", type: "papers", label: "흩어진 서류", width: 114, height: 34, motion: "scatter" }),
    Object.freeze({ time: 47.8, stage: "mixed", pattern: "handoff", avoid: "slide", type: "drawer", label: "열린 캐비닛", width: SLIDE_DRAWER_WIDTH, height: 36, y: 56 }),
    Object.freeze({ time: 50.8, stage: "finale", pattern: "repeat-slide", avoid: "slide", type: "sign", label: "로비 표지", width: 74, height: 36, y: 56, motion: "sway" }),
    Object.freeze({ time: 53.8, stage: "finale", pattern: "repeat-jump", avoid: "jump", type: "cart", label: "택배 카트", width: 114, height: 44, motion: "rattle" }),
    Object.freeze({ time: 56.7, stage: "finale", pattern: "repeat-jump", avoid: "jump", type: "chair", label: "마지막 의자", width: 80, height: 42, motion: "roll" }),
    Object.freeze({ time: 59.6, stage: "finale", pattern: "finish", avoid: "slide", type: "drawer", label: "마지막 서랍", width: SLIDE_DRAWER_WIDTH, height: 36, y: 56 }),
  ]);

  const COLLECTIBLE_BEATS = Object.freeze([
    Object.freeze({ time: 15.2, type: "access-card", label: "출입카드" }),
    Object.freeze({ time: 35, type: "phone", label: "휴대폰" }),
    Object.freeze({ time: 48.8, type: "backup-usb", label: "백업 USB" }),
  ]);

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x
      && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  function gradeForHits(hitCount) { return hitCount === 0 ? "perfect" : hitCount <= 2 ? "close" : "caught"; }
  function gaitFrameIndex(elapsedSeconds, delayMs = 0) {
    return Math.floor(Math.max(0, (Number(elapsedSeconds) || 0) * 1000 - delayMs) / GAIT_FRAME_MS) % 2;
  }
  function zoneFor(progress) { return ZONES.find((zone) => progress >= zone.start && progress < zone.end) || ZONES.at(-1); }
  function courseStageFor(elapsed) {
    const seconds = clamp(Number(elapsed) || 0, 0, DEFAULT_DURATION);
    return COURSE_STAGES.find((stage) => seconds >= stage.start && seconds < stage.end) || COURSE_STAGES.at(-1);
  }
  function chasePressureFor(stageId, boost = 0) {
    const base = CHASE_PRESSURE.stageBase[stageId] ?? CHASE_PRESSURE.stageBase.learning;
    return clamp(base + Math.max(0, Number(boost) || 0), 0, CHASE_PRESSURE.maximum);
  }
  function routeSegmentFor(progress) {
    const seconds = clamp(Number(progress) || 0, 0, 1) * DEFAULT_DURATION;
    return BACKGROUND_ROUTE.find((segment) => seconds >= segment.start && seconds < segment.end) || BACKGROUND_ROUTE.at(-1);
  }
  function backgroundPresentationAt(elapsedSeconds, options = {}) {
    const elapsed = clamp(Number(elapsedSeconds) || 0, 0, DEFAULT_DURATION);
    const segmentIndex = BACKGROUND_ROUTE.findIndex((segment) => elapsed >= segment.start && elapsed < segment.end);
    const currentIndex = segmentIndex < 0 ? BACKGROUND_ROUTE.length - 1 : segmentIndex;
    const segment = BACKGROUND_ROUTE[currentIndex];
    const nextIndex = currentIndex < BACKGROUND_ROUTE.length - 1 ? currentIndex + 1 : -1;
    const nextSegment = nextIndex < 0 ? null : BACKGROUND_ROUTE[nextIndex];
    const segmentDuration = Math.max(FIXED_STEP, segment.end - segment.start);
    const segmentProgress = clamp((elapsed - segment.start) / segmentDuration, 0, 1);
    const transitionStart = Math.max(0, 1 - BACKGROUND_TRANSITION_DURATION / segmentDuration);
    const rawMix = nextSegment ? clamp((segmentProgress - transitionStart) / Math.max(FIXED_STEP, 1 - transitionStart), 0, 1) : 0;
    const mix = rawMix * rawMix * (3 - 2 * rawMix);
    return Object.freeze({
      currentIndex,
      segment,
      nextIndex,
      nextSegment,
      segmentProgress,
      mix,
      currentOpacity: 1 - mix,
      nextOpacity: mix,
      panPercent: options.reducedMotion ? 0 : -3 * segmentProgress,
    });
  }
  function distanceAt(elapsed, duration, length) {
    const p = clamp(elapsed / duration, 0, 1);
    return length * WORLD_SPEED_MULTIPLIER * (0.88 * p + 0.12 * p * p);
  }
  function speedAt(elapsed, duration, length) {
    const p = clamp(elapsed / duration, 0, 1);
    return (length / duration) * WORLD_SPEED_MULTIPLIER * (0.88 + 0.24 * p);
  }
  function playerAnchorAt(distance = 0, y = 0) {
    return {
      x: (Number(distance) || 0) + PLAYER_X_OFFSET + PLAYER_PATH_WIDTH / 2,
      y: Number(y) || 0,
    };
  }
  function screenProjection(snapshot, viewportWidth, viewportHeight) {
    const width = Math.max(1, Number(viewportWidth) || VIEW_REFERENCE_WIDTH);
    const height = Math.max(1, Number(viewportHeight) || 1);
    const scale = width / VIEW_REFERENCE_WIDTH;
    const anchor = snapshot?.playerAnchor || {
      x: (snapshot?.playerRect?.x || 0) + (snapshot?.playerRect?.width || PLAYER_WIDTH) / 2,
      y: Math.max(0, (snapshot?.playerRect?.y || 0) - PLAYER_BOTTOM_FORGIVENESS),
    };
    // Phase 4R-A translates the whole runner formation by moving this shared
    // anchor. It remains both Doyun's visual bottom-center and the mechanical
    // player center, so hazards, collision guides, and cues keep one world axis.
    const playerAnchorX = width * VIEW_PLAYER_ANCHOR_X_RATIO;
    const ground = height * VIEW_GROUND_RATIO;
    return Object.freeze({
      width,
      height,
      scale,
      ground,
      playerAnchorX,
      playerAnchorBottom: ground + anchor.y * scale,
      worldOriginX: playerAnchorX - anchor.x * scale,
    });
  }
  function projectWorldRect(rect, projection) {
    const scale = projection.scale;
    return {
      left: projection.worldOriginX + rect.x * scale,
      bottom: projection.ground + rect.y * scale,
      width: rect.width * scale,
      height: rect.height * scale,
    };
  }
  function projectWorldPoint(point, projection) {
    return {
      x: projection.worldOriginX + point.x * projection.scale,
      bottom: projection.ground + point.y * projection.scale,
    };
  }
  function actorScreenGeometry(metric, anchor, projection) {
    const alpha = metric.alphaBounds;
    const body = metric.bodyBounds;
    const foot = metric.footAnchor;
    const canvasSize = metric.canonicalOpaqueHeight / alpha.height * projection.scale;
    const alphaBottom = alpha.top + alpha.height;
    return Object.freeze({
      canvasSize,
      host: Object.freeze({
        left: anchor.x - foot.x * canvasSize,
        bottom: anchor.bottom,
        width: canvasSize,
        height: canvasSize,
      }),
      reference: Object.freeze({
        left: anchor.x + (body.left - foot.x) * canvasSize,
        bottom: anchor.bottom + (alphaBottom - body.top - body.height) * canvasSize,
        width: body.width * canvasSize,
        height: body.height * canvasSize,
      }),
      silhouette: Object.freeze({
        left: anchor.x + (alpha.left - foot.x) * canvasSize,
        bottom: anchor.bottom,
        width: alpha.width * canvasSize,
        height: alpha.height * canvasSize,
      }),
    });
  }
  function actorFormationGeometry(metrics, projection, chasePressure = CHASE_PRESSURE.stageBase.learning) {
    const doyunAnchor = Object.freeze({ x: projection.playerAnchorX, bottom: projection.playerAnchorBottom });
    const doyun = actorScreenGeometry(metrics.doyun, doyunAnchor, projection);
    const harinProbe = actorScreenGeometry(metrics.harin, { x: 0, bottom: projection.ground }, projection);
    const harinRight = doyun.silhouette.left - ACTOR_FORMATION.doyunHarinGap * projection.scale;
    const harinAnchor = Object.freeze({
      x: harinRight - harinProbe.silhouette.left - harinProbe.silhouette.width,
      bottom: projection.ground,
    });
    const harin = actorScreenGeometry(metrics.harin, harinAnchor, projection);
    const pressureRange = CHASE_PRESSURE.maximum - CHASE_PRESSURE.stageBase.learning;
    const pressureRatio = clamp((chasePressure - CHASE_PRESSURE.stageBase.learning) / pressureRange, 0, 1);
    const bossGap = ACTOR_FORMATION.bossHarinSteadyGap
      + (ACTOR_FORMATION.bossHarinMinimumGap - ACTOR_FORMATION.bossHarinSteadyGap) * pressureRatio;
    const bossProbe = actorScreenGeometry(metrics.boss, { x: 0, bottom: projection.ground }, projection);
    const bossRight = harin.silhouette.left - bossGap * projection.scale;
    const bossAnchor = Object.freeze({
      x: bossRight - bossProbe.silhouette.left - bossProbe.silhouette.width,
      bottom: projection.ground,
    });
    return Object.freeze({
      anchors: Object.freeze({ doyun: doyunAnchor, harin: harinAnchor, boss: bossAnchor }),
      actors: Object.freeze({
        doyun,
        harin,
        boss: actorScreenGeometry(metrics.boss, bossAnchor, projection),
      }),
      gaps: Object.freeze({ doyunHarin: ACTOR_FORMATION.doyunHarinGap, bossHarin: bossGap }),
    });
  }
  function debugGeometry(snapshot, metrics, viewportWidth, viewportHeight) {
    const projection = screenProjection(snapshot, viewportWidth, viewportHeight);
    const formation = actorFormationGeometry(metrics, projection, snapshot?.chasePressure);
    const doyunRight = formation.actors.doyun.silhouette.left + formation.actors.doyun.silhouette.width;
    const forwardView = projection.width - doyunRight;
    return Object.freeze({
      anchorRatio: VIEW_PLAYER_ANCHOR_X_RATIO,
      projection,
      formation,
      forwardView,
      forwardViewRatio: forwardView / projection.width,
      canonicalOpaqueHeights: Object.freeze({
        doyun: metrics.doyun.canonicalOpaqueHeight,
        harin: metrics.harin.canonicalOpaqueHeight,
        boss: metrics.boss.canonicalOpaqueHeight,
      }),
      playerProfiles: PLAYER_PROFILES,
    });
  }
  function isTutorialHazard(object) { return object?.id === "hazard-01" || object?.id === "hazard-02"; }
  function prepareLeadFor(elapsed, object) {
    if (isTutorialHazard(object)) return TUTORIAL_PREPARE_LEAD_TIME;
    return elapsed < 24 ? 1.35 : elapsed < 48 ? 1.15 : 1;
  }
  function actionLeadFor(avoid) { return ACTION_LEAD_TIME[avoid] || ACTION_LEAD_TIME.jump; }
  function cuePhaseFor(object, leadTime) {
    if (leadTime <= actionLeadFor(object.avoid)) return "act";
    return "prepare";
  }

  function buildCourse(duration, length, customCourse) {
    if (Array.isArray(customCourse)) return customCourse.map((entry) => ({ ...entry }));
    const hazard = COURSE_BEATS.map((beat, index) => ({
      id: `hazard-${String(index + 1).padStart(2, "0")}`,
      kind: "hazard",
      ...beat,
      width: beat.width * PRODUCTION_HAZARD_SCALE,
      height: beat.height * PRODUCTION_HAZARD_SCALE,
      y: (beat.y || 0) * PRODUCTION_HAZARD_SCALE,
      x: distanceAt(beat.time / DEFAULT_DURATION * duration, duration, length) + PLAYER_X_OFFSET + PLAYER_PATH_WIDTH,
    }));
    const items = COLLECTIBLE_BEATS.map((beat, index) => ({
      id: `item-${beat.type}`,
      kind: "item",
      width: 38,
      height: 38,
      y: 112,
      ...beat,
      x: distanceAt(beat.time / DEFAULT_DURATION * duration, duration, length) + PLAYER_X_OFFSET + PLAYER_PATH_WIDTH + 28,
    }));
    return [...hazard, ...items].sort((a, b) => a.x - b.x);
  }

  function create(options = {}) {
    const duration = clamp(Number(options.duration) || DEFAULT_DURATION, 8, 180);
    const length = Math.max(1800, Number(options.length) || DEFAULT_LENGTH);
    const course = buildCourse(duration, length, options.course);
    const resolved = new Set();
    const collected = new Set();
    const warned = new Set();
    const events = [];
    let jumpBuffer = 0;
    let slideUntil = 0;
    let slideCooldownUntil = 0;
    let accumulator = 0;
    const state = {
      elapsed: 0,
      distance: 0,
      y: 0,
      velocityY: 0,
      hitCount: 0,
      combo: 0,
      maxCombo: 0,
      invulnerable: 0,
      assistAvailable: options.assist !== false,
      assistUsed: false,
      chasePressureBoost: 0,
      finished: false,
    };

    function emit(type, detail = {}) { events.push({ type, ...detail }); }
    function isGrounded() { return state.y <= 0.001; }
    function isSliding() { return isGrounded() && state.elapsed < slideUntil; }
    function playerRect(y = state.y, sliding = isSliding()) {
      const profile = sliding ? PLAYER_PROFILES.slide : PLAYER_PROFILES.run;
      const anchor = playerAnchorAt(state.distance, y);
      return {
        x: anchor.x - profile.width / 2,
        y: y + PLAYER_BOTTOM_FORGIVENESS,
        width: profile.width,
        height: profile.height,
      };
    }
    function objectRects(object) {
      const logicalRect = { x: object.x, y: object.y || 0, width: object.width, height: object.height };
      if (object.kind === "item") {
        return { logicalRect, visibleRect: logicalRect, artRect: logicalRect, collisionRect: { ...logicalRect } };
      }
      const framing = PROP_ART_FRAMING[object.type];
      const artSize = framing ? logicalRect.width / framing.alphaWidth : Math.max(logicalRect.width, logicalRect.height);
      const visibleHeight = framing ? artSize * framing.alphaHeight : logicalRect.height;
      const edgeInset = Math.min(HAZARD_EDGE_ALIGNMENT, logicalRect.width / 2, visibleHeight / 2);
      const visibleY = object.avoid === "slide"
        ? PLAYER_BOTTOM_FORGIVENESS + SLIDE_HAZARD_REFERENCE_HEIGHT + SLIDE_CLEARANCE - edgeInset
        : logicalRect.y;
      const visibleRect = framing ? {
        x: logicalRect.x,
        y: visibleY,
        width: logicalRect.width,
        height: visibleHeight,
      } : { ...logicalRect, y: visibleY };
      const artRect = framing ? {
        x: visibleRect.x - (artSize - visibleRect.width) / 2,
        y: visibleRect.y - artSize * framing.bottomPadding,
        width: artSize,
        height: artSize,
      } : logicalRect;
      const collisionBottomInset = object.avoid === "slide" ? edgeInset : 0;
      const collisionTopInset = edgeInset;
      return {
        logicalRect,
        visibleRect,
        artRect,
        collisionRect: {
          x: visibleRect.x + edgeInset,
          y: visibleRect.y + collisionBottomInset,
          width: visibleRect.width - edgeInset * 2,
          height: visibleRect.height - collisionBottomInset - collisionTopInset,
        },
      };
    }
    function collisionCueMetrics(object, speed = speedAt(state.elapsed, duration, length)) {
      const { collisionRect } = objectRects(object);
      const player = playerRect(state.y, false);
      const entryGap = collisionRect.x - (player.x + player.width);
      const exitGap = collisionRect.x + collisionRect.width - player.x;
      return {
        entryGap,
        exitGap,
        leadTime: Math.max(0, entryGap) / Math.max(1, speed),
        clearLeadTime: Math.max(0, exitGap) / Math.max(1, speed),
      };
    }
    function activateSlide() {
      if (!isGrounded() || isSliding() || state.elapsed < slideCooldownUntil) return false;
      slideUntil = state.elapsed + SLIDE_DURATION;
      emit("slide");
      return true;
    }
    function pressJump() {
      jumpBuffer = JUMP_BUFFER;
    }
    function releaseJump() { /* compatibility: fixed jump ignores release duration. */ }
    function commitJump() { pressJump(); }
    function cancelJump() { jumpBuffer = 0; }
    function setSlide(active) { if (active) commitSlide(); }
    function commitSlide() {
      activateSlide();
    }
    function cancelSlide() { /* fixed slide completes its committed duration. */ }
    function applyHazard(object) {
      resolved.add(object.id);
      if (state.invulnerable > 0) return;
      if (state.assistAvailable) {
        state.assistAvailable = false;
        state.assistUsed = true;
        state.chasePressureBoost = Math.min(CHASE_PRESSURE.maximum, state.chasePressureBoost + CHASE_PRESSURE.assistBoost);
        emit("assist", { object });
        return;
      }
      state.hitCount += 1;
      state.combo = 0;
      state.invulnerable = INVULNERABLE_TIME;
      state.chasePressureBoost = Math.min(CHASE_PRESSURE.maximum, state.chasePressureBoost + CHASE_PRESSURE.hitBoost);
      emit("hit", { object, hitCount: state.hitCount });
    }
    function resolveObject(object, previousPlayer, currentPlayer) {
      if (resolved.has(object.id)) return;
      const { collisionRect } = objectRects(object);
      // The runner moves horizontally through a stationary world. Sweep only
      // along X so the prior grounded pose cannot falsely collide during a
      // jump's first upward step; Y always reflects the current pose.
      const crossedEntry = previousPlayer.x + previousPlayer.width <= collisionRect.x
        && currentPlayer.x + currentPlayer.width >= collisionRect.x;
      const verticalOverlap = currentPlayer.y < collisionRect.y + collisionRect.height
        && currentPlayer.y + currentPlayer.height > collisionRect.y;
      if (overlaps(currentPlayer, collisionRect) || (crossedEntry && verticalOverlap)) {
        if (object.kind === "item") {
          resolved.add(object.id);
          collected.add(object.type);
          state.combo += 1;
          state.maxCombo = Math.max(state.maxCombo, state.combo);
          emit("collect", { object });
        } else {
          applyHazard(object);
        }
        return;
      }
      if (collisionRect.x + collisionRect.width < currentPlayer.x) {
        resolved.add(object.id);
        if (object.kind === "hazard") emit("avoid", { object });
      }
    }
    function simulate(dt) {
      if (state.finished) return;
      const previousElapsed = state.elapsed;
      const previousPlayer = playerRect();
      const wasSliding = isSliding();
      state.elapsed = Math.min(duration, state.elapsed + dt);
      state.invulnerable = Math.max(0, state.invulnerable - dt);
      state.chasePressureBoost = Math.max(0, state.chasePressureBoost - CHASE_PRESSURE.recoveryPerSecond * dt);
      jumpBuffer = Math.max(0, jumpBuffer - dt);
      if (wasSliding && !isSliding()) {
        slideCooldownUntil = Math.max(slideCooldownUntil, state.elapsed + SLIDE_RECOVERY);
      }
      if (jumpBuffer > 0 && isGrounded() && !isSliding()) {
        state.velocityY = JUMP_VELOCITY;
        state.y = 0.001;
        jumpBuffer = 0;
        emit("jump");
      }
      state.velocityY -= GRAVITY * dt;
      state.y += state.velocityY * dt;
      if (state.y <= 0) {
        state.y = 0;
        state.velocityY = 0;
      }
      state.distance = distanceAt(state.elapsed, duration, length);
      const currentPlayer = playerRect();
      const speed = speedAt(state.elapsed, duration, length);
      for (const object of course) {
        if (object.kind !== "hazard" || resolved.has(object.id) || warned.has(object.id)) continue;
        const metrics = collisionCueMetrics(object, speed);
        if (metrics.exitGap < 0 || metrics.leadTime > prepareLeadFor(previousElapsed, object)) continue;
        warned.add(object.id);
        emit("telegraph", { object, leadTime: metrics.leadTime });
      }
      for (const object of course) resolveObject(object, previousPlayer, currentPlayer);
      if (state.elapsed >= duration || state.distance >= length * WORLD_SPEED_MULTIPLIER) finish();
    }
    function step(seconds) {
      if (state.finished) return snapshot();
      accumulator += clamp(Number(seconds) || 0, 0, 0.2);
      while (accumulator >= FIXED_STEP && !state.finished) {
        simulate(FIXED_STEP);
        accumulator -= FIXED_STEP;
      }
      return snapshot();
    }
    function upcomingHazard() {
      const speed = speedAt(state.elapsed, duration, length);
      for (const object of course) {
        if (object.kind !== "hazard" || resolved.has(object.id)) continue;
        const metrics = collisionCueMetrics(object, speed);
        if (metrics.exitGap < 0) continue;
        const prepareLeadTime = prepareLeadFor(state.elapsed, object);
        if (metrics.leadTime > prepareLeadTime) return null;
        const telegraphPhase = cuePhaseFor(object, metrics.leadTime);
        return {
          ...object,
          gap: object.x - state.distance,
          collisionGap: metrics.entryGap,
          leadTime: metrics.leadTime,
          clearLeadTime: metrics.clearLeadTime,
          prepareLeadTime,
          actionLeadTime: actionLeadFor(object.avoid),
          telegraphPhase,
        };
      }
      return null;
    }
    function result() {
      const grade = gradeForHits(state.hitCount);
      return {
        grade,
        caught: grade === "caught",
        elapsed: Math.round(state.elapsed * 10) / 10,
        hitCount: state.hitCount,
        collectedItems: [...collected],
        maxCombo: state.maxCombo,
      };
    }
    function finish() {
      if (state.finished) return;
      state.finished = true;
      emit("finish", result());
    }
    function drainEvents() { return events.splice(0, events.length); }
    function snapshot() {
      const progress = clamp(state.elapsed / duration, 0, 1);
      const courseStage = courseStageFor(progress * DEFAULT_DURATION);
      const chasePressure = chasePressureFor(courseStage.id, state.chasePressureBoost);
      return {
        ...state,
        progress,
        distanceProgress: clamp(state.distance / (length * WORLD_SPEED_MULTIPLIER), 0, 1),
        duration,
        length,
        zone: zoneFor(progress),
        courseStage,
        chasePressure,
        chaseState: state.chasePressureBoost > 0.08 ? "closing" : state.chasePressureBoost > 0.001 ? "recovering" : "steady",
        backgroundSegment: routeSegmentFor(progress),
        sliding: isSliding(),
        jumpHeld: jumpBuffer > 0,
        course,
        collectedItems: [...collected],
        playerAnchor: playerAnchorAt(state.distance, state.y),
        playerRect: playerRect(),
        activeObjects: course.filter((object) => !resolved.has(object.id)).map((object) => ({ ...object, ...objectRects(object) })),
        upcomingHazard: upcomingHazard(),
      };
    }
    return Object.freeze({ pressJump, releaseJump, commitJump, cancelJump, setSlide, cancelSlide, commitSlide, step, snapshot, drainEvents, result });
  }

  const COURSE = Object.freeze(buildCourse(DEFAULT_DURATION, DEFAULT_LENGTH));
  return Object.freeze({
    create, gradeForHits, gaitFrameIndex, zoneFor, courseStageFor, chasePressureFor, routeSegmentFor, backgroundPresentationAt, distanceAt, speedAt,
    playerAnchorAt, screenProjection, projectWorldRect, projectWorldPoint, actorScreenGeometry, actorFormationGeometry, debugGeometry,
    COURSE, ZONES, COURSE_STAGES, BACKGROUND_ROUTE, DEFAULT_DURATION, DEFAULT_LENGTH, WORLD_SPEED_MULTIPLIER, PRODUCTION_HAZARD_SCALE, FIXED_STEP,
    PLAYER_X_OFFSET, PLAYER_PATH_WIDTH, PLAYER_BOTTOM_FORGIVENESS, PLAYER_WIDTH, STANDING_HEIGHT, SLIDING_WIDTH, SLIDING_HEIGHT, PLAYER_PROFILES,
    GRAVITY, JUMP_VELOCITY, JUMP_BUFFER, SLIDE_DURATION, SLIDE_RECOVERY,
    INVULNERABLE_TIME, GAIT_FRAME_MS, GAIT_PHASE_DELAY_MS, COLLISION_INSET, PROP_ART_FRAMING, BACKGROUND_TRANSITION_DURATION,
    ACTION_LEAD_TIME, TUTORIAL_PREPARE_LEAD_TIME, MIN_HAZARD_GAP_SECONDS, CHASE_PRESSURE,
    VIEW_REFERENCE_WIDTH, VIEW_PLAYER_ANCHOR_X_RATIO, VIEW_GROUND_RATIO,
    ACTOR_FORMATION, HAZARD_EDGE_ALIGNMENT, SLIDE_CLEARANCE, SLIDE_HAZARD_REFERENCE_HEIGHT, SLIDE_DRAWER_WIDTH,
  });
});
