// ======================
// 🔹 COMMON TYPES
// ======================

export type UserRole =
  | "patient"
  | "doctor"
  | "ambulance"
  | "hospital"
  | "admin";

export type NotificationPriority = "low" | "medium" | "high";

export type NotificationType =
  | "appointment"
  | "records"
  | "schedule"
  | "emergency"
  | "system"
  | "profile"
  | "triage";

// ======================
// 🔹 USER & PROFILE
// ======================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface PatientProfile {
  userId: string;
  bloodGroup: string;
  allergies: string[];
  diseases: string[];
  medications: string[];
  emergencyContact: string;
  dateOfBirth: string;
  phone: string;
}

// ======================
// 🔹 DOCTOR & APPOINTMENT
// ======================

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  avatar: string;
  available: boolean;
  department: string;
  fee: number;
  nextAvailable: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  type: "in-person" | "video";
}

export interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  doctorName: string;
  prescriptions: string[];
  notes: string;
}

// ======================
// 🔹 LOCATION SYSTEM (FIXED)
// ======================

export type LocationSource = "browser" | "live" | "fallback";

export interface EmergencyLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  source: LocationSource;
  timestamp?: number;
}

// ======================
// 🔹 STATUS ENUMS (NEW)
// ======================

export type EmergencyStatus =
  | "requested"
  | "accepted"
  | "en_route"
  | "arrived"
  | "completed"
  | "cancelled";

export type EmergencySeverity =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export type AmbulanceStatus = "available" | "busy" | "offline";

// ======================
// 🔹 HOSPITAL
// ======================

export interface EmergencyHospital {
  id: string;
  name: string;
  address: string;
  phone: string;

  location?: EmergencyLocation;
  lat?: number;
  lng?: number;

  distanceKm: number;
  etaMinutes: number;

  mapsUrl: string;
  directionsUrl: string;

  availableBeds?: number;
  icuBeds?: number;
  emergencyReadiness?: number;
  score?: number;
  sizeScore?: number;
}

// ======================
// 🔹 AMBULANCE
// ======================

export interface EmergencyAmbulanceAssignment {
  id: string;
  driverName: string;
  phone: string;
  vehicleNumber: string;

  location: EmergencyLocation;

  status: AmbulanceStatus;

  baseHospitalId: string;

  distanceKm: number;
  etaMinutes: number;

  wasFallback?: boolean;
}

// ======================
// 🔹 DOCTOR ASSIGNMENT
// ======================

export interface EmergencyDoctorAssignment {
  id: string;
  name: string;
  specialization: string;
  department: string;
  hospitalId: string;
  phone?: string;
  score?: number;
  specialtyTags?: string[];
}

// ======================
// 🔹 MEDICAL SNAPSHOT
// ======================

export interface EmergencyMedicalSnapshot {
  patientId: string;
  bloodGroup: string;
  allergies: string[];
  diseases: string[];
  medications: string[];
  emergencyContact: string;
  recentRecords: MedicalRecord[];
}

// ======================
// 🔹 DISPATCH METRICS
// ======================

export interface EmergencyDispatchMetrics {
  ambulanceDistanceKm: number;
  ambulanceEtaMinutes: number;
  hospitalDistanceKm: number;
  hospitalEtaMinutes: number;
  hospitalScore: number;
  trafficMultiplier: number;
  responseWindowSeconds: number;
}

// ======================
// 🔹 MAIN EMERGENCY REQUEST
// ======================

export interface EmergencyRequest {
  id: string;
  roomId: string;
  patientId: string;

  status: EmergencyStatus;
  severity?: EmergencySeverity;

  requiredSpecialty?: string;
  symptoms?: string;

  location: EmergencyLocation;
  ambulanceLocation?: EmergencyLocation;

  patientLocationMapsUrl: string;

  nearestHospital: EmergencyHospital;
  nearbyHospitals?: EmergencyHospital[];

  ambulanceId?: string;
  assignedAmbulance?: EmergencyAmbulanceAssignment;

  assignedDoctor?: EmergencyDoctorAssignment;

  medicalSnapshot?: EmergencyMedicalSnapshot;

  emergencyContact?: string;
  familyContactNotified?: boolean;

  patientNote: string;
  handoffMessage: string;

  dispatchMetrics?: EmergencyDispatchMetrics;

  createdAt: string;
  updatedAt: string;
}

// ======================
// 🔹 RESOURCES DASHBOARD
// ======================

export interface EmergencyResourcePayload {
  ambulances: Array<{
    id: string;
    driverName: string;
    status: AmbulanceStatus;
    location: EmergencyLocation;
    activeEmergencyId: string | null;
  }>;

  hospitals: Array<{
    id: string;
    name: string;
    availableBeds: number;
    icuBeds: number;
    emergencyReadiness: number;
  }>;

  doctors: Array<{
    id: string;
    name: string;
    specialization: string;
    available: boolean;
    hospitalId: string;
    activeEmergencyId: string | null;
  }>;
}

// ======================
// 🔹 SOCKET SNAPSHOT
// ======================

export interface EmergencyLiveSnapshot {
  emergency: EmergencyRequest;
}

// ======================
// 🔹 NOTIFICATIONS
// ======================

export interface NotificationItem {
  id: string;
  recipientRole: UserRole | "all";
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  description: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ======================
// 🔹 TRIAGE AI RESULT
// ======================

export interface SymptomTriageResult {
  severity: "low" | "medium" | "high";
  confidence: number;

  careSetting:
    | "self-care"
    | "primary-care"
    | "urgent-care"
    | "emergency";

  recommendedDepartment: string;

  possibleConditions: string[];
  actions: string[];
  homeCare: string[];
  redFlags: string[];

  followUp: string;
  summary: string;
}