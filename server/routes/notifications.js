import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "./auth.js";

const router = Router();
router.use(authMiddleware);

// GET /api/notifications
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.user.id);
  res.json(rows);
});

// POST /api/notifications/read/:id
router.post("/read/:id", (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// POST /api/notifications/read-all
router.post("/read-all", (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(req.user.id);
  res.json({ ok: true });
});

export default router;

// 알림 생성 헬퍼 (다른 라우트에서 import해서 사용)
export function createNotification(userId, type, title, message) {
  db.prepare("INSERT INTO notifications (user_id, type, title, message) VALUES (?,?,?,?)").run(userId, type, title, message);
}

// 특정 역할의 모든 사용자에게 알림
export function notifyRole(role, type, title, message) {
  const users = db.prepare("SELECT id FROM users WHERE role = ?").all(role);
  const ins = db.prepare("INSERT INTO notifications (user_id, type, title, message) VALUES (?,?,?,?)");
  for (const u of users) ins.run(u.id, type, title, message);
}
