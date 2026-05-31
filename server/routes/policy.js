import { Router } from "express";
import multer from "multer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, unlinkSync } from "fs";
import db from "../db.js";
import { authMiddleware } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = join(__dirname, "..", "uploads");

function ensureDir(dir) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); return dir; }
function companyDir(companyId) {
  const co = db.prepare("SELECT id, name FROM companies WHERE id = ?").get(companyId);
  const name = co ? co.name.replace(/[\\/:*?"<>|]/g, "_") : companyId;
  return `${companyId}_${name}`;
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = ensureDir(join(UPLOAD_ROOT, companyDir(req.params.companyId), "정책규정"));
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    cb(null, `${ts}_${Buffer.from(file.originalname, "latin1").toString("utf8")}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

// 권한: company는 본인 과제만, admin/master/auditor는 전체
function checkAccess(req) {
  const cid = req.params.companyId;
  if (req.user.role === "company" && req.user.companyId !== cid) return false;
  if (req.user.role === "auditor") {
    const a = db.prepare("SELECT 1 FROM auditor_assignments WHERE auditor_id = ? AND company_id = ?").get(req.user.id, cid);
    if (!a) return false;
  }
  return true;
}
function canEdit(req) {
  const cid = req.params.companyId;
  if (req.user.role === "admin" || req.user.role === "master") return true;
  if (req.user.role === "company" && req.user.companyId === cid) return true;
  return false;
}

// GET /api/policy/:companyId — 기준 항목 + 파일 목록
router.get("/:companyId", (req, res) => {
  if (!checkAccess(req)) return res.status(403).json({ error: "접근 권한이 없습니다" });
  const items = db.prepare("SELECT * FROM policy_items WHERE company_id = ? ORDER BY sort_order, id").all(req.params.companyId);
  const files = db.prepare("SELECT * FROM policy_files WHERE company_id = ? ORDER BY uploaded_at DESC").all(req.params.companyId);
  res.json({ items, files });
});

// POST /api/policy/:companyId/items — 항목 추가
router.post("/:companyId/items", (req, res) => {
  if (!canEdit(req)) return res.status(403).json({ error: "수정 권한이 없습니다" });
  const { item, content, status } = req.body;
  if (!item || !content) return res.status(400).json({ error: "기준 항목과 적용 내용을 입력하세요" });
  const r = db.prepare("INSERT INTO policy_items (company_id, item, content, status) VALUES (?,?,?,?)").run(req.params.companyId, item, content, status || "등록");
  res.status(201).json({ id: r.lastInsertRowid });
});

// PUT /api/policy/:companyId/items/:id — 항목 수정
router.put("/:companyId/items/:id", (req, res) => {
  if (!canEdit(req)) return res.status(403).json({ error: "수정 권한이 없습니다" });
  const { item, content, status } = req.body;
  db.prepare("UPDATE policy_items SET item = ?, content = ?, status = ? WHERE id = ? AND company_id = ?").run(item, content, status, req.params.id, req.params.companyId);
  res.json({ ok: true });
});

// DELETE /api/policy/:companyId/items/:id — 항목 삭제
router.delete("/:companyId/items/:id", (req, res) => {
  if (!canEdit(req)) return res.status(403).json({ error: "수정 권한이 없습니다" });
  db.prepare("DELETE FROM policy_items WHERE id = ? AND company_id = ?").run(req.params.id, req.params.companyId);
  res.json({ ok: true });
});

// POST /api/policy/:companyId/files — 파일 업로드
router.post("/:companyId/files", upload.single("file"), (req, res) => {
  if (!canEdit(req)) return res.status(403).json({ error: "업로드 권한이 없습니다" });
  if (!req.file) return res.status(400).json({ error: "파일이 없습니다" });
  const orig = Buffer.from(req.file.originalname, "latin1").toString("utf8");
  const relPath = `${companyDir(req.params.companyId)}/정책규정/${req.file.filename}`;
  const r = db.prepare("INSERT INTO policy_files (company_id, filename, original_name, size) VALUES (?,?,?,?)").run(req.params.companyId, relPath, orig, req.file.size);
  res.status(201).json({ id: r.lastInsertRowid, filename: relPath, original_name: orig, size: req.file.size });
});

// DELETE /api/policy/:companyId/files/:id — 파일 삭제
router.delete("/:companyId/files/:id", (req, res) => {
  if (!canEdit(req)) return res.status(403).json({ error: "삭제 권한이 없습니다" });
  const f = db.prepare("SELECT * FROM policy_files WHERE id = ? AND company_id = ?").get(req.params.id, req.params.companyId);
  if (!f) return res.status(404).json({ error: "파일을 찾을 수 없습니다" });
  try { unlinkSync(join(UPLOAD_ROOT, f.filename)); } catch {}
  db.prepare("DELETE FROM policy_files WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
