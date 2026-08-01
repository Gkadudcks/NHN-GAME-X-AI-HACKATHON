(function initOfficeEscape(global) {
  "use strict";
  if (!global.document) return;

  const Core = global.OfficeEscapeMinigameCore;
  if (!Core) throw new Error("OfficeEscapeMinigameCore must be loaded before OfficeEscapeMinigame");

  const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW"]);
  const SLIDE_KEYS = new Set(["ArrowDown", "KeyS"]);
  const GAIT_PHASE_DELAY_MS = Core.GAIT_PHASE_DELAY_MS;
  const GAIT_EMPHASIS_MS = 70;
  const SLIDE_FEEDBACK_MS = 320;
  const ACCESSIBLE_JUMP_MS = 420;
  const ACCESSIBLE_SLIDE_MS = 80;
  const ARRIVAL_MS = 750;
  const PLAYER_MOTION_FX_MS = 240;
  const ZONE_CHANGE_FX_MS = 650;
  const HIT_FEEDBACK_MIN_SECONDS = 0.4;
  const SUCCESS_STATUS_SECONDS = 0.5;
  const CUE_JUMP_COMMIT_SECONDS = ACCESSIBLE_JUMP_MS / 1000;
  const TUTORIAL_JUMP_ACCEPT_LEAD = 0.9;
  const TUTORIAL_TAP_IDS = Object.freeze({ jump: "chair-tutorial", slide: "drawer-tutorial" });
  const ZONE_LABELS = Object.freeze({
    office: "사무실",
    corridor: "복합기 복도",
    elevator: "엘리베이터",
  });
  const ZONE_ENTRY_LABELS = Object.freeze({
    office: "01 / 03 · 사무실 탈출",
    corridor: "02 / 03 · 복합기 복도",
    elevator: "03 / 03 · 엘리베이터 로비",
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
  const OBJECT_DRAW_AHEAD = 1900;
  const LANDMARK_DRAW_AHEAD = 2200;
  const FINISH_DRAW_AHEAD = 3000;
  const MAX_VISIBLE_LANDMARKS = 2;
  const SHORT_LANDSCAPE_WORLD_SCALE = 0.52;
  const SHORT_LANDSCAPE_CAMERA_DEPTH_FACTOR = 0.65;
  const SHORT_LANDSCAPE_CAMERA_MAX_DEPTH = 1200;
  const CAMERA_NEAR_BLEND_START = 420;
  const CAMERA_FAR_BLEND_END = 1400;
  const LANDMARKS = Object.freeze([
    Object.freeze({ id: "office-door", progress: 0.03, kind: "door", label: "사무실 출구", shortLabel: "출구" }),
    Object.freeze({ id: "meeting-7f", progress: 0.17, kind: "glass", label: "회의실 7F", shortLabel: "회의실 7F" }),
    Object.freeze({ id: "glass-gate", progress: 0.31, kind: "glass", label: "유리 회의실", shortLabel: "회의실" }),
    Object.freeze({ id: "copier-gate", progress: 0.46, kind: "copier", label: "복합기 구간", shortLabel: "복합기" }),
    Object.freeze({ id: "corridor-turn", progress: 0.63, kind: "turn", label: "복도 전환", shortLabel: "복도" }),
    Object.freeze({ id: "security-gate", progress: 0.78, kind: "security", label: "출입 게이트", shortLabel: "게이트" }),
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

  function gaitArtId(baseId, altId, snapshot, delayMs = 0) {
    if (!hasGaitArt(altId)) return baseId;
    const frame = Core.gaitFrameIndex(snapshot?.elapsed, delayMs);
    return frame === 1 ? altId : baseId;
  }

  function syncGaitEmphasis(host, artId, enabled) {
    if (!enabled) {
      host.classList.remove("gait-emphasis");
      delete host.dataset.gaitArt;
      return;
    }
    if (host.dataset.gaitArt === artId) return;
    host.dataset.gaitArt = artId;
    host.style.setProperty("--oe-gait-emphasis-ms", `${GAIT_EMPHASIS_MS}ms`);
    host.classList.remove("gait-emphasis");
    void host.offsetWidth;
    host.classList.add("gait-emphasis");
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

  function currentPlaceLabel(snapshot, compact = false) {
    const zoneLabel = ZONE_LABELS[snapshot?.zone?.id] || "퇴근 경로";
    if (snapshot?.zone?.id === "elevator") return "엘리베이터";
    const distanceProgress = Number.isFinite(snapshot?.distanceProgress)
      ? snapshot.distanceProgress
      : clamp((snapshot?.distance || 0) / Math.max(1, snapshot?.length || 1), 0, 1);
    let label = zoneLabel;
    for (const landmark of LANDMARKS) {
      if (distanceProgress < landmark.progress) break;
      label = compact ? landmark.shortLabel : landmark.label;
    }
    return label;
  }

  function playerScreenX(width) {
    return clamp(width * 0.32, 96, Math.max(96, width * 0.35));
  }

  function projectWorldDelta(delta, width, worldScale = 1) {
    const distance = Math.abs(delta);
    const nearDepth = clamp(width * 0.2, 74, 360);
    const shortLandscape = worldScale < 1;
    const farDepthFactor = shortLandscape ? SHORT_LANDSCAPE_CAMERA_DEPTH_FACTOR : 0.45;
    const farDepthMax = shortLandscape ? SHORT_LANDSCAPE_CAMERA_MAX_DEPTH : 720;
    const farDepth = clamp(width * farDepthFactor / Math.max(worldScale, 0.35), 74, farDepthMax);
    const nearProjection = nearDepth * Math.log1p(distance / nearDepth);
    const farProjection = farDepth * Math.log1p(distance / farDepth);
    const blendProgress = clamp(
      (distance - CAMERA_NEAR_BLEND_START) / (CAMERA_FAR_BLEND_END - CAMERA_NEAR_BLEND_START),
      0,
      1,
    );
    const smoothBlend = blendProgress * blendProgress * (3 - 2 * blendProgress);
    return Math.sign(delta) * (nearProjection + (farProjection - nearProjection) * smoothBlend);
  }

  function worldScaleForCourse(width) {
    return width <= 900 && (refs?.course?.clientHeight || 0) <= 220
      ? SHORT_LANDSCAPE_WORLD_SCALE
      : 1;
  }

  function worldToScreenX(snapshot, worldX, width) {
    const worldScale = worldScaleForCourse(width);
    return playerScreenX(width)
      + projectWorldDelta(worldX - snapshot.distance, width, worldScale) * worldScale;
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
            <p>도윤은 자동으로 달립니다. 낮은 장애물은 <b>점프</b>, 머리 위 장애물은 <b>슬라이드</b>로 피하세요. 점프 신호는 미리 탭해 예약할 수 있습니다.</p>
            <ul class="oe-command-list">
              <li data-action="jump"><kbd>Space</kbd><strong>점프 · 미리 탭</strong><span>알맞은 순간에 자동 실행</span></li>
              <li data-action="slide"><kbd>↓</kbd><strong>슬라이드 · 신호에 탭</strong><span>신호 밖에서는 길게</span></li>
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
              <div class="oe-route-title"><small id="oe-remaining" aria-label="남은 시간 1분 4초">01:04</small><strong id="oe-current-zone">사무실</strong><b><span id="oe-percent">0</span>%</b><em class="oe-item-count" id="oe-item-count" aria-label="수집 0 / 3">수집 0/3</em></div>
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
              <span class="oe-footfall" id="oe-footfall" aria-hidden="true"></span>
              <strong>도윤</strong>
              <span class="oe-avoid-confirm" id="oe-avoid-confirm" aria-hidden="true">✓</span>
            </div>
            <div class="oe-telegraph" id="oe-telegraph" role="status" hidden></div>
            <div class="oe-impact" id="oe-impact" aria-hidden="true"></div>
            <div class="oe-debug-geometry" id="oe-debug-geometry" aria-hidden="true"></div>
            <div class="oe-feedback" id="oe-feedback" aria-live="polite"></div>
          </div>

          <footer class="oe-play-footer">
            <p id="oe-status">첫 장애물은 의자예요. 점프로 넘어가세요!</p>
            <div class="oe-touch-controls" aria-label="미니게임 조작">
              <button id="oe-jump" data-action="jump" type="button"><i aria-hidden="true">↑</i><span>점프 · 미리 탭</span><kbd>Space</kbd></button>
              <button id="oe-slide" data-action="slide" type="button"><i aria-hidden="true">↘</i><span>슬라이드 · 길게</span><kbd>↓</kbd></button>
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
      remaining: root.querySelector("#oe-remaining"),
      itemCount: root.querySelector("#oe-item-count"),
      currentZone: root.querySelector("#oe-current-zone"),
      zones: [...root.querySelectorAll("#oe-zones li")],
      backdrops: [...root.querySelectorAll(".oe-backdrops > div")],
      items: [...root.querySelectorAll(".oe-items [data-item]")],
      objects: root.querySelector("#oe-objects"),
      finish: root.querySelector(".oe-finish"),
      player: root.querySelector("#oe-player"),
      playerReviewArt: root.querySelector("#oe-player-review-art"),
      footfall: root.querySelector("#oe-footfall"),
      avoidConfirm: root.querySelector("#oe-avoid-confirm"),
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
      jumpLabel: root.querySelector("#oe-jump span"),
      slideLabel: root.querySelector("#oe-slide span"),
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

  function cancelSlideActivationTimer(targetState = state) {
    if (!targetState?.accessibleSlideTimer) return;
    global.clearTimeout(targetState.accessibleSlideTimer);
    targetState.transientTimers?.delete(targetState.accessibleSlideTimer);
    targetState.accessibleSlideTimer = 0;
  }

  function cancelJumpActivationTimer(targetState = state) {
    if (!targetState?.accessibleJumpTimer) return;
    global.clearTimeout(targetState.accessibleJumpTimer);
    targetState.transientTimers?.delete(targetState.accessibleJumpTimer);
    targetState.accessibleJumpTimer = 0;
  }

  function clearSlideFeedback(targetState = state) {
    if (targetState?.slideFeedbackTimer) {
      global.clearTimeout(targetState.slideFeedbackTimer);
      targetState.transientTimers?.delete(targetState.slideFeedbackTimer);
      targetState.slideFeedbackTimer = 0;
    }
    refs?.player.classList.remove("slide-feedback");
    refs?.slide.classList.remove("tap-feedback");
  }

  function startSlideFeedback() {
    if (!state?.playing || state.paused) return;
    clearSlideFeedback(state);
    refs.player.classList.remove("slide-feedback");
    void refs.player.offsetWidth;
    refs.player.classList.add("slide-feedback");
    refs.slide.classList.add("tap-feedback");
    refs.player.style.setProperty("--oe-slide-feedback-ms", `${SLIDE_FEEDBACK_MS}ms`);
    state.slideFeedbackTimer = scheduleTransient(() => {
      refs.player.classList.remove("slide-feedback");
      refs.slide.classList.remove("tap-feedback");
      state.slideFeedbackTimer = 0;
    }, SLIDE_FEEDBACK_MS);
  }

  function canQueueJump(upcoming) {
    if (!upcoming || upcoming.avoid !== "jump") return false;
    return upcoming.jumpQueueReady
      || (upcoming.id === TUTORIAL_TAP_IDS.jump
        && upcoming.leadTime <= TUTORIAL_JUMP_ACCEPT_LEAD);
  }

  function jumpCueAcceptWindow(game) {
    const upcoming = game?.snapshot().upcomingHazard;
    return canQueueJump(upcoming) ? upcoming : null;
  }

  function slideCueAcceptWindow(game) {
    const upcoming = game?.snapshot().upcomingHazard;
    return upcoming?.avoid === "slide" && upcoming.telegraphPhase === "act"
      ? upcoming
      : null;
  }

  function pendingJumpFor(upcoming, targetState = state) {
    const pending = targetState?.pendingJump;
    return pending
      && pending.game === targetState?.game
      && pending.objectId === upcoming?.id
      ? pending
      : null;
  }

  function clearPendingJump(targetState = state) {
    if (targetState) targetState.pendingJump = null;
    refs?.jump.classList.remove("queued");
    refs?.jump.removeAttribute("data-queue-status");
  }

  function clearPendingJumpForObject(objectId) {
    if (state?.pendingJump?.objectId === objectId) clearPendingJump(state);
  }

  function cancelOwnedPendingJump(ownerToken) {
    const pending = state?.pendingJump;
    if (!pending || pending.ownerToken !== ownerToken || pending.status !== "queued") return;
    clearPendingJump(state);
  }

  function executePendingJump(pending) {
    if (!pending || pending.status !== "queued") return;
    pending.status = "executed";
    pending.game.commitJump(CUE_JUMP_COMMIT_SECONDS);
    pending.game.releaseJump();
    refs?.jump.classList.add("queued");
    refs?.jump.setAttribute("data-queue-status", "executed");
  }

  function flushPendingJump() {
    const pending = state?.pendingJump;
    if (!pending) return;
    const snapshot = pending.game?.snapshot();
    const upcoming = snapshot?.upcomingHazard;
    if (!state.playing || state.paused || state.game !== pending.game
      || snapshot?.resolved?.has(pending.objectId)
      || upcoming?.id !== pending.objectId
      || upcoming.avoid !== "jump") {
      clearPendingJump(state);
      return;
    }
    if (pending.status === "queued" && upcoming.telegraphPhase === "act") {
      executePendingJump(pending);
    }
  }

  function activateJumpCue(game, ownerToken = null) {
    const upcoming = jumpCueAcceptWindow(game);
    if (!upcoming || typeof game.commitJump !== "function") return null;
    const existing = state.pendingJump;
    if (existing?.game === game && existing.objectId === upcoming.id) {
      if (existing.status === "queued" && ownerToken === null) existing.ownerToken = null;
      return upcoming;
    }
    clearPendingJump(state);
    const pending = {
      game,
      objectId: upcoming.id,
      status: "queued",
      ownerToken,
    };
    state.pendingJump = pending;
    refs?.jump.classList.add("queued");
    refs?.jump.setAttribute("data-queue-status", "queued");
    if (upcoming.telegraphPhase === "act") executePendingJump(pending);
    return upcoming;
  }

  function activateSlideCue(game) {
    const upcoming = slideCueAcceptWindow(game);
    if (!upcoming || typeof game.commitSlide !== "function") return null;
    game.commitSlide(upcoming.clearLeadTime + 0.05);
    return upcoming;
  }

  function markCueKeyboardActivation(action) {
    state.cueKeyboardAction = action;
    state.cueKeyboardAt = global.performance.now();
  }

  function isDuplicateCueKeyboardClick(action) {
    const duplicate = state?.cueKeyboardAction === action
      && global.performance.now() - state.cueKeyboardAt < 300;
    if (!duplicate) return false;
    state.cueKeyboardAction = "";
    state.cueKeyboardAt = -Infinity;
    return true;
  }

  function releasePointerCaptureSafely(button, pointerId) {
    try {
      if (button.hasPointerCapture?.(pointerId)) button.releasePointerCapture(pointerId);
    } catch {
      // Capture can already be gone after pointerup/lostpointercapture.
    }
  }

  function bindControl(button, action) {
    if (action === "jump") {
      let pointerGame = null;
      let pointerToken = null;
      let pointerId = null;
      let pointerDirect = false;
      button.addEventListener("pointerdown", (event) => {
        if (!state?.playing || state.paused) return;
        event.preventDefault();
        if (pointerId !== null) return;
        button.setPointerCapture?.(event.pointerId);
        cancelJumpActivationTimer(state);
        pointerGame = state.game;
        pointerToken = { pointerId: event.pointerId, game: pointerGame };
        pointerId = event.pointerId;
        pointerDirect = !activateJumpCue(pointerGame, pointerToken);
        if (pointerDirect) pointerGame.pressJump();
        button.classList.add("pressed");
      });
      const resetPointer = () => {
        pointerGame = null;
        pointerToken = null;
        pointerId = null;
        pointerDirect = false;
        button.classList.remove("pressed");
      };
      const release = (event) => {
        if (pointerId === null || event.pointerId !== pointerId) return;
        const capturedPointerId = pointerId;
        if (pointerDirect) pointerGame?.releaseJump();
        resetPointer();
        if (capturedPointerId !== null) releasePointerCaptureSafely(button, capturedPointerId);
      };
      const cancel = (event) => {
        if (pointerId === null || event.pointerId !== pointerId) return;
        if (pointerGame && pointerDirect) {
          if (typeof pointerGame.cancelJump === "function") pointerGame.cancelJump();
          else pointerGame.releaseJump();
        } else if (pointerToken) {
          cancelOwnedPendingJump(pointerToken);
        }
        resetPointer();
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", cancel);
      button.addEventListener("lostpointercapture", cancel);
      button.addEventListener("click", (event) => {
        if (event.detail !== 0) return;
        if (!state?.playing || state.paused) return;
        if (isDuplicateCueKeyboardClick("jump")) return;
        cancelJumpActivationTimer(state);
        const game = state.game;
        if (activateJumpCue(game)) return;
        game.pressJump();
        const owner = state;
        owner.accessibleJumpTimer = scheduleTransient(() => {
          owner.accessibleJumpTimer = 0;
          if (owner.game === game) game.releaseJump();
        }, ACCESSIBLE_JUMP_MS);
      });
      return;
    }
    let pointerGame = null;
    let pointerId = null;
    const setSlide = (game, active) => {
      game?.setSlide(active);
      button.classList.toggle("pressed", active);
      if (active) startSlideFeedback();
    };
    button.addEventListener("pointerdown", (event) => {
      if (!state?.playing || state.paused) return;
      event.preventDefault();
      if (pointerId !== null) return;
      button.setPointerCapture?.(event.pointerId);
      cancelSlideActivationTimer(state);
      pointerGame = state.game;
      pointerId = event.pointerId;
      if (activateSlideCue(pointerGame)) {
        button.classList.add("pressed");
        startSlideFeedback();
      } else {
        setSlide(pointerGame, true);
      }
    });
    const resetPointer = () => {
      pointerGame = null;
      pointerId = null;
      button.classList.remove("pressed");
    };
    const release = (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const capturedPointerId = pointerId;
      setSlide(pointerGame, false);
      resetPointer();
      releasePointerCaptureSafely(button, capturedPointerId);
    };
    const cancel = (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const capturedPointerId = pointerId;
      if (typeof pointerGame?.cancelSlide === "function") pointerGame.cancelSlide();
      else pointerGame?.setSlide(false);
      resetPointer();
      releasePointerCaptureSafely(button, capturedPointerId);
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", cancel);
    button.addEventListener("pointerleave", cancel);
    button.addEventListener("lostpointercapture", cancel);
    button.addEventListener("click", (event) => {
      if (!state?.playing || state.paused) return;
      if (event.detail !== 0) return;
      if (isDuplicateCueKeyboardClick("slide")) return;
      cancelSlideActivationTimer(state);
      const game = state.game;
      if (activateSlideCue(game)) {
        startSlideFeedback();
        return;
      }
      game.setSlide(true);
      startSlideFeedback();
      const owner = state;
      owner.accessibleSlideTimer = scheduleTransient(() => {
        owner.accessibleSlideTimer = 0;
        if (owner.game === game) game.setSlide(false);
      }, ACCESSIBLE_SLIDE_MS);
    });
  }

  function show(target) {
    [refs.intro, refs.play, refs.result].forEach((screen) => {
      screen.hidden = screen !== target;
    });
  }

  function releaseControls() {
    cancelJumpActivationTimer(state);
    clearPendingJump(state);
    if (typeof state?.game?.cancelJump === "function") state.game.cancelJump();
    else state?.game?.releaseJump();
    cancelSlideActivationTimer(state);
    if (typeof state?.game?.cancelSlide === "function") state.game.cancelSlide();
    else state?.game?.setSlide(false);
    clearSlideFeedback(state);
    refs?.jump.classList.remove("pressed", "queued");
    refs?.slide.classList.remove("pressed");
  }

  function clearTransientTimers(targetState = state) {
    targetState?.transientTimers?.forEach((timer) => global.clearTimeout(timer));
    targetState?.transientTimers?.clear();
    if (targetState) targetState.feedbackTimer = 0;
    if (targetState) targetState.feedbackLockedUntil = 0;
    if (targetState) targetState.feedbackExpiresAt = 0;
    if (targetState) targetState.slideFeedbackTimer = 0;
    if (targetState) targetState.accessibleJumpTimer = 0;
    if (targetState) targetState.accessibleSlideTimer = 0;
    if (targetState) targetState.arrivalTimer = 0;
    if (targetState) targetState.playerMotionFxTimer = 0;
    if (targetState) targetState.playerMotionFxEndsAt = 0;
    if (targetState) targetState.playerMotionFxRemaining = 0;
    if (targetState) targetState.zoneChangeTimer = 0;
    if (targetState) targetState.zoneChangeEndsAt = 0;
    if (targetState) targetState.zoneChangeRemaining = 0;
    if (targetState) targetState.pendingJump = null;
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
    if (event.key !== "Tab" || !root || root.hidden || root.hasAttribute("inert")
      || root.getAttribute("aria-hidden") === "true" || state?.paused) return false;
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
      <div class="oe-object oe-${object.kind} oe-${object.type}${source ? " has-art" : ""}" data-object="${object.id}" data-avoid="${object.avoid || ""}" data-motion="${object.motion || "still"}" aria-label="${object.label}">
        ${source ? `<img class="oe-object-art" src="${source}" alt="">` : "<i></i><b></b>"}<span>${object.kind === "item" ? "선택 · " : ""}${object.label}</span>
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
    state.objectArtWorldScale = null;
    course.forEach((object) => {
      const element = state.objectElements.get(object.id);
      const frame = Core.PROP_ART_FRAMING[object.type];
      if (!element?.classList.contains("has-art") || !frame) return;
      const artSize = object.width / frame.alphaWidth;
      element.style.setProperty("--oe-object-art-size", `${artSize}px`);
      element.style.setProperty("--oe-object-art-bottom", `${-artSize * frame.bottomPadding}px`);
    });
  }

  function syncObjectArtWorldScale(course, worldScale) {
    if (state.objectArtWorldScale === worldScale) return;
    state.objectArtWorldScale = worldScale;
    course.forEach((object) => {
      const element = state.objectElements.get(object.id);
      const frame = Core.PROP_ART_FRAMING[object.type];
      if (!element?.classList.contains("has-art") || !frame) return;
      const artSize = object.width / frame.alphaWidth * worldScale;
      element.style.setProperty("--oe-object-art-size", `${artSize}px`);
      element.style.setProperty("--oe-object-art-bottom", `${-artSize * frame.bottomPadding}px`);
    });
  }

  function syncCharacterArt(snapshot) {
    const doyunPose = snapshot.sliding ? "slide" : snapshot.y > 1 ? "jump" : "run";
    const doyunArtId = doyunPose === "run"
      ? gaitArtId(CHARACTER_ART_IDS.doyun.run, CHARACTER_ART_IDS.doyun.runAlt, snapshot, GAIT_PHASE_DELAY_MS.doyun)
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
      ? gaitArtId(CHARACTER_ART_IDS.harin.run, CHARACTER_ART_IDS.harin.runAlt, snapshot, GAIT_PHASE_DELAY_MS.harin)
      : CHARACTER_ART_IDS.harin[harinPose];
    const hasHarinGameArt = Boolean(gameplayArt(harinArtId));
    setCharacterArt(
      refs.harinArt,
      harinArtId,
      CHARACTER_ART_IDS.harin.fallback,
    );
    const hasHarinGait = harinPose === "run" && hasGaitArt(CHARACTER_ART_IDS.harin.runAlt);
    refs.harin.classList.toggle("has-game-art", hasHarinGameArt);
    refs.harin.classList.toggle("has-gait-art", hasHarinGait);
    syncGaitEmphasis(refs.harinArt, harinArtId, hasHarinGait);
    refs.harin.dataset.pose = harinPose;

    const bossCalling = snapshot.elapsed < state.bossCallUntil;
    const bossPose = bossCalling ? "call" : "chase";
    const bossArtId = bossPose === "chase"
      ? gaitArtId(CHARACTER_ART_IDS.boss.chase, CHARACTER_ART_IDS.boss.chaseAlt, snapshot, GAIT_PHASE_DELAY_MS.boss)
      : CHARACTER_ART_IDS.boss[bossPose];
    const hasBossGameArt = Boolean(gameplayArt(bossArtId));
    setCharacterArt(
      refs.bossArt,
      bossArtId,
      CHARACTER_ART_IDS.boss.fallback,
    );
    const hasBossGait = bossPose === "chase" && hasGaitArt(CHARACTER_ART_IDS.boss.chaseAlt);
    refs.boss.classList.toggle("has-game-art", hasBossGameArt);
    refs.boss.classList.toggle("has-gait-art", hasBossGait);
    syncGaitEmphasis(refs.bossArt, bossArtId, hasBossGait);
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
    state.lastTelegraphKey = "";
    state.feedbackTimer = 0;
    state.successStatusUntil = 0;
    state.successStatusText = "";
    state.bossCallUntil = 0;
    state.playerMotionFxTimer = 0;
    state.wasAirborne = false;
    const initialSnapshot = state.game.snapshot();
    state.lastSnapshot = initialSnapshot;
    state.hitStopUntil = 0;
    syncCharacterArt(initialSnapshot);
    buildObjects(initialSnapshot.course, initialSnapshot.length);
    refs.feedback.textContent = "";
    refs.feedback.className = "oe-feedback";
    refs.avoidConfirm.className = "oe-avoid-confirm";
    refs.player.classList.remove("motion-feedback");
    delete refs.player.dataset.motionFx;
    refs.course.classList.remove("has-upcoming");
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
    flushPendingJump();
    const snapshot = state.game.step(dt);
    state.lastSnapshot = snapshot;
    const events = state.game.drainEvents();
    if (snapshot.finished) render(snapshot);
    handleEvents(events, snapshot);
    if (snapshot.finished) return;
    render(snapshot);
    state.frame = requestAnimationFrame(tick);
  }

  function handleEvents(events, snapshot) {
    events.forEach((event) => {
      if (event.type === "jump") {
        triggerPlayerMotionFx("jump", 180);
      } else if (event.type === "collect") {
        const target = refs.items.find((item) => item.dataset.item === event.object.type);
        target?.classList.add("collected");
        feedback(`${ITEM_LABELS[event.object.type]} 확보!`, "collect");
      } else if (event.type === "assist") {
        clearPendingJumpForObject(event.object.id);
        refs.harin.classList.add("assisting");
        feedback("하린이 장애물을 막아줬다!", "assist");
        scheduleTransient(() => refs?.harin.classList.remove("assisting"), 800);
      } else if (event.type === "avoid") {
        clearPendingJumpForObject(event.object.id);
        state.successStatusUntil = snapshot.elapsed + SUCCESS_STATUS_SECONDS;
        state.successStatusText = `✓ ${event.object.avoid === "slide" ? "슬라이드" : "점프"} 성공 · ${event.object.label} 통과`;
        triggerPlayerMotionFx("avoid");
        showAvoidConfirm();
        if (event.object.id === "chair-tutorial") feedback("점프 통과!", "avoid", 1200);
        else if (event.object.id === "drawer-tutorial") feedback("슬라이드 통과!", "avoid", 1200);
      } else if (event.type === "hit") {
        clearPendingJumpForObject(event.object.id);
        state.successStatusUntil = 0;
        state.successStatusText = "";
        if (event.hitCount >= 2) {
          state.bossCallUntil = Math.max(state.bossCallUntil, snapshot.elapsed + 0.28);
        }
        root.classList.add("hit");
        showImpact(event.object, snapshot);
        state.hitStopUntil = prefersReducedMotion() ? 0 : performance.now() + 50;
        const correction = event.object.avoid === "slide" ? "슬라이드가 늦었어요" : "점프가 늦었어요";
        feedback(
          event.hitCount >= 3
            ? `퇴근 위기 · ${event.object.label} 충돌`
            : `${event.object.label} 충돌 · ${correction}`,
          "hit",
          800,
        );
        scheduleTransient(() => root?.classList.remove("hit"), 280);
      } else if (event.type === "finish") {
        finish(event);
      }
    });
  }

  function triggerPlayerMotionFx(type, duration = PLAYER_MOTION_FX_MS) {
    if (!state?.playing || state.paused) return;
    if (state.playerMotionFxTimer) {
      global.clearTimeout(state.playerMotionFxTimer);
      state.transientTimers.delete(state.playerMotionFxTimer);
      state.playerMotionFxTimer = 0;
    }
    refs.player.dataset.motionFx = type;
    refs.player.style.setProperty("--oe-player-motion-fx-ms", `${duration}ms`);
    refs.player.classList.remove("motion-feedback");
    void refs.footfall.offsetWidth;
    refs.player.classList.add("motion-feedback");
    armPlayerMotionFxTimer(duration);
  }

  function armPlayerMotionFxTimer(duration) {
    state.playerMotionFxEndsAt = performance.now() + duration;
    state.playerMotionFxRemaining = 0;
    state.playerMotionFxTimer = scheduleTransient(() => {
      refs.player.classList.remove("motion-feedback");
      delete refs.player.dataset.motionFx;
      state.playerMotionFxTimer = 0;
      state.playerMotionFxEndsAt = 0;
    }, duration);
  }

  function armZoneChangeTimer(duration) {
    state.zoneChangeEndsAt = performance.now() + duration;
    state.zoneChangeRemaining = 0;
    state.zoneChangeTimer = scheduleTransient(() => {
      root?.classList.remove("zone-change");
      state.zoneChangeTimer = 0;
      state.zoneChangeEndsAt = 0;
    }, duration);
  }

  function pauseVisualFxTimers() {
    if (state.playerMotionFxTimer) {
      state.playerMotionFxRemaining = Math.max(0, state.playerMotionFxEndsAt - performance.now());
      global.clearTimeout(state.playerMotionFxTimer);
      state.transientTimers.delete(state.playerMotionFxTimer);
      state.playerMotionFxTimer = 0;
      if (state.playerMotionFxRemaining <= 0) {
        refs.player.classList.remove("motion-feedback");
        delete refs.player.dataset.motionFx;
        state.playerMotionFxEndsAt = 0;
      }
    }
    if (state.zoneChangeTimer) {
      state.zoneChangeRemaining = Math.max(0, state.zoneChangeEndsAt - performance.now());
      global.clearTimeout(state.zoneChangeTimer);
      state.transientTimers.delete(state.zoneChangeTimer);
      state.zoneChangeTimer = 0;
      if (state.zoneChangeRemaining <= 0) {
        root.classList.remove("zone-change");
        state.zoneChangeEndsAt = 0;
      }
    }
  }

  function resumeVisualFxTimers() {
    if (state.playerMotionFxRemaining > 0 && refs.player.classList.contains("motion-feedback")) {
      armPlayerMotionFxTimer(state.playerMotionFxRemaining);
    }
    if (state.zoneChangeRemaining > 0 && root.classList.contains("zone-change")) {
      armZoneChangeTimer(state.zoneChangeRemaining);
    }
  }

  function showAvoidConfirm() {
    refs.avoidConfirm.classList.remove("show");
    void refs.avoidConfirm.offsetWidth;
    refs.avoidConfirm.classList.add("show");
    scheduleTransient(() => refs?.avoidConfirm.classList.remove("show"), 260);
  }

  function showImpact(object, snapshot) {
    if (!object || !snapshot) return;
    const width = refs.course.clientWidth || 1000;
    const worldScale = worldScaleForCourse(width);
    const x = worldToScreenX(snapshot, object.x + object.width * 0.18, width);
    refs.impact.style.setProperty("--oe-impact-x", `${x}px`);
    refs.impact.style.setProperty(
      "--oe-impact-y",
      `${((object.y || 0) + Math.max(18, object.height * 0.45)) * worldScale}px`,
    );
    refs.impact.classList.remove("show");
    void refs.impact.offsetWidth;
    refs.impact.classList.add("show");
    scheduleTransient(() => refs?.impact.classList.remove("show"), 260);
  }

  function feedback(message, type, duration = 1100) {
    refs.feedback.textContent = message;
    refs.feedback.className = `oe-feedback show ${type}`;
    global.clearTimeout(state.feedbackTimer);
    state.transientTimers.delete(state.feedbackTimer);
    state.feedbackLockedUntil = type === "hit"
      ? (state.game?.snapshot().elapsed || 0) + HIT_FEEDBACK_MIN_SECONDS
      : 0;
    state.feedbackExpiresAt = type === "hit"
      ? (state.game?.snapshot().elapsed || 0) + duration / 1000
      : 0;
    if (type === "hit") {
      state.feedbackTimer = 0;
      return;
    }
    state.feedbackTimer = scheduleTransient(() => {
      refs.feedback.className = "oe-feedback";
      refs.feedback.textContent = "";
      state.feedbackTimer = 0;
    }, duration);
  }

  function clearFeedback(type) {
    if (type && !refs.feedback.classList.contains(type)) return;
    if (type === "hit" && (state.game?.snapshot().elapsed || 0) < state.feedbackLockedUntil) return;
    global.clearTimeout(state.feedbackTimer);
    state.transientTimers.delete(state.feedbackTimer);
    state.feedbackTimer = 0;
    state.feedbackLockedUntil = 0;
    state.feedbackExpiresAt = 0;
    refs.feedback.className = "oe-feedback";
    refs.feedback.textContent = "";
  }

  function render(snapshot) {
    const width = refs.course.clientWidth || 1000;
    const shortLandscape = width <= 900 && refs.course.clientHeight <= 220;
    const compact = width <= 850 || shortLandscape;
    const phonePortrait = width <= 480 && refs.course.clientHeight >= 600;
    const playerX = playerScreenX(width);
    const worldScale = shortLandscape ? SHORT_LANDSCAPE_WORLD_SCALE : 1;
    syncObjectArtWorldScale(snapshot.course, worldScale);
    const courseDrawScale = Math.min(1, snapshot.length / Core.DEFAULT_LENGTH);
    const objectDrawAhead = Math.max(360, OBJECT_DRAW_AHEAD * courseDrawScale);
    const landmarkDrawAhead = Math.max(720, LANDMARK_DRAW_AHEAD * courseDrawScale);
    const finishDrawAhead = Math.max(720, FINISH_DRAW_AHEAD * courseDrawScale);
    const landmarkDrawBehind = Math.max(200, 1200 * courseDrawScale);
    const dangerLevel = Math.min(3, snapshot.hitCount);
    const harinX = phonePortrait ? width * 0.143 : playerX - (compact ? 102 : 152);
    const dangerThreePhone = phonePortrait && dangerLevel === 3;
    const bossX = phonePortrait
      ? dangerThreePhone
        ? harinX - 54
        : Math.min(width * 0.154, width * 0.065 + dangerLevel * 11)
      : compact
      ? Math.max(-42, playerX - 178 + dangerLevel * 28)
      : Math.max(-26, playerX - 246 + dangerLevel * 38);

    root.dataset.zone = snapshot.zone.id;
    const airborne = snapshot.y > 1;
    if (state.wasAirborne && !airborne && !snapshot.finished) triggerPlayerMotionFx("land");
    state.wasAirborne = airborne;
    refs.player.classList.toggle("jumping", airborne);
    refs.player.classList.toggle("sliding", snapshot.sliding);
    refs.player.classList.toggle("invulnerable", snapshot.invulnerable > 0);
    syncCharacterArt(snapshot);
    const tinyPhone = phonePortrait && width < 360;
    const playerScale = shortLandscape ? worldScale : phonePortrait ? (tinyPhone ? 0.68 : 0.74) : compact ? 0.84 : 1;
    const harinScale = shortLandscape ? worldScale : phonePortrait ? (tinyPhone ? 0.42 : 0.46) : compact ? 0.72 : 1;
    const bossScale = shortLandscape ? worldScale : phonePortrait ? (tinyPhone ? 0.34 : 0.38) : compact ? 0.74 : 1;
    refs.player.style.transform = `translate3d(${playerX}px, ${-snapshot.y * worldScale}px, 0) scale(${playerScale})`;
    refs.harin.style.transform = `translate3d(${harinX}px, 0, 0) scale(${harinScale})`;
    refs.boss.style.transform = `translate3d(${bossX}px, 0, 0) scale(${bossScale})`;
    refs.danger.textContent = dangerLevel === 0 ? "안전" : dangerLevel === 1 ? "접근 중" : dangerLevel === 2 ? "바로 뒤" : "퇴근 위기";
    refs.danger.parentElement.dataset.level = String(dangerLevel);
    refs.course.dataset.dangerLevel = String(dangerLevel);

    refs.progress.style.width = `${snapshot.progress * 100}%`;
    refs.percent.textContent = String(Math.round(snapshot.progress * 100));
    const remainingSeconds = Math.max(0, Math.ceil((1 - snapshot.progress) * snapshot.duration));
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingRemainder = remainingSeconds % 60;
    refs.remaining.textContent = `${String(remainingMinutes).padStart(2, "0")}:${String(remainingRemainder).padStart(2, "0")}`;
    refs.remaining.setAttribute("aria-label", `남은 시간 ${remainingMinutes}분 ${remainingRemainder}초`);
    refs.itemCount.textContent = `수집 ${snapshot.collectedItems.length}/3`;
    refs.itemCount.setAttribute("aria-label", `수집 ${snapshot.collectedItems.length} / 3`);
    if (refs.feedback.classList.contains("hit")
      && snapshot.elapsed >= state.feedbackExpiresAt) clearFeedback("hit");
    const fullPlaceLabel = currentPlaceLabel(snapshot);
    refs.currentZone.textContent = currentPlaceLabel(snapshot, global.innerWidth <= 1020);
    refs.currentZone.setAttribute("aria-label", `현재 장소: ${fullPlaceLabel}`);
    refs.zones.forEach((zone) => zone.classList.toggle("active", zone.dataset.zone === snapshot.zone.id));
    refs.backdrops.forEach((backdrop) => backdrop.classList.toggle("active", backdrop.dataset.zone === snapshot.zone.id));
    refs.course.style.setProperty("--oe-far-x", `${-((snapshot.distance * 0.15) % 1600)}px`);
    refs.course.style.setProperty("--oe-mid-x", `${-((snapshot.distance * 0.4) % 720)}px`);
    refs.course.style.setProperty("--oe-near-x", `${-(snapshot.distance % 176)}px`);
    refs.course.style.setProperty("--oe-backdrop-x", `${-((snapshot.distance * 0.025) % 90)}px`);

    let visibleLandmarkCount = 0;
    state.landmarks.forEach((landmark) => {
      const element = state.landmarkElements.get(landmark.id);
      if (!element) return;
      const worldDelta = landmark.x - snapshot.distance;
      const x = worldToScreenX(snapshot, landmark.x, width);
      const visible = worldDelta > -landmarkDrawBehind && worldDelta <= landmarkDrawAhead
        && x > -260 && x < width + 380
        && visibleLandmarkCount < MAX_VISIBLE_LANDMARKS;
      element.hidden = !visible;
      if (!visible) return;
      visibleLandmarkCount += 1;
      const approach = clamp(1 - Math.max(0, x - width * 0.65) / Math.max(1, width * 0.85), 0, 1);
      const scale = 0.88 + approach * 0.12;
      element.classList.toggle("passing", Math.abs(x - playerX) <= 72);
      element.style.transform = `translate3d(${x}px, 0, 0) scale(${scale * worldScale})`;
    });

    const finishX = worldToScreenX(snapshot, snapshot.length * 0.985, width);
    const finishDelta = snapshot.length * 0.985 - snapshot.distance;
    refs.finish.hidden = finishDelta > finishDrawAhead || finishX < -180 || finishX > width + 420;
    if (!refs.finish.hidden) refs.finish.style.transform = `translate3d(${finishX}px, 0, 0) scale(${worldScale})`;

    snapshot.course.forEach((object) => {
      const element = state.objectElements.get(object.id);
      if (!element) return;
      const worldDelta = object.x - snapshot.distance;
      const x = worldToScreenX(snapshot, object.x, width);
      const visible = worldDelta <= objectDrawAhead
        && x > -220 && x < width + 360 && !snapshot.resolved.has(object.id);
      element.hidden = !visible;
      if (!visible) return;
      const approach = clamp(1 - Math.max(0, x - width * 0.62) / Math.max(1, width * 0.82), 0, 1);
      const scale = 0.8 + approach * 0.2;
      element.style.width = `${object.width * worldScale}px`;
      element.style.height = `${object.height * worldScale}px`;
      element.style.transform = `translate3d(${x}px, ${-(object.y || 0) * worldScale}px, 0) scale(${scale})`;
    });

    const upcoming = snapshot.upcomingHazard;
    const itemCueDistance = Math.max(280, 620 * courseDrawScale);
    const upcomingItem = snapshot.course.find((object) => object.kind === "item"
      && !snapshot.resolved.has(object.id)
      && object.x >= snapshot.distance
      && object.x - snapshot.distance <= itemCueDistance);
    refs.course.classList.toggle("has-upcoming", Boolean(upcoming));
    refs.course.classList.toggle("has-upcoming-item", Boolean(upcomingItem) && !upcoming);
    const telegraphPhase = upcoming?.telegraphPhase || "prepare";
    const jumpTapReady = canQueueJump(upcoming);
    const pendingJump = pendingJumpFor(upcoming);
    const jumpQueueStatus = pendingJump?.status || "";
    const jumpQueued = jumpQueueStatus === "queued";
    const jumpExecuted = jumpQueueStatus === "executed";
    const slideCueTapReady = upcoming?.avoid === "slide" && telegraphPhase === "act";
    const cueTapReady = jumpTapReady || slideCueTapReady;
    const earlyJumpTap = jumpTapReady && telegraphPhase === "prepare";
    const firstComboPrepare = upcoming?.id === "chair-pair-a" && telegraphPhase === "prepare";
    if (upcoming && telegraphPhase === "prepare") clearFeedback("hit");
    refs.jump.classList.toggle("queued", Boolean(pendingJump));
    if (jumpQueueStatus) refs.jump.dataset.queueStatus = jumpQueueStatus;
    else delete refs.jump.dataset.queueStatus;
    refs.jumpLabel.textContent = jumpQueued
      ? "입력 완료 ✓"
      : jumpExecuted
        ? "점프 실행 ✓"
        : jumpTapReady
          ? telegraphPhase === "act" ? "점프 · 지금 탭" : "점프 · 미리 탭"
          : "점프 · 길게";
    refs.slideLabel.textContent = slideCueTapReady ? "슬라이드 · 지금 탭" : "슬라이드 · 길게";
    refs.telegraph.hidden = !upcoming;
    state.objectElements.forEach((element, id) => {
      element.classList.toggle("telegraphed", id === upcoming?.id);
      element.classList.toggle("action-ready", id === upcoming?.id && telegraphPhase === "act");
      element.classList.toggle("collectible-cue", !upcoming && id === upcomingItem?.id);
    });
    if (upcoming) {
      const upcomingX = worldToScreenX(snapshot, upcoming.x + upcoming.width * 0.5, width);
      const telegraphKey = `${upcoming.id}:${telegraphPhase}:${upcoming.jumpQueueReady ? "queue" : "wait"}:${cueTapReady ? "tap" : "hold"}:${jumpQueueStatus || "idle"}`;
      if (state.lastTelegraphKey !== telegraphKey) {
        const isSlide = upcoming.avoid === "slide";
        const actionCopy = !isSlide || slideCueTapReady ? "지금 탭" : "지금 길게";
        refs.telegraph.innerHTML = jumpQueued
          ? '<i aria-hidden="true">✓</i><b>입력 완료</b>'
          : jumpExecuted
            ? '<i aria-hidden="true">✓</i><b>점프 실행</b>'
          : telegraphPhase === "act"
          ? isSlide
            ? `<i aria-hidden="true">↓</i><b>${actionCopy}</b>`
            : `<i aria-hidden="true">↑</i><b>${actionCopy}</b>`
          : isSlide
            ? '<i aria-hidden="true">○</i><b>슬라이드 준비</b>'
            : earlyJumpTap
              ? '<i aria-hidden="true">○</i><b>미리 탭</b>'
              : firstComboPrepare
                ? '<i aria-hidden="true">○</i><b>점프 후 ↓</b>'
              : '<i aria-hidden="true">○</i><b>점프 준비</b>';
        refs.telegraph.setAttribute(
          "aria-label",
          jumpQueued
            ? "입력 완료, 알맞을 때 점프합니다"
            : jumpExecuted
              ? "점프 실행 중"
            : telegraphPhase === "act"
            ? isSlide
              ? slideCueTapReady ? "지금 슬라이드, 탭하세요" : "지금 슬라이드, 길게 누르세요"
              : "지금 점프, 탭하세요"
            : isSlide
              ? "슬라이드 준비"
              : earlyJumpTap
                ? "미리 탭하세요, 알맞을 때 점프합니다"
                : firstComboPrepare ? "첫 연속, 점프 뒤 슬라이드" : "점프 준비",
        );
        state.lastTelegraphKey = telegraphKey;
      }
      refs.telegraph.dataset.action = upcoming.avoid;
      refs.telegraph.dataset.phase = telegraphPhase;
      refs.telegraph.dataset.tapReady = cueTapReady ? "true" : "false";
      if (jumpQueueStatus) refs.telegraph.dataset.queueStatus = jumpQueueStatus;
      else delete refs.telegraph.dataset.queueStatus;
      refs.telegraph.style.setProperty("--oe-telegraph-x", `${upcomingX}px`);
      refs.telegraph.style.setProperty(
        "--oe-telegraph-y",
        `${((upcoming.y || 0) + upcoming.height) * worldScale + 22}px`,
      );
    } else {
      state.lastTelegraphKey = "";
      refs.telegraph.removeAttribute("aria-label");
      delete refs.telegraph.dataset.phase;
      delete refs.telegraph.dataset.tapReady;
      delete refs.telegraph.dataset.queueStatus;
    }
    refs.status.textContent = upcoming
      ? jumpQueued
        ? "입력 완료 ✓ · 알맞을 때 점프합니다"
        : jumpExecuted
          ? "점프 실행 중"
        : telegraphPhase === "act"
        ? upcoming.avoid === "slide"
          ? slideCueTapReady ? "지금 슬라이드 · 탭하세요" : "지금 슬라이드 · 길게 누르세요"
          : "지금 점프 · 탭하세요"
        : earlyJumpTap
          ? "미리 탭하세요 · 알맞을 때 점프합니다"
          : upcoming.id === "chair-pair-a"
            ? "첫 연속: 점프 뒤 슬라이드"
          : `${upcoming.label} 접근 · ${upcoming.avoid === "slide" ? "슬라이드 준비" : "점프 준비"}`
      : upcomingItem
        ? `선택 수집물 · 점프로 ${upcomingItem.label} 획득`
      : snapshot.zone.id === "office"
        ? "하린과 함께 사무실을 빠져나가는 중"
        : snapshot.zone.id === "corridor"
          ? "복합기 복도 · 서랍과 케이블 조심!"
          : "엘리베이터가 보여요. 마지막까지 집중!";
    const showSuccessStatus = Boolean(state.successStatusText
      && snapshot.elapsed < state.successStatusUntil
      && !pendingJump
      && !(upcoming && telegraphPhase === "act"));
    if (showSuccessStatus) refs.status.textContent = state.successStatusText;
    refs.status.classList.toggle("success", showSuccessStatus);

    renderDebugGeometry(snapshot, width, objectDrawAhead, worldScale);

    if (snapshot.zone.id !== state.lastZone) {
      state.lastZone = snapshot.zone.id;
      refs.course.dataset.zoneEnter = ZONE_ENTRY_LABELS[snapshot.zone.id] || ZONE_LABELS[snapshot.zone.id];
      refs.course.dataset.zonePace = snapshot.zone.pace || "";
      root.classList.remove("zone-change");
      void refs.course.offsetWidth;
      root.classList.add("zone-change");
      if (state.zoneChangeTimer) {
        global.clearTimeout(state.zoneChangeTimer);
        state.transientTimers.delete(state.zoneChangeTimer);
      }
      armZoneChangeTimer(ZONE_CHANGE_FX_MS);
    }
  }

  function renderDebugGeometry(snapshot, width, objectDrawAhead, worldScale) {
    refs.debugGeometry.hidden = !state.showHitboxes;
    if (!state.showHitboxes) {
      refs.debugGeometry.replaceChildren();
      return;
    }
    const boxes = [{ kind: "player", label: "PLAYER", rect: snapshot.playerRect }];
    snapshot.activeObjects.forEach((object) => {
      if (object.visibleRect.x - snapshot.distance > objectDrawAhead) return;
      const screenX = worldToScreenX(snapshot, object.visibleRect.x, width);
      if (screenX < -220 || screenX > width + 360) return;
      boxes.push({ kind: "visible", label: object.type, rect: object.visibleRect });
      boxes.push({
        kind: object.kind === "item" ? "collection" : "collision",
        label: object.kind === "item" ? "PICKUP" : "HIT",
        rect: object.collisionRect,
      });
    });
    refs.debugGeometry.innerHTML = boxes.map(({ kind, label, rect }) => {
      const x = worldToScreenX(snapshot, rect.x, width);
      return `<i class="oe-debug-box ${kind}" style="--oe-box-x:${x}px;--oe-box-y:${rect.y * worldScale}px;--oe-box-w:${rect.width * worldScale}px;--oe-box-h:${rect.height * worldScale}px"><span>${label}</span></i>`;
    }).join("");
  }

  function finish(result) {
    if (!state?.playing) return;
    state.playing = false;
    cancelAnimationFrame(state.frame);
    releaseControls();
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
    refs.telegraph.hidden = true;
    refs.telegraph.removeAttribute("aria-label");
    delete refs.telegraph.dataset.phase;
    state.lastTelegraphKey = "";
    state.objectElements.forEach((element) => element.classList.remove("telegraphed", "action-ready"));
    refs.status.textContent = "엘리베이터에 도착했습니다";
    root.classList.add("arrival");
    feedback("엘리베이터 도착!", "arrival", ARRIVAL_MS);
    state.arrivalTimer = scheduleTransient(() => {
      state.arrivalTimer = 0;
      root.classList.remove("arrival");
      show(refs.result);
      refs.continue.focus();
    }, ARRIVAL_MS);
  }

  function complete() {
    const callback = state?.onComplete;
    const result = state?.result;
    const returnFocus = state?.returnFocus;
    clearTransientTimers();
    releaseControls();
    root.hidden = true;
    root.setAttribute("inert", "");
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
      objectArtWorldScale: 0,
      landmarkElements: new Map(),
      landmarks: [],
      feedbackTimer: 0,
      feedbackLockedUntil: 0,
      feedbackExpiresAt: 0,
      successStatusUntil: 0,
      successStatusText: "",
      bossCallUntil: 0,
      hitStopUntil: 0,
      failedArtSources: new Set(),
      lastSnapshot: null,
      showHitboxes: devMode && options.showHitboxes === true,
      transientTimers: new Set(),
      slideFeedbackTimer: 0,
      accessibleJumpTimer: 0,
      accessibleSlideTimer: 0,
      arrivalTimer: 0,
      playerMotionFxTimer: 0,
      playerMotionFxEndsAt: 0,
      playerMotionFxRemaining: 0,
      zoneChangeTimer: 0,
      zoneChangeEndsAt: 0,
      zoneChangeRemaining: 0,
      wasAirborne: false,
      pendingJump: null,
      cueKeyboardAction: "",
      cueKeyboardAt: -Infinity,
      lastTelegraphKey: "",
      returnFocus,
    };
    root.classList.remove("paused", "hit", "zone-change", "arrival");
    root.classList.toggle("show-hitboxes", state.showHitboxes);
    refs.debugGeometry.hidden = !state.showHitboxes;
    refs.debugGeometry.replaceChildren();
    refs.impact.classList.remove("show");
    refs.harin.classList.remove("assisting");
    refs.player.classList.remove("slide-feedback", "motion-feedback");
    delete refs.player.dataset.motionFx;
    refs.jump.classList.remove("pressed", "queued");
    refs.slide.classList.remove("pressed", "tap-feedback");
    preloadCharacterArt();
    syncIntroArt();
    show(refs.intro);
    document.documentElement.classList.add("office-escape-open");
    root.hidden = false;
    root.removeAttribute("inert");
    root.setAttribute("aria-hidden", "false");
    refs.start.focus();
    if (devMode && options.autoStart) begin();
  }

  function pause() {
    if (root && !root.hidden) {
      root.setAttribute("inert", "");
      root.setAttribute("aria-hidden", "true");
    }
    if (!state?.playing || state.paused) return;
    state.paused = true;
    cancelAnimationFrame(state.frame);
    pauseVisualFxTimers();
    releaseControls();
    root.classList.add("paused");
  }

  function resume() {
    if (root && !root.hidden) {
      root.removeAttribute("inert");
      root.setAttribute("aria-hidden", "false");
    }
    if (!state?.playing || !state.paused) return;
    state.paused = false;
    state.lastAt = performance.now();
    resumeVisualFxTimers();
    root.classList.remove("paused");
    state.frame = requestAnimationFrame(tick);
  }

  function debugSnapshot() {
    return state?.game?.snapshot() || null;
  }

  function renderPausedLayout() {
    if (!state?.playing || !state.paused || !state.lastSnapshot || !refs?.course) return;
    render(state.lastSnapshot);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && trapFocus(event)) return;
    if (root?.hidden || !state?.playing || state.paused) return;
    if (event.code === "Space" && refs.slide.contains(event.target)) return;
    if (JUMP_KEYS.has(event.code)) {
      event.preventDefault();
      if (!event.repeat) {
        cancelJumpActivationTimer(state);
        if (!activateJumpCue(state.game)) state.game.pressJump();
        markCueKeyboardActivation("jump");
      }
      refs.jump.classList.add("pressed");
    } else if (SLIDE_KEYS.has(event.code)) {
      event.preventDefault();
      if (!event.repeat) {
        cancelSlideActivationTimer(state);
        if (!activateSlideCue(state.game)) state.game.setSlide(true);
        markCueKeyboardActivation("slide");
        startSlideFeedback();
      }
      refs.slide.classList.add("pressed");
    }
  });
  document.addEventListener("keyup", (event) => {
    if (JUMP_KEYS.has(event.code)) {
      if (state?.cueKeyboardAction === "jump") state.cueKeyboardAt = global.performance.now();
      state?.game?.releaseJump();
      refs?.jump.classList.remove("pressed");
    } else if (SLIDE_KEYS.has(event.code)) {
      if (state?.cueKeyboardAction === "slide") state.cueKeyboardAt = global.performance.now();
      state?.game?.setSlide(false);
      refs?.slide.classList.remove("pressed");
    }
  });
  global.addEventListener("blur", releaseControls);
  global.addEventListener("resize", renderPausedLayout);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseControls();
  });
  document.addEventListener("nan:settings-open", pause);
  document.addEventListener("nan:settings-close", resume);
  document.addEventListener("nan:pause-open", pause);
  document.addEventListener("nan:pause-close", resume);

  global.OfficeEscapeMinigame = Object.freeze({ start, pause, resume, debugSnapshot });
})(typeof globalThis !== "undefined" ? globalThis : this);
