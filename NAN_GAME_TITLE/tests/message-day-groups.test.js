const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('DAY 2 메신저는 고정 날짜 바 대신 메시지를 DAY별로 묶는다', () => {
  const html = fs.readFileSync(path.join(root, 'day2.html'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'js', 'day2.js'), 'utf8');

  assert.doesNotMatch(html, /<div class="date-divider"><span>DAY 2/);
  assert.match(html, /grouped-message-room/);
  assert.match(source, /function messageDay\(/);
  assert.match(source, /messageDayDivider\(day\)/);
  assert.match(source, /data-message-day/);
});

test('메신저 날짜 이름은 DAY 1부터 DAY 5까지 제공한다', () => {
  const source = fs.readFileSync(path.join(root, 'js', 'day2.js'), 'utf8');
  for (const name of ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']) {
    assert.match(source, new RegExp(name));
  }
});
