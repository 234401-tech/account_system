import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

import authRouter from "./routes/auth.js";
import companiesRouter from "./routes/companies.js";
import amendmentsRouter from "./routes/amendments.js";
import evidenceRouter from "./routes/evidence.js";
import auditRouter from "./routes/audit.js";
import usersRouter from "./routes/users.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8090;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// 업로드 파일 정적 서빙
app.use("/uploads", express.static(join(__dirname, "uploads")));

// API 라우트
app.use("/api/auth", authRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/amendments", amendmentsRouter);
app.use("/api/ledger", evidenceRouter);
app.use("/api/audit", auditRouter);
app.use("/api/users", usersRouter);

// 헬스체크
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// 프로덕션: 빌드된 프론트엔드 정적 서빙
const distPath = join(__dirname, "..", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(join(distPath, "index.html")));
  console.log("  프론트엔드: dist/ 정적 서빙 활성화");
}

app.listen(PORT, () => {
  console.log(`\n  정산 모니터링 API 서버`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  헬스체크: http://localhost:${PORT}/api/health\n`);
});
