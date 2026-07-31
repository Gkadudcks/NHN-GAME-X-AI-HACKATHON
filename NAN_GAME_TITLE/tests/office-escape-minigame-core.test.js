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
      && object.x - snapshot.distance < 94
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
    elapsed: 64,
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

test("기본 코스의 모든 위험은 최종 속도 구간에서도 900ms 이상 먼저 예고된다", () => {
  const game = Core.create({ assist: false });
  const warnings = [];
  while (!game.snapshot().finished) {
    game.step(0.05);
    warnings.push(...game.drainEvents().filter((event) => event.type === "telegraph"));
  }
  const hazards = Core.COURSE.filter((object) => object.kind === "hazard");
  assert.equal(warnings.length, hazards.length);
  assert.ok(Math.min(...warnings.map((event) => event.leadTime)) >= 0.9);
});

test("150ms 반응 지연 뒤 예고의 동작과 남은 시간만 사용해 모든 위험 유형을 피할 수 있다", () => {
  const templates = ["chair", "cable", "drawer", "papers", "cart", "sign"]
    .map((type) => Core.COURSE.find((object) => object.type === type));
  for (const template of templates) {
    const course = [{ ...template, id: `reaction-${template.type}`, x: 420 }];
    const game = Core.create({ duration: 8, length: 1800, course, assist: false });
    let warning;
    while (!warning) {
      game.step(1 / 240);
      warning = game.drainEvents().find((event) => event.type === "telegraph");
    }
    const actionLead = warning.object.avoid === "jump" ? 0.4 : 0.55;
    advance(game, Math.max(0.15, warning.leadTime - actionLead), 1 / 240);
    if (warning.object.avoid === "jump") game.pressJump();
    else game.setSlide(true);
    advance(game, 1.2, 1 / 240);
    game.releaseJump();
    game.setSlide(false);
    assert.equal(game.snapshot().hitCount, 0, `${template.type} should remain avoidable after reaction delay`);
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
  assert.equal(game.snapshot().resolved.has("edge"), false);
  assert.equal(game.snapshot().hitCount, 0);
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

test("snapshot exposes active object visible, logical, and collision rects", () => {
  const course = [{ id: "rect", kind: "hazard", type: "drawer", x: 420, y: 58, width: 100, height: 50 }];
  const game = Core.create({ duration: 8, length: 1800, course });
  const object = game.snapshot().activeObjects[0];
  assert.deepEqual(object.logicalRect, { x: 420, y: 58, width: 100, height: 50 });
  assert.deepEqual(object.visibleRect, object.logicalRect);
  assert.deepEqual(object.collisionRect, { x: 429, y: 62.5, width: 82, height: 41 });
});
