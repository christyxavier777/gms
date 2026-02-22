"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressUserIdParamSchema = exports.progressIdParamSchema = exports.createProgressSchema = void 0;
const zod_1 = require("zod");
exports.createProgressSchema = zod_1.z
    .object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
    weight: zod_1.z.number().positive().nullable().optional(),
    bodyFat: zod_1.z.number().min(0).max(100).nullable().optional(),
    bmi: zod_1.z.number().positive().nullable().optional(),
    notes: zod_1.z.string().trim().max(2000).nullable().optional(),
    recordedAt: zod_1.z.coerce.date(),
})
    .strict()
    .refine((payload) => payload.weight !== undefined ||
    payload.bodyFat !== undefined ||
    payload.bmi !== undefined ||
    (payload.notes !== undefined && payload.notes !== null && payload.notes.trim().length > 0), {
    message: "At least one metric or notes entry is required",
})
    .refine((payload) => payload.recordedAt <= new Date(), {
    message: "recordedAt cannot be in the future",
    path: ["recordedAt"],
});
exports.progressIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Progress id must be a valid UUID"),
});
exports.progressUserIdParamSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
});
//# sourceMappingURL=schemas.js.map