(function initDay3Story(global) {
  "use strict";

  const clueRecords = global.ClueRecords || (typeof module === "object" && module.exports ? require("./clue-records.js") : null);
  if (!clueRecords) throw new Error("ClueRecords must load before Day3Story");
  const day2Story = global.Day2Story || (typeof module === "object" && module.exports ? require("./day2-story.js") : null);
  if (!day2Story) throw new Error("Day2Story must load before Day3Story");

  const CLUES = Object.freeze({
    modifiedCopy: clueRecords.get("d3_first_modified_copy"),
    harinEditor: clueRecords.get("d3_harin_editor_name"),
    nanabotPattern: clueRecords.get("d3_nanabot_pattern"),
    automationRun: clueRecords.get("d3_automation_run"),
    legacyMatch: clueRecords.get("d3_legacy_phrase_match"),
    accessUnconfirmed: clueRecords.get("d3_direct_access_unconfirmed"),
  });

  const ROOMS = day2Story.ROOMS;
  const previousMessages = Object.freeze(day2Story.MESSAGES.map((message) => Object.freeze({
    ...message,
    day: /^DAY\s*1\b/i.test(String(message.time || "")) ? 1 : 2,
  })));
  const MESSAGES = Object.freeze([
    ...previousMessages,
    { id: "d3-pt-restore", room: "pt", at: "day3IntroCard", sender: "시스템", text: "DAY 2 검증 완료 복원 지점이 유지되고 있습니다.", day: 3, time: "08:55" },
    { id: "d3-harin-check", room: "harin", at: "day3HarinWorkCheck", sender: "서하린 사수", text: "오늘 아침에는 그 문서를 직접 열지 않았어요. 자동화에는 소유자 이름만 남을 수 있어요. 복원 지점은 그대로 보존해 주세요.", day: 3, time: "10:15" },
    { id: "d3-harin-investigation", room: "harin", at: "day3MinigameResult", sender: "서하린 사수", dynamic: "workAlertMessage", day: 3, time: "10:44" },
    { id: "d3-minjae-past", room: "minjae", at: "day3MinjaeHint", sender: "강민재 동기", text: "예전 자료도 비슷한 말투였던 것 같아. 폴더 위치는 어제 말한 곳이고.", day: 3, time: "12:26" },
    { id: "d3-harin-evening", room: "harin", at: "day3EveningMessage", sender: "서하린 사수", dynamic: "eveningMessage", day: 3, time: "20:10" },
  ]);

  const scenes = [
    { id: "day3IntroCard", time: "08:52", speaker: "시스템", text: "DAY 3\n첫 번째 변조", bg: "office", bgm: "daily", location: "게임사업실 · 오전" },
    { id: "day3Arrival", time: "08:55", speaker: "한도윤", text: "DAY 2 검증 완료 복원 지점은 그대로였다. 오늘은 문장만 다듬으면 된다고 생각했다.", bg: "office" },
    { id: "day3HarinMorning", time: "08:57", speaker: "서하린", text: "어제 남긴 복원 지점부터 확인하고 시작해요. 오늘은 정말 문장 정리만 하면 돼요.", char: "harin" },
    { id: "day3OpenDocument", time: "09:10", speaker: "한도윤", text: "작업본을 열자 첫 문장부터 낯설었다.", systemPanel: { title: "DOCUMENT COMPARE", rows: ["DAY 2 · 상황별 안내 제공 / 검증 수치와 측정 기준 유지", "현재본 · 직관적인 맞춤형 가이드로 몰입을 획기적으로 개선", "삭제 · 검증 수치 / 조사 출처 / 측정 방법"] }, bgm: "mystery", clue: CLUES.modifiedCopy },
    { id: "day3HarinSeesChange", time: "09:12", speaker: "서하린", text: "잠깐만요. 이건 제가 검토한 문장이 아닌데요? 복원부터 하면 안 돼요. 지금 상태와 변경 기록부터 남겨요.", char: "harin" },
    { id: "day3HistoryOpen", time: "09:18", speaker: "시스템", text: "문서 변경 이력을 불러왔습니다.", systemPanel: { title: "REVISION HISTORY", rows: ["09:03 · 자동 문장 정리", "표시된 편집자 · 서하린", "실행 계정 / 기기 · 권한 필요"] }, clue: CLUES.harinEditor },
    { id: "day3DoyunLooks", time: "09:19", speaker: "한도윤", text: "수정자 이름이 선배로 되어 있습니다.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin" },
    { id: "day3HarinResponse", time: "09:20", speaker: "서하린", text: "…잠깐만요. 왜 제 이름이 여기 남아 있죠? 오늘 아침에는 이 문서를 열지도 않았어요.", characters: [{ id: "harin", assetId: "character.harin.hand_to_chest.surprised" }], activeCharacter: "harin" },
    { id: "day3BossArrives", time: "09:31", speaker: "박태식", text: "문장은 전보다 눈에 들어오네. 그런데 검증 수치는 왜 빠졌어?", char: "boss" },
    { id: "day3BossOrder", time: "09:32", speaker: "박태식", text: "보기 좋게 하랬지 근거를 지우랬나. 점심 전까지 원인만 확인해서 알려줘.", char: "boss" },
    { id: "day3NanabotOpen", time: "10:02", speaker: "나나봇", text: "더 읽기 쉬운 최신 표현을 우선 적용했습니다!", char: "nanabot" },
    { id: "day3NanabotCompare", time: "10:04", speaker: "한도윤", text: "‘획기적으로 개선한다.’ DAY 1에서 나나봇이 추천했던 문장과 같은 방식이다.", systemPanel: { title: "NANABOT PATTERN MATCH", rows: ["수치 생략 · 일치", "근거 문장 축약 · 일치", "과장 표현 우선 · 일치"] }, clue: CLUES.nanabotPattern },
    { id: "day3NanabotRun", time: "10:06", speaker: "나나봇", text: "연결된 자동화 요청에 따라 09:03에 문장을 정리했습니다. 요청 주체는 현재 권한으로 표시할 수 없습니다.", char: "nanabot", clue: CLUES.automationRun },
    { id: "day3Decision", time: "10:12", speaker: "한도윤", text: "수정 기록에는 선배의 이름이 있고, 바뀐 문장은 나나봇의 방식과 닮았다. 아직 선배의 설명은 듣지 못했다. 나는 지금 무엇을 기준으로 판단해야 할까?", bg: "office", choiceKey: "harinSuspicion", choices: [
      { id: "accuse", text: "수정자 이름 그대로 선배를 의심한다.", delta: { work: 0, affection: -1, trust: -2 } },
      { id: "verify", text: "이름이 남은 이유부터 검증한다.", delta: { work: 1, affection: 0, trust: 2 } },
      { id: "blindTrust", text: "선배를 믿고 바로 복원한다.", minAffection: 3, delta: { work: -1, affection: 1, trust: 0 } },
    ] },
    { id: "day3DecisionResult", time: "10:13", speaker: "한도윤", dynamic: "decisionIntent", bg: "office" },
    { id: "day3WorkContact", time: "10:14", speaker: "한도윤", text: "업무 메신저로 확인할 내용을 정리했다. 오늘 아침 문서를 열었는지, 자동화에 소유자 이름만 남을 수 있는지, DAY 2 복원 지점을 그대로 보존할지.", bg: "office" },
    { id: "day3HarinWorkCheck", time: "10:15", speaker: "서하린", text: "오늘 아침에는 그 문서를 직접 열지 않았어요. 자동화에는 소유자 이름만 남을 수 있어요. 복원 지점은 그대로 보존해 주세요.", char: "harin", notification: "d3-harin-check" },
    { id: "day3HarinPlan", time: "10:16", speaker: "서하린", dynamic: "decisionResponse", char: "harin" },
    { id: "day3BossPressure", time: "10:18", speaker: "박태식", text: "원인 확인은 어디까지 됐어? 확인 안 된 이름은 채널에 올리지 말고, 점심 전에는 조사 방향만 보고해.", char: "boss", bg: "office" },
    { id: "day3PrivateContactLead", time: "10:20", speaker: "서하린", text: "보고 전까지 요청이 더 몰릴 거예요. 변경본은 건드리지 말고 중요한 기록부터 보존해요.", char: "harin", bg: "office" },
    { id: "day3ContactObjective", time: "10:21", speaker: "한도윤", text: "변조 조사와 일반 업무 요청이 한꺼번에 쏟아지기 시작했다. 확인된 기록을 지키면서 급한 요청부터 구분해야 한다.", bg: "office" },
    { id: "day3SecretChatStart", time: "10:22", speaker: "시스템", text: "조사 관련 요청과 일반 메시지가 동시에 도착하고 있습니다.\n중요한 기록을 놓치지 말고 알맞게 처리하세요.", bg: "office", bgm: "minigame", startWorkAlert: true },
    { id: "day3MinigameResult", time: "10:44", speaker: "서하린", dynamic: "workAlertResult", char: "harin", bgm: "daily", notification: "d3-harin-investigation" },
    { id: "day3BossReport", time: "11:35", speaker: "한도윤", dynamic: "bossReport", char: "boss", bg: "office" },
    { id: "day3BossReportResponse", time: "11:36", speaker: "박태식", text: "좋아. 사람 이름으로 결론 내리지 말고, 오후에는 직접 접근·자동화·연결 경로를 순서대로 확인해. 확인한 기록은 전부 남기고.", char: "boss", bg: "office" },
    { id: "day3LunchChoice", time: "12:20", speaker: "한도윤", text: "오전 내내 변조 기록만 들여다봤더니 머리가 무거웠다. 점심만큼은 다른 생각을 해 보자. 오늘은 뭘 먹을까?", bg: "cafeteria_day", location: "구내식당 · 점심", choiceKey: "lunchMenu", choices: [
      { id: "porkCutlet", text: "바삭한 돈가스로 기분을 바꾼다.", reply: "오늘만큼은 든든하게 먹고 다시 시작하자.", delta: {} },
      { id: "stew", text: "뜨끈한 김치찌개로 속을 푼다.", reply: "따뜻한 걸 먹으면 복잡한 머리도 조금은 풀리겠지.", delta: {} },
      { id: "salad", text: "가벼운 샐러드로 천천히 숨을 돌린다.", reply: "급하게 먹지 말고 잠깐이라도 여유를 갖자.", delta: {} },
    ] },
    { id: "day3Lunch", time: "12:22", speaker: "강민재", dynamic: "lunchBreak", bg: "cafeteria_day", char: "minjae" },
    { id: "day3MinjaeHint", time: "12:24", speaker: "강민재", text: "그러고 보니 네가 말한 그 바뀐 문장, 예전 발표 자료에서도 본 것 같아. 하린 선배가 그때 거의 혼자 다 했다고 들었는데… 아니, 이건 내가 말할 얘기는 아닌가.", char: "minjae", placeholder: "inherit", clue: CLUES.legacyMatch },
    { id: "day3HarinPastBoundary", time: "12:26", speaker: "한도윤", text: "민재는 더 말하지 않았다. 구버전 폴더와 바뀐 문장은 이제 우연으로 보기 어려웠다.", char: "minjae", placeholder: "inherit" },
    { id: "day3OfficeReturn", time: "13:25", speaker: "한도윤", text: "구내식당에서 돌아와 오전에 보존한 변경본을 다시 열었다. 추측은 잠시 내려놓고, 지금 확인할 수 있는 기록부터 정리하자.", bg: "office", bgm: "mystery", location: "게임사업실 · 오후" },
    { id: "day3InvestigationStart", time: "13:30", speaker: "한도윤", text: "세 기록이 남아 있다. 무엇부터 확인하느냐에 따라 첫 판단이 달라질 수 있다.", bg: "office", choiceKey: "investigationFirst", choices: [
      { id: "access", text: "서하린의 직접 접근 기록", reply: "먼저 선배가 문서를 직접 열었는지 확인하자.", delta: {} },
      { id: "automation", text: "09:03 자동화 실행 기록", reply: "문장이 바뀐 시각에 어떤 자동화가 돌았는지부터 보자.", delta: {} },
      { id: "folder", text: "구버전 폴더 연결 경로", reply: "현재 작업본이 과거 폴더와 어떻게 연결됐는지부터 확인하자.", delta: {} },
    ] },
    { id: "day3AccessLogFirst", time: "13:38", speaker: "시스템", text: "첫 조사 대상으로 서하린의 직접 문서 접근 기록을 선택했습니다.", systemPanel: { title: "ACCESS LOG", rows: ["서하린 마지막 직접 접근 · DAY 2 20:06", "DAY 3 09:03 직접 접근 · 없음", "명의 기반 자동화 활동 · 있음"] }, when: { decision: "investigationFirst", equals: "access" } },
    { id: "day3AutomationLogFirst", time: "13:38", speaker: "시스템", text: "첫 조사 대상으로 09:03 자동화 실행 기록을 선택했습니다.", systemPanel: { title: "AUTOMATION LOG", rows: ["09:03 · 구버전 연결 호출", "09:03 · 나나봇 자동 정리", "실행 계정 / 기기 · 관리자 권한 필요"] }, when: { decision: "investigationFirst", equals: "automation" } },
    { id: "day3FolderPathFirst", time: "13:38", speaker: "시스템", text: "첫 조사 대상으로 구버전 폴더 연결 경로를 선택했습니다.", systemPanel: { title: "CONNECTED PATH", rows: ["2024_온보딩개선_최종대응", "→ 공용 슬라이드 동기화", "→ 신규유저_이탈개선_PT 작업본"] }, clue: CLUES.accessUnconfirmed, when: { decision: "investigationFirst", equals: "folder" } },
    { id: "day3FirstInference", time: "13:40", speaker: "한도윤", dynamic: "firstInvestigationInference", bg: "office" },
    { id: "day3InvestigationReaction", time: "13:42", speaker: "서하린", dynamic: "investigationReaction", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin" },
    { id: "day3AccessLog", time: "13:47", speaker: "시스템", text: "서하린의 직접 문서 접근 기록을 확인했습니다.", systemPanel: { title: "ACCESS LOG", rows: ["서하린 마지막 직접 접근 · DAY 2 20:06", "DAY 3 09:03 직접 접근 · 없음", "명의 기반 자동화 활동 · 있음"] }, when: { decision: "investigationFirst", notEquals: "access" } },
    { id: "day3AutomationLog", time: "13:54", speaker: "시스템", text: "자동화 실행 기록을 확인했습니다.", systemPanel: { title: "AUTOMATION LOG", rows: ["09:03 · 구버전 연결 호출", "09:03 · 나나봇 자동 정리", "실행 계정 / 기기 · 관리자 권한 필요"] }, when: { decision: "investigationFirst", notEquals: "automation" } },
    { id: "day3FolderPath", time: "14:01", speaker: "시스템", text: "현재 작업본과 과거 폴더 사이의 연결 경로가 확인되었습니다.", systemPanel: { title: "CONNECTED PATH", rows: ["2024_온보딩개선_최종대응", "→ 공용 슬라이드 동기화", "→ 신규유저_이탈개선_PT 작업본"] }, clue: CLUES.accessUnconfirmed, when: { decision: "investigationFirst", notEquals: "folder" } },
    { id: "day3Wrap", time: "17:10", speaker: "한도윤", text: "변경본과 로그를 따로 보존하고 DAY 2 복원 지점은 건드리지 않았다. 실제 실행 계정과 기기는 내일 시스템 담당자에게 확인하기로 했다.", bg: "office" },
    { id: "day3Summary", time: "18:00", speaker: "시스템", text: "오늘의 업무를 정산합니다.", bg: "office", bgm: "daily", daySummary: 3 },
    { id: "day3DepartureLead", time: "18:14", speaker: "한도윤", dynamic: "departureLead", bg: "office_night", bgm: "harin", location: "게임사업실 · 퇴근" },
    { id: "day3ElevatorCg", time: "18:15", speaker: "서하린", dynamic: "departureHarin", bg: "elevator_lobby_night", cgAssetId: "event_cg.day3.elevator_waiting", cgTitle: "기다렸어요, 오늘은", cinematicDelay: 1300, location: "엘리베이터 로비 · 퇴근", when: { affectionBeforeChatGte: 4 } },
    { id: "day3ElevatorAfterCg", time: "18:16", speaker: "한도윤", text: "선배와 눈이 마주쳤다. 열린 엘리베이터 안쪽의 따뜻한 불빛보다, 나를 기다렸다는 그 미소가 먼저 눈에 들어왔다.", bg: "elevator_lobby_night", char: "harin", location: "엘리베이터 로비 · 퇴근", when: { affectionBeforeChatGte: 4 } },
    { id: "day3DepartureHarin", time: "18:15", speaker: "서하린", dynamic: "departureHarin", char: "harin", bg: "office_night", when: { affectionBeforeChatLt: 4 } },
    { id: "day3EveningMessage", time: "20:10", speaker: "서하린", dynamic: "eveningMessage", bg: "office_night", notification: "d3-harin-evening" },
    { id: "day3End", time: "20:12", speaker: "시스템", text: "DAY 3 완료\n첫 번째 변조는 확인되었지만 실제 실행자는 아직 밝혀지지 않았습니다.", bg: "office_night", end: true },
  ];

  function isVisible(scene, decisions = {}, context = {}) {
    if (!scene.when) return true;
    if (Object.prototype.hasOwnProperty.call(scene.when, "affectionBeforeChatGte")) {
      return Number(context.affectionBeforeChat) >= scene.when.affectionBeforeChatGte;
    }
    if (Object.prototype.hasOwnProperty.call(scene.when, "affectionBeforeChatLt")) {
      return Number(context.affectionBeforeChat) < scene.when.affectionBeforeChatLt;
    }
    const value = decisions[scene.when.decision];
    if (Object.prototype.hasOwnProperty.call(scene.when, "notEquals")) return value !== scene.when.notEquals;
    return value === scene.when.equals;
  }

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

  const api = Object.freeze({ scenes, CLUES, ROOMS, MESSAGES, isVisible, validateScenes });
  if (typeof module === "object" && module.exports) module.exports = api;
  global.Day3Story = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
