"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const require_role_1 = require("../middleware/require-role");
const schemas_1 = require("../dashboard/schemas");
const service_1 = require("../dashboard/service");
// Read-only role-specific dashboard endpoints.
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get("/dashboard/admin", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (_req, res) => {
    const dashboard = await (0, service_1.getAdminDashboard)();
    res.status(200).json({ dashboard });
});
exports.dashboardRouter.get("/dashboard/trainer", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.TRAINER), async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const query = schemas_1.recentLimitQuerySchema.parse(req.query);
        const dashboard = await (0, service_1.getTrainerDashboard)(req.auth.userId, query.limit);
        res.status(200).json({ dashboard });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.dashboardRouter.get("/dashboard/member", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.MEMBER), async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const query = schemas_1.recentLimitQuerySchema.parse(req.query);
        const dashboard = await (0, service_1.getMemberDashboard)(req.auth.userId, query.limit);
        res.status(200).json({ dashboard });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=dashboard.js.map