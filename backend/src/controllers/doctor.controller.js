import { listDoctors, updateDoctorProfile } from "../services/doctor.service.js";

export async function getDoctors(_req, res) {
  const doctors = await listDoctors();
  return res.json({ doctors });
}

export async function completeProfile(req, res) {
  const { specialization, experience, department, fee, available } = req.body;
  
  if (!specialization || !experience || !department) {
    return res.status(400).json({
      message: "Specialization, experience, and department are required",
    });
  }

  const doctor = await updateDoctorProfile(req.user.id, {
    specialization,
    experience,
    department,
    fee,
    available,
  });

  return res.json({ 
    message: "Profile completed successfully",
    doctor 
  });
}
