import { Router } from "express";
import { createEmergencyDispatch, createNotification, db, getActiveEmergencies, getEmergencyById, updateEmergencySession } from "../data/store.js";

const router = Router();

function emitEmergencyUpdate(req, emergency) {
  const io = req.app.get("io");

  if (!io || !emergency) {
    return;
  }

  io.to(emergency.roomId).emit("emergency:update", {
    emergency,
  });
}

router.get("/active", (_req, res) => {
  return res.json({ emergencies: getActiveEmergencies() });
});

router.get("/resources", (_req, res) => {
  const ambulanceSummary = db.ambulances.map((ambulance) => ({
    id: ambulance.id,
    driverName: ambulance.driverName,
    availability: ambulance.availability,
    location: {
      lat: ambulance.currentLatitude,
      lng: ambulance.currentLongitude,
    },
    activeEmergencyId: ambulance.activeEmergencyId,
  }));

  const hospitalSummary = db.hospitals.map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
    availableBeds: hospital.availableBeds,
    icuBeds: hospital.icuBeds,
    emergencyReadiness: hospital.emergencyReadiness,
  }));

  const doctorSummary = db.doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    specialization: doctor.specialization,
    available: doctor.available,
    hospitalId: doctor.hospitalId,
    activeEmergencyId: doctor.activeEmergencyId,
  }));

  return res.json({
    ambulances: ambulanceSummary,
    hospitals: hospitalSummary,
    doctors: doctorSummary,
  });
});

router.get("/:id", (req, res) => {
  const emergency = getEmergencyById(req.params.id);

  if (!emergency) {
    return res.status(404).json({ message: "Emergency request not found." });
  }

  return res.json({ emergency });
});

router.post("/", async (req, res) => {
  const { location, patientNote, symptoms } = req.body ?? {};

  const emergencyRequest = await createEmergencyDispatch({
    patientId: db.currentUser.id,
    location,
    symptoms,
    patientNote,
  });

  emitEmergencyUpdate(req, emergencyRequest);

  createNotification({
    recipientRole: "patient",
    type: "emergency",
    priority: "high",
    title: "Ambulance dispatched",
    description: `Ambulance ${emergencyRequest.assignedAmbulance.id} assigned. ${emergencyRequest.nearestHospital.name} and ${emergencyRequest.assignedDoctor.name} are ready.`,
    link: "/emergency",
  });

  createNotification({
    recipientRole: "ambulance",
    type: "emergency",
    priority: "high",
    title: "New emergency dispatch",
    description: `Pickup location ${emergencyRequest.location.lat.toFixed(4)}, ${emergencyRequest.location.lng.toFixed(4)}. ETA target ${emergencyRequest.dispatchMetrics.ambulanceEtaMinutes} min. Destination: ${emergencyRequest.nearestHospital.name}.`,
    link: "/emergency",
  });

  createNotification({
    recipientRole: "hospital",
    type: "emergency",
    priority: "high",
    title: "Incoming emergency patient",
    description: `${emergencyRequest.handoffMessage} Medical snapshot shared for triage preparation.`,
    link: "/emergency",
  });

  createNotification({
    recipientRole: "doctor",
    type: "emergency",
    priority: "high",
    title: `Case assigned: ${emergencyRequest.assignedDoctor.name}`,
    description: `Severity ${emergencyRequest.severity.toUpperCase()} | Specialty ${emergencyRequest.requiredSpecialty}. Blood group ${emergencyRequest.medicalSnapshot.bloodGroup}.`,
    link: "/emergency",
  });

  createNotification({
    recipientRole: "patient",
    type: "emergency",
    priority: "medium",
    title: "Family contact notified",
    description: `Emergency alert sent to ${emergencyRequest.emergencyContact}.`,
    link: "/emergency",
  });

  createNotification({
    recipientRole: "admin",
    type: "emergency",
    priority: "high",
    title: "Emergency case created",
    description: `Dispatch SLA started (${emergencyRequest.dispatchMetrics.responseWindowSeconds}s window). Hospital score ${emergencyRequest.dispatchMetrics.hospitalScore}.`,
    link: "/analytics",
  });

  return res.status(201).json({
    emergency: emergencyRequest,
    etaMinutes: emergencyRequest.dispatchMetrics.ambulanceEtaMinutes,
    ambulance: {
      id: emergencyRequest.assignedAmbulance.id,
      driver: emergencyRequest.assignedAmbulance.driverName,
      phone: emergencyRequest.assignedAmbulance.phone,
    },
    doctor: {
      id: emergencyRequest.assignedDoctor.id,
      name: emergencyRequest.assignedDoctor.name,
      specialization: emergencyRequest.assignedDoctor.specialization,
      phone: emergencyRequest.assignedDoctor.phone,
    },
  });
});

router.patch("/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};

  const allowed = ["pending", "accepted", "on_the_way", "arrived", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid emergency status." });
  }

  const emergency = updateEmergencySession(id, {
    status,
  });

  if (!emergency) {
    return res.status(404).json({ message: "Emergency request not found." });
  }

  emitEmergencyUpdate(req, emergency);

  return res.json({ emergency });
});

export default router;