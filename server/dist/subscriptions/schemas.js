"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubscriptionsQuerySchema = exports.createOnboardingSubscriptionSchema = exports.createSubscriptionSchema = exports.subscriptionIdParamSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const planIdSchema = zod_1.z
    .string()
    .trim()
    .min(1, "planId is required")
    .max(64, "planId must be 64 characters or fewer");
exports.subscriptionIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Subscription id must be a valid UUID"),
});
exports.createSubscriptionSchema = zod_1.z
    .object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
    planId: planIdSchema,
    startDate: zod_1.z.coerce.date(),
})
    .strict();
exports.createOnboardingSubscriptionSchema = zod_1.z
    .object({
    planId: planIdSchema,
})
    .strict();
exports.listSubscriptionsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().trim().max(100).default(""),
    status: zod_1.z
        .enum([
        client_1.SubscriptionStatus.PENDING_ACTIVATION,
        client_1.SubscriptionStatus.ACTIVE,
        client_1.SubscriptionStatus.EXPIRED,
        client_1.SubscriptionStatus.CANCELLED_AT_PERIOD_END,
        client_1.SubscriptionStatus.CANCELLED,
    ])
        .optional(),
    sortBy: zod_1.z.enum(["createdAt", "startDate", "endDate"]).default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
//# sourceMappingURL=schemas.js.map