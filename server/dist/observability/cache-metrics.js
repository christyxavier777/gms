"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordDashboardCacheHit = recordDashboardCacheHit;
exports.recordDashboardCacheMiss = recordDashboardCacheMiss;
exports.recordDashboardCacheSet = recordDashboardCacheSet;
exports.recordDashboardCacheInvalidation = recordDashboardCacheInvalidation;
exports.getCacheSnapshot = getCacheSnapshot;
const cacheCounters = {
    dashboardHits: 0,
    dashboardMisses: 0,
    dashboardSets: 0,
    dashboardInvalidations: 0,
    dashboardInvalidatedKeys: 0,
};
function recordDashboardCacheHit() {
    cacheCounters.dashboardHits += 1;
}
function recordDashboardCacheMiss() {
    cacheCounters.dashboardMisses += 1;
}
function recordDashboardCacheSet() {
    cacheCounters.dashboardSets += 1;
}
function recordDashboardCacheInvalidation(removed) {
    cacheCounters.dashboardInvalidations += 1;
    cacheCounters.dashboardInvalidatedKeys += Math.max(0, removed);
}
function getCacheSnapshot() {
    const total = cacheCounters.dashboardHits + cacheCounters.dashboardMisses;
    const hitRate = total === 0 ? 0 : (cacheCounters.dashboardHits / total) * 100;
    return {
        ...cacheCounters,
        dashboardHitRatePct: Number(hitRate.toFixed(2)),
    };
}
//# sourceMappingURL=cache-metrics.js.map