import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "./auth.js";

const router = Router();
router.use(authMiddleware);

function adminOrMaster(req, res, next) {
  if (req.user.role !== "admin" && req.user.role !== "master") return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  next();
}

function groupRow(g) {
  const members = db.prepare("SELECT gm.*, u.name as user_name, u.email FROM group_members gm JOIN users u ON gm.user_id = u.id WHERE gm.group_id = ?").all(g.id);
  const projects = db.prepare("SELECT id, name, task, status FROM companies WHERE group_id = ?").all(g.id);
  return { ...g, members, projects };
}

// GET /api/groups
router.get("/", (req, res) => {
  if (req.user.role === "company") {
    const myGroups = db.prepare("SELECT g.* FROM company_groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = ?").all(req.user.id);
    return res.json(myGroups.map(groupRow));
  }
  const groups = db.prepare("SELECT * FROM company_groups ORDER BY created_at DESC").all();
  res.json(groups.map(groupRow));
});

// POST /api/groups
router.post("/", adminOrMaster, (req, res) => {
  const { name, bizNo } = req.body;
  if (!name) return res.status(400).json({ error: "기업명을 입력하세요" });
  const id = `GRP-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  db.prepare("INSERT INTO company_groups (id, name, biz_no) VALUES (?,?,?)").run(id, name, bizNo || "");
  const row = db.prepare("SELECT * FROM company_groups WHERE id = ?").get(id);
  res.status(201).json(groupRow(row));
});

// PUT /api/groups/:id
router.put("/:id", adminOrMaster, (req, res) => {
  const { name, bizNo } = req.body;
  if (name) db.prepare("UPDATE company_groups SET name = ? WHERE id = ?").run(name, req.params.id);
  if (bizNo !== undefined) db.prepare("UPDATE company_groups SET biz_no = ? WHERE id = ?").run(bizNo, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/groups/:id
router.delete("/:id", adminOrMaster, (req, res) => {
  db.prepare("UPDATE companies SET group_id = NULL WHERE group_id = ?").run(req.params.id);
  db.prepare("DELETE FROM group_members WHERE group_id = ?").run(req.params.id);
  db.prepare("DELETE FROM company_groups WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// POST /api/groups/:id/members — 담당자 추가
router.post("/:id/members", adminOrMaster, (req, res) => {
  const { userId, role } = req.body;
  if (!userId) return res.status(400).json({ error: "사용자를 선택하세요" });
  try {
    db.prepare("INSERT INTO group_members (group_id, user_id, role) VALUES (?,?,?)").run(req.params.id, userId, role || "담당자");
    // 사용자의 company 연결도 업데이트 (첫 번째 과제로)
    const firstProject = db.prepare("SELECT id FROM companies WHERE group_id = ? LIMIT 1").get(req.params.id);
    if (firstProject) db.prepare("UPDATE users SET company_id = ? WHERE id = ?").run(firstProject.id, userId);
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "이미 추가된 담당자입니다" });
    throw e;
  }
  res.json({ ok: true });
});

// DELETE /api/groups/:id/members/:userId — 담당자 제거
router.delete("/:id/members/:userId", adminOrMaster, (req, res) => {
  db.prepare("DELETE FROM group_members WHERE group_id = ? AND user_id = ?").run(req.params.id, req.params.userId);
  res.json({ ok: true });
});

// POST /api/groups/:id/projects — 과제 연결
router.post("/:id/projects", adminOrMaster, (req, res) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: "과제를 선택하세요" });
  db.prepare("UPDATE companies SET group_id = ? WHERE id = ?").run(req.params.id, projectId);
  res.json({ ok: true });
});

// DELETE /api/groups/:id/projects/:projectId — 과제 연결 해제
router.delete("/:id/projects/:projectId", adminOrMaster, (req, res) => {
  db.prepare("UPDATE companies SET group_id = NULL WHERE id = ? AND group_id = ?").run(req.params.projectId, req.params.id);
  res.json({ ok: true });
});

// GET /api/groups/my-projects — 기업 사용자: 내 그룹의 모든 과제 + 직접 연결된 과제
router.get("/my-projects", (req, res) => {
  if (req.user.role !== "company") return res.status(403).json({ error: "기업 전용" });
  const seen = new Set();
  const allProjects = [];

  // 1) 사용자 자신의 단일 과제 (user.company_id)
  if (req.user.companyId) {
    const co = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.user.companyId);
    if (co) { allProjects.push(co); seen.add(co.id); }
  }

  // 2) 사용자가 속한 그룹의 과제들
  const groups = db.prepare("SELECT g.id FROM company_groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = ?").all(req.user.id);
  for (const g of groups) {
    const projects = db.prepare("SELECT * FROM companies WHERE group_id = ?").all(g.id);
    for (const p of projects) { if (!seen.has(p.id)) { allProjects.push(p); seen.add(p.id); } }
  }

  res.json(allProjects.map((c) => ({ ...c, budget: JSON.parse(c.budget), exec: JSON.parse(c.exec_amt) })));
});

export default router;
