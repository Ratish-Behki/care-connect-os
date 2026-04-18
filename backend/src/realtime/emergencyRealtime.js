import { getEmergencyById, updateEmergencySession } from "../services/emergency.service.js";
import { createNotification } from "../services/notification.service.js";


/**
It listens for real-time events like:

emergency:join
emergency:patient-location
emergency:ambulance-location
emergency:hospital-ready
emergency:complete

 */


function emitEmergencySnapshot(io, emergency) {
  io.to(emergency.roomId).emit("emergency:update", {
    emergency,
  });
}

export function registerEmergencyRealtime(io) {
  io.on("connection", (socket) => {
    socket.on("emergency:join", async ({ emergencyId, role }) => {
      if (!emergencyId) {
        socket.emit("emergency:error", { message: "Emergency id is required." });
        return;
      }

      const emergency = await getEmergencyById(emergencyId);
      if (!emergency) {
        socket.emit("emergency:error", { message: "Emergency request not found." });
        return;
      }

      socket.join(emergency.roomId);

      if (role === "ambulance" && ["pending", "accepted"].includes(emergency.status)) {
        const updatedEmergency = await updateEmergencySession(emergencyId, {
          status: "on_the_way",
        });

        createNotification({
          recipientRole: "patient",
          type: "emergency",
          priority: "high",
          title: "Ambulance accepted the request",
          description: `${(updatedEmergency ?? emergency).assignedAmbulance.driverName} is moving toward your live location now.`,
          link: "/emergency",
        });

        createNotification({
          recipientRole: "hospital",
          type: "emergency",
          priority: "high",
          title: "Ambulance is en route",
          description: `Ambulance ${(updatedEmergency ?? emergency).assignedAmbulance.id} is inbound with ETA ${(updatedEmergency ?? emergency).dispatchMetrics?.hospitalEtaMinutes || 10} minutes.`,
          link: "/emergency",
        });

        createNotification({
          recipientRole: "doctor",
          type: "emergency",
          priority: "high",
          title: "Doctor prep started",
          description: `${(updatedEmergency ?? emergency).assignedDoctor.name}, please prepare for a ${(updatedEmergency ?? emergency).severity} emergency intake.`,
          link: "/emergency",
        });

        socket.emit("emergency:snapshot", { emergency: updatedEmergency ?? emergency });
        emitEmergencySnapshot(io, updatedEmergency ?? emergency);
        return;
      }

      socket.emit("emergency:snapshot", { emergency });
      emitEmergencySnapshot(io, emergency);
    });

    socket.on("emergency:patient-location", async ({ emergencyId, location }) => {
      if (!emergencyId || !location) {
        return;
      }

      const emergency = await updateEmergencySession(emergencyId, {
        location,
      });

      if (emergency) {
        emitEmergencySnapshot(io, emergency);
      }
    });

    socket.on("emergency:ambulance-location", async ({ emergencyId, location }) => {
      if (!emergencyId || !location) {
        return;
      }

      const emergency = await updateEmergencySession(emergencyId, {
        ambulanceLocation: location,
      });

      if (emergency) {
        emitEmergencySnapshot(io, emergency);
      }
    });

    socket.on("emergency:hospital-ready", async ({ emergencyId }) => {
      if (!emergencyId) {
        return;
      }

      const emergency = await updateEmergencySession(emergencyId, {
        status: "arrived",
      });

      if (emergency) {
        createNotification({
          recipientRole: "patient",
          type: "emergency",
          priority: "high",
          title: "Hospital is ready for handoff",
          description: `${emergency.nearestHospital.name} confirmed bed and doctor availability.`,
          link: "/emergency",
        });

        emitEmergencySnapshot(io, emergency);
      }
    });

    socket.on("emergency:complete", async ({ emergencyId }) => {
      if (!emergencyId) {
        return;
      }

      const emergency = await updateEmergencySession(emergencyId, {
        status: "completed",
      });

      if (emergency) {
        createNotification({
          recipientRole: "ambulance",
          type: "emergency",
          priority: "low",
          title: "Case completed",
          description: `${emergency.id.slice(0, 8).toUpperCase()} closed. Ambulance is back to available state.`,
          link: "/emergency",
        });

        createNotification({
          recipientRole: "doctor",
          type: "emergency",
          priority: "low",
          title: "Emergency case closed",
          description: `${emergency.id.slice(0, 8).toUpperCase()} completed and archived.`,
          link: "/emergency",
        });

        emitEmergencySnapshot(io, emergency);
      }
    });
  });
}
