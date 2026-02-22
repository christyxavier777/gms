"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubscriptionSchema = exports.subscriptionIdParamSchema = void 0;
const zod_1 = require("zod");
exports.subscriptionIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Subscription id must be a valid UUID"),
});
exports.createSubscriptionSchema = zod_1.z
    .object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
    planName: zod_1.z.string().trim().min(1, "planName is required"),
    startDate: zod_1.z.coerce.date(),
    endDate: zod_1.z.coerce.date(),
})
    .strict()
    .refine((payload) => payload.startDate <= payload.endDate, {
    message: "startDate must be before or equal to endDate",
    path: ["startDate"],
});
//# sourceMappingURL=schemas.js.map