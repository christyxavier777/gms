"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../auth/jwt");
const http_error_1 = require("./http-error");
// Ensures a valid Bearer token is present and attaches auth context to request.
function requireAuth(req, _res, next) {
    const authorizationHeader = req.header("authorization");
    if (!authorizationHeader) {
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authorization header is required");
    }
    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        throw new http_error_1.HttpError(401, "INVALID_AUTH_HEADER", "Authorization header must be Bearer token");
    }
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        if (!payload.userId || !payload.role) {
            throw new http_error_1.HttpError(401, "INVALID_TOKEN", "Token payload is invalid");
        }
        req.auth = { userId: payload.userId, role: payload.role };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new http_error_1.HttpError(401, "TOKEN_EXPIRED", "Token has expired");
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new http_error_1.HttpError(401, "INVALID_TOKEN", "Invalid token");
        }
        throw error;
    }
}
//# sourceMappingURL=require-auth.js.map