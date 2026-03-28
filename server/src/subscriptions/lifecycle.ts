import { Prisma, SubscriptionStatus } from "@prisma/client";

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function todayUtc(now = new Date()): Date {
  return startOfUtcDay(now);
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfUtcDay(next);
}

export function buildSubscriptionPeriod(durationDays: number, startDate = new Date()): {
  startDate: Date;
  endDate: Date;
} {
  const normalizedStart = startOfUtcDay(startDate);
  return {
    startDate: normalizedStart,
    endDate: addUtcDays(normalizedStart, durationDays),
  };
}

export function getEffectiveSubscriptionStatus(
  status: SubscriptionStatus,
  endDate: Date,
  now = new Date(),
): SubscriptionStatus {
  const today = todayUtc(now);

  if (status === SubscriptionStatus.ACTIVE) {
    return endDate < today ? SubscriptionStatus.EXPIRED : SubscriptionStatus.ACTIVE;
  }

  if (status === SubscriptionStatus.CANCELLED_AT_PERIOD_END) {
    return endDate < today ? SubscriptionStatus.CANCELLED : SubscriptionStatus.CANCELLED_AT_PERIOD_END;
  }

  return status;
}

export function getActiveSubscriptionWhere(now = new Date()): Prisma.SubscriptionWhereInput {
  return {
    status: {
      in: [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELLED_AT_PERIOD_END,
      ],
    },
    endDate: { gte: todayUtc(now) },
  };
}

export function getExpiredSubscriptionWhere(now = new Date()): Prisma.SubscriptionWhereInput {
  return {
    OR: [
      { status: SubscriptionStatus.EXPIRED },
      {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lt: todayUtc(now) },
      },
    ],
  };
}

export function getCancelledAtPeriodEndSubscriptionWhere(now = new Date()): Prisma.SubscriptionWhereInput {
  return {
    status: SubscriptionStatus.CANCELLED_AT_PERIOD_END,
    endDate: { gte: todayUtc(now) },
  };
}

export function getCancelledSubscriptionWhere(now = new Date()): Prisma.SubscriptionWhereInput {
  return {
    OR: [
      { status: SubscriptionStatus.CANCELLED },
      {
        status: SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        endDate: { lt: todayUtc(now) },
      },
    ],
  };
}

export function getOverlapBlockingSubscriptionWhere(
  startDate: Date,
  endDate: Date,
): Prisma.SubscriptionWhereInput {
  return {
    status: {
      in: [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        SubscriptionStatus.PENDING_ACTIVATION,
      ],
    },
    startDate: { lte: endDate },
    NOT: { endDate: { lt: startDate } },
  };
}

export function getSubscriptionStatusWhere(
  status: SubscriptionStatus | undefined,
  now = new Date(),
): Prisma.SubscriptionWhereInput {
  if (!status) {
    return {};
  }

  if (status === SubscriptionStatus.ACTIVE) {
    return getActiveSubscriptionWhere(now);
  }

  if (status === SubscriptionStatus.EXPIRED) {
    return getExpiredSubscriptionWhere(now);
  }

  if (status === SubscriptionStatus.CANCELLED_AT_PERIOD_END) {
    return getCancelledAtPeriodEndSubscriptionWhere(now);
  }

  if (status === SubscriptionStatus.CANCELLED) {
    return getCancelledSubscriptionWhere(now);
  }

  return { status };
}
