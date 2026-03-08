export type BadgeTier = "BRONZE" | "SILVER" | "GOLD";

export type Badge = {
  code: "CONSISTENCY" | "BMI_BALANCE" | "PLAN_COMMITMENT" | "MOMENTUM";
  title: string;
  description: string;
  earned: boolean;
  points: number;
  tier?: BadgeTier;
};

export type BadgeEngineInput = {
  progressCount: number;
  progressLast30Days: number;
  latestBmi: number | null;
  hasActiveSubscription: boolean;
  successfulPayments: number;
};

function consistencyTier(progressCount: number): { earned: boolean; tier?: BadgeTier; points: number } {
  if (progressCount >= 30) return { earned: true, tier: "GOLD", points: 120 };
  if (progressCount >= 15) return { earned: true, tier: "SILVER", points: 80 };
  if (progressCount >= 5) return { earned: true, tier: "BRONZE", points: 40 };
  return { earned: false, points: 0 };
}

export function generateBadges(input: BadgeEngineInput): { totalPoints: number; badges: Badge[] } {
  const consistency = consistencyTier(input.progressCount);
  const bmiBalanced = input.latestBmi !== null && input.latestBmi >= 18.5 && input.latestBmi <= 24.9;
  const momentum = input.progressLast30Days >= 8;
  const commitment = input.hasActiveSubscription || input.successfulPayments >= 2;

  const badges: Badge[] = [
    {
      code: "CONSISTENCY",
      title: "Consistency Champion",
      description: "Log regular progress entries to build long-term habits.",
      earned: consistency.earned,
      points: consistency.points,
      ...(consistency.tier ? { tier: consistency.tier } : {}),
    },
    {
      code: "BMI_BALANCE",
      title: "BMI Balance",
      description: "Reach and maintain a BMI in the normal range.",
      earned: bmiBalanced,
      points: bmiBalanced ? 60 : 0,
      ...(bmiBalanced ? { tier: "SILVER" as BadgeTier } : {}),
    },
    {
      code: "PLAN_COMMITMENT",
      title: "Plan Commitment",
      description: "Stay committed with active plans and successful payment milestones.",
      earned: commitment,
      points: commitment ? 45 : 0,
      ...(commitment ? { tier: "BRONZE" as BadgeTier } : {}),
    },
    {
      code: "MOMENTUM",
      title: "Momentum",
      description: "Record at least 8 progress updates in the last 30 days.",
      earned: momentum,
      points: momentum ? 55 : 0,
      ...(momentum ? { tier: "SILVER" as BadgeTier } : {}),
    },
  ];

  return {
    badges,
    totalPoints: badges.reduce((sum, badge) => sum + badge.points, 0),
  };
}
