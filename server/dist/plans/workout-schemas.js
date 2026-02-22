"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignWorkoutPlanSchema = exports.updateWorkoutPlanSchema = exports.createWorkoutPlanSchema = exports.workoutPlanIdParamSchema = void 0;
const zod_1 = require("zod");
exports.workoutPlanIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Workout plan id must be a valid UUID"),
});
exports.createWorkoutPlanSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1, "Title is required"),
    description: zod_1.z.string().trim().min(1, "Description is required"),
})
    .strict();
exports.updateWorkoutPlanSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(1).optional(),
    description: zod_1.z.string().trim().min(1).optional(),
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