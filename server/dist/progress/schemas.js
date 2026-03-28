"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProgressQuerySchema = exports.progressUserIdParamSchema = exports.progressIdParamSchema = exports.createProgressSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.createProgressSchema = zod_1.z
    .object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
    weight: zod_1.z.number().positive().nullable().optional(),
    height: zod_1.z.number().positive().nullable().optional(),
    bodyFat: zod_1.z.number().min(0).max(100).nullable().optional(),
    bmi: zod_1.z.number().positive().nullable().optional(),
    notes: zod_1.z.string().trim().max(2000).nullable().optional(),
    recordedAt: zod_1.z.coerce.date(),
})
    .strict()
    .refine((payload) => payload.weight !== undefined ||
    payload.height !== undefined ||
    payload.bodyFat !== undefined ||
    payload.bmi !== undefined ||
    (payload.notes !== undefined && payload.notes !== null && payload.notes.trim().length > 0), {
    message: "At least one metric or notes entry is required",
})
    .refine((payload) => payload.recordedAt <= new Date(), {
    message: "recordedAt cannot be in the future",
    path: ["recordedAt"],
})
    .refine((payload) => payload.height === undefined || payload.height === null || payload.height <= 2.6, {
    message: "height must be in meters (for example: 1.75)",
    path: ["height"],
});
exports.progressIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Progress id must be a valid UUID"),
});
exports.progressUserIdParamSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid("userId must be a valid UUID"),
});
exports.listProgressQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().trim().max(100).default(""),
    dietCategory: zod_1.z
        .enum([
        client_1.DietCategory.UNDERWEIGHT,
        client_1.DietCategory.NORMAL,
        client_1.DietCategory.OVERWEIGHT,
        client_1.DietCategory.OBESE,
    ])
        .optional(),
    sortBy: zod_1.z.enum(["recordedAt", "createdAt"]).default("recordedAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
//# sourceMappingURL=schemas.js.map