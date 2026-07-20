const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'clue-mindmap.js'), 'utf8');

function loadMindmap() {
  const window = {};
  vm.runInNewContext(source, { window });
  return window.ClueMindmap;
}

test('단서를 DAY 1과 DAY 2 사건 보드로 분류한다', () => {
  const mindmap = loadMindmap();
  assert.equal(mindmap.clueDay('Day 1 원본 초안: v0.1'), 1);
  assert.equal(mindmap.clueDay('DAY 2 검증 기준 — 신규 설치 12,480명'), 2);
  assert.equal(mindmap.clueDay('과거 폴더의 비활성 자동화'), 2);
});

test('비슷한 단서를 같은 주제 가지로 묶는다', () => {
  const mindmap = loadMindmap();
  assert.equal(mindmap.clueTheme('나나봇 자동 정리 활성화', 1), 'AI 사용 방식');
  assert.equal(mindmap.clueTheme('서하린의 경고: 정상 원본을 보관할 것', 1), '원본과 기록');
  assert.equal(mindmap.clueTheme('과거 폴더의 비활성 자동화', 2), '과거 시스템');
  assert.equal(mindmap.clueTheme('강민재의 제안 — 슬라이드 구성', 2), '동료의 증언');
});

test('Day 1과 Day 2 페이지가 공용 단서 마인드맵을 먼저 불러온다', () => {
  for (const page of ['game.html', 'day2.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /js\/clue-mindmap\.js/);
    assert.match(html, /INVESTIGATION MIND MAP/);
  }
  assert.match(fs.readFileSync(path.join(root, 'js', 'game.js'), 'utf8'), /currentDay:1/);
  assert.match(fs.readFileSync(path.join(root, 'js', 'day2.js'), 'utf8'), /currentDay: 2/);
});

test('단서 보드는 원형 노드와 곡선 연결선으로 구성하고 드래그 이동을 지원한다', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'game.css'), 'utf8');
  assert.match(source, /function enablePan\(/);
  assert.match(source, /event\.target\.closest\("\.clue-day-orbit"\)/);
  assert.match(source, /clue-day-orbit/);
  assert.match(source, /clue-theme-orbit/);
  assert.match(source, /clue-detail-orbit/);
  assert.match(source, /createElementNS\("http:\/\/www\.w3\.org\/2000\/svg", "path"\)/);
  assert.match(css, /\.clue-orbit-node\{/);
  assert.match(css, /\.clue-canvas-viewport\{/);
});
