"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const schemas_1 = require("../progress/schemas");
const service_1 = require("../progress/service");
// Fitness progress routes.
exports.progressRouter = (0, express_1.Router)();
exports.progressRouter.post("/progress", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        if (req.auth.role !== client_1.Role.ADMIN && req.auth.role !== client_1.Role.TRAINER) {
            throw new http_error_1.HttpError(403, "PROGRESS_CREATE_FORBIDDEN", "You are not allowed to create progress entries");
        }
        const payload = schemas_1.createProgressSchema.parse(req.body);
        const progress = await (0, service_1.createProgressEntry)(req.auth, payload);
        res.status(201).json({ progress });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.progressRouter.get("/progress", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        if (req.auth.role !== client_1.Role.ADMIN) {
            throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this resource");
        }
        const query = schemas_1.listProgressQuerySchema.parse(req.query);
        const result = await (0, service_1.listAllProgress)(query);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.progressRouter.get("/progress/:userId", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = schemas_1.progressUserIdParamSchema.parse(req.params);
        const query = schemas_1.listProgressQuerySchema.parse(req.query);
        const result = await (0, service_1.getProgressByUserId)(req.auth, params.userId, query);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.progressRouter.delete("/progress/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        if (req.auth.role !== client_1.Role.ADMIN) {
            throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this resource");
        }
        const params = schemas_1.progressIdParamSchema.parse(req.params);
        await (0, service_1.deleteProgressEntry)(params.id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=progress.js.map