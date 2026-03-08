import test from "node:test";
import assert from "node:assert/strict";
import { DietCategory } from "@prisma/client";
import { buildRecommendation } from "../recommendations/engine";

test("buildRecommendation maps obese BMI to low-impact plan", () => {
  const rec = buildRecommendation({
    latestBmi: 33.4,
    previousBmi: 34.1,
    progressLast30Days: 10,
    hasActiveSubscription: true,
  });

  assert.equal(rec.bmiCategory, DietCategory.OBESE);
  assert.equal(rec.intensity, "BEGINNER");
  assert.equal(rec.cardioMinutesPerWeek, 210);
  assert.equal(rec.strengthSessionsPerWeek, 2);
});

test("buildRecommendation promotes advanced intensity for consistent normal BMI members", () => {
  const rec = buildRecommendation({
    latestBmi: 22.2,
    previousBmi: 22.1,
    progressLast30Days: 8,
    hasActiveSubscription: true,
  });

  assert.equal(rec.bmiCategory, DietCategory.NORMAL);
  assert.equal(rec.intensity, "ADVANCED");
  assert.equal(rec.nextReviewDays, 14);
});

test("buildRecommendation adds conservative checks for low consistency and no active plan", () => {
  const rec = buildRecommendation({
    latestBmi: 27.3,
    previousBmi: 27.9,
    progressLast30Days: 2,
    hasActiveSubscription: false,
  });

  assert.equal(rec.bmiCategory, DietCategory.OVERWEIGHT);
  assert.equal(rec.nextReviewDays, 7);
  assert.ok(rec.reasoning.some((line) => line.includes("No active membership detected")));
  assert.ok(rec.reasoning.some((line) => line.includes("Low recent tracking consistency")));
});
