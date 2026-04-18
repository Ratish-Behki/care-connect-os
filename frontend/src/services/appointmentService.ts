import { api } from '@/lib/api';

export const appointmentService = {
  getAppointments: api.getAppointments,
  createAppointment: api.createAppointment,
  cancelAppointment: api.cancelAppointment,
};
