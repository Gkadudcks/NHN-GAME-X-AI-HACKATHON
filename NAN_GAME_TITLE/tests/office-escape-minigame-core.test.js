"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../js/office-escape-minigame-core.js");

function advance(game, seconds, step = 1 / 60) {
  for (let elapsed = 0; elapsed < seconds && !game.snapshot().finished; elapsed += step) game.step(step);
}

function jumpApex(holdSeconds) {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  const step = 1 / 240;
  game.pressJump();
  let apex = 0;
  for (let elapsed = 0; elapsed < 2; elapsed += step) {
    if (elapsed >= holdSeconds && game.snapshot().jumpHeld) game.releaseJump();
    game.step(step);
    apex = Math.max(apex, game.snapshot().y - game.snapshot().groundY);
    if (elapsed > holdSeconds && game.snapshot().y <= game.snapshot().groundY) break;
  }
  return apex;
}

test("피격 수로 결과 등급을 결정한다", () => {
  assert.equal(Core.gradeForHits(0), "perfect");
  assert.equal(Core.gradeForHits(1), "close");
  assert.equal(Core.gradeForHits(2), "close");
  assert.equal(Core.gradeForHits(3), "caught");
});

test("보행 두 프레임은 500ms 주기를 유지하며 도윤, 하린, 부장 순으로 전환된다", () => {
  assert.deepEqual(Core.GAIT_PHASE_DELAY_MS, { doyun: 0, harin: 150, boss: 300 });
  const phasesAt = (elapsedMs) => [
    Core.gaitFrameIndex(elapsedMs / 1000, Core.GAIT_PHASE_DELAY_MS.doyun),
    Core.gaitFrameIndex(elapsedMs / 1000, Core.GAIT_PHASE_DELAY_MS.harin),
    Core.gaitFrameIndex(elapsedMs / 1000, Core.GAIT_PHASE_DELAY_MS.boss),
  ];

  assert.deepEqual(phasesAt(0), [0, 0, 0]);
  assert.deepEqual(phasesAt(499), [0, 0, 0]);
  assert.deepEqual(phasesAt(500), [1, 0, 0]);
  assert.deepEqual(phasesAt(649), [1, 0, 0]);
  assert.deepEqual(phasesAt(650), [1, 1, 0]);
  assert.deepEqual(phasesAt(799), [1, 1, 0]);
  assert.deepEqual(phasesAt(800), [1, 1, 1]);
  assert.deepEqual(phasesAt(999), [1, 1, 1]);
  assert.deepEqual(phasesAt(1000), [0, 1, 1]);
  assert.equal(Core.gaitFrameIndex(-1, 300), 0);
});

test("자동 달리기는 입력 없이도 진행되고 제한 시간에 완료된다", () => {
  const game = Core.create({ duration: 8, length: 9999, course: [] });
  advance(game, 9);
  assert.equal(game.snapshot().finished, true);
  assert.ok(game.snapshot().distance > 0);
  assert.deepEqual(game.result(), {
    grade: "perfect",
    caught: false,
    elapsed: 8,
    hitCount: 0,
    collectedItems: [],
    maxCombo: 0,
  });
});

test("기본 코스는 첫 두 장애물에서 점프와 슬라이드를 차례로 가르친다", () => {
  const tutorials = Core.COURSE.filter((entry) => entry.kind === "hazard").slice(0, 2);
  assert.deepEqual(tutorials.map((entry) => entry.avoid), ["jump", "slide"]);
  assert.ok(tutorials[1].x - tutorials[0].x >= 900);
});

test("세 구간은 속도를 단계적으로 높이고 승인 소품을 다른 움직임과 행동으로 변주한다", () => {
  assert.deepEqual(Core.ZONES.map((zone) => zone.speedMultiplier), [0.95, 1.06, 1.15]);

  const movingHazards = Core.COURSE.filter((entry) => entry.kind === "hazard" && entry.motion);
  assert.deepEqual(new Set(movingHazards.map((entry) => entry.motion)), new Set(["roll", "scatter", "rattle", "sway"]));

  const corridorSwitch = Core.COURSE.find((entry) => entry.id === "corridor-sign-switch");
  assert.equal(corridorSwitch.type, "sign");
  assert.equal(corridorSwitch.avoid, "slide");
  assert.equal(corridorSwitch.y, 58);

  const corridorHazards = Core.COURSE.filter((entry) => entry.kind === "hazard"
    && entry.x >= Core.DEFAULT_LENGTH * 0.34
    && entry.x < Core.DEFAULT_LENGTH * 0.68);
  assert.ok(new Set(corridorHazards.map((entry) => entry.type)).size >= 5);
  assert.deepEqual(corridorHazards.slice(-2).map((entry) => entry.avoid), ["jump", "slide"]);
});

