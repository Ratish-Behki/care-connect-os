import { prisma } from "../database/prismaClient.js";

export async function listDoctors() {
  return prisma.doctor.findMany({
    orderBy: { name: "asc" },
  });
}

export async function updateDoctorProfile(userId, profileData) {
  const {
    specialization,
    experience,
    department,
    fee,
    available,
  } = profileData;

  const doctor = await prisma.doctor.update({
    where: { id: userId },
    data: {
      specialization: specialization || undefined,
      experience: Number.isFinite(Number(experience)) ? Number(experience) : undefined,
      department: department || undefined,
      fee: Number.isFinite(Number(fee)) ? Number(fee) : undefined,
      available: typeof available === "boolean" ? available : undefined,
      profileComplete: true,
      lastUpdatedAt: new Date(),
    },
  });

  return doctor;
}
