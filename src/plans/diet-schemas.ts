import { z } from "zod";

export const dietPlanIdParamSchema = z.object({
  id: z.string().uuid("Diet plan id must be a valid UUID"),
});

export const createDietPlanSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().min(1, "Description is required"),
  })
  .strict();

export const updateDietPlanSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
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