test("후반 연속 패턴은 물리 충돌과 필수 입력 사이에 각각 500ms 이상 회복 시간을 둔다", () => {
  const source = new Map(Core.COURSE.map((entry) => [entry.id, entry]));
  const pairs = [
    [source.get("cable-drawer-a"), source.get("cable-drawer-b")],
    [source.get("paper-wave-a"), source.get("corridor-sign-switch")],
  ];

  for (const step of [1 / 240, 1 / 120, 1 / 60, 1 / 30, 0.05]) {
    for (const [first, second] of pairs) {
      const game = Core.create({ assist: false, course: [first, second] });
      const acted = new Set();
      const timeline = {};

      while (!game.snapshot().finished && timeline.secondCollisionEntry === undefined) {
        const snapshot = game.snapshot();
        const upcoming = snapshot.upcomingHazard;
        if (upcoming?.id === second.id) {
          const inputReady = upcoming.avoid === "jump"
            ? upcoming.jumpQueueReady
            : upcoming.telegraphPhase === "act";
          if (inputReady && timeline.secondInputReady === undefined) {
            timeline.secondInputReady = snapshot.elapsed;
          }
          if (upcoming.collisionGap <= 0 && timeline.secondCollisionEntry === undefined) {
            timeline.secondCollisionEntry = snapshot.elapsed;
          }
        }
        if (upcoming?.telegraphPhase === "act" && !acted.has(upcoming.id)) {
          acted.add(upcoming.id);
          if (upcoming.id === first.id) timeline.firstPhysicalAct = snapshot.elapsed;
          if (upcoming.avoid === "jump") {
            game.commitJump(0.42);
            game.releaseJump();
          } else {
            game.commitSlide(upcoming.clearLeadTime + 0.05);
          }
        }

        game.step(step);
        for (const event of game.drainEvents()) {
          assert.notEqual(event.type, "hit", `${first.id}→${second.id} should stay avoidable`);
          if (event.type === "avoid" && event.object.id === first.id) {
            timeline.firstCollisionExit = game.snapshot().elapsed;
          }
        }
      }

      const physicalSafety = timeline.secondCollisionEntry - timeline.firstCollisionExit;
      const inputRecovery = timeline.secondInputReady - timeline.firstPhysicalAct;
      assert.ok(physicalSafety >= 0.5 - step,
        `${first.id}→${second.id} physical safety ${physicalSafety}s at ${step}s`);
      assert.ok(inputRecovery >= 0.5 - step,
        `${first.id}→${second.id} input recovery ${inputRecovery}s at ${step}s`);
      assert.ok(timeline.secondInputReady >= timeline.firstCollisionExit - step,
        `${first.id}→${second.id} must not demand the next input before clear`);
    }
  }
});

test("사무실 후반은 반복 점프 대신 점프-슬라이드-점프 변주와 회복 간격을 둔다", () => {
  const officeRun = Core.COURSE
    .filter((entry) => entry.kind === "hazard" && entry.x >= 2700 && entry.x <= 5100);
  assert.deepEqual(officeRun.map((entry) => entry.avoid), ["jump", "jump", "slide", "jump"]);
  assert.deepEqual(officeRun.map((entry) => entry.id), [
    "cable-tutorial",
    "chair-pair-a",
    "drawer-pair-b",
    "paper-stack",
  ]);
  assert.equal(officeRun[2].type, "drawer");
  assert.equal(officeRun[2].y, 58);

  const emptyRun = Core.create({ assist: false, course: [] });
  const reachedAt = new Map();
  for (let elapsed = 0; elapsed < 30 && reachedAt.size < 3; elapsed += 1 / 240) {
    emptyRun.step(1 / 240);
    for (const target of officeRun.slice(1)) {
      if (!reachedAt.has(target.id) && emptyRun.snapshot().distance >= target.x) {
        reachedAt.set(target.id, elapsed + 1 / 240);
      }
    }
  }
  const chairToDrawer = reachedAt.get("drawer-pair-b") - reachedAt.get("chair-pair-a");
  const drawerToPapers = reachedAt.get("paper-stack") - reachedAt.get("drawer-pair-b");
  assert.ok(chairToDrawer >= 1.75 && chairToDrawer <= 1.95, `chair→drawer ${chairToDrawer}s`);
  assert.ok(drawerToPapers >= 3.5, `drawer→papers ${drawerToPapers}s`);
});

test("큐가 열린 뒤 150ms 반응에도 사무실 점프-슬라이드-점프를 연속 회피한다", () => {
  const source = new Map(Core.COURSE.map((entry) => [entry.id, entry]));
  const course = [
    { ...source.get("chair-pair-a"), x: 420 },
    { ...source.get("drawer-pair-b"), x: 820 },
    { ...source.get("paper-stack"), x: 1620 },
  ];
  const game = Core.create({ duration: 12, length: 2200, course, assist: false });
  const scheduled = new Set();
  const queued = new Set();
  const executed = new Set();
  const avoided = [];
  let pending = null;

  for (let elapsed = 0; elapsed < 11 && avoided.length < 3; elapsed += 1 / 240) {
    const snapshot = game.snapshot();
    const upcoming = snapshot.upcomingHazard;
    const inputReady = upcoming?.avoid === "jump"
      ? upcoming.jumpQueueReady
      : upcoming?.telegraphPhase === "act";
    if (!pending && inputReady && !scheduled.has(upcoming.id)) {
      pending = { object: upcoming, triggerAt: elapsed + 0.15 };
      scheduled.add(upcoming.id);
    }
    if (pending && elapsed >= pending.triggerAt) {
      if (pending.object.avoid === "jump") {
        queued.add(pending.object.id);
      } else {
        const current = game.snapshot().upcomingHazard;
        game.commitSlide(current.clearLeadTime + 0.05);
        executed.add(pending.object.id);
      }
      pending = null;
    }
    if (upcoming?.avoid === "jump"
      && queued.has(upcoming.id)
      && upcoming.telegraphPhase === "act"
      && !executed.has(upcoming.id)) {
      game.commitJump(0.42);
      game.releaseJump();
      executed.add(upcoming.id);
    }

    game.step(1 / 240);
    for (const event of game.drainEvents()) {
      if (event.type === "avoid") avoided.push(event.object.id);
      assert.notEqual(event.type, "hit", `${event.object?.id || "unknown"} should be avoided`);
    }
  }

  assert.deepEqual(avoided, ["chair-pair-a", "drawer-pair-b", "paper-stack"]);
  assert.equal(game.snapshot().hitCount, 0);
});

