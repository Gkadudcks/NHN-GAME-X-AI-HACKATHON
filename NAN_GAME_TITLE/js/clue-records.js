(function exposeClueRecords(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ClueRecords = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createClueRecords() {
  "use strict";

  const REQUIRED_FIELDS = Object.freeze(["id", "day", "theme", "title", "detail"]);
  const LEGACY_NON_CLUE_PREFIXES = Object.freeze(["조사 자료:", "PT 방향:"]);

  const RECORDS = Object.freeze([
    {
      id: "d1_boss_first_directive",
      day: 1,
      theme: "업무 지시",
      title: "박태식의 최초 지시",
      detail: "박태식 부장은 AI 기능 자체보다 첫 7일의 유저 경험을 중심으로 구성하고, 예상 수치는 검증된 것만 사용하라고 지시했다.",
      legacy: ["박태식의 최초 지시: 유저 경험 중심·검증된 수치 사용", "부장 메신저: 유저 경험 중심"],
    },
    {
      id: "d1_harin_2024_project_folder",
      day: 1,
      theme: "조사 근거",
      title: "서하린이 담당했던 2024 프로젝트",
      detail: "자료실의 ‘2024_온보딩개선_최종대응’ 폴더 담당자는 서하린으로 표시되어 있었다. 하린은 이번 조사와 무관하다며 폴더를 빠르게 닫으려 했다.",
      legacy: ["서하린이 담당했던 2024 온보딩 개선 프로젝트 폴더"],
    },
    {
      id: "d1_minjae_archive_location",
      day: 1,
      theme: "조사 근거",
      title: "강민재가 알려준 구버전 폴더",
      detail: "강민재는 작년 신규 유저 개선 발표 자료가 구버전 폴더에 있으며, 파일명이 비슷하니 주의해서 확인하라고 알려줬다.",
      legacy: ["강민재가 과거 발표 자료와 구버전 폴더의 위치를 알고 있음"],
    },
    {
      id: "d1_nanabot_manual_polish",
      day: 1,
      theme: "AI 사용 방식",
      title: "나나봇 자동 정리 활성화",
      detail: "핵심 문장과 판단은 직접 유지하고, 나나봇에는 표현을 다듬는 작업만 맡겼다. 원문 수치와 작성자의 판단 근거가 보존되는 방식이다.",
      legacy: ["나나봇 자동 정리 활성화"],
    },
    {
      id: "d1_nanabot_auto_summary",
      day: 1,
      theme: "AI 사용 방식",
      title: "나나봇 자동 요약 활성화",
      detail: "조사 자료 전체를 나나봇이 발표용 문장으로 자동 요약했다. 작업은 빨라졌지만 원문 수치와 근거가 축약될 가능성이 남았다.",
      legacy: ["나나봇 자동 요약 활성화"],
    },
    {
      id: "d1_draft_v01",
      day: 1,
      theme: "원본과 기록",
      title: "DAY 1 원본 초안",
      detail: "문제 정의·조사 근거·개선 방향·검증 방법을 정리한 최초 기준본이다. 이후 변경 사항과 비교할 수 있도록 원본 폴더에 별도로 보관했다.",
      legacy: ["Day 1 원본 초안: 신규유저_이탈개선_PT_v0.1"],
      legacyPrefix: "Day 1 원본 초안:",
    },
    {
      id: "d2_verified_baseline",
      day: 2,
      theme: "검증 기록",
      title: "DAY 2 검증 기준",
      detail: "최근 7일 신규 설치 12,480명, 첫 전투 도달 8,502명, 첫 전투 이전 이탈률 31.9%를 원본 통계 링크와 함께 확인했다.",
      legacy: ["DAY 2 검증 기준 — 최근 7일 신규 설치 12,480명, 첫 전투 도달 8,502명, 첫 전투 이전 이탈률 31.9%."],
      legacyPrefix: "DAY 2 검증 기준",
    },
    {
      id: "d2_minjae_layout_suggestion",
      day: 2,
      theme: "동료의 증언",
      title: "강민재의 슬라이드 구성 제안",
      detail: "강민재는 과거 자료의 수치를 재사용하지 말고 슬라이드 구성만 참고해 보라고 말했다.",
      legacy: ["강민재의 제안 — 과거 자료의 수치가 아니라 슬라이드 구성만 참고해 보라고 말했다."],
      legacyPrefix: "강민재의 제안",
    },
    {
      id: "d2_inactive_automation",
      day: 2,
      theme: "과거 시스템",
      title: "과거 폴더의 비활성 자동화",
      detail: "2024_온보딩개선_최종대응 폴더에 비활성 자동화가 남아 있었다. 화면에는 소유자: 서하린, 마지막 실행: 2024-11-07 23:48로 표시되었다.",
      legacy: ["과거 폴더의 비활성 자동화 — 2024_온보딩개선_최종대응에 비활성 자동화가 남아 있다. 화면에는 소유자: 서하린, 마지막 실행: 2024-11-07 23:48로 표시되었다."],
      legacyPrefix: "과거 폴더의 비활성 자동화",
    },
    {
      id: "d2_cloud_restore_point",
      day: 2,
      theme: "검증 기록",
      title: "DAY 2 검증 완료 기록",
      detail: "사내 클라우드에 검증된 수치와 조사 결과, 근거 링크가 포함된 정상 복원 지점이 생성되었다.",
      legacy: ["DAY 2 검증 완료 기록 — 사내 클라우드에 수치와 조사 결과가 포함된 정상 복원 지점이 생성되었다."],
      legacyPrefix: "DAY 2 검증 완료 기록",
    },
    {
      id: "d3_first_modified_copy",
      day: 3,
      theme: "변경된 문장",
      title: "DAY 3 최초 변경본",
      detail: "DAY 2 검증 완료본과 달리 검증 수치·출처·측정 방법이 사라지고 과장된 표현이 추가되었다.",
    },
    {
      id: "d3_harin_editor_name",
      day: 3,
      theme: "접근 기록",
      title: "서하린 명의 수정 기록",
      detail: "변경 이력에 서하린의 이름이 남아 있지만 직접 실행한 계정과 기기는 아직 확인되지 않았다.",
    },
    {
      id: "d3_nanabot_pattern",
      day: 3,
      theme: "AI 사용 방식",
      title: "나나봇 문장 패턴 일치",
      detail: "변경된 문장의 과장된 표현과 근거 생략 방식이 DAY 1 나나봇 추천 문장과 일치한다.",
    },
    {
      id: "d3_automation_run",
      day: 3,
      theme: "자동화 기록",
      title: "변경 시각의 자동 정리 실행",
      detail: "작업본이 바뀐 시각에 연결된 자동 정리가 실행되었으나 요청 주체는 권한 부족으로 표시되지 않는다.",
    },
    {
      id: "d3_legacy_phrase_match",
      day: 3,
      theme: "과거 시스템",
      title: "구버전 문장과 변경본의 유사성",
      detail: "현재 변경본의 문장 구조가 2024 온보딩 개선 구버전 자료의 표현과 유사하다.",
    },
    {
      id: "d3_direct_access_unconfirmed",
      day: 3,
      theme: "접근 기록",
      title: "직접 접근 여부 미확정",
      detail: "서하린 명의는 남아 있지만 문서 직접 접근 시각과 변경 시각이 맞지 않아 실행자를 단정할 수 없다.",
    },
  ]);

  const catalog = new Map(RECORDS.map((record) => [record.id, record]));
  const legacyAliases = new Map();
  RECORDS.forEach((record) => {
    (record.legacy || []).forEach((text) => legacyAliases.set(text, record.id));
  });

  function cleanRecord(record) {
    return Object.freeze({
      id: record.id,
      day: record.day,
      theme: record.theme,
      title: record.title,
      detail: record.detail,
    });
  }

  function clone(record) {
    return record ? { ...cleanRecord(record) } : null;
  }

  function get(id) {
    return clone(catalog.get(String(id || "")));
  }

  function isRecord(value) {
    return !!value
      && typeof value === "object"
      && !Array.isArray(value)
      && REQUIRED_FIELDS.every((field) => {
        if (field === "day") return Number.isInteger(value.day) && value.day >= 1 && value.day <= 5;
        return typeof value[field] === "string" && value[field].trim().length > 0;
      });
  }

  function inferDay(text, fallback = 1) {
    const match = String(text || "").match(/DAY\s*([1-5])/i);
    if (match) return Number(match[1]);
    const day = Number(fallback);
    return Number.isInteger(day) && day >= 1 && day <= 5 ? day : 1;
  }

  function summarize(text) {
    const value = String(text || "").trim();
    const separator = [" — ", " - ", ": "].find((candidate) => value.includes(candidate));
    const first = separator ? value.split(separator)[0] : value.split(/[.!?]\s/)[0];
    return first.length <= 42 ? first : `${first.slice(0, 39).trim()}…`;
  }

  function stableHash(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function knownFromLegacy(text) {
    const exactId = legacyAliases.get(text);
    if (exactId) return get(exactId);
    const prefixed = RECORDS.find((record) => record.legacyPrefix && text.startsWith(record.legacyPrefix));
    return prefixed ? get(prefixed.id) : null;
  }

  function fromLegacyString(value, options = {}) {
    const text = String(value || "").trim();
    if (!text || LEGACY_NON_CLUE_PREFIXES.some((prefix) => text.startsWith(prefix))) return null;
    const known = knownFromLegacy(text);
    if (known) return known;
    const day = inferDay(text, options.defaultDay);
    return {
      id: `legacy_d${day}_${stableHash(text)}`,
      day,
      theme: "주요 단서",
      title: summarize(text),
      detail: text,
    };
  }

  function normalize(value, options = {}) {
    if (typeof value === "string") return fromLegacyString(value, options);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const canonical = get(value.id);
    if (canonical) return canonical;
    if (isRecord(value)) return {
      id: value.id.trim(),
      day: value.day,
      theme: value.theme.trim(),
      title: value.title.trim(),
      detail: value.detail.trim(),
    };
    if (typeof value.text === "string") {
      const migrated = fromLegacyString(value.text, options);
      if (!migrated) return null;
      if (typeof value.id === "string" && value.id.trim()) migrated.id = value.id.trim();
      return migrated;
    }
    return null;
  }

  function normalizeList(values, options = {}) {
    if (!Array.isArray(values)) return [];
    const byId = new Map();
    values.forEach((value) => {
      const record = normalize(value, options);
      if (record && !byId.has(record.id)) byId.set(record.id, record);
    });
    return [...byId.values()].map((record) => ({ ...record }));
  }

  return Object.freeze({
    REQUIRED_FIELDS,
    get,
    isRecord,
    inferDay,
    normalize,
    normalizeList,
    catalog: Object.freeze(RECORDS.map(cleanRecord)),
  });
});
