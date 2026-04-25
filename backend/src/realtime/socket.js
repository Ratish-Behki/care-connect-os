import { Server } from "socket.io";
import { getAllowedOrigins } from "../config/cors.js";

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST", "PATCH"],
      credentials: true,
    },

    transports: ["websocket"], // 🔥 force websocket (faster & stable)

    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // 🔐 GLOBAL AUTH MIDDLEWARE
  io.use((socket, next) => {
    const { userId, role } = socket.handshake.auth || {};

    if (!userId || !role) {
      console.warn("❌ Socket rejected: Missing auth");
      return next(new Error("Unauthorized"));
    }

    // attach user to socket
    socket.user = { id: userId, role };

    next();
  });

  // 🔍 DEBUG LOGS (very useful)
  io.on("connection", (socket) => {
    console.log(
      `🟢 Socket connected: ${socket.id} | User: ${socket.user?.id} (${socket.user?.role})`
    );

    socket.on("disconnect", (reason) => {
      console.log(`🔴 Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  return io;
}