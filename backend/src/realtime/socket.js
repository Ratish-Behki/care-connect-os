import { Server } from "socket.io";
import { getAllowedOrigins } from "../config/cors.js";

export function createSocketServer(httpServer) {
  return new Server(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST", "PATCH"],
    },
  });
}
