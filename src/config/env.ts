import dotenv from "dotenv";

// Loads environment variables from .env as early as possible.
dotenv.config({ quiet: true });

function readRequiredEnv(
  name:
    | "PORT"
    | "DATABASE_URL"
    | "JWT_SECRET"
    | "JWT_EXPIRES_IN"
    | "ADMIN_NAME"
    | "ADMIN_EMAIL"
    | "ADMIN_PASSWORD",
): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

// Centralized, validated runtime configuration for the server process.
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(readRequiredEnv("PORT")),
  databaseUrl: readRequiredEnv("DATABASE_URL"),
  jwtSecret: readRequiredEnv("JWT_SECRET"),
  jwtExpiresIn: readRequiredEnv("JWT_EXPIRES_IN"),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT?.trim() || "100kb",
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? "900000"),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? "20"),
  mutationRateLimitWindowMs: Number(process.env.MUTATION_RATE_LIMIT_WINDOW_MS ?? "60000"),
  mutationRateLimitMax: Number(process.env.MUTATION_RATE_LIMIT_MAX ?? "120"),
  adminSeed: {
    name: readRequiredEnv("ADMIN_NAME"),
    email: readRequiredEnv("ADMIN_EMAIL").toLowerCase(),
    password: readRequiredEnv("ADMIN_PASSWORD"),
  },
};

if (Number.isNaN(env.port) || env.port <= 0) {
  throw new Error("Environment variable PORT must be a positive number.");
}

if (
  Number.isNaN(env.authRateLimitWindowMs) ||
  Number.isNaN(env.authRateLimitMax) ||
  Number.isNaN(env.mutationRateLimitWindowMs) ||
  Number.isNaN(env.mutationRateLimitMax)
) {
  throw new Error("Rate limit environment variables must be valid numbers.");
}
