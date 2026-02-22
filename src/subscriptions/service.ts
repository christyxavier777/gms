import { Prisma, Role, Subscription, SubscriptionStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { trainerCanReadMember } from "../users/service";
import { SafeSubscription } from "./types";

const prisma = createPrismaClient();

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function todayUtc(): Date {
  return startOfDay(new Date());
}

function toSafeSubscription(subscription: Subscription): SafeSubscription {
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

async function ensureMemberUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  if (user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_SUBSCRIPTION_TARGET", "Subscriptions can only be created for members");
  }
}

// Updates stale ACTIVE subscriptions to EXPIRED based on end date.
export async function autoExpireSubscriptions(): Promise<void> {
  const today = todayUtc();
  await prisma.subscription.updateMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      endDate: { lt: today },
    },
    data: { status: SubscriptionStatus.EXPIRED },
  });
}

async function ensureNoActiveOverlap(userId: string, startDate: Date, endDate: Date): Promise<void> {
  const today = todayUtc();
  const overlapping = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      endDate: { gte: today },
      startDate: { lte: endDate },
      NOT: { endDate: { lt: startDate } },
    },
  });

  if (overlapping) {
    throw new HttpError(409, "ACTIVE_SUBSCRIPTION_OVERLAP", "An active subscription already exists in this period");
  }
}

// Creates a new subscription for a member.
export async function createSubscription(input: {
  userId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
}): Promise<SafeSubscription> {
  const today = todayUtc();
  const normalizedStart = startOfDay(input.startDate);
  const normalizedEnd = startOfDay(input.endDate);

  if (normalizedStart > today) {
    throw new HttpError(400, "INVALID_SUBSCRIPTION_DATES", "startDate cannot be in the future");
  }

  if (normalizedStart > normalizedEnd) {
    throw new HttpError(400, "INVALID_SUBSCRIPTION_DATES", "startDate must be before or equal to endDate");
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
      status: SubscriptionStatus.ACTIVE,
    },
  });

  return toSafeSubscription(subscription);
}

// Returns all subscriptions for admin management.
export async function listSubscriptions(): Promise<SafeSubscription[]> {
  await autoExpireSubscriptions();
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });
  return subscriptions.map(toSafeSubscription);
}

// Reads one subscription with visibility rules.
export async function getSubscriptionById(
  requester: { userId: string; role: Role },
  id: string,
): Promise<SafeSubscription> {
  await autoExpireSubscriptions();
  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) {
    throw new HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
  }

  const isOwner = subscription.userId === requester.userId;
  const trainerAllowed =
    requester.role === Role.TRAINER && trainerCanReadMember(requester.userId, subscription.userId);
  if (requester.role !== Role.ADMIN && !isOwner && !trainerAllowed) {
    throw new HttpError(403, "FORBIDDEN", "You are not allowed to access this subscription");
  }

  return toSafeSubscription(subscription);
}

// Reads current member subscription.
export async function getMySubscription(memberUserId: string): Promise<SafeSubscription | null> {
  await autoExpireSubscriptions();
  const subscription = await prisma.subscription.findFirst({
    where: { userId: memberUserId },
    orderBy: { createdAt: "desc" },
  });
  return subscription ? toSafeSubscription(subscription) : null;
}

// Cancels a subscription explicitly.
export async function cancelSubscription(id: string): Promise<SafeSubscription> {
  try {
    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED },
    });
    return toSafeSubscription(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new HttpError(404, "SUBSCRIPTION_NOT_FOUND", "Subscription not found");
    }
    throw error;
  }
}
