const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'clue-mindmap.js'), 'utf8');
const themeSource = fs.readFileSync(path.join(root, 'css', 'clue-mindmap-theme.css'), 'utf8');
const gameSource = fs.readFileSync(path.join(root, 'js', 'game.js'), 'utf8');

test('Day 1과 Day 2 페이지가 단서 모델 뒤에 공용 마인드맵을 불러온다', () => {
  for (const page of ['game.html', 'day2.html']) {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.ok(html.indexOf('js/clue-records.js') < html.indexOf('js/clue-mindmap.js'));
    assert.match(html, /js\/clue-mindmap\.js/);
    assert.match(html, /INVESTIGATION MIND MAP/);
  }
  assert.match(fs.readFileSync(path.join(root, 'js', 'game.js'), 'utf8'), /currentDay:1/);
  assert.match(fs.readFileSync(path.join(root, 'js', 'day2.js'), 'utf8'), /currentDay: 2/);
});

test('단서 보드는 원형 노드와 곡선 연결선으로 구성하고 드래그 이동을 지원한다', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'game.css'), 'utf8');
  assert.match(source, /function enablePan\(/);
  assert.match(source, /event\.target\.closest\("\.clue-day-orbit, \.clue-detail-orbit, \.clue-inspector"\)/);
  assert.match(source, /clue-day-orbit/);
  assert.match(source, /clue-theme-orbit/);
  assert.match(source, /clue-detail-orbit/);
  assert.match(source, /createElementNS\("http:\/\/www\.w3\.org\/2000\/svg", "path"\)/);
  assert.match(css, /\.clue-orbit-node\{/);
  assert.match(css, /\.clue-canvas-viewport\{/);
  assert.match(css, /\.clue-inspector\{/);
  assert.match(source, /initialScale: 1/);
  assert.match(source, /const factor = Math\.exp\(-delta \* 0\.001\)/);
  assert.doesNotMatch(source, /if \(!event\.ctrlKey && !event\.metaKey\) return/);
  assert.match(source, /viewport\.append\(world, inspector\)/);
  assert.match(source, /shell\.append\(toolbar, viewport\)/);
});

test('단서 노드는 짧은 제목을, 상세 패널은 별도 맥락을 표시한다', () => {
  assert.match(source, /clueNode\.addEventListener\("click"/);
  assert.match(source, /clueNode\.querySelector\("p"\)\.textContent = clue\.title/);
  assert.match(source, /inspector\.querySelector\("p"\)\.textContent = clue\.detail/);
  assert.match(source, /aria-expanded/);
});

test('마인드맵은 문자열이나 배열 위치로 날짜·주제·상세를 추론하지 않는다', () => {
  assert.doesNotMatch(source, /function clueDay|function clueTheme|function clueSummary|function clueDetail/);
  assert.doesNotMatch(source, /dayForIndex|map\(String\)/);
  assert.match(source, /clue\.day === day/);
  assert.match(source, /grouped\.has\(clue\.theme\)/);
});

test('상세 패널은 왼쪽 강조선 없이 은은한 핑크 외곽 글로우를 사용한다', () => {
  assert.match(themeSource, /\.clue-inspector\s*\{[^}]*border:\s*1px solid #ee8da059/);
  assert.match(themeSource, /\.clue-inspector\s*\{[^}]*0 0 10px #ff7fa31c/);
});

test('최초 메신저 단서는 짧은 구버전 대신 표준 단서 하나만 기록한다', () => {
  assert.match(gameSource, /firstDirective:ClueRecords\.get\('d1_boss_first_directive'\)/);
  assert.match(gameSource, /addClue\(CLUES\.firstDirective\)/);
  assert.doesNotMatch(gameSource, /addClue\('부장 메신저: 유저 경험 중심'\)/);
});

test('반복 렌더 전에 이전 ResizeObserver를 정리한다', () => {
  assert.match(source, /container\.clueResizeObserver\) container\.clueResizeObserver\.disconnect\(\)/);
  assert.match(source, /container\.clueResizeObserver = viewport\.resizeObserver/);
});
