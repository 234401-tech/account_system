// 목업 시드 데이터 — 백엔드 연동 시 mock 어댑터에서만 사용
import { PERIOD } from "../lib/theme.js";

// 모든 금액은 원 단위
export const SEED_COMPANIES = [
  { id: "C-2026-001", name: "뉴로메카", task: "포항 로봇·AI 실증 고도화", pm: "김선모", period: PERIOD, status: "집행중", consortium: "POSTECH",
    budget: { 인건비: 142000000, "연구시설·장비비": 86000000, 연구재료비: 38000000, 연구활동비: 24000000, 연구과제추진비: 12000000, 연구수당: 18000000, 위탁연구개발비: 40000000, 간접비: 30000000 },
    exec: { 인건비: 118000000, "연구시설·장비비": 84000000, 연구재료비: 33000000, 연구활동비: 19500000, 연구과제추진비: 9800000, 연구수당: 16000000, 위탁연구개발비: 22000000, 간접비: 21000000 },
    researchers: [
      { id: "R1", name: "김선모", role: "연구책임자", position: "책임연구원", rate: 30, period: PERIOD, salary: true },
      { id: "R2", name: "오세훈", role: "참여연구원", position: "선임연구원", rate: 60, period: PERIOD, salary: true },
      { id: "R3", name: "장유진", role: "참여연구원", position: "연구원", rate: 50, period: PERIOD, salary: true },
    ] },
  { id: "C-2026-002", name: "에이아이파크", task: "초거대 AI 클라우드 팜 데이터 파이프라인", pm: "이정안", period: PERIOD, status: "보완요청", consortium: "금오공대",
    budget: { 인건비: 96000000, "연구시설·장비비": 120000000, 연구재료비: 22000000, 연구활동비: 18000000, 연구과제추진비: 9000000, 연구수당: 14000000, 위탁연구개발비: 0, 간접비: 24000000 },
    exec: { 인건비: 91000000, "연구시설·장비비": 131000000, 연구재료비: 20000000, 연구활동비: 12000000, 연구과제추진비: 9400000, 연구수당: 13000000, 위탁연구개발비: 0, 간접비: 18000000 },
    researchers: [
      { id: "R1", name: "이정안", role: "연구책임자", position: "책임연구원", rate: 30, period: PERIOD, salary: true },
      { id: "R2", name: "김도현", role: "참여연구원", position: "선임연구원", rate: 50, period: PERIOD, salary: true },
      { id: "R3", name: "박서윤", role: "참여연구원", position: "연구원", rate: 60, period: PERIOD, salary: true },
      { id: "R4", name: "최민수", role: "참여연구원", position: "연구원", rate: 40, period: PERIOD, salary: false },
    ] },
  { id: "C-2026-003", name: "비전테크놀로지", task: "멀티모달 문화유산 케어 AI", pm: "박수현", period: PERIOD, status: "정산확정", consortium: "영남대",
    budget: { 인건비: 80000000, "연구시설·장비비": 40000000, 연구재료비: 15000000, 연구활동비: 14000000, 연구과제추진비: 7000000, 연구수당: 10000000, 위탁연구개발비: 20000000, 간접비: 18000000 },
    exec: { 인건비: 78500000, "연구시설·장비비": 39000000, 연구재료비: 14200000, 연구활동비: 13600000, 연구과제추진비: 6800000, 연구수당: 9800000, 위탁연구개발비: 19500000, 간접비: 17400000 },
    researchers: [
      { id: "R1", name: "박수현", role: "연구책임자", position: "책임연구원", rate: 30, period: PERIOD, salary: true },
      { id: "R2", name: "한결", role: "참여연구원", position: "선임연구원", rate: 50, period: PERIOD, salary: true },
      { id: "R3", name: "윤아", role: "참여연구원", position: "연구원", rate: 40, period: PERIOD, salary: true },
    ] },
  { id: "C-2026-004", name: "코어엣지", task: "엣지 디바이스용 경량 AI 모델", pm: "정하늘", period: PERIOD, status: "환수발생", consortium: "대구대",
    budget: { 인건비: 110000000, "연구시설·장비비": 60000000, 연구재료비: 28000000, 연구활동비: 20000000, 연구과제추진비: 10000000, 연구수당: 15000000, 위탁연구개발비: 30000000, 간접비: 26000000 },
    exec: { 인건비: 64000000, "연구시설·장비비": 58000000, 연구재료비: 27500000, 연구활동비: 11000000, 연구과제추진비: 5200000, 연구수당: 7000000, 위탁연구개발비: 31000000, 간접비: 12000000 },
    researchers: [
      { id: "R1", name: "정하늘", role: "연구책임자", position: "책임연구원", rate: 30, period: PERIOD, salary: true },
      { id: "R2", name: "강태오", role: "참여연구원", position: "선임연구원", rate: 70, period: PERIOD, salary: true },
      { id: "R3", name: "노지선", role: "참여연구원", position: "연구원", rate: 50, period: PERIOD, salary: true },
    ] },
  { id: "C-2026-005", name: "데이터브릿지", task: "지역 산업데이터 거래 플랫폼", pm: "최영진", period: PERIOD, status: "집행마감", consortium: "POSTECH",
    budget: { 인건비: 72000000, "연구시설·장비비": 30000000, 연구재료비: 12000000, 연구활동비: 11000000, 연구과제추진비: 6000000, 연구수당: 9000000, 위탁연구개발비: 10000000, 간접비: 14000000 },
    exec: { 인건비: 70000000, "연구시설·장비비": 29000000, 연구재료비: 11800000, 연구활동비: 10200000, 연구과제추진비: 5600000, 연구수당: 8600000, 위탁연구개발비: 9000000, 간접비: 13200000 },
    researchers: [
      { id: "R1", name: "최영진", role: "연구책임자", position: "책임연구원", rate: 40, period: PERIOD, salary: true },
      { id: "R2", name: "임도윤", role: "참여연구원", position: "선임연구원", rate: 60, period: PERIOD, salary: true },
    ] },
  { id: "C-2026-006", name: "스마트팩토리랩", task: "제조 AI 비전검사 솔루션", pm: "한지민", period: PERIOD, status: "검토중", consortium: "금오공대",
    budget: { 인건비: 88000000, "연구시설·장비비": 52000000, 연구재료비: 19000000, 연구활동비: 16000000, 연구과제추진비: 8000000, 연구수당: 12000000, 위탁연구개발비: 18000000, 간접비: 20000000 },
    exec: { 인건비: 80000000, "연구시설·장비비": 50000000, 연구재료비: 18200000, 연구활동비: 14400000, 연구과제추진비: 7100000, 연구수당: 10800000, 위탁연구개발비: 14000000, 간접비: 16400000 },
    researchers: [
      { id: "R1", name: "한지민", role: "연구책임자", position: "책임연구원", rate: 30, period: PERIOD, salary: true },
      { id: "R2", name: "서준호", role: "참여연구원", position: "선임연구원", rate: 60, period: PERIOD, salary: true },
      { id: "R3", name: "배수지", role: "참여연구원", position: "연구원", rate: 50, period: PERIOD, salary: true },
    ] },
  { id: "C-2026-007", name: "그린에이아이", task: "산업단지 에너지 최적화 AI 플랫폼", pm: "윤재호", period: "2026-06-01 ~ 2027-05-31", status: "초기등록", consortium: "영남대",
    budget: { 인건비: 90000000, "연구시설·장비비": 45000000, 연구재료비: 16000000, 연구활동비: 14000000, 연구과제추진비: 8000000, 연구수당: 11000000, 위탁연구개발비: 16000000, 간접비: 20000000 },
    exec: { 인건비: 0, "연구시설·장비비": 0, 연구재료비: 0, 연구활동비: 0, 연구과제추진비: 0, 연구수당: 0, 위탁연구개발비: 0, 간접비: 0 },
    researchers: [] },
];

