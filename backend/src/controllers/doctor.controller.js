import { listDoctors } from "../services/doctor.service.js";

export async function getDoctors(_req, res) {
  const doctors = await listDoctors();
  return res.json({ doctors });
}
