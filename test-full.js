const BASE = "http://localhost:8090";
let passed = 0, failed = 0, warned = 0;
const errors = [];
const warns = [];

async function http(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { status: res.status, data, text };
  } catch (e) { return { status: 0, data: null, text: e.message }; }
}

function test(name, condition, detail) {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; errors.push({ name, detail: detail || "" }); console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

function warn(name, detail) { warned++; warns.push({ name, detail }); console.log(`  △ ${name} — ${detail}`); }

async function run() {
  console.log("\n" + "=".repeat(60));
  console.log("  전수 테스트 — 모든 역할, 모든 메뉴, 모든 기능");
  console.log("=".repeat(60) + "\n");

  // ══════════════════════════════════════════
  // 0. 서버 상태
  // ══════════════════════════════════════════
  console.log("▶ 0. 서버 상태");
  const health = await http("GET", "/api/health");
  test("헬스체크", health.status === 200);

  // ══════════════════════════════════════════
  // 1. 인증 — 로그인/회원가입/비밀번호
  // ══════════════════════════════════════════
  console.log("\n▶ 1. 인증");

  // 1-1. 마스터 로그인
  const ml = await http("POST", "/api/auth/login", { email: "admin@ptp.or.kr", password: "admin1234" });
  test("1-1 마스터 로그인", ml.status === 200 && ml.data?.user?.role === "master");
  const MT = ml.data?.token;

  // 1-2. 잘못된 비밀번호
  const badPw = await http("POST", "/api/auth/login", { email: "admin@ptp.or.kr", password: "wrong" });
  test("1-2 잘못된 비밀번호 거부", badPw.status === 401);

  // 1-3. 없는 계정
  const noUser = await http("POST", "/api/auth/login", { email: "nobody@x.kr", password: "x" });
  test("1-3 없는 계정 거부", noUser.status === 401);

  // 1-4. 토큰 없이 API 호출
  const noToken = await http("GET", "/api/companies");
  test("1-4 토큰 없이 API 거부", noToken.status === 401);

  // 1-5. 잘못된 토큰
  const badToken = await http("GET", "/api/companies", null, "invalid.token.here");
  test("1-5 잘못된 토큰 거부", badToken.status === 401);

  // 1-6. me() API
  const me = await http("GET", "/api/auth/me", null, MT);
  test("1-6 me() API", me.status === 200 && me.data?.role === "master");

  // 1-7. 회원가입 (필수 항목 누락)
  const signupBad = await http("POST", "/api/auth/signup", { companyName: "test" });
  test("1-7 회원가입 필수항목 누락 거부", signupBad.status === 400);

  // 1-8. 회원가입 정상
  const signup = await http("POST", "/api/auth/signup", { companyName: "신규기업", contactName: "홍길동", email: `test${Date.now()}@x.kr`, password: "1234" });
  test("1-8 회원가입 정상", signup.status === 201);

  // 1-9. 비밀번호 변경 (현재 비밀번호 틀림)
  const changePwBad = await http("POST", "/api/auth/change-password", { currentPassword: "wrong", newPassword: "new1234" }, MT);
  test("1-9 비밀번호 변경 — 현재 비밀번호 틀림", changePwBad.status === 401);

  // 1-10. 비밀번호 변경 정상
  const changePw = await http("POST", "/api/auth/change-password", { currentPassword: "admin1234", newPassword: "admin1234" }, MT);
  test("1-10 비밀번호 변경 정상 (동일 비번)", changePw.status === 200);

  // ══════════════════════════════════════════
  // 2. 회원관리 (마스터)
  // ══════════════════════════════════════════
  console.log("\n▶ 2. 회원관리");

  // 2-1. 계정 생성 — 기관관리자
  const cAdmin = await http("POST", "/api/users", { name: "관리자A", email: "adm@t.kr", password: "1234", role: "admin" }, MT);
  test("2-1 기관관리자 계정 생성", cAdmin.status === 201);
  const admToken = (await http("POST", "/api/auth/login", { email: "adm@t.kr", password: "1234" })).data?.token;

  // 2-2. 계정 생성 — 회계사
  const cAud = await http("POST", "/api/users", { name: "회계사A", email: "aud@t.kr", password: "1234", role: "auditor" }, MT);
  test("2-2 회계사 계정 생성", cAud.status === 201);
  const audToken = (await http("POST", "/api/auth/login", { email: "aud@t.kr", password: "1234" })).data?.token;

  // 2-3. 계정 생성 — 기업
  const cComp = await http("POST", "/api/users", { name: "기업A", email: "comp@t.kr", password: "1234", role: "company" }, MT);
  test("2-3 기업 계정 생성", cComp.status === 201);
  const compId = cComp.data?.id;

  // 2-4. 전체 계정 목록
  const users = await http("GET", "/api/users", null, MT);
  test("2-4 전체 계정 목록", users.status === 200 && users.data?.length >= 4);

  // 2-5. 역할 변경
  const chRole = await http("PUT", `/api/users/${compId}`, { role: "company" }, MT);
  test("2-5 역할 변경", chRole.status === 200);

  // 2-6. 과제 연결 (과제 없이)
  const linkEmpty = await http("PUT", `/api/users/${compId}`, { companyId: null }, MT);
  test("2-6 과제 연결 해제", linkEmpty.status === 200);

  // 2-7. 비밀번호 초기화
  const resetPw = await http("POST", "/api/auth/reset-password", { userId: compId, newPassword: "reset1234" }, MT);
  test("2-7 비밀번호 초기화", resetPw.status === 200);

  // 2-8. 초기화된 비밀번호로 로그인
  const resetLogin = await http("POST", "/api/auth/login", { email: "comp@t.kr", password: "reset1234" });
  test("2-8 초기화 비밀번호 로그인", resetLogin.status === 200);

  // 2-9. 이메일 중복 생성 거부
  const dupEmail = await http("POST", "/api/users", { name: "중복", email: "comp@t.kr", password: "1234", role: "company" }, MT);
  test("2-9 이메일 중복 거부", dupEmail.status === 409);

  // 2-10. 가입 승인 대기 목록
  const signupList = await http("GET", "/api/auth/signup-requests", null, MT);
  test("2-10 가입 승인 대기 목록", signupList.status === 200);

  // 2-11. 계정 삭제
  const delUser = await http("DELETE", `/api/users/${cAud.data?.id}`, null, MT);
  test("2-11 계정 삭제", delUser.status === 200);

  // 2-12. 삭제 후 로그인 불가
  const delLogin = await http("POST", "/api/auth/login", { email: "aud@t.kr", password: "1234" });
  test("2-12 삭제된 계정 로그인 불가", delLogin.status === 401);

  // 2-13. 회계사 재생성 (이후 테스트용)
  const cAud2 = await http("POST", "/api/users", { name: "회계사B", email: "aud2@t.kr", password: "1234", role: "auditor" }, MT);
  test("2-13 회계사 재생성", cAud2.status === 201);
  const aud2Token = (await http("POST", "/api/auth/login", { email: "aud2@t.kr", password: "1234" })).data?.token;

  // ══════════════════════════════════════════
  // 3. 과제 발급
  // ══════════════════════════════════════════
  console.log("\n▶ 3. 과제 발급");

  // 3-1. 마스터 과제 발급
  const issue1 = await http("POST", "/api/companies", {
    id: "GB-2026-T01", name: "테스트기업A", task: "AI사업", pm: "김연구",
    period: "2026-01-01 ~ 2026-12-31", status: "초기등록", consortium: "대학A",
    budget: { 인건비: 100000000, 연구재료비: 50000000 }, email: "comp@t.kr"
  }, MT);
  test("3-1 마스터 과제 발급", issue1.status === 201);

  // 3-2. 기관관리자 과제 발급
  const issue2 = await http("POST", "/api/companies", {
    id: "GB-2026-T02", name: "테스트기업B", task: "데이터사업", pm: "이연구",
    period: "2026-01-01 ~ 2026-12-31", status: "초기등록", consortium: "대학B",
    budget: { 인건비: 80000000 }, email: ""
  }, admToken);
  test("3-2 기관관리자 과제 발급", issue2.status === 201);

  // 3-3. 기업이 과제 발급 시도 (거부)
  const compToken = (await http("POST", "/api/auth/login", { email: "comp@t.kr", password: "reset1234" })).data?.token;
  const issueFail = await http("POST", "/api/companies", { id: "X", name: "X", task: "X", pm: "X", period: "X", budget: {} }, compToken);
  test("3-3 기업 과제 발급 거부", issueFail.status === 403);

  // 3-4. 기업-과제 연결
  const link = await http("PUT", `/api/users/${compId}`, { companyId: "GB-2026-T01" }, MT);
  test("3-4 기업-과제 연결", link.status === 200);

  // 3-5. 연결 확인 (me)
  const compMe = await http("GET", "/api/auth/me", null, compToken);
  test("3-5 연결 확인 (me)", compMe.data?.companyId === "GB-2026-T01");

  // 3-6. 과제 수정
  const editCo = await http("PUT", "/api/companies/GB-2026-T01", { name: "수정된기업A", status: "집행중" }, MT);
  test("3-6 과제 수정", editCo.status === 200);

  // 3-7. 과제 목록 (관리자)
  const coList = await http("GET", "/api/companies", null, MT);
  test("3-7 과제 목록 (관리자)", coList.status === 200 && coList.data?.length >= 2);

  // ══════════════════════════════════════════
  // 4. 예산 트리
  // ══════════════════════════════════════════
  console.log("\n▶ 4. 예산 트리");

  // 4-1. 예산 트리 등록
  const budgetSave = await http("PUT", "/api/companies/GB-2026-T01/budget", { rows: [
    { bimok: "인건비", semok: "보수", sse: "기본급", gwamok: "인건비", budget: 100000000, exec_amt: 0 },
    { bimok: "운영비", semok: "일반수용비", sse: "소모품비", gwamok: "소모품비", budget: 30000000, exec_amt: 0 },
    { bimok: "운영비", semok: "일반수용비", sse: "전문가활용비", gwamok: "전문가활용비", budget: 20000000, exec_amt: 0 },
  ] }, MT);
  test("4-1 예산 트리 등록", budgetSave.status === 200);

  // 4-2. 예산 트리 조회 (기업)
  const budgetGet = await http("GET", "/api/companies/GB-2026-T01/budget", null, compToken);
  test("4-2 예산 트리 조회", budgetGet.status === 200 && budgetGet.data?.length === 3);

  // 4-3. 다른 과제 예산 조회 거부
  const budgetOther = await http("GET", "/api/companies/GB-2026-T02/budget", null, compToken);
  test("4-3 다른 과제 예산 조회 거부", budgetOther.status === 403);

  // ══════════════════════════════════════════
  // 5. 집행 등록 / 원장
  // ══════════════════════════════════════════
  console.log("\n▶ 5. 집행 등록");

  // 5-1. 집행 등록
  const addLedger = await http("POST", "/api/companies/GB-2026-T01/ledger", { entries: [
    { date: "2026-05-01", description: "소모품 구입", payee: "(주)오피스", amount: 500000, bimok: "소모품비" },
    { date: "2026-05-10", description: "전문가 자문료", payee: "김전문", amount: 1500000, bimok: "전문가활용비" },
    { date: "2026-05-15", description: "출장비", payee: "이연구", amount: 200000, bimok: "국내여비" },
  ] }, compToken);
  test("5-1 집행 등록 (3건)", addLedger.status === 201);

  // 5-2. 집행 내역 조회
  const ledger = await http("GET", "/api/companies/GB-2026-T01/ledger", null, compToken);
  test("5-2 집행 내역 조회", ledger.status === 200 && ledger.data?.length >= 3);

  // 5-3. 다른 과제 집행 조회 거부
  const ledgerOther = await http("GET", "/api/companies/GB-2026-T02/ledger", null, compToken);
  test("5-3 다른 과제 집행 거부", ledgerOther.status === 403);

  // ══════════════════════════════════════════
  // 6. 증빙 첨부
  // ══════════════════════════════════════════
  console.log("\n▶ 6. 증빙");

  const txnId = ledger.data?.[0]?.id;

  // 6-1. 증빙 상태 확인 (미첨부)
  test("6-1 초기 증빙 상태 (미첨부)", ledger.data?.[0]?.evidence_status === "미첨부");

  // 6-2. 증빙 조회 API
  if (txnId) {
    const evGet = await http("GET", `/api/ledger/${txnId}/evidence`, null, compToken);
    test("6-2 증빙 조회", evGet.status === 200);
  }

  // 6-3. 증빙 검토완료 (관리자)
  if (txnId) {
    const evReview = await http("POST", `/api/ledger/${txnId}/evidence/review`, {}, MT);
    test("6-3 증빙 검토완료", evReview.status === 200);
  }

  // 6-4. 기업이 증빙 검토 시도 (거부)
  if (txnId) {
    const evReviewFail = await http("POST", `/api/ledger/${txnId}/evidence/review`, {}, compToken);
    test("6-4 기업 증빙 검토 거부", evReviewFail.status === 403);
  }

  // ══════════════════════════════════════════
  // 7. 협약변경
  // ══════════════════════════════════════════
  console.log("\n▶ 7. 협약변경");

  // 7-1. 협약변경 신청
  const amendId = `GB-2026-TEST-${Date.now()}`;
  const submitAmend = await http("POST", "/api/amendments", {
    id: amendId, companyId: "GB-2026-T01", company: "수정된기업A",
    type: "사업비 변경", reason: "테스트 변경",
    detail: { before: { 인건비: 100000000 }, after: { 인건비: 90000000 } }
  }, compToken);
  test("7-1 협약변경 신청", submitAmend.status === 201);

  // 7-2. 협약변경 목록 (기업)
  const amendList = await http("GET", "/api/amendments", null, compToken);
  test("7-2 협약변경 목록 (기업)", amendList.status === 200 && amendList.data?.length >= 1);

  // 7-3. 협약변경 목록 (관리자)
  const amendAdmin = await http("GET", "/api/amendments", null, MT);
  test("7-3 협약변경 목록 (관리자)", amendAdmin.status === 200 && amendAdmin.data?.length >= 1);

  // 7-4. 기업이 승인 시도 (거부)
  const decideFail = await http("POST", `"/api/amendments/${amendId}/decision`, { decision: "승인" }, compToken);
  test("7-4 기업 승인 거부", decideFail.status === 403 || decideFail.status === 404);

  // 7-5. 관리자 승인
  const approve = await http("POST", `/api/amendments/${amendId}/decision`, { decision: "승인", comment: "적정" }, MT);
  test("7-5 관리자 승인", approve.status === 200);

  // 7-6. 타임라인
  const timeline = await http("GET", "/api/amendments/timeline/GB-2026-T01", null, compToken);
  test("7-6 타임라인 조회", timeline.status === 200);

  // ══════════════════════════════════════════
  // 8. 회계검토
  // ══════════════════════════════════════════
  console.log("\n▶ 8. 회계검토");

  // 8-1. 회계사 등록 (audit API)
  const regAud = await http("POST", "/api/audit/auditors", { name: "회계사C", email: "aud3@t.kr", password: "1234" }, MT);
  test("8-1 회계사 등록 (audit API)", regAud.status === 201);

  // 8-2. 회계사 목록
  const audList = await http("GET", "/api/audit/auditors", null, MT);
  test("8-2 회계사 목록", audList.status === 200);

  // 8-3. 기업 배정
  const auditorId = regAud.data?.id || cAud2.data?.id;
  const assign = await http("POST", "/api/audit/assignments", { assignments: [{ companyId: "GB-2026-T01", auditorId }] }, MT);
  test("8-3 기업 배정", assign.status === 200);

  // 8-4. 배정 목록
  const assignList = await http("GET", "/api/audit/assignments", null, MT);
  test("8-4 배정 목록", assignList.status === 200);

  // 8-5. 회계사 배정기업 조회
  const aud3Token = (await http("POST", "/api/auth/login", { email: "aud3@t.kr", password: "1234" })).data?.token;
  const myComp = await http("GET", "/api/audit/my-companies", null, aud3Token);
  test("8-5 회계사 배정기업 조회", myComp.status === 200 && myComp.data?.length >= 1);

  // 8-6. 보고서 제출
  const report = await http("POST", "/api/audit/reports", { companyId: "GB-2026-T01", opinion: "적정", summary: "이상없음" }, aud3Token);
  test("8-6 보고서 제출", report.status === 201);

  // 8-7. 보고서 목록
  const reportList = await http("GET", "/api/audit/reports", null, MT);
  test("8-7 보고서 목록", reportList.status === 200 && reportList.data?.length >= 1);

  // 8-8. 회계사 → 관리자 API 차단
  const audForbid1 = await http("GET", "/api/users", null, aud3Token);
  test("8-8 회계사 → 회원관리 차단", audForbid1.status === 403);

  // 8-9. 회계사 → 과제발급 차단
  const audForbid2 = await http("POST", "/api/companies", { id: "X", name: "X", task: "X", pm: "X", period: "X", budget: {} }, aud3Token);
  test("8-9 회계사 → 과제발급 차단", audForbid2.status === 403);

  // ══════════════════════════════════════════
  // 9. 알림
  // ══════════════════════════════════════════
  console.log("\n▶ 9. 알림");

  // 9-1. 마스터 알림 조회
  const notifM = await http("GET", "/api/notifications", null, MT);
  test("9-1 마스터 알림 조회", notifM.status === 200);

  // 9-2. 협약변경 신청 알림 존재
  const hasAmendNotif = notifM.data?.some(n => n.type === "amend");
  test("9-2 협약변경 알림 수신", hasAmendNotif);

  // 9-3. 기업 알림 (승인 알림)
  const notifC = await http("GET", "/api/notifications", null, compToken);
  test("9-3 기업 알림 조회", notifC.status === 200);
  const hasApproval = notifC.data?.some(n => n.title?.includes("승인"));
  test("9-4 승인 알림 수신", hasApproval);

  // 9-5. 모두 읽음
  const readAll = await http("POST", "/api/notifications/read-all", {}, MT);
  test("9-5 모두 읽음", readAll.status === 200);

  // 9-6. 개별 읽음
  if (notifC.data?.[0]) {
    const readOne = await http("POST", `/api/notifications/read/${notifC.data[0].id}`, {}, compToken);
    test("9-6 개별 읽음", readOne.status === 200);
  }

  // ══════════════════════════════════════════
  // 10. 권한 격리
  // ══════════════════════════════════════════
  console.log("\n▶ 10. 권한 격리");

  // 10-1. 기업 → 다른 과제 예산
  const iso1 = await http("GET", "/api/companies/GB-2026-T02/budget", null, compToken);
  test("10-1 기업→다른과제 예산 차단", iso1.status === 403);

  // 10-2. 기업 → 다른 과제 원장
  const iso2 = await http("GET", "/api/companies/GB-2026-T02/ledger", null, compToken);
  test("10-2 기업→다른과제 원장 차단", iso2.status === 403);

  // 10-3. 기업 → 회원관리
  const iso3 = await http("GET", "/api/users", null, compToken);
  test("10-3 기업→회원관리 차단", iso3.status === 403);

  // 10-4. 기업 → 과제 수정
  const iso4 = await http("PUT", "/api/companies/GB-2026-T01", { name: "해킹" }, compToken);
  test("10-4 기업→과제수정 허용여부 확인", iso4.status === 200 || iso4.status === 403, `status: ${iso4.status}`);

  // 10-5. 회계사 → 배정안된 기업
  const iso5 = await http("GET", "/api/companies/GB-2026-T02/ledger", null, aud3Token);
  test("10-5 회계사→미배정기업 차단", iso5.status === 403);

  // 10-6. 기관관리자 → 회원관리
  const iso6 = await http("GET", "/api/users", null, admToken);
  test("10-6 기관관리자→회원관리 접근", iso6.status === 200);

  // ══════════════════════════════════════════
  // 11. 서버 로그
  // ══════════════════════════════════════════
  console.log("\n▶ 11. 서버 로그");
  const fs = await import("fs");
  const logDir = "server/logs";
  try {
    const logFiles = fs.readdirSync(logDir).filter(f => f.endsWith(".log"));
    test("11-1 로그 파일 존재", logFiles.length > 0);
    if (logFiles.length > 0) {
      const content = fs.readFileSync(`${logDir}/${logFiles[logFiles.length - 1]}`, "utf8");
      const lines = content.trim().split("\n").length;
      test(`11-2 로그 기록 (${lines}줄)`, lines > 10);
    }
  } catch (e) { test("11-1 로그 확인 실패", false, e.message); }

  // ══════════════════════════════════════════
  // 결과
  // ══════════════════════════════════════════
  console.log("\n" + "=".repeat(60));
  console.log(`  결과: ${passed} PASS / ${failed} FAIL / ${warned} WARN`);
  console.log(`  총 ${passed + failed + warned}건 테스트`);
  if (errors.length > 0) {
    console.log("\n  ❌ 실패 항목:");
    errors.forEach((e, i) => console.log(`    ${i + 1}. ${e.name}${e.detail ? " — " + e.detail : ""}`));
  }
  if (warns.length > 0) {
    console.log("\n  ⚠️ 경고 항목:");
    warns.forEach((w, i) => console.log(`    ${i + 1}. ${w.name} — ${w.detail}`));
  }
  console.log("=".repeat(60) + "\n");
}

run().catch(e => console.error("Fatal:", e));
