import { PaymentStatus } from "@prisma/client";
import { logInfo } from "../utils/logger";

type BusinessFlowEventType =
  | "member_registered"
  | "onboarding_subscription_created"
  | "onboarding_payment_submitted"
  | "payment_reviewed_success"
  | "payment_reviewed_failed"
  | "payment_reviewed_pending";

type BusinessFlowEvent = {
  type: BusinessFlowEventType;
  occurredAt: string;
  actorUserId: string | null;
  memberUserId: string | null;
  subscriptionId: string | null;
  paymentId: string | null;
  metadata: Record<string, string>;
};

type FlowCounterState = {
  count: number;
  lastOccurredAt: string | null;
};

type BusinessFlowSnapshot = {
  onboarding: {
    memberRegistrations: number;
    subscriptionsCreated: number;
    paymentsSubmitted: number;
    registrationToSubscriptionPct: number;
    registrationToPaymentPct: number;
    subscriptionToPaymentPct: number;
    lastRegistrationAt: string | null;
    lastSubscriptionCreatedAt: string | null;
    lastPaymentSubmittedAt: string | null;
  };
  paymentReviews: {
    totalReviewed: number;
    approved: number;
    rejected: number;
    reopenedToPending: number;
    lastReviewedAt: string | null;
  };
  recentEvents: BusinessFlowEvent[];
};

const EVENT_SAMPLE_CAP = 100;
const counters = new Map<BusinessFlowEventType, FlowCounterState>();
const recentEvents: BusinessFlowEvent[] = [];

function updateCounter(type: BusinessFlowEventType, occurredAt: string): void {
  const current = counters.get(type) ?? { count: 0, lastOccurredAt: null };
  current.count += 1;
  current.lastOccurredAt = occurredAt;
  counters.set(type, current);
}

function pushEvent(event: BusinessFlowEvent): void {
  recentEvents.unshift(event);
  if (recentEvents.length > EVENT_SAMPLE_CAP) {
    recentEvents.pop();
  }

  updateCounter(event.type, event.occurredAt);
  logInfo("business_flow_event", event);
}

function getCounter(type: BusinessFlowEventType): FlowCounterState {
  return counters.get(type) ?? { count: 0, lastOccurredAt: null };
}

function ratio(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Number(((part / whole) * 100).toFixed(2));
}

function latestTimestamp(...values: Array<string | null>): string | null {
  const filtered = values.filter((value): value is string => Boolean(value));
  if (filtered.length === 0) {
    return null;
  }

  return filtered.sort((left, right) => right.localeCompare(left))[0] ?? null;
}

export function recordMemberRegistration(userId: string, occurredAt = new Date()): void {
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

export function recordOnboardingSubscriptionCreated(
  params: { memberUserId: string; subscriptionId: string; planId: string },
  occurredAt = new Date(),
): void {
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

export function recordOnboardingPaymentSubmitted(
  params: { memberUserId: string; paymentId: string; subscriptionId: string | null },
  occurredAt = new Date(),
): void {
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

function paymentReviewEventType(status: PaymentStatus): BusinessFlowEventType {
  if (status === PaymentStatus.SUCCESS) return "payment_reviewed_success";
  if (status === PaymentStatus.FAILED) return "payment_reviewed_failed";
  return "payment_reviewed_pending";
}

export function recordPaymentReview(
  params: { reviewerUserId: string; memberUserId: string; paymentId: string; status: PaymentStatus },
  occurredAt = new Date(),
): void {
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

export function getBusinessFlowSnapshot(limit = 10): BusinessFlowSnapshot {
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
      lastReviewedAt: latestTimestamp(
        reopened.lastOccurredAt,
        approved.lastOccurredAt,
        rejected.lastOccurredAt,
      ),
    },
    recentEvents: recentEvents.slice(0, Math.max(1, limit)),
  };
}

export function resetBusinessFlowMetrics(): void {
  counters.clear();
  recentEvents.length = 0;
}
