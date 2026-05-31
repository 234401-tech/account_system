import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);

const db = new Database(join(DATA_DIR, "app.db"), { verbose: null });

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL CHECK(role IN ('company','admin','master','auditor')),
    company_id    TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS signup_requests (
    id            TEXT PRIMARY KEY,
    biz_no        TEXT,
    company_name  TEXT NOT NULL,
    contact_name  TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status        TEXT DEFAULT '대기' CHECK(status IN ('대기','승인','반려')),
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS companies (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    task          TEXT NOT NULL,
    pm            TEXT NOT NULL,
    period        TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT '초기등록',
    consortium    TEXT,
    budget        TEXT NOT NULL DEFAULT '{}',
    exec_amt      TEXT NOT NULL DEFAULT '{}',
    invite_email  TEXT,
    group_id      TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES company_groups(id)
  );

  CREATE TABLE IF NOT EXISTS researchers (
    id          TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL,
    position    TEXT,
    rate        INTEGER DEFAULT 0,
    period      TEXT,
    salary      INTEGER DEFAULT 1,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS budget_tree (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id  TEXT NOT NULL,
    bimok       TEXT NOT NULL,
    semok       TEXT,
    sse         TEXT,
    gwamok      TEXT,
    budget      INTEGER DEFAULT 0,
    exec_amt    INTEGER DEFAULT 0,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id          TEXT PRIMARY KEY,
    company_id  TEXT NOT NULL,
    date        TEXT NOT NULL,
    description TEXT,
    payee       TEXT,
    amount      INTEGER DEFAULT 0,
    bimok       TEXT,
    fund        TEXT DEFAULT '국비',
    reg         TEXT,
    evidence_status TEXT DEFAULT '미첨부' CHECK(evidence_status IN ('미첨부','첨부','검토완료')),
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS evidence_files (
    id          TEXT PRIMARY KEY,
    ledger_id   TEXT NOT NULL,
    filename    TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mimetype    TEXT,
    size        INTEGER,
    uploaded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (ledger_id) REFERENCES ledger(id)
  );

  CREATE TABLE IF NOT EXISTS amendments (
    id            TEXT PRIMARY KEY,
    company_id    TEXT NOT NULL,
    company_name  TEXT,
    type          TEXT NOT NULL,
    reason        TEXT,
    submitted_at  TEXT DEFAULT (datetime('now')),
    status        TEXT DEFAULT '검토중',
    review_comment TEXT,
    reviewed_at   TEXT,
    detail        TEXT DEFAULT '{}',
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS amendment_files (
    id            TEXT PRIMARY KEY,
    amendment_id  TEXT NOT NULL,
    filename      TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mimetype      TEXT,
    size          INTEGER,
    uploaded_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (amendment_id) REFERENCES amendments(id)
  );

  CREATE TABLE IF NOT EXISTS company_groups (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    biz_no        TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS group_members (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id      TEXT NOT NULL,
    user_id       TEXT NOT NULL,
    role          TEXT DEFAULT '담당자',
    UNIQUE(group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES company_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS auditor_assignments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    auditor_id    TEXT NOT NULL,
    company_id    TEXT NOT NULL,
    UNIQUE(auditor_id, company_id),
    FOREIGN KEY (auditor_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS audit_reports (
    id            TEXT PRIMARY KEY,
    company_id    TEXT NOT NULL,
    auditor_id    TEXT NOT NULL,
    opinion       TEXT,
    summary       TEXT,
    status        TEXT DEFAULT '미검토' CHECK(status IN ('미검토','검토중','검토완료','보완필요')),
    submitted_at  TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (auditor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT,
    read        INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_files (
    id            TEXT PRIMARY KEY,
    report_id     TEXT NOT NULL,
    filename      TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mimetype      TEXT,
    size          INTEGER,
    uploaded_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES audit_reports(id)
  );
`);

export default db;
