"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const client_1 = require("@prisma/client");
const business_flow_metrics_1 = require("../observability/business-flow-metrics");
(0, node_test_1.default)("business flow snapshot aggregates onboarding funnel and payment review metrics", () => {
    (0, business_flow_metrics_1.resetBusinessFlowMetrics)();
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
        status: client_1.PaymentStatus.SUCCESS,
    }, new Date("2026-03-28T00:30:00.000Z"));
    const snapshot = (0, business_flow_metrics_1.getBusinessFlowSnapshot)(10);
    strict_1.default.equal(snapshot.onboarding.memberRegistrations, 1);
    strict_1.default.equal(snapshot.onboarding.subscriptionsCreated, 1);
    strict_1.default.equal(snapshot.onboarding.paymentsSubmitted, 1);
    strict_1.default.equal(snapshot.onboarding.registrationToSubscriptionPct, 100);
    strict_1.default.equal(snapshot.onboarding.subscriptionToPaymentPct, 100);
    strict_1.default.equal(snapshot.paymentReviews.totalReviewed, 1);
    strict_1.default.equal(snapshot.paymentReviews.approved, 1);
    strict_1.default.equal(snapshot.paymentReviews.rejected, 0);
    strict_1.default.equal(snapshot.paymentReviews.reopenedToPending, 0);
    strict_1.default.equal(snapshot.recentEvents.length, 4);
    strict_1.default.equal(snapshot.recentEvents[0]?.type, "payment_reviewed_success");
});
(0, node_test_1.default)("business flow snapshot limits recent events and tracks pending reviews separately", () => {
    (0, business_flow_metrics_1.resetBusinessFlowMetrics)();
    (0, business_flow_metrics_1.recordPaymentReview)({
        reviewerUserId: "admin-1",
        memberUserId: "member-1",
        paymentId: "pay-1",
        status: client_1.PaymentStatus.FAILED,
    }, new Date("2026-03-28T01:00:00.000Z"));
    (0, business_flow_metrics_1.recordPaymentReview)({
        reviewerUserId: "admin-1",
        memberUserId: "member-2",
        paymentId: "pay-2",
        status: client_1.PaymentStatus.PENDING,
    }, new Date("2026-03-28T01:10:00.000Z"));
    const snapshot = (0, business_flow_metrics_1.getBusinessFlowSnapshot)(1);
    strict_1.default.equal(snapshot.paymentReviews.totalReviewed, 2);
    strict_1.default.equal(snapshot.paymentReviews.rejected, 1);
    strict_1.default.equal(snapshot.paymentReviews.reopenedToPending, 1);
    strict_1.default.equal(snapshot.paymentReviews.lastReviewedAt, "2026-03-28T01:10:00.000Z");
    strict_1.default.equal(snapshot.recentEvents.length, 1);
    strict_1.default.equal(snapshot.recentEvents[0]?.type, "payment_reviewed_pending");
});
//# sourceMappingURL=business-flow-metrics.unit.test.js.map