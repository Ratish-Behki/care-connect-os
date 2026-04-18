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

export async function reserveHospitalCapacity(hospitalId, severity) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
  });

  if (!hospital) {
    return;
  }

  const bedReduction = severity === "critical" ? 2 : 1;
  const nextBeds = Math.max(0, hospital.availableBeds - bedReduction);
  const nextIcuBeds = severity === "critical" ? Math.max(0, hospital.icuBeds - 1) : hospital.icuBeds;

  await prisma.hospital.update({
    where: { id: hospitalId },
    data: {
      availableBeds: nextBeds,
      icuBeds: nextIcuBeds,
    },
  });
}

function selectAvailableAmbulance(location, ambulances) {
  const availableAmbulances = ambulances.filter((ambulance) => ambulance.availability === "available");

  if (availableAmbulances.length === 0) {
    const fallback = ambulances[0];

    return {
      ...fallback,
      currentLocation: { lat: fallback.currentLatitude, lng: fallback.currentLongitude },
      distanceKm: roundTo(getDistanceKm(location, { lat: fallback.currentLatitude, lng: fallback.currentLongitude }), 1),
      etaMinutes: estimateTravelMinutes(
        getDistanceKm(location, { lat: fallback.currentLatitude, lng: fallback.currentLongitude }),
        getTrafficMultiplier(location)
      ),
      wasFallback: true,
    };
  }

  const ranked = availableAmbulances
    .map((ambulance) => {
      const currentLocation = { lat: ambulance.currentLatitude, lng: ambulance.currentLongitude };
      const distanceKm = getDistanceKm(location, currentLocation);
      const etaMinutes = estimateTravelMinutes(distanceKm, getTrafficMultiplier(location));

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

export async function assignNearestAmbulance(location, emergencyId) {
  const ambulances = await getAmbulances();
  const selected = selectAvailableAmbulance(location, ambulances);

  if (!selected || selected.distanceKm > 90) {
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
      etaMinutes: estimateTravelMinutes(distanceKm, getTrafficMultiplier(location)),
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

  return selected;
}

function rankDoctorsForEmergency({ hospitalId, requiredSpecialty, severity, doctors }) {
  const availableDoctors = doctors.filter((doctor) => doctor.available);
  const normalizedDoctors = availableDoctors.map(normalizeDoctorSpecialties);

  const ranked = normalizedDoctors
    .map((doctor) => {
      const sameHospital = doctor.hospitalId === hospitalId ? 1 : 0.65;
      const specialtyMatch = doctor.specialtyTags.includes(requiredSpecialty)
        ? 1
        : doctor.specialtyTags.includes("general")
          ? 0.7
          : 0.45;
      const seniorityScore = clamp(doctor.experience / 18, 0.4, 1);
      const criticalBoost = severity === "critical" && specialtyMatch === 1 ? 0.1 : 0;

      const score = sameHospital * 0.45 + specialtyMatch * 0.35 + seniorityScore * 0.2 + criticalBoost;

      return {
        ...doctor,
        score: roundTo(score, 3),
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked;
}

export async function assignDoctorForEmergency({ hospitalId, requiredSpecialty, severity, emergencyId }) {
  const doctors = await getDoctors();
  const ranked = rankDoctorsForEmergency({ hospitalId, requiredSpecialty, severity, doctors });
  const selected = ranked[0] || normalizeDoctorSpecialties(doctors[0]);

  if (selected?.id) {
    await prisma.doctor.update({
      where: { id: selected.id },
      data: {
        available: false,
        activeEmergencyId: emergencyId,
        lastUpdatedAt: new Date(),
      },
    });
  }

  return selected;
}

export async function releaseEmergencyResources(emergency) {
  if (emergency.ambulanceId) {
    await prisma.ambulance
      .update({
        where: { id: emergency.ambulanceId },
        data: {
          availability: "available",
          activeEmergencyId: null,
          lastUpdatedAt: new Date(),
        },
      })
      .catch(() => null);
  }

  if (emergency.assignedDoctor?.id) {
    await prisma.doctor
      .update({
        where: { id: emergency.assignedDoctor.id },
        data: {
          available: true,
          activeEmergencyId: null,
          lastUpdatedAt: new Date(),
        },
      })
      .catch(() => null);
  }
}

export async function getEmergencyResources() {
  const [ambulances, hospitals, doctors] = await Promise.all([
    prisma.ambulance.findMany(),
    prisma.hospital.findMany(),
    prisma.doctor.findMany(),
  ]);

  return {
    ambulances: ambulances.map((ambulance) => ({
      id: ambulance.id,
      driverName: ambulance.driverName,
      availability: ambulance.availability,
      location: {
        lat: ambulance.currentLatitude,
        lng: ambulance.currentLongitude,
      },
      activeEmergencyId: ambulance.activeEmergencyId,
    })),
    hospitals: hospitals.map((hospital) => ({
      id: hospital.id,
      name: hospital.name,
      availableBeds: hospital.availableBeds,
      icuBeds: hospital.icuBeds,
      emergencyReadiness: hospital.emergencyReadiness,
    })),
    doctors: doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.specialization,
      available: doctor.available,
      hospitalId: doctor.hospitalId,
      activeEmergencyId: doctor.activeEmergencyId,
    })),
  };
}
