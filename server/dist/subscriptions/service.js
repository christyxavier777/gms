"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoExpireSubscriptions = autoExpireSubscriptions;
exports.createSubscription = createSubscription;
exports.listSubscriptions = listSubscriptions;
exports.getSubscriptionById = getSubscriptionById;
exports.getMySubscription = getMySubscription;
exports.cancelSubscription = cancelSubscription;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const service_1 = require("../users/service");
const prisma = (0, client_2.createPrismaClient)();
function startOfDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function todayUtc() {
    return startOfDay(new Date());
}
function toSafeSubscription(subscription) {
    return {
        id: subscription.id,
        userId: subscription.userId,
        planName: subscription.planName,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
    };
}
async function ensureMemberUser(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    if (user.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_SUBSCRIPTION_TARGET", "Subscriptions can only be created for members");
    }
}
// Updates stale ACTIVE subscriptions to EXPIRED based on end date.
async function autoExpireSubscriptions() {
    const today = todayUtc();
    await prisma.subscription.updateMany({
        where: {
            status: client_1.SubscriptionStatus.ACTIVE,
            endDate: { lt: today },
        },
        data: { status: client_1.SubscriptionStatus.EXPIRED },
    });
}
async function ensureNoActiveOverlap(userId, startDate, endDate) {
    const today = todayUtc();
    const overlapping = await prisma.subscription.findFirst({
        where: {
            userId,
            status: client_1.SubscriptionStatus.ACTIVE,
            endDate: { gte: today },
            startDate: { lte: endDate },
            NOT: { endDate: { lt: startDate } },
        },
    });
    if (overlapping) {
        throw new http_error_1.HttpError(409, "ACTIVE_SUBSCRIPTION_OVERLAP", "An active subscription already exists in this period");
    }
}
// Creates a new subscription for a member.
async function createSubscription(input) {
    const today = todayUtc();
    const normalizedStart = startOfDay(input.startDate);
    const normalizedEnd = startOfDay(input.endDate);
    if (normalizedStart > today) {
        throw new http_error_1.HttpError(400, "INVALID_SUBSCRIPTION_DATES", "startDate cannot be in the future");
    }
    if (normalizedStart > normalizedEnd) {
        throw new http_error_1.HttpError(400, "INVALID_SUBSCRIPTION_DATES", "startDate must be before or equal to endDate");
    }
    await ensureMemberUser(input.userId);
    await autoExpireSubscriptions();
    await ensureNoActiveOverlap(input.userId, normalizedStart, normalizedEnd);
    const subscription = await prisma.subscription.create({
        data: {
            userId: input.userId,
            planName: input.planName,
            startDate: normalizedStart,
            endDate: normalizedEnd,
            status: client_1.SubscriptionStatus.ACTIVE,
        },
    });
    return toSafeSubscription(subscription);
}
// Returns all subscriptions for admin management.
async function listSubscriptions() {
    await autoExpireSubscriptions();
    const subscriptions = await prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
    });
    return subscriptions.map(toSafeSubscription);
}
// Reads one subscription with visibility rules.
async function getSubscriptionById(requester, id) {
    await autoExpireSubscriptions();
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
        throw new http_error_1.HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
    }
    const isOwner = subscription.userId === requester.userId;
    const trainerAllowed = requester.role === client_1.Role.TRAINER && (0, service_1.trainerCanReadMember)(requester.userId, subscription.userId);
    if (requester.role !== client_1.Role.ADMIN && !isOwner && !trainerAllowed) {
        throw new http_error_1.HttpError(403, "FORBIDDEN", "You are not allowed to access this subscription");
    }
    return toSafeSubscription(subscription);
}
// Reads current member subscription.
async function getMySubscription(memberUserId) {
    await autoExpireSubscriptions();
    const subscription = await prisma.subscription.findFirst({
        where: { userId: memberUserId },
        orderBy: { createdAt: "desc" },
    });
    return subscription ? toSafeSubscription(subscription) : null;
}
// Cancels a subscription explicitly.
async function cancelSubscription(id) {
    try {
        const updated = await prisma.subscription.update({
            where: { id },
            data: { status: client_1.SubscriptionStatus.CANCELLED },
        });
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