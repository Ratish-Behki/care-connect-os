import { randomUUID } from "crypto";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || "";

const DEFAULT_COORDINATES = { lat: 28.6139, lng: 77.2090 };

const EMERGENCY_HOSPITALS = [
  {
    id: "h-del-101",
    name: "AIIMS Trauma Center",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi",
    phone: "+91 11 2658 8500",
    lat: 28.5672,
    lng: 77.2100,
    emergencyReadiness: 0.97,
    icuBeds: 34,
    availableBeds: 42,
    specialistsOnDuty: ["trauma", "cardiology", "neurology", "general"],
  },
  {
    id: "h-del-102",
    name: "Safdarjung Emergency Block",
    address: "Ansari Nagar West, New Delhi",
    phone: "+91 11 2673 0000",
    lat: 28.5675,
    lng: 77.2039,
    emergencyReadiness: 0.92,
    icuBeds: 26,
    availableBeds: 30,
    specialistsOnDuty: ["trauma", "orthopedics", "general", "pulmonology"],
  },
  {
    id: "h-del-103",
    name: "Apollo Emergency Center",
    address: "Sarita Vihar, New Delhi",
    phone: "+91 11 2692 5858",
    lat: 28.5413,
    lng: 77.2831,
    emergencyReadiness: 0.9,
    icuBeds: 22,
    availableBeds: 28,
    specialistsOnDuty: ["cardiology", "neurology", "pulmonology", "general"],
  },
  {
    id: "h-del-104",
    name: "Fortis Emergency Care",
    address: "Shalimar Bagh, New Delhi",
    phone: "+91 11 4530 2222",
    lat: 28.7142,
    lng: 77.1526,
    emergencyReadiness: 0.86,
    icuBeds: 18,
    availableBeds: 24,
    specialistsOnDuty: ["cardiology", "stroke", "general"],
  },
  {
    id: "h-del-105",
    name: "Max Smart Emergency",
    address: "Saket, New Delhi",
    phone: "+91 11 2651 5050",
    lat: 28.5246,
    lng: 77.2066,
    emergencyReadiness: 0.88,
    icuBeds: 16,
    availableBeds: 20,
    specialistsOnDuty: ["neurology", "general", "orthopedics"],
  },
];

const EMERGENCY_AMBULANCES = [
  {
    id: "A-204",
    driverName: "Raj Kumar",
    phone: "+91 98111 22334",
    vehicleNumber: "DL1RX2040",
    currentLatitude: 28.6246,
    currentLongitude: 77.2167,
    availability: "available",
    baseHospitalId: "h-del-101",
  },
  {
    id: "A-178",
    driverName: "Amit Sharma",
    phone: "+91 98111 55670",
    vehicleNumber: "DL1RX1780",
    currentLatitude: 28.5560,
    currentLongitude: 77.2560,
    availability: "available",
    baseHospitalId: "h-del-103",
  },
  {
    id: "A-112",
    driverName: "Neha Singh",
    phone: "+91 98111 88901",
    vehicleNumber: "DL1RX1120",
    currentLatitude: 28.6455,
    currentLongitude: 77.1390,
    availability: "available",
    baseHospitalId: "h-del-104",
  },
  {
    id: "A-089",
    driverName: "Imran Ali",
    phone: "+91 98111 77651",
    vehicleNumber: "DL1RX0890",
    currentLatitude: 28.5342,
    currentLongitude: 77.2178,
    availability: "available",
    baseHospitalId: "h-del-105",
  },
];

