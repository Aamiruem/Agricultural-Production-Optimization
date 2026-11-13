// Entry point: HTTP server + Socket.IO + MongoDB, with graceful shutdown.
import { createServer } from "node:http";

import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeRealtime, initRealtime } from "./services/realtime.js";

await connectDb(env.MONGODB_URI);

const server = createServer(createApp());
initRealtime(server);
server.listen(env.PORT, () => logger.info(`farm-service listening on :${env.PORT}`));

async function shutdown(signal) {
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
