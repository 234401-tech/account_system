import { http_get, http_post, http_put, http_del, http_upload } from "./client.js";

// --- 인증 ---
export const login = (email, password) => http_post("/api/auth/login", { email, password });
export const me = () => http_get("/api/auth/me");
export const signup = (data) => http_post("/api/auth/signup", data);
export const changePassword = (currentPassword, newPassword) => http_post("/api/auth/change-password", { currentPassword, newPassword });
export const resetPassword = (userId, newPassword) => http_post("/api/auth/reset-password", { userId, newPassword });
export const requestPasswordReset = (email) => http_post("/api/auth/reset-request", { email });
export const listResetRequests = () => http_get("/api/auth/reset-requests");
export const approveResetRequest = (id) => http_post(`/api/auth/reset-requests/${id}/approve`, {});
export const rejectResetRequest = (id) => http_post(`/api/auth/reset-requests/${id}/reject`, {});
export const listSignupRequests = () => http_get("/api/auth/signup-requests");
export const approveSignup = (id, companyId) => http_post(`/api/auth/signup-requests/${id}/approve`, { companyId });
export const rejectSignup = (id) => http_post(`/api/auth/signup-requests/${id}/reject`, {});

// --- 과제(기업) ---
export const listCompanies = () => http_get("/api/companies");
export const getCompany = (id) => http_get(`/api/companies/${id}`);
export const issueCompany = (proj) => http_post("/api/companies", proj);
export const updateCompany = (id, patch) => http_put(`/api/companies/${id}`, patch);
export const completeRegistration = (id, researchers, acctInfo) =>
  http_put(`/api/companies/${id}`, {
    researchers,
    status: "집행중",
    bankName: acctInfo?.bank || acctInfo?.bankName,
    bankAccount: acctInfo?.account || acctInfo?.bankAccount,
    bankHolder: acctInfo?.holder || acctInfo?.bankHolder,
  });
export const nextCompanyId = () => http_get("/api/companies/_next-id").then(r => r.id);
export const deleteCompany = (id) => http_del(`/api/companies/${id}`);

// --- 예산 트리 ---
export const getBudgetTree = (companyId) => http_get(`/api/companies/${companyId}/budget`);
export const saveBudgetTree = (companyId, rows) => http_put(`/api/companies/${companyId}/budget`, { rows });

// --- 집행 원장 ---
export const getLedger = (companyId) => http_get(`/api/companies/${companyId}/ledger`);
export const appendLedger = (companyId, entries) => http_post(`/api/companies/${companyId}/ledger`, { entries });

// --- 증빙 ---
export const attachEvidence = (txnId, file) => http_upload(`/api/ledger/${txnId}/evidence`, file);
export const getEvidence = (txnId) => http_get(`/api/ledger/${txnId}/evidence`);
export const reviewEvidence = (txnId) => http_post(`/api/ledger/${txnId}/evidence/review`, {});

// --- 협약변경 ---
export const listAmendments = () => http_get("/api/amendments");
export const submitAmendment = (a) => {
  const { id, companyId, company, type, reason, before, after, periodBefore, periodAfter, researchersBefore, researchersAfter, treeBefore, treeAfter, ...rest } = a;
  const detail = {};
  if (before) detail.before = before;
  if (after) detail.after = after;
  if (treeBefore) detail.treeBefore = treeBefore;
  if (treeAfter) detail.treeAfter = treeAfter;
  if (periodBefore) detail.periodBefore = periodBefore;
  if (periodAfter) detail.periodAfter = periodAfter;
  if (researchersBefore) detail.researchersBefore = researchersBefore;
  if (researchersAfter) detail.researchersAfter = researchersAfter;
  return http_post("/api/amendments", { id, companyId, company, type, reason, detail });
};
export const decideAmendment = (id, decision, comment) =>
  http_post(`/api/amendments/${id}/decision`, { decision, comment });
export const attachAmendmentFile = (amendId, file) => http_upload(`/api/ledger/amendments/${amendId}/attachments`, file);
export const getAmendmentTimeline = (companyId) => http_get(`/api/amendments/timeline/${companyId}`);

// --- 기업그룹 ---
export const listGroups = () => http_get("/api/groups");
export const createGroup = (data) => http_post("/api/groups", data);
export const updateGroup = (id, data) => http_put(`/api/groups/${id}`, data);
export const deleteGroup = (id) => http_del(`/api/groups/${id}`);
export const addGroupMember = (groupId, userId, role) => http_post(`/api/groups/${groupId}/members`, { userId, role });
export const removeGroupMember = (groupId, userId) => http_del(`/api/groups/${groupId}/members/${userId}`);
export const addGroupProject = (groupId, projectId) => http_post(`/api/groups/${groupId}/projects`, { projectId });
export const removeGroupProject = (groupId, projectId) => http_del(`/api/groups/${groupId}/projects/${projectId}`);
export const getMyProjects = () => http_get("/api/groups/my-projects");

// --- 연구비 사용기준 (정책/규정) ---
export const getPolicy = (companyId) => http_get(`/api/policy/${companyId}`);
export const addPolicyItem = (companyId, data) => http_post(`/api/policy/${companyId}/items`, data);
export const updatePolicyItem = (companyId, id, data) => http_put(`/api/policy/${companyId}/items/${id}`, data);
export const deletePolicyItem = (companyId, id) => http_del(`/api/policy/${companyId}/items/${id}`);
export const uploadPolicyFile = (companyId, file) => http_upload(`/api/policy/${companyId}/files`, file);
export const deletePolicyFile = (companyId, id) => http_del(`/api/policy/${companyId}/files/${id}`);

// --- 알림 ---
export const listNotifications = () => http_get("/api/notifications");
export const markNotificationRead = (id) => http_post(`/api/notifications/read/${id}`, {});
export const markAllNotificationsRead = () => http_post("/api/notifications/read-all", {});

// --- 회원관리 ---
export const listUsers = () => http_get("/api/users");
export const createUser = (data) => http_post("/api/users", data);
export const updateUser = (id, data) => http_put(`/api/users/${id}`, data);
export const deleteUser = (id) => http_del(`/api/users/${id}`);

// --- 회계검토 ---
export const listAuditors = () => http_get("/api/audit/auditors");
export const createAuditor = (data) => http_post("/api/audit/auditors", data);
export const getAssignments = () => http_get("/api/audit/assignments");
export const saveAssignments = (assignments) => http_post("/api/audit/assignments", { assignments });
export const listAuditReports = () => http_get("/api/audit/reports");
export const createAuditReport = (data) => http_post("/api/audit/reports", data);
export const updateAuditReport = (id, data) => http_put(`/api/audit/reports/${id}`, data);
export const uploadAuditFile = (reportId, file) => http_upload(`/api/audit/reports/${reportId}/files`, file);
export const getMyAuditCompanies = () => http_get("/api/audit/my-companies");

// --- OCR (백엔드 비전 API 필요, 일단 미구현) ---
export const ocrBankbook = (file) => http_upload("/api/ocr/bankbook", file);

export { BIMOK } from "../lib/theme.js";
