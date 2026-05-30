// 전체 역할별 시나리오 테스트
const BASE = "http://localhost:8090";
let passed = 0, failed = 0;
const errors = [];

async function http(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function uploadFile(path, token, filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const form = new FormData();
  form.append("file", blob, filename);
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: form });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function test(name, condition) {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; errors.push(name); console.log(`  ✗ ${name}`); }
}

async function run() {
  console.log("\n══════════════════════════════════════");
  console.log("  전체 시나리오 테스트 시작");
  console.log("══════════════════════════════════════\n");

  // ═══ 1. 마스터 관리자 시나리오 ═══
  console.log("▶ 1. 마스터 관리자 (admin@ptp.or.kr)");

  const masterLogin = await http("POST", "/api/auth/login", { email: "admin@ptp.or.kr", password: "admin1234" });
  test("마스터 로그인", masterLogin.status === 200 && masterLogin.data.user.role === "master");
  const MT = masterLogin.data.token;

  // 기관관리자 계정 생성
  const createAdmin = await http("POST", "/api/users", { name: "박담당", email: "admin2@test.kr", password: "admin1234", role: "admin" }, MT);
  test("기관관리자 계정 생성", createAdmin.status === 201);

  // 회계사 계정 생성
  const createAuditor = await http("POST", "/api/audit/auditors", { name: "김회계사", email: "auditor@test.kr", password: "audit1234" }, MT);
  test("회계사 계정 생성", createAuditor.status === 201);

  // 기업 계정 생성
  const createCompany = await http("POST", "/api/users", { name: "테스트기업 담당자", email: "company@test.kr", password: "comp1234", role: "company" }, MT);
  test("기업 계정 생성", createCompany.status === 201);

  // 과제 발급
  const issueProject = await http("POST", "/api/companies", {
    id: "GB-2026-001", name: "테스트기업", task: "AI 실증사업", pm: "홍길동",
    period: "2026-01-01 ~ 2026-12-31", status: "초기등록", consortium: "테스트대학",
    budget: { 인건비: 100000000, 연구재료비: 50000000 }, email: "company@test.kr"
  }, MT);
  test("과제 발급 (마스터)", issueProject.status === 201);

  // 기업 계정에 과제 연결
  if (createCompany.data?.id) {
    const linkCompany = await http("PUT", `/api/users/${createCompany.data.id}`, { companyId: "GB-2026-001" }, MT);
    test("기업-과제 연결", linkCompany.status === 200);
  }

  // 예산 트리 등록
  const budgetTree = await http("PUT", "/api/companies/GB-2026-001/budget", {
    rows: [
      { bimok: "인건비", semok: "보수", sse: "기본급", gwamok: "인건비", budget: 100000000, exec_amt: 0 },
      { bimok: "운영비", semok: "일반수용비", sse: "소모품비", gwamok: "소모품비", budget: 30000000, exec_amt: 0 },
      { bimok: "운영비", semok: "일반수용비", sse: "전문가활용비", gwamok: "전문가활용비", budget: 20000000, exec_amt: 0 },
    ]
  }, MT);
  test("예산 트리 등록", budgetTree.status === 200);

  // 회계사 기업 배정
  const assignAuditor = await http("POST", "/api/audit/assignments", {
    assignments: [{ companyId: "GB-2026-001", auditorId: createAuditor.data?.id }]
  }, MT);
  test("회계사 기업 배정", assignAuditor.status === 200);

  // 전체 계정 목록 조회
  const listUsers = await http("GET", "/api/users", null, MT);
  test("전체 계정 조회", listUsers.status === 200 && listUsers.data.length >= 4);

  // 알림 조회
  const masterNotifs = await http("GET", "/api/notifications", null, MT);
  test("마스터 알림 조회", masterNotifs.status === 200);

  // ═══ 2. 기관관리자 시나리오 ═══
  console.log("\n▶ 2. 기관관리자 (admin2@test.kr)");

  const adminLogin = await http("POST", "/api/auth/login", { email: "admin2@test.kr", password: "admin1234" });
  test("기관관리자 로그인", adminLogin.status === 200 && adminLogin.data.user.role === "admin");
  const AT = adminLogin.data.token;

  // 과제 발급
  const issueProject2 = await http("POST", "/api/companies", {
    id: "GB-2026-002", name: "두번째기업", task: "데이터 플랫폼", pm: "김연구",
    period: "2026-01-01 ~ 2026-12-31", status: "초기등록", consortium: "테스트대학2",
    budget: { 인건비: 80000000, 연구활동비: 20000000 }, email: ""
  }, AT);
  test("과제 발급 (기관관리자)", issueProject2.status === 201);

  // 과제 목록 조회
  const companies = await http("GET", "/api/companies", null, AT);
  test("과제 목록 조회", companies.status === 200 && companies.data.length >= 2);

  // 협약변경 목록 조회
  const amendments = await http("GET", "/api/amendments", null, AT);
  test("협약변경 목록 조회", amendments.status === 200);

  // ═══ 3. 기업 시나리오 ═══
  console.log("\n▶ 3. 기업 (company@test.kr)");

  const compLogin = await http("POST", "/api/auth/login", { email: "company@test.kr", password: "comp1234" });
  test("기업 로그인", compLogin.status === 200 && compLogin.data.user.role === "company");
  const CT = compLogin.data.token;

  // 자기 과제만 조회
  const myCompanies = await http("GET", "/api/companies", null, CT);
  test("자기 과제만 조회", myCompanies.status === 200);

  // 예산 트리 조회
  const myBudget = await http("GET", "/api/companies/GB-2026-001/budget", null, CT);
  test("예산 트리 조회", myBudget.status === 200 && myBudget.data.length >= 1);

  // 집행 등록
  const addLedger = await http("POST", "/api/companies/GB-2026-001/ledger", {
    entries: [
      { date: "2026-05-01", description: "소모품 구입", payee: "(주)오피스", amount: 500000, bimok: "소모품비", fund: "국비" },
      { date: "2026-05-10", description: "전문가 자문료", payee: "김전문", amount: 1500000, bimok: "전문가활용비", fund: "국비" },
    ]
  }, CT);
  test("집행 등록 (2건)", addLedger.status === 201);

  // 집행 내역 조회
  const ledger = await http("GET", "/api/companies/GB-2026-001/ledger", null, CT);
  test("집행 내역 조회", ledger.status === 200 && ledger.data.length >= 2);

  // 증빙 첨부
  const txnId = ledger.data[0]?.id;
  if (txnId) {
    const attachEvidence = await uploadFile(`/api/ledger/${txnId}/evidence`, CT, "영수증.pdf", "test file content");
    test("증빙 첨부 (파일 업로드)", attachEvidence.status === 201 && attachEvidence.data.originalName === "영수증.pdf");
  } else {
    test("증빙 첨부 (전표 없음)", false);
  }

  // 증빙 후 상태 확인
  const ledgerAfter = await http("GET", "/api/companies/GB-2026-001/ledger", null, CT);
  const attachedTxn = ledgerAfter.data?.find(r => r.id === txnId);
  test("증빙 상태 변경 확인 (첨부)", attachedTxn?.evidence_status === "첨부");

  // 협약변경 신청
  const submitAmend = await http("POST", "/api/amendments", {
    id: "GB-2026-0530-001", companyId: "GB-2026-001", company: "테스트기업",
    type: "사업비 변경", reason: "연구재료비 증액",
    detail: { before: { 인건비: 100000000, 연구재료비: 50000000 }, after: { 인건비: 90000000, 연구재료비: 60000000 } }
  }, CT);
  test("협약변경 신청", submitAmend.status === 201);

  // 협약변경 첨부파일
  const amendFile = await uploadFile("/api/ledger/amendments/GB-2026-0530-001/attachments", CT, "변경계획서.pdf", "amendment plan content");
  test("협약변경 첨부파일 업로드", amendFile.status === 201);

  // 협약변경 목록 조회 (기업)
  const myAmends = await http("GET", "/api/amendments", null, CT);
  test("협약변경 목록 조회 (기업)", myAmends.status === 200 && myAmends.data.length >= 1);
  const hasAttachment = myAmends.data[0]?.attachments?.length > 0;
  test("협약변경 첨부파일 반영 확인", hasAttachment);

  // 알림 조회 (기업)
  const compNotifs = await http("GET", "/api/notifications", null, CT);
  test("기업 알림 조회", compNotifs.status === 200);

  // 회계검토 결과 조회
  const auditReports = await http("GET", "/api/audit/reports", null, CT);
  test("회계검토 결과 조회 (기업)", auditReports.status === 200);

  // 다른 과제 접근 차단
  const otherBudget = await http("GET", "/api/companies/GB-2026-002/budget", null, CT);
  test("다른 과제 접근 차단", otherBudget.status === 403);

  // ═══ 4. 관리자 협약변경 승인 ═══
  console.log("\n▶ 4. 관리자 협약변경 승인/반려");

  // 관리자 알림 확인 (협약변경 신청 알림 왔는지)
  const adminNotifs = await http("GET", "/api/notifications", null, MT);
  const hasAmendNotif = adminNotifs.data?.some(n => n.type === "amend");
  test("관리자에게 협약변경 신청 알림 수신", hasAmendNotif);

  // 협약변경 승인
  const approveAmend = await http("POST", "/api/amendments/GB-2026-0530-001/decision", { decision: "승인", comment: "적정" }, MT);
  test("협약변경 승인", approveAmend.status === 200);

  // 기업에게 승인 알림 갔는지
  const compNotifsAfter = await http("GET", "/api/notifications", null, CT);
  const hasApproveNotif = compNotifsAfter.data?.some(n => n.title?.includes("승인"));
  test("기업에게 승인 알림 수신", hasApproveNotif);

  // 증빙 검토완료 (관리자)
  if (txnId) {
    const reviewEvidence = await http("POST", `/api/ledger/${txnId}/evidence/review`, {}, MT);
    test("증빙 검토완료 처리", reviewEvidence.status === 200);
  }

  // ═══ 5. 회계사 시나리오 ═══
  console.log("\n▶ 5. 회계사 (auditor@test.kr)");

  const auditorLogin = await http("POST", "/api/auth/login", { email: "auditor@test.kr", password: "audit1234" });
  test("회계사 로그인", auditorLogin.status === 200 && auditorLogin.data.user.role === "auditor");
  const AUT = auditorLogin.data.token;

  // 배정된 기업 조회
  const myAuditCompanies = await http("GET", "/api/audit/my-companies", null, AUT);
  test("배정된 기업 조회", myAuditCompanies.status === 200 && myAuditCompanies.data.length >= 1);

  // 검토 보고서 제출
  const submitReport = await http("POST", "/api/audit/reports", {
    companyId: "GB-2026-001", opinion: "적정", summary: "집행 내역 적정. 비목 초과 없음."
  }, AUT);
  test("회계검토 보고서 제출", submitReport.status === 201);

  // 보고서 파일 첨부
  if (submitReport.data?.id) {
    const reportFile = await uploadFile(`/api/audit/reports/${submitReport.data.id}/files`, AUT, "검토보고서.pdf", "audit report content");
    test("검토 보고서 파일 첨부", reportFile.status === 201);
  }

  // 검토 보고서 목록
  const auditList = await http("GET", "/api/audit/reports", null, AUT);
  test("검토 보고서 목록 조회", auditList.status === 200 && auditList.data.length >= 1);

  // 회계사가 관리자 API 접근 차단
  const auditorForbidden = await http("GET", "/api/users", null, AUT);
  test("회계사 → 관리자 API 차단", auditorForbidden.status === 403);

  // ═══ 6. 회원가입 시나리오 ═══
  console.log("\n▶ 6. 회원가입 + 자동매칭");

  // 이메일 매칭 안 되는 가입 (승인 대기)
  const signupNoMatch = await http("POST", "/api/auth/signup", {
    companyName: "(주)신규기업", contactName: "이신규", email: "new@company.kr", password: "new1234"
  });
  test("가입 신청 (매칭 안됨 → 대기)", signupNoMatch.status === 201 && signupNoMatch.data.status === "대기");

  // 가입 승인 대기 목록
  const signupList = await http("GET", "/api/auth/signup-requests", null, MT);
  test("가입 승인 대기 목록", signupList.status === 200 && signupList.data.length >= 1);

  // ═══ 7. 파일 저장 구조 확인 ═══
  console.log("\n▶ 7. 파일 저장 구조 확인");

  const { execSync } = await import("child_process");
  try {
    const tree = execSync('find ../server/uploads -type f 2>/dev/null || dir /s /b ..\\server\\uploads 2>nul', { encoding: "utf8", cwd: process.cwd() });
    if (tree.trim()) {
      console.log("  업로드된 파일:");
      tree.trim().split("\n").forEach(f => console.log(`    ${f.trim()}`));
      test("파일 저장 구조 확인", true);
    } else {
      test("파일 저장 구조 확인 (파일 없음)", false);
    }
  } catch { test("파일 저장 구조 확인 (명령 실패)", false); }

  // ═══ 8. 서버 로그 확인 ═══
  console.log("\n▶ 8. 서버 로그 확인");
  try {
    const fs = await import("fs");
    const logDir = "../server/logs";
    const logFiles = fs.readdirSync(logDir).filter(f => f.endsWith(".log"));
    test("서버 로그 파일 생성", logFiles.length > 0);
    if (logFiles.length > 0) {
      const logContent = fs.readFileSync(`${logDir}/${logFiles[0]}`, "utf8");
      const lines = logContent.trim().split("\n").length;
      test(`로그 기록 확인 (${lines}줄)`, lines > 5);
    }
  } catch (e) { test("서버 로그 확인 실패: " + e.message, false); }

  // ═══ 결과 ═══
  console.log("\n══════════════════════════════════════");
  console.log(`  결과: ${passed} passed, ${failed} failed`);
  if (errors.length > 0) {
    console.log(`\n  실패 항목:`);
    errors.forEach(e => console.log(`    ✗ ${e}`));
  }
  console.log("══════════════════════════════════════\n");
}

run().catch(e => console.error("Test error:", e));