test("the opening teaches jump and slide within nine seconds without shortening warnings", () => {
  const game = Core.create({ assist: false });
  const step = 1 / 240;
  const warningTimes = new Map();
  let jumpQueued = false;
  const acted = new Set();

  for (let elapsed = 0; elapsed < 9.5 && !game.snapshot().finished; elapsed += step) {
    const snapshot = game.snapshot();
    const upcoming = snapshot.upcomingHazard;
    if (upcoming?.id === "chair-tutorial" && upcoming.jumpQueueReady) jumpQueued = true;
    if (jumpQueued
      && upcoming?.id === "chair-tutorial"
      && upcoming.telegraphPhase === "act"
      && !acted.has(upcoming.id)) {
      game.commitJump(0.42);
      game.releaseJump();
      acted.add(upcoming.id);
    }
    if (upcoming?.id === "drawer-tutorial"
      && upcoming.telegraphPhase === "act"
      && !acted.has(upcoming.id)) {
      game.commitSlide(upcoming.clearLeadTime + 0.05);
      acted.add(upcoming.id);
    }

    game.step(step);
    for (const event of game.drainEvents()) {
      if (event.type === "telegraph") {
        warningTimes.set(event.object.id, {
          elapsed: elapsed + step,
          leadTime: event.leadTime,
        });
      }
      assert.notEqual(event.type, "hit");
    }
  }

  const jumpWarning = warningTimes.get("chair-tutorial");
  const slideWarning = warningTimes.get("drawer-tutorial");
  assert.ok(jumpWarning.elapsed >= 2.1 && jumpWarning.elapsed <= 2.4);
  assert.ok(slideWarning.elapsed >= 6.3 && slideWarning.elapsed <= 6.6);
  assert.ok(jumpWarning.leadTime >= Core.MIN_PREPARE_LEAD_TIME - 0.01);
  assert.ok(slideWarning.leadTime >= Core.MIN_PREPARE_LEAD_TIME - 0.01);
  assert.ok(game.snapshot().resolved.has("chair-tutorial"));
  assert.ok(game.snapshot().resolved.has("drawer-tutorial"));
});

test("기본 위험물의 보이는 알파 영역은 논리 상자와 맞고 실제 판정은 양축 18% 작다", () => {
  for (const object of Core.COURSE.filter((entry) => entry.kind === "hazard")) {
    const frame = Core.PROP_ART_FRAMING[object.type];
    assert.ok(frame, `${object.type} framing should exist`);
    const renderedArtSize = object.width / frame.alphaWidth;
    const visibleWidth = renderedArtSize * frame.alphaWidth;
    const visibleHeight = renderedArtSize * frame.alphaHeight;
    assert.ok(Math.abs(visibleWidth - object.width) < 0.01);
    assert.ok(Math.abs(visibleHeight - object.height) <= 1);
    assert.equal(Math.round((1 - object.width * 0.82 / visibleWidth) * 100), 18);
    assert.ok(Math.abs((1 - object.height * 0.82 / visibleHeight) * 100 - 18) <= 2);
  }
});

test("기본 플레이는 60~75초 사이에 끝나고 세 구간의 속도 리듬이 증가한다", () => {
  const game = Core.create();
  advance(game, 76);
  assert.equal(game.snapshot().finished, true);
  assert.ok(game.result().elapsed >= 60 && game.result().elapsed <= 75);
  assert.deepEqual(Core.ZONES.map((zone) => zone.id), ["office", "corridor", "elevator"]);
  assert.ok(Core.ZONES[0].speedMultiplier < Core.ZONES[1].speedMultiplier);
  assert.ok(Core.ZONES[1].speedMultiplier < Core.ZONES[2].speedMultiplier);
});

test("장소 전환은 시간 진행률이 앞서도 실제 이동 거리 경계와 일치한다", () => {
  const game = Core.create({ duration: 15, length: 3750, course: [] });
  const step = 1 / 240;

  while (game.snapshot().progress < 0.35) game.step(step);
  let snapshot = game.snapshot();
  assert.ok(snapshot.distance / snapshot.length < 0.34);
  assert.equal(snapshot.distanceProgress, snapshot.distance / snapshot.length);
  assert.equal(snapshot.zone.id, "office");

  while (game.snapshot().distance / game.snapshot().length < 0.34) game.step(step);
  assert.equal(game.snapshot().zone.id, "corridor");

  while (game.snapshot().progress < 0.69) game.step(step);
  snapshot = game.snapshot();
  assert.ok(snapshot.distance / snapshot.length < 0.68);
  assert.equal(snapshot.distanceProgress, snapshot.distance / snapshot.length);
  assert.equal(snapshot.zone.id, "corridor");

  while (game.snapshot().distance / game.snapshot().length < 0.68) game.step(step);
  assert.equal(game.snapshot().zone.id, "elevator");
});

