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
  adminSeed: {
    name: readRequiredEnv("ADMIN_NAME"),
    email: readRequiredEnv("ADMIN_EMAIL").toLowerCase(),
    password: readRequiredEnv("ADMIN_PASSWORD"),
  },
};

if (Number.isNaN(env.port) || env.port <= 0) {
  throw new Error("Environment variable PORT must be a positive number.");
}
