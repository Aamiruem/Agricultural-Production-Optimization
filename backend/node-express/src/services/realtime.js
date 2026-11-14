// Socket.IO: each authenticated socket joins a private room `user:<id>`,
// so events about a user's farms only reach that user's open tabs.
//
// Scaling out: with REDIS_URL set, the Redis adapter relays room broadcasts
// between replicas, so an event emitted on one instance reaches a user's tabs
// connected to any other. The gateway keeps each client on one replica
// (sticky by IP) because Socket.IO's HTTP long-polling fallback needs it.
import { Server } from "socket.io";

import { corsOrigins, env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { verifyToken } from "../middleware/auth.js";

let io = null;
let redisClients = [];
let adapter = "in-memory";

export function initRealtime(httpServer) {
  io = new Server(httpServer, { cors: { origin: corsOrigins, credentials: true } });

  io.use((socket, next) => {
    try {
      socket.data.user = verifyToken(socket.handshake.auth?.token ?? "");
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const room = `user:${socket.data.user.id}`;
    socket.join(room);
    logger.debug({ room }, "socket connected");
  });
  if (env.REDIS_URL) void attachRedisAdapter(env.REDIS_URL);
  return io;
}

async function attachRedisAdapter(url) {
  try {
    const [{ createAdapter }, { createClient }] = await Promise.all([
      import("@socket.io/redis-adapter"),
      import("redis"),
    ]);
    const pub = createClient({ url, socket: { reconnectStrategy: (n) => Math.min(n * 200, 5000) } });
    const sub = pub.duplicate();
    for (const c of [pub, sub]) c.on("error", (error) => logger.warn({ error: error.message }, "redis adapter"));
    await Promise.all([pub.connect(), sub.connect()]);
    redisClients = [pub, sub];
    io?.adapter(createAdapter(pub, sub));
    adapter = "redis";
    logger.info("Socket.IO Redis adapter enabled (multi-replica broadcasts)");
  } catch (error) {
    logger.warn({ error: error.message }, "Redis unavailable; Socket.IO stays single-instance");
  }
}

export function realtimeInfo() {
  return { adapter, clients: io?.engine?.clientsCount ?? 0 };
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export async function closeRealtime() {
  if (io) await io.close();
  io = null;
  await Promise.allSettled(redisClients.map((c) => c.quit()));
  redisClients = [];
  adapter = "in-memory";
}
