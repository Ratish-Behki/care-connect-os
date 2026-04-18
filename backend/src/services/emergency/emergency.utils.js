import { DEFAULT_COORDINATES } from "./emergency.constants.js";

export function normalizeCoordinates(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      lat,
      lng,
      accuracy: Number.isFinite(Number(location?.accuracy)) ? Number(location.accuracy) : undefined,
      address: typeof location?.address === "string" ? location.address : undefined,
      source: location?.source || "browser",
    };
  }

  return {
    ...DEFAULT_COORDINATES,
    source: "fallback",
  };
}

export function inferSeverity(symptoms, patientNote) {
  const text = `${symptoms || ""} ${patientNote || ""}`.toLowerCase();

  if (/chest pain|breathing|stroke|faint|unconscious|seizure|severe bleeding|accident/.test(text)) {
    return "critical";
  }

  if (/high fever|vomiting|fracture|infection|asthma|dizziness/.test(text)) {
    return "high";
  }

  return "moderate";
}

export function inferRequiredSpecialty(symptoms) {
  const text = (symptoms || "").toLowerCase();

  if (/chest|cardiac|heart|palpitation/.test(text)) {
    return "cardiology";
  }

  if (/stroke|seizure|numb|head injury|slurred speech|neurology/.test(text)) {
    return "neurology";
  }

  if (/breath|asthma|oxygen|respiratory|lung/.test(text)) {
    return "pulmonology";
  }

  if (/fracture|bone|trauma|accident/.test(text)) {
    return "trauma";
  }

  return "general";
}

export function buildDynamicLocalHospitals(location, requiredSpecialty) {
  const baseId = `${Math.abs(Math.round(location.lat * 100))}${Math.abs(Math.round(location.lng * 100))}`;
  const specialtyPool = {
    cardiology: ["cardiology", "general", "trauma"],
    neurology: ["neurology", "general", "trauma"],
    pulmonology: ["pulmonology", "general", "trauma"],
    trauma: ["trauma", "orthopedics", "general"],
    general: ["general", "trauma", "cardiology"],
  };

  return [
    {
      id: `h-dyn-${baseId}-1`,
      name: "City Emergency Hub",
      address: `Sector 1, Near Patient Zone (${location.lat.toFixed(3)}, ${location.lng.toFixed(3)})`,
      phone: "+91 1800 120 0001",
      lat: location.lat + 0.018,
      lng: location.lng + 0.011,
      emergencyReadiness: 0.86,
      icuBeds: 12,
      availableBeds: 20,
      specialistsOnDuty: specialtyPool[requiredSpecialty] || specialtyPool.general,
    },
    {
      id: `h-dyn-${baseId}-2`,
      name: "Metro Trauma and Critical Care",
      address: `Sector 2, Around Dispatch Radius (${location.lat.toFixed(3)}, ${location.lng.toFixed(3)})`,
      phone: "+91 1800 120 0002",
      lat: location.lat - 0.021,
      lng: location.lng + 0.014,
      emergencyReadiness: 0.9,
      icuBeds: 16,
      availableBeds: 24,
      specialistsOnDuty: ["trauma", "general", requiredSpecialty],
    },
    {
      id: `h-dyn-${baseId}-3`,
      name: "Rapid Response Medical Center",
      address: `Sector 3, Live Response Corridor (${location.lat.toFixed(3)}, ${location.lng.toFixed(3)})`,
      phone: "+91 1800 120 0003",
      lat: location.lat + 0.013,
      lng: location.lng - 0.016,
      emergencyReadiness: 0.84,
      icuBeds: 10,
      availableBeds: 18,
      specialistsOnDuty: ["general", "pulmonology", requiredSpecialty],
    },
  ];
}

export function normalizeDoctorSpecialties(doctor) {
  const combined = `${doctor.specialization} ${doctor.department}`.toLowerCase();

  return {
    ...doctor,
    specialtyTags: [
      /cardio/.test(combined) ? "cardiology" : null,
      /neuro|stroke/.test(combined) ? "neurology" : null,
      /pulmo|respir/.test(combined) ? "pulmonology" : null,
      /trauma|ortho/.test(combined) ? "trauma" : null,
      /emergency|general/.test(combined) ? "general" : null,
    ].filter(Boolean),
  };
}

export function buildHospitalHandoffMessage({ emergencyId, hospital, doctor, severity, symptoms, ambulance }) {
  const symptomText = symptoms?.trim() || "No symptom text provided";

  return [
    `Emergency ${emergencyId.slice(0, 8).toUpperCase()} assigned to ${hospital.name}.`,
    `Severity: ${severity.toUpperCase()} | Specialty: ${doctor.specialtyTags?.[0] || "general"}.`,
    `Attending doctor: ${doctor.name} (${doctor.specialization}).`,
    `Ambulance ${ambulance.id} (${ambulance.driverName}) is en route.`,
    `Symptoms: ${symptomText}.`,
  ].join(" ");
}
