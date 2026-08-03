(function initCoffeeMinigameDev() {
  "use strict";

  const form = document.querySelector("#dev-controls");
  const status = document.querySelector("#dev-run-status");
  const result = document.querySelector("#dev-result-json");

  function run() {
    status.textContent = "커피 제조 미니게임 실행 중";
    CoffeeMinigame.start({
      onComplete(value) {
        result.textContent = JSON.stringify(value, null, 2);
        status.textContent = `완료 · ${value.grade}`;
      },
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  run();
})();
