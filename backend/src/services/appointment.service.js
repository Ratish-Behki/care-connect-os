import { prisma } from "../database/prismaClient.js";
import { createNotification } from "./notification.service.js";
import { createServiceError } from "./serviceError.js";

function formatAppointment(appointment) {
  return {
    ...appointment,
    type: appointment.type === "in_person" ? "in-person" : appointment.type,
  };
}

export async function listAppointmentsForUser({ userId, role }) {
  const where = role === "patient" ? { userId } : {};
  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return appointments.map(formatAppointment);
}

export async function createAppointmentForUser({ userId, input }) {
  const { doctorId, doctorName, specialization, date, time, type } = input ?? {};

  if (!doctorId || !doctorName || !specialization || !date || !time || !type) {
    throw createServiceError(400, "Doctor, date, time, and appointment type are required.");
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      doctorId,
      doctorName,
      specialization,
      date,
      time,
      status: "upcoming",
      type: type === "video" ? "video" : "in_person",
    },
  });

  await Promise.all([
    createNotification({
      recipientRole: "patient",
      type: "appointment",
      priority: "medium",
      title: "Appointment booked",
      description: `${doctorName} on ${date} at ${time}`,
      link: "/appointments",
    }),
    createNotification({
      recipientRole: "doctor",
      type: "appointment",
      priority: "medium",
      title: "New appointment request",
      description: `${doctorName} has a new visit request for ${date} at ${time}`,
      link: "/appointments",
    }),
  ]);

  return formatAppointment(appointment);
}

export async function cancelAppointmentForUser({ appointmentId, userId, role }) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw createServiceError(404, "Appointment not found.");
  }

  if (role === "patient" && appointment.userId !== userId) {
    throw createServiceError(403, "Not allowed to cancel this appointment.");
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "cancelled" },
  });

  await Promise.all([
    createNotification({
      recipientRole: "patient",
      type: "appointment",
      priority: "low",
      title: "Appointment cancelled",
      description: `${appointment.doctorName} on ${appointment.date} was cancelled.`,
      link: "/appointments",
    }),
    createNotification({
      recipientRole: "doctor",
      type: "appointment",
      priority: "low",
      title: "Appointment cancelled",
      description: `${appointment.doctorName} on ${appointment.date} was cancelled.`,
      link: "/appointments",
    }),
  ]);

  return formatAppointment(updated);
}
