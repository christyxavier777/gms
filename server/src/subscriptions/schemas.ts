import { SubscriptionStatus } from "@prisma/client";
import { z } from "zod";

const planIdSchema = z
  .string()
  .trim()
  .min(1, "planId is required")
  .max(64, "planId must be 64 characters or fewer");

export const subscriptionIdParamSchema = z.object({
  id: z.string().uuid("Subscription id must be a valid UUID"),
});

export const createSubscriptionSchema = z
  .object({
    userId: z.string().uuid("userId must be a valid UUID"),
    planId: planIdSchema,
    startDate: z.coerce.date(),
  })
  .strict();

export const createOnboardingSubscriptionSchema = z
  .object({
    planId: planIdSchema,
  })
  .strict();

export const listSubscriptionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).default(""),
  status: z
    .enum([
      SubscriptionStatus.PENDING_ACTIVATION,
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.EXPIRED,
      SubscriptionStatus.CANCELLED_AT_PERIOD_END,
      SubscriptionStatus.CANCELLED,
    ])
    .optional(),
  sortBy: z.enum(["createdAt", "startDate", "endDate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
