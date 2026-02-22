"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const schemas_1 = require("../auth/schemas");
const service_1 = require("../auth/service");
const http_error_1 = require("../middleware/http-error");
// Authentication endpoints for registration and credential login.
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", async (req, res) => {
    try {
        const payload = schemas_1.registerSchema.parse(req.body);
        const user = await (0, service_1.registerUser)(payload);
        res.status(201).json({ user });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.authRouter.post("/login", async (req, res) => {
    try {
        const payload = schemas_1.loginSchema.parse(req.body);
        const token = await (0, service_1.loginUser)(payload);
        res.status(200).json({ token });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=auth.js.map