import { prisma } from "../../database/prismaClient.js";
import {
  DOCTOR_DIRECTORY,
  EMERGENCY_AMBULANCES,
  EMERGENCY_HOSPITALS,
} from "./emergency.constants.js";
import {
  clamp,
  estimateTravelMinutes,
  getDistanceKm,
  getTrafficMultiplier,
  roundTo,
} from "./emergency.geo.js";
import { normalizeDoctorSpecialties } from "./emergency.utils.js";

// =========================
// 🏥 DATA FETCHERS
// =========================
export async function getHospitals() {
  const hospitals = await prisma.hospital.findMany();
  return hospitals.length ? hospitals : EMERGENCY_HOSPITALS;
}

export async function getAmbulances() {
  const ambulances = await prisma.ambulance.findMany();
  return ambulances.length ? ambulances : EMERGENCY_AMBULANCES;
}

export async function getDoctors() {
  const doctors = await prisma.doctor.findMany();
  return doctors.length ? doctors : DOCTOR_DIRECTORY;
}

// =========================
// 🏥 RESERVE HOSPITAL CAPACITY
// =========================
export async function reserveHospitalCapacity(hospitalId, severity) {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new Error("Hospital not found");
    }

    if (hospital.availableBeds <= 0) {
      throw new Error("No beds available in hospital");
    }

    const bedReduction = severity === "critical" ? 2 : 1;

    const nextBeds = Math.max(0, hospital.availableBeds - bedReduction);
    const nextIcuBeds =
      severity === "critical"
        ? Math.max(0, hospital.icuBeds - 1)
        : hospital.icuBeds;

    await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        availableBeds: nextBeds,
        icuBeds: nextIcuBeds,
      },
    });

    console.log("🏥 Capacity reserved:", hospitalId);
  } catch (err) {
    console.error("❌ Hospital capacity error:", err.message);
    throw err;
  }
}

