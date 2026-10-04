import type { z } from "zod";
import { ValidationError } from "./errors";

/** Parses `data` with a Zod schema or throws a 400 ValidationError with per-field details. */
export function parseOrThrow<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      })),
    );
  }
  return result.data;
}
