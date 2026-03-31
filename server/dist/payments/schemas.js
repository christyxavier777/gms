"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentStatusSchema = exports.listPaymentsQuerySchema = exports.paymentIdParamSchema = exports.verifyRazorpayPaymentSchema = exports.createRazorpayOrderSchema = exports.createPaymentSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const upiRegex = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;
exports.createPaymentSchema = zod_1.z
    .object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
    subscriptionId: zod_1.z.string().uuid("subscriptionId must be a valid UUID").optional(),
    planId: zod_1.z.string().trim().min(1, "planId is required").optional(),
    amount: zod_1.z.number().positive("amount must be positive").max(1000000, "amount exceeds allowed limit"),
    upiId: zod_1.z.string().trim().regex(upiRegex, "upiId must be a valid UPI handle"),
    proofReference: zod_1.z
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
            code: zod_1.z.ZodIssueCode.custom,
            message: "Provide either subscriptionId or planId, not both",
            path: ["planId"],
        });
    }
});
exports.createRazorpayOrderSchema = zod_1.z
    .object({
    subscriptionId: zod_1.z.string().uuid("subscriptionId must be a valid UUID").optional(),
    planId: zod_1.z.string().optional(),
})
    .strict()
    .superRefine((value, ctx) => {
    if (!value.subscriptionId && !value.planId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Provide subscriptionId or planId",
            path: ["planId"],
        });
    }
    if (value.subscriptionId && value.planId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Provide either subscriptionId or planId, not both",
            path: ["planId"],
        });
    }
});
exports.verifyRazorpayPaymentSchema = zod_1.z
    .object({
    paymentId: zod_1.z.string().uuid("paymentId must be a valid UUID"),
    razorpayOrderId: zod_1.z.string().min(1, "razorpayOrderId is required"),
    razorpayPaymentId: zod_1.z.string().min(1, "razorpayPaymentId is required"),
    razorpaySignature: zod_1.z.string().min(1, "razorpaySignature is required"),
})
    .strict();
exports.paymentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("payment id must be a valid UUID"),
});
exports.listPaymentsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().trim().max(100).default(""),
    status: zod_1.z.enum([client_1.PaymentStatus.PENDING, client_1.PaymentStatus.SUCCESS, client_1.PaymentStatus.FAILED]).optional(),
    sortBy: zod_1.z.enum(["createdAt", "updatedAt", "amountMinor"]).default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
exports.updatePaymentStatusSchema = zod_1.z
    .object({
    status: zod_1.z.enum([client_1.PaymentStatus.PENDING, client_1.PaymentStatus.SUCCESS, client_1.PaymentStatus.FAILED]),
    verificationNotes: zod_1.z.string().trim().max(240, "verificationNotes must be 240 characters or fewer").optional(),
})
    .strict();
//# sourceMappingURL=schemas.js.map