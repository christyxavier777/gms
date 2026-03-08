import { z } from "zod";

const metricValue = z.number().positive().nullable().optional();
const bodyFatValue = z.number().min(0).max(100).nullable().optional();

export const wearableSyncSchema = z
  .object({
    source: z.enum(["FITBIT", "APPLE_WATCH", "GENERIC"]),
    recordedAt: z.coerce.date().optional(),
    metrics: z
      .object({
        weightKg: metricValue,
        heightM: metricValue,
        bodyFatPct: bodyFatValue,
        bmi: metricValue,
      })
      .strict()
      .optional(),
    payload: z
      .object({
        weight: metricValue,
        height: metricValue,
        bodyFat: bodyFatValue,
        bmi: metricValue,
        timestamp: z.coerce.date().optional(),
      })
      .strict()
      .optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((input) => Boolean(input.metrics || input.payload), {
    message: "Either metrics or payload must be provided",
  });

export type WearableSyncInput = z.infer<typeof wearableSyncSchema>;
