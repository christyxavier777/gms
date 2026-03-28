"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDietPlanSchema = exports.updateDietPlanSchema = exports.createDietPlanSchema = exports.dietPlanIdParamSchema = void 0;
const zod_1 = require("zod");
const maxPlanTitleLength = 120;
const maxPlanDescriptionLength = 2000;
const dietPlanTitleSchema = zod_1.z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(maxPlanTitleLength, `Title must be ${maxPlanTitleLength} characters or fewer`);
const dietPlanDescriptionSchema = zod_1.z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(maxPlanDescriptionLength, `Description must be ${maxPlanDescriptionLength} characters or fewer`);
exports.dietPlanIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Diet plan id must be a valid UUID"),
});
exports.createDietPlanSchema = zod_1.z
    .object({
    title: dietPlanTitleSchema,
    description: dietPlanDescriptionSchema,
})
    .strict();
exports.updateDietPlanSchema = zod_1.z
    .object({
    title: dietPlanTitleSchema.optional(),
    description: dietPlanDescriptionSchema.optional(),
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