"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../core.js");
const Art = require("../art-assets.js");

function advance(game, seconds, frame = 1 / 120) {
  for (let elapsed = 0; elapsed < seconds && !game.snapshot().finished; elapsed += frame) game.step(frame);
}

function scriptedPerfect(frame) {
  const game = Core.create({ assist: false });
  const acted = new Set();
  while (!game.snapshot().finished) {
    const snapshot = game.snapshot();
    const speed = Core.speedAt(snapshot.elapsed, snapshot.duration, snapshot.length);
    const next = snapshot.activeObjects.find((object) => {
      if (object.kind !== "hazard" || acted.has(object.id)) return false;
      const entryGap = object.collisionRect.x - (snapshot.playerRect.x + snapshot.playerRect.width);
      return entryGap >= 0 && entryGap / speed <= Core.ACTION_LEAD_TIME[object.avoid];
    });
    if (next) {
      if (next.avoid === "jump") game.pressJump();
      else game.commitSlide();
      acted.add(next.id);
    }
    game.step(frame);
  }
  return game;
}

test("tutorial cue는 첫 jump·slide에서만 한 번 발행되고 새 게임에서 초기화된다", () => {
  function collectTutorialCues(game, seconds) {
    const emitted = [];
    const visible = new Map();
    for (let elapsed = 0; elapsed < seconds && !game.snapshot().finished; elapsed += Core.FIXED_STEP) {
      const upcoming = game.snapshot().upcomingHazard;
      if (upcoming) {
        if (!visible.has(upcoming.id)) visible.set(upcoming.id, new Set());
        visible.get(upcoming.id).add(upcoming.telegraphPhase);
      }
      game.step(Core.FIXED_STEP);
      emitted.push(...game.drainEvents().filter((event) => event.type === "telegraph"));
    }
    return { emitted, visible };
  }

  const firstRun = collectTutorialCues(Core.create({ assist: false }), Core.DEFAULT_DURATION);
  assert.deepEqual(firstRun.emitted.map((event) => event.object.id), ["hazard-01", "hazard-02"]);
  assert.deepEqual(firstRun.emitted.map((event) => event.object.avoid), ["jump", "slide"]);
  assert.deepEqual([...firstRun.visible.keys()], ["hazard-01", "hazard-02"]);
  assert.deepEqual([...firstRun.visible.get("hazard-01")].sort(), ["act", "prepare"]);
  assert.deepEqual([...firstRun.visible.get("hazard-02")].sort(), ["act", "prepare"]);

  const restarted = collectTutorialCues(Core.create({ assist: false }), 11);
  assert.deepEqual(restarted.emitted.map((event) => event.object.id), ["hazard-01", "hazard-02"]);
});

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

