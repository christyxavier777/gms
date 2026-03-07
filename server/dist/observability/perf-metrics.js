"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEndpointKey = buildEndpointKey;
exports.recordRequestMetric = recordRequestMetric;
exports.getPerformanceSnapshot = getPerformanceSnapshot;
exports.getSloSnapshot = getSloSnapshot;
exports.logPerformanceSummaryAndReset = logPerformanceSummaryAndReset;
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
const SAMPLE_CAP = 512;
const endpointMetrics = new Map();
function percentile(values, p) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    const safeIdx = Math.max(0, Math.min(sorted.length - 1, idx));
    const value = sorted[safeIdx] ?? sorted[sorted.length - 1] ?? 0;
    return Number(value.toFixed(2));
}
function normalizePath(path) {
    const noQuery = path.split("?")[0] || path;
    return noQuery
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ":id")
        .replace(/\/\d+(\b|$)/g, "/:num");
}
function buildEndpointKey(method, path) {
    return `${method.toUpperCase()} ${normalizePath(path)}`;
}
function recordRequestMetric(endpoint, durationMs, statusCode) {
    const current = endpointMetrics.get(endpoint) ?? {
        count: 0,
        totalMs: 0,
        maxMs: 0,
        status4xx: 0,
        status5xx: 0,
        samplesMs: [],
    };
    current.count += 1;
    current.totalMs += durationMs;
    current.maxMs = Math.max(current.maxMs, durationMs);
    if (statusCode >= 400 && statusCode < 500)
        current.status4xx += 1;
    if (statusCode >= 500)
        current.status5xx += 1;
    current.samplesMs.push(durationMs);
    if (current.samplesMs.length > SAMPLE_CAP) {
        current.samplesMs.shift();
    }
    endpointMetrics.set(endpoint, current);
}
function buildSnapshotFromCurrent() {
    return Array.from(endpointMetrics.entries())
        .map(([endpoint, metric]) => ({
        endpoint,
        count: metric.count,
        avgMs: Number((metric.totalMs / Math.max(1, metric.count)).toFixed(2)),
        p95Ms: percentile(metric.samplesMs, 95),
        maxMs: Number(metric.maxMs.toFixed(2)),
        status4xx: metric.status4xx,
        status5xx: metric.status5xx,
    }))
        .sort((a, b) => b.count - a.count);
}
function getPerformanceSnapshot(limit = 30) {
    return buildSnapshotFromCurrent().slice(0, Math.max(1, limit));
}
function getSloSnapshot() {
    let totalRequests = 0;
    let total4xx = 0;
    let total5xx = 0;
    const mergedSamples = [];
    for (const metric of endpointMetrics.values()) {
        totalRequests += metric.count;
        total4xx += metric.status4xx;
        total5xx += metric.status5xx;
        mergedSamples.push(...metric.samplesMs);
    }
    const errorRatePct = totalRequests === 0 ? 0 : (total5xx / totalRequests) * 100;
    const p95Ms = percentile(mergedSamples, 95);
    const latencyBreached = p95Ms > env_1.env.sloLatencyP95Ms;
    const errorRateBreached = errorRatePct > env_1.env.sloErrorRatePct;
    return {
        totalRequests,
        total4xx,
        total5xx,
        errorRatePct: Number(errorRatePct.toFixed(2)),
        p95Ms,
        p95ThresholdMs: env_1.env.sloLatencyP95Ms,
        errorRateThresholdPct: env_1.env.sloErrorRatePct,
        breached: {
            latencyP95: latencyBreached,
            errorRate: errorRateBreached,
        },
    };
}
function logPerformanceSummaryAndReset() {
    if (endpointMetrics.size === 0)
        return;
    const snapshot = buildSnapshotFromCurrent();
    const top = snapshot.slice(0, 10);
    const totalRequests = snapshot.reduce((acc, row) => acc + row.count, 0);
    const total5xx = snapshot.reduce((acc, row) => acc + row.status5xx, 0);
    (0, logger_1.logInfo)("perf_summary", {
        totalRequests,
        total5xx,
        endpoints: top,
    });
    endpointMetrics.clear();
}
//# sourceMappingURL=perf-metrics.js.map