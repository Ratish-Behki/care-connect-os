import type { Appointment, Doctor, EmergencyLocation, EmergencyRequest, EmergencyResourcePayload, MedicalRecord, NotificationItem, PatientProfile, SymptomTriageResult, User, UserRole } from '@/types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const AUTH_STORAGE_KEY = 'care-connect-auth';

type ApiResponse<T> = Promise<T>;

function getAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload as T;
}

export const api = {
  login: (input: { email: string; password: string; role: UserRole }): ApiResponse<{ user: User; token: string }> =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  signup: (input: { name: string; email: string; password: string; role: UserRole }): ApiResponse<{ user: User; token: string }> =>
    request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getDoctors: (): ApiResponse<Doctor[]> =>
    request('/api/doctors').then((response: { doctors: Doctor[] }) => response.doctors),
  getAppointments: (): ApiResponse<Appointment[]> =>
    request('/api/appointments').then((response: { appointments: Appointment[] }) => response.appointments),
  createAppointment: (input: {
    doctorId: string;
    doctorName: string;
    specialization: string;
    date: string;
    time: string;
    type: 'in-person' | 'video';
  }): ApiResponse<{ appointment: Appointment }> =>
    request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  cancelAppointment: (id: string): ApiResponse<{ appointment: Appointment }> =>
    request(`/api/appointments/${id}`, {
      method: 'DELETE',
    }),
  getRecords: (): ApiResponse<MedicalRecord[]> =>
    request('/api/records').then((response: { records: MedicalRecord[] }) => response.records),
  getNotifications: (): ApiResponse<{ notifications: NotificationItem[]; unreadCount: number }> =>
    request('/api/notifications'),
  markNotificationRead: (id: string): ApiResponse<{ notification: NotificationItem }> =>
    request(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllNotificationsRead: (): ApiResponse<{ ok: boolean }> =>
    request('/api/notifications/read-all', {
      method: 'PATCH',
    }),
  getProfile: (): ApiResponse<any> => request('/api/profile'),
  updateProfile: (input: any): ApiResponse<{ user: User; profile?: any }> =>
    request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  requestEmergency: (input?: { location?: EmergencyLocation; patientNote?: string; symptoms?: string }): ApiResponse<{
    emergency: EmergencyRequest;
    etaMinutes: number;
    ambulance: { id: string; driver: string; phone: string };
    doctor?: { id: string; name: string; specialization: string; phone?: string };
  }> =>
    request('/api/emergency', {
      method: 'POST',
      body: JSON.stringify(input ?? {}),
    }),
  getActiveEmergencies: (): ApiResponse<{ emergencies: EmergencyRequest[] }> =>
    request('/api/emergency/active'),
  getEmergencyResources: (): ApiResponse<EmergencyResourcePayload> =>
    request('/api/emergency/resources'),
  analyzeSymptoms: (symptoms: string): ApiResponse<{ result: SymptomTriageResult }> =>
    request('/api/triage', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    }),
};