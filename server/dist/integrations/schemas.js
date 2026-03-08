"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wearableWebhookSyncSchema = exports.wearableSyncSchema = void 0;
const zod_1 = require("zod");
const metricValue = zod_1.z.number().positive().nullable().optional();
const bodyFatValue = zod_1.z.number().min(0).max(100).nullable().optional();
const wearableSyncBaseSchema = zod_1.z
    .object({
    source: zod_1.z.enum(["FITBIT", "APPLE_WATCH", "GENERIC"]),
    recordedAt: zod_1.z.coerce.date().optional(),
    metrics: zod_1.z
        .object({
        weightKg: metricValue,
        heightM: metricValue,
        bodyFatPct: bodyFatValue,
        bmi: metricValue,
    })
        .strict()
        .optional(),
    payload: zod_1.z
        .object({
        weight: metricValue,
        height: metricValue,
        bodyFat: bodyFatValue,
        bmi: metricValue,
        timestamp: zod_1.z.coerce.date().optional(),
    })
        .strict()
        .optional(),
    note: zod_1.z.string().trim().max(500).optional(),
})
    .strict();
exports.wearableSyncSchema = wearableSyncBaseSchema.refine((input) => Boolean(input.metrics || input.payload), {
    message: "Either metrics or payload must be provided",
});
exports.wearableWebhookSyncSchema = wearableSyncBaseSchema
    .extend({
    memberUserId: zod_1.z.string().uuid("memberUserId must be a valid UUID"),
})
    .refine((input) => Boolean(input.metrics || input.payload), {
    message: "Either metrics or payload must be provided",
});
//# sourceMappingURL=schemas.js.map