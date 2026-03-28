"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const schemas_1 = require("../payments/schemas");
const service_1 = require("../payments/service");
exports.paymentsRouter = (0, express_1.Router)();
exports.paymentsRouter.post("/payments/upi", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const payload = schemas_1.createPaymentSchema.parse(req.body);
        const payment = await (0, service_1.createPayment)(req.auth, payload);
        res.status(201).json({ payment });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.paymentsRouter.get("/payments", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const query = schemas_1.listPaymentsQuerySchema.parse(req.query);
        const result = await (0, service_1.listPayments)(req.auth, query);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.paymentsRouter.get("/payments/:id", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = schemas_1.paymentIdParamSchema.parse(req.params);
        const payment = await (0, service_1.getPaymentById)(req.auth, params.id);
        res.status(200).json({ payment });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.paymentsRouter.patch("/payments/:id/status", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        if (req.auth.role !== client_1.Role.ADMIN) {
            throw new http_error_1.HttpError(403, "PAYMENT_REVIEW_FORBIDDEN", "Only admins can update payment status");
        }
        const params = schemas_1.paymentIdParamSchema.parse(req.params);
        const payload = schemas_1.updatePaymentStatusSchema.parse(req.body);
        const payment = await (0, service_1.updatePaymentStatus)(req.auth, params.id, {
            status: payload.status,
            verificationNotes: payload.verificationNotes,
        });
        res.status(200).json({ payment });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=payments.js.map