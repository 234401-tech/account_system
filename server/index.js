import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import authRouter from "./routes/auth.js";
import companiesRouter from "./routes/companies.js";
import amendmentsRouter from "./routes/amendments.js";
import evidenceRouter from "./routes/evidence.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// 업로드 파일 정적 서빙
app.use("/uploads", express.static(join(__dirname, "uploads")));

// API 라우트
app.use("/api/auth", authRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/amendments", amendmentsRouter);
app.use("/api/ledger", evidenceRouter);

// 헬스체크
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n  정산 모니터링 API 서버`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  헬스체크: http://localhost:${PORT}/api/health\n`);
});
