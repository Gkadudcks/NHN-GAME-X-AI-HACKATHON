(function exposeOfficeEscapeCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OfficeEscapeMinigameCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createOfficeEscapeCoreApi() {
  "use strict";

  const DEFAULT_DURATION = 64;
  const DEFAULT_LENGTH = 16000;
  const PLAYER_WIDTH = 48;
  const STANDING_HEIGHT = 92;
  const SLIDING_WIDTH = 84;
  const SLIDING_HEIGHT = 46;
  const GRAVITY = 1900;
  const JUMP_VELOCITY = 760;
  // Releasing early deliberately cuts upward momentum hard enough to make
  // tap and hold jumps legible at the game's logical scale.
  const JUMP_RELEASE_FACTOR = 0.78;
  const JUMP_BUFFER = 0.15;
  const COYOTE_TIME = 0.12;
  const INVULNERABLE_TIME = 0.8;
  const TELEGRAPH_DISTANCE = 270;

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
    { id: "chair-tutorial", kind: "hazard", type: "chair", avoid: "jump", x: 1180, width: 72, height: framedHeight("chair", 72, 42), label: "회전 의자" },
    { id: "drawer-tutorial", kind: "hazard", type: "drawer", avoid: "slide", x: 2240, y: 58, width: 126, height: framedHeight("drawer", 126, 40), label: "열린 서랍" },
    { id: "card", kind: "item", type: "access-card", x: 2820, y: 118, width: 34, height: 34, label: "출입카드" },
    { id: "cable-tutorial", kind: "hazard", type: "cable", avoid: "jump", x: 3380, width: 116, height: framedHeight("cable", 116, 24), label: "전원 케이블" },
    { id: "chair-pair-a", kind: "hazard", type: "chair", avoid: "jump", x: 4440, width: 70, height: framedHeight("chair", 70, 42), label: "회전 의자" },
    { id: "chair-pair-b", kind: "hazard", type: "chair", avoid: "jump", x: 4670, width: 70, height: framedHeight("chair", 70, 42), label: "회전 의자" },
    { id: "paper-stack", kind: "hazard", type: "papers", avoid: "jump", x: 5500, width: 110, height: framedHeight("papers", 110, 32), label: "쏟아진 서류" },
    { id: "phone", kind: "item", type: "phone", x: 6050, y: 114, width: 34, height: 40, label: "휴대폰" },
    { id: "printer-tray", kind: "hazard", type: "drawer", avoid: "slide", x: 6680, y: 58, width: 142, height: framedHeight("drawer", 142, 40), label: "열린 급지함" },
    { id: "cart", kind: "hazard", type: "cart", avoid: "jump", x: 7580, width: 110, height: framedHeight("cart", 110, 48), label: "서류 카트" },
    { id: "cable-drawer-a", kind: "hazard", type: "cable", avoid: "jump", x: 8510, width: 118, height: framedHeight("cable", 118, 24), label: "복합기 케이블" },
    { id: "cable-drawer-b", kind: "hazard", type: "drawer", avoid: "slide", x: 8870, y: 58, width: 134, height: framedHeight("drawer", 134, 40), label: "열린 서랍" },
    { id: "usb", kind: "item", type: "backup-usb", x: 9460, y: 124, width: 38, height: 30, label: "백업 USB" },
    { id: "paper-wave-a", kind: "hazard", type: "papers", avoid: "jump", x: 10170, width: 112, height: framedHeight("papers", 112, 30), label: "미끄러운 서류" },
    { id: "paper-wave-b", kind: "hazard", type: "papers", avoid: "jump", x: 10520, width: 112, height: framedHeight("papers", 112, 30), label: "미끄러운 서류" },
    { id: "lobby-sign", kind: "hazard", type: "sign", avoid: "slide", x: 11420, y: 58, width: 128, height: framedHeight("sign", 128, 52), label: "낮은 안내 표지" },
    { id: "lobby-cart", kind: "hazard", type: "cart", avoid: "jump", x: 12420, width: 110, height: framedHeight("cart", 110, 48), label: "택배 카트" },
    { id: "final-drawer", kind: "hazard", type: "drawer", avoid: "slide", x: 13370, y: 58, width: 142, height: framedHeight("drawer", 142, 40), label: "마지막 서랍" },
    { id: "final-chair", kind: "hazard", type: "chair", avoid: "jump", x: 14320, width: 76, height: framedHeight("chair", 76, 44), label: "마지막 의자" },
  ]);

  const ZONES = Object.freeze([
    { id: "office", label: "사무실", start: 0, end: 0.34, speedMultiplier: 0.92, pace: "연습" },
    { id: "corridor", label: "복합기 복도", start: 0.34, end: 0.68, speedMultiplier: 1, pace: "연속 함정" },
    { id: "elevator", label: "엘리베이터", start: 0.68, end: 1, speedMultiplier: 1.08, pace: "마지막 질주" },
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
    let slideHeld = false;
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
      if (state.velocityY > 260) state.velocityY *= JUMP_RELEASE_FACTOR;
    }

    function setSlide(active) {
      slideHeld = Boolean(active);
    }

    function playerRect() {
      const sliding = slideHeld && state.y <= state.groundY + 1;
      return {
        x: state.distance + 8,
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

    function speedFor(progress) {
      const zone = zoneFor(progress);
      return (225 + 42 * progress) * zone.speedMultiplier * (state.slowTimer > 0 ? 0.72 : 1);
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
      if (jumpBuffer > 0 && coyote > 0 && !slideHeld) {
        state.velocityY = JUMP_VELOCITY;
        state.y = Math.max(state.y, state.groundY + 0.1);
        jumpBuffer = 0;
        coyote = 0;
        emit("jump");
      }

      const gravityScale = jumpHeld && state.velocityY > 0 ? 0.82 : 1;
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
      const warning = course.find((object) => object.kind === "hazard"
        && !resolved.has(object.id)
        && !warned.has(object.id)
        && object.x >= state.distance
        && object.x - state.distance <= TELEGRAPH_DISTANCE);
      if (warning) {
        warned.add(warning.id);
        emit("telegraph", {
          object: warning,
          leadTime: (warning.x - state.distance) / Math.max(1, speed),
        });
      }
      for (const object of course) {
        if (resolved.has(object.id)) continue;
        const { collisionRect: objectRect } = objectRects(object);
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
      return course.find((object) => object.kind === "hazard"
        && !resolved.has(object.id)
        && object.x >= state.distance
        && object.x - state.distance <= TELEGRAPH_DISTANCE);
    }

    function drainEvents() {
      return events.splice(0, events.length);
    }

    function snapshot() {
      const progress = clamp(Math.max(state.elapsed / duration, state.distance / length), 0, 1);
      const activeObjects = course.filter((object) => !resolved.has(object.id)).map((object) => ({
        ...object,
        ...objectRects(object),
      }));
      return {
        ...state,
        progress,
        zone: zoneFor(progress),
        sliding: slideHeld && state.y <= state.groundY + 1,
        jumpHeld,
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
      setSlide,
      step,
      snapshot,
      drainEvents,
      result,
    });
  }

  return Object.freeze({
    create,
    gradeForHits,
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
    PROP_ART_FRAMING,
  });
});
