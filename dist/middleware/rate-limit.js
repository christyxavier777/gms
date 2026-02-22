"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutationRateLimiter = exports.authRateLimiter = void 0;
const env_1 = require("../config/env");
const rateLimit = require("express-rate-limit");
// Rate limit for authentication endpoints to reduce brute-force attempts.
exports.authRateLimiter = rateLimit({
    windowMs: env_1.env.authRateLimitWindowMs,
    max: env_1.env.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: "RATE_LIMITED",
            message: "Too many authentication requests. Please try again later.",
        },
    },
});
// Rate limit mutating requests while allowing read traffic.
exports.mutationRateLimiter = rateLimit({
    windowMs: env_1.env.mutationRateLimitWindowMs,
    max: env_1.env.mutationRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (req.path.startsWith("/auth"))
            return true;
        return ["GET", "HEAD", "OPTIONS"].includes(req.method.toUpperCase());
    },
    message: {
        error: {
            code: "RATE_LIMITED",
            message: "Too many write requests. Please slow down and retry.",
        },
    },
});
//# sourceMappingURL=rate-limit.js.map