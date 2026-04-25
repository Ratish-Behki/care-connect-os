import {
  getEmergencyById,
  updateEmergencySession,
} from "../services/emergency.service.js";
import { createNotification } from "../services/notification.service.js";

// 🔥 FIXED: BROADCAST + ROOM
function emitEmergencySnapshot(io, emergency) {
  // ✅ 1. Broadcast to ALL (for ambulance discovery)
  io.emit("emergency:update", {
    emergency,
  });

  // ✅ 2. Also send to room (for joined users like patient/accepted ambulance)
  if (emergency?.roomId) {
    io.to(emergency.roomId).emit("emergency:update", {
      emergency,
    });
  }
}

export function registerEmergencyRealtime(io) {
  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    // 🔐 BASIC AUTH
    const auth = socket.handshake?.auth;
    if (!auth?.userId) {
      console.warn("❌ Unauthorized socket, disconnecting");
      socket.disconnect();
      return;
    }

    // =========================
    // 🔥 JOIN ROOM
    // =========================
    socket.on("emergency:join", async ({ emergencyId, role }) => {
      try {
        if (!emergencyId) {
          socket.emit("emergency:error", {
            message: "Emergency id is required.",
          });
          return;
        }

        const emergency = await getEmergencyById(emergencyId);
        if (!emergency) {
          socket.emit("emergency:error", {
            message: "Emergency request not found.",
          });
          return;
        }

        socket.join(emergency.roomId);

        console.log(`🚪 ${role} joined room: ${emergency.roomId}`);

        socket.emit("emergency:snapshot", { emergency });
        emitEmergencySnapshot(io, emergency);
      } catch (err) {
        console.error("JOIN ERROR:", err);
        socket.emit("emergency:error", {
          message: "Failed to join emergency room",
        });
      }
    });

    // =========================
    // 🚑 ACCEPT EMERGENCY
    // =========================
    socket.on("emergency:accept", async ({ emergencyId, ambulanceId }) => {
      try {
        if (!emergencyId || !ambulanceId) return;

        const emergency = await updateEmergencySession(emergencyId, {
          status: "accepted",
          ambulanceId,
        });

        if (emergency) {
          console.log("🚑 Emergency accepted:", emergency.id);

          createNotification({
            recipientRole: "patient",
            type: "emergency",
            priority: "high",
            title: "Ambulance accepted",
            description: "Help is on the way 🚑",
            link: "/emergency",
          });

          emitEmergencySnapshot(io, emergency);
        }
      } catch (err) {
        console.error("ACCEPT ERROR:", err);
        socket.emit("emergency:error", {
          message: "Failed to accept emergency",
        });
      }
    });

    // =========================
    // 📍 PATIENT LOCATION
    // =========================
    socket.on("emergency:patient-location", async ({ emergencyId, location }) => {
      try {
        if (!emergencyId || !location) return;

        const emergency = await updateEmergencySession(emergencyId, {
          location,
        });

        if (emergency) {
          emitEmergencySnapshot(io, emergency);
        }
      } catch (err) {
        console.error("PATIENT LOCATION ERROR:", err);
      }
    });

    // =========================
    // 🚑 AMBULANCE LOCATION
    // =========================
    socket.on("emergency:ambulance-location", async ({ emergencyId, location }) => {
      try {
        if (!emergencyId || !location) return;

        const emergency = await updateEmergencySession(emergencyId, {
          ambulanceLocation: location,
        });

        if (emergency) {
          emitEmergencySnapshot(io, emergency);
        }
      } catch (err) {
        console.error("AMBULANCE LOCATION ERROR:", err);
      }
    });

    // =========================
    // 🏥 HOSPITAL READY
    // =========================
    socket.on("emergency:hospital-ready", async ({ emergencyId }) => {
      try {
        if (!emergencyId) return;

        const emergency = await updateEmergencySession(emergencyId, {
          status: "arrived",
        });

        if (emergency) {
          createNotification({
            recipientRole: "patient",
            type: "emergency",
            priority: "high",
            title: "Hospital is ready",
            description: `${emergency.nearestHospital?.name} is prepared for your arrival.`,
            link: "/emergency",
          });

          emitEmergencySnapshot(io, emergency);
        }
      } catch (err) {
        console.error("HOSPITAL READY ERROR:", err);
      }
    });

    // =========================
    // ❌ COMPLETE
    // =========================
    socket.on("emergency:complete", async ({ emergencyId }) => {
      try {
        if (!emergencyId) return;

        const emergency = await updateEmergencySession(emergencyId, {
          status: "completed",
        });

        if (emergency) {
          createNotification({
            recipientRole: "ambulance",
            type: "emergency",
            priority: "low",
            title: "Case completed",
            description: `${emergency.id
              .slice(0, 8)
              .toUpperCase()} closed.`,
            link: "/emergency",
          });

          emitEmergencySnapshot(io, emergency);
        }
      } catch (err) {
        console.error("COMPLETE ERROR:", err);
      }
    });

    // =========================
    // 🔌 DISCONNECT
    // =========================
    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);
    });
  });
}