// =========================
// 🚑 AMBULANCE SELECTION
// =========================
function selectAvailableAmbulance(location, ambulances) {
  if (!ambulances || ambulances.length === 0) {
    throw new Error("No ambulances available");
  }

  const available = ambulances.filter(
    (a) => a.availability === "available"
  );

  if (available.length === 0) {
    const fallback = ambulances[0];

    const currentLocation = {
      lat: fallback.currentLatitude,
      lng: fallback.currentLongitude,
    };

    const distanceKm = getDistanceKm(location, currentLocation);

    return {
      ...fallback,
      currentLocation,
      distanceKm: roundTo(distanceKm, 1),
      etaMinutes: estimateTravelMinutes(
        distanceKm,
        getTrafficMultiplier(location)
      ),
      wasFallback: true,
    };
  }

  const ranked = available
    .map((ambulance) => {
      const currentLocation = {
        lat: ambulance.currentLatitude,
        lng: ambulance.currentLongitude,
      };

      const distanceKm = getDistanceKm(location, currentLocation);
      const etaMinutes = estimateTravelMinutes(
        distanceKm,
        getTrafficMultiplier(location)
      );

      return {
        ...ambulance,
        currentLocation,
        distanceKm: roundTo(distanceKm, 1),
        etaMinutes,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    ...ranked[0],
    wasFallback: false,
  };
}

// =========================
// 🚑 ASSIGN AMBULANCE
// =========================
export async function assignNearestAmbulance(location, emergencyId) {
  try {
    const ambulances = await getAmbulances();
    const selected = selectAvailableAmbulance(location, ambulances);

    if (!selected || selected.distanceKm > 90) {
      console.log("⚠️ Using dynamic ambulance");

      const dynamicAmbulance = {
        id: `A-DYN-${emergencyId.slice(0, 4).toUpperCase()}`,
        driverName: "Auto Dispatch Unit",
        phone: "+91 1800 911 108",
        vehicleNumber: `DYN-${emergencyId.slice(0, 4).toUpperCase()}`,
        currentLatitude: roundTo(location.lat + 0.017, 5),
        currentLongitude: roundTo(location.lng - 0.013, 5),
        availability: "dispatched",
        baseHospitalId: "dynamic-local-network",
        activeEmergencyId: emergencyId,
        lastUpdatedAt: new Date(),
      };

      const distanceKm = getDistanceKm(location, {
        lat: dynamicAmbulance.currentLatitude,
        lng: dynamicAmbulance.currentLongitude,
      });

      await prisma.ambulance.create({
        data: dynamicAmbulance,
      });

      return {
        ...dynamicAmbulance,
        currentLocation: {
          lat: dynamicAmbulance.currentLatitude,
          lng: dynamicAmbulance.currentLongitude,
        },
        distanceKm: roundTo(distanceKm, 1),
        etaMinutes: estimateTravelMinutes(
          distanceKm,
          getTrafficMultiplier(location)
        ),
        wasFallback: true,
      };
    }

    await prisma.ambulance.update({
      where: { id: selected.id },
      data: {
        availability: "dispatched",
        activeEmergencyId: emergencyId,
        lastUpdatedAt: new Date(),
      },
    });

    console.log("🚑 Assigned ambulance:", selected.id);

    return selected;
  } catch (err) {
    console.error("❌ Ambulance assignment failed:", err.message);
    throw new Error("Failed to assign ambulance");
  }
}

// =========================
// 👨‍⚕️ DOCTOR SELECTION
// =========================
function rankDoctorsForEmergency({
  hospitalId,
  requiredSpecialty,
  severity,
  doctors,
}) {
  const availableDoctors = doctors.filter((d) => d.available);

  if (!availableDoctors.length) {
    return [];
  }

  const normalized = availableDoctors.map(normalizeDoctorSpecialties);

  return normalized
    .map((doctor) => {
      const sameHospital = doctor.hospitalId === hospitalId ? 1 : 0.65;
      const specialtyMatch = doctor.specialtyTags.includes(
        requiredSpecialty
      )
        ? 1
        : doctor.specialtyTags.includes("general")
        ? 0.7
        : 0.45;

      const seniorityScore = clamp(doctor.experience / 18, 0.4, 1);
      const criticalBoost =
        severity === "critical" && specialtyMatch === 1 ? 0.1 : 0;

      const score =
        sameHospital * 0.45 +
        specialtyMatch * 0.35 +
        seniorityScore * 0.2 +
        criticalBoost;

      return { ...doctor, score: roundTo(score, 3) };
    })
    .sort((a, b) => b.score - a.score);
}

// =========================
// 👨‍⚕️ ASSIGN DOCTOR
// =========================
export async function assignDoctorForEmergency({
  hospitalId,
  requiredSpecialty,
  severity,
  emergencyId,
}) {
  try {
    const doctors = await getDoctors();
    const ranked = rankDoctorsForEmergency({
      hospitalId,
      requiredSpecialty,
      severity,
      doctors,
    });

    const selected = ranked[0];

    if (!selected) {
      console.warn("⚠️ Using dynamic doctor");

      return {
        id: `D-DYN-${emergencyId.slice(0, 4).toUpperCase()}`,
        name: "Auto Assign Physician",
        specialization: requiredSpecialty,
        available: false,
        hospitalId,
        wasFallback: true,
      };
    }

    try {
      await prisma.doctor.update({
        where: { id: selected.id },
        data: {
          available: false,
          activeEmergencyId: emergencyId,
          lastUpdatedAt: new Date(),
        },
      });

      console.log("👨‍⚕️ Assigned doctor:", selected.name);

      return selected;
    } catch (updateError) {
      console.warn("⚠️ Doctor not found in DB, using fallback assignment");
      return { ...selected, wasFallback: true };
    }
  } catch (err) {
    console.error("❌ Doctor assignment failed:", err.message);
    throw new Error("Failed to assign doctor");
  }
}

// =========================
// 🔄 RELEASE RESOURCES
// =========================
export async function releaseEmergencyResources(emergency) {
  await Promise.all([
    emergency.ambulanceId
      ? prisma.ambulance
          .update({
            where: { id: emergency.ambulanceId },
            data: {
              availability: "available",
              activeEmergencyId: null,
              lastUpdatedAt: new Date(),
            },
          })
          .catch(() => null)
      : null,

    emergency.assignedDoctor?.id
      ? prisma.doctor
          .update({
            where: { id: emergency.assignedDoctor.id },
            data: {
              available: true,
              activeEmergencyId: null,
              lastUpdatedAt: new Date(),
            },
          })
          .catch(() => null)
      : null,
  ]);
}

// =========================
// 📊 RESOURCES SNAPSHOT
// =========================
export async function getEmergencyResources() {
  const [ambulances, hospitals, doctors] = await Promise.all([
    prisma.ambulance.findMany(),
    prisma.hospital.findMany(),
    prisma.doctor.findMany(),
  ]);

  return {
    ambulances: ambulances.map((a) => ({
      id: a.id,
      driverName: a.driverName,
      availability: a.availability,
      location: {
        lat: a.currentLatitude,
        lng: a.currentLongitude,
      },
      activeEmergencyId: a.activeEmergencyId,
    })),
    hospitals: hospitals.map((h) => ({
      id: h.id,
      name: h.name,
      availableBeds: h.availableBeds,
      icuBeds: h.icuBeds,
      emergencyReadiness: h.emergencyReadiness,
    })),
    doctors: doctors.map((d) => ({
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      available: d.available,
      hospitalId: d.hospitalId,
      activeEmergencyId: d.activeEmergencyId,
    })),
  };
}