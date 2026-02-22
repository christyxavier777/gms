"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDietPlanSchema = exports.updateDietPlanSchema = exports.createDietPlanSchema = exports.dietPlanIdParamSchema = void 0;
const zod_1 = require("zod");
exports.dietPlanIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Diet plan id must be a valid UUID"),
});
exports.createDietPlanSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1, "Title is required"),
    description: zod_1.z.string().trim().min(1, "Description is required"),
})
    .strict();
exports.updateDietPlanSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1).optional(),
    description: zod_1.z.string().trim().min(1).optional(),
})
    .strict()
    .refine((payload) => payload.title !== undefined || payload.description !== undefined, {
    message: "At least one field must be provided",
});
exports.assignDietPlanSchema = zod_1.z
    .object({
    memberId: zod_1.z.string().uuid("memberId must be a valid UUID"),
})
    .strict();
//# sourceMappingURL=diet-schemas.js.map