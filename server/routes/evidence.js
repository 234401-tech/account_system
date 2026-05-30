import { Router } from "express";
import multer from "multer";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import db from "../db.js";
import { authMiddleware } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, "..", "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

// POST /api/ledger/:txnId/evidence
router.post("/:txnId/evidence", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일이 필요합니다" });

  const txn = db.prepare("SELECT * FROM ledger WHERE id = ?").get(req.params.txnId);
  if (!txn) return res.status(404).json({ error: "전표를 찾을 수 없습니다" });

  const fileId = `EF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare("INSERT INTO evidence_files (id,ledger_id,filename,original_name,mimetype,size) VALUES (?,?,?,?,?,?)")
    .run(fileId, req.params.txnId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

  db.prepare("UPDATE ledger SET evidence_status = '첨부' WHERE id = ?").run(req.params.txnId);

  res.status(201).json({
    id: fileId,
    filename: req.file.filename,
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
  if (req.user.role !== "admin") return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  db.prepare("UPDATE ledger SET evidence_status = '검토완료' WHERE id = ?").run(req.params.txnId);
  res.json({ ok: true });
});

// POST /api/amendments/:id/attachments
router.post("/amendments/:id/attachments", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일이 필요합니다" });

  const fileId = `AF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare("INSERT INTO amendment_files (id,amendment_id,filename,original_name,mimetype,size) VALUES (?,?,?,?,?,?)")
    .run(fileId, req.params.id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

  res.status(201).json({
    id: fileId,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

export default router;
