"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const service_1 = require("../health/service");
(0, node_test_1.default)("buildLivenessReport returns an ok status with timestamp metadata", () => {
    const report = (0, service_1.buildLivenessReport)(new Date("2026-03-27T00:00:00.000Z"));
    strict_1.default.equal(report.status, "ok");
    strict_1.default.equal(report.service, "gms-server");
    strict_1.default.equal(report.timestamp, "2026-03-27T00:00:00.000Z");
    strict_1.default.equal(typeof report.uptimeSec, "number");
});
(0, node_test_1.default)("buildReadinessReport stays ok when cache intentionally runs in fallback mode", () => {
    const report = (0, service_1.buildReadinessReport)({
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
    }, new Date("2026-03-27T00:00:00.000Z"));
    strict_1.default.equal(report.status, "ok");
    strict_1.default.equal(report.dependencies.database.status, "up");
    strict_1.default.equal(report.dependencies.cache.status, "fallback");
});
(0, node_test_1.default)("buildReadinessReport degrades when a configured cache dependency is unavailable", () => {
    const report = (0, service_1.buildReadinessReport)({
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
    }, new Date("2026-03-27T00:00:00.000Z"));
    strict_1.default.equal(report.status, "degraded");
    strict_1.default.equal(report.dependencies.cache.ready, false);
});
//# sourceMappingURL=health.unit.test.js.map