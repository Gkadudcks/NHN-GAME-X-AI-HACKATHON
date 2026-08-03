(function () {
  "use strict";

  const form = document.querySelector("#dev-controls");
  const status = document.querySelector("#dev-run-status");
  const resultJson = document.querySelector("#dev-result-json");

  function run() {
    status.textContent = "부장님 몰래 메신저하기 · 실행 중";
    SecretChatMinigame.start({
      onComplete(result) {
        resultJson.textContent = JSON.stringify(result, null, 2);
        status.textContent = `완료 · ${result.grade.toUpperCase()} · 전송 ${result.sent}/3`;
      },
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  run();
})();
