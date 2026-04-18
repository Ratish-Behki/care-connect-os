import { prisma } from "../database/prismaClient.js";

export async function listDoctors() {
  return prisma.doctor.findMany({
    orderBy: { name: "asc" },
  });
}
