"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const pages = ["game.html", "day2.html", "day3.html", "day4.html"];

test("every implemented day uses the story-first daily summary layout", () => {
  pages.forEach((page) => {
    const html = read(page);
    assert.match(html, /class="day-summary-story-grid"/);
    assert.match(html, /id="day-summary-conclusion"/);
    assert.match(html, /id="day-summary-note"/);
    assert.match(html, /<details class="day-summary-details">/);
    assert.match(html, /<summary>업무 내역 보기<\/summary>/);
    assert.match(html, /class="day-summary-list day-summary-stat-list"/);
    assert.match(html, /class="day-summary-fact day-summary-relation"/);
  });
});

test("daily summaries keep detailed tasks collapsed and compress new clues", () => {
  const engines = ["js/game.js", "js/day2.js", "js/day3.js", "js/day4.js"].map(read);

  engines.forEach((engine) => {
    assert.match(engine, /closest\(["']\.day-summary-details["']\)/);
    assert.match(engine, /details\.open\s*=\s*false/);
    assert.match(engine, /새로운 기록 \$\{/);
    assert.match(engine, /\.at\(-1\)/);
    assert.match(engine, /relationshipChanged/);
    assert.match(engine, /relationSection|day-summary-relation/);
  });
});

test("daily summary styles prioritize the conclusion and remain responsive", () => {
  const css = read("css/game.css");

  assert.match(css, /\.day-summary-story-grid\{display:grid/);
  assert.match(css, /\.day-summary-highlight h3,.day-summary-fact h3\{[^}]*font-size:15px/);
  assert.match(css, /\.day-summary-highlight>h2\{[^}]*font-weight:600/);
  assert.match(css, /\.day-summary-stat-list\{grid-template-columns:repeat\(3/);
  assert.match(css, /\.day-summary-stat-list article div b\{[^}]*font-size:14px/);
  assert.doesNotMatch(css, /\.system-grid p,.day-summary-stat-list article\{[^}]*inset 3px 0/);
  assert.match(css, /\.system-grid p,.day-summary-stat-list article\{[^}]*border:1px solid color-mix\(in srgb,var\(--stat-accent\) 42%,#fff\)[^}]*box-shadow:none/);
  assert.match(css, /:is\(\.system-grid p,.day-summary-stat-list article\):nth-child\(1\) i:before\{content:"▤"\}/);
  assert.match(css, /:is\(\.system-grid p,.day-summary-stat-list article\):nth-child\(2\) i:before\{content:"♥"\}/);
  assert.match(css, /:is\(\.system-grid p,.day-summary-stat-list article\):nth-child\(3\) i:before\{content:"◈"\}/);
  assert.match(css, /\.day-summary-relation\[hidden\]\{display:none\}/);
  assert.match(css, /@media\(max-width:760px\)/);
});
