import { Role, SubscriptionStatus, UserStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { fromMinorUnits } from "../payments/money";
import {
  getActiveSubscriptionWhere,
  getExpiredSubscriptionWhere,
  getEffectiveSubscriptionStatus,
} from "../subscriptions/lifecycle";

const prisma = createPrismaClient();

function readAggregateCount(count: true | { _all?: number | null } | undefined): number {
  return count && count !== true ? count._all ?? 0 : 0;
}

// Aggregated admin dashboard counts from core system entities.
export async function getAdminDashboard() {
  const now = new Date();
  const [userGroups, activeSubscriptions, expiredSubscriptions, workoutPlanCount, dietPlanCount] = await prisma.$transaction([
    prisma.user.groupBy({
      by: ["role", "status"],
      orderBy: [{ role: "asc" }, { status: "asc" }],
      _count: { _all: true },
    }),
    prisma.subscription.count({ where: getActiveSubscriptionWhere(now) }),
    prisma.subscription.count({ where: getExpiredSubscriptionWhere(now) }),
    prisma.workoutPlan.count(),
    prisma.dietPlan.count(),
  ]);

  let totalUsers = 0;
  let activeMembers = 0;
  let totalTrainers = 0;

  for (const row of userGroups) {
    const count = readAggregateCount(row._count);
    totalUsers += count;

    if (row.role === Role.MEMBER && row.status === UserStatus.ACTIVE) {
      activeMembers = count;
    }

    if (row.role === Role.TRAINER) {
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
export async function getTrainerDashboard(trainerId: string, recentLimit: number) {
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

  const assignedMemberIds = new Set<string>();
  for (const row of workoutAssignments) if (row.assignedToId) assignedMemberIds.add(row.assignedToId);
  for (const row of dietAssignments) if (row.assignedToId) assignedMemberIds.add(row.assignedToId);

  const recentProgressEntries =
    assignedMemberIds.size > 0
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
export async function getMemberDashboard(memberId: string, recentLimit: number) {
  const now = new Date();
  const [activeSubscription, workoutPlans, dietPlans, recentProgressEntries] = await prisma.$transaction([
    prisma.subscription.findFirst({
      where: {
        userId: memberId,
        OR: [
          getActiveSubscriptionWhere(now),
          { status: SubscriptionStatus.PENDING_ACTIVATION },
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
          status: getEffectiveSubscriptionStatus(activeSubscription.status, activeSubscription.endDate),
          plan: {
            id: activeSubscription.plan.id,
            name: activeSubscription.plan.name,
            priceMinor: activeSubscription.plan.priceMinor,
            priceInr: fromMinorUnits(activeSubscription.plan.priceMinor),
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