// 협약변경 시드 (검토중 2건) — 원 단위
export const SEED_AMEND = [
  {
    id: "AM-2026-001", companyId: "C-2026-002", company: "에이아이파크", type: "사업비 변경",
    reason: "GPU 서버 추가 도입에 따른 연구시설·장비비 증액 (타 비목 감액 조정, 총액 동일)",
    submittedAt: "2026-05-22", status: "검토중", reviewComment: "",
    before: { 인건비: 96000000, "연구시설·장비비": 120000000, 연구재료비: 22000000, 연구활동비: 18000000, 연구과제추진비: 9000000, 연구수당: 14000000, 위탁연구개발비: 0, 간접비: 24000000 },
    after: { 인건비: 93000000, "연구시설·장비비": 134000000, 연구재료비: 22000000, 연구활동비: 12000000, 연구과제추진비: 10000000, 연구수당: 14000000, 위탁연구개발비: 0, 간접비: 18000000 },
  },
  {
    id: "AM-2026-002", companyId: "C-2026-006", company: "스마트팩토리랩", type: "연구기간 변경",
    reason: "현장 실증 일정 지연으로 연구기간 1개월 연장 신청",
    submittedAt: "2026-05-18", status: "검토중", reviewComment: "",
    periodBefore: PERIOD, periodAfter: "2026-02-01 ~ 2026-12-31",
  },
  {
    id: "AM-2026-003", companyId: "C-2026-001", company: "뉴로메카", type: "참여연구원 변경",
    reason: "신규 연구원 충원 및 기존 인력 참여율 상향 조정",
    submittedAt: "2026-05-20", status: "검토중", reviewComment: "",
    researchersBefore: [
      { id: "R1", name: "김선모", role: "연구책임자", position: "책임연구원", rate: 30, period: PERIOD, salary: true },
      { id: "R2", name: "오세훈", role: "참여연구원", position: "선임연구원", rate: 60, period: PERIOD, salary: true },
      { id: "R3", name: "장유진", role: "참여연구원", position: "연구원", rate: 50, period: PERIOD, salary: true },
    ],
    researchersAfter: [
      { id: "R1", name: "김선모", role: "연구책임자", position: "책임연구원", rate: 30, period: PERIOD, salary: true },
      { id: "R2", name: "오세훈", role: "참여연구원", position: "선임연구원", rate: 60, period: PERIOD, salary: true },
      { id: "R3", name: "장유진", role: "참여연구원", position: "연구원", rate: 70, period: PERIOD, salary: true },
      { id: "R9", name: "신지아", role: "참여연구원", position: "연구원", rate: 50, period: PERIOD, salary: true },
    ],
  },
];

