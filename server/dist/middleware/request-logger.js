"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = requestLoggerMiddleware;
// Minimal request logging for method + path + status without sensitive payloads.
function requestLoggerMiddleware(req, res, next) {
    const startedAt = Date.now();
    res.on("finish", () => {
        const durationMs = Date.now() - startedAt;
        console.log(`[request] ${req.method} ${req.path} -> ${res.statusCode} (${durationMs}ms)`);
    });
    next();
}
//# sourceMappingURL=request-logger.js.map