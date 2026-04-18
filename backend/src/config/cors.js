import { env } from "./env.js";

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:5173",
];

function normalizeOrigins(origins) {
  return [...new Set(origins.map((origin) => origin.trim()).filter(Boolean))];
}

function isLocalDevOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return parsed.protocol.startsWith("http") && ["localhost", "127.0.0.1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function getAllowedOrigins() {
  const configuredOrigins = env.frontendOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return normalizeOrigins([...DEFAULT_DEV_ORIGINS, ...configuredOrigins]);
}

export function createCorsOptions() {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (origin, callback) => {
      const allowLocalDevOrigin = env.nodeEnv !== "production" && !!origin && isLocalDevOrigin(origin);
      if (!origin || allowedOrigins.includes(origin) || allowLocalDevOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  };
}
