import test from "node:test";
import assert from "node:assert/strict";
import { buildLivenessReport, buildReadinessReport } from "../health/service";

test("buildLivenessReport returns an ok status with timestamp metadata", () => {
  const report = buildLivenessReport(new Date("2026-03-27T00:00:00.000Z"));

  assert.equal(report.status, "ok");
  assert.equal(report.service, "gms-server");
  assert.equal(report.timestamp, "2026-03-27T00:00:00.000Z");
  assert.equal(typeof report.uptimeSec, "number");
});

test("buildReadinessReport stays ok when cache intentionally runs in fallback mode", () => {
  const report = buildReadinessReport(
    {
      database: {
        status: "up",
        ready: true,
        latencyMs: 4,
        detail: "PostgreSQL responded to SELECT 1.",
      },
      cache: {
        status: "fallback",
        configured: false,
        ready: true,
        mode: "memory_fallback",
        latencyMs: null,
        detail: "REDIS_URL is not configured; using in-memory cache fallback.",
      },
    },
    new Date("2026-03-27T00:00:00.000Z"),
  );

  assert.equal(report.status, "ok");
  assert.equal(report.dependencies.database.status, "up");
  assert.equal(report.dependencies.cache.status, "fallback");
});

test("buildReadinessReport degrades when a configured cache dependency is unavailable", () => {
  const report = buildReadinessReport(
    {
      database: {
        status: "up",
        ready: true,
        latencyMs: 3,
        detail: "PostgreSQL responded to SELECT 1.",
      },
      cache: {
        status: "down",
        configured: true,
        ready: false,
        mode: "memory_fallback",
        latencyMs: 18,
        detail: "Redis health check failed.",
      },
    },
    new Date("2026-03-27T00:00:00.000Z"),
  );

  assert.equal(report.status, "degraded");
  assert.equal(report.dependencies.cache.ready, false);
});
