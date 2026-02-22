"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workoutPlansRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const workout_schemas_1 = require("../plans/workout-schemas");
const workout_service_1 = require("../plans/workout-service");
// Workout plan CRUD and assignment endpoints.
exports.workoutPlansRouter = (0, express_1.Router)();
exports.workoutPlansRouter.post("/workout-plans", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const payload = workout_schemas_1.createWorkoutPlanSchema.parse(req.body);
        const plan = await (0, workout_service_1.createWorkoutPlan)(req.auth, payload);
        res.status(201).json({ plan });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.workoutPlansRouter.get("/workout-plans", require_auth_1.requireAuth, async (req, res) => {
    if (!req.auth)
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const plans = await (0, workout_service_1.listWorkoutPlans)(req.auth);
    res.status(200).json({ plans });
});
exports.workoutPlansRouter.get("/workout-plans/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = workout_schemas_1.workoutPlanIdParamSchema.parse(req.params);
        const plan = await (0, workout_service_1.getWorkoutPlanById)(req.auth, params.id);
        res.status(200).json({ plan });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.workoutPlansRouter.patch("/workout-plans/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = workout_schemas_1.workoutPlanIdParamSchema.parse(req.params);
        const payload = workout_schemas_1.updateWorkoutPlanSchema.parse(req.body);
        const plan = await (0, workout_service_1.updateWorkoutPlan)(req.auth, params.id, payload);
        res.status(200).json({ plan });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request is invalid", error.flatten());
        }
        throw error;
    }
});
exports.workoutPlansRouter.delete("/workout-plans/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = workout_schemas_1.workoutPlanIdParamSchema.parse(req.params);
        await (0, workout_service_1.deleteWorkoutPlan)(req.auth, params.id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.workoutPlansRouter.post("/workout-plans/:id/assign", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = workout_schemas_1.workoutPlanIdParamSchema.parse(req.params);
        const payload = workout_schemas_1.assignWorkoutPlanSchema.parse(req.body);
        const plan = await (0, workout_service_1.assignWorkoutPlan)(req.auth, params.id, payload.memberId);
        res.status(200).json({ plan });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request is invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=workout-plans.js.map