import test from "node:test";
import assert from "node:assert/strict";
import { calculateBmi, categorizeBmi } from "../progress/bmi";

test("calculateBmi computes BMI from weight and height", () => {
  const bmi = calculateBmi(70, 1.75);
  assert.equal(bmi, 22.86);
});

test("categorizeBmi assigns Underweight/Normal/Overweight/Obese", () => {
  assert.equal(categorizeBmi(17.5), "UNDERWEIGHT");
  assert.equal(categorizeBmi(22.2), "NORMAL");
  assert.equal(categorizeBmi(27.1), "OVERWEIGHT");
  assert.equal(categorizeBmi(33.8), "OBESE");
});

test("calculateBmi rejects unrealistic inputs", () => {
  assert.throws(() => calculateBmi(-1, 1.8));
  assert.throws(() => calculateBmi(60, 0));
  assert.throws(() => calculateBmi(Number.NaN, 1.8));
});
