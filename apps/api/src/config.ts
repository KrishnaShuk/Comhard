import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

for (const candidate of [resolve(here, "../../../.env"), resolve(here, "../.env")]) {
  if (existsSync(candidate)) {
    process.loadEnvFile(candidate);
    break;
  }
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const fallbackSecret = "taskflow-development-secret-change-me";
const jwtSecret = process.env.JWT_SECRET ?? fallbackSecret;

if (nodeEnv === "production" && jwtSecret === fallbackSecret) {
  throw new Error("JWT_SECRET is required in production");
}

export const config = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27018/taskflow",
  jwtSecret,
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  sessionCookie: "taskflow_session",
  sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
} as const;
