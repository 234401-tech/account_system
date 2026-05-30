import db from "./db.js";
import bcrypt from "bcryptjs";

const hash = (pw) => bcrypt.hashSync(pw, 10);

console.log("DB 초기화 중...");

const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (id, email, password_hash, name, role, company_id)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const seedAll = db.transaction(() => {
  // 마스터 관리자 계정만 생성
  insertUser.run("U-MASTER-001", "admin@ptp.or.kr", hash("admin1234"), "최고관리자", "master", null);
});

seedAll();
console.log("DB 초기화 완료");
console.log("마스터: admin@ptp.or.kr / admin1234");
