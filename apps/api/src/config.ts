import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = dirname(fileURLToPath(import.meta.url));

for (const candidate of [resolve(here, "../../../.env"), resolve(here, "../.env")]) {
  if (existsSync(candidate)) {
    process.loadEnvFile(candidate);
    break;
  }
}

const booleanFromEnv = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://127.0.0.1:27018/taskflow"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),
  COOKIE_SECURE: booleanFromEnv.optional(),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid API environment:\n${details}`);
}

const isProduction = parsed.data.NODE_ENV === "production";

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  isProduction,
  port: parsed.data.PORT,
  mongoUri: parsed.data.MONGODB_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  cookieSecure: parsed.data.COOKIE_SECURE ?? isProduction,
  webOrigin: parsed.data.WEB_ORIGIN,
  sessionCookie: "tf_session",
  sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
} as const;
