import crypto from "node:crypto";
import { PaymentStatus, Prisma, Role, SubscriptionStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { env } from "../config/env";
import { fromMinorUnits, generatePaymentTransactionId, toMinorUnits } from "./money";
import { PaymentListSummary, SafePayment } from "./types";
import { createPaginationMeta, SortOrder } from "../utils/list-response";
import { invalidateDashboardCache } from "../dashboard/cache";
import {
  addUtcDays,
  buildSubscriptionPeriod,
  getEffectiveSubscriptionStatus,
  todayUtc,
} from "../subscriptions/lifecycle";
import {
  recordOnboardingPaymentSubmitted,
  recordPaymentReview,
} from "../observability/business-flow-metrics";

const prisma = createPrismaClient();

const paymentDetailInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
    },
  },
  subscription: {
    select: {
      id: true,
      planId: true,
      status: true,
      startDate: true,
      endDate: true,
      plan: {
        select: {
          id: true,
          name: true,
          priceMinor: true,
          durationDays: true,
          perks: true,
          active: true,
        },
      },
    },
  },
  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  events: {
    orderBy: [{ createdAt: "desc" }],
    include: {
      changedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentInclude;

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: typeof paymentDetailInclude;
}>;

type PaymentSummaryGroup = {
  status: PaymentStatus;
  _count: { _all?: number | null } | true | undefined;
  _sum: { amountMinor?: number | null } | null | undefined;
};

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
};

type RazorpayPaymentResponse = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
};

type SubscriptionActivationCandidate = {
  id: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  plan: {
    durationDays: number;
  };
};

function assertRazorpayConfigured(): void {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new HttpError(
      503,
      "RAZORPAY_NOT_CONFIGURED",
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }
}

function createRazorpayBasicAuthHeader(): string {
  return `Basic ${Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString("base64")}`;
}

async function createRazorpayOrder(input: {
  receipt: string;
  amountMinor: number;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  assertRazorpayConfigured();

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: createRazorpayBasicAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: "INR",
      receipt: input.receipt,
      payment_capture: 1,
      notes: input.notes ?? {},
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new HttpError(
      502,
      "RAZORPAY_ORDER_CREATE_FAILED",
      "Could not create the Razorpay order.",
      payload,
    );
  }

  return (await response.json()) as RazorpayOrderResponse;
}

