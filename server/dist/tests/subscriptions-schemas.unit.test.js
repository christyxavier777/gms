"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const schemas_1 = require("../subscriptions/schemas");
(0, node_test_1.default)("create subscription schema accepts planId and server-derived end dates", () => {
    const payload = schemas_1.createSubscriptionSchema.parse({
        userId: "11111111-1111-1111-1111-111111111111",
        planId: "basic-monthly",
        startDate: "2026-03-24",
    });
    strict_1.default.equal(payload.planId, "basic-monthly");
    strict_1.default.equal(payload.userId, "11111111-1111-1111-1111-111111111111");
    strict_1.default.equal(payload.startDate instanceof Date, true);
    strict_1.default.equal("endDate" in payload, false);
});
(0, node_test_1.default)("create subscription schema rejects legacy free-text planName payloads", () => {
    strict_1.default.throws(() => schemas_1.createSubscriptionSchema.parse({
        userId: "11111111-1111-1111-1111-111111111111",
        planName: "Basic Monthly",
        startDate: "2026-03-24",
    }));
});
(0, node_test_1.default)("onboarding subscription schema requires a non-empty planId", () => {
    strict_1.default.throws(() => schemas_1.createOnboardingSubscriptionSchema.parse({
        planId: "",
    }));
});
//# sourceMappingURL=subscriptions-schemas.unit.test.js.map