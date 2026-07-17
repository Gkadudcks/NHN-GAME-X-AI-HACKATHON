const menuButtons = [...document.querySelectorAll(".menu-button")];
const notificationText = document.querySelector("#notification-text");
const notification = document.querySelector(".nana-notification");
const overlay = document.querySelector(".start-overlay");
let activeIndex = 0;

const messages = {
  continue: "저장된 기록이 없습니다.",
  records: "아직 발견한 단서가 없습니다.",
  settings: "설정 메뉴는 다음 버전에서 열립니다.",
};

function setActiveMenu(index) {
  activeIndex = (index + menuButtons.length) % menuButtons.length;
  menuButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === activeIndex);
  });
}

function runActiveMenu() {
  const action = menuButtons[activeIndex].dataset.action;

  if (action === "new-game") {
    notificationText.textContent = "서하린 선배: 잠깐만요. 그 파일 열지 마세요.";
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
    }, 2200);
    return;
  }

  notificationText.textContent = messages[action];
}

menuButtons.forEach((button, index) => {
  button.addEventListener("mouseenter", () => setActiveMenu(index));
  button.addEventListener("focus", () => setActiveMenu(index));
  button.addEventListener("click", runActiveMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") setActiveMenu(activeIndex + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") setActiveMenu(activeIndex - 1);
  if (event.key === "Enter") runActiveMenu();
});

document.querySelector(".close-notification").addEventListener("click", () => {
  notification.hidden = true;
});
