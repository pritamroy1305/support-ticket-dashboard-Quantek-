import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/errors";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.path}` },
  });
};

interface HttpLikeError {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  type?: string;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  // Errors raised by Express itself, e.g. malformed JSON bodies
  const httpErr = err as HttpLikeError;
  const status = httpErr.status ?? httpErr.statusCode;
  if (status && status >= 400 && status < 500 && httpErr.expose) {
    const message = httpErr.type === "entity.parse.failed" ? "Malformed JSON body" : "Bad request";
    res.status(status).json({ success: false, error: { message } });
    return;
  }

  // Unexpected: log server-side, never leak internals to the client
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: { message: "Internal server error" } });
};
