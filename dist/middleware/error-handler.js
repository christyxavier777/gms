"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = errorHandlerMiddleware;
const http_error_1 = require("./http-error");
// Final error boundary for unhandled application errors.
function errorHandlerMiddleware(err, _req, res, _next) {
    if (err instanceof http_error_1.HttpError) {
        res.status(err.status).json({
            error: {
                code: err.code,
                message: err.message,
                ...(err.details !== undefined ? { details: err.details } : {}),
            },
        });
        return;
    }
    res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Unexpected server error",
        },
    });
}
//# sourceMappingURL=error-handler.js.map