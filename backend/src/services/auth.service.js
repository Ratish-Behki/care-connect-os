import bcrypt from "bcryptjs";
import { prisma } from "../database/prismaClient.js";
import { signToken } from "../middleware/auth.middleware.js";
import { createNotification } from "./notification.service.js";
import { toSafeUser } from "./user.service.js";

function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function registerUser(input) {
  const {
    name,
    email,
    password,
    role,
    specialization = "General",
    experience = 0,
    department = "General",
    fee = 0,
    rating = 0,
    available = true,
  } = input ?? {};

  if (!name || !email || !password || !role) {
    throw createError(400, "Name, email, password, and role are required.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createError(409, "Email already in use.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash,
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: user.id,
      bloodGroup: role === "patient" ? "O+" : "",
      allergies: role === "patient" ? ["Penicillin"] : [],
      diseases: role === "patient" ? ["Mild Hypertension"] : [],
      medications: role === "patient" ? ["Amlodipine 5mg"] : [],
      emergencyContact: "+91 98177 66554",
      dateOfBirth: "1992-06-15",
      phone: "+91 98111 22334",
    },
  });

  if (role === "doctor") {
    await prisma.doctor.create({
      data: {
        id: user.id,
        name: user.name,
        specialization,
        experience: Number.isFinite(Number(experience)) ? Number(experience) : 0,
        rating: Number.isFinite(Number(rating)) ? Number(rating) : 0,
        avatar: user.avatar ?? "",
        available: typeof available === "boolean" ? available : true,
        department,
        fee: Number.isFinite(Number(fee)) ? Number(fee) : 0,
        nextAvailable: new Date().toISOString(),
      },
    });
  }

  const token = signToken({ userId: user.id, role: user.role });

  await createNotification({
    recipientRole: role,
    type: "system",
    priority: "medium",
    title: `Account created for ${name}`,
    description: "Your smart hospital workspace is ready.",
    link: "/dashboard",
  });

  return {
    user: toSafeUser(user),
    token,
  };
}

export async function loginUser(input) {
  const { email, password, role } = input ?? {};

  if (!email || !password || !role) {
    throw createError(400, "Email, password, and role are required.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.role !== role) {
    throw createError(401, "Invalid credentials.");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw createError(401, "Invalid credentials.");
  }

  const token = signToken({ userId: user.id, role: user.role });

  await createNotification({
    recipientRole: role,
    type: "system",
    priority: "low",
    title: `Welcome back, ${user.name.split(" ")[0]}`,
    description: "Your care workspace is ready.",
    link: "/dashboard",
  });

  return {
    user: toSafeUser(user),
    token,
  };
}
