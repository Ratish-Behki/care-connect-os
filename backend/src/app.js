import cors from "cors";
import express from "express";
import authRouter from "./routes/auth.js";
import appointmentsRouter from "./routes/appointments.js";
import doctorsRouter from "./routes/doctors.js";
import emergencyRouter from "./routes/emergency.js";
import healthRouter from "./routes/health.js";
import notificationsRouter from "./routes/notifications.js";
import profileRouter from "./routes/profile.js";
import recordsRouter from "./routes/records.js";
import triageRouter from "./routes/triage.js";

export function getAllowedOrigins() {
  return (process.env.FRONTEND_ORIGIN || "http://localhost:8080,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp({ io } = {}) {
  const app = express();
  app.set("io", io ?? null);

  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
    })
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      message: "Care Connect backend is running",
    });
  });

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/doctors", doctorsRouter);
  app.use("/api/appointments", appointmentsRouter);
  app.use("/api/records", recordsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/emergency", emergencyRouter);
  app.use("/api/triage", triageRouter);

  return app;
}
