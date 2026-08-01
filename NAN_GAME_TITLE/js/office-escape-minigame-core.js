(function exposeOfficeEscapeCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OfficeEscapeMinigameCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOfficeEscapeCoreApi() {
  "use strict";

  const DEFAULT_DURATION = 64;
  const DEFAULT_LENGTH = 16000;
  const PLAYER_X_OFFSET = 8;
  const PLAYER_WIDTH = 48;
  const STANDING_HEIGHT = 92;
  const SLIDING_WIDTH = 84;
  const SLIDING_HEIGHT = 46;
  const GRAVITY = 1800;
  const JUMP_VELOCITY = 760;
  // Releasing early deliberately cuts upward momentum hard enough to make
  // tap and hold jumps legible at the game's logical scale.
  const JUMP_RELEASE_FACTOR = 0.78;
  const JUMP_BUFFER = 0.15;
  const COYOTE_TIME = 0.12;
  const SLIDE_MIN_DURATION = 0.08;
  const INVULNERABLE_TIME = 0.8;
  const TELEGRAPH_DISTANCE = 270;
  const MIN_PREPARE_LEAD_TIME = 1.25;
  const ACTION_LEAD_TIME = Object.freeze({ jump: 0.26, slide: 0.75 });
  const JUMP_QUEUE_LEAD_TIME = 0.55;
  const GAIT_FRAME_MS = 500;
  const GAIT_PHASE_DELAY_MS = Object.freeze({ doyun: 0, harin: 150, boss: 300 });

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

  function framedHeight(type, width, fallback) {
    const frame = PROP_ART_FRAMING[type];
    return frame ? Math.round(width * frame.alphaHeight / frame.alphaWidth) : fallback;
  }

  const COURSE = Object.freeze([
    { id: "chair-tutorial", kind: "hazard", type: "chair", avoid: "jump", motion: "roll", x: 800, width: 72, height: framedHeight("chair", 72, 42), label: "회전 의자" },
    { id: "drawer-tutorial", kind: "hazard", type: "drawer", avoid: "slide", x: 1700, y: 58, width: 126, height: framedHeight("drawer", 126, 40), label: "열린 서랍" },
    { id: "card", kind: "item", type: "access-card", x: 2150, y: 118, width: 34, height: 34, label: "출입카드" },
    { id: "cable-tutorial", kind: "hazard", type: "cable", avoid: "jump", x: 2700, width: 116, height: framedHeight("cable", 116, 24), label: "전원 케이블" },
    { id: "chair-pair-a", kind: "hazard", type: "chair", avoid: "jump", motion: "roll", x: 3900, width: 70, height: framedHeight("chair", 70, 42), label: "회전 의자" },
    { id: "drawer-pair-b", kind: "hazard", type: "drawer", avoid: "slide", x: 4300, y: 58, width: 126, height: framedHeight("drawer", 126, 40), label: "열린 서랍" },
    { id: "paper-stack", kind: "hazard", type: "papers", avoid: "jump", motion: "scatter", x: 5100, width: 110, height: framedHeight("papers", 110, 32), label: "쏟아진 서류" },
    { id: "phone", kind: "item", type: "phone", x: 5790, y: 114, width: 34, height: 40, label: "휴대폰" },
    { id: "printer-tray", kind: "hazard", type: "drawer", avoid: "slide", x: 6560, y: 58, width: 142, height: framedHeight("drawer", 142, 40), label: "열린 급지함" },
    { id: "cart", kind: "hazard", type: "cart", avoid: "jump", motion: "rattle", x: 7580, width: 110, height: framedHeight("cart", 110, 48), label: "서류 카트" },
    { id: "cable-drawer-a", kind: "hazard", type: "cable", avoid: "jump", x: 8510, width: 118, height: framedHeight("cable", 118, 24), label: "복합기 케이블" },
    { id: "cable-drawer-b", kind: "hazard", type: "drawer", avoid: "slide", x: 8970, y: 58, width: 134, height: framedHeight("drawer", 134, 40), label: "열린 서랍" },
    { id: "usb", kind: "item", type: "backup-usb", x: 9460, y: 124, width: 38, height: 30, label: "백업 USB" },
    { id: "paper-wave-a", kind: "hazard", type: "papers", avoid: "jump", motion: "scatter", x: 10170, width: 112, height: framedHeight("papers", 112, 30), label: "미끄러운 서류" },
    { id: "corridor-sign-switch", kind: "hazard", type: "sign", avoid: "slide", motion: "sway", x: 10640, y: 58, width: 124, height: framedHeight("sign", 124, 52), label: "흔들리는 안내 표지" },
    { id: "lobby-sign", kind: "hazard", type: "sign", avoid: "slide", motion: "sway", x: 11420, y: 58, width: 128, height: framedHeight("sign", 128, 52), label: "낮은 안내 표지" },
    { id: "lobby-cart", kind: "hazard", type: "cart", avoid: "jump", motion: "rattle", x: 12420, width: 110, height: framedHeight("cart", 110, 48), label: "택배 카트" },
    { id: "final-drawer", kind: "hazard", type: "drawer", avoid: "slide", x: 13370, y: 58, width: 142, height: framedHeight("drawer", 142, 40), label: "마지막 서랍" },
    { id: "final-chair", kind: "hazard", type: "chair", avoid: "jump", motion: "roll", x: 14320, width: 76, height: framedHeight("chair", 76, 44), label: "마지막 의자" },
  ]);

  const ZONES = Object.freeze([
    { id: "office", label: "사무실", start: 0, end: 0.34, speedMultiplier: 0.95, pace: "탈출 시작" },
    { id: "corridor", label: "복합기 복도", start: 0.34, end: 0.68, speedMultiplier: 1.06, pace: "교차 함정" },
    { id: "elevator", label: "엘리베이터", start: 0.68, end: 1, speedMultiplier: 1.15, pace: "마지막 질주" },
  ]);

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x
      && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function gradeForHits(hitCount) {
    if (hitCount === 0) return "perfect";
    if (hitCount <= 2) return "close";
    return "caught";
  }

  function gaitFrameIndex(elapsedSeconds, delayMs = 0) {
    const elapsedMs = Math.max(0, (Number(elapsedSeconds) || 0) * 1000 - (Number(delayMs) || 0));
    return Math.floor(elapsedMs / GAIT_FRAME_MS) % 2;
  }

  function zoneFor(progress) {
    return ZONES.find((zone) => progress >= zone.start && progress < zone.end) || ZONES.at(-1);
  }

  function create(options = {}) {
    const duration = clamp(Number(options.duration) || DEFAULT_DURATION, 8, 180);
    const length = Math.max(1800, Number(options.length) || DEFAULT_LENGTH);
    const hasCustomCourse = Array.isArray(options.course);
    const courseScale = hasCustomCourse ? 1 : length / DEFAULT_LENGTH;
    const course = (hasCustomCourse ? options.course : COURSE).map((entry) => ({
      ...entry,
      x: entry.x * courseScale,
    }));
    const resolved = new Set();
    const collected = new Set();
    const warned = new Set();
    const events = [];
    const groundHeightAt = typeof options.groundHeightAt === "function"
      ? options.groundHeightAt
      : () => 0;
    let jumpHeld = false;
    let jumpMinUntil = 0;
    let slideHeld = false;
    let slideMinUntil = 0;
    let jumpBuffer = 0;
    let coyote = COYOTE_TIME;

    const state = {
      elapsed: 0,
      distance: 0,
      y: 0,
      velocityY: 0,
      hitCount: 0,
      combo: 0,
      maxCombo: 0,
      invulnerable: 0,
      slowTimer: 0,
      groundY: Number(groundHeightAt(0, length)) || 0,
      assistAvailable: options.assist !== false,
      assistUsed: false,
      finished: false,
    };

    function emit(type, detail = {}) {
      events.push({ type, ...detail });
    }

    function pressJump() {
      jumpHeld = true;
      jumpBuffer = JUMP_BUFFER;
    }

    function releaseJump() {
      jumpHeld = false;
      if (state.elapsed >= jumpMinUntil && state.velocityY > 260) state.velocityY *= JUMP_RELEASE_FACTOR;
    }

    function commitJump(seconds = 0.42) {
      const duration = clamp(Number(seconds) || 0.42, JUMP_BUFFER, 2.5);
      jumpMinUntil = Math.max(jumpMinUntil, state.elapsed + duration);
      pressJump();
    }

    function cancelJump() {
      jumpHeld = false;
      jumpMinUntil = state.elapsed;
      jumpBuffer = 0;
      if (state.velocityY > 260) state.velocityY *= JUMP_RELEASE_FACTOR;
    }

    function isJumpHeld() {
      return jumpHeld || state.elapsed < jumpMinUntil;
    }

    function setSlide(active) {
      const next = Boolean(active);
      if (next && !slideHeld) {
        slideMinUntil = Math.max(slideMinUntil, state.elapsed + SLIDE_MIN_DURATION);
      }
      slideHeld = next;
    }

    function cancelSlide() {
      slideHeld = false;
      slideMinUntil = state.elapsed;
    }

    function commitSlide(seconds = SLIDE_MIN_DURATION) {
      const duration = clamp(Number(seconds) || SLIDE_MIN_DURATION, SLIDE_MIN_DURATION, 2.5);
      slideMinUntil = Math.max(slideMinUntil, state.elapsed + duration);
    }

    function isSliding() {
      return state.y <= state.groundY + 1
        && (slideHeld || state.elapsed < slideMinUntil);
    }

    function playerRect() {
      const sliding = isSliding();
      return {
        x: state.distance + PLAYER_X_OFFSET,
        y: state.y,
        width: sliding ? SLIDING_WIDTH : PLAYER_WIDTH,
        height: sliding ? SLIDING_HEIGHT : STANDING_HEIGHT,
      };
    }

    function objectRects(object) {
      const logicalRect = {
        x: object.x,
        y: object.y || 0,
        width: object.width,
        height: object.height,
      };
      // Course dimensions already represent the cropped visible-alpha bounds
      // of prop art (see PROP_ART_FRAMING), making these renderer-agnostic.
      const visibleRect = { ...logicalRect };
      const collisionInset = object.kind === "hazard" ? 0.09 : 0;
      const collisionRect = {
        x: visibleRect.x + visibleRect.width * collisionInset,
        y: visibleRect.y + visibleRect.height * collisionInset,
        width: visibleRect.width * (1 - collisionInset * 2),
        height: visibleRect.height * (1 - collisionInset * 2),
      };
      return { logicalRect, visibleRect, collisionRect };
    }

    function collisionCueMetrics(object, speed) {
      const { collisionRect } = objectRects(object);
      // Cue timing always uses the fixed standing body. Using the live sliding
      // width would make the warning jump when the player presses slide.
      const cuePlayerLeft = state.distance + PLAYER_X_OFFSET;
      const cuePlayerRight = cuePlayerLeft + PLAYER_WIDTH;
      const entryGap = collisionRect.x - cuePlayerRight;
      const exitGap = collisionRect.x + collisionRect.width - cuePlayerLeft;
      const safeSpeed = Math.max(1, speed);
      return {
        entryGap,
        exitGap,
        leadTime: Math.max(0, entryGap) / safeSpeed,
        clearLeadTime: Math.max(SLIDE_MIN_DURATION, Math.max(0, exitGap) / safeSpeed),
      };
    }

    function finish() {
      if (state.finished) return;
      state.finished = true;
      emit("finish", result());
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

    function nominalSpeedFor(progress) {
      const zone = zoneFor(progress);
      return (225 + 42 * progress) * zone.speedMultiplier;
    }

    function speedFor(progress) {
      return nominalSpeedFor(progress) * (state.slowTimer > 0 ? 0.72 : 1);
    }

    function telegraphDistanceFor(speed) {
      return Math.max(TELEGRAPH_DISTANCE, speed * MIN_PREPARE_LEAD_TIME);
    }

    function step(seconds) {
      if (state.finished) return snapshot();
      const dt = clamp(Number(seconds) || 0, 0, 0.05);
      if (dt === 0) return snapshot();

      state.elapsed += dt;
      state.invulnerable = Math.max(0, state.invulnerable - dt);
      state.slowTimer = Math.max(0, state.slowTimer - dt);
      jumpBuffer = Math.max(0, jumpBuffer - dt);

      const grounded = state.y <= state.groundY + 0.001;
      coyote = grounded ? COYOTE_TIME : Math.max(0, coyote - dt);
      if (jumpBuffer > 0 && coyote > 0 && !isSliding()) {
        state.velocityY = JUMP_VELOCITY;
        state.y = Math.max(state.y, state.groundY + 0.1);
        jumpBuffer = 0;
        coyote = 0;
        emit("jump");
      }

      const gravityScale = isJumpHeld() && state.velocityY > 0 ? 0.82 : 1;
      state.velocityY -= GRAVITY * gravityScale * dt;
      state.y += state.velocityY * dt;
      if (state.y <= state.groundY) {
        state.y = state.groundY;
        state.velocityY = 0;
      }

      const progressBefore = clamp(state.distance / length, 0, 1);
      const speed = speedFor(progressBefore);
      state.distance = Math.min(length, state.distance + speed * dt);
      state.groundY = Number(groundHeightAt(state.distance, length)) || 0;

      const player = playerRect();
      const nominalSpeed = nominalSpeedFor(progressBefore);
      const telegraphDistance = telegraphDistanceFor(nominalSpeed);
      let warning = null;
      for (const object of course) {
        if (object.kind !== "hazard" || resolved.has(object.id) || warned.has(object.id)) continue;
        const metrics = collisionCueMetrics(object, nominalSpeed);
        if (metrics.exitGap < 0 || metrics.entryGap > telegraphDistance) continue;
        warning = object;
        break;
      }
      if (warning) {
        warned.add(warning.id);
        emit("telegraph", {
          object: warning,
          leadTime: collisionCueMetrics(warning, speed).leadTime,
        });
      }
      for (const object of course) {
        if (resolved.has(object.id)) continue;
        const { collisionRect: objectRect } = objectRects(object);
        if (object.kind === "hazard" && objectRect.x + objectRect.width < player.x) {
          resolved.add(object.id);
          emit("avoid", { object });
          continue;
        }
        if (object.x + object.width < state.distance - 100) {
          resolved.add(object.id);
          continue;
        }
        if (!overlaps(player, objectRect)) continue;

        resolved.add(object.id);
        if (object.kind === "item") {
          collected.add(object.type);
          state.combo += 1;
          state.maxCombo = Math.max(state.maxCombo, state.combo);
          emit("collect", { object });
          continue;
        }
        if (state.invulnerable > 0) continue;
        if (state.assistAvailable) {
          state.assistAvailable = false;
          state.assistUsed = true;
          emit("assist", { object });
          continue;
        }
        state.hitCount += 1;
        state.combo = 0;
        state.invulnerable = INVULNERABLE_TIME;
        state.slowTimer = 0.7;
        emit("hit", { object, hitCount: state.hitCount });
      }

      if (state.elapsed >= duration || state.distance >= length) finish();
      return snapshot();
    }

    function upcomingHazard() {
      const progress = clamp(state.distance / length, 0, 1);
      const speed = Math.max(1, speedFor(progress));
      const telegraphDistance = telegraphDistanceFor(nominalSpeedFor(progress));
      let object = null;
      let metrics = null;
      for (const entry of course) {
        if (entry.kind !== "hazard" || resolved.has(entry.id)) continue;
        const candidateMetrics = collisionCueMetrics(entry, speed);
        if (candidateMetrics.exitGap < 0 || candidateMetrics.entryGap > telegraphDistance) continue;
        object = entry;
        metrics = candidateMetrics;
        break;
      }
      if (!object) return null;
      const gap = object.x - state.distance;
      const leadTime = metrics.leadTime;
      return {
        ...object,
        gap,
        collisionGap: metrics.entryGap,
        leadTime,
        clearLeadTime: metrics.clearLeadTime,
        telegraphPhase: leadTime <= ACTION_LEAD_TIME[object.avoid] ? "act" : "prepare",
        jumpQueueReady: object.avoid === "jump" && leadTime <= JUMP_QUEUE_LEAD_TIME,
      };
    }

    function drainEvents() {
      return events.splice(0, events.length);
    }

    function snapshot() {
      const distanceProgress = clamp(state.distance / length, 0, 1);
      const progress = clamp(Math.max(state.elapsed / duration, distanceProgress), 0, 1);
      const activeObjects = course.filter((object) => !resolved.has(object.id)).map((object) => ({
        ...object,
        ...objectRects(object),
      }));
      return {
        ...state,
        progress,
        distanceProgress,
        zone: zoneFor(distanceProgress),
        sliding: isSliding(),
        jumpHeld: isJumpHeld(),
        duration,
        length,
        course,
        resolved,
        collectedItems: [...collected],
        upcomingHazard: upcomingHazard(),
        playerRect: playerRect(),
        activeObjects,
      };
    }

    return Object.freeze({
      pressJump,
      releaseJump,
      commitJump,
      cancelJump,
      setSlide,
      cancelSlide,
      commitSlide,
      step,
      snapshot,
      drainEvents,
      result,
    });
  }

  return Object.freeze({
    create,
    gradeForHits,
    gaitFrameIndex,
    zoneFor,
    COURSE,
    ZONES,
    DEFAULT_DURATION,
    DEFAULT_LENGTH,
    GRAVITY,
    JUMP_VELOCITY,
    JUMP_RELEASE_FACTOR,
    JUMP_BUFFER,
    COYOTE_TIME,
    INVULNERABLE_TIME,
    TELEGRAPH_DISTANCE,
    MIN_PREPARE_LEAD_TIME,
    JUMP_QUEUE_LEAD_TIME,
    GAIT_FRAME_MS,
    GAIT_PHASE_DELAY_MS,
    PROP_ART_FRAMING,
  });
});
