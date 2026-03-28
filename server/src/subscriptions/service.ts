import { MembershipPlan, Prisma, Role, SubscriptionStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { trainerCanReadMember } from "../users/service";
import { fromMinorUnits } from "../payments/money";
import { SafeMembershipPlan, SafeSubscription } from "./types";
import { invalidateDashboardCache } from "../dashboard/cache";
import { createPaginationMeta, SortOrder } from "../utils/list-response";
import { recordOnboardingSubscriptionCreated } from "../observability/business-flow-metrics";
import {
  addUtcDays,
  buildSubscriptionPeriod,
  getActiveSubscriptionWhere,
  getEffectiveSubscriptionStatus,
  getOverlapBlockingSubscriptionWhere,
  getSubscriptionStatusWhere,
  startOfUtcDay,
  todayUtc,
} from "./lifecycle";

const prisma = createPrismaClient();

const membershipPlanSelect = {
  id: true,
  name: true,
  priceMinor: true,
  durationDays: true,
  perks: true,
  active: true,
  displayOrder: true,
} satisfies Prisma.MembershipPlanSelect;

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
} satisfies Prisma.SubscriptionInclude;

type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{
  include: typeof subscriptionDetailInclude;
}>;

function toSafeMembershipPlan(plan: Pick<MembershipPlan, "id" | "name" | "priceMinor" | "durationDays" | "perks" | "active">): SafeMembershipPlan {
  return {
    id: plan.id,
    name: plan.name,
    priceMinor: plan.priceMinor,
    priceInr: fromMinorUnits(plan.priceMinor),
    durationDays: plan.durationDays,
    perks: plan.perks,
    active: plan.active,
  };
}

function toSafeSubscription(subscription: SubscriptionWithPlan): SafeSubscription {
  const status = getEffectiveSubscriptionStatus(subscription.status, subscription.endDate);

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

function buildSubscriptionWhere(
  clauses: Prisma.SubscriptionWhereInput[],
): Prisma.SubscriptionWhereInput {
  const nonEmptyClauses = clauses.filter((clause) => Object.keys(clause).length > 0);

  if (nonEmptyClauses.length === 0) {
    return {};
  }

  return { AND: nonEmptyClauses };
}

async function ensureMemberUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  if (user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_SUBSCRIPTION_TARGET", "Subscriptions can only be created for members");
  }
}

async function ensureNoActiveOverlap(userId: string, startDate: Date, endDate: Date): Promise<void> {
  const overlapping = await prisma.subscription.findFirst({
    where: {
      userId,
      ...getOverlapBlockingSubscriptionWhere(startDate, endDate),
    },
    select: { id: true },
  });

  if (overlapping) {
    throw new HttpError(409, "ACTIVE_SUBSCRIPTION_OVERLAP", "An active subscription already exists in this period");
  }
}

async function getMembershipPlanOrThrow(planId: string, requireActive = true): Promise<SafeMembershipPlan> {
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
    select: membershipPlanSelect,
  });

  if (!plan) {
    throw new HttpError(400, "INVALID_PLAN_ID", "Selected plan is not available");
  }

  if (requireActive && !plan.active) {
    throw new HttpError(400, "PLAN_INACTIVE", "Selected plan is not currently available");
  }

  return toSafeMembershipPlan(plan);
}

