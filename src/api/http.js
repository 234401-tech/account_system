import { http_get, http_post, http_put, http_upload } from "./client.js";

// --- 인증 ---
export const login = (email, password) => http_post("/api/auth/login", { email, password });
export const me = () => http_get("/api/auth/me");
export const signup = (data) => http_post("/api/auth/signup", data);
export const listSignupRequests = () => http_get("/api/auth/signup-requests");
export const approveSignup = (id, companyId) => http_post(`/api/auth/signup-requests/${id}/approve`, { companyId });
export const rejectSignup = (id) => http_post(`/api/auth/signup-requests/${id}/reject`, {});

// --- 과제(기업) ---
export const listCompanies = () => http_get("/api/companies");
export const getCompany = (id) => http_get(`/api/companies/${id}`);
export const issueCompany = (proj) => http_post("/api/companies", proj);
export const updateCompany = (id, patch) => http_put(`/api/companies/${id}`, patch);
export const completeRegistration = (id, researchers) =>
  http_put(`/api/companies/${id}`, { researchers, status: "집행중" });
export const nextCompanyId = () => http_get("/api/companies/_next-id").then(r => r.id);

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
export const submitAmendment = (a) => http_post("/api/amendments", a);
export const decideAmendment = (id, decision, comment) =>
  http_post(`/api/amendments/${id}/decision`, { decision, comment });
export const attachAmendmentFile = (amendId, file) => http_upload(`/api/ledger/amendments/${amendId}/attachments`, file);
export const getAmendmentTimeline = (companyId) => http_get(`/api/amendments/timeline/${companyId}`);

// --- OCR (백엔드 비전 API 필요, 일단 미구현) ---
export const ocrBankbook = (file) => http_upload("/api/ocr/bankbook", file);

export { BIMOK } from "../lib/theme.js";
