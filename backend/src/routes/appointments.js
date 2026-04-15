import { randomUUID } from "crypto";
import { Router } from "express";
import { createNotification, db } from "../data/store.js";

const router = Router();

router.get("/", (_req, res) => {
  return res.json({ appointments: db.appointments });
});

router.post("/", (req, res) => {
  const { doctorId, doctorName, specialization, date, time, type } = req.body ?? {};

  if (!doctorId || !doctorName || !specialization || !date || !time || !type) {
    return res.status(400).json({ message: "Doctor, date, time, and appointment type are required." });
  }

  const appointment = {
    id: randomUUID(),
    doctorId,
    doctorName,
    specialization,
    date,
    time,
    status: "upcoming",
    type,
  };

  db.appointments.unshift(appointment);

  createNotification({
    recipientRole: "patient",
    type: "appointment",
    priority: "medium",
    title: "Appointment booked",
    description: `${doctorName} on ${date} at ${time}`,
    link: "/appointments",
  });

  createNotification({
    recipientRole: "doctor",
    type: "appointment",
    priority: "medium",
    title: "New appointment request",
    description: `${doctorName} has a new visit request for ${date} at ${time}`,
    link: "/appointments",
  });

  return res.status(201).json({ appointment });
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const appointment = db.appointments.find((item) => item.id === id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found." });
  }

  appointment.status = "cancelled";

  createNotification({
    recipientRole: "patient",
    type: "appointment",
    priority: "low",
    title: "Appointment cancelled",
    description: `${appointment.doctorName} on ${appointment.date} was cancelled.`,
    link: "/appointments",
  });

  createNotification({
    recipientRole: "doctor",
    type: "appointment",
    priority: "low",
    title: "Appointment cancelled",
    description: `${appointment.doctorName} on ${appointment.date} was cancelled.`,
    link: "/appointments",
  });

  return res.json({ appointment });
});

export default router;