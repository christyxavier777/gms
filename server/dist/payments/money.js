"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMinorUnits = toMinorUnits;
exports.fromMinorUnits = fromMinorUnits;
exports.generatePaymentTransactionId = generatePaymentTransactionId;
const node_crypto_1 = require("node:crypto");
function toMinorUnits(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Payment amount must be a positive number");
    }
    return Math.round((amount + Number.EPSILON) * 100);
}
function fromMinorUnits(amountMinor) {
    if (!Number.isFinite(amountMinor)) {
        throw new Error("Payment minor-unit amount must be finite");
    }
    return amountMinor / 100;
}
function generatePaymentTransactionId(timestamp = new Date(), randomPart) {
    const dateToken = timestamp.toISOString().slice(0, 10).replace(/-/g, "");
    const entropy = (randomPart || (0, node_crypto_1.randomBytes)(3).toString("hex")).toUpperCase();
    return `UPI-${dateToken}-${entropy}`;
}
//# sourceMappingURL=money.js.map