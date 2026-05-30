import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = Router();
const SECRET = process.env.JWT_SECRET || "settlement-monitor-dev-secret-2026";
const EXPIRES = "7d";

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, companyId: user.company_id }, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ error: "인증이 필요합니다" });
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch { return res.status(401).json({ error: "유효하지 않은 토큰입니다" }); }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin" && req.user?.role !== "master") return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  next();
}

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "계정을 찾을 수 없습니다" });

  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: "비밀번호가 일치하지 않습니다" });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.company_id } });
});

// GET /api/auth/me
router.get("/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT id, email, name, role, company_id FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.company_id });
});

// POST /api/auth/signup
router.post("/signup", (req, res) => {
  const { bizNo, companyName, contactName, email, password } = req.body;
  if (!companyName || !contactName || !email || !password) return res.status(400).json({ error: "필수 항목을 모두 입력하세요" });

  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "이미 등록된 이메일입니다" });

  // 초대 이메일 자동 매칭: 과제 발급 시 입력한 이메일과 일치하면 즉시 계정 생성 + 과제 연결
  const matched = db.prepare("SELECT id FROM companies WHERE invite_email = ?").get(email);
  if (matched) {
    const userId = `U-${matched.id}`;
    db.prepare("INSERT INTO users (id, email, password_hash, name, role, company_id) VALUES (?,?,?,?,?,?)")
      .run(userId, email, bcrypt.hashSync(password, 10), contactName, "company", matched.id);
    const token = signToken({ id: userId, role: "company", company_id: matched.id });
    return res.status(201).json({
      token,
      user: { id: userId, email, name: contactName, role: "company", companyId: matched.id },
      message: `과제 ${matched.id}와 자동 매칭되었습니다. 바로 이용 가능합니다.`,
    });
  }

  // 매칭 안 되면 승인 대기
  const id = `SR-${Date.now()}`;
  db.prepare(`INSERT INTO signup_requests (id, biz_no, company_name, contact_name, email, password_hash, status) VALUES (?,?,?,?,?,?,?)`)
    .run(id, bizNo || "", companyName, contactName, email, bcrypt.hashSync(password, 10), "대기");

  res.status(201).json({ id, status: "대기", message: "가입 신청이 접수되었습니다. 관리자 승인 후 이용 가능합니다." });
});

// GET /api/auth/signup-requests (관리자)
router.get("/signup-requests", authMiddleware, adminOnly, (_req, res) => {
  const list = db.prepare("SELECT id, biz_no, company_name, contact_name, email, status, created_at FROM signup_requests ORDER BY created_at DESC").all();
  res.json(list);
});

// POST /api/auth/signup-requests/:id/approve (관리자)
router.post("/signup-requests/:id/approve", authMiddleware, adminOnly, (req, res) => {
  const sr = db.prepare("SELECT * FROM signup_requests WHERE id = ?").get(req.params.id);
  if (!sr) return res.status(404).json({ error: "신청을 찾을 수 없습니다" });
  if (sr.status !== "대기") return res.status(400).json({ error: "이미 처리된 신청입니다" });

  const userId = `U-SR-${Date.now()}`;
  db.prepare("INSERT INTO users (id, email, password_hash, name, role, company_id) VALUES (?,?,?,?,?,?)")
    .run(userId, sr.email, sr.password_hash, sr.contact_name, "company", req.body.companyId || null);
  db.prepare("UPDATE signup_requests SET status = '승인' WHERE id = ?").run(sr.id);

  res.json({ userId, message: "승인 완료" });
});

// POST /api/auth/signup-requests/:id/reject (관리자)
router.post("/signup-requests/:id/reject", authMiddleware, adminOnly, (req, res) => {
  db.prepare("UPDATE signup_requests SET status = '반려' WHERE id = ? AND status = '대기'").run(req.params.id);
  res.json({ message: "반려 처리되었습니다" });
});

export default router;