test("점프 입력은 실행 가능한 순간에만 시작되고 공중·슬라이드 입력을 예약하지 않는다", () => {
  const jumping = Core.create({ duration: 8, length: 1800, course: [] });
  assert.equal(jumping.pressJump(), true);
  assert.ok(jumping.snapshot().y > 0);
  jumping.drainEvents();
  assert.equal(jumping.pressJump(), false, "midair input is discarded");
  advance(jumping, 1);
  assert.equal(jumping.snapshot().y, 0);
  assert.equal(jumping.drainEvents().filter((event) => event.type === "jump").length, 0, "landing does not replay input");

  const sliding = Core.create({ duration: 8, length: 1800, course: [] });
  assert.equal(sliding.commitSlide(), true, "grounded slide starts immediately");
  assert.equal(sliding.commitSlide(), false, "active slide rejects repeated input");
  sliding.drainEvents();
  assert.equal(sliding.pressJump(), false, "sliding input is discarded");
  advance(sliding, 0.72);
  assert.equal(sliding.snapshot().sliding, false);
  assert.equal(sliding.snapshot().y, 0);
  assert.equal(sliding.drainEvents().filter((event) => event.type === "jump").length, 0, "slide end does not replay input");
  assert.equal(sliding.pressJump(), true, "jump remains immediate after the visible slide ends");

  const airborneSlide = Core.create({ duration: 8, length: 1800, course: [] });
  assert.equal(airborneSlide.pressJump(), true);
  assert.equal(airborneSlide.commitSlide(), false, "midair slide input is discarded");
  assert.equal(airborneSlide.setSlide(true), false, "setSlide reports the same rejected input");
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
  assert.ok(hazards.slice(1).every((object, index) => object.time - hazards[index].time >= Core.MIN_HAZARD_GAP_SECONDS));
  assert.equal(hazards[0].time, 5);
  assert.equal(hazards[1].time, 9);
  assert.equal(hazards.map((object) => object.avoid).join(","), "jump,slide,jump,slide,jump,jump,slide,slide,jump,slide,slide,jump,jump,slide,slide,jump,jump,slide");
  assert.deepEqual(Core.COURSE_STAGES.map((stage) => stage.id), ["learning", "mixed", "finale"]);
  assert.deepEqual(hazards.filter((object) => object.stage === "learning").map((object) => object.pattern), ["introduce", "introduce", "reinforce", "reinforce"]);
  assert.ok(hazards.some((object, index) => index > 0 && object.avoid === hazards[index - 1].avoid), "mixed/finale contains repeated actions");
  assert.equal(hazards[0].width, 76 * 0.7);
  assert.equal(hazards[0].height, 42 * 0.7);
  assert.equal(hazards[1].width, Core.OVERHEAD_HAZARD_WIDTH);
  assert.equal(hazards[1].height, Core.OVERHEAD_HAZARD_HEIGHT);
  assert.equal(hazards[1].y, Core.OVERHEAD_HAZARD_BOTTOM);
  assert.equal(hazards.filter((object) => object.type === "sign").length, 5);
  assert.equal(hazards.filter((object) => object.type === "overhead-duct").length, 4);
  assert.ok(hazards.filter((object) => object.avoid === "slide").every((object) => object.type === "sign" || object.type === "overhead-duct"));
  assert.ok(hazards.every((object) => object.type !== "drawer" && object.type !== "overhead-cabinet"));
});

