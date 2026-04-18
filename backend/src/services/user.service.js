import { prisma } from "../database/prismaClient.js";
import { createServiceError } from "./serviceError.js";

export function toSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || undefined,
  };
}

export async function getCurrentUserById(userId) {
  if (!userId) {
    throw createServiceError(401, "Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw createServiceError(404, "User not found");
  }

  return user;
}
