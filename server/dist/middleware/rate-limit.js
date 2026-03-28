"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wearableSyncRateLimiter = exports.mutationRateLimiter = exports.loginRateLimiter = exports.authRateLimiter = void 0;
const env_1 = require("../config/env");
const distributed_rate_limit_1 = require("./distributed-rate-limit");
function normalizeRateLimitKeyPart(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9:._-]/g, "_").slice(0, 160) || "unknown";
}
function buildLoginIdentity(req) {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    return `${normalizeRateLimitKeyPart(ipAddress)}:${normalizeRateLimitKeyPart(email || "anonymous")}`;
}
// Rate limit for authentication endpoints to reduce brute-force attempts.
exports.authRateLimiter = (0, distributed_rate_limit_1.createDistributedRateLimiter)({
    namespace: "auth",
    windowMs: env_1.env.authRateLimitWindowMs,
    max: env_1.env.authRateLimitMax,
    message: "Too many authentication requests. Please try again later.",
    code: "AUTH_THROTTLED",
    skip: (req) => req.path === "/login",
    buildDetails: ({ limit, retryAfterSec, windowSec }) => ({
        throttleScope: "auth",
        retryAfterSeconds: retryAfterSec,
        limit,
        windowSeconds: windowSec,
    }),
});
// Dedicated login limiter with retry metadata for lockout-like feedback.
exports.loginRateLimiter = (0, distributed_rate_limit_1.createDistributedRateLimiter)({
    namespace: "login",
    windowMs: env_1.env.authRateLimitWindowMs,
    max: env_1.env.authRateLimitMax,
    message: "Too many login attempts. Please wait before trying again.",
    code: "AUTH_LOGIN_THROTTLED",
    key: buildLoginIdentity,
    buildDetails: ({ limit, retryAfterSec, windowSec }) => ({
        throttleScope: "login",
        retryAfterSeconds: retryAfterSec,
        limit,
        windowSeconds: windowSec,
    }),
});
// Rate limit mutating requests while allowing read traffic.
exports.mutationRateLimiter = (0, distributed_rate_limit_1.createDistributedRateLimiter)({
    namespace: "mutation",
    windowMs: env_1.env.mutationRateLimitWindowMs,
    max: env_1.env.mutationRateLimitMax,
    skip: (req) => {
        if (req.path.startsWith("/auth"))
            return true;
        return ["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase());
    },
    message: "Too many write requests. Please slow down and retry.",
});
// Dedicated limiter for wearable sync ingestion bursts.
exports.wearableSyncRateLimiter = (0, distributed_rate_limit_1.createDistributedRateLimiter)({
    namespace: "wearable_sync",
    windowMs: env_1.env.wearableSyncRateLimitWindowMs,
    max: env_1.env.wearableSyncRateLimitMax,
    message: "Too many wearable sync requests. Please retry shortly.",
});
//# sourceMappingURL=rate-limit.js.map