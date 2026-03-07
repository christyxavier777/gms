"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDistributedRateLimiter = createDistributedRateLimiter;
const client_1 = require("../cache/client");
function clientIdentity(req) {
    const raw = req.ip || req.socket.remoteAddress || "unknown";
    return raw.replace(/[^a-zA-Z0-9:._-]/g, "_");
}
function createDistributedRateLimiter(options) {
    const windowSec = Math.max(1, Math.floor(options.windowMs / 1000));
    return async function distributedRateLimitMiddleware(req, res, next) {
        if (options.skip?.(req)) {
            next();
            return;
        }
        const key = `rl:${options.namespace}:${clientIdentity(req)}`;
        const count = await (0, client_1.cacheIncrWindow)(key, windowSec);
        res.setHeader("X-RateLimit-Limit", String(options.max));
        res.setHeader("X-RateLimit-Remaining", String(Math.max(0, options.max - count)));
        if (count > options.max) {
            res.setHeader("Retry-After", String(windowSec));
            res.status(429).json({
                error: {
                    code: "RATE_LIMITED",
                    message: options.message,
                },
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=distributed-rate-limit.js.map