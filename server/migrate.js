import db from "./db.js";

console.log("DB 마이그레이션 시작...");

// 테이블이 없으면 생성 (db.js의 CREATE TABLE IF NOT EXISTS로 이미 처리됨)
// 기존 테이블에 컬럼 추가
try {
  db.prepare("ALTER TABLE companies ADD COLUMN group_id TEXT").run();
  console.log("✓ companies.group_id 컬럼 추가");
} catch (e) {
  if (e.message.includes("duplicate")) console.log("- companies.group_id 이미 존재");
  else console.log("- companies.group_id:", e.message);
}

console.log("마이그레이션 완료");
