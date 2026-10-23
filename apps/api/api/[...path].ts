import type { IncomingMessage, ServerResponse } from "node:http";
import { ERROR_CODES } from "@taskflow/shared";
import { createApp } from "../src/app";
import { ensureDatabase } from "../src/db";

const app = createApp();

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    await ensureDatabase();
  } catch {
    res.statusCode = 503;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: {
          code: ERROR_CODES.INTERNAL,
          message: "Database unavailable",
        },
      }),
    );
    return;
  }

  app(req, res);
}
