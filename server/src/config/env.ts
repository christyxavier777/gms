import dotenv from "dotenv";

dotenv.config({ quiet: true });

type CookieSameSite = "lax" | "strict" | "none";

function readRequiredEnv(
  name:
    | "PORT"
    | "DATABASE_URL"
    | "JWT_SECRET"
    | "JWT_EXPIRES_IN",
): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function readOptionalEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = readOptionalEnv(name);
  if (!value) return defaultValue;

  const normalized = value.toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  throw new Error(`Environment variable ${name} must be a boolean value.`);
}

function readCommaSeparatedEnv(name: string): string[] {
  return readOptionalEnv(name)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function readCookieSameSiteEnv(name: string, defaultValue: CookieSameSite): CookieSameSite {
  const value = readOptionalEnv(name);
  if (!value) return defaultValue;

  const normalized = value.toLowerCase();
  if (normalized === "lax" || normalized === "strict" || normalized === "none") {
    return normalized;
  }

  throw new Error(`Environment variable ${name} must be one of: lax, strict, none.`);
}

function readAdminSeedEnv():
  | null
  | {
      name: string;
      email: string;
      password: string;
      phone: string;
    } {
  const name = readOptionalEnv("ADMIN_NAME");
  const email = readOptionalEnv("ADMIN_EMAIL").toLowerCase();
  const password = readOptionalEnv("ADMIN_PASSWORD");
  const phone = readOptionalEnv("ADMIN_PHONE") || "9999999999";

  if (!name && !email && !password) {
    return null;
  }

  if (!name || !email || !password) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must all be set together.");
  }

  return {
    name,
    email,
    password,
    phone,
  };
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const cookieSecureDefault = nodeEnv === "production";

export const env = {
  nodeEnv,
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
  subscriptionExpiryIntervalMs: Number(process.env.SUBSCRIPTION_EXPIRY_INTERVAL_MS ?? "300000"),
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
  corsAllowedOrigins: readCommaSeparatedEnv("CORS_ALLOWED_ORIGINS"),
  cookie: {
    secure: readBooleanEnv("COOKIE_SECURE", cookieSecureDefault),
    sameSite: readCookieSameSiteEnv("COOKIE_SAME_SITE", "lax"),
    domain: readOptionalEnv("COOKIE_DOMAIN") || null,
  },
  adminSeed: readAdminSeedEnv(),
  roleInviteCodes: {
    trainer: readOptionalEnv("TRAINER_INVITE_CODE"),
    admin: readOptionalEnv("ADMIN_INVITE_CODE"),
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
  Number.isNaN(env.subscriptionExpiryIntervalMs) ||
  Number.isNaN(env.wearableAuditRetentionDays) ||
  Number.isNaN(env.wearableAuditCleanupIntervalMs) ||
  Number.isNaN(env.dashboardCacheTtlSec) ||
  Number.isNaN(env.sloLatencyP95Ms) ||
  Number.isNaN(env.sloErrorRatePct)
) {
  throw new Error("Rate limit environment variables must be valid numbers.");
}

if (env.subscriptionExpiryIntervalMs <= 0 || env.wearableAuditCleanupIntervalMs <= 0) {
  throw new Error("Background job interval environment variables must be positive numbers.");
}

if (env.cookie.sameSite === "none" && !env.cookie.secure) {
  throw new Error("COOKIE_SECURE must be true when COOKIE_SAME_SITE is none.");
}
