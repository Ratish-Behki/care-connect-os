import { prisma } from "../database/prismaClient.js";

export async function listRecordsForUser({ userId, role }) {
  const where = role === "patient" ? { userId } : {};

  return prisma.medicalRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}
