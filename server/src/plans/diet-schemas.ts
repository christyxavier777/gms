import { z } from "zod";

const maxPlanTitleLength = 120;
const maxPlanDescriptionLength = 2000;

const dietPlanTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(maxPlanTitleLength, `Title must be ${maxPlanTitleLength} characters or fewer`);

const dietPlanDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required")
  .max(
    maxPlanDescriptionLength,
    `Description must be ${maxPlanDescriptionLength} characters or fewer`,
  );

export const dietPlanIdParamSchema = z.object({
  id: z.string().uuid("Diet plan id must be a valid UUID"),
});

export const createDietPlanSchema = z
  .object({
    title: dietPlanTitleSchema,
    description: dietPlanDescriptionSchema,
  })
  .strict();

export const updateDietPlanSchema = z
  .object({
    title: dietPlanTitleSchema.optional(),
    description: dietPlanDescriptionSchema.optional(),
  })
  .strict()
  .refine((payload) => payload.title !== undefined || payload.description !== undefined, {
    message: "At least one field must be provided",
  });

export const assignDietPlanSchema = z
  .object({
    memberId: z.string().uuid("memberId must be a valid UUID"),
  })
  .strict();
