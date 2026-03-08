"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wearableSyncRateLimiter = exports.mutationRateLimiter = exports.authRateLimiter = void 0;
const env_1 = require("../config/env");
const distributed_rate_limit_1 = require("./distributed-rate-limit");
// Rate limit for authentication endpoints to reduce brute-force attempts.
exports.authRateLimiter = (0, distributed_rate_limit_1.createDistributedRateLimiter)({
    namespace: "auth",
    windowMs: env_1.env.authRateLimitWindowMs,
    max: env_1.env.authRateLimitMax,
    message: "Too many authentication requests. Please try again later.",
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