import { z } from "zod";

export const subscriptionIdParamSchema = z.object({
  id: z.string().uuid("Subscription id must be a valid UUID"),
});

export const createSubscriptionSchema = z
  .object({
    userId: z.string().uuid("userId must be a valid UUID"),
    planName: z.string().trim().min(1, "planName is required"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .strict()
  .refine((payload) => payload.startDate <= payload.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"],
  });
