import mongoose from "mongoose";
import { config } from "./config";
import { logger } from "./logger";

const cache = globalThis as typeof globalThis & {
  __taskflowDb?: Promise<typeof mongoose>;
};

export function ensureDatabase(): Promise<typeof mongoose> {
  if (!cache.__taskflowDb) {
    mongoose.set("strictQuery", true);

    cache.__taskflowDb = mongoose
      .connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 5,
      })
      .then((connection) => {
        logger.info(
          { database: mongoose.connection.name },
          "MongoDB connected",
        );
        return connection;
      })
      .catch((error) => {
        cache.__taskflowDb = undefined;
        throw error;
      });
  }

  return cache.__taskflowDb;
}

export async function connectDatabase(): Promise<void> {
  await ensureDatabase();
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  cache.__taskflowDb = undefined;
}
