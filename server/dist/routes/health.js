"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const service_1 = require("../health/service");
// Health endpoint for uptime and readiness checks.
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/health/live", (_req, res) => {
    res.status(200).json((0, service_1.buildLivenessReport)());
});
exports.healthRouter.get("/health/ready", async (_req, res) => {
    const report = await (0, service_1.getReadinessReport)();
    res.status(report.status === "ok" ? 200 : 503).json(report);
});
exports.healthRouter.get("/health", async (_req, res) => {
    const report = await (0, service_1.getReadinessReport)();
    res.status(report.status === "ok" ? 200 : 503).json({
        status: report.status,
        service: report.service,
        timestamp: report.timestamp,
        database: report.dependencies.database.status,
        cache: report.dependencies.cache.status,
        dependencies: report.dependencies,
    });
});
//# sourceMappingURL=health.js.map