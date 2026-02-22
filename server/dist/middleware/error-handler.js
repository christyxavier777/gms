"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlerMiddleware = errorHandlerMiddleware;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const http_error_1 = require("./http-error");
// Final error boundary for unhandled application errors.
function errorHandlerMiddleware(err, _req, res, _next) {
    if (err && typeof err === "object" && "type" in err && err.type === "entity.too.large") {
        res.status(413).json({
            error: {
                code: "PAYLOAD_TOO_LARGE",
                message: "Request payload exceeds allowed size",
            },
        });
        return;
    }
    if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({
            error: {
                code: "INVALID_JSON",
                message: "Malformed JSON payload",
            },
        });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Request payload is invalid",
                details: err.flatten(),
            },
        });
        return;
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const status = err.code === "P2025" ? 404 : 400;
        const code = err.code === "P2025" ? "RESOURCE_NOT_FOUND" : "DATABASE_ERROR";
        res.status(status).json({
            error: {
                code,
                message: "Database operation failed",
            },
        });
        return;
    }
    if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
        res.status(401).json({
            error: {
                code: "TOKEN_EXPIRED",
                message: "Token has expired",
            },
        });
        return;
    }
    if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
        res.status(401).json({
            error: {
                code: "INVALID_TOKEN",
                message: "Invalid token",
            },
        });
        return;
    }
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
    if (env_1.env.nodeEnv !== "production") {
        console.error("[error]", err);
    }
    else {
        console.error("[error] unexpected server error");
    }
    res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Unexpected server error",
        },
    });
}
//# sourceMappingURL=error-handler.js.map