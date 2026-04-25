import { prisma } from "../../database/prismaClient.js";
import { createServiceError } from "../serviceError.js";
import { buildPatientLocationMapsUrl } from "./emergency.geo.js";
import { releaseEmergencyResources } from "./emergency.resources.js";

// =========================
// 📦 GET BY ID
// =========================
export async function getEmergencyById(emergencyId) {
  return prisma.emergencyRequest.findUnique({
    where: { id: emergencyId },
  });
}

// =========================
// 📦 GET ACTIVE
// =========================
export async function getActiveEmergencies() {
  return prisma.emergencyRequest.findMany({
    where: {
      status: { notIn: ["completed", "cancelled"] },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

// =========================
// 🔄 UPDATE SESSION
// =========================
export async function updateEmergencySession(emergencyId, patch) {
  try {
    const emergency = await getEmergencyById(emergencyId);

    if (!emergency) return null;

    const updateData = { ...patch };

    // 📍 location validation
    if (patch?.location) {
      const { lat, lng } = patch.location;

      if (typeof lat !== "number" || typeof lng !== "number") {
        throw createServiceError(400, "Invalid location");
      }

      updateData.patientLocationMapsUrl =
        buildPatientLocationMapsUrl(patch.location);
    }

    // 🔒 status validation
    const validTransitions = {
      pending: ["accepted"],
      accepted: ["on_the_way"],
      on_the_way: ["arrived"],
      arrived: ["completed"],
      completed: [],
      cancelled: [],
    };

    if (patch?.status) {
      const allowed = validTransitions[emergency.status] || [];

      if (!allowed.includes(patch.status)) {
        throw createServiceError(
          400,
          `Invalid transition ${emergency.status} → ${patch.status}`
        );
      }
    }

    // 🚑 ambulance live update
    if (patch?.ambulanceLocation && emergency.assignedAmbulance?.id) {
      await prisma.ambulance
        .update({
          where: { id: emergency.assignedAmbulance.id },
          data: {
            currentLatitude: Number(patch.ambulanceLocation.lat),
            currentLongitude: Number(patch.ambulanceLocation.lng),
            lastUpdatedAt: new Date(),
          },
        })
        .catch((err) => console.error("Ambulance update error:", err));
    }

    const updated = await prisma.emergencyRequest.update({
      where: { id: emergencyId },
      data: updateData,
    });

    console.log("📊 Status updated:", updated.status);

    if (updated.status === "completed" || updated.status === "cancelled") {
      await releaseEmergencyResources(updated);
    }

    return updated;
  } catch (err) {
    console.error("❌ Emergency update error:", err);
    throw createServiceError(500, "Failed to update emergency");
  }
}

// =========================
// 🔄 UPDATE STATUS
// =========================
export async function updateEmergencyStatus({ emergencyId, status }) {
  const allowed = [
    "pending",
    "accepted",
    "on_the_way",
    "arrived",
    "completed",
    "cancelled",
  ];

  if (!allowed.includes(status)) {
    throw createServiceError(400, "Invalid emergency status.");
  }

  const emergency = await updateEmergencySession(emergencyId, {
    status,
  });

  if (!emergency) {
    throw createServiceError(404, "Emergency request not found.");
  }

  return emergency;
}