test("기본 코스는 하린 보조 없이 같은 점프 타이밍으로 perfect와 수집 3개를 달성할 수 있다", () => {
  const game = Core.create({ assist: false });
  const step = 1 / 120;
  let jumpLatched = false;

  for (let frame = 0; frame < 120 * 80 && !game.snapshot().finished; frame += 1) {
    const snapshot = game.snapshot();
    const unresolved = snapshot.course.filter((object) => !snapshot.resolved.has(object.id));
    const slideTarget = unresolved.find((object) => object.kind === "hazard"
      && object.avoid === "slide"
      && object.x - snapshot.distance < 135
      && object.x + object.width - snapshot.distance > -95);
    game.setSlide(Boolean(slideTarget) && snapshot.y <= 1);

    const jumpTarget = unresolved.find((object) => (object.kind === "item"
      || (object.kind === "hazard" && object.avoid === "jump"))
      && object.x - snapshot.distance < 98
      && object.x - snapshot.distance > 0);
    if (jumpTarget && snapshot.y <= 1 && !slideTarget && !jumpLatched) {
      game.pressJump();
      jumpLatched = true;
    }
    if (snapshot.velocityY < 0 && snapshot.y < 35) game.releaseJump();
    if (snapshot.y <= 1 && !jumpTarget) jumpLatched = false;
    game.step(step);
  }

  assert.deepEqual(game.result(), {
    grade: "perfect",
    caught: false,
    elapsed: 62.6,
    hitCount: 0,
    collectedItems: ["access-card", "phone", "backup-usb"],
    maxCombo: 3,
  });
  assert.equal(game.snapshot().assistUsed, false);
});

test("개발용 단축 코스는 기본 장애물 간격을 전체 길이에 맞춰 축소한다", () => {
  const shortLength = Core.DEFAULT_LENGTH / 4;
  const game = Core.create({ duration: 16, length: shortLength });
  assert.equal(game.snapshot().course[0].x, Core.COURSE[0].x / 4);
  assert.equal(game.snapshot().course.at(-1).x, Core.COURSE.at(-1).x / 4);
});

test("새 위험은 충돌 900ms보다 먼저 경고 이벤트를 발생시킨다", () => {
  const course = [
    { id: "warned", kind: "hazard", type: "chair", x: 420, width: 70, height: 42 },
  ];
  const game = Core.create({ duration: 8, length: 1800, course, assist: false });
  let warning;
  for (let elapsed = 0; elapsed < 2 && !warning; elapsed += 1 / 60) {
    game.step(1 / 60);
    warning = game.drainEvents().find((event) => event.type === "telegraph");
  }
  assert.ok(warning);
  assert.ok(warning.leadTime >= 0.9);
});

test("a jump hazard exposes prepare, queue-ready, and physical action windows in order", () => {
  const course = [
    { id: "phased", kind: "hazard", type: "chair", avoid: "jump", x: 420, width: 70, height: 42 },
  ];
  const game = Core.create({ duration: 8, length: 1800, course, assist: false });
  const phases = [];
  let lastState = "";

  for (let elapsed = 0; elapsed < 2.5 && phases.length < 3; elapsed += 1 / 240) {
    game.step(1 / 240);
    const upcoming = game.snapshot().upcomingHazard;
    const cueState = upcoming ? `${upcoming.telegraphPhase}:${upcoming.jumpQueueReady}` : "";
    if (upcoming && cueState !== lastState) {
      phases.push({ state: cueState, leadTime: upcoming.leadTime });
      lastState = cueState;
    }
  }

  assert.deepEqual(phases.map((entry) => entry.state), [
    "prepare:false",
    "prepare:true",
    "act:true",
  ]);
  assert.ok(phases[0].leadTime >= Core.MIN_PREPARE_LEAD_TIME - 0.01);
  assert.ok(phases[1].leadTime <= Core.JUMP_QUEUE_LEAD_TIME);
  assert.ok(phases[1].leadTime >= 0.5);
  assert.ok(phases[2].leadTime <= 0.26);
  assert.ok(phases[2].leadTime >= 0.2);
});

test("the physical jump window forgives immediate and 50ms-delayed held input", () => {
  for (const reactionDelay of [0, 0.05]) {
    const game = Core.create({ assist: false });
    const step = 1 / 240;
    let upcoming = null;
    while (upcoming?.id !== "chair-tutorial" || upcoming.telegraphPhase !== "act") {
      game.step(step);
      upcoming = game.snapshot().upcomingHazard;
    }
    advance(game, reactionDelay, step);
    game.pressJump();
    advance(game, 0.42, step);
    game.releaseJump();
    advance(game, 0.8, step);
    assert.equal(game.snapshot().hitCount, 0, `reaction delay ${reactionDelay}s should clear the chair`);
  }
});

test("a committed tutorial jump turns one-frame taps into the same successful action across 150ms reactions", () => {
  for (const reactionDelay of [0, 0.05, 0.1, 0.15]) {
    const game = Core.create({ assist: false });
    const step = 1 / 240;
    let upcoming = null;
    while (upcoming?.id !== "chair-tutorial" || !upcoming.jumpQueueReady) {
      game.step(step);
      upcoming = game.snapshot().upcomingHazard;
    }
    advance(game, reactionDelay, step);
    while (upcoming?.id === "chair-tutorial" && upcoming.telegraphPhase !== "act") {
      game.step(step);
      upcoming = game.snapshot().upcomingHazard;
    }
    game.commitJump(0.42);
    game.step(step);
    game.releaseJump();
    advance(game, 1.1, step);
    assert.equal(game.snapshot().hitCount, 0, `reaction delay ${reactionDelay}s should clear with a tap commit`);
    assert.equal(game.snapshot().resolved.has("chair-tutorial"), true);
  }
});

