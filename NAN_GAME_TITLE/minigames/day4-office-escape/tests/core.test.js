"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../core.js");

function advance(game, seconds, frame = 1 / 120) {
  for (let elapsed = 0; elapsed < seconds && !game.snapshot().finished; elapsed += frame) game.step(frame);
}

function scriptedPerfect(frame) {
  const game = Core.create({ assist: false });
  let lastId = "";
  while (!game.snapshot().finished) {
    const next = game.snapshot().upcomingHazard;
    if (next && next.id !== lastId && next.inputReady) {
      if (next.avoid === "jump") game.pressJump();
      else game.commitSlide();
      lastId = next.id;
    }
    game.step(frame);
  }
  return game;
}

test("고정 스텝 점프는 60·120·144Hz에서 같은 정점과 체공 시간을 낸다", () => {
  const samples = [1 / 60, 1 / 120, 1 / 144].map((frame) => {
    const game = Core.create({ duration: 8, length: 1800, course: [] });
    game.pressJump();
    let apex = 0;
    let airborneAt = null;
    let landedAt = null;
    while (game.snapshot().elapsed < 2) {
      game.step(frame);
      const snapshot = game.snapshot();
      apex = Math.max(apex, snapshot.y);
      if (airborneAt === null && snapshot.y > 0) airborneAt = snapshot.elapsed;
      if (airborneAt !== null && snapshot.y === 0) { landedAt = snapshot.elapsed; break; }
    }
    return { apex, air: landedAt - airborneAt };
  });
  for (const sample of samples) {
    assert.ok(sample.apex >= 145 && sample.apex <= 153, `apex ${sample.apex}`);
    assert.ok(sample.air >= 0.78 && sample.air <= 0.82, `air ${sample.air}`);
  }
  assert.ok(Math.max(...samples.map((sample) => sample.apex)) - Math.min(...samples.map((sample) => sample.apex)) <= Core.FIXED_STEP);
});

test("슬라이드는 한 번의 입력으로 0.7초이며 재입력으로 연장되지 않는다", () => {
  for (const frame of [1 / 60, 1 / 120, 1 / 144]) {
    const game = Core.create({ duration: 8, length: 1800, course: [] });
    game.commitSlide();
    advance(game, 0.3, frame);
    game.commitSlide();
    advance(game, 0.3, frame);
    assert.equal(game.snapshot().sliding, true, `still sliding at ${frame}`);
    advance(game, 0.12, frame);
    assert.equal(game.snapshot().sliding, false, `ended at ${frame}`);
    advance(game, 0.1, frame);
    game.commitSlide();
    assert.equal(game.snapshot().sliding, false, "0.15s recovery blocks re-entry");
    advance(game, 0.06, frame);
    game.commitSlide();
    assert.equal(game.snapshot().sliding, true, "slide is available after recovery");
  }
});

test("64초 코스는 18개 행동과 3개 수집물을 갖고 배경 순서를 고정한다", () => {
  const hazards = Core.COURSE.filter((object) => object.kind === "hazard");
  assert.equal(hazards.length, 18);
  assert.equal(hazards.filter((object) => object.avoid === "jump").length, 9);
  assert.equal(hazards.filter((object) => object.avoid === "slide").length, 9);
  assert.equal(Core.COURSE.filter((object) => object.kind === "item").length, 3);
  assert.deepEqual(Core.BACKGROUND_ROUTE.map((segment) => segment.scene), ["office", "office-b", "office-c", "office", "office-b", "office-c", "corridor", "corridor-b", "lobby-a", "lobby-b", "lobby-a"]);
  assert.ok(hazards.slice(1).every((object, index) => object.time - hazards[index].time >= 0.95));
  assert.equal(hazards[0].time, 5);
  assert.equal(hazards[1].time, 9);
});

