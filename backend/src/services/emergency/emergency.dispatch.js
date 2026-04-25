import { randomUUID } from "crypto";
import { prisma } from "../../database/prismaClient.js";
import {
  buildOSMDirectionsUrl,
  buildOSMSearchUrl,
  buildPatientLocationMapsUrl,
  clamp,
  estimateTravelMinutes,
  getDistanceKm,
  getTrafficMultiplier,
  roundTo,
} from "./emergency.geo.js";
import {
  assignDoctorForEmergency,
  assignNearestAmbulance,
  getHospitals,
  reserveHospitalCapacity,
} from "./emergency.resources.js";
import {
  buildDynamicLocalHospitals,
  buildHospitalHandoffMessage,
  inferRequiredSpecialty,
  inferSeverity,
  normalizeCoordinates,
} from "./emergency.utils.js";

// =========================
// 🧠 AI HOSPITAL SCORING (UPDATED)
// =========================
function scoreHospitalCandidate({ hospital, location, requiredSpecialty, severity }) {
  const distanceKm = getDistanceKm(location, hospital);
  const trafficMultiplier = getTrafficMultiplier(location);
  const etaMinutes = estimateTravelMinutes(distanceKm, trafficMultiplier);

  // 🔥 HARD FILTER (ignore far hospitals)
  if (distanceKm > 50) return null;

  const distanceScore = clamp(1 - distanceKm / 50, 0, 1);
  const bedCapacity = hospital.availableBeds + hospital.icuBeds;
  const capacityScore = clamp(bedCapacity / 80, 0.1, 1);

  const icuImportance = severity === "critical" ? 0.2 : 0.08;
  const icuScore = clamp(hospital.icuBeds / 40, 0.1, 1);

  const specialistMatch = hospital.specialistsOnDuty.includes(requiredSpecialty)
    ? 1
    : hospital.specialistsOnDuty.includes("general")
    ? 0.7
    : 0.4;

  const readinessScore = clamp(Number(hospital.emergencyReadiness || 0.75), 0.5, 1);

  // 🔥 DISTANCE DOMINATES
  const score =
    distanceScore * 0.5 +
    capacityScore * 0.15 +
    specialistMatch * 0.15 +
    readinessScore * 0.1 +
    icuScore * icuImportance;

  return {
    ...hospital,
    distanceKm: roundTo(distanceKm, 1),
    etaMinutes,
    trafficMultiplier,
    mapsUrl: buildOSMSearchUrl(hospital),
    directionsUrl: buildOSMDirectionsUrl(location, hospital),
    specialistMatch,
    score: roundTo(score, 3),
  };
}

// =========================
// 🏥 BEST HOSPITAL (UPDATED)
// =========================
async function getBestHospitalForEmergency(location, { requiredSpecialty, severity }) {
  const hospitals = await getHospitals();

  if (!hospitals || hospitals.length === 0) {
    throw new Error("No hospitals available");
  }

  const ranked = hospitals
    .map((hospital) =>
      scoreHospitalCandidate({ hospital, location, requiredSpecialty, severity })
    )
    .filter(Boolean) // 🔥 remove far hospitals
    .sort((a, b) => b.score - a.score);

  // 🔥 if no nearby hospital → fallback
  if (!ranked.length) {
    const dynamicHospitals = buildDynamicLocalHospitals(location, requiredSpecialty)
      .map((hospital) =>
        scoreHospitalCandidate({ hospital, location, requiredSpecialty, severity })
      )
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    return {
      ...dynamicHospitals[0],
      selectedBy: "dynamic-local-network",
    };
  }

  return {
    ...ranked[0],
    selectedBy: "weighted-nearest-score",
  };
}

