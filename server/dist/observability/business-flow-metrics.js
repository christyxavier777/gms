"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMemberRegistration = recordMemberRegistration;
exports.recordOnboardingSubscriptionCreated = recordOnboardingSubscriptionCreated;
exports.recordOnboardingPaymentSubmitted = recordOnboardingPaymentSubmitted;
exports.recordPaymentReview = recordPaymentReview;
exports.getBusinessFlowSnapshot = getBusinessFlowSnapshot;
exports.resetBusinessFlowMetrics = resetBusinessFlowMetrics;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const EVENT_SAMPLE_CAP = 100;
const counters = new Map();
const recentEvents = [];
function updateCounter(type, occurredAt) {
    const current = counters.get(type) ?? { count: 0, lastOccurredAt: null };
    current.count += 1;
    current.lastOccurredAt = occurredAt;
    counters.set(type, current);
}
function pushEvent(event) {
    recentEvents.unshift(event);
    if (recentEvents.length > EVENT_SAMPLE_CAP) {
        recentEvents.pop();
    }
    updateCounter(event.type, event.occurredAt);
    (0, logger_1.logInfo)("business_flow_event", event);
}
function getCounter(type) {
    return counters.get(type) ?? { count: 0, lastOccurredAt: null };
}
function ratio(part, whole) {
    if (whole <= 0)
        return 0;
    return Number(((part / whole) * 100).toFixed(2));
}
function latestTimestamp(...values) {
    const filtered = values.filter((value) => Boolean(value));
    if (filtered.length === 0) {
        return null;
    }
    return filtered.sort((left, right) => right.localeCompare(left))[0] ?? null;
}
function recordMemberRegistration(userId, occurredAt = new Date()) {
    pushEvent({
        type: "member_registered",
        occurredAt: occurredAt.toISOString(),
        actorUserId: userId,
        memberUserId: userId,
        subscriptionId: null,
        paymentId: null,
        metadata: {},
    });
}
function recordOnboardingSubscriptionCreated(params, occurredAt = new Date()) {
    pushEvent({
        type: "onboarding_subscription_created",
        occurredAt: occurredAt.toISOString(),
        actorUserId: params.memberUserId,
        memberUserId: params.memberUserId,
        subscriptionId: params.subscriptionId,
        paymentId: null,
        metadata: {
            planId: params.planId,
        },
    });
}
function recordOnboardingPaymentSubmitted(params, occurredAt = new Date()) {
    pushEvent({
        type: "onboarding_payment_submitted",
        occurredAt: occurredAt.toISOString(),
        actorUserId: params.memberUserId,
        memberUserId: params.memberUserId,
        subscriptionId: params.subscriptionId,
        paymentId: params.paymentId,
        metadata: {},
    });
}
function paymentReviewEventType(status) {
    if (status === client_1.PaymentStatus.SUCCESS)
        return "payment_reviewed_success";
    if (status === client_1.PaymentStatus.FAILED)
        return "payment_reviewed_failed";
    return "payment_reviewed_pending";
}
function recordPaymentReview(params, occurredAt = new Date()) {
    pushEvent({
        type: paymentReviewEventType(params.status),
        occurredAt: occurredAt.toISOString(),
        actorUserId: params.reviewerUserId,
        memberUserId: params.memberUserId,
        subscriptionId: null,
        paymentId: params.paymentId,
        metadata: {
            status: params.status,
        },
    });
}
function getBusinessFlowSnapshot(limit = 10) {
    const registrations = getCounter("member_registered");
    const subscriptions = getCounter("onboarding_subscription_created");
    const onboardingPayments = getCounter("onboarding_payment_submitted");
    const approved = getCounter("payment_reviewed_success");
    const rejected = getCounter("payment_reviewed_failed");
    const reopened = getCounter("payment_reviewed_pending");
    return {
        onboarding: {
            memberRegistrations: registrations.count,
            subscriptionsCreated: subscriptions.count,
            paymentsSubmitted: onboardingPayments.count,
            registrationToSubscriptionPct: ratio(subscriptions.count, registrations.count),
            registrationToPaymentPct: ratio(onboardingPayments.count, registrations.count),
            subscriptionToPaymentPct: ratio(onboardingPayments.count, subscriptions.count),
            lastRegistrationAt: registrations.lastOccurredAt,
            lastSubscriptionCreatedAt: subscriptions.lastOccurredAt,
            lastPaymentSubmittedAt: onboardingPayments.lastOccurredAt,
        },
        paymentReviews: {
            totalReviewed: approved.count + rejected.count + reopened.count,
            approved: approved.count,
            rejected: rejected.count,
            reopenedToPending: reopened.count,
            lastReviewedAt: latestTimestamp(reopened.lastOccurredAt, approved.lastOccurredAt, rejected.lastOccurredAt),
        },
        recentEvents: recentEvents.slice(0, Math.max(1, limit)),
    };
}
function resetBusinessFlowMetrics() {
    counters.clear();
    recentEvents.length = 0;
}
//# sourceMappingURL=business-flow-metrics.js.map