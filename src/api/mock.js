import { SEED_COMPANIES, SEED_AMEND, SEED_BUDGET_TREE, SEED_LEDGER } from "./seed.js";
import { BIMOK } from "../lib/theme.js";

let companies = SEED_COMPANIES.map((c) => ({ ...c }));
let amendments = SEED_AMEND.map((a) => ({ ...a }));
let ledgerStore = { "C-2026-001": SEED_LEDGER.map((r) => ({ ...r })) };
let budgetStore = { "C-2026-001": SEED_BUDGET_TREE.map((r, i) => ({ ...r, _id: "B" + i })) };
let evidenceStore = {};
let signupRequests = [];

const delay = (v) => new Promise((r) => setTimeout(() => r(v), 80));

// --- 인증 (시뮬레이션) ---
const MOCK_USERS = [
  { id: "U-MASTER-001", email: "admin@ptp.or.kr", name: "최고관리자", role: "master", companyId: null },
  { id: "U-ADMIN-001", email: "admin@admin.kr", name: "이승모", role: "admin", companyId: null },
  ...SEED_COMPANIES.map((c, i) => ({
    id: `U-${c.id}`, email: i === 0 ? "test@test.kr" : `${c.id.toLowerCase()}@biz.co.kr`, name: `${c.name} 담당자`, role: "company", companyId: c.id,
  })),
];
let currentUser = null;

export const login = (email, _password) => {
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user) throw new Error("계정을 찾을 수 없습니다");
  const token = btoa(JSON.stringify(user));
  currentUser = user;
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", JSON.stringify(user));
  return delay({ token, user });
};

export const me = () => {
  const stored = localStorage.getItem("auth_user");
  if (stored) { currentUser = JSON.parse(stored); return delay(currentUser); }
  throw new Error("인증이 필요합니다");
};

export const signup = (data) => {
  const existing = MOCK_USERS.find((u) => u.email === data.email);
  if (existing) throw new Error("이미 등록된 이메일입니다");

  // 초대 이메일 자동 매칭
  const matched = companies.find((c) => c.inviteEmail === data.email);
  if (matched) {
    const userId = `U-${matched.id}`;
    const user = { id: userId, email: data.email, name: data.contactName, role: "company", companyId: matched.id };
    MOCK_USERS.push(user);
    const token = btoa(JSON.stringify(user));
    currentUser = user;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    return delay({ token, user, message: `과제 ${matched.id}와 자동 매칭되었습니다.` });
  }

  const id = `SR-${Date.now()}`;
  const req = { id, ...data, status: "대기", created_at: new Date().toISOString() };
  signupRequests.push(req);
  return delay({ id, status: "대기", message: "가입 신청이 접수되었습니다. 관리자 승인 후 이용 가능합니다." });
};

export const changePassword = (_cur, _newPw) => delay({ message: "비밀번호가 변경되었습니다" });
export const resetPassword = (_userId, _newPw) => delay({ message: "비밀번호가 초기화되었습니다" });
export const listSignupRequests = () => delay([...signupRequests]);
export const approveSignup = (id, companyId) => {
  const sr = signupRequests.find((r) => r.id === id);
  if (sr) {
    sr.status = "승인";
    MOCK_USERS.push({ id: `U-SR-${Date.now()}`, email: sr.email, name: sr.contactName, role: "company", companyId });
  }
  return delay({ message: "승인 완료" });
};
export const rejectSignup = (id) => {
  const sr = signupRequests.find((r) => r.id === id);
  if (sr) sr.status = "반려";
  return delay({ message: "반려 처리" });
};

// --- 과제(기업) ---
export const listCompanies = () => delay(companies.map((c) => ({ ...c })));
export const getCompany = (id) => delay(companies.find((c) => c.id === id));
export const issueCompany = (proj) => { companies = [...companies, { ...proj, inviteEmail: proj.email || proj.inviteEmail || "" }]; return delay(proj); };
export const updateCompany = (id, patch) => {
  companies = companies.map((c) => (c.id === id ? { ...c, ...patch } : c));
  return delay(companies.find((c) => c.id === id));
};
export const completeRegistration = (id, researchers) =>
  updateCompany(id, { researchers, status: "집행중" });

