const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const css = read("css/game.css");
const motion = read("js/scene-motion.js");
const day2 = read("js/day2-story.js");
const day3 = read("js/day3-story.js");
const day4 = read("js/day4-story.js");

test("상황 효과는 공용 모션 모듈에서 장면 메타데이터로 제어한다", () => {
  for (const effect of ["discovery", "document-impact", "decision-focus", "mic-live"]) {
    assert.match(motion, new RegExp(`"${effect}"`));
    assert.match(css, new RegExp(`effect-${effect}`));
  }
  assert.match(day2, /id: "day2ArchiveRecognition".*effect: "discovery"/);
  assert.doesNotMatch(day2, /id: "day2ArchiveRecognition".*cinematicDelay/);
  assert.doesNotMatch(day2, /id: "day2ArchiveRecognition".*cinematicTarget/);
  assert.match(day3, /id: "day3HarinSeesChange".*effect: "document-impact"/);
  assert.match(day3, /id: "day3Decision".*effect: "decision-focus"/);
  assert.match(day4, /id: "day4MicChoice".*effect: "mic-live"/);
});

test("상황 효과는 사용자 모션 감소 설정을 존중한다", () => {
  assert.match(css, /\.stage\[class\*="effect-"\]/);
  assert.match(css, /\.reduce-effects \.stage\[class\*="effect-"\]/);
});

test("슬픈 감정 연출이 끝나면 캐릭터가 원위치로 부드럽게 복귀한다", () => {
  assert.match(motion, /stage\.dataset\.sceneMotion === "sad"/);
  assert.match(motion, /"emotion-recover"/);
  assert.match(css, /\.character\.emotion-recover\{animation:emotion-sad-recover/);
  assert.match(css, /@keyframes emotion-sad-recover\{from\{[^}]*translateY\(7px\)[^}]*\}to\{[^}]*translateY\(0\)/);
});

test("같은 캐릭터 구성이 이어지는 대사에서는 입장 애니메이션을 반복하지 않는다", () => {
  assert.match(motion, /function characterCompositionChanged\(stage\)/);
  assert.match(motion, /stage\.dataset\.characterComposition !== signature/);
  assert.match(motion, /else if \(characterChanged\) restart\(stage\.querySelector\("\.character\.speaking"\), "speaker-beat"\)/);
  const dialogueBody = motion.match(/function playDialogue\(stage, scene\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  assert.doesNotMatch(dialogueBody, /speaker-beat|emotion-beat|emotion-recover/);
});

test("과거 폴더 발견 전 설명 화면은 모두 건너뛰고 스프라이트 장면에 정보를 합친다", () => {
  assert.match(day2, /id: "day2ArchiveSearch".*skip: true/);
  assert.match(day2, /id: "day2ArchivePanel".*skip: true/);
  assert.match(day2, /id: "day2ArchiveRecognition".*공용 슬라이드 틀.*과거 폴더/);
  assert.match(day2, /if \(scene\.skip\) return false/);
  assert.doesNotMatch(css, /scene-discovery-dialogue/);
});

test("시간·변경자·파일명 같은 단서 구절만 지정해 한 번 강조한다", () => {
  assert.match(motion, /function applyDialogueEmphasis\(stage, scene = \{\}\)/);
  assert.match(motion, /document\.createElement\("strong"\)/);
  assert.match(motion, /mark\.className = "dialogue-emphasis"/);
  assert.match(css, /@keyframes dialogue-emphasis-in/);
  assert.match(css, /\.reduce-effects \.dialogue-emphasis/);
  assert.match(day2, /id: "day2ArchiveDetails".*emphasis: \["서하린", "2024-11-07 23:48"\]/);
  assert.match(day3, /id: "day3HistoryOpen".*emphasis: \["09:03", "서하린"\]/);
  assert.match(day4, /id: "day4AuditExplain".*emphasis: "보안 감사 로그"/);
  assert.match(day4, /id: "day4EvidencePreview".*emphasis: \["18\.4%", "retention_7d_verified"\]/);
  assert.doesNotMatch(day2, /emphasis: "결과는 좋지 않았고요"/);
  assert.doesNotMatch(day3, /emphasis: "무엇을 기준으로 판단해야 할까\?"/);
});
