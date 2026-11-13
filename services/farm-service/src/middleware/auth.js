// Verifies JWTs issued by the FastAPI auth service (shared HS256 secret).
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export function verifyToken(token) {
  const claims = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  return { id: String(claims.sub), email: claims.email, name: claims.name, role: claims.role };
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return next(new HttpError(401, "Not authenticated"));
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
