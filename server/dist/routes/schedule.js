"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const schemas_1 = require("../schedule/schemas");
const service_1 = require("../schedule/service");
exports.scheduleRouter = (0, express_1.Router)();
exports.scheduleRouter.get("/schedule", require_auth_1.requireAuth, async (req, res) => {
    if (!req.auth)
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    const workspace = await (0, service_1.listScheduleWorkspace)(req.auth);
    res.status(200).json({ workspace });
});
exports.scheduleRouter.post("/schedule", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        if (req.auth.role !== client_1.Role.ADMIN && req.auth.role !== client_1.Role.TRAINER) {
            throw new http_error_1.HttpError(403, "SCHEDULE_SESSION_CREATE_FORBIDDEN", "You are not allowed to create scheduled sessions");
        }
        const payload = schemas_1.createScheduleSessionSchema.parse(req.body);
        const session = await (0, service_1.createScheduleSession)(req.auth, payload);
        res.status(201).json({ session });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.scheduleRouter.post("/schedule/:sessionId/book", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        if (req.auth.role !== client_1.Role.MEMBER) {
            throw new http_error_1.HttpError(403, "SCHEDULE_BOOKING_CREATE_FORBIDDEN", "Only members can book scheduled sessions");
        }
        const params = schemas_1.scheduleSessionIdParamSchema.parse(req.params);
        const booking = await (0, service_1.bookScheduleSession)(req.auth, params.sessionId);
        res.status(201).json({ booking });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Path parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.scheduleRouter.patch("/schedule/bookings/:bookingId", require_auth_1.requireAuth, async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const params = schemas_1.scheduleBookingIdParamSchema.parse(req.params);
        const payload = schemas_1.updateScheduleBookingSchema.parse(req.body);
        const booking = await (0, service_1.updateScheduleBookingStatus)(req.auth, params.bookingId, payload.status);
        res.status(200).json({ booking });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=schedule.js.map