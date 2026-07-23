const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const clueRecords = require("../js/clue-records.js");
const day2Story = require("../js/day2-story.js");

const root = path.resolve(__dirname, "..");

test("모든 정식 단서는 필수 필드와 고유한 안정 ID를 가진다", () => {
  const ids = clueRecords.catalog.map((clue) => clue.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(clueRecords.catalog.every(clueRecords.isRecord));
  assert.ok(clueRecords.catalog.every((clue) => Object.keys(clue).sort().join(",") === "day,detail,id,theme,title"));
});

test("알려진 구버전 문자열은 정식 ID로 옮기고 중복을 ID로 합친다", () => {
  const clues = clueRecords.normalizeList([
    "부장 메신저: 유저 경험 중심",
    "박태식의 최초 지시: 유저 경험 중심·검증된 수치 사용",
  ]);
  assert.equal(clues.length, 1);
  assert.equal(clues[0].id, "d1_boss_first_directive");
  assert.match(clues[0].detail, /첫 7일의 유저 경험/);
});

test("과거 일반 업무 기록만 제거하고 알 수 없는 미래 단서는 무손실 보존한다", () => {
  const clues = clueRecords.normalizeList([
    "조사 자료: 경쟁 게임 사례",
    "PT 방향: 튜토리얼 단축",
    "DAY 3 변경 전후 문장 비교 — 근거 링크가 사라짐",
    "새 감사 로그에서 발견한 미래 단서",
  ], { defaultDay: 4 });
  assert.equal(clues.length, 2);
  assert.equal(clues[0].day, 3);
  assert.equal(clues[0].detail, "DAY 3 변경 전후 문장 비교 — 근거 링크가 사라짐");
  assert.equal(clues[1].day, 4);
  assert.match(clues[1].id, /^legacy_d4_/);
});

test("같은 제목이어도 ID가 다르면 보존하고 같은 ID만 중복 제거한다", () => {
  const first = { id: "d3_log_a", day: 3, theme: "감사 로그", title: "변경 기록", detail: "첫 로그" };
  const second = { id: "d3_log_b", day: 3, theme: "감사 로그", title: "변경 기록", detail: "둘째 로그" };
  const clues = clueRecords.normalizeList([first, second, { ...first, detail: "중복" }]);
  assert.deepEqual(clues.map((clue) => clue.id), ["d3_log_a", "d3_log_b"]);
});

test("DAY 1부터 DAY 5까지 누적 단서 수에 상한을 두지 않는다", () => {
  const futureClues = Array.from({ length: 20 }, (_, index) => ({
    id: `d${index % 5 + 1}_future_${index + 1}`,
    day: index % 5 + 1,
    theme: "주요 단서",
    title: `사건 단서 ${index + 1}`,
    detail: `DAY ${index % 5 + 1} 상세 ${index + 1}`,
  }));
  assert.equal(clueRecords.normalizeList(futureClues).length, 20);
});

test("DAY 1·2 스토리는 문자열 대신 카탈로그 단서 레코드만 참조한다", () => {
  const gameSource = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
  const storyClues = [
    ...Object.values(day2Story.CLUES),
    ...day2Story.scenes.flatMap((scene) => scene.clue ? [scene.clue] : []),
  ];
  assert.ok(storyClues.every(clueRecords.isRecord));
  assert.doesNotMatch(gameSource, /\bclue\s*:\s*['"`]/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, "js", "day2-story.js"), "utf8"), /\bclue\s*:\s*['"`]/);
});
