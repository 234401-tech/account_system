// 디자인 토큰 — 공공기관 행정시스템 톤 (그레이 뉴트럴 + 블루 포인트)
export const C = {
  bg: "#F2F3F5", panel: "#FFFFFF",
  line: "#D5D9DE", lineSoft: "#E8EAED", thead: "#EEF0F3",
  text: "#1E2630", sub: "#69707A", faint: "#98A0A8",
  blue: "#2B5C8A", blueDk: "#1F4467", blueLt: "#EAF1F7",
  navy: "#1B2733", navySoft: "#2A3845",
  green: "#2E7D5B", greenLt: "#E7F2EC",
  amber: "#B07D14", amberLt: "#FAF0D6",
  red: "#C0392B", redLt: "#FAE9E7",
  gray: "#6B727C", grayLt: "#ECEEF0", teal: "#2E7C86", tealLt: "#E4F1F2",
};

// 비목 분류
export const BIMOK = [
  { key: "인건비", group: "직접비" }, { key: "연구시설·장비비", group: "직접비" },
  { key: "연구재료비", group: "직접비" }, { key: "연구활동비", group: "직접비" },
  { key: "연구과제추진비", group: "직접비" }, { key: "연구수당", group: "직접비" },
  { key: "위탁연구개발비", group: "위탁" }, { key: "간접비", group: "간접비" },
];

// 정산 단계 색상
export const STATUS = {
  초기등록: C.teal, 집행중: C.gray, 집행마감: C.blue,
  검토중: C.amber, 보완요청: C.red, 정산확정: C.green, 환수발생: C.red,
};
export const AMEND_STATUS = { 검토중: C.amber, 승인: C.green, 반려: C.red };
export const SEV = { high: C.red, mid: C.amber, low: C.gray };
export const SEV_T = { high: "위험", mid: "주의", low: "확인" };

// ICT 기금규정 비목 순서
export const BIMOK_ORDER = ["인건비", "운영비", "여비", "업무추진비", "연구개발비", "유형자산", "민간위탁비", "간접비"];

// 세목(gwamok) → 비목 매핑
export const SEMOK_TO_BIMOK = {
  인건비: "인건비",
  소모품비: "운영비", 도서인쇄비: "운영비", 광고선전비: "운영비", 전문가활용비: "운영비",
  교육훈련비: "운영비", 위탁정산비: "운영비", 공과금: "운영비", 임차료: "운영비", 위탁용역비: "운영비",
  국내여비: "여비", 국외여비: "여비", 여비교통비: "여비",
  사업추진비: "업무추진비",
  자산취득비: "유형자산",
  기업지원: "민간위탁비",
  간접비: "간접비",
};

export const PERIOD = "2026-02-01 ~ 2026-11-30";
export const REWON = ["국비", "지방비", "민간"];
