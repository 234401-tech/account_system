import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "./auth.js";
import { createNotification, notifyRole } from "./notifications.js";

const router = Router();
router.use(authMiddleware);

function amendRow(row) {
  const detail = JSON.parse(row.detail || "{}");
  const files = db.prepare("SELECT * FROM amendment_files WHERE amendment_id = ?").all(row.id);
  return {
    id: row.id,
    companyId: row.company_id,
    company: row.company_name,
    type: row.type,
    reason: row.reason,
    submittedAt: row.submitted_at,
    status: row.status,
    reviewComment: row.review_comment || "",
    reviewedAt: row.reviewed_at || "",
    attachments: files,
    ...detail,
  };
}

// GET /api/amendments
router.get("/", (req, res) => {
  let rows;
  if (req.user.role === "company") {
    rows = db.prepare("SELECT * FROM amendments WHERE company_id = ? ORDER BY submitted_at DESC").all(req.user.companyId);
  } else {
    rows = db.prepare("SELECT * FROM amendments ORDER BY submitted_at DESC").all();
  }
  res.json(rows.map(amendRow));
});

// POST /api/amendments
router.post("/", (req, res) => {
  const { id, companyId, company, type, reason, detail } = req.body;
  const amendId = id || `AM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString().slice(0, 10);

  try {
    db.prepare(`INSERT INTO amendments (id,company_id,company_name,type,reason,submitted_at,status,detail) VALUES (?,?,?,?,?,?,?,?)`)
      .run(amendId, companyId, company, type, reason || "", now, "검토중", JSON.stringify(detail || {}));
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "이미 동일한 신청번호가 존재합니다. 다시 시도해주세요." });
    throw e;
  }

  const row = db.prepare("SELECT * FROM amendments WHERE id = ?").get(amendId);
  notifyRole("admin", "amend", "협약변경 신청", `${company}에서 ${type}을 신청했습니다.`);
  notifyRole("master", "amend", "협약변경 신청", `${company}에서 ${type}을 신청했습니다.`);
  res.status(201).json(amendRow(row));
});

// POST /api/amendments/:id/decision
router.post("/:id/decision", (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "master") return res.status(403).json({ error: "관리자 권한이 필요합니다" });

  const { decision, comment } = req.body;
  const now = new Date().toISOString().slice(0, 10);

  db.prepare("UPDATE amendments SET status = ?, review_comment = ?, reviewed_at = ? WHERE id = ?")
    .run(decision, comment || "", now, req.params.id);

  // 승인 시 기업 과제에 반영
  const amend = db.prepare("SELECT * FROM amendments WHERE id = ?").get(req.params.id);
  if (decision === "승인" && amend) {
    const detail = JSON.parse(amend.detail || "{}");
    if (amend.type === "사업비 변경" && detail.after) {
      db.prepare("UPDATE companies SET budget = ? WHERE id = ?").run(JSON.stringify(detail.after), amend.company_id);
    } else if (amend.type === "연구기간 변경" && detail.periodAfter) {
      db.prepare("UPDATE companies SET period = ? WHERE id = ?").run(detail.periodAfter, amend.company_id);
    } else if (amend.type === "참여연구원 변경" && detail.researchersAfter) {
      db.prepare("DELETE FROM researchers WHERE company_id = ?").run(amend.company_id);
      const ins = db.prepare("INSERT INTO researchers (id,company_id,name,role,position,rate,period,salary) VALUES (?,?,?,?,?,?,?,?)");
      for (const r of detail.researchersAfter) {
        ins.run(r.id, amend.company_id, r.name, r.role, r.position, r.rate, r.period, r.salary ? 1 : 0);
      }
    }
  }

  const row = db.prepare("SELECT * FROM amendments WHERE id = ?").get(req.params.id);
  // 기업 담당자에게 알림
  const companyUser = db.prepare("SELECT id FROM users WHERE company_id = ?").get(amend.company_id);
  if (companyUser) createNotification(companyUser.id, "amend", `협약변경 ${decision}`, `${amend.type} 신청이 ${decision}되었습니다.${comment ? " 사유: " + comment : ""}`);
  res.json(amendRow(row));
});

// GET /api/companies/:companyId/amendment-timeline
router.get("/timeline/:companyId", (req, res) => {
  const rows = db.prepare("SELECT * FROM amendments WHERE company_id = ? ORDER BY submitted_at ASC").all(req.params.companyId);
  const events = [];
  for (const a of rows) {
    const detail = JSON.parse(a.detail || "{}");
    const files = db.prepare("SELECT * FROM amendment_files WHERE amendment_id = ?").all(a.id);
    events.push({ date: a.submitted_at, action: "신청", amendId: a.id, type: a.type, reason: a.reason, status: a.status, attachmentCount: files.length });
    if (a.reviewed_at) {
      events.push({ date: a.reviewed_at, action: a.status, amendId: a.id, type: a.type, comment: a.review_comment });
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  res.json(events);
});

export default router;
