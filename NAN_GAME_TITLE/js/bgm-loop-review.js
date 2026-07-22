(function () {
  const names = {
    title: "1. 기본 테마",
    daily: "2. 일상",
    harin: "3. 서하린과의 일상",
    overtime: "4. 야근",
    mystery: "5. 추리",
    minigame: "미니게임 테마",
    happyEnding: "해피 엔딩",
    middleEnding: "중간 엔딩",
    badEnding: "배드 엔딩",
  };
  const tracks = Object.entries(GameBgmTracks).filter(([, track]) => track);

  const select = document.querySelector("#track");
  const statusTitle = document.querySelector("#status-title");
  const statusDetail = document.querySelector("#status-detail");
  const phase = document.querySelector("#phase");
  const meter = document.querySelector("#meter");
  const buttons = [...document.querySelectorAll("button")];
  let context;
  let source;
  let htmlAudio;
  let stopTimer;
  let meterFrame;
  const buffers = new Map();

  select.innerHTML = tracks.map(([id]) => `<option value="${id}">${names[id]}</option>`).join("");

  function stop(message = "정지했습니다.") {
    clearTimeout(stopTimer);
    cancelAnimationFrame(meterFrame);
    if (source) {
      try { source.stop(); } catch (_error) {}
      source.disconnect();
      source = null;
    }
    if (htmlAudio) {
      htmlAudio.pause();
      htmlAudio = null;
    }
    meter.style.width = "0";
    phase.textContent = "재생 대기 중";
    phase.classList.remove("flash");
    statusTitle.textContent = message;
  }

  async function load(track) {
    if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
    context.resume().catch(() => {});
    if (!buffers.has(track.source)) {
      buffers.set(track.source, fetch(track.source)
        .then((response) => {
          if (!response.ok) throw new Error("음원 파일을 불러오지 못했습니다.");
          return response.arrayBuffer();
        })
        .then((data) => context.decodeAudioData(data)));
    }
    return buffers.get(track.source);
  }

  function showProgress(duration, boundaryAt = null) {
    const startedAt = performance.now();
    let boundaryShown = false;
    const update = (now) => {
      const elapsed = (now - startedAt) / 1000;
      meter.style.width = `${Math.min(100, elapsed / duration * 100)}%`;
      if (boundaryAt !== null && elapsed < boundaryAt) {
        phase.textContent = `루프 전환까지 ${(boundaryAt - elapsed).toFixed(1)}초`;
      } else if (boundaryAt !== null && !boundaryShown) {
        boundaryShown = true;
        phase.textContent = "지금 루프 시작점으로 전환됐습니다";
        phase.classList.remove("flash");
        void phase.offsetWidth;
        phase.classList.add("flash");
      } else if (boundaryAt !== null && elapsed >= boundaryAt + 1) {
        phase.textContent = `루프 시작 후 ${(elapsed - boundaryAt).toFixed(1)}초`;
        phase.classList.remove("flash");
      } else if (boundaryAt === null) {
        phase.textContent = `재생 중 · ${elapsed.toFixed(1)}초`;
      }
      if (elapsed < duration) meterFrame = requestAnimationFrame(update);
    };
    meterFrame = requestAnimationFrame(update);
  }

  async function playWebAudio(mode) {
    stop("음원을 준비하고 있습니다…");
    buttons.forEach((button) => { button.disabled = true; });
    const [id, track] = tracks.find(([trackId]) => trackId === select.value);
    try {
      const buffer = await load(track);
      source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      let offset = 0;
      let duration = Math.min(15, buffer.duration);
      if (mode === "seam") {
        offset = Math.max(track.loopStart, buffer.duration - 5);
        duration = Math.min(13, 5 + buffer.duration - track.loopStart);
        source.loop = true;
        source.loopStart = track.loopStart;
        source.loopEnd = buffer.duration;
        statusTitle.textContent = `${names[id]} · 반복 경계 확인 중`;
        statusDetail.textContent = `끝 5초 → ${track.loopStart.toFixed(2)}초 지점 → 시작 뒤 8초`;
      } else {
        statusTitle.textContent = `${names[id]} · 인트로부터 재생 중`;
        statusDetail.textContent = `인트로 종료: ${track.loopStart.toFixed(2)}초`;
      }
      source.start(0, offset);
      showProgress(duration, mode === "seam" ? 5 : null);
      stopTimer = setTimeout(() => stop("검수 구간 재생이 끝났습니다."), duration * 1000);
    } catch (error) {
      stop("재생하지 못했습니다.");
      statusDetail.textContent = error.message;
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  function playNativeLoop() {
    stop("반복 전용 파일을 준비하고 있습니다…");
    const [id, track] = tracks.find(([trackId]) => trackId === select.value);
    htmlAudio = new Audio(track.loopSource);
    htmlAudio.loop = true;
    htmlAudio.play().then(() => {
      statusTitle.textContent = `${names[id]} · 직접 실행용 루프 재생 중`;
      statusDetail.textContent = "반복 전용 파일의 처음과 끝이 자연스럽게 연결되는지 확인해 주세요.";
      showProgress(20);
      stopTimer = setTimeout(() => stop("직접 실행용 루프 검수가 끝났습니다."), 20000);
    }).catch((error) => {
      stop("재생하지 못했습니다.");
      statusDetail.textContent = error.message;
    });
  }

  document.querySelector("#seam").addEventListener("click", () => playWebAudio("seam"));
  document.querySelector("#intro").addEventListener("click", () => playWebAudio("intro"));
  document.querySelector("#native-loop").addEventListener("click", playNativeLoop);
  document.querySelector("#stop").addEventListener("click", () => stop());
  select.addEventListener("change", () => stop("새 곡을 선택했습니다."));
})();
