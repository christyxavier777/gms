"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMetricsMiddleware = performanceMetricsMiddleware;
const perf_metrics_1 = require("../observability/perf-metrics");
// Captures endpoint-level latency and status distributions.
function performanceMetricsMiddleware(req, res, next) {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
        const elapsedNs = process.hrtime.bigint() - startedAt;
        const durationMs = Number(elapsedNs) / 1_000_000;
        const endpoint = (0, perf_metrics_1.buildEndpointKey)(req.method, req.originalUrl || req.path);
        (0, perf_metrics_1.recordRequestMetric)(endpoint, durationMs, res.statusCode);
    });
    next();
}
//# sourceMappingURL=perf-metrics.js.map