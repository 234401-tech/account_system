import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "./auth.js";

const router = Router();
router.use(authMiddleware);

function companyRow(row) {
  const researchers = db.prepare("SELECT * FROM researchers WHERE company_id = ?").all(row.id)
    .map(r => ({ ...r, salary: !!r.salary }));
  return {
    ...row,
    budget: JSON.parse(row.budget),
    exec: JSON.parse(row.exec_amt),
    researchers,
    bankName: row.bank_name || "",
    bankAccount: row.bank_account || "",
    bankHolder: row.bank_holder || "",
    govtFund: row.govt_fund || 0,
    cashFund: row.cash_fund || 0,
    inkindFund: row.inkind_fund || 0,
  };
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
  const { id, name, task, pm, period, status, consortium, budget, email, govtFund, cashFund, inkindFund } = req.body;

  const gf = Number(govtFund) || 0, cf = Number(cashFund) || 0, ikf = Number(inkindFund) || 0;
  const total = gf + cf + ikf;
  // 총사업비 = 3개 재원 합. budget이 비어있으면 자동으로 총사업비 세팅
  const budgetObj = budget && Object.keys(budget).length > 0 ? budget : { 총사업비: total };
  const emptyExec = Object.fromEntries(Object.keys(budgetObj).map(k => [k, 0]));

  db.prepare(`INSERT INTO companies (id,name,task,pm,period,status,consortium,budget,exec_amt,invite_email,govt_fund,cash_fund,inkind_fund) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, name, task, pm, period, status || "초기등록", consortium, JSON.stringify(budgetObj), JSON.stringify(emptyExec), email || null, gf, cf, ikf);

  // 총사업비 row를 budget_tree에 자동 삽입 (재원별 3행)
  if (total > 0) {
    const ins = db.prepare("INSERT INTO budget_tree (company_id, bimok, semok, sse, gwamok, budget, exec_amt, fund_source) VALUES (?,?,?,?,?,?,?,?)");
    if (gf > 0) ins.run(id, "총사업비", "기업지원비", "기업지원비", "", gf, 0, "기업지원비");
    if (cf > 0) ins.run(id, "총사업비", "민간현금", "민간부담금(현금)", "", cf, 0, "민간현금");
    if (ikf > 0) ins.run(id, "총사업비", "민간현물", "민간부담금(현물)", "", ikf, 0, "민간현물");
  }

  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(id);
  res.status(201).json(companyRow(row));
});

// PUT /api/companies/:id
router.put("/:id", (req, res) => {
  const isAdmin = req.user.role === "admin" || req.user.role === "master";
  const isOwnCompany = req.user.role === "company" && req.user.companyId === req.params.id;
  if (!isAdmin && !isOwnCompany) return res.status(403).json({ error: "권한이 없습니다" });
  const row = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "과제를 찾을 수 없습니다" });

  const { status, budget, exec, period, researchers, bankName, bankAccount, bankHolder, govtFund, cashFund, inkindFund, name, task, pm, consortium, announce } = req.body;
  if (status) db.prepare("UPDATE companies SET status = ? WHERE id = ?").run(status, req.params.id);
  if (bankName !== undefined) db.prepare("UPDATE companies SET bank_name = ? WHERE id = ?").run(bankName, req.params.id);
  if (bankAccount !== undefined) db.prepare("UPDATE companies SET bank_account = ? WHERE id = ?").run(bankAccount, req.params.id);
  if (bankHolder !== undefined) db.prepare("UPDATE companies SET bank_holder = ? WHERE id = ?").run(bankHolder, req.params.id);
  if (budget) db.prepare("UPDATE companies SET budget = ? WHERE id = ?").run(JSON.stringify(budget), req.params.id);
  if (exec) db.prepare("UPDATE companies SET exec_amt = ? WHERE id = ?").run(JSON.stringify(exec), req.params.id);
  if (period) db.prepare("UPDATE companies SET period = ? WHERE id = ?").run(period, req.params.id);
  if (name) db.prepare("UPDATE companies SET name = ? WHERE id = ?").run(name, req.params.id);
  if (task) db.prepare("UPDATE companies SET task = ? WHERE id = ?").run(task, req.params.id);
  if (pm) db.prepare("UPDATE companies SET pm = ? WHERE id = ?").run(pm, req.params.id);
  if (consortium) db.prepare("UPDATE companies SET consortium = ? WHERE id = ?").run(consortium, req.params.id);

  // 재원 변경 시 총사업비 자동 재계산 + budget_tree의 총사업비 row도 재생성
  if (govtFund !== undefined || cashFund !== undefined || inkindFund !== undefined) {
    const cur = db.prepare("SELECT govt_fund, cash_fund, inkind_fund FROM companies WHERE id = ?").get(req.params.id);
    const gf = govtFund !== undefined ? Number(govtFund) || 0 : cur.govt_fund || 0;
    const cf = cashFund !== undefined ? Number(cashFund) || 0 : cur.cash_fund || 0;
    const ikf = inkindFund !== undefined ? Number(inkindFund) || 0 : cur.inkind_fund || 0;
    db.prepare("UPDATE companies SET govt_fund = ?, cash_fund = ?, inkind_fund = ? WHERE id = ?").run(gf, cf, ikf, req.params.id);
    const total = gf + cf + ikf;
    db.prepare("UPDATE companies SET budget = ? WHERE id = ?").run(JSON.stringify({ 총사업비: total }), req.params.id);
    // budget_tree의 총사업비 row만 교체
    db.prepare("DELETE FROM budget_tree WHERE company_id = ? AND bimok = '총사업비'").run(req.params.id);
    const ins = db.prepare("INSERT INTO budget_tree (company_id,bimok,semok,sse,gwamok,budget,exec_amt,fund_source) VALUES (?,?,?,?,?,?,?,?)");
    if (gf > 0) ins.run(req.params.id, "총사업비", "기업지원비", "기업지원비", "", gf, 0, "기업지원비");
    if (cf > 0) ins.run(req.params.id, "총사업비", "민간현금", "민간부담금(현금)", "", cf, 0, "민간현금");
    if (ikf > 0) ins.run(req.params.id, "총사업비", "민간현물", "민간부담금(현물)", "", ikf, 0, "민간현물");
  }

  if (researchers) {
    db.prepare("DELETE FROM researchers WHERE company_id = ?").run(req.params.id);
    const ins = db.prepare("INSERT INTO researchers (id,company_id,name,role,position,rate,period,salary) VALUES (?,?,?,?,?,?,?,?)");
    for (const r of researchers) {
      const rid = r.id.includes(req.params.id) ? r.id : `${r.id}-${req.params.id}`;
      ins.run(rid, req.params.id, r.name, r.role, r.position, r.rate, r.period, r.salary ? 1 : 0);
    }
  }

  const updated = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.params.id);
  res.json(companyRow(updated));
});

// DELETE /api/companies/:id
router.delete("/:id", (req, res) => {
  if (req.user.role !== "admin" && req.user.role !== "master") return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  db.prepare("DELETE FROM researchers WHERE company_id = ?").run(req.params.id);
  db.prepare("DELETE FROM budget_tree WHERE company_id = ?").run(req.params.id);
  db.prepare("DELETE FROM ledger WHERE company_id = ?").run(req.params.id);
  db.prepare("DELETE FROM companies WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// --- 예산 트리 ---

// GET /api/companies/:id/budget
router.get("/:id/budget", (req, res) => {
  if (req.user.role === "company" && req.user.companyId !== req.params.id)
    return res.status(403).json({ error: "접근 권한이 없습니다" });
  if (req.user.role === "auditor") {
    const assigned = db.prepare("SELECT 1 FROM auditor_assignments WHERE auditor_id = ? AND company_id = ?").get(req.user.id, req.params.id);
    if (!assigned) return res.status(403).json({ error: "배정되지 않은 기업입니다" });
  }
  const rows = db.prepare("SELECT * FROM budget_tree WHERE company_id = ? ORDER BY id").all(req.params.id);
  res.json(rows);
});

// PUT /api/companies/:id/budget
router.put("/:id/budget", (req, res) => {
  const { rows } = req.body;
  db.prepare("DELETE FROM budget_tree WHERE company_id = ?").run(req.params.id);
  const ins = db.prepare("INSERT INTO budget_tree (company_id,bimok,semok,sse,gwamok,budget,exec_amt,fund_source) VALUES (?,?,?,?,?,?,?,?)");
  for (const r of rows) {
    ins.run(req.params.id, r.bimok, r.semok, r.sse, r.gwamok, r.budget, r.exec_amt || 0, r.fund_source || r.fundSource || null);
  }
  const updated = db.prepare("SELECT * FROM budget_tree WHERE company_id = ? ORDER BY id").all(req.params.id);
  res.json(updated);
});

// --- 집행 원장 ---

// GET /api/companies/:id/ledger
router.get("/:id/ledger", (req, res) => {
  if (req.user.role === "company" && req.user.companyId !== req.params.id)
    return res.status(403).json({ error: "접근 권한이 없습니다" });
  if (req.user.role === "auditor") {
    const assigned = db.prepare("SELECT 1 FROM auditor_assignments WHERE auditor_id = ? AND company_id = ?").get(req.user.id, req.params.id);
    if (!assigned) return res.status(403).json({ error: "배정되지 않은 기업입니다" });
  }
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

  // 재원별 잔액 검증 (총사업비 row 기준)
  const fundBudget = { 기업지원비: 0, 민간현금: 0, 민간현물: 0 };
  const fundExec = { 기업지원비: 0, 민간현금: 0, 민간현물: 0 };
  const co = db.prepare("SELECT govt_fund, cash_fund, inkind_fund FROM companies WHERE id = ?").get(req.params.id);
  if (co) {
    fundBudget.기업지원비 = co.govt_fund || 0;
    fundBudget.민간현금 = co.cash_fund || 0;
    fundBudget.민간현물 = co.inkind_fund || 0;
  }
  const existing = db.prepare("SELECT amount, fund_source FROM ledger WHERE company_id = ?").all(req.params.id);
  for (const e of existing) {
    if (e.fund_source && fundExec[e.fund_source] !== undefined) fundExec[e.fund_source] += e.amount || 0;
  }
  const reqByFund = { 기업지원비: 0, 민간현금: 0, 민간현물: 0 };
  for (const e of entries) {
    const fs = e.fund_source || e.fundSource;
    if (!fs) return res.status(400).json({ error: "재원(fund_source) 선택이 필요합니다" });
    if (reqByFund[fs] === undefined) return res.status(400).json({ error: `유효하지 않은 재원: ${fs}` });
    reqByFund[fs] += Number(e.amount) || 0;
  }
  for (const f of Object.keys(reqByFund)) {
    const remain = fundBudget[f] - fundExec[f];
    if (reqByFund[f] > remain) {
      return res.status(400).json({ error: `재원 [${f}] 잔액 부족: 잔액 ${remain.toLocaleString()}원, 요청 ${reqByFund[f].toLocaleString()}원` });
    }
  }

  const ins = db.prepare(`INSERT INTO ledger (id,company_id,date,description,payee,amount,bimok,fund,reg,evidence_status,fund_source) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

  const inserted = [];
  for (const e of entries) {
    const id = e.id || `L${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    ins.run(id, req.params.id, e.date, e.description || e.desc, e.payee, e.amount, e.bimok, e.fund || "국비", e.reg || "직접등록", "미첨부", e.fund_source || e.fundSource);
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
