import db from "./db.js";

console.log("DB 마이그레이션 시작...");

// 테이블이 없으면 생성 (db.js의 CREATE TABLE IF NOT EXISTS로 이미 처리됨)
// 기존 테이블에 컬럼 추가
function addCol(table, col, type) {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`).run();
    console.log(`✓ ${table}.${col} 컬럼 추가`);
  } catch (e) {
    if (e.message.includes("duplicate")) console.log(`- ${table}.${col} 이미 존재`);
    else console.log(`- ${table}.${col}:`, e.message);
  }
}

addCol("companies", "group_id", "TEXT");
addCol("companies", "bank_name", "TEXT");
addCol("companies", "bank_account", "TEXT");
addCol("companies", "bank_holder", "TEXT");

console.log("마이그레이션 완료");