test("기본 64초와 beat 시각은 유지하면서 world 접근 속도는 정확히 1.5배다", () => {
  const oldDistanceAt = (elapsed, duration, length) => {
    const p = Math.max(0, Math.min(1, elapsed / duration));
    return length * (0.88 * p + 0.12 * p * p);
  };
  const oldSpeedAt = (elapsed, duration, length) => {
    const p = Math.max(0, Math.min(1, elapsed / duration));
    return (length / duration) * (0.88 + 0.24 * p);
  };
  assert.equal(Core.WORLD_SPEED_MULTIPLIER, 1.5);
  assert.equal(Core.PRODUCTION_HAZARD_SCALE, 0.7);
  assert.equal(Core.distanceAt(32, 64, 16000), oldDistanceAt(32, 64, 16000) * 1.5);
  assert.equal(Core.speedAt(32, 64, 16000), oldSpeedAt(32, 64, 16000) * 1.5);
  const game = Core.create();
  advance(game, 65);
  assert.equal(game.result().elapsed, 64);
  assert.equal(game.snapshot().distanceProgress, 1);
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

test("ACT 신호에 직접 반응하면 모든 프레임율에서 perfect, 무입력은 caught다", () => {
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

test("추격 압박은 구간·assist·피격에 따라 가까워지고 회복하며 결과 계약을 바꾸지 않는다", () => {
  assert.equal(Core.chasePressureFor("learning"), 0.18);
  assert.equal(Core.chasePressureFor("mixed"), 0.28);
  assert.equal(Core.chasePressureFor("finale"), 0.38);
  assert.equal(Core.chasePressureFor("finale", 1), Core.CHASE_PRESSURE.maximum);

  const game = Core.create({
    duration: 8,
    length: 1800,
    course: [{ id: "pressure-hit", kind: "hazard", type: "chair", avoid: "jump", x: 200, y: 0, width: 72, height: 42 }],
  });
  const before = game.snapshot();
  let assistSnapshot = null;
  while (!assistSnapshot) {
    game.step(1 / 120);
    if (game.drainEvents().some((event) => event.type === "assist")) assistSnapshot = game.snapshot();
  }
  assert.equal(assistSnapshot.chaseState, "closing");
  assert.ok(assistSnapshot.chasePressure > before.chasePressure);
  advance(game, 0.55);
  assert.equal(game.snapshot().chaseState, "steady");
  assert.equal(game.result().grade, "perfect");
  assert.deepEqual(Object.keys(game.result()).sort(), ["caught", "collectedItems", "elapsed", "grade", "hitCount", "maxCombo"]);
});

test("점프·슬라이드는 PREP와 ACT 어느 cue 단계에서도 다음 fixed step 안에 직접 시작한다", () => {
  for (const phase of ["prepare", "act"]) {
    for (const action of ["jump", "slide"]) {
      const object = {
        id: `direct-${phase}-${action}`,
        kind: "hazard",
        type: action === "jump" ? "chair" : "drawer",
        avoid: action,
        x: phase === "prepare" ? 280 : 70,
        y: action === "slide" ? 56 : 0,
        width: 76,
        height: action === "slide" ? 36 : 42,
      };
      const game = Core.create({ duration: 8, length: 1800, assist: false, course: [object] });
      assert.equal(game.snapshot().upcomingHazard.telegraphPhase, phase, `${phase} ${action} cue`);

      if (action === "jump") game.pressJump();
      else game.commitSlide();
      game.step(Core.FIXED_STEP);

      const snapshot = game.snapshot();
      const events = game.drainEvents();
      assert.equal(events.filter((event) => event.type === action).length, 1, `${phase} ${action} event`);
      if (action === "jump") {
        assert.ok(snapshot.y > 0, `${phase} jump y`);
        assert.ok(snapshot.velocityY > 0, `${phase} jump velocity`);
      } else {
        assert.equal(snapshot.sliding, true, `${phase} slide state`);
      }
      assert.equal(Object.hasOwn(snapshot, "reservedInput"), false);
      assert.equal(Object.hasOwn(snapshot.upcomingHazard || {}, "inputQueued"), false);
    }
  }
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

test("승인 pose 메트릭은 공통 projection에서 발바닥 중심을 1px 이내로 고정한다", () => {
  const game = Core.create({ duration: 8, length: 1800, course: [] });
  const projection = Core.screenProjection(game.snapshot(), 1440, 814);
  const ids = [
    "minigame_character.doyun.run.right",
    "minigame_character.doyun.run_alt.right",
    "minigame_character.doyun.jump.right",
    "minigame_character.doyun.slide.right",
  ];
  const anchors = ids.map((id) => {
    const metric = Art.metrics(id);
    const geometry = Core.actorScreenGeometry(metric, { x: projection.playerAnchorX, bottom: projection.playerAnchorBottom }, projection);
    return geometry.host.left + metric.footAnchor.x * geometry.canvasSize;
  });
  assert.ok(Math.max(...anchors) - Math.min(...anchors) <= 1);
});

test("Phase 4R-A2 actor 메트릭과 player profile은 4R-A 값의 정확히 0.70배다", () => {
  const canonicalHeights = {
    "minigame_character.doyun.run.right": 141.12,
    "minigame_character.doyun.run_alt.right": 141.12,
    "minigame_character.doyun.jump.right": 141.12,
    "minigame_character.doyun.slide.right": 77.49,
    "minigame_character.harin.run.right": 135.45,
    "minigame_character.harin.run_alt.right": 135.45,
    "minigame_character.harin.assist.right": 135.45,
    "minigame_character.boss.chase.right": 146.79,
    "minigame_character.boss.chase_alt.right": 146.79,
    "minigame_character.boss.call.right": 146.79,
  };
  for (const [id, expected] of Object.entries(canonicalHeights)) {
    assert.equal(Art.metrics(id).canonicalOpaqueHeight, expected, id);
  }
  assert.equal(Core.PLAYER_WIDTH, 80.01);
  assert.equal(Core.STANDING_HEIGHT, 105.84);
  assert.equal(Core.SLIDING_WIDTH, 71.19);
  assert.equal(Core.SLIDING_HEIGHT, 44.1);
  const almostEqual = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} !== ${expected}`);
  almostEqual(Core.PLAYER_PROFILES.run.referenceWidth, (224 * 386 / 512) * 0.63);
  almostEqual(Core.PLAYER_PROFILES.run.referenceHeight, 224 * 0.63);
  almostEqual(Core.PLAYER_PROFILES.jump.referenceWidth, (224 * 365 / 480) * 0.63);
  almostEqual(Core.PLAYER_PROFILES.jump.referenceHeight, 224 * 0.63);
  almostEqual(Core.PLAYER_PROFILES.slide.referenceWidth, (123 * 260 / 198) * 0.63);
  almostEqual(Core.PLAYER_PROFILES.slide.referenceHeight, (123 * 162 / 198) * 0.63);
});

test("1440x900 actor 대형은 46% 축에서 부장님을 점프 버튼 쪽에 두고 기존 gap을 지킨다", () => {
  const snapshot = Core.create({ duration: 8, length: 1800, course: [] }).snapshot();
  const projection = Core.screenProjection(snapshot, 1440, 827.1);
  const metrics = {
    doyun: Art.metrics("minigame_character.doyun.run.right"),
    harin: Art.metrics("minigame_character.harin.run.right"),
    boss: Art.metrics("minigame_character.boss.chase.right"),
  };
  const steady = Core.actorFormationGeometry(metrics, projection, Core.CHASE_PRESSURE.stageBase.learning);
  const maximum = Core.actorFormationGeometry(metrics, projection, Core.CHASE_PRESSURE.maximum);
  const horizontalIntersection = (left, right) => Math.max(0, Math.min(left.left + left.width, right.left + right.width) - Math.max(left.left, right.left));
  assert.equal(Core.VIEW_PLAYER_ANCHOR_X_RATIO, 0.46);
  assert.equal(projection.playerAnchorX, projection.width * 0.46);
  for (const [label, formation] of [["steady", steady], ["maximum", maximum]]) {
    const { boss, harin, doyun } = formation.actors;
    assert.ok(boss.silhouette.left + boss.silhouette.width <= harin.silhouette.left, `${label} boss -> Harin`);
    assert.ok(harin.silhouette.left + harin.silhouette.width <= doyun.silhouette.left, `${label} Harin -> Doyun`);
    assert.equal(horizontalIntersection(doyun.silhouette, harin.silhouette), 0);
    assert.equal(horizontalIntersection(harin.silhouette, boss.silhouette), 0);
  }
  const maximumGap = maximum.actors.harin.silhouette.left
    - (maximum.actors.boss.silhouette.left + maximum.actors.boss.silhouette.width);
  assert.ok(maximumGap >= Math.max(16, projection.width * 0.01), `maximum gap ${maximumGap}px`);
  assert.ok(Math.abs(maximumGap - Core.ACTOR_FORMATION.bossHarinMinimumGap * projection.scale) < 0.000001);
  const steadyBoss = steady.actors.boss.silhouette;
  const visibleBossWidth = Math.max(0, Math.min(projection.width, steadyBoss.left + steadyBoss.width) - Math.max(0, steadyBoss.left));
  assert.ok(visibleBossWidth / steadyBoss.width >= 0.8, `steady boss visible ${visibleBossWidth / steadyBoss.width}`);
  assert.ok(steadyBoss.left >= 70 && steadyBoss.left <= 100, `steady boss left ${steadyBoss.left}px`);
  const forwardView = projection.width - (steady.actors.doyun.silhouette.left + steady.actors.doyun.silhouette.width);
  assert.ok(forwardView >= projection.width * Core.ACTOR_FORMATION.minimumForwardViewRatio, `forward view ${forwardView}px`);
  const mechanicalPlayer = Core.projectWorldRect(snapshot.playerRect, projection);
  assert.ok(Math.abs(mechanicalPlayer.left + mechanicalPlayer.width / 2 - steady.anchors.doyun.x) < 0.000001);
});

test("고정 달리기 대형은 도윤 slide 포즈와 하린 assist 포즈에서도 동료 앵커를 유지한다", () => {
  const runGame = Core.create({ duration: 8, length: 1800, course: [] });
  const slideGame = Core.create({ duration: 8, length: 1800, course: [] });
  slideGame.commitSlide();
  slideGame.step(Core.FIXED_STEP);
  const formationMetrics = {
    doyun: Art.metrics("minigame_character.doyun.run.right"),
    harin: Art.metrics("minigame_character.harin.run.right"),
    boss: Art.metrics("minigame_character.boss.chase.right"),
  };
  const runProjection = Core.screenProjection(runGame.snapshot(), 1440, 827.1);
  const slideProjection = Core.screenProjection(slideGame.snapshot(), 1440, 827.1);
  const runFormation = Core.actorFormationGeometry(formationMetrics, runProjection, Core.CHASE_PRESSURE.stageBase.learning);
  const slideFormation = Core.actorFormationGeometry(formationMetrics, slideProjection, Core.CHASE_PRESSURE.stageBase.learning);

  assert.ok(Math.abs(runFormation.anchors.harin.x - slideFormation.anchors.harin.x) <= 1);
  assert.ok(Math.abs(runFormation.anchors.boss.x - slideFormation.anchors.boss.x) <= 1);
  const slideVisual = Core.actorScreenGeometry(
    Art.metrics("minigame_character.doyun.slide.right"),
    slideFormation.anchors.doyun,
    slideProjection,
  );
  const overlap = Math.max(0, Math.min(
    slideVisual.silhouette.left + slideVisual.silhouette.width,
    slideFormation.actors.harin.silhouette.left + slideFormation.actors.harin.silhouette.width,
  ) - Math.max(slideVisual.silhouette.left, slideFormation.actors.harin.silhouette.left));
  assert.ok(overlap > 0, "slide art may pass in front without moving Harin");
});

test("1440x900 첫 jump·slide 위험은 1.5배 속도에서도 충돌 전 0.8초 이상 보인다", () => {
  const game = Core.create();
  const enteredAt = new Map();
  const resolvedAt = new Map();
  const targets = new Set(["hazard-01", "hazard-02"]);
  while (game.snapshot().elapsed < 12 && resolvedAt.size < targets.size) {
    const snapshot = game.snapshot();
    const projection = Core.screenProjection(snapshot, 1440, 827.1);
    for (const object of snapshot.activeObjects) {
      if (!targets.has(object.id) || enteredAt.has(object.id)) continue;
      const screen = Core.projectWorldRect(object.visibleRect, projection);
      if (screen.left <= projection.width) enteredAt.set(object.id, snapshot.elapsed);
    }
    game.step(Core.FIXED_STEP);
    for (const event of game.drainEvents()) {
      if ((event.type === "assist" || event.type === "hit") && targets.has(event.object.id)) {
        resolvedAt.set(event.object.id, game.snapshot().elapsed);
      }
    }
  }
  for (const id of targets) {
    assert.ok(enteredAt.has(id), `${id} visible entry`);
    assert.ok(resolvedAt.has(id), `${id} collision`);
    assert.ok(resolvedAt.get(id) - enteredAt.get(id) >= 0.8, `${id} lead ${resolvedAt.get(id) - enteredAt.get(id)}`);
  }
});

test("첫 jump·slide는 행동 지속 구간 안에 장애물을 통과해 avoid로 끝난다", () => {
  const game = Core.create({ assist: false });
  const avoided = new Set();
  const acted = new Set();
  while (game.snapshot().elapsed < 12 && avoided.size < 2) {
    const upcoming = game.snapshot().upcomingHazard;
    if (upcoming && !acted.has(upcoming.id) && upcoming.telegraphPhase === "act") {
      if (upcoming.avoid === "jump") game.pressJump();
      else game.commitSlide();
      acted.add(upcoming.id);
    }
    game.step(Core.FIXED_STEP);
    for (const event of game.drainEvents()) {
      if (event.type === "avoid" && (event.object.id === "hazard-01" || event.object.id === "hazard-02")) avoided.add(event.object.id);
      assert.equal(event.type === "hit" || event.type === "assist", false, `${event.type} ${event.object?.id || ""}`);
    }
  }
  assert.deepEqual([...avoided].sort(), ["hazard-01", "hazard-02"]);
});

test("상부 구조물은 standing body와 겹치고 slide clearance를 비우며 시각·판정 경계가 4px 이내다", () => {
  const game = Core.create();
  const overhead = game.snapshot().activeObjects.find((object) => object.type === "overhead-duct");
  const standing = game.snapshot().playerRect;
  game.commitSlide();
  const sliding = game.snapshot().playerRect;
  const standingVerticalOverlap = Math.min(standing.y + standing.height, overhead.collisionRect.y + overhead.collisionRect.height)
    - Math.max(standing.y, overhead.collisionRect.y);
  assert.ok(standingVerticalOverlap > 0);
  assert.ok(overhead.collisionRect.y - (sliding.y + sliding.height) >= Core.SLIDE_CLEARANCE);

  const runMetric = Art.metrics("minigame_character.doyun.run.right");
  const opaqueWidth = runMetric.canonicalOpaqueHeight / runMetric.alphaBounds.height * runMetric.alphaBounds.width;
  assert.ok(overhead.visibleRect.width >= opaqueWidth * 0.85);
  assert.ok(overhead.visibleRect.height / runMetric.canonicalOpaqueHeight >= 0.14);
  assert.ok(overhead.visibleRect.height / runMetric.canonicalOpaqueHeight <= 0.2);

  const projection = Core.screenProjection(game.snapshot(), 1440, 827.1);
  const bottomDifference = (overhead.collisionRect.y - overhead.visibleRect.y) * projection.scale;
  const topDifference = ((overhead.visibleRect.y + overhead.visibleRect.height)
    - (overhead.collisionRect.y + overhead.collisionRect.height)) * projection.scale;
  assert.ok(bottomDifference <= 4, `bottom edge ${bottomDifference}px`);
  assert.ok(topDifference <= 4, `top edge ${topDifference}px`);
});

test("승인 간판은 고정봉까지 렌더링하되 기존 상단 충돌 상자와 slide clearance를 유지한다", () => {
  const game = Core.create();
  const sign = game.snapshot().activeObjects.find((object) => object.type === "sign");
  const standing = game.snapshot().playerRect;
  game.commitSlide();
  const sliding = game.snapshot().playerRect;

  assert.ok(sign.artRect.width > sign.logicalRect.width);
  assert.equal(sign.artRect.width, sign.artRect.height);
  assert.ok(sign.visibleRect.height > sign.logicalRect.height * 2);
  assert.ok(sign.collisionRect.x >= sign.visibleRect.x);
  assert.ok(sign.collisionRect.x + sign.collisionRect.width <= sign.visibleRect.x + sign.visibleRect.width);
  assert.ok(sign.collisionRect.y >= sign.visibleRect.y);
  assert.ok(sign.collisionRect.y + sign.collisionRect.height <= sign.visibleRect.y + sign.visibleRect.height);
  assert.ok(standing.y < sign.collisionRect.y + sign.collisionRect.height);
  assert.ok(standing.y + standing.height > sign.collisionRect.y);
  assert.ok(sign.collisionRect.y - (sliding.y + sliding.height) >= Core.SLIDE_CLEARANCE);
});

test("1440x900 run jump slide preview geometry는 actor와 두 판정 가이드를 화면 좌표로 산출한다", () => {
  const cases = [
    ["minigame_character.doyun.run.right", () => {}],
    ["minigame_character.doyun.jump.right", (game) => { game.pressJump(); game.step(0.2); }],
    ["minigame_character.doyun.slide.right", (game) => { game.commitSlide(); game.step(Core.FIXED_STEP); }],
  ];
  for (const [id, prepare] of cases) {
    const game = Core.create({ duration: 8, length: 1800, course: [] });
    prepare(game);
    const snapshot = game.snapshot();
    const projection = Core.screenProjection(snapshot, 1440, 827.1);
    const geometry = Core.actorScreenGeometry(Art.metrics(id), { x: projection.playerAnchorX, bottom: projection.playerAnchorBottom }, projection);
    const collision = Core.projectWorldRect(snapshot.playerRect, projection);
    assert.ok(geometry.host.left > 0, `${id} actor left`);
    assert.ok(geometry.host.width > 200 && geometry.host.height > 200, `${id} actor size`);
    assert.ok(geometry.reference.width > 100 && geometry.reference.height > 100, `${id} reference size`);
    assert.ok(collision.width > 70 && collision.height > 70, `${id} collision size`);
    const overlapWidth = Math.max(0, Math.min(geometry.reference.left + geometry.reference.width, collision.left + collision.width) - Math.max(geometry.reference.left, collision.left));
    const overlapHeight = Math.max(0, Math.min(geometry.reference.bottom + geometry.reference.height, collision.bottom + collision.height) - Math.max(geometry.reference.bottom, collision.bottom));
    assert.ok(overlapWidth / collision.width > 0.85, `${id} horizontal guide overlap`);
    assert.ok(overlapHeight / collision.height > 0.85, `${id} vertical guide overlap`);
  }
});

test("player rect는 run opaque body 75%, slide torso-leg body 약 70%를 사용한다", () => {
  const run = Core.PLAYER_PROFILES.run;
  const slide = Core.PLAYER_PROFILES.slide;
  for (const ratio of [run.width / run.referenceWidth, run.height / run.referenceHeight]) {
    assert.ok(ratio >= 0.70 && ratio <= 0.80, `run ratio ${ratio}`);
  }
  for (const ratio of [slide.width / slide.referenceWidth, slide.height / slide.referenceHeight]) {
    assert.ok(ratio >= 0.65 && ratio <= 0.75, `slide ratio ${ratio}`);
  }
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
