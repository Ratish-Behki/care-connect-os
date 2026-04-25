import { io, Socket } from "socket.io-client";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

let emergencySocket: Socket | null = null;

function getSocketOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:5000";
  }
}

export function getEmergencySocket(user?: { id: string; role: string }) {
  if (!emergencySocket) {
    emergencySocket = io(getSocketOrigin(), {
      autoConnect: false,
      transports: ["websocket"],

      // attached user info.
      auth: {
        userId: user?.id,
        role: user?.role,
      },

      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    // 🔥 DEBUG LOGS
    emergencySocket.on("connect", () => {
      console.log("🟢 Socket connected:", emergencySocket?.id);
    });

    emergencySocket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });

    emergencySocket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });
  }

  return emergencySocket;
}

export function disconnectEmergencySocket() {
  if (emergencySocket) {
    emergencySocket.disconnect();
    emergencySocket = null;
  }
}