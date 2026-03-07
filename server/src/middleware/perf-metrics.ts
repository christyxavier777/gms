import { NextFunction, Request, Response } from "express";
import { buildEndpointKey, recordRequestMetric } from "../observability/perf-metrics";

// Captures endpoint-level latency and status distributions.
export function performanceMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedNs = process.hrtime.bigint() - startedAt;
    const durationMs = Number(elapsedNs) / 1_000_000;
    const endpoint = buildEndpointKey(req.method, req.originalUrl || req.path);
    recordRequestMetric(endpoint, durationMs, res.statusCode);
  });

  next();
}

