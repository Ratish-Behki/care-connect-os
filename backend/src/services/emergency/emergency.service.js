import { createNotification } from "../notification.service.js";
import {
  createEmergencyDispatch,
  createEmergencyRoomId,
} from "./emergency.dispatch.js";
import { getEmergencyResources } from "./emergency.resources.js";
import {
  getActiveEmergencies,
  getEmergencyById,
  updateEmergencySession,
  updateEmergencyStatus,
} from "./emergency.status.js";

// =========================
// 🚨 CREATE EMERGENCY CASE
// =========================
export async function createEmergencyCase({
  patientId,
  location,
  symptoms,
  patientNote,
}) {
  try {
    // 🔒 VALIDATION
    if (!patientId) {
      throw new Error("Patient ID is required");
    }

    if (!location?.lat || !location?.lng) {
      throw new Error("Invalid location provided");
    }

    // 🚑 CREATE DISPATCH (core logic)
    const emergencyRequest = await createEmergencyDispatch({
      patientId,
      location,
      symptoms,
      patientNote,
    });

    // 🔔 NOTIFICATIONS (parallel)
    await Promise.all([
      createNotification({
        recipientRole: "patient",
        type: "emergency",
        priority: "high",
        title: "🚑 Ambulance dispatched",
        description: `Ambulance ${
          emergencyRequest.assignedAmbulance?.id || "assigned"
        } is on the way. ${
          emergencyRequest.nearestHospital?.name || "Hospital"
        } is ready.`,
        link: "/emergency",
      }),

      createNotification({
        recipientRole: "ambulance",
        type: "emergency",
        priority: "high",
        title: "🚨 New emergency dispatch",
        description: `Pickup at ${
          emergencyRequest.location?.lat?.toFixed(4)
        }, ${emergencyRequest.location?.lng?.toFixed(4)}. ETA ${
          emergencyRequest.dispatchMetrics?.ambulanceEtaMinutes || 10
        } min.`,
        link: "/emergency",
      }),

      createNotification({
        recipientRole: "hospital",
        type: "emergency",
        priority: "high",
        title: "🏥 Incoming emergency",
        description: `${
          emergencyRequest.handoffMessage || "Prepare for emergency intake"
        }`,
        link: "/emergency",
      }),

      createNotification({
        recipientRole: "doctor",
        type: "emergency",
        priority: "high",
        title: `👨‍⚕️ Case assigned`,
        description: `Severity ${
          emergencyRequest.severity?.toUpperCase() || "UNKNOWN"
        } | Specialty ${
          emergencyRequest.requiredSpecialty || "General"
        }`,
        link: "/emergency",
      }),

      createNotification({
        recipientRole: "patient",
        type: "emergency",
        priority: "medium",
        title: "📞 Family notified",
        description: `Emergency alert sent to ${
          emergencyRequest.emergencyContact || "contact"
        }`,
        link: "/emergency",
      }),

      createNotification({
        recipientRole: "admin",
        type: "emergency",
        priority: "high",
        title: "📊 Emergency created",
        description: `Response window ${
          emergencyRequest.dispatchMetrics?.responseWindowSeconds || 60
        }s | Score ${
          emergencyRequest.dispatchMetrics?.hospitalScore || "N/A"
        }`,
        link: "/analytics",
      }),
    ]);

    // ✅ RETURN FINAL RESPONSE
    return {
      emergency: emergencyRequest,
    };
  } catch (error) {
    console.error("❌ Emergency creation failed:", error.message);

    throw new Error(
      error.message || "Failed to create emergency case"
    );
  }
}

// =========================
// 📦 EXPORTS (CORE SERVICES)
// =========================
export {
  createEmergencyDispatch,
  createEmergencyRoomId,
  getEmergencyResources,
  getEmergencyById,
  getActiveEmergencies,
  updateEmergencySession,
  updateEmergencyStatus,
};