import cors from "cors";
import express from "express";
import routes from "./routes/index.js";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

function getConfiguredOrigins() {
  const configured = process.env.FRONTEND_ORIGIN || "*";

  if (configured === "*") {
    return "*";
  }

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp({ io } = {}) {
  const app = express();
  app.set("io", io ?? null);

  const origins = getConfiguredOrigins();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (origins === "*") {
          callback(null, true);
          return;
        }

        if (!origin || origins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      message: "API working",
    });
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
  app.use("/api/emergency", routes.emergency);
  app.use("/api/triage", routes.triage);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
