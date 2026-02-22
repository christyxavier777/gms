"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = errorHandlerMiddleware;
// Final error boundary for unhandled application errors.
function errorHandlerMiddleware(err, _req, res, _next) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({ error: message });
}
//# sourceMappingURL=error-handler.js.map