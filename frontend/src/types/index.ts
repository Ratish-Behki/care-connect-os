export type UserRole = 'patient' | 'doctor' | 'ambulance' | 'hospital' | 'admin';

export type NotificationPriority = 'low' | 'medium' | 'high';

export type NotificationType =
  | 'appointment'
  | 'records'
  | 'schedule'
  | 'emergency'
  | 'system'
  | 'profile'
  | 'triage';

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
  status: 'upcoming' | 'completed' | 'cancelled';
  type: 'in-person' | 'video';
}

export interface MedicalRecord {
  id: string;
  date: string;
  diagnosis: string;
  doctorName: string;
  prescriptions: string[];
  notes: string;
}

export interface EmergencyLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
  source?: 'browser' | 'manual' | 'fallback';
}

export interface EmergencyHospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distanceKm: number;
  etaMinutes: number;
  mapsUrl: string;
  directionsUrl: string;
  availableBeds?: number;
  icuBeds?: number;
  emergencyReadiness?: number;
  specialistMatch?: number;
  trafficMultiplier?: number;
  score?: number;
  selectedBy?: string;
}

export interface EmergencyAmbulanceAssignment {
  id: string;
  driverName: string;
  phone: string;
  vehicleNumber: string;
  currentLatitude: number;
  currentLongitude: number;
  availability: string;
  baseHospitalId: string;
  distanceKm: number;
  etaMinutes: number;
  wasFallback?: boolean;
}

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

export interface EmergencyMedicalSnapshot {
  patientId: string;
  bloodGroup: string;
  allergies: string[];
  diseases: string[];
  medications: string[];
  emergencyContact: string;
  recentRecords: MedicalRecord[];
}

export interface EmergencyDispatchMetrics {
  ambulanceDistanceKm: number;
  ambulanceEtaMinutes: number;
  hospitalDistanceKm: number;
  hospitalEtaMinutes: number;
  hospitalScore: number;
  trafficMultiplier: number;
  responseWindowSeconds: number;
}

export interface EmergencyRequest {
  id: string;
  roomId: string;
  patientId: string;
  status: 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'completed' | 'cancelled';
  severity?: 'moderate' | 'high' | 'critical';
  requiredSpecialty?: string;
  symptoms?: string;
  location: EmergencyLocation;
  patientLocationMapsUrl: string;
  nearestHospital: EmergencyHospital;
  ambulanceId?: string;
  assignedAmbulance?: EmergencyAmbulanceAssignment;
  ambulanceLocation: EmergencyLocation | null;
  assignedDoctor?: EmergencyDoctorAssignment;
  medicalSnapshot?: EmergencyMedicalSnapshot;
  emergencyContact?: string;
  familyContactNotified?: boolean;
  patientNote: string;
  handoffMessage: string;
  dispatchMetrics?: EmergencyDispatchMetrics;
  updatedAt: string;
  createdAt: string;
}

export interface EmergencyResourcePayload {
  ambulances: Array<{
    id: string;
    driverName: string;
    availability: string;
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

export interface EmergencyLiveSnapshot {
  emergency: EmergencyRequest;
}

export interface NotificationItem {
  id: string;
  recipientRole: UserRole | 'all';
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  description: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface SymptomTriageResult {
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  careSetting: 'self-care' | 'primary-care' | 'urgent-care' | 'emergency';
  recommendedDepartment: string;
  possibleConditions: string[];
  actions: string[];
  homeCare: string[];
  redFlags: string[];
  followUp: string;
  summary: string;
}
