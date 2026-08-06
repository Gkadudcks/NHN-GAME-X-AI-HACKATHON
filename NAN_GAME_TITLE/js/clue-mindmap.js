(function (global) {
  "use strict";

  const DAY_META = Object.freeze({
    1: { title: "최초 기록", subtitle: "원본과 업무 지시", image: "../assets/CG/day1-harin-convenience-cg-v2.png" },
    2: { title: "검증과 흔적", subtitle: "수치·자동화·복원", image: "../assets/backgrounds/day1-office.png" },
    3: { title: "첫 번째 변조", subtitle: "변경된 문장", image: "../assets/image/office-background.png" },
    4: { title: "사건의 연결", subtitle: "로그와 관계", image: "../assets/backgrounds/day1-office-lounge.png" },
    5: { title: "최종 증명", subtitle: "원본 복구", image: "../assets/image/office-background.png" },
  });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function place(node, x, y, width, height = width) {
    node.style.left = `${x - width / 2}px`;
    node.style.top = `${y - height / 2}px`;
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
  }

  function enablePan(viewport, world, initialX, initialY, options = {}) {
    let x = initialX;
    let y = initialY;
    let scale = 1;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let dragging = false;
    let moved = false;
    const minScale = Number(options.minScale) || 0.1;
    const maxScale = Number(options.maxScale) || 1.6;
    const worldWidth = Number(options.worldWidth) || world.offsetWidth;
    const worldHeight = Number(options.worldHeight) || world.offsetHeight;
    const requestedInitialScale = Number(options.initialScale);
    const initialScale = Number.isFinite(requestedInitialScale) && requestedInitialScale > 0
      ? requestedInitialScale
      : null;
    const zoomLabel = options.zoomLabel;
    let viewportWidth = viewport.clientWidth;
    let viewportHeight = viewport.clientHeight;
    let autoFitTimer = 0;
    const apply = () => {
      world.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
      if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    };
    const centerAtScale = (nextScale) => {
      scale = Math.min(maxScale, Math.max(minScale, nextScale));
      x = Math.round((viewport.clientWidth - worldWidth * scale) / 2);
      y = Math.round((viewport.clientHeight - worldHeight * scale) / 2);
      apply();
    };
    const fitToView = () => {
      const padding = 28;
      const availableWidth = Math.max(1, viewport.clientWidth - padding * 2);
      const availableHeight = Math.max(1, viewport.clientHeight - padding * 2);
      const fitScale = Math.min(1, Math.max(minScale, Math.min(availableWidth / worldWidth, availableHeight / worldHeight)));
      centerAtScale(fitScale);
    };
    const setScale = (nextScale, anchorX = viewport.clientWidth / 2, anchorY = viewport.clientHeight / 2) => {
      const bounded = Math.min(maxScale, Math.max(minScale, nextScale));
      const worldX = (anchorX - x) / scale;
      const worldY = (anchorY - y) / scale;
      scale = bounded;
      x = anchorX - worldX * scale;
      y = anchorY - worldY * scale;
      apply();
    };
    apply();

    viewport.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".clue-detail-orbit, .clue-inspector")) {
        moved = false;
        return;
      }
      dragging = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      originX = x;
      originY = y;
      viewport.classList.add("dragging");
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      x = originX + dx;
      y = originY + dy;
      apply();
    });
    const finish = (event) => {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("dragging");
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    };
    viewport.addEventListener("pointerup", finish);
    viewport.addEventListener("pointercancel", finish);
    viewport.addEventListener("wheel", (event) => {
      const delta = Math.max(-120, Math.min(120, Number(event.deltaY) || 0));
      if (!delta) return;
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const factor = Math.exp(-delta * 0.001);
      setScale(scale * factor, event.clientX - bounds.left, event.clientY - bounds.top);
    }, { passive: false });
    viewport.wasDragged = () => moved;
    viewport.zoomBy = (factor) => setScale(scale * factor);
    viewport.fitToView = fitToView;
    viewport.resetPan = fitToView;
    if (initialScale === null) fitToView();
    else centerAtScale(initialScale);
    if (typeof ResizeObserver !== "undefined") {
      viewport.resizeObserver = new ResizeObserver(() => {
        const nextWidth = viewport.clientWidth;
        const nextHeight = viewport.clientHeight;
        if (!nextWidth || !nextHeight || (nextWidth === viewportWidth && nextHeight === viewportHeight)) return;
        if (initialScale === null) {
          viewportWidth = nextWidth;
          viewportHeight = nextHeight;
          window.clearTimeout(autoFitTimer);
          autoFitTimer = window.setTimeout(fitToView, 100);
          return;
        }
        const centerWorldX = (viewportWidth / 2 - x) / scale;
        const centerWorldY = (viewportHeight / 2 - y) / scale;
        x = nextWidth / 2 - centerWorldX * scale;
        y = nextHeight / 2 - centerWorldY * scale;
        viewportWidth = nextWidth;
        viewportHeight = nextHeight;
        apply();
      });
      viewport.resizeObserver.observe(viewport);
    }
    if (initialScale === null) {
      window.clearTimeout(autoFitTimer);
      autoFitTimer = window.setTimeout(fitToView, 100);
    }
  }

  function render(container, options) {
    const clues = Array.isArray(options.clues)
      ? options.clues.filter((clue) => global.ClueRecords && global.ClueRecords.isRecord(clue)).map((clue) => ({ ...clue }))
      : [];
    const currentDay = Math.min(5, Math.max(1, Number(options.currentDay) || 1));
    const selection = options.selection && typeof options.selection.onSelect === "function"
      ? {
          ...options.selection,
          clueIds: new Set(options.selection.clueIds || []),
          selectedIds: new Set(options.selection.selectedIds || []),
        }
      : null;
    let selectedDay = container.dataset.selectedDay ? Number(container.dataset.selectedDay) : currentDay;
    if (selectedDay > currentDay || selectedDay < 1) selectedDay = currentDay;
    container.dataset.selectedDay = String(selectedDay);
    if (container.clueResizeObserver) container.clueResizeObserver.disconnect();
    if (container.clueTooltipFrame) window.cancelAnimationFrame(container.clueTooltipFrame);
    container.replaceChildren();

    const shell = element("section", "clue-canvas-shell");
    const toolbar = element("header", "clue-canvas-toolbar");
    toolbar.classList.toggle("evidence-selection-toolbar", Boolean(selection));
    toolbar.innerHTML = selection
      ? `<span><b>발표 근거 제시</b><small>${selection.prompt || "근거가 되는 단서 노드를 선택하세요."}</small></span>`
      : `<span><b>사건 단서 확인</b><small>DAY를 선택하고 단서를 클릭하면 상세 기록을 확인할 수 있습니다.</small></span>`;
    if (selection) {
      const progress = element("div", "evidence-selection-progress");
      progress.innerHTML = `<strong>${selection.selectedIds.size}/${selection.clueIds.size}</strong><span>분홍색 DAY를 열고<br>단서 문장을 클릭하세요</span>`;
      progress.setAttribute("aria-label", `근거 선택 진행 ${selection.selectedIds.size}/${selection.clueIds.size}`);
      toolbar.append(progress);
    }
    const reset = element("button", "clue-canvas-reset", "중앙으로");
    reset.type = "button";
    reset.className = "clue-canvas-fit";
    reset.textContent = "전체 보기";
    reset.title = "마인드맵 전체를 화면에 맞추기";
    const controls = element("div", "clue-canvas-controls");
    const zoomOut = element("button", "clue-canvas-control", "−");
    zoomOut.type = "button";
    zoomOut.title = "축소";
    zoomOut.setAttribute("aria-label", "마인드맵 축소");
    const zoomLabel = element("output", "clue-canvas-zoom", "100%");
    zoomLabel.setAttribute("aria-live", "polite");
    const zoomIn = element("button", "clue-canvas-control", "+");
    zoomIn.type = "button";
    zoomIn.title = "확대";
    zoomIn.setAttribute("aria-label", "마인드맵 확대");
    controls.append(zoomOut, zoomLabel, zoomIn, reset);
    toolbar.append(controls);

    shell.classList.add("has-day-tabs");
    const dayTabs = element("nav", "clue-day-tabs");
    dayTabs.setAttribute("aria-label", "DAY 단서 이동");
    for (let day = 1; day <= currentDay; day += 1) {
      const meta = DAY_META[day];
      const count = clues.filter((clue) => clue.day === day).length;
      const tab = element("button", `clue-day-tab${day === selectedDay ? " active" : ""}`);
      tab.type = "button";
      tab.innerHTML = `<small>DAY ${day}</small><strong>${meta.title}</strong><span>${count}</span>`;
      if (day === selectedDay) tab.setAttribute("aria-current", "page");
      if (selection?.showDayHint && clues.some((clue) => clue.day === day && selection.clueIds.has(clue.id) && !selection.selectedIds.has(clue.id))) {
        tab.classList.add("has-evidence");
      }
      tab.addEventListener("click", () => {
        if (day === selectedDay) return;
        container.dataset.selectedDay = String(day);
        render(container, options);
      });
      dayTabs.append(tab);
    }

    const viewport = element("div", "clue-canvas-viewport");
    const world = element("div", "clue-canvas-world");
    let inspector;
    let tooltip;
    const dayClues = clues.filter((clue) => clue.day === selectedDay);
    world.classList.add("radial");

    const nodeDiameter = selection ? 190 : 166;
    const nodeGap = 34;
    const minCenterDistance = nodeDiameter + nodeGap;
    const itemsPerRing = 6;
    const ringStep = nodeDiameter + nodeGap;
    const ringCount = Math.max(1, Math.ceil(dayClues.length / itemsPerRing));
    const ringRadii = [];

    let previousRadius = 0;
    for (let ring = 0; ring < ringCount; ring += 1) {
      const startIdx = ring * itemsPerRing;
      const count = Math.min(itemsPerRing, Math.max(0, dayClues.length - startIdx));
      const requiredRadius = count > 1
        ? minCenterDistance / (2 * Math.sin(Math.PI / count))
        : 0;
      const radius = dayClues.length === 1
        ? 0
        : Math.max(ring === 0 ? 160 : previousRadius + ringStep, requiredRadius + nodeGap);
      ringRadii.push(radius);
      previousRadius = radius;
    }

    const maxExtent = Math.max(nodeDiameter / 2, (ringRadii[ringRadii.length - 1] || 0) + nodeDiameter / 2);
    const worldSize = Math.max(420, Math.ceil((maxExtent + 70) * 2));
    const worldWidth = worldSize;
    const worldHeight = worldSize;
    world.style.width = `${worldWidth}px`;
    world.style.height = `${worldHeight}px`;
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2;

    dayClues.forEach((clue, clueIndex) => {
          const ring = Math.floor(clueIndex / itemsPerRing);
          const startIdx = ring * itemsPerRing;
          const count = Math.min(itemsPerRing, dayClues.length - startIdx);
          const indexInRing = clueIndex - startIdx;
          const clueAngle = count === 2
            ? indexInRing * Math.PI
            : -Math.PI / 2 + indexInRing * (Math.PI * 2 / Math.max(1, count));
          const clueRadius = ringRadii[ring] || 0;
          const clueX = centerX + Math.cos(clueAngle) * clueRadius;
          const clueY = centerY + Math.sin(clueAngle) * clueRadius;
          const clueNode = element("button", "clue-orbit-node clue-detail-orbit");
          clueNode.type = "button";
          clueNode.setAttribute("aria-expanded", "false");
          clueNode.setAttribute("aria-controls", "clue-inspector");
          clueNode.dataset.clueId = clue.id;
          clueNode.innerHTML = `<small>CLUE ${String(clueIndex + 1).padStart(2, "0")}</small><p></p><span>마우스를 올려 미리보기</span>`;
          clueNode.querySelector("p").textContent = clue.title;
          if (selection) {
            const selected = selection.selectedIds.has(clue.id);
            clueNode.classList.add("evidence-candidate");
            clueNode.classList.toggle("evidence-selected", selected);
            clueNode.querySelector("span").textContent = selected ? "PPT 제시 완료" : "클릭하여 PPT에 제시";
            clueNode.disabled = selected;
          }
          const positionTooltip = () => {
            const nodeRect = clueNode.getBoundingClientRect();
            const tipRect = tooltip.getBoundingClientRect();
            let left = nodeRect.left + nodeRect.width / 2 - tipRect.width / 2;
            left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
            let top = nodeRect.top - tipRect.height - 12;
            if (top < 8) top = nodeRect.bottom + 12;
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
          };
          const trackTooltip = () => {
            positionTooltip();
            container.clueTooltipFrame = window.requestAnimationFrame(trackTooltip);
          };
          const showTooltip = () => {
            tooltip.querySelector("strong").textContent = clue.title;
            tooltip.querySelector("p").textContent = clue.detail;
            tooltip.hidden = false;
            window.cancelAnimationFrame(container.clueTooltipFrame);
            trackTooltip();
          };
          const hideTooltip = () => {
            tooltip.hidden = true;
            window.cancelAnimationFrame(container.clueTooltipFrame);
          };
          clueNode.addEventListener("mouseenter", showTooltip);
          clueNode.addEventListener("mouseleave", hideTooltip);
          clueNode.addEventListener("focus", showTooltip);
          clueNode.addEventListener("blur", hideTooltip);
          clueNode.addEventListener("click", () => {
            hideTooltip();
            if (viewport.wasDragged()) return;
            if (selection) {
              selection.onSelect(clue);
              return;
            }
            const wasOpen = clueNode.classList.contains("active");
            viewport.querySelectorAll(".clue-detail-orbit.active").forEach((node) => {
              node.classList.remove("active");
              node.setAttribute("aria-expanded", "false");
            });
            if (wasOpen) {
              inspector.hidden = true;
              return;
            }
            clueNode.classList.add("active");
            clueNode.setAttribute("aria-expanded", "true");
            inspector.querySelector("small").textContent = "CLUE DETAIL";
            inspector.querySelector("strong").textContent = clue.title;
            inspector.querySelector("p").textContent = clue.detail;
            inspector.hidden = false;
          });
          place(clueNode, clueX, clueY, nodeDiameter);
          clueNode.style.animationDelay = `${clueIndex * 55 + 120}ms`;
          world.append(clueNode);
        });

    inspector = element("aside", "clue-inspector");
    inspector.id = "clue-inspector";
    inspector.hidden = true;
    inspector.innerHTML = '<small>CLUE DETAIL</small><strong></strong><p></p><button type="button" aria-label="상세 단서 닫기">×</button>';
    inspector.querySelector("button").addEventListener("click", () => {
      inspector.hidden = true;
      viewport.querySelectorAll(".clue-detail-orbit.active").forEach((node) => {
        node.classList.remove("active");
        node.setAttribute("aria-expanded", "false");
      });
    });
    tooltip = element("div", "clue-hover-tip");
    tooltip.hidden = true;
    tooltip.innerHTML = "<strong></strong><p></p>";
    viewport.append(world, inspector);
    shell.append(tooltip);
    shell.append(toolbar);
    if (dayTabs) shell.append(dayTabs);
    shell.append(viewport);
    container.append(shell);
    const initialX = 12;
    const initialY = Math.min(10, Math.round((viewport.clientHeight - worldHeight) / 2));
    enablePan(viewport, world, initialX, initialY, {
      worldWidth,
      worldHeight,
      zoomLabel,
      initialScale: null,
    });
    container.clueResizeObserver = viewport.resizeObserver || null;
    zoomOut.addEventListener("click", () => viewport.zoomBy(0.92));
    zoomIn.addEventListener("click", () => viewport.zoomBy(1.09));
    reset.addEventListener("click", () => viewport.resetPan());
  }

  global.ClueMindmap = Object.freeze({ render });
})(window);
