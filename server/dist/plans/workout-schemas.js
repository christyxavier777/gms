"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignWorkoutPlanSchema = exports.updateWorkoutPlanSchema = exports.createWorkoutPlanSchema = exports.workoutPlanIdParamSchema = void 0;
const zod_1 = require("zod");
const maxPlanTitleLength = 120;
const maxPlanDescriptionLength = 2000;
const workoutPlanTitleSchema = zod_1.z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(maxPlanTitleLength, `Title must be ${maxPlanTitleLength} characters or fewer`);
const workoutPlanDescriptionSchema = zod_1.z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(maxPlanDescriptionLength, `Description must be ${maxPlanDescriptionLength} characters or fewer`);
exports.workoutPlanIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Workout plan id must be a valid UUID"),
});
exports.createWorkoutPlanSchema = zod_1.z
    .object({
    title: workoutPlanTitleSchema,
    description: workoutPlanDescriptionSchema,
})
    .strict();
exports.updateWorkoutPlanSchema = zod_1.z
    .object({
    title: workoutPlanTitleSchema.optional(),
    description: workoutPlanDescriptionSchema.optional(),
})
    .strict()
    .refine((payload) => payload.title !== undefined || payload.description !== undefined, {
    message: "At least one field must be provided",
});
exports.assignWorkoutPlanSchema = zod_1.z
    .object({
    memberId: zod_1.z.string().uuid("memberId must be a valid UUID"),
})
    .strict();
//# sourceMappingURL=workout-schemas.js.map