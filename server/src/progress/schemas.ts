import { DietCategory } from "@prisma/client";
import { z } from "zod";

export const createProgressSchema = z
  .object({
    userId: z.string().uuid("userId must be a valid UUID"),
    weight: z.number().positive().nullable().optional(),
    height: z.number().positive().nullable().optional(),
    bodyFat: z.number().min(0).max(100).nullable().optional(),
    bmi: z.number().positive().nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    recordedAt: z.coerce.date(),
  })
  .strict()
  .refine(
    (payload) =>
      payload.weight !== undefined ||
      payload.height !== undefined ||
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
  })
  .refine(
    (payload) =>
      payload.height === undefined || payload.height === null || payload.height <= 2.6,
    {
      message: "height must be in meters (for example: 1.75)",
      path: ["height"],
    },
  );

export const progressIdParamSchema = z.object({
  id: z.string().uuid("Progress id must be a valid UUID"),
});

export const progressUserIdParamSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
});

export const listProgressQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).default(""),
  dietCategory: z
    .enum([
      DietCategory.UNDERWEIGHT,
      DietCategory.NORMAL,
      DietCategory.OVERWEIGHT,
      DietCategory.OBESE,
    ])
    .optional(),
  sortBy: z.enum(["recordedAt", "createdAt"]).default("recordedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
