import type { ZodError } from "zod";
import type { ErrorCode } from "@taskflow/shared";
import { ERROR_CODES } from "@taskflow/shared";

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    if (fields) this.fields = fields;
  }
}

export function notFound(message = "Task not found"): HttpError {
  return new HttpError(404, ERROR_CODES.NOT_FOUND, message);
}

export function fieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "form";
    if (!fields[path]) fields[path] = issue.message;
  }

  return fields;
}
