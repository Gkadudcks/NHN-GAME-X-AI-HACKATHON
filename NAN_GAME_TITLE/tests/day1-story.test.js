const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "js", "game.js"), "utf8");
const html = fs.readFileSync(path.join(root, "game.html"), "utf8");

test("오래된 프로젝트에서 이름을 발견한 다음 하린은 당황한 모습으로 반응한다", () => {
  assert.match(
    source,
    /id:'harinOldProject'.*characters:\[\{id:'harin',assetId:'character\.harin\.hand_to_chest\.surprised'\}\].*motion:'nervous'/
  );
  assert.match(source, /entry\.assetId\?ArtAssets\.resolve\(entry\.assetId\)/);
  const artAssetsIndex = html.indexOf('src="js/art-assets.js?v=15"');
  const gameIndex = html.indexOf('src="js/game.js?v=57"');
  assert.ok(artAssetsIndex >= 0, "DAY 1 페이지가 아트 자산 해석기를 불러와야 한다");
  assert.ok(artAssetsIndex < gameIndex, "아트 자산 해석기는 DAY 1 엔진보다 먼저 로드되어야 한다");
});

test("DAY 1에서 하린의 걱정을 계속 밀어내면 호감도와 신뢰도가 함께 내려간다", () => {
  assert.match(
    source,
    /text:'초안 정도는 혼자 만들어보겠습니다\.',delta:\{work:1,affection:-1,trust:-1\}/
  );
  assert.match(
    source,
    /text:'도움이 필요해지기 전까지는 혼자 정리해보겠습니다\.',delta:\{work:1,affection:-1,trust:-1\}/
  );
  assert.match(
    source,
    /text:'혹시 부장님이 저를 못 미더워하신 건가요\?',delta:\{trust:1\}/
  );
});

test("DAY 1 정산 후 퇴근 장면은 승인된 해질녘 사무실 배경을 사용한다", () => {
  assert.match(
    source,
    /id:'leaveOffice'.*bgAssetId:'background\.office\.evening'.*location:'게임사업실 · 퇴근'/
  );
  assert.match(source, /s\.bgAssetId\)\{refs\.stage\.style\.backgroundImage=`url\('\$\{ArtAssets\.resolve\(s\.bgAssetId\)\}'\)`/);
});

test("DAY 1 커피 전달 뒤 회의는 승인된 회의실 배경에서 진행된다", () => {
  for (const id of ["coffeeResult", "bossVerbal", "harinInterpret"]) {
    const sceneStart = source.indexOf(`id:'${id}'`);
    const sceneEnd = source.indexOf("},", sceneStart);
    const scene = source.slice(sceneStart, sceneEnd);
    assert.ok(sceneStart >= 0, `${id} 장면이 존재해야 한다`);
    assert.match(scene, /bgAssetId:'background\.meeting_room\.afternoon'/);
    assert.doesNotMatch(scene, /bgPosition:/);
    assert.match(scene, /location:'회의실 · 오전'/);
  }
  for (const id of ["boss1", "boss2"]) {
    const sceneStart = source.indexOf(`id:'${id}'`);
    const sceneEnd = source.indexOf("},", sceneStart);
    assert.doesNotMatch(source.slice(sceneStart, sceneEnd), /background\.meeting_room/);
  }
});

test("DAY 1 편의점 이웃 선택지는 호감도 1부터 선택할 수 있다", () => {
  assert.match(source, /text:'회사에서도 가끔은 이웃처럼 편하게 대해도 될까요\?',minAffection:1/);
});
