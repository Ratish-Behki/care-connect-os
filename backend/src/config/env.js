import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

let envLoaded = false;

function parsePort(value, fallback = 5000) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadEnv() {
  if (envLoaded) {
    return;
  }

  const currentDir = dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: resolve(currentDir, "../../.env") });
  envLoaded = true;
}

loadEnv();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT, 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  databaseUrl: process.env.DATABASE_URL || "",
};
