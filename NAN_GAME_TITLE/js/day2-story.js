(function initDay2Story(global) {
  "use strict";

  const SUBTASKS = Object.freeze({
    competitor: {
      id: "competitor",
      title: "타회사 신규 유저 경험 비교",
      summary: "경쟁 게임의 첫 전투 진입과 도움말 노출 방식을 비교했다.",
    },
    reviews: {
      id: "reviews",
      title: "실제 유저 리뷰 감정 태깅",
      summary: "불편 리뷰를 피로·불안·보상 지연으로 나누어 원인을 정리했다.",
    },
    journey: {
      id: "journey",
      title: "첫 10분 플레이 흐름 그리기",
      summary: "설치부터 첫 전투까지의 행동과 대기 시간을 직접 기록했다.",
    },
  });

  const clueRecords = global.ClueRecords || (typeof module === "object" && module.exports ? require("./clue-records.js") : null);
  if (!clueRecords) throw new Error("ClueRecords must load before Day2Story");
  const CLUES = Object.freeze({
    verifiedBaseline: clueRecords.get("d2_verified_baseline"),
    minjaeLayout: clueRecords.get("d2_minjae_layout_suggestion"),
    inactiveAutomation: clueRecords.get("d2_inactive_automation"),
    cloudRestorePoint: clueRecords.get("d2_cloud_restore_point"),
  });

  const ROOMS = Object.freeze({
    boss: { type: "DIRECT MESSAGE", title: "박태식 부장", members: ["박"] },
    pt: { type: "PROJECT CHANNEL", title: "# PT 전환과제 TF", members: ["박", "서", "한"] },
    harin: { type: "DIRECT MESSAGE", title: "서하린 사수", members: ["서"] },
    minjae: { type: "DIRECT MESSAGE", title: "강민재 동기", members: ["강"] },
    sea: { type: "DIRECT MESSAGE", title: "윤세아", members: ["윤"] },
  });

  const MESSAGES = Object.freeze([
    {
      id: "day1-boss-brief",
      room: "boss",
      at: "day2IntroCard",
      sender: "박태식 부장",
      text: "AI 기능보다 첫 7일의 유저 경험을 중심으로. 예상 수치는 검증된 것만 사용하세요.",
      time: "DAY 1 · 09:14",
    },
    {
      id: "day1-doyun-reply",
      room: "boss",
      at: "day2IntroCard",
      sender: "한도윤",
      text: "확인했습니다. 요구사항을 기준으로 구성하겠습니다.",
      time: "DAY 1 · 09:16",
    },
    {
      id: "day1-harin-research",
      room: "pt",
      at: "day2IntroCard",
      sender: "서하린 사수",
      text: "자료실에 이탈 데이터와 고객 리뷰를 공유했어요. 확인한 근거는 초안에 같이 남겨주세요.",
      time: "DAY 1 · 09:58",
    },
    {
      id: "day1-nanabot-notice",
      room: "pt",
      at: "day2IntroCard",
      sender: "나나봇",
      text: "PT 작업 문서에 문장 추천 및 자동 정리 기능을 사용할 수 있습니다.",
      time: "DAY 1 · 14:59",
    },
    {
      id: "day1-doyun-draft",
      room: "pt",
      at: "day2IntroCard",
      sender: "한도윤",
      text: "신규유저_초반이탈개선_발표자료_v0.1 공유드립니다. 중간 검토 부탁드립니다.",
      time: "DAY 1 · 16:31",
    },
    {
      id: "day1-harin-review",
      room: "pt",
      at: "day2IntroCard",
      sender: "서하린 사수",
      text: "v0.1 확인했어요. 방향은 괜찮아요. 파일 버전 이름은 계속 유지해 주세요.",
      time: "DAY 1 · 17:18",
    },
    {
      id: "harin-morning",
      room: "harin",
      at: "day2HarinMessage",
      sender: "서하린 사수",
      text: "어제 집 잘 들어갔어요? 출근하면 오전에 숫자부터 같이 검증해요. 어제 만든 초안은 덮어쓰지 말고 그대로 두고요.",
      time: "DAY 2 · 08:47",
    },
    {
      id: "day2-doyun-harin-reply",
      room: "harin",
      at: "day2HarinReplyChoice",
      sender: "한도윤",
      text: "확인했습니다. 출근해서 오전에 같이 보겠습니다.",
      dynamic: "morningReply",
      requiresDecision: "day2MorningReply",
      time: "08:48",
    },
    {
      id: "harin-metrics-link",
      room: "harin",
      at: "day2VerifyPanel",
      sender: "서하린 사수",
      text: "아침에 확인한 통계 원본 링크를 작업 기록에 연결해 주세요.",
      time: "09:09",
    },
    {
      id: "boss-schedule",
      room: "boss",
      at: "day2RequestGame",
      sender: "박태식 부장",
      text: "11시 회의 전까지 오전 조사 정리해. 잡담은 점심시간에 하고.",
      time: "10:34",
    },
    {
      id: "minjae-lunch",
      room: "minjae",
      at: "day2RequestGame",
      sender: "강민재 동기",
      text: "구내식당 줄 너무 긴데 밖에서 먹을래?",
      time: "10:36",
    },
    {
      id: "sea-build",
      room: "sea",
      at: "day2BuildNotice",
      sender: "윤세아",
      text: "오후 빌드 점검 10분 뒤 시작합니다. 튜토리얼 팝업 재현 확인 부탁드려요.",
      time: "14:33",
    },
    {
      id: "pt-restore-point",
      room: "pt",
      at: "day2CloudPanel",
      sender: "서하린 사수",
      text: "DAY 2 검증 완료 복원 지점을 만들어 뒀어요. 통계 원본과 조사 링크도 연결해 뒀어요.",
      time: "16:23",
    },
  ]);

  const scenes = [
    { id: "day2IntroCard", time: "08:46", speaker: "시스템", text: "DAY 2 · TUESDAY\n계약 종료까지 4일", bgAssetId: "background.subway.morning", bgm: "commute", location: "출근길 지하철 · 오전" },
    { id: "day2HarinMessage", time: "08:47", speaker: "시스템", text: "흔들리는 지하철 안에서 서하린이 보낸 개인 메시지를 확인했다.", notification: "harin-morning", messageFocus: "harin" },
    {
      id: "day2HarinReplyChoice",
      time: "08:48",
      speaker: "한도윤",
      text: "출근길에 확인한 메시지에 어떻게 답장할까?",
      choiceKey: "day2MorningReply",
      replySpeaker: "한도윤",
      relationshipChoice: true,
      choices: [
        { value: "warm", text: "출근 전부터 챙겨주셔서 감사합니다. 도착하면 바로 같이 확인해요.", reply: "출근 전부터 챙겨주셔서 감사합니다. 도착하면 바로 같이 확인해요.", delta: { affection: 1 } },
        { value: "reliable", text: "확인했습니다. 원본은 유지하고 오전에 숫자부터 같이 검증하겠습니다.", reply: "확인했습니다. 원본은 유지하고 오전에 숫자부터 같이 검증하겠습니다.", delta: { trust: 1 } },
        { value: "concise", text: "네, 확인했습니다. 출근해서 오전에 같이 보겠습니다.", reply: "네, 확인했습니다. 출근해서 오전에 같이 보겠습니다.", delta: { work: 1 } }
      ]
    },
    { id: "day2IntroThought", time: "08:49", speaker: "한도윤", text: "답장을 보내고 휴대폰 화면을 껐다.\n업무 이야기뿐인데도 어제 편의점에서 나눈 대화가 자연스럽게 떠올랐다." },
    { id: "day2OfficeArrival", time: "08:52", speaker: "한도윤", text: "지하철에서 내려 사무실에 도착했다. 하린과 숫자를 확인하기 전에 자료부터 열어보기로 했다.", bg: "office", bgm: "daily", location: "게임사업실 · 오전" },
    { id: "day2ConvenienceRecall", time: "08:57", speaker: "서하린", dynamic: "introHarin", char: "harin" },
    { id: "day2ConvenienceReply", time: "08:58", speaker: "한도윤", dynamic: "introDoyun", char: "harin" },
    { id: "day2ConvenienceReaction", time: "08:59", speaker: "서하린", dynamic: "introHarinReaction", char: "harin" },
    { id: "day2MorningSmallTalkDoyun", time: "09:00", speaker: "한도윤", text: "오늘 지하철은 유난히 붐비더군요.", char: "harin" },
    { id: "day2MorningSmallTalkHarin", time: "09:01", speaker: "서하린", text: "저도요. 한 정거장 전부터 내릴 준비를 했는데도 겨우 내렸어요.", char: "harin" },
    { id: "day2SmallTalkClose", time: "09:02", speaker: "한도윤", text: "그렇게 스몰토크를 나누다 보니 어느새 자리에 도착해 있었다.", char: "harin" },
    { id: "day2SettleIn", time: "09:03", speaker: "서하린", text: "자, 그럼 이제 슬슬 시작해 볼까요.", char: "harin" },

    { id: "day2VerifyLead", time: "09:05", speaker: "서하린", text: "DAY 1에 잡은 문제를 숫자로 한 번만 확인하고 다음 일로 넘어가죠.", char: "harin" },
    { id: "day2VerifyReply", time: "09:06", speaker: "한도윤", text: "최근 7일 신규 설치자와 첫 전투 도달자를 같은 기준으로 맞췄고, 가장 최근 자료의 7일 차 잔존율도 같이 확인했습니다.", char: "harin" },
    { id: "day2VerifyClose", time: "09:07", speaker: "서하린", text: "좋아요. 계산식과 조회 링크만 남겨요. 슬라이드 문장은 오후에 정리하고요.", char: "harin" },
    {
      id: "day2VerifyPanel",
      time: "09:09",
      speaker: "시스템",
      text: "검증 기준이 사내 클라우드 작업 기록에 저장되었습니다.",
      systemPanel: {
        title: "DAY 2 · VERIFIED METRICS",
        rows: [
          "최근 7일 신규 설치 · 12,480명",
          "첫 전투 도달 · 8,502명",
          "첫 전투 이전 이탈 · 31.9%",
          "7일 차 잔존율 · 18.4%",
          "계산식 · (신규 설치 − 첫 전투 도달) ÷ 신규 설치",
          "조회 링크 · 사내 클라우드 작업 기록",
        ],
      },
      clue: CLUES.verifiedBaseline,
      notification: "harin-metrics-link",
    },

    { id: "day2SubtaskLead", time: "09:25", speaker: "서하린", text: "숫자만 보고 있으면 발표가 또 보고서가 돼요. 오전에는 작은 조사 하나를 끝내봐요.", char: "harin" },
    { id: "day2SubtaskQuestion", time: "09:26", speaker: "한도윤", text: "어떤 조사가 필요합니까?", char: "harin" },
    {
      id: "day2SubtaskChoice",
      time: "09:27",
      speaker: "서하린",
      text: "같은 문제를 다른 각도에서 보는 일이요. 셋 중 하나를 골라요.",
      char: "harin",
      choiceKey: "day2Subtask",
      choices: [
        { value: "competitor", text: "타회사 신규 유저 경험을 비교한다.", delta: { work: 1 }, reply: "따라 할 기능보다 왜 덜 지루했는지를 찾아요. 회사 이름은 발표에서 직접 비교하지 말고요." },
        { value: "reviews", text: "실제 유저 리뷰를 감정별로 태깅한다.", delta: { work: 1, trust: 1 }, reply: "숫자 뒤에 사람이 있다는 걸 보여주기엔 이쪽이 좋아요. 한 줄을 대표 의견처럼 과장하지는 말고요." },
        { value: "journey", text: "첫 10분 플레이 흐름을 직접 그린다.", delta: { work: 2 }, reply: "직접 해보면 문서에서 안 보이던 대기 시간이 보여요. 도윤 씨가 플레이하고 제가 시간을 잴게요." },
      ],
    },
    { id: "day2SubtaskSelected", time: "09:29", speaker: "한도윤", dynamic: "subtaskSelected", char: "harin" },

    { id: "day2RequestLead", time: "10:35", speaker: "서하린", text: "오전 조사 방향은 괜찮아요. 점심 전까지 정리하고 잠깐 쉬어요.", char: "harin" },
    { id: "day2RequestBoss", time: "10:36", speaker: "박태식", text: "둘이 오전 조사 마무리하고 있어. 잡담은 점심시간에 하고.", char: "boss" },
    { id: "day2RequestHarin", time: "10:37", speaker: "서하린", text: "부장님이 바로 앞에 있으니까 업무 얘기만 해요. 다른 말은 나중에.", char: "harin" },
    { id: "day2RequestGame", time: "10:38", speaker: "시스템", text: "박태식 부장의 시선을 피해 서하린의 개인 메시지에 짧게 답장합니다.", startSecretChat: true, bgm: "minigame" },
    { id: "day2RequestResult", time: "11:20", speaker: "서하린", dynamic: "secretChatResult", char: "harin", bgm: "daily" },
    { id: "day2RequestResultReply", time: "11:21", speaker: "한도윤", dynamic: "secretChatReply", char: "harin" },
    { id: "day2BossTease", time: "11:22", speaker: "박태식", text: "너네 둘이 뭐야, 회사에서 연애라도 해?", char: "boss", when: { decision: "secretChatOutcome", equals: "caught" } },
    { id: "day2BossTeaseHarinReact", time: "11:23", speaker: "서하린", text: "아, 아니에요! 그냥 업무 메시지 확인한 거예요.", characters: [{ id: "harin", assetId: "character.harin.relaxed_standing.embarrassed", position: "right" }], activeCharacter: "harin", when: { decision: "secretChatOutcome", equals: "caught" } },

    { id: "day2LunchChoice", time: "12:18", speaker: "한도윤", text: "긴 줄 끝에 메뉴판이 보였다. 오전 내내 밀려든 요청은 잠시 잊고, 지금 먹고 싶은 걸 고르자.", bg: "restaurant_lunch", char: "minjae", location: "회사 밖 식당 · 점심", choiceKey: "day2LunchMenu", choices: [
      { value: "spicyPork", text: "매콤한 제육볶음을 주문한다.", delta: {}, reply: "매운 걸 먹으면 오전 스트레스도 좀 풀리겠지. 민재가 같은 메뉴 두 개를 주문했다." },
      { value: "porkCutlet", text: "두툼한 왕돈가스를 주문한다.", delta: {}, reply: "접시 크기를 본 민재가 이 정도면 기다린 보람은 있겠다며 웃었다." },
      { value: "noodles", text: "시원한 냉면을 주문한다.", delta: {}, reply: "차가운 물을 한 모금 마시자 오전 내내 달아올랐던 머리가 조금 식었다." },
    ] },
    { id: "day2Lunch1", time: "12:20", speaker: "강민재", text: "그래도 음식 나오니까 기다린 보람은 있네. 오전 내내 부장님 눈치 보던 것도 이제 좀 잊어.", bg: "restaurant_lunch", char: "minjae", location: "회사 밖 식당 · 점심" },
    { id: "day2Lunch2", time: "12:21", speaker: "한도윤", text: "줄 서 있는 동안에는 다른 데 가자고 했잖아.", char: "minjae", placeholder: "inherit" },
    { id: "day2Lunch3", time: "12:22", speaker: "강민재", text: "그때는 배고팠으니까. 그래도 회사 사람들 생각이 이렇게 잘 맞는지 몰랐다.", char: "minjae", placeholder: "inherit" },
    { id: "day2Lunch4", time: "12:23", speaker: "한도윤", text: "오전에는 메신저 한 번 보내기도 어렵더니 점심 메뉴는 동시에 정하네.", char: "minjae", placeholder: "inherit" },
    { id: "day2Lunch5", time: "12:24", speaker: "강민재", text: "그게 회사야. 중요한 결정은 늦고 메뉴 결정만 빨라.", char: "minjae", placeholder: "inherit" },
    { id: "day2LunchBranch1", time: "12:26", speaker: "강민재", dynamic: "lunchBranchMinjae", char: "minjae", placeholder: "inherit" },
    { id: "day2LunchBranch2", time: "12:27", speaker: "한도윤", dynamic: "lunchBranchDoyun", char: "minjae", placeholder: "inherit" },
    { id: "day2LunchWhy", time: "12:30", speaker: "한도윤", text: "넌 왜 게임 회사에 들어왔어?", char: "minjae", placeholder: "inherit" },
    { id: "day2LunchGuild", time: "12:31", speaker: "강민재", text: "예전에 길드 운영을 오래 했거든. 사람 스무 명 일정 맞추고 싸움 말리는 게 재밌었어.", char: "minjae", placeholder: "inherit" },
    { id: "day2LunchHr", time: "12:32", speaker: "한도윤", text: "그건 게임보다 인사 관리에 가까운 것 같은데.", char: "minjae", placeholder: "inherit" },
    { id: "day2LunchCompany", time: "12:33", speaker: "강민재", text: "그러니까 내가 회사 생활을 잘하나 봐. …전환 심사만 빼고.", char: "minjae", placeholder: "inherit" },
    { id: "day2LunchAnxiety", time: "12:34", speaker: "강민재", text: "사실 나도 꽤 긴장돼. 너랑 경쟁하는 척하면 덜 티 날 줄 알았는데.", char: "minjae", placeholder: "inherit" },
    { id: "day2LunchArchive", time: "12:36", speaker: "강민재", text: "아, 지난번 구버전 자료는 수치 말고 슬라이드 틀만 참고해봐. 옛날 자료치고 보기 괜찮더라.", char: "minjae", placeholder: "inherit", clue: CLUES.minjaeLayout },
    { id: "day2LunchReply", time: "12:37", speaker: "한도윤", text: "확인은 해볼게.", char: "minjae", placeholder: "inherit" },

    { id: "day2SubtaskA1", time: "13:35", speaker: "한도윤", text: "세 게임을 같은 조건으로 비교하자 차이가 보였다. 가장 짧은 튜토리얼보다 필요한 순간에 설명을 꺼낼 수 있는 게임의 흐름이 자연스러웠다.", bg: "office", location: "게임사업실 · 오후", when: { decision: "day2Subtask", equals: "competitor" } },
    { id: "day2SubtaskA2", time: "13:42", speaker: "서하린", text: "길이만 줄이는 게 답은 아니라는 뜻이네요. 선택권이 있는지가 더 중요할 수도 있고요.", char: "harin", when: { decision: "day2Subtask", equals: "competitor" } },
    { id: "day2SubtaskA3", time: "13:48", speaker: "한도윤", text: "발표에는 회사 이름 대신 공통 패턴으로 정리하겠습니다.", char: "harin", when: { decision: "day2Subtask", equals: "competitor" } },
    { id: "day2SubtaskB1", time: "13:35", speaker: "한도윤", text: "‘길다’는 리뷰와 ‘모르겠다’는 리뷰가 비슷해 보여도 원인은 달랐다.", bg: "office", location: "게임사업실 · 오후", when: { decision: "day2Subtask", equals: "reviews" } },
    { id: "day2SubtaskB2", time: "13:42", speaker: "서하린", text: "맞아요. 하나는 피로고 하나는 불안이에요. 같은 해결책을 쓰면 한쪽은 더 불편해질 수 있어요.", char: "harin", when: { decision: "day2Subtask", equals: "reviews" } },
    { id: "day2SubtaskB3", time: "13:48", speaker: "한도윤", text: "숫자만 봤을 때보다 문제 정의가 선명해졌습니다.", char: "harin", when: { decision: "day2Subtask", equals: "reviews" } },
    { id: "day2SubtaskC1", time: "13:35", speaker: "서하린", text: "설치 끝났어요. 시작할게요.", bg: "office", location: "게임사업실 · 오후", char: "harin", when: { decision: "day2Subtask", equals: "journey" } },
    { id: "day2SubtaskC2", time: "13:38", speaker: "한도윤", text: "로그인 보상, 출석 보상, 패키지 알림… 아직 캐릭터도 못 움직였습니다.", char: "harin", when: { decision: "day2Subtask", equals: "journey" } },
    { id: "day2SubtaskC3", time: "13:40", speaker: "서하린", text: "1분 42초. 민재 말이 아주 과장은 아니었네요.", char: "harin", when: { decision: "day2Subtask", equals: "journey" } },
    { id: "day2SubtaskC4", time: "13:41", speaker: "한도윤", text: "그 말을 본인에게 알려줄 필요는 없습니다.", char: "harin", when: { decision: "day2Subtask", equals: "journey" } },

    { id: "day2ArchiveSearch", time: "14:32", speaker: "한도윤", text: "조사 결과를 정리할 공용 슬라이드 틀을 검색했다.", bg: "office", bgm: "mystery", skip: true },
    { id: "day2ArchivePanel", time: "14:32", speaker: "한도윤", text: "조사 결과를 정리할 공용 슬라이드 틀을 검색하자, 낯익은 과거 폴더 하나가 함께 나타났다.", bg: "office", bgm: "mystery", systemPanel: { title: "연결된 이전 자료", rows: ["폴더 · 2024_신규유저개선_이전자료", "자동 연결 기능 · 1개", "현재 상태 · 꺼짐"] }, skip: true },
    { id: "day2ArchiveRecognition", time: "14:33", speaker: "한도윤", text: "공용 슬라이드 틀을 찾다가, 어제 봤던 과거 폴더를 발견했다.", bg: "office", bgm: "mystery", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned", position: "center", framing: "waist_up" }], activeCharacter: "harin", motion: "surprised", effect: "discovery" },
    { id: "day2ArchiveDetails", time: "14:33", speaker: "시스템", text: "자동 연결 기능의 등록 담당자는 서하린, 마지막 실행 시각은 2024-11-07 23:48로 기록되어 있다.", emphasis: "2024-11-07 23:48", systemPanel: { title: "자동 연결 기능 정보", rows: ["기능명 · 신규유저개선_발표자료_자동연결", "현재 상태 · 꺼짐", "등록 담당자 · 서하린", "마지막 실행 · 2024-11-07 23:48"] }, clue: CLUES.inactiveAutomation },
    { id: "day2ArchiveHarin1", time: "14:34", speaker: "서하린", text: "그건 예전에 쓰던 연결이에요. 지금은 꺼져 있어요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", motion: "nervous", camera: "focus" },
    { id: "day2ArchiveDoyun", time: "14:34", speaker: "한도윤", text: "선배 이름이 남아 있네요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin" },
    { id: "day2ArchiveHarin2", time: "14:35", speaker: "서하린", text: "제가 만들었으니까요. 지금 필요한 틀은 그 아래 ‘공용 발표 기본형’이에요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin" },
    { id: "day2BuildNotice", time: "14:35", speaker: "시스템", text: "윤세아에게 새 메시지가 도착했습니다.\n“오후 빌드 점검 10분 뒤 시작합니다.”", notification: "sea-build" },
    { id: "day2ArchiveExit", time: "14:36", speaker: "서하린", text: "빌드부터 보고 와요. 이건 나중에 확인해도 돼요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", bgm: "daily" },

    { id: "day2BuildSea", time: "14:45", speaker: "윤세아", text: "새 빌드에서 튜토리얼 팝업이 두 번 뜬다는 제보가 있어요. 재현되는지만 확인 부탁드려요.", bg: "qa_test_space_incident", char: "sea", location: "QA 테스트 공간 · 오후" },
    { id: "day2BuildDoyun", time: "14:48", speaker: "한도윤", text: "첫 전투 전에 같은 안내가 두 번 나옵니다.", char: "sea", placeholder: "inherit" },
    { id: "day2BuildHarin", time: "14:49", speaker: "서하린", text: "오늘 조사 주제와 묘하게 겹치네요.", characters: [{ id: "sea", position: "left" }, { id: "harin", position: "right" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2BuildSeaJoke", time: "14:50", speaker: "윤세아", text: "좋은 우연이네요. 기획팀에는 나쁜 우연이지만.", characters: [{ id: "sea", position: "left" }, { id: "harin", position: "right" }], activeCharacter: "sea", placeholder: "inherit" },
    { id: "day2Nana1", time: "14:54", speaker: "나나봇", dynamic: "nanaLead", characters: [{ id: "nanabot", position: "left" }, { id: "harin", position: "right" }], activeCharacter: "nanabot", placeholder: "inherit" },
    { id: "day2Nana2", time: "14:55", speaker: "한도윤", dynamic: "nanaDoyun", characters: [{ id: "nanabot", position: "left" }, { id: "harin", position: "right" }], activeCharacter: "nanabot", placeholder: "inherit" },
    { id: "day2Nana3", time: "14:56", speaker: "서하린", dynamic: "nanaHarin", characters: [{ id: "nanabot", position: "left" }, { id: "harin", position: "right" }], activeCharacter: "harin", placeholder: "inherit" },

    { id: "day2WrapDoyun", time: "16:20", speaker: "한도윤", text: "오전에 고른 조사 결과와 빌드 점검 메모를 팀 위키에 올렸다.", bg: "office", location: "게임사업실 · 오후" },
    { id: "day2WrapHarin1", time: "16:21", speaker: "서하린", text: "발표 초안에는 결론 한 줄만 넣고, 상세 자료는 근거 링크로 연결해요.", char: "harin" },
    { id: "day2WrapDoyun2", time: "16:22", speaker: "한도윤", text: "오늘 확인한 수치도 같은 방식으로 연결했습니다.", char: "harin" },
    { id: "day2WrapHarin2", time: "16:23", speaker: "서하린", text: "좋아요. 사내 클라우드에 ‘DAY 2 검증 완료’ 복원 지점을 남길게요.", char: "harin" },
    { id: "day2CloudPanel", time: "16:24", speaker: "시스템", text: "확인이 끝난 작업 상태가 사내 클라우드에 기록되었습니다.", systemPanel: { title: "DAY 2 확인 완료 보관본", rows: ["DAY 1 초안 원본 · 잠금 유지", "DAY 2 수정 기록 · 저장 완료", "통계 원본·조사 링크 · 연결 완료", "되돌리기용 보관본 · 생성 완료", "보안 기록 · 켜짐"] }, clue: CLUES.cloudRestorePoint, notification: "pt-restore-point" },

    { id: "day2OvertimeLead", time: "19:25", speaker: "한도윤", text: "오후 빌드 점검 결과까지 전달하고 나니 사무실에 남은 사람은 거의 없었다.", bg: "office_night", bgm: "overtime", location: "게임사업실 · 야간" },
    { id: "day2OvertimeHarin1", time: "19:26", speaker: "서하린", text: "오늘 하위 조사 문장만 정리하면 끝나요. 한 시간 안에 끝내고 가요.", char: "harin", placeholder: "inherit" },
    { id: "day2OvertimeDoyun", time: "19:27", speaker: "한도윤", text: "선배는 먼저 가셔도 됩니다.", char: "harin", placeholder: "inherit" },
    { id: "day2OvertimeHarin2", time: "19:28", speaker: "서하린", text: "오전부터 그렇게 많은 요청을 같이 쳐냈는데 마지막 한 시간만 혼자 하겠다고요?", char: "harin", placeholder: "inherit" },
    { id: "day2OvertimeDoyun2", time: "19:29", speaker: "한도윤", text: "말하고 보니 이상하긴 합니다.", char: "harin", placeholder: "inherit" },
    { id: "day2CoffeeHarin", time: "19:40", speaker: "서하린", text: "자판기 다녀왔어요. 이건 도윤 씨 것.", characters: [{ id: "harin", assetId: "character.harin.holding_cup.tired" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2CoffeeDoyun", time: "19:41", speaker: "한도윤", text: "선배 건 설탕 없는 라테죠?", characters: [{ id: "harin", assetId: "character.harin.holding_cup.tired" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2CoffeeBranch1", time: "19:42", speaker: "서하린", dynamic: "coffeeHarin", characters: [{ id: "harin", assetId: "character.harin.holding_cup.tired" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2CoffeeBranch2", time: "19:43", speaker: "한도윤", dynamic: "coffeeDoyun", characters: [{ id: "harin", assetId: "character.harin.holding_cup.tired" }], activeCharacter: "harin", placeholder: "inherit" },

    { id: "day2Past1", time: "19:48", speaker: "서하린", text: "예전에도 이렇게 늦게까지 자료를 정리한 적이 있어요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2Past2", time: "19:49", speaker: "한도윤", text: "아까 잠깐 보였던 폴더와 관련 있습니까?", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2Past3", time: "19:50", speaker: "서하린", text: "네. 그때는 제가 전부 해결해야 한다고 생각했어요. 결과는 좋지 않았고요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", placeholder: "inherit", motion: "sad", camera: "tension" },
    { id: "day2Past4", time: "19:51", speaker: "한도윤", text: "그래서 혼자 하려는 사람을 보면 그냥 지나치지 못하는 겁니까?", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2Past5", time: "19:52", speaker: "서하린", text: "…비슷해 보이면요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2Past6", time: "19:53", speaker: "한도윤", text: "더 묻지는 않겠습니다.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", placeholder: "inherit" },
    { id: "day2Past7", time: "19:54", speaker: "서하린", text: "고마워요. 아직은 그게 더 편해요.", characters: [{ id: "harin", assetId: "character.harin.arms_folded.concerned" }], activeCharacter: "harin", placeholder: "inherit", motion: "happy", camera: "focus" },
    {
      id: "day2OvertimeChoice",
      time: "19:55",
      speaker: "한도윤",
      text: "하린에게 뭐라고 답할까?",
      placeholder: "inherit",
      replySpeaker: "서하린",
      choiceKey: "day2OvertimeResponse",
      relationshipChoice: true,
      choices: [
        { value: "finish-together", text: "오늘 남은 일은 같이 끝내죠.", minAffection: 2, delta: { affection: 1, trust: 2 }, reply: "그 말이면 충분해요. 이번에는 진짜로 같이 끝내요." },
        { value: "wait-until-ready", text: "말하고 싶을 때 이야기해 주세요.", minAffection: 4, delta: { affection: 2, trust: 1 }, reply: "재촉하지 않는 사람한테는 오히려 먼저 말하게 되더라고요." },
        { value: "verify-record", text: "이름이 남은 기록은 사실관계부터 확인하겠습니다.", delta: { work: 1 }, reply: "맞아요. 이름만 보고 결론 내리지 않고 차근차근 확인하면 돼요." },
        { value: "take-responsibility", text: "우선 제 몫은 제가 마무리해보겠습니다.", delta: { work: 1, affection: -1, trust: -1 }, reply: "제 몫을 다하는 것과 혼자 남는 건 달라요. 오늘은 같이 가요." },
      ],
    },

    { id: "day2Summary", time: "20:35", speaker: "시스템", text: "오늘의 업무를 정산합니다.", placeholder: "inherit", daySummary: 2 },
    { id: "day2ExitLead", time: "20:44", speaker: "한도윤", text: "‘DAY 2 검증 완료’ 표시까지 확인했다. 선배가 노트북을 닫는 모습을 보고서야 오늘 일이 끝났다는 실감이 났다.", placeholder: "inherit" },
    { id: "day2ExitHarin", time: "20:45", speaker: "서하린", text: "내일은 오늘 정리한 문장을 발표용으로 다듬어요.", char: "harin", placeholder: "inherit" },
    { id: "day2ExitDoyun", time: "20:46", speaker: "한도윤", text: "나나봇을 쓰더라도 원문과 비교하면서요.", char: "harin", placeholder: "inherit" },
    { id: "day2ExitHarin2", time: "20:47", speaker: "서하린", text: "이제 제가 할 말을 먼저 하네요.", char: "harin", placeholder: "inherit" },
    { id: "day2ExitDoyun2", time: "20:48", speaker: "한도윤", text: "선배가 여러 번 말했으니까요.", char: "harin", placeholder: "inherit" },
    { id: "day2ExitHarin3", time: "20:49", speaker: "서하린", text: "여러 번 말하게 만든 사람이 할 말은 아닌데.", char: "harin", placeholder: "inherit" },
    { id: "day2End", time: "20:50", speaker: "시스템", text: "DAY 2 완료\n검증 수치와 하위 조사 결과가 사내 클라우드에 기록되었습니다.\n과거 폴더에서 비활성 자동화 기록을 발견했습니다.\n현재 발표 자료에는 아직 이상 현상이 없습니다.", placeholder: "inherit", end: true },
  ];

  function isVisible(scene, decisions = {}) {
    if (scene.skip) return false;
    if (!scene.when) return true;
    return decisions[scene.when.decision] === scene.when.equals;
  }

  function validateScenes(items = scenes) {
    const ids = new Set();
    const errors = [];
    items.forEach((scene, index) => {
      if (!scene.id) errors.push(`Scene ${index} has no id`);
      if (ids.has(scene.id)) errors.push(`Duplicate scene id: ${scene.id}`);
      ids.add(scene.id);
      if (!scene.time || !scene.speaker) errors.push(`Scene ${scene.id || index} is missing time or speaker`);
      if (!scene.text && !scene.dynamic) errors.push(`Scene ${scene.id || index} is missing text`);
    });
    return errors;
  }

  const api = Object.freeze({ scenes, SUBTASKS, CLUES, ROOMS, MESSAGES, isVisible, validateScenes });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Day2Story = api;
})(typeof window !== "undefined" ? window : globalThis);
