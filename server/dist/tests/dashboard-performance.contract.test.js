"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const client_1 = require("@prisma/client");
const app_1 = require("../app");
const jwt_1 = require("../auth/jwt");
const cache_metrics_1 = require("../observability/cache-metrics");
const business_flow_metrics_1 = require("../observability/business-flow-metrics");
const perf_metrics_1 = require("../observability/perf-metrics");
async function startServer() {
    const app = (0, app_1.createApp)();
    const server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;
    return {
        server,
        baseUrl: `http://127.0.0.1:${port}`,
    };
}
(0, node_test_1.default)("admin performance endpoint rejects unauthenticated requests", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const response = await fetch(`${baseUrl}/dashboard/admin/performance`);
        strict_1.default.equal(response.status, 401);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("admin performance endpoint rejects non-admin authenticated requests", async () => {
    const { server, baseUrl } = await startServer();
    try {
        const memberToken = (0, jwt_1.issueAccessToken)({
            userId: "11111111-1111-1111-1111-111111111111",
            role: client_1.Role.MEMBER,
        });
        const response = await fetch(`${baseUrl}/dashboard/admin/performance`, {
            headers: { Authorization: `Bearer ${memberToken}` },
        });
        strict_1.default.equal(response.status, 403);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
(0, node_test_1.default)("admin performance endpoint returns observability contract payload", async () => {
    const { server, baseUrl } = await startServer();
    try {
        (0, business_flow_metrics_1.resetBusinessFlowMetrics)();
        (0, perf_metrics_1.recordRequestMetric)("GET /health", 50, 200);
        (0, perf_metrics_1.recordRequestMetric)("GET /health", 120, 500);
        (0, cache_metrics_1.recordDashboardCacheHit)();
        (0, cache_metrics_1.recordDashboardCacheSet)();
        (0, cache_metrics_1.recordDashboardCacheInvalidation)(2);
        (0, business_flow_metrics_1.recordMemberRegistration)("member-1", new Date("2026-03-28T00:00:00.000Z"));
        (0, business_flow_metrics_1.recordOnboardingSubscriptionCreated)({
            memberUserId: "member-1",
            subscriptionId: "sub-1",
            planId: "basic-monthly",
        }, new Date("2026-03-28T00:10:00.000Z"));
        (0, business_flow_metrics_1.recordOnboardingPaymentSubmitted)({
            memberUserId: "member-1",
            paymentId: "pay-1",
            subscriptionId: "sub-1",
        }, new Date("2026-03-28T00:20:00.000Z"));
        (0, business_flow_metrics_1.recordPaymentReview)({
            reviewerUserId: "admin-1",
            memberUserId: "member-1",
            paymentId: "pay-1",
            status: "SUCCESS",
        }, new Date("2026-03-28T00:30:00.000Z"));
        const adminToken = (0, jwt_1.issueAccessToken)({
            userId: "00000000-0000-0000-0000-000000000000",
            role: client_1.Role.ADMIN,
        });
        const response = await fetch(`${baseUrl}/dashboard/admin/performance?limit=1`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        strict_1.default.equal(response.status, 200);
        const body = (await response.json());
        strict_1.default.ok(Array.isArray(body.metrics));
        strict_1.default.equal(body.metrics.length, 1);
        strict_1.default.equal(typeof body.metrics[0]?.endpoint, "string");
        strict_1.default.equal(typeof body.slo.totalRequests, "number");
        strict_1.default.equal(typeof body.slo.p95Ms, "number");
        strict_1.default.equal(typeof body.slo.breached.errorRate, "boolean");
        strict_1.default.equal(typeof body.cache.dashboardHits, "number");
        strict_1.default.equal(typeof body.cache.dashboardHitRatePct, "number");
        strict_1.default.equal(body.flows.onboarding.memberRegistrations, 1);
        strict_1.default.equal(body.flows.onboarding.subscriptionsCreated, 1);
        strict_1.default.equal(body.flows.onboarding.paymentsSubmitted, 1);
        strict_1.default.equal(body.flows.paymentReviews.totalReviewed, 1);
        strict_1.default.equal(body.flows.paymentReviews.approved, 1);
        strict_1.default.ok(Array.isArray(body.flows.recentEvents));
        strict_1.default.equal(typeof body.flows.recentEvents[0]?.type, "string");
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
});
//# sourceMappingURL=dashboard-performance.contract.test.js.map