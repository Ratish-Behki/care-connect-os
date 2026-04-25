import { createServer } from "http";
import { env, loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { registerEmergencyRealtime } from "./realtime/emergencyRealtime.js";
import { createSocketServer } from "./realtime/socket.js";
import { prisma } from "./database/prismaClient.js";

loadEnv();

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    const app = createApp();
    const httpServer = createServer(app);
    const io = createSocketServer(httpServer);

    app.set("io", io);
    registerEmergencyRealtime(io);

    io.on("connection", (socket) => {
      console.log("🟢 Socket connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
      });
    });

    app.get("/health", (req, res) => {
      res.json({ status: "ok", time: new Date() });
    });

    httpServer.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
    });

    process.on("SIGINT", async () => {
      console.log("🛑 Shutting down...");
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();