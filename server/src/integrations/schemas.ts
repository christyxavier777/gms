import { z } from "zod";

const metricValue = z.number().positive().nullable().optional();
const bodyFatValue = z.number().min(0).max(100).nullable().optional();

const wearableSyncBaseSchema = z
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
  .strict();

export const wearableSyncSchema = wearableSyncBaseSchema.refine((input) => Boolean(input.metrics || input.payload), {
  message: "Either metrics or payload must be provided",
});

export type WearableSyncInput = z.infer<typeof wearableSyncSchema>;

export const wearableWebhookSyncSchema = wearableSyncBaseSchema
  .extend({
    memberUserId: z.string().uuid("memberUserId must be a valid UUID"),
  })
  .refine((input) => Boolean(input.metrics || input.payload), {
    message: "Either metrics or payload must be provided",
  });

export type WearableWebhookSyncInput = z.infer<typeof wearableWebhookSyncSchema>;
