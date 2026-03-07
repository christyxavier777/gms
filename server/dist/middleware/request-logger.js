"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = requestLoggerMiddleware;
const logger_1 = require("../utils/logger");
// Minimal request logging for method + path + status without sensitive payloads.
function requestLoggerMiddleware(req, res, next) {
    const startedAt = Date.now();
    res.on("finish", () => {
        const durationMs = Date.now() - startedAt;
        (0, logger_1.logInfo)("http_request", {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            userId: req.auth?.userId,
            role: req.auth?.role,
            ip: req.ip,
        });
    });
    next();
}
//# sourceMappingURL=request-logger.js.map