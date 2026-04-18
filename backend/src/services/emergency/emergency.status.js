import { prisma } from "../../database/prismaClient.js";
import { createServiceError } from "../serviceError.js";
import { buildPatientLocationMapsUrl } from "./emergency.geo.js";
import { releaseEmergencyResources } from "./emergency.resources.js";

export async function getEmergencyById(emergencyId) {
  return prisma.emergencyRequest.findUnique({
    where: { id: emergencyId },
  });
}

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

export async function updateEmergencySession(emergencyId, patch) {
  const emergency = await getEmergencyById(emergencyId);

  if (!emergency) {
    return null;
  }

  const updateData = { ...patch };

  if (patch?.location) {
    updateData.patientLocationMapsUrl = buildPatientLocationMapsUrl(patch.location);
  }

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
      .catch(() => null);
  }

  const updated = await prisma.emergencyRequest.update({
    where: { id: emergencyId },
    data: updateData,
  });

  if (updated.status === "accepted" && updated.ambulanceId) {
    await prisma.ambulance
      .update({
        where: { id: updated.ambulanceId },
        data: { availability: "on_route" },
      })
      .catch(() => null);
  }

  if (updated.status === "arrived" && updated.ambulanceId) {
    await prisma.ambulance
      .update({
        where: { id: updated.ambulanceId },
        data: { availability: "at_hospital" },
      })
      .catch(() => null);
  }

  if (updated.status === "completed" || updated.status === "cancelled") {
    await releaseEmergencyResources(updated);
  }

  return updated;
}

export async function updateEmergencyStatus({ emergencyId, status }) {
  const allowed = ["pending", "accepted", "on_the_way", "arrived", "completed", "cancelled"];
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
