// Socket.IO: each authenticated socket joins a private room `user:<id>`,
// so events about a user's farms only reach that user's open tabs.
import { Server } from "socket.io";

import { corsOrigins } from "../config/env.js";
import { logger } from "../config/logger.js";
import { verifyToken } from "../middleware/auth.js";

let io = null;

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
  return io;
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export async function closeRealtime() {
  if (io) await io.close();
  io = null;
}
