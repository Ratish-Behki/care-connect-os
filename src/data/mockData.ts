import { Doctor, Appointment, MedicalRecord } from '@/types';

export const mockDoctors: Doctor[] = [
  { id: '1', name: 'Dr. Emily Carter', specialization: 'Cardiology', experience: 12, rating: 4.9, avatar: '', available: true, department: 'Heart Center', fee: 150, nextAvailable: 'Today, 3:00 PM' },
  { id: '2', name: 'Dr. James Wilson', specialization: 'Neurology', experience: 15, rating: 4.8, avatar: '', available: true, department: 'Neuro Sciences', fee: 200, nextAvailable: 'Tomorrow, 10:00 AM' },
  { id: '3', name: 'Dr. Sarah Chen', specialization: 'Orthopedics', experience: 8, rating: 4.7, avatar: '', available: false, department: 'Bone & Joint', fee: 120, nextAvailable: 'Wed, 2:00 PM' },
  { id: '4', name: 'Dr. Michael Brown', specialization: 'Dermatology', experience: 10, rating: 4.6, avatar: '', available: true, department: 'Skin Care', fee: 100, nextAvailable: 'Today, 5:00 PM' },
  { id: '5', name: 'Dr. Lisa Park', specialization: 'Pediatrics', experience: 9, rating: 4.9, avatar: '', available: true, department: 'Child Health', fee: 130, nextAvailable: 'Today, 4:30 PM' },
  { id: '6', name: 'Dr. Robert Kim', specialization: 'General Medicine', experience: 20, rating: 4.5, avatar: '', available: true, department: 'General', fee: 80, nextAvailable: 'Today, 1:00 PM' },
];

export const mockAppointments: Appointment[] = [
  { id: '1', doctorId: '1', doctorName: 'Dr. Emily Carter', specialization: 'Cardiology', date: '2026-04-15', time: '3:00 PM', status: 'upcoming', type: 'in-person' },
  { id: '2', doctorId: '2', doctorName: 'Dr. James Wilson', specialization: 'Neurology', date: '2026-04-18', time: '10:00 AM', status: 'upcoming', type: 'video' },
  { id: '3', doctorId: '6', doctorName: 'Dr. Robert Kim', specialization: 'General Medicine', date: '2026-04-10', time: '2:00 PM', status: 'completed', type: 'in-person' },
];

export const mockRecords: MedicalRecord[] = [
  { id: '1', date: '2026-04-10', diagnosis: 'Annual checkup - all clear', doctorName: 'Dr. Robert Kim', prescriptions: ['Vitamin D 1000IU'], notes: 'Patient in good health.' },
  { id: '2', date: '2026-03-15', diagnosis: 'Mild hypertension', doctorName: 'Dr. Emily Carter', prescriptions: ['Amlodipine 5mg', 'Low-sodium diet'], notes: 'Follow up in 3 months.' },
];
