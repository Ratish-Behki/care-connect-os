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

function scoreHospitalCandidate({ hospital, location, requiredSpecialty, severity }) {
  const distanceKm = getDistanceKm(location, hospital);
  const trafficMultiplier = getTrafficMultiplier(location);
  const etaMinutes = estimateTravelMinutes(distanceKm, trafficMultiplier);
  const distanceScore = clamp(1 - distanceKm / 40, 0, 1);
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

  const score =
    distanceScore * 0.35 +
    capacityScore * 0.2 +
    specialistMatch * 0.22 +
    readinessScore * 0.15 +
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

async function getBestHospitalForEmergency(location, { requiredSpecialty, severity }) {
  const hospitals = await getHospitals();
  const ranked = hospitals
    .map((hospital) => scoreHospitalCandidate({ hospital, location, requiredSpecialty, severity }))
    .sort((a, b) => b.score - a.score);

  if (ranked[0] && ranked[0].distanceKm > 120) {
    const dynamicHospitals = buildDynamicLocalHospitals(location, requiredSpecialty)
      .map((hospital) => scoreHospitalCandidate({ hospital, location, requiredSpecialty, severity }))
      .sort((a, b) => b.score - a.score);

    return {
      ...dynamicHospitals[0],
      selectedBy: "dynamic-local-network",
    };
  }

  return {
    ...(ranked[0] || scoreHospitalCandidate({ hospital: hospitals[0], location, requiredSpecialty, severity })),
    selectedBy: "weighted-score",
  };
}

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

export function createEmergencyRoomId(emergencyId) {
  return `emergency:${emergencyId}`;
}

export async function getNearestHospital(location) {
  const normalizedLocation = normalizeCoordinates(location);
  return getBestHospitalForEmergency(normalizedLocation, {
    requiredSpecialty: "general",
    severity: "moderate",
  });
}

export async function createEmergencyDispatch({ patientId, location, symptoms, patientNote }) {
  const normalizedLocation = normalizeCoordinates(location);
  const severity = inferSeverity(symptoms, patientNote);
  const requiredSpecialty = inferRequiredSpecialty(symptoms);
  const emergencyId = randomUUID();

  const selectedHospital = await getBestHospitalForEmergency(normalizedLocation, {
    requiredSpecialty,
    severity,
  });

  await reserveHospitalCapacity(selectedHospital.id, severity);

  const assignedAmbulance = await assignNearestAmbulance(normalizedLocation, emergencyId);
  const assignedDoctor = await assignDoctorForEmergency({
    hospitalId: selectedHospital.id,
    requiredSpecialty,
    severity,
    emergencyId,
  });

  const assignedAmbulancePayload = {
    ...assignedAmbulance,
    lastUpdatedAt: assignedAmbulance.lastUpdatedAt
      ? new Date(assignedAmbulance.lastUpdatedAt).toISOString()
      : undefined,
  };

  const assignedDoctorPayload = assignedDoctor
    ? {
        ...assignedDoctor,
        lastUpdatedAt: assignedDoctor.lastUpdatedAt
          ? new Date(assignedDoctor.lastUpdatedAt).toISOString()
          : undefined,
      }
    : null;

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
      roomId: createEmergencyRoomId(randomUUID()),
      patientId,
      status: "pending",
      severity,
      requiredSpecialty,
      symptoms: typeof symptoms === "string" ? symptoms.trim() : "",
      location: normalizedLocation,
      patientLocationMapsUrl: buildPatientLocationMapsUrl(normalizedLocation),
      nearestHospital: selectedHospital,
      ambulanceId: assignedAmbulance.id,
      assignedAmbulance: assignedAmbulancePayload,
      ambulanceLocation: {
        lat: assignedAmbulance.currentLocation.lat,
        lng: assignedAmbulance.currentLocation.lng,
        source: "dispatch",
      },
      assignedDoctor: assignedDoctorPayload,
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
        responseWindowSeconds: Math.max(60, Math.round((assignedAmbulance.etaMinutes || 8) * 40)),
      },
    },
  });

  return emergency;
}
