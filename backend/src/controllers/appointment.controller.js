// Change hua ?
import {
  cancelAppointmentForUser,
  createAppointmentForUser,
  listAppointmentsForUser,
} from "../services/appointment.service.js";

export async function getAppointments(req, res) {
  const appointments = await listAppointmentsForUser({
    userId: req.user?.id,
    role: req.user?.role,
  });

  return res.json({ appointments });
}

export async function bookAppointment(req, res) {
  const appointment = await createAppointmentForUser({
    userId: req.user.id,
    input: req.body,
  });

  return res.status(201).json({ appointment });
}

export async function cancelAppointment(req, res) {
  const appointment = await cancelAppointmentForUser({
    appointmentId: req.params.id,
    userId: req.user.id,
    role: req.user?.role,
  });

  return res.json({ appointment });
}
