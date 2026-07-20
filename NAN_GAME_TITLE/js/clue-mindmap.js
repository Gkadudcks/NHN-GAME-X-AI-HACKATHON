(function (global) {
  "use strict";

  const DAY_META = Object.freeze({
    1: { title: "최초 기록", subtitle: "원본과 업무 지시", image: "assets/CG/day1-harin-convenience-cg-v2.png" },
    2: { title: "검증과 흔적", subtitle: "수치·자동화·복원", image: "assets/backgrounds/day1-office.png" },
    3: { title: "첫 번째 변조", subtitle: "변경된 문장", image: "assets/image/office-background.png" },
    4: { title: "사건의 연결", subtitle: "로그와 관계", image: "assets/backgrounds/day1-office-lounge.png" },
    5: { title: "최종 증명", subtitle: "원본 복구", image: "assets/image/office-background.png" },
  });

  function clueDay(text) {
    const explicit = String(text).match(/DAY\s*([1-5])/i);
    if (explicit) return Number(explicit[1]);
    if (/강민재의 제안|과거 폴더의 비활성 자동화|정상 복원 지점/.test(text)) return 2;
    return 1;
  }

  function clueTheme(text, day) {
    if (day === 1) {
      if (/원본|초안|보관|최초 기록/.test(text)) return "원본과 기록";
      if (/나나봇|자동 요약|자동 정리/.test(text)) return "AI 사용 방식";
      if (/메신저|부장|유저 경험/.test(text)) return "업무 지시";
      return "조사 근거";
    }
    if (day === 2) {
      if (/자동화|과거 폴더|소유자/.test(text)) return "과거 시스템";
      if (/강민재|슬라이드/.test(text)) return "동료의 증언";
      if (/수치|검증|복원 지점/.test(text)) return "검증 기록";
      return "조사 결과";
    }
    return "주요 단서";
  }

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
    const bend = Math.max(60, (to.x - from.x) * 0.48);
    path.setAttribute("d", `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`);
    path.setAttribute("class", className);
    svg.append(path);
  }

  function groupClues(clues, day) {
    const grouped = new Map();
    clues.filter((text) => clueDay(text) === day).forEach((text) => {
      const theme = clueTheme(text, day);
      if (!grouped.has(theme)) grouped.set(theme, []);
      grouped.get(theme).push(text);
    });
    return [...grouped.entries()];
  }

  function enablePan(viewport, world, initialX, initialY) {
    let x = initialX;
    let y = initialY;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    let dragging = false;
    let moved = false;
    const apply = () => { world.style.transform = `translate3d(${x}px,${y}px,0)`; };
    apply();

    viewport.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".clue-day-orbit")) {
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
    viewport.wasDragged = () => moved;
    viewport.resetPan = () => { x = initialX; y = initialY; apply(); };
  }

  function render(container, options) {
    const clues = Array.isArray(options.clues) ? options.clues.map(String) : [];
    const currentDay = Math.min(5, Math.max(1, Number(options.currentDay) || 1));
    let selectedDay = container.dataset.selectedDay ? Number(container.dataset.selectedDay) : 0;
    if (selectedDay > currentDay) selectedDay = 0;
    container.dataset.selectedDay = String(selectedDay);
    container.replaceChildren();

    const shell = element("section", "clue-canvas-shell");
    const toolbar = element("header", "clue-canvas-toolbar");
    toolbar.innerHTML = `<span><b>CASE BOARD</b><small>원을 선택하고 보드를 드래그하세요</small></span>`;
    const reset = element("button", "clue-canvas-reset", "중앙으로");
    reset.type = "button";
    toolbar.append(reset);

    const viewport = element("div", "clue-canvas-viewport");
    const world = element("div", "clue-canvas-world");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "clue-connections");
    world.append(svg);

    const grouped = selectedDay ? groupClues(clues, selectedDay) : [];
    const bandHeights = grouped.map(([, items]) => Math.max(175, Math.ceil(items.length / 2) * 158 + 28));
    const worldHeight = Math.max(620, bandHeights.reduce((sum, height) => sum + height, 0) + 80);
    const worldWidth = selectedDay ? 1010 : 620;
    world.style.width = `${worldWidth}px`;
    world.style.height = `${worldHeight}px`;
    svg.setAttribute("viewBox", `0 0 ${worldWidth} ${worldHeight}`);
    const centerY = worldHeight / 2;

    const dayPositions = new Map();
    for (let day = 1; day <= currentDay; day += 1) {
      const active = day === selectedDay;
      const x = selectedDay ? 112 : 180 + (day - 1) * 185;
      const y = selectedDay ? (active ? centerY : 88 + (day - 1) * 96) : centerY;
      const size = active ? 142 : 112;
      const meta = DAY_META[day];
      const count = clues.filter((text) => clueDay(text) === day).length;
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
      let cursorY = 40;
      grouped.forEach(([theme, items], themeIndex) => {
        const bandHeight = bandHeights[themeIndex];
        const themeY = cursorY + bandHeight / 2;
        const themePoint = { x: 320, y: themeY };
        curve(svg, root, themePoint, "clue-link theme-link");
        const themeNode = element("div", "clue-orbit-node clue-theme-orbit");
        themeNode.innerHTML = `<small>TOPIC ${String(themeIndex + 1).padStart(2, "0")}</small><strong>${theme}</strong><span>${items.length}개 연결</span>`;
        place(themeNode, themePoint.x, themePoint.y, 122);
        themeNode.style.animationDelay = `${themeIndex * 90 + 100}ms`;
        world.append(themeNode);

        items.forEach((text, clueIndex) => {
          const column = clueIndex % 2;
          const row = Math.floor(clueIndex / 2);
          const clueX = 555 + column * 225;
          const rows = Math.ceil(items.length / 2);
          const clueY = themeY + (row - (rows - 1) / 2) * 158 + (column ? 34 : -14);
          const cluePoint = { x: clueX, y: clueY };
          curve(svg, themePoint, cluePoint, "clue-link detail-link");
          const clueNode = element("article", "clue-orbit-node clue-detail-orbit");
          clueNode.innerHTML = `<small>CLUE ${String(clueIndex + 1).padStart(2, "0")}</small><p></p>`;
          clueNode.querySelector("p").textContent = text;
          place(clueNode, clueX, clueY, 166);
          clueNode.style.animationDelay = `${themeIndex * 90 + clueIndex * 55 + 210}ms`;
          world.append(clueNode);
        });
        cursorY += bandHeight;
      });
    }

    viewport.append(world);
    shell.append(toolbar, viewport);
    container.append(shell);
    const initialX = 12;
    const initialY = Math.min(10, Math.round((viewport.clientHeight - worldHeight) / 2));
    enablePan(viewport, world, initialX, initialY);
    reset.addEventListener("click", () => viewport.resetPan());
  }

  global.ClueMindmap = Object.freeze({ render, clueDay, clueTheme });
})(window);
