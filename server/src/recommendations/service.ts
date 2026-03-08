import { Role, SubscriptionStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { trainerCanReadMember } from "../users/service";
import { buildRecommendation, PersonalizedRecommendation } from "./engine";

const prisma = createPrismaClient();

async function assertMemberUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  if (user.role !== Role.MEMBER) {
    throw new HttpError(400, "INVALID_MEMBER", "Recommendations are only available for members");
  }
}

export async function canReadRecommendations(
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

export async function getMemberRecommendation(memberUserId: string): Promise<{
  memberUserId: string;
  recommendation: PersonalizedRecommendation;
}> {
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
      where: { userId: memberUserId, status: SubscriptionStatus.ACTIVE },
    }),
  ]);

  const latestBmi = latestProgress[0]?.bmi ?? null;
  const previousBmi = latestProgress[1]?.bmi ?? null;

  if (latestBmi === null) {
    throw new HttpError(
      400,
      "INSUFFICIENT_PROGRESS_DATA",
      "At least one BMI-based progress entry is required for recommendations",
    );
  }

  return {
    memberUserId,
    recommendation: buildRecommendation({
      latestBmi,
      previousBmi,
      progressLast30Days: recentProgress,
      hasActiveSubscription: activeSubCount > 0,
    }),
  };
}
