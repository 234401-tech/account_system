import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync, appendFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, "logs");
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR);

function timestamp() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

function logToFile(level, message) {
  const date = new Date().toISOString().slice(0, 10);
  const line = `${timestamp()} ${level.padEnd(5)} ${message}\n`;
  try { appendFileSync(join(LOG_DIR, `${date}.log`), line); } catch {}
}

export function log(level, message) {
  const ts = timestamp();
  const colors = { INFO: "\x1b[32m", WARN: "\x1b[33m", ERROR: "\x1b[31m" };
  const reset = "\x1b[0m";
  console.log(`${ts} ${colors[level] || ""}${level}${reset} ${message}`);
  logToFile(level, message);
}

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api/")) {
      const duration = Date.now() - start;
      const user = req.user ? `${req.user.id}(${req.user.role})` : "-";
      log("INFO", `${req.method.padEnd(5)} ${req.path} ${res.statusCode} ${duration}ms ${user}`);
    }
  });
  next();
}
