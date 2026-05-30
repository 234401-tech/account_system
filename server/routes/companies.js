import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "./auth.js";

const router = Router();
router.use(authMiddleware);

function companyRow(row) {
  const researchers = db.prepare("SELECT * FROM researchers WHERE company_id = ?").all(row.id)
    .map(r => ({ ...r, salary: !!r.salary }));
  return { ...row, budget: JSON.parse(row.budget), exec: JSON.parse(row.exec_amt), researchers };
}

// GET /api/companies
router.get("/", (req, res) => {
  if (req.user.role === "company") {
    const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.user.companyId);
    return res.json(row ? [companyRow(row)] : []);
  }
  const rows = db.prepare("SELECT * FROM companies ORDER BY id").all();
  res.json(rows.map(companyRow));
});

// GET /api/companies/:id
router.get("/:id", (req, res) => {
  if (req.user.role === "company" && req.user.companyId !== req.params.id)
    return res.status(403).json({ error: "접근 권한이 없습니다" });
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "과제를 찾을 수 없습니다" });
  res.json(companyRow(row));
});

// POST /api/companies (과제 발급 — 관리자)
router.post("/", (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "master") return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  const { id, name, task, pm, period, status, consortium, budget, email } = req.body;

  const emptyExec = Object.fromEntries(Object.keys(budget).map(k => [k, 0]));
  db.prepare(`INSERT INTO companies (id,name,task,pm,period,status,consortium,budget,exec_amt,invite_email) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, name, task, pm, period, status || "초기등록", consortium, JSON.stringify(budget), JSON.stringify(emptyExec), email || null);

  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(id);
  res.status(201).json(companyRow(row));
});

// PUT /api/companies/:id
router.put("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "과제를 찾을 수 없습니다" });

  const { status, budget, exec, period, researchers } = req.body;
  if (status) db.prepare("UPDATE companies SET status = ? WHERE id = ?").run(status, req.params.id);
  if (budget) db.prepare("UPDATE companies SET budget = ? WHERE id = ?").run(JSON.stringify(budget), req.params.id);
  if (exec) db.prepare("UPDATE companies SET exec_amt = ? WHERE id = ?").run(JSON.stringify(exec), req.params.id);
  if (period) db.prepare("UPDATE companies SET period = ? WHERE id = ?").run(period, req.params.id);

  if (researchers) {
    db.prepare("DELETE FROM researchers WHERE company_id = ?").run(req.params.id);
    const ins = db.prepare("INSERT INTO researchers (id,company_id,name,role,position,rate,period,salary) VALUES (?,?,?,?,?,?,?,?)");
    for (const r of researchers) {
      ins.run(r.id, req.params.id, r.name, r.role, r.position, r.rate, r.period, r.salary ? 1 : 0);
    }
  }

  const updated = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id);
  res.json(companyRow(updated));
});

// --- 예산 트리 ---

// GET /api/companies/:id/budget
router.get("/:id/budget", (req, res) => {
  if (req.user.role === "company" && req.user.companyId !== req.params.id)
    return res.status(403).json({ error: "접근 권한이 없습니다" });
  const rows = db.prepare("SELECT * FROM budget_tree WHERE company_id = ? ORDER BY id").all(req.params.id);
  res.json(rows);
});

// PUT /api/companies/:id/budget
router.put("/:id/budget", (req, res) => {
  const { rows } = req.body;
  db.prepare("DELETE FROM budget_tree WHERE company_id = ?").run(req.params.id);
  const ins = db.prepare("INSERT INTO budget_tree (company_id,bimok,semok,sse,gwamok,budget,exec_amt) VALUES (?,?,?,?,?,?,?)");
  for (const r of rows) {
    ins.run(req.params.id, r.bimok, r.semok, r.sse, r.gwamok, r.budget, r.exec_amt || 0);
  }
  const updated = db.prepare("SELECT * FROM budget_tree WHERE company_id = ? ORDER BY id").all(req.params.id);
  res.json(updated);
});

// --- 집행 원장 ---

// GET /api/companies/:id/ledger
router.get("/:id/ledger", (req, res) => {
  if (req.user.role === "company" && req.user.companyId !== req.params.id)
    return res.status(403).json({ error: "접근 권한이 없습니다" });
  const rows = db.prepare("SELECT * FROM ledger WHERE company_id = ? ORDER BY date, id").all(req.params.id);
  const withFiles = rows.map(r => {
    const files = db.prepare("SELECT * FROM evidence_files WHERE ledger_id = ?").all(r.id);
    return { ...r, evidenceFiles: files };
  });
  res.json(withFiles);
});

// POST /api/companies/:id/ledger
router.post("/:id/ledger", (req, res) => {
  const { entries } = req.body;
  const ins = db.prepare(`INSERT INTO ledger (id,company_id,date,description,payee,amount,bimok,fund,reg,evidence_status) VALUES (?,?,?,?,?,?,?,?,?,?)`);

  const inserted = [];
  for (const e of entries) {
    const id = e.id || `L${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    ins.run(id, req.params.id, e.date, e.description || e.desc, e.payee, e.amount, e.bimok, e.fund || "국비", e.reg || "직접등록", "미첨부");
    inserted.push(id);
  }

  // 예산 트리 exec 재계산
  recalcBudgetTreeExec(req.params.id);

  const rows = db.prepare(`SELECT * FROM ledger WHERE id IN (${inserted.map(() => "?").join(",")})`)
    .all(...inserted);
  res.status(201).json(rows);
});

function recalcBudgetTreeExec(companyId) {
  const ledgerRows = db.prepare("SELECT bimok, SUM(amount) as total FROM ledger WHERE company_id = ? GROUP BY bimok").all(companyId);
  const gwamokTotals = Object.fromEntries(ledgerRows.map(r => [r.bimok, r.total]));

  const budgetRows = db.prepare("SELECT id, gwamok FROM budget_tree WHERE company_id = ?").all(companyId);

  const gwamokBudgetRows = {};
  for (const br of budgetRows) {
    if (!gwamokBudgetRows[br.gwamok]) gwamokBudgetRows[br.gwamok] = [];
    gwamokBudgetRows[br.gwamok].push(br.id);
  }

  const update = db.prepare("UPDATE budget_tree SET exec_amt = ? WHERE id = ?");
  db.prepare("UPDATE budget_tree SET exec_amt = 0 WHERE company_id = ?").run(companyId);

  for (const [gwamok, total] of Object.entries(gwamokTotals)) {
    const ids = gwamokBudgetRows[gwamok];
    if (ids && ids.length > 0) {
      update.run(total, ids[0]);
    }
  }
}

// 다음 과제 ID
router.get("/_next-id", authMiddleware, (_req, res) => {
  const rows = db.prepare("SELECT id FROM companies").all();
  const nums = rows.map(r => parseInt(r.id.split("-")[2])).filter(n => !isNaN(n));
  const next = `C-2026-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0")}`;
  res.json({ id: next });
});

export default router;
