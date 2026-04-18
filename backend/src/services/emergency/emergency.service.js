import { createNotification } from "../notification.service.js";
import {
  createEmergencyDispatch,
  createEmergencyRoomId,
  getNearestHospital,
} from "./emergency.dispatch.js";
import { getEmergencyResources } from "./emergency.resources.js";
import {
  getActiveEmergencies,
  getEmergencyById,
  updateEmergencySession,
  updateEmergencyStatus,
} from "./emergency.status.js";

export async function createEmergencyCase({ patientId, location, symptoms, patientNote }) {
  const emergencyRequest = await createEmergencyDispatch({
    patientId,
    location,
    symptoms,
    patientNote,
  });

  await Promise.all([
    createNotification({
      recipientRole: "patient",
      type: "emergency",
      priority: "high",
      title: "Ambulance dispatched",
      description: `Ambulance ${emergencyRequest.assignedAmbulance.id} assigned. ${emergencyRequest.nearestHospital.name} and ${emergencyRequest.assignedDoctor.name} are ready.`,
      link: "/emergency",
    }),
    createNotification({
      recipientRole: "ambulance",
      type: "emergency",
      priority: "high",
      title: "New emergency dispatch",
      description: `Pickup location ${emergencyRequest.location.lat.toFixed(4)}, ${emergencyRequest.location.lng.toFixed(4)}. ETA target ${emergencyRequest.dispatchMetrics.ambulanceEtaMinutes} min. Destination: ${emergencyRequest.nearestHospital.name}.`,
      link: "/emergency",
    }),
    createNotification({
      recipientRole: "hospital",
      type: "emergency",
      priority: "high",
      title: "Incoming emergency patient",
      description: `${emergencyRequest.handoffMessage} Medical snapshot shared for triage preparation.`,
      link: "/emergency",
    }),
    createNotification({
      recipientRole: "doctor",
      type: "emergency",
      priority: "high",
      title: `Case assigned: ${emergencyRequest.assignedDoctor.name}`,
      description: `Severity ${emergencyRequest.severity.toUpperCase()} | Specialty ${emergencyRequest.requiredSpecialty}. Blood group ${emergencyRequest.medicalSnapshot.bloodGroup}.`,
      link: "/emergency",
    }),
    createNotification({
      recipientRole: "patient",
      type: "emergency",
      priority: "medium",
      title: "Family contact notified",
      description: `Emergency alert sent to ${emergencyRequest.emergencyContact}.`,
      link: "/emergency",
    }),
    createNotification({
      recipientRole: "admin",
      type: "emergency",
      priority: "high",
      title: "Emergency case created",
      description: `Dispatch SLA started (${emergencyRequest.dispatchMetrics.responseWindowSeconds}s window). Hospital score ${emergencyRequest.dispatchMetrics.hospitalScore}.`,
      link: "/analytics",
    }),
  ]);

  return {
    emergency: emergencyRequest,
  };
}

export {
  createEmergencyDispatch,
  createEmergencyRoomId,
  getNearestHospital,
  getEmergencyResources,
  getEmergencyById,
  getActiveEmergencies,
  updateEmergencySession,
  updateEmergencyStatus,
};
