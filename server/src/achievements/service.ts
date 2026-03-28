import { PaymentStatus, Role } from "@prisma/client";
import { HttpError } from "../middleware/http-error";
import { createPrismaClient } from "../prisma/client";
import { trainerCanReadMember } from "../users/service";
import { generateBadges } from "./engine";
import { getActiveSubscriptionWhere } from "../subscriptions/lifecycle";

const prisma = createPrismaClient();

async function assertMemberExists(memberUserId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: memberUserId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }
  if (user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_MEMBER", "Achievements are only available for members");
  }
}

export async function getMemberAchievements(memberUserId: string): Promise<{
  memberUserId: string;
  totalPoints: number;
  badges: ReturnType<typeof generateBadges>["badges"];
}> {
  await assertMemberExists(memberUserId);

  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [progressCount, progressLast30Days, latestProgress, activeSubscriptionCount, successfulPayments] =
    await prisma.$transaction([
      prisma.progress.count({ where: { userId: memberUserId } }),
      prisma.progress.count({ where: { userId: memberUserId, recordedAt: { gte: thirtyDaysAgo } } }),
      prisma.progress.findFirst({
        where: { userId: memberUserId },
        orderBy: { recordedAt: "desc" },
        select: { bmi: true },
      }),
      prisma.subscription.count({
        where: { userId: memberUserId, ...getActiveSubscriptionWhere() },
      }),
      prisma.payment.count({
        where: { userId: memberUserId, status: PaymentStatus.SUCCESS },
      }),
    ]);

  const computed = generateBadges({
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

export async function canReadAchievements(
  requester: { userId: string; role: Role },
  memberUserId: string,
): Promise<boolean> {
  if (requester.role === Role.ADMIN) return true;
  if (requester.role === Role.MEMBER && requester.userId === memberUserId) return true;
  if (requester.role === Role.TRAINER) {
    return trainerCanReadMember(requester.userId, memberUserId);
  }
  return false;
}
