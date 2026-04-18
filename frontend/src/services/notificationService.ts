import { api } from '@/lib/api';

export const notificationService = {
  getNotifications: api.getNotifications,
  markNotificationRead: api.markNotificationRead,
  markAllNotificationsRead: api.markAllNotificationsRead,
};
