"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dietPlansRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const diet_schemas_1 = require("../plans/diet-schemas");
const diet_service_1 = require("../plans/diet-service");
// Diet plan CRUD and assignment endpoints.
exports.dietPlansRouter = (0, express_1.Router)();
exports.dietPlansRouter.post("/diet-plans", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const payload = diet_schemas_1.createDietPlanSchema.parse(req.body);
        const plan = await (0, diet_service_1.createDietPlan)(req.auth, payload);
        res.status(201).json({ plan });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.dietPlansRouter.get("/diet-plans", require_auth_1.requireAuth, async (req, res) => {
    if (!req.auth)
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const plans = await (0, diet_service_1.listDietPlans)(req.auth);
    res.status(200).json({ plans });
});
exports.dietPlansRouter.get("/diet-plans/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = diet_schemas_1.dietPlanIdParamSchema.parse(req.params);
        const plan = await (0, diet_service_1.getDietPlanById)(req.auth, params.id);
        res.status(200).json({ plan });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.dietPlansRouter.patch("/diet-plans/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = diet_schemas_1.dietPlanIdParamSchema.parse(req.params);
        const payload = diet_schemas_1.updateDietPlanSchema.parse(req.body);
        const plan = await (0, diet_service_1.updateDietPlan)(req.auth, params.id, payload);
        res.status(200).json({ plan });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request is invalid", error.flatten());
        }
        throw error;
    }
});
exports.dietPlansRouter.delete("/diet-plans/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = diet_schemas_1.dietPlanIdParamSchema.parse(req.params);
        await (0, diet_service_1.deleteDietPlan)(req.auth, params.id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.dietPlansRouter.post("/diet-plans/:id/assign", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = diet_schemas_1.dietPlanIdParamSchema.parse(req.params);
        const payload = diet_schemas_1.assignDietPlanSchema.parse(req.body);
        const plan = await (0, diet_service_1.assignDietPlan)(req.auth, params.id, payload.memberId);
        res.status(200).json({ plan });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request is invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=diet-plans.js.map