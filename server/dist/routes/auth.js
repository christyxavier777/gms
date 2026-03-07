"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const schemas_1 = require("../auth/schemas");
const service_1 = require("../auth/service");
const session_1 = require("../auth/session");
const http_error_1 = require("../middleware/http-error");
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
        const loginMeta = {};
        const userAgent = req.header("user-agent");
        if (userAgent)
            loginMeta.userAgent = userAgent;
        if (req.ip)
            loginMeta.ipAddress = req.ip;
        const session = await (0, service_1.loginUser)(payload, loginMeta);
        res.cookie((0, session_1.getSessionCookieName)(), session.sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            expires: session.expiresAt,
            path: "/",
        });
        res.status(200).json({ user: session.user });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Request payload is invalid", error.flatten());
        }
        throw error;
    }
});
exports.authRouter.post("/logout", async (req, res) => {
    const sessionToken = (0, session_1.extractSessionToken)(req.header("cookie"));
    if (sessionToken) {
        await (0, session_1.revokeSession)(sessionToken);
    }
    res.clearCookie((0, session_1.getSessionCookieName)(), { path: "/" });
    res.status(204).send();
});
//# sourceMappingURL=auth.js.map