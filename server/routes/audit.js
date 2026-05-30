import { Router } from "express";
import multer from "multer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { authMiddleware, adminOnly } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = join(__dirname, "..", "uploads");

function ensureDir(dir) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); return dir; }
function companyDir(companyId) {
  const co = db.prepare("SELECT id, name FROM companies WHERE id = ?").get(companyId);
  const name = co ? co.name.replace(/[\\/:*?"<>|]/g, "_") : companyId;
  return `${companyId}_${name}`;
}

const auditStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const report = db.prepare("SELECT * FROM audit_reports WHERE id = ?").get(req.params.reportId);
    if (!report) return cb(new Error("보고서를 찾을 수 없습니다"));
    const dir = ensureDir(join(UPLOAD_ROOT, companyDir(report.company_id), "회계검토", report.id));
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage: auditStorage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

// --- 회계사 계정 관리 (관리자) ---

// GET /api/audit/auditors
router.get("/auditors", adminOnly, (_req, res) => {
  const auditors = db.prepare("SELECT id, email, name, role FROM users WHERE role = 'auditor'").all();
  const result = auditors.map((a) => {
    const assigned = db.prepare("SELECT company_id FROM auditor_assignments WHERE auditor_id = ?").all(a.id).map((r) => r.company_id);
    return { ...a, assigned };
  });
  res.json(result);
});

// POST /api/audit/auditors (관리자가 회계사 등록)
router.post("/auditors", adminOnly, (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "이름, 이메일, 비밀번호를 모두 입력하세요" });
  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "이미 등록된 이메일입니다" });
  const id = `AUD-${Date.now()}`;
  db.prepare("INSERT INTO users (id,email,password_hash,name,role) VALUES (?,?,?,?,?)")
    .run(id, email, bcrypt.hashSync(password, 10), name, "auditor");
  res.status(201).json({ id, name, email, role: "auditor", assigned: [] });
});

// --- 기업 배정 (관리자) ---

// GET /api/audit/assignments
router.get("/assignments", (req, res) => {
  const rows = db.prepare("SELECT a.company_id, a.auditor_id, u.name as auditor_name FROM auditor_assignments a JOIN users u ON a.auditor_id = u.id").all();
  res.json(rows);
});

// POST /api/audit/assignments (일괄 저장)
router.post("/assignments", adminOnly, (req, res) => {
  const { assignments } = req.body; // [{ companyId, auditorId }]
  db.prepare("DELETE FROM auditor_assignments").run();
  const ins = db.prepare("INSERT INTO auditor_assignments (auditor_id, company_id) VALUES (?,?)");
  for (const a of assignments) {
    if (a.auditorId) ins.run(a.auditorId, a.companyId);
  }
  res.json({ ok: true });
});

// --- 검토 보고서 ---

// GET /api/audit/reports
router.get("/reports", (req, res) => {
  let rows;
  if (req.user.role === "auditor") {
    const assigned = db.prepare("SELECT company_id FROM auditor_assignments WHERE auditor_id = ?").all(req.user.id).map((r) => r.company_id);
    if (assigned.length === 0) return res.json([]);
    rows = db.prepare(`SELECT * FROM audit_reports WHERE company_id IN (${assigned.map(() => "?").join(",")}) ORDER BY created_at DESC`).all(...assigned);
  } else {
    rows = db.prepare("SELECT * FROM audit_reports ORDER BY created_at DESC").all();
  }
  const result = rows.map((r) => {
    const files = db.prepare("SELECT * FROM audit_files WHERE report_id = ?").all(r.id);
    const co = db.prepare("SELECT name FROM companies WHERE id = ?").get(r.company_id);
    const auditor = db.prepare("SELECT name FROM users WHERE id = ?").get(r.auditor_id);
    return { ...r, companyName: co?.name, auditorName: auditor?.name, files };
  });
  res.json(result);
});

// POST /api/audit/reports
router.post("/reports", (req, res) => {
  if (req.user.role !== "auditor" && req.user.role !== "admin") return res.status(403).json({ error: "권한이 없습니다" });
  const { companyId, opinion, summary } = req.body;
  const id = `AU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString().slice(0, 10);
  const status = opinion ? "검토완료" : "검토중";
  db.prepare("INSERT INTO audit_reports (id,company_id,auditor_id,opinion,summary,status,submitted_at) VALUES (?,?,?,?,?,?,?)")
    .run(id, companyId, req.user.id, opinion || "", summary || "", status, now);
  const row = db.prepare("SELECT * FROM audit_reports WHERE id = ?").get(id);
  res.status(201).json(row);
});

// PUT /api/audit/reports/:id
router.put("/reports/:id", (req, res) => {
  const { opinion, summary, status } = req.body;
  const now = new Date().toISOString().slice(0, 10);
  if (opinion !== undefined) db.prepare("UPDATE audit_reports SET opinion = ? WHERE id = ?").run(opinion, req.params.id);
  if (summary !== undefined) db.prepare("UPDATE audit_reports SET summary = ? WHERE id = ?").run(summary, req.params.id);
  if (status) db.prepare("UPDATE audit_reports SET status = ?, submitted_at = ? WHERE id = ?").run(status, now, req.params.id);
  res.json({ ok: true });
});

// POST /api/audit/reports/:reportId/files
router.post("/reports/:reportId/files", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일이 필요합니다" });
  const relPath = req.file.path.replace(UPLOAD_ROOT, "").replace(/\\/g, "/").replace(/^\//, "");
  const fileId = `ARF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare("INSERT INTO audit_files (id,report_id,filename,original_name,mimetype,size) VALUES (?,?,?,?,?,?)")
    .run(fileId, req.params.reportId, relPath, req.file.originalname, req.file.mimetype, req.file.size);
  res.status(201).json({ id: fileId, filename: relPath, originalName: req.file.originalname });
});

// GET /api/audit/my-companies (회계사 전용 — 배정된 기업 목록)
router.get("/my-companies", (req, res) => {
  if (req.user.role !== "auditor") return res.status(403).json({ error: "회계사 전용" });
  const assigned = db.prepare(`
    SELECT c.*, a.auditor_id FROM auditor_assignments a
    JOIN companies c ON a.company_id = c.id
    WHERE a.auditor_id = ? ORDER BY c.id
  `).all(req.user.id);
  const result = assigned.map((c) => ({
    ...c, budget: JSON.parse(c.budget), exec: JSON.parse(c.exec_amt),
  }));
  res.json(result);
});

export default router;
