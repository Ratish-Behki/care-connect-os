import cors from "cors";
import express from "express";
import healthRouter from "./routes/health.js";

export function createApp() {
  const app = express();

  const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

  app.use(
    cors({
      origin: allowedOrigin,
    })
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      message: "Care Connect backend is running",
    });
  });

  app.use("/api/health", healthRouter);

  return app;
}
