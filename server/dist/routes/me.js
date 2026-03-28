"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meRouter = void 0;
const express_1 = require("express");
const service_1 = require("../auth/service");
const session_1 = require("../auth/session");
const env_1 = require("../config/env");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
// Authenticated profile endpoint.
exports.meRouter = (0, express_1.Router)();
exports.meRouter.get("/me", require_auth_1.requireAuth, async (req, res) => {
    if (!req.auth) {
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }
    const user = await (0, service_1.getSafeUserById)(req.auth.userId);
    res.status(200).json({ user });
});
exports.meRouter.get("/me/sessions", require_auth_1.requireAuth, async (req, res) => {
    if (!req.auth) {
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }
    const currentSessionToken = (0, session_1.extractSessionToken)(req.header("cookie"));
    const sessions = await (0, session_1.listUserSessions)({
        userId: req.auth.userId,
        currentSessionToken,
    });
    res.status(200).json({ sessions });
});
exports.meRouter.post("/me/sessions/revoke-others", require_auth_1.requireAuth, async (req, res) => {
    if (!req.auth) {
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }
    const currentSessionToken = (0, session_1.extractSessionToken)(req.header("cookie"));
    if (!currentSessionToken) {
        throw new http_error_1.HttpError(400, "SESSION_CONTEXT_REQUIRED", "Signing out other sessions requires a session-backed request");
    }
    const result = await (0, session_1.revokeUserSessions)({
        userId: req.auth.userId,
        excludeSessionToken: currentSessionToken,
    });
    res.status(200).json(result);
});
exports.meRouter.post("/me/sessions/revoke-all", require_auth_1.requireAuth, async (req, res) => {
    if (!req.auth) {
        throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
    }
    const result = await (0, session_1.revokeUserSessions)({
        userId: req.auth.userId,
    });
    res.clearCookie((0, session_1.getSessionCookieName)(), {
        path: "/",
        ...(env_1.env.cookie.domain ? { domain: env_1.env.cookie.domain } : {}),
    });
    res.status(200).json(result);
});
//# sourceMappingURL=me.js.map