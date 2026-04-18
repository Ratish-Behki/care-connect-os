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

  const health = await ensurePatientProfile(user.id);

  return {
    user: toSafeUser(user),
    health,
  };
}

export async function updateProfileForUser({ userId, role, input }) {
  if (!userId) {
    throw createServiceError(401, "Unauthorized");
  }

  const { user, health } = input ?? {};

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

  let updatedHealth = null;
  if (health) {
    updatedHealth = await prisma.patientProfile.upsert({
      where: { userId },
      update: {
        bloodGroup: health.bloodGroup ?? undefined,
        allergies: Array.isArray(health.allergies) ? health.allergies : undefined,
        diseases: Array.isArray(health.diseases) ? health.diseases : undefined,
        medications: Array.isArray(health.medications) ? health.medications : undefined,
        emergencyContact: health.emergencyContact ?? undefined,
        dateOfBirth: health.dateOfBirth ?? undefined,
        phone: health.phone ?? undefined,
      },
      create: {
        userId,
        bloodGroup: health.bloodGroup ?? "",
        allergies: Array.isArray(health.allergies) ? health.allergies : [],
        diseases: Array.isArray(health.diseases) ? health.diseases : [],
        medications: Array.isArray(health.medications) ? health.medications : [],
        emergencyContact: health.emergencyContact ?? "",
        dateOfBirth: health.dateOfBirth ?? "",
        phone: health.phone ?? "",
      },
    });
  } else {
    updatedHealth = await ensurePatientProfile(userId);
  }

  await createNotification({
    recipientRole: role || updatedUser.role,
    type: "profile",
    priority: "low",
    title: "Profile updated",
    description: "Your contact and health details were saved.",
    link: "/profile",
  });

  return {
    user: toSafeUser(updatedUser),
    health: updatedHealth,
  };
}
