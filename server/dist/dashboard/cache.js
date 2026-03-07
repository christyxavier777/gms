"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDashboardCacheKey = buildDashboardCacheKey;
exports.getDashboardCache = getDashboardCache;
exports.setDashboardCache = setDashboardCache;
exports.invalidateDashboardCache = invalidateDashboardCache;
const env_1 = require("../config/env");
const client_1 = require("../cache/client");
const logger_1 = require("../utils/logger");
const cache_metrics_1 = require("../observability/cache-metrics");
const DASHBOARD_CACHE_PREFIX = "dashboard:v1:";
function buildDashboardCacheKey(scope, id, limit = 0) {
    return `${DASHBOARD_CACHE_PREFIX}${scope}:${id}:${limit}`;
}
async function getDashboardCache(key) {
    const raw = await (0, client_1.cacheGet)(key);
    if (!raw) {
        (0, cache_metrics_1.recordDashboardCacheMiss)();
        return null;
    }
    try {
        const parsed = JSON.parse(raw);
        (0, cache_metrics_1.recordDashboardCacheHit)();
        return parsed;
    }
    catch {
        (0, cache_metrics_1.recordDashboardCacheMiss)();
        return null;
    }
}
async function setDashboardCache(key, payload) {
    await (0, client_1.cacheSet)(key, JSON.stringify(payload), env_1.env.dashboardCacheTtlSec);
    (0, cache_metrics_1.recordDashboardCacheSet)();
}
async function invalidateDashboardCache(reason) {
    const removed = await (0, client_1.cacheDelByPrefix)(DASHBOARD_CACHE_PREFIX);
    (0, cache_metrics_1.recordDashboardCacheInvalidation)(removed);
    (0, logger_1.logInfo)("dashboard_cache_invalidate", { reason, removed });
}
//# sourceMappingURL=cache.js.map