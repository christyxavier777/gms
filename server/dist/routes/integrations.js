"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integrationsRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const schemas_1 = require("../integrations/schemas");
const service_1 = require("../integrations/service");
const http_error_1 = require("../middleware/http-error");
const rate_limit_1 = require("../middleware/rate-limit");
const require_auth_1 = require("../middleware/require-auth");
const require_role_1 = require("../middleware/require-role");
exports.integrationsRouter = (0, express_1.Router)();
exports.integrationsRouter.post("/integrations/wearables/sync", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.MEMBER), rate_limit_1.wearableSyncRateLimiter, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const payload = schemas_1.wearableSyncSchema.parse(req.body);
        const synced = await (0, service_1.syncWearableProgress)(req.auth, payload);
        res.status(201).json({ synced });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Wearable payload is invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=integrations.js.map