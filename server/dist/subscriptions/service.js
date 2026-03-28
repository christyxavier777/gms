"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMembershipPlans = listMembershipPlans;
exports.createSubscription = createSubscription;
exports.createOnboardingSubscription = createOnboardingSubscription;
exports.listSubscriptions = listSubscriptions;
exports.getSubscriptionById = getSubscriptionById;
exports.getMySubscription = getMySubscription;
exports.cancelSubscription = cancelSubscription;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const service_1 = require("../users/service");
const money_1 = require("../payments/money");
const cache_1 = require("../dashboard/cache");
const list_response_1 = require("../utils/list-response");
const business_flow_metrics_1 = require("../observability/business-flow-metrics");
const lifecycle_1 = require("./lifecycle");
const prisma = (0, client_2.createPrismaClient)();
const membershipPlanSelect = {
    id: true,
    name: true,
    priceMinor: true,
    durationDays: true,
    perks: true,
    active: true,
    displayOrder: true,
};
const subscriptionDetailInclude = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
        },
    },
    plan: {
        select: membershipPlanSelect,
    },
};
function toSafeMembershipPlan(plan) {
    return {
        id: plan.id,
        name: plan.name,
        priceMinor: plan.priceMinor,
        priceInr: (0, money_1.fromMinorUnits)(plan.priceMinor),
        durationDays: plan.durationDays,
        perks: plan.perks,
        active: plan.active,
    };
}
function toSafeSubscription(subscription) {
    const status = (0, lifecycle_1.getEffectiveSubscriptionStatus)(subscription.status, subscription.endDate);
    return {
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        planName: subscription.plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        plan: toSafeMembershipPlan(subscription.plan),
        member: {
            id: subscription.user.id,
            name: subscription.user.name,
            email: subscription.user.email,
            phone: subscription.user.phone,
            status: subscription.user.status,
        },
    };
}
function buildSubscriptionWhere(clauses) {
    const nonEmptyClauses = clauses.filter((clause) => Object.keys(clause).length > 0);
    if (nonEmptyClauses.length === 0) {
        return {};
    }
    return { AND: nonEmptyClauses };
}
async function ensureMemberUser(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    if (user.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_SUBSCRIPTION_TARGET", "Subscriptions can only be created for members");
    }
}
async function ensureNoActiveOverlap(userId, startDate, endDate) {
    const overlapping = await prisma.subscription.findFirst({
        where: {
            userId,
            ...(0, lifecycle_1.getOverlapBlockingSubscriptionWhere)(startDate, endDate),
        },
        select: { id: true },
    });
    if (overlapping) {
        throw new http_error_1.HttpError(409, "ACTIVE_SUBSCRIPTION_OVERLAP", "An active subscription already exists in this period");
    }
}
async function getMembershipPlanOrThrow(planId, requireActive = true) {
    const plan = await prisma.membershipPlan.findUnique({
        where: { id: planId },
        select: membershipPlanSelect,
    });
    if (!plan) {
        throw new http_error_1.HttpError(400, "INVALID_PLAN_ID", "Selected plan is not available");
    }
    if (requireActive && !plan.active) {
        throw new http_error_1.HttpError(400, "PLAN_INACTIVE", "Selected plan is not currently available");
    }
    return toSafeMembershipPlan(plan);
}
async function listMembershipPlans() {
    const plans = await prisma.membershipPlan.findMany({
        where: { active: true },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        select: membershipPlanSelect,
    });
    return plans.map(toSafeMembershipPlan);
}
// Creates a new subscription for a member.
async function createSubscription(input) {
    const today = (0, lifecycle_1.todayUtc)();
    const normalizedStart = (0, lifecycle_1.startOfUtcDay)(input.startDate);
    if (normalizedStart > today) {
        throw new http_error_1.HttpError(400, "INVALID_SUBSCRIPTION_DATES", "startDate cannot be in the future");
    }
    await ensureMemberUser(input.userId);
    const plan = await getMembershipPlanOrThrow(input.planId);
    const { endDate: normalizedEnd } = (0, lifecycle_1.buildSubscriptionPeriod)(plan.durationDays, normalizedStart);
    await ensureNoActiveOverlap(input.userId, normalizedStart, normalizedEnd);
    const subscription = await prisma.subscription.create({
        data: {
            userId: input.userId,
            planId: plan.id,
            planName: plan.name,
            startDate: normalizedStart,
            endDate: normalizedEnd,
            status: client_1.SubscriptionStatus.ACTIVE,
        },
        include: subscriptionDetailInclude,
    });
    await (0, cache_1.invalidateDashboardCache)("subscription_created");
    return toSafeSubscription(subscription);
}
async function createOnboardingSubscription(memberUserId, planId) {
    const plan = await getMembershipPlanOrThrow(planId);
    const { startDate, endDate } = (0, lifecycle_1.buildSubscriptionPeriod)(plan.durationDays, (0, lifecycle_1.todayUtc)());
    await ensureMemberUser(memberUserId);
    await ensureNoActiveOverlap(memberUserId, startDate, endDate);
    const subscription = await prisma.subscription.create({
        data: {
            userId: memberUserId,
            planId: plan.id,
            planName: plan.name,
            startDate,
            endDate,
            status: client_1.SubscriptionStatus.PENDING_ACTIVATION,
        },
        include: subscriptionDetailInclude,
    });
    await (0, cache_1.invalidateDashboardCache)("subscription_created");
    (0, business_flow_metrics_1.recordOnboardingSubscriptionCreated)({
        memberUserId,
        subscriptionId: subscription.id,
        planId: plan.id,
    });
    return toSafeSubscription(subscription);
}
// Returns all subscriptions for admin management.
async function listSubscriptions(query) {
    const now = new Date();
    const search = query.search.trim();
    const searchWhere = search.length > 0
        ? {
            OR: [
                { planName: { contains: search, mode: "insensitive" } },
                {
                    plan: {
                        is: {
                            name: { contains: search, mode: "insensitive" },
                        },
                    },
                },
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
            ],
        }
        : {};
    const summaryWhere = buildSubscriptionWhere([searchWhere]);
    const filteredWhere = buildSubscriptionWhere([
        searchWhere,
        (0, lifecycle_1.getSubscriptionStatusWhere)(query.status, now),
    ]);
    const skip = (query.page - 1) * query.pageSize;
    const orderBy = query.sortBy === "startDate"
        ? [{ startDate: query.sortOrder }, { createdAt: "desc" }]
        : query.sortBy === "endDate"
            ? [{ endDate: query.sortOrder }, { createdAt: "desc" }]
            : [{ createdAt: query.sortOrder }];
    const [subscriptions, total, summaryTotal, active, pendingActivation, cancelledAtPeriodEnd, cancelled,] = await prisma.$transaction([
        prisma.subscription.findMany({
            where: filteredWhere,
            orderBy,
            skip,
            take: query.pageSize,
            include: subscriptionDetailInclude,
        }),
        prisma.subscription.count({ where: filteredWhere }),
        prisma.subscription.count({ where: summaryWhere }),
        prisma.subscription.count({
            where: buildSubscriptionWhere([summaryWhere, (0, lifecycle_1.getSubscriptionStatusWhere)(client_1.SubscriptionStatus.ACTIVE, now)]),
        }),
        prisma.subscription.count({
            where: buildSubscriptionWhere([
                summaryWhere,
                (0, lifecycle_1.getSubscriptionStatusWhere)(client_1.SubscriptionStatus.PENDING_ACTIVATION, now),
            ]),
        }),
        prisma.subscription.count({
            where: buildSubscriptionWhere([
                summaryWhere,
                (0, lifecycle_1.getSubscriptionStatusWhere)(client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END, now),
            ]),
        }),
        prisma.subscription.count({
            where: buildSubscriptionWhere([summaryWhere, (0, lifecycle_1.getSubscriptionStatusWhere)(client_1.SubscriptionStatus.CANCELLED, now)]),
        }),
    ]);
    const expired = Math.max(summaryTotal - active - pendingActivation - cancelledAtPeriodEnd - cancelled, 0);
    return {
        subscriptions: subscriptions.map(toSafeSubscription),
        pagination: (0, list_response_1.createPaginationMeta)(query.page, query.pageSize, total),
        filters: {
            search,
            status: query.status ?? null,
        },
        sort: {
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        },
        summary: {
            total: summaryTotal,
            pendingActivation,
            active,
            cancelledAtPeriodEnd,
            expired,
            cancelled,
        },
    };
}
// Reads one subscription with visibility rules.
async function getSubscriptionById(requester, id) {
    const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: subscriptionDetailInclude,
    });
    if (!subscription) {
        throw new http_error_1.HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
    }
    const isOwner = subscription.userId === requester.userId;
    const trainerAllowed = requester.role === client_1.Role.TRAINER && (await (0, service_1.trainerCanReadMember)(requester.userId, subscription.userId));
    if (requester.role !== client_1.Role.ADMIN && !isOwner && !trainerAllowed) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this subscription");
    }
    return toSafeSubscription(subscription);
}
// Reads current member subscription.
async function getMySubscription(memberUserId) {
    const subscription = await prisma.subscription.findFirst({
        where: {
            userId: memberUserId,
            OR: [
                (0, lifecycle_1.getActiveSubscriptionWhere)(),
                { status: client_1.SubscriptionStatus.PENDING_ACTIVATION },
            ],
        },
        orderBy: [{ createdAt: "desc" }],
        include: subscriptionDetailInclude,
    });
    return subscription ? toSafeSubscription(subscription) : null;
}
// Cancels a subscription explicitly.
async function cancelSubscription(id) {
    try {
        const current = await prisma.subscription.findUnique({
            where: { id },
            include: subscriptionDetailInclude,
        });
        if (!current) {
            throw new http_error_1.HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
        }
        const effectiveStatus = (0, lifecycle_1.getEffectiveSubscriptionStatus)(current.status, current.endDate);
        if (effectiveStatus === client_1.SubscriptionStatus.EXPIRED) {
            throw new http_error_1.HttpError(409, "SUBSCRIPTION_ALREADY_EXPIRED", "Expired subscriptions can no longer be cancelled");
        }
        if (effectiveStatus === client_1.SubscriptionStatus.CANCELLED) {
            throw new http_error_1.HttpError(409, "SUBSCRIPTION_ALREADY_CANCELLED", "Subscription is already cancelled");
        }
        if (effectiveStatus === client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END) {
            throw new http_error_1.HttpError(409, "SUBSCRIPTION_ALREADY_ENDING", "Subscription is already scheduled to cancel at period end");
        }
        const nextStatus = current.status === client_1.SubscriptionStatus.PENDING_ACTIVATION
            ? client_1.SubscriptionStatus.CANCELLED
            : client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END;
        const updated = await prisma.subscription.update({
            where: { id },
            data: { status: nextStatus },
            include: subscriptionDetailInclude,
        });
        await (0, cache_1.invalidateDashboardCache)(nextStatus === client_1.SubscriptionStatus.CANCELLED
            ? "subscription_cancelled"
            : "subscription_cancellation_scheduled");
        return toSafeSubscription(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            throw new http_error_1.HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
        }
        throw error;
    }
}
//# sourceMappingURL=service.js.map