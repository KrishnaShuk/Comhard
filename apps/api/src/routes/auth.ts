import { Router } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import {
  ERROR_CODES,
  loginSchema,
  registerSchema,
  type SessionUser,
} from "@taskflow/shared";
import { config } from "../config";
import { HttpError } from "../errors";
import { asyncHandler } from "../lib/async-handler";
import { parse } from "../lib/parse";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies";
import { requireAuth } from "../middleware/auth";
import { UserModel } from "../models/User";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message: "Too many attempts. Try again in a few minutes.",
      },
    });
  },
});

function signSession(user: { id: string; name: string; email: string }): string {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    config.jwtSecret,
    { expiresIn: "7d" },
  );
}

authRouter.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const needsSetup = (await UserModel.estimatedDocumentCount()) === 0;
    res.json({ data: { needsSetup } });
  }),
);

authRouter.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(registerSchema, req.body);
    const existing = await UserModel.estimatedDocumentCount();

    if (existing > 0) {
      throw new HttpError(
        409,
        ERROR_CODES.USER_EXISTS,
        "This TaskFlow workspace already has an account",
      );
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    const sessionUser: SessionUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
    };

    setSessionCookie(res, signSession(sessionUser));
    res.status(201).json({ data: sessionUser });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(loginSchema, req.body);
    const user = await UserModel.findOne({ email: input.email }).select(
      "+passwordHash",
    );

    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new HttpError(
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
        "Email or password is incorrect",
      );
    }

    const sessionUser: SessionUser = {
      id: String(user._id),
      name: user.name,
      email: user.email,
    };

    setSessionCookie(res, signSession(sessionUser));
    res.json({ data: sessionUser });
  }),
);

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  if (!req.sessionUser) {
    throw new HttpError(401, ERROR_CODES.AUTH_REQUIRED, "Sign in to continue");
  }
  res.json({ data: req.sessionUser });
});
