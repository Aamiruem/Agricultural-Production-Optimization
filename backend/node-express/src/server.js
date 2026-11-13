// Entry point: HTTP server + Socket.IO + MongoDB, with graceful shutdown.
import { createServer } from "node:http";

import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeRealtime, initRealtime } from "./services/realtime.js";

const server = createServer(createApp());
initRealtime(server);
let shuttingDown = false;
server.listen(env.PORT, () => {
  logger.info(`farm-service listening on :${env.PORT}`);
  void connectWithRetry();
});

async function connectWithRetry() {
  while (!shuttingDown) {
    try {
      await connectDb(env.MONGODB_URI);
      return;
    } catch (error) {
      logger.warn({ error: error.name }, "MongoDB unavailable; retrying in 3 seconds");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function shutdown(signal) {
  shuttingDown = true;
  logger.info({ signal }, "shutting down");
  await closeRealtime();
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
