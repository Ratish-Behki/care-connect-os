import {
  getNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "../services/notification.service.js";

export async function getNotifications(req, res) {
  const data = await getNotificationsForUser({
    userId: req.user?.id,
    role: req.user?.role,
  });

  return res.json(data);
}

export async function markNotificationRead(req, res) {
  const notification = await markNotificationReadForUser({
    notificationId: req.params.id,
    userId: req.user?.id,
    role: req.user?.role,
  });

  return res.json({ notification });
}

export async function markAllNotificationsRead(req, res) {
  const result = await markAllNotificationsReadForUser({
    userId: req.user?.id,
    role: req.user?.role,
  });

  return res.json(result);
}
