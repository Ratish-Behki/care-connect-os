import {
  createEmergencyCase,
  getActiveEmergencies,
  getEmergencyById,
  getEmergencyResources,
  updateEmergencyStatus,
} from "../services/emergency.service.js";
import { createServiceError } from "../services/serviceError.js";

function emitEmergencyUpdate(req, emergency) {
  const io = req.app.get("io");

  if (!io || !emergency) return;

  io.to(emergency.roomId).emit("emergency:update", {
    emergency,
  });
}

export async function getActiveEmergencyList(_req, res) {
  const emergencies = await getActiveEmergencies();
  return res.json({ emergencies });
}

export async function getEmergencyResourceList(_req, res) {
  const resources = await getEmergencyResources();
  return res.json(resources);
}

export async function getEmergency(req, res) {
  const emergency = await getEmergencyById(req.params.id);

  if (!emergency) {
    throw createServiceError(404, "Emergency request not found.");
  }

  return res.json({ emergency });
}

export async function createEmergency(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createServiceError(401, "Unauthorized");
    }

    const { location, patientNote, symptoms } = req.body ?? {};

    // ✅ validation
    if (!location?.lat || !location?.lng) {
      throw createServiceError(400, "Valid location required");
    }

    const result = await createEmergencyCase({
      patientId: userId,
      location,
      symptoms,
      patientNote,
    });

    console.log("🚨 Emergency created:", result.emergency.id);

    emitEmergencyUpdate(req, result.emergency);

    return res.status(201).json({
      emergency: result.emergency,
      etaMinutes: result.emergency.dispatchMetrics?.ambulanceEtaMinutes,
      ambulance: {
        id: result.emergency.assignedAmbulance?.id,
        driver: result.emergency.assignedAmbulance?.driverName,
        phone: result.emergency.assignedAmbulance?.phone,
      },
      doctor: {
        id: result.emergency.assignedDoctor?.id,
        name: result.emergency.assignedDoctor?.name,
        specialization: result.emergency.assignedDoctor?.specialization,
        phone: result.emergency.assignedDoctor?.phone,
      },
    });
  } catch (err) {
    console.error("❌ Create emergency error:", err);
    throw err;
  }
}

export async function patchEmergencyStatus(req, res) {
  try {
    const role = req.user?.role;

    // ✅ restrict
    if (role === "patient") {
      throw createServiceError(403, "Not allowed to update status");
    }

    const emergency = await updateEmergencyStatus({
      emergencyId: req.params.id,
      status: req.body?.status,
    });

    console.log("📊 Status updated:", emergency.id, emergency.status);

    emitEmergencyUpdate(req, emergency);

    return res.json({ emergency });
  } catch (err) {
    console.error("❌ Update status error:", err);
    throw err;
  }
}