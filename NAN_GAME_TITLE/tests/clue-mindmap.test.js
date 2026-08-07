const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'clue-mindmap.js'), 'utf8');
const themeSource = fs.readFileSync(path.join(root, 'css', 'clue-mindmap-theme.css'), 'utf8');
const gameSource = fs.readFileSync(path.join(root, 'js', 'game.js'), 'utf8');

test('모든 DAY 단서 화면은 오류 검증과 같은 안내·DAY 탭·단서 맵 구조를 사용한다', () => {
  assert.match(source, /shell\.classList\.add\("has-day-tabs"\)/);
  assert.match(source, /사건 단서 확인/);
  assert.match(source, /if \(day === selectedDay\) return;/);
  assert.match(themeSource, /\.clue-canvas-shell\.has-day-tabs\s*\{\s*grid-template-rows:\s*72px 64px minmax\(0, 1fr\)/);
  assert.match(themeSource, /\.clue-detail-orbit\s*\{[^}]*border:\s*2px solid[^}]*background:\s*rgba\(255, 251, 248, \.94\)/s);
});

test('selected DAY keeps navigation outside the radial canvas, with no duplicate DAY hub inside it', () => {
  assert.match(source, /dayTabs = element\("nav", "clue-day-tabs"\)/);
  assert.doesNotMatch(source, /clue-day-orbit/);
  assert.doesNotMatch(source, /inactiveIndex/);
});

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

test('단서 보드는 CLUE 원형 노드만 방사형으로 배치하고 드래그 이동을 지원한다', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'game.css'), 'utf8');
  assert.match(source, /function enablePan\(/);
  assert.match(source, /event\.target\.closest\("\.clue-detail-orbit, \.clue-inspector"\)/);
  assert.match(source, /clue-detail-orbit/);
  assert.match(source, /const itemsPerRing = 6/);
  assert.match(source, /const ring = Math\.floor\(clueIndex \/ itemsPerRing\)/);
  assert.match(source, /const worldSize = Math\.max\(420,/);
  assert.doesNotMatch(source, /clue-theme-orbit|createElementNS|theme-link|detail-link|TOPIC/);
  assert.doesNotMatch(css, /\.clue-theme-orbit|\.clue-connections|\.theme-link|\.detail-link/);
  assert.match(css, /\.clue-orbit-node\{/);
  assert.match(css, /\.clue-canvas-viewport\{/);
  assert.match(css, /\.clue-inspector\{/);
  assert.match(source, /initialScale: null,/);
  assert.match(source, /autoFitTimer = window\.setTimeout\(fitToView, 100\)/);
  assert.match(source, /const factor = Math\.exp\(-delta \* 0\.001\)/);
  assert.doesNotMatch(source, /if \(!event\.ctrlKey && !event\.metaKey\) return/);
  assert.match(source, /viewport\.append\(world, inspector\)/);
  assert.match(source, /shell\.append\(toolbar\)/);
  assert.match(source, /if \(dayTabs\) shell\.append\(dayTabs\)/);
  assert.match(source, /shell\.append\(viewport\)/);
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
  assert.doesNotMatch(source, /groupClues|clue\.theme/);
  assert.match(source, /inspector\.querySelector\("small"\)\.textContent = "CLUE DETAIL"/);
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

test('마인드맵 캔버스는 점무늬 없이 단색 배경을 사용한다', () => {
  assert.match(themeSource, /\.clue-canvas-viewport\s*\{[^}]*background-color:\s*#f7f2ef/s);
  assert.match(themeSource, /\.clue-canvas-viewport\s*\{[^}]*background-image:\s*none/s);
});

test('발표 근거 선택은 기존 마인드맵의 이동과 확대 기능을 유지한다', () => {
  assert.match(source, /options\.selection && typeof options\.selection\.onSelect === "function"/);
  assert.match(source, /clueNode\.classList\.add\("evidence-candidate"\)/);
  assert.match(source, /selection\.onSelect\(clue\)/);
  assert.match(source, /selection \? 190 : 166/);
  assert.match(source, /selection\?\.showDayHint && clues\.some[^]*tab\.classList\.add\("has-evidence"\)/);
  assert.match(source, /element\("nav", "clue-day-tabs"\)/);
  assert.match(source, /if \(dayTabs\) shell\.append\(dayTabs\)/);
  assert.match(source, /evidence-selection-progress/);
});
