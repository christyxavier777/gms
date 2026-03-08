"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const engine_1 = require("../achievements/engine");
(0, node_test_1.default)("generateBadges awards consistency tiers and points", () => {
    const bronze = (0, engine_1.generateBadges)({
        progressCount: 5,
        progressLast30Days: 0,
        latestBmi: null,
        hasActiveSubscription: false,
        successfulPayments: 0,
    });
    const silver = (0, engine_1.generateBadges)({
        progressCount: 15,
        progressLast30Days: 0,
        latestBmi: null,
        hasActiveSubscription: false,
        successfulPayments: 0,
    });
    const gold = (0, engine_1.generateBadges)({
        progressCount: 30,
        progressLast30Days: 0,
        latestBmi: null,
        hasActiveSubscription: false,
        successfulPayments: 0,
    });
    strict_1.default.equal(bronze.badges.find((b) => b.code === "CONSISTENCY")?.tier, "BRONZE");
    strict_1.default.equal(silver.badges.find((b) => b.code === "CONSISTENCY")?.tier, "SILVER");
    strict_1.default.equal(gold.badges.find((b) => b.code === "CONSISTENCY")?.tier, "GOLD");
});
(0, node_test_1.default)("generateBadges awards BMI and momentum badges on thresholds", () => {
    const summary = (0, engine_1.generateBadges)({
        progressCount: 1,
        progressLast30Days: 8,
        latestBmi: 22.1,
        hasActiveSubscription: false,
        successfulPayments: 0,
    });
    strict_1.default.equal(summary.badges.find((b) => b.code === "BMI_BALANCE")?.earned, true);
    strict_1.default.equal(summary.badges.find((b) => b.code === "MOMENTUM")?.earned, true);
});
(0, node_test_1.default)("generateBadges awards commitment for active subscription or payment history", () => {
    const byActiveSubscription = (0, engine_1.generateBadges)({
        progressCount: 0,
        progressLast30Days: 0,
        latestBmi: null,
        hasActiveSubscription: true,
        successfulPayments: 0,
    });
    const byPayments = (0, engine_1.generateBadges)({
        progressCount: 0,
        progressLast30Days: 0,
        latestBmi: null,
        hasActiveSubscription: false,
        successfulPayments: 2,
    });
    strict_1.default.equal(byActiveSubscription.badges.find((b) => b.code === "PLAN_COMMITMENT")?.earned, true);
    strict_1.default.equal(byPayments.badges.find((b) => b.code === "PLAN_COMMITMENT")?.earned, true);
});
//# sourceMappingURL=achievements.unit.test.js.map