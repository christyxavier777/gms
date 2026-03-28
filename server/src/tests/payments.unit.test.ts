import test from "node:test";
import assert from "node:assert/strict";
import { fromMinorUnits, generatePaymentTransactionId, toMinorUnits } from "../payments/money";
import { createPaymentSchema } from "../payments/schemas";

test("toMinorUnits converts decimal INR amounts into integer paise", () => {
  assert.equal(toMinorUnits(499.99), 49999);
  assert.equal(toMinorUnits(1), 100);
  assert.equal(toMinorUnits(0.01), 1);
});

test("fromMinorUnits converts integer paise back to display units", () => {
  assert.equal(fromMinorUnits(49999), 499.99);
  assert.equal(fromMinorUnits(100), 1);
});

test("generatePaymentTransactionId includes a date token for reconciliation", () => {
  const transactionId = generatePaymentTransactionId(new Date("2026-03-22T10:00:00.000Z"), "ab12cd");
  assert.equal(transactionId, "UPI-20260322-AB12CD");
});

test("create payment schema accepts and trims an optional proof reference", () => {
  const payload = createPaymentSchema.parse({
    userId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "22222222-2222-2222-2222-222222222222",
    amount: 1499,
    upiId: "member@okaxis",
    proofReference: "  https://cdn.example.com/payments/proof-1.png  ",
  });

  assert.equal(payload.proofReference, "https://cdn.example.com/payments/proof-1.png");
});