export const nextCompanyId = () => {
  const nums = companies.map((c) => parseInt(c.id.split("-")[2])).filter((n) => !isNaN(n));
  return delay(`C-2026-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`);
};

// --- 예산 트리 ---
export const getBudgetTree = (companyId) => {
  if (!budgetStore[companyId]) budgetStore[companyId] = [];
  return delay(budgetStore[companyId].map((r) => ({ ...r })));
};

export const saveBudgetTree = (companyId, rows) => {
  budgetStore[companyId] = rows.map((r, i) => ({ ...r, _id: r._id || "B" + i }));
  return delay(budgetStore[companyId]);
};

// --- 집행 원장 ---
export const getLedger = (companyId) => {
  if (!ledgerStore[companyId]) ledgerStore[companyId] = [];
  const rows = ledgerStore[companyId].map((r) => ({
    ...r,
    evidenceFiles: evidenceStore[r.id] || [],
    evidence_status: evidenceStore[r.id]?.length ? "첨부" : (r.evidence ? "첨부" : "미첨부"),
  }));
  return delay(rows);
};

export const appendLedger = (companyId, entries) => {
  if (!ledgerStore[companyId]) ledgerStore[companyId] = [];
  const newEntries = entries.map((e) => ({
    id: e.id || `L${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: e.date, desc: e.desc || e.description, payee: e.payee,
    amount: e.amount, bimok: e.bimok, fund: e.fund || "국비",
    reg: e.reg || "직접등록", evidence: false, evidence_status: "미첨부",
  }));
  ledgerStore[companyId].push(...newEntries);

  recalcBudgetTreeExec(companyId);

  return delay(newEntries);
};

function recalcBudgetTreeExec(companyId) {
  const ledger = ledgerStore[companyId] || [];
  const tree = budgetStore[companyId] || [];

  const gwamokTotals = {};
  for (const tx of ledger) {
    gwamokTotals[tx.bimok] = (gwamokTotals[tx.bimok] || 0) + (tx.amount || 0);
  }

  for (const row of tree) row.exec = 0;
  const used = {};
  for (const [gwamok, total] of Object.entries(gwamokTotals)) {
    const target = tree.find((r) => r.gwamok === gwamok && !used[r._id]);
    if (target) { target.exec = total; used[target._id] = true; }
  }
}

// --- 증빙 ---
export const attachEvidence = (txnId, file) => {
  const meta = {
    id: `EF-${Date.now()}`,
    filename: file.name, originalName: file.name,
    mimetype: file.type, size: file.size,
    url: URL.createObjectURL(file),
  };
  if (!evidenceStore[txnId]) evidenceStore[txnId] = [];
  evidenceStore[txnId].push(meta);
  return delay(meta);
};

export const getEvidence = (txnId) => delay(evidenceStore[txnId] || []);

export const reviewEvidence = (txnId) => {
  for (const store of Object.values(ledgerStore)) {
    const row = store.find((r) => r.id === txnId);
    if (row) { row.evidence_status = "검토완료"; break; }
  }
  return delay({ ok: true });
};

// --- 협약변경 ---
export const listAmendments = () => delay(amendments.map((a) => ({ ...a })));
export const submitAmendment = (a) => {
  const amend = { ...a, attachments: [] };
  amendments = [amend, ...amendments];
  return delay(amend);
};
export const decideAmendment = (id, decision, comment) => {
  const t = amendments.find((a) => a.id === id);
  if (decision === "승인" && t) {
    if (t.type === "사업비 변경") updateCompany(t.companyId, { budget: { ...t.after } });
    else if (t.type === "연구기간 변경") updateCompany(t.companyId, { period: t.periodAfter });
    else if (t.type === "참여연구원 변경") updateCompany(t.companyId, { researchers: t.researchersAfter });
  }
  amendments = amendments.map((a) => (a.id === id ? { ...a, status: decision, reviewComment: comment, reviewedAt: new Date().toISOString().slice(0, 10) } : a));
  return delay(amendments.find((a) => a.id === id));
};

export const attachAmendmentFile = (amendId, file) => {
  const meta = {
    id: `AF-${Date.now()}`,
    filename: file.name, originalName: file.name,
    mimetype: file.type, size: file.size,
    url: URL.createObjectURL(file),
  };
  const amend = amendments.find((a) => a.id === amendId);
  if (amend) { if (!amend.attachments) amend.attachments = []; amend.attachments.push(meta); }
  return delay(meta);
};

export const getAmendmentTimeline = (companyId) => {
  const filtered = amendments.filter((a) => a.companyId === companyId);
  const events = [];
  for (const a of filtered) {
    events.push({ date: a.submittedAt, action: "신청", amendId: a.id, type: a.type, reason: a.reason, status: a.status, attachmentCount: (a.attachments || []).length });
    if (a.reviewedAt) events.push({ date: a.reviewedAt, action: a.status, amendId: a.id, type: a.type, comment: a.reviewComment });
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  return delay(events);
};

// --- 알림 ---
let mockNotifications = [];
export const listNotifications = () => delay([...mockNotifications]);
export const markNotificationRead = (id) => { mockNotifications = mockNotifications.map((n) => n.id === id ? { ...n, read: 1 } : n); return delay({ ok: true }); };
export const markAllNotificationsRead = () => { mockNotifications = mockNotifications.map((n) => ({ ...n, read: 1 })); return delay({ ok: true }); };

// --- 회원관리 ---
export const listUsers = () => delay(MOCK_USERS.map((u) => ({ ...u })));
export const createUser = (data) => {
  const id = `U-${Date.now()}`;
  const user = { id, ...data };
  MOCK_USERS.push(user);
  return delay(user);
};
export const updateUser = (id, data) => { const u = MOCK_USERS.find((x) => x.id === id); if (u) Object.assign(u, data); return delay({ ok: true }); };
export const deleteUser = (id) => { const idx = MOCK_USERS.findIndex((x) => x.id === id); if (idx >= 0) MOCK_USERS.splice(idx, 1); return delay({ ok: true }); };

// --- 회계검토 ---
let auditorUsers = [];
let auditAssignments = [];
let auditReports = [];

export const listAuditors = () => delay(auditorUsers.map((a) => ({ ...a, assigned: auditAssignments.filter((x) => x.auditorId === a.id).map((x) => x.companyId) })));
export const createAuditor = (data) => {
  const id = `AUD-${Date.now()}`;
  const user = { id, name: data.name, email: data.email, role: "auditor" };
  auditorUsers.push(user);
  MOCK_USERS.push({ ...user, companyId: null });
  return delay({ ...user, assigned: [] });
};
export const getAssignments = () => delay([...auditAssignments]);
export const saveAssignments = (assignments) => { auditAssignments = assignments; return delay({ ok: true }); };
export const listAuditReports = () => delay(auditReports.map((r) => ({ ...r })));
export const createAuditReport = (data) => {
  const id = `AU-${Date.now()}`;
  const report = { id, ...data, auditorId: currentUser?.id, auditorName: currentUser?.name, status: data.opinion ? "검토완료" : "검토중", submittedAt: new Date().toISOString().slice(0, 10), files: [] };
  auditReports.push(report);
  return delay(report);
};
export const updateAuditReport = (id, data) => { auditReports = auditReports.map((r) => r.id === id ? { ...r, ...data } : r); return delay({ ok: true }); };
export const uploadAuditFile = (reportId, file) => {
  const meta = { id: `ARF-${Date.now()}`, filename: file.name, originalName: file.name, url: URL.createObjectURL(file) };
  const report = auditReports.find((r) => r.id === reportId);
  if (report) report.files.push(meta);
  return delay(meta);
};
export const getMyAuditCompanies = () => {
  const assigned = auditAssignments.filter((a) => a.auditorId === currentUser?.id).map((a) => a.companyId);
  return delay(companies.filter((c) => assigned.includes(c.id)).map((c) => ({ ...c })));
};

// --- OCR ---
export const ocrBankbook = (_fileMeta) =>
  delay({ bank: "농협은행", account: "301-0000-0000-13", holder: "(주)그린에이아이" });

export { BIMOK };
