"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberAchievements = getMemberAchievements;
exports.canReadAchievements = canReadAchievements;
const client_1 = require("@prisma/client");
const http_error_1 = require("../middleware/http-error");
const client_2 = require("../prisma/client");
const service_1 = require("../users/service");
const engine_1 = require("./engine");
const lifecycle_1 = require("../subscriptions/lifecycle");
const prisma = (0, client_2.createPrismaClient)();
async function assertMemberExists(memberUserId) {
    const user = await prisma.user.findUnique({
        where: { id: memberUserId },
        select: { id: true, role: true },
    });
    if (!user) {
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    if (user.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_MEMBER", "Achievements are only available for members");
    }
}
async function getMemberAchievements(memberUserId) {
    await assertMemberExists(memberUserId);
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const [progressCount, progressLast30Days, latestProgress, activeSubscriptionCount, successfulPayments] = await prisma.$transaction([
        prisma.progress.count({ where: { userId: memberUserId } }),
        prisma.progress.count({ where: { userId: memberUserId, recordedAt: { gte: thirtyDaysAgo } } }),
        prisma.progress.findFirst({
            where: { userId: memberUserId },
            orderBy: { recordedAt: "desc" },
            select: { bmi: true },
        }),
        prisma.subscription.count({
            where: { userId: memberUserId, ...(0, lifecycle_1.getActiveSubscriptionWhere)() },
        }),
        prisma.payment.count({
            where: { userId: memberUserId, status: client_1.PaymentStatus.SUCCESS },
        }),
    ]);
    const computed = (0, engine_1.generateBadges)({
        progressCount,
        progressLast30Days,
        latestBmi: latestProgress?.bmi ?? null,
        hasActiveSubscription: activeSubscriptionCount > 0,
        successfulPayments,
    });
    return {
        memberUserId,
        totalPoints: computed.totalPoints,
        badges: computed.badges,
    };
}
async function canReadAchievements(requester, memberUserId) {
    if (requester.role === client_1.Role.ADMIN)
        return true;
    if (requester.role === client_1.Role.MEMBER && requester.userId === memberUserId)
        return true;
    if (requester.role === client_1.Role.TRAINER) {
        return (0, service_1.trainerCanReadMember)(requester.userId, memberUserId);
    }
    return false;
}
//# sourceMappingURL=service.js.map