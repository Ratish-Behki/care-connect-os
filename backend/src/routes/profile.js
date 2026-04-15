import { Router } from "express";
import { createNotification, db } from "../data/store.js";

const router = Router();

router.get("/", (_req, res) => {
  return res.json({ user: db.currentUser, health: db.profile });
});

router.put("/", (req, res) => {
  const { user, health } = req.body ?? {};

  if (user) {
    db.currentUser = {
      ...db.currentUser,
      ...user,
    };
  }

  if (health) {
    db.profile = {
      ...db.profile,
      ...health,
    };
  }

  createNotification({
    recipientRole: db.currentUser.role,
    type: "profile",
    priority: "low",
    title: "Profile updated",
    description: "Your contact and health details were saved.",
    link: "/profile",
  });

  return res.json({ user: db.currentUser, health: db.profile });
});

export default router;