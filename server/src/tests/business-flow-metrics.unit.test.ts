import test from "node:test";
import assert from "node:assert/strict";
import { PaymentStatus } from "@prisma/client";
import {
  getBusinessFlowSnapshot,
  recordMemberRegistration,
  recordOnboardingPaymentSubmitted,
  recordOnboardingSubscriptionCreated,
  recordPaymentReview,
  resetBusinessFlowMetrics,
} from "../observability/business-flow-metrics";

test("business flow snapshot aggregates onboarding funnel and payment review metrics", () => {
  resetBusinessFlowMetrics();

  recordMemberRegistration("member-1", new Date("2026-03-28T00:00:00.000Z"));
  recordOnboardingSubscriptionCreated(
    {
      memberUserId: "member-1",
      subscriptionId: "sub-1",
      planId: "basic-monthly",
    },
    new Date("2026-03-28T00:10:00.000Z"),
  );
  recordOnboardingPaymentSubmitted(
    {
      memberUserId: "member-1",
      paymentId: "pay-1",
      subscriptionId: "sub-1",
    },
    new Date("2026-03-28T00:20:00.000Z"),
  );
  recordPaymentReview(
    {
      reviewerUserId: "admin-1",
      memberUserId: "member-1",
      paymentId: "pay-1",
      status: PaymentStatus.SUCCESS,
    },
    new Date("2026-03-28T00:30:00.000Z"),
  );

  const snapshot = getBusinessFlowSnapshot(10);

  assert.equal(snapshot.onboarding.memberRegistrations, 1);
  assert.equal(snapshot.onboarding.subscriptionsCreated, 1);
  assert.equal(snapshot.onboarding.paymentsSubmitted, 1);
  assert.equal(snapshot.onboarding.registrationToSubscriptionPct, 100);
  assert.equal(snapshot.onboarding.subscriptionToPaymentPct, 100);
  assert.equal(snapshot.paymentReviews.totalReviewed, 1);
  assert.equal(snapshot.paymentReviews.approved, 1);
  assert.equal(snapshot.paymentReviews.rejected, 0);
  assert.equal(snapshot.paymentReviews.reopenedToPending, 0);
  assert.equal(snapshot.recentEvents.length, 4);
  assert.equal(snapshot.recentEvents[0]?.type, "payment_reviewed_success");
});

test("business flow snapshot limits recent events and tracks pending reviews separately", () => {
  resetBusinessFlowMetrics();

  recordPaymentReview(
    {
      reviewerUserId: "admin-1",
      memberUserId: "member-1",
      paymentId: "pay-1",
      status: PaymentStatus.FAILED,
    },
    new Date("2026-03-28T01:00:00.000Z"),
  );
  recordPaymentReview(
    {
      reviewerUserId: "admin-1",
      memberUserId: "member-2",
      paymentId: "pay-2",
      status: PaymentStatus.PENDING,
    },
    new Date("2026-03-28T01:10:00.000Z"),
  );

  const snapshot = getBusinessFlowSnapshot(1);

  assert.equal(snapshot.paymentReviews.totalReviewed, 2);
  assert.equal(snapshot.paymentReviews.rejected, 1);
  assert.equal(snapshot.paymentReviews.reopenedToPending, 1);
  assert.equal(snapshot.paymentReviews.lastReviewedAt, "2026-03-28T01:10:00.000Z");
  assert.equal(snapshot.recentEvents.length, 1);
  assert.equal(snapshot.recentEvents[0]?.type, "payment_reviewed_pending");
});
