"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = getAdminDashboard;
exports.getTrainerDashboard = getTrainerDashboard;
exports.getMemberDashboard = getMemberDashboard;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const prisma = (0, client_2.createPrismaClient)();
// Aggregated admin dashboard counts from core system entities.
async function getAdminDashboard() {
    const [totalUsers, activeMembers, activeSubscriptions, expiredSubscriptions, totalTrainers, workoutPlanCount, dietPlanCount,] = await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { role: client_1.Role.MEMBER, status: "ACTIVE" } }),
        prisma.subscription.count({ where: { status: client_1.SubscriptionStatus.ACTIVE } }),
        prisma.subscription.count({ where: { status: client_1.SubscriptionStatus.EXPIRED } }),
        prisma.user.count({ where: { role: client_1.Role.TRAINER } }),
        prisma.workoutPlan.count(),
        prisma.dietPlan.count(),
    ]);
    return {
        totalUsers,
        activeMembers,
        activeSubscriptions,
        expiredSubscriptions,
        totalTrainers,
        totalPlans: workoutPlanCount + dietPlanCount,
    };
}
// Trainer dashboard summary for owned plans, assigned members, and recent progress.
async function getTrainerDashboard(trainerId, recentLimit) {
    const [workoutPlansCreated, dietPlansCreated, workoutAssignments, dietAssignments] = await prisma.$transaction([
        prisma.workoutPlan.count({ where: { createdById: trainerId } }),
        prisma.dietPlan.count({ where: { createdById: trainerId } }),
        prisma.workoutPlan.findMany({
            where: { createdById: trainerId, assignedToId: { not: null } },
            select: { assignedToId: true },
            distinct: ["assignedToId"],
        }),
        prisma.dietPlan.findMany({
            where: { createdById: trainerId, assignedToId: { not: null } },
            select: { assignedToId: true },
            distinct: ["assignedToId"],
        }),
    ]);
    const assignedMemberIds = new Set();
    for (const row of workoutAssignments)
        if (row.assignedToId)
            assignedMemberIds.add(row.assignedToId);
    for (const row of dietAssignments)
        if (row.assignedToId)
            assignedMemberIds.add(row.assignedToId);
    const recentProgressEntries = assignedMemberIds.size > 0
        ? await prisma.progress.findMany({
            where: { userId: { in: Array.from(assignedMemberIds) } },
            orderBy: { recordedAt: "desc" },
            take: recentLimit,
            select: {
                id: true,
                userId: true,
                recordedById: true,
                weight: true,
                bodyFat: true,
                bmi: true,
                notes: true,
                recordedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        })
        : [];
    return {
        assignedMembersCount: assignedMemberIds.size,
        plansCreatedByTrainer: workoutPlansCreated + dietPlansCreated,
        recentProgressEntries,
    };
}
// Member dashboard summary for active subscription, assigned plans, and recent progress.
async function getMemberDashboard(memberId, recentLimit) {
    const [activeSubscription, workoutPlans, dietPlans, recentProgressEntries] = await prisma.$transaction([
        prisma.subscription.findFirst({
            where: { userId: memberId, status: client_1.SubscriptionStatus.ACTIVE },
            orderBy: { endDate: "desc" },
            select: {
                id: true,
                planName: true,
                startDate: true,
                endDate: true,
                status: true,
            },
        }),
        prisma.workoutPlan.findMany({
            where: { assignedToId: memberId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        prisma.dietPlan.findMany({
            where: { assignedToId: memberId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        prisma.progress.findMany({
            where: { userId: memberId },
            orderBy: { recordedAt: "desc" },
            take: recentLimit,
            select: {
                id: true,
                userId: true,
                recordedById: true,
                weight: true,
                bodyFat: true,
                bmi: true,
                notes: true,
                recordedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
    ]);
    return {
        activeSubscriptionSummary: activeSubscription,
        assignedWorkoutPlans: workoutPlans,
        assignedDietPlans: dietPlans,
        recentProgressEntries,
    };
}
//# sourceMappingURL=service.js.map