import { createServer } from "http";
import { env, loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { registerEmergencyRealtime } from "./realtime/emergencyRealtime.js";
import { createSocketServer } from "./realtime/socket.js";

loadEnv();

const app = createApp();
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

app.set("io", io);
registerEmergencyRealtime(io);

httpServer.listen(env.port, () => {
  console.log(`Backend server running on http://localhost:${env.port}`);
});
