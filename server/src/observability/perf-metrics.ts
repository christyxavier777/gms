import { logInfo } from "../utils/logger";

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
