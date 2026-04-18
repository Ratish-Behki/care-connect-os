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

  if (!io || !emergency) {
    return;
  }

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
  const userId = req.user?.id;
  if (!userId) {
    throw createServiceError(401, "Unauthorized");
  }

  const { location, patientNote, symptoms } = req.body ?? {};
  const result = await createEmergencyCase({
    patientId: userId,
    location,
    symptoms,
    patientNote,
  });

  emitEmergencyUpdate(req, result.emergency);

  return res.status(201).json({
    emergency: result.emergency,
    etaMinutes: result.emergency.dispatchMetrics.ambulanceEtaMinutes,
    ambulance: {
      id: result.emergency.assignedAmbulance.id,
      driver: result.emergency.assignedAmbulance.driverName,
      phone: result.emergency.assignedAmbulance.phone,
    },
    doctor: {
      id: result.emergency.assignedDoctor.id,
      name: result.emergency.assignedDoctor.name,
      specialization: result.emergency.assignedDoctor.specialization,
      phone: result.emergency.assignedDoctor.phone,
    },
  });
}

export async function patchEmergencyStatus(req, res) {
  const emergency = await updateEmergencyStatus({
    emergencyId: req.params.id,
    status: req.body?.status,
  });

  emitEmergencyUpdate(req, emergency);

  return res.json({ emergency });
}
