import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { ERROR_CODES } from "@taskflow/shared";
import type { SessionUser } from "@taskflow/shared";
import { config } from "../config";
import { HttpError } from "../errors";
import { getSessionCookie } from "../lib/cookies";

interface SessionPayload {
  sub: string;
  name: string;
  email: string;
}

function readToken(req: Request): string | null {
  const cookie = getSessionCookie(req);
  if (cookie) return cookie;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = readToken(req);

  if (!token) {
    next(new HttpError(401, ERROR_CODES.AUTH_REQUIRED, "Sign in to continue"));
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "string" || !payload.sub) {
      throw new Error("Invalid token payload");
    }

    const session = payload as unknown as SessionPayload;
    req.userId = session.sub;
    req.sessionUser = {
      id: session.sub,
      name: session.name,
      email: session.email,
    } satisfies SessionUser;
    next();
  } catch {
    next(new HttpError(401, ERROR_CODES.AUTH_REQUIRED, "Your session has expired"));
  }
};

export function currentUserId(req: Request): string {
  if (!req.userId) {
    throw new HttpError(401, ERROR_CODES.AUTH_REQUIRED, "Sign in to continue");
  }
  return req.userId;
}
