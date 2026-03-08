"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const client_1 = require("@prisma/client");
const engine_1 = require("../recommendations/engine");
(0, node_test_1.default)("buildRecommendation maps obese BMI to low-impact plan", () => {
    const rec = (0, engine_1.buildRecommendation)({
        latestBmi: 33.4,
        previousBmi: 34.1,
        progressLast30Days: 10,
        hasActiveSubscription: true,
    });
    strict_1.default.equal(rec.bmiCategory, client_1.DietCategory.OBESE);
    strict_1.default.equal(rec.intensity, "BEGINNER");
    strict_1.default.equal(rec.cardioMinutesPerWeek, 210);
    strict_1.default.equal(rec.strengthSessionsPerWeek, 2);
});
(0, node_test_1.default)("buildRecommendation promotes advanced intensity for consistent normal BMI members", () => {
    const rec = (0, engine_1.buildRecommendation)({
        latestBmi: 22.2,
        previousBmi: 22.1,
        progressLast30Days: 8,
        hasActiveSubscription: true,
    });
    strict_1.default.equal(rec.bmiCategory, client_1.DietCategory.NORMAL);
    strict_1.default.equal(rec.intensity, "ADVANCED");
    strict_1.default.equal(rec.nextReviewDays, 14);
});
(0, node_test_1.default)("buildRecommendation adds conservative checks for low consistency and no active plan", () => {
    const rec = (0, engine_1.buildRecommendation)({
        latestBmi: 27.3,
        previousBmi: 27.9,
        progressLast30Days: 2,
        hasActiveSubscription: false,
    });
    strict_1.default.equal(rec.bmiCategory, client_1.DietCategory.OVERWEIGHT);
    strict_1.default.equal(rec.nextReviewDays, 7);
    strict_1.default.ok(rec.reasoning.some((line) => line.includes("No active membership detected")));
    strict_1.default.ok(rec.reasoning.some((line) => line.includes("Low recent tracking consistency")));
});
//# sourceMappingURL=recommendations.unit.test.js.map