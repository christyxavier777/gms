import test from "node:test";
import assert from "node:assert/strict";
import { HttpError } from "../middleware/http-error";
import { __wearableInternals } from "../integrations/service";
import { wearableSyncSchema } from "../integrations/schemas";

test("wearable sync normalizes metrics and computes BMI from weight/height", () => {
  const payload = wearableSyncSchema.parse({
    source: "FITBIT",
    metrics: {
      weightKg: 72,
      heightM: 1.8,
      bodyFatPct: 18,
    },
  });

  const normalized = __wearableInternals.normalizeMetrics(payload);
  assert.equal(normalized.weight, 72);
  assert.equal(normalized.height, 1.8);
  assert.equal(normalized.bmi, 22.22);
});

test("wearable sync supports nested payload fallback fields", () => {
  const payload = wearableSyncSchema.parse({
    source: "APPLE_WATCH",
    payload: {
      weight: 80,
      bmi: 24.5,
    },
  });

  const normalized = __wearableInternals.normalizeMetrics(payload);
  assert.equal(normalized.weight, 80);
  assert.equal(normalized.bmi, 24.5);
});

test("wearable sync rejects future recordedAt", () => {
  const payload = wearableSyncSchema.parse({
    source: "GENERIC",
    recordedAt: new Date(Date.now() + 60_000).toISOString(),
    metrics: { bmi: 23 },
  });

  assert.throws(
    () => __wearableInternals.normalizeMetrics(payload),
    (error) => error instanceof HttpError && error.code === "INVALID_TIMESTAMP",
  );
});