test("the tutorial 900ms reservation executes once at the physical action window across frame rates", () => {
  const runBufferedTap = (step) => {
    const game = Core.create({ assist: false });
    let upcoming = null;
    const events = [];
    while (upcoming?.id !== "chair-tutorial" || upcoming.leadTime > 0.9) {
      game.step(step);
      events.push(...game.drainEvents());
      upcoming = game.snapshot().upcomingHazard;
    }
    assert.ok(upcoming.leadTime <= 0.9, `step ${step}s should enter the reservation window`);
    while (upcoming?.id === "chair-tutorial" && upcoming.telegraphPhase !== "act") {
      game.step(step);
      events.push(...game.drainEvents());
      upcoming = game.snapshot().upcomingHazard;
    }
    const executionLead = upcoming.leadTime;
    game.commitJump(0.42);
    game.releaseJump();
    advance(game, 1.2, step);
    events.push(...game.drainEvents());
    return { snapshot: game.snapshot(), events, executionLead };
  };

  for (const step of [1 / 240, 1 / 120, 1 / 60, 1 / 30, 0.05]) {
    const { snapshot, events, executionLead } = runBufferedTap(step);
    assert.ok(executionLead <= 0.26, `step ${step}s should execute by the 260ms threshold`);
    assert.ok(executionLead >= 0.2 - step, `step ${step}s should retain physical jump lead`);
    assert.equal(snapshot.hitCount, 0, `step ${step}s should clear the tutorial chair`);
    assert.equal(snapshot.assistUsed, false);
    assert.equal(snapshot.resolved.has("chair-tutorial"), true);
    assert.equal(events.filter((event) => event.type === "avoid"
      && event.object.id === "chair-tutorial").length, 1);
    assert.equal(events.some((event) => event.type === "hit" || event.type === "assist"), false);
  }
});

test("cancelling a committed jump removes its buffer and held gravity immediately", () => {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  game.commitJump(0.42);
  game.cancelJump();
  advance(game, 0.5);
  assert.equal(game.snapshot().y, game.snapshot().groundY);
  assert.equal(game.snapshot().jumpHeld, false);
  assert.equal(game.drainEvents().some((event) => event.type === "jump"), false);
});

test("기본 코스의 모든 위험은 최종 속도 구간에서도 1.25초에 가깝게 먼저 예고된다", () => {
  const game = Core.create({ assist: false });
  const warnings = [];
  while (!game.snapshot().finished) {
    game.step(1 / 240);
    warnings.push(...game.drainEvents().filter((event) => event.type === "telegraph"));
  }
  const hazards = Core.COURSE.filter((object) => object.kind === "hazard");
  assert.equal(warnings.length, hazards.length);
  assert.equal(Core.MIN_PREPARE_LEAD_TIME, 1.25);
  assert.ok(Math.min(...warnings.map((event) => event.leadTime)) >= Core.MIN_PREPARE_LEAD_TIME - 0.05);
});

test("collision-aware cue policy avoids all 16 hazards at 30-240Hz and a 50ms stress step", () => {
  const hazardIds = Core.COURSE
    .filter((object) => object.kind === "hazard")
    .map((object) => object.id);

  for (const step of [1 / 240, 1 / 120, 1 / 60, 1 / 30, 0.05]) {
    const game = Core.create({ assist: false });
    const scheduledAt = new Map();
    const queued = new Set();
    const executed = new Set();
    const avoided = [];

    while (!game.snapshot().finished) {
      const snapshot = game.snapshot();
      const upcoming = snapshot.upcomingHazard;
      if (upcoming && !scheduledAt.has(upcoming.id)) {
        if (upcoming.avoid === "jump" && upcoming.jumpQueueReady) {
          scheduledAt.set(upcoming.id, snapshot.elapsed + 0.15);
        } else if (upcoming.avoid === "slide" && upcoming.telegraphPhase === "act") {
          scheduledAt.set(upcoming.id, snapshot.elapsed + 0.5);
        }
      }

      const triggerAt = scheduledAt.get(upcoming?.id);
      if (triggerAt !== undefined && snapshot.elapsed >= triggerAt && !executed.has(upcoming.id)) {
        if (upcoming.avoid === "jump") {
          queued.add(upcoming.id);
        } else {
          game.commitSlide(upcoming.clearLeadTime + 0.05);
          executed.add(upcoming.id);
        }
      }
      if (upcoming?.avoid === "jump"
        && queued.has(upcoming.id)
        && upcoming.telegraphPhase === "act"
        && !executed.has(upcoming.id)) {
        game.commitJump(0.42);
        game.releaseJump();
        executed.add(upcoming.id);
      }

      game.step(step);
      for (const event of game.drainEvents()) {
        if (event.type === "avoid") avoided.push(event.object.id);
        assert.notEqual(event.type, "hit", `${event.object?.id || "unknown"} hit at ${step}s`);
        assert.notEqual(event.type, "assist", `${event.object?.id || "unknown"} used assist at ${step}s`);
      }
    }

    assert.deepEqual(avoided, hazardIds, `every hazard should be avoided at ${step}s`);
    assert.equal(game.snapshot().hitCount, 0);
  }
});

