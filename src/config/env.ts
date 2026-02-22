import dotenv from "dotenv";

// Loads environment variables from .env as early as possible.
dotenv.config({ quiet: true });

function readRequiredEnv(name: "PORT" | "DATABASE_URL"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Centralized, validated runtime configuration for the server process.
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(readRequiredEnv("PORT")),
  databaseUrl: readRequiredEnv("DATABASE_URL"),
};

if (Number.isNaN(env.port) || env.port <= 0) {
  throw new Error("Environment variable PORT must be a positive number.");
}
