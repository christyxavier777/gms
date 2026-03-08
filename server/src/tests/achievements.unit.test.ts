import test from "node:test";
import assert from "node:assert/strict";
import { generateBadges } from "../achievements/engine";

test("generateBadges awards consistency tiers and points", () => {
  const bronze = generateBadges({
    progressCount: 5,
    progressLast30Days: 0,
    latestBmi: null,
    hasActiveSubscription: false,
    successfulPayments: 0,
  });
  const silver = generateBadges({
    progressCount: 15,
    progressLast30Days: 0,
    latestBmi: null,
    hasActiveSubscription: false,
    successfulPayments: 0,
  });
  const gold = generateBadges({
    progressCount: 30,
    progressLast30Days: 0,
    latestBmi: null,
    hasActiveSubscription: false,
    successfulPayments: 0,
  });

  assert.equal(bronze.badges.find((b) => b.code === "CONSISTENCY")?.tier, "BRONZE");
  assert.equal(silver.badges.find((b) => b.code === "CONSISTENCY")?.tier, "SILVER");
  assert.equal(gold.badges.find((b) => b.code === "CONSISTENCY")?.tier, "GOLD");
});

test("generateBadges awards BMI and momentum badges on thresholds", () => {
  const summary = generateBadges({
    progressCount: 1,
    progressLast30Days: 8,
    latestBmi: 22.1,
    hasActiveSubscription: false,
    successfulPayments: 0,
  });

  assert.equal(summary.badges.find((b) => b.code === "BMI_BALANCE")?.earned, true);
  assert.equal(summary.badges.find((b) => b.code === "MOMENTUM")?.earned, true);
});

test("generateBadges awards commitment for active subscription or payment history", () => {
  const byActiveSubscription = generateBadges({
    progressCount: 0,
    progressLast30Days: 0,
    latestBmi: null,
    hasActiveSubscription: true,
    successfulPayments: 0,
  });
  const byPayments = generateBadges({
    progressCount: 0,
    progressLast30Days: 0,
    latestBmi: null,
    hasActiveSubscription: false,
    successfulPayments: 2,
  });

  assert.equal(byActiveSubscription.badges.find((b) => b.code === "PLAN_COMMITMENT")?.earned, true);
  assert.equal(byPayments.badges.find((b) => b.code === "PLAN_COMMITMENT")?.earned, true);
});