export async function listMembershipPlans(): Promise<SafeMembershipPlan[]> {
  const plans = await prisma.membershipPlan.findMany({
    where: { active: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: membershipPlanSelect,
  });

  return plans.map(toSafeMembershipPlan);
}

// Creates a new subscription for a member.
export async function createSubscription(input: {
  userId: string;
  planId: string;
  startDate: Date;
}): Promise<SafeSubscription> {
  const today = todayUtc();
  const normalizedStart = startOfUtcDay(input.startDate);

  if (normalizedStart > today) {
    throw new HttpError(400, "INVALID_SUBSCRIPTION_DATES", "startDate cannot be in the future");
  }

  await ensureMemberUser(input.userId);
  const plan = await getMembershipPlanOrThrow(input.planId);
  const { endDate: normalizedEnd } = buildSubscriptionPeriod(plan.durationDays, normalizedStart);
  await ensureNoActiveOverlap(input.userId, normalizedStart, normalizedEnd);

  const subscription = await prisma.subscription.create({
    data: {
      userId: input.userId,
      planId: plan.id,
      planName: plan.name,
      startDate: normalizedStart,
      endDate: normalizedEnd,
      status: SubscriptionStatus.ACTIVE,
    },
    include: subscriptionDetailInclude,
  });

  await invalidateDashboardCache("subscription_created");
  return toSafeSubscription(subscription);
}

export async function createOnboardingSubscription(
  memberUserId: string,
  planId: string,
): Promise<SafeSubscription> {
  const plan = await getMembershipPlanOrThrow(planId);
  const { startDate, endDate } = buildSubscriptionPeriod(plan.durationDays, todayUtc());

  await ensureMemberUser(memberUserId);
  await ensureNoActiveOverlap(memberUserId, startDate, endDate);

  const subscription = await prisma.subscription.create({
    data: {
      userId: memberUserId,
      planId: plan.id,
      planName: plan.name,
      startDate,
      endDate,
      status: SubscriptionStatus.PENDING_ACTIVATION,
    },
    include: subscriptionDetailInclude,
  });

  await invalidateDashboardCache("subscription_created");
  recordOnboardingSubscriptionCreated({
    memberUserId,
    subscriptionId: subscription.id,
    planId: plan.id,
  });
  return toSafeSubscription(subscription);
}

// Returns all subscriptions for admin management.
export async function listSubscriptions(query: {
  page: number;
  pageSize: number;
  search: string;
  status?: SubscriptionStatus | undefined;
  sortBy: "createdAt" | "startDate" | "endDate";
  sortOrder: SortOrder;
}): Promise<{
  subscriptions: SafeSubscription[];
  pagination: ReturnType<typeof createPaginationMeta>;
  filters: {
    search: string;
    status: SubscriptionStatus | null;
  };
  sort: {
    sortBy: "createdAt" | "startDate" | "endDate";
    sortOrder: SortOrder;
  };
  summary: {
    total: number;
    pendingActivation: number;
    active: number;
    cancelledAtPeriodEnd: number;
    expired: number;
    cancelled: number;
  };
}> {
  const now = new Date();
  const search = query.search.trim();
  const searchWhere: Prisma.SubscriptionWhereInput =
    search.length > 0
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
    getSubscriptionStatusWhere(query.status, now),
  ]);
  const skip = (query.page - 1) * query.pageSize;
  const orderBy: Prisma.SubscriptionOrderByWithRelationInput[] =
    query.sortBy === "startDate"
      ? [{ startDate: query.sortOrder }, { createdAt: "desc" }]
      : query.sortBy === "endDate"
        ? [{ endDate: query.sortOrder }, { createdAt: "desc" }]
        : [{ createdAt: query.sortOrder }];
  const [
    subscriptions,
    total,
    summaryTotal,
    active,
    pendingActivation,
    cancelledAtPeriodEnd,
    cancelled,
  ] = await prisma.$transaction([
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
      where: buildSubscriptionWhere([summaryWhere, getSubscriptionStatusWhere(SubscriptionStatus.ACTIVE, now)]),
    }),
    prisma.subscription.count({
      where: buildSubscriptionWhere([
        summaryWhere,
        getSubscriptionStatusWhere(SubscriptionStatus.PENDING_ACTIVATION, now),
      ]),
    }),
    prisma.subscription.count({
      where: buildSubscriptionWhere([
        summaryWhere,
        getSubscriptionStatusWhere(SubscriptionStatus.CANCELLED_AT_PERIOD_END, now),
      ]),
    }),
    prisma.subscription.count({
      where: buildSubscriptionWhere([summaryWhere, getSubscriptionStatusWhere(SubscriptionStatus.CANCELLED, now)]),
    }),
  ]);
  const expired = Math.max(
    summaryTotal - active - pendingActivation - cancelledAtPeriodEnd - cancelled,
    0,
  );

  return {
    subscriptions: subscriptions.map(toSafeSubscription),
    pagination: createPaginationMeta(query.page, query.pageSize, total),
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
export async function getSubscriptionById(
  requester: { userId: string; role: Role },
  id: string,
): Promise<SafeSubscription> {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: subscriptionDetailInclude,
  });
  if (!subscription) {
    throw new HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
  }

  const isOwner = subscription.userId === requester.userId;
  const trainerAllowed =
    requester.role === Role.TRAINER && (await trainerCanReadMember(requester.userId, subscription.userId));
  if (requester.role !== Role.ADMIN && !isOwner && !trainerAllowed) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this subscription");
  }

  return toSafeSubscription(subscription);
}

// Reads current member subscription.
export async function getMySubscription(memberUserId: string): Promise<SafeSubscription | null> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: memberUserId,
      OR: [
        getActiveSubscriptionWhere(),
        { status: SubscriptionStatus.PENDING_ACTIVATION },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
    include: subscriptionDetailInclude,
  });
  return subscription ? toSafeSubscription(subscription) : null;
}

// Cancels a subscription explicitly.
export async function cancelSubscription(id: string): Promise<SafeSubscription> {
  try {
    const current = await prisma.subscription.findUnique({
      where: { id },
      include: subscriptionDetailInclude,
    });

    if (!current) {
      throw new HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
    }

    const effectiveStatus = getEffectiveSubscriptionStatus(current.status, current.endDate);
    if (effectiveStatus === SubscriptionStatus.EXPIRED) {
      throw new HttpError(
        409,
        "SUBSCRIPTION_ALREADY_EXPIRED",
        "Expired subscriptions can no longer be cancelled",
      );
    }

    if (effectiveStatus === SubscriptionStatus.CANCELLED) {
      throw new HttpError(
        409,
        "SUBSCRIPTION_ALREADY_CANCELLED",
        "Subscription is already cancelled",
      );
    }

    if (effectiveStatus === SubscriptionStatus.CANCELLED_AT_PERIOD_END) {
      throw new HttpError(
        409,
        "SUBSCRIPTION_ALREADY_ENDING",
        "Subscription is already scheduled to cancel at period end",
      );
    }

    const nextStatus =
      current.status === SubscriptionStatus.PENDING_ACTIVATION
        ? SubscriptionStatus.CANCELLED
        : SubscriptionStatus.CANCELLED_AT_PERIOD_END;
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: nextStatus },
      include: subscriptionDetailInclude,
    });
    await invalidateDashboardCache(
      nextStatus === SubscriptionStatus.CANCELLED
        ? "subscription_cancelled"
        : "subscription_cancellation_scheduled",
    );
    return toSafeSubscription(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
    }
    throw error;
  }
}
