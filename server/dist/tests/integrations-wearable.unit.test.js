"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const http_error_1 = require("../middleware/http-error");
const service_1 = require("../integrations/service");
const schemas_1 = require("../integrations/schemas");
(0, node_test_1.default)("wearable sync normalizes metrics and computes BMI from weight/height", () => {
    const payload = schemas_1.wearableSyncSchema.parse({
        source: "FITBIT",
        metrics: {
            weightKg: 72,
            heightM: 1.8,
            bodyFatPct: 18,
        },
    });
    const normalized = service_1.__wearableInternals.normalizeMetrics(payload);
    strict_1.default.equal(normalized.weight, 72);
    strict_1.default.equal(normalized.height, 1.8);
    strict_1.default.equal(normalized.bmi, 22.22);
});
(0, node_test_1.default)("wearable sync supports nested payload fallback fields", () => {
    const payload = schemas_1.wearableSyncSchema.parse({
        source: "APPLE_WATCH",
        payload: {
            weight: 80,
            bmi: 24.5,
        },
    });
    const normalized = service_1.__wearableInternals.normalizeMetrics(payload);
    strict_1.default.equal(normalized.weight, 80);
    strict_1.default.equal(normalized.bmi, 24.5);
});
(0, node_test_1.default)("wearable sync rejects future recordedAt", () => {
    const payload = schemas_1.wearableSyncSchema.parse({
        source: "GENERIC",
        recordedAt: new Date(Date.now() + 60_000).toISOString(),
        metrics: { bmi: 23 },
    });
    strict_1.default.throws(() => service_1.__wearableInternals.normalizeMetrics(payload), (error) => error instanceof http_error_1.HttpError && error.code === "INVALID_TIMESTAMP");
});
//# sourceMappingURL=integrations-wearable.unit.test.js.map