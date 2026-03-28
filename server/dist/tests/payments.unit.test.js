"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const money_1 = require("../payments/money");
const schemas_1 = require("../payments/schemas");
(0, node_test_1.default)("toMinorUnits converts decimal INR amounts into integer paise", () => {
    strict_1.default.equal((0, money_1.toMinorUnits)(499.99), 49999);
    strict_1.default.equal((0, money_1.toMinorUnits)(1), 100);
    strict_1.default.equal((0, money_1.toMinorUnits)(0.01), 1);
});
(0, node_test_1.default)("fromMinorUnits converts integer paise back to display units", () => {
    strict_1.default.equal((0, money_1.fromMinorUnits)(49999), 499.99);
    strict_1.default.equal((0, money_1.fromMinorUnits)(100), 1);
});
(0, node_test_1.default)("generatePaymentTransactionId includes a date token for reconciliation", () => {
    const transactionId = (0, money_1.generatePaymentTransactionId)(new Date("2026-03-22T10:00:00.000Z"), "ab12cd");
    strict_1.default.equal(transactionId, "UPI-20260322-AB12CD");
});
(0, node_test_1.default)("create payment schema accepts and trims an optional proof reference", () => {
    const payload = schemas_1.createPaymentSchema.parse({
        userId: "11111111-1111-1111-1111-111111111111",
        subscriptionId: "22222222-2222-2222-2222-222222222222",
        amount: 1499,
        upiId: "member@okaxis",
        proofReference: "  https://cdn.example.com/payments/proof-1.png  ",
    });
    strict_1.default.equal(payload.proofReference, "https://cdn.example.com/payments/proof-1.png");
});
//# sourceMappingURL=payments.unit.test.js.map