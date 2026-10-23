import type { z, ZodTypeAny } from "zod";
import { ERROR_CODES } from "@taskflow/shared";
import { fieldErrors, HttpError } from "../errors";

export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new HttpError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "Check the highlighted fields",
      fieldErrors(result.error),
    );
  }

  return result.data;
}
