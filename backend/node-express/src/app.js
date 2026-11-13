// Express application (no network listener here, so tests can import it).
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { pinoHttp } from "pino-http";

import { corsOrigins, env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { router } from "./routes/index.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // behind Nginx / an AWS load balancer

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== "test" }));

  app.get("/health", (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? "ok" : "unavailable";
    res.status(db === "ok" ? 200 : 503).json({ status: db === "ok" ? "ok" : "degraded", database: db });
  });

// Mounted at /api and /farm-api: behind a shared load balancer the
  // /farm-api/* prefix routes here without path rewriting.
app.use(
    ["/api", "/farm-api"],
    rateLimit({ windowMs: 60_000, limit: env.NODE_ENV === "test" ? 10_000 : 300, standardHeaders: "draft-8", legacyHeaders: false }),
    router,
  );

  app.use(notFound);
  app.use(errorHandler);
  return app;
}



