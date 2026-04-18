import { api } from '@/lib/api';

export const emergencyService = {
  requestEmergency: api.requestEmergency,
  getActiveEmergencies: api.getActiveEmergencies,
  getEmergencyResources: api.getEmergencyResources,
};
