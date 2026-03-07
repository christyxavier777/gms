"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const schemas_1 = require("../progress/schemas");
(0, node_test_1.default)("progress schema accepts valid payload", () => {
    const payload = schemas_1.createProgressSchema.parse({
        userId: "11111111-1111-1111-1111-111111111111",
        weight: 72,
        height: 1.75,
        recordedAt: new Date().toISOString(),
    });
    strict_1.default.equal(payload.weight, 72);
    strict_1.default.equal(payload.height, 1.75);
});
(0, node_test_1.default)("progress schema rejects non-numeric and negative metrics", () => {
    strict_1.default.throws(() => schemas_1.createProgressSchema.parse({
        userId: "11111111-1111-1111-1111-111111111111",
        weight: -72,
        height: 1.75,
        recordedAt: new Date().toISOString(),
    }));
    strict_1.default.throws(() => schemas_1.createProgressSchema.parse({
        userId: "11111111-1111-1111-1111-111111111111",
        weight: "abc",
        height: 1.75,
        recordedAt: new Date().toISOString(),
    }));
});
//# sourceMappingURL=progress.integration.test.js.map