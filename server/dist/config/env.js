"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ quiet: true });
function readRequiredEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
}
exports.env = {
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
if (Number.isNaN(exports.env.port) || exports.env.port <= 0) {
    throw new Error("Environment variable PORT must be a positive number.");
}
if (Number.isNaN(exports.env.authRateLimitWindowMs) ||
    Number.isNaN(exports.env.authRateLimitMax) ||
    Number.isNaN(exports.env.mutationRateLimitWindowMs) ||
    Number.isNaN(exports.env.mutationRateLimitMax) ||
    Number.isNaN(exports.env.wearableSyncRateLimitWindowMs) ||
    Number.isNaN(exports.env.wearableSyncRateLimitMax) ||
    Number.isNaN(exports.env.wearableWebhookToleranceSec) ||
    Number.isNaN(exports.env.dashboardCacheTtlSec) ||
    Number.isNaN(exports.env.sloLatencyP95Ms) ||
    Number.isNaN(exports.env.sloErrorRatePct)) {
    throw new Error("Rate limit environment variables must be valid numbers.");
}
//# sourceMappingURL=env.js.map