"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentStatusSchema = exports.listPaymentsQuerySchema = exports.paymentIdParamSchema = exports.createPaymentSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const upiRegex = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;
exports.createPaymentSchema = zod_1.z
    .object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
    subscriptionId: zod_1.z.string().uuid("subscriptionId must be a valid UUID").optional(),
    amount: zod_1.z.number().positive("amount must be positive").max(1000000, "amount exceeds allowed limit"),
    upiId: zod_1.z.string().trim().regex(upiRegex, "upiId must be a valid UPI handle"),
    proofReference: zod_1.z
        .string()
        .trim()
        .min(3, "proofReference must be at least 3 characters long")
        .max(500, "proofReference must be 500 characters or fewer")
        .optional(),
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