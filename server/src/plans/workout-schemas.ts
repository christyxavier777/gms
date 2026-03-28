import { z } from "zod";

const maxPlanTitleLength = 120;
const maxPlanDescriptionLength = 2000;

const workoutPlanTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(maxPlanTitleLength, `Title must be ${maxPlanTitleLength} characters or fewer`);

const workoutPlanDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(
    maxPlanDescriptionLength,
    `Description must be ${maxPlanDescriptionLength} characters or fewer`,
  );

export const workoutPlanIdParamSchema = z.object({
  id: z.string().uuid("Workout plan id must be a valid UUID"),
});

export const createWorkoutPlanSchema = z
  .object({
    title: workoutPlanTitleSchema,
    description: workoutPlanDescriptionSchema,
  })
  .strict();

export const updateWorkoutPlanSchema = z
  .object({
    title: workoutPlanTitleSchema.optional(),
    description: workoutPlanDescriptionSchema.optional(),
  })
  .strict()
  .refine((payload) => payload.title !== undefined || payload.description !== undefined, {
    message: "At least one field must be provided",
  });

export const assignWorkoutPlanSchema = z
  .object({
    memberId: z.string().uuid("memberId must be a valid UUID"),
  })
  .strict();
