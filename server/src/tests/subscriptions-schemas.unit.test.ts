import test from "node:test";
import assert from "node:assert/strict";
import { createOnboardingSubscriptionSchema, createSubscriptionSchema } from "../subscriptions/schemas";

test("create subscription schema accepts planId and server-derived end dates", () => {
  const payload = createSubscriptionSchema.parse({
    userId: "11111111-1111-1111-1111-111111111111",
    planId: "basic-monthly",
    startDate: "2026-03-24",
  });

  assert.equal(payload.planId, "basic-monthly");
  assert.equal(payload.userId, "11111111-1111-1111-1111-111111111111");
  assert.equal(payload.startDate instanceof Date, true);
  assert.equal("endDate" in payload, false);
});

test("create subscription schema rejects legacy free-text planName payloads", () => {
  assert.throws(() =>
    createSubscriptionSchema.parse({
      userId: "11111111-1111-1111-1111-111111111111",
      planName: "Basic Monthly",
      startDate: "2026-03-24",
    }),
  );
});

test("onboarding subscription schema requires a non-empty planId", () => {
  assert.throws(() =>
    createOnboardingSubscriptionSchema.parse({
      planId: "",
    }),
  );
});