// 상세 예산 트리 (비목>세목>세세목+법인예산과목) — 원 단위

export const SEED_BUDGET_TREE = [
  { bimok: "인건비", semok: "보수", sse: "보수", gwamok: "인건비", budget: 170820000, exec: 0 },
  { bimok: "인건비", semok: "상용임금", sse: "상용임금", gwamok: "인건비", budget: 59180000, exec: 0 },
  { bimok: "운영비", semok: "일반수용비", sse: "사무용품 및 소모품 구입비", gwamok: "소모품비", budget: 3000000, exec: 885000 },
  { bimok: "운영비", semok: "일반수용비", sse: "인쇄유인물 등 제작비", gwamok: "도서인쇄비", budget: 2000000, exec: 94600 },
  { bimok: "운영비", semok: "일반수용비", sse: "간행물 등 구입비", gwamok: "도서인쇄비", budget: 600000, exec: 0 },
  { bimok: "운영비", semok: "일반수용비", sse: "공고료 및 광고료", gwamok: "광고선전비", budget: 3300000, exec: 0 },
  { bimok: "운영비", semok: "일반수용비", sse: "업무위탁대가 및 사례금", gwamok: "전문가활용비", budget: 18000000, exec: 6980000 },
  { bimok: "운영비", semok: "일반수용비", sse: "교육훈련비", gwamok: "교육훈련비", budget: 3000000, exec: 740000 },
  { bimok: "운영비", semok: "일반수용비", sse: "각종 수수료 및 사용료", gwamok: "위탁정산비", budget: 3000000, exec: 0 },
  { bimok: "운영비", semok: "공공요금 및 제세", sse: "AX랩 공간 및 장비운영 공과금 등", gwamok: "공과금", budget: 4800000, exec: 0 },
  { bimok: "운영비", semok: "임차료", sse: "행사장 임차료", gwamok: "임차료", budget: 5000000, exec: 0 },
  { bimok: "운영비", semok: "임차료", sse: "AI 구독료", gwamok: "임차료", budget: 10800000, exec: 0 },
  { bimok: "운영비", semok: "일반용역비", sse: "(공동) AI융합 컨퍼런스", gwamok: "위탁용역비", budget: 30000000, exec: 122800000 },
  { bimok: "운영비", semok: "일반용역비", sse: "(공동) 성과홍보", gwamok: "위탁용역비", budget: 10000000, exec: 0 },
  { bimok: "운영비", semok: "일반용역비", sse: "(공동) 제조·AI 국제 협력체계 구축", gwamok: "위탁용역비", budget: 10000000, exec: 0 },
  { bimok: "운영비", semok: "일반용역비", sse: "영남권 통합 착수보고회", gwamok: "위탁용역비", budget: 10000000, exec: 0 },
  { bimok: "운영비", semok: "일반용역비", sse: "경북AX랩 인프라 운영(세미나, 교육, 컨설팅 등)", gwamok: "위탁용역비", budget: 190000000, exec: 0 },
  { bimok: "운영비", semok: "일반용역비", sse: "경북AX랩 성과공유회", gwamok: "위탁용역비", budget: 10000000, exec: 0 },
  { bimok: "운영비", semok: "일반용역비", sse: "(공동) 국외 전시회 참가 지원", gwamok: "위탁용역비", budget: 76000000, exec: 0 },
  { bimok: "운영비", semok: "일반용역비", sse: "(공동) 영남권 성과공유회", gwamok: "위탁용역비", budget: 10000000, exec: 0 },
  { bimok: "운영비", semok: "일반용역비", sse: "AX랩 시스템(홈페이지, GPU) 고도화", gwamok: "위탁용역비", budget: 170000000, exec: 0 },
  { bimok: "여비", semok: "국내여비", sse: "국내여비", gwamok: "여비교통비", budget: 8000000, exec: 2328790 },
  { bimok: "여비", semok: "국외여비", sse: "국외여비", gwamok: "여비교통비", budget: 30000000, exec: 7041760 },
  { bimok: "업무추진비", semok: "업무추진비", sse: "회의비", gwamok: "사업추진비", budget: 7500000, exec: 1822441 },
  { bimok: "유형자산", semok: "유형자산", sse: "GPU 카드 구매", gwamok: "자산취득비", budget: 50000000, exec: 0 },
  { bimok: "민간위탁비", semok: "민간이전", sse: "수요맞춤형", gwamok: "기업지원", budget: 430000000, exec: 670370000 },
  { bimok: "민간위탁비", semok: "민간이전", sse: "광역연계형", gwamok: "기업지원", budget: 610000000, exec: 0 },
  { bimok: "민간위탁비", semok: "민간이전", sse: "확산거점형", gwamok: "기업지원", budget: 960000000, exec: 0 },
];

