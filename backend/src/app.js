import cors from "cors";
import express from "express";
import routes from "./routes/index.js";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import rateLimit from "express-rate-limit";

function getConfiguredOrigins() {
  const configured = process.env.FRONTEND_ORIGIN || "*";

  if (configured === "*") return "*";

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp() {
  const app = express();

  const origins = getConfiguredOrigins();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (origins === "*") return callback(null, true);
        if (!origin || origins.includes(origin)) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json());

  // 🔥 Request logger
  app.use((req, _res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
  });

  // 🔥 Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "care-connect", time: new Date() });
  });

  // 🔥 Rate limit (only emergency)
  const emergencyLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "Too many emergency requests. Please wait.",
  });

  app.use("/api/health", routes.health);
  app.use("/api/auth", routes.auth);

  app.use("/api", authenticateToken);

  app.use("/api/users", routes.users);
  app.use("/api/doctors", routes.doctors);
  app.use("/api/appointments", routes.appointments);
  app.use("/api/records", routes.records);
  app.use("/api/notifications", routes.notifications);
  app.use("/api/profile", routes.profile);
  app.use("/api/emergency", emergencyLimiter, routes.emergency);
  app.use("/api/triage", routes.triage);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}