// =========================
// 📋 PATIENT SNAPSHOT
// =========================
async function buildPatientMedicalSnapshot(patientId) {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: patientId },
  });

  const records = await prisma.medicalRecord.findMany({
    where: { userId: patientId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return {
    patientId,
    bloodGroup: profile?.bloodGroup ?? "",
    allergies: profile?.allergies ?? [],
    diseases: profile?.diseases ?? [],
    medications: profile?.medications ?? [],
    emergencyContact: profile?.emergencyContact ?? "",
    recentRecords: records,
  };
}

// =========================
// 🆔 ROOM ID
// =========================
export function createEmergencyRoomId(emergencyId) {
  return `emergency:${emergencyId}`;
}

// =========================
// 🏥 PUBLIC HELPER
// =========================
export async function getNearestHospital(location) {
  const normalizedLocation = normalizeCoordinates(location);

  return getBestHospitalForEmergency(normalizedLocation, {
    requiredSpecialty: "general",
    severity: "moderate",
  });
}

// =========================
// 🚑 MAIN DISPATCH
// =========================
export async function createEmergencyDispatch({
  patientId,
  location,
  symptoms,
  patientNote,
}) {
  try {
    const normalizedLocation = normalizeCoordinates(location);
    const severity = inferSeverity(symptoms, patientNote);
    const requiredSpecialty = inferRequiredSpecialty(symptoms);

    const emergencyId = randomUUID();

    const selectedHospital = await getBestHospitalForEmergency(normalizedLocation, {
      requiredSpecialty,
      severity,
    });

// 🛠️ SAFE CAPACITY RESERVATION
try {
  await reserveHospitalCapacity(selectedHospital.id, severity);
} catch (err) {
  console.warn(
    "⚠️ Skipping hospital capacity update (not in DB):",
    selectedHospital.id
  );
}
    const assignedAmbulance = await assignNearestAmbulance(
      normalizedLocation,
      emergencyId
    );

    if (!assignedAmbulance) {
      throw new Error("No ambulance available");
    }

    const assignedDoctor = await assignDoctorForEmergency({
      hospitalId: selectedHospital.id,
      requiredSpecialty,
      severity,
      emergencyId,
    });

    console.log("🚑 Emergency Dispatch Created:", emergencyId);
    console.log("🏥 Hospital:", selectedHospital.name);
    console.log("🚑 Ambulance:", assignedAmbulance.id);

    const medicalSnapshot = await buildPatientMedicalSnapshot(patientId);

    const handoffMessage = buildHospitalHandoffMessage({
      emergencyId,
      hospital: selectedHospital,
      doctor: assignedDoctor,
      severity,
      symptoms,
      ambulance: assignedAmbulance,
    });

    const emergency = await prisma.emergencyRequest.create({
      data: {
        id: emergencyId,

        // 🔥 FIXED ROOM ID
        roomId: createEmergencyRoomId(emergencyId),

        patientId,
        status: "pending",
        severity,
        requiredSpecialty,
        symptoms: typeof symptoms === "string" ? symptoms.trim() : "",

        location: normalizedLocation,
        patientLocationMapsUrl: buildPatientLocationMapsUrl(normalizedLocation),

        nearestHospital: selectedHospital,

        ambulanceId: assignedAmbulance.id,
        assignedAmbulance,

        ambulanceLocation: {
          lat: assignedAmbulance.currentLocation.lat,
          lng: assignedAmbulance.currentLocation.lng,
          source: "dispatch",
        },

        assignedDoctor,

        medicalSnapshot,
        emergencyContact: medicalSnapshot.emergencyContact,
        familyContactNotified: Boolean(medicalSnapshot.emergencyContact),

        patientNote: typeof patientNote === "string" ? patientNote.trim() : "",

        handoffMessage,

        dispatchMetrics: {
          ambulanceDistanceKm: assignedAmbulance.distanceKm,
          ambulanceEtaMinutes: assignedAmbulance.etaMinutes,
          hospitalDistanceKm: selectedHospital.distanceKm,
          hospitalEtaMinutes: selectedHospital.etaMinutes,
          hospitalScore: selectedHospital.score,
          trafficMultiplier: selectedHospital.trafficMultiplier,
          responseWindowSeconds: Math.max(
            60,
            Math.round((assignedAmbulance.etaMinutes || 8) * 40)
          ),
        },
      },
    });

    return emergency;
  } catch (error) {
    console.error("❌ Dispatch error:", error.message);
    throw new Error("Failed to dispatch emergency");
  }
}