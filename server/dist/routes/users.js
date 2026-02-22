"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const require_role_1 = require("../middleware/require-role");
const service_1 = require("../users/service");
const schemas_1 = require("../users/schemas");
// User lifecycle management routes with strict role controls.
exports.usersRouter = (0, express_1.Router)();
exports.usersRouter.get("/users", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const query = schemas_1.listUsersQuerySchema.parse(req.query);
        const result = await (0, service_1.listUsers)(query.page, query.pageSize);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.usersRouter.get("/users/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        const params = schemas_1.userIdParamSchema.parse(req.params);
        if (!req.auth) {
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        }
        const allowed = (0, service_1.canReadUser)(req.auth, params.id);
        if (!allowed) {
            throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this resource");
        }
        const user = await (0, service_1.getUserById)(params.id);
        res.status(200).json({ user });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.usersRouter.patch("/users/:id/status", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const params = schemas_1.userIdParamSchema.parse(req.params);
        const payload = schemas_1.patchUserStatusSchema.parse(req.body);
        const user = await (0, service_1.updateUserStatus)(params.id, payload.status);
        res.status(200).json({ user });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.usersRouter.delete("/users/:id", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const params = schemas_1.userIdParamSchema.parse(req.params);
        if (!req.auth) {
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        }
        if (req.auth.userId === params.id) {
            throw new http_error_1.HttpError(400, "ADMIN_SELF_DELETE_BLOCKED", "Admin cannot delete own account");
        }
        await (0, service_1.deleteUser)(params.id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=users.js.map