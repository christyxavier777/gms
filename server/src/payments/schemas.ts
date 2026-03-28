import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

const upiRegex = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

export const createPaymentSchema = z
  .object({
    userId: z.string().uuid("userId must be a valid UUID"),
    subscriptionId: z.string().uuid("subscriptionId must be a valid UUID").optional(),
    amount: z.number().positive("amount must be positive").max(1000000, "amount exceeds allowed limit"),
    upiId: z.string().trim().regex(upiRegex, "upiId must be a valid UPI handle"),
    proofReference: z
      .string()
      .trim()
      .min(3, "proofReference must be at least 3 characters long")
      .max(500, "proofReference must be 500 characters or fewer")
      .optional(),
  })
  .strict();

export const paymentIdParamSchema = z.object({
  id: z.string().uuid("payment id must be a valid UUID"),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).default(""),
  status: z.enum([PaymentStatus.PENDING, PaymentStatus.SUCCESS, PaymentStatus.FAILED]).optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "amountMinor"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updatePaymentStatusSchema = z
  .object({
    status: z.enum([PaymentStatus.PENDING, PaymentStatus.SUCCESS, PaymentStatus.FAILED]),
    verificationNotes: z.string().trim().max(240, "verificationNotes must be 240 characters or fewer").optional(),
  })
  .strict();
