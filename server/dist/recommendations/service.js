"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canReadRecommendations = canReadRecommendations;
exports.getMemberRecommendation = getMemberRecommendation;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const http_error_1 = require("../middleware/http-error");
const service_1 = require("../users/service");
const engine_1 = require("./engine");
const prisma = (0, client_2.createPrismaClient)();
async function assertMemberUser(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user)
        throw new http_error_1.HttpError(404, "USER_NOT_FOUND", "User not found");
    if (user.role !== client_1.Role.MEMBER) {
        throw new http_error_1.HttpError(400, "INVALID_MEMBER", "Recommendations are only available for members");
    }
}
async function canReadRecommendations(requester, memberUserId) {
    if (requester.role === client_1.Role.ADMIN)
        return true;
    if (requester.role === client_1.Role.MEMBER && requester.userId === memberUserId)
        return true;
    if (requester.role === client_1.Role.TRAINER) {
        return (0, service_1.trainerCanReadMember)(requester.userId, memberUserId);
    }
    return false;
}
async function getMemberRecommendation(memberUserId) {
    await assertMemberUser(memberUserId);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [latestProgress, recentProgress, activeSubCount] = await prisma.$transaction([
        prisma.progress.findMany({
            where: { userId: memberUserId, bmi: { not: null } },
            orderBy: { recordedAt: "desc" },
            take: 2,
            select: { bmi: true },
        }),
        prisma.progress.count({
            where: { userId: memberUserId, recordedAt: { gte: since } },
        }),
        prisma.subscription.count({
            where: { userId: memberUserId, status: client_1.SubscriptionStatus.ACTIVE },
        }),
    ]);
    const latestBmi = latestProgress[0]?.bmi ?? null;
    const previousBmi = latestProgress[1]?.bmi ?? null;
    if (latestBmi === null) {
        throw new http_error_1.HttpError(400, "INSUFFICIENT_PROGRESS_DATA", "At least one BMI-based progress entry is required for recommendations");
    }
    return {
        memberUserId,
        recommendation: (0, engine_1.buildRecommendation)({
            latestBmi,
            previousBmi,
            progressLast30Days: recentProgress,
            hasActiveSubscription: activeSubCount > 0,
        }),
    };
}
//# sourceMappingURL=service.js.map