import { create } from 'zustand';
import { Appointment } from '@/types';
import { mockAppointments } from '@/data/mockData';

interface AppointmentState {
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
  cancelAppointment: (id: string) => void;
  getSmartQueue: () => Appointment[];
}

// Smart scheduling: emergency/priority patients move ahead
export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: mockAppointments,

  addAppointment: (appt) =>
    set((state) => ({ appointments: [...state.appointments, appt] })),

  cancelAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status: 'cancelled' as const } : a
      ),
    })),

  getSmartQueue: () => {
    const upcoming = get().appointments.filter((a) => a.status === 'upcoming');

    // Priority scoring: emergency type gets highest, then by date/time
    return [...upcoming].sort((a, b) => {
      const priorityA = a.type === 'in-person' ? 1 : 0;
      const priorityB = b.type === 'in-person' ? 1 : 0;

      // Emergency-tagged appointments (we'll use a convention)
      const emergencyA = a.specialization.toLowerCase().includes('emergency') ? 10 : 0;
      const emergencyB = b.specialization.toLowerCase().includes('emergency') ? 10 : 0;

      const scoreA = emergencyA + priorityA;
      const scoreB = emergencyB + priorityB;

      if (scoreB !== scoreA) return scoreB - scoreA;

      // Then by date
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  },
}));
