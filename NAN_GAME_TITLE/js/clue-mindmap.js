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

  function place(node, x, y, size) {
    node.style.left = `${x - size / 2}px`;
    node.style.top = `${y - size / 2}px`;
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
  }

  function curve(svg, from, to, className) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const offset = Math.min(46, distance * 0.14);
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const c1 = { x: from.x + dx * 0.36 + normalX * offset, y: from.y + dy * 0.36 + normalY * offset };
    const c2 = { x: from.x + dx * 0.7 + normalX * offset, y: from.y + dy * 0.7 + normalY * offset };
    path.setAttribute("d", `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`);
    path.setAttribute("class", className);
    svg.append(path);
  }

  function groupClues(clues, day) {
    const grouped = new Map();
    clues.forEach((clue) => {
      if (clue.day !== day) return;
      if (!grouped.has(clue.theme)) grouped.set(clue.theme, []);
      grouped.get(clue.theme).push(clue);
    });
    return [...grouped.entries()];
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
      if (event.target.closest(".clue-day-orbit, .clue-detail-orbit, .clue-inspector")) {
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
  }

  function render(container, options) {
    const clues = Array.isArray(options.clues)
      ? options.clues.filter((clue) => global.ClueRecords && global.ClueRecords.isRecord(clue)).map((clue) => ({ ...clue }))
      : [];
    const currentDay = Math.min(5, Math.max(1, Number(options.currentDay) || 1));
    let selectedDay = container.dataset.selectedDay ? Number(container.dataset.selectedDay) : 0;
    if (selectedDay > currentDay) selectedDay = 0;
    container.dataset.selectedDay = String(selectedDay);
    if (container.clueResizeObserver) container.clueResizeObserver.disconnect();
    container.replaceChildren();

    const shell = element("section", "clue-canvas-shell");
    const toolbar = element("header", "clue-canvas-toolbar");
    toolbar.innerHTML = `<span><b>CASE BOARD</b><small>휠로 확대·축소하고 보드를 드래그하세요</small></span>`;
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

    const viewport = element("div", "clue-canvas-viewport");
    const world = element("div", "clue-canvas-world");
    let inspector;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "clue-connections");
    world.append(svg);

    const grouped = selectedDay ? groupClues(clues, selectedDay) : [];
    const worldHeight = selectedDay ? 1120 : 620;
    const worldWidth = selectedDay ? 1120 : 620;
    if (selectedDay) world.classList.add("radial");
    world.style.width = `${worldWidth}px`;
    world.style.height = `${worldHeight}px`;
    svg.setAttribute("viewBox", `0 0 ${worldWidth} ${worldHeight}`);
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2;

    const dayPositions = new Map();
    for (let day = 1; day <= currentDay; day += 1) {
      const active = day === selectedDay;
      const inactiveIndex = day - (day > selectedDay ? 1 : 0);
      const x = selectedDay ? (active ? centerX : 72 + inactiveIndex * 92) : 180 + (day - 1) * 185;
      const y = selectedDay ? (active ? centerY : 66) : centerY;
      const size = active ? 154 : (selectedDay ? 76 : 112);
      const meta = DAY_META[day];
      const count = clues.filter((clue) => clue.day === day).length;
      const button = element("button", `clue-orbit-node clue-day-orbit${active ? " active" : ""}`);
      button.type = "button";
      button.style.setProperty("--node-image", `url('${meta.image}')`);
      button.innerHTML = `<small>DAY ${day}</small><strong>${meta.title}</strong><span>${count} CLUES</span>`;
      button.addEventListener("click", () => {
        if (viewport.wasDragged()) return;
        container.dataset.selectedDay = String(active ? 0 : day);
        render(container, options);
      });
      place(button, x, y, size);
      world.append(button);
      dayPositions.set(day, { x, y });
    }

    if (selectedDay) {
      const root = dayPositions.get(selectedDay);
      grouped.forEach(([theme, items], themeIndex) => {
        const themeCount = Math.max(1, grouped.length);
        const sector = (Math.PI * 2) / themeCount;
        const themeAngle = -Math.PI / 2 + themeIndex * sector;
        const themeRadius = 248;
        const themePoint = {
          x: centerX + Math.cos(themeAngle) * themeRadius,
          y: centerY + Math.sin(themeAngle) * themeRadius,
        };
        curve(svg, root, themePoint, "clue-link theme-link");
        const themeNode = element("div", "clue-orbit-node clue-theme-orbit");
        themeNode.innerHTML = `<small>TOPIC ${String(themeIndex + 1).padStart(2, "0")}</small><strong>${theme}</strong><span>${items.length}개 연결</span>`;
        place(themeNode, themePoint.x, themePoint.y, 122);
        themeNode.style.animationDelay = `${themeIndex * 90 + 100}ms`;
        world.append(themeNode);

        items.forEach((clue, clueIndex) => {
          const maxSpread = Math.min(sector * 0.68, Math.PI * 0.72);
          const spread = items.length > 1 ? Math.min(maxSpread, (items.length - 1) * 0.38) : 0;
          const clueAngle = themeAngle + (items.length > 1 ? -spread / 2 + spread * clueIndex / (items.length - 1) : 0);
          const clueRadius = 445 + (clueIndex % 2) * 24;
          const clueX = centerX + Math.cos(clueAngle) * clueRadius;
          const clueY = centerY + Math.sin(clueAngle) * clueRadius;
          const cluePoint = { x: clueX, y: clueY };
          curve(svg, themePoint, cluePoint, "clue-link detail-link");
          const clueNode = element("button", "clue-orbit-node clue-detail-orbit");
          clueNode.type = "button";
          clueNode.setAttribute("aria-expanded", "false");
          clueNode.setAttribute("aria-controls", "clue-inspector");
          clueNode.innerHTML = `<small>CLUE ${String(clueIndex + 1).padStart(2, "0")}</small><p></p><span>클릭해 자세히</span>`;
          clueNode.querySelector("p").textContent = clue.title;
          clueNode.addEventListener("click", () => {
            if (viewport.wasDragged()) return;
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
            inspector.querySelector("small").textContent = `CLUE DETAIL · ${theme}`;
            inspector.querySelector("strong").textContent = clue.title;
            inspector.querySelector("p").textContent = clue.detail;
            inspector.hidden = false;
          });
          place(clueNode, clueX, clueY, 166);
          clueNode.style.animationDelay = `${themeIndex * 90 + clueIndex * 55 + 210}ms`;
          world.append(clueNode);
        });
      });
    }

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
    viewport.append(world, inspector);
    shell.append(toolbar, viewport);
    container.append(shell);
    const initialX = 12;
    const initialY = Math.min(10, Math.round((viewport.clientHeight - worldHeight) / 2));
    enablePan(viewport, world, initialX, initialY, {
      worldWidth,
      worldHeight,
      zoomLabel,
      initialScale: 1,
    });
    container.clueResizeObserver = viewport.resizeObserver || null;
    zoomOut.addEventListener("click", () => viewport.zoomBy(0.92));
    zoomIn.addEventListener("click", () => viewport.zoomBy(1.09));
    reset.addEventListener("click", () => viewport.resetPan());
  }

  global.ClueMindmap = Object.freeze({ render });
})(window);
