"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const http_error_1 = require("./http-error");
// Enforces role-based authorization on already authenticated requests.
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.auth) {
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        }
        if (!roles.includes(req.auth.role)) {
            throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this resource");
        }
        next();
    };
}
//# sourceMappingURL=require-role.js.map