test("첫 충돌은 하린 보조가 막고 다음 충돌부터 피격으로 센다", () => {
  const course = [
    { id: "a", kind: "hazard", type: "chair", x: 40, width: 70, height: 42 },
    { id: "b", kind: "hazard", type: "chair", x: 180, width: 70, height: 42 },
  ];
  const game = Core.create({ duration: 8, length: 1800, course });
  advance(game, 1.2);
  const types = game.drainEvents().map((event) => event.type);
  assert.ok(types.includes("assist"));
  assert.ok(types.includes("hit"));
  assert.equal(game.snapshot().assistUsed, true);
  assert.equal(game.snapshot().hitCount, 1);
  assert.equal(game.snapshot().maxCombo, 0);
});

test("위험 판정의 오른쪽 끝을 완전히 지난 프레임에 avoid를 한 번만 보낸다", () => {
  const object = { id: "clear-drawer", kind: "hazard", type: "drawer", avoid: "slide", x: 150, y: 58, width: 120, height: 48 };
  const game = Core.create({ duration: 8, length: 1800, course: [object], assist: false });
  const avoidEvents = [];
  let clearSnapshot = null;
  game.setSlide(true);

  for (let frame = 0; frame < 360 && avoidEvents.length === 0; frame += 1) {
    game.step(1 / 240);
    const events = game.drainEvents();
    avoidEvents.push(...events.filter((event) => event.type === "avoid"));
    if (avoidEvents.length) clearSnapshot = game.snapshot();
  }

  const collisionRight = object.x + object.width * 0.91;
  assert.equal(avoidEvents.length, 1);
  assert.equal(avoidEvents[0].object.id, object.id);
  assert.ok(collisionRight < clearSnapshot.playerRect.x);
  assert.equal(clearSnapshot.hitCount, 0);
  assert.equal(clearSnapshot.resolved.has(object.id), true);

  advance(game, 0.8);
  assert.equal(game.drainEvents().filter((event) => event.type === "avoid").length, 0);
});

test("피격되거나 하린 보조로 해소된 위험에는 avoid 성공 이벤트를 보내지 않는다", () => {
  for (const assist of [false, true]) {
    const game = Core.create({
      duration: 8,
      length: 1800,
      assist,
      course: [{ id: `blocked-${assist}`, kind: "hazard", type: "chair", avoid: "jump", x: 80, width: 70, height: 42 }],
    });
    advance(game, 1.4);
    const types = game.drainEvents().map((event) => event.type);
    assert.equal(types.includes("avoid"), false);
    assert.equal(types.includes(assist ? "assist" : "hit"), true);
  }
});

test("점프로 낮은 장애물을 피하고 공중 수집물을 얻는다", () => {
  const course = [
    { id: "hazard", kind: "hazard", type: "chair", x: 150, width: 65, height: 40 },
    { id: "item", kind: "item", type: "phone", x: 180, y: 95, width: 34, height: 38 },
  ];
  const game = Core.create({ duration: 8, length: 1800, course, assist: false });
  advance(game, 0.38);
  game.pressJump();
  advance(game, 0.7);
  assert.equal(game.snapshot().hitCount, 0);
  assert.deepEqual(game.snapshot().collectedItems, ["phone"]);
  assert.equal(game.snapshot().maxCombo, 1);
});

test("슬라이드로 머리 높이 장애물을 피한다", () => {
  const course = [
    { id: "drawer", kind: "hazard", type: "drawer", x: 150, y: 58, width: 120, height: 48 },
  ];
  const game = Core.create({ duration: 8, length: 1800, course, assist: false });
  game.setSlide(true);
  advance(game, 1);
  assert.equal(game.snapshot().hitCount, 0);
});

test("착지 직전 150ms 안에 누른 점프는 버퍼에 남아 착지 즉시 실행된다", () => {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  const step = 1 / 240;
  game.pressJump();
  game.step(step);
  game.releaseJump();
  assert.equal(game.drainEvents().filter((event) => event.type === "jump").length, 1);

  const landingTime = (snapshot) => {
    const height = snapshot.y - snapshot.groundY;
    return (snapshot.velocityY + Math.sqrt(snapshot.velocityY ** 2 + 2 * Core.GRAVITY * height)) / Core.GRAVITY;
  };
  while (game.snapshot().velocityY >= 0 || landingTime(game.snapshot()) > 0.14) game.step(step);
  game.pressJump();
  let bufferedJump = false;
  for (let frame = 0; frame < 60 && !bufferedJump; frame += 1) {
    game.step(step);
    bufferedJump = game.drainEvents().some((event) => event.type === "jump");
  }

  assert.equal(Core.JUMP_BUFFER, 0.15);
  assert.equal(bufferedJump, true);
  assert.ok(game.snapshot().velocityY > 0);
});

test("착지 150ms보다 먼저 누른 점프는 버퍼가 만료되어 자동 실행되지 않는다", () => {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  const step = 1 / 240;
  game.pressJump();
  game.step(step);
  game.releaseJump();
  game.drainEvents();
  const landingTime = (snapshot) => {
    const height = snapshot.y - snapshot.groundY;
    return (snapshot.velocityY + Math.sqrt(snapshot.velocityY ** 2 + 2 * Core.GRAVITY * height)) / Core.GRAVITY;
  };
  while (game.snapshot().velocityY >= 0 || landingTime(game.snapshot()) > 0.18) game.step(step);
  game.pressJump();
  advance(game, 0.35, step);
  assert.equal(game.drainEvents().some((event) => event.type === "jump"), false);
  assert.equal(game.snapshot().y, game.snapshot().groundY);
});

