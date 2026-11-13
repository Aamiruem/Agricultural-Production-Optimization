import mongoose from "mongoose";

import { logger } from "../config/logger.js";
import { HttpError } from "../utils/http-error.js";

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
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) logger.error({ err, path: req.path }, "unhandled error");
  res.status(status).json({ detail: message, ...(err.details ? { errors: err.details } : {}) });
}
