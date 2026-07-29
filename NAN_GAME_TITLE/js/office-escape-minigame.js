(function initOfficeEscape(global) {
  "use strict";
  if (!global.document) return;

  let root;
  let refs;
  let state;
  const keys = new Set();
  const COURSE_LENGTH = 2600;
  const OBSTACLES = Object.freeze([
    { x: 430, w: 70, h: 42, type: "chair", label: "의자" },
    { x: 790, w: 100, h: 28, type: "cable", label: "케이블" },
    { x: 1160, w: 82, h: 55, type: "files", label: "서류함" },
    { x: 1510, w: 120, h: 34, type: "cart", label: "카트" },
    { x: 1910, w: 84, h: 48, type: "printer", label: "복합기" },
    { x: 2260, w: 110, h: 32, type: "papers", label: "서류 더미" },
  ]);

  function ensureRoot() {
    if (root?.isConnected) return;
    root = document.createElement("section");
    root.className = "office-escape";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="oe-shell" role="dialog" aria-modal="true" aria-labelledby="oe-title">
        <header><div><small>DAY 4 · OFFICE ESCAPE</small><h2 id="oe-title">정시 퇴근 작전</h2></div><div class="oe-progress"><span>엘리베이터까지</span><div><i id="oe-progress-bar"></i></div><b><em id="oe-distance">0</em>%</b></div></header>
        <section id="oe-intro" class="oe-screen oe-intro">
          <div class="oe-intro-scene" aria-hidden="true"><div class="oe-intro-office"></div><i>한</i><span>→</span><strong>박</strong><b>17:58</b></div>
          <p>방향키로 이동하고 <kbd>SPACE</kbd>로 장애물을 뛰어넘으세요. 뒤에서 따라오는 박태식 부장에게 닿으면 추가 업무에 붙잡힙니다.</p>
          <button id="oe-start" type="button">퇴근 시작</button>
        </section>
        <section id="oe-play" class="oe-screen" hidden>
          <div class="oe-course" id="oe-course">
            <div class="oe-world" id="oe-world">
              <div class="oe-office-backdrop" aria-hidden="true"></div>
              <div class="oe-office-desks" aria-hidden="true"></div>
              <div class="oe-finish"><i></i><b>1F</b><span>↑</span></div>
              <div class="oe-obstacles" id="oe-obstacles"></div>
              <div class="oe-boss" id="oe-boss"><b>박</b><span>한도윤 씨, 잠깐만!</span></div>
              <div class="oe-player" id="oe-player"><b>한</b></div>
            </div>
          </div>
          <p id="oe-status" role="status">엘리베이터까지 달리세요!</p>
          <div class="oe-controls"><span>← → 이동</span><span>SPACE 점프</span></div>
        </section>
        <section id="oe-result" class="oe-screen oe-result" hidden>
          <small>ESCAPE RESULT</small><h3 id="oe-result-title"></h3><p id="oe-result-copy"></p>
          <button id="oe-continue" type="button">스토리 계속하기</button>
        </section>
      </div>`;
    document.body.appendChild(root);
    refs = {
      intro: root.querySelector("#oe-intro"), play: root.querySelector("#oe-play"), result: root.querySelector("#oe-result"),
      start: root.querySelector("#oe-start"), distance: root.querySelector("#oe-distance"), progressBar: root.querySelector("#oe-progress-bar"), world: root.querySelector("#oe-world"),
      course: root.querySelector("#oe-course"), obstacles: root.querySelector("#oe-obstacles"), player: root.querySelector("#oe-player"),
      boss: root.querySelector("#oe-boss"), status: root.querySelector("#oe-status"), resultTitle: root.querySelector("#oe-result-title"),
      resultCopy: root.querySelector("#oe-result-copy"), continue: root.querySelector("#oe-continue"),
    };
    refs.start.onclick = begin;
    refs.continue.onclick = complete;
    refs.obstacles.innerHTML = OBSTACLES.map((item) => `<div class="oe-obstacle oe-${item.type}" style="left:${item.x}px;width:${item.w}px;height:${item.h}px" role="img" aria-label="${item.label}"><i></i><b></b><span>${item.label}</span></div>`).join("");
  }

  function show(target) {
    [refs.intro, refs.play, refs.result].forEach((screen) => { screen.hidden = screen !== target; });
  }

  function finish(caught) {
    if (!state || state.done) return;
    state.done = true;
    cancelAnimationFrame(state.frame);
    const elapsed = (performance.now() - state.startedAt) / 1000;
    const grade = caught ? "caught" : elapsed <= 20 ? "perfect" : "close";
    state.result = { grade, caught, elapsed: Math.round(elapsed * 10) / 10, distance: Math.round(state.playerX) };
    refs.resultTitle.textContent = caught ? "부장님에게 붙잡혔습니다" : grade === "perfect" ? "완벽한 정시 퇴근!" : "아슬아슬하게 탈출!";
    refs.resultCopy.textContent = caught
      ? "10분짜리 추가 확인 업무를 마친 뒤 하린과 같은 엘리베이터를 탔습니다."
      : grade === "perfect" ? "박태식의 시야를 벗어나 하린과 바로 엘리베이터에 탔습니다." : "마지막 말풍선을 피해 하린과 함께 엘리베이터에 도착했습니다.";
    show(refs.result);
    refs.continue.focus();
  }

  function obstacleCollision(nextX, y) {
    if (y > 35) return null;
    return OBSTACLES.find((item) => nextX + 34 > item.x && nextX < item.x + item.w);
  }

  function tick(now) {
    if (!state || state.done || state.paused) return;
    const dt = Math.min(0.04, (now - state.lastAt) / 1000);
    state.lastAt = now;
    let direction = 0;
    if (keys.has("ArrowRight")) direction += 1;
    if (keys.has("ArrowLeft")) direction -= 1;
    const speed = 260;
    const nextX = Math.max(0, Math.min(COURSE_LENGTH, state.playerX + direction * speed * dt));
    if (!obstacleCollision(nextX, state.jumpY)) state.playerX = nextX;
    if (keys.has("Space") && state.jumpY === 0) state.velocityY = 510;
    state.velocityY -= 1200 * dt;
    state.jumpY = Math.max(0, state.jumpY + state.velocityY * dt);
    if (state.jumpY === 0) state.velocityY = 0;
    state.bossX += (112 + Math.min(65, (now - state.startedAt) / 450)) * dt;
    if (state.playerX - state.bossX > 520) state.bossX += 90 * dt;
    if (state.bossX + 42 >= state.playerX && state.playerX > 45) return finish(true);
    if (state.playerX >= COURSE_LENGTH) return finish(false);
    const cameraX = Math.max(0, Math.min(COURSE_LENGTH - refs.course.clientWidth + 120, state.playerX - 260));
    refs.world.style.transform = `translateX(${-cameraX}px)`;
    refs.player.style.transform = `translate(${state.playerX}px, ${-state.jumpY}px)`;
    refs.boss.style.transform = `translateX(${state.bossX}px)`;
    refs.distance.textContent = String(Math.min(100, Math.round((state.playerX / COURSE_LENGTH) * 100)));
    refs.progressBar.style.width = `${Math.min(100, (state.playerX / COURSE_LENGTH) * 100)}%`;
    const danger = state.playerX - state.bossX < 180;
    refs.status.textContent = danger ? "위험! 부장님이 바로 뒤까지 따라왔습니다." : "엘리베이터까지 달리세요!";
    refs.status.classList.toggle("danger", danger);
    state.frame = requestAnimationFrame(tick);
  }

  function begin() {
    keys.clear();
    const now = performance.now();
    state = { onComplete: state?.onComplete, playerX: 120, bossX: -80, jumpY: 0, velocityY: 0, startedAt: now, lastAt: now, frame: 0, done: false, paused: false, result: null };
    refs.world.style.width = `${COURSE_LENGTH + 300}px`;
    refs.world.style.transform = "translateX(0)";
    refs.distance.textContent = "0";
    refs.progressBar.style.width = "0%";
    show(refs.play);
    root.focus();
    state.frame = requestAnimationFrame(tick);
  }

  function complete() {
    const callback = state.onComplete;
    const result = state.result;
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    callback?.(result);
  }

  function start(options = {}) {
    ensureRoot();
    state = { onComplete: options.onComplete, done: true };
    show(refs.intro);
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    refs.start.focus();
  }

  function pause() {
    if (!state || state.done || state.paused) return;
    state.paused = true;
    cancelAnimationFrame(state.frame);
  }

  function resume() {
    if (!state?.paused || state.done) return;
    state.paused = false;
    state.lastAt = performance.now();
    state.frame = requestAnimationFrame(tick);
  }

  document.addEventListener("keydown", (event) => {
    if (root?.hidden || !["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) return;
    event.preventDefault();
    keys.add(event.code);
  });
  document.addEventListener("keyup", (event) => keys.delete(event.code));
  document.addEventListener("nan:settings-open", pause);
  document.addEventListener("nan:settings-close", resume);
  document.addEventListener("nan:pause-open", pause);
  document.addEventListener("nan:pause-close", resume);

  global.OfficeEscapeMinigame = Object.freeze({ start, pause, resume });
})(typeof globalThis !== "undefined" ? globalThis : this);
