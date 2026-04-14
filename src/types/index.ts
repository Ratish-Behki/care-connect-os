export type UserRole = 'patient' | 'doctor' | 'ambulance' | 'admin';

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

export interface EmergencyRequest {
  id: string;
  patientId: string;
  status: 'pending' | 'accepted' | 'on_the_way' | 'arrived' | 'completed';
  location: { lat: number; lng: number };
  ambulanceId?: string;
  createdAt: string;
}
