import pino from "pino";
import { config } from "./config";

export const logger = pino({
  level: config.nodeEnv === "test" ? "silent" : "info",
  redact: {
    paths: ["req.headers.cookie", "req.headers.authorization", "password"],
    censor: "[redacted]",
  },
});
