import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../auth/schemas";
import { createDietPlanSchema } from "../plans/diet-schemas";
import { createWorkoutPlanSchema } from "../plans/workout-schemas";
import { createScheduleSessionSchema } from "../schedule/schemas";

test("register schema rejects oversized names and invite codes", () => {
  assert.throws(() =>
    registerSchema.parse({
      name: "x".repeat(81),
      email: "jordan.lee@example.com",
      phone: "9876543210",
      password: "StrongPass1",
      role: "TRAINER",
      inviteCode: "x".repeat(65),
    }),
  );
});

test("login schema rejects oversized passwords and unexpected fields", () => {
  assert.throws(() =>
    loginSchema.parse({
      email: "coach@fitnessgarage.in",
      password: "x".repeat(129),
    }),
  );

  assert.throws(() =>
    loginSchema.parse({
      email: "coach@fitnessgarage.in",
      password: "StrongPass1",
      unexpected: true,
    }),
  );
});

test("plan schemas reject oversized titles and descriptions", () => {
  assert.throws(() =>
    createWorkoutPlanSchema.parse({
      title: "x".repeat(121),
      description: "Core work and mobility",
    }),
  );

  assert.throws(() =>
    createDietPlanSchema.parse({
      title: "Lean bulk",
      description: "x".repeat(2001),
    }),
  );
});

test("schedule session schema rejects blank optional text fields and unknown properties", () => {
  assert.throws(() =>
    createScheduleSessionSchema.parse({
      title: "Morning conditioning",
      description: "   ",
      sessionType: "CLASS",
      startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      capacity: 12,
    }),
  );

  assert.throws(() =>
    createScheduleSessionSchema.parse({
      title: "Morning conditioning",
      sessionType: "CLASS",
      startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      capacity: 12,
      extraField: true,
    }),
  );
});
