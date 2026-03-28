import { PaymentStatus, Prisma, Role, SubscriptionStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { fromMinorUnits, generatePaymentTransactionId, toMinorUnits } from "./money";
import { PaymentListSummary, SafePayment } from "./types";
import { createPaginationMeta, SortOrder } from "../utils/list-response";
import { invalidateDashboardCache } from "../dashboard/cache";
import {
  buildSubscriptionPeriod,
  getEffectiveSubscriptionStatus,
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

function toSafePayment(payment: PaymentWithRelations): SafePayment {
  return {
    id: payment.id,
    transactionId: payment.transactionId,
    userId: payment.userId,
    subscriptionId: payment.subscriptionId,
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

export async function createPayment(
  requester: { userId: string; role: Role },
  payload: {
    userId: string;
    subscriptionId?: string | undefined;
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

  if (payload.subscriptionId) {
    const subscription = await prisma.subscription.findUnique({ where: { id: payload.subscriptionId } });
    if (!subscription || subscription.userId !== payload.userId) {
      throw new HttpError(400, "INVALID_SUBSCRIPTION", "Subscription is invalid for this member");
    }
  }

  const amountMinor = toMinorUnits(payload.amount);
  const proofReference = payload.proofReference?.trim() || null;
  const payment = await prisma.payment.create({
    data: {
      transactionId: generatePaymentTransactionId(),
      userId: payload.userId,
      subscriptionId: payload.subscriptionId ?? null,
      amountMinor,
      upiId: payload.upiId,
      proofReference,
      status: PaymentStatus.PENDING,
      events: {
        create: {
          fromStatus: null,
          toStatus: PaymentStatus.PENDING,
          changedById: requester.userId,
          verificationNotes: null,
        },
      },
    },
    include: paymentDetailInclude,
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

  return toSafePayment(payment);
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
            plan: {
              select: {
                durationDays: true,
              },
            },
          },
        });

        if (linkedSubscription?.status === SubscriptionStatus.PENDING_ACTIVATION) {
          const nextPeriod = buildSubscriptionPeriod(
            linkedSubscription.plan.durationDays,
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
