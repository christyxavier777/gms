"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = createPayment;
exports.listPayments = listPayments;
exports.getPaymentById = getPaymentById;
exports.updatePaymentStatus = updatePaymentStatus;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const money_1 = require("./money");
const list_response_1 = require("../utils/list-response");
const cache_1 = require("../dashboard/cache");
const lifecycle_1 = require("../subscriptions/lifecycle");
const business_flow_metrics_1 = require("../observability/business-flow-metrics");
const prisma = (0, client_2.createPrismaClient)();
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
};
function toSafePayment(payment) {
    return {
        id: payment.id,
        transactionId: payment.transactionId,
        userId: payment.userId,
        subscriptionId: payment.subscriptionId,
        amount: (0, money_1.fromMinorUnits)(payment.amountMinor),
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
                status: (0, lifecycle_1.getEffectiveSubscriptionStatus)(payment.subscription.status, payment.subscription.endDate),
                startDate: payment.subscription.startDate,
                endDate: payment.subscription.endDate,
                plan: {
                    id: payment.subscription.plan.id,
                    name: payment.subscription.plan.name,
                    priceMinor: payment.subscription.plan.priceMinor,
                    priceInr: (0, money_1.fromMinorUnits)(payment.subscription.plan.priceMinor),
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
async function createPayment(requester, payload) {
    if (requester.role !== client_1.Role.ADMIN && requester.userId !== payload.userId) {
        throw new http_error_1.HttpError(403, "PAYMENT_CREATE_FORBIDDEN", "You are not allowed to create payments for this user");
    }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_PAYMENT_USER", "Payments can only be recorded for members");
    }
    if (payload.subscriptionId) {
        const subscription = await prisma.subscription.findUnique({ where: { id: payload.subscriptionId } });
        if (!subscription || subscription.userId !== payload.userId) {
            throw new http_error_1.HttpError(400, "INVALID_SUBSCRIPTION", "Subscription is invalid for this member");
        }
    }
    const amountMinor = (0, money_1.toMinorUnits)(payload.amount);
    const proofReference = payload.proofReference?.trim() || null;
    const payment = await prisma.payment.create({
        data: {
            transactionId: (0, money_1.generatePaymentTransactionId)(),
            userId: payload.userId,
            subscriptionId: payload.subscriptionId ?? null,
            amountMinor,
            upiId: payload.upiId,
            proofReference,
            status: client_1.PaymentStatus.PENDING,
            events: {
                create: {
                    fromStatus: null,
                    toStatus: client_1.PaymentStatus.PENDING,
                    changedById: requester.userId,
                    verificationNotes: null,
                },
            },
        },
        include: paymentDetailInclude,
    });
    if (requester.role === client_1.Role.MEMBER &&
        requester.userId === payload.userId &&
        payment.subscriptionId) {
        (0, business_flow_metrics_1.recordOnboardingPaymentSubmitted)({
            memberUserId: payload.userId,
            paymentId: payment.id,
            subscriptionId: payment.subscriptionId,
        });
    }
    return toSafePayment(payment);
}
function buildPaymentWhere(clauses) {
    const nonEmptyClauses = clauses.filter((clause) => Object.keys(clause).length > 0);
    if (nonEmptyClauses.length === 0) {
        return {};
    }
    return { AND: nonEmptyClauses };
}
function summarizePayments(groups) {
    const summary = {
        total: 0,
        pending: 0,
        success: 0,
        failed: 0,
        verifiedRevenueMinor: 0,
    };
    for (const group of groups) {
        const count = group._count && group._count !== true ? group._count._all ?? 0 : 0;
        summary.total += count;
        if (group.status === client_1.PaymentStatus.PENDING) {
            summary.pending = count;
            continue;
        }
        if (group.status === client_1.PaymentStatus.SUCCESS) {
            summary.success = count;
            summary.verifiedRevenueMinor = group._sum?.amountMinor ?? 0;
            continue;
        }
        if (group.status === client_1.PaymentStatus.FAILED) {
            summary.failed = count;
        }
    }
    return summary;
}
async function listPayments(requester, query) {
    const search = query.search.trim();
    const scopeWhere = requester.role === client_1.Role.ADMIN ? {} : { userId: requester.userId };
    const searchWhere = search.length > 0
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
    const orderBy = query.sortBy === "updatedAt"
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
        pagination: (0, list_response_1.createPaginationMeta)(query.page, query.pageSize, total),
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
async function getPaymentById(requester, paymentId) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: paymentDetailInclude,
    });
    if (!payment) {
        throw new http_error_1.HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }
    if (requester.role !== client_1.Role.ADMIN && requester.userId !== payment.userId) {
        throw new http_error_1.HttpError(403, "PAYMENT_VIEW_FORBIDDEN", "You are not allowed to view this payment");
    }
    return toSafePayment(payment);
}
async function updatePaymentStatus(requester, paymentId, input) {
    if (requester.role !== client_1.Role.ADMIN) {
        throw new http_error_1.HttpError(403, "PAYMENT_REVIEW_FORBIDDEN", "Only admins can update payment status");
    }
    let activatedPendingSubscription = false;
    try {
        const updated = await prisma.$transaction(async (tx) => {
            const current = await tx.payment.findUnique({
                where: { id: paymentId },
                select: { id: true, status: true, subscriptionId: true },
            });
            if (!current) {
                throw new http_error_1.HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
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
            if (input.status === client_1.PaymentStatus.SUCCESS && current.subscriptionId) {
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
                if (linkedSubscription?.status === client_1.SubscriptionStatus.PENDING_ACTIVATION) {
                    const nextPeriod = (0, lifecycle_1.buildSubscriptionPeriod)(linkedSubscription.plan.durationDays, nextReviewedAt);
                    await tx.subscription.update({
                        where: { id: linkedSubscription.id },
                        data: {
                            status: client_1.SubscriptionStatus.ACTIVE,
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
                throw new http_error_1.HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
            }
            return refreshedPayment;
        });
        (0, business_flow_metrics_1.recordPaymentReview)({
            reviewerUserId: requester.userId,
            memberUserId: updated.userId,
            paymentId: updated.id,
            status: input.status,
        });
        if (activatedPendingSubscription) {
            await (0, cache_1.invalidateDashboardCache)("subscription_activated_from_payment_review");
        }
        return toSafePayment(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "PAYMENT_NOT_FOUND", "Payment not found");
        }
        throw error;
    }
}
//# sourceMappingURL=service.js.map