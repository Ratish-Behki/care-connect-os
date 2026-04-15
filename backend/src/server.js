import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, "../.env") });

const [{ createApp, getAllowedOrigins }, { registerEmergencyRealtime }] = await Promise.all([
  import("./app.js"),
  import("./realtime/emergencyRealtime.js"),
]);

const port = Number(process.env.PORT) || 5000;
const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST", "PATCH"],
  },
});

app.set("io", io);
registerEmergencyRealtime(io);

httpServer.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
