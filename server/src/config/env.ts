import dotenv from "dotenv";

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
  wearableSyncRateLimitWindowMs: Number(process.env.WEARABLE_SYNC_RATE_LIMIT_WINDOW_MS ?? "60000"),
  wearableSyncRateLimitMax: Number(process.env.WEARABLE_SYNC_RATE_LIMIT_MAX ?? "30"),
  wearableWebhookToleranceSec: Number(process.env.WEARABLE_WEBHOOK_TOLERANCE_SEC ?? "300"),
  wearableWebhookDedupeTtlSec: Number(process.env.WEARABLE_WEBHOOK_DEDUPE_TTL_SEC ?? "86400"),
  wearableAuditDbTimeoutMs: Number(process.env.WEARABLE_AUDIT_DB_TIMEOUT_MS ?? "250"),
  wearableAuditRetentionDays: Number(process.env.WEARABLE_AUDIT_RETENTION_DAYS ?? "30"),
  wearableAuditCleanupIntervalMs: Number(process.env.WEARABLE_AUDIT_CLEANUP_INTERVAL_MS ?? "3600000"),
  wearableWebhookSecrets: {
    fitbit: process.env.WEARABLE_WEBHOOK_SECRET_FITBIT?.trim() ?? "",
    appleWatch: process.env.WEARABLE_WEBHOOK_SECRET_APPLE_WATCH?.trim() ?? "",
    generic: process.env.WEARABLE_WEBHOOK_SECRET_GENERIC?.trim() ?? "",
  },
  redisUrl: process.env.REDIS_URL?.trim() ?? "",
  dashboardCacheTtlSec: Number(process.env.DASHBOARD_CACHE_TTL_SEC ?? "45"),
  sloLatencyP95Ms: Number(process.env.SLO_LATENCY_P95_MS ?? "300"),
  sloErrorRatePct: Number(process.env.SLO_ERROR_RATE_PCT ?? "1"),
  adminSeed: {
    name: readRequiredEnv("ADMIN_NAME"),
    email: readRequiredEnv("ADMIN_EMAIL").toLowerCase(),
    password: readRequiredEnv("ADMIN_PASSWORD"),
    phone: process.env.ADMIN_PHONE?.trim() || "9999999999",
  },
  roleInviteCodes: {
    trainer: process.env.TRAINER_INVITE_CODE?.trim() ?? "",
    admin: process.env.ADMIN_INVITE_CODE?.trim() ?? "",
  },
};

if (Number.isNaN(env.port) || env.port <= 0) {
  throw new Error("Environment variable PORT must be a positive number.");
}

if (
  Number.isNaN(env.authRateLimitWindowMs) ||
  Number.isNaN(env.authRateLimitMax) ||
  Number.isNaN(env.mutationRateLimitWindowMs) ||
  Number.isNaN(env.mutationRateLimitMax) ||
  Number.isNaN(env.wearableSyncRateLimitWindowMs) ||
  Number.isNaN(env.wearableSyncRateLimitMax) ||
  Number.isNaN(env.wearableWebhookToleranceSec) ||
  Number.isNaN(env.wearableWebhookDedupeTtlSec) ||
  Number.isNaN(env.wearableAuditDbTimeoutMs) ||
  Number.isNaN(env.wearableAuditRetentionDays) ||
  Number.isNaN(env.wearableAuditCleanupIntervalMs) ||
  Number.isNaN(env.dashboardCacheTtlSec) ||
  Number.isNaN(env.sloLatencyP95Ms) ||
  Number.isNaN(env.sloErrorRatePct)
) {
  throw new Error("Rate limit environment variables must be valid numbers.");
}
