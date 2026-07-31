(function initOfficeEscape(global) {
  "use strict";
  if (!global.document) return;

  const Core = global.OfficeEscapeMinigameCore;
  if (!Core) throw new Error("OfficeEscapeMinigameCore must be loaded before OfficeEscapeMinigame");

  const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW"]);
  const SLIDE_KEYS = new Set(["ArrowDown", "KeyS"]);
  const GAIT_FRAME_MS = 160;
  const ZONE_LABELS = Object.freeze({
    office: "사무실",
    corridor: "복합기 복도",
    elevator: "엘리베이터",
  });
  const ITEM_LABELS = Object.freeze({
    "access-card": "출입카드",
    phone: "휴대폰",
    "backup-usb": "백업 USB",
  });
  const PROP_ART_IDS = Object.freeze({
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
  const CHARACTER_ART_IDS = Object.freeze({
    doyun: Object.freeze({
      run: "minigame_character.doyun.run.right",
      runAlt: "minigame_character.doyun.run_alt.right",
      jump: "minigame_character.doyun.jump.right",
      slide: "minigame_character.doyun.slide.right",
    }),
    harin: Object.freeze({
      run: "minigame_character.harin.run.right",
      runAlt: "minigame_character.harin.run_alt.right",
      assist: "minigame_character.harin.assist.right",
      fallback: "character.harin.relaxed_standing.gentle_smile",
    }),
    boss: Object.freeze({
      chase: "minigame_character.boss.chase.right",
      chaseAlt: "minigame_character.boss.chase_alt.right",
      call: "minigame_character.boss.call.right",
      fallback: "character.boss.holding_cup.concerned",
    }),
  });
  const BACKDROP_ART_IDS = Object.freeze({
    office: "background.office.evening",
    corridor: "background.office.night",
    elevator: "background.elevator_lobby.night",
  });
  const OBJECT_DRAW_AHEAD = 2800;
  const LANDMARK_DRAW_AHEAD = 3800;
  const FINISH_DRAW_AHEAD = 4200;
  const LANDMARKS = Object.freeze([
    Object.freeze({ id: "office-door", progress: 0.03, kind: "door", label: "사무실 출구" }),
    Object.freeze({ id: "glass-gate", progress: 0.31, kind: "glass", label: "유리 회의실" }),
    Object.freeze({ id: "copier-gate", progress: 0.46, kind: "copier", label: "복합기 구간" }),
    Object.freeze({ id: "corridor-turn", progress: 0.63, kind: "turn", label: "복도 전환" }),
    Object.freeze({ id: "security-gate", progress: 0.78, kind: "security", label: "출입 게이트" }),
  ]);

  let root;
  let refs;
  let state;

  function safeArt(id) {
    try {
      return global.ArtAssets?.resolve(id) || "";
    } catch {
      return "";
    }
  }

  function gameplayArt(id) {
    const source = state?.reviewAssetMap?.[id] || safeArt(id);
    return source && !state?.failedArtSources?.has(source) ? source : "";
  }

  function prefersReducedMotion() {
    return Boolean(global.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }

  function hasGaitArt(altId) {
    return !prefersReducedMotion() && Boolean(gameplayArt(altId));
  }

  function gaitArtId(baseId, altId, snapshot) {
    if (!hasGaitArt(altId)) return baseId;
    const frame = Math.floor(((snapshot?.elapsed || 0) * 1000) / GAIT_FRAME_MS) % 2;
    return frame === 1 ? altId : baseId;
  }

  function preloadCharacterArt() {
    if (typeof global.Image !== "function") return;
    const ids = [
      CHARACTER_ART_IDS.doyun.run,
      CHARACTER_ART_IDS.doyun.runAlt,
      CHARACTER_ART_IDS.doyun.jump,
      CHARACTER_ART_IDS.doyun.slide,
      CHARACTER_ART_IDS.harin.run,
      CHARACTER_ART_IDS.harin.runAlt,
      CHARACTER_ART_IDS.harin.assist,
      CHARACTER_ART_IDS.boss.chase,
      CHARACTER_ART_IDS.boss.chaseAlt,
      CHARACTER_ART_IDS.boss.call,
    ];
    ids.forEach((id) => {
      const source = gameplayArt(id);
      if (!source) return;
      const image = new global.Image();
      image.src = source;
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function playerScreenX(width) {
    return clamp(width * 0.32, 96, Math.max(96, width * 0.35));
  }

  function projectWorldDelta(delta, width) {
    const depth = clamp(width * 0.2, 74, 360);
    return Math.sign(delta) * depth * Math.log1p(Math.abs(delta) / depth);
  }

  function worldToScreenX(snapshot, worldX, width) {
    return playerScreenX(width) + projectWorldDelta(worldX - snapshot.distance, width);
  }

  function setCharacterArt(host, primaryId, fallbackId = "") {
    const primarySource = gameplayArt(primaryId);
    const fallbackSource = fallbackId ? gameplayArt(fallbackId) : "";
    const source = primarySource || fallbackSource;
    if (host.dataset.artSource === source) return Boolean(source);
    host.dataset.artSource = source;
    let image = host.querySelector("img");
    if (!source) {
      image?.remove();
      return false;
    }
    if (!image) {
      image = document.createElement("img");
      image.alt = "";
      host.appendChild(image);
    }
    image.onerror = () => {
      if (host.dataset.artSource !== source) return;
      state?.failedArtSources?.add(source);
      if (fallbackSource && fallbackSource !== source && !state?.failedArtSources?.has(fallbackSource)) {
        host.dataset.artSource = fallbackSource;
        image.onerror = () => {
          state?.failedArtSources?.add(fallbackSource);
          host.dataset.artSource = "";
          image.remove();
        };
        image.src = fallbackSource;
        return;
      }
      host.dataset.artSource = "";
      image.remove();
    };
    image.src = source;
    return true;
  }

  function ensureRoot() {
    if (root?.isConnected) return;
    root = document.createElement("section");
    root.className = "office-escape";
    root.hidden = true;
    root.tabIndex = -1;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="oe-shell" role="dialog" aria-modal="true" aria-labelledby="oe-title">
        <section class="oe-screen oe-intro" id="oe-intro">
          <div class="oe-intro-art" aria-hidden="true">
            <div class="oe-intro-sunset"></div>
            <div class="oe-intro-boss"><span id="oe-intro-boss-art"></span></div>
            <div class="oe-intro-harin"><span id="oe-intro-harin-art"></span></div>
            <div class="oe-intro-runner"><span id="oe-intro-doyun-art"></span></div>
            <time>17:58</time>
          </div>
          <div class="oe-intro-copy">
            <small>DAY 4 · OFFICE ESCAPE</small>
            <h2 id="oe-title">정시 퇴근 작전</h2>
            <p>도윤은 자동으로 달립니다. 낮은 장애물은 <b>점프</b>, 머리 위 장애물은 <b>슬라이드</b>로 피하세요. 높은 카트는 점프를 길게 눌러야 합니다.</p>
            <ul class="oe-command-list">
              <li data-action="jump"><kbd>Space</kbd><strong>점프</strong><span>길게 눌러 높이 조절</span></li>
              <li data-action="slide"><kbd>↓</kbd><strong>슬라이드</strong><span>머리 위 장애물 회피</span></li>
              <li class="oe-brief-note">피격돼도 이야기는 계속됩니다</li>
            </ul>
            <button id="oe-start" type="button">퇴근 시작</button>
          </div>
        </section>

        <section class="oe-screen oe-play" id="oe-play" hidden>
          <header class="oe-hud">
            <div class="oe-danger" aria-label="부장님과의 거리">
              <i aria-hidden="true">!</i><span>부장</span><b id="oe-danger-value">안전</b>
              <div class="oe-danger-meter" aria-hidden="true"><em></em><em></em><em></em></div>
            </div>
            <div class="oe-route">
              <div class="oe-route-title"><small>17:58</small><strong id="oe-current-zone">사무실</strong><b><span id="oe-percent">0</span>%</b></div>
              <div class="oe-progress"><i id="oe-progress-bar"></i></div>
              <ol id="oe-zones">
                <li data-zone="office" class="active">사무실</li>
                <li data-zone="corridor">복합기 복도</li>
                <li data-zone="elevator">엘리베이터</li>
              </ol>
            </div>
            <div class="oe-items" aria-label="수집물">
              <span data-item="access-card" title="출입카드">ID</span>
              <span data-item="phone" title="휴대폰">▯</span>
              <span data-item="backup-usb" title="백업 USB">USB</span>
            </div>
          </header>

          <div class="oe-course" id="oe-course">
            <div class="oe-backdrops" aria-hidden="true">
              <div data-zone="office"></div>
              <div data-zone="corridor"></div>
              <div data-zone="elevator"></div>
            </div>
            <div class="oe-atmosphere" aria-hidden="true"></div>
            <div class="oe-office-depth" aria-hidden="true"></div>
            <div class="oe-lane" aria-hidden="true"></div>
            <div class="oe-finish" aria-hidden="true"><i></i><b>1F</b><span>퇴근</span></div>
            <div class="oe-objects" id="oe-objects"></div>
            <div class="oe-boss" id="oe-boss" aria-label="뒤쫓는 박태식 부장">
              <span class="oe-character-art" id="oe-boss-art"></span><b>부장</b>
            </div>
            <div class="oe-harin" id="oe-harin" aria-label="함께 달리는 서하린">
              <span class="oe-character-art" id="oe-harin-art"></span><span class="oe-harin-callout">여긴 제가 볼게요!</span>
            </div>
            <div class="oe-player" id="oe-player" aria-label="자동으로 달리는 도윤">
              <span class="oe-player-review-art" id="oe-player-review-art" aria-hidden="true"></span>
              <div class="oe-runner-art" aria-hidden="true"><i></i><b></b><em></em><span></span></div>
              <strong>도윤</strong>
            </div>
            <div class="oe-telegraph" id="oe-telegraph" role="status" hidden></div>
            <div class="oe-impact" id="oe-impact" aria-hidden="true"></div>
            <div class="oe-debug-geometry" id="oe-debug-geometry" aria-hidden="true"></div>
            <div class="oe-feedback" id="oe-feedback" aria-live="polite"></div>
          </div>

          <footer class="oe-play-footer">
            <p id="oe-status">첫 장애물은 의자예요. 점프로 넘어가세요!</p>
            <div class="oe-touch-controls" aria-label="미니게임 조작">
              <button id="oe-jump" data-action="jump" type="button"><i aria-hidden="true">↑</i><span>점프 · 길게</span><kbd>Space</kbd></button>
              <button id="oe-slide" data-action="slide" type="button"><i aria-hidden="true">↘</i><span>슬라이드</span><kbd>↓</kbd></button>
            </div>
          </footer>
        </section>

        <section class="oe-screen oe-result" id="oe-result" hidden>
          <small>ESCAPE RESULT</small>
          <div class="oe-result-mark" id="oe-result-mark"></div>
          <h2 id="oe-result-title"></h2>
          <p id="oe-result-copy"></p>
          <dl>
            <div><dt>피격</dt><dd id="oe-result-hits">0회</dd></div>
            <div><dt>수집</dt><dd id="oe-result-items">0 / 3</dd></div>
            <div><dt>최대 콤보</dt><dd id="oe-result-combo">0</dd></div>
          </dl>
          <button id="oe-continue" type="button">스토리 계속하기</button>
        </section>
      </div>`;
    document.body.appendChild(root);

    refs = {
      intro: root.querySelector("#oe-intro"),
      introArt: root.querySelector(".oe-intro-art"),
      introDoyunArt: root.querySelector("#oe-intro-doyun-art"),
      introHarinArt: root.querySelector("#oe-intro-harin-art"),
      introBossArt: root.querySelector("#oe-intro-boss-art"),
      play: root.querySelector("#oe-play"),
      result: root.querySelector("#oe-result"),
      start: root.querySelector("#oe-start"),
      continue: root.querySelector("#oe-continue"),
      course: root.querySelector("#oe-course"),
      progress: root.querySelector("#oe-progress-bar"),
      percent: root.querySelector("#oe-percent"),
      currentZone: root.querySelector("#oe-current-zone"),
      zones: [...root.querySelectorAll("#oe-zones li")],
      backdrops: [...root.querySelectorAll(".oe-backdrops > div")],
      items: [...root.querySelectorAll(".oe-items [data-item]")],
      objects: root.querySelector("#oe-objects"),
      finish: root.querySelector(".oe-finish"),
      player: root.querySelector("#oe-player"),
      playerReviewArt: root.querySelector("#oe-player-review-art"),
      boss: root.querySelector("#oe-boss"),
      bossArt: root.querySelector("#oe-boss-art"),
      harin: root.querySelector("#oe-harin"),
      harinArt: root.querySelector("#oe-harin-art"),
      telegraph: root.querySelector("#oe-telegraph"),
      impact: root.querySelector("#oe-impact"),
      debugGeometry: root.querySelector("#oe-debug-geometry"),
      feedback: root.querySelector("#oe-feedback"),
      status: root.querySelector("#oe-status"),
      danger: root.querySelector("#oe-danger-value"),
      jump: root.querySelector("#oe-jump"),
      slide: root.querySelector("#oe-slide"),
      resultMark: root.querySelector("#oe-result-mark"),
      resultTitle: root.querySelector("#oe-result-title"),
      resultCopy: root.querySelector("#oe-result-copy"),
      resultHits: root.querySelector("#oe-result-hits"),
      resultItems: root.querySelector("#oe-result-items"),
      resultCombo: root.querySelector("#oe-result-combo"),
    };

    refs.backdrops.forEach((element) => {
      const image = safeArt(BACKDROP_ART_IDS[element.dataset.zone]);
      if (image) element.style.backgroundImage = `url("${image}")`;
    });
    const introBackdrop = safeArt(BACKDROP_ART_IDS.office);
    if (introBackdrop) refs.introArt.style.backgroundImage = `url("${introBackdrop}")`;

    refs.start.addEventListener("click", begin);
    refs.continue.addEventListener("click", complete);
    bindControl(refs.jump, "jump");
    bindControl(refs.slide, "slide");
  }

  function syncIntroArt() {
    setCharacterArt(refs.introDoyunArt, CHARACTER_ART_IDS.doyun.run);
    setCharacterArt(
      refs.introHarinArt,
      CHARACTER_ART_IDS.harin.run,
      CHARACTER_ART_IDS.harin.fallback,
    );
    setCharacterArt(
      refs.introBossArt,
      CHARACTER_ART_IDS.boss.chase,
      CHARACTER_ART_IDS.boss.fallback,
    );
  }

  function bindControl(button, action) {
    if (action === "jump") {
      let pointerGame = null;
      button.addEventListener("pointerdown", (event) => {
        if (!state?.playing || state.paused) return;
        event.preventDefault();
        pointerGame = state.game;
        pointerGame.pressJump();
        button.classList.add("pressed");
      });
      const release = () => {
        pointerGame?.releaseJump();
        pointerGame = null;
        button.classList.remove("pressed");
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
      button.addEventListener("click", (event) => {
        if (event.detail !== 0) return;
        if (!state?.playing || state.paused) return;
        const game = state.game;
        game.pressJump();
        global.setTimeout(() => game.releaseJump(), 90);
      });
      return;
    }
    let pointerGame = null;
    const setSlide = (game, active) => {
      game?.setSlide(active);
      button.classList.toggle("pressed", active);
    };
    button.addEventListener("pointerdown", (event) => {
      if (!state?.playing || state.paused) return;
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      pointerGame = state.game;
      setSlide(pointerGame, true);
    });
    const release = () => {
      setSlide(pointerGame, false);
      pointerGame = null;
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("pointerleave", release);
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      if (!state?.playing || state.paused) return;
      const game = state.game;
      setSlide(game, true);
      global.setTimeout(() => setSlide(game, false), 520);
    });
  }

  function show(target) {
    [refs.intro, refs.play, refs.result].forEach((screen) => {
      screen.hidden = screen !== target;
    });
  }

  function releaseControls() {
    state?.game?.releaseJump();
    state?.game?.setSlide(false);
    refs?.jump.classList.remove("pressed");
    refs?.slide.classList.remove("pressed");
  }

  function clearTransientTimers(targetState = state) {
    targetState?.transientTimers?.forEach((timer) => global.clearTimeout(timer));
    targetState?.transientTimers?.clear();
    if (targetState) targetState.feedbackTimer = 0;
  }

  function scheduleTransient(callback, delay) {
    const owner = state;
    const timer = global.setTimeout(() => {
      owner?.transientTimers?.delete(timer);
      if (state === owner) callback();
    }, delay);
    owner?.transientTimers?.add(timer);
    return timer;
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || !root || root.hidden || state?.paused) return false;
    const focusable = [...root.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled)")]
      .filter((element) => !element.closest("[hidden]"));
    if (!focusable.length) {
      event.preventDefault();
      root.focus();
      return true;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    const active = document.activeElement;
    if (!root.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return true;
    }
    if (event.shiftKey && (active === first || active === root)) {
      event.preventDefault();
      last.focus();
      return true;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  function buildObjects(course, length) {
    const objectMarkup = course.map((object) => {
      const source = gameplayArt(PROP_ART_IDS[object.type]);
      return `
      <div class="oe-object oe-${object.kind} oe-${object.type}${source ? " has-art" : ""}" data-object="${object.id}" data-avoid="${object.avoid || ""}" aria-label="${object.label}">
        ${source ? `<img class="oe-object-art" src="${source}" alt="">` : "<i></i><b></b>"}<span>${object.label}</span>
      </div>`;
    }).join("");
    state.landmarks = LANDMARKS.map((landmark) => ({
      ...landmark,
      x: Math.round(length * landmark.progress),
    }));
    const landmarkMarkup = state.landmarks.map((landmark) => `
      <div class="oe-landmark oe-landmark-${landmark.kind}" data-landmark="${landmark.id}" aria-hidden="true">
        <i></i><b>${landmark.label}</b><span></span>
      </div>`).join("");
    refs.objects.innerHTML = objectMarkup + landmarkMarkup;
    state.objectElements = new Map([...refs.objects.querySelectorAll("[data-object]")]
      .map((element) => [element.dataset.object, element]));
    state.landmarkElements = new Map([...refs.objects.querySelectorAll("[data-landmark]")]
      .map((element) => [element.dataset.landmark, element]));
    course.forEach((object) => {
      const element = state.objectElements.get(object.id);
      const frame = Core.PROP_ART_FRAMING[object.type];
      if (!element?.classList.contains("has-art") || !frame) return;
      const artSize = object.width / frame.alphaWidth;
      element.style.setProperty("--oe-object-art-size", `${artSize}px`);
      element.style.setProperty("--oe-object-art-bottom", `${-artSize * frame.bottomPadding}px`);
    });
  }

  function syncCharacterArt(snapshot) {
    const doyunPose = snapshot.sliding ? "slide" : snapshot.y > 1 ? "jump" : "run";
    const doyunArtId = doyunPose === "run"
      ? gaitArtId(CHARACTER_ART_IDS.doyun.run, CHARACTER_ART_IDS.doyun.runAlt, snapshot)
      : CHARACTER_ART_IDS.doyun[doyunPose];
    const hasSpecificDoyunPose = Boolean(gameplayArt(doyunArtId));
    const hasDoyunArt = setCharacterArt(
      refs.playerReviewArt,
      doyunArtId,
      CHARACTER_ART_IDS.doyun.run,
    );
    refs.player.classList.toggle("has-review-art", hasDoyunArt);
    refs.player.classList.toggle("has-specific-pose", hasSpecificDoyunPose);
    refs.player.classList.toggle("has-gait-art", doyunPose === "run" && hasGaitArt(CHARACTER_ART_IDS.doyun.runAlt));
    refs.playerReviewArt.hidden = !hasDoyunArt;
    refs.player.dataset.pose = doyunPose;

    const harinPose = refs.harin.classList.contains("assisting") ? "assist" : "run";
    const harinArtId = harinPose === "run"
      ? gaitArtId(CHARACTER_ART_IDS.harin.run, CHARACTER_ART_IDS.harin.runAlt, snapshot)
      : CHARACTER_ART_IDS.harin[harinPose];
    const hasHarinGameArt = Boolean(gameplayArt(harinArtId));
    setCharacterArt(
      refs.harinArt,
      harinArtId,
      CHARACTER_ART_IDS.harin.fallback,
    );
    refs.harin.classList.toggle("has-game-art", hasHarinGameArt);
    refs.harin.classList.toggle("has-gait-art", harinPose === "run" && hasGaitArt(CHARACTER_ART_IDS.harin.runAlt));
    refs.harin.dataset.pose = harinPose;

    const bossPose = snapshot.hitCount >= 2 ? "call" : "chase";
    const bossArtId = bossPose === "chase"
      ? gaitArtId(CHARACTER_ART_IDS.boss.chase, CHARACTER_ART_IDS.boss.chaseAlt, snapshot)
      : CHARACTER_ART_IDS.boss[bossPose];
    const hasBossGameArt = Boolean(gameplayArt(bossArtId));
    setCharacterArt(
      refs.bossArt,
      bossArtId,
      CHARACTER_ART_IDS.boss.fallback,
    );
    refs.boss.classList.toggle("has-game-art", hasBossGameArt);
    refs.boss.classList.toggle("has-gait-art", bossPose === "chase" && hasGaitArt(CHARACTER_ART_IDS.boss.chaseAlt));
    refs.boss.dataset.pose = bossPose;
  }

  function begin() {
    const overrides = state?.testOverrides || {};
    state.game = Core.create(overrides);
    state.result = null;
    state.playing = true;
    state.paused = false;
    state.lastAt = performance.now();
    state.lastZone = "";
    state.feedbackTimer = 0;
    const initialSnapshot = state.game.snapshot();
    state.lastSnapshot = initialSnapshot;
    state.hitStopUntil = 0;
    syncCharacterArt(initialSnapshot);
    buildObjects(initialSnapshot.course, initialSnapshot.length);
    refs.feedback.textContent = "";
    refs.feedback.className = "oe-feedback";
    refs.items.forEach((item) => item.classList.remove("collected"));
    show(refs.play);
    render(initialSnapshot);
    root.focus();
    state.frame = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!state?.playing || state.paused) return;
    if (state.hitStopUntil > now && state.lastSnapshot) {
      state.lastAt = now;
      render(state.lastSnapshot);
      state.frame = requestAnimationFrame(tick);
      return;
    }
    const dt = Math.min(0.05, (now - state.lastAt) / 1000);
    state.lastAt = now;
    const snapshot = state.game.step(dt);
    state.lastSnapshot = snapshot;
    handleEvents(state.game.drainEvents(), snapshot);
    render(snapshot);
    if (snapshot.finished) return;
    state.frame = requestAnimationFrame(tick);
  }

  function handleEvents(events, snapshot) {
    events.forEach((event) => {
      if (event.type === "collect") {
        const target = refs.items.find((item) => item.dataset.item === event.object.type);
        target?.classList.add("collected");
        feedback(`${ITEM_LABELS[event.object.type]} 확보!`, "collect");
      } else if (event.type === "assist") {
        refs.harin.classList.add("assisting");
        feedback("하린이 장애물을 막아줬다!", "assist");
        scheduleTransient(() => refs?.harin.classList.remove("assisting"), 800);
      } else if (event.type === "hit") {
        root.classList.add("hit");
        showImpact(event.object, snapshot);
        state.hitStopUntil = prefersReducedMotion() ? 0 : performance.now() + 50;
        feedback(`부장님과의 거리가 좁혀졌다 · ${event.hitCount}회`, "hit");
        scheduleTransient(() => root?.classList.remove("hit"), 280);
      } else if (event.type === "finish") {
        finish(event);
      }
    });
  }

  function showImpact(object, snapshot) {
    if (!object || !snapshot) return;
    const width = refs.course.clientWidth || 1000;
    const x = worldToScreenX(snapshot, object.x + object.width * 0.18, width);
    refs.impact.style.setProperty("--oe-impact-x", `${x}px`);
    refs.impact.style.setProperty(
      "--oe-impact-y",
      `${(object.y || 0) + Math.max(18, object.height * 0.45)}px`,
    );
    refs.impact.classList.remove("show");
    void refs.impact.offsetWidth;
    refs.impact.classList.add("show");
    scheduleTransient(() => refs?.impact.classList.remove("show"), 260);
  }

  function feedback(message, type) {
    refs.feedback.textContent = message;
    refs.feedback.className = `oe-feedback show ${type}`;
    global.clearTimeout(state.feedbackTimer);
    state.transientTimers.delete(state.feedbackTimer);
    state.feedbackTimer = scheduleTransient(() => {
      refs.feedback.className = "oe-feedback";
      state.feedbackTimer = 0;
    }, 1100);
  }

  function render(snapshot) {
    const width = refs.course.clientWidth || 1000;
    const compact = width <= 850;
    const playerX = playerScreenX(width);
    const dangerLevel = Math.min(3, snapshot.hitCount);
    const harinX = playerX - (compact ? 102 : 152);
    const bossX = compact
      ? Math.max(-42, playerX - 178 + dangerLevel * 28)
      : Math.max(-26, playerX - 246 + dangerLevel * 38);

    root.dataset.zone = snapshot.zone.id;
    refs.player.classList.toggle("jumping", snapshot.y > 1);
    refs.player.classList.toggle("sliding", snapshot.sliding);
    refs.player.classList.toggle("invulnerable", snapshot.invulnerable > 0);
    syncCharacterArt(snapshot);
    const playerScale = compact ? 0.84 : 1;
    const harinScale = compact ? 0.72 : 1;
    const bossScale = compact ? 0.74 : 1;
    refs.player.style.transform = `translate3d(${playerX}px, ${-snapshot.y}px, 0) scale(${playerScale})`;
    refs.harin.style.transform = `translate3d(${harinX}px, 0, 0) scale(${harinScale})`;
    refs.boss.style.transform = `translate3d(${bossX}px, 0, 0) scale(${bossScale})`;
    refs.danger.textContent = dangerLevel === 0 ? "안전" : dangerLevel === 1 ? "접근 중" : dangerLevel === 2 ? "바로 뒤" : "붙잡힘";
    refs.danger.parentElement.dataset.level = String(dangerLevel);

    refs.progress.style.width = `${snapshot.progress * 100}%`;
    refs.percent.textContent = String(Math.round(snapshot.progress * 100));
    refs.currentZone.textContent = ZONE_LABELS[snapshot.zone.id] || "퇴근 경로";
    refs.zones.forEach((zone) => zone.classList.toggle("active", zone.dataset.zone === snapshot.zone.id));
    refs.backdrops.forEach((backdrop) => backdrop.classList.toggle("active", backdrop.dataset.zone === snapshot.zone.id));
    refs.course.style.setProperty("--oe-far-x", `${-((snapshot.distance * 0.15) % 1600)}px`);
    refs.course.style.setProperty("--oe-mid-x", `${-((snapshot.distance * 0.4) % 720)}px`);
    refs.course.style.setProperty("--oe-near-x", `${-(snapshot.distance % 176)}px`);
    refs.course.style.setProperty("--oe-backdrop-x", `${-((snapshot.distance * 0.025) % 90)}px`);

    state.landmarks.forEach((landmark) => {
      const element = state.landmarkElements.get(landmark.id);
      if (!element) return;
      const worldDelta = landmark.x - snapshot.distance;
      const x = worldToScreenX(snapshot, landmark.x, width);
      const visible = worldDelta > -1200 && worldDelta <= LANDMARK_DRAW_AHEAD
        && x > -260 && x < width + 380;
      element.hidden = !visible;
      if (!visible) return;
      const approach = clamp(1 - Math.max(0, x - width * 0.65) / Math.max(1, width * 0.85), 0, 1);
      const scale = 0.88 + approach * 0.12;
      element.style.transform = `translate3d(${x}px, 0, 0) scale(${scale})`;
    });

    const finishX = worldToScreenX(snapshot, snapshot.length * 0.985, width);
    const finishDelta = snapshot.length * 0.985 - snapshot.distance;
    refs.finish.hidden = finishDelta > FINISH_DRAW_AHEAD || finishX < -180 || finishX > width + 420;
    if (!refs.finish.hidden) refs.finish.style.transform = `translate3d(${finishX}px, 0, 0)`;

    snapshot.course.forEach((object) => {
      const element = state.objectElements.get(object.id);
      if (!element) return;
      const worldDelta = object.x - snapshot.distance;
      const x = worldToScreenX(snapshot, object.x, width);
      const visible = worldDelta <= OBJECT_DRAW_AHEAD
        && x > -220 && x < width + 360 && !snapshot.resolved.has(object.id);
      element.hidden = !visible;
      if (!visible) return;
      const approach = clamp(1 - Math.max(0, x - width * 0.62) / Math.max(1, width * 0.82), 0, 1);
      const scale = 0.8 + approach * 0.2;
      element.style.width = `${object.width}px`;
      element.style.height = `${object.height}px`;
      element.style.transform = `translate3d(${x}px, ${-(object.y || 0)}px, 0) scale(${scale})`;
    });

    const upcoming = snapshot.upcomingHazard;
    refs.telegraph.hidden = !upcoming;
    state.objectElements.forEach((element, id) => {
      element.classList.toggle("telegraphed", id === upcoming?.id);
    });
    if (upcoming) {
      const upcomingX = worldToScreenX(snapshot, upcoming.x + upcoming.width * 0.5, width);
      refs.telegraph.innerHTML = upcoming.avoid === "slide"
        ? '<i aria-hidden="true">↓</i><b>SLIDE</b>'
        : '<i aria-hidden="true">↑</i><b>JUMP</b>';
      refs.telegraph.dataset.action = upcoming.avoid;
      refs.telegraph.style.setProperty("--oe-telegraph-x", `${upcomingX}px`);
      refs.telegraph.style.setProperty(
        "--oe-telegraph-y",
        `${(upcoming.y || 0) + upcoming.height + 22}px`,
      );
    }
    refs.status.textContent = upcoming
      ? `${upcoming.label} 접근 · ${upcoming.avoid === "slide" ? "슬라이드하세요!" : "점프하세요!"}`
      : snapshot.zone.id === "office"
        ? "하린과 함께 사무실을 빠져나가는 중"
        : snapshot.zone.id === "corridor"
          ? "복합기 복도는 서랍과 케이블을 조심하세요"
          : "엘리베이터가 보여요. 마지막까지 집중!";

    renderDebugGeometry(snapshot, width);

    if (snapshot.zone.id !== state.lastZone) {
      state.lastZone = snapshot.zone.id;
      root.classList.add("zone-change");
      scheduleTransient(() => root?.classList.remove("zone-change"), 650);
    }
  }

  function renderDebugGeometry(snapshot, width) {
    refs.debugGeometry.hidden = !state.showHitboxes;
    if (!state.showHitboxes) {
      refs.debugGeometry.replaceChildren();
      return;
    }
    const boxes = [{ kind: "player", label: "PLAYER", rect: snapshot.playerRect }];
    snapshot.activeObjects.forEach((object) => {
      if (object.visibleRect.x - snapshot.distance > OBJECT_DRAW_AHEAD) return;
      const screenX = worldToScreenX(snapshot, object.visibleRect.x, width);
      if (screenX < -220 || screenX > width + 360) return;
      boxes.push({ kind: "visible", label: object.type, rect: object.visibleRect });
      boxes.push({ kind: "collision", label: "HIT", rect: object.collisionRect });
    });
    refs.debugGeometry.innerHTML = boxes.map(({ kind, label, rect }) => {
      const x = worldToScreenX(snapshot, rect.x, width);
      return `<i class="oe-debug-box ${kind}" style="--oe-box-x:${x}px;--oe-box-y:${rect.y}px;--oe-box-w:${rect.width}px;--oe-box-h:${rect.height}px"><span>${label}</span></i>`;
    }).join("");
  }

  function finish(result) {
    if (!state?.playing) return;
    state.playing = false;
    cancelAnimationFrame(state.frame);
    state.result = {
      grade: result.grade,
      caught: result.caught,
      elapsed: result.elapsed,
      hitCount: result.hitCount,
      collectedItems: result.collectedItems,
      maxCombo: result.maxCombo,
    };
    const copies = {
      perfect: ["PERFECT", "완벽한 정시 퇴근!", "하린의 신호를 놓치지 않고 엘리베이터에 도착했습니다."],
      close: ["CLOSE", "아슬아슬하게 퇴근 성공", "몇 번의 위기는 있었지만 마지막 호출을 피해 엘리베이터에 탔습니다."],
      caught: ["CAUGHT", "부장님에게 붙잡혔습니다", "10분짜리 확인 업무를 마친 뒤, 기다리던 하린과 함께 퇴근합니다."],
    };
    const [mark, title, copy] = copies[result.grade];
    refs.resultMark.textContent = mark;
    refs.resultMark.dataset.grade = result.grade;
    refs.resultTitle.textContent = title;
    refs.resultCopy.textContent = copy;
    refs.resultHits.textContent = `${result.hitCount}회`;
    refs.resultItems.textContent = `${result.collectedItems.length} / 3`;
    refs.resultCombo.textContent = String(result.maxCombo);
    show(refs.result);
    refs.continue.focus();
  }

  function complete() {
    const callback = state?.onComplete;
    const result = state?.result;
    const returnFocus = state?.returnFocus;
    clearTransientTimers();
    releaseControls();
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("office-escape-open");
    if (returnFocus?.isConnected) returnFocus.focus();
    callback?.(result);
  }

  function start(options = {}) {
    ensureRoot();
    const returnFocus = root.contains(document.activeElement)
      ? state?.returnFocus
      : document.activeElement;
    cancelAnimationFrame(state?.frame);
    clearTransientTimers(state);
    const devMode = document.documentElement.dataset.officeEscapeDev === "true";
    state = {
      onComplete: options.onComplete,
      testOverrides: devMode
        ? options.testOverrides || {}
        : {},
      reviewAssetMap: devMode && options.reviewAssetMap && typeof options.reviewAssetMap === "object"
        ? options.reviewAssetMap
        : {},
      game: null,
      result: null,
      playing: false,
      paused: false,
      frame: 0,
      objectElements: new Map(),
      landmarkElements: new Map(),
      landmarks: [],
      feedbackTimer: 0,
      hitStopUntil: 0,
      failedArtSources: new Set(),
      lastSnapshot: null,
      showHitboxes: devMode && options.showHitboxes === true,
      transientTimers: new Set(),
      returnFocus,
    };
    root.classList.remove("paused", "hit", "zone-change");
    root.classList.toggle("show-hitboxes", state.showHitboxes);
    refs.debugGeometry.hidden = !state.showHitboxes;
    refs.debugGeometry.replaceChildren();
    refs.impact.classList.remove("show");
    refs.harin.classList.remove("assisting");
    refs.jump.classList.remove("pressed");
    refs.slide.classList.remove("pressed");
    preloadCharacterArt();
    syncIntroArt();
    show(refs.intro);
    document.documentElement.classList.add("office-escape-open");
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    refs.start.focus();
    if (devMode && options.autoStart) begin();
  }

  function pause() {
    if (!state?.playing || state.paused) return;
    state.paused = true;
    cancelAnimationFrame(state.frame);
    releaseControls();
    root.classList.add("paused");
  }

  function resume() {
    if (!state?.playing || !state.paused) return;
    state.paused = false;
    state.lastAt = performance.now();
    root.classList.remove("paused");
    state.frame = requestAnimationFrame(tick);
  }

  function debugSnapshot() {
    return state?.game?.snapshot() || null;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && trapFocus(event)) return;
    if (root?.hidden || !state?.playing || state.paused) return;
    if (JUMP_KEYS.has(event.code)) {
      event.preventDefault();
      if (!event.repeat) state.game.pressJump();
      refs.jump.classList.add("pressed");
    } else if (SLIDE_KEYS.has(event.code)) {
      event.preventDefault();
      state.game.setSlide(true);
      refs.slide.classList.add("pressed");
    }
  });
  document.addEventListener("keyup", (event) => {
    if (JUMP_KEYS.has(event.code)) {
      state?.game?.releaseJump();
      refs?.jump.classList.remove("pressed");
    } else if (SLIDE_KEYS.has(event.code)) {
      state?.game?.setSlide(false);
      refs?.slide.classList.remove("pressed");
    }
  });
  global.addEventListener("blur", releaseControls);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseControls();
  });
  document.addEventListener("nan:settings-open", pause);
  document.addEventListener("nan:settings-close", resume);
  document.addEventListener("nan:pause-open", pause);
  document.addEventListener("nan:pause-close", resume);

  global.OfficeEscapeMinigame = Object.freeze({ start, pause, resume, debugSnapshot });
})(typeof globalThis !== "undefined" ? globalThis : this);