test("발판을 벗어난 뒤 120ms 안에는 코요테 점프가 되고 이후에는 만료된다", () => {
  const step = 1 / 240;
  const createLedgeGame = () => Core.create({
    duration: 8,
    length: 1800,
    course: [],
    groundHeightAt: (distance) => distance < 60 ? 0 : -1000,
  });
  const withinGrace = createLedgeGame();
  while (withinGrace.snapshot().groundY === 0) withinGrace.step(step);
  advance(withinGrace, 0.08, step);
  withinGrace.pressJump();
  withinGrace.step(step);
  assert.equal(withinGrace.drainEvents().some((event) => event.type === "jump"), true);
  assert.ok(withinGrace.snapshot().velocityY > 0);

  const expired = createLedgeGame();
  while (expired.snapshot().groundY === 0) expired.step(step);
  advance(expired, 0.14, step);
  expired.pressJump();
  advance(expired, 0.05, step);
  assert.equal(expired.drainEvents().some((event) => event.type === "jump"), false);
  assert.equal(Core.COYOTE_TIME, 0.12);
});

test("피격 뒤 800ms 동안 다음 장애물과 겹쳐도 연속 피격되지 않는다", () => {
  const course = [
    { id: "a", kind: "hazard", type: "chair", x: 80, width: 90, height: 42 },
    { id: "b", kind: "hazard", type: "chair", x: 170, width: 90, height: 42 },
  ];
  const game = Core.create({ duration: 8, length: 1800, course, assist: false });
  advance(game, 1);
  assert.equal(game.snapshot().hitCount, 1);
  assert.equal(game.snapshot().resolved.has("b"), true);
});

test("피격 뒤 700ms 속도 저하가 적용되지만 자동 달리기는 멈추지 않는다", () => {
  const course = [
    { id: "slow", kind: "hazard", type: "chair", x: 40, width: 70, height: 42 },
  ];
  const hitGame = Core.create({ duration: 8, length: 1800, course, assist: false });
  const cleanGame = Core.create({ duration: 8, length: 1800, course: [], assist: false });
  advance(hitGame, 0.4);
  advance(cleanGame, 0.4);
  assert.equal(hitGame.snapshot().hitCount, 1);
  assert.ok(hitGame.snapshot().slowTimer > 0);
  assert.ok(hitGame.snapshot().distance > 0);
  assert.ok(hitGame.snapshot().distance < cleanGame.snapshot().distance);
});

test("세 번 피격된 완주는 caught 결과와 finish 이벤트를 정확히 한 번 낸다", () => {
  const course = [40, 360, 720].map((x, index) => ({
    id: `caught-${index}`,
    kind: "hazard",
    type: "chair",
    x,
    width: 72,
    height: 101,
  }));
  const game = Core.create({ duration: 8, length: 9999, course, assist: false });
  advance(game, 9);
  const events = game.drainEvents();
  assert.equal(events.filter((event) => event.type === "hit").length, 3);
  assert.equal(events.filter((event) => event.type === "finish").length, 1);
  assert.deepEqual(game.result(), {
    grade: "caught",
    caught: true,
    elapsed: 8,
    hitCount: 3,
    collectedItems: [],
    maxCombo: 0,
  });
});

test("위험 충돌 상자는 보이는 크기보다 가로와 세로가 각각 18% 작다", () => {
  const course = [
    { id: "edge", kind: "hazard", type: "drawer", x: 40, y: 90.5, width: 70, height: 20 },
  ];
  const game = Core.create({ duration: 8, length: 1800, course, assist: false });
  advance(game, 0.5);
  assert.equal(game.snapshot().resolved.has("edge"), true);
  assert.equal(game.snapshot().hitCount, 0);
  assert.equal(game.drainEvents().filter((event) => event.type === "avoid").length, 1);
});

test("short and held jumps differ by at least 55 logical pixels at their apex", () => {
  const shortApex = jumpApex(1 / 60);
  const longApex = jumpApex(0.42);
  assert.ok(longApex - shortApex >= 55, `expected >= 55px, got ${longApex - shortApex}px`);
});

test("snapshot exposes the standing and same-tick sliding player rect", () => {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  assert.deepEqual(game.snapshot().playerRect, { x: 8, y: 0, width: 48, height: 92 });
  game.setSlide(true);
  assert.equal(game.snapshot().sliding, true);
  assert.deepEqual(game.snapshot().playerRect, { x: 8, y: 0, width: 84, height: 46 });
});

test("a quick slide tap keeps pose and collider aligned for 80ms", () => {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  game.setSlide(true);
  game.setSlide(false);
  assert.equal(game.snapshot().sliding, true);
  assert.deepEqual(game.snapshot().playerRect, { x: 8, y: 0, width: 84, height: 46 });

  game.step(0.05);
  game.step(0.029);
  assert.equal(game.snapshot().sliding, true);
  game.step(0.002);
  assert.equal(game.snapshot().sliding, false);
  assert.equal(game.snapshot().playerRect.height, 92);
});

