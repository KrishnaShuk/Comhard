import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { ERROR_CODES } from "@taskflow/shared";
import { requireAuth } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { tasksRouter } from "./routes/tasks";
import { statsRouter } from "./routes/stats";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { logger } from "./logger";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json({ limit: "100kb" }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 900,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: "Too many requests. Try again shortly.",
        },
      });
    },
  });

  app.get("/api/health", (_req, res) => {
    res.json({ data: { status: "ok" } });
  });

  app.use("/api", apiLimiter);
  app.use("/api/auth", authRouter);
  app.use("/api/tasks", requireAuth, tasksRouter);
  app.use("/api/stats", requireAuth, statsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
