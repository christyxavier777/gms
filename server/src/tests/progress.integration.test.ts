import test from "node:test";
import assert from "node:assert/strict";
import { createProgressSchema } from "../progress/schemas";

test("progress schema accepts valid payload", () => {
  const payload = createProgressSchema.parse({
    userId: "11111111-1111-1111-1111-111111111111",
    weight: 72,
    height: 1.75,
    recordedAt: new Date().toISOString(),
  });

  assert.equal(payload.weight, 72);
  assert.equal(payload.height, 1.75);
});

test("progress schema rejects non-numeric and negative metrics", () => {
  assert.throws(() =>
    createProgressSchema.parse({
      userId: "11111111-1111-1111-1111-111111111111",
      weight: -72,
      height: 1.75,
      recordedAt: new Date().toISOString(),
    }),
  );

  assert.throws(() =>
    createProgressSchema.parse({
      userId: "11111111-1111-1111-1111-111111111111",
      weight: "abc",
      height: 1.75,
      recordedAt: new Date().toISOString(),
    }),
  );
});
