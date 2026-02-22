"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = notFoundMiddleware;
// Handles requests that do not match any route.
function notFoundMiddleware(req, res, _next) {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
//# sourceMappingURL=not-found.js.map