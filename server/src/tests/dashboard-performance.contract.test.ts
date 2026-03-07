import test from "node:test";
import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import { Role } from "@prisma/client";
import { createApp } from "../app";
import { issueAccessToken } from "../auth/jwt";
import { recordDashboardCacheHit, recordDashboardCacheInvalidation, recordDashboardCacheSet } from "../observability/cache-metrics";
import { recordRequestMetric } from "../observability/perf-metrics";

async function startServer() {
  const app = createApp();
  const server = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

test("admin performance endpoint rejects unauthenticated requests", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const response = await fetch(`${baseUrl}/dashboard/admin/performance`);
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("admin performance endpoint rejects non-admin authenticated requests", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const memberToken = issueAccessToken({
      userId: "11111111-1111-1111-1111-111111111111",
      role: Role.MEMBER,
    });

    const response = await fetch(`${baseUrl}/dashboard/admin/performance`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    assert.equal(response.status, 403);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("admin performance endpoint returns observability contract payload", async () => {
  const { server, baseUrl } = await startServer();
  try {
    recordRequestMetric("GET /health", 50, 200);
    recordRequestMetric("GET /health", 120, 500);
    recordDashboardCacheHit();
    recordDashboardCacheSet();
    recordDashboardCacheInvalidation(2);

    const adminToken = issueAccessToken({
      userId: "00000000-0000-0000-0000-000000000000",
      role: Role.ADMIN,
    });

    const response = await fetch(`${baseUrl}/dashboard/admin/performance?limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      metrics: Array<{ endpoint: string; count: number; p95Ms: number; status5xx: number }>;
      slo: {
        totalRequests: number;
        total5xx: number;
        errorRatePct: number;
        p95Ms: number;
        p95ThresholdMs: number;
        errorRateThresholdPct: number;
        breached: { latencyP95: boolean; errorRate: boolean };
      };
      cache: {
        dashboardHits: number;
        dashboardMisses: number;
        dashboardSets: number;
        dashboardInvalidations: number;
        dashboardInvalidatedKeys: number;
        dashboardHitRatePct: number;
      };
    };

    assert.ok(Array.isArray(body.metrics));
    assert.equal(body.metrics.length, 1);
    assert.equal(typeof body.metrics[0]?.endpoint, "string");
    assert.equal(typeof body.slo.totalRequests, "number");
    assert.equal(typeof body.slo.p95Ms, "number");
    assert.equal(typeof body.slo.breached.errorRate, "boolean");
    assert.equal(typeof body.cache.dashboardHits, "number");
    assert.equal(typeof body.cache.dashboardHitRatePct, "number");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
