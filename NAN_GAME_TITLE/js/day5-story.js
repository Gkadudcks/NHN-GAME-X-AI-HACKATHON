(function initDay5Story(global) {
  "use strict";

  const records = global.ClueRecords || (typeof module === "object" && module.exports ? require("./clue-records.js") : null);
  if (!records) throw new Error("ClueRecords must load before Day5Story");
  const day4Story = global.Day4Story || (typeof module === "object" && module.exports ? require("./day4-story.js") : null);
  if (!day4Story) throw new Error("Day4Story must load before Day5Story");

  const ROOMS = day4Story.ROOMS;
  const MESSAGES = Object.freeze([
    ...day4Story.MESSAGES.map((message) => Object.freeze({ ...message })),
    { id: "d5-result", room: "boss", at: "day5Result", sender: "박태식 부장", text: "평가 결과가 확정됐다. 수고했다.", day: 5, time: "18:05" },
  ]);

  const office = "background.office.day";
  const meeting = "background.presentation_room.day";
  const elevator = "background.elevator_lobby.night";
  const harinNeutral = [{ id: "harin", assetId: "character.harin.relaxed_standing.neutral", position: "right" }];
  const harinSmile = [{ id: "harin", assetId: "character.harin.relaxed_standing.gentle_smile", position: "right" }];
  const harinConcerned = [{ id: "harin", assetId: "character.harin.arms_folded.concerned", position: "right" }];
  const minjae = [{ id: "minjae", assetId: "character.minjae.relaxed_standing.gentle_smile", position: "right" }];
  const boss = [{ id: "boss", assetId: "character.boss.holding_cup.concerned", position: "right" }];
  const auditResult = records.get("d5_security_audit_result");

  const scenes = Object.freeze([
    { id: "day5Intro", time: "09:06", speaker: "시스템", text: "DAY 5\n정직원 전환 발표", location: "게임사업실 · 오전", visual: "이른 아침의 게임사업실. 발표 PT가 열린 모니터 앞에 도윤이 홀로 앉아 있다.", bgAssetId: office, bgm: "daily" },
    { id: "day5OriginalCheck", time: "09:06", speaker: "한도윤", text: "18.4%. 발표 전주 신규 가입자. 보존한 원본과 어제 제출 기록 모두 이상 없습니다.", visual: "도윤이 보존된 발표 자료와 제출 확인 기록을 대조한다.", bgAssetId: office, system: { title: "발표 전 최종 확인", rows: ["7일 차 잔존율 · 18.4%", "분석 대상 · 신규 가입 사용자", "분석 기준 · 발표 전주 가입자", "추가 수정 · 없음"] } },
    { id: "day5HarinArrival", time: "09:08", speaker: "서하린", dynamic: "day4ResultGreeting", text: "생각보다 일찍 왔네요.", visual: "하린이 출근해 도윤의 자리 쪽으로 다가온다.", bgAssetId: office, characters: harinSmile, activeCharacter: "harin" },
    { id: "day5GreetingReply", time: "09:08", speaker: "한도윤", dynamic: "day4ResultReply", text: "오늘은 제가 먼저 준비해 두려고 했습니다.", visual: "도윤이 확인을 끝낸 화면을 하린에게 보여 준다.", bgAssetId: office, characters: harinSmile },
    { id: "day5GreetingClose", time: "09:08", speaker: "서하린", dynamic: "day4ResultClose", text: "오늘은 확인한 기록을 믿고 발표에만 집중해요.", visual: "하린이 정상으로 표시된 확인 기록을 보고 고개를 끄덕인다.", bgAssetId: office, characters: harinSmile },
    { id: "day5NoEditConfirmed", time: "09:08", speaker: "한도윤", text: "보존해 둔 원본만 다시 확인했습니다. 수치와 연결 상태는 어제 그대로고, 추가로 수정한 내용은 없습니다.", visual: "도윤이 읽기 전용 원본과 마지막 수정 시각을 하린에게 보여 준다.", bgAssetId: office, characters: harinNeutral, system: { title: "제출 당시 보관본", rows: ["발표 자료 수치 · 18.4%", "원본 링크 · 정상", "마지막 확인 · DAY 5 09:06", "추가 수정 · 없음"] } },
    { id: "day5TeaCutin", time: "09:09", speaker: "시스템", text: "발표 전에 천천히 마실 수 있도록 하린이 준비한 따뜻한 차.", visual: "NAN 로고가 인쇄된 크림색 테이크아웃 컵에서 옅은 김이 오른다.", bgAssetId: office, propAssetId: "prop.day5.warm_tea", propTitle: "하린이 준비한 따뜻한 차", effect: "day5-tea-cutin" },
    { id: "day5TeaQuestion", time: "09:09", speaker: "한도윤", text: "제 것도 사 오신 겁니까?", visual: "도윤이 하린이 건넨 차를 내려다본다.", bgAssetId: office, characters: harinSmile },
    { id: "day5TeaAnswer", time: "09:09", speaker: "서하린", text: "발표 직전에 빈속으로 커피 마시면 더 긴장할 것 같아서요. 도윤 씨 건 차로 골랐어요.", visual: "하린이 자신의 커피를 들고 도윤의 차를 가리킨다.", bgAssetId: office, characters: harinSmile },
    { id: "day5TeaReply", time: "09:09", speaker: "한도윤", text: "제가 긴장하지 않았다고 해도 믿지 않으시겠군요.", visual: "도윤이 따뜻한 컵을 손에 든다.", bgAssetId: office, characters: harinSmile },
    { id: "day5TeaClose", time: "09:09", speaker: "서하린", text: "네. 오늘만큼은 안 믿을게요.", visual: "하린이 장난스럽게 답한 뒤 발표 화면으로 시선을 돌린다.", bgAssetId: office, characters: harinSmile, motion: "embarrassed", camera: "romance" },
    { id: "day5FinalCheck", time: "09:10", speaker: "서하린", text: "발표 자료의 수치는 어제 확인한 그대로예요. 질문이 나오면 결론부터 말하고 근거를 보여 줘요.", visual: "두 사람이 DAY 4 제출 기록과 PT의 18.4%를 마지막으로 확인한다.", bgAssetId: office, characters: harinConcerned },
    { id: "day5FinalCheckReply", time: "09:10", speaker: "한도윤", text: "18.4%, 신규 가입 사용자, 발표 전주 가입자. 원본과 계산식까지 준비했습니다.", visual: "도윤이 핵심 수치와 분석 기준, 원본 계산식의 위치를 차례로 확인한다.", bgAssetId: office, characters: harinConcerned },
    { id: "day5FinalCheckWarning", time: "09:10", speaker: "서하린", text: "문제가 생겨도 추측부터 하지 말고 확인한 기록부터 제시해요.", visual: "하린이 보존된 기록을 가리키며 답변 원칙을 다시 강조한다.", bgAssetId: office, characters: harinConcerned, activeCharacter: "harin" },
    { id: "day5Strategy", time: "09:12", speaker: "한도윤", text: "예상하지 못한 질문이 나오면 어떤 순서로 대응할까?", visual: "도윤이 발표 답변 원칙을 정리한다.", bgAssetId: office, characters: harinNeutral, choiceKey: "responseStrategy", choices: [
      { id: "defend_evidence", text: "제가 확인한 결론을 먼저 밝히고 그 근거를 바로 제시하겠습니다.", delta: { work: 1 }, replySpeaker: "서하린", reply: "좋아요. 결론을 말한 만큼 바로 정확한 근거를 이어서 보여 줘요." },
      { id: "clarify_scope", text: "두 자료가 같은 대상과 기간을 사용하는지 질문의 전제부터 확인하겠습니다.", delta: { trust: 1 }, replySpeaker: "서하린", reply: "좋아요. 전제를 확인한 다음에는 도윤 씨가 결론까지 분명히 말해요." },
      { id: "coordinate_harin", text: "제가 발표 흐름을 유지하는 동안 선배에게 정상 원본을 열어 달라고 요청하겠습니다.", delta: { trust: 1 }, replySpeaker: "서하린", reply: "원본은 제가 열게요. 대신 설명은 도윤 씨가 직접 끝내야 해요." },
      { id: "speculate_cause", text: "발생 가능한 원인을 먼저 설명해 평가위원의 불안을 줄이겠습니다.", delta: {}, replySpeaker: "서하린", reply: "원인을 먼저 말하면 추측이 사실처럼 들릴 수 있어요. 실제 상황에서는 기록부터 봐요." },
    ] },
    { id: "day5StrategyCommit", time: "09:13", speaker: "서하린", text: "좋아요. 선택한 순서는 기억해 둬요. 실제 질문이 나오면 첫 대응부터 달라질 테니까.", visual: "하린이 도윤의 답변 순서를 메모한다.", bgAssetId: office, characters: harinNeutral },
    { id: "day5StrategyPromise", time: "09:13", speaker: "한도윤", text: "네. 발표 중에도 같은 방식으로 대응하겠습니다.", visual: "도윤이 선택한 대응 순서를 발표 노트 첫 줄에 고정한다.", bgAssetId: office, characters: harinNeutral },
    { id: "day5ReadOnly", time: "09:16", speaker: "시스템", text: "제출 자료를 읽기 전용으로 잠갔습니다.", visual: "최종 발표 자료와 제출 기록이 읽기 전용 상태로 전환된다.", bgAssetId: office, system: { title: "제출 자료 잠금 완료", rows: ["발표 자료 수치 · 18.4%", "근거 자료 수치 · 18.4%", "추가 수정 · 없음", "파일 상태 · 읽기 전용"] } },
    { id: "day5MinjaeArrival", time: "09:18", speaker: "강민재", text: "발표 자료는 어제 제출한 걸로 끝난 거 아니었어? 와, 차까지 챙겨 왔네. 오늘 대우가 다른데?", visual: "민재가 평소처럼 출근해 도윤과 하린에게 가볍게 말을 건다.", bgAssetId: office, characters: minjae },
    { id: "day5MoveMeeting", time: "09:22", speaker: "박태식", text: "장비 확인 끝났어. 발표 파일만 띄우고 나머지 창은 닫아.", location: "발표실 · 오전", visual: "발표실 대형 화면에 발표 첫 장이 표시되어 있다.", bgAssetId: meeting, characters: boss, bgm: "daily" },
    { id: "day5StrategySetup", time: "09:28", speaker: "한도윤", dynamic: "strategySetup", text: "선택한 대응 순서에 맞춰 마지막 준비를 하자.", visual: "도윤과 하린이 선택한 대응 전략에 맞춰 증거 창과 역할을 정리한다.", bgAssetId: meeting, characters: harinNeutral },
    { id: "day5AuditPending", time: "09:34", speaker: "시스템", text: "보안 감사 로그는 아직 담당자 확인 중입니다.", visual: "감사 로그 조회 상태가 대기로 표시된다.", bgAssetId: meeting, system: { title: "SECURITY AUDIT", rows: ["요청 계정 조회 · 처리 중", "현재 상태 · 담당자 확인 대기", "판단 가능 여부 · 아직 확인 불가"] } },
    { id: "day5Rehearsal", time: "09:40", speaker: "한도윤", text: "핵심 개선안은 신규 사용자의 초반 이탈 구간을 줄이는 것입니다. 검증된 7일 차 잔존율은 18.4%입니다.", visual: "도윤이 실제 발표처럼 첫 문장과 핵심 수치를 소리 내어 점검한다.", bgAssetId: meeting, characters: harinNeutral },
    { id: "day5RehearsalFeedback", time: "09:41", speaker: "서하린", text: "좋아요. 첫 문장에서 결론이 들려요. 질문이 들어오면 준비한 순서를 그대로 지키면 됩니다.", visual: "하린이 발표 시간을 확인하고 마지막 피드백을 건넨다.", bgAssetId: meeting, characters: harinSmile, activeCharacter: "harin" },
    { id: "day5Focus", time: "09:45", speaker: "한도윤", text: "발표에서 가장 먼저 강조할 부분을 정하자.", visual: "발표 첫 장의 강조 순서를 고르는 화면.", bgAssetId: meeting, choiceKey: "presentationFocus", choices: [
      { id: "verification", text: "정상 원본과 교차 검증 과정을 강조한다.", delta: { work: 1 }, reply: "검증 절차를 첫 근거로 배치했다." },
      { id: "user_experience", text: "사용자 경험 개선 효과를 강조한다.", delta: {}, reply: "사용자가 체감한 변화를 발표 도입부에 배치했다." },
      { id: "automation_boundary", text: "자동화는 보조 도구이며 사람이 검증했음을 강조한다.", delta: { trust: 1 }, reply: "사람이 최종 검증한 범위를 분명히 표시했다." },
    ] },
    { id: "day5EvaluatorsArrive", time: "09:50", speaker: "박태식", text: "평가위원들이 도착했어. 이제 자료는 건드리지 말고 자리에서 기다려.", visual: "도윤과 하린이 발표실 안에서 조용히 시작을 기다린다.", bgAssetId: meeting, characters: boss },
    { id: "day5TeaCallback", time: "09:50", speaker: "한도윤", text: "차가 아직 따뜻하군. 확실히 커피보다 마음이 가라앉는 것 같습니다.", visual: "도윤이 발표 직전 하린이 준 차를 한 모금 마신다.", bgAssetId: meeting, characters: harinSmile },
    { id: "day5HarinAdvice", time: "09:54", speaker: "서하린", text: "준비한 만큼만 보여 줘요. 모르는 건 확인하겠다고 말하면 되고요.", visual: "하린이 발표 화면을 마지막으로 확인한 뒤 도윤을 바라본다.", bgAssetId: meeting, characters: harinNeutral },
    { id: "day5EvaluatorsEnter", time: "09:57", speaker: "한도윤", text: "평가위원들이 들어왔다. 하린 선배가 소리 없이 ‘결론부터’라고 입 모양으로 알려 줬다.", visual: "하린이 발표실 앞쪽에서 도윤에게 마지막 신호를 보낸다.", bgAssetId: meeting, characters: harinNeutral },
    { id: "day5ReadyToPresent", time: "09:59", speaker: "시스템", text: "발표 자료와 확인 기록이 준비되었습니다.", visual: "발표 첫 장과 시작 대기 중인 타이머가 화면에 표시된다.", bgAssetId: meeting, system: { title: "발표 준비 완료", rows: ["발표 자료 · 준비 완료", "제출 당시 수치 · 18.4%", "질문 대응 순서 · 선택 완료", "현재 상태 · 시작 대기"] }, nextLabel: "발표 시작" },
    { id: "day5PresentationStart", time: "10:00", speaker: "한도윤", dynamic: "presentationOpening", text: "정직원 전환 발표를 시작하겠습니다.", location: "발표실 · 발표", visual: "도윤이 신규 사용자 경험 개선안 발표를 시작한다.", bgAssetId: meeting, system: { title: "신규 사용자 초반 경험 개선안", rows: ["개선 결과 · 7일 차 잔존율 18.4%", "분석 대상 · 신규 가입 사용자", "현재 순서 · 결과 설명"] }, bgm: "presentationCalm" },
    { id: "day5PresentationProblem", time: "10:01", speaker: "한도윤", text: "먼저 확인한 문제는 신규 사용자가 첫 플레이 목표를 이해하기 전에 이탈한다는 점이었습니다. 기능은 충분했지만, 처음 무엇을 해야 하는지가 분명하지 않았습니다.", visual: "신규 사용자의 첫 진입 흐름과 주요 이탈 구간이 발표 화면에 표시된다.", bgAssetId: meeting, system: { title: "현재 문제", rows: ["분석 대상 · 신규 가입 사용자", "확인 구간 · 첫 플레이", "발견한 문제 · 목표를 알기 전에 이탈", "개선안 · 초반 진행 순서 명확화"] } },
    { id: "day5PresentationSolution", time: "10:03", speaker: "한도윤", text: "그래서 첫 세션의 안내를 줄이고, 사용자가 바로 선택하고 행동할 수 있도록 핵심 동선을 다시 구성했습니다. 설명을 늘린 것이 아니라 첫 성공 경험까지의 거리를 줄였습니다.", visual: "개선 전후의 첫 플레이 동선이 나란히 비교된다.", bgAssetId: meeting, system: { title: "ONBOARDING FLOW", rows: ["불필요 안내 · 축소", "핵심 행동 · 전면 배치", "첫 성공 경험 · 앞당김", "측정 기준 · 동일 조건 비교"] } },
    { id: "day5PresentationFocusDetail", time: "10:05", speaker: "한도윤", dynamic: "presentationFocusDetail", text: "선택한 발표 강조점에 따라 핵심 근거를 설명한다.", visual: "도윤이 발표 전에 선택한 강조점을 본문 근거와 연결한다.", bgAssetId: meeting },
    { id: "day5PresentationMetric", time: "10:07", speaker: "한도윤", text: "그 결과 발표 전주 신규 가입자의 7일 차 잔존율은 18.4%로 확인됐습니다. 단순 조회값이 아니라 같은 대상과 기간을 고정해 다시 계산한 결과입니다.", emphasis: ["7일", "18.4%"], visual: "대형 스크린 중앙에 18.4%와 분석 대상, 기간이 차례로 강조된다.", bgAssetId: meeting, system: { title: "개선 결과", rows: ["7일 차 잔존율 · 18.4%", "분석 대상 · 신규 가입 사용자", "분석 기준 · 발표 전주 가입자", "확인 결과 · 원본과 계산 결과 일치"] }, camera: "focus" },
    { id: "day5PresentationVerification", time: "10:09", speaker: "한도윤", text: "DAY 2에는 원본 데이터와 계산식을 서로 맞대어 확인했고, DAY 4 제출 직후에는 발표 자료와 근거 자료의 수치가 모두 18.4%인지 다시 확인했습니다.", emphasis: "18.4%", visual: "DAY 2 수치 확인 기록과 DAY 4 제출 직후 확인 화면이 연결되어 표시된다.", bgAssetId: meeting, system: { title: "수치 확인 과정", rows: ["DAY 2 · 원본과 계산 결과 대조", "DAY 4 · 제출 직후 다시 확인", "발표 자료 · 18.4%", "근거 자료 · 18.4%"] } },
    { id: "day5PresentationBoundary", time: "10:10", speaker: "한도윤", text: "자동화는 자료를 정리하고 연결하는 보조 수단으로만 사용했습니다. 지표의 대상과 기간, 최종 수치의 판단은 사람이 원본을 확인해 확정했습니다.", visual: "자동화 처리와 사람의 최종 확인 범위가 분리된 도식으로 나타난다.", bgAssetId: meeting, system: { title: "자동화 활용 및 최종 확인", rows: ["자동화 · 자료 정리와 연결", "담당자 · 분석 대상과 기간 확인", "담당자 · 원본 수치 최종 확인", "최종 책임 · 발표자"] } },
    { id: "day5FocusReaction", time: "10:11", speaker: "평가위원", dynamic: "focusReaction", text: "발표의 핵심 방향을 확인했습니다. 계속해 주세요.", visual: "잠시 정적이 흐른 뒤 화면 밖 평가위원이 기록을 넘긴다.", bgAssetId: meeting },
    { id: "day5PresentationNormal", time: "10:12", speaker: "평가위원", text: "개선 방향과 검증 과정까지 확인했습니다. 공식 증빙 자료도 함께 보겠습니다.", visual: "대형 스크린의 발표 자료가 공식 증빙 화면으로 전환된다.", bgAssetId: meeting },
    { id: "day5EvidenceRefresh", time: "10:16", speaker: "시스템", text: "제출용 근거 자료에 연결된 원본을 다시 불러옵니다.", visual: "평가 시스템이 제출 근거 자료의 연결 원본을 갱신한다.", bgAssetId: meeting, system: { title: "제출 자료 확인", rows: ["발표 자료 수치 · 18.4%", "제출 근거 수치 · 불러오는 중", "연결된 자료 · 7일 차 잔존율 검증본"] }, bgm: "presentationCalm" },
    { id: "day5EvaluatorHold", time: "10:18", speaker: "평가위원", text: "잠시만요…….", visual: "평가위원의 말과 함께 발표실의 음악이 멎고 짧은 정적이 흐른다.", bgAssetId: meeting, holdDelay: 2000, stopBgm: true, camera: "tension" },
    { id: "day5Mismatch", time: "10:18", speaker: "평가위원", text: "발표 자료와 제출용 검증 자료의 수치가 다릅니다! 발표 자료는 18.4%인데, 제출용 검증 자료에는 12.7%로 표시돼 있습니다.", emphasis: ["18.4%", "12.7%"], visual: "대형 화면에 서로 다른 두 수치가 나란히 표시된다.", bgAssetId: meeting, system: { title: "수치 불일치 발견", rows: ["발표 자료 수치 · 18.4%", "제출용 검증 자료 수치 · 12.7%", "분석 기준 · 같은지 확인 필요", "현재 상태 · 원인 확인 중"] }, bgm: "presentationUrgent" },
    { id: "day5MismatchDoyun", time: "10:18", speaker: "한도윤", text: "18.4%는 원본 데이터와 계산식을 교차 검증한 수치입니다.", emphasis: "18.4%", visual: "도윤이 당황한 기색을 누르고 보존된 원본 기록을 먼저 가리킨다.", bgAssetId: meeting, camera: "tension" },
    { id: "day5MismatchFollowup", time: "10:18", speaker: "평가위원", text: "그렇다면 혹시 제출 전부터 12.7%였던 것 아닙니까? 산정 기준이 다른 건지, 제출 이후 자료가 변경된 건지 설명해 주세요.", emphasis: "12.7%", visual: "두 수치 아래에 산정 기준과 제출 이후 변경 여부가 질문으로 표시된다.", bgAssetId: meeting },
    { id: "day5BossPrompt", time: "10:18", speaker: "박태식", text: "도윤 씨, 지금 확인한 기록으로 설명할 수 있겠어?", visual: "박태식이 화면보다 도윤을 바라보며 짧게 확인한다.", bgAssetId: meeting, characters: boss },
    { id: "day5HarinPrompt", time: "10:18", speaker: "서하린", text: "원인을 먼저 단정하지 말고, 어느 수치가 검증됐는지부터 보여 줘요.", visual: "하린이 보존된 정상 원본 창을 열어 두고 도윤에게 순서를 상기시킨다.", bgAssetId: meeting, characters: harinConcerned, activeCharacter: "harin" },
    { id: "day5StrategyCallback", time: "10:18", speaker: "한도윤", dynamic: "strategyCallback", text: "먼저 검증된 사실부터 설명하겠습니다.", visual: "도윤이 발표 전 선택한 대응 순서에 따라 첫 답변을 시작한다.", bgAssetId: meeting },
    { id: "day5SpeculationCorrection", strategy: "speculate_cause", time: "10:19", speaker: "한도윤", text: "원인을 추측하기 전에 기록부터 확인해야 한다. 어떻게 답할까?", visual: "도윤이 자동화 오류를 언급하려다 하린의 조언을 떠올린다.", bgAssetId: meeting, choiceKey: "speculationResponse", choices: [
      { id: "keep_speculating", text: "자동화 오류일 가능성이 높다고 먼저 주장한다.", delta: { trust: -10 }, replySpeaker: "평가위원", reply: "가능성이 아니라 지금 확인할 수 있는 근거로 설명해 주세요." },
      { id: "return_to_evidence", text: "추측을 멈추고 검증된 18.4%의 원본부터 제시한다.", delta: { trust: 1 }, replySpeaker: "서하린", reply: "네. 그 순서면 됩니다." },
    ] },
    { id: "day5NormalProved", time: "10:21", speaker: "한도윤", text: "DAY 2 수치 확인 기록입니다. 발표 전주 신규 가입자의 7일 차 잔존율은 18.4%로 확인됐습니다.", emphasis: ["7일", "18.4%"], visual: "확인된 원본과 계산식이 평가 화면에 표시된다.", bgAssetId: meeting, system: { title: "확인된 원본 수치", rows: ["7일 차 잔존율 · 18.4%", "분석 대상 · 신규 가입 사용자", "분석 기준 · 발표 전주 가입자", "DAY 2 · 원본과 계산 결과 일치"] } },
    { id: "day5SubmissionProved", time: "10:23", speaker: "한도윤", text: "DAY 4 17시 8분 제출 직후에는 발표 자료와 근거 자료 모두 18.4%였습니다. 수치가 달라진 건 제출 전이 아니라, 제출 이후입니다.", emphasis: ["17시 8분", "18.4%"], visual: "DAY 4 제출 완료 기록과 확인 시각이 표시된다.", bgAssetId: meeting, system: { title: "제출 당시 기록", rows: ["발표 자료 · 18.4%", "근거 자료 · 18.4%", "제출 확인 · DAY 4 17:08", "추가 수정 · 없음"] } },
    { id: "day5Pause", time: "10:24", speaker: "평가위원", text: "발표를 잠시 멈추겠습니다. 특정 사람이나 시스템을 먼저 지목하지 말고, 변경 경로를 확인해 주세요.", visual: "발표 타이머가 일시 정지되고 PPT가 오류 확인 순서로 전환된다.", bgAssetId: meeting, bgm: "presentationUrgent" },
    { id: "day5VerificationReady", time: "10:25", speaker: "시스템", text: "오류 검증 준비가 완료되었습니다.", visual: "발표실 화면 위에 오류 검증 미니게임 대기창이 열린다.", bgAssetId: meeting },
    { id: "day5FactSort", time: "10:25", speaker: "평가위원", text: "제출 전부터 근거 자료가 12.7%였던 것 아닙니까?", emphasis: "12.7%", visual: "PPT에 발표 자료 18.4%와 제출 당시 기록이 나란히 표시된다.", bgAssetId: meeting, system: { title: "01 · 제출 당시 사실 확인", rows: ["평가위원 주장 · 제출 전부터 12.7%", "DAY 4 제출 직후 · 발표 자료 18.4%", "DAY 4 제출 직후 · 근거 자료 18.4%", "선택 · 기록으로 확인된 사실"] }, choiceKey: "factVerification", choices: [
      { id: "verified_facts", text: "제출 직후에는 발표 자료와 근거 자료 모두 18.4%였습니다.", delta: { work: 2, trust: 1 }, replySpeaker: "평가위원", reply: "좋습니다. 그렇다면 수치는 제출 이후에 달라졌군요." },
      { id: "blame_harin", text: "서하린 선배가 자료를 변경했습니다.", delta: { trust: -2 }, replySpeaker: "서하린", reply: "지금 기록만으로는 실행한 사람을 단정할 수 없어요." },
      { id: "blame_bot", text: "나나봇이 독립적으로 수치를 바꿨습니다.", delta: { trust: -2 }, replySpeaker: "평가위원", reply: "자동 실행 여부와 요청 계정은 구분해서 설명해 주세요." },
    ] },
    { id: "day5AliasCheck", time: "10:27", speaker: "시스템", text: "12.7%가 화면에 나타난 과정을 기록 순서대로 판단하세요.", emphasis: "12.7%", visual: "PPT에 검증본과 이전 자료 사이의 연결 변경 기록이 순서대로 나타난다.", bgAssetId: meeting, system: { title: "02 · 자료 연결 변경", rows: ["09:57 · 7일 차 잔존율 검증본", "09:58 · 연결 대상 변경", "변경된 대상 · 2024년 이전 자료", "화면에 표시된 수치 · 12.7%"] }, choiceKey: "aliasVerification", choices: [
      { id: "alias_changed_to_archive", text: "검증본 연결이 2024년 이전 자료로 바뀌면서 12.7%가 표시됐습니다.", delta: { work: 2, trust: 1 }, replySpeaker: "한도윤", reply: "제출 파일의 숫자를 고친 것이 아니라, 화면이 불러오는 자료가 바뀐 것입니다." },
      { id: "submitted_as_archive", text: "DAY 4 제출 당시부터 2024년 이전 자료가 연결돼 있었습니다.", delta: { work: -1, trust: -1 }, replySpeaker: "평가위원", reply: "제출 직후 기록에는 18.4%가 남아 있습니다. 다시 확인하세요." },
      { id: "manual_number_edit", text: "누군가 발표 자료의 숫자를 12.7%로 직접 수정했습니다.", delta: { trust: -1 }, replySpeaker: "서하린", reply: "발표 자료는 여전히 18.4%예요. 바뀐 건 연결된 근거 자료입니다." },
    ] },
    { id: "day5AuditResult", time: "10:29", speaker: "시스템", text: "시스템 담당자 확인이 완료되었습니다. 보안 감사 로그를 엽니다.", visual: "대기 중이던 감사 요청이 완료로 전환되고 보안 감사 로그 원문이 열린다.", bgAssetId: meeting, system: { title: "SECURITY AUDIT · RESULT", rows: ["자동화 규칙 소유자 · 서하린", "재활성화 요청 계정 · 강민재", "실행 서비스 · 나나봇", "연결 대상 · 2024년 이전 자료"] }, clue: auditResult, camera: "reveal" },
    { id: "day5AuditResultReview", time: "10:29", speaker: "한도윤", text: "감사 로그를 확인했습니다. 규칙 소유자는 서하린 선배지만, 연결 변경 직전 재활성화를 요청한 계정은 강민재이고 실제 처리는 나나봇이 수행했습니다.", emphasis: ["서하린", "강민재", "나나봇"], visual: "도윤이 열린 감사 로그에서 규칙 소유자, 실제 요청 계정, 실행 서비스와 변경된 연결 대상을 구분해 읽는다.", bgAssetId: meeting, auditCutin: true },
    { id: "day5OwnerQuestion", time: "10:30", speaker: "평가위원", text: "자동 연결 기능의 등록 담당자가 서하린이면, 이번 실행도 서하린 씨가 요청한 것 아닙니까?", visual: "PPT가 등록 담당자와 실제 요청 계정을 나누어 표시한다.", bgAssetId: meeting, system: { title: "03 · 등록 담당자와 요청 계정", rows: ["등록 담당자 · 서하린", "이번 요청 계정 · 강민재", "실행 기능 · 나나봇", "확인할 내용 · 역할 구분"] }, choiceKey: "ownerDistinction", choices: [
      { id: "distinguish_roles", text: "등록 담당자는 서하린이지만, 이번 재실행 요청 계정은 강민재입니다.", delta: { work: 2, trust: 2 }, replySpeaker: "평가위원", reply: "등록된 이름과 이번 요청자를 구분한 기록을 확인했습니다." },
      { id: "owner_is_actor", text: "등록 담당자인 서하린이 이번 실행도 요청했습니다.", delta: { trust: -2 }, replySpeaker: "서하린", reply: "등록 담당자라는 정보만으로 이번 요청자를 단정할 수 없어요." },
      { id: "bot_is_actor", text: "나나봇이 요청자이자 실행자입니다.", delta: { work: -1, trust: -1 }, replySpeaker: "평가위원", reply: "나나봇은 실행 기능입니다. 요청 계정을 다시 보세요." },
    ] },
    { id: "day5CausalOrder", time: "10:34", speaker: "한도윤", text: "확인된 기록을 바탕으로 수치가 바뀐 전체 과정을 설명하자.", visual: "PPT에 요청부터 근거 자료 갱신까지 네 단계가 차례로 강조된다.", bgAssetId: meeting, system: { title: "04 · 수치가 바뀐 과정", rows: ["1 · 강민재가 이전 기능 재실행 요청", "2 · 2024년 이전 자료 연결", "3 · 나나봇 자동 연결 실행", "4 · 제출 근거 화면 12.7%로 갱신"] }, choiceKey: "causalChain", choices: [
      { id: "correct_chain", text: "민재의 요청 뒤 이전 자료가 연결됐고, 나나봇 실행으로 근거 화면이 12.7%로 갱신됐습니다.", delta: { work: 1, trust: 1 }, replySpeaker: "박태식", reply: "좋아. 요청한 사람과 실제로 처리한 기능까지 구분됐군." },
      { id: "bot_first", text: "나나봇이 먼저 수치를 바꾼 뒤 민재가 재실행을 요청했습니다.", delta: { work: -1 }, replySpeaker: "평가위원", reply: "요청 기록이 자동 실행보다 먼저입니다." },
      { id: "harin_manual_chain", text: "하린이 이전 자료를 직접 연결하고 숫자를 수정했습니다.", delta: { trust: -2 }, replySpeaker: "서하린", reply: "직접 접근 기록과 숫자 입력 기록은 확인되지 않았어요." },
    ] },
    { id: "day5Responsibility", time: "10:38", speaker: "한도윤", text: "기록으로 확인할 수 있는 책임 범위만 최종적으로 설명하자.", visual: "PPT가 확인된 행동과 확인되지 않은 추측을 분리한다.", bgAssetId: meeting, system: { title: "05 · 확인된 책임 범위", rows: ["확인 · 영향 확인 없는 재실행 요청", "확인 · 이상 인지 후 미보고", "미확인 · 직접 수치 입력", "판단 원칙 · 기록으로 입증된 범위"] }, choiceKey: "responsibility", choices: [
      { id: "minjae_request_concealment", text: "민재는 영향을 확인하지 않고 재실행을 요청했고, 이상을 알고도 보고하지 않았습니다.", delta: { work: 1, trust: 1 }, replySpeaker: "평가위원", reply: "기록으로 확인된 책임 범위를 인정합니다." },
      { id: "intentional_manipulation", text: "민재가 12.7%를 직접 입력해 의도적으로 조작했습니다.", delta: { trust: -2 }, replySpeaker: "평가위원", reply: "직접 입력과 고의 조작을 입증할 기록은 없습니다." },
      { id: "harin_rule_creation", text: "과거 기능을 만든 하린에게 이번 사고의 책임이 있습니다.", delta: { trust: -2, affection: -1 }, replySpeaker: "서하린", reply: "과거 등록과 이번 재실행 요청은 별개의 책임이에요." },
    ] },
    { id: "day5MinjaeConfront", time: "10:41", speaker: "강민재", dynamic: "verificationConfront", text: "재실행 요청은 내가 했어. 예전 검증 자료를 빨리 다시 쓰려던 거였고, 공식 근거 자료까지 바뀔 줄은 몰랐어.", visual: "오류 검증 결과에 따라 민재가 즉시 인정하거나 먼저 책임 범위를 방어한다.", bgAssetId: meeting, characters: minjae, bgm: "mystery" },
    { id: "day5MinjaeWhy", time: "10:42", speaker: "한도윤", dynamic: "verificationFollowup", text: "DAY 3에 이상 징후를 봤다면 왜 요청 사실을 말하지 않았습니까?", visual: "검증 실패 시 보안 감사 로그 원문 전체가 다시 열리고, 그 외에는 도윤이 미보고 이유를 묻는다.", bgAssetId: meeting, characters: minjae },
    { id: "day5MinjaeAdmit", time: "10:43", speaker: "강민재", dynamic: "verificationAdmission", text: "내 요청 때문일 수도 있다고 생각했어. 평가에서 빠질까 봐… 먼저 말하지 못했어. 미안하다.", visual: "민재가 검증 결과에 따른 추가 확인 뒤 요청 사실을 숨긴 이유를 인정한다.", bgAssetId: meeting, characters: minjae },
    { id: "day5HarinConsequence", time: "10:43", speaker: "서하린", text: "처음 요청한 것보다, 이상을 알고도 숨긴 게 더 큰 문제예요.", visual: "하린이 민재의 실수와 이후 은폐를 분명하게 구분해 말한다.", bgAssetId: meeting, characters: harinConcerned, activeCharacter: "harin" },
    { id: "day5RecoveryStart", time: "10:44", speaker: "평가위원", text: "확인된 변경 경로를 기준으로 근거 자료를 정상 상태로 되돌려 주세요.", visual: "발표실 PPT가 근거 자료 복구 순서로 전환된다.", bgAssetId: meeting, system: { title: "근거 자료 복구", rows: ["1 · 자동 갱신 일시 중지", "2 · 제출 당시 원본 선택", "3 · 분석 대상과 기간 확인", "4 · 원본 고정 연결"] }, bgm: "mystery" },
    { id: "day5RecoveryRefresh", time: "10:45", speaker: "한도윤", text: "복구하는 동안 연결된 자료가 다시 바뀌지 않게 먼저 무엇을 해야 할까?", visual: "PPT가 현재 자동 갱신 상태와 복구 순서를 강조한다.", bgAssetId: meeting, system: { title: "01 · 자동 갱신 제어", rows: ["현재 상태 · 연결 자료 자동 갱신 중", "위험 · 복구 중 값이 다시 바뀔 수 있음", "우선 조치 · 갱신 상태 결정", "목표 · 복구 기준 고정"] }, choiceKey: "recoveryRefresh", choices: [
      { id: "pause_refresh", text: "자동 갱신을 잠시 중지하고 현재 상태를 보존한다.", delta: { work: 1, trust: 1 }, replySpeaker: "서하린", reply: "좋아요. 이제 복구하는 동안 연결 대상이 다시 바뀌지 않아요." },
      { id: "keep_refresh", text: "최신 값이 들어오도록 자동 갱신을 계속 유지한다.", delta: { work: -1, trust: -1 }, replySpeaker: "평가위원", reply: "복구 도중 값이 다시 바뀔 수 있습니다. 먼저 갱신을 멈춰 주세요." },
    ] },
    { id: "day5RecoverySource", time: "10:46", speaker: "한도윤", text: "제출 당시 18.4%를 확인했던 원본을 선택하자.", emphasis: "18.4%", visual: "PPT에 현재 분석 원본과 2024년 이전 자료가 나란히 표시된다.", bgAssetId: meeting, system: { title: "02 · 복구할 원본 선택", rows: ["현재 분석 원본 · 18.4%", "2024년 이전 자료 · 12.7%", "임시 미리보기 · 출처 확인 불가", "선택 기준 · DAY 4 제출 기록"] }, choiceKey: "recoverySource", choices: [
      { id: "current_week", text: "DAY 4 제출 기록과 일치하는 현재 분석 원본 18.4%를 선택한다.", delta: { work: 1, trust: 1 }, replySpeaker: "한도윤", reply: "제출 당시 기록과 같은 18.4% 원본을 선택했습니다." },
      { id: "archive", text: "현재 화면에 표시된 2024년 이전 자료 12.7%를 선택한다.", delta: { work: -1, trust: -1 }, replySpeaker: "서하린", reply: "그 자료가 이번 오류의 원인이에요. 제출 당시 원본과 대조해 보세요." },
      { id: "preview", text: "출처를 확인할 수 없는 임시 미리보기를 선택한다.", delta: { work: -1 }, replySpeaker: "평가위원", reply: "출처를 확인할 수 없는 자료는 공식 근거로 사용할 수 없습니다." },
    ] },
    { id: "day5RecoveryBasis", time: "10:47", speaker: "한도윤", text: "발표 자료와 같은 분석 대상과 기간을 확인하자.", visual: "PPT에 분석 대상과 기간 조합이 비교 표시된다.", bgAssetId: meeting, system: { title: "03 · 분석 기준 확인", rows: ["발표 자료 대상 · 신규 가입 사용자", "발표 자료 기간 · 발표 전주", "측정 시점 · 가입 7일 후", "선택 · 같은 분석 기준"] }, choiceKey: "recoveryBasis", choices: [
      { id: "new_users_current_week", text: "신규 가입 사용자 · 발표 전주 · 가입 7일 후를 선택한다.", delta: { work: 1 }, replySpeaker: "한도윤", reply: "발표 자료와 같은 분석 대상과 기간을 확인했습니다." },
      { id: "all_users_current_week", text: "전체 사용자 · 발표 전주 · 가입 7일 후를 선택한다.", delta: { work: -1 }, replySpeaker: "평가위원", reply: "분석 대상이 발표 자료와 다릅니다." },
      { id: "new_users_archive", text: "신규 가입 사용자 · 2024년 보관 기간을 선택한다.", delta: { work: -1 }, replySpeaker: "서하린", reply: "분석 기간이 이번 발표 기준과 달라요." },
    ] },
    { id: "day5RecoveryBinding", time: "10:48", speaker: "한도윤", text: "확인한 원본이 다시 다른 자료로 바뀌지 않게 연결 방식을 정하자.", visual: "PPT가 자동 연결과 원본 고정 연결의 차이를 보여 준다.", bgAssetId: meeting, system: { title: "04 · 원본 연결 방식", rows: ["자동 연결 · 다른 자료로 변경 가능", "원본 고정 · 선택한 자료 유지", "자동 갱신 · 일시 중지", "목표 · 18.4% 원본 유지"] }, choiceKey: "recoveryBinding", choices: [
      { id: "fixed_source", text: "확인된 18.4% 원본에 고정하고 자동 갱신을 끈다.", delta: { work: 1, trust: 1 }, replySpeaker: "시스템", reply: "제출용 근거 자료가 확인된 원본에 고정되었습니다." },
      { id: "live_alias", text: "자동 연결을 유지해 최신 자료를 계속 불러온다.", delta: { work: -1, trust: -1 }, replySpeaker: "서하린", reply: "그러면 연결 대상이 다시 바뀔 수 있어요. 원본을 고정해야 합니다." },
    ] },
    { id: "day5RecoveryVerify", time: "10:49", speaker: "시스템", dynamic: "recoveryResult", text: "복구 전후 확인을 완료했습니다.", visual: "복구 전후 수치와 연결된 원본을 비교하는 화면.", bgAssetId: meeting, system: { title: "복구 결과 확인", rows: ["발표 자료 · 18.4%", "복구한 근거 자료 · 결과 확인", "분석 기준 · 신규 사용자 / 7일", "원본 연결 · 결과 확인"] } },
    { id: "day5VerificationResult", time: "10:49", speaker: "시스템", text: "오류 검증과 근거 자료 복구가 완료되었습니다.", visual: "검증 결과와 정상 원본 복구 상태를 합산한 미니게임 최종 결과창이 열린다.", bgAssetId: meeting, verificationResult: true },
    { id: "day5Resume", time: "10:50", speaker: "한도윤", dynamic: "resumeStatement", text: "정상 원본과 동일한 18.4% 수치로 증빙 자료를 복구했습니다.", visual: "도윤이 복구 결과와 변경 경로를 평가위원에게 제시한다.", bgAssetId: meeting, bgm: "daily" },
    { id: "day5EvaluatorClose", time: "10:58", speaker: "평가위원", text: "발표 중 문제가 발생했지만 정상 원본과 제출 이후 변경 경로는 확인했습니다. 사고 대응을 포함해 최종 평가하겠습니다.", visual: "발표실 스크린에 최종 검토 상태가 표시된다.", bgAssetId: meeting },
    { id: "day5PresentationEnd", time: "11:00", speaker: "시스템", text: "정직원 전환 발표가 종료되었습니다.", visual: "발표 화면이 닫히고 평가위원들이 최종 검토를 시작한다.", bgAssetId: meeting, system: { title: "발표 종료", rows: ["제출 당시 원본 · 확인", "제출 이후 변경 · 확인 완료", "근거 자료 복구 · 결과 반영", "최종 평가 · 심사 중"] } },
    { id: "day5AfterPresentationSilence", time: "11:01", speaker: "한도윤", text: "문이 닫히고 나서야 발표실이 조용하다는 걸 알았다. 손에 힘을 풀자 쥐고 있던 발표 리모컨이 뒤늦게 무겁게 느껴졌다.", visual: "평가위원들이 나간 발표실. 꺼진 프로젝터 아래에 도윤과 하린, 태식과 민재가 잠시 말없이 남아 있다.", bgAssetId: meeting, bgm: "daily" },
    { id: "day5HarinRelease", time: "11:02", speaker: "서하린", dynamic: "postPresentationHarin", text: "끝났어요. 이제 숨 쉬어도 돼요.", visual: "하린이 굳어 있던 도윤의 손에서 발표 리모컨을 받아 테이블 위에 내려놓는다.", bgAssetId: meeting, characters: harinSmile, activeCharacter: "harin" },
    { id: "day5DoyunRelease", time: "11:02", speaker: "한도윤", text: "발표를 끝냈다는 것보다, 잘못된 자료를 그대로 넘기지 않았다는 게 더 다행입니다.", visual: "도윤이 꺼진 발표 화면을 바라보다 천천히 숨을 내쉰다.", bgAssetId: meeting, characters: harinSmile },
    { id: "day5BossFollowup", time: "11:04", speaker: "박태식", text: "발표는 끝났지만 사고 처리는 지금부터다. 재실행 권한은 바로 회수하고, 감사 로그와 복구 기록은 오늘 안에 사고 보고서로 묶는다.", visual: "태식이 발표실 테이블에 남은 감사 기록을 정리하며 후속 조치를 지시한다.", bgAssetId: meeting, characters: boss },
    { id: "day5MinjaeApology", time: "11:06", speaker: "강민재", dynamic: "postPresentationMinjae", text: "내 요청 때문에 일이 커졌다. 이상한 걸 봤을 때 바로 말했어야 했어. 미안하다.", visual: "민재가 변명 없이 재실행 요청과 미보고에 대해 도윤과 하린에게 사과한다.", bgAssetId: meeting, characters: minjae },
    { id: "day5HarinBoundaryAfter", time: "11:07", speaker: "서하린", text: "직접 수치를 조작한 건 아니라는 것도 기록하겠습니다. 하지만 영향을 확인하지 않고 요청했고, 이상을 알고도 말하지 않은 책임은 따로 남겨야 해요.", visual: "하린이 실수와 은폐, 확인되지 않은 의도를 구분해 사고 기록에 적는다.", bgAssetId: meeting, characters: harinConcerned, activeCharacter: "harin" },
    { id: "day5HallwayPause", time: "11:12", speaker: "한도윤", text: "발표실 문을 닫고 나오자 긴장이 한꺼번에 빠졌다. 끝났다고 생각했는데, 이제야 오늘 있었던 일이 실제처럼 느껴졌다.", visual: "발표실 밖 복도. 별도 배경 없이 도윤이 잠시 벽에 기대 숨을 고르는 상황을 글자로 표시한다." },
    { id: "day5HarinHallway", time: "11:13", speaker: "서하린", dynamic: "postPresentationReflection", text: "예전 같았으면 제가 만든 규칙이라는 이유만으로 혼자 책임지려고 했을 거예요. 이번에는 도윤 씨가 기록을 끝까지 봐 줘서 그러지 않았어요.", visual: "복도에서 하린이 사건을 혼자 감당하지 않아도 됐던 이유를 도윤에게 말한다.", characters: harinNeutral, activeCharacter: "harin" },
    { id: "day5DoyunThanks", time: "11:14", speaker: "한도윤", text: "저도 혼자였다면 첫 질문에서부터 흔들렸을 겁니다. 아침에 해 주신 말과 따뜻한 차까지 전부 도움이 됐습니다.", visual: "도윤이 발표 전 하린이 건넨 조언과 차를 떠올리며 감사 인사를 전한다.", characters: harinSmile },
    { id: "day5ReturnOffice", time: "11:25", speaker: "시스템", text: "팀은 게임사업실로 돌아와 감사 로그, 발표 자료, 복구 기록을 하나의 사고 보고서로 정리하기 시작했습니다.", location: "게임사업실 · 오후", visual: "사무실 모니터에 세 기록의 확인 상태가 차례로 표시된다.", bgAssetId: office, system: { title: "사고 후속 조치", rows: ["재실행 요청 권한 · 회수", "감사 로그 원문 · 첨부", "정상 원본 18.4% · 고정", "사고 경위서 · 작성 중"] } },
    { id: "day5IncidentReport", time: "13:10", speaker: "한도윤", dynamic: "postPresentationReport", text: "확인된 사실과 확인되지 않은 추측을 나눠 적었습니다. 복구 과정과 재발 방지 조치도 같은 기록에 연결하겠습니다.", visual: "도윤이 검증 결과에 따라 담당자 지원 범위까지 포함한 사고 보고서를 작성한다.", bgAssetId: office },
    { id: "day5HarinReportCheck", time: "13:12", speaker: "서하린", text: "좋아요. 누가 기능을 만들었는지보다 누가 다시 실행을 요청했고, 이후 무엇을 보고했는지가 분명하게 보이네요.", visual: "하린이 도윤의 보고서에서 역할과 책임이 구분된 부분을 확인한다.", bgAssetId: office, characters: harinSmile, activeCharacter: "harin" },
    { id: "day5AuditClosed", time: "14:30", speaker: "시스템", text: "보안 감사 기록과 정상 원본 복구 기록이 최종 사고 보고서에 첨부되었습니다. 추가 자료 연결 변경은 차단되었습니다.", visual: "별도 배경 없이 감사 종료와 원본 고정 완료 상태를 글자로 표시한다.", system: { title: "후속 조치 완료", rows: ["감사 로그 · 첨부 완료", "원본 연결 · 고정", "자동 갱신 · 중지", "추가 변경 · 차단"] } },
    { id: "day5WaitingForResult", time: "17:40", speaker: "한도윤", text: "할 수 있는 정리는 모두 끝났다. 이제 남은 건 평가 결과뿐이었다.", location: "게임사업실 · 퇴근 전", visual: "해가 기운 사무실에서 도윤이 저장된 사고 보고서와 조용한 메신저 창을 번갈아 바라본다.", bgAssetId: "background.office.evening" },
    { id: "day5HarinBeforeResult", time: "17:42", speaker: "서하린", dynamic: "postPresentationBeforeResult", text: "결과가 어떻게 나오든 오늘 도윤 씨가 한 대응은 없어지지 않아요. 문제를 숨기지 않았고, 끝까지 정상 상태로 돌려놨으니까요.", visual: "하린이 결과를 기다리는 도윤의 책상 옆에 서서 오늘의 대응을 짚어 준다.", bgAssetId: "background.office.evening", characters: harinSmile, activeCharacter: "harin" },
    { id: "day5Result", time: "18:05", speaker: "박태식", dynamic: "evaluationResult", text: "평가 결과가 확정됐다.", location: "게임사업실 · 퇴근", visual: "박태식이 도윤에게 정직원 전환 평가 결과를 전달한다.", bgAssetId: "background.office.evening", characters: boss, notification: "d5-result" },
    { id: "day5BadEnd", ending: "bad", time: "20:10", speaker: "시스템", text: "정직원 전환은 보류됐다. 도윤은 빈 사무실에 홀로 남아 사고 보고서를 다시 펼쳤다.\n\n서하린: 내일 기록부터 다시 확인해요.", location: "게임사업실 · 야근", visual: "도윤이 짐을 든 채 텅 빈 로비를 지나 홀로 회사를 나선다.", bgAssetId: "background.office.night", cgAssetId: "event_cg.day5.lone_departure", cgTitle: "홀로 남은 퇴근길", cinematicDelay: 1600, end: true, bgm: "badEnding" },
    { id: "day5MiddleElevator", ending: "middle", time: "18:20", speaker: "서하린", text: "앞으로도 잘 부탁해요, 한도윤 씨.", location: "엘리베이터 · 퇴근", visual: "퇴근 엘리베이터 안에 나란히 선 도윤과 하린.", bgAssetId: elevator, characters: harinSmile, bgm: "middleEnding" },
    { id: "day5MiddleReply", ending: "middle", time: "18:20", speaker: "한도윤", text: "저도 잘 부탁드립니다, 서하린 선배.", visual: "도윤이 하린을 향해 고개를 돌린다.", bgAssetId: elevator, characters: harinSmile },
    { id: "day5MiddleName", ending: "middle", time: "18:21", speaker: "서하린", text: "이제 계속 선배라고 부를 필요는 없을지도 모르겠네요.", visual: "하린이 조금 편안해진 표정으로 말한다.", bgAssetId: elevator, characters: harinSmile },
    { id: "day5MiddleQuestion", ending: "middle", time: "18:21", speaker: "한도윤", text: "그러면 뭐라고 불러야 합니까?", visual: "엘리베이터 층수가 천천히 내려간다.", bgAssetId: elevator, characters: harinSmile },
    { id: "day5MiddleEnd", ending: "middle", time: "18:22", speaker: "서하린", text: "그건 다음에 생각해 봐요.\n\nMIDDLE ENDING\n사수와 신입으로 시작한 두 사람은 서로 믿고 일할 수 있는 동료가 되었다.", visual: "1층 도착음과 함께 하린이 먼저 엘리베이터 밖으로 걸어 나가 뒤를 돌아본다.", bgAssetId: elevator, cgAssetId: "event_cg.day5.colleague_departure", cgTitle: "함께한 퇴근길", cinematicDelay: 1600, end: true, bgm: "middleEnding" },
    { id: "day5NiceElevator", ending: "nice", time: "18:20", speaker: "서하린", text: "오늘 정말 수고했어요. 도윤 씨가 기록부터 확인해 줘서 끝까지 설명할 수 있었어요.", location: "엘리베이터 · 퇴근", visual: "퇴근 엘리베이터 안에 도윤과 하린 둘만 남아 있다.", bgAssetId: elevator, characters: harinSmile, bgm: "happyEnding" },
    { id: "day5NiceCall", ending: "nice", time: "18:21", speaker: "서하린", text: "도윤 씨.", visual: "하린이 층수 표시를 보다 도윤을 부른다.", bgAssetId: elevator, characters: [{ id: "harin", assetId: "character.harin.relaxed_standing.embarrassed", position: "right" }], camera: "romance" },
    { id: "day5NiceReply", ending: "nice", time: "18:21", speaker: "한도윤", text: "네.", visual: "도윤이 하린 쪽으로 시선을 돌린다.", bgAssetId: elevator, characters: [{ id: "harin", assetId: "character.harin.relaxed_standing.embarrassed", position: "right" }] },
    { id: "day5NicePause", ending: "nice", time: "18:21", speaker: "서하린", text: "이번 주말에…", visual: "하린이 잠시 말을 멈춘다.", bgAssetId: elevator, characters: [{ id: "harin", assetId: "character.harin.relaxed_standing.embarrassed", position: "right" }], camera: "romance" },
    { id: "day5NiceEnd", ending: "nice", time: "18:22", speaker: "서하린", text: "시간 괜찮아요?\n\nNICE ENDING\n발표는 끝났지만, 두 사람의 다음 일정은 이제 시작된다.", visual: "1층 표시와 점등된 버튼 아래에서 하린이 주말 약속을 묻는다. 도윤이 대답하려는 순간 화면이 어두워진다.", bgAssetId: elevator, cgAssetId: "event_cg.day5.weekend_invitation", cgTitle: "서하린의 주말 약속", cinematicDelay: 1600, end: true, bgm: "happyEnding", camera: "romance" },
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

  const api = Object.freeze({ scenes, ROOMS, MESSAGES, validateScenes });
  if (typeof module === "object" && module.exports) module.exports = api;
  global.Day5Story = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
