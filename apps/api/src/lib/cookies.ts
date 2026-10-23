import type { Request, Response } from "express";
import { config } from "../config";

function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return decodeURIComponent(part.slice(separator + 1).trim());
  }

  return null;
}

export function getSessionCookie(req: Request): string | null {
  return readCookie(req.headers.cookie, config.sessionCookie);
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(config.sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    maxAge: config.sessionMaxAgeMs,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
  });
}
