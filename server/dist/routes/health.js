"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
// Health endpoint for uptime and readiness checks.
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
//# sourceMappingURL=health.js.map