# Subscription Code Sample

This is a document-ready sample based on the actual subscription logic in this project.

Original source file:
- `server/src/subscriptions/service.ts`

```ts
import { SubscriptionStatus } from "@prisma/client";
import { createPrismaClient } from "../prisma/client";
import { HttpError } from "../middleware/http-error";
import { buildSubscriptionPeriod, startOfUtcDay, todayUtc } from "./lifecycle";

const prisma = createPrismaClient();

async function createSubscription(input: {
  userId: string;
  planId: string;
  startDate: Date;
}) {
  const today = todayUtc();
  const normalizedStart = startOfUtcDay(input.startDate);

  if (normalizedStart > today) {
    throw new HttpError(400, "INVALID_SUBSCRIPTION_DATES", "startDate cannot be in the future");
  }

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: input.planId },
    select: { id: true, name: true, durationDays: true, active: true },
  });

  if (!plan || !plan.active) {
    throw new HttpError(400, "INVALID_PLAN_ID", "Selected plan is not available");
  }

  const { endDate } = buildSubscriptionPeriod(plan.durationDays, normalizedStart);

  const overlapping = await prisma.subscription.findFirst({
    where: {
      userId: input.userId,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.CANCELLED_AT_PERIOD_END,
          SubscriptionStatus.PENDING_ACTIVATION,
        ],
      },
      startDate: { lte: endDate },
      NOT: { endDate: { lt: normalizedStart } },
    },
  });

  if (overlapping) {
    throw new HttpError(409, "ACTIVE_SUBSCRIPTION_OVERLAP", "An active subscription already exists");
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: input.userId,
      planId: plan.id,
      planName: plan.name,
      startDate: normalizedStart,
      endDate,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  return subscription;
}

async function createOnboardingSubscription(memberUserId: string, planId: string) {
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: planId },
    select: { id: true, name: true, durationDays: true, active: true },
  });

  if (!plan || !plan.active) {
    throw new HttpError(400, "INVALID_PLAN_ID", "Selected plan is not available");
  }

  const { startDate, endDate } = buildSubscriptionPeriod(plan.durationDays, todayUtc());

  return prisma.subscription.create({
    data: {
      userId: memberUserId,
      planId: plan.id,
      planName: plan.name,
      startDate,
      endDate,
      status: SubscriptionStatus.PENDING_ACTIVATION,
    },
  });
}

async function getMySubscription(memberUserId: string) {
  return prisma.subscription.findFirst({
    where: {
      userId: memberUserId,
      OR: [
        {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED_AT_PERIOD_END],
          },
          endDate: { gte: todayUtc() },
        },
        { status: SubscriptionStatus.PENDING_ACTIVATION },
      ],
    },
    orderBy: [{ createdAt: "desc" }],
  });
}
```

Suggested caption:

`Sample code for subscription creation, onboarding activation state, and retrieval of the current member subscription.`
