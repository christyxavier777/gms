"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementsRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const service_1 = require("../achievements/service");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const require_role_1 = require("../middleware/require-role");
const schemas_1 = require("../users/schemas");
exports.achievementsRouter = (0, express_1.Router)();
exports.achievementsRouter.get("/me/achievements", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.MEMBER), async (req, res) => {
    if (!req.auth)
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const achievements = await (0, service_1.getMemberAchievements)(req.auth.userId);
    res.status(200).json({ achievements });
});
exports.achievementsRouter.get("/users/:id/achievements", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN, client_1.Role.TRAINER), async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = schemas_1.userIdParamSchema.parse(req.params);
        const allowed = await (0, service_1.canReadAchievements)(req.auth, params.id);
        if (!allowed) {
            throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to view this member achievements");
        }
        const achievements = await (0, service_1.getMemberAchievements)(params.id);
        res.status(200).json({ achievements });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=achievements.js.map