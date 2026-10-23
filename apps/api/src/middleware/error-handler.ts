import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { ERROR_CODES } from "@taskflow/shared";
import { fieldErrors, HttpError } from "../errors";
import { logger } from "../logger";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: { code: ERROR_CODES.NOT_FOUND, message: "Route not found" },
  });
};

function mongoDuplicateKey(error: mongoose.mongo.MongoServerError): boolean {
  return error.code === 11000;
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Check the highlighted fields",
        fields: fieldErrors(error),
      },
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: "Task not found" },
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const fields: Record<string, string> = {};
    for (const [key, issue] of Object.entries(error.errors)) {
      fields[key] = issue.message;
    }
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Check the highlighted fields",
        fields,
      },
    });
    return;
  }

  if (error instanceof mongoose.mongo.MongoServerError && mongoDuplicateKey(error)) {
    res.status(409).json({
      error: {
        code: ERROR_CODES.USER_EXISTS,
        message: "That account already exists",
      },
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      error: { code: ERROR_CODES.VALIDATION_ERROR, message: "Invalid JSON body" },
    });
    return;
  }

  logger.error({ err: error, method: req.method, url: req.originalUrl }, "Unhandled error");
  res.status(500).json({
    error: { code: ERROR_CODES.INTERNAL, message: "Something went wrong" },
  });
};
