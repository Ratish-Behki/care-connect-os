import { randomUUID } from "crypto";
import axios from "axios";
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
  reserveHospitalCapacity,
} from "./emergency.resources.js";

import {
  inferRequiredSpecialty,
  inferSeverity,
  normalizeCoordinates,
  buildHospitalHandoffMessage,
} from "./emergency.utils.js";


// =========================
// 🌍 FREE OSM FETCH (FINAL)
// =========================
async function fetchNearbyHospitals(location) {
  const { lat, lng } = location;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error("❌ Invalid coordinates for OSM fetch");
    return [];
  }

  try {
    const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:10000,${lat},${lng});
    );
    out body;
    `;

    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.nchc.org.tw/api/interpreter",
    ];

    const payload = new URLSearchParams({ data: query }).toString();
    let response;

    for (const endpoint of endpoints) {
      try {
        const result = await axios.post(endpoint, payload, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "User-Agent": "care-connect-os/1.0 (local dev)",
          },
          timeout: 15000,
        });

        if (result.status >= 400) {
          console.warn(`❌ OSM fetch error (${endpoint}): ${result.status}`);
          continue;
        }

        response = result;
        break;
      } catch (requestError) {
        const status = requestError.response?.status;
        const data = requestError.response?.data;
        const details = data ? JSON.stringify(data).slice(0, 200) : "";
        console.warn(
          `❌ OSM fetch error (${endpoint}): ${status || requestError.message}${
            details ? ` | ${details}` : ""
          }`
        );
      }
    }

    if (!response) {
      return [];
    }

    const elements = response.data?.elements || [];

    console.log("🌍 OSM hospitals:", elements.length);

    const filtered = elements.filter((el) => {
      const name = (el.tags?.name || "").toLowerCase();
      const healthcare = (el.tags?.healthcare || "").toLowerCase();

      return !(
        name.includes("maternity") ||
        name.includes("clinic") ||
        name.includes("nursing") ||
        name.includes("dental") ||
        name.includes("child") ||
        name.includes("children") ||
        name.includes("women") ||
        healthcare === "maternity" ||
        healthcare === "clinic"
      );
    });

    return filtered.slice(0, 10).map((el) => ({
      id: `osm-${el.id}`,
      osmId: el.id,
      name: el.tags?.name || "Nearby Hospital",
      lat: el.lat,
      lng: el.lon,
      address:
        el.tags?.["addr:full"] ||
        el.tags?.["addr:street"] ||
        "Near your location",

      availableBeds: 20,
      icuBeds: 5,
      specialistsOnDuty: ["general"],
      emergencyReadiness: 0.8,
      source: "osm",
    }));
  } catch (error) {
    console.error("❌ OSM fetch error:", error.message);
    return [];
  }
}


// =========================
// 🧠 AI SCORING
// =========================
function scoreHospitalCandidate({
  hospital,
  location,
  requiredSpecialty,
  severity,
  allowFar = false,
}) {
  const distanceKm = getDistanceKm(location, hospital);
  const trafficMultiplier = getTrafficMultiplier(location);
  const etaMinutes = estimateTravelMinutes(distanceKm, trafficMultiplier);

  if (!allowFar && distanceKm > 100) return null;

  const distanceScore = clamp(1 - distanceKm / 100, 0, 1);
  const capacityScore = clamp((hospital.availableBeds + hospital.icuBeds) / 80, 0.1, 1);
  const sizeScore = capacityScore;

  const icuImportance = severity === "critical" ? 0.2 : 0.08;
  const icuScore = clamp(hospital.icuBeds / 40, 0.1, 1);

  const specialistMatch = hospital.specialistsOnDuty.includes(requiredSpecialty)
    ? 1
    : 0.7;

  const readinessScore = clamp(hospital.emergencyReadiness || 0.75, 0.5, 1);

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
    score: roundTo(score, 3),
    sizeScore,
  };
}


// =========================
// 🏥 BEST HOSPITAL (FINAL)
// =========================
async function getBestHospitalForEmergency(location, { requiredSpecialty, severity }) {
  const hospitals = await fetchNearbyHospitals(location);

  if (!hospitals.length) {
    console.warn("⚠️ No OSM hospitals found → using fallback");

    const fallbackHospital = {
      id: "fallback",
      name: "Nearest Emergency Hospital",
      lat: location.lat + 0.01,
      lng: location.lng + 0.01,
      address: "Nearby emergency facility",
      availableBeds: 10,
      icuBeds: 3,
      specialistsOnDuty: ["general"],
      emergencyReadiness: 0.7,
      distanceKm: 1,
      etaMinutes: 5,
      score: 0.5,
      selectedBy: "fallback",
      source: "fallback",
    };

    return {
      selectedHospital: fallbackHospital,
      nearbyHospitals: [fallbackHospital],
    };
  }

  const ranked = hospitals
    .map((hospital) =>
      scoreHospitalCandidate({ hospital, location, requiredSpecialty, severity })
    )
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  console.log(
    "🏥 Hospital ranking:",
    ranked.map((hospital) => ({
      name: hospital.name,
      distanceKm: hospital.distanceKm,
      sizeScore: hospital.sizeScore,
      score: hospital.score,
    }))
  );

  const fallbackScored = scoreHospitalCandidate({
    hospital: hospitals[0],
    location,
    requiredSpecialty,
    severity,
    allowFar: true,
  });

  const selectedHospital = ranked.length
    ? {
        ...ranked[0],
        selectedBy: "osm-ai",
      }
    : {
        ...(fallbackScored || hospitals[0]),
        selectedBy: "osm-fallback",
      };

  const nearbyHospitals = ranked.length
    ? ranked.slice(0, 3)
    : [fallbackScored || hospitals[0]];

  console.log("🏥 Selected hospital:", {
    name: selectedHospital.name,
    lat: selectedHospital.lat,
    lng: selectedHospital.lng,
    distanceKm: selectedHospital.distanceKm,
    sizeScore: selectedHospital.sizeScore,
    score: selectedHospital.score,
    selectedBy: selectedHospital.selectedBy,
  });

  return {
    selectedHospital,
    nearbyHospitals,
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

    const { selectedHospital, nearbyHospitals } =
      await getBestHospitalForEmergency(normalizedLocation, {
        requiredSpecialty,
        severity,
      });

    if (selectedHospital.source !== "osm" && selectedHospital.source !== "fallback") {
      try {
        await reserveHospitalCapacity(selectedHospital.id, severity);
      } catch {
        console.warn("⚠️ Skipping capacity update");
      }
    }

    const assignedAmbulance = await assignNearestAmbulance(
      normalizedLocation,
      emergencyId
    );

    if (!assignedAmbulance) {
      console.warn("⚠️ No ambulance found → using dummy ambulance");
    }

    const assignedDoctor = await assignDoctorForEmergency({
      hospitalId: selectedHospital.id,
      requiredSpecialty,
      severity,
      emergencyId,
    });

    const medicalSnapshot = await buildPatientMedicalSnapshot(patientId);

    const handoffMessage = buildHospitalHandoffMessage({
      emergencyId,
      hospital: selectedHospital,
      doctor: assignedDoctor,
      severity: severity || "moderate",
      symptoms,
      ambulance: assignedAmbulance,
    });

    const emergency = await prisma.emergencyRequest.create({
      data: {
        id: emergencyId,
        roomId: createEmergencyRoomId(emergencyId),

        patientId,
        status: "pending",
        severity,
        requiredSpecialty,
        symptoms,

        location: normalizedLocation,
        patientLocationMapsUrl: buildPatientLocationMapsUrl(normalizedLocation),

        nearestHospital: selectedHospital,
        nearbyHospitals,

        ambulanceId: assignedAmbulance.id,
        assignedAmbulance,

        ambulanceLocation: assignedAmbulance.currentLocation,
        assignedDoctor,

        medicalSnapshot,
        emergencyContact: medicalSnapshot.emergencyContact,

        dispatchMetrics: {
          hospitalDistanceKm: selectedHospital.distanceKm,
          hospitalEtaMinutes: selectedHospital.etaMinutes,
          hospitalScore: selectedHospital.score,
        },
        patientNote: patientNote?.trim() || "",
        handoffMessage,
      },
    });

    console.log("🚑 Emergency Created:", emergencyId);
    console.log("🏥 Hospital:", selectedHospital.name);

    return emergency;

  } catch (error) {
    console.error("❌ Dispatch error:", error.message);
    throw new Error("Failed to dispatch emergency");
  }
}