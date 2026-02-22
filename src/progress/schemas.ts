import { z } from "zod";

export const createProgressSchema = z
  .object({
    userId: z.string().uuid("userId must be a valid UUID"),
    weight: z.number().positive().nullable().optional(),
    bodyFat: z.number().min(0).max(100).nullable().optional(),
    bmi: z.number().positive().nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    recordedAt: z.coerce.date(),
  })
  .strict()
  .refine(
    (payload) =>
      payload.weight !== undefined ||
      payload.bodyFat !== undefined ||
      payload.bmi !== undefined ||
      (payload.notes !== undefined && payload.notes !== null && payload.notes.trim().length > 0),
    {
      message: "At least one metric or notes entry is required",
    },
  )
  .refine((payload) => payload.recordedAt <= new Date(), {
    message: "recordedAt cannot be in the future",
    path: ["recordedAt"],
  });

export const progressIdParamSchema = z.object({
  id: z.string().uuid("Progress id must be a valid UUID"),
});

export const progressUserIdParamSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
});
