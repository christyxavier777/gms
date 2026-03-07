import { logInfo } from "../utils/logger";
import { env } from "../config/env";

type EndpointAggregate = {
  count: number;
  totalMs: number;
  maxMs: number;
  status4xx: number;
  status5xx: number;
  samplesMs: number[];
};

type EndpointSnapshot = {
  endpoint: string;
  count: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  status4xx: number;
  status5xx: number;
};

type SloSnapshot = {
  totalRequests: number;
  total4xx: number;
  total5xx: number;
  errorRatePct: number;
  p95Ms: number;
  p95ThresholdMs: number;
  errorRateThresholdPct: number;
  breached: {
    latencyP95: boolean;
    errorRate: boolean;
  };
};

const SAMPLE_CAP = 512;
const endpointMetrics = new Map<string, EndpointAggregate>();

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  const safeIdx = Math.max(0, Math.min(sorted.length - 1, idx));
  const value = sorted[safeIdx] ?? sorted[sorted.length - 1] ?? 0;
  return Number(value.toFixed(2));
}

function normalizePath(path: string): string {
  const noQuery = path.split("?")[0] || path;
  return noQuery
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ":id")
    .replace(/\/\d+(\b|$)/g, "/:num");
}

export function buildEndpointKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

export function recordRequestMetric(endpoint: string, durationMs: number, statusCode: number): void {
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
  if (statusCode >= 400 && statusCode < 500) current.status4xx += 1;
  if (statusCode >= 500) current.status5xx += 1;
  current.samplesMs.push(durationMs);
  if (current.samplesMs.length > SAMPLE_CAP) {
    current.samplesMs.shift();
  }

  endpointMetrics.set(endpoint, current);
}

function buildSnapshotFromCurrent(): EndpointSnapshot[] {
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

export function getPerformanceSnapshot(limit = 30): EndpointSnapshot[] {
  return buildSnapshotFromCurrent().slice(0, Math.max(1, limit));
}

export function getSloSnapshot(): SloSnapshot {
  let totalRequests = 0;
  let total4xx = 0;
  let total5xx = 0;
  const mergedSamples: number[] = [];

  for (const metric of endpointMetrics.values()) {
    totalRequests += metric.count;
    total4xx += metric.status4xx;
    total5xx += metric.status5xx;
    mergedSamples.push(...metric.samplesMs);
  }

  const errorRatePct = totalRequests === 0 ? 0 : (total5xx / totalRequests) * 100;
  const p95Ms = percentile(mergedSamples, 95);
  const latencyBreached = p95Ms > env.sloLatencyP95Ms;
  const errorRateBreached = errorRatePct > env.sloErrorRatePct;

  return {
    totalRequests,
    total4xx,
    total5xx,
    errorRatePct: Number(errorRatePct.toFixed(2)),
    p95Ms,
    p95ThresholdMs: env.sloLatencyP95Ms,
    errorRateThresholdPct: env.sloErrorRatePct,
    breached: {
      latencyP95: latencyBreached,
      errorRate: errorRateBreached,
    },
  };
}

export function logPerformanceSummaryAndReset(): void {
  if (endpointMetrics.size === 0) return;

  const snapshot = buildSnapshotFromCurrent();
  const top = snapshot.slice(0, 10);
  const totalRequests = snapshot.reduce((acc, row) => acc + row.count, 0);
  const total5xx = snapshot.reduce((acc, row) => acc + row.status5xx, 0);

  logInfo("perf_summary", {
    totalRequests,
    total5xx,
    endpoints: top,
  });

  endpointMetrics.clear();
}
