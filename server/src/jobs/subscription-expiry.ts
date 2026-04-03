import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { invalidateDashboardCache } from "../dashboard/cache";
import { createPrismaClient } from "../prisma/client";
import { todayUtc } from "../subscriptions/lifecycle";
import { logError, logInfo } from "../utils/logger";

const prisma = createPrismaClient();

export async function expireOverdueSubscriptions(now = new Date()): Promise<{
  checkedAt: string;
  expiredCount: number;
  cancelledCount: number;
  activatedCount: number;
}> {
  const cutoff = todayUtc(now);
  const [expiredResult, cancelledResult, activatedResult] = await prisma.$transaction([
    prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: cutoff },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    }),
    prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        endDate: { lt: cutoff },
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
    }),
    prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.PENDING_ACTIVATION,
        startDate: { lte: cutoff },
        payments: {
          some: {
            status: PaymentStatus.SUCCESS,
          },
        },
      },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    }),
  ]);

  if (expiredResult.count > 0 || cancelledResult.count > 0 || activatedResult.count > 0) {
    await invalidateDashboardCache("subscription_expiry_job");
  }

  return {
    checkedAt: now.toISOString(),
    expiredCount: expiredResult.count,
    cancelledCount: cancelledResult.count,
    activatedCount: activatedResult.count,
  };
}

export async function runSubscriptionExpiryJob(now = new Date()): Promise<void> {
  try {
    const result = await expireOverdueSubscriptions(now);
    logInfo("subscription_expiry_job", result);
  } catch (error) {
    logError("subscription_expiry_job_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
