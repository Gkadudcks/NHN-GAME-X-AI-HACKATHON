(function () {
  "use strict";

  const form = document.querySelector("#dev-controls");
  const duration = document.querySelector("#dev-duration");
  const seed = document.querySelector("#dev-seed");
  const status = document.querySelector("#dev-run-status");
  const resultJson = document.querySelector("#dev-result-json");

  function run() {
    const runDuration = Math.max(12, Number(duration.value) || 45);
    const runSeed = Number(seed.value) || 20260720;
    status.textContent = `업무 알림 쳐내기 · ${runDuration}초 · 시드 ${runSeed}`;

    WorkAlertMinigame.startDay3({
      testOverrides: {
        duration: runDuration,
        seed: runSeed,
      },
      onComplete(result) {
        resultJson.textContent = JSON.stringify(result, null, 2);
        status.textContent = `완료 · ${result.grade.toUpperCase()} · ${result.score}점`;
      },
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  run();
})();
