import type { SessionUser } from "@taskflow/shared";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionUser?: SessionUser;
    }
  }
}

export {};
