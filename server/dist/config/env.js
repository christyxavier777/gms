"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Loads environment variables from .env as early as possible.
dotenv_1.default.config({ quiet: true });
function readRequiredEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value.trim();
}
// Centralized, validated runtime configuration for the server process.
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
    adminSeed: {
        name: readRequiredEnv("ADMIN_NAME"),
        email: readRequiredEnv("ADMIN_EMAIL").toLowerCase(),
        password: readRequiredEnv("ADMIN_PASSWORD"),
    },
};
if (Number.isNaN(exports.env.port) || exports.env.port <= 0) {
    throw new Error("Environment variable PORT must be a positive number.");
}
if (Number.isNaN(exports.env.authRateLimitWindowMs) ||
    Number.isNaN(exports.env.authRateLimitMax) ||
    Number.isNaN(exports.env.mutationRateLimitWindowMs) ||
    Number.isNaN(exports.env.mutationRateLimitMax)) {
    throw new Error("Rate limit environment variables must be valid numbers.");
}
//# sourceMappingURL=env.js.map