import type { ErrorDetail } from "../types/ticket";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(details: ErrorDetail[], message = "Validation failed") {
    super(400, message, details);
    this.name = "ValidationError";
  }
}
