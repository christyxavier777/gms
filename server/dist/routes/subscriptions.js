"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const require_role_1 = require("../middleware/require-role");
const schemas_1 = require("../subscriptions/schemas");
const service_1 = require("../subscriptions/service");
// Subscription lifecycle endpoints.
exports.subscriptionsRouter = (0, express_1.Router)();
exports.subscriptionsRouter.post("/subscriptions", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const payload = schemas_1.createSubscriptionSchema.parse(req.body);
        const subscription = await (0, service_1.createSubscription)(payload);
        res.status(201).json({ subscription });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.subscriptionsRouter.get("/subscriptions", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (_req, res) => {
    const subscriptions = await (0, service_1.listSubscriptions)();
    res.status(200).json({ subscriptions });
});
exports.subscriptionsRouter.get("/subscriptions/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = schemas_1.subscriptionIdParamSchema.parse(req.params);
        const subscription = await (0, service_1.getSubscriptionById)(req.auth, params.id);
        res.status(200).json({ subscription });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.subscriptionsRouter.get("/me/subscription", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.MEMBER), async (req, res) => {
    if (!req.auth)
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const subscription = await (0, service_1.getMySubscription)(req.auth.userId);
    res.status(200).json({ subscription });
});
exports.subscriptionsRouter.post("/subscriptions/:id/cancel", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const params = schemas_1.subscriptionIdParamSchema.parse(req.params);
        const subscription = await (0, service_1.cancelSubscription)(params.id);
        res.status(200).json({ subscription });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=subscriptions.js.map