(function initDay3Story(global) {
  "use strict";

  const clueRecords = global.ClueRecords || (typeof module === "object" && module.exports ? require("./clue-records.js") : null);
  if (!clueRecords) throw new Error("ClueRecords must load before Day3Story");

  const CLUES = Object.freeze({
    modifiedCopy: clueRecords.get("d3_first_modified_copy"),
    harinEditor: clueRecords.get("d3_harin_editor_name"),
    nanabotPattern: clueRecords.get("d3_nanabot_pattern"),
    automationRun: clueRecords.get("d3_automation_run"),
    legacyMatch: clueRecords.get("d3_legacy_phrase_match"),
    accessUnconfirmed: clueRecords.get("d3_direct_access_unconfirmed"),
  });

  const ROOMS = Object.freeze({
    pt: { type: "PROJECT CHANNEL", title: "# PT 전환과제 TF", members: ["박", "서", "한"] },
    harin: { type: "DIRECT MESSAGE", title: "서하린 사수", members: ["서"] },
    minjae: { type: "DIRECT MESSAGE", title: "강민재 동기", members: ["강"] },
  });

  const MESSAGES = Object.freeze([
    { id: "d3-pt-restore", room: "pt", at: "day3IntroCard", sender: "시스템", text: "DAY 2 검증 완료 복원 지점이 유지되고 있습니다.", day: 3, time: "08:55" },
    { id: "d3-harin-check", room: "harin", at: "day3MinigameResult", sender: "서하린 사수", text: "오늘 아침에는 그 문서를 열지 않았어요. 제 이름이 왜 남았는지 접근 기록부터 같이 확인해요.", day: 3, time: "10:44" },
    { id: "d3-minjae-past", room: "minjae", at: "day3MinjaeHint", sender: "강민재 동기", text: "예전 자료도 비슷한 말투였던 것 같아. 폴더 위치는 어제 말한 곳이고.", day: 3, time: "12:26" },
    { id: "d3-harin-evening", room: "harin", at: "day3EveningMessage", sender: "서하린 사수", dynamic: "eveningMessage", day: 3, time: "20:10" },
  ]);

  const scenes = [
    { id: "day3IntroCard", time: "08:52", speaker: "시스템", text: "DAY 3\n첫 번째 변조", bg: "office", bgm: "daily", location: "게임사업실 · 오전" },
    { id: "day3Arrival", time: "08:55", speaker: "한도윤", text: "DAY 2 검증 완료 복원 지점은 그대로였다. 오늘은 문장만 다듬으면 된다고 생각했다.", bg: "office" },
    { id: "day3HarinMorning", time: "08:57", speaker: "서하린", text: "어제 남긴 복원 지점부터 확인하고 시작해요. 오늘은 정말 문장 정리만 하면 됩니다.", char: "harin" },
    { id: "day3OpenDocument", time: "09:10", speaker: "한도윤", text: "작업본을 열자 첫 문장부터 낯설었다.", systemPanel: { title: "DOCUMENT COMPARE", rows: ["DAY 2 · 상황별 안내 제공 / 검증 수치와 측정 기준 유지", "현재본 · 직관적인 맞춤형 가이드로 몰입을 획기적으로 개선", "삭제 · 검증 수치 / 조사 출처 / 측정 방법"] }, bgm: "mystery", clue: CLUES.modifiedCopy },
    { id: "day3HarinSeesChange", time: "09:12", speaker: "서하린", text: "이건 제가 검토한 문장이 아니에요. 복원부터 하지 말고 현재 기록을 먼저 보존해요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin" },
    { id: "day3HistoryOpen", time: "09:18", speaker: "시스템", text: "문서 변경 이력을 불러왔습니다.", systemPanel: { title: "REVISION HISTORY", rows: ["09:03 · 자동 문장 정리", "표시된 편집자 · 서하린", "실행 계정 / 기기 · 권한 필요"] }, clue: CLUES.harinEditor },
    { id: "day3DoyunLooks", time: "09:19", speaker: "한도윤", text: "수정자 이름이 선배로 되어 있습니다.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin" },
    { id: "day3HarinResponse", time: "09:20", speaker: "서하린", text: "…잠깐만요. 왜 제 이름이 여기 남아 있죠? 오늘 아침에는 이 문서를 열지도 않았어요.", placeholderCharacter: { name: "(서하린 · 당황)", detail: "수정 기록에서 자신의 이름을 발견하고 눈에 띄게 당황한 표정" } },
    { id: "day3BossArrives", time: "09:31", speaker: "박태식", text: "문장은 전보다 눈에 들어오네. 그런데 검증 수치는 왜 빠졌어?", char: "boss", bgm: "daily" },
    { id: "day3BossOrder", time: "09:32", speaker: "박태식", text: "보기 좋게 하랬지 근거를 지우랬나. 점심 전까지 원인만 확인해서 알려줘.", char: "boss" },
    { id: "day3NanabotOpen", time: "10:02", speaker: "나나봇", text: "더 읽기 쉬운 최신 표현을 우선 적용했습니다!", char: "nanabot", bgm: "mystery" },
    { id: "day3NanabotCompare", time: "10:04", speaker: "한도윤", text: "‘획기적으로 개선한다.’ DAY 1에서 나나봇이 추천했던 문장과 같은 방식이다.", systemPanel: { title: "NANABOT PATTERN MATCH", rows: ["수치 생략 · 일치", "근거 문장 축약 · 일치", "과장 표현 우선 · 일치"] }, clue: CLUES.nanabotPattern },
    { id: "day3NanabotRun", time: "10:06", speaker: "나나봇", text: "연결된 자동화 요청에 따라 09:03에 문장을 정리했습니다. 요청 주체는 현재 권한으로 표시할 수 없습니다.", char: "nanabot", clue: CLUES.automationRun },
    { id: "day3PrivateContactLead", time: "10:20", speaker: "한도윤", text: "공개 채널에서 묻는 순간 선배가 수정한 사람으로 굳어질 수 있다. 자리를 비운 선배에게 먼저 기록을 확인해야 한다.", bg: "office", bgm: "minigame", startSecretChat: true },
    { id: "day3MinigameResult", time: "10:44", speaker: "서하린", dynamic: "secretChatResult", char: "harin", bgm: "daily", notification: "d3-harin-check" },
    { id: "day3HarinPlan", time: "10:46", speaker: "서하린", text: "내 이름을 지우지 말고 그대로 두세요. 이름과 실행자가 같은지 확인해야 하니까.", char: "harin" },
    { id: "day3Lunch", time: "12:20", speaker: "강민재", text: "아침부터 분위기가 왜 그래? 설마 자료 또 꼬였어?", placeholder: { title: "구내식당 · 점심", detail: "직원들이 식사하는 밝은 구내식당 배경" }, char: "minjae", location: "구내식당 · 점심" },
    { id: "day3MinjaeHint", time: "12:24", speaker: "강민재", text: "바뀐 문장, 예전 발표 자료에서도 본 것 같아. 하린 선배가 그때 거의 혼자 다 했다고 들었는데… 아니, 이건 내가 말할 얘기는 아닌가.", char: "minjae", placeholder: "inherit", clue: CLUES.legacyMatch },
    { id: "day3HarinPastBoundary", time: "12:26", speaker: "한도윤", text: "민재는 더 말하지 않았다. 구버전 폴더와 바뀐 문장은 이제 우연으로 보기 어려웠다.", char: "minjae", placeholder: "inherit" },
    { id: "day3InvestigationStart", time: "13:30", speaker: "한도윤", text: "오후에는 세 기록을 나란히 확인했다.", bg: "office", bgm: "mystery" },
    { id: "day3AccessLog", time: "13:38", speaker: "시스템", text: "서하린의 직접 문서 접근 기록을 확인했습니다.", systemPanel: { title: "ACCESS LOG", rows: ["서하린 마지막 직접 접근 · DAY 2 20:06", "DAY 3 09:03 직접 접근 · 없음", "명의 기반 자동화 활동 · 있음"] } },
    { id: "day3AutomationLog", time: "13:47", speaker: "시스템", text: "자동화 실행 기록을 확인했습니다.", systemPanel: { title: "AUTOMATION LOG", rows: ["09:03 · 구버전 연결 호출", "09:03 · 나나봇 자동 정리", "실행 계정 / 기기 · 관리자 권한 필요"] } },
    { id: "day3FolderPath", time: "14:01", speaker: "시스템", text: "현재 작업본과 과거 폴더 사이의 연결 경로가 확인되었습니다.", systemPanel: { title: "CONNECTED PATH", rows: ["2024_온보딩개선_최종대응", "→ 공용 슬라이드 동기화", "→ 신규유저_이탈개선_PT 작업본"] }, clue: CLUES.accessUnconfirmed },
    { id: "day3Decision", time: "16:20", speaker: "서하린", text: "기록에 제 이름이 있는 건 부정하지 않을게요. 도윤 씨는 지금 어떻게 생각해요?", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", choiceKey: "harinSuspicion", choices: [
      { id: "accuse", text: "선배가 수정한 겁니까?", delta: { work: 0, affection: -1, trust: -2 } },
      { id: "verify", text: "이름이 남은 이유부터 확인하죠.", delta: { work: 1, affection: 0, trust: 2 } },
      { id: "blindTrust", text: "선배 말만 믿고 복원하겠습니다.", delta: { work: -1, affection: 1, trust: 0 } },
    ] },
    { id: "day3DecisionResult", time: "16:22", speaker: "서하린", dynamic: "decisionResponse", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin" },
    { id: "day3Wrap", time: "17:10", speaker: "한도윤", text: "변경본과 로그를 따로 보존하고 DAY 2 복원 지점은 건드리지 않았다. 실제 실행 계정과 기기는 내일 시스템 담당자에게 확인하기로 했다.", bg: "office" },
    { id: "day3Summary", time: "18:00", speaker: "시스템", text: "오늘의 업무를 정산합니다.", bg: "office", bgm: "daily", daySummary: 3 },
    { id: "day3EveningMessage", time: "20:10", speaker: "서하린", dynamic: "eveningMessage", bg: "office_night", bgm: "harin", notification: "d3-harin-evening" },
    { id: "day3End", time: "20:12", speaker: "시스템", text: "DAY 3 완료\n첫 번째 변조는 확인되었지만 실제 실행자는 아직 밝혀지지 않았습니다.", bg: "office_night", end: true },
  ];

  function validateScenes(items) {
    const ids = new Set();
    const errors = [];
    items.forEach((scene, index) => {
      if (!scene.id || ids.has(scene.id)) errors.push(`invalid scene id at ${index}`);
      ids.add(scene.id);
      if (!scene.time || !scene.speaker) errors.push(`missing required field at ${scene.id || index}`);
    });
    return errors;
  }

  const api = Object.freeze({ scenes, CLUES, ROOMS, MESSAGES, validateScenes });
  if (typeof module === "object" && module.exports) module.exports = api;
  global.Day3Story = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
