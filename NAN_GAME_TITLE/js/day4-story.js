(function initDay4Story(global) {
  "use strict";

  const records = global.ClueRecords || (typeof module === "object" && module.exports ? require("./clue-records.js") : null);
  if (!records) throw new Error("ClueRecords must load before Day4Story");

  const CLUES = Object.freeze({
    auditRequest: records.get("d4_audit_request"),
    verifiedRetention: records.get("d4_verified_retention"),
    evidenceSubmission: records.get("d4_evidence_submission"),
  });

  const scenes = Object.freeze([
    { id: "day4Intro", time: "08:47", speaker: "시스템", text: "DAY 4\n발표 전날", location: "게임사업실 · 오전", visual: "출근 직후의 게임사업실. 도윤과 하린의 자리 위에 발표 자료가 열려 있다.", bgm: "daily" },
    { id: "day4BossCall", time: "08:48", speaker: "박태식", text: "옆 프로젝트 녹음이 오늘 오전으로 당겨졌어. 오디오 검수 담당이 비어서 두 명만 지원해.", visual: "박태식이 급히 다가와 녹음 지원 일정을 전달한다." },
    { id: "day4HarinReady", time: "08:49", speaker: "서하린", text: "원고 버전부터 확인하겠습니다. 도윤 씨, 이동하면서 파일명 규칙 알려드릴게요.", visual: "하린이 원고와 헤드폰을 챙겨 먼저 출입구로 향한다." },
    { id: "day4MoveStudio", time: "09:20", speaker: "서하린", text: "문서로 설명하는 것보다 직접 듣는 게 빨라요. 오른쪽만 써요. 저는 왼쪽 들을게요.", location: "사내 녹음실 · 이동", visual: "한 쌍의 모니터링 헤드폰을 한쪽씩 나눠 쓴 도윤과 하린. 짧은 선 때문에 걸음을 맞춰야 한다.", bgm: "harin" },
    { id: "day4HeadphoneChoice", time: "09:21", speaker: "한도윤", text: "헤드폰 선이 당겨진다. 어떻게 할까?", visual: "헤드폰을 공유한 채 가까이 걷는 두 사람.", choiceKey: "headphoneResponse", choices: [
      { id: "matchPace", text: "선이 당긴다고 알리고 서로 보폭을 맞춘다.", delta: { trust: 1 }, reply: "하린은 알겠다고 답하며 도윤과 같은 속도로 걸었다." },
      { id: "yieldHeadphone", text: "헤드폰을 잠시 넘기고 원고 체크리스트를 정리한다.", delta: { work: 1 }, reply: "도윤은 이동하는 동안 확인할 항목을 빠짐없이 정리했다." },
      { id: "untangleTogether", text: "잠깐 멈춰 하린과 엉킨 헤드폰 선을 함께 정리한다.", delta: { affection: 1 }, reply: "가까이 엉킨 선을 풀고 나자 하린이 작게 웃으며 먼저 걸음을 옮겼다." },
    ] },
    { id: "day4GuideRecording", time: "09:43", speaker: "한도윤", text: "왜 제가 가이드 대사를 읽는 겁니까?", location: "사내 녹음실 · 부스", visual: "스탠드 마이크 앞에 선 도윤과 유리창 너머에서 원고를 든 하린." },
    { id: "day4MicShare", time: "09:47", speaker: "서하린", text: "너무 가까워요. 숨소리까지 업무 기록에 남기고 싶지는 않아요.", visual: "마이크 하나를 사이에 두고 문장의 호흡을 맞추느라 가까워진 두 사람." },
    { id: "day4MicChoice", time: "09:48", speaker: "한도윤", text: "마이크가 이미 켜져 있다는 표시가 들어왔다.", visual: "녹음 표시등이 켜진 마이크와 동시에 굳은 두 사람.", choiceKey: "micResponse", choices: [
      { id: "keepTake", text: "방금 대화도 자연스러운 테이크였다고 말한다.", delta: { affection: 1 }, reply: "하린은 그 의견까지 지워 달라고 하면서도 웃음을 참지 못했다." },
      { id: "checkLevels", text: "민망함을 넘기고 음량 점검부터 다시 한다.", delta: { work: 1 }, reply: "도윤은 녹음 레벨을 다시 맞추고 다음 테이크를 준비했다." },
      { id: "apologize", text: "먼저 말을 끊어 미안하다고 사과한다.", delta: { trust: 1 }, reply: "하린은 괜찮다며 이번에는 같이 읽어 보자고 답했다." },
    ] },
    { id: "day4HarinPast", time: "10:30", speaker: "서하린", text: "예전에는 이벤트 대사 정리하는 걸 좋아했어요. 짧은 문장 하나로 캐릭터가 달라지는 게 재미있었거든요.", visual: "원고의 감정 표시를 고치는 하린. 평소보다 편안한 표정이다." },
    { id: "day4LastTake", time: "11:18", speaker: "서하린", text: "테이크 시각 바로 찾은 건 좋았어요. 처음인데도 기록을 제대로 남겼네요.", visual: "케이블 잡음이 난 시각을 찾아 마지막 재녹음을 끝낸 두 사람." },
    { id: "day4Return", time: "11:42", speaker: "한도윤", text: "문서가 바뀐 시각과 내용은 확인했습니다. 이제 누가 자동화를 요청했는지 보면 되는 겁니까?", location: "게임사업실 · 오전", visual: "회사로 돌아와 보안 감사 화면을 연 도윤과 하린. 낮 사무실 배경은 추가 제작이 필요하다.", characters: [{ assetId: "character.harin.arms_folded.concerned", position: "right" }], bgm: "mystery" },
    { id: "day4AuditExplain", time: "11:43", speaker: "서하린", text: "네. 실제로 자동화를 실행해 달라고 요청한 계정은 보안 감사 로그에서 확인해야 해요.", characters: [{ assetId: "character.harin.arms_folded.concerned", position: "right" }], system: { title: "SECURITY AUDIT", rows: ["문서 변경 이력 · 변경 시각과 내용", "보안 감사 로그 · 실제 요청 계정", "현재 상태 · 열람 권한 없음"] } },
    { id: "day4AuditRequest", time: "13:20", speaker: "시스템", text: "보안 감사 로그 조회 요청이 접수되었습니다.", location: "게임사업실 · 오후", visual: "점심 이후 도착한 감사 로그 조회 접수 알림.", system: { title: "AUDIT REQUEST", rows: ["상태 · 담당자 확인 대기", "목적 · 자동화 실행 요청 계정 확인"] }, clue: CLUES.auditRequest, bgm: "daily" },
    { id: "day4EvidenceBrief", time: "13:35", speaker: "박태식", text: "평가위원이 수치 근거를 바로 열어 볼 수 있게 증빙 패키지도 같이 제출해.", visual: "박태식이 평가 시스템의 제출 항목을 가리킨다. 박태식 지시 포즈는 추가 제작이 필요하다." },
    { id: "day4VerifyMetric", time: "14:00", speaker: "서하린", text: "수치만 적지 말고 대상과 기간도 같이 남겨요. 같은 이름의 지표라도 기준이 다르면 다른 숫자가 될 수 있으니까요.", visual: "DAY 1 원본과 DAY 2 검증 기록을 나란히 비교하는 화면.", characters: [{ assetId: "character.harin.arms_folded.concerned", position: "right" }], system: { title: "METRIC VERIFIED", rows: ["7일 차 잔존율 · 18.4%", "대상 · 신규 가입 사용자", "기간 · 발표 기준 주차", "상태 · 원본 대조 완료"] }, clue: CLUES.verifiedRetention, bgm: "mystery" },
    { id: "day4EvidenceChoice", time: "14:20", speaker: "한도윤", text: "평가위원에게 가장 먼저 보여 줄 근거를 정하자.", visual: "원본 데이터, 계산식, 유저 조사 요약이 증빙 후보로 표시된다.", choiceKey: "evidencePriority", choices: [
      { id: "sourceFirst", text: "정상 원본과 계산식을 첫 화면에 둔다.", delta: { work: 1, trust: 1 }, reply: "정상 원본과 계산식이 증빙 패키지의 첫 항목으로 배치됐다." },
      { id: "summaryFirst", text: "유저 조사 요약을 먼저 보여 준다.", delta: { affection: 0, work: 1 }, reply: "읽기는 쉬워졌지만 도윤은 원본 링크도 바로 다음에 배치했다." },
      { id: "criteriaFirst", text: "대상과 산정 기간을 먼저 설명한다.", delta: { trust: 1 }, reply: "같은 지표의 기준이 섞이지 않도록 산정 조건을 선명하게 표시했다." },
    ] },
    { id: "day4EvidencePreview", time: "14:45", speaker: "한도윤", text: "미리보기에도 18.4%로 표시됩니다. 출처 링크도 정상적으로 열립니다.", visual: "평가용 증빙 패키지 미리보기. 모든 값이 정상으로 표시된다.", system: { title: "EVIDENCE PACKAGE", rows: ["발표 지표 · 18.4%", "출처 · retention_7d_verified", "산정 기준 · 원본 대조 완료", "링크 상태 · 정상"] } },
    { id: "day4QuestionRehearsal", time: "15:20", speaker: "서하린", text: "제출 자료와 발표 자료의 값이 다르면요?", visual: "평가위원 역할을 맡아 질문하는 하린과 답변 기록을 든 도윤." },
    { id: "day4QuestionAnswer", time: "15:21", speaker: "한도윤", text: "우선 산정 기준이 같은지 확인하고, 보존한 정상 원본과 제출 생성 기록을 비교하겠습니다.", visual: "도윤이 원본과 제출 기록을 순서대로 짚는다." },
    { id: "day4Rehearsal", time: "16:10", speaker: "박태식", text: "수치 설명은 좋아. 발표는 짧게, 근거는 바로 꺼낼 수 있게.", visual: "회의실 화면에 정상 PT와 증빙 패키지가 함께 열린 리허설." },
    { id: "day4Submit", time: "17:05", speaker: "시스템", text: "PT와 평가용 증빙 패키지 제출이 완료되었습니다.", visual: "제출 완료 화면. PT와 증빙 모두 18.4%로 표시된다.", system: { title: "SUBMISSION COMPLETE", rows: ["PT 핵심 수치 · 18.4%", "증빙 표시 수치 · 18.4%", "출처 링크 · 정상", "확인 시각 · DAY 4 17:08"] }, clue: CLUES.evidenceSubmission },
    { id: "day4Preserve", time: "17:09", speaker: "서하린", text: "생성 번호와 확인 화면을 작업 기록에 남겨요. 내일 문제가 생겨도 우리가 무엇을 확인했는지는 증명할 수 있게요.", visual: "도윤이 제출 번호와 확인 시각을 별도 업무 기록에 보존한다." },
    { id: "day4LeaveLead", time: "17:30", speaker: "서하린", text: "오늘 확인한 상태만 보존하고 퇴근해요. 부장님이 다른 일을 붙이기 전에요.", location: "게임사업실 · 퇴근", visual: "퇴근 준비를 마친 두 사람과 멀리서 다가오는 박태식.", bgAssetId: "background.office.night", bgm: "minigame" },
    { id: "day4Escape", time: "17:31", speaker: "시스템", text: "박태식 부장에게 붙잡히기 전에 엘리베이터까지 이동하세요.", visual: "도윤의 SD풍 상상 속 사무실 탈출 경로. 추격 캐릭터 아트는 미니게임 도형으로 표시한다.", bgAssetId: "background.office.night", startEscape: true },
    { id: "day4EscapeResult", time: "17:40", speaker: "한도윤", dynamic: "escapeResult", location: "엘리베이터 로비 · 퇴근", visual: "엘리베이터 앞에 도착한 도윤과 하린.", bgAssetId: "background.elevator_lobby.night", bgm: "harin" },
    { id: "day4End", time: "18:00", speaker: "시스템", text: "DAY 4 완료\n발표 준비와 증빙 제출을 마쳤습니다.", location: "엘리베이터 로비 · 퇴근", visual: "닫히는 엘리베이터 문과 오늘의 확인 기록.", bgAssetId: "background.elevator_lobby.night", end: true, bgm: "daily" },
  ]);

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

  const api = Object.freeze({ scenes, CLUES, validateScenes });
  if (typeof module === "object" && module.exports) module.exports = api;
  global.Day4Story = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