test("holding extends slide while cancellation clears its minimum immediately", () => {
  const held = Core.create({ duration: 8, length: 1800, course: [] });
  held.setSlide(true);
  advance(held, 0.12);
  assert.equal(held.snapshot().sliding, true);
  held.setSlide(false);
  assert.equal(held.snapshot().sliding, false);

  const cancelled = Core.create({ duration: 8, length: 1800, course: [] });
  cancelled.setSlide(true);
  cancelled.setSlide(false);
  cancelled.cancelSlide();
  assert.equal(cancelled.snapshot().sliding, false);

  const committed = Core.create({ duration: 8, length: 1800, course: [] });
  committed.commitSlide(1.4);
  assert.equal(committed.snapshot().sliding, true);
  committed.cancelSlide();
  assert.equal(committed.snapshot().sliding, false);
});

test("an action-window semantic slide commits one-frame taps through the obstacle across 400ms reactions at 30-240Hz", () => {
  for (const step of [1 / 240, 1 / 120, 1 / 60, 1 / 30]) {
    for (const reactionDelay of [0, 0.05, 0.1, 0.15, 0.3, 0.4]) {
      const course = [
        { id: "semantic-drawer", kind: "hazard", type: "drawer", avoid: "slide", x: 420, y: 58, width: 126, height: 40 },
      ];
      const game = Core.create({ duration: 8, length: 1800, course, assist: false });
      let upcoming = null;

      while (upcoming?.telegraphPhase !== "act") {
        game.step(step);
        upcoming = game.snapshot().upcomingHazard;
      }

      advance(game, reactionDelay, step);
      upcoming = game.snapshot().upcomingHazard;
      game.commitSlide(upcoming.clearLeadTime + 0.05);
      game.setSlide(false);
      assert.equal(game.snapshot().sliding, true);
      advance(game, upcoming.clearLeadTime + 0.12, step);
      assert.equal(game.snapshot().hitCount, 0);
      assert.equal(game.snapshot().sliding, false);
      advance(game, 0.6, step);
      assert.ok(game.snapshot().resolved.has("semantic-drawer"));
      assert.equal(game.snapshot().hitCount, 0);
    }
  }
});

test("jump buffering waits until the 80ms slide minimum has ended", () => {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  game.setSlide(true);
  game.setSlide(false);
  game.pressJump();
  game.step(0.05);
  assert.equal(game.snapshot().y, 0);
  game.step(0.031);
  assert.ok(game.snapshot().y > 0);
});

test("core snapshot collisionRect와 실제 충돌 이벤트는 100회 결정적 리플레이에서 일치한다", () => {
  const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
  const steps = [1 / 30, 1 / 60, 1 / 120, 1 / 240, 0.05];
  let replayCount = 0;
  let hitsOutsideVisibleSilhouette = 0;

  function runReplay(index) {
    const shouldHit = index % 2 === 0;
    const hazard = {
      id: `collider-${index}`,
      kind: "hazard",
      type: "drawer",
      avoid: "jump",
      x: 420 + index % 9,
      y: shouldHit ? 0 : 91,
      width: 80 + index % 7,
      height: shouldHit ? 60 : 20,
      label: "판정 감사",
    };
    const game = Core.create({ duration: 8, length: 1800, assist: false, course: [hazard] });
    const geometry = game.snapshot().activeObjects[0];
    let visibleOverlapSeen = false;
    let collisionOverlapSeen = false;
    let terminalEvent = null;
    let terminalFrame = -1;

    for (let frame = 0; frame < 900 && !terminalEvent; frame += 1) {
      const snapshot = game.step(steps[index % steps.length]);
      visibleOverlapSeen ||= overlaps(snapshot.playerRect, geometry.visibleRect);
      collisionOverlapSeen ||= overlaps(snapshot.playerRect, geometry.collisionRect);
      terminalEvent = game.drainEvents().find((event) => event.type === "hit" || event.type === "avoid") || null;
      if (terminalEvent) terminalFrame = frame;
    }

    if (terminalEvent?.type === "hit" && !visibleOverlapSeen) hitsOutsideVisibleSilhouette += 1;
    assert.equal(visibleOverlapSeen, true, `replay ${index} must cross the visible silhouette`);
    assert.equal(collisionOverlapSeen, shouldHit, `replay ${index} collider overlap mismatch`);
    assert.equal(terminalEvent?.type, shouldHit ? "hit" : "avoid", `replay ${index} event mismatch`);
    assert.equal(game.snapshot().hitCount, shouldHit ? 1 : 0);
    return {
      collisionOverlapSeen,
      eventType: terminalEvent.type,
      hitCount: game.snapshot().hitCount,
      terminalFrame,
      visibleOverlapSeen,
    };
  }

  for (let index = 0; index < 50; index += 1) {
    const first = runReplay(index);
    const second = runReplay(index);
    replayCount += 2;
    assert.deepEqual(second, first, `replay ${index} must be deterministic`);
  }

  assert.equal(replayCount, 100);
  assert.equal(hitsOutsideVisibleSilhouette, 0);
});

test("snapshot exposes active object visible, logical, and collision rects", () => {
  const course = [{ id: "rect", kind: "hazard", type: "drawer", x: 420, y: 58, width: 100, height: 50 }];
  const game = Core.create({ duration: 8, length: 1800, course });
  const object = game.snapshot().activeObjects[0];
  assert.deepEqual(object.logicalRect, { x: 420, y: 58, width: 100, height: 50 });
  assert.deepEqual(object.visibleRect, object.logicalRect);
  assert.deepEqual(object.collisionRect, { x: 429, y: 62.5, width: 82, height: 41 });
});
