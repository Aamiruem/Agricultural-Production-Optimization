import mongoose from "mongoose";

import { logger } from "../config/logger.js";
import { HttpError } from "../utils/http-error.js";

const DB_DOWN = "Database unavailable: MongoDB is not connected. Start MongoDB and try again.";

/** Fail fast with 503 instead of letting queries hang while MongoDB is down. */
export function requireDb(_req, _res, next) {
  if (mongoose.connection.readyState !== 1) return next(new HttpError(503, DB_DOWN));
  return next();
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, "Route not found"));
}

// Express recognises error handlers by their 4-argument signature.
export function errorHandler(err, req, res, _next) {
  let status = err instanceof HttpError ? err.status : 500;
  let message = err instanceof HttpError ? err.message : "Internal server error";

  if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = Object.values(err.errors)[0]?.message ?? "Validation failed";
  } else if (err?.code === 11000) {
    status = 409;
    message = "A record with these values already exists";
  } else if (
    ["MongooseServerSelectionError", "MongoNetworkError", "MongoServerSelectionError"].includes(err?.name) ||
    /buffering timed out|before initial connection/i.test(err?.message ?? "")
  ) {
    status = 503;
    message = DB_DOWN;
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) logger.error({ err, path: req.path }, "unhandled error");
  res.status(status).json({ detail: message, ...(err.details ? { errors: err.details } : {}) });
}
