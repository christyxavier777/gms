"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentIdParamSchema = exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
const upiRegex = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;
exports.createPaymentSchema = zod_1.z
    .object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
    subscriptionId: zod_1.z.string().uuid("subscriptionId must be a valid UUID").optional(),
    amount: zod_1.z.number().positive("amount must be positive"),
    upiId: zod_1.z.string().trim().regex(upiRegex, "upiId must be a valid UPI handle"),
})
    .strict();
exports.paymentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("payment id must be a valid UUID"),
});
//# sourceMappingURL=schemas.js.map