(function () {
  "use strict";

  const form = document.querySelector("#dev-controls");
  const subtask = document.querySelector("#dev-subtask");
  const duration = document.querySelector("#dev-duration");
  const seed = document.querySelector("#dev-seed");
  const status = document.querySelector("#dev-run-status");
  const resultJson = document.querySelector("#dev-result-json");

  function requestsFor(selectedSubtask) {
    return [
      ...WorkAlertMinigame.core.REQUESTS.slice(0, 13),
      ...WorkAlertMinigame.core.SUBTASK_REQUESTS[selectedSubtask],
    ];
  }

  function run() {
    const requests = requestsFor(subtask.value);
    const runDuration = Math.max(12, Number(duration.value) || 45);
    const runSeed = Number(seed.value) || 20260720;
    status.textContent = `${subtask.options[subtask.selectedIndex].text} · ${runDuration}초 · 시드 ${runSeed}`;

    WorkAlertMinigame.start({
      duration: runDuration,
      seed: runSeed,
      count: requests.length,
      requests,
      lifeMs: 30000,
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
