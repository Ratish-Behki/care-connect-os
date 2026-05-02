import { prisma } from "../database/prismaClient.js";
import { createNotification } from "./notification.service.js";
import { createServiceError } from "./serviceError.js";
import { toSafeUser } from "./user.service.js";

async function ensurePatientProfile(userId) {
  let health = await prisma.patientProfile.findUnique({
    where: { userId },
  });

  if (!health) {
    health = await prisma.patientProfile.create({
      data: {
        userId,
        bloodGroup: "",
        allergies: [],
        diseases: [],
        medications: [],
        emergencyContact: "",
        dateOfBirth: "",
        phone: "",
      },
    });
  }

  return health;
}

export async function getProfileForUser(userId) {
  if (!userId) {
    throw createServiceError(401, "Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createServiceError(404, "User not found.");
  }

  let profile = {};

  // Get role-specific data
  if (user.role === "doctor") {
    const doctor = await prisma.doctor.findUnique({
      where: { id: userId },
    });
    profile = doctor || {};
  } else {
    const health = await ensurePatientProfile(user.id);
    profile = health || {};
  }

  return {
    user: toSafeUser(user),
    profile,
    role: user.role,
  };
}

export async function updateProfileForUser({ userId, role, input }) {
  if (!userId) {
    throw createServiceError(401, "Unauthorized");
  }

  const { user, profile, doctor } = input ?? {};

  // Update User
  let updatedUser = null;
  if (user) {
    updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: typeof user.name === "string" ? user.name : undefined,
        email: typeof user.email === "string" ? user.email : undefined,
      },
    });
  } else {
    updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!updatedUser) {
      throw createServiceError(404, "User not found.");
    }
  }

  let updatedProfile = null;

  // Handle Doctor Profile
  if (role === "doctor" || updatedUser.role === "doctor") {
    if (doctor) {
      updatedProfile = await prisma.doctor.update({
        where: { id: userId },
        data: {
          specialization: doctor.specialization ?? undefined,
          experience: Number.isFinite(Number(doctor.experience)) ? Number(doctor.experience) : undefined,
          department: doctor.department ?? undefined,
          fee: Number.isFinite(Number(doctor.fee)) ? Number(doctor.fee) : undefined,
          available: typeof doctor.available === "boolean" ? doctor.available : undefined,
          profileComplete: true,
        },
      });
    } else {
      updatedProfile = await prisma.doctor.findUnique({
        where: { id: userId },
      });
    }
  }
  // Handle Patient Profile
  else {
    if (profile) {
      updatedProfile = await prisma.patientProfile.upsert({
        where: { userId },
        update: {
          bloodGroup: profile.bloodGroup ?? undefined,
          allergies: Array.isArray(profile.allergies) ? profile.allergies : undefined,
          diseases: Array.isArray(profile.diseases) ? profile.diseases : undefined,
          medications: Array.isArray(profile.medications) ? profile.medications : undefined,
          emergencyContact: profile.emergencyContact ?? undefined,
          dateOfBirth: profile.dateOfBirth ?? undefined,
          phone: profile.phone ?? undefined,
        },
        create: {
          userId,
          bloodGroup: profile.bloodGroup ?? "",
          allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
          diseases: Array.isArray(profile.diseases) ? profile.diseases : [],
          medications: Array.isArray(profile.medications) ? profile.medications : [],
          emergencyContact: profile.emergencyContact ?? "",
          dateOfBirth: profile.dateOfBirth ?? "",
          phone: profile.phone ?? "",
        },
      });
    } else {
      updatedProfile = await ensurePatientProfile(userId);
    }
  }

  await createNotification({
    recipientRole: role || updatedUser.role,
    type: "profile",
    priority: "low",
    title: "Profile updated",
    description: updatedUser.role === "doctor" 
      ? "Your professional details were saved."
      : "Your contact and health details were saved.",
    link: "/profile",
  });

  return {
    user: toSafeUser(updatedUser),
    profile: updatedProfile,
    role: updatedUser.role,
  };
}