test("배경은 마지막 0.7초에만 다음 구간으로 교차 전환하고 미세 이동한다", () => {
  const stable = Core.backgroundPresentationAt(5.29);
  assert.equal(stable.segment.id, "office-a");
  assert.equal(stable.nextSegment.id, "office-b");
  assert.equal(stable.mix, 0);
  assert.equal(stable.currentOpacity, 1);
  assert.equal(stable.nextOpacity, 0);

  const halfway = Core.backgroundPresentationAt(5.65);
  assert.equal(halfway.segment.id, "office-a");
  assert.ok(Math.abs(halfway.mix - 0.5) < 0.02);
  assert.ok(Math.abs(halfway.currentOpacity + halfway.nextOpacity - 1) < 0.000001);
  assert.ok(halfway.panPercent <= 0 && halfway.panPercent >= -3);

  const next = Core.backgroundPresentationAt(6);
  assert.equal(next.segment.id, "office-b");
  assert.equal(next.mix, 0);
  assert.equal(next.currentOpacity, 1);

  const last = Core.backgroundPresentationAt(63.9);
  assert.equal(last.segment.id, "lobby-a-repeat");
  assert.equal(last.nextSegment, null);
  assert.equal(last.mix, 0);
  assert.equal(Core.backgroundPresentationAt(5.65, { reducedMotion: true }).panPercent, 0);
});

test("행동 신호를 따르는 자동 플레이는 모든 프레임율에서 perfect, 무입력은 caught다", () => {
  for (const frame of [1 / 60, 1 / 120, 1 / 144]) {
    const game = scriptedPerfect(frame);
    assert.equal(game.result().grade, "perfect");
    assert.equal(game.snapshot().hitCount, 0);
  }
  const idle = Core.create();
  advance(idle, 65);
  assert.equal(idle.result().grade, "caught");
  assert.equal(idle.snapshot().assistUsed, true);
});

test("swept AABB는 큰 프레임에서도 빠른 장애물을 관통하지 않고, 무적 시간은 중복 피격을 막는다", () => {
  const game = Core.create({
    duration: 8,
    length: 1800,
    assist: false,
    course: [
      { id: "fast-a", kind: "hazard", type: "chair", avoid: "jump", x: 150, y: 0, width: 72, height: 42 },
      { id: "fast-b", kind: "hazard", type: "chair", avoid: "jump", x: 208, y: 0, width: 72, height: 42 },
    ],
  });
  advance(game, 1, 0.2);
  assert.equal(game.snapshot().hitCount, 1);
  assert.equal(game.snapshot().activeObjects.length, 0);
});

test("hit·avoid·collect로 해결된 오브젝트는 active 목록에서 빠지고 결과 이벤트를 반복하지 않는다", () => {
  const cases = [
    {
      id: "hit-once",
      object: { id: "hit-once", kind: "hazard", type: "chair", avoid: "jump", x: 70, y: 0, width: 72, height: 42 },
      event: "hit",
    },
    {
      id: "avoid-once",
      object: { id: "avoid-once", kind: "hazard", type: "chair", avoid: "jump", x: 70, y: 220, width: 72, height: 42 },
      event: "avoid",
    },
    {
      id: "collect-once",
      object: { id: "collect-once", kind: "item", type: "access-card", label: "출입카드", x: 70, y: 0, width: 38, height: 38 },
      event: "collect",
    },
  ];

  for (const scenario of cases) {
    const game = Core.create({ duration: 8, length: 1800, assist: false, course: [scenario.object] });
    advance(game, 1);
    const firstEvents = game.drainEvents();
    assert.equal(firstEvents.filter((event) => event.type === scenario.event).length, 1, scenario.id);
    assert.equal(game.snapshot().activeObjects.some((object) => object.id === scenario.id), false, scenario.id);
    advance(game, 1);
    assert.equal(game.drainEvents().filter((event) => event.type === scenario.event).length, 0, `${scenario.id} repeated`);
  }
});