async function getRazorpayPayment(razorpayPaymentId: string): Promise<RazorpayPaymentResponse> {
  assertRazorpayConfigured();

  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpayPaymentId)}`, {
    method: "GET",
    headers: {
      Authorization: createRazorpayBasicAuthHeader(),
    },
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new HttpError(
      502,
      "RAZORPAY_PAYMENT_FETCH_FAILED",
      "Could not fetch the Razorpay payment.",
      payload,
    );
  }

  return (await response.json()) as RazorpayPaymentResponse;
}

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  assertRazorpayConfigured();
  const expected = crypto
    .createHmac("sha256", env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function toSafePayment(payment: PaymentWithRelations): SafePayment {
  return {
    id: payment.id,
    transactionId: payment.transactionId,
    userId: payment.userId,
    subscriptionId: payment.subscriptionId,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    amount: fromMinorUnits(payment.amountMinor),
    amountMinor: payment.amountMinor,
    upiId: payment.upiId,
    proofReference: payment.proofReference,
    status: payment.status,
    reviewedAt: payment.reviewedAt,
    verificationNotes: payment.verificationNotes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    member: {
      id: payment.user.id,
      name: payment.user.name,
      email: payment.user.email,
      phone: payment.user.phone,
      status: payment.user.status,
    },
    subscription: payment.subscription
      ? {
          id: payment.subscription.id,
          planId: payment.subscription.planId,
          planName: payment.subscription.plan.name,
          status: getEffectiveSubscriptionStatus(
            payment.subscription.status,
            payment.subscription.endDate,
          ),
          startDate: payment.subscription.startDate,
          endDate: payment.subscription.endDate,
          plan: {
            id: payment.subscription.plan.id,
            name: payment.subscription.plan.name,
            priceMinor: payment.subscription.plan.priceMinor,
            priceInr: fromMinorUnits(payment.subscription.plan.priceMinor),
            durationDays: payment.subscription.plan.durationDays,
            perks: payment.subscription.plan.perks,
            active: payment.subscription.plan.active,
          },
        }
      : null,
    reviewer: payment.reviewedBy
      ? {
          id: payment.reviewedBy.id,
          name: payment.reviewedBy.name,
          email: payment.reviewedBy.email,
        }
      : null,
    events: payment.events.map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      verificationNotes: event.verificationNotes,
      createdAt: event.createdAt,
      actor: event.changedBy
        ? {
            id: event.changedBy.id,
            name: event.changedBy.name,
            email: event.changedBy.email,
          }
        : null,
    })),
  };
}

async function resolveNextMemberSubscriptionPeriod(
  tx: Prisma.TransactionClient,
  userId: string,
  durationDays: number,
): Promise<{ startDate: Date; endDate: Date }> {
  const latestSubscription = await tx.subscription.findFirst({
    where: {
      userId,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.CANCELLED_AT_PERIOD_END,
          SubscriptionStatus.PENDING_ACTIVATION,
        ],
      },
    },
    orderBy: [{ endDate: "desc" }, { createdAt: "desc" }],
    select: {
      endDate: true,
    },
  });

  if (!latestSubscription) {
    return buildSubscriptionPeriod(durationDays, new Date());
  }

  return buildSubscriptionPeriod(durationDays, addUtcDays(latestSubscription.endDate, 1));
}

function shouldActivatePendingSubscriptionNow(
  subscription: Pick<SubscriptionActivationCandidate, "status" | "startDate">,
  at = new Date(),
): boolean {
  return (
    subscription.status === SubscriptionStatus.PENDING_ACTIVATION &&
    subscription.startDate <= todayUtc(at)
  );
}

function getActivationPeriodForPendingSubscription(
  subscription: Pick<SubscriptionActivationCandidate, "startDate" | "endDate" | "plan">,
  at = new Date(),
): { startDate: Date; endDate: Date } {
  if (subscription.startDate > todayUtc(at)) {
    return {
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    };
  }

  return buildSubscriptionPeriod(subscription.plan.durationDays, at);
}

export async function createPayment(
  requester: { userId: string; role: Role },
  payload: {
    userId: string;
    subscriptionId?: string | undefined;
    planId?: string | undefined;
    amount: number;
    upiId: string;
    proofReference?: string | undefined;
  },
): Promise<SafePayment> {
  if (requester.role !== Role.ADMIN && requester.userId !== payload.userId) {
    throw new HttpError(
      403,
      "PAYMENT_CREATE_FORBIDDEN",
      "You are not allowed to create payments for this user",
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_PAYMENT_USER", "Payments can only be recorded for members");
  }

  const amountMinor = toMinorUnits(payload.amount);
  const proofReference = payload.proofReference?.trim() || null;
  const isSelfServiceMemberPayment =
    requester.role === Role.MEMBER && requester.userId === payload.userId;

  const payment = await prisma.$transaction(async (tx) => {
    let linkedSubscriptionId = payload.subscriptionId ?? null;
    let activateLinkedSubscription = false;

    if (payload.subscriptionId) {
      const subscription = await tx.subscription.findUnique({
        where: { id: payload.subscriptionId },
        select: {
          id: true,
          userId: true,
          status: true,
          plan: {
            select: {
              durationDays: true,
            },
          },
        },
      });

      if (!subscription || subscription.userId !== payload.userId) {
        throw new HttpError(400, "INVALID_SUBSCRIPTION", "Subscription is invalid for this member");
      }

      activateLinkedSubscription =
        isSelfServiceMemberPayment && subscription.status === SubscriptionStatus.PENDING_ACTIVATION;

      linkedSubscriptionId = subscription.id;
    }

    if (!linkedSubscriptionId && payload.planId) {
      const plan = await tx.membershipPlan.findUnique({
        where: { id: payload.planId },
        select: {
          id: true,
          name: true,
          active: true,
          durationDays: true,
        },
      });

      if (!plan) {
        throw new HttpError(400, "INVALID_PLAN_ID", "Selected plan is not available");
      }

      if (!plan.active) {
        throw new HttpError(400, "PLAN_INACTIVE", "Selected plan is not currently available");
      }

      const nextPeriod = await resolveNextMemberSubscriptionPeriod(
        tx,
        payload.userId,
        plan.durationDays,
      );
      const activateImmediately =
        isSelfServiceMemberPayment && nextPeriod.startDate <= todayUtc();

      const createdSubscription = await tx.subscription.create({
        data: {
          userId: payload.userId,
          planId: plan.id,
          planName: plan.name,
          startDate: nextPeriod.startDate,
          endDate: nextPeriod.endDate,
          status: activateImmediately ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING_ACTIVATION,
        },
        select: { id: true },
      });

      linkedSubscriptionId = createdSubscription.id;
    }

    const initialStatus = isSelfServiceMemberPayment ? PaymentStatus.SUCCESS : PaymentStatus.PENDING;
    const reviewTimestamp = isSelfServiceMemberPayment ? new Date() : null;

    const createdPayment = await tx.payment.create({
      data: {
        transactionId: generatePaymentTransactionId(),
        userId: payload.userId,
        subscriptionId: linkedSubscriptionId,
        amountMinor,
        upiId: payload.upiId,
        proofReference,
        status: initialStatus,
        reviewedAt: reviewTimestamp,
        verificationNotes: isSelfServiceMemberPayment ? "Auto-verified member payment" : null,
        events: {
          create: {
            fromStatus: null,
            toStatus: initialStatus,
            changedById: requester.userId,
            verificationNotes: isSelfServiceMemberPayment ? "Auto-verified member payment" : null,
          },
        },
      },
      include: paymentDetailInclude,
    });

    if (activateLinkedSubscription && linkedSubscriptionId) {
      const linkedSubscription = await tx.subscription.findUnique({
        where: { id: linkedSubscriptionId },
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          plan: {
            select: {
              durationDays: true,
            },
          },
        },
      });

      if (linkedSubscription && shouldActivatePendingSubscriptionNow(linkedSubscription)) {
        const nextPeriod = getActivationPeriodForPendingSubscription(linkedSubscription, new Date());
        await tx.subscription.update({
          where: { id: linkedSubscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            startDate: nextPeriod.startDate,
            endDate: nextPeriod.endDate,
          },
          select: { id: true },
        });
      }
    }

    const refreshedPayment = await tx.payment.findUnique({
      where: { id: createdPayment.id },
      include: paymentDetailInclude,
    });

    if (!refreshedPayment) {
      throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }

    return refreshedPayment;
  });

  if (
    requester.role === Role.MEMBER &&
    requester.userId === payload.userId &&
    payment.subscriptionId
  ) {
    recordOnboardingPaymentSubmitted({
      memberUserId: payload.userId,
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
    });
  }

  if (isSelfServiceMemberPayment && payment.subscriptionId) {
    await invalidateDashboardCache("subscription_activated_from_member_payment");
  }

  return toSafePayment(payment);
}

export async function createRazorpayCheckoutOrder(
  requester: { userId: string; role: Role; name?: string | null; email?: string | null; phone?: string | null },
  payload: {
    subscriptionId?: string | undefined;
    planId?: string | undefined;
  },
): Promise<{
  payment: SafePayment;
  checkout: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: "INR";
    name: string;
    description: string;
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
  };
}> {
  if (requester.role !== Role.MEMBER) {
    throw new HttpError(403, "RAZORPAY_CHECKOUT_FORBIDDEN", "Only members can start Razorpay checkout");
  }

  assertRazorpayConfigured();

  const user = await prisma.user.findUnique({
    where: { id: requester.userId },
    select: { id: true, role: true, name: true, email: true, phone: true },
  });

  if (!user || user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_PAYMENT_USER", "Payments can only be recorded for members");
  }

  const result = await prisma.$transaction(async (tx) => {
    let subscriptionId = payload.subscriptionId ?? null;
    let planName = "";
    let amountMinor = 0;

    if (payload.subscriptionId) {
      const subscription = await tx.subscription.findUnique({
        where: { id: payload.subscriptionId },
        select: {
          id: true,
          userId: true,
          status: true,
          plan: {
            select: {
              name: true,
              priceMinor: true,
            },
          },
        },
      });

      if (!subscription || subscription.userId !== requester.userId) {
        throw new HttpError(400, "INVALID_SUBSCRIPTION", "Subscription is invalid for this member");
      }

      if (subscription.status !== SubscriptionStatus.PENDING_ACTIVATION) {
        throw new HttpError(
          409,
          "SUBSCRIPTION_NOT_PAYABLE",
          "Only pending-activation subscriptions can be paid through checkout.",
        );
      }

      subscriptionId = subscription.id;
      planName = subscription.plan.name;
      amountMinor = subscription.plan.priceMinor;
    } else if (payload.planId) {
      const plan = await tx.membershipPlan.findUnique({
        where: { id: payload.planId },
        select: {
          id: true,
          name: true,
          active: true,
          priceMinor: true,
          durationDays: true,
        },
      });

      if (!plan) {
        throw new HttpError(400, "INVALID_PLAN_ID", "Selected plan is not available");
      }

      if (!plan.active) {
        throw new HttpError(400, "PLAN_INACTIVE", "Selected plan is not currently available");
      }

      const nextPeriod = await resolveNextMemberSubscriptionPeriod(
        tx,
        requester.userId,
        plan.durationDays,
      );

      const createdSubscription = await tx.subscription.create({
        data: {
          userId: requester.userId,
          planId: plan.id,
          planName: plan.name,
          startDate: nextPeriod.startDate,
          endDate: nextPeriod.endDate,
          status: SubscriptionStatus.PENDING_ACTIVATION,
        },
        select: { id: true },
      });

      subscriptionId = createdSubscription.id;
      planName = plan.name;
      amountMinor = plan.priceMinor;
    } else {
      throw new HttpError(400, "RAZORPAY_PLAN_REQUIRED", "A plan or pending subscription is required.");
    }

    const transactionId = generatePaymentTransactionId();
    const razorpayOrder = await createRazorpayOrder({
      receipt: transactionId,
      amountMinor,
      notes: {
        memberUserId: requester.userId,
        subscriptionId: subscriptionId ?? "",
        planName,
      },
    });

    const payment = await tx.payment.create({
      data: {
        transactionId,
        userId: requester.userId,
        subscriptionId,
        razorpayOrderId: razorpayOrder.id,
        amountMinor,
        upiId: "RAZORPAY_CHECKOUT",
        status: PaymentStatus.PENDING,
        verificationNotes: "Awaiting Razorpay checkout completion",
        events: {
          create: {
            fromStatus: null,
            toStatus: PaymentStatus.PENDING,
            changedById: requester.userId,
            verificationNotes: "Awaiting Razorpay checkout completion",
          },
        },
      },
      include: paymentDetailInclude,
    });

    return {
      payment,
      razorpayOrder,
    };
  });

  return {
    payment: toSafePayment(result.payment),
    checkout: {
      keyId: env.razorpay.keyId,
      orderId: result.razorpayOrder.id,
      amount: result.razorpayOrder.amount,
      currency: "INR",
      name: "Gym Management System",
      description: result.payment.subscription?.plan.name || "Membership Payment",
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone,
      },
    },
  };
}

export async function verifyRazorpayCheckoutPayment(
  requester: { userId: string; role: Role },
  payload: {
    paymentId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  },
): Promise<SafePayment> {
  if (requester.role !== Role.MEMBER) {
    throw new HttpError(403, "RAZORPAY_VERIFY_FORBIDDEN", "Only members can verify Razorpay checkout payments");
  }

  assertRazorpayConfigured();

  const payment = await prisma.payment.findUnique({
    where: { id: payload.paymentId },
    include: paymentDetailInclude,
  });

  if (!payment || payment.userId !== requester.userId) {
    throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  if (!payment.razorpayOrderId) {
    throw new HttpError(409, "RAZORPAY_ORDER_MISSING", "This payment is not linked to a Razorpay order");
  }

  if (payment.status === PaymentStatus.SUCCESS && payment.razorpayPaymentId === payload.razorpayPaymentId) {
    return toSafePayment(payment);
  }

  if (payment.razorpayOrderId !== payload.razorpayOrderId) {
    throw new HttpError(400, "RAZORPAY_ORDER_MISMATCH", "Razorpay order does not match this payment");
  }

  if (!verifyRazorpaySignature(payload.razorpayOrderId, payload.razorpayPaymentId, payload.razorpaySignature)) {
    throw new HttpError(400, "RAZORPAY_SIGNATURE_INVALID", "Razorpay payment signature is invalid");
  }

  const razorpayPayment = await getRazorpayPayment(payload.razorpayPaymentId);
  if (razorpayPayment.order_id !== payload.razorpayOrderId) {
    throw new HttpError(400, "RAZORPAY_PAYMENT_MISMATCH", "Razorpay payment does not belong to the expected order");
  }
  if (razorpayPayment.amount !== payment.amountMinor || razorpayPayment.currency !== "INR") {
    throw new HttpError(400, "RAZORPAY_PAYMENT_AMOUNT_MISMATCH", "Razorpay payment amount does not match");
  }
  if (!["authorized", "captured"].includes(razorpayPayment.status)) {
    throw new HttpError(409, "RAZORPAY_PAYMENT_NOT_SETTLED", "Razorpay payment is not completed yet");
  }

  let activatedPendingSubscription = false;
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({
      where: { id: payload.paymentId },
      select: { id: true, status: true, subscriptionId: true },
    });

    if (!current) {
      throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }

    const reviewedAt = new Date();

    await tx.payment.update({
      where: { id: payload.paymentId },
      data: {
        status: PaymentStatus.SUCCESS,
        reviewedAt,
        verificationNotes: "Verified via Razorpay Checkout",
        razorpayPaymentId: payload.razorpayPaymentId,
        razorpaySignature: payload.razorpaySignature,
      },
      select: { id: true },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payload.paymentId,
        fromStatus: current.status,
        toStatus: PaymentStatus.SUCCESS,
        changedById: null,
        verificationNotes: "Verified via Razorpay Checkout",
      },
    });

    if (current.subscriptionId) {
      const linkedSubscription = await tx.subscription.findUnique({
        where: { id: current.subscriptionId },
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          plan: {
            select: {
              durationDays: true,
            },
          },
        },
      });

      if (linkedSubscription && shouldActivatePendingSubscriptionNow(linkedSubscription, reviewedAt)) {
        const nextPeriod = getActivationPeriodForPendingSubscription(linkedSubscription, reviewedAt);
        await tx.subscription.update({
          where: { id: linkedSubscription.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            startDate: nextPeriod.startDate,
            endDate: nextPeriod.endDate,
          },
          select: { id: true },
        });
        activatedPendingSubscription = true;
      }
    }

    const refreshedPayment = await tx.payment.findUnique({
      where: { id: payload.paymentId },
      include: paymentDetailInclude,
    });

    if (!refreshedPayment) {
      throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }

    return refreshedPayment;
  });

  if (updated.subscriptionId) {
    recordOnboardingPaymentSubmitted({
      memberUserId: requester.userId,
      paymentId: updated.id,
      subscriptionId: updated.subscriptionId,
    });
  }

  if (activatedPendingSubscription) {
    await invalidateDashboardCache("subscription_activated_from_razorpay_checkout");
  }

  return toSafePayment(updated);
}

function buildPaymentWhere(clauses: Prisma.PaymentWhereInput[]): Prisma.PaymentWhereInput {
  const nonEmptyClauses = clauses.filter((clause) => Object.keys(clause).length > 0);

  if (nonEmptyClauses.length === 0) {
    return {};
  }

  return { AND: nonEmptyClauses };
}

function summarizePayments(groups: PaymentSummaryGroup[]): PaymentListSummary {
  const summary: PaymentListSummary = {
    total: 0,
    pending: 0,
    success: 0,
    failed: 0,
    verifiedRevenueMinor: 0,
  };

  for (const group of groups) {
    const count = group._count && group._count !== true ? group._count._all ?? 0 : 0;
    summary.total += count;

    if (group.status === PaymentStatus.PENDING) {
      summary.pending = count;
      continue;
    }

    if (group.status === PaymentStatus.SUCCESS) {
      summary.success = count;
      summary.verifiedRevenueMinor = group._sum?.amountMinor ?? 0;
      continue;
    }

    if (group.status === PaymentStatus.FAILED) {
      summary.failed = count;
    }
  }

  return summary;
}

export async function listPayments(
  requester: { userId: string; role: Role },
  query: {
    page: number;
    pageSize: number;
    search: string;
    status?: PaymentStatus | undefined;
    sortBy: "createdAt" | "updatedAt" | "amountMinor";
    sortOrder: SortOrder;
  },
): Promise<{
  payments: SafePayment[];
  pagination: ReturnType<typeof createPaginationMeta>;
  filters: {
    search: string;
    status: PaymentStatus | null;
  };
  sort: {
    sortBy: "createdAt" | "updatedAt" | "amountMinor";
    sortOrder: SortOrder;
  };
  summary: PaymentListSummary;
}> {
  const search = query.search.trim();
  const scopeWhere: Prisma.PaymentWhereInput =
    requester.role === Role.ADMIN ? {} : { userId: requester.userId };
  const searchWhere: Prisma.PaymentWhereInput =
    search.length > 0
      ? {
          OR: [
            { transactionId: { contains: search, mode: "insensitive" } },
            { razorpayOrderId: { contains: search, mode: "insensitive" } },
            { razorpayPaymentId: { contains: search, mode: "insensitive" } },
            { upiId: { contains: search, mode: "insensitive" } },
            { proofReference: { contains: search, mode: "insensitive" } },
            { verificationNotes: { contains: search, mode: "insensitive" } },
            {
              user: {
                is: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              reviewedBy: {
                is: {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                  ],
                },
              },
            },
            {
              subscription: {
                is: {
                  OR: [
                    { planName: { contains: search, mode: "insensitive" } },
                    {
                      plan: {
                        is: {
                          name: { contains: search, mode: "insensitive" },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {};
  const summaryWhere = buildPaymentWhere([scopeWhere, searchWhere]);
  const filteredWhere = buildPaymentWhere([
    scopeWhere,
    searchWhere,
    query.status ? { status: query.status } : {},
  ]);
  const skip = (query.page - 1) * query.pageSize;
  const orderBy: Prisma.PaymentOrderByWithRelationInput[] =
    query.sortBy === "updatedAt"
      ? [{ updatedAt: query.sortOrder }, { createdAt: "desc" }]
      : query.sortBy === "amountMinor"
        ? [{ amountMinor: query.sortOrder }, { createdAt: "desc" }]
        : [{ createdAt: query.sortOrder }];

  const [rows, total, summaryGroups] = await prisma.$transaction([
    prisma.payment.findMany({
      where: filteredWhere,
      orderBy,
      skip,
      take: query.pageSize,
      include: paymentDetailInclude,
    }),
    prisma.payment.count({ where: filteredWhere }),
    prisma.payment.groupBy({
      by: ["status"],
      where: summaryWhere,
      orderBy: { status: "asc" },
      _count: { _all: true },
      _sum: { amountMinor: true },
    }),
  ]);
  const summary = summarizePayments(summaryGroups);

  return {
    payments: rows.map(toSafePayment),
    pagination: createPaginationMeta(query.page, query.pageSize, total),
    filters: {
      search,
      status: query.status ?? null,
    },
    sort: {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    summary,
  };
}

export async function getPaymentById(
  requester: { userId: string; role: Role },
  paymentId: string,
): Promise<SafePayment> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: paymentDetailInclude,
  });
  if (!payment) {
    throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  if (requester.role !== Role.ADMIN && requester.userId !== payment.userId) {
    throw new HttpError(403, "PAYMENT_VIEW_FORBIDDEN", "You are not allowed to view this payment");
  }

  return toSafePayment(payment);
}

export async function updatePaymentStatus(
  requester: { userId: string; role: Role },
  paymentId: string,
  input: { status: PaymentStatus; verificationNotes?: string | undefined },
): Promise<SafePayment> {
  if (requester.role !== Role.ADMIN) {
    throw new HttpError(403, "PAYMENT_REVIEW_FORBIDDEN", "Only admins can update payment status");
  }

  let activatedPendingSubscription = false;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, status: true, subscriptionId: true },
      });

      if (!current) {
        throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
      }

      const trimmedNotes = input.verificationNotes?.trim() || null;
      const nextReviewedAt = new Date();

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: input.status,
          reviewedById: requester.userId,
          reviewedAt: nextReviewedAt,
          verificationNotes: trimmedNotes,
        },
        select: { id: true },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId,
          fromStatus: current.status,
          toStatus: input.status,
          changedById: requester.userId,
          verificationNotes: trimmedNotes,
        },
      });

      if (input.status === PaymentStatus.SUCCESS && current.subscriptionId) {
        const linkedSubscription = await tx.subscription.findUnique({
          where: { id: current.subscriptionId },
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          plan: {
            select: {
              durationDays: true,
              },
            },
          },
        });

        if (linkedSubscription && shouldActivatePendingSubscriptionNow(linkedSubscription, nextReviewedAt)) {
          const nextPeriod = getActivationPeriodForPendingSubscription(
            linkedSubscription,
            nextReviewedAt,
          );

          await tx.subscription.update({
            where: { id: linkedSubscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              startDate: nextPeriod.startDate,
              endDate: nextPeriod.endDate,
            },
            select: { id: true },
          });

          activatedPendingSubscription = true;
        }
      }

      const refreshedPayment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: paymentDetailInclude,
      });

      if (!refreshedPayment) {
        throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
      }

      return refreshedPayment;
    });

    recordPaymentReview({
      reviewerUserId: requester.userId,
      memberUserId: updated.userId,
      paymentId: updated.id,
      status: input.status,
    });

    if (activatedPendingSubscription) {
      await invalidateDashboardCache("subscription_activated_from_payment_review");
    }

    return toSafePayment(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }
    throw error;
  }
}
