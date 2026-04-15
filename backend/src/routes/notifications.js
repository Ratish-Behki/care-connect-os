import { Router } from "express";
import { db, isNotificationVisible } from "../data/store.js";

const router = Router();

router.get("/", (_req, res) => {
  const role = db.currentUser.role;
  const notifications = db.notifications.filter((notification) => isNotificationVisible(notification, role));

  return res.json({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
  });
});

router.patch("/:id/read", (req, res) => {
  const { id } = req.params;
  const role = db.currentUser.role;
  const notification = db.notifications.find((entry) => entry.id === id && isNotificationVisible(entry, role));

  if (!notification) {
    return res.status(404).json({ message: "Notification not found." });
  }

  notification.read = true;

  return res.json({ notification });
});

router.patch("/read-all", (_req, res) => {
  const role = db.currentUser.role;

  db.notifications.forEach((notification) => {
    if (isNotificationVisible(notification, role)) {
      notification.read = true;
    }
  });

  return res.json({ ok: true });
});

export default router;