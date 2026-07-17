const menuButtons = [...document.querySelectorAll(".menu-button")];
const overlay = document.querySelector(".start-overlay");
const savePanel = document.querySelector(".save-panel");
const saveSlots = document.querySelector(".save-slots");
let activeIndex = 0;

function setActiveMenu(index) {
  activeIndex = (index + menuButtons.length) % menuButtons.length;
  menuButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === activeIndex);
  });
}

function runActiveMenu() {
  const action = menuButtons[activeIndex].dataset.action;

  if (action === "new-game") {
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
    }, 2200);
    return;
  }

  if (action === "continue") {
    openSavePanel();
    return;
  }

}

function getSaveSlots() {
  return Array.from({ length: 5 }, (_, index) => {
    const slotId = index + 1;
    const rawData = localStorage.getItem(`nan-save-slot-${slotId}`);
    if (!rawData) return { slotId, empty: true };

    try {
      return { slotId, empty: false, ...JSON.parse(rawData) };
    } catch {
      return { slotId, empty: true };
    }
  });
}

function formatSavedAt(savedAt) {
  if (!savedAt) return "저장 시간 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(savedAt));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSaveSlots() {
  const slots = getSaveSlots();
  const savedSlots = slots.filter((slot) => !slot.empty);
  const latestSavedAt = savedSlots
    .map((slot) => slot.savedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  saveSlots.replaceChildren(...slots.map((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "save-slot";

    if (slot.empty) {
      button.disabled = true;
      button.innerHTML = `
        <span class="slot-thumbnail empty"></span>
        <span class="slot-body">
          <span class="slot-number">SLOT ${String(slot.slotId).padStart(2, "0")}</span>
          <strong class="slot-title">저장 데이터 없음</strong>
          <span class="slot-dialogue">새 게임을 시작한 뒤 저장할 수 있습니다.</span>
          <span class="slot-meta">EMPTY SLOT</span>
        </span>`;
      return button;
    }

    const dialogue = slot.lastDialogue
      ? `${escapeHtml(slot.lastDialogue.speaker)}: “${escapeHtml(slot.lastDialogue.text)}”`
      : "저장된 대화 내용이 없습니다.";
    const thumbnail = escapeHtml(slot.thumbnail || "assets/office-background.png");
    button.innerHTML = `
      <span class="slot-thumbnail"><img src="${thumbnail}" alt="SLOT ${slot.slotId} 저장 장면" /></span>
      <span class="slot-body">
        <span class="slot-number">SLOT ${String(slot.slotId).padStart(2, "0")}</span>
        <strong class="slot-title">DAY ${escapeHtml(slot.day ?? "-")} · ${escapeHtml(slot.sceneTitle ?? "저장된 장면")}</strong>
        <span class="slot-dialogue">${dialogue}</span>
        <span class="slot-meta">${formatSavedAt(slot.savedAt)}</span>
      </span>
      ${slot.savedAt === latestSavedAt ? '<span class="latest-badge">최근 플레이</span>' : ""}`;
    button.addEventListener("click", () => {
      closeSavePanel();
    });
    return button;
  }));
}

function openSavePanel() {
  renderSaveSlots();
  savePanel.classList.add("open");
  savePanel.setAttribute("aria-hidden", "false");
  document.querySelector(".close-save-panel").focus();
}

function closeSavePanel() {
  savePanel.classList.remove("open");
  savePanel.setAttribute("aria-hidden", "true");
  menuButtons[activeIndex].focus();
}

menuButtons.forEach((button, index) => {
  button.addEventListener("mouseenter", () => setActiveMenu(index));
  button.addEventListener("focus", () => setActiveMenu(index));
  button.addEventListener("click", runActiveMenu);
});

document.addEventListener("keydown", (event) => {
  if (savePanel.classList.contains("open")) {
    if (event.key === "Escape") closeSavePanel();
    return;
  }
  if (event.key === "ArrowRight" || event.key === "ArrowDown") setActiveMenu(activeIndex + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") setActiveMenu(activeIndex - 1);
  if (event.key === "Enter") runActiveMenu();
});

document.querySelector(".close-save-panel").addEventListener("click", closeSavePanel);
savePanel.addEventListener("click", (event) => {
  if (event.target === savePanel) closeSavePanel();
});
