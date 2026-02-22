"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meRouter = void 0;
const express_1 = require("express");
const service_1 = require("../auth/service");
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
//# sourceMappingURL=me.js.map