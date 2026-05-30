import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { authMiddleware } from "./auth.js";

const router = Router();
router.use(authMiddleware);

// 관리자 또는 마스터만 접근
function adminOrMaster(req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "master") return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  next();
}

// GET /api/users — 전체 계정 목록
router.get("/", adminOrMaster, (req, res) => {
  const users = db.prepare("SELECT id, email, name, role, company_id, created_at FROM users ORDER BY created_at DESC").all();
  const result = users.map((u) => {
    const co = u.company_id ? db.prepare("SELECT name FROM companies WHERE id = ?").get(u.company_id) : null;
    return { ...u, companyName: co?.name || null };
  });
  res.json(result);
});

// POST /api/users — 계정 생성
router.post("/", adminOrMaster, (req, res) => {
  const { name, email, password, role, companyId } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: "필수 항목을 모두 입력하세요" });
  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "이미 등록된 이메일입니다" });
  const id = `U-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare("INSERT INTO users (id,email,password_hash,name,role,company_id) VALUES (?,?,?,?,?,?)")
    .run(id, email, bcrypt.hashSync(password, 10), name, role, companyId || null);
  res.status(201).json({ id, email, name, role, company_id: companyId || null });
});

// PUT /api/users/:id — 계정 수정
router.put("/:id", adminOrMaster, (req, res) => {
  const { name, email, role, companyId, password } = req.body;
  if (name) db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, req.params.id);
  if (email) db.prepare("UPDATE users SET email = ? WHERE id = ?").run(email, req.params.id);
  if (role) db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
  if (companyId !== undefined) db.prepare("UPDATE users SET company_id = ? WHERE id = ?").run(companyId || null, req.params.id);
  if (password) db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password, 10), req.params.id);
  res.json({ ok: true });
});

// DELETE /api/users/:id — 계정 삭제
router.delete("/:id", adminOrMaster, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: "본인 계정은 삭제할 수 없습니다" });
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// GET /api/users/signup-requests — 가입 승인 대기
router.get("/signup-requests", adminOrMaster, (_req, res) => {
  const list = db.prepare("SELECT * FROM signup_requests ORDER BY created_at DESC").all();
  res.json(list);
});

export default router;