test("장애물은 불투명 경계로 확대되고 충돌 상자는 보이는 영역 안에 남는다", () => {
  const game = Core.create();
  const hazards = game.snapshot().activeObjects.filter((object) => object.kind === "hazard");
  const chair = hazards.find((object) => object.type === "chair");
  const cart = hazards.find((object) => object.type === "cart");
  const cable = hazards.find((object) => object.type === "cable");

  assert.ok(chair.visibleRect.height > chair.logicalRect.height * 2);
  assert.ok(cart.visibleRect.height > cart.logicalRect.height * 1.8);
  assert.ok(cable.visibleRect.height >= cable.logicalRect.height);
  assert.equal(chair.visibleRect.width, chair.logicalRect.width);
  assert.ok(chair.artRect.width > chair.visibleRect.width);
  assert.equal(chair.artRect.width, chair.artRect.height);

  for (const object of hazards) {
    const { visibleRect, collisionRect } = object;
    assert.ok(collisionRect.x >= visibleRect.x);
    assert.ok(collisionRect.y >= visibleRect.y);
    assert.ok(collisionRect.x + collisionRect.width <= visibleRect.x + visibleRect.width);
    assert.ok(collisionRect.y + collisionRect.height <= visibleRect.y + visibleRect.height);
  }
});

test("단일 화면 투영은 player body와 bottom-center 앵커를 세 해상도에서 1px 이내로 일치시킨다", () => {
  const poses = [];
  const running = Core.create({ duration: 8, length: 1800, course: [] });
  poses.push(running.snapshot());

  const jumping = Core.create({ duration: 8, length: 1800, course: [] });
  jumping.pressJump();
  jumping.step(0.2);
  poses.push(jumping.snapshot());

  const sliding = Core.create({ duration: 8, length: 1800, course: [] });
  sliding.commitSlide();
  sliding.step(Core.FIXED_STEP);
  poses.push(sliding.snapshot());

  for (const [width, height] of [[1280, 641], [1440, 814], [1920, 982]]) {
    const screenCenters = poses.map((snapshot) => {
      const projection = Core.screenProjection(snapshot, width, height);
      const body = Core.projectWorldRect(snapshot.playerRect, projection);
      const anchor = Core.projectWorldPoint(snapshot.playerAnchor, projection);
      assert.ok(Math.abs(body.left + body.width / 2 - projection.playerAnchorX) <= 0.000001);
      assert.ok(Math.abs(anchor.x - projection.playerAnchorX) <= 0.000001);
      assert.ok(Math.abs(projection.ground - height * 0.09) <= 0.000001);
      return anchor.x;
    });
    assert.ok(Math.max(...screenCenters) - Math.min(...screenCenters) <= 1, `${width}px anchor drift`);
  }
});

test("슬라이드 player body는 달리기와 같은 물리 발 중심을 유지한다", () => {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  const standing = game.snapshot();
  game.commitSlide();
  const sliding = game.snapshot();
  assert.equal(standing.playerAnchor.x, sliding.playerAnchor.x);
  assert.equal(standing.playerRect.x + standing.playerRect.width / 2, standing.playerAnchor.x);
  assert.equal(sliding.playerRect.x + sliding.playerRect.width / 2, sliding.playerAnchor.x);
});

test("하린의 첫 방어 뒤 세 번 피격하면 caught이며 결과 이벤트는 한 번만 발생한다", () => {
  const course = [70, 360, 650, 940].map((x, index) => ({ id: `hit-${index}`, kind: "hazard", type: "chair", avoid: "jump", x, y: 0, width: 72, height: 42 }));
  const game = Core.create({ duration: 8, length: 1800, course });
  advance(game, 8.1);
  const events = game.drainEvents();
  assert.equal(events.filter((event) => event.type === "assist").length, 1);
  assert.equal(events.filter((event) => event.type === "hit").length, 3);
  assert.equal(events.filter((event) => event.type === "finish").length, 1);
  assert.equal(game.result().grade, "caught");
});
