"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const http_error_1 = require("../middleware/http-error");
const require_auth_1 = require("../middleware/require-auth");
const require_role_1 = require("../middleware/require-role");
const schemas_1 = require("../dashboard/schemas");
const service_1 = require("../dashboard/service");
const cache_1 = require("../dashboard/cache");
const perf_metrics_1 = require("../observability/perf-metrics");
const cache_metrics_1 = require("../observability/cache-metrics");
// Read-only role-specific dashboard endpoints.
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get("/dashboard/admin", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (_req, res) => {
    const cacheKey = (0, cache_1.buildDashboardCacheKey)("admin", "global");
    const cached = await (0, cache_1.getDashboardCache)(cacheKey);
    const dashboard = cached ?? (await (0, service_1.getAdminDashboard)());
    if (!cached) {
        await (0, cache_1.setDashboardCache)(cacheKey, dashboard);
    }
    res.status(200).json({ dashboard });
});
exports.dashboardRouter.get("/dashboard/admin/performance", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const requestedLimit = Number(req.query.limit ?? 30);
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 30;
    const metrics = (0, perf_metrics_1.getPerformanceSnapshot)(limit);
    const slo = (0, perf_metrics_1.getSloSnapshot)();
    const cache = (0, cache_metrics_1.getCacheSnapshot)();
    res.status(200).json({ metrics, slo, cache });
});
exports.dashboardRouter.get("/dashboard/trainer", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.TRAINER), async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const query = schemas_1.recentLimitQuerySchema.parse(req.query);
        const cacheKey = (0, cache_1.buildDashboardCacheKey)("trainer", req.auth.userId, query.limit);
        const cached = await (0, cache_1.getDashboardCache)(cacheKey);
        const dashboard = cached ?? (await (0, service_1.getTrainerDashboard)(req.auth.userId, query.limit));
        if (!cached) {
            await (0, cache_1.setDashboardCache)(cacheKey, dashboard);
        }
        res.status(200).json({ dashboard });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
        }
        throw error;
    }
});
exports.dashboardRouter.get("/dashboard/member", require_auth_1.requireAuth, (0, require_role_1.requireRole)(client_1.Role.MEMBER), async (req, res) => {
    try {
        if (!req.auth)
            throw new http_error_1.HttpError(401, "AUTH_REQUIRED", "Authentication is required");
        const query = schemas_1.recentLimitQuerySchema.parse(req.query);
        const cacheKey = (0, cache_1.buildDashboardCacheKey)("member", req.auth.userId, query.limit);
        const cached = await (0, cache_1.getDashboardCache)(cacheKey);
        const dashboard = cached ?? (await (0, service_1.getMemberDashboard)(req.auth.userId, query.limit));
        if (!cached) {
            await (0, cache_1.setDashboardCache)(cacheKey, dashboard);
        }
        res.status(200).json({ dashboard });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            throw new http_error_1.HttpError(400, "VALIDATION_ERROR", "Query parameters are invalid", error.flatten());
        }
        throw error;
    }
});
//# sourceMappingURL=dashboard.js.map