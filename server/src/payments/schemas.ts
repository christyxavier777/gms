import { z } from "zod";

const upiRegex = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

export const createPaymentSchema = z
  .object({
    userId: z.string().uuid("userId must be a valid UUID"),
    subscriptionId: z.string().uuid("subscriptionId must be a valid UUID").optional(),
    amount: z.number().positive("amount must be positive"),
    upiId: z.string().trim().regex(upiRegex, "upiId must be a valid UPI handle"),
  })
  .strict();

export const paymentIdParamSchema = z.object({
  id: z.string().uuid("payment id must be a valid UUID"),
});
