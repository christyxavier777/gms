import { randomBytes } from "node:crypto";

export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be a positive number");
  }

  return Math.round((amount + Number.EPSILON) * 100);
}

export function fromMinorUnits(amountMinor: number): number {
  if (!Number.isFinite(amountMinor)) {
    throw new Error("Payment minor-unit amount must be finite");
  }

  return amountMinor / 100;
}

export function generatePaymentTransactionId(timestamp = new Date(), randomPart?: string): string {
  const dateToken = timestamp.toISOString().slice(0, 10).replace(/-/g, "");
  const entropy = (randomPart || randomBytes(3).toString("hex")).toUpperCase();
  return `UPI-${dateToken}-${entropy}`;
}
