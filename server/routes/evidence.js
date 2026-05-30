import { Router } from "express";
import multer from "multer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import db from "../db.js";
import { authMiddleware } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = join(__dirname, "..", "uploads");
if (!existsSync(UPLOAD_ROOT)) mkdirSync(UPLOAD_ROOT, { recursive: true });

// 기업 폴더명 생성: C-2026-001_뉴로메카
function companyDir(companyId) {
  const co = db.prepare("SELECT id, name FROM companies WHERE id = ?").get(companyId);
  const name = co ? co.name.replace(/[\\/:*?"<>|]/g, "_") : companyId;
  return `${companyId}_${name}`;
}

// 폴더 확인 및 생성
function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

// 증빙 업로드: uploads/{기업}_{기업명}/증빙/{전표번호}_{날짜}_{내용}/원본파일명
const evidenceStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const txn = db.prepare("SELECT * FROM ledger WHERE id = ?").get(req.params.txnId);
    if (!txn) return cb(new Error("전표를 찾을 수 없습니다"));
    const coDir = companyDir(txn.company_id);
    const desc = (txn.description || "").replace(/[\\/:*?"<>|]/g, "_").substring(0, 30);
    const folderName = `${txn.id}_${txn.date}_${desc}`.trim();
    const dir = ensureDir(join(UPLOAD_ROOT, coDir, "증빙", folderName));
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const evidenceUpload = multer({ storage: evidenceStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// 협약변경 첨부: uploads/{기업}_{기업명}/협약변경/{신청번호}_{변경유형}/원본파일명
const amendStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const amend = db.prepare("SELECT * FROM amendments WHERE id = ?").get(req.params.id);
    if (!amend) return cb(new Error("협약변경을 찾을 수 없습니다"));
    const coDir = companyDir(amend.company_id);
    const typeName = (amend.type || "").replace(/[\\/:*?"<>|]/g, "_");
    const folderName = `${amend.id}_${typeName}`;
    const dir = ensureDir(join(UPLOAD_ROOT, coDir, "협약변경", folderName));
    cb(null, dir);
  },
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const amendUpload = multer({ storage: amendStorage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

// POST /api/ledger/:txnId/evidence
router.post("/:txnId/evidence", evidenceUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일이 필요합니다" });

  const txn = db.prepare("SELECT * FROM ledger WHERE id = ?").get(req.params.txnId);
  if (!txn) return res.status(404).json({ error: "전표를 찾을 수 없습니다" });

  // DB에는 UPLOAD_ROOT 기준 상대경로 저장
  const relPath = req.file.path.replace(UPLOAD_ROOT, "").replace(/\\/g, "/").replace(/^\//, "");
  const fileId = `EF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare("INSERT INTO evidence_files (id,ledger_id,filename,original_name,mimetype,size) VALUES (?,?,?,?,?,?)")
    .run(fileId, req.params.txnId, relPath, req.file.originalname, req.file.mimetype, req.file.size);

  db.prepare("UPDATE ledger SET evidence_status = '첨부' WHERE id = ?").run(req.params.txnId);

  res.status(201).json({
    id: fileId,
    filename: relPath,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// GET /api/ledger/:txnId/evidence
router.get("/:txnId/evidence", (req, res) => {
  const files = db.prepare("SELECT * FROM evidence_files WHERE ledger_id = ?").all(req.params.txnId);
  res.json(files);
});

// POST /api/ledger/:txnId/evidence/review
router.post("/:txnId/evidence/review", (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "master") return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  db.prepare("UPDATE ledger SET evidence_status = '검토완료' WHERE id = ?").run(req.params.txnId);
  res.json({ ok: true });
});

// POST /api/ledger/amendments/:id/attachments
router.post("/amendments/:id/attachments", amendUpload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일이 필요합니다" });

  const relPath = req.file.path.replace(UPLOAD_ROOT, "").replace(/\\/g, "/").replace(/^\//, "");
  const fileId = `AF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare("INSERT INTO amendment_files (id,amendment_id,filename,original_name,mimetype,size) VALUES (?,?,?,?,?,?)")
    .run(fileId, req.params.id, relPath, req.file.originalname, req.file.mimetype, req.file.size);

  res.status(201).json({
    id: fileId,
    filename: relPath,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

export default router;
