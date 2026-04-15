import { randomUUID } from "crypto";
import { Router } from "express";
import { createNotification, db } from "../data/store.js";

const router = Router();

function buildUser({ name, email, role }) {
  return {
    id: randomUUID(),
    name,
    email,
    role,
  };
}

router.post("/login", (req, res) => {
  const { email, password, role } = req.body ?? {};

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role are required." });
  }

  const nameByRole = {
    patient: "Sarah Johnson",
    doctor: "Dr. Smith",
    ambulance: "Dispatch Operator",
    hospital: "Hospital Coordinator",
    admin: "Admin User",
  };

  const user = buildUser({
    name: nameByRole[role] || "Care Connect User",
    email,
    role,
  });

  db.currentUser = user;

  createNotification({
    recipientRole: role,
    type: "system",
    priority: "low",
    title: `Welcome back, ${user.name.split(" ")[0]}`,
    description: "Your care workspace is ready.",
    link: "/dashboard",
  });

  return res.json({ user });
});

router.post("/signup", (req, res) => {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Name, email, password, and role are required." });
  }

  const user = buildUser({ name, email, role });

  db.currentUser = user;

  createNotification({
    recipientRole: role,
    type: "system",
    priority: "medium",
    title: `Account created for ${name}`,
    description: "Your smart hospital workspace is ready.",
    link: "/dashboard",
  });

  return res.status(201).json({ user });
});

export default router;