const DOCTOR_DIRECTORY = [
  {
    id: "d-em-101",
    name: "Dr. Meera Kapoor",
    specialization: "Emergency Medicine",
    experience: 12,
    rating: 4.9,
    avatar: "",
    available: true,
    department: "Trauma",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-101",
    phone: "+91 98110 77881",
  },
  {
    id: "d-em-102",
    name: "Dr. Arjun Malhotra",
    specialization: "Cardiology",
    experience: 14,
    rating: 4.8,
    avatar: "",
    available: true,
    department: "Cardiac Emergency",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-103",
    phone: "+91 98110 77882",
  },
  {
    id: "d-em-103",
    name: "Dr. Priya Nair",
    specialization: "Neurology",
    experience: 11,
    rating: 4.8,
    avatar: "",
    available: true,
    department: "Stroke Unit",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-104",
    phone: "+91 98110 77883",
  },
  {
    id: "d-em-104",
    name: "Dr. Rohit Verma",
    specialization: "General Medicine",
    experience: 10,
    rating: 4.7,
    avatar: "",
    available: true,
    department: "Emergency Intake",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-102",
    phone: "+91 98110 77884",
  },
  {
    id: "d-em-105",
    name: "Dr. Sana Iqbal",
    specialization: "Pulmonology",
    experience: 9,
    rating: 4.7,
    avatar: "",
    available: true,
    department: "Respiratory Emergency",
    fee: 0,
    nextAvailable: "On duty",
    hospitalId: "h-del-105",
    phone: "+91 98110 77885",
  },
];

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function roundTo(value, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getDistanceKm(origin, destination) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(destination.lat - origin.lat);
  const longitudeDelta = toRadians(destination.lng - origin.lng);
  const startLatitude = toRadians(origin.lat);
  const endLatitude = toRadians(destination.lat);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(startLatitude) * Math.cos(endLatitude) *
    Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildGoogleMapsDirectionsUrl(origin, destination) {
  const searchParams = new URLSearchParams({
    api: "1",
    travelmode: "driving",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
  });

  return `https://www.google.com/maps/dir/?${searchParams.toString()}`;
}

function buildGoogleMapsSearchUrl(place) {
  const query = encodeURIComponent(`${place.name} ${place.address || ""}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function buildPatientLocationMapsUrl(location) {
  const query = encodeURIComponent(`${location.lat},${location.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function estimateTravelMinutes(distanceKm, trafficMultiplier = 1) {
  return Math.max(4, Math.round(distanceKm * 2.6 * trafficMultiplier) + 3);
}

function getTrafficMultiplier(location) {
  const hour = new Date().getHours();
  const rushHour = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
  const cityCenterBias = Math.abs(location.lat - 28.6139) < 0.12 && Math.abs(location.lng - 77.2090) < 0.14;

  if (rushHour && cityCenterBias) {
    return 1.45;
  }

  if (rushHour) {
    return 1.25;
  }

  return 1;
}

async function fetchGoogleTravelInfo(origin, destination) {
  if (!GOOGLE_MAPS_API_KEY || typeof fetch !== "function") {
    return null;
  }

  const distanceMatrixUrl = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  distanceMatrixUrl.searchParams.set("origins", `${origin.lat},${origin.lng}`);
  distanceMatrixUrl.searchParams.set("destinations", `${destination.lat},${destination.lng}`);
  distanceMatrixUrl.searchParams.set("mode", "driving");
  distanceMatrixUrl.searchParams.set("units", "metric");
  distanceMatrixUrl.searchParams.set("key", GOOGLE_MAPS_API_KEY);

  const response = await fetch(distanceMatrixUrl.toString());
  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const element = payload?.rows?.[0]?.elements?.[0];

  if (!element || element.status !== "OK") {
    return null;
  }

  return {
    distanceKm: roundTo(element.distance.value / 1000, 1),
    etaMinutes: Math.max(4, Math.round(element.duration.value / 60)),
  };
}

async function fetchGoogleHospitalMatch(location) {
  try {
    if (!GOOGLE_MAPS_API_KEY || typeof fetch !== "function") {
      return null;
    }

    const nearbySearchUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    nearbySearchUrl.searchParams.set("location", `${location.lat},${location.lng}`);
    nearbySearchUrl.searchParams.set("rankby", "distance");
    nearbySearchUrl.searchParams.set("type", "hospital");
    nearbySearchUrl.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const nearbyResponse = await fetch(nearbySearchUrl.toString());
    if (!nearbyResponse.ok) {
      return null;
    }

    const nearbyPayload = await nearbyResponse.json().catch(() => null);
    const nearestCandidate = nearbyPayload?.results?.[0];

    if (!nearestCandidate?.place_id) {
      return null;
    }

    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", nearestCandidate.place_id);
    detailsUrl.searchParams.set("fields", "name,formatted_address,formatted_phone_number,geometry,url,place_id");
    detailsUrl.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsPayload = detailsResponse.ok ? await detailsResponse.json().catch(() => null) : null;
    const details = detailsPayload?.result ?? {};
    const coordinates = details.geometry?.location ?? nearestCandidate.geometry?.location ?? {};
    const hospitalCoordinates = {
      lat: Number.isFinite(Number(coordinates.lat)) ? Number(coordinates.lat) : location.lat,
      lng: Number.isFinite(Number(coordinates.lng)) ? Number(coordinates.lng) : location.lng,
    };

    const travelInfo = await fetchGoogleTravelInfo(location, hospitalCoordinates);
    const fallbackDistance = roundTo(getDistanceKm(location, hospitalCoordinates), 1);
    const trafficMultiplier = getTrafficMultiplier(location);
    const distanceKm = travelInfo?.distanceKm ?? fallbackDistance;
    const etaMinutes = travelInfo?.etaMinutes ?? estimateTravelMinutes(distanceKm, trafficMultiplier);

    return {
      id: details.place_id || nearestCandidate.place_id,
      name: details.name || nearestCandidate.name || "Nearest Hospital",
      address: details.formatted_address || nearestCandidate.vicinity || "Address unavailable",
      phone: details.formatted_phone_number || "Hospital phone unavailable",
      lat: hospitalCoordinates.lat,
      lng: hospitalCoordinates.lng,
      distanceKm,
      etaMinutes,
      mapsUrl: details.url || buildGoogleMapsSearchUrl({ name: details.name || nearestCandidate.name || "Nearest Hospital", address: details.formatted_address || nearestCandidate.vicinity || "" }),
      directionsUrl: buildGoogleMapsDirectionsUrl(location, hospitalCoordinates),
      trafficMultiplier,
      score: 0.8,
      availableBeds: 20,
      icuBeds: 10,
      emergencyReadiness: 0.85,
      specialistMatch: 0.7,
    };
  } catch {
    return null;
  }
}

function normalizeCoordinates(location) {
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

function inferSeverity(symptoms, patientNote) {
  const text = `${symptoms || ""} ${patientNote || ""}`.toLowerCase();

  if (/chest pain|breathing|stroke|faint|unconscious|seizure|severe bleeding|accident/.test(text)) {
    return "critical";
  }

  if (/high fever|vomiting|fracture|infection|asthma|dizziness/.test(text)) {
    return "high";
  }

  return "moderate";
}

function inferRequiredSpecialty(symptoms) {
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

function buildDynamicLocalHospitals(location, requiredSpecialty) {
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

function normalizeDoctorSpecialties(doctor) {
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

function scoreHospitalCandidate({ hospital, location, requiredSpecialty, severity }) {
  const distanceKm = getDistanceKm(location, hospital);
  const trafficMultiplier = getTrafficMultiplier(location);
  const etaMinutes = estimateTravelMinutes(distanceKm, trafficMultiplier);
  const distanceScore = clamp(1 - distanceKm / 40, 0, 1);
  const bedCapacity = hospital.availableBeds + hospital.icuBeds;
  const capacityScore = clamp(bedCapacity / 80, 0.1, 1);
  const icuImportance = severity === "critical" ? 0.2 : 0.08;
  const icuScore = clamp(hospital.icuBeds / 40, 0.1, 1);
  const specialistMatch = hospital.specialistsOnDuty.includes(requiredSpecialty) ? 1 : hospital.specialistsOnDuty.includes("general") ? 0.7 : 0.4;
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
    mapsUrl: buildGoogleMapsSearchUrl(hospital),
    directionsUrl: buildGoogleMapsDirectionsUrl(location, hospital),
    specialistMatch,
    score: roundTo(score, 3),
  };
}

async function getBestHospitalForEmergency(location, { requiredSpecialty, severity }) {
  const googleHospital = await fetchGoogleHospitalMatch(location);
  if (googleHospital) {
    return {
      ...googleHospital,
      selectedBy: "google-place-distance",
    };
  }

  const ranked = db.hospitals
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
    ...(ranked[0] || scoreHospitalCandidate({ hospital: db.hospitals[0], location, requiredSpecialty, severity })),
    selectedBy: "weighted-score",
  };
}

function reserveHospitalCapacity(hospitalId, severity) {
  const hospital = db.hospitals.find((entry) => entry.id === hospitalId);
  if (!hospital) {
    return;
  }

  const bedReduction = severity === "critical" ? 2 : 1;
  hospital.availableBeds = Math.max(0, hospital.availableBeds - bedReduction);
  if (severity === "critical") {
    hospital.icuBeds = Math.max(0, hospital.icuBeds - 1);
  }
}

function selectAvailableAmbulance(location) {
  const availableAmbulances = db.ambulances.filter((ambulance) => ambulance.availability === "available");

  if (availableAmbulances.length === 0) {
    const fallback = db.ambulances[0];

    return {
      ...fallback,
      currentLocation: { lat: fallback.currentLatitude, lng: fallback.currentLongitude },
      distanceKm: roundTo(getDistanceKm(location, { lat: fallback.currentLatitude, lng: fallback.currentLongitude }), 1),
      etaMinutes: estimateTravelMinutes(getDistanceKm(location, { lat: fallback.currentLatitude, lng: fallback.currentLongitude }), getTrafficMultiplier(location)),
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

function assignNearestAmbulance(location, emergencyId) {
  const selected = selectAvailableAmbulance(location);

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
      lastUpdatedAt: new Date().toISOString(),
    };

    const distanceKm = getDistanceKm(location, {
      lat: dynamicAmbulance.currentLatitude,
      lng: dynamicAmbulance.currentLongitude,
    });

    db.ambulances.unshift(dynamicAmbulance);

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

  const stored = db.ambulances.find((ambulance) => ambulance.id === selected.id);

  if (stored) {
    stored.availability = "dispatched";
    stored.activeEmergencyId = emergencyId;
    stored.lastUpdatedAt = new Date().toISOString();
  }

  return selected;
}

function rankDoctorsForEmergency({ hospitalId, requiredSpecialty, severity }) {
  const availableDoctors = db.doctors.filter((doctor) => doctor.available);
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

function assignDoctorForEmergency({ hospitalId, requiredSpecialty, severity, emergencyId }) {
  const ranked = rankDoctorsForEmergency({ hospitalId, requiredSpecialty, severity });
  const selected = ranked[0] || normalizeDoctorSpecialties(db.doctors[0]);
  const stored = db.doctors.find((doctor) => doctor.id === selected.id);

  if (stored) {
    stored.available = false;
    stored.activeEmergencyId = emergencyId;
    stored.lastUpdatedAt = new Date().toISOString();
  }

  return selected;
}

function buildPatientMedicalSnapshot(patientId) {
  const profile = db.profile;
  const records = db.records.slice(0, 3);

  return {
    patientId,
    bloodGroup: profile.bloodGroup,
    allergies: profile.allergies,
    diseases: profile.diseases,
    medications: profile.medications,
    emergencyContact: profile.emergencyContact,
    recentRecords: records,
  };
}

function buildHospitalHandoffMessage({ emergencyId, hospital, doctor, severity, symptoms, ambulance }) {
  const symptomText = symptoms?.trim() || "No symptom text provided";

  return [
    `Emergency ${emergencyId.slice(0, 8).toUpperCase()} assigned to ${hospital.name}.`,
    `Severity: ${severity.toUpperCase()} | Specialty: ${doctor.specialtyTags?.[0] || "general"}.`,
    `Attending doctor: ${doctor.name} (${doctor.specialization}).`,
    `Ambulance ${ambulance.id} (${ambulance.driverName}) is en route.`,
    `Symptoms: ${symptomText}.`,
  ].join(" ");
}

function releaseEmergencyResources(emergency) {
  if (emergency.ambulanceId) {
    const ambulance = db.ambulances.find((entry) => entry.id === emergency.ambulanceId);
    if (ambulance) {
      ambulance.availability = "available";
      ambulance.activeEmergencyId = null;
      ambulance.lastUpdatedAt = new Date().toISOString();
    }
  }

  if (emergency.assignedDoctor?.id) {
    const doctor = db.doctors.find((entry) => entry.id === emergency.assignedDoctor.id);
    if (doctor) {
      doctor.available = true;
      doctor.activeEmergencyId = null;
      doctor.lastUpdatedAt = new Date().toISOString();
    }
  }
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

  reserveHospitalCapacity(selectedHospital.id, severity);

  const assignedAmbulance = assignNearestAmbulance(normalizedLocation, emergencyId);
  const assignedDoctor = assignDoctorForEmergency({
    hospitalId: selectedHospital.id,
    requiredSpecialty,
    severity,
    emergencyId,
  });

  const medicalSnapshot = buildPatientMedicalSnapshot(patientId);
  const handoffMessage = buildHospitalHandoffMessage({
    emergencyId,
    hospital: selectedHospital,
    doctor: assignedDoctor,
    severity,
    symptoms,
    ambulance: assignedAmbulance,
  });

  const emergency = {
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
      responseWindowSeconds: Math.max(60, Math.round((assignedAmbulance.etaMinutes || 8) * 40)),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.emergencies.unshift(emergency);

  return emergency;
}

export function createEmergencyRoomId(emergencyId) {
  return `emergency:${emergencyId}`;
}

export function getEmergencyById(emergencyId) {
  return db.emergencies.find((emergency) => emergency.id === emergencyId) ?? null;
}

export function getActiveEmergencies() {
  return db.emergencies
    .filter((emergency) => emergency.status !== "completed" && emergency.status !== "cancelled")
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
}

export function updateEmergencySession(emergencyId, patch) {
  const emergency = getEmergencyById(emergencyId);

  if (!emergency) {
    return null;
  }

  if (patch?.location) {
    patch.patientLocationMapsUrl = buildPatientLocationMapsUrl(patch.location);
  }

  if (patch?.ambulanceLocation && emergency.assignedAmbulance?.id) {
    const ambulance = db.ambulances.find((entry) => entry.id === emergency.assignedAmbulance.id);
    if (ambulance) {
      ambulance.currentLatitude = Number(patch.ambulanceLocation.lat);
      ambulance.currentLongitude = Number(patch.ambulanceLocation.lng);
      ambulance.lastUpdatedAt = new Date().toISOString();
    }
  }

  Object.assign(emergency, patch, {
    updatedAt: new Date().toISOString(),
  });

  if (emergency.status === "accepted" && emergency.ambulanceId) {
    const ambulance = db.ambulances.find((entry) => entry.id === emergency.ambulanceId);
    if (ambulance) {
      ambulance.availability = "on_route";
    }
  }

  if (emergency.status === "arrived" && emergency.ambulanceId) {
    const ambulance = db.ambulances.find((entry) => entry.id === emergency.ambulanceId);
    if (ambulance) {
      ambulance.availability = "at_hospital";
    }
  }

  if (emergency.status === "completed" || emergency.status === "cancelled") {
    releaseEmergencyResources(emergency);
  }

  return emergency;
}

function createSeedNotification(notification) {
  return {
    id: randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
    ...notification,
  };
}

export const db = {
  currentUser: {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "patient",
  },
  profile: {
    userId: "1",
    bloodGroup: "O+",
    allergies: ["Penicillin", "Peanuts"],
    diseases: ["Mild Hypertension"],
    medications: ["Amlodipine 5mg"],
    emergencyContact: "+91 98177 66554",
    dateOfBirth: "1992-06-15",
    phone: "+91 98111 22334",
  },
  doctors: DOCTOR_DIRECTORY.map((doctor) => ({
    ...doctor,
    activeEmergencyId: null,
    lastUpdatedAt: new Date().toISOString(),
  })),
  ambulances: EMERGENCY_AMBULANCES.map((ambulance) => ({
    ...ambulance,
    activeEmergencyId: null,
    lastUpdatedAt: new Date().toISOString(),
  })),
  appointments: [
    { id: "1", doctorId: "d-em-102", doctorName: "Dr. Arjun Malhotra", specialization: "Cardiology", date: "2026-04-15", time: "3:00 PM", status: "upcoming", type: "in-person" },
    { id: "2", doctorId: "d-em-103", doctorName: "Dr. Priya Nair", specialization: "Neurology", date: "2026-04-18", time: "10:00 AM", status: "upcoming", type: "video" },
    { id: "3", doctorId: "d-em-104", doctorName: "Dr. Rohit Verma", specialization: "General Medicine", date: "2026-04-10", time: "2:00 PM", status: "completed", type: "in-person" },
  ],
  records: [
    { id: "1", date: "2026-04-10", diagnosis: "Annual checkup - all clear", doctorName: "Dr. Rohit Verma", prescriptions: ["Vitamin D 1000IU"], notes: "Patient in good health." },
    { id: "2", date: "2026-03-15", diagnosis: "Mild hypertension", doctorName: "Dr. Arjun Malhotra", prescriptions: ["Amlodipine 5mg", "Low-sodium diet"], notes: "Follow up in 3 months." },
  ],
  notifications: [
    createSeedNotification({
      recipientRole: "patient",
      type: "appointment",
      priority: "medium",
      title: "Appointment reminder",
      description: "Dr. Arjun Malhotra is scheduled for today at 3:00 PM.",
      link: "/appointments",
    }),
    createSeedNotification({
      recipientRole: "patient",
      type: "records",
      priority: "low",
      title: "Lab summary available",
      description: "Your annual checkup summary is ready in records.",
      link: "/records",
    }),
    createSeedNotification({
      recipientRole: "doctor",
      type: "schedule",
      priority: "medium",
      title: "Clinical standby active",
      description: "Emergency triage coverage is enabled for your shift.",
      link: "/notifications",
    }),
    createSeedNotification({
      recipientRole: "ambulance",
      type: "emergency",
      priority: "high",
      title: "Dispatch grid online",
      description: "Location matching and auto-assignment are active.",
      link: "/emergency",
    }),
    createSeedNotification({
      recipientRole: "hospital",
      type: "emergency",
      priority: "high",
      title: "Bed readiness sync",
      description: "Emergency bed status is synced across all hubs.",
      link: "/emergency",
    }),
    createSeedNotification({
      recipientRole: "admin",
      type: "system",
      priority: "medium",
      title: "Operations summary",
      description: "Emergency response SLA and queue status are healthy.",
      link: "/analytics",
    }),
  ],
  hospitals: EMERGENCY_HOSPITALS.map((hospital) => ({ ...hospital })),
  emergencies: [],
  triageRequests: [],
};

export function createNotification(notification) {
  const entry = {
    id: randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
    ...notification,
  };

  db.notifications.unshift(entry);
  db.notifications = db.notifications.slice(0, 200);

  return entry;
}

export function isNotificationVisible(notification, role) {
  return notification.recipientRole === "all" || notification.recipientRole === role;
}