// 집행 원장(전표) 시드 — 원 단위
export const SEED_LEDGER = [
  { id: "L001", date: "2026-01-14", desc: "[제조업AI] 2026년 사업 관련 업무 회의비", payee: "—", amount: 188900, bimok: "사업추진비", fund: "국비", reg: "—", evidence: true },
  { id: "L002", date: "2026-01-28", desc: "(01.21/서울) NIPA 통합사업설명회 참석", payee: "박진석", amount: 150100, bimok: "국내여비", fund: "국비", reg: "—", evidence: true },
  { id: "L003", date: "2026-02-05", desc: "[제조업AI] 사업 관련 업무 회의비", payee: "—", amount: 120000, bimok: "사업추진비", fund: "국비", reg: "—", evidence: true },
  { id: "L004", date: "2026-02-11", desc: "[제조업AI] AI솔루션개발 실증지원사업 사업적정성 심의위원회 수당 지급", payee: "기타소득자", amount: 1410000, bimok: "전문가활용비", fund: "국비", reg: "—", evidence: true },
  { id: "L005", date: "2026-02-28", desc: "[제조업AI] 용역 원가계산 산출 위탁 용역 미지급금", payee: "사단법인 지방행정발전연구원", amount: 2800000, bimok: "위탁용역비", fund: "국비", reg: "—", evidence: false },
  { id: "L006", date: "2026-03-26", desc: "[제조업AI] 경북AX랩 활성화 프로그램 운영 용역 선정평가위원회 수당 지급", payee: "기타소득자", amount: 1860000, bimok: "전문가활용비", fund: "국비", reg: "—", evidence: true },
  { id: "L007", date: "2026-04-14", desc: "[제조업] 경북AX랩 활성화 프로그램 운영 용역 선급금 지급", payee: "크리에이티브그룹 스록", amount: 120000000, bimok: "위탁용역비", fund: "국비", reg: "—", evidence: true },
  { id: "L008", date: "2026-04-16", desc: "[국외출장](04.18.~04.26./독일) 국외전시회 참가 지원", payee: "김승모", amount: 3520880, bimok: "국외여비", fund: "국비", reg: "—", evidence: true },
  { id: "L009", date: "2026-04-30", desc: "[제조업] AI솔루션 개발실증 지원사업 사업비(1차) 지급", payee: "유징테크(주)", amount: 119080000, bimok: "기업지원", fund: "국비", reg: "—", evidence: true },
  { id: "L010", date: "2026-04-30", desc: "[제조업] AI솔루션 개발실증 지원사업 사업비(1차) 지급", payee: "(주)앰버로드", amount: 274753000, bimok: "기업지원", fund: "국비", reg: "—", evidence: true },
  { id: "L011", date: "2026-05-07", desc: "(04.27/서울), AI 지역확산 사업 통합 착수보고회 참석", payee: "이은하", amount: 157200, bimok: "국내여비", fund: "국비", reg: "—", evidence: false },
];
