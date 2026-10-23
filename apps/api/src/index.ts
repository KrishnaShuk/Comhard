import { createApp } from "./app";
import { config } from "./config";
import { connectDatabase, disconnectDatabase } from "./db";
import { logger } from "./logger";

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, "TaskFlow API listening");
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down");
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error({ err: error }, "Failed to start API");
  process.exit(1);
});
