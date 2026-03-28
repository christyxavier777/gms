"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = getAdminDashboard;
exports.getTrainerDashboard = getTrainerDashboard;
exports.getMemberDashboard = getMemberDashboard;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
const money_1 = require("../payments/money");
const lifecycle_1 = require("../subscriptions/lifecycle");
const prisma = (0, client_2.createPrismaClient)();
function readAggregateCount(count) {
    return count && count !== true ? count._all ?? 0 : 0;
}
// Aggregated admin dashboard counts from core system entities.
async function getAdminDashboard() {
    const now = new Date();
    const [userGroups, activeSubscriptions, expiredSubscriptions, workoutPlanCount, dietPlanCount] = await prisma.$transaction([
        prisma.user.groupBy({
            by: ["role", "status"],
            orderBy: [{ role: "asc" }, { status: "asc" }],
            _count: { _all: true },
        }),
        prisma.subscription.count({ where: (0, lifecycle_1.getActiveSubscriptionWhere)(now) }),
        prisma.subscription.count({ where: (0, lifecycle_1.getExpiredSubscriptionWhere)(now) }),
        prisma.workoutPlan.count(),
        prisma.dietPlan.count(),
    ]);
    let totalUsers = 0;
    let activeMembers = 0;
    let totalTrainers = 0;
    for (const row of userGroups) {
        const count = readAggregateCount(row._count);
        totalUsers += count;
        if (row.role === client_1.Role.MEMBER && row.status === client_1.UserStatus.ACTIVE) {
            activeMembers = count;
        }
        if (row.role === client_1.Role.TRAINER) {
            totalTrainers += count;
        }
    }
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
    const now = new Date();
    const [activeSubscription, workoutPlans, dietPlans, recentProgressEntries] = await prisma.$transaction([
        prisma.subscription.findFirst({
            where: {
                userId: memberId,
                OR: [
                    (0, lifecycle_1.getActiveSubscriptionWhere)(now),
                    { status: client_1.SubscriptionStatus.PENDING_ACTIVATION },
                ],
            },
            orderBy: [{ createdAt: "desc" }],
            select: {
                id: true,
                planId: true,
                startDate: true,
                endDate: true,
                status: true,
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
        activeSubscriptionSummary: activeSubscription
            ? {
                id: activeSubscription.id,
                planId: activeSubscription.planId,
                planName: activeSubscription.plan.name,
                startDate: activeSubscription.startDate,
                endDate: activeSubscription.endDate,
                status: (0, lifecycle_1.getEffectiveSubscriptionStatus)(activeSubscription.status, activeSubscription.endDate),
                plan: {
                    id: activeSubscription.plan.id,
                    name: activeSubscription.plan.name,
                    priceMinor: activeSubscription.plan.priceMinor,
                    priceInr: (0, money_1.fromMinorUnits)(activeSubscription.plan.priceMinor),
                    durationDays: activeSubscription.plan.durationDays,
                    perks: activeSubscription.plan.perks,
                    active: activeSubscription.plan.active,
                },
            }
            : null,
        assignedWorkoutPlans: workoutPlans,
        assignedDietPlans: dietPlans,
        recentProgressEntries,
    };
}
//# sourceMappingURL=service.js.map