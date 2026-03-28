"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDistributedRateLimiter = createDistributedRateLimiter;
const client_1 = require("../cache/client");
function sanitizeRateLimitKeyPart(value) {
    return value.replace(/[^a-zA-Z0-9:._-]/g, "_").slice(0, 160) || "unknown";
}
function clientIdentity(req) {
    const raw = req.ip || req.socket.remoteAddress || "unknown";
    return sanitizeRateLimitKeyPart(raw);
}
function buildRateLimitKey(namespace, req, keyBuilder) {
    const identity = keyBuilder?.(req) ?? clientIdentity(req);
    return `rl:${namespace}:${sanitizeRateLimitKeyPart(identity)}`;
}
function createDistributedRateLimiter(options) {
    const windowSec = Math.max(1, Math.floor(options.windowMs / 1000));
    return async function distributedRateLimitMiddleware(req, res, next) {
        if (options.skip?.(req)) {
            next();
            return;
        }
        const key = buildRateLimitKey(options.namespace, req, options.key);
        const { count, retryAfterSec } = await (0, client_1.cacheIncrWindow)(key, windowSec);
        const remaining = Math.max(0, options.max - count);
        const resetAtUnix = Math.ceil((Date.now() + retryAfterSec * 1000) / 1000);
        req.rateLimits = {
            ...(req.rateLimits ?? {}),
            [options.namespace]: {
                count,
                limit: options.max,
                remaining,
                retryAfterSec,
                windowSec,
                resetAtUnix,
            },
        };
        res.setHeader("X-RateLimit-Limit", String(options.max));
        res.setHeader("X-RateLimit-Remaining", String(remaining));
        res.setHeader("X-RateLimit-Reset", String(resetAtUnix));
        if (count > options.max) {
            res.setHeader("Retry-After", String(retryAfterSec));
            res.status(429).json({
                error: {
                    code: options.code ?? "RATE_LIMITED",
                    message: options.message,
                    ...(options.buildDetails
                        ? {
                            details: options.buildDetails({
                                req,
                                count,
                                limit: options.max,
                                remaining,
                                retryAfterSec,
                                windowSec,
                            }),
                        }
                        : {}),
                },
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=distributed-rate-limit.js.map