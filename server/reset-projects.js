// 과제(회사) 데이터만 전부 삭제. 사용자 계정은 유지.
import db from "./db.js";

console.log("=== 과제 데이터 초기화 시작 ===");

const tables = [
  "evidence_files",
  "amendment_files",
  "amendments",
  "audit_files",
  "audit_reports",
  "auditor_assignments",
  "policy_files",
  "policy_items",
  "group_members",
  "company_groups",
  "ledger",
  "budget_tree",
  "researchers",
  "signup_requests",   // 가입 요청 (company_id 참조)
  "companies",
];

// FK 일시 해제
db.pragma("foreign_keys = OFF");

const before = {};
for (const t of tables) {
  try { before[t] = db.prepare(`SELECT COUNT(*) as n FROM ${t}`).get().n; } catch { before[t] = 0; }
}

const tx = db.transaction(() => {
  for (const t of tables) {
    try {
      db.prepare(`DELETE FROM ${t}`).run();
      // sqlite_sequence는 AUTOINCREMENT 카운터. 있으면 리셋
      try { db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(t); } catch {}
    } catch (e) { console.log(`- ${t}: ${e.message}`); }
  }
  // 모든 사용자의 company_id 연결도 해제
  db.prepare("UPDATE users SET company_id = NULL").run();
  // 알림도 정리 (회사 관련만)
  try { db.prepare("DELETE FROM notifications").run(); } catch {}
});
tx();

console.log("");
console.log("삭제 결과:");
for (const t of tables) {
  console.log(`  ${t.padEnd(25)} ${before[t]}건 삭제`);
}
console.log("  users.company_id        연결 해제 완료");
console.log("");
console.log("=== 초기화 완료 ===");
console.log("다음 과제 발급 시 GB-2026-001부터 시작합니다.");
