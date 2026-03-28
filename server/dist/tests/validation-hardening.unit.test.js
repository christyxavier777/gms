"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const schemas_1 = require("../auth/schemas");
const diet_schemas_1 = require("../plans/diet-schemas");
const workout_schemas_1 = require("../plans/workout-schemas");
const schemas_2 = require("../schedule/schemas");
(0, node_test_1.default)("register schema rejects oversized names and invite codes", () => {
    strict_1.default.throws(() => schemas_1.registerSchema.parse({
        name: "x".repeat(81),
        email: "jordan.lee@example.com",
        phone: "9876543210",
        password: "StrongPass1",
        role: "TRAINER",
        inviteCode: "x".repeat(65),
    }));
});
(0, node_test_1.default)("login schema rejects oversized passwords and unexpected fields", () => {
    strict_1.default.throws(() => schemas_1.loginSchema.parse({
        email: "coach@fitnessgarage.in",
        password: "x".repeat(129),
    }));
    strict_1.default.throws(() => schemas_1.loginSchema.parse({
        email: "coach@fitnessgarage.in",
        password: "StrongPass1",
        unexpected: true,
    }));
});
(0, node_test_1.default)("plan schemas reject oversized titles and descriptions", () => {
    strict_1.default.throws(() => workout_schemas_1.createWorkoutPlanSchema.parse({
        title: "x".repeat(121),
        description: "Core work and mobility",
    }));
    strict_1.default.throws(() => diet_schemas_1.createDietPlanSchema.parse({
        title: "Lean bulk",
        description: "x".repeat(2001),
    }));
});
(0, node_test_1.default)("schedule session schema rejects blank optional text fields and unknown properties", () => {
    strict_1.default.throws(() => schemas_2.createScheduleSessionSchema.parse({
        title: "Morning conditioning",
        description: "   ",
        sessionType: "CLASS",
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        capacity: 12,
    }));
    strict_1.default.throws(() => schemas_2.createScheduleSessionSchema.parse({
        title: "Morning conditioning",
        sessionType: "CLASS",
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        capacity: 12,
        extraField: true,
    }));
});
//# sourceMappingURL=validation-hardening.unit.test.js.map