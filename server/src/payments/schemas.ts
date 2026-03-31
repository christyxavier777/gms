import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

const upiRegex = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

export const createPaymentSchema = z
  .object({
    userId: z.string().uuid("userId must be a valid UUID"),
    subscriptionId: z.string().uuid("subscriptionId must be a valid UUID").optional(),
    planId: z.string().trim().min(1, "planId is required").optional(),
    amount: z.number().positive("amount must be positive").max(1000000, "amount exceeds allowed limit"),
    upiId: z.string().trim().regex(upiRegex, "upiId must be a valid UPI handle"),
    proofReference: z
      .string()
      .trim()
      .min(3, "proofReference must be at least 3 characters long")
      .max(500, "proofReference must be 500 characters or fewer")
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.subscriptionId && value.planId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either subscriptionId or planId, not both",
        path: ["planId"],
      });
    }
  });

export const createRazorpayOrderSchema = z
  .object({
    subscriptionId: z.string().uuid("subscriptionId must be a valid UUID").optional(),
    planId: z.string().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.subscriptionId && !value.planId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide subscriptionId or planId",
        path: ["planId"],
      });
    }
    if (value.subscriptionId && value.planId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either subscriptionId or planId, not both",
        path: ["planId"],
      });
    }
  });

export const verifyRazorpayPaymentSchema = z
  .object({
    paymentId: z.string().uuid("paymentId must be a valid UUID"),
    razorpayOrderId: z.string().min(1, "razorpayOrderId is required"),
    razorpayPaymentId: z.string().min(1, "razorpayPaymentId is required"),
    razorpaySignature: z.string().min(1, "razorpaySignature is required"),
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
